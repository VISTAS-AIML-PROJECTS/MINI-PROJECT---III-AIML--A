
# LEGAL MATE AI
# Retrieval Augmented Generation Service

from pathlib import Path
import json

BASE_DIR = Path(__file__).resolve().parent.parent

KNOWLEDGE_BASE_DIR = BASE_DIR / "knowledge_base"


def load_legal_documents():

    documents = []

    if not KNOWLEDGE_BASE_DIR.exists():
        return documents

    for file_path in KNOWLEDGE_BASE_DIR.rglob("*.json"):

        try:
            with open(file_path, "r", encoding="utf-8") as file:

                data = json.load(file)

                if isinstance(data, list):
                    documents.extend(data)

                elif isinstance(data, dict):
                    documents.append(data)

        except (json.JSONDecodeError, OSError):
            continue

    return documents


def retrieve_documents(query: str, domain: str):

    documents = load_legal_documents()

    if not documents:
        return []

    query_words = set(query.lower().split())

    results = []

    for document in documents:

        content = str(
            document.get("content", "")
        )

        title = str(
            document.get("title", "")
        )

        document_domain = str(
            document.get("domain", "")
        )

        searchable_text = (
            title + " " + content
        ).lower()

        score = sum(
            1 for word in query_words
            if len(word) > 2 and word in searchable_text
        )

        if document_domain.lower() == domain.lower():
            score += 2

        if score > 0:

            results.append({
                "title": title,
                "content": content,
                "source": document.get(
                    "source", file_path_name(document)
                ),
                "score": score
            })

    results.sort(
        key=lambda item: item["score"],
        reverse=True
    )

    return results[:5]


def file_path_name(document):

    return document.get("title", "Unknown source")


def format_context(documents):

    if not documents:
        return "No verified legal documents were retrieved."

    context = []

    for document in documents:

        context.append(
            f"Title: {document['title']}\n"
            f"Content: {document['content']}\n"
            f"Source: {document['source']}"
        )

    return "\n\n".join(context)


# Function used by the main application

def retrieve_legal_context(message: str, domain: str):

    return retrieve_documents(message, domain)
