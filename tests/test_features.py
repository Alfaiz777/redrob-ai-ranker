import json

from src.normalize.profiler import (
    extract_candidate_features
)

from src.scoring.features import (
    score_candidate_features
)


def get_candidate_by_id(target_id):

    with open(
        "data/candidates.jsonl",
        "r",
        encoding="utf-8"
    ) as file:

        for line in file:

            candidate = json.loads(line)

            if candidate["candidate_id"] == target_id:
                return candidate

    return None


# ==========================
# TEST CANDIDATE
# ==========================

candidate = get_candidate_by_id(
    "CAND_0000031"
)

profiled_candidate = extract_candidate_features(
    candidate
)

result = score_candidate_features(
    profiled_candidate
)

print("\n=== CANDIDATE INFO ===\n")

print(
    "Candidate ID:",
    profiled_candidate["candidate_id"]
)

print(
    "Title:",
    profiled_candidate["title"]
)

print(
    "Experience:",
    profiled_candidate["experience"]
)

print("\n=== FEATURE SCORE ===\n")

print(
    "Career Score:",
    result["career_score"]
)

print("\n=== CAREER EVIDENCE ===\n")

for item in result["career_evidence"]:
    print(item)

print("\n=== CAREER TEXT SAMPLE ===\n")

print(
    profiled_candidate["career_text"][:1000]
)