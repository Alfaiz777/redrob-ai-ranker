# Redrob AI Ranker — Dashboard (React Frontend)

React + TypeScript + Vite frontend that visualizes the ranked candidate results.

## What it shows

- **Rankings page** — top-100 candidates with rank, score, title, experience, and flags
- **Candidate detail** — full score breakdown across all 11 signal engines + penalty evidence
- **Analytics page** — score distribution chart, industry breakdown, location spread
- **AI Insights panel** — summary stats from the ranking run

## How to run

The dashboard reads from `output/top_100.json`. Make sure the ranking engine has been run first:

```bash
# From repo root — generate top_100.json
python run.py --input data/candidates.jsonl --out team_AlfaizKureshi.csv

# Start the API server (from repo root)
cd server && npm install && node index.js

# In a second terminal, start the frontend
cd client && npm install && npm run dev
```

Then open `http://localhost:5173`.

## Stack

- React 18 + TypeScript
- Vite (dev server + bundler)
- Tailwind CSS
- Node.js + Express API (`../server/`)
