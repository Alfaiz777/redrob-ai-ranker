import json

from src.normalize.profiler import (
    extract_candidate_features
)

from src.retrieval.candidate_embeddings import (
    create_candidate_embedding
)

from src.retrieval.jd_embedding import (
    create_jd_embedding
)

from src.retrieval.similarity import (
    cosine_similarity
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

candidate_embedding = (
    create_candidate_embedding(
        profiled_candidate
    )
)

jd_embedding = (
    create_jd_embedding()
)

score = cosine_similarity(
    jd_embedding,
    candidate_embedding
)

print(
    "\nCandidate:",
    profiled_candidate[
        "candidate_id"
    ]
)

print(
    "Similarity:",
    round(score, 4)
)