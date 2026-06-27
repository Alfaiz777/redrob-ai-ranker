import json

from src.normalize.profiler import (
    extract_candidate_features
)

from src.scoring.behavioral import (
    calculate_availability_multiplier
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


# ==========================
# LOAD CANDIDATE
# ==========================

candidate = get_candidate_by_id(
    "CAND_0000031"
)

profiled_candidate = (
    extract_candidate_features(
        candidate
    )
)

# ==========================
# RUN BEHAVIORAL ENGINE
# ==========================

result = (
    calculate_availability_multiplier(
        profiled_candidate[
            "behavior_signals"
        ]
    )
)

# ==========================
# PRINT RESULTS
# ==========================

print(
    "\n=== BEHAVIORAL SCORE ===\n"
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
    "\nAvailability Multiplier:"
)

print(
    "\nAvailability Multiplier:",
    result["availability_multiplier"]
)

print(
    "\nBehavior Evidence:"
)

for item in result["behavior_evidence"]:
    print("✓", item)