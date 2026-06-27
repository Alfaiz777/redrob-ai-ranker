import json

from src.normalize.profiler import (
    extract_candidate_features
)

from src.scoring.ranking_systems import (
    calculate_ranking_systems_score
)


def get_candidate_by_id(
    candidate_id
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
                == candidate_id
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

result = (
    calculate_ranking_systems_score(
        profiled_candidate
    )
)

print(
    "\n=== RANKING SYSTEMS ENGINE ===\n"
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
    "\nRanking Systems Score:",
    result[
        "ranking_systems_score"
    ]
)

print(
    "\nEvidence:"
)

for item in result[
    "ranking_systems_evidence"
]:

    print(item)