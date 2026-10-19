from typing import Any, Optional
from pydantic import BaseModel, Field

class HighestRiskResource(BaseModel):
    resource_id: str
    resource_type: str
    risk_score: float
    risk_category: str
    primary_failure_mode: str
    blast_radius: int

class OverviewStats(BaseModel):
    active_workspace: str
    environment: str
    dataset_status: str
    benchmark_cases_loaded: int
    total_benchmark_cases: int
    resource_graph_nodes: int
    resource_graph_edges: int
    telemetry_coverage_pct: float
    saved_scenarios_count: int
    recent_simulations_count: int
    recent_evaluations_count: int
    highest_risk_resources: list[HighestRiskResource] = Field(default_factory=list)
    dataset_warnings: list[str] = Field(default_factory=list)
