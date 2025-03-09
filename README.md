# Chatbot with PDF Query & Language Translation

## Overview
This is a chatbot application built with FastAPI (backend) and React (frontend). The chatbot can:
- Read PDFs in English and Nepali.
- Respond in either Nepali or English based on user preference.
- Engage in normal chat conversations.

## Features
- **PDF Query**: Extracts text from PDFs and provides responses.
- **Multilingual Support**: Translates messages to Nepali.
- **FastAPI Backend**: Handles chatbot logic and API requests.
- **React Frontend**: Provides an interactive user interface.
- **FAISS Integration**: Uses FAISS for efficient document vector storage and retrieval.
- **PyMuPDFLoader**: Extracts text from PDFs for better processing.
- **HuggingFace Embeddings**: Utilizes HuggingFace models for text embedding.
- **LangChain Support**: Implements LangChain for better conversational AI capabilities.

## Installation
### Backend Setup
1. Create a virtual environment:
   ```sh
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```
2. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```
3. Navigate to Backend Folder:
   ```sh
   cd backend
   ```
4. Create a `.env ` folder and place your API key form `Gemini`:
   ```sh
   New-Item -ItemType File .env
   ```
   Now Go to [Google AI Studio](https://aistudio.google.com/apikey).
   - Log in with you Gmail Account
   - Click the `Create API key` Button.
   - And Copy the `API` Key:
   - And paste your `API` key on `"your_api_key"`
     
     ```sh
     GEMINI_API_KEY="your_api_key"
     ```
   
4. Run FastAPI server:
   ```sh
   uvicorn main:app --reload
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```sh
   cd frontend
   ```
2. Install dependencies:
   ```sh
   npm install
   npm install tailwindcss @tailwindcss/vite
   ```
3. Start the development server:
   ```sh
   npm run dev
   ```

## API Endpoints
- `POST /query` - Send a message to the chatbot.
- `POST /upload` - Upload a PDF file for query.
- `POST /clear` - Clear all the data stored in memory and delete PDF files.

## Technologies Used
- **Backend**: [FastAPI](https://fastapi.tiangolo.com/), [Deep Translator](https://pypi.org/project/deep-translator/), [PyPDF](https://pypi.org/project/pypdf/), [FAISS](https://faiss.ai/), [PyMuPDFLoader](https://pymupdf.readthedocs.io/en/latest/), HuggingFace Embeddings, [LangChain](https://python.langchain.com/docs/introduction/)
- **Frontend**: [React (Vite)](https://vite.dev/), [Tailwind CSS](https://tailwindcss.com/)

## Contributors
- Nishan Shrestha
