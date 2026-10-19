from typing import Any, Optional
from pydantic import BaseModel, Field

class GraphNode(BaseModel):
    id: str
    name: str
    type: str  # database, service, cache, network, storage, policy, gateway
    criticality: str = "MEDIUM"  # LOW, MEDIUM, HIGH, CRITICAL
    status: str = "HEALTHY"  # HEALTHY, WARNING, CRITICAL, SIMULATED_IMPACT
    properties: dict[str, Any] = Field(default_factory=dict)
    metrics: dict[str, Any] = Field(default_factory=dict)

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    relationship: str = "CONNECTS_TO"  # CONNECTS_TO, DEPENDS_ON, WRITES_TO, READS_FROM, GOVERNED_BY
    provenance: str = "TERRAFORM_EXPLICIT"  # TERRAFORM_EXPLICIT, INFERRED_CONFIG, USER_MAPPED, BENCHMARK_TOPOLOGY
    latency_ms: Optional[float] = None
    is_impact_path: bool = False

class GraphResponse(BaseModel):
    nodes: list[GraphNode] = Field(default_factory=list)
    edges: list[GraphEdge] = Field(default_factory=list)
    total_nodes: int = 0
    total_edges: int = 0
    selected_impact_path: list[str] = Field(default_factory=list)
