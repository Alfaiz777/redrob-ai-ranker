"""Sentence-transformer loading and batched encoding helpers."""

from __future__ import annotations

from collections.abc import Sequence
from typing import TYPE_CHECKING, Any

import numpy as np

if TYPE_CHECKING:
    from sentence_transformers import SentenceTransformer

MODEL_NAME = "BAAI/bge-small-en-v1.5"
QUERY_INSTRUCTION = "Represent this sentence for searching relevant passages: "

_embedding_model: Any | None = None


def get_embedding_model() -> Any:
    global _embedding_model
    if _embedding_model is None:
        from sentence_transformers import SentenceTransformer

        _embedding_model = SentenceTransformer(MODEL_NAME)
    return _embedding_model


def encode_documents(
    documents: Sequence[str],
    *,
    batch_size: int = 128,
    show_progress_bar: bool = False,
) -> np.ndarray:
    """Encode candidate documents as normalized float32 vectors."""
    vectors = get_embedding_model().encode(
        list(documents),
        batch_size=batch_size,
        normalize_embeddings=True,
        show_progress_bar=show_progress_bar,
        convert_to_numpy=True,
    )
    return np.asarray(vectors, dtype=np.float32)


def encode_query(query: str) -> np.ndarray:
    """Encode one BGE retrieval query with the model's query instruction."""
    vector = get_embedding_model().encode(
        QUERY_INSTRUCTION + query.strip(),
        normalize_embeddings=True,
        convert_to_numpy=True,
    )
    return np.asarray(vector, dtype=np.float32)
