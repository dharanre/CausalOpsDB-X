import os
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Optional, Any
from backend.app.schemas.telemetry import (
    TelemetrySummaryResponse, MetricSeries, TelemetryPoint, LogEntry, TraceSpan
)
from backend.app.core.config import settings

class TelemetryStore:
    def __init__(self):
        self.cached_summaries: dict[str, TelemetrySummaryResponse] = {}

    def load_case_telemetry(self, case_id: str, case_dir: Path) -> TelemetrySummaryResponse:
        """Loads and normalizes metrics, logs, and traces from an RCAEval case folder."""
        if case_id in self.cached_summaries:
            return self.cached_summaries[case_id]

        warnings: list[str] = []
        metrics_list: list[MetricSeries] = []
        logs_list: list[LogEntry] = []
        traces_list: list[TraceSpan] = []
        services_set: set[str] = set()
        min_ts = 0
        max_ts = 0
        has_logs = False
        has_traces = False

        metrics_file = case_dir / "metrics.parquet"
        if metrics_file.exists():
            try:
                df = pd.read_parquet(metrics_file)
                if "time" in df.columns:
                    timestamps = df["time"].astype(int).tolist()
                    min_ts = int(df["time"].min())
                    max_ts = int(df["time"].max())
                    
                    # Group metrics by service
                    for col in df.columns:
                        if col == "time":
                            continue
                        
                        # Parse service name: e.g. adservice_cpu -> service: adservice, metric: cpu
                        parts = col.split("_", 1)
                        svc = parts[0]
                        metric_name = parts[1] if len(parts) > 1 else col
                        services_set.add(svc)
                        
                        values = df[col].fillna(0.0).values
                        # Sample up to 100 points for frontend chart responsiveness
                        step = max(1, len(timestamps) // 80)
                        sample_pts = [
                            TelemetryPoint(timestamp=timestamps[i], value=round(float(values[i]), 3))
                            for i in range(0, len(timestamps), step)
                        ]

                        p50 = float(np.percentile(values, 50))
                        p95 = float(np.percentile(values, 95))
                        p99 = float(np.percentile(values, 99))
                        max_val = float(np.max(values))
                        mean_val = float(np.mean(values))

                        unit = "%" if "cpu" in metric_name or "mem" in metric_name else "ops/sec"

                        metrics_list.append(
                            MetricSeries(
                                service=svc,
                                metric_name=metric_name,
                                unit=unit,
                                points=sample_pts,
                                p50=round(p50, 2),
                                p95=round(p95, 2),
                                p99=round(p99, 2),
                                max=round(max_val, 2),
                                mean=round(mean_val, 2)
                            )
                        )
            except Exception as e:
                warnings.append(f"Failed parsing metrics.parquet: {str(e)}")
        else:
            warnings.append("No metrics.parquet found for this case.")

        # Load logs if available
        logs_file = case_dir / "logs.parquet"
        if logs_file.exists():
            has_logs = True
            try:
                df_logs = pd.read_parquet(logs_file)
                # Parse available columns
                for _, row in df_logs.head(50).iterrows():
                    ts = int(row.get("time", row.get("timestamp", min_ts)))
                    svc = str(row.get("service", row.get("container", "unknown")))
                    services_set.add(svc)
                    msg = str(row.get("message", row.get("log", "")))
                    lvl = str(row.get("level", "INFO")).upper()
                    logs_list.append(LogEntry(timestamp=ts, service=svc, level=lvl, message=msg))
            except Exception as e:
                warnings.append(f"Failed parsing logs.parquet: {str(e)}")

        # Load traces if available
        traces_file = case_dir / "traces.parquet"
        if traces_file.exists():
            has_traces = True
            try:
                df_traces = pd.read_parquet(traces_file)
                for _, row in df_traces.head(50).iterrows():
                    traces_list.append(
                        TraceSpan(
                            span_id=str(row.get("span_id", "span-0")),
                            trace_id=str(row.get("trace_id", "trace-0")),
                            service=str(row.get("service", "service")),
                            operation=str(row.get("operation", row.get("name", "rpc"))),
                            start_time=int(row.get("start_time", min_ts)),
                            duration_ms=round(float(row.get("duration", 10.0)), 2),
                            status_code=str(row.get("status_code", "OK"))
                        )
                    )
            except Exception as e:
                warnings.append(f"Failed parsing traces.parquet: {str(e)}")

        summary = TelemetrySummaryResponse(
            dataset_name="RCAEval",
            case_id=case_id,
            provenance="BENCHMARK_RCAEVAL",
            total_metrics=len(metrics_list),
            time_range=(min_ts, max_ts),
            services=sorted(list(services_set)),
            metrics=metrics_list,
            logs=logs_list,
            traces=traces_list,
            has_logs=has_logs,
            has_traces=has_traces,
            validation_status="VALIDATED" if not warnings else "PARTIALLY_VALIDATED",
            warnings=warnings
        )

        self.cached_summaries[case_id] = summary
        return summary

    def get_synthetic_summary(self) -> TelemetrySummaryResponse:
        """Returns explicitly labeled baseline telemetry for controlled synthetic scenario."""
        timestamps = [1685200000 + i * 60 for i in range(10)]
        pts_conns = [TelemetryPoint(timestamp=ts, value=round(80 + i * 7.5, 1)) for i, ts in enumerate(timestamps)]
        pts_qps = [TelemetryPoint(timestamp=ts, value=round(450 + i * 18.0, 1)) for i, ts in enumerate(timestamps)]
        pts_lat = [TelemetryPoint(timestamp=ts, value=round(18.2 + i * 0.7, 1)) for i, ts in enumerate(timestamps)]

        metrics = [
            MetricSeries(
                service="aws_db_instance.postgres_primary",
                metric_name="active_connections",
                unit="connections",
                points=pts_conns,
                p50=114.0, p95=145.0, p99=148.0, max=150.0, mean=115.0
            ),
            MetricSeries(
                service="checkoutservice",
                metric_name="qps",
                unit="req/sec",
                points=pts_qps,
                p50=520.0, p95=610.0, p99=612.0, max=615.0, mean=530.0
            ),
            MetricSeries(
                service="checkoutservice",
                metric_name="latency_ms",
                unit="ms",
                points=pts_lat,
                p50=21.0, p95=24.5, p99=24.8, max=25.0, mean=21.6
            )
        ]

        logs = [
            LogEntry(timestamp=timestamps[0], service="postgres_primary", level="INFO", message="PostgreSQL server online. Max connections: 200"),
            LogEntry(timestamp=timestamps[5], service="checkoutservice", level="INFO", message="Acquired pool connection pg-pool-42"),
            LogEntry(timestamp=timestamps[8], service="frontend", level="INFO", message="Incoming payment traffic steady: 480 rps")
        ]

        traces = [
            TraceSpan(span_id="sp-101", trace_id="tr-1", service="frontend", operation="POST /cart/checkout", start_time=timestamps[4], duration_ms=28.4),
            TraceSpan(span_id="sp-102", trace_id="tr-1", service="checkoutservice", operation="PlaceOrder", start_time=timestamps[4] + 1, duration_ms=24.1, parent_span_id="sp-101"),
            TraceSpan(span_id="sp-103", trace_id="tr-1", service="postgres_primary", operation="COMMIT order_txn", start_time=timestamps[4] + 3, duration_ms=3.2, parent_span_id="sp-102")
        ]

        return TelemetrySummaryResponse(
            dataset_name="Controlled Synthetic Baseline",
            case_id="synth_db_pool_saturation_001",
            provenance="SYNTHETIC",
            total_metrics=len(metrics),
            time_range=(timestamps[0], timestamps[-1]),
            services=["aws_db_instance.postgres_primary", "checkoutservice", "frontend"],
            metrics=metrics,
            logs=logs,
            traces=traces,
            has_logs=True,
            has_traces=True,
            validation_status="VALIDATED",
            warnings=["Explicitly synthetic baseline for controlled counterfactual testing."]
        )

telemetry_store = TelemetryStore()
