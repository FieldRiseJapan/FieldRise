#!/usr/bin/env python3
"""FieldRise Cafe 001/002 reproduction analyzer.

Measure a reference master and one or more candidate tracks under identical
conditions.  The output is a JSON evidence file, a CSV ranking table, and a
comparison figure.  It does not claim instrument presence from a full mix.
"""
from __future__ import annotations

import argparse
import csv
import json
from dataclasses import dataclass
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import soundfile as sf

EPS = 1e-12
BANDS = ((20, 180, "low_20_180_hz"), (180, 2000, "low_mid_180_2000_hz"), (2000, 10000, "high_2000_10000_hz"))


@dataclass
class Track:
    label: str
    path: Path
    audio: np.ndarray
    sample_rate: int


def dbfs(value: float) -> float:
    return 20.0 * np.log10(max(float(value), EPS))


def load_track(label: str, path: Path) -> Track:
    audio, sample_rate = sf.read(path, dtype="float64", always_2d=True)
    if len(audio) == 0:
        raise ValueError(f"Audio is empty: {path}")
    return Track(label, path, audio, int(sample_rate))


def to_mono(audio: np.ndarray) -> np.ndarray:
    return audio.mean(axis=1)


def interval(audio: np.ndarray, sample_rate: int, start: float, end: float) -> np.ndarray:
    begin = max(0, int(round(start * sample_rate)))
    finish = min(len(audio), int(round(end * sample_rate)))
    return audio[begin:finish]


def stereo(audio: np.ndarray) -> dict[str, float | None]:
    if audio.shape[1] != 2:
        return {"left_right_correlation": None, "side_to_mid_db": None}
    left, right = audio[:, 0], audio[:, 1]
    mid = (left + right) / 2.0
    side = (left - right) / 2.0
    corr = float(np.corrcoef(left, right)[0, 1]) if np.std(left) > EPS and np.std(right) > EPS else 1.0
    return {"left_right_correlation": round(corr, 4), "side_to_mid_db": round(dbfs(np.sqrt(np.mean(side**2))) - dbfs(np.sqrt(np.mean(mid**2))), 2)}


def spectrum_metrics(mono: np.ndarray, sample_rate: int) -> dict[str, float | dict[str, float]]:
    if len(mono) < 8:
        return {"spectral_centroid_hz": 0.0, "band_energy_ratio": {name: 0.0 for _, _, name in BANDS}}
    window = np.hanning(len(mono))
    power = np.abs(np.fft.rfft(mono * window)) ** 2
    freqs = np.fft.rfftfreq(len(mono), 1.0 / sample_rate)
    usable = (freqs >= 20) & (freqs <= 10000)
    total = float(power[usable].sum()) + EPS
    ratios = {name: round(float(power[(freqs >= low) & (freqs < high)].sum()) / total, 4) for low, high, name in BANDS}
    centroid = float((freqs[usable] * power[usable]).sum() / total)
    return {"spectral_centroid_hz": round(centroid, 1), "band_energy_ratio": ratios}


def windows(mono: np.ndarray, sample_rate: int, end_seconds: float, seconds: float = 0.05) -> list[dict[str, float]]:
    size = max(1, int(round(seconds * sample_rate)))
    clip = mono[: min(len(mono), int(round(end_seconds * sample_rate)))]
    rows: list[dict[str, float]] = []
    previous: np.ndarray | None = None
    for index, start in enumerate(range(0, len(clip) - size + 1, size)):
        frame = clip[start:start + size]
        metrics = spectrum_metrics(frame, sample_rate)
        mag = np.abs(np.fft.rfft(frame * np.hanning(len(frame))))
        flux = 0.0 if previous is None else float(np.maximum(mag - previous, 0).mean())
        previous = mag
        rows.append({
            "seconds": round(index * seconds, 3),
            "rms_dbfs": round(dbfs(np.sqrt(np.mean(frame**2))), 2),
            "onset_flux": round(flux, 8),
            **metrics["band_energy_ratio"],
        })
    return rows


def first_sustained(rows: list[dict[str, float]], threshold: float = -55.0, required_windows: int = 2) -> float | None:
    for index in range(max(0, len(rows) - required_windows + 1)):
        if all(row["rms_dbfs"] >= threshold for row in rows[index:index + required_windows]):
            return rows[index]["seconds"]
    return None


def measure(track: Track, focus_end: float) -> dict[str, object]:
    mono = to_mono(track.audio)
    focus_audio = interval(track.audio, track.sample_rate, 0.0, focus_end)
    focus_mono = to_mono(focus_audio)
    focus_rows = windows(mono, track.sample_rate, focus_end)
    overall_rms = np.sqrt(np.mean(mono**2))
    focus_rms = np.sqrt(np.mean(focus_mono**2))
    focus_spec = spectrum_metrics(focus_mono, track.sample_rate)
    onset_values = np.asarray([row["onset_flux"] for row in focus_rows], dtype=float)
    top_onsets = []
    if len(onset_values):
        for i in np.argsort(onset_values)[-5:][::-1]:
            top_onsets.append({"seconds": focus_rows[int(i)]["seconds"], "onset_flux": float(onset_values[int(i)])})
    low_dominant = sum(row["low_20_180_hz"] >= 0.8 for row in focus_rows) / max(1, len(focus_rows))
    return {
        "source": {"filename": track.path.name, "sample_rate_hz": track.sample_rate, "channels": int(track.audio.shape[1]), "duration_seconds": round(len(mono) / track.sample_rate, 3)},
        "overall": {
            "rms_dbfs": round(dbfs(overall_rms), 2),
            "peak_dbfs": round(dbfs(np.max(np.abs(mono))), 2),
            "crest_factor_db": round(dbfs(np.max(np.abs(mono))) - dbfs(overall_rms), 2),
            "stereo": stereo(track.audio),
        },
        "focus": {
            "seconds": [0.0, focus_end],
            "rms_dbfs": round(dbfs(focus_rms), 2),
            **focus_spec,
            "stereo": stereo(focus_audio),
            "first_sustained_full_mix_signal_seconds": first_sustained(focus_rows),
            "low_dominant_window_share": round(float(low_dominant), 4),
            "top_onset_flux_events": top_onsets,
        },
        "windows_50ms": focus_rows,
    }


