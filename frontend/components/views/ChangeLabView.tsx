"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import { TerraformParseResponse, ResourceChange } from "@/types";
import {
  FileCode2,
  Upload,
  Play,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers,
  ArrowRight,
  RefreshCw,
  FolderOpen
} from "lucide-react";

interface ChangeLabViewProps {
  onParsedChanges?: (changes: ResourceChange[]) => void;
  onNavigateToGraph?: () => void;
}

const SAMPLE_HCL = `# Sample Terraform HCL: PostgreSQL RDS Resizing & Security Group
resource "aws_db_instance" "postgres_primary" {
  identifier           = "production-core-db"
  allocated_storage    = 100
  instance_class       = "db.t4g.small"
  engine               = "postgres"
  max_connections      = 50
  master_password      = "super_secret_pg_pass_123"
  multi_az             = false
}

resource "aws_security_group" "db_sg" {
  name        = "aurora-pg-sg"
  description = "Controls ingress traffic to database tier"

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.10.0/24"]
  }
}

resource "aws_elasticache_cluster" "redis_cache" {
  cluster_id      = "checkout-session-cache"
  engine          = "redis"
  node_type       = "cache.t4g.micro"
  num_cache_nodes = 1
}`;

const SAMPLE_PLAN_JSON = `{
  "format_version": "1.2",
  "terraform_version": "1.8.5",
  "resource_changes": [
    {
      "address": "aws_db_instance.postgres_primary",
      "type": "aws_db_instance",
      "name": "postgres_primary",
      "change": {
        "actions": ["update"],
        "before": {
          "instance_class": "db.r6g.xlarge",
          "max_connections": 250,
          "allocated_storage": 100,
          "master_password": "super_secret_db_password"
        },
        "after": {
          "instance_class": "db.t4g.small",
          "max_connections": 50,
          "allocated_storage": 100,
          "master_password": "super_secret_db_password"
        }
      }
    }
  ]
}`;

