AI_RELEVANT_TITLES = [

    "ai engineer",
    "machine learning engineer",
    "ml engineer",
    "search engineer",
    "recommendation systems engineer",
    "nlp engineer",
    "applied scientist",
    "data scientist",
    "research engineer",
    "information retrieval engineer",

]


def calculate_career_coherence(candidate):

    score = 0

    evidence = []

    current_title = (
        candidate["title"]
        .lower()
    )

    job_titles = [

        title.lower()

        for title in candidate.get(
            "job_titles",
            []
        )

        if title
    ]

    all_titles = [
        current_title,
        *job_titles
    ]

    for title in all_titles:

        for ai_title in AI_RELEVANT_TITLES:

            if ai_title in title:

                score += 10

                evidence.append(
                    title
                )

                break

    score = min(score, 40)

    return {

        "career_coherence_score":
            score,

        "career_coherence_evidence":
            list(
                set(evidence)
            )
    }