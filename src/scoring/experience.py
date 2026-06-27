def calculate_experience_alignment(
    candidate
):

    experience = (
        candidate.get(
            "experience",
            0
        )
    )

    score = 0

    evidence = []

    # ==========================
    # Ideal Range (JD: 6-8 years)
    # ==========================

    if 6 <= experience <= 8:

        score = 20

        evidence.append(
            "Ideal Experience Range (6-8 years)"
        )

    # ==========================
    # Near Ideal
    # ==========================

    elif 4 <= experience < 6:

        score = 10

        evidence.append(
            "Near Ideal Experience Range (4-6 years)"
        )

    # ==========================
    # Senior Candidate
    # ==========================

    elif 8 < experience <= 12:

        score = 5

        evidence.append(
            "Senior Candidate (8-12 years)"
        )

    # ==========================
    # Over Preferred Band
    # ==========================

    elif 12 < experience <= 15:

        score = 0

        evidence.append(
            "Over Preferred Band (12-15 years)"
        )

    # ==========================
    # Over Experience Band
    # ==========================

    elif experience > 15:

        score = -5

        evidence.append(
            "Over Experience Band (>15 years)"
        )

    # ==========================
    # Below Required Range
    # ==========================

    else:

        score = 0

        evidence.append(
            "Below Preferred Experience Range"
        )

    return {

        "experience_score":
            score,

        "experience_evidence":
            evidence
    }