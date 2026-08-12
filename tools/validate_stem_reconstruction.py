#!/usr/bin/env python3
"""Validate whether separated stems reconstruct their supplied main mix.

Usage:
  python3 tools/validate_stem_reconstruction.py <main.wav> <bass.wav> <drums.wav> <other.wav> <vocals.wav>

Prints JSON to stdout and does not write files.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf


def rms_dbfs(data: np.ndarray) -> float:
    return round(float(20 * np.log10(max(float(np.sqrt(np.mean(data**2))), 1e-12))), 2)


def main() -> None:
    if len(sys.argv) != 6:
        raise SystemExit("Usage: validate_stem_reconstruction.py <main> <bass> <drums> <other> <vocals>")

    paths = [Path(value).expanduser().resolve() for value in sys.argv[1:]]
    names = ["main", "bass", "drums", "other", "vocals"]
    arrays: dict[str, np.ndarray] = {}
    metadata: dict[str, object] = {}
    sample_rates: set[int] = set()
    min_frames: int | None = None

    for name, path in zip(names, paths):
        data, sr = sf.read(str(path), always_2d=True, dtype="float64")
        arrays[name] = data
        sample_rates.add(sr)
        min_frames = len(data) if min_frames is None else min(min_frames, len(data))
        metadata[name] = {"filename": path.name, "frames": len(data), "sample_rate_hz": sr, "channels": data.shape[1], "rms_dbfs": rms_dbfs(data)}

    if len(sample_rates) != 1:
        raise SystemExit(f"Sample-rate mismatch: {sample_rates}")
    if min_frames is None:
        raise SystemExit("No audio frames found")

    reference = arrays["main"][:min_frames]
    summed = arrays["bass"][:min_frames] + arrays["drums"][:min_frames] + arrays["other"][:min_frames] + arrays["vocals"][:min_frames]
    numerator = float(np.sum(reference * summed))
    denominator = float(np.sum(summed * summed)) + 1e-12
    gain = numerator / denominator
    reconstructed = summed * gain
    residual = reference - reconstructed
    signal_rms = float(np.sqrt(np.mean(reference**2)))
    residual_rms = float(np.sqrt(np.mean(residual**2)))
    silent_main = signal_rms <= 1e-12
    correlation = None if silent_main else float(np.corrcoef(reference.reshape(-1), reconstructed.reshape(-1))[0, 1])
    snr = None if silent_main else 20 * np.log10(max(signal_rms, 1e-12) / max(residual_rms, 1e-12))

    output = {
        "sample_rate_hz": next(iter(sample_rates)),
        "aligned_frames": min_frames,
        "aligned_duration_seconds": round(min_frames / next(iter(sample_rates)), 6),
        "files": metadata,
        "reconstruction": {
            "best_fit_gain": round(gain, 6),
            "main_is_silent": silent_main,
            "correlation": None if correlation is None else round(correlation, 6),
            "residual_rms_dbfs": rms_dbfs(residual),
            "snr_db": None if snr is None else round(float(snr), 2),
            "interpretation": "A high correlation and SNR mean the supplied stems reconstruct the supplied main mix closely. This does not validate musical stem purity.",
        },
    }
    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
