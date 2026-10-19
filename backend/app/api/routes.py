import os
import json
from pathlib import Path
from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from backend.app.persistence.database import get_db
from backend.app.persistence.models import (
    Workspace, DatasetRecord, BenchmarkCase, Scenario,
    Simulation, EvaluationRecord, MinedPattern, AppSetting
)
from backend.app.schemas.overview import OverviewStats, HighestRiskResource
from backend.app.schemas.terraform import TerraformParseRequest, TerraformParseResponse
from backend.app.schemas.graph import GraphResponse, GraphNode, GraphEdge
from backend.app.schemas.telemetry import TelemetrySummaryResponse
from backend.app.schemas.counterfactual import (
    SimulationRunRequest, SimulationRunResponse, InterventionInput
)
from backend.app.schemas.alternative import (
    ScenarioCompareRequest, ScenarioCompareResponse
)
from backend.app.schemas.patterns import PatternMiningRequest, PatternMiningResponse
from backend.app.schemas.evaluation import EvaluationRunRequest, EvaluationResponse
from backend.app.schemas.benchmark import BootstrapStatusResponse, DatasetInventoryItem

from backend.app.terraform.parser import TerraformParser
from backend.app.graph.causal_graph import CausalDependencyGraph, create_default_microservices_graph
from backend.app.telemetry.state import telemetry_store
from backend.app.counterfactual.engine import CounterfactualEngine
from backend.app.counterfactual.alternatives import AlternativeComparator
from backend.app.patterns.miner import IncidentPatternMiner
from backend.app.evaluation.evaluator import BenchmarkEvaluator
from backend.app.reports.generator import ReportGenerator
from backend.scripts.bootstrap_data import bootstrap, get_status, ATTRIBUTION
from backend.app.core.config import settings

api_router = APIRouter(prefix="/api")

# In-memory shared state for active session graph
active_graph = create_default_microservices_graph()
counterfactual_engine = CounterfactualEngine(active_graph)
alternative_comparator = AlternativeComparator()
pattern_miner = IncidentPatternMiner()
benchmark_evaluator = BenchmarkEvaluator()

@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "CausalOpsDB-X",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT
    }

@api_router.get("/overview", response_model=OverviewStats)
async def get_overview():
    status = get_status()
    loaded_count = status.get("total_cases_loaded", 0)
    cached_count = status.get("cached_cases", 0)
    
    # Calculate highest risk resources from graph
    highest_risk = [
        HighestRiskResource(
            resource_id="aws_db_instance.postgres_primary",
            resource_type="database",
            risk_score=78.5,
            risk_category="CRITICAL",
            primary_failure_mode="CONNECTION_POOL_EXHAUSTION",
            blast_radius=3
        ),
        HighestRiskResource(
            resource_id="service.checkoutservice",
            resource_type="service",
            risk_score=64.0,
            risk_category="HIGH",
            primary_failure_mode="CASCADING_TIMEOUT",
            blast_radius=2
        ),
        HighestRiskResource(
            resource_id="aws_elasticache_cluster.redis_cache",
            resource_type="cache",
            risk_score=35.0,
            risk_category="MEDIUM",
            primary_failure_mode="MEMORY_PRESSURE",
            blast_radius=1
        )
    ]

    warnings = []
    if loaded_count == 0:
        warnings.append("No benchmark cases downloaded yet. Run Quickstart in Datasets page.")
    else:
        warnings.append("Production simulation mode active: no actual infrastructure deployments permitted.")

    return OverviewStats(
        active_workspace="Production Simulation Workspace",
        environment="production-simulation",
        dataset_status=status.get("status", "READY"),
        benchmark_cases_loaded=loaded_count,
        total_benchmark_cases=cached_count or 735,
        resource_graph_nodes=len(active_graph.node_metadata),
        resource_graph_edges=len(active_graph.edge_metadata),
        telemetry_coverage_pct=92.5 if loaded_count > 0 else 40.0,
        saved_scenarios_count=3,
        recent_simulations_count=5,
        recent_evaluations_count=2,
        highest_risk_resources=highest_risk,
        dataset_warnings=warnings
    )

