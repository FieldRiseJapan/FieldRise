#!/usr/bin/env python3
"""Regression checks for FieldRise Cafe reproduction analysis.

The test compares each master with itself.  It verifies that the analyzer
returns 100.0 for an identical signal and writes complete, machine-readable
artifacts.  No source audio is modified.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path


REQUIRED_FOCUS_KEYS = {
    "seconds",
    "rms_dbfs",
    "spectral_centroid_hz",
    "band_energy_ratio",
    "stereo",
    "first_sustained_full_mix_signal_seconds",
    "low_dominant_window_share",
    "top_onset_flux_events",
}


def run_profile(root: Path, profile: str, output_dir: Path, run_id: str) -> dict[str, object]:
    reference = root / "music_ai" / "reference_music" / "audio" / f"{profile}_reference_main.flac"
    analyzer = root / "tools" / "cafe_reproduction_analyzer.py"
    command = [
        sys.executable,
        str(analyzer),
        "--profile", profile,
        "--reference", str(reference),
        "--candidate", f"SELF-CHECK={reference}",
        "--output-dir", str(output_dir),
        "--run-id", run_id,
    ]
    result = subprocess.run(command, check=True, text=True, capture_output=True)
    paths = json.loads(result.stdout)
    report_path = Path(paths["json"])
    csv_path = Path(paths["csv"])
    figure_path = Path(paths["figure"])
    report = json.loads(report_path.read_text(encoding="utf-8"))
    ranking = report["ranking"]
    assert len(ranking) == 2, "Expected master and self-check rows"
    assert ranking[0]["reproduction_score"] == 100.0, "Master must score 100"
    assert ranking[1]["reproduction_score"] == 100.0, "Identical signal must score 100"
    assert set(report["tracks"][f"MASTER-{profile}"]["focus"]) >= REQUIRED_FOCUS_KEYS, "Missing focus metrics"
    assert csv_path.exists() and csv_path.stat().st_size > 80, "CSV output missing or too small"
    assert figure_path.exists() and figure_path.stat().st_size > 1024, "Figure output missing or too small"
    return {
        "profile": profile,
        "status": "pass",
        "analysis_json": str(report_path),
        "ranking_csv": str(csv_path),
        "figure_png": str(figure_path),
        "master_focus_metrics": report["tracks"][f"MASTER-{profile}"]["focus"],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--run-id", required=True)
    args = parser.parse_args()
    root = args.root.resolve()
    output_dir = args.output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    results = []
    for profile in ("001", "002"):
        results.append(run_profile(root, profile, output_dir, args.run_id))
    health = {
        "system": "fieldrise-cafe-reproduction-analysis",
        "version": "1.0",
        "run_id": args.run_id,
        "status": "pass",
        "tests": results,
        "limitations": [
            "Self-comparison proves pipeline consistency, not candidate musical quality.",
            "Full-mix metrics do not prove individual-instrument absence or subjective noise quality.",
        ],
    }
    health_path = output_dir / f"{args.run_id}_system_health.json"
    health_path.write_text(json.dumps(health, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": "pass", "health_json": str(health_path), "tests": results}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
