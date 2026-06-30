# Redrob AI Ranker

Evidence-based candidate ranking engine for the **India Runs Data & AI Challenge** (Redrob × Hack2Skill).

Ranks 100,000 candidates against a job description using a multi-signal scoring engine — no LLM calls, no GPU, runs in under 30 seconds on a standard CPU machine.

> **Development note:** The code was built iteratively in a local working directory over the course of the hackathon — disqualifier first, then each scoring engine one at a time, then the behavioral multiplier, then penalties, then the parallel pipeline. The submission repo was assembled from that working directory as a clean copy, which is why the initial commit contains the full codebase. Subsequent commits reflect real fixes discovered during submission preparation (sandbox re-run bug, README inaccuracies, format spec compliance). Claude Code was used as a development partner throughout; declared in `submission_metadata.yaml`.

---

## Reproduce the submission

This is the single command that produces the submission CSV from the candidates file:

```bash
python run.py --input data/candidates.jsonl --out team_AlfaizKureshi.csv
```

**What it does:**
1. Runs the multi-signal scoring engine across all 100K candidates (parallel, CPU-only)
2. Saves ranked results to `output/top_100.json`
3. Generates `team_AlfaizKureshi.csv` with normalized scores and per-candidate reasoning

**Expected runtime:** ~25 seconds on an 8-core CPU  
**Memory:** ~1.5 GB RAM  
**No GPU required. No network calls during ranking.**

---

## Setup

**Requirements:** Python 3.9+

```bash
# 1. Clone the repo
git clone https://github.com/Alfaiz777/redrob-ai-ranker.git
cd redrob-ai-ranker

# 2. Install dependencies
pip install -r requirements.txt

# 3. Place the candidates file
cp /path/to/candidates.jsonl data/candidates.jsonl

# 4. Run
python run.py --input data/candidates.jsonl --out team_AlfaizKureshi.csv
```

---

## Project structure

```
redrob-ai-ranker/
│
├── run.py                      # Single entry point — reproduces team_AlfaizKureshi.csv
├── team_AlfaizKureshi.csv      # Pre-generated submission CSV (reproducible output)
├── team_AlfaizKureshi.xlsx     # Submission file in XLSX format (required by organizers)
├── submission_metadata.yaml    # Team info, compute specs, AI usage declaration
├── sandbox_demo.ipynb          # Colab sandbox — runs pipeline on 50-candidate sample
├── requirements.txt
│
├── src/
│   ├── rank.py                 # Ranking pipeline (parallel processing, file-slice mode)
│   ├── normalize/
│   │   └── profiler.py         # Extracts career_text + structured fields from raw JSON
│   └── scoring/
│       ├── orchestrator.py     # Combines all signal scores into final_score
│       ├── features.py         # Career evidence buckets (retrieval, ranking, search, ...)
│       ├── career_coherence.py # Title alignment with target role
│       ├── experience.py       # Years in the JD's preferred range
│       ├── tenure.py           # Avg role duration — rewards stability
│       ├── product_company.py  # Product company vs consulting
│       ├── ranking_systems.py  # Advanced LTR signals (XGBoost, offline-online)
│       ├── career_trajectory.py# Career direction toward ML/search roles
│       ├── skill_credibility.py# Platform assessments + endorsements
│       ├── evidence_density.py # Ownership verbs + scale signals in descriptions
│       ├── location.py         # Pune/Noida preferred; outside India = reducer
│       ├── industry.py         # E-commerce/AI industries score higher
│       ├── behavioral.py       # Availability multiplier (open-to-work, response rate, ...)
│       ├── penalties.py        # Consulting-only, keyword stuffing, LLM-only, pure research
│       └── disqualifier.py     # Hard pre-filter: non-technical titles, empty profiles
│
├── scripts/
│   └── generate_submission.py  # Converts top_100.json → team_AlfaizKureshi.csv with reasoning
│
├── explain/
│   └── generator.py            # Evidence snippet extraction + template reasoning
│
├── output/
│   └── top_100.json            # Pre-ranked results (used by dashboard)
│
├── data/
│   └── sample_candidates.json  # 50-candidate sample for sandbox demo
│                               # (candidates.jsonl is gitignored — competition dataset)
│
├── analysis/
│   └── jd_notes.md             # Full JD analysis — signals, weights, disqualifiers
│
├── tests/                      # pytest test suite
│
└── client/ + server/           # React dashboard + Node.js API (visualizes top_100.json)
```

---

## How the scoring works

Every candidate goes through a 4-step funnel:

### Step 1 — Hard disqualify (instant reject)
Non-technical titles (Marketing Manager, HR, Accountant) and profiles with no technical signals are rejected before any scoring runs. ~40,000 of 100K candidates are filtered here.

### Step 2 — Base score (11 signal engines)

The system builds `career_text` from each candidate's **headline + profile summary + job descriptions** (NOT the skills list — to avoid keyword stuffing). It then scores 11 signals:

