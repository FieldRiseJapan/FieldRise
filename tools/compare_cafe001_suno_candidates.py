#!/usr/bin/env python3
"""Compare Cafe 001 Master with user-shared Suno candidate outputs.

The script reports full-mix acoustic proxies. It does not identify individual
instruments and therefore cannot on its own prove that a low-frequency event is
an upright bass or that another instrument is absent.
"""
from __future__ import annotations

import argparse
import csv
import json
import math
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import soundfile as sf

EPS = 1e-12
BANDS = {
    "low_20_180_hz": (20.0, 180.0),
    "low_mid_180_2000_hz": (180.0, 2000.0),
    "high_2000_10000_hz": (2000.0, 10000.0),
}


def dbfs(value: float) -> float:
    return float(20.0 * np.log10(max(float(value), EPS)))


def db_ratio(numerator: float, denominator: float) -> float:
    return float(20.0 * np.log10(max(float(numerator), EPS) / max(float(denominator), EPS)))


def split_frames(signal: np.ndarray, size: int, hop: int) -> np.ndarray:
    if len(signal) < size:
        signal = np.pad(signal, (0, size - len(signal)))
    count = 1 + math.ceil((len(signal) - size) / hop)
    padded = np.pad(signal, (0, max(0, (count - 1) * hop + size - len(signal))))
    return np.stack([padded[i * hop:i * hop + size] for i in range(count)])


def spectrum_power(frames: np.ndarray, sr: int) -> tuple[np.ndarray, np.ndarray]:
    windowed = frames * np.hanning(frames.shape[1])[None, :]
    power = np.abs(np.fft.rfft(windowed, axis=1)) ** 2
    freq = np.fft.rfftfreq(frames.shape[1], 1.0 / sr)
    return power, freq


