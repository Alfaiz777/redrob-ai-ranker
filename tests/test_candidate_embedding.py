import json

from src.normalize.profiler import (
    extract_candidate_features
)

from src.retrieval.candidate_embeddings import (
    create_candidate_embedding
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

embedding = (
    create_candidate_embedding(
        profiled_candidate
    )
)

print(
    "\nCandidate:",
    profiled_candidate[
        "candidate_id"
    ]
)

print(
    "Embedding Shape:",
    embedding.shape
)

print(
    "First 10 Values:"
)

print(
    embedding[:10]
)