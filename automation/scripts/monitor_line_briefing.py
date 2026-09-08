#!/usr/bin/env python3
"""Read-only monitor for the 07:05 JST LINE daily briefing check.

The monitor never sends LINE messages, changes GitHub settings, or repairs files.
It only checks the delivery marker and the dated briefing, then writes a
machine-readable and human-readable report for GitHub Actions artifacts.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

JST = timezone(timedelta(hours=9))
REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_MARKER = REPO_ROOT / "data/project-001-ai-secretary/last_line_briefing_sent_jst.txt"
DEFAULT_BRIEFING_DIR = REPO_ROOT / "projects/project-001-ai-secretary/briefings"
DEFAULT_OUTPUT_DIR = REPO_ROOT / "monitoring/line_briefing"


def parse_now(value: str | None) -> datetime:
    if value is None:
        return datetime.now(JST)
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=JST)
    return parsed.astimezone(JST)


def read_sent_date(marker_path: Path) -> str | None:
    if not marker_path.exists():
        return None
    for line in marker_path.read_text(encoding="utf-8").splitlines():
        value = line.strip()
        if value:
            return value
    return None


def check_delivery(marker_path: Path, briefing_path: Path, now: datetime) -> dict[str, object]:
    today = now.astimezone(JST).date().isoformat()
    sent_date = read_sent_date(marker_path)
    briefing_exists = briefing_path.is_file()

    if not briefing_exists:
        return {
            "status": "attention_required",
            "reason": "briefing_missing",
            "today_jst": today,
            "sent_date": sent_date,
            "marker_path": str(marker_path),
            "briefing_path": str(briefing_path),
            "briefing_exists": False,
        }

    if sent_date != today:
        return {
            "status": "attention_required",
            "reason": "line_not_marked_sent_today",
            "today_jst": today,
            "sent_date": sent_date,
            "marker_path": str(marker_path),
            "briefing_path": str(briefing_path),
            "briefing_exists": True,
        }

    return {
        "status": "pass",
        "reason": "line_marked_sent_today",
        "today_jst": today,
        "sent_date": sent_date,
        "marker_path": str(marker_path),
        "briefing_path": str(briefing_path),
        "briefing_exists": True,
    }


def markdown_report(result: dict[str, object], checked_at: datetime) -> str:
    status = str(result["status"])
    if status == "pass":
        conclusion = "本日のLINE定時報告は送信済みマーカーで確認できました。"
    elif result["reason"] == "briefing_missing":
        conclusion = "当日分の定時報告ファイルが見つかりません。送信状態を判定できません。"
    else:
        conclusion = "本日分のLINE送信済みマーカーが確認できません。未送信または記録失敗の可能性があります。"

    return (
        "# LINE定時報告 07:05 JST 監視レポート\n\n"
        f"- 確認時刻: `{checked_at.astimezone(JST).isoformat()}`\n"
        f"- 対象日（JST）: `{result['today_jst']}`\n"
        f"- 結果: **{status}**\n"
        f"- 判定: `{result['reason']}`\n\n"
        f"> {conclusion}\n\n"
        "## 検査対象\n\n"
        "| 項目 | 値 |\n|---|---|\n"
        f"| 送信済み日付 | `{result['sent_date'] or '未確認'}` |\n"
        f"| 送信済みマーカー | `{result['marker_path']}` |\n"
        f"| 当日定時報告 | `{result['briefing_path']}` |\n"
        f"| 当日定時報告の存在 | `{result['briefing_exists']}` |\n\n"
        "## 安全境界\n\n"
        "この監視は読み取り専用です。LINE送信、ファイル修復、GitHub設定変更、再送信は自動実行しません。"
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Read-only 07:05 JST LINE briefing monitor")
    parser.add_argument("--marker", type=Path, default=DEFAULT_MARKER)
    parser.add_argument("--briefing-dir", type=Path, default=DEFAULT_BRIEFING_DIR)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--now", help="ISO-8601 timestamp for deterministic tests")
    args = parser.parse_args()

    now = parse_now(args.now)
    today = now.date().isoformat()
    briefing_path = args.briefing_dir / f"{today}.md"
    result = check_delivery(args.marker, briefing_path, now)
    report = {
        "monitor": "line_briefing_0705_jst",
        "checked_at": now.isoformat(),
        **result,
        "safety": {
            "read_only": True,
            "sends_line": False,
            "auto_repairs": False,
        },
    }

    args.output_dir.mkdir(parents=True, exist_ok=True)
    stem = now.astimezone(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    json_path = args.output_dir / f"line-briefing-monitor-{stem}.json"
    markdown_path = args.output_dir / f"line-briefing-monitor-{stem}.md"
    json_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    markdown_path.write_text(markdown_report(result, now), encoding="utf-8")
    print(json.dumps({"status": result["status"], "json": str(json_path), "markdown": str(markdown_path)}, ensure_ascii=False))
    return 0 if result["status"] == "pass" else 2


if __name__ == "__main__":
    raise SystemExit(main())
