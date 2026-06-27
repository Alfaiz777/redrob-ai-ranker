"""Build and query the candidate retrieval artifacts."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from src.normalize.profiler import extract_candidate_features
from src.retrieval.candidate_embeddings import create_candidate_embeddings
from src.retrieval.embedding_cache import load_embedding_cache, save_embedding_cache
from src.retrieval.faiss_index import (
    build_faiss_index,
    load_faiss_index,
    save_faiss_index,
    search_index,
)
from src.retrieval.jd_embedding import JD_QUERY, create_jd_embedding

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SOURCE = ROOT / "data" / "candidates.jsonl"
DEFAULT_ARTIFACT_DIR = ROOT / "output" / "retrieval"


def load_profiled_candidates(
    source_path: str | Path = DEFAULT_SOURCE,
    *,
    limit: int | None = None,
) -> list[dict[str, Any]]:
    candidates = []
    with Path(source_path).open(encoding="utf-8") as file:
        for line in file:
            if line.strip():
                candidates.append(extract_candidate_features(json.loads(line)))
                if limit is not None and len(candidates) >= limit:
                    break
    return candidates


def build_retrieval_artifacts(
    source_path: str | Path = DEFAULT_SOURCE,
    artifact_dir: str | Path = DEFAULT_ARTIFACT_DIR,
    *,
    batch_size: int = 128,
    limit: int | None = None,
) -> dict[str, Any]:
    """Profile candidates, embed once, cache vectors, and build exact FAISS."""
    candidates = load_profiled_candidates(source_path, limit=limit)
    if not candidates:
        raise ValueError("No candidates found")

    embeddings = create_candidate_embeddings(
        candidates, batch_size=batch_size, show_progress_bar=True
    )
    save_embedding_cache(
        artifact_dir, embeddings, candidates, source_path=source_path
    )
    index = build_faiss_index(embeddings)
    index_path = Path(artifact_dir) / "candidates.faiss"
    save_faiss_index(index, index_path)
    return {
        "count": len(candidates),
        "dimension": int(embeddings.shape[1]),
        "index_path": str(index_path),
    }


def retrieve_candidates(
    query: str = JD_QUERY,
    artifact_dir: str | Path = DEFAULT_ARTIFACT_DIR,
    *,
    top_k: int = 100,
) -> list[dict[str, Any]]:
    """Retrieve candidates and map FAISS row positions back to stable IDs."""
    _, metadata = load_embedding_cache(artifact_dir, mmap=True)
    index = load_faiss_index(Path(artifact_dir) / "candidates.faiss")
    if index.ntotal != metadata["count"]:
        raise ValueError("FAISS index and metadata counts differ; rebuild artifacts")

    scores, positions = search_index(index, create_jd_embedding(query), top_k=top_k)
    rows = metadata["candidates"]
    return [
        {**rows[int(position)], "similarity": round(float(score), 4)}
        for score, position in zip(scores, positions)
        if position >= 0
    ]
