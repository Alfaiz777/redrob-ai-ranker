import json

from src.normalize.profiler import (
    extract_candidate_features
)

from src.scoring.orchestrator import (
    score_candidate
)


def get_candidate_by_id(
    target_id
):

    with open(
        "data/candidates.jsonl",
        "r",
        encoding="utf-8"
    ) as file:

        for line in file:

            candidate = json.loads(line)

            if (
                candidate["candidate_id"]
                == target_id
            ):
                return candidate

    return None


candidate = get_candidate_by_id(
    "CAND_0000031"
)

profiled_candidate = (
    extract_candidate_features(
        candidate
    )
)

result = score_candidate(
    profiled_candidate
)

print(
    "\n=============================="
)

print(
    " FINAL SCORE BREAKDOWN "
)

print(
    "==============================\n"
)

print(
    "Candidate:",
    result["candidate_id"]
)

print(
    "Title:",
    result["title"]
)

print(
    "Experience:",
    result["experience"]
)

print(
    "\n=== SCORE COMPONENTS ==="
)

print(
    "Career Score:",
    result["career_score"]
)

print(
    "Career Coherence Score:",
    result["career_coherence_score"]
)

print(
    "Experience Score:",
    result["experience_score"]
)

print(
    "Tenure Score:",
    result["tenure_score"]
)

print(
    "Product Bonus Score:",
    result["product_bonus_score"]
)

print(
    "Ranking Systems Score:",
    result["ranking_systems_score"]
)

print(
    "Trajectory Score:",
    result["trajectory_score"]
)

print(
    "Skill Credibility Score:",
    result["skill_credibility_score"]
)

print(
    "Evidence Density Score:",
    result["evidence_density_score"]
)

print(
    "Location Score:",
    result["location_score"]
)

print(
    "Industry Score:",
    result["industry_score"]
)

print(
    "\nBase Score:",
    result["base_score"]
)

print(
    "Availability Multiplier:",
    result["availability_multiplier"]
)

print(
    "Penalty Score:",
    result["penalty_score"]
)

print(
    "\nFinal Score:",
    result["final_score"]
)

# ==================================
# Evidence Sections
# ==================================

print(
    "\n=== CAREER EVIDENCE ==="
)

for item in result[
    "career_evidence"
]:
    print(item)

print(
    "\n=== CAREER COHERENCE EVIDENCE ==="
)

for item in result[
    "career_coherence_evidence"
]:
    print("✓", item)

print(
    "\n=== EXPERIENCE EVIDENCE ==="
)

for item in result[
    "experience_evidence"
]:
    print("✓", item)

print(
    "\n=== TENURE EVIDENCE ==="
)

for item in result[
    "tenure_evidence"
]:
    print("✓", item)

print(
    "\n=== PRODUCT COMPANY EVIDENCE ==="
)

for item in result[
    "product_bonus_evidence"
]:
    print("✓", item)

print(
    "\n=== TRAJECTORY EVIDENCE ==="
)

for item in result["trajectory_evidence"]:
    print("✓", item)

print(
    "\n=== SKILL CREDIBILITY EVIDENCE ==="
)

for item in result["skill_credibility_evidence"]:
    print("✓", item)

print(
    "\n=== EVIDENCE DENSITY EVIDENCE ==="
)

for item in result["evidence_density_evidence"]:
    print("✓", item)

print(
    "\n=== LOCATION EVIDENCE ==="
)

for item in result["location_evidence"]:
    print("✓", item)

print(
    "\n=== INDUSTRY EVIDENCE ==="
)

for item in result["industry_evidence"]:
    print("✓", item)

print(
    "\n=== BEHAVIOR EVIDENCE ==="
)

for item in result[
    "behavior_evidence"
]:
    print("✓", item)

print(
    "\n=== PENALTY EVIDENCE ==="
)

if result[
    "penalty_evidence"
]:

    for item in result[
        "penalty_evidence"
    ]:
        print("✗", item)

else:
    print("No penalties")

print(
    "\n=== RANKING SYSTEMS EVIDENCE ==="
)

for item in result[
    "ranking_systems_evidence"
]:
    print(item)
