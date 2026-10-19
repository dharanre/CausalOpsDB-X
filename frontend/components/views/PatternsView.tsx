"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { PatternItem } from "@/types";
import {
  Boxes,
  ArrowRight,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Sparkles,
  RotateCcw
} from "lucide-react";

export const PatternsView: React.FC = () => {
  const [patterns, setPatterns] = useState<PatternItem[]>([]);
  const [thresholdSigma, setThresholdSigma] = useState<number>(2.5);
  const [minSupport, setMinSupport] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [method, setMethod] = useState<string>("");

  const fetchPatterns = (sigma: number, support: number) => {
    setLoading(true);
    api.runPatternMining(sigma, support).then((res) => {
      setPatterns(res.patterns);
      setMethod(res.mining_method);
      setLoading(false);
    }).catch(console.error);
  };

  useEffect(() => {
    fetchPatterns(thresholdSigma, minSupport);
  }, []);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPatterns(thresholdSigma, minSupport);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-mono text-xs">
      {/* Header */}
      <div className="p-4 rounded-lg bg-graphite-panel border border-graphite-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-accent-lime text-xs">
            <Boxes className="w-4 h-4" />
            <span>CHANGE-TO-INCIDENT TEMPORAL SEQUENCE MINING</span>
          </div>
          <h1 className="text-lg font-bold text-text-primary tracking-tight mt-0.5">
            Pattern Miner
          </h1>
          <p className="text-xs text-text-secondary">
            Mine recurring anomaly cascades across actual benchmark runs. Distinguishes observational temporal ordering from verified causal relationships.
          </p>
        </div>

        <div className="p-2.5 rounded bg-graphite-surface border border-graphite-border text-[11px] text-text-muted">
          <span>Discretization Method: </span>
          <strong className="text-accent-cyan">{method || "Z-Score Sliding Window"}</strong>
        </div>
      </div>

      {/* Threshold Controls Form */}
      <form
        onSubmit={handleApply}
        className="p-4 rounded-lg bg-graphite-panel border border-graphite-border flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="text-text-muted">Anomaly Threshold (σ):</span>
            <input
              type="number"
              step="0.1"
              min="1.0"
              max="5.0"
              value={thresholdSigma}
              onChange={(e) => setThresholdSigma(parseFloat(e.target.value))}
              className="bg-graphite-surface border border-graphite-border rounded px-2.5 py-1 text-text-primary text-xs w-20 outline-none"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-text-muted">Min Support Count:</span>
            <input
              type="number"
              min="1"
              max="50"
              value={minSupport}
              onChange={(e) => setMinSupport(parseInt(e.target.value))}
              className="bg-graphite-surface border border-graphite-border rounded px-2.5 py-1 text-text-primary text-xs w-20 outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          className="px-4 py-1.5 rounded bg-accent-lime text-graphite-base hover:bg-accent-limeHover text-xs font-semibold transition-colors"
        >
          Re-mine Patterns
        </button>
      </form>

      {/* Mined Patterns Catalog */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center text-text-muted">Mining sequential incident patterns...</div>
        ) : (
          patterns.map((pat) => (
            <div key={pat.id} className="p-5 rounded-lg bg-graphite-panel border border-graphite-border space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    pat.is_observational
                      ? "bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30"
                      : "bg-accent-lime/10 text-accent-lime border border-accent-lime/30"
                  }`}>
                    {pat.is_observational ? "OBSERVATIONAL_TEMPORAL" : "INTERVENTION_TIED"}
                  </span>
                  <h3 className="text-sm font-bold text-text-primary">{pat.name}</h3>
                </div>

                <div className="flex items-center space-x-3 text-[11px] font-mono">
                  <span className="text-text-secondary">
                    Support: <strong className="text-text-primary">{pat.support_count} cases</strong> ({pat.frequency_pct}%)
                  </span>
                  <span className="text-text-secondary">
                    Confidence: <strong className="text-accent-lime">{(pat.confidence * 100).toFixed(0)}%</strong>
                  </span>
                  <span className="text-text-secondary">
                    Window: <strong className="text-accent-cyan">{pat.time_window_seconds}s</strong>
                  </span>
                </div>
              </div>

              {/* Sequential Event Flow */}
              <div className="p-3 rounded bg-graphite-base border border-graphite-border flex flex-wrap items-center gap-2">
                {pat.sequence.map((step, i) => (
                  <React.Fragment key={i}>
                    <div className="px-2.5 py-1 rounded bg-graphite-surface border border-graphite-border text-text-primary text-xs font-mono font-semibold">
                      <span className="text-accent-cyan mr-1.5">{i + 1}.</span>
                      {step}
                    </div>
                    {i < pat.sequence.length - 1 && (
                      <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Rule & Ground Truth Attribution */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-text-muted pt-1">
                <div>
                  <span className="text-text-secondary font-semibold">Mining Rule: </span>
                  {pat.rule_description}
                </div>
                <div>
                  <span className="text-text-secondary">Supporting Cases: </span>
                  <span className="text-accent-lime">{pat.supporting_cases.join(", ")}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
