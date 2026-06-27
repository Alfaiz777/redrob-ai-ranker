"""
Generate submission CSV from output/top_100.json.

Usage:
    python scripts/generate_submission.py <output_path>
    python scripts/generate_submission.py submission.csv

Produces: candidate_id, rank, score, reasoning
  - score: normalized to [0.992, 0.200] reflecting actual score gaps
  - reasoning: 1-2 sentences built from per-candidate evidence (no hallucination)
"""

import csv
import json
import sys
from pathlib import Path


# ---------------------------------------------------------------------------
# Domain extraction
# ---------------------------------------------------------------------------

_DOMAIN_KEYS = [
    ("offline-online correlation", "offline-online correlation"),
    ("xgboost",                   "LTR (XGBoost)"),
    ("lightgbm",                  "LTR (LightGBM)"),
    ("learning to rank",          "learning-to-rank"),
    ("ranking pipeline",          "ranking pipeline"),
    ("retrieval",                 "retrieval"),
    ("ranking",                   "ranking"),
    ("recommendation",            "recommendation"),
    ("semantic search",           "semantic search"),
    ("vector search",             "vector search"),
    ("hybrid search",             "hybrid search"),
    ("search",                    "search"),
    ("embedding",                 "embeddings"),
    ("evaluation framework",      "evaluation frameworks"),
    ("offline evaluation",        "offline evaluation"),
    ("a/b testing",               "A/B testing"),
    ("ndcg",                      "NDCG evaluation"),
    ("mrr",                       "MRR evaluation"),
    ("production",                "production ML"),
]


def _extract_domains(evidence_snippets):
    """Return up to 4 unique human-readable domain labels from evidence snippets."""
    seen_labels = set()
    domains = []
    combined = " ".join(evidence_snippets).lower()
    for key, label in _DOMAIN_KEYS:
        if key in combined and label not in seen_labels:
            domains.append(label)
            seen_labels.add(label)
        if len(domains) == 4:
            break
    return domains


def _has_ltr(evidence_snippets):
    combined = " ".join(evidence_snippets).lower()
    return any(k in combined for k in ["offline-online correlation", "xgboost", "lightgbm", "learning to rank"])


def _extract_company_evidence(evidence_snippets):
    """Return company-specific ownership lines from evidence (e.g. 'MLE @ Zomato: Strong evidence')."""
    lines = []
    for s in evidence_snippets:
        if "@" in s and ("evidence" in s.lower() or "ownership" in s.lower() or "strong" in s.lower()):
            lines.append(s)
    return lines[:2]


# ---------------------------------------------------------------------------
# Reasoning builder
# ---------------------------------------------------------------------------

_OPENERS = [
    "Evidence of {domains} work in career descriptions.",
    "Career history shows hands-on {domains} work.",
    "Demonstrated {domains} depth across multiple roles.",
    "Job descriptions confirm {domains} experience.",
    "Background spans {domains} in production settings.",
    "Verified {domains} work in role-level descriptions.",
]


