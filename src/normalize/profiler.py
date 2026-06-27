def extract_candidate_features(candidate):

    profile = candidate.get("profile", {})

    # ==========================
    # Basic Info
    # ==========================

    candidate_id = candidate.get("candidate_id")

    title = profile.get("current_title")

    experience = profile.get("years_of_experience")

    headline = profile.get("headline", "")

    summary = profile.get("summary", "")

    # ==========================
    # Location
    # ==========================

    location = profile.get("location", "")

    country = profile.get("country", "")

    # ==========================
    # Skills
    # ==========================

    skills = candidate.get("skills", [])

    skill_names = []

    # Full skill objects kept for credibility engine
    skills_detail = []

    for skill in skills:
        skill_names.append(skill.get("name"))
        skills_detail.append({
            "name": skill.get("name", ""),
            "proficiency": skill.get("proficiency", ""),
            "endorsements": skill.get("endorsements", 0),
            "duration_months": skill.get("duration_months", 0),
        })

    # ==========================
    # Career History
    # ==========================

    career_history = candidate.get("career_history", [])

    companies = []
    job_titles = []
    industries = []

    for job in career_history:

        companies.append(
            job.get("company")
        )

        job_titles.append(
            job.get("title")
        )

        industries.append(
            job.get("industry")
        )

    # ==========================
    # Career Text
    # ==========================

    career_text = ""

    career_text += (
        profile.get("headline", "")
        + " "
    )

    career_text += (
        profile.get("summary", "")
        + " "
    )

    for job in career_history:

        career_text += (
            job.get("description", "")
            + " "
        )

    # ==========================
    # Behavioral Signals
    # ==========================

    behavior_signals = candidate.get(
        "redrob_signals",
        {}
    )

    # ==========================
    # Structured Candidate
    # ==========================

    return {
        "candidate_id": candidate_id,
        "title": title,
        "experience": experience,
        "headline": headline,
        "summary": summary,
        "location": location,
        "country": country,
        "skills": skill_names,
        "skills_detail": skills_detail,
        "companies": companies,
        "job_titles": job_titles,
        "industries": industries,
        "career_text": career_text,
        "behavior_signals": behavior_signals,
        "career_history": career_history,
    }