def aggregate_spectrum(signal: np.ndarray, sr: int) -> tuple[float, dict[str, float]]:
    size = 2048
    frames = split_frames(signal, size, size // 2)
    power, freq = spectrum_power(frames, sr)
    weights = power.sum(axis=0)
    total = max(float(weights.sum()), EPS)
    centroid = float((weights * freq).sum() / total)
    ratios = {
        label: float(weights[(freq >= low) & (freq < high)].sum() / total)
        for label, (low, high) in BANDS.items()
    }
    return centroid, ratios


def window_rows(signal: np.ndarray, sr: int, seconds: float = 2.0, window_seconds: float = 0.05) -> list[dict[str, float]]:
    count = min(len(signal), int(round(seconds * sr)))
    size = int(round(window_seconds * sr))
    rows = []
    for start in range(0, count, size):
        end = min(start + size, count)
        frame = signal[start:end]
        if len(frame) < size:
            frame = np.pad(frame, (0, size - len(frame)))
        centroid, ratios = aggregate_spectrum(frame, sr)
        rms = float(np.sqrt(np.mean(np.square(frame))))
        rows.append({
            "start_seconds": round(start / sr, 6),
            "end_seconds": round(end / sr, 6),
            "rms_dbfs": dbfs(rms),
            "peak_dbfs": dbfs(float(np.max(np.abs(frame)))),
            "spectral_centroid_hz": centroid,
            **ratios,
        })
    return rows


def first_sustained(rows: list[dict[str, float]], threshold: float = -45.0) -> float | None:
    for i in range(len(rows) - 1):
        if rows[i]["rms_dbfs"] > threshold and rows[i + 1]["rms_dbfs"] > threshold:
            return rows[i]["start_seconds"]
    return None


def onset_events(rows: list[dict[str, float]], limit: int = 5) -> list[dict[str, float]]:
    values = np.array([r["rms_dbfs"] for r in rows])
    deltas = np.r_[0.0, np.diff(values)]
    candidates = []
    for i in range(1, len(rows) - 1):
        if deltas[i] > 0 and deltas[i] >= deltas[i - 1] and deltas[i] >= deltas[i + 1]:
            candidates.append({"seconds": rows[i]["start_seconds"], "rms_increase_db": float(deltas[i])})
    return sorted(candidates, key=lambda item: item["rms_increase_db"], reverse=True)[:limit]


def segment(signal: np.ndarray, sr: int, start: float, end: float) -> dict[str, object]:
    a = int(round(start * sr))
    b = min(len(signal), int(round(end * sr)))
    part = signal[a:b]
    rms = float(np.sqrt(np.mean(np.square(part))))
    centroid, ratios = aggregate_spectrum(part, sr)
    return {
        "seconds": [round(a / sr, 3), round(b / sr, 3)],
        "rms_dbfs": round(dbfs(rms), 2),
        "peak_dbfs": round(dbfs(float(np.max(np.abs(part)))), 2),
        "spectral_centroid_hz": round(centroid, 1),
        "band_energy_ratio": {name: round(value, 4) for name, value in ratios.items()},
    }


def stereo_metrics(audio: np.ndarray) -> dict[str, float | None]:
    if audio.shape[1] != 2:
        return {"left_right_correlation": None, "side_to_mid_db": None}
    mid = audio.mean(axis=1)
    side = (audio[:, 0] - audio[:, 1]) / 2.0
    return {
        "left_right_correlation": round(float(np.corrcoef(audio[:, 0], audio[:, 1])[0, 1]), 4),
        "side_to_mid_db": round(db_ratio(float(np.sqrt(np.mean(np.square(side)))), float(np.sqrt(np.mean(np.square(mid))))), 2),
    }


def analyze(path: Path, label: str) -> tuple[dict[str, object], list[dict[str, float]]]:
    raw, sr = sf.read(path, dtype="float64", always_2d=True)
    mono = raw.mean(axis=1)
    duration = len(mono) / sr
    frame_rms = np.sqrt(np.mean(np.square(split_frames(mono, 4096, 2048)), axis=1))
    rms = float(np.sqrt(np.mean(np.square(mono))))
    peak = float(np.max(np.abs(mono)))
    centroid, ratios = aggregate_spectrum(mono, sr)
    intro_rows = window_rows(mono, sr)
    stereo = stereo_metrics(raw)
    intro_samples = min(len(raw), int(round(2.0 * sr)))
    intro_stereo = stereo_metrics(raw[:intro_samples])
    return {
        "label": label,
        "source": {
            "filename": path.name,
            "sample_rate_hz": sr,
            "channels": int(raw.shape[1]),
            "duration_seconds": round(duration, 6),
        },
        "global": {
            "rms_dbfs": round(dbfs(rms), 2),
            "peak_dbfs": round(dbfs(peak), 2),
            "frame_rms_p10_dbfs": round(float(np.percentile(20 * np.log10(np.maximum(frame_rms, EPS)), 10)), 2),
            "frame_rms_p90_dbfs": round(float(np.percentile(20 * np.log10(np.maximum(frame_rms, EPS)), 90)), 2),
            "crest_factor_db": round(db_ratio(peak, rms), 2),
            "spectral_centroid_hz": round(centroid, 1),
            "band_energy_ratio": {name: round(value, 4) for name, value in ratios.items()},
            "stereo": stereo,
        },
        "intro_0_2_seconds": {
            **segment(mono, sr, 0.0, 2.0),
            "stereo": intro_stereo,
            "first_sustained_full_mix_signal_seconds": first_sustained(intro_rows),
            "low_dominant_window_share": round(float(sum(row["low_20_180_hz"] >= 0.8 for row in intro_rows) / len(intro_rows)), 4),
            "largest_rms_increase_events": [
                {"seconds": event["seconds"], "rms_increase_db": round(event["rms_increase_db"], 2)}
                for event in onset_events(intro_rows)
            ],
        },
        "sections": {
            "intro_2_10": segment(mono, sr, 2.0, 10.0),
            "body_10_30": segment(mono, sr, 10.0, 30.0),
            "outro_last_8": segment(mono, sr, max(0.0, duration - 8.0), duration),
        },
    }, intro_rows


def make_plot(rows_by_label: dict[str, list[dict[str, float]]], output: Path) -> None:
    plt.rcParams["font.family"] = ["DejaVu Sans"]
    fig, axes = plt.subplots(3, 1, figsize=(12, 9), sharex=True, layout="constrained")
    for axis, (label, rows) in zip(axes, rows_by_label.items()):
        x = [row["start_seconds"] for row in rows]
        rms = [row["rms_dbfs"] for row in rows]
        low = [row["low_20_180_hz"] * 100 for row in rows]
        low_mid = [row["low_mid_180_2000_hz"] * 100 for row in rows]
        high = [row["high_2000_10000_hz"] * 100 for row in rows]
        twin = axis.twinx()
        axis.plot(x, rms, color="#143f6b", linewidth=2, label="RMS")
        axis.axhline(-45, color="#777777", linestyle=":", linewidth=1)
        twin.stackplot(x, low, low_mid, high, colors=["#3c8dbc", "#75a843", "#d8a53a"], alpha=0.38)
        axis.set_ylabel("RMS\n(dBFS)")
        twin.set_ylabel("Band share\n(%)")
        twin.set_ylim(0, 100)
        axis.set_title(label)
        axis.grid(alpha=0.2)
    axes[-1].set_xlabel("Seconds from start")
    fig.suptitle("Cafe 001 Master and Suno candidates: 0–2 s full-mix proxies", fontsize=14)
    output.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output, dpi=180)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--master", type=Path, required=True)
    parser.add_argument("--candidate-004", type=Path, required=True)
    parser.add_argument("--candidate-005", type=Path, required=True)
    parser.add_argument("--label-a", default="CAND-004")
    parser.add_argument("--label-b", default="CAND-005")
    parser.add_argument("--output-json", type=Path, required=True)
    parser.add_argument("--output-csv", type=Path, required=True)
    parser.add_argument("--output-png", type=Path, required=True)
    args = parser.parse_args()

    items = [
        ("MASTER-001", args.master),
        (args.label_a, args.candidate_004),
        (args.label_b, args.candidate_005),
    ]
    report: dict[str, object] = {
        "analysis_version": "2026-08-15-project001-candidate-comparison-v1",
        "scope": "Full-mix acoustic comparison of 001 Master and two user-shared Suno public outputs.",
        "limitations": [
            "Candidate audio is MP3 while the 001 Master is FLAC; absolute metrics may be codec-sensitive.",
            "Full-mix values cannot prove individual instrument presence or absence.",
            "Prompt and negative text are publicly visible for both candidates, but seed and non-displayed Suno parameters are not known.",
            "Noise type, musical key, subjective timbre, and loop naturalness require listening review.",
        ],
        "tracks": {},
    }
    rows_by_label = {}
    summary_rows = []
    for label, path in items:
        metrics, intro_rows = analyze(path, label)
        report["tracks"][label] = metrics
        rows_by_label[label] = intro_rows
        intro = metrics["intro_0_2_seconds"]
        global_metrics = metrics["global"]
        summary_rows.append({
            "label": label,
            "duration_seconds": metrics["source"]["duration_seconds"],
            "global_rms_dbfs": global_metrics["rms_dbfs"],
            "crest_factor_db": global_metrics["crest_factor_db"],
            "intro_rms_dbfs": intro["rms_dbfs"],
            "intro_low_ratio": intro["band_energy_ratio"]["low_20_180_hz"],
            "intro_low_mid_ratio": intro["band_energy_ratio"]["low_mid_180_2000_hz"],
            "first_sustained_signal_seconds": intro["first_sustained_full_mix_signal_seconds"],
            "intro_low_dominant_window_share": intro["low_dominant_window_share"],
            "intro_stereo_side_to_mid_db": intro["stereo"]["side_to_mid_db"],
        })
    args.output_json.parent.mkdir(parents=True, exist_ok=True)
    args.output_json.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    args.output_csv.parent.mkdir(parents=True, exist_ok=True)
    with args.output_csv.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=list(summary_rows[0].keys()), lineterminator="\n")
        writer.writeheader()
        writer.writerows(summary_rows)
    make_plot(rows_by_label, args.output_png)


if __name__ == "__main__":
    main()
