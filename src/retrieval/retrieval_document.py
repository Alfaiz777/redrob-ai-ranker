import re

JD_KEYWORDS = [
    "retrieval",
    "ranking",
    "recommendation",
    "search",
    "matching",
    "embedding",
    "embeddings",
    "vector",
    "vector search",
    "vector database",
    "pinecone",
    "qdrant",
    "weaviate",
    "milvus",
    "faiss",
    "ndcg",
    "mrr",
    "map",
    "evaluation",
    "machine learning",
    "ml",
    "nlp",
    "learning to rank",
    "xgboost",
    "lightgbm"
]


def contains_jd_signal(text: str) -> bool:

    text = text.lower()

    return any(
        keyword in text
        for keyword in JD_KEYWORDS
    )


def extract_relevant_descriptions(
    career_history
):

    evidence = []
    seen = set()

    for job in career_history:

        description = (
            job.get("description", "")
        )

        if (
            description
            and description not in seen
            and contains_jd_signal(description)
        ):

            evidence.append(description)
            seen.add(description)

    return evidence