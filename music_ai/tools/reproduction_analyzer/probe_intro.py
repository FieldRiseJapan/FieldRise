#!/usr/bin/env python3
"""Measure intro-level audio facts for FieldRise Music AI reference tracks.

The script is deterministic: it calculates waveform-derived values and does
not label musical intent. It is suitable for 001/002 master tracks and future
candidate files when their paths are available locally.
"""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

import librosa
import numpy as np


EPSILON = 1e-12


def dbfs(value: float) -> float:
    return round(20 * math.log10(max(value, EPSILON)), 3)


def segment_stats(signal: np.ndarray, sample_rate: int, start: float, end: float) -> dict:
    begin = min(len(signal), max(0, int(round(start * sample_rate))))
    finish = min(len(signal), max(begin, int(round(end * sample_rate))))
    segment = signal[begin:finish]
    if len(segment) == 0:
        return {"start_sec": start, "end_sec": end, "samples": 0, "rms_dbfs": None, "peak_dbfs": None}
    return {
        "start_sec": start,
        "end_sec": end,
        "samples": int(len(segment)),
        "rms_dbfs": dbfs(float(np.sqrt(np.mean(np.square(segment))))),
        "peak_dbfs": dbfs(float(np.max(np.abs(segment)))),
    }


def first_threshold_crossing(signal: np.ndarray, sample_rate: int, threshold_dbfs: float) -> float | None:
    frame_length = max(1, int(round(sample_rate * 0.02)))
    hop_length = max(1, int(round(sample_rate * 0.01)))
    rms = librosa.feature.rms(y=signal, frame_length=frame_length, hop_length=hop_length, center=False)[0]
    threshold = 10 ** (threshold_dbfs / 20)
    indices = np.flatnonzero(rms >= threshold)
    if len(indices) == 0:
        return None
    return round(float(indices[0] * hop_length / sample_rate), 4)


def main() -> None:
    parser = argparse.ArgumentParser(description="Probe deterministic intro-level audio facts.")
    parser.add_argument("audio_path", type=Path)
    parser.add_argument("output_path", type=Path)
    parser.add_argument("--threshold-dbfs", type=float, default=-60.0)
    args = parser.parse_args()

    signal, sample_rate = librosa.load(args.audio_path, sr=None, mono=True)
    result = {
        "source_file": str(args.audio_path),
        "sample_rate_hz": int(sample_rate),
        "duration_sec": round(float(len(signal) / sample_rate), 4),
        "measurement_note": "All values are waveform measurements. Threshold crossing uses 20 ms RMS frames with 10 ms hop.",
        "threshold_dbfs": args.threshold_dbfs,
        "first_rms_threshold_crossing_sec": first_threshold_crossing(signal, sample_rate, args.threshold_dbfs),
        "segments": [
            segment_stats(signal, sample_rate, 0.0, 0.3),
            segment_stats(signal, sample_rate, 0.3, 2.3),
            segment_stats(signal, sample_rate, 0.0, 2.0),
        ],
    }
    args.output_path.parent.mkdir(parents=True, exist_ok=True)
    args.output_path.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
