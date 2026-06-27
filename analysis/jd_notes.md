# JD Analysis — Senior AI Engineer, Founding Team (Redrob AI)

Source: actual uploaded JD (`job_description.docx`), not secondhand description. Where earlier notes guessed, this version quotes the JD's own framing directly.

## The Hackathon's Built-In Trap (read this section first)

The JD states outright that keyword-matching is a deliberate trap in the dataset:

- "The right answer to this JD is not 'find candidates whose skills section contains the most AI keywords.'"
- **Hidden-fit case:** a candidate with no listed "RAG" or "Pinecone" keywords but a career history showing they built a recommendation system at a product company **is** a fit.
- **Keyword-stuffing case:** a candidate with every AI keyword in their skills list but a title like "Marketing Manager" is **not** a fit, regardless of how clean the skill list looks.

**Scoring implication:** `feature_score` can't be literal skill-string overlap against the JD's keyword list — that's exactly the trap. It needs to weigh role-title coherence and project/career-history evidence at least as heavily as listed skills. A separate "title-role coherence" check (does the person's actual job title and history match what they claim) should sit in the penalty layer as one of the strongest negative signals in the whole model, not a minor flag.

## Target Profile (JD's own definition, stated directly)

- 6–8 years total experience, of which 4–5 years in applied ML/AI roles at **product** companies, not pure services
- Has shipped at least one end-to-end ranking, search, or recommendation system to real users at meaningful scale
- Has defensible, specific opinions on hybrid vs. dense retrieval, offline vs. online evaluation, and fine-tune vs. prompt — tied to systems they actually built (harder to score from resume text alone; treat as an interview-stage signal more than a parsing-stage one)
- Located in or willing to relocate to Noida or Pune
- Active on the Redrob platform, or otherwise showing clear job-market signal

## Layer 1 — Hard Filters

- Production experience with **embeddings-based retrieval** (sentence-transformers, OpenAI embeddings, BGE, E5, or similar) — specifically evidence of handling embedding drift, index refresh, or retrieval-quality regression in production, not just having used embeddings once
- Production experience with **vector databases or hybrid search infra** (Pinecone, Weaviate, Qdrant, Milvus, OpenSearch, Elasticsearch, FAISS) — the specific tool doesn't matter, operational experience does
- **Strong Python** — explicitly called out as a code-quality requirement, not a checklist item
- Hands-on experience designing **evaluation frameworks for ranking systems** (NDCG, MRR, MAP, offline-to-online correlation, A/B test interpretation)
- 5–9 years experience — stated by the JD itself as a soft range, not a cutoff ("some hit senior judgment at 4 years, some never at 15"); weight this far below the disqualifiers below

## Layer 1B — Explicit Disqualifiers (distinct severity levels, don't treat as equal)

- **Hard, no override stated:** pure research/academic background with zero production deployment. The JD says this twice and explicitly: "we will not move forward."
- **Soft, overridable:** AI experience that's primarily <12-month-old LangChain-to-OpenAI projects — disqualifying _unless_ substantial pre-LLM-era ML production experience can be shown
- **Soft, overridable:** senior title with no production code written in 18+ months due to drifting into architect/tech-lead roles — disqualifying because "this role writes code," but the override condition isn't stated, so treat as a strong but not absolute penalty

## Layer 2 — Core Signals

- Semantic search / information retrieval
- Dense retrieval / hybrid retrieval
- Candidate-JD matching systems, recommendation systems
- NLP / IR exposure generally
- Applied ML/AI experience
- A/B testing experience
- End-to-end ownership of a system, not just a component

## Layer 3 — Behavior (read the multiplier note, it matters)

- Recent platform activity / login recency
- Recruiter response rate
- **Multiplier, not an additive bonus:** the JD says it directly — "a perfect-on-paper candidate who hasn't logged in for 6 months and has a 5% recruiter response rate is, for hiring purposes, not actually available." Model this as a multiplicative dampener on `total_score`, not a small subtracted penalty, or a great-on-paper but unreachable candidate will still rank near the top.
- Average tenure ≥3 years per role — stated explicitly as a requirement tied to the anti-title-chasing filter below, not a generic "stability is nice" signal
- Written communication evidence — the team is explicitly async-first and writing-heavy; weak written communication is a real culture-fit risk per the JD, not a cosmetic preference
- Hands-on coding cadence / recent commits

