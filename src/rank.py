import json
import os
import argparse
import time
from pathlib import Path
from multiprocessing import Pool, cpu_count

from src.normalize.profiler import (
    extract_candidate_features
)

from src.scoring.orchestrator import (
    score_candidate
)

from src.scoring.disqualifier import (
    is_disqualified
)


# ==========================
# Load Candidates
# ==========================

def load_candidates(file_path):
    """
    Loads candidates from either a .jsonl file (one JSON per line)
    or a .json file containing a JSON array.

    Uses yield so we never hold the full 100K dataset in memory
    when reading .jsonl format.
    """

    path = str(file_path)

    if path.endswith(".json"):
        with open(file_path, "r", encoding="utf-8") as file:
            data = json.load(file)
            for candidate in data:
                yield candidate
        return

    with open(
        file_path,
        "r",
        encoding="utf-8"
    ) as file:

        for line in file:

            if line.strip():

                yield json.loads(line)


# ==========================
# Ranking Pipeline — Full
# ==========================

def rank_candidates(
    input_file="data/candidates.jsonl",
    top_n=100
):
    """
    Scores every candidate in the file.

    Raw Candidate
        ↓
    Profile Candidate
        ↓
    Score Candidate
        ↓
    Sort → Top N
    """

    ranked_candidates = []
    disqualified_count = 0

    for raw_candidate in load_candidates(
        input_file
    ):

        profiled_candidate = (
            extract_candidate_features(
                raw_candidate
            )
        )

        # Cheap check before expensive scoring
        disqualified, _ = is_disqualified(profiled_candidate)
        if disqualified:
            disqualified_count += 1
            continue

        scored_candidate = (
            score_candidate(
                profiled_candidate
            )
        )

        ranked_candidates.append(
            scored_candidate
        )

    if disqualified_count:
        print(f"Pre-filter removed {disqualified_count} non-technical candidates.")

    ranked_candidates.sort(
        key=lambda candidate: (
            -candidate["final_score"],
            candidate["candidate_id"]
        )
    )

    return ranked_candidates[:top_n]


# ==========================
# Ranking Pipeline — Parallel (helpers)
# ==========================

def _get_chunk_offsets(filepath, num_chunks):
    """
    Split a JSONL file into num_chunks byte ranges, each aligned to a line
    boundary so no JSON record is ever split across two workers.
    Returns a list of (num_chunks + 1) byte offsets: [0, ..., file_size].
    """
    file_size = os.path.getsize(filepath)
    approx_chunk = file_size // num_chunks
    offsets = [0]
    with open(filepath, "rb") as f:
        for i in range(1, num_chunks):
            f.seek(approx_chunk * i)
            f.readline()          # advance past the partial line
            offsets.append(f.tell())
    offsets.append(file_size)
    return offsets


def _worker_score_file_slice(args):
    """
    Worker reads its own byte slice of the JSONL file, profiles, disqualifies,
    and scores every candidate it finds.  Only scored results (avg 0.6 KB each)
    are returned over the IPC pipe — the 5.1 KB profiled candidates never cross
    the pipe boundary, eliminating the 297 MB IPC bottleneck.
    """
    input_file, start_byte, end_byte = args
    results = []
    disqualified = 0

    with open(input_file, "rb") as f:
        f.seek(start_byte)
        while f.tell() < end_byte:
            line = f.readline()
            if not line:
                break
            line = line.strip()
            if not line:
                continue
            try:
                raw = json.loads(line)
                profiled = extract_candidate_features(raw)
                disq, _ = is_disqualified(profiled)
                if disq:
                    disqualified += 1
                else:
                    results.append(score_candidate(profiled))
            except Exception:
                continue

    return results, disqualified


# ==========================
# Ranking Pipeline — Parallel
# ==========================

