
# Industry tiers for a search/recommendation/retrieval role at a product company.
# A candidate's domain knowledge transfers differently depending on their industry.

# Strongest: these industries build search/rec/ranking as their core product
TIER_1_INDUSTRIES = {
    "ai/ml",
    "artificial intelligence",
    "machine learning",
    "internet",
    "e-commerce",
    "ecommerce",
    "fintech",
    "saas",
    "ad tech",
    "adtech",
}

# Relevant: tech companies where ML is important but not the core product
TIER_2_INDUSTRIES = {
    "technology",
    "software",
    "cloud",
    "b2b tech",
    "cybersecurity",
    "media",
    "gaming",
    "edtech",
    "healthtech",
}

# Weak: ML exists here but domain knowledge doesn't transfer to search/rec
WEAK_INDUSTRIES = {
    "healthcare",
    "pharma",
    "pharmaceutical",
    "manufacturing",
    "automotive",
    "oil & gas",
    "energy",
    "construction",
    "agriculture",
    "retail",
    "logistics",
}

MAX_INDUSTRY_SCORE = 15


def _normalize(industry: str) -> str:
    return (industry or "").lower().strip()


def _tier_of(industry: str) -> int:
    n = _normalize(industry)
    if any(t in n for t in TIER_1_INDUSTRIES):
        return 1
    if any(t in n for t in TIER_2_INDUSTRIES):
        return 2
    if any(t in n for t in WEAK_INDUSTRIES):
        return 4
    return 3  # neutral / unknown


def calculate_industry_score(candidate) -> dict:
    """
    Scores industry relevance with recency weighting.

    The most recent two jobs count double — a candidate transitioning
    from manufacturing into e-commerce ML gets credit for the direction
    of their move, not just the history.
    """

    career_history = candidate.get("career_history", [])

    if not career_history:
        return {
            "industry_score": 0,
            "industry_evidence": [],
        }

    score = 0
    evidence = []

    # career_history is newest-first; give the first two jobs double weight
    for i, job in enumerate(career_history):

        industry = job.get("industry", "")
        if not industry:
            continue

        tier = _tier_of(industry)
        weight = 2 if i < 2 else 1

        if tier == 1:
            score += 5 * weight
            evidence.append(f"Tier-1 industry: {industry}")

        elif tier == 2:
            score += 2 * weight
            evidence.append(f"Relevant industry: {industry}")

        elif tier == 4:
            score -= 1 * weight
            evidence.append(f"Off-domain industry: {industry}")

    score = max(-5, min(score, MAX_INDUSTRY_SCORE))

    return {
        "industry_score": score,
        "industry_evidence": list(dict.fromkeys(evidence)),  # deduplicate, preserve order
    }
