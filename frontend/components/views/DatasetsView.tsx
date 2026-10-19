"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { DatasetInventoryItem } from "@/types";
import {
  Database,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  HardDrive
} from "lucide-react";

export const DatasetsView: React.FC = () => {
  const [datasets, setDatasets] = useState<DatasetInventoryItem[]>([]);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloadingMode, setDownloadingMode] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([api.getDatasets(), api.getDatasetStatus()])
      .then(([ds, st]) => {
        setDatasets(ds);
        setStatus(st);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDownload = async (mode: string) => {
    setDownloadingMode(mode);
    try {
      await api.bootstrapDataset(mode);
      loadData();
    } catch (err: any) {
      alert(`Bootstrap failed: ${err.message}`);
    } finally {
      setDownloadingMode(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-mono text-xs">
      {/* Header */}
      <div className="p-4 rounded-lg bg-graphite-panel border border-graphite-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-accent-lime text-xs">
            <Database className="w-4 h-4" />
            <span>AUTHENTIC RESEARCH BENCHMARK INVENTORY & EVIDENCE REGISTRY</span>
          </div>
          <h1 className="text-lg font-bold text-text-primary tracking-tight mt-0.5">
            Datasets & Evidence Inventory
          </h1>
          <p className="text-xs text-text-secondary">
            Manage genuine public benchmark downloads (RCAEval), cache status, ground-truth label schemas, and controlled synthetic test fixtures.
          </p>
        </div>

        {/* Bootstrap Actions */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => handleDownload("quickstart")}
            disabled={downloadingMode !== null}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded bg-accent-lime text-graphite-base hover:bg-accent-limeHover text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloadingMode === "quickstart" ? "Downloading..." : "Download Quickstart (6 Cases)"}</span>
          </button>

          <button
            onClick={() => handleDownload("suite")}
            disabled={downloadingMode !== null}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-graphite-surface hover:bg-graphite-hover border border-graphite-border text-xs text-text-primary transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-accent-cyan" />
            <span>{downloadingMode === "suite" ? "Downloading..." : "Download Suite (20 Cases)"}</span>
          </button>
        </div>
      </div>

      {/* Cache & Record Metrics */}
      {status && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-graphite-panel border border-graphite-border">
            <span className="text-[10px] text-text-muted uppercase">Cataloged Benchmark Index:</span>
            <div className="text-xl font-bold text-text-primary mt-1 font-mono">
              {status.cached_cases || 735} Cases Available
            </div>
            <span className="text-[11px] text-text-secondary mt-0.5 block">HuggingFace: phamquiluan/RCAEval</span>
          </div>

          <div className="p-4 rounded-lg bg-graphite-panel border border-graphite-border">
            <span className="text-[10px] text-text-muted uppercase">Locally Validated & Loaded:</span>
            <div className="text-xl font-bold text-accent-lime mt-1 font-mono">
              {status.total_cases_loaded} Cases
            </div>
            <span className="text-[11px] text-text-secondary mt-0.5 block">Online Boutique, Sock Shop, Train Ticket</span>
          </div>

          <div className="p-4 rounded-lg bg-graphite-panel border border-graphite-border">
            <span className="text-[10px] text-text-muted uppercase">Total Loaded Metric Records:</span>
            <div className="text-xl font-bold text-accent-cyan mt-1 font-mono">
              {status.total_metrics_records} Records
            </div>
            <span className="text-[11px] text-text-secondary mt-0.5 block">Parquet & JSON Ingestion Validated</span>
          </div>
        </div>
      )}

      {/* Dataset Inventory Cards */}
      <div className="space-y-4">
        <h2 className="text-xs uppercase font-semibold text-text-primary tracking-wider">
          Registered Data Sources & Evidence Provenance
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {datasets.map((ds) => (
            <div key={ds.id} className="p-5 rounded-lg bg-graphite-panel border border-graphite-border space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    ds.is_synthetic ? "bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30" : "bg-accent-lime/10 text-accent-lime border border-accent-lime/30"
                  }`}>
                    {ds.is_synthetic ? "SYNTHETIC_CONTROLLED_SCENARIO" : "REAL_PUBLIC_RESEARCH_BENCHMARK"}
                  </span>
                  <span className="text-[11px] font-semibold text-text-primary">{ds.status}</span>
                </div>

                <h3 className="text-sm font-bold text-text-primary mt-2">{ds.name}</h3>
                <p className="text-[11px] text-text-secondary mt-1">{ds.attribution}</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-graphite-border text-[11px]">
                <div className="flex justify-between">
                  <span className="text-text-muted">Publisher:</span>
                  <span className="text-text-primary">{ds.publisher}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">License / Terms:</span>
                  <span className="text-text-primary">{ds.license}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-muted">Official Source:</span>
                  <a
                    href={ds.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent-cyan hover:underline flex items-center space-x-1"
                  >
                    <span>Inspect Repository</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
