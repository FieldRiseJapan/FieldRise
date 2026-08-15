#!/usr/bin/env python3
"""Cafe 001/002 canonical-main reassessment.

Produces transparent, repeatable full-mix measurements. Values are acoustic
proxies, not determinations of instrumentation, musical key, or artistic intent.
"""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

import numpy as np
import soundfile as sf

EPS = 1e-12


def dbfs(value: float) -> float:
    return float(20.0 * np.log10(max(float(value), EPS)))


def frames(signal: np.ndarray, frame_length: int, hop: int) -> np.ndarray:
    if signal.size < frame_length:
        signal = np.pad(signal, (0, frame_length - signal.size))
    count = 1 + int(np.ceil((signal.size - frame_length) / hop))
    pad = max(0, (count - 1) * hop + frame_length - signal.size)
    padded = np.pad(signal, (0, pad))
    starts = np.arange(count) * hop
    return np.stack([padded[s:s + frame_length] for s in starts])


def rms_db(signal: np.ndarray) -> float:
    return dbfs(float(np.sqrt(np.mean(np.square(signal), dtype=np.float64))))


def spectral_features(signal: np.ndarray, sr: int) -> tuple[float, dict[str, float]]:
    frame_length = min(4096, max(512, 2 ** int(math.floor(math.log2(max(512, signal.size))))))
    hop = frame_length // 2
    fs = frames(signal, frame_length, hop) * np.hanning(frame_length)[None, :]
    power = np.abs(np.fft.rfft(fs, axis=1)) ** 2
    freqs = np.fft.rfftfreq(frame_length, d=1.0 / sr)
    weights = power.sum(axis=0)
    centroid = float((weights * freqs).sum() / max(weights.sum(), EPS))
    total = float(weights.sum())
    bands = {
        "low_20_180_hz": float(weights[(freqs >= 20) & (freqs < 180)].sum() / max(total, EPS)),
        "low_mid_180_2000_hz": float(weights[(freqs >= 180) & (freqs < 2000)].sum() / max(total, EPS)),
        "high_2000_10000_hz": float(weights[(freqs >= 2000) & (freqs < 10000)].sum() / max(total, EPS)),
    }
    return centroid, bands


def onset_analysis(signal: np.ndarray, sr: int) -> dict[str, object]:
    frame_length = 2048
    hop = 512
    fs = frames(signal, frame_length, hop) * np.hanning(frame_length)[None, :]
    magnitude = np.abs(np.fft.rfft(fs, axis=1))
    flux = np.maximum(np.diff(magnitude, axis=0), 0.0).sum(axis=1)
    flux = np.r_[0.0, flux]
    rms = np.sqrt(np.mean(np.square(fs), axis=1))
    rms_db_frames = 20.0 * np.log10(np.maximum(rms, EPS))

    # The first sustained audible signal uses a conservative absolute threshold.
    # It is a full-mix proxy only, not a stem-specific onset.
    above = rms_db_frames > -45.0
    first_frame = None
    for i in range(len(above)):
        if above[i] and above[i:min(len(above), i + 3)].sum() >= 2:
            first_frame = i
            break
    first_seconds = None if first_frame is None else round(float(first_frame * hop / sr), 4)

    # Tempo candidates use autocorrelation of normalized positive spectral flux.
    onset = flux.copy()
    median = float(np.median(onset))
    mad = float(np.median(np.abs(onset - median))) + EPS
    onset = np.maximum((onset - median) / (1.4826 * mad), 0.0)
    onset = onset / max(float(np.max(onset)), EPS)
    min_bpm, max_bpm = 60.0, 180.0
    min_lag = int((60.0 / max_bpm) * sr / hop)
    max_lag = int((60.0 / min_bpm) * sr / hop)
    ac = np.correlate(onset, onset, mode="full")[len(onset) - 1:]
    candidates = []
    for lag in range(max(1, min_lag), min(len(ac), max_lag + 1)):
        if ac[lag] >= ac[max(0, lag - 1)] and ac[lag] >= ac[min(len(ac) - 1, lag + 1)]:
            bpm = 60.0 * sr / (hop * lag)
            candidates.append((float(ac[lag]), round(float(bpm), 2)))
    candidates.sort(reverse=True)
    dedup = []
    for score, bpm in candidates:
        if all(abs(bpm - item["bpm"]) > 1.5 for item in dedup):
            dedup.append({"bpm": bpm, "relative_score": round(score / max(float(ac[0]), EPS), 4)})
        if len(dedup) == 5:
            break
    return {
        "frame_hop_seconds": round(hop / sr, 6),
        "first_sustained_full_mix_signal_seconds": first_seconds,
        "tempo_candidates_bpm": dedup,
        "method_note": "Autocorrelation of positive spectral flux. Candidates are algorithmic timing proxies and do not replace DAW grid or listening confirmation.",
    }


