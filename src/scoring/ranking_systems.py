import re

# Only advanced signals that features.py does not cover.
# ndcg/mrr/a-b testing/offline evaluation live in features.py "evaluation" bucket.
RANKING_SYSTEM_KEYWORDS = {

    # Knows how to correlate offline metrics to online outcomes — deep signal
    "offline-online correlation": 15,

    # Specific LTR tree-based tools — not just keyword awareness
    "xgboost": 10,

    "lightgbm": 10,

    # LTR abbreviation (distinct from "learning to rank" in features ranking bucket)
    "ltr": 10,

    # Owned the relevance tuning loop end-to-end
    "relevance tuning": 10,

    # Engineered a ranking pipeline as a system, not just a model
    "ranking pipeline": 10,
}


MAX_RANKING_SYSTEMS_SCORE = 30

# Pre-compile all keyword patterns once at import time.
_COMPILED_RANKING = [
    (kw, weight, re.compile(rf"\b{re.escape(kw)}\b"))
    for kw, weight in RANKING_SYSTEM_KEYWORDS.items()
]


def calculate_ranking_systems_score(candidate):

    career_text = candidate.get("career_text", "").lower()

    score = 0
    evidence = []

    for keyword, weight, pattern in _COMPILED_RANKING:
        if pattern.search(career_text):
            score += weight
            evidence.append({"keyword": keyword, "weight": weight})

    score = min(score, MAX_RANKING_SYSTEMS_SCORE)

    return {
        "ranking_systems_score": score,
        "ranking_systems_evidence": evidence,
    }