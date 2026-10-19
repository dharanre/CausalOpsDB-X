"use client";

import React, { useState, useEffect } from "react";
import { Sidebar, ActiveTab } from "@/components/Sidebar";
import { WorkspaceHeader } from "@/components/WorkspaceHeader";
import { AuditReportModal } from "@/components/AuditReportModal";
import { OverviewView } from "@/components/views/OverviewView";
import { ChangeLabView } from "@/components/views/ChangeLabView";
import { GraphView } from "@/components/views/GraphView";
import { TelemetryView } from "@/components/views/TelemetryView";
import { SimulatorView } from "@/components/views/SimulatorView";
import { AlternativesView } from "@/components/views/AlternativesView";
import { RiskView } from "@/components/views/RiskView";
import { IncidentsView } from "@/components/views/IncidentsView";
import { PatternsView } from "@/components/views/PatternsView";
import { DatasetsView } from "@/components/views/DatasetsView";
import { MethodologyView } from "@/components/views/MethodologyView";
import { SettingsView } from "@/components/views/SettingsView";

import { api } from "@/lib/api";
import { OverviewStats, SimulationRunResponse, InterventionInput } from "@/types";

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [selectedCaseForTelemetry, setSelectedCaseForTelemetry] = useState<string>("re1ob_adservice_cpu_1");
  const [activeSimulation, setActiveSimulation] = useState<SimulationRunResponse | null>(null);
  const [highlightedImpactPath, setHighlightedImpactPath] = useState<string[]>([]);
  
  // Audit Report Modal
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [reportMarkdown, setReportMarkdown] = useState<string>("");

  useEffect(() => {
    api.getOverview().then(setStats).catch(console.error);
  }, [activeTab]);

  const handleOpenReport = async (simId?: string) => {
    const id = simId || activeSimulation?.simulation_id || "preview";
    try {
      const res = await api.getReport(id);
      setReportMarkdown(res.content);
      setIsReportOpen(true);
    } catch (err: any) {
      console.error("Report fetch error:", err);
      setIsReportOpen(true);
    }
  };

  const handleSimulationCompleted = (sim: SimulationRunResponse) => {
    setActiveSimulation(sim);
    setHighlightedImpactPath(sim.affected_path);
  };

  const handleSelectCaseForTelemetry = (caseId: string) => {
    setSelectedCaseForTelemetry(caseId);
    setActiveTab("telemetry");
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-graphite-base">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        benchmarkLoaded={stats ? stats.benchmark_cases_loaded > 0 : false}
        onOpenReport={() => handleOpenReport()}
      />

      {/* Main Workstation Central Canvas */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <WorkspaceHeader
          activeTab={activeTab}
          loadedCasesCount={stats?.benchmark_cases_loaded || 0}
          totalNodesCount={stats?.resource_graph_nodes || 0}
          riskScore={activeSimulation?.risk_score}
          onQuickSimulate={() => setActiveTab("simulator")}
        />

        <main className="flex-1 overflow-y-auto bg-graphite-base">
          {activeTab === "overview" && (
            <OverviewView stats={stats} onNavigate={setActiveTab} />
          )}
          {activeTab === "changelab" && (
            <ChangeLabView
              onNavigateToGraph={() => setActiveTab("graph")}
            />
          )}
          {activeTab === "graph" && (
            <GraphView
              highlightedPath={highlightedImpactPath}
            />
          )}
          {activeTab === "telemetry" && (
            <TelemetryView
              initialCaseId={selectedCaseForTelemetry}
            />
          )}
          {activeTab === "simulator" && (
            <SimulatorView
              onSimulationCompleted={handleSimulationCompleted}
              onNavigateToAlternatives={() => setActiveTab("alternatives")}
              onNavigateToRisk={() => setActiveTab("risk")}
              onOpenReport={(simId) => handleOpenReport(simId)}
            />
          )}
          {activeTab === "alternatives" && (
            <AlternativesView
              currentIntervention={activeSimulation?.intervention}
            />
          )}
          {activeTab === "risk" && (
            <RiskView />
          )}
          {activeTab === "incidents" && (
            <IncidentsView
              onSelectCaseForTelemetry={handleSelectCaseForTelemetry}
            />
          )}
          {activeTab === "patterns" && (
            <PatternsView />
          )}
          {activeTab === "datasets" && (
            <DatasetsView />
          )}
          {activeTab === "methodology" && (
            <MethodologyView />
          )}
          {activeTab === "settings" && (
            <SettingsView />
          )}
        </main>
      </div>

      {/* Audit Report Modal */}
      <AuditReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        reportContent={reportMarkdown}
        simulationId={activeSimulation?.simulation_id || ""}
      />
    </div>
  );
}
