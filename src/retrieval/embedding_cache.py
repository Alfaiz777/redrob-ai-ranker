"""Versioned on-disk cache for candidate embeddings."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

import numpy as np

from src.retrieval.candidate_embeddings import DOCUMENT_VERSION
from src.retrieval.embedding_model import MODEL_NAME

CACHE_SCHEMA_VERSION = 1


def source_fingerprint(path: str | Path) -> str:
    """Hash the source JSONL so stale caches are rejected."""
    digest = hashlib.sha256()
    with Path(path).open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def save_embedding_cache(
    directory: str | Path,
    embeddings: np.ndarray,
    candidates: list[dict[str, Any]],
    *,
    source_path: str | Path,
) -> None:
    cache_dir = Path(directory)
    cache_dir.mkdir(parents=True, exist_ok=True)

    matrix = np.ascontiguousarray(embeddings, dtype=np.float32)
    np.save(cache_dir / "candidate_embeddings.npy", matrix)

    metadata = {
        "schema_version": CACHE_SCHEMA_VERSION,
        "model_name": MODEL_NAME,
        "document_version": DOCUMENT_VERSION,
        "source_sha256": source_fingerprint(source_path),
        "count": len(candidates),
        "dimension": int(matrix.shape[1]),
        "candidates": [
            {
                "candidate_id": candidate["candidate_id"],
                "title": candidate.get("title"),
            }
            for candidate in candidates
        ],
    }
    (cache_dir / "candidate_metadata.json").write_text(
        json.dumps(metadata, indent=2), encoding="utf-8"
    )


def load_embedding_cache(
    directory: str | Path,
    *,
    source_path: str | Path | None = None,
    mmap: bool = True,
) -> tuple[np.ndarray, dict[str, Any]]:
    cache_dir = Path(directory)
    metadata = json.loads(
        (cache_dir / "candidate_metadata.json").read_text(encoding="utf-8")
    )

    expected = (CACHE_SCHEMA_VERSION, MODEL_NAME, DOCUMENT_VERSION)
    actual = (
        metadata.get("schema_version"),
        metadata.get("model_name"),
        metadata.get("document_version"),
    )
    if actual != expected:
        raise ValueError("Embedding cache is incompatible; rebuild it")
    if source_path and metadata.get("source_sha256") != source_fingerprint(source_path):
        raise ValueError("Candidate source changed; rebuild the embedding cache")

    mode = "r" if mmap else None
    embeddings = np.load(cache_dir / "candidate_embeddings.npy", mmap_mode=mode)
    if embeddings.shape != (metadata["count"], metadata["dimension"]):
        raise ValueError("Embedding cache shape does not match its metadata")
    return embeddings, metadata
