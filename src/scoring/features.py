import re

# Each bucket is scored at most once per candidate regardless of how many
# keywords match. Buckets are intentionally non-overlapping so that a single
# career signal is not counted by multiple engines.
FEATURE_BUCKETS = {  # keep the dict for weight lookup and documentation

    # Built retrieval systems — the core of the JD
    "retrieval": {
        "weight": 20,
        "keywords": [
            "retrieval",
            "information retrieval",
            "dense retrieval",
            "hybrid retrieval",
            "semantic retrieval",
        ]
    },

    # Built ranking pipelines — LTR, re-ranking, scoring models
    "ranking": {
        "weight": 20,
        "keywords": [
            "ranking",
            "reranking",
            "re-ranking",
            "learning to rank",
        ]
    },

    # Built recommendation / personalization systems
    "recommendation": {
        "weight": 15,
        "keywords": [
            "recommendation",
            "recommendation engine",
            "recommender system",
            "recommendation system",
            "personalization",
        ]
    },

    # Worked on search infrastructure — distinct from pure retrieval R&D
    "search": {
        "weight": 15,
        "keywords": [
            "semantic search",
            "hybrid search",
            "vector search",
            "search engine",
            "search infrastructure",
        ]
    },

    # Hands-on with embeddings and vector infra
    "embeddings": {
        "weight": 10,
        "keywords": [
            "embedding",
            "embeddings",
            "sentence transformer",
            "vector database",
        ]
    },

    # Used evaluation metrics to close the offline/online loop
    "evaluation": {
        "weight": 15,
        "keywords": [
            "ndcg",
            "mrr",
            "a/b testing",
            "offline evaluation",
            "evaluation framework",
        ]
    },

    # Shipped something to real users — not just research or side projects
    "production_ml": {
        "weight": 10,
        "keywords": [
            "production",
            "deployed",
            "at scale",
        ]
    },
}

# Pre-compile: one alternation pattern per bucket (compiled once at import,
# reused for all 60K+ candidates). Reduces 28 re.search calls → 7 per candidate.
# The re module releases the GIL during matching, so threads get real parallelism.
_BUCKET_PATTERNS = [
    (
        name,
        re.compile("|".join(rf"\b{re.escape(kw)}\b" for kw in data["keywords"])),
    )
    for name, data in FEATURE_BUCKETS.items()
]


def extract_career_evidence(candidate):

    career_text = candidate["career_text"].lower()

    evidence = []

    for feature_name, pattern in _BUCKET_PATTERNS:
        m = pattern.search(career_text)
        if m:
            evidence.append({"feature": feature_name, "keyword": m.group()})

    return evidence


def calculate_feature_score(evidence):

    score = 0

    matched_features = set()

    for item in evidence:

        feature = item["feature"]

        if feature not in matched_features:

            score += FEATURE_BUCKETS[feature]["weight"]

            matched_features.add(feature)

    return min(score, 100)


def score_candidate_features(candidate):

    evidence = extract_career_evidence(
        candidate
    )

    score = calculate_feature_score(
        evidence
    )

    return {
        "career_score": score,
        "career_evidence": evidence
    }