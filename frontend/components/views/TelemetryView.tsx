"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { TelemetrySummaryResponse, MetricSeries } from "@/types";
import {
  Activity,
  Search,
  Filter,
  Clock,
  Terminal,
  Layers,
  AlertCircle,
  FileText,
  Calendar
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

interface TelemetryViewProps {
  initialCaseId?: string;
}

export const TelemetryView: React.FC<TelemetryViewProps> = ({ initialCaseId }) => {
  const [telemetry, setTelemetry] = useState<TelemetrySummaryResponse | null>(null);
  const [selectedCase, setSelectedCase] = useState<string>(initialCaseId || "re1ob_adservice_cpu_1");
  const [availableCases, setAvailableCases] = useState<string[]>([]);
  const [selectedService, setSelectedService] = useState<string>("ALL");
  const [logFilter, setLogFilter] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch loaded cases from incidents endpoint
    api.listIncidents().then((res) => {
      const ids = res.incidents.map((i: any) => i.case_id);
      setAvailableCases(["synth_db_pool_saturation_001", ...ids]);
      if (ids.length > 0 && !initialCaseId) {
        setSelectedCase(ids[0]);
      }
    });
  }, [initialCaseId]);

  useEffect(() => {
    setLoading(true);
    api.getTelemetry(selectedCase).then((data) => {
      setTelemetry(data);
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  }, [selectedCase]);

  const filteredMetrics = telemetry?.metrics.filter(
    (m) => selectedService === "ALL" || m.service === selectedService
  ) || [];

  const filteredLogs = telemetry?.logs.filter(
    (l) => !logFilter || l.message.toLowerCase().includes(logFilter.toLowerCase()) || l.service.toLowerCase().includes(logFilter.toLowerCase())
  ) || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-mono text-xs">
      {/* Header Bar */}
      <div className="p-4 rounded-lg bg-graphite-panel border border-graphite-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-accent-lime text-xs">
            <Activity className="w-4 h-4" />
            <span>ACTUAL BENCHMARK TELEMETRY & RUNTIME SIGNALS</span>
          </div>
          <h1 className="text-lg font-bold text-text-primary tracking-tight mt-0.5">
            Telemetry Explorer
          </h1>
          <p className="text-xs text-text-secondary">
            Inspect real microservice metric time-series, log streams, and distributed trace spans loaded from benchmark data.
          </p>
        </div>

        {/* Case Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-text-muted">Benchmark Case:</span>
          <select
            value={selectedCase}
            onChange={(e) => setSelectedCase(e.target.value)}
            className="bg-graphite-surface border border-graphite-border rounded px-3 py-1.5 text-text-primary text-xs outline-none"
          >
            {availableCases.map((id) => (
              <option key={id} value={id}>
                {id.startsWith("synth") ? `[SYNTHETIC] ${id}` : `[RCAEVAL] ${id}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-text-muted">Loading telemetry time-series streams...</div>
      ) : !telemetry ? (
        <div className="py-20 text-center text-text-muted">No telemetry available.</div>
      ) : (
        <>
          {/* Metadata & Service Filter Strip */}
          <div className="p-3 rounded-lg bg-graphite-panel border border-graphite-border flex flex-wrap items-center justify-between gap-3 text-[11px]">
            <div className="flex items-center space-x-4">
              <span className="text-text-secondary">
                Provenance: <strong className="text-accent-cyan uppercase">{telemetry.provenance}</strong>
              </span>
              <span className="text-text-secondary">
                Metrics: <strong className="text-text-primary">{telemetry.total_metrics}</strong> series
              </span>
              <span className="text-text-secondary">
                Time Window: <strong className="text-text-primary">{telemetry.time_range[0]}</strong> - <strong className="text-text-primary">{telemetry.time_range[1]}</strong>
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-text-muted">Service Filter:</span>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="bg-graphite-surface border border-graphite-border rounded px-2 py-1 text-text-primary text-xs outline-none"
              >
                <option value="ALL">All Services ({telemetry.services.length})</option>
                {telemetry.services.map((svc) => (
                  <option key={svc} value={svc}>{svc}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Time Series Metric Visualizations (Recharts) */}
          <div className="space-y-4">
            <h2 className="text-xs uppercase font-semibold text-text-primary tracking-wider flex items-center space-x-2">
              <Activity className="w-3.5 h-3.5 text-accent-lime" />
              <span>Time-Series Metric Streams ({filteredMetrics.length})</span>
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredMetrics.slice(0, 4).map((metric, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-graphite-panel border border-graphite-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-text-muted uppercase">{metric.service}</span>
                      <h3 className="text-xs font-bold text-text-primary">{metric.metric_name}</h3>
                    </div>
                    <div className="text-right text-[11px] font-mono">
                      <span className="text-accent-cyan font-bold">p95: {metric.p95} {metric.unit}</span>
                      <span className="text-text-muted block text-[10px]">max: {metric.max}</span>
                    </div>
                  </div>

                  <div className="w-full h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={metric.points}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#191F27" />
                        <XAxis
                          dataKey="timestamp"
                          stroke="#6B7A8A"
                          tick={{ fontSize: 9, fill: "#6B7A8A" }}
                          tickFormatter={(ts) => `${ts % 1000}s`}
                        />
                        <YAxis stroke="#6B7A8A" tick={{ fontSize: 9, fill: "#6B7A8A" }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#12171D", borderColor: "#28313A", fontSize: "11px" }}
                          labelFormatter={(ts) => `Time: ${ts}`}
                          formatter={(v: any) => [`${v} ${metric.unit}`, metric.metric_name]}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#C7F36B"
                          strokeWidth={1.5}
                          dot={false}
                          activeDot={{ r: 4, fill: "#C7F36B" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Logs & Traces Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Logs Stream */}
            <div className="rounded-lg bg-graphite-panel border border-graphite-border overflow-hidden flex flex-col h-80">
              <div className="px-4 py-2.5 bg-graphite-surface/40 border-b border-graphite-border flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-3.5 h-3.5 text-accent-cyan" />
                  <span className="font-semibold text-text-primary text-xs">Log Records</span>
                  <span className="text-[10px] text-text-muted">({filteredLogs.length})</span>
                </div>
                <input
                  type="text"
                  placeholder="Filter logs..."
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                  className="bg-graphite-surface border border-graphite-border rounded px-2 py-0.5 text-[11px] text-text-primary outline-none w-36"
                />
              </div>

              <div className="p-3 overflow-y-auto flex-1 font-mono text-[11px] space-y-1.5 bg-graphite-base/50">
                {!telemetry.has_logs && filteredLogs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-text-muted text-[11px]">
                    No log records cataloged for this benchmark suite (RE1 is metric-only).
                  </div>
                ) : (
                  filteredLogs.map((log, i) => (
                    <div key={i} className="flex items-start space-x-2 text-text-secondary leading-tight">
                      <span className="text-text-muted shrink-0">[{log.timestamp}]</span>
                      <span className={`px-1 rounded text-[9px] font-bold uppercase shrink-0 ${
                        log.level === "ERROR" || log.level === "CRITICAL" ? "bg-accent-red/20 text-accent-red" :
                        log.level === "WARN" ? "bg-accent-amber/20 text-accent-amber" : "text-text-muted"
                      }`}>
                        {log.level}
                      </span>
                      <span className="text-accent-cyan shrink-0">{log.service}:</span>
                      <span className="text-text-primary break-all">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Traces Timeline */}
            <div className="rounded-lg bg-graphite-panel border border-graphite-border overflow-hidden flex flex-col h-80">
              <div className="px-4 py-2.5 bg-graphite-surface/40 border-b border-graphite-border flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Layers className="w-3.5 h-3.5 text-accent-lime" />
                  <span className="font-semibold text-text-primary text-xs">Distributed Trace Spans</span>
                  <span className="text-[10px] text-text-muted">({telemetry.traces.length})</span>
                </div>
              </div>

              <div className="p-3 overflow-y-auto flex-1 font-mono text-[11px] space-y-2 bg-graphite-base/50">
                {!telemetry.has_traces && telemetry.traces.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-text-muted text-[11px]">
                    No distributed trace spans in this case (available in RE2/RE3 suites).
                  </div>
                ) : (
                  telemetry.traces.map((trace, i) => (
                    <div key={i} className="p-2 rounded bg-graphite-panel border border-graphite-border space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-accent-cyan font-bold">{trace.service}</span>
                        <span className="text-accent-lime font-mono">{trace.duration_ms} ms</span>
                      </div>
                      <div className="text-text-secondary text-[10px] flex items-center justify-between">
                        <span>{trace.operation}</span>
                        <span className="text-text-muted">Span ID: {trace.span_id}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
