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
- **Backend**: FastAPI, Deep Translator, PyPDF, FAISS, PyMuPDFLoader, HuggingFace Embeddings, LangChain
- **Frontend**: React, Tailwind CSS

## Contributors
- Nishan Shrestha
