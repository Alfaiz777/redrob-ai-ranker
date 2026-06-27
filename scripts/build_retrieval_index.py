"""CLI for creating the embedding cache and FAISS index."""

from __future__ import annotations

import argparse
import json

from src.retrieval.retrieval_pipeline import build_retrieval_artifacts


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", default="data/candidates.jsonl")
    parser.add_argument("--output", default="output/retrieval")
    parser.add_argument("--batch-size", type=int, default=128)
    parser.add_argument("--limit", type=int)
    args = parser.parse_args()

    result = build_retrieval_artifacts(
        source_path=args.source,
        artifact_dir=args.output,
        batch_size=args.batch_size,
        limit=args.limit,
    )
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
