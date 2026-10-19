# CausalOpsDB-X REST API Specification

Interactive Swagger UI documentation is available at `http://localhost:8000/docs`.

## Endpoints Summary

### System & Health
- `GET /api/health` — Service liveness and environment metadata.
- `GET /api/overview` — High-level workspace stats, node counts, telemetry coverage, highest-risk resources.

### Datasets & Benchmarks
- `GET /api/datasets` — Real data source inventory and licenses.
- `POST /api/datasets/bootstrap?mode={quickstart|suite|full}` — Trigger benchmark downloads.
- `GET /api/datasets/status` — Status of cached and loaded benchmark files.

### Infrastructure & Terraform
- `POST /api/changes/parse` — Parses HCL or Terraform Plan JSON; redacts secrets.
- `POST /api/changes/upload` — Accepts uploaded `.tf` or `.json` files.

### Causal Dependency Graph
- `GET /api/graph` — Returns nodes, edges, criticality, and highlighted impact paths.
- `POST /api/graph/custom_mapping` — Adds user-verified caller-to-callee dependencies.

### Telemetry Explorer
- `GET /api/telemetry/summary?case_id={id}` — Time-series metrics, logs, and distributed traces.

### Incidents & RCAEval
- `GET /api/incidents` — Lists loaded benchmark failure cases with ground-truth labels.
- `GET /api/incidents/{id}` — Fetches details and telemetry for a specific benchmark case.

### Counterfactual Simulation
- `POST /api/simulations` — Executes deterministic simulation run and persists results.
- `GET /api/simulations/{id}` — Retrieves persisted simulation run.
- `GET /api/simulations/{id}/explanations` — Fetches formulas, assumptions, and explanations.

### Alternative Comparison
- `POST /api/scenarios/compare` — Compares proposed change with engineered alternatives.

### Pattern Mining
- `GET /api/patterns` — Returns cataloged incident sequences.
- `POST /api/patterns/run` — Re-mines patterns with configurable $Z$-score thresholds.

### Evaluation & Audit
- `POST /api/evaluations/run` — Executes empirical evaluation across benchmark cases.
- `GET /api/reports/{id}` — Exports Markdown audit report.
- `GET /api/settings` / `PUT /api/settings` — Workspace configuration and risk weights.
