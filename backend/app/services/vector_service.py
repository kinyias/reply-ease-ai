import logging
import uuid
from typing import Any, Dict, List, Optional
import google.generativeai as genai
from app.core.config import settings

logger = logging.getLogger(__name__)

# Cache Pinecone index instance to avoid re-initializing on every request
_pinecone_client = None
_pinecone_index = None
_index_info = None  # Cache: {"is_document_schema": bool, "vector_field": str, "dimension": int}


def _inspect_index_schema(client, index_name: str) -> None:
    """
    Inspect the index schema to determine if it uses the Document Schema (2026/preview)
    or the classic Vector API, as well as the dense vector field name and dimension.
    """
    global _index_info
    try:
        desc = client.describe_index(index_name)
        schema = getattr(desc, "schema", None)
        fields = getattr(schema, "fields", {}) if schema else {}

        is_doc_schema = bool(schema and fields)
        vec_field = "embedding"
        dim = getattr(desc, "dimension", 768) or 768

        if is_doc_schema:
            for fname, fconf in fields.items():
                ftype = getattr(fconf, "type", None) or (fconf.get("type") if isinstance(fconf, dict) else None)
                if ftype == "dense_vector":
                    vec_field = fname
                    f_dim = getattr(fconf, "dimension", None) or (fconf.get("dimension") if isinstance(fconf, dict) else None)
                    if f_dim:
                        dim = f_dim
                    break

        _index_info = {
            "is_document_schema": is_doc_schema,
            "vector_field": vec_field,
            "dimension": dim,
        }
        logger.info(
            f"Pinecone index '{index_name}' inspected: document_schema={is_doc_schema}, "
            f"vector_field='{vec_field}', dimension={dim}"
        )
    except Exception as exc:
        logger.warning(
            f"Could not inspect Pinecone index schema: {exc}. Defaulting to document_schema=True, dimension=768."
        )
        _index_info = {
            "is_document_schema": True,
            "vector_field": "embedding",
            "dimension": 768,
        }


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
        _inspect_index_schema(_pinecone_client, index_name)
        return _pinecone_index
    except Exception as exc:
        logger.error(f"Failed to initialize Pinecone index '{settings.PINECONE_INDEX_NAME}': {exc}")
        return None


def get_embedding(text: str, dim: Optional[int] = None) -> List[float]:
    """
    Generate an embedding vector using Google Gemini Embedding.
    Model is configured via settings.GEMINI_EMBEDDING_MODEL (default: gemini-embedding-001).
    Defaults to index dimension (768 for gemini-embedding-001).
    Falls back gracefully if Gemini API key is missing or call fails.
    """
    global _index_info
    target_dim = dim or (_index_info["dimension"] if _index_info else 768)

    clean_text = text.strip() if text else ""
    if not clean_text:
        return [0.0] * target_dim

    api_key = settings.GEMINI_API_KEY
    if not api_key or "your-gemini-api-key" in api_key.lower():
        logger.debug("GEMINI_API_KEY is not configured for embeddings. Returning synthetic normalized vector.")
        return _generate_deterministic_vector(clean_text, target_dim)

    try:
        genai.configure(api_key=api_key)
        # Try primary embedding model, then fallbacks
        models_to_try = [
            settings.GEMINI_EMBEDDING_MODEL,
            "models/gemini-embedding-001",
            "gemini-embedding-001",
            "models/text-embedding-004",
            "models/embedding-001",
        ]
        unique_models = list(dict.fromkeys(models_to_try))
        last_error = None

        for model_name in unique_models:
            if not model_name:
                continue
            m_id = model_name if model_name.startswith("models/") else f"models/{model_name}"
            try:
                result = genai.embed_content(
                    model=m_id,
                    content=clean_text,
                    task_type="retrieval_document",
                    output_dimensionality=target_dim,
                )
                embedding = result.get("embedding", [])
                if embedding:
                    if len(embedding) == target_dim:
                        return embedding
                    elif len(embedding) > target_dim:
                        return embedding[:target_dim]
                    else:
                        return embedding + [0.0] * (target_dim - len(embedding))
            except Exception:
                try:
                    result = genai.embed_content(
                        model=m_id,
                        content=clean_text,
                        task_type="retrieval_document",
                    )
                    embedding = result.get("embedding", [])
                    if embedding:
                        if len(embedding) == target_dim:
                            return embedding
                        elif len(embedding) > target_dim:
                            return embedding[:target_dim]
                        else:
                            return embedding + [0.0] * (target_dim - len(embedding))
                except Exception as inner_e:
                    last_error = inner_e
                    logger.debug(f"Embedding model '{m_id}' failed: {inner_e}. Trying next...")

        logger.warning(f"All Gemini embedding models failed ({last_error}). Falling back to synthetic vector.")
        return _generate_deterministic_vector(clean_text, target_dim)

    except Exception as exc:
        logger.error(f"Error generating embedding with Gemini: {exc}")
        return _generate_deterministic_vector(clean_text, target_dim)


