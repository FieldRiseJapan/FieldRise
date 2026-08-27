#!/usr/bin/env python3
"""Run optional Demucs stem separation for FieldRise Cafe validation.

This helper creates an evidence manifest for separated stems.  It does not use
separation to prove a source is absent; results require listening or DAW-stem
confirmation before they are reported as a musical fact.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("audio", type=Path, help="Candidate or reference audio to separate")
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--model", default="htdemucs", help="Demucs pretrained model; default htdemucs")
    parser.add_argument("--target-stem", choices=("bass", "drums", "vocals"), default="bass")
    parser.add_argument("--device", default="cpu", help="Demucs device; default cpu")
    parser.add_argument("--run-id", required=True)
    args = parser.parse_args()
    source = args.audio.resolve()
    if not source.is_file():
        raise FileNotFoundError(source)
    output = args.output_dir.resolve()
    demucs_output = output / "separated"
    command = [
        sys.executable, "-m", "demucs.separate",
        "-n", args.model,
        f"--two-stems={args.target_stem}",
        "-d", args.device,
        "-o", str(demucs_output),
        str(source),
    ]
    subprocess.run(command, check=True)
    model_dir = demucs_output / args.model / source.stem
    stems = []
    for path in sorted(model_dir.glob("*.wav")):
        stems.append({"filename": path.name, "path": str(path), "bytes": path.stat().st_size, "sha256": sha256(path)})
    if not stems:
        raise RuntimeError(f"No stems created under {model_dir}")
    manifest = {
        "system": "fieldrise-cafe-stem-assist",
        "version": "1.0",
        "run_id": args.run_id,
        "source": {"path": str(source), "sha256": sha256(source)},
        "configuration": {"model": args.model, "target_stem": args.target_stem, "device": args.device},
        "stems": stems,
        "limitations": [
            "Separated stems can contain bleeding and artifacts.",
            "A low-energy separated stem does not prove an instrument is absent.",
            "Confirm instrument presence, noise, and musical acceptability by listening or by original DAW stems.",
        ],
    }
    manifest_path = output / f"{args.run_id}_stem_assist_manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": "pass", "manifest": str(manifest_path), "stems": stems}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
