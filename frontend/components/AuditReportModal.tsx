"use client";

import React, { useState } from "react";
import { X, Copy, Download, Check, FileText } from "lucide-react";

interface AuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportContent: string;
  simulationId: string;
}

export const AuditReportModal: React.FC<AuditReportModalProps> = ({
  isOpen,
  onClose,
  reportContent,
  simulationId
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(reportContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([reportContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `causalopsdb-audit-${simulationId || "report"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-graphite-panel border border-graphite-border rounded-lg w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-graphite-border flex items-center justify-between bg-graphite-surface/50">
          <div className="flex items-center space-x-2.5">
            <FileText className="w-5 h-5 text-accent-cyan" />
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Pre-Deployment Simulation Audit Report</h3>
              <p className="text-xs text-text-secondary font-mono">ID: {simulationId || "sim_preview"}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-graphite-surface hover:bg-graphite-hover border border-graphite-border text-xs text-text-primary transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-accent-lime" /> : <Copy className="w-3.5 h-3.5 text-text-secondary" />}
              <span>{copied ? "Copied" : "Copy Markdown"}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-accent-lime text-graphite-base hover:bg-accent-limeHover text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .md</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-graphite-surface"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-text-primary bg-graphite-base leading-relaxed whitespace-pre-wrap selection:bg-accent-cyan/20">
          {reportContent || "No simulation report loaded."}
        </div>
      </div>
    </div>
  );
};
