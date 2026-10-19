"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  Node,
  Edge,
  MarkerType
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { api } from "@/lib/api";
import { GraphResponse, GraphNode, GraphEdge } from "@/types";
import {
  GitFork,
  Search,
  Filter,
  Plus,
  Shield,
  Database,
  Layers,
  Cpu,
  RefreshCw,
  Info
} from "lucide-react";

interface GraphViewProps {
  highlightedPath?: string[];
  onSelectNode?: (nodeId: string) => void;
}

export const GraphView: React.FC<GraphViewProps> = ({
  highlightedPath,
  onSelectNode
}) => {
  const [graphData, setGraphData] = useState<GraphResponse | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [loading, setLoading] = useState<boolean>(true);

  // Form for custom edge mapping
  const [showMappingModal, setShowMappingModal] = useState<boolean>(false);
  const [customSource, setCustomSource] = useState<string>("");
  const [customTarget, setCustomTarget] = useState<string>("");
  const [customRel, setCustomRel] = useState<string>("DEPENDS_ON");

  const fetchGraph = useCallback(async (path?: string[]) => {
    setLoading(true);
    try {
      const data = await api.getGraph(path);
      setGraphData(data);

      // Layout nodes in a clean topological grid
      const initialNodes: Node[] = data.nodes.map((n, i) => {
        // Layout: Gateways on top, Services in middle, Databases/Caches at bottom
        let x = 120 + (i % 3) * 260;
        let y = 100;
        if (n.type === "gateway") {
          y = 50;
          x = 280;
        } else if (n.type === "service") {
          y = 180 + Math.floor(i / 3) * 110;
        } else if (n.type === "database" || n.type === "cache" || n.type === "storage") {
          y = 480;
          x = 100 + (i % 3) * 280;
        } else if (n.type === "policy") {
          y = 590;
          x = 240;
        }

        const isHighlighted = path && path.includes(n.id);

        return {
          id: n.id,
          position: { x, y },
          data: {
            label: (
              <div className="p-3 text-left">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-graphite-surface text-accent-cyan border border-graphite-border">
                    {n.type}
                  </span>
                  <span className={`text-[9px] font-bold px-1 rounded uppercase ${
                    n.criticality === "CRITICAL" ? "text-accent-red" :
                    n.criticality === "HIGH" ? "text-accent-amber" : "text-text-secondary"
                  }`}>
                    {n.criticality}
                  </span>
                </div>
                <div className="text-xs font-semibold text-text-primary font-mono truncate max-w-[180px]">
                  {n.name}
                </div>
                <div className="text-[10px] text-text-muted mt-1 truncate">
                  {n.id}
                </div>
              </div>
            )
          },
          style: {
            background: "#12171D",
            color: "#E9EEF2",
            border: isHighlighted
              ? "2px solid #EF4444"
              : "1px solid #28313A",
            borderRadius: "8px",
            width: 220,
            boxShadow: isHighlighted ? "0 0 15px rgba(239, 68, 68, 0.35)" : "none"
          }
        };
      });

      const initialEdges: Edge[] = data.edges.map((e) => {
        const isImpact = e.is_impact_path;
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.relationship,
          animated: isImpact,
          style: {
            stroke: isImpact ? "#EF4444" : "#64D8F5",
            strokeWidth: isImpact ? 3 : 1.5
          },
          labelStyle: {
            fill: "#98A5B3",
            fontSize: 9,
            fontFamily: "monospace"
          },
          labelBgStyle: {
            fill: "#12171D",
            fillOpacity: 0.85
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isImpact ? "#EF4444" : "#64D8F5"
          }
        };
      });

      setNodes(initialNodes);
      setEdges(initialEdges);
    } catch (err: any) {
      console.error("Failed fetching graph:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGraph(highlightedPath);
  }, [highlightedPath, fetchGraph]);

  const onNodesChange = useCallback(
    (changes: any) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const handleNodeClick = (_: any, node: Node) => {
    const raw = graphData?.nodes.find((n) => n.id === node.id);
    if (raw) {
      setSelectedNode(raw);
      if (onSelectNode) onSelectNode(raw.id);
    }
  };

  const handleCreateMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSource || !customTarget) return;

    const formData = new FormData();
    formData.append("source", customSource);
    formData.append("target", customTarget);
    formData.append("relationship", customRel);

    try {
      await fetch("http://localhost:8000/api/graph/custom_mapping", {
        method: "POST",
        body: formData
      });
      setShowMappingModal(false);
      fetchGraph(highlightedPath);
    } catch (err: any) {
      alert(`Error adding mapping: ${err.message}`);
    }
  };

  const filteredNodes = useMemo(() => {
    if (!searchQuery && filterType === "ALL") return nodes;
    return nodes.filter((n) => {
      const matchSearch = n.id.toLowerCase().includes(searchQuery.toLowerCase());
      const raw = graphData?.nodes.find((item) => item.id === n.id);
      const matchFilter = filterType === "ALL" || raw?.type === filterType;
      return matchSearch && matchFilter;
    });
  }, [nodes, searchQuery, filterType, graphData]);

  return (
    <div className="relative w-full h-[calc(100vh-56px)] flex overflow-hidden bg-graphite-base">
      {/* Top Filter and Controls Bar */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-3 bg-graphite-panel/90 backdrop-blur-md p-2 rounded-lg border border-graphite-border shadow-lg">
        <div className="flex items-center space-x-2 px-2 py-1 bg-graphite-surface rounded border border-graphite-border text-xs">
          <Search className="w-3.5 h-3.5 text-text-secondary" />
          <input
            type="text"
            placeholder="Search resource node..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-text-primary outline-none font-mono text-xs w-44"
          />
        </div>

        <div className="flex items-center space-x-1.5 text-xs font-mono text-text-secondary">
          <Filter className="w-3.5 h-3.5" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-graphite-surface border border-graphite-border rounded px-2 py-1 text-text-primary text-xs outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="database">Databases</option>
            <option value="service">Services</option>
            <option value="cache">Caches</option>
            <option value="policy">Policies</option>
            <option value="gateway">Gateways</option>
          </select>
        </div>

        <button
          onClick={() => setShowMappingModal(true)}
          className="flex items-center space-x-1 px-2.5 py-1 rounded bg-graphite-surface hover:bg-graphite-hover border border-accent-cyan/30 text-accent-cyan text-xs font-mono transition-colors"
        >
          <Plus className="w-3 h-3" />
          <span>Add Dependency Mapping</span>
        </button>

        <button
          onClick={() => fetchGraph(highlightedPath)}
          className="p-1.5 rounded bg-graphite-surface hover:bg-graphite-hover border border-graphite-border text-text-secondary transition-colors"
          title="Reload graph"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main React Flow Canvas */}
      <div className="flex-1 w-full h-full">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center text-xs font-mono text-text-muted">
            Rendering Causal Dependency Graph...
          </div>
        ) : (
          <ReactFlow
            nodes={filteredNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            fitView
            minZoom={0.2}
            maxZoom={2}
          >
            <Background color="#191F27" gap={20} size={1} />
            <Controls />
          </ReactFlow>
        )}
      </div>

      {/* Node Details Inspector Sidebar */}
      {selectedNode && (
        <div className="w-80 bg-graphite-panel border-l border-graphite-border p-4 flex flex-col space-y-4 overflow-y-auto shadow-xl z-20 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-graphite-border">
            <span className="font-semibold text-text-primary uppercase tracking-wider">Node Inspector</span>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-text-muted hover:text-text-primary"
            >
              ×
            </button>
          </div>

          <div>
            <span className="text-text-muted text-[10px] uppercase font-semibold">Address / Identifier:</span>
            <div className="mt-1 text-accent-cyan font-bold break-all">{selectedNode.id}</div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded bg-graphite-surface border border-graphite-border">
              <span className="text-text-muted block text-[9px] uppercase">Type</span>
              <span className="font-bold uppercase text-text-primary">{selectedNode.type}</span>
            </div>
            <div className="p-2 rounded bg-graphite-surface border border-graphite-border">
              <span className="text-text-muted block text-[9px] uppercase">Criticality</span>
              <span className={`font-bold uppercase ${
                selectedNode.criticality === "CRITICAL" ? "text-accent-red" : "text-accent-amber"
              }`}>
                {selectedNode.criticality}
              </span>
            </div>
          </div>

          <div>
            <span className="text-text-muted text-[10px] uppercase font-semibold">Configured Properties:</span>
            <pre className="mt-1 p-2.5 rounded bg-graphite-base border border-graphite-border text-[11px] text-text-secondary overflow-x-auto max-h-48">
              {JSON.stringify(selectedNode.properties, null, 2)}
            </pre>
          </div>

          <div className="p-2.5 rounded bg-graphite-surface/50 border border-graphite-border text-[11px] text-text-secondary space-y-1">
            <div className="flex items-center space-x-1.5 text-accent-lime font-bold">
              <Info className="w-3.5 h-3.5" />
              <span>Causal Connectivity</span>
            </div>
            <p>
              Changes to this component propagate to callers upstream with dependency depth 1 to 3.
            </p>
          </div>
        </div>
      )}

      {/* Modal: Add Custom Dependency Mapping */}
      {showMappingModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateMapping}
            className="bg-graphite-panel border border-graphite-border rounded-lg w-full max-w-md p-5 space-y-4 font-mono text-xs shadow-2xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-graphite-border">
              <h3 className="text-sm font-semibold text-text-primary">Add Explicit Dependency Mapping</h3>
              <button
                type="button"
                onClick={() => setShowMappingModal(false)}
                className="text-text-muted hover:text-text-primary"
              >
                ×
              </button>
            </div>

            <div>
              <label className="text-text-muted text-[10px] uppercase block mb-1">Caller / Source Node:</label>
              <select
                value={customSource}
                onChange={(e) => setCustomSource(e.target.value)}
                required
                className="w-full bg-graphite-surface border border-graphite-border rounded px-2.5 py-1.5 text-text-primary text-xs outline-none"
              >
                <option value="">Select source...</option>
                {graphData?.nodes.map((n) => (
                  <option key={n.id} value={n.id}>{n.id}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-text-muted text-[10px] uppercase block mb-1">Callee / Target Node:</label>
              <select
                value={customTarget}
                onChange={(e) => setCustomTarget(e.target.value)}
                required
                className="w-full bg-graphite-surface border border-graphite-border rounded px-2.5 py-1.5 text-text-primary text-xs outline-none"
              >
                <option value="">Select target...</option>
                {graphData?.nodes.map((n) => (
                  <option key={n.id} value={n.id}>{n.id}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-text-muted text-[10px] uppercase block mb-1">Relationship Type:</label>
              <select
                value={customRel}
                onChange={(e) => setCustomRel(e.target.value)}
                className="w-full bg-graphite-surface border border-graphite-border rounded px-2.5 py-1.5 text-text-primary text-xs outline-none"
              >
                <option value="DEPENDS_ON">DEPENDS_ON</option>
                <option value="WRITES_TO">WRITES_TO</option>
                <option value="READS_FROM">READS_FROM</option>
                <option value="CONNECTS_TO">CONNECTS_TO</option>
              </select>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-graphite-border">
              <button
                type="button"
                onClick={() => setShowMappingModal(false)}
                className="px-3 py-1.5 rounded bg-graphite-surface border border-graphite-border text-text-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-accent-lime text-graphite-base text-xs font-semibold hover:bg-accent-limeHover"
              >
                Establish Edge
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
