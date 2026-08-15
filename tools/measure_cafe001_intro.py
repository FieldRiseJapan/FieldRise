#!/usr/bin/env python3
"""Measure the first two seconds of the Cafe 001 canonical master.

This produces acoustic proxies only. It does not identify an instrument as
"Bass"; the bass identity and 0.464 s stem onset remain facts sourced from the
validated stem analysis.
"""
from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import soundfile as sf

EPS = 1e-12


def dbfs(value: float) -> float:
    return float(20.0 * np.log10(max(value, EPS)))


def band_ratios(frame: np.ndarray, sr: int) -> dict[str, float]:
    windowed = frame * np.hanning(len(frame))
    power = np.abs(np.fft.rfft(windowed)) ** 2
    freq = np.fft.rfftfreq(len(frame), 1.0 / sr)
    total = max(float(power.sum()), EPS)
    return {
        "low_20_180_hz": float(power[(freq >= 20) & (freq < 180)].sum() / total),
        "low_mid_180_2000_hz": float(power[(freq >= 180) & (freq < 2000)].sum() / total),
        "high_2000_10000_hz": float(power[(freq >= 2000) & (freq < 10000)].sum() / total),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--csv", type=Path, required=True)
    parser.add_argument("--json", type=Path, required=True)
    parser.add_argument("--png", type=Path, required=True)
    args = parser.parse_args()

    raw, sr = sf.read(args.input, dtype="float64", always_2d=True)
    mono = raw.mean(axis=1)
    duration = 2.0
    sample_count = min(len(mono), int(round(sr * duration)))
    signal = mono[:sample_count]

    # 50 ms windows give an auditable time resolution while retaining enough
    # frequency precision for the 20–180 Hz low-band proxy.
    window_samples = int(round(sr * 0.05))
    rows: list[dict[str, float]] = []
    for start in range(0, sample_count, window_samples):
        end = min(start + window_samples, sample_count)
        frame = signal[start:end]
        if len(frame) < window_samples:
            frame = np.pad(frame, (0, window_samples - len(frame)))
        ratios = band_ratios(frame, sr)
        rms = float(np.sqrt(np.mean(np.square(frame))))
        rows.append({
            "start_seconds": start / sr,
            "end_seconds": end / sr,
            "rms_dbfs": dbfs(rms),
            "peak_dbfs": dbfs(float(np.max(np.abs(frame)))),
            **ratios,
        })

    # A sustained-signal proxy requires two adjacent frames above -45 dBFS.
    sustained_start = None
    for i in range(len(rows) - 1):
        if rows[i]["rms_dbfs"] > -45 and rows[i + 1]["rms_dbfs"] > -45:
            sustained_start = rows[i]["start_seconds"]
            break

    low_dominant = [r for r in rows if r["low_20_180_hz"] >= 0.8]
    metadata = {
        "analysis_version": "2026-08-15-cafe001-intro-v1",
        "source": {
            "filename": args.input.name,
            "sample_rate_hz": sr,
            "channels": int(raw.shape[1]),
            "analysis_interval_seconds": [0.0, sample_count / sr],
        },
        "method": {
            "window_seconds": 0.05,
            "mixdown": "stereo arithmetic mean",
            "sustained_signal_threshold_dbfs": -45.0,
            "note": "Frequency bands and sustained-signal time are full-mix acoustic proxies. They do not establish instrument identity or replace the validated stem onset measurement.",
        },
        "summary": {
            "first_sustained_full_mix_signal_seconds": sustained_start,
            "mean_rms_dbfs": float(np.mean([r["rms_dbfs"] for r in rows])),
            "mean_low_20_180_ratio": float(np.mean([r["low_20_180_hz"] for r in rows])),
            "low_dominant_window_share": float(len(low_dominant) / len(rows)),
            "validated_bass_stem_onset_seconds": 0.464,
            "validated_accompaniment_stem_onset_seconds": 2.299,
        },
        "limitations": [
            "The full mix cannot prove that low-band energy is a bass instrument.",
            "Noise type, subjective attack, spatial impression, and loop naturalness require listening review.",
            "The 0.464 second bass onset is cited from the validated stem analysis, not inferred from this full-mix calculation.",
        ],
    }

    args.csv.parent.mkdir(parents=True, exist_ok=True)
    with args.csv.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=list(rows[0].keys()), lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)
    args.json.parent.mkdir(parents=True, exist_ok=True)
    args.json.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    plt.rcParams["font.family"] = ["DejaVu Sans"]
    x = np.array([r["start_seconds"] for r in rows])
    rms = np.array([r["rms_dbfs"] for r in rows])
    low = np.array([r["low_20_180_hz"] * 100 for r in rows])
    low_mid = np.array([r["low_mid_180_2000_hz"] * 100 for r in rows])
    high = np.array([r["high_2000_10000_hz"] * 100 for r in rows])
    fig, axes = plt.subplots(2, 1, figsize=(12, 7), sharex=True, layout="constrained")
    axes[0].plot(x, rms, color="#195190", linewidth=2, label="RMS")
    axes[0].axvline(0.464, color="#b23a48", linestyle="--", linewidth=1.5, label="Validated bass-stem onset (0.464 s)")
    axes[0].axhline(-45, color="#666666", linestyle=":", linewidth=1, label="Sustained-signal threshold")
    axes[0].set_ylabel("RMS (dBFS)")
    axes[0].set_title("Cafe 001 canonical master: 0–2 s acoustic proxies")
    axes[0].legend(loc="lower right", fontsize=9)
    axes[0].grid(alpha=0.25)

    axes[1].stackplot(x, low, low_mid, high, colors=["#1f77b4", "#7f9f3f", "#d9a441"], labels=["Low 20–180 Hz", "Low-mid 180–2,000 Hz", "High 2,000–10,000 Hz"])
    axes[1].axvline(0.464, color="#b23a48", linestyle="--", linewidth=1.5)
    axes[1].set_xlabel("Time from start (seconds)")
    axes[1].set_ylabel("Band energy share (%)")
    axes[1].set_ylim(0, 100)
    axes[1].legend(loc="upper right", fontsize=9)
    axes[1].grid(alpha=0.25)
    args.png.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(args.png, dpi=180)


if __name__ == "__main__":
    main()