def rank_candidates_parallel(
    input_file="data/candidates.jsonl",
    top_n=100
):
    """
    File-slice parallel pipeline — eliminates the IPC bottleneck.

    Root-cause of the 144-second runtime:
      The original two-phase design sent 297 MB of profiled candidates
      TO workers over Windows named pipes at ~5 MB/s → ~60 s of IPC stall
      before any result came back.  Results (38 MB) returning from workers
      were fast by comparison.

    New design:
      Workers receive only (filename, start_byte, end_byte) — tiny IPC.
      Each worker opens the JSONL file and reads its own ~58 MB slice from disk
      (the OS page cache is shared, so reads after the first are nearly free).
      Workers profile, disqualify, and score locally, then return only the
      compact scored results (~4.75 MB per worker, 38 MB total).

    IPC payload: 8 × (str + 2 ints) in, 38 MB out.  ~280 MB eliminated.
    Expected runtime: ~25 s.
    """
    workers = min(cpu_count(), 8)
    offsets = _get_chunk_offsets(input_file, workers)

    print(f"Scoring candidates across {workers} workers (file-slice mode)...")

    slice_args = [
        (input_file, offsets[i], offsets[i + 1])
        for i in range(workers)
    ]

    with Pool(workers) as pool:
        chunk_results = pool.map(_worker_score_file_slice, slice_args, chunksize=1)

    all_results = []
    total_disqualified = 0
    for scored_list, disq_count in chunk_results:
        all_results.extend(scored_list)
        total_disqualified += disq_count

    if total_disqualified:
        print(f"Pre-filter removed {total_disqualified} non-technical candidates.")
    print(f"Scored {len(all_results)} candidates total.")

    all_results.sort(key=lambda c: (-c["final_score"], c["candidate_id"]))
    return all_results[:top_n]


# ==========================
# Ranking Pipeline — Retrieval-First
# ==========================

def rank_candidates_with_retrieval(
    input_file="data/candidates.jsonl",
    artifact_dir="output/retrieval",
    retrieval_k=3000,
    top_n=100
):
    """
    Two-stage pipeline: FAISS narrows 100K to top-K, then
    the full scoring engine ranks only those K candidates.

    100K Candidates
        ↓
    FAISS Top-K (embedding similarity)  [cheap: no scoring]
        ↓
    Score only those K candidates       [expensive: full engine]
        ↓
    Sort → Top N

    K should be generous (3000+) because embedding retrieval is
    noisy — the scoring engine is the authoritative signal.
    """

    from src.retrieval.retrieval_pipeline import retrieve_candidates

    print(
        f"\nRetrieval phase: fetching top-{retrieval_k} from FAISS index..."
    )

    retrieved = retrieve_candidates(
        artifact_dir=artifact_dir,
        top_k=retrieval_k
    )

    # Build a fast lookup set of IDs that passed retrieval
    retrieved_ids = {
        r["candidate_id"]
        for r in retrieved
    }

    print(
        f"Retrieved {len(retrieved_ids)} candidates. Scoring now...\n"
    )

    ranked_candidates = []
    disqualified_count = 0

    for raw_candidate in load_candidates(input_file):

        if raw_candidate.get("candidate_id") not in retrieved_ids:
            continue

        profiled_candidate = (
            extract_candidate_features(raw_candidate)
        )

        # Cheap check before expensive scoring
        disqualified, _ = is_disqualified(profiled_candidate)
        if disqualified:
            disqualified_count += 1
            continue

        scored_candidate = (
            score_candidate(profiled_candidate)
        )

        ranked_candidates.append(scored_candidate)

    if disqualified_count:
        print(f"Pre-filter removed {disqualified_count} non-technical candidates.")

    ranked_candidates.sort(
        key=lambda candidate:
        candidate["final_score"],
        reverse=True
    )

    return ranked_candidates[:top_n]


# ==========================
# Format Output Schema
# ==========================

def _format_output(
    ranked: list,
    use_llm_explanations: bool = False,
) -> list:
    """
    Converts scored candidates into the Phase 3 output schema.

    Each row:
      rank, candidate_id, total_score, breakdown,
      evidence_snippets, flags, explanation
    """

    from explain.generator import (
        _extract_evidence_snippets,
        add_explanations,
    )

    add_explanations(ranked, top_n=20, use_llm=use_llm_explanations)

    output = []

    for rank, candidate in enumerate(ranked, start=1):

        evidence_snippets = _extract_evidence_snippets(candidate)

        breakdown = {
            "feature_score":          candidate.get("career_score", 0),
            "coherence_score":        candidate.get("career_coherence_score", 0),
            "experience_score":       candidate.get("experience_score", 0),
            "trajectory_score":       candidate.get("trajectory_score", 0),
            "product_score":          candidate.get("product_bonus_score", 0),
            "ranking_sys_score":      candidate.get("ranking_systems_score", 0),
            "skill_credibility_score": candidate.get("skill_credibility_score", 0),
            "evidence_density_score": candidate.get("evidence_density_score", 0),
            "location_score":         candidate.get("location_score", 0),
            "industry_score":         candidate.get("industry_score", 0),
            "base_score":             candidate.get("base_score", 0),
            "availability_mult":      candidate.get("availability_multiplier", 1.0),
            "penalties":              candidate.get("penalty_score", 0),
            "vector_similarity":      candidate.get("similarity", None),
        }

        output.append({
            "rank":               rank,
            "candidate_id":       candidate["candidate_id"],
            "title":              candidate.get("title"),
            "experience":         candidate.get("experience"),
            "companies":          candidate.get("companies", []),
            "total_score":        candidate.get("final_score", 0),
            "breakdown":          breakdown,
            "evidence_snippets":  evidence_snippets,
            "flags":              candidate.get("penalty_evidence", []),
            "explanation":        candidate.get("explanation", ""),
        })

    return output


