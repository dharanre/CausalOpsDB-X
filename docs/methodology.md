# CausalOpsDB-X Research Methodology & Mathematical Formulation

## Research Innovations

### Innovation A: Multi-Scenario Counterfactual Comparison
Instead of assessing a proposed change in isolation, CausalOpsDB-X constructs an isolated copy of the modeled system state, applies candidate configurations, and evaluates downstream impact paths against the identical baseline.
- **Proposed Intervention:** Evaluates the user's intended parameter change.
- **Engineered Alternatives:** Evaluates right-sized alternatives (e.g., maintaining a $25\%$ safety buffer above observed peak demand or introducing PgBouncer/RDS Proxy connection multiplexing).
- **Ranking Criteria:** Multi-objective constraint satisfaction:
  $$\text{Minimize } \text{RiskScore}(C) + \lambda \cdot \text{UnsatisfiedDemand}(C)$$

### Innovation B: Evidence-Linked Impact Propagation
Every predicted failure is grounded in explicit topological edges and verified telemetry signals:
- **Database Connection Saturation:**
  $$\text{Headroom} = C_{\max,\text{new}} - C_{\text{peak}}$$
  $$\text{SaturationRatio} = \frac{C_{\text{peak}}}{C_{\max,\text{new}}}$$
  If $\text{Headroom} < 0$, the database rejects connections ($\Delta = |C_{\max,\text{new}} - C_{\text{peak}}|$ deficit).
- **Caller Propagation:**
  For each caller service $S_i$ where $\text{Edge}(S_i \to DB) = \text{DEPENDS\_ON}$:
  $$P(\text{Timeout}) = f(\text{SaturationRatio}) \implies \text{Cascading 504 Gateway Timeout}$$

### Innovation C: Change-to-Incident Pattern Analysis
- Discretizes metric time-series streams into temporal event sequences using sliding $Z$-score thresholds:
  $$Z_t = \frac{x_t - \mu_0}{\sigma_0} > \theta_{\sigma}$$
- Mines frequent sequences with support count $S \ge S_{\min}$ within configurable time windows ($W \le 300\text{s}$).
- Explicitly distinguishes observational correlations from intervention-tied causal mechanisms.
