from typing import Any, Optional
from pydantic import BaseModel, Field

class BenchmarkCaseSummary(BaseModel):
    case_id: str
    dataset: str
    suite: str
    system: str
    system_name: str
    root_cause_service: str
    fault: str
    fault_description: str
    inject_time: int
    n_metrics: int
    n_timesteps: int
    has_logs: bool = False
    has_traces: bool = False
    is_loaded: bool = False
    provenance: str = "RCAEVAL_PUBLIC_BENCHMARK"

class DatasetInventoryItem(BaseModel):
    id: str
    name: str
    publisher: str
    source_url: str
    license: str
    suite: str
    status: str  # NOT_DOWNLOADED, PARTIAL, LOADED, ERROR, SYNTHETIC
    case_count: int
    is_synthetic: bool
    last_updated: Optional[str] = None
    attribution: str = "Pham, Q. L., et al. RCAEval: An Extensible Benchmark for Root Cause Analysis"

class BootstrapStatusResponse(BaseModel):
    status: str  # READY, DOWNLOADING, COMPLETED, ERROR, OFFLINE_SYNTHETIC
    profile: str = "quickstart"
    cached_cases: int = 0
    loaded_cases: int = 0
    total_metrics_records: int = 0
    cases: list[BenchmarkCaseSummary] = Field(default_factory=list)
    last_bootstrap: Optional[str] = None
    attribution: str = "Pham, Q. L., et al. RCAEval Benchmark (Hugging Face datasets/phamquiluan/RCAEval)"
    errors: list[str] = Field(default_factory=list)