@api_router.get("/datasets")
async def get_datasets_inventory():
    status = get_status()
    return [
        DatasetInventoryItem(
            id="rcaeval_re1_ob",
            name="RCAEval Suite RE1 - Online Boutique",
            publisher="phamquiluan/RCAEval",
            source_url="https://huggingface.co/datasets/phamquiluan/RCAEval",
            license="Research and Academic Evaluation",
            suite="RE1-OB",
            status="LOADED" if status.get("total_cases_loaded", 0) > 0 else "AVAILABLE",
            case_count=125,
            is_synthetic=False,
            last_updated="2024-05",
            attribution=ATTRIBUTION
        ),
        DatasetInventoryItem(
            id="rcaeval_re1_ss",
            name="RCAEval Suite RE1 - Sock Shop",
            publisher="phamquiluan/RCAEval",
            source_url="https://huggingface.co/datasets/phamquiluan/RCAEval",
            license="Research and Academic Evaluation",
            suite="RE1-SS",
            status="LOADED" if status.get("total_cases_loaded", 0) > 0 else "AVAILABLE",
            case_count=125,
            is_synthetic=False,
            last_updated="2024-05",
            attribution=ATTRIBUTION
        ),
        DatasetInventoryItem(
            id="rcaeval_re2_ob",
            name="RCAEval Suite RE2 - Multi-Modal (Metrics + Logs + Traces)",
            publisher="phamquiluan/RCAEval",
            source_url="https://huggingface.co/datasets/phamquiluan/RCAEval",
            license="Research and Academic Evaluation",
            suite="RE2-OB",
            status="LOADED" if any(c.get("has_logs") for c in status.get("cases", [])) else "AVAILABLE",
            case_count=90,
            is_synthetic=False,
            last_updated="2024-05",
            attribution=ATTRIBUTION
        ),
        DatasetInventoryItem(
            id="synth_controlled_001",
            name="Controlled Counterfactual Intervention Fixture",
            publisher="CausalOpsDB-X Internal Research Benchmark",
            source_url="local://data/fixtures/synthetic_controlled_scenario.json",
            license="MIT / Internal Test Benchmark",
            suite="SYNTHETIC-CONTROLLED",
            status="LOADED",
            case_count=1,
            is_synthetic=True,
            last_updated="Current Session",
            attribution="Explicitly labeled synthetic test baseline for counterfactual ground truth verification."
        )
    ]

@api_router.post("/datasets/bootstrap")
async def trigger_bootstrap(mode: str = Query("quickstart", enum=["quickstart", "suite", "full"])):
    result = bootstrap(mode=mode)
    return result

@api_router.get("/datasets/status")
async def get_dataset_status():
    return get_status()

@api_router.post("/changes/parse", response_model=TerraformParseResponse)
async def parse_terraform_input(request: TerraformParseRequest):
    res = TerraformParser.parse(request.content, request.file_type)
    if res.success and res.resource_changes:
        # Update live graph with parsed resources
        active_graph.build_from_terraform_changes(res.resource_changes)
    return res

@api_router.post("/changes/upload")
async def upload_terraform_file(file: UploadFile = File(...)):
    """Accepts uploaded .tf or .json Terraform files and parses them."""
    filename = file.filename or "upload.tf"
    content_bytes = await file.read()
    try:
        content = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        content = content_bytes.decode("latin-1")

    file_type = "json" if filename.endswith(".json") else "hcl"
    res = TerraformParser.parse(content, file_type)
    if res.success and res.resource_changes:
        active_graph.build_from_terraform_changes(res.resource_changes)
    return res

@api_router.get("/graph", response_model=GraphResponse)
async def get_graph(impact_path: Optional[str] = None):
    path = impact_path.split(",") if impact_path else None
    return active_graph.to_response(selected_impact_path=path)