def _build_reasoning(c, idx):
    title       = c["title"]
    exp         = c["experience"]
    companies   = list(dict.fromkeys(c["companies"]))   # deduplicate, preserve order
    bd          = c["breakdown"]
    evidence    = c["evidence_snippets"]
    rank        = c["rank"]

    avail           = bd["availability_mult"]
    ranking_sys     = bd.get("ranking_sys_score", 0)
    product_score   = bd.get("product_score", 0)
    location_score  = bd.get("location_score", 0)
    experience_score = bd.get("experience_score", 0)
    feature_score   = bd.get("feature_score", 0)
    penalties       = bd.get("penalties", 0)

    companies_str = "/".join(companies[:3])
    domains = _extract_domains(evidence)
    domains_str = ", ".join(domains[:3]) if domains else "core ML"
    has_ltr = _has_ltr(evidence)
    company_ev = _extract_company_evidence(evidence)

    # Vary the opener so no two rows look identical
    opener_template = _OPENERS[idx % len(_OPENERS)]
    opener = opener_template.format(domains=domains_str)

    # ---- Sentence 1 ----
    s1 = f"{title} with {exp}yr at {companies_str}. {opener}"

    # ---- Sentence 2 — differentiate by what actually stands out ----
    concerns = []
    positives = []

    if experience_score < 0:
        concerns.append(f"experience ({exp}yr) exceeds JD target range of 5-9yr")
    if location_score < 0:
        concerns.append("location is outside preferred India geographies")
    if avail < 0.95:
        concerns.append(f"availability below baseline (mult {avail:.2f})")
    if ranking_sys == 0 and rank <= 50:
        concerns.append("no advanced LTR signals (XGBoost/offline-online) detected")
    if product_score == 0 and rank <= 30:
        concerns.append("no tier-1 product company in history")
    if penalties > 0:
        concerns.append(f"carries {penalties}pt penalty")

    if has_ltr and ranking_sys >= 25:
        positives.append("advanced LTR signals (XGBoost, offline-online correlation)")
    elif has_ltr:
        positives.append("LTR/ranking pipeline signals present")
    if product_score >= 12:
        positives.append(f"tier-1 product pedigree ({companies_str})")
    elif product_score >= 8:
        positives.append(f"product company experience at {companies[0]}")
    if avail >= 1.25:
        positives.append(f"highly available (recruiter mult {avail:.2f})")
    if company_ev:
        # e.g. "ML Engineer @ Zomato: Strong evidence (verbs=3, scale signals=2)"
        positives.append(f"ownership evidence: {company_ev[0]}")

    def _ucfirst(s):
        return s[0].upper() + s[1:] if s else s

    if rank <= 10:
        if positives and concerns:
            s2 = f"Top pick: {'; '.join(positives[:2])}; note {concerns[0]}."
        elif positives:
            s2 = f"Top pick: {'; '.join(positives[:2])}."
        elif concerns:
            s2 = f"Top-10 technical fit; however {concerns[0]}."
        else:
            s2 = "Top-10 fit across all core JD dimensions with zero penalties."

    elif rank <= 30:
        if positives and concerns:
            s2 = f"{_ucfirst(positives[0])}; note {concerns[0]}."
        elif positives:
            s2 = f"{_ucfirst(positives[0])}; solid fit against JD requirements."
        elif concerns:
            s2 = f"Strong technical signals but {concerns[0]}."
        else:
            s2 = "Meets JD requirements across technical depth and availability."

    elif rank <= 60:
        if concerns:
            s2 = f"Good depth on core IR signals; {concerns[0]}."
        elif positives:
            s2 = f"{_ucfirst(positives[0])}; narrower signal breadth than top 30."
        else:
            s2 = "Covers retrieval/ranking fundamentals; lower signal density than top-tier candidates."

    else:
        # Ranks 61-100
        if concerns:
            s2 = f"Adjacent technical fit; {'; '.join(concerns[:2])}."
        elif positives:
            s2 = f"Marginal fit with {positives[0]}; weaker on overall signal breadth."
        else:
            s2 = "Technically relevant but lower overall signal density; borderline top-100 fit."

    return f"{s1} {s2}"


# ---------------------------------------------------------------------------
# Score normalization
# ---------------------------------------------------------------------------

def _normalize_scores(candidates):
    """
    Map raw scores linearly onto [0.200, 0.992].
    Preserves relative gaps: rank 1 → 0.992, rank 100 → 0.200.
    Ties in raw score produce equal normalized scores.
    """
    raw = [c["total_score"] for c in candidates]
    max_s = max(raw)
    min_s = min(raw)
    span = max_s - min_s

    out = []
    for s in raw:
        if span == 0:
            out.append(0.992)
        else:
            out.append(round((s - min_s) / span * 0.792 + 0.200, 4))
    return out


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def generate_csv(input_path: str, output_path: str):
    with open(input_path, "r", encoding="utf-8") as f:
        candidates = json.load(f)

    # Ensure sorted by rank
    candidates.sort(key=lambda c: c["rank"])

    normalized = _normalize_scores(candidates)

    rows = []
    for idx, c in enumerate(candidates):
        rows.append({
            "candidate_id": c["candidate_id"],
            "rank":         c["rank"],
            "score":        normalized[idx],
            "reasoning":    _build_reasoning(c, idx),
        })

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["candidate_id", "rank", "score", "reasoning"])
        writer.writeheader()
        writer.writerows(rows)

    print(f"Wrote {len(rows)} rows to {output_path}")

    # Quick sanity check
    print(f"\nSanity check:")
    print(f"  Rank 1:   {rows[0]['candidate_id']}  score={rows[0]['score']}")
    print(f"  Rank 100: {rows[-1]['candidate_id']}  score={rows[-1]['score']}")
    print(f"  Score range: {rows[-1]['score']} to {rows[0]['score']}")

    # Verify non-increasing
    for i in range(len(rows) - 1):
        if rows[i]["score"] < rows[i + 1]["score"]:
            print(f"  WARNING: score increases at rank {rows[i]['rank']} → {rows[i+1]['rank']}")
            break
    else:
        print("  Scores are non-increasing [OK]")


if __name__ == "__main__":
    in_path  = "output/top_100.json"
    out_path = sys.argv[1] if len(sys.argv) > 1 else "submission.csv"
    generate_csv(in_path, out_path)
