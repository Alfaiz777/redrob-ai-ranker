
# Location scoring based on JD notes:
# - Pune or Noida → strongly preferred
# - Tier-1 Indian cities → acceptable
# - Other Indian cities → neutral
# - Outside India → score reducer (no visa sponsorship per JD)

PREFERRED_CITIES = {
    "pune",
    "noida",
}

ACCEPTABLE_CITIES = {
    "hyderabad",
    "mumbai",
    "delhi",
    "delhi ncr",
    "bengaluru",
    "bangalore",
    "gurugram",
    "gurgaon",
    "new delhi",
}

# Cities still in India but not tier-1 for this role
OTHER_INDIA_CITIES = {
    "chennai",
    "kolkata",
    "ahmedabad",
    "jaipur",
    "lucknow",
    "indore",
    "coimbatore",
}


def calculate_location_score(candidate) -> dict:
    """
    Scores the candidate's location against the JD's stated preferences.

    The JD explicitly says:
    - Preferred: Pune or Noida (hybrid, offices used mainly Tue/Thu)
    - Acceptable: Tier-1 Indian cities
    - Outside India: case-by-case, no visa sponsorship
    """

    location = (candidate.get("location") or "").lower().strip()
    country = (candidate.get("country") or "").lower().strip()

    score = 0
    evidence = []

    # ==========================
    # Outside India
    # ==========================

    if country and country not in ("india", "in"):

        score = -8

        evidence.append(
            f"Located outside India ({country}) — no visa sponsorship"
        )

        return {
            "location_score": score,
            "location_evidence": evidence,
        }

    # ==========================
    # Preferred Cities
    # ==========================

    for city in PREFERRED_CITIES:

        if city in location:

            score = 8

            evidence.append(
                f"Located in preferred city: {location}"
            )

            return {
                "location_score": score,
                "location_evidence": evidence,
            }

    # ==========================
    # Acceptable Tier-1 Cities
    # ==========================

    for city in ACCEPTABLE_CITIES:

        if city in location:

            score = 3

            evidence.append(
                f"Located in tier-1 city: {location}"
            )

            return {
                "location_score": score,
                "location_evidence": evidence,
            }

    # ==========================
    # Other Indian City
    # ==========================

    if country in ("india", "in") or "india" in location:

        score = 0

        evidence.append(
            f"Located in India ({location}) — relocation may be needed"
        )

    return {
        "location_score": score,
        "location_evidence": evidence,
    }
