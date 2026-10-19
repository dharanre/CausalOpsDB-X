# Evaluation Protocol & Metrics

CausalOpsDB-X implements strict, repeatable evaluation protocols evaluated on genuine public research benchmark cases.

## Metrics
1. **Top-1 Accuracy ($\text{Acc}@1$):** Fraction of cases where the true injected root cause is ranked at position 1:
   $$\text{Acc}@1 = \frac{1}{N} \sum_{i=1}^N \mathbb{I}(\text{Rank}_i = 1)$$
2. **Top-3 Hit Rate ($\text{Hit}@3$):** Fraction of cases where the true root cause appears within the top 3 candidates:
   $$\text{Hit}@3 = \frac{1}{N} \sum_{i=1}^N \mathbb{I}(\text{Rank}_i \le 3)$$
3. **Mean Reciprocal Rank (MRR):**
   $$\text{MRR} = \frac{1}{N} \sum_{i=1}^N \frac{1}{\text{Rank}_i}$$

## Compared Methodologies
1. **Telemetry-Only Ranking:** Ranks services solely by statistical variance and $Z$-score anomalies in time-series telemetry.
2. **Dependency-Aware Ranking:** Weights telemetry anomalies by graph call centrality and upstream fan-in.
3. **Combined Evidence-Aware Engine:** Integrates metric anomalies, causal reachability paths, and fault signature pattern matching.

## Controlled Counterfactual Track
Evaluated separately from benchmark RCA to avoid conflating observational anomaly ranking with intervention impact assessment.
- Verified on `synth_db_pool_saturation_001` with known expected outcomes.
- Measures counterfactual prediction precision and false positive rate.
