"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { ScenarioCompareResponse, InterventionInput, AlternativeCandidate } from "@/types";
import {
  Split,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Award,
  Layers,
  Sparkles
} from "lucide-react";

interface AlternativesViewProps {
  currentIntervention?: InterventionInput;
}

export const AlternativesView: React.FC<AlternativesViewProps> = ({ currentIntervention }) => {
  const [comparison, setComparison] = useState<ScenarioCompareResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const defaultProposed: InterventionInput = currentIntervention || {
    resource_id: "aws_db_instance.postgres_primary",
    attribute: "max_connections",
    before_val: 200,
    after_val: 40,
    unit: "connections",
    reason: "Cost downscaling test"
  };

  useEffect(() => {
    setLoading(true);
    api.compareScenarios(defaultProposed, defaultProposed.resource_id)
      .then((data) => {
        setComparison(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-mono text-xs">
      {/* Header */}
      <div className="p-4 rounded-lg bg-graphite-panel border border-graphite-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-accent-cyan text-xs">
            <Split className="w-4 h-4" />
            <span>MULTI-SCENARIO COUNTERFACTUAL COMPARISON</span>
          </div>
          <h1 className="text-lg font-bold text-text-primary tracking-tight mt-0.5">
            Alternative Configuration Matrix
          </h1>
          <p className="text-xs text-text-secondary">
            Compare the user-proposed intervention against systematically evaluated safer alternatives against the identical modeled baseline.
          </p>
        </div>

        {comparison && (
          <div className="p-2.5 rounded bg-accent-lime/10 border border-accent-lime/30 text-accent-lime text-[11px] max-w-md">
            <strong>Engine Recommendation:</strong> {comparison.recommendation}
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-text-muted">Evaluating alternative configurations...</div>
      ) : !comparison ? (
        <div className="py-20 text-center text-text-muted">No comparison data available.</div>
      ) : (
        <div className="space-y-6">
          {/* Candidates Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Proposed (Original) */}
            <div className="rounded-lg bg-graphite-panel border-2 border-accent-red/40 overflow-hidden flex flex-col">
              <div className="p-3.5 bg-accent-red/10 border-b border-accent-red/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-accent-red font-bold uppercase tracking-wider block">Proposed Change</span>
                  <h3 className="text-xs font-bold text-text-primary mt-0.5">{comparison.proposed.name}</h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent-red text-graphite-base">
                  Rank #{comparison.proposed.score_rank}
                </span>
              </div>

              <div className="p-4 flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted text-[11px]">Heuristic Risk Score:</span>
                  <span className="text-base font-bold text-accent-red font-mono">
                    {comparison.proposed.risk_score} / 100
                  </span>
                </div>

                <div>
                  <span className="text-text-muted text-[10px] uppercase font-bold block mb-1">Key Modeled Effects:</span>
                  <div className="space-y-1">
                    {comparison.proposed.modeled_effects.map((e, idx) => (
                      <div key={idx} className="p-2 rounded bg-graphite-surface border border-graphite-border text-[11px] flex items-center justify-between">
                        <span className="text-text-primary">{e.impact_type}</span>
                        <span className="text-accent-red font-bold text-[10px]">{e.severity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-text-muted text-[10px] uppercase font-bold block mb-1">Trade-offs & Risks:</span>
                  <ul className="list-disc list-inside space-y-1 text-text-secondary text-[11px]">
                    {comparison.proposed.trade_offs.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="text-text-muted text-[10px] uppercase font-bold block mb-1">Operational Constraints:</span>
                  <ul className="list-disc list-inside space-y-1 text-text-muted text-[11px]">
                    {comparison.proposed.operational_constraints.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Alternatives */}
            {comparison.alternatives.map((alt) => {
              const isTop = alt.score_rank === 1;
              return (
                <div
                  key={alt.id}
                  className={`rounded-lg bg-graphite-panel border-2 overflow-hidden flex flex-col ${
                    isTop ? "border-accent-lime shadow-lg shadow-accent-lime/10" : "border-graphite-border"
                  }`}
                >
                  <div className={`p-3.5 border-b flex items-center justify-between ${
                    isTop ? "bg-accent-lime/10 border-accent-lime/30" : "bg-graphite-surface/40 border-graphite-border"
                  }`}>
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                        isTop ? "text-accent-lime" : "text-accent-cyan"
                      }`}>
                        {isTop ? "★ Optimal Candidate" : "Engineered Alternative"}
                      </span>
                      <h3 className="text-xs font-bold text-text-primary mt-0.5 truncate max-w-[200px]" title={alt.name}>
                        {alt.name}
                      </h3>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isTop ? "bg-accent-lime text-graphite-base" : "bg-graphite-surface text-text-primary border border-graphite-border"
                    }`}>
                      Rank #{alt.score_rank}
                    </span>
                  </div>

                  <div className="p-4 flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted text-[11px]">Heuristic Risk Score:</span>
                      <span className="text-base font-bold text-accent-lime font-mono">
                        {alt.risk_score} / 100
                      </span>
                    </div>

                    <div>
                      <span className="text-text-muted text-[10px] uppercase font-bold block mb-1">Modeled Effects:</span>
                      <div className="space-y-1">
                        {alt.modeled_effects.map((e, idx) => (
                          <div key={idx} className="p-2 rounded bg-graphite-surface border border-graphite-border text-[11px] flex items-center justify-between">
                            <span className="text-text-primary">{e.impact_type}</span>
                            <span className="text-accent-lime font-bold text-[10px]">{e.severity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-text-muted text-[10px] uppercase font-bold block mb-1">Trade-offs:</span>
                      <ul className="list-disc list-inside space-y-1 text-text-secondary text-[11px]">
                        {alt.trade_offs.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="text-text-muted text-[10px] uppercase font-bold block mb-1">Operational Constraints:</span>
                      <ul className="list-disc list-inside space-y-1 text-text-muted text-[11px]">
                        {alt.operational_constraints.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ranking Objective Explanation */}
          <div className="p-4 rounded-lg bg-graphite-panel border border-graphite-border space-y-1 text-[11px] text-text-secondary">
            <span className="text-text-muted font-bold uppercase text-[10px] block">Ranking Methodology & Formal Objective:</span>
            <p>
              Candidates are evaluated using: <code className="text-accent-cyan">{comparison.ranking_criteria}</code>.
            </p>
            <p className="text-text-muted">
              Note: A lower heuristic risk score indicates that known failure modes (pool exhaustion, IOPS throttle, open CIDR) are prevented under observed demand, but does not guarantee zero operational defect rate in unobserved edge scenarios.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