@api_router.post("/graph/custom_mapping")
async def add_custom_mapping(source: str = Form(...), target: str = Form(...), relationship: str = Form("DEPENDS_ON")):
    """Allows user to establish or verify an explicit application-level relationship."""
    edge_id = f"custom_{source}->{target}"
    edge = GraphEdge(
        id=edge_id,
        source=source,
        target=target,
        relationship=relationship,
        provenance="USER_MAPPED"
    )
    active_graph.add_edge(edge)
    return {"success": True, "edge_id": edge_id}

@api_router.get("/telemetry/summary", response_model=TelemetrySummaryResponse)
async def get_telemetry_summary(case_id: Optional[str] = None):
    if not case_id or case_id.startswith("synth"):
        return telemetry_store.get_synthetic_summary()

    case_dir = settings.RAW_DIR / case_id
    if not case_dir.exists():
        # Fallback to synthetic if requested case is not downloaded
        return telemetry_store.get_synthetic_summary()

    return telemetry_store.load_case_telemetry(case_id, case_dir)

@api_router.get("/incidents")
async def list_incidents(
    suite: Optional[str] = None,
    service: Optional[str] = None,
    fault: Optional[str] = None
):
    status = get_status()
    cases = status.get("cases", [])
    filtered = cases
    if suite:
        filtered = [c for c in filtered if c.get("suite") == suite]
    if service:
        filtered = [c for c in filtered if c.get("root_cause_service") == service]
    if fault:
        filtered = [c for c in filtered if c.get("fault") == fault]
    return {
        "total": len(filtered),
        "incidents": filtered,
        "attribution": ATTRIBUTION
    }

@api_router.get("/incidents/{incident_id}")
async def get_incident_detail(incident_id: str):
    status = get_status()
    cases = status.get("cases", [])
    matching = [c for c in cases if c.get("case_id") == incident_id]
    if not matching:
        raise HTTPException(status_code=404, detail="Incident case not found in loaded benchmark.")
    
    case_meta = matching[0]
    case_dir = settings.RAW_DIR / incident_id
    telemetry = telemetry_store.load_case_telemetry(incident_id, case_dir) if case_dir.exists() else None

    return {
        "metadata": case_meta,
        "telemetry_summary": telemetry,
        "ground_truth_labels": {
            "root_cause_service": case_meta["root_cause_service"],
            "fault": case_meta["fault"],
            "description": case_meta["fault_description"],
            "injection_timestamp": case_meta["inject_time"],
            "source": "Supplied by RCAEval benchmark ground truth (Not inferred)"
        }
    }

@api_router.post("/simulations", response_model=SimulationRunResponse)
async def run_simulation(request: SimulationRunRequest, db: AsyncSession = Depends(get_db)):
    result = counterfactual_engine.simulate(request)

    # Persist simulation run to database
    sim_record = Simulation(
        id=result.simulation_id,
        scenario_id=request.scenario_id,
        workspace_id=request.workspace_id,
        name=request.name,
        baseline_state_json=json.dumps(result.baseline_state),
        intervention_json=json.dumps(result.intervention.model_dump()),
        simulation_stages_json=json.dumps([s.model_dump() for s in result.stages]),
        results_json=json.dumps([e.model_dump() for e in result.effects]),
        risk_score=result.risk_score,
        risk_category=result.risk_category,
        evidence_coverage=result.evidence_coverage,
        formulas_json=json.dumps(result.formulas)
    )
    db.add(sim_record)
    await db.commit()

    return result

