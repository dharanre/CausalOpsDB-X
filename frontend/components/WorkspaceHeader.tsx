"use client";

import React from "react";
import { ShieldCheck, Database, HardDrive, Terminal } from "lucide-react";

interface WorkspaceHeaderProps {
  activeTab: string;
  loadedCasesCount: number;
  totalNodesCount: number;
  riskScore?: number;
  onQuickSimulate?: () => void;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  activeTab,
  loadedCasesCount,
  totalNodesCount,
  riskScore,
  onQuickSimulate,
}) => {
  return (
    <header className="h-14 border-b border-graphite-border bg-graphite-panel px-6 flex items-center justify-between select-none shrink-0">
      <div className="flex items-center space-x-4 text-xs font-mono">
        <div className="flex items-center space-x-2 text-text-primary">
          <Terminal className="w-4 h-4 text-accent-cyan" />
          <span className="font-semibold uppercase tracking-wider text-accent-cyan">
            {activeTab}
          </span>
          <span className="text-text-muted">/</span>
          <span className="text-text-secondary">workspace://prod-sim</span>
        </div>

        <div className="hidden md:flex items-center space-x-3 text-[11px] text-text-secondary pl-4 border-l border-graphite-border">
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-accent-lime" />
            RCAEval: <strong className="text-text-primary">{loadedCasesCount}</strong> cases
          </span>
          <span className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-accent-cyan" />
            Graph: <strong className="text-text-primary">{totalNodesCount}</strong> nodes
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Safety Mode Badge */}
        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded bg-graphite-surface border border-graphite-border text-[11px] font-mono text-text-secondary">
          <ShieldCheck className="w-3.5 h-3.5 text-accent-lime" />
          <span>DESTRUCTIVE_OPS: BLOCKED</span>
        </div>

        {onQuickSimulate && (
          <button
            onClick={onQuickSimulate}
            className="px-3 py-1.5 rounded bg-accent-lime text-graphite-base hover:bg-accent-limeHover text-xs font-semibold tracking-wide transition-colors shadow-sm"
          >
            Run Counterfactual
          </button>
        )}
      </div>
    </header>
  );
};
