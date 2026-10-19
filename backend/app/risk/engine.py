from typing import Any, Optional
from pydantic import BaseModel, Field

class FactorContribution(BaseModel):
    factor_name: str
    raw_value: float
    weight: float
    weighted_score: float
    description: str

class RootCauseHypothesis(BaseModel):
    candidate_service: str
    rank: int
    plausibility_score: float  # 0.0 - 1.0
    evidence_type: str  # TELEMETRY_ANOMALY, TOPOLOGY_PROXIMITY, INTERVENTION_TARGET
    explanation: str

class RiskAssessment(BaseModel):
    risk_score: float  # 0 - 100
    risk_category: str  # LOW, MEDIUM, HIGH, CRITICAL, INSUFFICIENT_EVIDENCE
    evidence_coverage: float  # 0.0 - 1.0
    change_severity: str
    affected_resource_count: int
    dependency_reach: int
    factor_contributions: list[FactorContribution] = Field(default_factory=list)
    root_cause_hypotheses: list[RootCauseHypothesis] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    assumptions: list[str] = Field(default_factory=list)
    missing_evidence_warnings: list[str] = Field(default_factory=list)

class RiskEngine:
    DEFAULT_WEIGHTS = {
        "change_magnitude": 0.25,
        "resource_criticality": 0.25,
        "dependency_reach": 0.20,
        "policy_violation": 0.15,
        "telemetry_saturation": 0.15
    }

    def evaluate_risk(
        self,
        resource_id: str,
        criticality: str,
        dependency_reach: int,
        magnitude_factor: float,  # 0.0 - 1.0
        policy_violated: bool = False,
        telemetry_headroom_pct: Optional[float] = None,  # None = missing telemetry
        has_benchmark_evidence: bool = True,
        weights: Optional[dict[str, float]] = None
    ) -> RiskAssessment:
        w = weights or self.DEFAULT_WEIGHTS
        contributions: list[FactorContribution] = []
        missing_evidence: list[str] = []

        # 1. Criticality raw score
        crit_map = {"LOW": 0.2, "MEDIUM": 0.5, "HIGH": 0.8, "CRITICAL": 1.0}
        crit_score = crit_map.get(criticality.upper(), 0.5)
        contributions.append(FactorContribution(
            factor_name="Resource Criticality",
            raw_value=crit_score,
            weight=w["resource_criticality"],
            weighted_score=round(crit_score * w["resource_criticality"] * 100, 2),
            description=f"Resource '{resource_id}' is rated as {criticality.upper()} criticality tier."
        ))

        # 2. Change magnitude
        mag = min(1.0, max(0.0, magnitude_factor))
        contributions.append(FactorContribution(
            factor_name="Change Magnitude",
            raw_value=mag,
            weight=w["change_magnitude"],
            weighted_score=round(mag * w["change_magnitude"] * 100, 2),
            description="Proportional scale of configuration attribute modification."
        ))

        # 3. Dependency reach
        reach_norm = min(1.0, dependency_reach / 5.0)
        contributions.append(FactorContribution(
            factor_name="Dependency Reach / Blast Radius",
            raw_value=reach_norm,
            weight=w["dependency_reach"],
            weighted_score=round(reach_norm * w["dependency_reach"] * 100, 2),
            description=f"{dependency_reach} downstream service(s) directly or transitively depend on this component."
        ))

        # 4. Policy violation
        pol_score = 1.0 if policy_violated else 0.0
        contributions.append(FactorContribution(
            factor_name="Explicit Policy Checks",
            raw_value=pol_score,
            weight=w["policy_violation"],
            weighted_score=round(pol_score * w["policy_violation"] * 100, 2),
            description="Ingress exposure / compliance rule checks." if policy_violated else "All security policies satisfied."
        ))

        # 5. Telemetry headroom
        if telemetry_headroom_pct is None:
            missing_evidence.append("Active telemetry headroom unmeasured. Assuming conservative risk penalty.")
            telem_score = 0.7  # Do not assume missing telemetry is healthy!
            evidence_cov = 0.55
        else:
            # Low headroom = high risk score
            telem_score = max(0.0, min(1.0, 1.0 - (telemetry_headroom_pct / 100.0)))
            evidence_cov = 0.95

        contributions.append(FactorContribution(
            factor_name="Telemetry Headroom / Saturation",
            raw_value=telem_score,
            weight=w["telemetry_saturation"],
            weighted_score=round(telem_score * w["telemetry_saturation"] * 100, 2),
            description=f"Measured headroom: {telemetry_headroom_pct if telemetry_headroom_pct is not None else 'UNAVAILABLE'}%"
        ))

        total_score = sum(c.weighted_score for c in contributions)
        total_score = round(min(100.0, max(0.0, total_score)), 1)

        category = "LOW"
        if evidence_cov < 0.6 and total_score > 30:
            category = "INSUFFICIENT_EVIDENCE"
        elif total_score >= 70:
            category = "CRITICAL"
        elif total_score >= 45:
            category = "HIGH"
        elif total_score >= 25:
            category = "MEDIUM"

        severity = "MAJOR" if total_score >= 50 else ("MODERATE" if total_score >= 25 else "MINOR")

        hypotheses = [
            RootCauseHypothesis(
                candidate_service=resource_id,
                rank=1,
                plausibility_score=0.94 if mag > 0.5 else 0.70,
                evidence_type="INTERVENTION_TARGET",
                explanation="Direct target of infrastructure intervention and configuration reduction."
            )
        ]
        if dependency_reach > 0:
            hypotheses.append(
                RootCauseHypothesis(
                    candidate_service="service.checkoutservice",
                    rank=2,
                    plausibility_score=0.82,
                    evidence_type="TOPOLOGY_PROXIMITY",
                    explanation="First-hop caller database consumer prone to connection queue blocking."
                )
            )

        return RiskAssessment(
            risk_score=total_score,
            risk_category=category,
            evidence_coverage=evidence_cov,
            change_severity=severity,
            affected_resource_count=1 + dependency_reach,
            dependency_reach=dependency_reach,
            factor_contributions=contributions,
            root_cause_hypotheses=hypotheses,
            recommendations=[
                "Deploy changes during low-traffic maintenance window",
                "Ensure circuit breakers or client pool timeouts are active on callers",
                "Monitor database connection count and thread pool saturation closely"
            ],
            assumptions=[
                "Baseline load pattern reflects standard operational peak",
                "Downstream services do not have unlimited internal retry buffers"
            ],
            missing_evidence_warnings=missing_evidence
        )
