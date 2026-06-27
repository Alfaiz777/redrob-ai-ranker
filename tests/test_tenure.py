import json

from src.normalize.profiler import (
    extract_candidate_features
)

from src.scoring.tenure import (
    calculate_tenure_score
)


def get_candidate_by_id(
    target_id
):

    with open(
        "data/candidates.jsonl",
        "r",
        encoding="utf-8"
    ) as file:

        for line in file:

            candidate = json.loads(line)

            if (
                candidate["candidate_id"]
                == target_id
            ):
                return candidate

    return None


candidate = get_candidate_by_id(
    "CAND_0000031"
)

profiled_candidate = (
    extract_candidate_features(
        candidate
    )
)

print("\n=== PROFILED CANDIDATE ===")
print(profiled_candidate["career_history"])

result = calculate_tenure_score(
    profiled_candidate
)

print(
    "\n=== TENURE ENGINE ===\n"
)

print(
    "Candidate:",
    profiled_candidate[
        "candidate_id"
    ]
)

print(
    "Title:",
    profiled_candidate[
        "title"
    ]
)

print(
    "\nTenure Score:",
    result[
        "tenure_score"
    ]
)

print(
    "\nEvidence:"
)

for item in result[
    "tenure_evidence"
]:
    print("✓", item)