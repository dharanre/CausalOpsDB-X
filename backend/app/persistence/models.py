import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

def utc_now():
    return datetime.now(timezone.utc)

class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(String(64), primary_key=True)
    name = Column(String(128), nullable=False)
    environment = Column(String(64), default="production-simulation")
    description = Column(Text, default="")
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    scenarios = relationship("Scenario", back_populates="workspace", cascade="all, delete-orphan")
    simulations = relationship("Simulation", back_populates="workspace", cascade="all, delete-orphan")

class DatasetRecord(Base):
    __tablename__ = "datasets"

    id = Column(String(64), primary_key=True)
    name = Column(String(128), nullable=False)
    publisher = Column(String(128), default="phamquiluan/RCAEval")
    source_url = Column(String(256), default="https://huggingface.co/datasets/phamquiluan/RCAEval")
    license = Column(String(128), default="Research and Academic Evaluation")
    suite = Column(String(64), default="RE1-OB")
    status = Column(String(64), default="NOT_DOWNLOADED")  # NOT_DOWNLOADED, PARTIAL, LOADED, ERROR, SYNTHETIC
    case_count = Column(Integer, default=0)
    is_synthetic = Column(Boolean, default=False)
    import_timestamp = Column(DateTime, default=utc_now)
    metadata_json = Column(Text, default="{}")

class BenchmarkCase(Base):
    __tablename__ = "benchmark_cases"

    id = Column(String(128), primary_key=True)  # e.g., re1ob_adservice_cpu_1
    dataset_name = Column(String(64), nullable=False)
    suite = Column(String(32), nullable=False)
    system = Column(String(32), nullable=False)
    system_name = Column(String(64), nullable=False)
    root_cause_service = Column(String(64), nullable=False)
    fault = Column(String(64), nullable=False)
    fault_description = Column(String(256), default="")
    inject_time = Column(Integer, nullable=False)
    n_metrics = Column(Integer, default=0)
    n_timesteps = Column(Integer, default=0)
    has_logs = Column(Boolean, default=False)
    has_traces = Column(Boolean, default=False)
    file_paths_json = Column(Text, default="{}")
    is_loaded = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)

class Scenario(Base):
    __tablename__ = "scenarios"

    id = Column(String(64), primary_key=True)
    workspace_id = Column(String(64), ForeignKey("workspaces.id"), nullable=False)
    name = Column(String(128), nullable=False)
    raw_source_type = Column(String(32), default="terraform_tf")  # terraform_tf, terraform_json, synthetic
    raw_content = Column(Text, default="")
    parsed_changes_json = Column(Text, default="[]")
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    workspace = relationship("Workspace", back_populates="scenarios")
    simulations = relationship("Simulation", back_populates="scenario", cascade="all, delete-orphan")

class Simulation(Base):
    __tablename__ = "simulations"

    id = Column(String(64), primary_key=True)
    scenario_id = Column(String(64), ForeignKey("scenarios.id"), nullable=True)
    workspace_id = Column(String(64), ForeignKey("workspaces.id"), nullable=False)
    name = Column(String(128), default="Simulation Run")
    baseline_state_json = Column(Text, default="{}")
    intervention_json = Column(Text, default="{}")
    simulation_stages_json = Column(Text, default="[]")
    results_json = Column(Text, default="{}")
    risk_score = Column(Float, default=0.0)
    risk_category = Column(String(32), default="LOW")
    evidence_coverage = Column(Float, default=0.0)
    formulas_json = Column(Text, default="[]")
    created_at = Column(DateTime, default=utc_now)

    scenario = relationship("Scenario", back_populates="simulations")
    workspace = relationship("Workspace", back_populates="simulations")

class EvaluationRecord(Base):
    __tablename__ = "evaluations"

    id = Column(String(64), primary_key=True)
    evaluation_type = Column(String(64), default="BENCHMARK_RCA")  # BENCHMARK_RCA, COUNTERFACTUAL_CONTROLLED
    suite_tested = Column(String(64), default="RCAEval-RE1")
    case_count = Column(Integer, default=0)
    metrics_json = Column(Text, default="{}")  # top1, top3, top5, mrr, etc.
    details_json = Column(Text, default="[]")
    created_at = Column(DateTime, default=utc_now)

class MinedPattern(Base):
    __tablename__ = "mined_patterns"

    id = Column(String(64), primary_key=True)
    name = Column(String(128), nullable=False)
    pattern_type = Column(String(64), default="TEMPORAL_SEQUENCE")
    sequence_json = Column(Text, default="[]")
    support_count = Column(Integer, default=1)
    confidence = Column(Float, default=0.8)
    source_cases_json = Column(Text, default="[]")
    is_observational = Column(Boolean, default=True)
    rule_description = Column(Text, default="")
    created_at = Column(DateTime, default=utc_now)

class AppSetting(Base):
    __tablename__ = "settings"

    key = Column(String(64), primary_key=True)
    value_json = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
