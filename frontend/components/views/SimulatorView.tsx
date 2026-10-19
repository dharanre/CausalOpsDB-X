"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import {
  SimulationRunResponse,
  InterventionInput,
  CalculatedEffect
} from "@/types";
import {
  Cpu,
  Play,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Server,
  Layers,
  FileText,
  RotateCcw
} from "lucide-react";

interface SimulatorViewProps {
  onSimulationCompleted?: (sim: SimulationRunResponse) => void;
  onNavigateToAlternatives?: () => void;
  onNavigateToRisk?: () => void;
  onOpenReport?: (simId: string) => void;
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({
  onSimulationCompleted,
  onNavigateToAlternatives,
  onNavigateToRisk,
  onOpenReport
}) => {
  const [targetResource, setTargetResource] = useState<string>("aws_db_instance.postgres_primary");
  const [attribute, setAttribute] = useState<string>("max_connections");
  const [beforeVal, setBeforeVal] = useState<string>("200");
  const [afterVal, setAfterVal] = useState<string>("40");
  const [unit, setUnit] = useState<string>("connections");
  const [reason, setReason] = useState<string>("Cost-reduction configuration resize test");

  const [loading, setLoading] = useState<boolean>(false);
  const [simulation, setSimulation] = useState<SimulationRunResponse | null>(null);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const intervention: InterventionInput = {
        resource_id: targetResource,
        attribute,
        before_val: isNaN(Number(beforeVal)) ? beforeVal : Number(beforeVal),
        after_val: isNaN(Number(afterVal)) ? afterVal : Number(afterVal),
        unit,
        reason
      };

      const res = await api.runSimulation(intervention, `Simulation: ${attribute} = ${afterVal}`);
      setSimulation(res);
      if (onSimulationCompleted) {
        onSimulationCompleted(res);
      }
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (type: "pool_saturation" | "instance_downsize" | "security_exposure") => {
    if (type === "pool_saturation") {
      setTargetResource("aws_db_instance.postgres_primary");
      setAttribute("max_connections");
      setBeforeVal("200");
      setAfterVal("40");
      setUnit("connections");
      setReason("Aggressive downscale below peak 140 connection demand");
    } else if (type === "instance_downsize") {
      setTargetResource("aws_db_instance.postgres_primary");
      setAttribute("instance_class");
      setBeforeVal("db.r6g.xlarge");
      setAfterVal("db.t4g.small");
      setUnit("aws_instance_tier");
      setReason("Instance class downgrade to burstable tier");
    } else if (type === "security_exposure") {
      setTargetResource("aws_security_group.db_sg");
      setAttribute("ingress_cidr");
      setBeforeVal("10.0.10.0/24");
      setAfterVal("0.0.0.0/0");
      setUnit("cidr");
      setReason("Unrestricted ingress CIDR exposure test");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-mono text-xs">
      {/* Header Bar */}
      <div className="p-4 rounded-lg bg-graphite-panel border border-graphite-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-accent-lime text-xs">
            <Cpu className="w-4 h-4" />
            <span>DETERMINISTIC COUNTERFACTUAL ENGINE</span>
          </div>
          <h1 className="text-lg font-bold text-text-primary tracking-tight mt-0.5">
            Counterfactual Simulator
          </h1>
          <p className="text-xs text-text-secondary">
            Execute isolated in-memory interventions. Trace mathematical effects, downstream blast radius, and rule formulas.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-text-muted text-[11px]">Intervention Presets:</span>
          <button
            onClick={() => setPreset("pool_saturation")}
            className="px-2.5 py-1 rounded bg-graphite-surface hover:bg-graphite-hover border border-accent-red/30 text-accent-red text-[11px] transition-colors"
          >
            DB Pool Saturation
          </button>
          <button
            onClick={() => setPreset("instance_downsize")}
            className="px-2.5 py-1 rounded bg-graphite-surface hover:bg-graphite-hover border border-accent-amber/30 text-accent-amber text-[11px] transition-colors"
          >
            Instance Downgrade
          </button>
          <button
            onClick={() => setPreset("security_exposure")}
            className="px-2.5 py-1 rounded bg-graphite-surface hover:bg-graphite-hover border border-accent-cyan/30 text-accent-cyan text-[11px] transition-colors"
          >
            CIDR Exposure
          </button>
        </div>
      </div>

      {/* Intervention Input Form */}
      <div className="p-5 rounded-lg bg-graphite-panel border border-graphite-border space-y-4">
        <h2 className="text-xs uppercase font-semibold text-text-primary tracking-wider flex items-center space-x-2">
          <Server className="w-3.5 h-3.5 text-accent-cyan" />
          <span>Intervention Parameters (Virtual Modification)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-[10px] text-text-muted uppercase block mb-1">Target Resource:</label>
            <select
              value={targetResource}
              onChange={(e) => setTargetResource(e.target.value)}
              className="w-full bg-graphite-surface border border-graphite-border rounded px-3 py-1.5 text-text-primary text-xs outline-none"
            >
              <option value="aws_db_instance.postgres_primary">aws_db_instance.postgres_primary</option>
              <option value="aws_security_group.db_sg">aws_security_group.db_sg</option>
              <option value="aws_elasticache_cluster.redis_cache">aws_elasticache_cluster.redis_cache</option>
              <option value="service.checkoutservice">service.checkoutservice</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-text-muted uppercase block mb-1">Configuration Attribute:</label>
            <input
              type="text"
              value={attribute}
              onChange={(e) => setAttribute(e.target.value)}
              className="w-full bg-graphite-surface border border-graphite-border rounded px-3 py-1.5 text-text-primary text-xs outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] text-text-muted uppercase block mb-1">Baseline Value (Before):</label>
            <input
              type="text"
              value={beforeVal}
              onChange={(e) => setBeforeVal(e.target.value)}
              className="w-full bg-graphite-surface border border-graphite-border rounded px-3 py-1.5 text-text-primary text-xs outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] text-text-muted uppercase block mb-1">Simulated Value (After):</label>
            <input
              type="text"
              value={afterVal}
              onChange={(e) => setAfterVal(e.target.value)}
              className="w-full bg-graphite-surface border border-accent-lime/40 rounded px-3 py-1.5 text-accent-lime font-bold text-xs outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-graphite-border">
          <div className="flex items-center space-x-2 text-[11px] text-text-secondary flex-1">
            <span className="text-text-muted">Rationale:</span>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="bg-graphite-surface border border-graphite-border rounded px-2.5 py-1 text-text-primary text-xs flex-1 outline-none"
            />
          </div>

          <button
            onClick={handleSimulate}
            disabled={loading}
            className="flex items-center justify-center space-x-2 px-6 py-2 rounded bg-accent-lime text-graphite-base hover:bg-accent-limeHover text-xs font-bold tracking-wide transition-colors disabled:opacity-50"
          >
            {loading ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            <span>Execute Counterfactual Simulation</span>
          </button>
        </div>
      </div>

      {/* Simulation Results Display */}
      {simulation && (
        <div className="space-y-6">
          {/* Top Score Banner */}
          <div className="p-4 rounded-lg bg-graphite-panel border border-graphite-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] text-text-muted uppercase tracking-wider block">Heuristic Risk Assessment</span>
              <div className="flex items-center space-x-3 mt-1">
                <span className={`text-2xl font-bold font-mono px-3 py-0.5 rounded ${
                  simulation.risk_score >= 70 ? "bg-accent-red/20 text-accent-red border border-accent-red/40" :
                  simulation.risk_score >= 45 ? "bg-accent-amber/20 text-accent-amber border border-accent-amber/40" :
                  "bg-accent-lime/20 text-accent-lime border border-accent-lime/40"
                }`}>
                  {simulation.risk_score} / 100
                </span>
                <span className="text-sm font-bold text-text-primary uppercase tracking-wide">
                  [{simulation.risk_category} RISK CATEGORY]
                </span>
                <span className="text-xs text-text-muted">
                  Evidence Coverage: <strong>{(simulation.evidence_coverage * 100).toFixed(0)}%</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2.5">
              {onOpenReport && (
                <button
                  onClick={() => onOpenReport(simulation.simulation_id)}
                  className="px-3 py-1.5 rounded bg-graphite-surface hover:bg-graphite-hover border border-graphite-border text-xs text-text-primary font-medium flex items-center space-x-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-accent-cyan" />
                  <span>Audit Report</span>
                </button>
              )}
              {onNavigateToAlternatives && (
                <button
                  onClick={onNavigateToAlternatives}
                  className="px-3 py-1.5 rounded bg-graphite-surface hover:bg-graphite-hover border border-accent-cyan/30 text-accent-cyan text-xs font-medium transition-colors"
                >
                  Compare Alternatives
                </button>
              )}
            </div>
          </div>

          {/* 7-Stage Execution Pipeline */}
          <div className="p-4 rounded-lg bg-graphite-panel border border-graphite-border space-y-3">
            <h3 className="text-xs uppercase font-semibold text-text-primary tracking-wider">
              Simulation Execution Pipeline (Deterministic Stages)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-2">
              {simulation.stages.map((stage) => (
                <div key={stage.stage_number} className="p-2.5 rounded bg-graphite-surface/40 border border-graphite-border space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-accent-cyan font-bold">STAGE {stage.stage_number}</span>
                    <CheckCircle2 className="w-3 h-3 text-accent-lime" />
                  </div>
                  <div className="text-[11px] font-semibold text-text-primary truncate" title={stage.name}>
                    {stage.name}
                  </div>
                  <div className="text-[10px] text-text-muted line-clamp-2" title={stage.details}>
                    {stage.details}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modeled Effects with Mathematical Formulas */}
          <div className="rounded-lg bg-graphite-panel border border-graphite-border overflow-hidden">
            <div className="px-5 py-3 border-b border-graphite-border bg-graphite-surface/30 flex items-center justify-between">
              <h3 className="text-xs uppercase font-semibold text-text-primary tracking-wider">
                Calculated Resource Effects ({simulation.effects.length})
              </h3>
              <span className="text-[11px] text-text-muted">Traceable Formulas & Assumptions</span>
            </div>

            <div className="divide-y divide-graphite-border">
              {simulation.effects.map((effect, idx) => (
                <div key={idx} className="p-4 space-y-2 hover:bg-graphite-surface/20 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        effect.severity === "CRITICAL" ? "bg-accent-red/20 text-accent-red border border-accent-red/40" :
                        effect.severity === "WARNING" ? "bg-accent-amber/20 text-accent-amber border border-accent-amber/40" :
                        "bg-graphite-surface text-text-muted border border-graphite-border"
                      }`}>
                        {effect.severity}
                      </span>
                      <strong className="text-text-primary text-xs">{effect.impact_type}</strong>
                      <span className="text-text-muted">on</span>
                      <span className="text-accent-cyan font-bold">{effect.resource_id}</span>
                    </div>

                    <div className="text-right text-[11px]">
                      <span className="text-accent-lime font-bold">{effect.calculated_value}</span>
                    </div>
                  </div>

                  {/* Formula and Technical Trace */}
                  <div className="p-2.5 rounded bg-graphite-base border border-graphite-border text-[11px] space-y-1">
                    <div className="text-text-secondary flex items-center space-x-2">
                      <span className="text-text-muted font-bold">FORMULA:</span>
                      <code className="text-accent-cyan">{effect.formula}</code>
                    </div>
                    <div className="text-text-secondary">
                      <span className="text-text-muted font-bold">INPUTS:</span> {JSON.stringify(effect.inputs)}
                    </div>
                    <div className="text-text-primary mt-1">
                      {effect.explanation}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Downstream Propagation Path */}
          <div className="p-4 rounded-lg bg-graphite-panel border border-graphite-border space-y-2">
            <span className="text-[10px] uppercase text-text-muted font-bold tracking-wider">
              Traversed Causal Propagation Chain
            </span>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {simulation.affected_path.map((node, i) => (
                <React.Fragment key={node}>
                  <div className="px-3 py-1 rounded bg-graphite-surface border border-graphite-border text-text-primary text-xs font-semibold flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-red" />
                    <span>{node}</span>
                  </div>
                  {i < simulation.affected_path.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Actionable Recommendations */}
          <div className="p-4 rounded-lg bg-accent-lime/5 border border-accent-lime/30 space-y-2">
            <div className="flex items-center space-x-2 text-accent-lime text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Recommended Countermeasures</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-text-secondary">
              {simulation.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
