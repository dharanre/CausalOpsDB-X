"use client";

import React from "react";
import { OverviewStats } from "@/types";
import {
  Activity,
  GitFork,
  Database,
  Cpu,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Server
} from "lucide-react";
import { ActiveTab } from "../Sidebar";

interface OverviewViewProps {
  stats: OverviewStats | null;
  onNavigate: (tab: ActiveTab) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ stats, onNavigate }) => {
  if (!stats) {
    return (
      <div className="p-8 text-center text-text-secondary font-mono text-sm animate-pulse">
        Initializing CausalOpsDB-X workspace telemetry...
      </div>
    );
  }

  const statCards = [
    {
      title: "RCAEval Benchmark Cases",
      value: `${stats.benchmark_cases_loaded} / ${stats.total_benchmark_cases}`,
      sub: stats.benchmark_cases_loaded > 0 ? "Validated Real Benchmark Records" : "Pending Download",
      icon: <Database className="w-4 h-4 text-accent-lime" />,
      color: "border-accent-lime/30 text-accent-lime",
      action: () => onNavigate("datasets")
    },
    {
      title: "Causal Twin Graph",
      value: `${stats.resource_graph_nodes} Nodes`,
      sub: `${stats.resource_graph_edges} Verified Dependencies`,
      icon: <GitFork className="w-4 h-4 text-accent-cyan" />,
      color: "border-accent-cyan/30 text-accent-cyan",
      action: () => onNavigate("graph")
    },
    {
      title: "Telemetry Coverage",
      value: `${stats.telemetry_coverage_pct}%`,
      sub: "Microservice Metrics, Logs, Traces",
      icon: <Activity className="w-4 h-4 text-accent-lime" />,
      color: "border-accent-lime/30 text-accent-lime",
      action: () => onNavigate("telemetry")
    },
    {
      title: "Recent Simulations",
      value: `${stats.recent_simulations_count} Executed`,
      sub: "Counterfactual Runs Audited",
      icon: <Cpu className="w-4 h-4 text-accent-cyan" />,
      color: "border-accent-cyan/30 text-accent-cyan",
      action: () => onNavigate("simulator")
    }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="p-4 rounded-lg bg-graphite-panel border border-graphite-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-accent-lime mb-1">
            <span className="w-2 h-2 rounded-full bg-accent-lime animate-pulse" />
            <span>OPERATIONAL PRE-DEPLOYMENT DIGITAL TWIN</span>
          </div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">
            Evidence-Grounded Infrastructure Change Intelligence
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Don't wait for the incident. Simulate the change deterministically against causal topology and real benchmark telemetry.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate("changelab")}
            className="px-3.5 py-2 rounded bg-graphite-surface hover:bg-graphite-hover border border-graphite-border text-xs text-text-primary font-medium transition-colors"
          >
            Review Terraform
          </button>
          <button
            onClick={() => onNavigate("simulator")}
            className="px-4 py-2 rounded bg-accent-lime hover:bg-accent-limeHover text-graphite-base text-xs font-semibold transition-colors flex items-center space-x-1.5"
          >
            <span>Launch Simulation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            onClick={card.action}
            className="p-4 rounded-lg bg-graphite-panel border border-graphite-border hover:border-graphite-hover transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs text-text-secondary font-mono mb-2">
              <span>{card.title}</span>
              <div className="p-1 rounded bg-graphite-surface border border-graphite-border group-hover:scale-105 transition-transform">
                {card.icon}
              </div>
            </div>
            <div className="text-2xl font-bold text-text-primary font-mono tracking-tight">
              {card.value}
            </div>
            <div className="text-[11px] text-text-muted mt-1 truncate">
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Warnings Banner if any */}
      {stats.dataset_warnings && stats.dataset_warnings.length > 0 && (
        <div className="p-3.5 rounded bg-accent-amber/5 border border-accent-amber/30 text-xs flex items-start space-x-3">
          <AlertTriangle className="w-4 h-4 text-accent-amber shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-accent-amber font-mono uppercase text-[11px]">System Notice & Operational Bounds:</span>
            {stats.dataset_warnings.map((w, i) => (
              <p key={i} className="text-text-secondary text-[11px]">{w}</p>
            ))}
          </div>
        </div>
      )}

      {/* Highest-Risk Modeled Resources Table */}
      <div className="rounded-lg bg-graphite-panel border border-graphite-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-graphite-border flex items-center justify-between bg-graphite-surface/30">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-accent-amber" />
            <h2 className="text-sm font-semibold text-text-primary">Highest-Risk Modeled Resources</h2>
          </div>
          <span className="text-xs text-text-muted font-mono">Calculated from dependency fan-in and failure mode sensitivity</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-graphite-surface/50 text-text-secondary border-b border-graphite-border">
              <tr>
                <th className="py-2.5 px-4 font-medium">Resource Address</th>
                <th className="py-2.5 px-4 font-medium">Type</th>
                <th className="py-2.5 px-4 font-medium">Heuristic Risk</th>
                <th className="py-2.5 px-4 font-medium">Primary Vulnerability Mode</th>
                <th className="py-2.5 px-4 font-medium">Blast Radius</th>
                <th className="py-2.5 px-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-graphite-border text-text-primary">
              {stats.highest_risk_resources.map((res, i) => (
                <tr key={i} className="hover:bg-graphite-surface/30 transition-colors">
                  <td className="py-3 px-4 font-semibold text-text-primary flex items-center space-x-2">
                    <Server className="w-3.5 h-3.5 text-accent-cyan" />
                    <span>{res.resource_id}</span>
                  </td>
                  <td className="py-3 px-4 text-text-secondary uppercase text-[11px]">{res.resource_type}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      res.risk_score >= 70
                        ? "bg-accent-red/10 text-accent-red border border-accent-red/30"
                        : "bg-accent-amber/10 text-accent-amber border border-accent-amber/30"
                    }`}>
                      {res.risk_score} / 100 ({res.risk_category})
                    </span>
                  </td>
                  <td className="py-3 px-4 text-text-secondary text-[11px]">{res.primary_failure_mode}</td>
                  <td className="py-3 px-4 text-text-secondary">{res.blast_radius} caller services</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onNavigate("simulator")}
                      className="px-2 py-1 rounded bg-graphite-surface hover:bg-graphite-hover border border-graphite-border text-[11px] text-accent-cyan transition-colors"
                    >
                      Simulate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
