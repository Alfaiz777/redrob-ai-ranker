import json

from src.normalize.profiler import (
    extract_candidate_features
)

from src.scoring.penalties import (
    calculate_penalties
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

result = calculate_penalties(
    profiled_candidate
)

print(
    "\n=== PENALTY ENGINE ===\n"
)

print(
    "Candidate:",
    profiled_candidate["candidate_id"]
)

print(
    "Title:",
    profiled_candidate["title"]
)

print(
    "\nPenalty Score:",
    result["penalty_score"]
)

print(
    "\nPenalty Evidence:"
)

if result["penalty_evidence"]:

    for item in result[
        "penalty_evidence"
    ]:
        print("✗", item)

else:
    print(
        "No penalties found."
    )