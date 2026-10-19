import networkx as nx
from typing import Any, Optional
from backend.app.schemas.graph import GraphNode, GraphEdge, GraphResponse
from backend.app.schemas.terraform import ResourceChange

class CausalDependencyGraph:
    def __init__(self):
        self.nx_graph = nx.DiGraph()
        self.node_metadata: dict[str, GraphNode] = {}
        self.edge_metadata: dict[str, GraphEdge] = {}

    def add_node(self, node: GraphNode):
        self.node_metadata[node.id] = node
        self.nx_graph.add_node(
            node.id,
            name=node.name,
            type=node.type,
            criticality=node.criticality,
            status=node.status,
            properties=node.properties,
            metrics=node.metrics
        )

    def add_edge(self, edge: GraphEdge):
        self.edge_metadata[edge.id] = edge
        self.nx_graph.add_edge(
            edge.source,
            edge.target,
            id=edge.id,
            relationship=edge.relationship,
            provenance=edge.provenance,
            latency_ms=edge.latency_ms,
            is_impact_path=edge.is_impact_path
        )

    def get_node(self, node_id: str) -> Optional[GraphNode]:
        return self.node_metadata.get(node_id)

    def get_affected_downstream(self, start_node_id: str, max_depth: int = 5) -> list[str]:
        """Calculates reachable downstream nodes impacted by a change in start_node_id."""
        if start_node_id not in self.nx_graph:
            return []
        
        # In a dependency graph: A depends on B means an edge A -> B or B -> A.
        # If B (database) fails, A (service) is impacted.
        # Let's inspect incoming edges (who depends on start_node) or successors depending on direction.
        # We standardise: Service -> Database (DEPENDS_ON). If Database changes, impact travels upstream (to callers).
        affected = set()
        queue = [(start_node_id, 0)]
        visited = {start_node_id}

        while queue:
            curr, depth = queue.pop(0)
            if depth >= max_depth:
                continue
            
            # Find callers that depend on curr (predecessors in nx_graph where Caller -> Curr)
            callers = list(self.nx_graph.predecessors(curr))
            for caller in callers:
                if caller not in visited:
                    visited.add(caller)
                    affected.add(caller)
                    queue.append((caller, depth + 1))
                    
            # Also check successors for forward cascading dependencies
            successors = list(self.nx_graph.successors(curr))
            for succ in successors:
                edge_data = self.nx_graph.get_edge_data(curr, succ, default={})
                rel = edge_data.get("relationship", "")
                if rel in ["PROVOKES", "CASCADES_TO", "PROPAGATES_TO"]:
                    if succ not in visited:
                        visited.add(succ)
                        affected.add(succ)
                        queue.append((succ, depth + 1))

        return list(affected)

    def find_impact_path(self, source_id: str, target_id: str) -> list[str]:
        """Finds shortest or primary dependency path between root cause and affected service."""
        try:
            # Check directed path from target to source (since target depends on source)
            if nx.has_path(self.nx_graph, target_id, source_id):
                path = nx.shortest_path(self.nx_graph, target_id, source_id)
                return list(reversed(path))
            elif nx.has_path(self.nx_graph, source_id, target_id):
                return nx.shortest_path(self.nx_graph, source_id, target_id)
        except Exception:
            pass
        return [source_id, target_id]

    def build_from_terraform_changes(self, changes: list[ResourceChange]) -> None:
        """Constructs graph nodes and edges from parsed Terraform changes and references."""
        for rc in changes:
            node_type = self._classify_resource_type(rc.type)
            criticality = self._determine_criticality(rc.type, rc.address)
            
            node = GraphNode(
                id=rc.address,
                name=rc.name,
                type=node_type,
                criticality=criticality,
                properties=rc.after or rc.before or {}
            )
            self.add_node(node)

        # Build edges based on dependencies
        for rc in changes:
            for dep in rc.dependencies:
                dep_id = dep.replace("${", "").replace("}", "").split(".id")[0].strip()
                if dep_id in self.node_metadata and dep_id != rc.address:
                    edge_id = f"{rc.address}->{dep_id}"
                    edge = GraphEdge(
                        id=edge_id,
                        source=rc.address,
                        target=dep_id,
                        relationship="DEPENDS_ON",
                        provenance="TERRAFORM_EXPLICIT"
                    )
                    self.add_edge(edge)

    def to_response(self, selected_impact_path: Optional[list[str]] = None) -> GraphResponse:
        path_set = set(selected_impact_path or [])
        edges_out = []
        for e in self.edge_metadata.values():
            is_path = False
            if selected_impact_path and len(selected_impact_path) >= 2:
                for i in range(len(selected_impact_path) - 1):
                    if (e.source == selected_impact_path[i] and e.target == selected_impact_path[i+1]) or \
                       (e.target == selected_impact_path[i] and e.source == selected_impact_path[i+1]):
                        is_path = True
                        break
            edge_copy = e.model_copy()
            edge_copy.is_impact_path = is_path
            edges_out.append(edge_copy)

        return GraphResponse(
            nodes=list(self.node_metadata.values()),
            edges=edges_out,
            total_nodes=len(self.node_metadata),
            total_edges=len(self.edge_metadata),
            selected_impact_path=selected_impact_path or []
        )

    def _classify_resource_type(self, res_type: str) -> str:
        res = res_type.lower()
        if "db" in res or "rds" in res or "postgres" in res or "mysql" in res:
            return "database"
        elif "cache" in res or "redis" in res or "memcached" in res:
            return "cache"
        elif "security_group" in res or "firewall" in res or "policy" in res:
            return "policy"
        elif "vpc" in res or "subnet" in res or "gateway" in res or "route" in res:
            return "network"
        elif "s3" in res or "bucket" in res or "ebs" in res or "storage" in res:
            return "storage"
        elif "instance" in res or "pod" in res or "deployment" in res or "service" in res:
            return "service"
        return "service"

    def _determine_criticality(self, res_type: str, address: str) -> str:
        addr = address.lower()
        if "primary" in addr or "core" in addr or "main" in addr or "payment" in addr or "auth" in addr:
            return "CRITICAL"
        elif "db" in addr or "database" in addr or "checkout" in addr:
            return "HIGH"
        elif "cache" in addr or "order" in addr:
            return "MEDIUM"
        return "LOW"

