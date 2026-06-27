"""Manual retrieval quality gate for a small candidate slice.

Run: python -m tests.test_top_similarity
"""

from __future__ import annotations

import argparse

import numpy as np

from src.retrieval.candidate_embeddings import create_candidate_embeddings
from src.retrieval.jd_embedding import create_jd_embedding
from src.retrieval.retrieval_pipeline import load_profiled_candidates


def top_similar_candidates(max_candidates: int = 100, top_k: int = 20):
    candidates = load_profiled_candidates(limit=max_candidates)
    embeddings = create_candidate_embeddings(
        candidates, batch_size=128, show_progress_bar=True
    )
    query = create_jd_embedding()
    similarities = embeddings @ query
    positions = np.argsort(-similarities)[:top_k]
    return [
        {
            "candidate_id": candidates[position]["candidate_id"],
            "title": candidates[position]["title"],
            "similarity": round(float(similarities[position]), 4),
        }
        for position in positions
    ]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--max-candidates", type=int, default=100)
    parser.add_argument("--top-k", type=int, default=20)
    args = parser.parse_args()

    results = top_similar_candidates(args.max_candidates, args.top_k)
    print("\n=== TOP SIMILAR CANDIDATES ===\n")
    for rank, candidate in enumerate(results, start=1):
        print(
            f"{rank}. {candidate['candidate_id']} | {candidate['title']} | "
            f"Similarity={candidate['similarity']}"
        )

    anchor_rank = next(
        (rank for rank, row in enumerate(results, 1) if row["candidate_id"] == "CAND_0000031"),
        None,
    )
    print(f"\nQuality gate: CAND_0000031 rank = {anchor_rank or 'not retrieved'}")
    if args.max_candidates == 100 and anchor_rank != 1:
        raise SystemExit("FAILED: known strong match must rank first in the 100-profile slice")


if __name__ == "__main__":
    main()
