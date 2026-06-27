"""FAISS cosine-similarity index utilities."""

from __future__ import annotations

from pathlib import Path

import faiss
import numpy as np


def build_faiss_index(embeddings: np.ndarray) -> faiss.IndexFlatIP:
    """Build an exact inner-product index over normalized embeddings."""
    matrix = np.ascontiguousarray(embeddings, dtype=np.float32)
    if matrix.ndim != 2 or matrix.shape[0] == 0:
        raise ValueError("embeddings must be a non-empty 2D matrix")
    index = faiss.IndexFlatIP(matrix.shape[1])
    index.add(matrix)
    return index


def save_faiss_index(index: faiss.Index, path: str | Path) -> None:
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    faiss.write_index(index, str(target))


def load_faiss_index(path: str | Path) -> faiss.Index:
    return faiss.read_index(str(Path(path)))


def search_index(
    index: faiss.Index,
    query_embedding: np.ndarray,
    *,
    top_k: int = 100,
) -> tuple[np.ndarray, np.ndarray]:
    query = np.asarray(query_embedding, dtype=np.float32).reshape(1, -1)
    k = min(max(top_k, 1), index.ntotal)
    scores, positions = index.search(np.ascontiguousarray(query), k)
    return scores[0], positions[0]
