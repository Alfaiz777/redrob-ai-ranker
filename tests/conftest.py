import json
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"


@pytest.fixture
def sample_candidates():
    with open(DATA_DIR / "sample_candidates.json", encoding="utf-8") as file:
        return json.load(file)


@pytest.fixture
def sample_by_id(sample_candidates):
    return {c["candidate_id"]: c for c in sample_candidates}
