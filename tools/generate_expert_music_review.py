"""Generate an evidence-bounded expert review for FieldRise reference tracks.

The script reads only versioned project evidence and writes a Markdown peer review.
It does not alter source analysis or audio.
"""
from __future__ import annotations

from pathlib import Path
from openai import OpenAI

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "music_ai/analysis/cafe/2026-08-14_001-002_expert_peer_review.md"
INPUTS = {
    "001 canonical record": ROOT / "music_ai/reference_music/success_song_001.md",
    "002 canonical record": ROOT / "music_ai/reference_music/success_song_002.md",
    "stem measurement": ROOT / "music_ai/analysis/cafe/2026-08-12_001-002-stem-measurement.md",
    "002 additional split": ROOT / "music_ai/analysis/cafe/2026-08-14_002-additional-other-split-analysis.md",
    "001 full-mix metrics": ROOT / "music_ai/analysis/cafe/measurements/001_reference_main_metrics_20260814.json",
    "002 stem-mix metrics": ROOT / "music_ai/analysis/cafe/measurements/002_reference_stem_mix_metrics_20260814.json",
    "series rule": ROOT / "music_ai/rules/cafe_series_creation_rule_v1.1.md",
    "successful patterns": ROOT / "music_ai/suno_database/successful_patterns.md",
}


def main() -> None:
    evidence = "\n\n".join(
        f"# SOURCE: {label}\n\n{path.read_text(encoding='utf-8')}"
        for label, path in INPUTS.items()
    )
    prompt = f"""You are a senior music-information-retrieval analyst and production researcher.
Prepare a rigorous internal peer review in Japanese of FieldRise Music AI reference tracks 001 and 002.

This is an evidence-bounded task. Use only the supplied files. Treat every acoustic measure as an observation, never as musical certainty. Do not identify an instrument, key, chord progression, genre, or artistic intention unless the evidence explicitly supports it. Do not fabricate listening notes. Clearly distinguish FACT, INFERENCE, UNKNOWN, and BLOCKER. 002 is a stem mix, not an approved official main, and its provided main is silent; preserve this caveat everywhere it matters.

The review must:
1. Audit the evidence quality and reconcile, or flag, the discrepancy between tempo estimates for 002 (stem estimates around 80.75 BPM versus full stem-mix estimate 123.05 BPM). Explain possible algorithmic causes without asserting a conclusion.
2. Compare 001 and 002 across duration, source reliability, onset sequence, intro spectral balance, global/full-section dynamics, brightness proxy, outro/loop proxy, and vocal presence, citing source file paths and values.
3. Extract a minimal reproducible design system for future Cafe tracks, separating fixed guardrails from one-variable experimental controls.
4. State the highest-priority next measurements and a reproducible method for each, including what must be verified in a DAW or human listening review.
5. Propose a compact evidence-based Suno prompt architecture. It must describe attributes, never name or imitate any particular artist or copyrighted song, and must label any values that are provisional.
6. Include a quality-gate checklist that can be applied to candidate generations.
7. End with an executive conclusion and a decision table for Ayaka (CTO).

Use professional Japanese Markdown, concise tables, and source-path citations such as [source: music_ai/...]. Do not use external web sources. Avoid generic encouragement and do not explain these instructions.

EVIDENCE START
{evidence}
EVIDENCE END
"""
    client = OpenAI()
    response = client.chat.completions.create(
        model="gpt-5.5",
        messages=[
            {"role": "system", "content": "You are an exacting audio-analysis peer reviewer. Prefer uncertainty over unsupported claims."},
            {"role": "user", "content": prompt},
        ],
        max_completion_tokens=16000,
        extra_body={"reasoning": {"effort": "high"}},
    )
    content = response.choices[0].message.content
    if not content:
        raise RuntimeError("The expert review request returned no text.")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(content.rstrip() + "\n", encoding="utf-8")
    print(OUTPUT)


if __name__ == "__main__":
    main()
