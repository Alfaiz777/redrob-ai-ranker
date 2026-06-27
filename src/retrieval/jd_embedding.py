"""Target job query used by first-stage semantic retrieval."""

from __future__ import annotations

import numpy as np

from src.retrieval.embedding_model import encode_query

JD_QUERY = """
Find a senior hands-on applied machine-learning engineer with roughly five to
nine years of experience. The strongest candidate has actually designed,
shipped, and operated a production search, recommendation, retrieval, or
learning-to-rank system for real users at a product company. Their career
evidence should show embeddings or hybrid/vector search, ranking evaluation
such as NDCG, MRR or MAP, offline-to-online correlation, A/B testing, Python,
production ownership, and measurable product impact. Relevant roles include
recommendation systems engineer, search engineer, ranking engineer, applied ML
engineer, information retrieval engineer, and NLP engineer.
""".strip()


def create_jd_embedding(query: str = JD_QUERY) -> np.ndarray:
    return encode_query(query)
