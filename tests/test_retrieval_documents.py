from src.normalize.profiler import extract_candidate_features
from src.retrieval.candidate_embeddings import build_candidate_document


def test_document_uses_career_evidence_but_not_noisy_skills(sample_by_id):
    profiled = extract_candidate_features(sample_by_id["CAND_0000031"])
    document = build_candidate_document(profiled)

    assert "TITLE: Recommendation Systems Engineer" in document
    assert "EVIDENCE:" in document
    assert "ranking models" in document
    assert "Skills:" not in document  # raw "Skills:" header must not appear


def test_duplicate_job_descriptions_are_not_repeated(sample_by_id):
    profiled = extract_candidate_features(sample_by_id["CAND_0000031"])
    document = build_candidate_document(profiled)
    repeated_description = profiled["career_history"][0]["description"]

    assert document.count(repeated_description) == 1
