from typing import Any, Optional
from pydantic import BaseModel, Field

class InterventionInput(BaseModel):
    resource_id: str
    attribute: str
    before_val: Any
    after_val: Any
    unit: str = ""
    reason: Optional[str] = "Proposed infrastructure modification"

class CalculatedEffect(BaseModel):
    resource_id: str
    impact_type: str  # e.g., CONNECTION_POOL_EXHAUSTION, CASCADING_TIMEOUT, THROUGHPUT_THROTTLED, STORAGE_SATURATION
    severity: str = "WARNING"  # INFO, WARNING, CRITICAL
    formula: str
    inputs: dict[str, Any] = Field(default_factory=dict)
    calculated_value: Any
    unit: str = ""
    assumptions: list[str] = Field(default_factory=list)
    explanation: str

class SimulationStage(BaseModel):
    stage_number: int
    name: str
    status: str  # PENDING, IN_PROGRESS, COMPLETED, FAILED
    timestamp: str
    details: str

class SimulationRunRequest(BaseModel):
    scenario_id: Optional[str] = None
    workspace_id: str = "default_workspace"
    name: str = "Counterfactual Run"
    intervention: InterventionInput
    rules_override: Optional[dict[str, Any]] = None

class SimulationRunResponse(BaseModel):
    simulation_id: str
    name: str
    workspace_id: str
    stages: list[SimulationStage] = Field(default_factory=list)
    baseline_state: dict[str, Any] = Field(default_factory=dict)
    intervention: InterventionInput
    effects: list[CalculatedEffect] = Field(default_factory=list)
    affected_path: list[str] = Field(default_factory=list)
    risk_score: float = 0.0
    risk_category: str = "LOW"
    evidence_coverage: float = 0.0
    formulas: list[dict[str, Any]] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    created_at: str
