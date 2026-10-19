#!/usr/bin/env python3
import sys
from pathlib import Path

# Add project root
root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root))

from backend.scripts.bootstrap_data import bootstrap, get_status
import argparse

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CausalOpsDB-X Benchmark Data Bootstrap")
    parser.add_argument("--mode", choices=["quickstart", "suite", "full", "status"], default="quickstart")
    args = parser.parse_args()

    if args.mode == "status":
        import json
        print(json.dumps(get_status(), indent=2))
    else:
        bootstrap(mode=args.mode)
