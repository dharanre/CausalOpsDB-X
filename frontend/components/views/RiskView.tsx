"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Server
} from "lucide-react";

export const RiskView: React.FC = () => {
  const [magnitude, setMagnitude] = useState<number>(0.8);
  const [criticality, setCriticality] = useState<string>("CRITICAL");
  const [reach, setReach] = useState<number>(3);
  const [policyViolated, setPolicyViolated] = useState<boolean>(false);
  const [headroom, setHeadroom] = useState<number>(10.0);

  // Factor weights
  const weights = {
    magnitude: 0.25,
    criticality: 0.25,
    reach: 0.20,
    policy: 0.15,
    telemetry: 0.15
  };

  const critScores: Record<string, number> = { LOW: 0.2, MEDIUM: 0.5, HIGH: 0.8, CRITICAL: 1.0 };
  const critScore = critScores[criticality] || 0.5;
  const reachNorm = Math.min(1.0, reach / 5.0);
  const polScore = policyViolated ? 1.0 : 0.0;
  const telemScore = Math.max(0.0, Math.min(1.0, 1.0 - headroom / 100.0));

  const contributions = [
    { name: "Resource Criticality", raw: critScore, weight: weights.criticality, score: critScore * weights.criticality * 100, desc: `Rated as ${criticality} tier` },
    { name: "Change Magnitude", raw: magnitude, weight: weights.magnitude, score: magnitude * weights.magnitude * 100, desc: "Proportional configuration delta" },
    { name: "Dependency Reach / Blast Radius", raw: reachNorm, weight: weights.reach, score: reachNorm * weights.reach * 100, desc: `${reach} downstream callers dependent` },
    { name: "Policy Checks", raw: polScore, weight: weights.policy, score: polScore * weights.policy * 100, desc: policyViolated ? "Ingress policy breach" : "All policies satisfied" },
    { name: "Telemetry Saturation", raw: telemScore, weight: weights.telemetry, score: telemScore * weights.telemetry * 100, desc: `${headroom}% headroom remaining` }
  ];

  const totalScore = Math.min(100, Math.max(0, contributions.reduce((acc, c) => acc + c.score, 0)));
  const category = totalScore >= 70 ? "CRITICAL" : totalScore >= 45 ? "HIGH" : totalScore >= 25 ? "MEDIUM" : "LOW";

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-mono text-xs">
      {/* Header */}
      <div className="p-4 rounded-lg bg-graphite-panel border border-graphite-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-accent-amber text-xs">
            <ShieldAlert className="w-4 h-4" />
            <span>TRANSPARENT HEURISTIC RISK & ROOT CAUSE ENGINE</span>
          </div>
          <h1 className="text-lg font-bold text-text-primary tracking-tight mt-0.5">
            Risk & Root Cause Analysis
          </h1>
          <p className="text-xs text-text-secondary">
            Inspect exact factor contributions, mathematical weights, normalized inputs, and traceable root-cause hypotheses.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <span className="text-[10px] text-text-muted uppercase">Aggregated Heuristic Score:</span>
            <div className={`text-xl font-bold ${
              totalScore >= 70 ? "text-accent-red" : totalScore >= 45 ? "text-accent-amber" : "text-accent-lime"
            }`}>
              {totalScore.toFixed(1)} / 100 [{category}]
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Factor Contributions & Interactive Weight Tuning */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Factor Controls (5 Cols) */}
        <div className="lg:col-span-5 p-5 rounded-lg bg-graphite-panel border border-graphite-border space-y-4">
          <div className="flex items-center space-x-2 text-xs font-bold text-text-primary uppercase tracking-wider pb-2 border-b border-graphite-border">
            <Sliders className="w-4 h-4 text-accent-cyan" />
            <span>Factor Inputs & Tuning</span>
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-text-secondary">Change Magnitude Factor:</span>
              <span className="text-accent-cyan font-bold">{magnitude.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={magnitude}
              onChange={(e) => setMagnitude(parseFloat(e.target.value))}
              className="w-full accent-accent-cyan cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-text-secondary">Resource Criticality Tier:</span>
              <span className="text-accent-amber font-bold">{criticality}</span>
            </div>
            <select
              value={criticality}
              onChange={(e) => setCriticality(e.target.value)}
              className="w-full bg-graphite-surface border border-graphite-border rounded px-2.5 py-1.5 text-text-primary text-xs outline-none"
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-text-secondary">Dependency Reach (Blast Radius):</span>
              <span className="text-accent-cyan font-bold">{reach} Callers</span>
            </div>
            <input
              type="range"
              min="0"
              max="6"
              step="1"
              value={reach}
              onChange={(e) => setReach(parseInt(e.target.value))}
              className="w-full accent-accent-cyan cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-text-secondary">Measured Telemetry Headroom (%):</span>
              <span className="text-accent-lime font-bold">{headroom}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={headroom}
              onChange={(e) => setHeadroom(parseFloat(e.target.value))}
              className="w-full accent-accent-lime cursor-pointer"
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center space-x-2 text-[11px] text-text-primary cursor-pointer">
              <input
                type="checkbox"
                checked={policyViolated}
                onChange={(e) => setPolicyViolated(e.target.checked)}
                className="rounded bg-graphite-surface border-graphite-border accent-accent-red"
              />
              <span>Trigger Explicit Policy Violation (Open CIDR / Port)</span>
            </label>
          </div>
        </div>

        {/* Right: Factor Contribution Table & Breakdown (7 Cols) */}
        <div className="lg:col-span-7 rounded-lg bg-graphite-panel border border-graphite-border overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b border-graphite-border bg-graphite-surface/30 flex items-center justify-between">
            <h3 className="text-xs uppercase font-semibold text-text-primary tracking-wider">
              Factor Contribution Breakdown
            </h3>
            <span className="text-[11px] text-text-muted">Normalized Sum: {totalScore.toFixed(1)} / 100</span>
          </div>

          <div className="p-4 space-y-4 flex-1">
            {contributions.map((c, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-text-primary font-semibold">{c.name}</span>
                  <span className="font-mono text-accent-cyan">
                    +{c.score.toFixed(1)} pts <span className="text-text-muted">(Weight: {(c.weight * 100).toFixed(0)}%)</span>
                  </span>
                </div>
                <div className="w-full h-2 rounded bg-graphite-base overflow-hidden">
                  <div
                    className="h-full bg-accent-cyan rounded"
                    style={{ width: `${(c.score / 25) * 100}%` }}
                  />
                </div>
                <div className="text-[10px] text-text-muted">{c.desc} (Normalized: {c.raw.toFixed(2)})</div>
              </div>
            ))}
          </div>

          {/* Root Cause Hypotheses */}
          <div className="p-4 border-t border-graphite-border bg-graphite-surface/20 space-y-2">
            <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider block">
              Ranked Root-Cause Hypotheses
            </span>
            <div className="space-y-1.5">
              <div className="p-2.5 rounded bg-graphite-surface border border-graphite-border text-[11px] flex items-center justify-between">
                <div>
                  <strong className="text-accent-cyan">Rank #1: aws_db_instance.postgres_primary</strong>
                  <p className="text-text-muted text-[10px]">Intervention target subject to resource downscaling & connection bottleneck.</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-accent-lime/10 text-accent-lime font-bold text-[10px]">
                  94% Plausibility
                </span>
              </div>
              <div className="p-2.5 rounded bg-graphite-surface border border-graphite-border text-[11px] flex items-center justify-between">
                <div>
                  <strong className="text-text-primary">Rank #2: service.checkoutservice</strong>
                  <p className="text-text-muted text-[10px]">First-hop database caller experiencing cascading client pool exhaustion.</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-accent-amber/10 text-accent-amber font-bold text-[10px]">
                  82% Plausibility
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
