def calculate_tenure_score(candidate):

    career_history = candidate.get(
        "career_history",
        []
    )

    if not career_history:

        return {
            "tenure_score": 0,
            "tenure_evidence": []
        }

    durations = []

    for job in career_history:

        duration = job.get(
            "duration_months",
            0
        )

        durations.append(duration)

    average_tenure = (
        sum(durations)
        / len(durations)
    )

    company_count = len(
        career_history
    )

    score = 0

    evidence = []

    # ==========================
    # Average Tenure
    # ==========================

    if average_tenure >= 48:

        score += 25

        evidence.append(
            f"Exceptional Stability ({round(average_tenure)} months avg)"
        )

    elif average_tenure >= 36:

        score += 20

        evidence.append(
            f"Strong Stability ({round(average_tenure)} months avg)"
        )

    elif average_tenure >= 24:

        score += 10

        evidence.append(
            f"Good Stability ({round(average_tenure)} months avg)"
        )

    elif average_tenure >= 18:

        score += 5

        evidence.append(
            f"Moderate Stability ({round(average_tenure)} months avg)"
        )

    elif average_tenure < 12:

        score -= 15

        evidence.append(
            f"Very Short Tenure ({round(average_tenure)} months avg)"
        )

    else:

        score -= 5

        evidence.append(
            f"Short Tenure ({round(average_tenure)} months avg)"
        )

    # ==========================
    # Company Switch Count
    # Bonus only — penalty lives in penalties.py to avoid double-counting
    # ==========================

    if company_count <= 3:

        score += 10

        evidence.append(
            f"Focused Career Path ({company_count} companies)"
        )

    return {
        "tenure_score": score,
        "tenure_evidence": evidence
    }