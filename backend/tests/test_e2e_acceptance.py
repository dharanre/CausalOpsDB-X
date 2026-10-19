import pytest
import json
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.core.config import settings
from backend.app.persistence.database import init_db

@pytest.mark.asyncio
async def test_full_e2e_acceptance_flow():
    """Validates the 20-step end-to-end acceptance workflow specified in Section 13."""
    await init_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Step 3: Health check
        res_health = await client.get("/api/health")
        assert res_health.status_code == 200
        assert res_health.json()["status"] == "healthy"

        # Step 5: View benchmark download and validation status
        res_status = await client.get("/api/datasets/status")
        assert res_status.status_code == 200
        status_data = res_status.json()
        assert status_data["total_cases_loaded"] > 0
        assert status_data["total_metrics_records"] > 0

        # Step 6: Open actual loaded RCAEval case
        case_id = status_data["cases"][0]["case_id"]
        res_incident = await client.get(f"/api/incidents/{case_id}")
        assert res_incident.status_code == 200
        incident_data = res_incident.json()
        
        # Step 7: Inspect telemetry and ground-truth labels
        assert "ground_truth_labels" in incident_data
        assert incident_data["ground_truth_labels"]["root_cause_service"] != ""
        res_telem = await client.get(f"/api/telemetry/summary?case_id={case_id}")
        assert res_telem.status_code == 200
        assert len(res_telem.json()["metrics"]) > 0

        # Step 8: Run root-cause evaluation against actual labels
        res_eval = await client.post("/api/evaluations/run", json={"suite": "RE1", "evaluation_type": "BENCHMARK_RCA"})
        assert res_eval.status_code == 200
        eval_data = res_eval.json()
        assert eval_data["total_cases_evaluated"] > 0
        assert len(eval_data["results"]) == 3

        # Step 9 & 10: Parse supported Terraform change
        hcl_content = (settings.FIXTURES_DIR / "sample_aws_rds_change.tf").read_text(encoding="utf-8")
        res_parse = await client.post("/api/changes/parse", json={"content": hcl_content, "file_type": "hcl"})
        assert res_parse.status_code == 200
        assert res_parse.json()["success"] is True
        assert res_parse.json()["total_changes"] > 0

        # Step 11: Build/inspect resource dependency graph
        res_graph = await client.get("/api/graph")
        assert res_graph.status_code == 200
        assert res_graph.json()["total_nodes"] > 0
        assert res_graph.json()["total_edges"] > 0

        # Step 12 & 13: Execute counterfactual simulation & inspect formulas
        intervention_payload = {
            "name": "E2E Acceptance Test Simulation",
            "workspace_id": "default_workspace",
            "intervention": {
                "resource_id": "aws_db_instance.postgres_primary",
                "attribute": "max_connections",
                "before_val": 200,
                "after_val": 40,
                "unit": "connections"
            }
        }
        res_sim = await client.post("/api/simulations", json=intervention_payload)
        assert res_sim.status_code == 200
        sim_data = res_sim.json()
        sim_id = sim_data["simulation_id"]
        assert sim_data["risk_score"] >= 50.0
        assert len(sim_data["effects"]) >= 2
        assert len(sim_data["formulas"]) >= 1

        # Step 14: Compare proposed change with supported alternatives
        res_compare = await client.post("/api/scenarios/compare", json={
            "proposed_intervention": intervention_payload["intervention"],
            "resource_id": "aws_db_instance.postgres_primary"
        })
        assert res_compare.status_code == 200
        compare_data = res_compare.json()
        assert len(compare_data["alternatives"]) >= 1
        assert compare_data["alternatives"][0]["risk_score"] < compare_data["proposed"]["risk_score"]

        # Step 15 & 16: Explore affected path, explanations, assumptions
        res_exp = await client.get(f"/api/simulations/{sim_id}/explanations")
        assert res_exp.status_code == 200
        assert len(res_exp.json()["effects_explanations"]) >= 1

        # Step 17: Save and reopen simulation
        res_reopen = await client.get(f"/api/simulations/{sim_id}")
        assert res_reopen.status_code == 200
        assert res_reopen.json()["simulation_id"] == sim_id

        # Step 18: Export report
        res_report = await client.get(f"/api/reports/{sim_id}")
        assert res_report.status_code == 200
        assert "# CausalOpsDB-X Pre-Deployment Simulation Audit Report" in res_report.json()["content"]
