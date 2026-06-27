import re

# Titles that map directly to what this JD is hiring for.
# A candidate whose recent roles are in this set is on the right track.
TARGET_DOMAIN_TITLES = [
    "search engineer",
    "ranking engineer",
    "retrieval engineer",
    "recommendation systems engineer",
    "recommendation engineer",
    "nlp engineer",
    "applied ml engineer",
    "applied scientist",
    "machine learning engineer",
    "ml engineer",
    "ai engineer",
    "information retrieval",
    "data scientist",
]

# Seniority words used to detect upward progression.
# Higher index = higher seniority.
SENIORITY_LADDER = [
    "intern",
    "trainee",
    "junior",
    "associate",
    "",          # no prefix — treated as mid-level
    "senior",
    "staff",
    "lead",
    "principal",
    "head",
    "director",
]


def _is_target_domain(title: str) -> bool:
    t = title.lower()
    return any(domain in t for domain in TARGET_DOMAIN_TITLES)


def _seniority_rank(title: str) -> int:
    t = title.lower()
    for rank, word in enumerate(SENIORITY_LADDER):
        if word and word in t:
            return rank
    return 4  # default: mid-level (index of "" in ladder)


def calculate_career_trajectory(candidate):

    career_history = candidate.get(
        "career_history",
        []
    )

    score = 0
    evidence = []

    if not career_history:
        return {
            "trajectory_score": 0,
            "trajectory_evidence": []
        }

    # ==========================
    # Chronological Order
    # career_history is newest-first in the raw data.
    # Reverse so index 0 = oldest, last = most recent.
    # ==========================

    chronological = list(reversed(career_history))

    titles = [
        job.get("title", "")
        for job in chronological
    ]

    domain_flags = [
        _is_target_domain(t)
        for t in titles
    ]

    # ==========================
    # Current Role Signal
    # The most recent title is the strongest signal.
    # ==========================

    current_title = titles[-1] if titles else ""

    if _is_target_domain(current_title):

        score += 20

        evidence.append(
            f"Current role in target domain: {current_title}"
        )

    # ==========================
    # Domain Convergence
    # Did the career MOVE toward the target domain over time?
    # Compare first half vs second half of the career.
    # ==========================

    if len(domain_flags) >= 3:

        midpoint = len(domain_flags) // 2

        early_domain_count = sum(domain_flags[:midpoint])
        recent_domain_count = sum(domain_flags[midpoint:])

        if (
            recent_domain_count > early_domain_count
            and not _is_target_domain(current_title)
        ):
            # Trending toward domain but not fully there yet
            score += 8

            evidence.append(
                "Career converging toward target domain"
            )

        elif (
            recent_domain_count > early_domain_count
            and _is_target_domain(current_title)
        ):
            # Already counted in current role bonus — add trajectory bonus
            score += 5

            evidence.append(
                "Consistent progression into target domain"
            )

    # ==========================
    # Seniority Progression
    # Did the seniority level increase over the career?
    # ==========================

    if len(titles) >= 2:

        seniority_ranks = [
            _seniority_rank(t)
            for t in titles
        ]

        first_rank = seniority_ranks[0]
        last_rank = seniority_ranks[-1]

        if last_rank > first_rank:

            score += 5

            evidence.append(
                f"Seniority progression detected across career"
            )

    # ==========================
    # Title-Chasing Penalty
    # Rapid senior/staff/principal jumps via short stints.
    # The penalty engine already penalizes company count, but
    # this catches title inflation without domain depth.
    # ==========================

    title_chase_count = 0

    for i, job in enumerate(chronological[:-1]):

        duration = job.get("duration_months", 99)
        title = titles[i]

        is_inflated_title = any(
            word in title.lower()
            for word in ["senior", "staff", "principal", "lead"]
        )

        if is_inflated_title and duration < 18:
            title_chase_count += 1

    if title_chase_count >= 2:

        score -= 10

        evidence.append(
            f"Title-chasing pattern: {title_chase_count} short senior+ roles"
        )

    # ==========================
    # Clamp
    # ==========================

    score = max(0, min(score, 30))

    return {
        "trajectory_score": score,
        "trajectory_evidence": evidence
    }
