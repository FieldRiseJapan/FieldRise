"""Create reproducible second-level DNA ledgers and dynamics visualisations.

The labels pp/p/mp/mf/f are relative quantile bands within each supplied source;
they are not musical-performance annotations or mastering targets.
"""
from __future__ import annotations

import csv
from pathlib import Path

import librosa
import matplotlib.pyplot as plt
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "music_ai" / "analysis" / "cafe" / "dna_assets"
SOURCES = {
    "001": (ROOT / "music_ai" / "reference_music" / "audio" / "001_reference_main.flac", "official main"),
    "002": (ROOT / "music_ai" / "reference_music" / "audio" / "002_reference_stem_mix.flac", "provisional stem mix"),
}


def dbfs(value: float) -> float:
    return round(float(20 * np.log10(max(value, 1e-12))), 2)


def band_ratios(y: np.ndarray, sr: int) -> tuple[float, float, float]:
    if y.size < 512:
        return (0.0, 0.0, 0.0)
    power = np.abs(librosa.stft(y, n_fft=2048, hop_length=256)) ** 2
    spectrum = np.mean(power, axis=1)
    freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
    total = float(np.sum(spectrum)) + 1e-12
    def ratio(low: float, high: float) -> float:
        return round(float(np.sum(spectrum[(freqs >= low) & (freqs < high)]) / total), 4)
    return (ratio(20, 180), ratio(180, 2000), ratio(2000, 10000))


def label_dynamics(values: list[float]) -> list[str]:
    thresholds = np.percentile(values, [10, 35, 65, 85])
    labels: list[str] = []
    for value in values:
        if value <= thresholds[0]:
            labels.append("pp")
        elif value <= thresholds[1]:
            labels.append("p")
        elif value <= thresholds[2]:
            labels.append("mp")
        elif value <= thresholds[3]:
            labels.append("mf")
        else:
            labels.append("f")
    return labels


def analyse_track(track_id: str, path: Path, provenance: str) -> list[dict[str, object]]:
    sr = 22050
    y, _ = librosa.load(path, sr=sr, mono=True, res_type="soxr_hq")
    seconds = int(np.ceil(len(y) / sr))
    rows: list[dict[str, object]] = []
    rms_values: list[float] = []
    for second in range(seconds):
        segment = y[second * sr: min((second + 1) * sr, len(y))]
        rms = float(np.sqrt(np.mean(np.square(segment)))) if segment.size else 0.0
        peak = float(np.max(np.abs(segment))) if segment.size else 0.0
        centroid = librosa.feature.spectral_centroid(y=segment, sr=sr, hop_length=256)[0] if segment.size >= 512 else np.array([0.0])
        low, low_mid, high = band_ratios(segment, sr)
        rms_db = dbfs(rms)
        rms_values.append(rms_db)
        rows.append({
            "track_id": track_id,
            "provenance": provenance,
            "second_start": second,
            "second_end": round(min(second + 1, len(y) / sr), 3),
            "rms_mean_dbfs": rms_db,
            "rms_peak_dbfs": dbfs(peak),
            "spectral_centroid_hz": round(float(np.mean(centroid)), 1),
            "low_20_180_ratio": low,
            "low_mid_180_2000_ratio": low_mid,
            "high_2000_10000_ratio": high,
        })
    for row, label in zip(rows, label_dynamics(rms_values), strict=True):
        row["relative_dynamics_band"] = label
    return rows


def write_csv(track_id: str, rows: list[dict[str, object]]) -> Path:
    path = OUTPUT_DIR / f"{track_id}_per_second_dna_20260814.csv"
    with path.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=list(rows[0].keys()), lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)
    return path


def render_dynamics(results: dict[str, list[dict[str, object]]]) -> Path:
    fig, axes = plt.subplots(2, 1, figsize=(15, 8), sharex=False, constrained_layout=True)
    fig.suptitle("Cafe 001 / 002 — Relative Per-Second Dynamics", fontsize=16, fontweight="bold")
    colors = {"001": "#31513e", "002": "#a45b40"}
    for axis, (track_id, rows) in zip(axes, results.items(), strict=True):
        seconds = [int(row["second_start"]) for row in rows]
        values = [float(row["rms_mean_dbfs"]) for row in rows]
        axis.plot(seconds, values, color=colors[track_id], linewidth=1.0)
        axis.fill_between(seconds, values, -60, color=colors[track_id], alpha=0.14)
        axis.set_title(f"{track_id}: {rows[0]['provenance']}", loc="left", fontsize=12, fontweight="bold")
        axis.set_ylabel("RMS dBFS")
        axis.set_ylim(-60, 0)
        axis.grid(alpha=0.2)
    axes[-1].set_xlabel("Second from start")
    path = OUTPUT_DIR / "2026-08-14_001-002_relative_dynamics.png"
    fig.savefig(path, dpi=180, bbox_inches="tight")
    plt.close(fig)
    return path


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    results = {track_id: analyse_track(track_id, path, provenance) for track_id, (path, provenance) in SOURCES.items()}
    outputs = [write_csv(track_id, rows) for track_id, rows in results.items()]
    outputs.append(render_dynamics(results))
    for path in outputs:
        print(path)


if __name__ == "__main__":
    main()
