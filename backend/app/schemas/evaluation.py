from typing import Any, Optional
from pydantic import BaseModel, Field

class EvaluationRunRequest(BaseModel):
    evaluation_type: str = "BENCHMARK_RCA"  # BENCHMARK_RCA or COUNTERFACTUAL_CONTROLLED
    suite: str = "RE1"
    selected_cases: Optional[list[str]] = None
    approaches: list[str] = Field(default_factory=lambda: ["telemetry_only", "dependency_aware", "combined_evidence"])

class MethodologyResult(BaseModel):
    approach: str
    top1_accuracy: float = 0.0
    top3_hit_rate: float = 0.0
    top5_hit_rate: float = 0.0
    mrr: float = 0.0
    sample_count: int = 0
    skipped_count: int = 0
    description: str = ""

class CaseEvaluationDetail(BaseModel):
    case_id: str
    ground_truth_service: str
    ground_truth_fault: str
    top_predicted: list[str]
    rank_of_true_cause: Optional[int]
    hit_top1: bool
    hit_top3: bool
    reciprocal_rank: float
    evidence_score: float

class EvaluationResponse(BaseModel):
    evaluation_id: str
    evaluation_type: str
    suite: str
    total_cases_evaluated: int
    results: list[MethodologyResult] = Field(default_factory=list)
    case_details: list[CaseEvaluationDetail] = Field(default_factory=list)
    counterfactual_accuracy: Optional[float] = None
    created_at: str
