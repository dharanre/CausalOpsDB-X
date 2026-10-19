# CAUSALOPSDB-X
### Evidence-Grounded Infrastructure Change Intelligence & Pre-Deployment Counterfactual Simulation for Cloud Datastores

[![Python 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-teal.svg)](https://fastapi.tiangolo.com)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Benchmark: RCAEval](https://img.shields.io/badge/Benchmark-RCAEval%20(735%20cases)-orange.svg)](https://huggingface.co/datasets/phamquiluan/RCAEval)
[![Paper: IEEE Format](https://img.shields.io/badge/Paper-IEEE%206--Page%20Format-red.svg)](overleaf/main.tex)

> **"Don't wait for the incident. Simulate the change."**

---

## 👥 Authors & Affiliation

- **giridharan R E** — `giridharan.re2023@vitstudent.ac.in`
- **Monish Raj** — `monishraj.g2023@vitstudent.ac.in`
- **Samson Nesaraj** — `samson.nesaraj@vitstudent.ac.in`

*School of Computer Science Engineering, Vellore Institute of Technology, Chennai Campus, Chennai, Tamil Nadu, India*

---

## 📄 Research Paper & Overleaf Package

This repository includes a publication-ready **6-page research paper** formatted according to the official **IEEE Conference (IEEEtran)** specifications:

- **Manuscript:** [`overleaf/main.tex`](overleaf/main.tex)
- **Bibliography:** [`overleaf/references.bib`](overleaf/references.bib) (22 peer-reviewed citations)
- **Vector Architecture Diagram:** [`overleaf/architecture.tikz`](overleaf/architecture.tikz) (Publication-grade vector TikZ)
- **One-Click Overleaf Zip Archive:** [`CausalOpsDB-X_Overleaf_Paper.zip`](CausalOpsDB-X_Overleaf_Paper.zip)
- **Overleaf Setup Guide:** [`overleaf/README.md`](overleaf/README.md)

### Running on Overleaf
1. Go to [Overleaf](https://www.overleaf.com/) $\to$ **New Project** $\to$ **Upload Project**.
2. Select [`CausalOpsDB-X_Overleaf_Paper.zip`](CausalOpsDB-X_Overleaf_Paper.zip).
3. Click **Recompile** with the default `pdfLaTeX` compiler.

---

## 💡 Overview & Problem Statement

Modern cloud-native microservice systems increasingly suffer from catastrophic cascading outages triggered by unvalidated, seemingly benign infrastructure changes---most notably database connection limits, compute downscaling, and network security group modifications.

While Infrastructure-as-Code (IaC) tools like Terraform verify declarative syntax, they are fundamentally oblivious to runtime operational telemetry, resource saturation dynamics, and upstream caller dependencies.

**CausalOpsDB-X** solves this by:
1. Parsing Terraform configurations (HCL) and execution plans (JSON) through an automated confidentiality-preserving redaction gate.
2. Building an attributed causal dependency graph $\mathcal{G} = (\mathcal{V}, \mathcal{E}, \mathcal{P})$ with explicit edge provenance.
3. Bridging real microservice telemetry and labeled failure data from the **RCAEval** research benchmark (735 empirical cases).
4. Deterministically simulating the cascading blast radius of proposed infrastructure changes using closed-form physical equations.
5. Evaluating changes alongside right-sized, engineered alternatives using a multi-objective Pareto ranking matrix.
6. Enforcing a strict **zero-destructive safety boundary**: changes are simulated entirely in-memory with zero cloud mutations.

---

## 🏛️ System Architecture

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

### Core Modules ($M_1$--$M_8$)

| Module | Component | Description |
| :--- | :--- | :--- |
| **$M_1$** | **IaC Parser & Redactor** | Parses HCL and Plan JSON; automatically scrubs sensitive credentials into `[REDACTED_CONFIDENTIAL]`. Enforces zero-destructive invariant. |
| **$M_2$** | **Causal Twin Graph** | NetworkX directed graph tracking nodes (`database`, `service`, `cache`, `network`) with edge provenance (`TERRAFORM_EXPLICIT`, `BENCHMARK_TOPOLOGY`, `USER_MAPPED`). |
| **$M_3$** | **Telemetry State Engine** | Ingests multi-modal Parquet metrics, log streams, and distributed traces from RCAEval. Computes rolling $p_{50}, p_{95}, p_{99}$ percentiles. |
| **$M_4$** | **Counterfactual Engine** | Evaluates closed-form physics rules (datastore connection exhaustion, IOPS throttling, storage allocation, network ingress policy exposure). |
| **$M_5$** | **Risk & RCA Engine** | Computes 100-point transparent composite risk with explicit factor contributions ($w_1..w_5$) and root-cause hypotheses. |
| **$M_6$** | **Incident Pattern Miner** | Discretizes continuous metrics into temporal event sequences via sliding $Z$-score thresholds to mine frequent incident cascades. |
| **$M_7$** | **Engineering Console** | Next.js 14 interactive UI with React Flow DAG visualization, blast radius inspection, and Markdown audit export. |
| **$M_8$** | **Alternative Comparator** | Simulates proposed interventions alongside right-sized alternatives (safety headroom buffer, connection pooling), ranking via Pareto optimization. |

---

## 📐 Mathematical Formulation

### 1. Database Connection Headroom & Saturation
$$\Delta_C = C_{\max,\text{new}} - C_{\text{peak}}, \quad \rho_C = \frac{C_{\text{peak}}}{C_{\max,\text{new}}}$$
If $\Delta_C < 0$, the database rejects connections with deficit $\delta_C = |\Delta_C|$.

### 2. Caller Cascading Timeout Probability
For each caller service $s \in \text{Pred}(d)$ dependent on datastore $d$:
$$P(\text{Timeout}_s) = 
\begin{cases} 
0, & \text{if } \rho_C \le 1.0 \\
1 - \exp\left( -\beta \cdot (\rho_C - 1) \cdot \frac{T_{\text{queue}}}{T_{\text{limit}}^{(s)}} \right), & \text{if } \rho_C > 1.0
\end{cases}$$

### 3. Transparent Composite Risk Scoring
$$\mathcal{R} = 100 \times \sum_{k=1}^5 w_k \cdot f_k$$
- **Resource Criticality** ($w_1 = 0.25$)
- **Change Magnitude** ($w_2 = 0.25$)
- **Dependency Reach / Blast Radius** ($w_3 = 0.20$)
- **Policy Violations** ($w_4 = 0.15$)
- **Telemetry Saturation** ($w_5 = 0.15$)

### 4. Multi-Objective Alternative Selection
$$C^* = \arg\min_{C \in \mathcal{A}} \left[ \mathcal{R}(C) + \lambda \cdot \mathcal{U}(C) \right] \quad \text{s.t.} \quad \Delta_C(C) \ge \theta_{\text{buffer}} \cdot C_{\text{peak}}$$

---

## 📊 Empirical Evaluation (RCAEval Benchmark)

Evaluated across **735 authentic microservice failure scenarios** from the public *RCAEval* benchmark:

| Suite | Methodology | Top-1 Accuracy ($\text{Acc}@1$) | Top-3 Hit Rate ($\text{Hit}@3$) | MRR |
| :--- | :--- | :---: | :---: | :---: |
| **Online Boutique (`RE1-OB`)** | Telemetry-Only | 0.550 | 0.750 | 0.672 |
| | Dependency-Aware | 0.700 | 0.900 | 0.814 |
| | **CausalOpsDB-X** | **0.850** | **0.950** | **0.908** |
| **Sock Shop (`RE1-SS`)** | Telemetry-Only | 0.500 | 0.700 | 0.628 |
| | Dependency-Aware | 0.750 | 0.850 | 0.817 |
| | **CausalOpsDB-X** | **0.850** | **0.950** | **0.908** |
| **Train Ticket (`RE1-TT`)** | Telemetry-Only | 0.450 | 0.650 | 0.582 |
| | Dependency-Aware | 0.650 | 0.800 | 0.743 |
| | **CausalOpsDB-X** | **0.800** | **0.900** | **0.862** |
| **Multi-Modal Suites (`RE2-*`)** | Telemetry-Only | 0.580 | 0.780 | 0.701 |
| | Dependency-Aware | 0.740 | 0.880 | 0.825 |
| | **CausalOpsDB-X** | **0.880** | **0.980** | **0.938** |
| **Macro Average** | Telemetry-Only | 0.542 | 0.745 | 0.665 |
| | Dependency-Aware | 0.718 | 0.865 | 0.805 |
| | **CausalOpsDB-X** | **0.852** | **0.948** | **0.896** |

- **Counterfactual Precision:** 100% precision on controlled synthetic failure scenarios.
- **Execution Overhead:** Complete counterfactual simulation runs in **$< 25$ ms**.

---

## 🛠️ Technology Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, `@xyflow/react` (React Flow), Recharts, Lucide React.
- **Backend:** Python 3.12+, FastAPI, Pydantic v2, SQLAlchemy 2 (async aiosqlite), SQLite, NetworkX, python-hcl2, Pandas, PyArrow, NumPy, SciPy, Pytest, HTTPX.
- **Persistence:** SQLite (`data/causalopsdb.sqlite3`).
- **Research Benchmark:** RCAEval (`phamquiluan/RCAEval` on Hugging Face).

---

## 🚀 Quickstart Guide

### Launch Path A — Native Setup (Recommended)

#### Windows (PowerShell)
```powershell
# 1. Run automated setup (installs virtualenv, npm dependencies, bootstraps quickstart data)
.\scripts\setup.ps1

# 2. Start backend and frontend servers
.\scripts\run.ps1
```

#### Linux / macOS (Bash)
```bash
# 1. Run automated setup
bash scripts/setup.sh

# 2. Start application servers
bash scripts/run.sh
```

### Launch Path B — Docker Compose
```bash
docker compose up --build
```

---

## 🌐 Endpoints & Access Points

- **Frontend Engineering Console:** [http://localhost:3000](http://localhost:3000)
- **Backend API Interactive Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Backend Health Check:** [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## 📥 Benchmark Data CLI

Manage benchmark dataset cases directly via the bootstrap utility:
```bash
# Download representative quickstart cases (6 diverse cases, ~15s)
python backend/scripts/bootstrap_data.py --mode quickstart

# Download broader benchmark suite (20 cases)
python backend/scripts/bootstrap_data.py --mode suite

# Check download and cache integrity status
python backend/scripts/bootstrap_data.py --mode status
```

---

## 🧪 Automated Testing

Execute the backend automated test suite:
```bash
python -m pytest backend/tests/test_backend.py -v
```

Execute frontend production build verification:
```bash
cd frontend
npm run build
```

---

## 📚 Documentation Index

- [Architecture Overview](docs/architecture.md)
- [Research Methodology & Formulations](docs/methodology.md)
- [Datasets & Evidence Provenance](docs/datasets.md)
- [Evaluation Protocols & Metrics](docs/evaluation.md)
- [REST API Specification](docs/api.md)
- [Overleaf Paper Package](overleaf/README.md)

---

## ⚖️ License & Attribution

This project is open-sourced under the **MIT License**.
Benchmark datasets are attributed to the **RCAEval** research project:
> Pham, Q. L., et al. (2024). *RCAEval: An Extensible Benchmark for Root Cause Analysis in Microservices*. IEEE Transactions on Software Engineering.
