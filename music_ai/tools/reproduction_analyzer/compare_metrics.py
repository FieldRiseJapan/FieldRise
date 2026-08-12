#!/usr/bin/env python3
"""Create a deterministic metric-by-metric A/B difference report."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def load_records(path: Path) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    return {record["metric_id"]: record for record in data["records"]}


def main() -> None:
    parser = argparse.ArgumentParser(description="Compare two normalized Metrics files.")
    parser.add_argument("left", type=Path)
    parser.add_argument("right", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    left = load_records(args.left)
    right = load_records(args.right)
    all_ids = sorted(set(left) | set(right))
    rows = []
    for metric_id in all_ids:
        left_record = left.get(metric_id)
        right_record = right.get(metric_id)
        left_value = left_record["value"] if left_record else None
        right_value = right_record["value"] if right_record else None
        delta = None
        if isinstance(left_value, (int, float)) and isinstance(right_value, (int, float)):
            delta = round(right_value - left_value, 6)
        rows.append({
            "metric_id": metric_id,
            "left_value": left_value,
            "right_value": right_value,
            "delta_right_minus_left": delta,
            "unit": (right_record or left_record)["unit"],
            "left_status": left_record["status"] if left_record else "missing",
            "right_status": right_record["status"] if right_record else "missing",
            "comparison_ready": left_record is not None and right_record is not None,
        })

    output = {
        "left_file": str(args.left),
        "right_file": str(args.right),
        "comparison_note": "Values are compared only when metric IDs match. This tool does not infer musical quality or overwrite the experiment registry.",
        "differences": rows,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
