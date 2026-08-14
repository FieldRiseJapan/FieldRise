#!/usr/bin/env python3
"""Compare two audio masters after optional gain compensation.

Usage:
  python3 tools/compare_audio_signals.py <candidate-audio> <reference-audio>
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf


def rms(values: np.ndarray) -> float:
    return float(np.sqrt(np.mean(np.square(values), dtype=np.float64)))


def db(value: float) -> float:
    return round(float(20 * np.log10(max(value, 1e-12))), 3)


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("Usage: compare_audio_signals.py <candidate-audio> <reference-audio>")

    candidate_path, reference_path = (Path(item).resolve() for item in sys.argv[1:])
    candidate, candidate_sr = sf.read(candidate_path, always_2d=True, dtype="float64")
    reference, reference_sr = sf.read(reference_path, always_2d=True, dtype="float64")
    if candidate_sr != reference_sr:
        raise SystemExit(f"Sample-rate mismatch: {candidate_sr} vs {reference_sr}")

    channels = min(candidate.shape[1], reference.shape[1])
    frames = min(candidate.shape[0], reference.shape[0])
    candidate = candidate[:frames, :channels]
    reference = reference[:frames, :channels]

    per_channel = []
    for channel in range(channels):
        cand = candidate[:, channel]
        ref = reference[:, channel]
        raw_correlation = float(np.corrcoef(cand, ref)[0, 1])
        gain = float(np.dot(ref, cand) / (np.dot(ref, ref) + 1e-12))
        residual = cand - gain * ref
        normalized_rmse = rms(residual) / (rms(cand) + 1e-12)
        per_channel.append({
            "channel": channel + 1,
            "raw_pearson_correlation": round(raw_correlation, 8),
            "gain_relative_to_reference": round(gain, 8),
            "gain_db_relative_to_reference": db(abs(gain)),
            "gain_compensated_nrmse": round(float(normalized_rmse), 8),
        })

    output = {
        "candidate": candidate_path.name,
        "reference": reference_path.name,
        "sample_rate_hz": candidate_sr,
        "channels_compared": channels,
        "frames_compared": frames,
        "duration_compared_seconds": round(frames / candidate_sr, 6),
        "per_channel": per_channel,
        "interpretation": "Correlation near 1 and very low gain-compensated NRMSE indicate the same underlying audio, with any remaining difference likely due to global level, encoding, or minor mastering changes.",
    }
    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
