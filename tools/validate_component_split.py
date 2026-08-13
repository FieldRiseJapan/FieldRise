#!/usr/bin/env python3
"""Validate whether two component stems reconstruct a supplied parent stem.

Usage:
  python3 tools/validate_component_split.py <parent.wav> <component-a.wav> <component-b.wav>
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
    if len(sys.argv) != 4:
        raise SystemExit(
            "Usage: validate_component_split.py <parent> <component-a> <component-b>"
        )

    names = ["parent", "component_a", "component_b"]
    paths = [Path(value).expanduser().resolve() for value in sys.argv[1:]]
    arrays: dict[str, np.ndarray] = {}
    metadata: dict[str, object] = {}
    sample_rates: set[int] = set()
    frame_counts: list[int] = []

    for name, path in zip(names, paths):
        data, sample_rate = sf.read(str(path), always_2d=True, dtype="float64")
        arrays[name] = data
        sample_rates.add(sample_rate)
        frame_counts.append(len(data))
        metadata[name] = {
            "filename": path.name,
            "frames": len(data),
            "sample_rate_hz": sample_rate,
            "channels": data.shape[1],
            "rms_dbfs": rms_dbfs(data),
        }

    if len(sample_rates) != 1:
        raise SystemExit(f"Sample-rate mismatch: {sample_rates}")
    if len({arrays[name].shape[1] for name in names}) != 1:
        raise SystemExit("Channel-count mismatch")

    frames = min(frame_counts)
    parent = arrays["parent"][:frames]
    summed = arrays["component_a"][:frames] + arrays["component_b"][:frames]
    gain = float(np.sum(parent * summed) / (np.sum(summed * summed) + 1e-12))
    reconstructed = summed * gain
    residual = parent - reconstructed
    parent_rms = float(np.sqrt(np.mean(parent**2)))
    residual_rms = float(np.sqrt(np.mean(residual**2)))
    correlation = float(np.corrcoef(parent.reshape(-1), reconstructed.reshape(-1))[0, 1])
    snr = 20 * np.log10(max(parent_rms, 1e-12) / max(residual_rms, 1e-12))

    print(
        json.dumps(
            {
                "sample_rate_hz": next(iter(sample_rates)),
                "aligned_duration_seconds": round(frames / next(iter(sample_rates)), 6),
                "files": metadata,
                "reconstruction": {
                    "best_fit_gain": round(gain, 6),
                    "correlation": round(correlation, 6),
                    "residual_rms_dbfs": rms_dbfs(residual),
                    "snr_db": round(float(snr), 2),
                    "interpretation": "High correlation and SNR indicate that the two components reconstruct the supplied parent stem closely; this does not certify instrumental purity.",
                },
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
