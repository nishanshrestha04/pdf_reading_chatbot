import os
import re
import time
import shutil
import unicodedata
from typing import List
from dotenv import load_dotenv
from pydantic import BaseModel
import google.generativeai as genai
from deep_translator import GoogleTranslator
from fastapi.middleware.cors import CORSMiddleware
from langchain_community.vectorstores import FAISS
from langchain.text_splitter import CharacterTextSplitter
from fastapi import FastAPI, File, UploadFile, HTTPException
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_community.embeddings import HuggingFaceEmbeddings


# Initialize FastAPI
app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Configure the Google Generative AI API
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

# Translator setup
eng_to_nep = GoogleTranslator(source="en", target="ne")
nep_to_eng = GoogleTranslator(source="ne", target="en")

# Update generation config with higher token limit
generation_config = {
    "temperature": 0.7,
    "top_p": 0.95,
    "top_k": 64,
    "max_output_tokens": 2048,
    "response_mime_type": "text/plain",
}

model = genai.GenerativeModel(
    model_name="gemini-pro",
    generation_config=generation_config,
)

# Store embeddings globally
vector_store = None
retriever = None

class QueryRequest(BaseModel):
    query: str
    language: str

def clean_text(text: str) -> str:
    # Convert various Unicode formats to consistent form
    text = unicodedata.normalize('NFKC', text)

    # Remove control characters while preserving newlines
    text = ''.join(char for char in text if unicodedata.category(char)[0] != 'C' or char in '\n\t')

    # Fix common Nepali text issues
    text = text.replace('––', '-')
    text = re.sub(r'\s+', ' ', text)

    # Remove any remaining non-printable characters
    text = ''.join(char for char in text if char.isprintable() or char in '\n\t')

    return text.strip()

def process_pdf(file_path: str) -> str:
    try:
        loader = PyMuPDFLoader(file_path)
        pages = loader.load()

        # Clean each page's content
        cleaned_pages = [clean_text(page.page_content) for page in pages]

        # Join pages with proper spacing
        return "\n\n".join(cleaned_pages)
    except Exception as e:
        raise Exception(f"Error processing PDF: {str(e)}")

def initialize_vector_store(texts: List[str]):
    """Initialize the vector store with document chunks."""
    global vector_store

    # Clean and normalize all texts before splitting
    cleaned_texts = [clean_text(text) for text in texts]

    text_splitter = CharacterTextSplitter(
        chunk_size=3000,  # Increased for better section context
        chunk_overlap=500,  # Increased overlap to maintain continuity
        separator="\n\n"   # Split on double newlines to preserve section boundaries
    )
    chunks = text_splitter.split_text("\n\n".join(cleaned_texts))

    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-mpnet-base-v2"
    )
    vector_store = FAISS.from_texts(chunks, embeddings)

def clear_stored_data():
    """Clear all stored data and uploaded files."""
    global vector_store
    try:
        # Clear vector store first
        vector_store = None

        # Clear uploaded files with retry mechanism
        if os.path.exists(UPLOAD_DIR):
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    # Delete files individually instead of removing directory
                    for filename in os.listdir(UPLOAD_DIR):
                        file_path = os.path.join(UPLOAD_DIR, filename)
                        try:
                            if os.path.isfile(file_path):
                                os.unlink(file_path)
                            elif os.path.isdir(file_path):
                                shutil.rmtree(file_path)
                        except Exception as e:
                            print(f"Failed to delete {file_path}: {str(e)}")
                    break
                except Exception as e:
                    if attempt == max_retries - 1:  # Last attempt
                        raise Exception(f"Failed to clear files after {max_retries} attempts: {str(e)}")
                    else:
                        time.sleep(0.5)  # Wait before retry
                        continue

        # Ensure uploads directory exists
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        return True

    except Exception as e:
        return False

@app.post("/clear/")
async def clear_data():
    """Endpoint to clear all stored data."""
    success = clear_stored_data()
    if success:
        return {"message": "All data cleared successfully"}
    raise HTTPException(status_code=500, detail="Failed to clear data")

@app.post("/upload/")
async def upload_files(files: List[UploadFile] = File(...)):
    try:
        # Clear previous data before new upload
        clear_stored_data()

        all_texts = []
        file_paths = []

        for file in files:
            if not file.filename.endswith('.pdf'):
                raise HTTPException(status_code=400, detail="Only PDF files are allowed")

            file_path = os.path.join(UPLOAD_DIR, file.filename)
            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)

            file_paths.append(file_path)
            text = process_pdf(file_path)
            all_texts.append(text)

        # Initialize vector store with all documents
        initialize_vector_store(all_texts)

        return {"message": f"Successfully processed {len(files)} files"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query/")
async def handle_query(request: QueryRequest):
    try:
        query = request.query

        # Translate query to English if it's in Nepali
        if request.language == "ne":
            query = nep_to_eng.translate(query)

        # If no documents are uploaded, have a normal conversation
        if not vector_store:
            # Simple prompt for general conversation
            prompt = f"""Please respond to the following question or statement in a helpful and informative way:

Question: {query}"""

            response = model.generate_content(prompt)
            answer = response.text

        else:
            # Existing document-based conversation logic
            docs = vector_store.similarity_search(query, k=7)
            context_parts = []
            for doc in docs:
                section_text = doc.page_content.strip()
                if section_text:
                    context_parts.append(section_text)

            context = "\n\n".join(context_parts)

            prompt = f"""Based on the following content from the documents, please provide a detailed and relevant answer:

Content:
{context}

Question: {query}

Please provide a clear and comprehensive response based on the available information."""

            response = model.generate_content(prompt)
            answer = response.text

        # Handle translation
        if request.language == "ne":
            max_translation_length = 4000
            if len(answer) > max_translation_length:
                # Translate in chunks while preserving sentence boundaries
                sentences = answer.split('. ')
                translated_parts = []
                current_chunk = []
                current_length = 0

                for sentence in sentences:
                    if current_length + len(sentence) > max_translation_length:
                        # Translate accumulated chunk
                        chunk_text = '. '.join(current_chunk)
                        translated_parts.append(eng_to_nep.translate(chunk_text))
                        current_chunk = [sentence]
                        current_length = len(sentence)
                    else:
                        current_chunk.append(sentence)
                        current_length += len(sentence)

                # Translate remaining chunk
                if current_chunk:
                    chunk_text = '. '.join(current_chunk)
                    translated_parts.append(eng_to_nep.translate(chunk_text))

                answer = ' '.join(translated_parts)
            else:
                answer = eng_to_nep.translate(answer)

        return {
            "response": answer,
            "complete": not answer.endswith("Note: The response may be incomplete."),
            "mode": "general" if not vector_store else "document"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
