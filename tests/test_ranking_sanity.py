import pytest


def test_anchor_candidate_ranks_top_three(sample_by_id):
    """CAND_0000031 (RecSys @ Swiggy) should land in top 3 once scoring exists."""
    from src.rank import rank_candidates

    ranked = rank_candidates("data/sample_candidates.json", top_n=50)
    top_ids = [row["candidate_id"] for row in ranked[:3]]
    assert "CAND_0000031" in top_ids


def test_incoherent_profiles_rank_low(sample_by_id):
    """Marketing Manager + mismatched history should not appear in top 75% of results.

    Acceptable outcomes:
    - Disqualified at the pre-filter stage (not in ranked list at all), OR
    - Ranked in the bottom 25%
    Either means the engine correctly deprioritised them.
    """
    from src.rank import rank_candidates

    ranked = rank_candidates("data/sample_candidates.json", top_n=50)
    n = len(ranked)

    # IDs that made it into the top 75% of the ranked list
    top_three_quarters = {row["candidate_id"] for row in ranked[: int(n * 0.75)]}

    traps = [
        cid
        for cid, raw in sample_by_id.items()
        if raw["profile"].get("current_title") == "Marketing Manager"
    ]
    assert traps, "Expected at least one Marketing Manager trap in sample data"

    # No Marketing Manager should appear in the top 75% of results
    assert not any(cid in top_three_quarters for cid in traps)


def test_unreachable_candidate_beats_perfect_paper_only_match():
    """High feature score but inactive/low response should lose to reachable fits."""
    pass
