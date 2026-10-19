# CausalOpsDB-X Architecture

CausalOpsDB-X is an evidence-grounded infrastructure change intelligence and pre-deployment counterfactual simulation platform. It models microservice topologies, database instances, connection pools, and network policies as a causal digital twin, enabling SRE and database reliability engineers to virtually apply infrastructure changes and predict cascading failures before real deployment.

```
                           +----------------------------------------+
                           |     Terraform Input (HCL / Plan JSON)   |
                           +----------------------------------------+
                                               |
                                               v
                                +-------------------------------+
                                |  M1: IaC Parser & Redactor    |
                                +-------------------------------+
                                               |
                                               v
  +----------------------+      +-------------------------------+
  | RCAEval Telemetry &  | ---> |  M2: Causal Twin Graph Engine |
  | OpenTelemetry Data   |      +-------------------------------+
  +----------------------+                     |
                                               v
                                +-------------------------------+
                                | M4: Counterfactual Simulator  |
                                |  (Deterministic Rule Engine)  |
                                +-------------------------------+
                                               |
                     +-------------------------+-------------------------+
                     v                                                   v
      +-------------------------------+                   +-------------------------------+
      | M5: Transparent Risk & RCA    |                   | M8: Multi-Scenario Comparison |
      | Engine (Factor Breakdown)     |                   | & Alternative Ranking Matrix  |
      +-------------------------------+                   +-------------------------------+
                     |                                                   |
                     +-------------------------+-------------------------+
                                               |
                                               v
                                +-------------------------------+
                                |  Next.js Engineering Console  |
                                |    & Markdown Audit Exporter  |
                                +-------------------------------+
```

## Core Modules

### 1. M1 — Infrastructure-as-Code Parser & Redaction Gate (`backend/app/terraform/`)
- Supports native HCL parsing (`python-hcl2`) and standard Terraform Plan JSON (`terraform show -json`).
- Automatically scans and redacts sensitive passwords, tokens, credentials, and private keys into `[REDACTED_CONFIDENTIAL]`.
- Enforces strict safety: never initiates `terraform apply`, `destroy`, or cloud mutations.

### 2. M2 — Causal Dependency Graph (`backend/app/graph/`)
- Backed by NetworkX directed graphs (`nx.DiGraph`).
- Classifies resource nodes into `database`, `service`, `cache`, `network`, `storage`, and `policy`.
- Tracks edge provenance explicitly (`TERRAFORM_EXPLICIT`, `INFERRED_CONFIG`, `USER_MAPPED`, `BENCHMARK_TOPOLOGY`).
- Computes reachability, blast radius, and upstream dependency paths traversed during failures.

### 3. M3 — Telemetry State Engine (`backend/app/telemetry/`)
- Ingests multi-modal Parquet metrics, log streams, and distributed trace spans.
- Computes statistical aggregates ($p_{50}, p_{95}, p_{99}$, mean, max, rate of change) across microservice services.

### 4. M4 — Deterministic Counterfactual Engine (`backend/app/counterfactual/`)
- Clones isolated in-memory states before applying virtual interventions.
- Applies documented rules:
  - Database connection pool limits vs. active demand ($C_{\text{demand}} > C_{\max}$)
  - Instance sizing and compute IOPS throttling
  - Storage consumption projections vs. allocated disk capacity
  - Security group ingress CIDR exposure ($0.0.0.0/0$)
  - Downstream caller propagation (e.g. client pool exhaustion $\to$ 504 Gateway Timeouts)
- Records exact mathematical formulas, inputs, assumptions, and calculated outcomes.

### 5. M5 — Risk Assessment & RCA Engine (`backend/app/risk/`)
- Transparent heuristic formulation combining:
  1. Change Magnitude ($w_1 = 0.25$)
  2. Resource Criticality ($w_2 = 0.25$)
  3. Dependency Reach / Blast Radius ($w_3 = 0.20$)
  4. Policy Violations ($w_4 = 0.15$)
  5. Telemetry Headroom Saturation ($w_5 = 0.15$)
- Generates ranked root-cause hypotheses and flags insufficient evidence when telemetry is absent.

### 6. M8 — Alternative Comparison & Ranking Matrix (`backend/app/counterfactual/alternatives.py`)
- Evaluates the proposed change alongside systematically constructed safer alternatives against the same modeled baseline.
- Ranks candidates using a multi-objective function minimizing risk score subject to peak demand satisfaction.
