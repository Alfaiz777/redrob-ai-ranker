"""
Single entry point to reproduce the submission CSV.

Usage:
    python run.py --input data/candidates.jsonl --out team_AlfaizKureshi.csv

What it does:
  1. Runs the multi-signal scoring engine across all candidates (parallel, CPU-only)
  2. Saves ranked JSON to output/top_100.json
  3. Generates the final submission CSV with normalized scores and per-candidate reasoning

Runtime: ~25 seconds on an 8-core CPU machine, 16 GB RAM.
No GPU required. No network calls during ranking.
"""

import argparse
import os
import sys
import time


def main():
    parser = argparse.ArgumentParser(
        description="Reproduce submission CSV from candidates file."
    )
    parser.add_argument(
        "--input",
        default="data/candidates.jsonl",
        help="Path to candidates JSONL file (default: data/candidates.jsonl)"
    )
    parser.add_argument(
        "--out",
        default="team_AlfaizKureshi.csv",
        help="Output CSV path (default: team_AlfaizKureshi.csv)"
    )
    parser.add_argument(
        "--top",
        type=int,
        default=100,
        help="Number of top candidates to rank (default: 100)"
    )
    parser.add_argument(
        "--json-out",
        default="output/top_100.json",
        help="Path to save raw ranked JSON (default: output/top_100.json)"
    )
    args = parser.parse_args()

    if not os.path.exists(args.input):
        print(f"Error: candidates file not found at '{args.input}'")
        print("Place the candidates.jsonl file at data/candidates.jsonl and retry.")
        sys.exit(1)

    total_start = time.time()

    # -------------------------------------------------------------------------
    # Step 1: Run multi-signal ranking engine (parallel, CPU-only)
    # -------------------------------------------------------------------------
    print(f"\nStep 1/2  Ranking {args.top} candidates from {args.input} ...")

    from src.rank import rank_candidates_parallel, save_results

    rank_start = time.time()
    results = rank_candidates_parallel(
        input_file=args.input,
        top_n=args.top
    )
    rank_time = round(time.time() - rank_start, 1)
    print(f"          Ranking complete in {rank_time}s.")

    # Save JSON (used by the dashboard and by the CSV generator)
    os.makedirs(os.path.dirname(args.json_out), exist_ok=True)
    save_results(results, args.json_out)
    print(f"          Ranked JSON saved to {args.json_out}")

    # -------------------------------------------------------------------------
    # Step 2: Generate submission CSV
    # -------------------------------------------------------------------------
    print(f"\nStep 2/2  Generating submission CSV -> {args.out} ...")

    from scripts.generate_submission import generate_csv

    generate_csv(args.json_out, args.out)

    total_time = round(time.time() - total_start, 1)
    print(f"\nDone in {total_time}s total.")
    print(f"Submission CSV: {args.out}")


if __name__ == "__main__":
    main()
