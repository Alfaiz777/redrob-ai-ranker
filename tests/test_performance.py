import json
import time
from pathlib import Path

import pytest

from src.normalize.profiler import extract_candidate_features

ROOT = Path(__file__).resolve().parents[1]
JSONL_PATH = ROOT / "data" / "candidates.jsonl"

# Phase 0 baseline: pure Python profiling over 100K should stay under ~30s.
MAX_SECONDS = 30.0


@pytest.mark.slow
def test_profile_100k_candidates_within_budget():
    start = time.perf_counter()
    count = 0

    with open(JSONL_PATH, encoding="utf-8") as file:
        for line in file:
            extract_candidate_features(json.loads(line))
            count += 1

    elapsed = time.perf_counter() - start

    assert count == 100_000
    assert elapsed < MAX_SECONDS, f"Profiling took {elapsed:.2f}s (budget {MAX_SECONDS}s)"