def score(reference: dict[str, object], candidate: dict[str, object]) -> float:
    ref = reference["focus"]
    cand = candidate["focus"]
    ref_bands = ref["band_energy_ratio"]
    cand_bands = cand["band_energy_ratio"]
    distances = [
        abs(float(cand["rms_dbfs"]) - float(ref["rms_dbfs"])) / 12.0,
        abs(float(cand_bands["low_20_180_hz"]) - float(ref_bands["low_20_180_hz"])) / 0.50,
        abs(float(cand_bands["low_mid_180_2000_hz"]) - float(ref_bands["low_mid_180_2000_hz"])) / 0.50,
        abs(float(cand["spectral_centroid_hz"]) - float(ref["spectral_centroid_hz"])) / 400.0,
        abs(float(cand["low_dominant_window_share"]) - float(ref["low_dominant_window_share"])) / 0.75,
    ]
    ref_side = ref["stereo"]["side_to_mid_db"]
    cand_side = cand["stereo"]["side_to_mid_db"]
    if ref_side is not None and cand_side is not None:
        distances.append(abs(float(cand_side) - float(ref_side)) / 35.0)
    return round(max(0.0, 100.0 * (1.0 - float(np.mean(distances)))), 2)


def plot(report: dict[str, object], output: Path) -> None:
    tracks = report["tracks"]
    fig, axes = plt.subplots(len(tracks), 1, figsize=(14, 3.4 * len(tracks)), sharex=True)
    if len(tracks) == 1:
        axes = [axes]
    for axis, (label, item) in zip(axes, tracks.items()):
        rows = item["windows_50ms"]
        times = [row["seconds"] for row in rows]
        rms = [row["rms_dbfs"] for row in rows]
        low = [100 * row["low_20_180_hz"] for row in rows]
        low_mid = [100 * row["low_mid_180_2000_hz"] for row in rows]
        axis.plot(times, rms, color="#123b5d", linewidth=2.0, label="RMS (dBFS)")
        axis.fill_between(times, 0, low, color="#5da5da", alpha=0.25, label="Low %")
        axis.fill_between(times, low, np.array(low) + np.array(low_mid), color="#60bd68", alpha=0.25, label="Low-mid %")
        axis.set_title(label)
        axis.set_ylabel("RMS dBFS")
        axis.grid(alpha=0.25)
        axis.legend(loc="upper right")
    axes[-1].set_xlabel("Seconds from start")
    fig.suptitle(f"FieldRise Cafe {report['profile']} reproduction focus comparison", fontsize=16)
    fig.tight_layout()
    output.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output, dpi=180)
    plt.close(fig)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--profile", choices=("001", "002"), required=True)
    parser.add_argument("--reference", type=Path, required=True)
    parser.add_argument("--candidate", action="append", required=True, help="LABEL=PATH; repeat for each candidate")
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--run-id", required=True)
    args = parser.parse_args()
    focus_end = 2.0 if args.profile == "001" else 8.0
    parsed = []
    for item in args.candidate:
        label, separator, raw_path = item.partition("=")
        if not separator or not label or not raw_path:
            raise ValueError("Each --candidate must be LABEL=PATH")
        parsed.append((label, Path(raw_path)))
    reference = load_track(f"MASTER-{args.profile}", args.reference)
    tracks = [(reference.label, reference)] + [(label, load_track(label, path)) for label, path in parsed]
    measurements = {label: measure(track, focus_end) for label, track in tracks}
    reference_measurement = measurements[reference.label]
    ranking = [{"label": label, "reproduction_score": 100.0 if label == reference.label else score(reference_measurement, item), "focus_rms_dbfs": item["focus"]["rms_dbfs"], "focus_low_ratio": item["focus"]["band_energy_ratio"]["low_20_180_hz"], "focus_low_mid_ratio": item["focus"]["band_energy_ratio"]["low_mid_180_2000_hz"], "focus_centroid_hz": item["focus"]["spectral_centroid_hz"], "focus_side_to_mid_db": item["focus"]["stereo"]["side_to_mid_db"], "signal_start_seconds": item["focus"]["first_sustained_full_mix_signal_seconds"]} for label, item in measurements.items()]
    report = {"system": "fieldrise-cafe-reproduction-analyzer", "version": "1.0", "run_id": args.run_id, "profile": args.profile, "focus_seconds": [0.0, focus_end], "limitations": ["Full-mix metrics cannot prove individual-instrument absence or subjective noise quality.", "MP3/FLAC/WAV codec differences should be reported when comparing absolute values."], "tracks": measurements, "ranking": sorted(ranking, key=lambda row: row["reproduction_score"], reverse=True)}
    args.output_dir.mkdir(parents=True, exist_ok=True)
    json_path = args.output_dir / f"{args.run_id}_{args.profile}_analysis.json"
    csv_path = args.output_dir / f"{args.run_id}_{args.profile}_ranking.csv"
    png_path = args.output_dir / f"{args.run_id}_{args.profile}_focus.png"
    json_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(report["ranking"][0].keys()))
        writer.writeheader()
        writer.writerows(report["ranking"])
    plot(report, png_path)
    print(json.dumps({"json": str(json_path), "csv": str(csv_path), "figure": str(png_path), "ranking": report["ranking"]}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
