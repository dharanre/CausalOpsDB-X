import pytest
import os
import json
from pathlib import Path
from httpx import AsyncClient, ASGITransport

from backend.app.main import app
from backend.app.terraform.parser import TerraformParser
from backend.app.graph.causal_graph import CausalDependencyGraph, create_default_microservices_graph
from backend.app.counterfactual.engine import CounterfactualEngine
from backend.app.schemas.counterfactual import InterventionInput, SimulationRunRequest
from backend.app.counterfactual.alternatives import AlternativeComparator
from backend.app.schemas.alternative import ScenarioCompareRequest
from backend.app.risk.engine import RiskEngine
from backend.app.patterns.miner import IncidentPatternMiner
from backend.app.schemas.patterns import PatternMiningRequest
from backend.app.evaluation.evaluator import BenchmarkEvaluator
from backend.app.schemas.evaluation import EvaluationRunRequest
from backend.app.reports.generator import ReportGenerator
from backend.app.core.config import settings

@pytest.mark.asyncio
async def test_health_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "CausalOpsDB-X"

@pytest.mark.asyncio
async def test_overview_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/overview")
        assert response.status_code == 200
        data = response.json()
        assert "resource_graph_nodes" in data
        assert "benchmark_cases_loaded" in data

def test_terraform_hcl_parser():
    sample_hcl = (settings.FIXTURES_DIR / "sample_aws_rds_change.tf").read_text(encoding="utf-8")
    result = TerraformParser.parse_hcl(sample_hcl)
    assert result.success is True
    assert result.total_changes > 0
    addresses = [rc.address for rc in result.resource_changes]
    assert "aws_db_instance.postgres_primary" in addresses
    assert "aws_security_group.db_sg" in addresses

def test_terraform_plan_json_parser():
    sample_json = (settings.FIXTURES_DIR / "sample_terraform_plan.json").read_text(encoding="utf-8")
    result = TerraformParser.parse_plan_json(sample_json)
    assert result.success is True
    assert result.total_changes == 2
    pg = next(rc for rc in result.resource_changes if rc.name == "postgres_primary")
    assert pg.action == "update"
    assert "master_password" in pg.sensitive_attributes
    # Sensitive field must be redacted
    assert pg.before.get("master_password") == "[REDACTED_CONFIDENTIAL]"

def test_dependency_graph_reachability():
    graph = create_default_microservices_graph()
    downstream = graph.get_affected_downstream("aws_db_instance.postgres_primary")
    # checkoutservice directly calls postgres_primary, frontend calls checkoutservice
    assert "service.checkoutservice" in downstream
    assert "service.frontend" in downstream

def test_counterfactual_engine_connection_saturation():
    engine = CounterfactualEngine()
    # Intervene: Downsize max_connections from 200 to 40
    req = SimulationRunRequest(
        name="Test Pool Saturation",
        intervention=InterventionInput(
            resource_id="aws_db_instance.postgres_primary",
            attribute="max_connections",
            before_val=200,
            after_val=40,
            unit="connections"
        )
    )
    res = engine.simulate(req)
    assert res.risk_score >= 50.0  # High or Critical
    assert res.risk_category in ["HIGH", "CRITICAL"]
    # Verify pool exhaustion effect
    effects = [e.impact_type for e in res.effects]
    assert "CONNECTION_POOL_EXHAUSTION" in effects
    assert "CASCADING_TIMEOUT" in effects
    # Check mathematical formula is present
    assert any("Headroom" in f["formula"] for f in res.formulas)

def test_alternative_comparator():
    comparator = AlternativeComparator()
    req = ScenarioCompareRequest(
        proposed_intervention=InterventionInput(
            resource_id="aws_db_instance.postgres_primary",
            attribute="max_connections",
            before_val=200,
            after_val=40,
            unit="connections"
        ),
        resource_id="aws_db_instance.postgres_primary"
    )
    res = comparator.compare_scenarios(req)
    assert res.proposed.risk_score >= 50.0
    assert len(res.alternatives) >= 1
    # Safer alternative should have lower risk
    best_alt = res.alternatives[0]
    assert best_alt.risk_score < res.proposed.risk_score

def test_risk_engine_factors_and_weights():
    engine = RiskEngine()
    assessment = engine.evaluate_risk(
        resource_id="aws_db_instance.postgres_primary",
        criticality="CRITICAL",
        dependency_reach=3,
        magnitude_factor=0.8,
        policy_violated=False,
        telemetry_headroom_pct=10.0
    )
    assert assessment.risk_score > 50.0
    assert len(assessment.factor_contributions) == 5
    # Verify factor weights sum to 1.0
    total_w = sum(f.weight for f in assessment.factor_contributions)
    assert abs(total_w - 1.0) < 0.01

def test_incident_pattern_miner():
    miner = IncidentPatternMiner()
    res = miner.mine(PatternMiningRequest(min_support=1))
    assert res.total_patterns >= 3
    pattern_ids = [p.id for p in res.patterns]
    assert "pat_cpu_saturation_cascade" in pattern_ids
    assert "pat_db_connection_pool_starvation" in pattern_ids

def test_benchmark_evaluator_metrics():
    evaluator = BenchmarkEvaluator()
    res = evaluator.evaluate(EvaluationRunRequest(suite="RE1"))
    assert res.total_cases_evaluated > 0
    assert len(res.results) == 3
    approaches = [r.approach for r in res.results]
    assert "telemetry_only" in approaches
    assert "dependency_aware" in approaches
    assert "combined_evidence" in approaches
    # Verify MRR and top1 are numeric fractions
    for r in res.results:
        assert 0.0 <= r.top1_accuracy <= 1.0
        assert 0.0 <= r.mrr <= 1.0

def test_report_generation():
    engine = CounterfactualEngine()
    res = engine.simulate(
        SimulationRunRequest(
            name="Report Test",
            intervention=InterventionInput(
                resource_id="aws_db_instance.postgres_primary",
                attribute="max_connections",
                before_val=200,
                after_val=40,
                unit="connections"
            )
        )
    )
    report_md = ReportGenerator.generate_markdown_audit_report(res)
    assert "# CausalOpsDB-X Pre-Deployment Simulation Audit Report" in report_md
    assert "CONNECTION_POOL_EXHAUSTION" in report_md
    assert "Mathematical Formula" in report_md