# ==========================
# Save Results
# ==========================

def save_results(
    results,
    output_path,
    use_llm_explanations: bool = False,
):
    """
    Formats and saves ranked results in the Phase 3 schema.
    """

    formatted = _format_output(
        results,
        use_llm_explanations=use_llm_explanations,
    )

    with open(
        output_path,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            formatted,
            file,
            indent=2
        )


# ==========================
# Main
# ==========================

def main():

    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--input",
        default="data/candidates.jsonl"
    )

    parser.add_argument(
        "--top",
        type=int,
        default=10
    )

    parser.add_argument(
        "--output",
        default=None
    )

    parser.add_argument(
        "--use-retrieval",
        action="store_true",
        help="Pre-filter with FAISS before scoring (requires built artifacts)"
    )

    parser.add_argument(
        "--retrieval-k",
        type=int,
        default=3000,
        help="How many candidates FAISS retrieves before scoring (default: 3000)"
    )

    parser.add_argument(
        "--artifact-dir",
        default="output/retrieval",
        help="Directory containing FAISS index and embedding cache"
    )

    parser.add_argument(
        "--build-index",
        action="store_true",
        help="Embed all candidates and build the FAISS index, then exit"
    )

    parser.add_argument(
        "--batch-size",
        type=int,
        default=128,
        help="Embedding batch size when building the index (default: 128)"
    )

    parser.add_argument(
        "--explain-with-llm",
        action="store_true",
        help="Generate LLM explanations for top 20 (requires ANTHROPIC_API_KEY)"
    )

    parser.add_argument(
        "--parallel",
        action="store_true",
        help="Score candidates in parallel across CPU cores (~25 seconds on 8-core CPU)"
    )

    args = parser.parse_args()

    # ==========================
    # Build-index mode
    # ==========================

    if args.build_index:

        from src.retrieval.retrieval_pipeline import build_retrieval_artifacts

        print(
            f"\nBuilding retrieval index from {args.input}...\n"
        )

        result = build_retrieval_artifacts(
            source_path=args.input,
            artifact_dir=args.artifact_dir,
            batch_size=args.batch_size,
        )

        print(
            f"\nIndex built: {result['count']} candidates, "
            f"dim={result['dimension']}, "
            f"saved to {result['index_path']}"
        )

        return

    print(
        "\nStarting Ranking Engine...\n"
    )

    start_time = time.time()

    if args.parallel:

        results = rank_candidates_parallel(
            input_file=args.input,
            top_n=args.top
        )

    elif args.use_retrieval:

        results = rank_candidates_with_retrieval(
            input_file=args.input,
            artifact_dir=args.artifact_dir,
            retrieval_k=args.retrieval_k,
            top_n=args.top
        )

    else:

        results = rank_candidates(
            input_file=args.input,
            top_n=args.top
        )

    end_time = time.time()

    print(
        f"\nProcessed Top {args.top} Candidates"
    )

    print(
        f"Runtime: {round(end_time - start_time, 2)} seconds\n"
    )

    print(
        "=== TOP CANDIDATES ===\n"
    )

    for rank, candidate in enumerate(
        results,
        start=1
    ):

        print(
            f"{rank}. "
            f"{candidate['candidate_id']} | "
            f"{candidate['title']} | "
            f"Score={candidate['final_score']}"
        )

    if args.output:

        save_results(
            results,
            args.output,
            use_llm_explanations=args.explain_with_llm,
        )

        print(
            f"\nResults saved to: {args.output}"
        )


if __name__ == "__main__":
    main()