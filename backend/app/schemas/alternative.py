from typing import Any, Optional
from pydantic import BaseModel, Field
from backend.app.schemas.counterfactual import CalculatedEffect, InterventionInput

class AlternativeCandidate(BaseModel):
    id: str
    name: str
    description: str
    configuration_changes: list[InterventionInput] = Field(default_factory=list)
    modeled_effects: list[CalculatedEffect] = Field(default_factory=list)
    risk_score: float = 0.0
    risk_category: str = "LOW"
    evidence_coverage: float = 0.0
    affected_resources: list[str] = Field(default_factory=list)
    trade_offs: list[str] = Field(default_factory=list)
    operational_constraints: list[str] = Field(default_factory=list)
    score_rank: int = 1

class ScenarioCompareRequest(BaseModel):
    proposed_intervention: InterventionInput
    resource_id: str
    custom_alternatives: Optional[list[InterventionInput]] = None

class ScenarioCompareResponse(BaseModel):
    baseline_state: dict[str, Any] = Field(default_factory=dict)
    proposed: AlternativeCandidate
    alternatives: list[AlternativeCandidate] = Field(default_factory=list)
    recommendation: str
    ranking_criteria: str
