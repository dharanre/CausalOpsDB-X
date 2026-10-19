"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Settings,
  Sliders,
  Shield,
  Save,
  CheckCircle2,
  Trash2,
  RotateCcw,
  HardDrive
} from "lucide-react";

export const SettingsView: React.FC = () => {
  const [workspace, setWorkspace] = useState<string>("Production Simulation Workspace");
  const [retentionDays, setRetentionDays] = useState<number>(30);
  const [weightMagnitude, setWeightMagnitude] = useState<number>(0.25);
  const [weightCriticality, setWeightCriticality] = useState<number>(0.25);
  const [weightReach, setWeightReach] = useState<number>(0.20);
  const [weightPolicy, setWeightPolicy] = useState<number>(0.15);
  const [weightTelemetry, setWeightTelemetry] = useState<number>(0.15);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    api.getSettings().then((data) => {
      if (data.workspace) setWorkspace(data.workspace);
      if (data.data_retention_days) setRetentionDays(data.data_retention_days);
      if (data.risk_weights) {
        setWeightMagnitude(data.risk_weights.change_magnitude);
        setWeightCriticality(data.risk_weights.resource_criticality);
        setWeightReach(data.risk_weights.dependency_reach);
        setWeightPolicy(data.risk_weights.policy_violation);
        setWeightTelemetry(data.risk_weights.telemetry_saturation);
      }
    }).catch(console.error);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      workspace,
      data_retention_days: retentionDays,
      risk_weights: {
        change_magnitude: weightMagnitude,
        resource_criticality: weightCriticality,
        dependency_reach: weightReach,
        policy_violation: weightPolicy,
        telemetry_saturation: weightTelemetry
      }
    };
    try {
      await api.updateSettings(payload);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    }
  };

  const handleReset = () => {
    if (confirm("Reset local simulation workspace and restore default heuristic weights?")) {
      setWeightMagnitude(0.25);
      setWeightCriticality(0.25);
      setWeightReach(0.20);
      setWeightPolicy(0.15);
      setWeightTelemetry(0.15);
      setRetentionDays(30);
      alert("Workspace reset to default parameters.");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto font-mono text-xs">
      {/* Header */}
      <div className="p-4 rounded-lg bg-graphite-panel border border-graphite-border flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-accent-cyan text-xs">
            <Settings className="w-4 h-4" />
            <span>SYSTEM CONFIGURATION & PERSISTENT WEIGHTS</span>
          </div>
          <h1 className="text-lg font-bold text-text-primary tracking-tight mt-0.5">
            System Settings
          </h1>
          <p className="text-xs text-text-secondary">
            Configure risk factor weighting distributions, simulation rule bounds, and local data persistence.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center space-x-1 px-3 py-1.5 rounded bg-graphite-surface hover:bg-graphite-hover border border-accent-red/30 text-accent-red text-xs transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Workspace Identity */}
        <div className="p-5 rounded-lg bg-graphite-panel border border-graphite-border space-y-4">
          <h2 className="text-xs uppercase font-semibold text-text-primary tracking-wider">
            Workspace Configuration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-text-muted uppercase block mb-1">Active Workspace Name:</label>
              <input
                type="text"
                value={workspace}
                onChange={(e) => setWorkspace(e.target.value)}
                className="w-full bg-graphite-surface border border-graphite-border rounded px-3 py-1.5 text-text-primary text-xs outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-text-muted uppercase block mb-1">Telemetry Cache Retention (Days):</label>
              <input
                type="number"
                value={retentionDays}
                onChange={(e) => setRetentionDays(parseInt(e.target.value))}
                className="w-full bg-graphite-surface border border-graphite-border rounded px-3 py-1.5 text-text-primary text-xs outline-none"
              />
            </div>
          </div>
        </div>

        {/* Risk Weights Sliders */}
        <div className="p-5 rounded-lg bg-graphite-panel border border-graphite-border space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-graphite-border">
            <h2 className="text-xs uppercase font-semibold text-text-primary tracking-wider flex items-center space-x-2">
              <Sliders className="w-3.5 h-3.5 text-accent-cyan" />
              <span>Heuristic Risk Scoring Weights (Must Sum to 1.00)</span>
            </h2>
            <span className="text-[11px] font-bold text-accent-lime">
              Current Sum: {(weightMagnitude + weightCriticality + weightReach + weightPolicy + weightTelemetry).toFixed(2)}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-text-secondary">Change Magnitude Factor Weight:</span>
                <span className="text-accent-cyan font-bold">{weightMagnitude.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.05"
                value={weightMagnitude}
                onChange={(e) => setWeightMagnitude(parseFloat(e.target.value))}
                className="w-full accent-accent-cyan cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-text-secondary">Resource Criticality Factor Weight:</span>
                <span className="text-accent-cyan font-bold">{weightCriticality.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.05"
                value={weightCriticality}
                onChange={(e) => setWeightCriticality(parseFloat(e.target.value))}
                className="w-full accent-accent-cyan cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-text-secondary">Dependency Reach (Blast Radius) Weight:</span>
                <span className="text-accent-cyan font-bold">{weightReach.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.05"
                value={weightReach}
                onChange={(e) => setWeightReach(parseFloat(e.target.value))}
                className="w-full accent-accent-cyan cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-text-secondary">Explicit Policy Checks Weight:</span>
                <span className="text-accent-cyan font-bold">{weightPolicy.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.05"
                value={weightPolicy}
                onChange={(e) => setWeightPolicy(parseFloat(e.target.value))}
                className="w-full accent-accent-cyan cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-text-secondary">Telemetry Saturation / Headroom Weight:</span>
                <span className="text-accent-cyan font-bold">{weightTelemetry.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.05"
                value={weightTelemetry}
                onChange={(e) => setWeightTelemetry(parseFloat(e.target.value))}
                className="w-full accent-accent-cyan cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between">
          {savedSuccess && (
            <div className="flex items-center space-x-1.5 text-accent-lime text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>Settings successfully persisted to SQLite.</span>
            </div>
          )}
          <div className="ml-auto">
            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-2 rounded bg-accent-lime text-graphite-base hover:bg-accent-limeHover text-xs font-bold transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Save & Apply Settings</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
