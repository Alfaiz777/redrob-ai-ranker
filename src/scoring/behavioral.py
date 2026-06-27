from datetime import datetime


def calculate_availability_multiplier(
    behavior_signals
):
    """
    Calculates how available / hireable a candidate is.

    Returns:
    {
        "availability_multiplier": float,
        "behavior_evidence": []
    }
    """

    multiplier = 1.0

    behavior_evidence = []

    # ==========================
    # Open To Work
    # ==========================

    if behavior_signals.get(
        "open_to_work_flag",
        False
    ):
        multiplier += 0.10

        behavior_evidence.append(
            "Open To Work"
        )

    # ==========================
    # Recruiter Response Rate
    # ==========================

    response_rate = behavior_signals.get(
        "recruiter_response_rate",
        0
    )

    if response_rate >= 0.80:

        multiplier += 0.10

        behavior_evidence.append(
            f"High Recruiter Response Rate ({response_rate:.0%})"
        )

    elif response_rate <= 0.20:

        multiplier -= 0.20

        behavior_evidence.append(
            f"Low Recruiter Response Rate ({response_rate:.0%})"
        )

    # ==========================
    # Notice Period
    # ==========================

    notice_period = behavior_signals.get(
        "notice_period_days",
        90
    )

    if notice_period <= 30:

        multiplier += 0.05

        behavior_evidence.append(
            f"Short Notice Period ({notice_period} days)"
        )

    elif notice_period > 90:

        multiplier -= 0.05

        behavior_evidence.append(
            f"Long Notice Period ({notice_period} days)"
        )

    # ==========================
    # Relocation
    # ==========================

    if behavior_signals.get(
        "willing_to_relocate",
        False
    ):

        multiplier += 0.05

        behavior_evidence.append(
            "Willing To Relocate"
        )

    # ==========================
    # GitHub Activity
    # ==========================

    github_score = behavior_signals.get(
        "github_activity_score",
        0
    )

    if github_score > 50:

        multiplier += 0.05

        behavior_evidence.append(
            f"Strong GitHub Activity ({github_score})"
        )

    # ==========================
    # Last Active Date
    # ==========================

    try:

        last_active_date = behavior_signals.get(
            "last_active_date"
        )

        if last_active_date:

            last_active = datetime.strptime(
                last_active_date,
                "%Y-%m-%d"
            )

            today = datetime.today()

            days_inactive = (
                today - last_active
            ).days

            if days_inactive > 180:

                multiplier -= 0.20

                behavior_evidence.append(
                    f"Inactive For {days_inactive} Days"
                )

            elif days_inactive > 90:

                multiplier -= 0.10

                behavior_evidence.append(
                    f"Low Recent Activity ({days_inactive} Days)"
                )

            else:

                behavior_evidence.append(
                    "Recently Active"
                )

    except Exception:
        pass

    # ==========================
    # Interview Completion Rate
    # Candidate who starts but ghosts midway is a hiring risk.
    # < 0.4 means they abandon more than half their processes.
    # ==========================

    interview_rate = behavior_signals.get(
        "interview_completion_rate",
        None
    )

    if interview_rate is not None:

        if interview_rate >= 0.80:

            multiplier += 0.05

            behavior_evidence.append(
                f"High Interview Completion Rate ({interview_rate:.0%})"
            )

        elif interview_rate < 0.40:

            multiplier -= 0.10

            behavior_evidence.append(
                f"Low Interview Completion Rate ({interview_rate:.0%}) — hiring risk"
            )

    # ==========================
    # Offer Acceptance Rate
    # Candidate who never joins after offers wastes recruiter time.
    # < 0.3 is a strong signal they're using offers as leverage only.
    # ==========================

    offer_rate = behavior_signals.get(
        "offer_acceptance_rate",
        None
    )

    if offer_rate is not None:

        if offer_rate >= 0.70:

            multiplier += 0.05

            behavior_evidence.append(
                f"High Offer Acceptance Rate ({offer_rate:.0%})"
            )

        elif offer_rate < 0.30:

            multiplier -= 0.10

            behavior_evidence.append(
                f"Low Offer Acceptance Rate ({offer_rate:.0%}) — rarely joins"
            )

    # ==========================
    # Average Recruiter Response Time
    # > 72 hours means they're slow to engage even when they respond.
    # > 168 hours (1 week) is a strong unavailability signal.
    # ==========================

    avg_response_hours = behavior_signals.get(
        "avg_response_time_hours",
        None
    )

    if avg_response_hours is not None:

        if avg_response_hours > 168:

            multiplier -= 0.10

            behavior_evidence.append(
                f"Very Slow Response Time ({avg_response_hours:.0f} hours avg)"
            )

        elif avg_response_hours > 72:

            multiplier -= 0.05

            behavior_evidence.append(
                f"Slow Response Time ({avg_response_hours:.0f} hours avg)"
            )

        elif avg_response_hours <= 24:

            multiplier += 0.03

            behavior_evidence.append(
                f"Fast Response Time ({avg_response_hours:.0f} hours avg)"
            )

    # ==========================
    # Clamp
    # ==========================

    multiplier = max(
        0.50,
        min(multiplier, 1.30)
    )

    return {
        "availability_multiplier":
            round(multiplier, 2),

        "behavior_evidence":
            behavior_evidence
    }