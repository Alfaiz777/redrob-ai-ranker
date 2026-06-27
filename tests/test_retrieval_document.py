import json

from src.normalize.profiler import (
    extract_candidate_features
)

from src.retrieval.candidate_embeddings import (
    build_candidate_document
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


candidate = get_candidate_by_id(
    "CAND_0000031"
)

profiled = (
    extract_candidate_features(
        candidate
    )
)

document = (
    build_candidate_document(
        profiled
    )
)

print(document)