# CausalOpsDB-X: Overleaf Research Paper Package (6-Page IEEE Format)

This directory contains the complete, publication-grade LaTeX manuscript for **CausalOpsDB-X**, structured specifically for standard 6-page research papers (e.g., IEEE ICSE/ASE/FSE/VLDB/SIGMOD Short/Industry/Engineering Track).

---

## 📁 Package Contents

| File | Description |
| :--- | :--- |
| [`main.tex`](file:///c:/Users/giridharan/Downloads/NoSql%20project/overleaf/main.tex) | Complete IEEEtran manuscript with all sections, math equations, Algorithm 1, Table I, Table II, and TikZ architecture diagram. |
| [`references.bib`](file:///c:/Users/giridharan/Downloads/NoSql%20project/overleaf/references.bib) | 22 comprehensive, authentic BibTeX citations for RCA benchmarks, microservice observability, SCM, and cloud reliability. |
| [`architecture.tikz`](file:///c:/Users/giridharan/Downloads/NoSql%20project/overleaf/architecture.tikz) | Modularized vector TikZ architecture diagram (already inlined in `main.tex` for single-file portability). |
| [`README.md`](file:///c:/Users/giridharan/Downloads/NoSql%20project/overleaf/README.md) | This setup and compilation guide. |

---

## 🚀 How to Use in Overleaf

### Method 1: Instant Single-File Copy (Fastest, ~30 Seconds)
1. Go to [Overleaf](https://www.overleaf.com/) and click **New Project** $\to$ **Blank Project** (Name it `CausalOpsDB-X_Paper`).
2. Open `main.tex` in your local project and copy its entire content.
3. Paste it into the Overleaf editor replacing the default text.
4. In the Overleaf left file tree, click **New File**, name it `references.bib`, and paste the contents of `references.bib`.
5. Click **Recompile** (or press `Ctrl + Enter` / `Cmd + Enter`).

### Method 2: Upload as a ZIP Package
1. Compress the files inside the `overleaf/` folder into a `.zip` archive:
   - On Windows: Right-click `overleaf` folder $\to$ **Compress to ZIP file**.
2. On Overleaf, click **New Project** $\to$ **Upload Project**.
3. Select your `.zip` file. Overleaf will automatically unpack and open `main.tex`.
4. Click **Recompile**.

---

## ⚙️ Overleaf Compiler Configuration
Ensure your Overleaf project settings (gear icon in the top left) are set to default standards:
- **Compiler:** `pdfLaTeX`
- **TeX Live version:** `2023` or `2024` (or `Latest`)
- **Main document:** `main.tex`

---

## 📄 6-Page Paper Layout & Budget Breakdown

The paper is calibrated for high density and rigorous mathematical depth without overflowing page 6:

1. **Page 1:**
   - Title, Authors, Abstract, Index Terms
   - Section I: Introduction (Motivation, shift-left paradigms, SRE challenges)
   - Figure 1: Motivating incident box (PostgreSQL connection pool cliff cascade)
2. **Page 2:**
   - Section I (cont.): Core research contributions ($1$--$4$)
   - Section II: Related Work (IaC Verification, Microservice RCA, Digital Twins)
   - Section III: System Architecture Overview ($M_1$--$M_8$)
3. **Page 3:**
   - **Figure 2: Full Two-Column TikZ Vector Architecture Diagram** spanning $M_1$ through $M_8$ with layered data flows and security boundaries.
   - Section IV: Methodology & Causal Modeling (Graph definitions, edge provenance)
4. **Page 4:**
   - Section IV (cont.): Deterministic closed-form rules (Connection pool headroom, caller timeout sigmoids, IOPS throttling, storage allocation, security policies)
   - **Algorithm 1:** Pre-Deployment Counterfactual Simulation & Blast Radius Propagation
   - Equation \eqref{eq:risk}: 5-Factor transparent heuristic scoring ($w_1$--$w_5$)
   - Section IV (cont.): Multi-objective Pareto alternative optimization
5. **Page 5:**
   - Section V: Temporal Incident Pattern Mining (Sliding $Z$-score discretization, sequential rule miner)
   - Section VI: Empirical Evaluation (Experimental setup on RCAEval)
   - **Table I:** Characteristics of 735 RCAEval benchmark cases across 9 suites
   - Evaluation Metrics ($\text{Acc}@1$, $\text{Hit}@3$, $\text{MRR}$)
   - **Table II:** Comparative quantitative results across 3 microservice benchmark applications
6. **Page 6:**
   - Section VI (cont.): Controlled counterfactual track results, computational latency ($< 25$\,ms), and safety analysis
   - Section VII: Discussion, Threats to Validity, and Cloud Auto-Scaling Dynamics
   - Section VIII: Conclusion & Future Work
   - References (22 balanced, authentic citations typeset in dual-column IEEE format)