def section_metrics(signal: np.ndarray, sr: int, start: float, end: float) -> dict[str, object]:
    a = int(round(start * sr))
    b = int(round(min(end, signal.size / sr) * sr))
    segment = signal[a:b]
    centroid, bands = spectral_features(segment, sr)
    return {
        "seconds": [round(start, 3), round(b / sr, 3)],
        "rms_dbfs": round(rms_db(segment), 2),
        "peak_dbfs": round(dbfs(float(np.max(np.abs(segment)))), 2),
        "spectral_centroid_hz": round(centroid, 1),
        "band_energy_ratio": {key: round(value, 4) for key, value in bands.items()},
    }


def analyze_file(path: Path) -> dict[str, object]:
    raw, sr = sf.read(path, dtype="float64", always_2d=True)
    mono = raw.mean(axis=1)
    duration = raw.shape[0] / sr
    frame_rms = np.sqrt(np.mean(np.square(frames(mono, 4096, 2048)), axis=1))
    frame_rms_db = 20.0 * np.log10(np.maximum(frame_rms, EPS))
    centroid, bands = spectral_features(mono, sr)
    sections = {
        "intro_0_2": section_metrics(mono, sr, 0.0, 2.0),
        "intro_2_10": section_metrics(mono, sr, 2.0, 10.0),
        "body_10_30": section_metrics(mono, sr, 10.0, 30.0),
        "outro_last_8": section_metrics(mono, sr, max(0.0, duration - 8.0), duration),
    }
    return {
        "source": {
            "filename": path.name,
            "sample_rate_hz": sr,
            "channels": int(raw.shape[1]),
            "duration_seconds": round(duration, 6),
            "samples": int(raw.shape[0]),
        },
        "global": {
            "rms_dbfs": round(rms_db(mono), 2),
            "peak_dbfs": round(dbfs(float(np.max(np.abs(mono)))), 2),
            "frame_rms_p10_dbfs": round(float(np.percentile(frame_rms_db, 10)), 2),
            "frame_rms_p90_dbfs": round(float(np.percentile(frame_rms_db, 90)), 2),
            "crest_factor_db": round(dbfs(float(np.max(np.abs(mono))) / max(float(np.sqrt(np.mean(np.square(mono)))), EPS)), 2),
            "spectral_centroid_hz": round(centroid, 1),
            "band_energy_ratio": {key: round(value, 4) for key, value in bands.items()},
        },
        "sections": sections,
        "onset_and_tempo_proxy": onset_analysis(mono, sr),
    }


def compare(a: dict[str, object], b: dict[str, object]) -> dict[str, object]:
    ag = a["global"]
    bg = b["global"]
    return {
        "duration_difference_seconds_001_minus_002": round(a["source"]["duration_seconds"] - b["source"]["duration_seconds"], 3),
        "rms_difference_db_001_minus_002": round(ag["rms_dbfs"] - bg["rms_dbfs"], 2),
        "centroid_difference_hz_001_minus_002": round(ag["spectral_centroid_hz"] - bg["spectral_centroid_hz"], 1),
        "first_signal_difference_seconds_001_minus_002": round(
            a["onset_and_tempo_proxy"]["first_sustained_full_mix_signal_seconds"] - b["onset_and_tempo_proxy"]["first_sustained_full_mix_signal_seconds"], 4
        ),
        "interpretation": "Positive duration/RMS/centroid values mean 001 is longer/louder/brighter by this full-mix proxy. These values do not identify individual instruments or final musical tempo.",
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--audio-001", type=Path, required=True)
    parser.add_argument("--audio-002", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    report = {
        "analysis_version": "2026-08-15-reassessment-v1",
        "scope": "Canonical full-mix audio reassessment under one transparent analysis method.",
        "limitations": [
            "Full-mix analysis cannot determine individual stem onsets or instrument identity.",
            "Tempo candidates are algorithmic proxies; final BPM requires DAW grid and listening review.",
            "Spectral centroid and band ratios are acoustic proxies, not subjective quality scores.",
            "Loop suitability and unwanted-noise decisions require monitored listening of an end-to-start edit.",
        ],
        "track_001": analyze_file(args.audio_001),
        "track_002": analyze_file(args.audio_002),
    }
    report["comparison"] = compare(report["track_001"], report["track_002"])
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