export const ChangeLabView: React.FC<ChangeLabViewProps> = ({
  onParsedChanges,
  onNavigateToGraph
}) => {
  const [content, setContent] = useState<string>(SAMPLE_HCL);
  const [fileType, setFileType] = useState<"hcl" | "json">("hcl");
  const [loading, setLoading] = useState<boolean>(false);
  const [parseResult, setParseResult] = useState<TerraformParseResponse | null>(null);
  const [selectedChange, setSelectedChange] = useState<ResourceChange | null>(null);

  const handleParse = async () => {
    setLoading(true);
    try {
      const res = await api.parseTerraform(content, fileType);
      setParseResult(res);
      if (res.resource_changes && res.resource_changes.length > 0) {
        setSelectedChange(res.resource_changes[0]);
        if (onParsedChanges) {
          onParsedChanges(res.resource_changes);
        }
      }
    } catch (err: any) {
      alert(`Parse failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isJson = file.name.endsWith(".json");
    setFileType(isJson ? "json" : "hcl");

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setContent(text);
    };
    reader.readAsText(file);
  };

  const loadPreset = (type: "hcl" | "json") => {
    setFileType(type);
    setContent(type === "hcl" ? SAMPLE_HCL : SAMPLE_PLAN_JSON);
    setParseResult(null);
    setSelectedChange(null);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg bg-graphite-panel border border-graphite-border">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-accent-cyan">
            <FileCode2 className="w-4 h-4" />
            <span>INFRASTRUCTURE-AS-CODE PARSER & REDACTION GATE</span>
          </div>
          <h1 className="text-lg font-bold text-text-primary tracking-tight mt-0.5">
            Terraform Change Lab
          </h1>
          <p className="text-xs text-text-secondary">
            Parse HCL configurations or standard `terraform show -json` plan outputs. Sensitive secrets are automatically redacted.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <label className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-graphite-surface hover:bg-graphite-hover border border-graphite-border text-xs text-text-primary cursor-pointer font-mono transition-colors">
            <Upload className="w-3.5 h-3.5 text-accent-cyan" />
            <span>Upload File</span>
            <input type="file" accept=".tf,.json" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={() => loadPreset("hcl")}
            className="px-2.5 py-1.5 rounded bg-graphite-surface hover:bg-graphite-hover border border-graphite-border text-xs font-mono text-text-secondary transition-colors"
          >
            Load HCL Preset
          </button>
          <button
            onClick={() => loadPreset("json")}
            className="px-2.5 py-1.5 rounded bg-graphite-surface hover:bg-graphite-hover border border-graphite-border text-xs font-mono text-text-secondary transition-colors"
          >
            Load Plan JSON
          </button>

          <button
            onClick={handleParse}
            disabled={loading}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded bg-accent-lime text-graphite-base hover:bg-accent-limeHover text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            <span>Parse & Validate</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Split: Editor & Analysis Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Code / Plan Input (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col rounded-lg bg-graphite-panel border border-graphite-border overflow-hidden">
          <div className="px-4 py-2.5 border-b border-graphite-border bg-graphite-surface/40 flex items-center justify-between font-mono text-xs text-text-secondary">
            <div className="flex items-center space-x-3">
              <span className="font-semibold text-text-primary">Source Editor</span>
              <span className="text-text-muted">|</span>
              <span className="text-accent-cyan">{fileType.toUpperCase()}</span>
            </div>
            <span>{content.split("\n").length} lines</span>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            spellCheck={false}
            className="w-full h-[520px] p-4 bg-graphite-base text-text-primary font-mono text-xs resize-none outline-none focus:ring-1 focus:ring-accent-cyan/30 leading-relaxed"
            placeholder="Paste your Terraform .tf or terraform show -json plan here..."
          />
        </div>

        {/* Right Column: Parsed Changes Breakdown & Redaction (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* Summary Status Panel */}
          <div className="p-4 rounded-lg bg-graphite-panel border border-graphite-border">
            <h3 className="text-xs font-mono font-semibold text-text-primary uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Parsed Resource Changes</span>
              {parseResult && (
                <span className="text-accent-lime text-[11px]">
                  {parseResult.total_changes} Change(s) Extracted
                </span>
              )}
            </h3>

            {!parseResult ? (
              <div className="py-8 text-center text-xs text-text-muted font-mono">
                Click "Parse & Validate" to extract resource graph changes.
              </div>
            ) : parseResult.errors.length > 0 ? (
              <div className="p-3 rounded bg-accent-red/10 border border-accent-red/30 text-xs text-accent-red font-mono">
                {parseResult.errors.join(", ")}
              </div>
            ) : (
              <div className="space-y-2">
                {parseResult.resource_changes.map((change, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedChange(change)}
                    className={`p-3 rounded border cursor-pointer font-mono transition-all ${
                      selectedChange?.address === change.address
                        ? "bg-graphite-surface border-accent-cyan/50 text-text-primary"
                        : "bg-graphite-surface/40 border-graphite-border text-text-secondary hover:border-graphite-hover"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="truncate">{change.address}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        change.action === "update" ? "bg-accent-amber/10 text-accent-amber border border-accent-amber/30" :
                        change.action === "create" ? "bg-accent-lime/10 text-accent-lime border border-accent-lime/30" :
                        change.action === "delete" ? "bg-accent-red/10 text-accent-red border border-accent-red/30" :
                        "bg-graphite-surface text-text-muted border border-graphite-border"
                      }`}>
                        {change.action}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-[11px] text-text-muted mt-2">
                      <span>{change.attributes_changed.length} attributes modified</span>
                      {change.sensitive_attributes.length > 0 && (
                        <span className="flex items-center space-x-1 text-accent-amber">
                          <Lock className="w-3 h-3" />
                          <span>{change.sensitive_attributes.length} Redacted</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detailed Inspector of Selected Change */}
          {selectedChange && (
            <div className="p-4 rounded-lg bg-graphite-panel border border-graphite-border flex-1 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-graphite-border">
                <span className="font-semibold text-text-primary">{selectedChange.name}</span>
                <span className="text-[11px] text-text-muted">{selectedChange.type}</span>
              </div>

              <div>
                <span className="text-text-muted text-[10px] uppercase font-semibold">Modified Attributes:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {selectedChange.attributes_changed.map((attr, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-graphite-surface border border-graphite-border text-[11px] text-accent-cyan">
                      {attr}
                    </span>
                  ))}
                </div>
              </div>

              {selectedChange.sensitive_attributes.length > 0 && (
                <div className="p-2.5 rounded bg-accent-amber/5 border border-accent-amber/30 text-[11px] flex items-start space-x-2 text-accent-amber">
                  <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Automated Secret Redaction Active:</span>
                    <p className="text-text-secondary mt-0.5">
                      Sensitive fields ({selectedChange.sensitive_attributes.join(", ")}) masked with [REDACTED_CONFIDENTIAL].
                    </p>
                  </div>
                </div>
              )}

              {selectedChange.after && (
                <div>
                  <span className="text-text-muted text-[10px] uppercase font-semibold">Simulated Desired State (After):</span>
                  <pre className="mt-1.5 p-2.5 rounded bg-graphite-base border border-graphite-border text-[11px] text-text-secondary overflow-x-auto max-h-48">
                    {JSON.stringify(selectedChange.after, null, 2)}
                  </pre>
                </div>
              )}

              {onNavigateToGraph && (
                <button
                  onClick={onNavigateToGraph}
                  className="w-full mt-2 py-2 rounded bg-graphite-surface hover:bg-graphite-hover border border-accent-cyan/30 text-accent-cyan text-xs font-semibold flex items-center justify-center space-x-2 transition-colors"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Inspect in Causal Twin Graph</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
