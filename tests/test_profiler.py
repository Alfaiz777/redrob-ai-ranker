import json
from pathlib import Path

import pytest

from src.normalize.profiler import extract_candidate_features

ROOT = Path(__file__).resolve().parents[1]
EXPECTED_KEYS = {
    "candidate_id",
    "title",
    "experience",
    "skills",
    "companies",
    "job_titles",
    "industries",
    "career_text",
    "behavior_signals",
}


def test_profile_has_required_fields(sample_candidates):
    profiled = extract_candidate_features(sample_candidates[0])
    assert EXPECTED_KEYS.issubset(profiled.keys())


def test_profile_career_text_includes_headline_and_summary(sample_candidates):
    raw = sample_candidates[0]
    profiled = extract_candidate_features(raw)
    headline = raw["profile"]["headline"]
    summary = raw["profile"]["summary"]
    assert headline in profiled["career_text"]
    assert summary in profiled["career_text"]


def test_profile_skills_match_source(sample_candidates):
    raw = sample_candidates[0]
    profiled = extract_candidate_features(raw)
    expected = [s["name"] for s in raw.get("skills", [])]
    assert profiled["skills"] == expected


def test_profile_behavior_signals_preserved(sample_candidates):
    raw = sample_candidates[0]
    profiled = extract_candidate_features(raw)
    assert profiled["behavior_signals"] == raw.get("redrob_signals", {})


def test_anchor_candidate_exists_in_sample(sample_by_id):
    assert "CAND_0000031" in sample_by_id


def test_anchor_candidate_profiles_cleanly(sample_by_id):
    profiled = extract_candidate_features(sample_by_id["CAND_0000031"])
    assert profiled["title"] == "Recommendation Systems Engineer"
    assert profiled["experience"] == 6.0
    assert len(profiled["career_text"]) > 500
    assert profiled["behavior_signals"].get("recruiter_response_rate", 0) > 0.5


def test_profiler_handles_jsonl_first_record():
    jsonl_path = ROOT / "data" / "candidates.jsonl"
    with open(jsonl_path, encoding="utf-8") as file:
        candidate = json.loads(next(file))
    profiled = extract_candidate_features(candidate)
    assert profiled["candidate_id"] == "CAND_0000001"
