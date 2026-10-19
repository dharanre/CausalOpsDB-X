"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { BenchmarkCase } from "@/types";
import {
  AlertOctagon,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
  Activity,
  ArrowRight,
  Database
} from "lucide-react";

interface IncidentsViewProps {
  onSelectCaseForTelemetry?: (caseId: string) => void;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({
  onSelectCaseForTelemetry
}) => {
  const [incidents, setIncidents] = useState<BenchmarkCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<BenchmarkCase | null>(null);
  const [caseDetails, setCaseDetails] = useState<any | null>(null);
  const [suiteFilter, setSuiteFilter] = useState<string>("ALL");
  const [faultFilter, setFaultFilter] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    api.listIncidents().then((res) => {
      setIncidents(res.incidents);
      if (res.incidents.length > 0) {
        setSelectedCase(res.incidents[0]);
      }
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedCase) {
      api.getIncidentDetail(selectedCase.case_id).then((details) => {
        setCaseDetails(details);
      }).catch(console.error);
    }
  }, [selectedCase]);

  const filteredIncidents = incidents.filter((inc) => {
    const matchSuite = suiteFilter === "ALL" || inc.suite === suiteFilter;
    const matchFault = faultFilter === "ALL" || inc.fault === faultFilter;
    const matchSearch = !search ||
      inc.case_id.toLowerCase().includes(search.toLowerCase()) ||
      inc.root_cause_service.toLowerCase().includes(search.toLowerCase()) ||
      inc.system_name.toLowerCase().includes(search.toLowerCase());
    return matchSuite && matchFault && matchSearch;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-mono text-xs">
      {/* Header */}
      <div className="p-4 rounded-lg bg-graphite-panel border border-graphite-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-accent-cyan text-xs">
            <AlertOctagon className="w-4 h-4" />
            <span>RCAEVAL PUBLIC RESEARCH BENCHMARK GROUND-TRUTH INCIDENTS</span>
          </div>
          <h1 className="text-lg font-bold text-text-primary tracking-tight mt-0.5">
            Incident Explorer
          </h1>
          <p className="text-xs text-text-secondary">
            Inspect authentic microservice failure cases with injection timestamps, ground-truth root cause labels, and multi-modal telemetry.
          </p>
        </div>

        <div className="text-[11px] text-text-secondary text-right">
          <span>Loaded Real Cases: <strong className="text-accent-lime">{incidents.length}</strong></span>
          <span className="block text-[10px] text-text-muted">Attribution: Pham et al. (RCAEval)</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-3 rounded-lg bg-graphite-panel border border-graphite-border flex flex-wrap items-center justify-between gap-3 text-[11px]">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-2.5 py-1 bg-graphite-surface rounded border border-graphite-border">
            <Search className="w-3.5 h-3.5 text-text-secondary" />
            <input
              type="text"
              placeholder="Search case, service, system..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-text-primary outline-none font-mono text-xs w-48"
            />
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-text-muted">Suite:</span>
            <select
              value={suiteFilter}
              onChange={(e) => setSuiteFilter(e.target.value)}
              className="bg-graphite-surface border border-graphite-border rounded px-2 py-1 text-text-primary text-xs outline-none"
            >
              <option value="ALL">All Suites</option>
              <option value="RE1">RE1 (Metrics)</option>
              <option value="RE2">RE2 (Multi-Modal)</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-text-muted">Fault:</span>
            <select
              value={faultFilter}
              onChange={(e) => setFaultFilter(e.target.value)}
              className="bg-graphite-surface border border-graphite-border rounded px-2 py-1 text-text-primary text-xs outline-none"
            >
              <option value="ALL">All Faults</option>
              <option value="cpu">CPU Stress</option>
              <option value="delay">Network Delay</option>
              <option value="mem">Memory Stress</option>
              <option value="socket">Socket Error</option>
            </select>
          </div>
        </div>

        <span className="text-text-muted">{filteredIncidents.length} matching incident(s)</span>
      </div>

      {/* Main Split: Cases List & Selected Case Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List (5 Cols) */}
        <div className="lg:col-span-5 rounded-lg bg-graphite-panel border border-graphite-border overflow-hidden flex flex-col h-[560px]">
          <div className="px-4 py-2.5 bg-graphite-surface/40 border-b border-graphite-border font-semibold text-text-primary flex items-center justify-between">
            <span>Benchmark Cases ({filteredIncidents.length})</span>
            <span className="text-[10px] text-accent-cyan">Ground-Truth Verified</span>
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-graphite-border">
            {filteredIncidents.map((c) => {
              const isSel = selectedCase?.case_id === c.case_id;
              return (
                <div
                  key={c.case_id}
                  onClick={() => setSelectedCase(c)}
                  className={`p-3 cursor-pointer transition-colors ${
                    isSel ? "bg-graphite-surface border-l-2 border-accent-lime text-text-primary" : "hover:bg-graphite-surface/30 text-text-secondary"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="truncate text-text-primary">{c.case_id}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-graphite-surface border border-graphite-border text-accent-cyan">
                      {c.suite}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-[11px] text-text-muted mt-1.5">
                    <span>{c.system_name}</span>
                    <span>•</span>
                    <span className="text-accent-amber font-semibold">{c.fault}</span>
                    <span>•</span>
                    <span>Root: <strong className="text-text-primary">{c.root_cause_service}</strong></span>
                  </div>

                  <div className="flex items-center space-x-2 text-[10px] text-text-muted mt-2">
                    <span className="px-1 rounded bg-graphite-surface text-accent-lime font-mono">
                      {c.n_metrics} metrics
                    </span>
                    {c.has_logs && (
                      <span className="px-1 rounded bg-graphite-surface text-accent-cyan font-mono">
                        logs
                      </span>
                    )}
                    {c.has_traces && (
                      <span className="px-1 rounded bg-graphite-surface text-accent-lime font-mono">
                        traces
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Details Inspector (7 Cols) */}
        <div className="lg:col-span-7 rounded-lg bg-graphite-panel border border-graphite-border p-5 flex flex-col space-y-4">
          {!selectedCase ? (
            <div className="h-full flex items-center justify-center text-text-muted">
              Select an incident case to inspect labels and signals.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-graphite-border">
                <div>
                  <span className="text-[10px] text-text-muted uppercase">Selected Incident Case:</span>
                  <h2 className="text-sm font-bold text-text-primary">{selectedCase.case_id}</h2>
                </div>

                {onSelectCaseForTelemetry && (
                  <button
                    onClick={() => onSelectCaseForTelemetry(selectedCase.case_id)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-accent-lime text-graphite-base hover:bg-accent-limeHover text-xs font-semibold transition-colors"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>View in Telemetry Explorer</span>
                  </button>
                )}
              </div>

              {/* Ground-Truth Notice Banner */}
              <div className="p-3 rounded bg-accent-cyan/10 border border-accent-cyan/30 text-[11px] space-y-1">
                <div className="flex items-center space-x-1.5 text-accent-cyan font-bold">
                  <Database className="w-3.5 h-3.5" />
                  <span>Benchmark Ground-Truth Labels (Supplied by RCAEval Benchmark)</span>
                </div>
                <p className="text-text-secondary">
                  The labels below are benchmark ground-truth annotations supplied by the researchers during fault injection, NOT conclusions discovered by this system.
                </p>
              </div>

              {/* Ground Truth Breakdown */}
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="p-3 rounded bg-graphite-surface border border-graphite-border">
                  <span className="text-text-muted text-[10px] uppercase block">Ground-Truth Root Cause Service</span>
                  <strong className="text-accent-lime text-xs block mt-0.5">{selectedCase.root_cause_service}</strong>
                </div>
                <div className="p-3 rounded bg-graphite-surface border border-graphite-border">
                  <span className="text-text-muted text-[10px] uppercase block">Injected Fault Category</span>
                  <strong className="text-accent-amber text-xs block mt-0.5">{selectedCase.fault} ({selectedCase.fault_description})</strong>
                </div>
                <div className="p-3 rounded bg-graphite-surface border border-graphite-border">
                  <span className="text-text-muted text-[10px] uppercase block">Microservice Application</span>
                  <strong className="text-text-primary text-xs block mt-0.5">{selectedCase.system_name} ({selectedCase.system})</strong>
                </div>
                <div className="p-3 rounded bg-graphite-surface border border-graphite-border">
                  <span className="text-text-muted text-[10px] uppercase block">Fault Injection Timestamp</span>
                  <strong className="text-text-primary text-xs block mt-0.5">{selectedCase.inject_time} (Epoch Unix)</strong>
                </div>
              </div>

              {/* Telemetry Availability Summary */}
              <div className="p-3 rounded bg-graphite-surface/40 border border-graphite-border space-y-2">
                <span className="text-[10px] text-text-muted uppercase font-bold">Available Benchmark Artifacts:</span>
                <div className="flex items-center space-x-3 text-[11px]">
                  <span className="flex items-center space-x-1 text-accent-lime">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{selectedCase.n_metrics} Metrics Columns ({selectedCase.n_timesteps} Timesteps)</span>
                  </span>
                  <span className={`flex items-center space-x-1 ${selectedCase.has_logs ? "text-accent-lime" : "text-text-muted"}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Logs: {selectedCase.has_logs ? "Cataloged" : "Unavailable in RE1"}</span>
                  </span>
                  <span className={`flex items-center space-x-1 ${selectedCase.has_traces ? "text-accent-lime" : "text-text-muted"}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Traces: {selectedCase.has_traces ? "Cataloged" : "Unavailable in RE1"}</span>
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
