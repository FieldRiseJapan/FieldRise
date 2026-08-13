#!/usr/bin/env python3
"""Generate Sonata Desk display data from FieldRise's GitHub canonical Markdown.

This script is deliberately deterministic: it writes output only when the canonical
source content changes. It never modifies a canonical file.
"""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
OUTPUT_DIR = ROOT / "dashboard" / "sonata-desk" / "src" / "generated"
SOURCES = {
    "song001": ROOT / "music_ai" / "reference_music" / "success_song_001.md",
    "song002": ROOT / "music_ai" / "reference_music" / "success_song_002.md",
    "a1": ROOT / "music_ai" / "experiments" / "A1_001-002-ground-truth-capture.md",
    "patterns": ROOT / "music_ai" / "suno_database" / "successful_patterns.md",
    "audioLedger": ROOT / "music_ai" / "reference_music" / "audio" / "README.md",
    "expertReview": ROOT / "music_ai" / "analysis" / "cafe" / "2026-08-14_001-002_expert_peer_review.md",
}


def clean(value: str) -> str:
    return re.sub(r"\s+", " ", value.replace("**", "").strip())


def first_match(pattern: str, text: str, default: str = "未観測") -> str:
    found = re.search(pattern, text, flags=re.MULTILINE | re.DOTALL)
    return clean(found.group(1)) if found else default


def parse_g_row(text: str, gate_id: int) -> tuple[str, str, str, str]:
    pattern = rf"^\|\s*G{gate_id:02d}\s+([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|"
    found = re.search(pattern, text, flags=re.MULTILINE)
    if not found:
        return (f"G{gate_id:02d}", "未登録", "対象外", "保留")
    return tuple(clean(item) for item in found.groups())  # type: ignore[return-value]


def display_state(states: list[str]) -> str:
    if all("実測済み" in state or "対象外" in state for state in states):
        return "measured"
    if all("未完了" in state or "保留" in state for state in states):
        return "pending"
    return "partial"


def parse_reference(reference_id: str, text: str) -> dict[str, str]:
    duration = first_match(r"(?:元Main|提供Main)\*\*:\s*([0-9.]+秒)", text)
    audio_format = re.search(r"(?:元Main|提供Main)\*\*:\s*[0-9.]+秒、\s*([^、]+)、\s*([^、]+)", text)
    sample_rate = f"{clean(audio_format.group(1))} / {clean(audio_format.group(2))}" if audio_format else "未観測"
    bpm = first_match(r"\|\s*BPM\s*\|\s*推定?\s*([0-9.]+\s*BPM)", text)
    bass_onset = first_match(r"Bassの(?:最初の)?Onsetは\s*([0-9.]+秒)", text)
    intro_bass = first_match(r"Bass(?:低域)?比率(?:は|は)?\s*([0-9.]+%)", text)
    if intro_bass == "未観測":
        intro_bass = first_match(r"0〜2秒のBass低域比率は\s*([0-9.]+%)", text)
    drums_rms = first_match(r"Drums(?:全体)?RMS(?:は|は)?\s*(-[0-9.]+\s*dBFS)", text)
    analysis_state = first_match(r"- \*\*分析状態\*\*:\s*([^\n]+)", text)
    audio_path = first_match(r"GitHub参照音源\*\*: \[`([^`]+)`", text, "")
    return {
        "id": reference_id,
        "sourceType": "正本 Main / 可逆FLAC" if reference_id == "001" else "暫定 Main / 4-stem mix FLAC",
        "status": "verified" if reference_id == "001" else "pending",
        "statusLabel": "正本・検証済み" if reference_id == "001" else "暫定・正式Main待ち",
        "duration": duration,
        "sampleRate": sample_rate,
        "bpm": f"{bpm}*" if bpm != "未観測" else bpm,
        "bassOnset": bass_onset,
        "introBass": intro_bass,
        "drumsRms": drums_rms,
        "summary": analysis_state,
        "audioPath": f"music_ai/reference_music/{audio_path}" if audio_path else "",
        "sourcePath": f"music_ai/reference_music/success_song_{reference_id}.md",
    }


def parse_gates(song_001: str, song_002: str) -> list[dict[str, str]]:
    gates: list[dict[str, str]] = []
    for gate_id in range(1, 10):
        label_001, note_001, _timecode_001, state_001 = parse_g_row(song_001, gate_id)
        label_002, note_002, _timecode_002, state_002 = parse_g_row(song_002, gate_id)
        label = label_001 if label_001 != f"G{gate_id:02d}" else label_002
        note = f"001: {note_001} / 002: {note_002}"
        gates.append(
            {
                "id": f"G{gate_id:02d}",
                "label": label,
                "state": display_state([state_001, state_002]),
                "note": note[:260],
            }
        )
    return gates


