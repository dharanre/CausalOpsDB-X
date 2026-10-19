from typing import Any, Optional
from pydantic import BaseModel, Field

class TelemetryPoint(BaseModel):
    timestamp: int
    value: float

class MetricSeries(BaseModel):
    service: str
    metric_name: str
    unit: str = ""
    points: list[TelemetryPoint] = Field(default_factory=list)
    p50: float = 0.0
    p95: float = 0.0
    p99: float = 0.0
    max: float = 0.0
    mean: float = 0.0

class LogEntry(BaseModel):
    timestamp: int
    service: str
    level: str = "INFO"  # DEBUG, INFO, WARN, ERROR, CRITICAL
    message: str

class TraceSpan(BaseModel):
    span_id: str
    trace_id: str
    service: str
    operation: str
    start_time: int
    duration_ms: float
    status_code: str = "OK"  # OK, ERROR, UNSET
    parent_span_id: Optional[str] = None

class TelemetrySummaryResponse(BaseModel):
    dataset_name: str
    case_id: Optional[str] = None
    provenance: str = "BENCHMARK_RCAEVAL"  # BENCHMARK_RCAEVAL, USER_IMPORTED, SYNTHETIC
    total_metrics: int = 0
    time_range: tuple[int, int] = (0, 0)
    services: list[str] = Field(default_factory=list)
    metrics: list[MetricSeries] = Field(default_factory=list)
    logs: list[LogEntry] = Field(default_factory=list)
    traces: list[TraceSpan] = Field(default_factory=list)
    has_logs: bool = False
    has_traces: bool = False
    validation_status: str = "VALIDATED"
    warnings: list[str] = Field(default_factory=list)
