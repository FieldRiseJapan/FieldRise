#!/usr/bin/env python3
"""Apply deterministic promotion safeguards to a generation-registry record."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate a registry record against FieldRise quality safeguards.")
    parser.add_argument("registry", type=Path)
    parser.add_argument("generation_id")
    parser.add_argument("output", type=Path)
    parser.add_argument("--minimum-score", type=float, default=95.0)
    args = parser.parse_args()

    rows = [json.loads(line) for line in args.registry.read_text(encoding="utf-8").splitlines() if line.strip()]
    candidate = next((row for row in rows if row["generation_id"] == args.generation_id), None)
    if candidate is None:
        raise SystemExit(f"generation_id not found: {args.generation_id}")

    blocks = []
    if not candidate.get("asset_available_in_repo"):
        blocks.append("source_audio_not_available_for_remeasurement")
    if candidate.get("score") is None or candidate.get("score") < args.minimum_score:
        blocks.append("score_below_threshold_or_missing")
    if candidate.get("score_status") != "canonical_calculation":
        blocks.append("score_is_not_from_canonical_calculation")
    if candidate.get("prompt_version") in (None, "not_recorded"):
        blocks.append("prompt_version_not_recorded")
    if candidate.get("suno_settings") in (None, "not_recorded"):
        blocks.append("suno_settings_not_recorded")

    output = {
        "generation_id": args.generation_id,
        "minimum_score": args.minimum_score,
        "eligible_for_knowledge_promotion": len(blocks) == 0,
        "hard_blocks": blocks,
        "human_approval_required": True,
        "note": "A passed deterministic gate is not automatic Knowledge promotion. CTO or CEO approval remains mandatory.",
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