def parse_patterns(text: str) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    recording = False
    for line in text.splitlines():
        if line.strip() == "## 現在の登録":
            recording = True
            continue
        if recording and line.startswith("## "):
            break
        if not recording or not line.startswith("|") or "pattern_id" in line or "---" in line:
            continue
        cells = [clean(cell) for cell in line.strip().strip("|").split("|")]
        if len(cells) != 6:
            continue
        pattern_id, kind, condition, evidence, use_rule, confidence = cells
        rows.append(
            {
                "id": pattern_id,
                "kind": kind,
                "label": confidence,
                "title": condition,
                "body": use_rule,
                "evidence": evidence,
            }
        )
    return rows


def parse_a1_metadata(text: str) -> dict[str, str]:
    status = first_match(r"^status:\s*([^\n]+)", text)
    purpose = first_match(r"^purpose:\s*\"([^\"]+)\"", text)
    changed_variable = first_match(r"^changed_variable:\s*\"([^\"]+)\"", text)
    return {"status": status, "purpose": purpose, "changedVariable": changed_variable}


def write_json(path: Path, payload: dict) -> bool:
    serialized = json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    if path.exists() and path.read_text(encoding="utf-8") == serialized:
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(serialized, encoding="utf-8")
    return True


def main() -> None:
    contents = {key: path.read_text(encoding="utf-8") for key, path in SOURCES.items()}
    source_hashes = {str(path.relative_to(ROOT)): hashlib.sha256(contents[key].encode("utf-8")).hexdigest() for key, path in SOURCES.items()}
    digest = hashlib.sha256("".join(source_hashes.values()).encode("utf-8")).hexdigest()
    a1 = parse_a1_metadata(contents["a1"])
    dashboard_data = {
        "schemaVersion": 1,
        "sourceDigest": digest,
        "sourceFiles": source_hashes,
        "sources": {
            "a1": "music_ai/experiments/A1_001-002-ground-truth-capture.md",
            "patterns": "music_ai/suno_database/successful_patterns.md",
            "audioLedger": "music_ai/reference_music/audio/README.md",
            "groundTruth": "music_ai/reference_music/ground_truth_spec_v1.md",
            "song001": "music_ai/reference_music/success_song_001.md",
            "song002": "music_ai/reference_music/success_song_002.md",
            "expertReview": "music_ai/analysis/cafe/2026-08-14_001-002_expert_peer_review.md",
        },
        "references": [parse_reference("001", contents["song001"]), parse_reference("002", contents["song002"])],
        "decisionBrief": {
            "title": "B1は、伴奏導入時刻だけを比べる。",
            "body": "001の約2.299秒と002の約0.255秒を比較する。002は暫定stem mixのため、正式Mainとテンポ確認を先に解消する。",
            "action": "完全分析を読む",
            "sourcePath": "music_ai/analysis/cafe/2026-08-14_001-002_expert_peer_review.md",
        },
        "evidenceIntegrity": [
            {"id": "001", "state": "verified", "label": "VERIFIED / CANONICAL", "detail": "正規MainとFLAC整合、4ステム再構成を確認済み。"},
            {"id": "002", "state": "pending", "label": "PROVISIONAL / STEM MIX", "detail": "提供Mainは無音。4ステム合成版は比較用の暫定参照。"},
        ],
        "reviewQueue": [
            {"id": "R1", "state": "blocker", "title": "002の正しいMainを確保", "detail": "正しいMainの再書き出し、またはstem mixの正式承認が必要。", "sourcePath": "music_ai/analysis/cafe/2026-08-14_001-002_expert_peer_review.md"},
            {"id": "R2", "state": "review", "title": "002のテンポを確定", "detail": "80.75 / 83.35 / 123.05 BPM候補をDAWと聴取で照合する。", "sourcePath": "music_ai/analysis/cafe/2026-08-14_001-002_expert_peer_review.md"},
            {"id": "R3", "state": "review", "title": "Loopと聴取記録を完了", "detail": "終端→冒頭、音色、ノイズ、音数をタイムコード付きで確認する。", "sourcePath": "music_ai/analysis/cafe/2026-08-14_001-002_expert_peer_review.md"},
        ],
        "a1": {**a1, "gates": parse_gates(contents["song001"], contents["song002"])},
        "ledger": [
            {"id": "A1", "title": a1["purpose"], "variable": a1["changedVariable"], "outcome": a1["status"], "note": "001は正本、002は正式Main待ち。"},
            {"id": "B1", "title": "その他ステムの導入時刻比較", "variable": "0.3 sec vs 2.3 sec のみ", "outcome": "設計済み / 承認待ち", "note": "Bass・Tempo・Drums・非ボーカル主導を固定。"},
        ],
        "patterns": parse_patterns(contents["patterns"]),
    }
    status = {
        "schemaVersion": 1,
        "status": "ok",
        "sourceDigest": digest,
        "sourceFiles": source_hashes,
        "generatedFiles": ["dashboard-data.json", "sync-status.json"],
    }
    data_changed = write_json(OUTPUT_DIR / "dashboard-data.json", dashboard_data)
    status_changed = write_json(OUTPUT_DIR / "sync-status.json", status)
    print(json.dumps({"dataChanged": data_changed, "statusChanged": status_changed, "sourceDigest": digest}, ensure_ascii=False))


if __name__ == "__main__":
    main()
