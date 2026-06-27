from src.scoring.features import (
    score_candidate_features
)

from src.scoring.behavioral import (
    calculate_availability_multiplier
)

from src.scoring.penalties import (
    calculate_penalties
)

from src.scoring.career_coherence import (
    calculate_career_coherence
)

from src.scoring.experience import (
    calculate_experience_alignment
)

from src.scoring.tenure import (
    calculate_tenure_score
)

from src.scoring.product_company import (
    calculate_product_company_bonus
)

from src.scoring.ranking_systems import (
    calculate_ranking_systems_score
)

from src.scoring.career_trajectory import (
    calculate_career_trajectory
)

from src.scoring.skill_credibility import (
    calculate_skill_credibility
)

from src.scoring.evidence_density import (
    calculate_evidence_density
)

from src.scoring.location import (
    calculate_location_score
)

from src.scoring.industry import (
    calculate_industry_score
)


def score_candidate(candidate):

    # ==========================
    # Feature Engine
    # Career keyword evidence — what domains the candidate has worked in
    # ==========================

    feature_result = (
        score_candidate_features(
            candidate
        )
    )

    # ==========================
    # Career Coherence Engine
    # Do the job titles align with the target role?
    # ==========================

    career_result = (
        calculate_career_coherence(
            candidate
        )
    )

    # ==========================
    # Experience Engine
    # Is the total years of experience in the JD's preferred range?
    # ==========================

    experience_result = (
        calculate_experience_alignment(
            candidate
        )
    )

    # ==========================
    # Tenure Engine
    # Average duration per role — rewards stability, notes job-hopping
    # ==========================

    tenure_result = (
        calculate_tenure_score(
            candidate
        )
    )

    # ==========================
    # Product Company Engine
    # Did they work at a product company, not just consulting?
    # ==========================

    product_result = (
        calculate_product_company_bonus(
            candidate
        )
    )

    # ==========================
    # Ranking Systems Engine
    # Advanced evaluation depth: LTR tools, offline-online correlation
    # ==========================

    ranking_systems_result = (
        calculate_ranking_systems_score(
            candidate
        )
    )

    # ==========================
    # Career Trajectory Engine
    # Which direction did the career move? Toward or away from the role?
    # ==========================

    trajectory_result = (
        calculate_career_trajectory(
            candidate
        )
    )

    # ==========================
    # Skill Credibility Engine
    # Platform assessment scores + endorsement quality on JD-relevant skills
    # ==========================

    skill_credibility_result = (
        calculate_skill_credibility(
            candidate
        )
    )

    # ==========================
    # Evidence Density Engine
    # Did the candidate BUILD things (ownership verbs + scale) vs just mention them?
    # ==========================

    evidence_density_result = (
        calculate_evidence_density(
            candidate
        )
    )

    # ==========================
    # Location Engine
    # Pune/Noida preferred per JD; outside India = score reducer
    # ==========================

    location_result = (
        calculate_location_score(
            candidate
        )
    )

    # ==========================
    # Industry Relevance Engine
    # E-commerce/AI/ML industries score higher; manufacturing/pharma score lower
    # ==========================

    industry_result = (
        calculate_industry_score(
            candidate
        )
    )

    # ==========================
    # Behavioral Engine
    # Availability multiplier: open-to-work, response rate, interview/offer rates
    # ==========================

    behavioral_result = (
        calculate_availability_multiplier(
            candidate["behavior_signals"]
        )
    )

    # ==========================
    # Penalty Engine
    # Consulting-only, keyword stuffing, non-NLP domain, LLM-only, pure research
    # ==========================

    penalty_result = (
        calculate_penalties(
            candidate
        )
    )

    # ==========================
    # Extract Scores
    # ==========================

    feature_score = feature_result["career_score"]

    career_coherence_score = career_result["career_coherence_score"]

    experience_score = experience_result["experience_score"]

    tenure_score = tenure_result["tenure_score"]

    product_bonus_score = product_result["product_bonus_score"]

    ranking_systems_score = ranking_systems_result["ranking_systems_score"]

    trajectory_score = trajectory_result["trajectory_score"]

    skill_credibility_score = skill_credibility_result["skill_credibility_score"]

    evidence_density_score = evidence_density_result["evidence_density_score"]

    location_score = location_result["location_score"]

    industry_score = industry_result["industry_score"]

    availability_multiplier = behavioral_result["availability_multiplier"]

    penalty_score = penalty_result["penalty_score"]

    # ==========================
    # Base Score
    # Sum of all positive scoring engines
    # ==========================

    base_score = (

        feature_score

        + career_coherence_score

        + experience_score

        + tenure_score

        + product_bonus_score

        + ranking_systems_score

        + trajectory_score

        + skill_credibility_score

        + evidence_density_score

        + location_score

        + industry_score

    )

    # ==========================
    # Final Score
    # Multiply by availability (behavioral), then subtract penalties
    # ==========================

    final_score = (
        base_score * availability_multiplier
    ) - penalty_score

    # ==========================
    # Return
    # ==========================

    return {

        "candidate_id":
            candidate["candidate_id"],

        "title":
            candidate["title"],

        "experience":
            candidate["experience"],

        "companies":
            candidate["companies"],

        "industries":
            candidate["industries"],

        "job_titles":
            candidate["job_titles"],

        # ==========================
        # Scores
        # ==========================

        "career_score":
            feature_score,

        "career_coherence_score":
            career_coherence_score,

        "experience_score":
            experience_score,

        "tenure_score":
            tenure_score,

        "product_bonus_score":
            product_bonus_score,

        "ranking_systems_score":
            ranking_systems_score,

        "trajectory_score":
            trajectory_score,

        "skill_credibility_score":
            skill_credibility_score,

        "evidence_density_score":
            evidence_density_score,

        "location_score":
            location_score,

        "industry_score":
            industry_score,

        "availability_multiplier":
            availability_multiplier,

        "penalty_score":
            penalty_score,

        "base_score":
            round(base_score, 2),

        "final_score":
            round(final_score, 2),

        # ==========================
        # Explainability
        # ==========================

        "career_evidence":
            feature_result["career_evidence"],

        "career_coherence_evidence":
            career_result["career_coherence_evidence"],

        "experience_evidence":
            experience_result["experience_evidence"],

        "tenure_evidence":
            tenure_result["tenure_evidence"],

        "product_bonus_evidence":
            product_result["product_bonus_evidence"],

        "ranking_systems_evidence":
            ranking_systems_result["ranking_systems_evidence"],

        "trajectory_evidence":
            trajectory_result["trajectory_evidence"],

        "skill_credibility_evidence":
            skill_credibility_result["skill_credibility_evidence"],

        "evidence_density_evidence":
            evidence_density_result["evidence_density_evidence"],

        "location_evidence":
            location_result["location_evidence"],

        "industry_evidence":
            industry_result["industry_evidence"],

        "behavior_evidence":
            behavioral_result["behavior_evidence"],

        "penalty_evidence":
            penalty_result["penalty_evidence"],
    }
