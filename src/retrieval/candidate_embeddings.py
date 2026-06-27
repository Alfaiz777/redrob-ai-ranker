"""Build evidence-grounded candidate documents and embeddings."""

from __future__ import annotations
from src.retrieval.retrieval_document import (
    extract_relevant_descriptions
)

import re
from collections.abc import Sequence
from typing import Any

import numpy as np

from src.retrieval.embedding_model import encode_documents

DOCUMENT_VERSION = "career-evidence-v2"


def _clean(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def build_candidate_document(
    candidate: dict[str, Any]
) -> str:

    lines = []

    title = _clean(
        candidate.get("title")
    )

    if title:

        lines.append(
            f"TITLE: {title}"
        )

    # ==========================
    # Job Titles
    # ==========================

    for job in candidate.get(
        "career_history",
        []
    ):

        job_title = _clean(
            job.get("title")
        )

        if job_title:

            lines.append(
                f"JOB_TITLE: {job_title}"
            )

    # ==========================
    # Relevant Skills Only
    # ==========================

    for skill in candidate.get(
        "skills",
        []
    ):

        skill = _clean(skill)

        if skill and any(
            keyword in skill.lower()
            for keyword in [
                "retrieval",
                "ranking",
                "search",
                "recommendation",
                "embedding",
                "faiss",
                "pinecone",
                "nlp",
                "ml"
            ]
        ):

            lines.append(
                f"SKILL: {skill}"
            )

    # ==========================
    # Relevant Career Evidence
    # ==========================

    relevant_descriptions = (
        extract_relevant_descriptions(
            candidate.get(
                "career_history",
                []
            )
        )
    )

    for description in relevant_descriptions:

        lines.append(
            f"EVIDENCE: {_clean(description)}"
        )

    return "\n".join(lines)

def create_candidate_embedding(candidate: dict[str, Any]) -> np.ndarray:
    return encode_documents([build_candidate_document(candidate)])[0]


def create_candidate_embeddings(
    candidates: Sequence[dict[str, Any]],
    *,
    batch_size: int = 128,
    show_progress_bar: bool = False,
) -> np.ndarray:
    documents = [build_candidate_document(candidate) for candidate in candidates]
    return encode_documents(
        documents,
        batch_size=batch_size,
        show_progress_bar=show_progress_bar,
    )
