"use client";

import React from "react";
import {
  LayoutDashboard,
  FileCode2,
  GitFork,
  Activity,
  Cpu,
  Split,
  ShieldAlert,
  AlertOctagon,
  Boxes,
  Database,
  BarChart3,
  Settings,
  Flame,
  FileDown
} from "lucide-react";

export type ActiveTab =
  | "overview"
  | "changelab"
  | "graph"
  | "telemetry"
  | "simulator"
  | "alternatives"
  | "risk"
  | "incidents"
  | "patterns"
  | "datasets"
  | "methodology"
  | "settings";

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  benchmarkLoaded: boolean;
  onOpenReport?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  benchmarkLoaded,
  onOpenReport
}) => {
  const navItems: Array<{ id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }> = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "changelab", label: "Change Lab", icon: <FileCode2 className="w-4 h-4" />, badge: "IaC" },
    { id: "graph", label: "Causal Twin Graph", icon: <GitFork className="w-4 h-4" /> },
    { id: "telemetry", label: "Telemetry Explorer", icon: <Activity className="w-4 h-4" /> },
    { id: "simulator", label: "Counterfactual Sim", icon: <Cpu className="w-4 h-4 text-accent-lime" />, badge: "Core" },
    { id: "alternatives", label: "Alternative Matrix", icon: <Split className="w-4 h-4" /> },
    { id: "risk", label: "Risk & RCA Engine", icon: <ShieldAlert className="w-4 h-4 text-accent-amber" /> },
    { id: "incidents", label: "Incident Explorer", icon: <AlertOctagon className="w-4 h-4" />, badge: benchmarkLoaded ? "RCAEval" : "Empty" },
    { id: "patterns", label: "Pattern Miner", icon: <Boxes className="w-4 h-4" /> },
    { id: "datasets", label: "Datasets & Evidence", icon: <Database className="w-4 h-4" /> },
    { id: "methodology", label: "Evaluation Suite", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "settings", label: "System Settings", icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 bg-graphite-panel border-r border-graphite-border flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-graphite-border flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded bg-accent-lime/10 border border-accent-lime/40 flex items-center justify-center">
            <Flame className="w-4 h-4 text-accent-lime" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-wider text-text-primary uppercase flex items-center gap-1.5">
              CausalOpsDB-X
              <span className="text-[10px] px-1 py-0.5 rounded bg-accent-cyan/10 text-accent-cyan font-mono border border-accent-cyan/30">
                v1.0
              </span>
            </div>
            <div className="text-[10px] text-text-secondary truncate">
              Change Intelligence Twin
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Environment Status */}
      <div className="px-4 py-2.5 bg-graphite-surface/40 border-b border-graphite-border text-[11px] flex items-center justify-between font-mono">
        <span className="text-text-secondary">ENV</span>
        <span className="flex items-center gap-1.5 text-accent-lime">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-lime animate-pulse" />
          SIMULATION_ONLY
        </span>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-2.5 space-y-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs transition-colors font-medium ${
                isActive
                  ? "bg-accent-lime/10 text-accent-lime border border-accent-lime/30"
                  : "text-text-secondary hover:text-text-primary hover:bg-graphite-surface/60 border border-transparent"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                    isActive
                      ? "bg-accent-lime/20 text-accent-lime"
                      : "bg-graphite-surface text-text-muted border border-graphite-border"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Export Report Action */}
      {onOpenReport && (
        <div className="p-3 border-t border-graphite-border bg-graphite-surface/20">
          <button
            onClick={onOpenReport}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded bg-graphite-surface hover:bg-graphite-hover border border-graphite-border text-xs text-text-primary transition-colors font-medium"
          >
            <FileDown className="w-3.5 h-3.5 text-accent-cyan" />
            <span>Export Audit Report</span>
          </button>
        </div>
      )}

      {/* Footer Info */}
      <div className="p-3 border-t border-graphite-border text-[10px] text-text-muted font-mono flex items-center justify-between">
        <span>RCAEval Grounded</span>
        <span>Deterministic</span>
      </div>
    </aside>
  );
};
