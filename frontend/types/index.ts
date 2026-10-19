export interface OverviewStats {
  active_workspace: string;
  environment: string;
  dataset_status: string;
  benchmark_cases_loaded: number;
  total_benchmark_cases: number;
  resource_graph_nodes: number;
  resource_graph_edges: number;
  telemetry_coverage_pct: number;
  saved_scenarios_count: number;
  recent_simulations_count: number;
  recent_evaluations_count: number;
  highest_risk_resources: Array<{
    resource_id: string;
    resource_type: string;
    risk_score: number;
    risk_category: string;
    primary_failure_mode: string;
    blast_radius: number;
  }>;
  dataset_warnings: string[];
}

export interface ResourceChange {
  address: string;
  type: string;
  name: string;
  action: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  attributes_changed: string[];
  sensitive_attributes: string[];
  dependencies: string[];
}

export interface TerraformParseResponse {
  success: boolean;
  format_version: string;
  resource_changes: ResourceChange[];
  total_changes: number;
  warnings: string[];
  errors: string[];
}

export interface GraphNode {
  id: string;
  name: string;
  type: string;
  criticality: string;
  status: string;
  properties: Record<string, any>;
  metrics: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: string;
  provenance: string;
  latency_ms?: number;
  is_impact_path?: boolean;
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
  total_nodes: number;
  total_edges: number;
  selected_impact_path: string[];
}

export interface TelemetryPoint {
  timestamp: number;
  value: number;
}

export interface MetricSeries {
  service: string;
  metric_name: string;
  unit: string;
  points: TelemetryPoint[];
  p50: number;
  p95: number;
  p99: number;
  max: number;
  mean: number;
}

export interface LogEntry {
  timestamp: number;
  service: string;
  level: string;
  message: string;
}

export interface TraceSpan {
  span_id: string;
  trace_id: string;
  service: string;
  operation: string;
  start_time: number;
  duration_ms: number;
  status_code: string;
  parent_span_id?: string;
}

export interface TelemetrySummaryResponse {
  dataset_name: string;
  case_id?: string;
  provenance: string;
  total_metrics: number;
  time_range: [number, number];
  services: string[];
  metrics: MetricSeries[];
  logs: LogEntry[];
  traces: TraceSpan[];
  has_logs: boolean;
  has_traces: boolean;
  validation_status: string;
  warnings: string[];
}

export interface InterventionInput {
  resource_id: string;
  attribute: string;
  before_val: any;
  after_val: any;
  unit?: string;
  reason?: string;
}

export interface CalculatedEffect {
  resource_id: string;
  impact_type: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  formula: string;
  inputs: Record<string, any>;
  calculated_value: any;
  unit: string;
  assumptions: string[];
  explanation: string;
}

export interface SimulationStage {
  stage_number: number;
  name: string;
  status: string;
  timestamp: string;
  details: string;
}

export interface SimulationRunResponse {
  simulation_id: string;
  name: string;
  workspace_id: string;
  stages: SimulationStage[];
  baseline_state: Record<string, any>;
  intervention: InterventionInput;
  effects: CalculatedEffect[];
  affected_path: string[];
  risk_score: number;
  risk_category: string;
  evidence_coverage: number;
  formulas: Array<{
    rule: string;
    formula: string;
    inputs: Record<string, any>;
    result: any;
  }>;
  recommendations: string[];
  created_at: string;
}

export interface AlternativeCandidate {
  id: string;
  name: string;
  description: string;
  configuration_changes: InterventionInput[];
  modeled_effects: CalculatedEffect[];
  risk_score: number;
  risk_category: string;
  evidence_coverage: number;
  affected_resources: string[];
  trade_offs: string[];
  operational_constraints: string[];
  score_rank: number;
}

export interface ScenarioCompareResponse {
  baseline_state: Record<string, any>;
  proposed: AlternativeCandidate;
  alternatives: AlternativeCandidate[];
  recommendation: string;
  ranking_criteria: string;
}

export interface BenchmarkCase {
  case_id: string;
  dataset: string;
  suite: string;
  system: string;
  system_name: string;
  root_cause_service: string;
  fault: string;
  fault_description: string;
  inject_time: number;
  n_metrics: number;
  n_timesteps: number;
  has_logs: boolean;
  has_traces: boolean;
  is_loaded: boolean;
}

export interface DatasetInventoryItem {
  id: string;
  name: string;
  publisher: string;
  source_url: string;
  license: string;
  suite: string;
  status: string;
  case_count: number;
  is_synthetic: boolean;
  last_updated?: string;
  attribution: string;
}

export interface PatternItem {
  id: string;
  name: string;
  pattern_type: string;
  sequence: string[];
  support_count: number;
  frequency_pct: number;
  confidence: number;
  is_observational: boolean;
  rule_description: string;
  supporting_cases: string[];
  time_window_seconds: number;
}

export interface MethodologyResult {
  approach: string;
  top1_accuracy: number;
  top3_hit_rate: number;
  top5_hit_rate: number;
  mrr: number;
  sample_count: number;
  skipped_count: number;
  description: string;
}

export interface EvaluationResponse {
  evaluation_id: string;
  evaluation_type: string;
  suite: string;
  total_cases_evaluated: number;
  results: MethodologyResult[];
  case_details: Array<{
    case_id: string;
    ground_truth_service: string;
    ground_truth_fault: string;
    top_predicted: string[];
    rank_of_true_cause?: number;
    hit_top1: boolean;
    hit_top3: boolean;
    reciprocal_rank: number;
    evidence_score: number;
  }>;
  counterfactual_accuracy?: number;
  created_at: string;
}
