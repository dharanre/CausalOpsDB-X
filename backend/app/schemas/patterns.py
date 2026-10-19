from typing import Any, Optional
from pydantic import BaseModel, Field

class PatternItem(BaseModel):
    id: str
    name: str
    pattern_type: str = "TEMPORAL_SEQUENCE"
    sequence: list[str] = Field(default_factory=list)
    support_count: int = 1
    frequency_pct: float = 0.0
    confidence: float = 0.8
    is_observational: bool = True
    rule_description: str = ""
    supporting_cases: list[str] = Field(default_factory=list)
    time_window_seconds: int = 300

class PatternMiningRequest(BaseModel):
    threshold_sigma: float = 2.5
    min_support: int = 1
    max_sequence_len: int = 4
    cases: Optional[list[str]] = None

class PatternMiningResponse(BaseModel):
    patterns: list[PatternItem] = Field(default_factory=list)
    total_patterns: int = 0
    analyzed_cases: int = 0
    mining_method: str = "Temporal Event Discretization & Sequential Pattern Mining"
