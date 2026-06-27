import re

# Words that mean the candidate DID the work, not just observed it.
# "Contributed to" and "helped with" intentionally excluded — they
# indicate participation, not ownership.
OWNERSHIP_VERBS = [
    "built",
    "designed",
    "owned",
    "shipped",
    "deployed",
    "architected",
    "developed",
    "implemented",
    "launched",
    "created",
    "led the",
    "led design",
    "responsible for",
    "drove",
    "delivered",
]

# Patterns that indicate real production scale or measurable impact.
# These require numbers or specific metrics — not vague language.
SCALE_PATTERNS = [
    r"\d+\s*(m|k|b)?\+?\s*(users|queries|requests|candidates|searches)",  # 5M queries
    r"\d+%\s*(improvement|reduction|increase|accuracy|gain|drop)",         # 10% improvement
    r"p\d+\s*latency",                                                     # P99 latency
    r"\d+\s*(million|billion|thousand)\s*(users|queries|requests)",        # 5 million users
    r"(latency|throughput|recall|precision|ndcg|mrr)\s*(from|of|at)\s*[\d.]+",  # metric: value
    r"serving\s+\d+",                                                      # serving 10M
    r"reduced\s+.*\s+by\s+\d+",                                           # reduced latency by 40
    r"improved\s+.*\s+by\s+\d+",                                          # improved recall by 12%
]

# JD core domain keywords — only descriptions with these matter here.
# Evidence density only applies to relevant descriptions.
JD_CORE_KEYWORDS = [
    "retrieval",
    "ranking",
    "recommendation",
    "search",
    "embedding",
    "embeddings",
    "ndcg",
    "mrr",
    "learning to rank",
    "vector",
    "semantic",
    "relevance",
]

MAX_EVIDENCE_DENSITY_SCORE = 25

# Pre-compile SCALE_PATTERNS once at import time.
# With 60K candidates × avg 5 jobs × 8 patterns = 2.4M calls saved from
# re-compiling or cache-lookups on every call.
_COMPILED_SCALE = [re.compile(p) for p in SCALE_PATTERNS]


def _has_jd_keyword(text: str) -> bool:
    t = text.lower()
    return any(kw in t for kw in JD_CORE_KEYWORDS)


def _count_ownership_verbs(text: str) -> int:
    t = text.lower()
    return sum(1 for verb in OWNERSHIP_VERBS if verb in t)


def _count_scale_indicators(text: str) -> int:
    t = text.lower()
    return sum(1 for p in _COMPILED_SCALE if p.search(t))


def _score_description(description: str) -> tuple[int, str | None]:
    """
    Score one job description based on evidence quality.

    Returns (points, evidence_label) where points are:
      0  — keyword absent or no ownership verb
      1  — keyword + ownership verb (did the work)
      2  — keyword + ownership verb + scale (production impact)
    """

    if not _has_jd_keyword(description):
        return 0, None

    verbs = _count_ownership_verbs(description)
    scale = _count_scale_indicators(description)

    if verbs >= 1 and scale >= 1:
        return 2, f"Strong evidence (verbs={verbs}, scale signals={scale})"

    if verbs >= 1:
        return 1, f"Ownership evidence (verbs={verbs})"

    return 0, None


def calculate_evidence_density(candidate) -> dict:
    """
    Scores how densely evidenced the career history is.

    Only counts descriptions where:
    - A JD core keyword is present
    - The candidate is described as the actor (ownership verb)
    - Optionally: measurable scale/impact is mentioned

    This catches the gap between someone who 'managed a team that used
    embeddings' vs someone who 'built and deployed an embedding pipeline
    serving 8M queries/day.'
    """

    career_history = candidate.get("career_history", [])

    total_score = 0
    evidence = []

    for job in career_history:

        description = job.get("description", "")

        if not description:
            continue

        points, label = _score_description(description)

        if points > 0 and label:

            total_score += points

            job_title = job.get("title", "")
            company = job.get("company", "")

            evidence.append(
                f"{job_title} @ {company}: {label}"
            )

    total_score = min(total_score, MAX_EVIDENCE_DENSITY_SCORE)

    return {
        "evidence_density_score": total_score,
        "evidence_density_evidence": evidence,
    }
