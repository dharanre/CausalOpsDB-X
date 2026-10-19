# Benchmark Datasets & Attribution

CausalOpsDB-X integrates authentic microservice benchmark data from the RCAEval research benchmark, alongside controlled synthetic fixtures for counterfactual evaluation.

## 1. RCAEval Benchmark
- **Repository:** https://github.com/phamquiluan/RCAEval
- **Dataset Hosting:** https://huggingface.co/datasets/phamquiluan/RCAEval
- **Citation:** Pham, Q. L., et al. (2024). *RCAEval: An Extensible Benchmark for Root Cause Analysis in Microservices*.
- **License / Terms:** Academic & Research Evaluation.
- **Coverage:** 735 microservice failure cases across 9 distinct suites:
  - `RE1-OB`, `RE1-SS`, `RE1-TT`: Online Boutique, Sock Shop, Train Ticket (Metrics)
  - `RE2-OB`, `RE2-SS`, `RE2-TT`: Multi-modal suites with metrics, structured logs, and distributed traces
  - `RE3-OB`, `RE3-SS`, `RE3-TT`: Multi-fault compound scenarios
- **Fault Types:** `cpu`, `delay`, `disk`, `loss`, `mem`, `socket`.

### Local Bootstrap Script
Located at `backend/scripts/bootstrap_data.py`:
- `quickstart`: Downloads and validates 6 diverse cases across suites with metrics and multi-modal traces.
- `suite`: Downloads 20 cases.
- `full`: Complete archive download.
- `status`: Audits cached cases, loaded records, and data integrity.

## 2. Controlled Synthetic Test Fixtures
- Located at `data/fixtures/synthetic_controlled_scenario.json`.
- Provenance: Explicitly tagged as `SYNTHETIC_CONTROLLED_SCENARIO`.
- Evaluates controlled counterfactual interventions with known ground-truth outcomes (e.g. reducing database `max_connections` below peak application demand).
