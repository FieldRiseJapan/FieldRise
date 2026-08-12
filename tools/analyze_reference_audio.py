#!/usr/bin/env python3
"""Reference-audio feature extractor for FieldRise Music AI.

Usage:
  python3 tools/analyze_reference_audio.py /path/to/001.wav

The script prints JSON to stdout. It does not modify source audio or write files.
"""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

import librosa
import numpy as np
import soundfile as sf


def dbfs(value: float) -> float:
    return round(float(20 * np.log10(max(value, 1e-12))), 2)


def ratio_dict(power: np.ndarray, freqs: np.ndarray) -> dict[str, float]:
    total = float(np.sum(power)) + 1e-12
    ranges = {
        "low_20_180_hz": (20, 180),
        "low_mid_180_2000_hz": (180, 2000),
        "high_2000_10000_hz": (2000, 10000),
    }
    return {
        name: round(float(np.sum(power[(freqs >= low) & (freqs < high)]) / total), 4)
        for name, (low, high) in ranges.items()
    }


def section_metrics(y: np.ndarray, sr: int, start_s: float, end_s: float) -> dict[str, object]:
    start = max(0, int(start_s * sr))
    end = min(len(y), int(end_s * sr))
    section = y[start:end]
    if len(section) < 4096:
        return {"status": "insufficient_audio"}

    stft_power = np.abs(librosa.stft(section, n_fft=4096, hop_length=512)) ** 2
    freqs = librosa.fft_frequencies(sr=sr, n_fft=4096)
    rms = librosa.feature.rms(y=section, frame_length=2048, hop_length=512)[0]
    centroid = librosa.feature.spectral_centroid(y=section, sr=sr, hop_length=512)[0]

    return {
        "time_window_seconds": [start_s, round(end / sr, 3)],
        "rms_mean_dbfs": dbfs(float(np.mean(rms))),
        "rms_peak_dbfs": dbfs(float(np.max(rms))),
        "spectral_centroid_mean_hz": round(float(np.mean(centroid)), 1),
        "band_energy_ratio": ratio_dict(np.mean(stft_power, axis=1), freqs),
    }


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: analyze_reference_audio.py <audio-file>")

    source = Path(sys.argv[1]).expanduser().resolve()
    info = sf.info(str(source))
    analysis_sr = 22050
    y, sr = librosa.load(str(source), sr=analysis_sr, mono=True, res_type="soxr_hq")
    duration = len(y) / sr
    hop_length = 512

    rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=hop_length)[0]
    rms_db = 20 * np.log10(np.maximum(rms, 1e-12))
    centroid = librosa.feature.spectral_centroid(y=y, sr=sr, hop_length=hop_length)[0]
    onset_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop_length)
    onset_frames = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr, hop_length=hop_length, units="frames")
    onset_times = librosa.frames_to_time(onset_frames, sr=sr, hop_length=hop_length)
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr, hop_length=hop_length, trim=False)
    tempo_value = float(np.asarray(tempo).reshape(-1)[0])

    chroma = librosa.feature.chroma_stft(y=y, sr=sr, hop_length=hop_length)
    compare_frames = min(chroma.shape[1] // 3, max(1, int(8 * sr / hop_length)))
    first_chroma = np.mean(chroma[:, :compare_frames], axis=1)
    last_chroma = np.mean(chroma[:, -compare_frames:], axis=1)
    chroma_similarity = float(
        np.dot(first_chroma, last_chroma)
        / (np.linalg.norm(first_chroma) * np.linalg.norm(last_chroma) + 1e-12)
    )

    output = {
        "analysis_version": "1.0",
        "source": {
            "filename": source.name,
            "sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
            "container": info.format,
            "subtype": info.subtype,
            "sample_rate_hz": int(info.samplerate),
            "analysis_sample_rate_hz": analysis_sr,
            "channels": int(info.channels),
            "duration_seconds": round(duration, 3),
            "file_size_bytes": source.stat().st_size,
        },
        "global_features": {
            "tempo_estimate_bpm": round(tempo_value, 2),
            "beat_count_estimate": int(len(beat_frames)),
            "rms_mean_dbfs": dbfs(float(np.mean(rms))),
            "rms_p10_dbfs": round(float(np.percentile(rms_db, 10)), 2),
            "rms_p90_dbfs": round(float(np.percentile(rms_db, 90)), 2),
            "crest_factor_db": round(float(20 * np.log10((np.max(np.abs(y)) + 1e-12) / (np.sqrt(np.mean(y**2)) + 1e-12))), 2),
            "spectral_centroid_mean_hz": round(float(np.mean(centroid)), 1),
            "first_detected_onset_seconds": round(float(onset_times[0]), 3) if len(onset_times) else None,
        },
        "time_windows": {
            "intro_0_2_seconds": section_metrics(y, sr, 0.0, 2.0),
            "intro_2_10_seconds": section_metrics(y, sr, 2.0, 10.0),
            "body_10_30_seconds": section_metrics(y, sr, 10.0, 30.0),
            "outro_last_8_seconds": section_metrics(y, sr, max(0.0, duration - 8.0), duration),
        },
        "loop_proxy": {
            "first_last_8s_chroma_cosine_similarity": round(chroma_similarity, 4),
            "interpretation": "Harmonic similarity only. Seamless-loop judgement still requires listening to the end-to-start transition.",
        },
        "limitations": [
            "Tempo is an algorithmic estimate and must be confirmed by listening or DAW measurement.",
            "Band-energy ratios describe frequency distribution; they do not identify instruments with certainty.",
            "Instrument identity, unwanted noise, and artistic suitability require a human listening review with timecodes.",
        ],
    }
    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