| Signal | Max pts | What it measures |
|---|---|---|
| Feature score | 100 | Career evidence: retrieval, ranking, recommendation, search, embeddings, evaluation, production ML |
| Career coherence | 40 | Title alignment — Search Engineer > Data Scientist > Analyst |
| Experience | 20 | 5–9 years is the JD sweet spot |
| Product company | 15 | Google/Flipkart/Zomato vs TCS/Infosys |
| Ranking systems | 30 | Advanced LTR: XGBoost, offline-online correlation |
| Trajectory | 25 | Career moving toward ML/search over time |
| Skill credibility | 20 | Platform assessments + endorsements on JD-relevant skills |
| Evidence density | 6 | Built/shipped/scaled language vs passive mentions |
| Location | 8 | Pune/Noida = +8, outside India = −8 |
| Industry | 15 | E-commerce/AI > manufacturing/pharma |
| Tenure | varies | Avg role duration — rewards stability |

### Step 3 — Multiply by availability

The JD explicitly requires availability to **multiply** the score (not add to it), so an unreachable candidate ranks lower even if technically perfect:

```
final_score = base_score × availability_mult
```

`availability_mult` starts at 1.0 and shifts based on: open-to-work flag, recruiter response rate, notice period, interview completion rate, offer acceptance rate, last-active date. Clamped to [0.50, 1.30].

### Step 4 — Subtract penalties

| Penalty | Pts | Trigger |
|---|---|---|
| Keyword stuffing | −40 | Non-AI title + 4+ AI keywords in descriptions |
| Title/career mismatch | −25 | Non-AI title + 3+ AI keywords |
| Wrong AI domain | −25 | CV/speech background without NLP/IR |
| LLM-only profile | −20 | LangChain/GPT-4 only, no pre-LLM production ML |
| Consulting-only | −15 | All employers are TCS/Infosys/Wipro/etc. |
| Pure research | −15 | PhD/arxiv profile, no production evidence |
| Job hopping | −10 | 6+ unique companies |

### Final formula

```
total_score = (base_score × availability_mult) − penalties
```

---

## Compute constraints compliance

| Constraint | Limit | Our system |
|---|---|---|
| Runtime | ≤ 5 min | ~25 sec (parallel, 8 cores) |
| Memory | ≤ 16 GB | ~1.5 GB |
| Compute | CPU only | Pure Python + regex, no GPU |
| Network | Off | Zero external API calls during ranking |

The ranking engine uses only Python standard library + `re` for scoring. No LLM calls, no embedding lookups during the ranking step.

---

## Tests

```bash
pytest tests/ -v
```

---

## Dashboard (local visualization)

A React + TypeScript + Node.js dashboard visualizes the ranked results locally.

```bash
# Start the API server
cd server && npm install && node index.js

# In a second terminal, start the frontend
cd client && npm install && npm run dev
```

Then open `http://localhost:5173`.

The dashboard reads from `output/top_100.json`. Run `python run.py` first if that file doesn't exist.

### What each page shows

**Dashboard** — overview of the full ranking run
- 4 stat cards: total candidates processed (100K), candidates ranked, disqualified count, average score across top 100
- Score distribution bar chart: how the top-100 scores spread across ranges
- AI Insights panel: top candidate score, most common title, top source company, average experience, how many candidates in the top 100 were penalised
- Top 5 candidates table with rank, title, experience, company, score — click any row to go to their detail page
- Three progress-bar lists at the bottom: Top Source Companies, Top Candidate Titles, Experience Distribution

**Rankings** — full sortable and filterable table of all 100 candidates
- Filters: search by name or ID, dropdown for title, dropdown for company, score slider (≥ threshold), experience slider (≤ years) — active filters shown as chips
- Each row shows: rank badge (gold/silver/bronze for top 3), candidate ID/name, title, experience, top company, score badge, status icons (bolt = top scorer, warning = has flags)
- Bookmark icon on each row to shortlist a candidate
- Right sidebar: live AI Insights panel that updates as filters change, Shortlist panel showing bookmarked candidates with export button
- Export All button downloads a CSV of the ranked results

**Candidate Detail** — deep dive into a single candidate
- Left panel: identity card (name, headline, location, companies, availability signals — notice period, work mode, expected CTC, open-to-work, willing to relocate), Score Composition showing the formula (base score × availability multiplier − penalty = final), skills with proficiency levels (advanced/intermediate/beginner), education and certifications, detected evidence signals, ranking signals progress bars (8 signals with score/max and % fill)
- Right panel: animated score ring showing the final score, AI Rationale with bullet-point evidence (why they ranked here), professional summary, career history timeline (role, company, duration, description), verifiable evidence snippets (specific keywords found in career text), risk and penalty signals (what was flagged and how many points deducted)
- Export Report and Add to Shortlist buttons in the header and sticky bottom bar

**Analytics** — talent intelligence view of the full ranked pool
- 4 KPI cards: total candidates, candidates ranked, disqualified, average ranking score
- Score distribution histogram (full width, hover to see count per range)
- Pool Summary card: average experience, most common title, top source company, penalised count, total ranked
- Top Candidate Titles bar chart (top 7 titles in the ranked pool)
- Top Source Companies bar chart with company initials and counts
- Experience Spread area chart (smooth SVG curve showing experience distribution across top 100)
- Export Report button generates a PDF analytics report