def create_default_microservices_graph() -> CausalDependencyGraph:
    """Creates standard verified microservice infrastructure graph (Online Boutique / Sock Shop architecture)."""
    graph = CausalDependencyGraph()
    
    nodes = [
        GraphNode(id="service.frontend", name="frontend", type="gateway", criticality="CRITICAL", properties={"replicas": 3, "port": 80}),
        GraphNode(id="service.checkoutservice", name="checkoutservice", type="service", criticality="CRITICAL", properties={"replicas": 4, "timeout_ms": 3000}),
        GraphNode(id="service.cartservice", name="cartservice", type="service", criticality="HIGH", properties={"replicas": 2}),
        GraphNode(id="service.productcatalogservice", name="productcatalogservice", type="service", criticality="HIGH", properties={"replicas": 2}),
        GraphNode(id="service.currencyservice", name="currencyservice", type="service", criticality="MEDIUM", properties={"replicas": 2}),
        GraphNode(id="service.paymentservice", name="paymentservice", type="service", criticality="CRITICAL", properties={"replicas": 2}),
        GraphNode(id="service.adservice", name="adservice", type="service", criticality="LOW", properties={"replicas": 2}),
        GraphNode(id="aws_db_instance.postgres_primary", name="postgres_primary", type="database", criticality="CRITICAL", properties={"max_connections": 200, "allocated_storage": 100}),
        GraphNode(id="aws_elasticache_cluster.redis_cache", name="redis_cache", type="cache", criticality="HIGH", properties={"node_type": "cache.t4g.micro", "max_memory_mb": 512}),
        GraphNode(id="aws_security_group.db_sg", name="db_sg", type="policy", criticality="HIGH", properties={"ingress_port": 5432, "restricted_cidr": True}),
    ]
    
    edges = [
        GraphEdge(id="e1", source="service.frontend", target="service.checkoutservice", relationship="DEPENDS_ON", provenance="BENCHMARK_TOPOLOGY", latency_ms=12.4),
        GraphEdge(id="e2", source="service.frontend", target="service.cartservice", relationship="DEPENDS_ON", provenance="BENCHMARK_TOPOLOGY", latency_ms=8.1),
        GraphEdge(id="e3", source="service.frontend", target="service.productcatalogservice", relationship="DEPENDS_ON", provenance="BENCHMARK_TOPOLOGY", latency_ms=5.0),
        GraphEdge(id="e4", source="service.frontend", target="service.adservice", relationship="DEPENDS_ON", provenance="BENCHMARK_TOPOLOGY", latency_ms=4.2),
        GraphEdge(id="e5", source="service.checkoutservice", target="aws_db_instance.postgres_primary", relationship="WRITES_TO", provenance="TERRAFORM_EXPLICIT", latency_ms=2.1),
        GraphEdge(id="e6", source="service.checkoutservice", target="service.paymentservice", relationship="DEPENDS_ON", provenance="BENCHMARK_TOPOLOGY", latency_ms=18.5),
        GraphEdge(id="e7", source="service.checkoutservice", target="service.currencyservice", relationship="DEPENDS_ON", provenance="BENCHMARK_TOPOLOGY", latency_ms=6.3),
        GraphEdge(id="e8", source="service.cartservice", target="aws_elasticache_cluster.redis_cache", relationship="WRITES_TO", provenance="BENCHMARK_TOPOLOGY", latency_ms=1.4),
        GraphEdge(id="e9", source="aws_db_instance.postgres_primary", target="aws_security_group.db_sg", relationship="GOVERNED_BY", provenance="TERRAFORM_EXPLICIT"),
    ]
    
    for n in nodes:
        graph.add_node(n)
    for e in edges:
        graph.add_edge(e)
        
    return graph
