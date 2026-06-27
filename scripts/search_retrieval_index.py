"""CLI for querying the cached FAISS candidate index."""

from __future__ import annotations

import argparse

from src.retrieval.jd_embedding import JD_QUERY
from src.retrieval.retrieval_pipeline import retrieve_candidates


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--index", default="output/retrieval")
    parser.add_argument("--top-k", type=int, default=100)
    parser.add_argument("--query", default=JD_QUERY)
    args = parser.parse_args()

    results = retrieve_candidates(args.query, args.index, top_k=args.top_k)
    for rank, candidate in enumerate(results, start=1):
        print(
            f"{rank}. {candidate['candidate_id']} | {candidate['title']} | "
            f"Similarity={candidate['similarity']}"
        )


if __name__ == "__main__":
    main()
