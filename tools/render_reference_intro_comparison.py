"""Render a reproducible 001/002 intro comparison figure from reference audio."""
from __future__ import annotations

from pathlib import Path

import librosa
import librosa.display
import matplotlib.pyplot as plt
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SOURCES = {
    "001 official main": ROOT / "music_ai/reference_music/audio/001_reference_main.flac",
    "002 provisional stem mix": ROOT / "music_ai/reference_music/audio/002_reference_stem_mix.flac",
}
OUTPUT = ROOT / "music_ai/analysis/cafe/figures/2026-08-14_001-002_intro_comparison.png"


def db_amplitude(y: np.ndarray) -> np.ndarray:
    return librosa.amplitude_to_db(np.maximum(np.abs(y), 1e-7), ref=1.0)


def main() -> None:
    sr = 22050
    fig, axes = plt.subplots(4, 1, figsize=(15, 14), constrained_layout=True)
    fig.suptitle("Cafe 001 / 002 — First 10 Seconds: Reproducible Acoustic Comparison", fontsize=16, fontweight="bold")

    for index, (label, path) in enumerate(SOURCES.items()):
        y, _ = librosa.load(path, sr=sr, mono=True, duration=10.0, res_type="soxr_hq")
        times = np.arange(len(y)) / sr
        wave_axis = axes[index * 2]
        spec_axis = axes[index * 2 + 1]

        wave_axis.plot(times, db_amplitude(y), color="#31513e", linewidth=0.7)
        wave_axis.set(title=f"{label} — waveform envelope (dBFS proxy)", xlim=(0, 10), ylim=(-80, 2), ylabel="dB")
        wave_axis.axvline(0.464, color="#a45b40", linestyle="--", linewidth=1.1, label="bass onset reference: 0.464 s")
        if index == 0:
            wave_axis.axvline(2.299, color="#b18350", linestyle=":", linewidth=1.4, label="accompaniment onset: 2.299 s")
        else:
            wave_axis.axvline(0.255, color="#b18350", linestyle=":", linewidth=1.4, label="accompaniment onset: 0.255 s")
            wave_axis.axvline(1.138, color="#8b6438", linestyle=":", linewidth=1.2, label="low-level drum residual: 1.138 s")
        wave_axis.legend(loc="upper right" if index == 0 else "lower left", fontsize=8, frameon=False)
        wave_axis.grid(alpha=0.18)

        stft = librosa.stft(y, n_fft=2048, hop_length=256)
        db = librosa.amplitude_to_db(np.abs(stft), ref=np.max)
        image = librosa.display.specshow(db, sr=sr, hop_length=256, x_axis="time", y_axis="log", ax=spec_axis, cmap="magma")
        spec_axis.set(title=f"{label} — log-frequency spectrogram", xlim=(0, 10), ylabel="Hz")
        fig.colorbar(image, ax=spec_axis, format="%+2.0f dB", pad=0.01)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(OUTPUT, dpi=180, bbox_inches="tight")
    plt.close(fig)
    print(OUTPUT)


if __name__ == "__main__":
    main()
