# CausalOpsDB-X Data Directory

This directory stores raw benchmark data, cached Parquet files, processed metadata indexes, and test fixtures.

```
data/
├── cache/            # Benchmark metadata index (cases.parquet - 29KB)
├── raw/              # Downloaded benchmark cases (metrics.parquet, logs, traces)
├── processed/        # Normalized JSON indexes (benchmark_index.json)
├── fixtures/         # Sample Terraform HCL, Plan JSON, and Synthetic Scenarios
└── causalopsdb.sqlite3 # Local SQLite database
```

- **Attribution:** Public research datasets originate from the RCAEval benchmark (`phamquiluan/RCAEval`).
- **Data Protection:** Large raw datasets and local database files are excluded from git tracking.