## Layer 4 — Bonus

- LLM fine-tuning (LoRA, QLoRA, PEFT)
- Learning-to-rank models (XGBoost-based or neural)
- Prior HR-tech, recruiting-tech, or marketplace product exposure
- Distributed systems / large-scale inference optimization background
- Open-source contributions in AI/ML

## Layer 5 — Negative / Penalty Signals

- **AI-keyword-stuffed profile with an incoherent role/title** (e.g. all the right keywords, "Marketing Manager" title) — this is the JD's explicitly stated trap signal and should be one of the strongest penalties in the model, not an afterthought
- Title-chasing: trajectory shows Senior → Staff → Principal via job switches every ~1.5 years
- Framework-tutorial-only GitHub/blog presence — the JD calls this "fine but not what we need," which reads as neutral-to-mildly-negative rather than a hard reject; don't over-penalize this one relative to the keyword-stuffing case above
- Consulting-only **entire** career (TCS, Infosys, Wipro, Accenture, Cognizant, Capgemini) with no product-company experience anywhere in the history — the penalty is cancelled if prior or current product-company experience exists anywhere in the trajectory
- Primary expertise in computer vision, speech, or robotics without significant NLP/IR exposure
- 5+ years entirely on closed-source proprietary systems with zero external validation (no papers, talks, or open-source)

## Location & Logistics Signals (missing from earlier notes entirely)

- Preferred base: Pune or Noida (hybrid, flexible cadence, offices used mainly Tue/Thu)
- Acceptable with relocation: any Tier-1 Indian city explicitly named — Hyderabad, Mumbai, Delhi NCR
- Outside India: case-by-case, and the company does **not** sponsor work visas — treat as a score reducer/flag, not an automatic disqualifier
- Notice period: ≤30 days strongly preferred (buyout available up to 30 days); 30+ day candidates remain in scope but the bar on other signals goes up

## Scoring Implications for the Engine

- Candidate pool is explicitly ~100K profiles, and the JD explicitly prioritizes precision over recall: "we'd rather see 10 great matches than 1000 maybes." Internal ranking should prioritize precision and quality over recall. The system may internally focus on the strongest top 10–20 candidates, but the final hackathon submission must output the top 100 ranked candidates as required by the submission specification, and evaluation should favor precision@k / NDCG over recall-oriented metrics.
- `feature_score` must do role-title and project-history inference, not literal skill-keyword overlap — the dataset is built specifically to punish naive keyword matching.
- `behavioral_score` should multiply `total_score`, not add to it, so an unreachable candidate can't out-rank a reachable, slightly-weaker one.

## Career Trajectory Signals

Career progression should be evaluated as a separate signal rather than being inferred only from years of experience.

Positive examples:

- Backend Engineer → ML Engineer → Senior AI Engineer
- Software Engineer → Search Engineer → Ranking Engineer
- Data Engineer → ML Engineer → AI Engineer

Negative examples:

- Frequent role hopping every ~12–18 months without depth
- No progression in responsibility over time
- Career history inconsistent with claimed expertise

Scoring implication:

- Consistent progression toward retrieval, ranking, search, recommendation, or applied ML roles should increase score.
- Career trajectory should be considered stronger evidence than self-declared skills.
- Average tenure per role should be analyzed alongside progression quality.

## Evidence Signals

- These are the strongest proof-based indicators that a candidate genuinely fits the role. The ranking system should extract these from career history, project descriptions, summaries, and achievements rather than relying on skills alone.
- Examples of evidence:
- Built recommendation systems.
- Built retrieval systems.
- Built ranking pipelines
- Built candidate matching systems
- Built search infrastructure
- Owned relevance tuning
- Designed evaluation frameworks
- Improved search quality metrics
- Deployed production ML systems
- Worked on hybrid retrieval/search systems
- Implemented vector search infrastructure
- Designed recruiter-feedback loops
- Built recommendation engines at scale

Scoring implication:

- Evidence-based experience should carry more weight than keyword presence.
- Candidates should be rewarded for demonstrated system ownership and production impact.
- Explanations generated by the ranking engine should cite these evidence signals directly.