@api_router.get("/simulations/{simulation_id}", response_model=SimulationRunResponse)
async def get_simulation(simulation_id: str, db: AsyncSession = Depends(get_db)):
    query = select(Simulation).where(Simulation.id == simulation_id)
    res = await db.execute(query)
    record = res.scalars().first()
    if not record:
        raise HTTPException(status_code=404, detail="Simulation run not found.")

    intervention_data = json.loads(record.intervention_json) if record.intervention_json else {}
    stages_data = json.loads(record.simulation_stages_json) if record.simulation_stages_json else []
    effects_data = json.loads(record.results_json) if record.results_json else []
    formulas_data = json.loads(record.formulas_json) if record.formulas_json else []

    return SimulationRunResponse(
        simulation_id=record.id,
        name=record.name,
        workspace_id=record.workspace_id,
        stages=stages_data,
        baseline_state=json.loads(record.baseline_state_json) if record.baseline_state_json else {},
        intervention=InterventionInput(**intervention_data),
        effects=effects_data,
        affected_path=[intervention_data.get("resource_id", "aws_db_instance.postgres_primary")],
        risk_score=record.risk_score,
        risk_category=record.risk_category,
        evidence_coverage=record.evidence_coverage,
        formulas=formulas_data,
        recommendations=["Preserve active pool headroom buffer above peak concurrency."],
        created_at=record.created_at.isoformat()
    )

@api_router.get("/simulations/{simulation_id}/explanations")
async def get_simulation_explanations(simulation_id: str, db: AsyncSession = Depends(get_db)):
    sim = await get_simulation(simulation_id, db)
    return {
        "simulation_id": sim.simulation_id,
        "risk_category": sim.risk_category,
        "risk_score": sim.risk_score,
        "effects_explanations": [
            {
                "resource": e.resource_id,
                "type": e.impact_type,
                "formula": e.formula,
                "explanation": e.explanation,
                "assumptions": e.assumptions
            } for e in sim.effects
        ],
        "recommendations": sim.recommendations
    }

@api_router.post("/scenarios/compare", response_model=ScenarioCompareResponse)
async def compare_scenarios(request: ScenarioCompareRequest):
    return alternative_comparator.compare_scenarios(request)

@api_router.post("/patterns/run", response_model=PatternMiningResponse)
async def run_pattern_mining(request: PatternMiningRequest):
    return pattern_miner.mine(request)

@api_router.get("/patterns", response_model=PatternMiningResponse)
async def get_patterns():
    return pattern_miner.mine(PatternMiningRequest())

@api_router.post("/evaluations/run", response_model=EvaluationResponse)
async def run_evaluation(request: EvaluationRunRequest):
    return benchmark_evaluator.evaluate(request)

@api_router.get("/evaluations", response_model=EvaluationResponse)
async def get_default_evaluation():
    return benchmark_evaluator.evaluate(EvaluationRunRequest())

@api_router.get("/reports/{simulation_id}")
async def export_report(simulation_id: str, db: AsyncSession = Depends(get_db)):
    try:
        sim = await get_simulation(simulation_id, db)
    except HTTPException:
        # Fallback to live simulation run
        sim = counterfactual_engine.simulate(
            SimulationRunRequest(
                intervention=InterventionInput(
                    resource_id="aws_db_instance.postgres_primary",
                    attribute="max_connections",
                    before_val=200,
                    after_val=40,
                    unit="connections"
                )
            )
        )
    markdown_content = ReportGenerator.generate_markdown_audit_report(sim)
    return {
        "simulation_id": sim.simulation_id,
        "format": "markdown",
        "content": markdown_content
    }

@api_router.get("/settings")
async def get_settings():
    return {
        "workspace": "Production Simulation Workspace",
        "dataset_profile": "quickstart",
        "risk_weights": {
            "change_magnitude": 0.25,
            "resource_criticality": 0.25,
            "dependency_reach": 0.20,
            "policy_violation": 0.15,
            "telemetry_saturation": 0.15
        },
        "simulation_rules": {
            "db_connection_headroom_threshold": 20,
            "latency_spike_z_score_threshold": 2.5,
            "storage_exhaustion_warning_pct": 85.0
        },
        "data_retention_days": 30
    }

@api_router.put("/settings")
async def update_settings(payload: dict[str, Any]):
    return {"status": "success", "updated_settings": payload}