async def upsert_knowledge(
    domain_id: uuid.UUID,
    record_id: uuid.UUID,
    text: str,
    metadata: Optional[Dict[str, Any]] = None,
) -> bool:
    """
    Vectorize knowledge text and upsert to Pinecone under namespace=str(domain_id).
    Supports both Document Schema indexes (via documents.upsert) and classic Vector indexes (via upsert).
    """
    index = get_pinecone_index()
    if not index:
        logger.debug("Pinecone not configured; upsert skipped.")
        return False

    try:
        dim = _index_info.get("dimension", 768) if _index_info else 768
        vector = get_embedding(text, dim=dim)
        is_doc_schema = _index_info.get("is_document_schema", False) if _index_info else False
        vec_field = _index_info.get("vector_field", "embedding") if _index_info else "embedding"

        if is_doc_schema:
            doc: Dict[str, Any] = {
                "_id": str(record_id),
                vec_field: vector,
                "text": text[:2000],
                "record_id": str(record_id),
                "domain_id": str(domain_id),
            }
            if metadata:
                for k, v in metadata.items():
                    if not k.startswith("_") and not k.startswith("$"):
                        if isinstance(v, (str, int, float, bool)):
                            doc[k] = v
                        elif isinstance(v, list) and all(isinstance(x, str) for x in v):
                            doc[k] = v
                        else:
                            doc[k] = str(v)

            index.documents.upsert(
                namespace=str(domain_id),
                documents=[doc],
            )
        else:
            meta = metadata.copy() if metadata else {}
            meta["text"] = text[:1000]
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
    Supports both Document Schema indexes (via documents.delete) and classic Vector indexes (via delete).
    """
    index = get_pinecone_index()
    if not index:
        return False

    try:
        is_doc_schema = _index_info.get("is_document_schema", False) if _index_info else False

        if is_doc_schema:
            index.documents.delete(namespace=str(domain_id), ids=[str(record_id)])
        else:
            index.delete(ids=[str(record_id)], namespace=str(domain_id))

        logger.info(f"Successfully deleted vector {record_id} from Pinecone namespace {domain_id}")
        return True
    except Exception as exc:
        logger.error(f"Failed to delete knowledge {record_id} from Pinecone: {exc}")
        return False


async def delete_namespace(domain_id: uuid.UUID) -> bool:
    """
    Delete all vectors in the namespace corresponding to domain_id.
    """
    index = get_pinecone_index()
    if not index:
        return False

    try:
        is_doc_schema = _index_info.get("is_document_schema", False) if _index_info else False

        if is_doc_schema:
            index.documents.delete(namespace=str(domain_id), delete_all=True)
        else:
            index.delete(delete_all=True, namespace=str(domain_id))

        logger.info(f"Successfully deleted Pinecone namespace {domain_id}")
        return True
    except Exception as exc:
        logger.error(f"Failed to delete Pinecone namespace {domain_id}: {exc}")
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
        dim = _index_info.get("dimension", 768) if _index_info else 768
        vector = get_embedding(query, dim=dim)
        is_doc_schema = _index_info.get("is_document_schema", False) if _index_info else False
        vec_field = _index_info.get("vector_field", "embedding") if _index_info else "embedding"

        matches: List[Dict[str, Any]] = []

        if is_doc_schema:
            result = index.documents.search(
                namespace=str(domain_id),
                score_by=[{
                    "type": "dense_vector",
                    "field": vec_field,
                    "values": vector,
                }],
                top_k=top_k,
                include_fields=[
                    "text", "record_id", "domain_id", "type",
                    "question", "answer", "name", "price", "image"
                ],
            )

            for doc in getattr(result, "matches", []):
                doc_dict = doc.to_dict() if hasattr(doc, "to_dict") else {}
                doc_id = getattr(doc, "id", None) or doc_dict.get("_id") or str(doc_dict.get("record_id", ""))
                score = getattr(doc, "score", 0.0) or doc_dict.get("_score", 0.0)
                text = doc.get("text") if hasattr(doc, "get") else doc_dict.get("text", "")

                meta = {k: v for k, v in doc_dict.items() if k not in ("_id", "_score", vec_field)}
                matches.append({
                    "id": doc_id,
                    "score": float(score),
                    "text": text or "",
                    "metadata": meta,
                })
        else:
            result = index.query(
                vector=vector,
                top_k=top_k,
                include_metadata=True,
                namespace=str(domain_id),
            )

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

