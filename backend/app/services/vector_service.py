import logging
import uuid
from typing import Any, Dict, List, Optional
import google.generativeai as genai
from app.core.config import settings

logger = logging.getLogger(__name__)

# Cache Pinecone index instance to avoid re-initializing on every request
_pinecone_client = None
_pinecone_index = None


def get_pinecone_index():
    """
    Get or initialize the Pinecone index client.
    Returns None if Pinecone is not configured or fails to initialize.
    """
    global _pinecone_client, _pinecone_index
    if _pinecone_index is not None:
        return _pinecone_index

    api_key = settings.PINECONE_API_KEY
    if not api_key or "your-pinecone-api-key" in api_key.lower():
        logger.warning("PINECONE_API_KEY is not configured. Pinecone operations will be skipped/mocked.")
        return None

    try:
        from pinecone import Pinecone
        if _pinecone_client is None:
            _pinecone_client = Pinecone(api_key=api_key)
        
        index_name = settings.PINECONE_INDEX_NAME
        _pinecone_index = _pinecone_client.Index(index_name)
        return _pinecone_index
    except Exception as exc:
        logger.error(f"Failed to initialize Pinecone index '{settings.PINECONE_INDEX_NAME}': {exc}")
        return None


def get_embedding(text: str) -> List[float]:
    """
    Generate a 768-dimensional embedding vector using Google Gemini Embedding.
    Model is configured via settings.GEMINI_EMBEDDING_MODEL (default: models/embedding-001).
    Falls back gracefully if Gemini API key is missing or call fails.
    """
    clean_text = text.strip() if text else ""
    if not clean_text:
        return [0.0] * 768

    api_key = settings.GEMINI_API_KEY
    if not api_key or "your-gemini-api-key" in api_key.lower():
        logger.debug("GEMINI_API_KEY is not configured for embeddings. Returning synthetic normalized vector.")
        return _generate_deterministic_vector(clean_text, 768)

    try:
        genai.configure(api_key=api_key)
        # Try primary embedding model, then fallback to text-embedding-004 if needed
        models_to_try = [settings.GEMINI_EMBEDDING_MODEL, "models/text-embedding-004", "models/embedding-001"]
        last_error = None

        for model_name in models_to_try:
            try:
                result = genai.embed_content(
                    model=model_name,
                    content=clean_text,
                    task_type="retrieval_document"
                )
                embedding = result.get("embedding", [])
                if embedding:
                    return embedding
            except Exception as e:
                last_error = e
                logger.debug(f"Embedding model '{model_name}' failed: {e}. Trying next...")

        logger.warning(f"All Gemini embedding models failed ({last_error}). Falling back to synthetic vector.")
        return _generate_deterministic_vector(clean_text, 768)

    except Exception as exc:
        logger.error(f"Error generating embedding with Gemini: {exc}")
        return _generate_deterministic_vector(clean_text, 768)


async def upsert_knowledge(
    domain_id: uuid.UUID,
    record_id: uuid.UUID,
    text: str,
    metadata: Optional[Dict[str, Any]] = None,
) -> bool:
    """
    Vectorize knowledge text and upsert to Pinecone under namespace=str(domain_id).
    """
    index = get_pinecone_index()
    if not index:
        logger.debug("Pinecone not configured; upsert skipped.")
        return False

    try:
        vector = get_embedding(text)
        meta = metadata or {}
        meta["text"] = text[:1000]  # Store snippet in metadata
        meta["record_id"] = str(record_id)
        meta["domain_id"] = str(domain_id)

        index.upsert(
            vectors=[
                {
                    "id": str(record_id),
                    "values": vector,
                    "metadata": meta,
                }
            ],
            namespace=str(domain_id),
        )
        logger.info(f"Successfully upserted vector {record_id} to Pinecone namespace {domain_id}")
        return True
    except Exception as exc:
        logger.error(f"Failed to upsert knowledge {record_id} to Pinecone: {exc}")
        return False


async def delete_knowledge(domain_id: uuid.UUID, record_id: uuid.UUID) -> bool:
    """
    Delete knowledge vector from Pinecone namespace=str(domain_id).
    """
    index = get_pinecone_index()
    if not index:
        return False

    try:
        index.delete(ids=[str(record_id)], namespace=str(domain_id))
        logger.info(f"Successfully deleted vector {record_id} from Pinecone namespace {domain_id}")
        return True
    except Exception as exc:
        logger.error(f"Failed to delete knowledge {record_id} from Pinecone: {exc}")
        return False


async def query_knowledge(
    domain_id: uuid.UUID,
    query: str,
    top_k: int = 3,
) -> List[Dict[str, Any]]:
    """
    Query Pinecone for top_k relevant knowledge snippets in namespace=str(domain_id).
    Returns a list of matching records with 'id', 'score', 'text', and 'metadata'.
    """
    if not query or not query.strip():
        return []

    index = get_pinecone_index()
    if not index:
        return []

    try:
        vector = get_embedding(query)
        result = index.query(
            vector=vector,
            top_k=top_k,
            include_metadata=True,
            namespace=str(domain_id),
        )

        matches = []
        for match in result.get("matches", []):
            match_meta = match.get("metadata") or {}
            matches.append({
                "id": match.get("id"),
                "score": float(match.get("score", 0.0)),
                "text": match_meta.get("text", ""),
                "metadata": match_meta,
            })
        return matches
    except Exception as exc:
        logger.warning(f"Pinecone query failed for domain {domain_id}: {exc}")
        return []


def _generate_deterministic_vector(text: str, dim: int = 768) -> List[float]:
    """
    Generate a deterministic normalized pseudo-vector for fallback/offline testing.
    """
    import hashlib
    import math

    seed_bytes = hashlib.sha256(text.encode("utf-8")).digest()
    raw = []
    for i in range(dim):
        b = seed_bytes[i % len(seed_bytes)]
        raw.append((b / 128.0) - 1.0)

    # Normalize vector to unit length
    magnitude = math.sqrt(sum(x * x for x in raw)) or 1.0
    return [round(x / magnitude, 6) for x in raw]
