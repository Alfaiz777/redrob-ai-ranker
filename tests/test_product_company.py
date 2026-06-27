import json

from src.normalize.profiler import (
    extract_candidate_features
)

from src.scoring.product_company import (
    calculate_product_company_bonus
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
    calculate_product_company_bonus(
        profiled_candidate
    )
)

print(
    "\n=== PRODUCT COMPANY BONUS ===\n"
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
    "\nBonus Score:",
    result[
        "product_bonus_score"
    ]
)

print(
    "\nMatched Companies:"
)

for company in result[
    "product_bonus_evidence"
]:

    print(
        "✓",
        company
    )