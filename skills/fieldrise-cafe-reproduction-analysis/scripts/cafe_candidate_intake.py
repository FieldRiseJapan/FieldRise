#!/usr/bin/env python3
"""Create a traceable manifest for a Cafe 001/002 reproduction candidate."""
from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

import soundfile as sf


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("audio", type=Path, help="Candidate WAV, FLAC, MP3, or other SoundFile-supported audio")
    parser.add_argument("--candidate-id", required=True)
    parser.add_argument("--target", choices=("001", "002"), required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--public-url", default=None)
    parser.add_argument("--prompt", default=None)
    parser.add_argument("--negative-prompt", default=None)
    parser.add_argument("--single-changed-variable", required=True)
    parser.add_argument("--fixed-condition", action="append", default=[])
    args = parser.parse_args()
    audio = args.audio.resolve()
    if not audio.is_file():
        raise FileNotFoundError(audio)
    info = sf.info(audio)
    manifest = {
        "schema_version": "1.0",
        "candidate_id": args.candidate_id,
        "target": args.target,
        "created_at_utc": datetime.now(timezone.utc).isoformat(),
        "audio": {
            "filename": audio.name,
            "local_path": str(audio),
            "format": info.format,
            "subtype": info.subtype,
            "sample_rate_hz": int(info.samplerate),
            "channels": int(info.channels),
            "duration_seconds": round(float(info.duration), 3),
            "bytes": audio.stat().st_size,
            "sha256": sha256(audio),
        },
        "source": {"public_url": args.public_url, "prompt": args.prompt, "negative_prompt": args.negative_prompt},
        "experiment": {
            "single_changed_variable": args.single_changed_variable,
            "fixed_conditions": args.fixed_condition,
        },
        "guardrails": [
            "Candidate audio is not committed to Git unless rights and repository policy permit it.",
            "Do not claim individual-instrument absence from full-mix metrics alone.",
            "Use the same analyzer profile as the target master for comparative scoring.",
        ],
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": "pass", "manifest": str(args.output), "candidate_id": args.candidate_id}, ensure_ascii=False))


if __name__ == "__main__":
    main()
