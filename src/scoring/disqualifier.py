import re

# Very broad tech signals — if NONE of these appear in career text,
# the candidate is not in any technical field and can be skipped
# before the expensive scoring engines run.
# Intentionally coarse: "engineer", "data", "software" match almost
# any technical background. The scoring engines handle precision.
BROAD_TECH_SIGNALS = [
    "engineer",
    "scientist",
    "developer",
    "software",
    "machine learning",
    "data science",
    "artificial intelligence",
    "deep learning",
    "python",
    "ml",
    " ai ",
    "analytics",
    "data analyst",
    "researcher",
    "nlp",
    "neural",
]

# Titles that are definitely outside scope — hard disqualify regardless
# of what keywords might be in the career text (keyword stuffing trap).
HARD_DISQUALIFY_TITLES = [
    "marketing manager",
    "sales manager",
    "hr manager",
    "human resources",
    "accountant",
    "content writer",
    "customer support",
    "operations manager",
    "business development",
    "account manager",
    "financial analyst",
    "project manager",
    "product manager",
]


def is_disqualified(candidate) -> tuple[bool, str]:
    """
    Fast cheap check before expensive scoring.

    Returns (disqualified: bool, reason: str).
    Disqualified = True means skip this candidate entirely.
    """

    career_text = candidate.get("career_text", "").lower()
    title = (candidate.get("title") or "").lower()

    # ==========================
    # Hard disqualify by title
    # ==========================

    for bad_title in HARD_DISQUALIFY_TITLES:
        if bad_title in title:
            return True, f"Non-technical title: {title}"

    # ==========================
    # Must have some technical signal
    # ==========================

    if not career_text:
        return True, "Empty career text"

    has_tech_signal = any(
        signal in career_text
        for signal in BROAD_TECH_SIGNALS
    )

    if not has_tech_signal:
        return True, "No technical signals in career text"

    return False, ""
