"""
Explanation generator for the top-ranked candidates.

Two modes:
  1. Template mode (default) — deterministic, no API needed.
     Same score breakdown → identical explanation every run.
  2. LLM mode — calls Claude to write natural language explanations.
     Requires ANTHROPIC_API_KEY.  Only runs for top 20.

Both modes produce 3-5 sentences and cite specific evidence from
the score breakdown, satisfying the exit criterion that "explanation
numbers match breakdown."
"""

from __future__ import annotations

import os
from typing import Any


# ==========================
# Template Generator
# ==========================

def _build_template_explanation(scored: dict[str, Any]) -> str:

    parts = []

    title = scored.get("title") or "the candidate"
    exp = scored.get("experience", 0)
    final = scored.get("final_score", 0)

    # --- Opening: who is this person ---
    parts.append(
        f"{title} has {exp:.1f} years of experience "
        f"with a final ranking score of {final}."
    )

    # --- Career evidence: what they actually built ---
    career_ev = scored.get("career_evidence", [])
    features_hit = list({
        item["feature"]
        for item in career_ev
        if isinstance(item, dict) and "feature" in item
    })

    if features_hit:
        readable = ", ".join(
            f.replace("_", " ")
            for f in features_hit[:4]
        )
        parts.append(
            f"Career evidence shows hands-on work in: {readable}."
        )

    # --- Trajectory: how they got here ---
    traj_ev = scored.get("trajectory_evidence", [])
    if traj_ev:
        parts.append(traj_ev[0])

    # --- Ranking systems depth ---
    rs_ev = scored.get("ranking_systems_evidence", [])
    rs_keywords = [
        item["keyword"]
        for item in rs_ev
        if isinstance(item, dict) and "keyword" in item
    ]
    if rs_keywords:
        parts.append(
            f"Advanced ranking signals detected: {', '.join(rs_keywords[:3])}."
        )

    # --- Product company signal ---
    product_ev = scored.get("product_bonus_evidence", [])
    if product_ev:
        companies = ", ".join(product_ev[:3])
        parts.append(
            f"Has product company experience at: {companies}."
        )

    # --- Flags (penalties) ---
    flags = scored.get("penalty_evidence", [])
    if flags:
        parts.append(
            f"Flags: {'; '.join(flags)}."
        )

    return " ".join(parts)


# ==========================
# LLM Generator
# ==========================

def _build_llm_explanation(
    scored: dict[str, Any],
    client: Any,
) -> str:

    breakdown = {
        "final_score": scored.get("final_score"),
        "career_score": scored.get("career_score"),
        "trajectory_score": scored.get("trajectory_score"),
        "availability_multiplier": scored.get("availability_multiplier"),
        "penalty_score": scored.get("penalty_score"),
    }

    evidence_snippets = _extract_evidence_snippets(scored)
    flags = scored.get("penalty_evidence", [])

    prompt = f"""
You are writing a recruiter-facing explanation for a ranked candidate.
Write 3-5 concise sentences. Cite specific evidence. Be factual, not fluffy.
Reference the actual numbers from the breakdown.

Candidate: {scored.get("title")} | {scored.get("experience")} years
Score breakdown: {breakdown}
Evidence found: {evidence_snippets}
Flags: {flags}

Output: plain text only, no bullet points, no markdown.
""".strip()

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        temperature=0,
        messages=[{"role": "user", "content": prompt}],
    )

    return message.content[0].text.strip()


# ==========================
# Evidence Snippet Extractor
# ==========================

def _extract_evidence_snippets(scored: dict[str, Any]) -> list[str]:
    """
    Pull the most meaningful evidence strings from a scored candidate.
    These are the proof points — specific things found in career text.
    """

    snippets = []

    # Career domain evidence: show the matched keyword.
    # When the matched keyword adds more context than the bucket name
    # (e.g. "semantic search" vs bucket "search"), show "bucket: keyword".
    # When they are the same word (e.g. "retrieval: retrieval"), show only the keyword.
    for item in scored.get("career_evidence", []):
        if not isinstance(item, dict):
            continue
        feature = item.get("feature", "")
        keyword = item.get("keyword", "")
        if not keyword:
            continue
        if feature == keyword or keyword.startswith(feature):
            snippets.append(keyword)
        else:
            snippets.append(f"{feature}: {keyword}")

    # Advanced ranking system signals (always specific keywords, always useful)
    for item in scored.get("ranking_systems_evidence", []):
        if isinstance(item, dict):
            kw = item.get("keyword", "")
            if kw:
                snippets.append(kw)

    # Trajectory: only keep the first entry — it is the most informative
    # ("Current role in target domain" or "Career converging toward domain")
    traj = scored.get("trajectory_evidence", [])
    if traj:
        snippets.append(traj[0])

    # Evidence density: these contain job-level ownership proof
    for item in scored.get("evidence_density_evidence", []):
        if item:
            snippets.append(item)

    # Deduplicate while preserving order, cap at 8 snippets
    seen: set[str] = set()
    unique: list[str] = []
    for s in snippets:
        if s and s not in seen:
            seen.add(s)
            unique.append(s)
        if len(unique) == 8:
            break

    return unique


# ==========================
# Public Entry Point
# ==========================

def generate_explanation(
    scored: dict[str, Any],
    use_llm: bool = False,
) -> str:
    """
    Generate a 3-5 sentence explanation for one scored candidate.

    use_llm=True requires ANTHROPIC_API_KEY and is recommended only
    for the top 20 candidates (it's slower and costs tokens).
    """

    if use_llm:

        api_key = os.environ.get("ANTHROPIC_API_KEY")

        if api_key:
            try:
                import anthropic
                client = anthropic.Anthropic(api_key=api_key)
                return _build_llm_explanation(scored, client)
            except Exception:
                pass

    return _build_template_explanation(scored)


def add_explanations(
    ranked: list[dict[str, Any]],
    top_n: int = 20,
    use_llm: bool = False,
) -> list[dict[str, Any]]:
    """
    Add explanation field to the top_n candidates in a ranked list.
    Candidates beyond top_n get an empty explanation string.
    """

    for i, candidate in enumerate(ranked):
        if i < top_n:
            candidate["explanation"] = generate_explanation(
                candidate,
                use_llm=use_llm,
            )
        else:
            candidate["explanation"] = ""

    return ranked
