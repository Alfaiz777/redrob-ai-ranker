from typing import Any

from pydantic import BaseModel, Field


class CandidateProfile(BaseModel):
    candidate_id: str
    title: str | None = None
    experience: float | None = None
    headline: str = ""
    summary: str = ""
    skills: list[str] = Field(default_factory=list)
    companies: list[str] = Field(default_factory=list)
    job_titles: list[str] = Field(default_factory=list)
    industries: list[str] = Field(default_factory=list)
    career_text: str = ""
    behavior_signals: dict[str, Any] = Field(default_factory=dict)

    @classmethod
    def from_raw(cls, candidate: dict[str, Any]) -> "CandidateProfile":
        from src.normalize.profiler import extract_candidate_features

        return cls.model_validate(extract_candidate_features(candidate))
