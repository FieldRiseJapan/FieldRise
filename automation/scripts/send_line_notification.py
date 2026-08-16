#!/usr/bin/env python3
"""FieldRise AI秘書 - LINE通知スクリプト

定時報告（briefings/latest.md）の要約をLINE公式アカウント「FieldRise Secretary」
からブロードキャスト配信する。

必要な環境変数:
    LINE_CHANNEL_ACCESS_TOKEN: Messaging APIのチャネルアクセストークン（長期）

無料枠: 月200通（定時報告1日1通なら約30通/月で余裕）
"""

import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timedelta, timezone

JST = timezone(timedelta(hours=9))
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BRIEFING_PATH = os.path.join(
    REPO_ROOT, "projects", "project-001-ai-secretary", "briefings", "latest.md"
)
BRIEFING_URL = (
    "https://github.com/FieldRiseJapan/FieldRise/blob/main/"
    "projects/project-001-ai-secretary/briefings/latest.md"
)
AI_CONTROL_DASHBOARD_URL = "https://fieldrisejapan.github.io/FieldRise/ai-control-dashboard/"
FIELDRISE_HOME_URL = "https://fieldrisejapan.github.io/FieldRise/"
API_URL = "https://api.line.me/v2/bot/message/broadcast"
MAX_LEN = 4800  # LINEテキストメッセージ上限5000文字の安全マージン


def extract_summary(md_text: str) -> str:
    """定時報告Markdownから通知用の要約テキストを組み立てる。"""
    lines = md_text.splitlines()
    sections: dict[str, list[str]] = {}
    current = ""
    for line in lines:
        if line.startswith("## "):
            current = line[3:].strip()
            sections[current] = []
        elif current:
            sections[current].append(line)

    parts: list[str] = []
    today = datetime.now(JST).strftime("%Y年%m月%d日")
    parts.append(f"おはようございます、社長。\nFieldRise 秘書の桃花です。{today}の定時報告をお届けします。")
    parts.append(f"📊 FieldRise AI Control Dashboard\n{AI_CONTROL_DASHBOARD_URL}")
    parts.append(f"🌐 FieldRiseホームページ\n{FIELDRISE_HOME_URL}")

    weather_key = next((k for k in sections if "天気" in k or "気象" in k), None)
    if weather_key:
        body = "\n".join(sections[weather_key])
        body = re.sub(r"\*\*(.+?)\*\*", r"\1", body)
        body = "\n".join(
            l for l in body.splitlines() if l.strip() and not l.strip().startswith("|--")
        )
        parts.append(f"■ まんのう町の天気\n{body[:1200]}")

    alert_key = next((k for k in sections if "アラート" in k or "注意" in k), None)
    if alert_key:
        body = "\n".join(l for l in sections[alert_key] if l.strip())
        body = re.sub(r"\*\*(.+?)\*\*", r"\1", body)
        if body.strip():
            parts.append(f"■ 農業アラート\n{body[:800]}")

    news_key = next((k for k in sections if "ニュース" in k or "News" in k), None)
    if news_key:
        items = []
        for l in sections[news_key]:
            m = re.match(r"^\s*(?:[-*]|\d+\.)\s+\[?(.+?)\]?\((https?://\S+)\)", l)
            if m:
                items.append(f"・{m.group(1)}")
            elif re.match(r"^\s*(?:[-*]|\d+\.)\s+", l):
                items.append("・" + re.sub(r"^\s*(?:[-*]|\d+\.)\s+", "", l).strip())
            if len(items) >= 5:
                break
        if items:
            parts.append("■ AIニュース（主要5件）\n" + "\n".join(items))

    parts.append(f"詳細はこちら:\n{BRIEFING_URL}")
    cafe_report_path = os.path.join(REPO_ROOT, "data", "latest_report.txt")
    if os.path.exists(cafe_report_path):
        with open(cafe_report_path, encoding="utf-8") as f:
            cafe_report = f.read()
        parts.append(cafe_report)

    text = "\n\n".join(parts)
    return text[:MAX_LEN]


def send_broadcast(token: str, text: str) -> None:
    payload = json.dumps({"messages": [{"type": "text", "text": text}]}).encode("utf-8")
    req = urllib.request.Request(
        API_URL,
        data=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        print(f"LINE broadcast: HTTP {resp.status}")


def main() -> int:
    token = os.environ.get("LINE_CHANNEL_ACCESS_TOKEN", "").strip()
    if not token:
        print("ERROR: LINE_CHANNEL_ACCESS_TOKEN が設定されていません", file=sys.stderr)
        return 1
    if not os.path.exists(BRIEFING_PATH):
        print(f"ERROR: 定時報告が見つかりません: {BRIEFING_PATH}", file=sys.stderr)
        return 1
    with open(BRIEFING_PATH, encoding="utf-8") as f:
        md_text = f.read()
    text = extract_summary(md_text)
    try:
        send_broadcast(token, text)
    except Exception as e:  # noqa: BLE001
        print(f"ERROR: LINE送信に失敗しました: {e}", file=sys.stderr)
        return 1
    print("LINE定時報告を送信しました")
    return 0


if __name__ == "__main__":
    sys.exit(main())
