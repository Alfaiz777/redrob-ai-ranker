import re

# Skills that directly map to what the JD requires.
# Used to decide which assessment scores and endorsements to evaluate.
JD_RELEVANT_SKILL_TERMS = [
    "nlp",
    "retrieval",
    "ranking",
    "recommendation",
    "search",
    "embedding",
    "embeddings",
    "vector",
    "machine learning",
    "information retrieval",
    "learning to rank",
    "evaluation",
    "production ml",
    "deep learning",
    "transformer",
    "bert",
    "semantic",
]

MAX_SKILL_CREDIBILITY_SCORE = 20


def _is_jd_relevant(skill_name: str) -> bool:
    name = skill_name.lower()
    return any(term in name for term in JD_RELEVANT_SKILL_TERMS)


# ==========================
# Check A: Platform Assessment Scores
# ==========================

def _score_assessments(behavior_signals: dict) -> tuple[int, list]:

    assessment_scores = behavior_signals.get(
        "skill_assessment_scores",
        {}
    )

    score = 0
    evidence = []

    for skill_name, test_score in assessment_scores.items():

        if not _is_jd_relevant(skill_name):
            continue

        if test_score >= 70:

            score += 8

            evidence.append(
                f"Assessment: {skill_name} = {test_score:.0f}/100 (credible)"
            )

        elif test_score < 40:

            score -= 5

            evidence.append(
                f"Assessment: {skill_name} = {test_score:.0f}/100 (credibility gap)"
            )

    return score, evidence


# ==========================
# Check B: Endorsement Quality on JD-relevant skills
# ==========================

def _score_endorsements(skills_detail: list) -> tuple[int, list]:

    score = 0
    evidence = []

    for skill in skills_detail:

        name = skill.get("name", "")

        if not _is_jd_relevant(name):
            continue

        proficiency = skill.get("proficiency", "").lower()
        endorsements = skill.get("endorsements", 0)
        duration_months = skill.get("duration_months", 0)

        # High endorsements on a relevant skill = credibility signal
        if endorsements >= 20 and duration_months >= 12:

            score += 5

            evidence.append(
                f"Credible skill: {name} ({endorsements} endorsements, {duration_months}m)"
            )

        # Claimed advanced but no endorsements = keyword stuffing
        elif proficiency == "advanced" and endorsements <= 2:

            score -= 3

            evidence.append(
                f"Unendorsed advanced claim: {name} ({endorsements} endorsements)"
            )

    return score, evidence


# ==========================
# Main Entry Point
# ==========================

def calculate_skill_credibility(candidate) -> dict:

    behavior_signals = candidate.get("behavior_signals", {})
    skills_detail = candidate.get("skills_detail", [])

    assessment_score, assessment_evidence = _score_assessments(
        behavior_signals
    )

    endorsement_score, endorsement_evidence = _score_endorsements(
        skills_detail
    )

    total = assessment_score + endorsement_score

    total = max(
        -10,
        min(total, MAX_SKILL_CREDIBILITY_SCORE)
    )

    return {
        "skill_credibility_score": total,
        "skill_credibility_evidence": assessment_evidence + endorsement_evidence,
    }
