# backend/scripts/filter_personas.py

import os
import json
from dotenv import load_dotenv
from pathlib import Path

from langchain_community.document_loaders import JSONLoader
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

print("Starting persona filtering process...")

# --- 1. SETUP (Robust Paths) ---
SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent

DATA_PATH = BACKEND_DIR / "data/persona_data.jsonl"
OUTPUT_PATH = BACKEND_DIR / "data/personas.json"
CHROMA_DB_PATH = BACKEND_DIR / "chroma_db"

load_dotenv(BACKEND_DIR / ".env")


# --- 2. LOAD & PREPARE DATA ---
print(f"Loading data from {DATA_PATH}...")
loader = JSONLoader(
    file_path=DATA_PATH,
    jq_schema='.',
    text_content=False,
    json_lines=True
)
documents = loader.load()

print("Extracting and parsing persona descriptions...")
clean_persona_texts = []
# Loop through the first 1,00,000 documents to extract clean text
for doc in documents[:100000]:
    try:
        # The page_content is a JSON string, so we must parse it first
        data = json.loads(doc.page_content)
        # We only want the text value from the 'persona' key
        if 'persona' in data and data['persona']:
             clean_persona_texts.append(data['persona'])
    except (json.JSONDecodeError, KeyError):
        # If a line is malformed, just skip it and continue
        continue
print(f"Successfully extracted {len(clean_persona_texts)} clean personas.")


# --- 3. CREATE VECTOR STORE ---
print("Initializing embedding model and vector store...")
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

vectorstore = Chroma(
    collection_name="persona_collection",
    embedding_function=embeddings,
    persist_directory=str(CHROMA_DB_PATH)
)

# Add the clean persona texts to the vector store in batches
batch_size = 4000
print(f"Adding {len(clean_persona_texts)} personas to the vector store in batches of {batch_size}...")

for i in range(0, len(clean_persona_texts), batch_size):
    batch = clean_persona_texts[i:i + batch_size]
    vectorstore.add_texts(texts=batch)
    print(f"  ... added batch {i//batch_size + 1} of {len(clean_persona_texts)//batch_size + 1}")

print("Vector store created and populated successfully.")


# --- 4. SEARCH FOR RELEVANT PERSONAS ---
print("Searching for therapy-related personas...")
search_queries = [
    "a person dealing with anxiety, stress, or depression",
    "someone struggling with grief, loss, or a major life change",
    "an individual facing relationship problems or family conflict",
    "a person with self-esteem issues or seeking personal growth",
    "someone in need of therapy or emotional support"
]

results = []
for query in search_queries:
    print(f"Running query: '{query}'")
    # The retrieved documents will now have clean text in their page_content
    retrieved_docs = vectorstore.similarity_search(query, k=10)
    results.extend([doc.page_content for doc in retrieved_docs])

unique_results = list(set(results))
print(f"Found {len(unique_results)} unique, relevant personas.")


# --- 5. SAVE THE CURATED LIST ---
final_personas = [{"id": i, "persona": text} for i, text in enumerate(unique_results)]

with open(OUTPUT_PATH, 'w') as f:
    json.dump(final_personas, f, indent=4)

print(f"Curated personas saved successfully to {OUTPUT_PATH}!")