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
WEEKDAYS_JA = ["月", "火", "水", "木", "金", "土", "日"]
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BRIEFING_PATH = os.path.join(
    REPO_ROOT, "projects", "project-001-ai-secretary", "briefings", "latest.md"
)
BRIEFING_URL = (
    "https://github.com/FieldRiseJapan/FieldRise/blob/main/"
    "projects/project-001-ai-secretary/briefings/latest.md"
)
API_URL = "https://api.line.me/v2/bot/message/broadcast"
MAX_LEN = 4800  # LINEテキストメッセージ上限5000文字の安全マージン


def format_weather_for_line(body: str) -> str:
    """MarkdownテーブルをLINE向けのテキスト形式に変換する。"""
    result_lines = []
    for line in body.splitlines():
        line = line.strip()
        if not line:
            continue
        # テーブルの区切り行（|---|）はスキップ
        if re.match(r"^\|[-\s|]+\|$", line):
            continue
        # テーブル行（| ... |）をLINE向けに整形
        if line.startswith("|") and line.endswith("|"):
            cells = [c.strip() for c in line.strip("|").split("|")]
            # ヘッダー行（日付・天気・気温...）はスキップ
            if cells and cells[0] in ("日付", ""):
                continue
            # データ行を整形: 日付 天気 最高/最低 降水量 降水確率 風速
            if len(cells) >= 6:
                result_lines.append(
                    f"📅 {cells[0]}\n"
                    f"   天気: {cells[1]}\n"
                    f"   気温: {cells[2]}\n"
                    f"   降水: {cells[3]} / {cells[4]}\n"
                    f"   風速: {cells[5]}"
                )
        else:
            # テーブル以外の行（地点情報など）はそのまま追加
            result_lines.append(line)
    return "\n".join(result_lines)


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

    # ── 挨拶文（動的生成）──
    now = datetime.now(JST)
    date_str = now.strftime("%Y年%m月%d日")
    wd = WEEKDAYS_JA[now.weekday()]
    parts.append(
        f"🌸 おはようございます、社長！\n"
        f"FieldRise AI協働本部 COO・秘書の桃花です。\n\n"
        f"{date_str}（{wd}）朝の定時報告をお届けします。"
    )

    # ── 天気セクション ──
    weather_key = next((k for k in sections if "天気" in k or "気象" in k), None)
    if weather_key:
        body = "\n".join(sections[weather_key])
        # 太字などのMarkdown記号を除去
        body = re.sub(r"\*\*(.+?)\*\*", r"\1", body)
        formatted = format_weather_for_line(body)
        if formatted.strip():
            parts.append(f"■ まんのう町の天気\n{formatted[:1200]}")

    # ── 農業アラート ──
    alert_key = next((k for k in sections if "アラート" in k or "注意" in k), None)
    if alert_key:
        body = "\n".join(l for l in sections[alert_key] if l.strip())
        body = re.sub(r"\*\*(.+?)\*\*", r"\1", body)
        body = re.sub(r"^[-・]\s*", "・", body, flags=re.MULTILINE)
        if body.strip():
            parts.append(f"⚠️ 農業アラート\n{body[:800]}")

    # ── AIニュース ──
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

    # ── ワンポイントコメント ──
    comment_key = next((k for k in sections if "ワンポイント" in k or "コメント" in k), None)
    if comment_key:
        body = "\n".join(l for l in sections[comment_key] if l.strip())
        body = re.sub(r"\*\*(.+?)\*\*", r"\1", body)
        if body.strip():
            parts.append(f"💡 本日のワンポイント\n{body[:400]}")

    parts.append(f"📎 詳細はこちら:\n{BRIEFING_URL}")

    text = (
        "\n\n".join(parts)
        + "\n\n🌸 今日も「最小のCreditで、最大の価値を。」を大切に、"
        "一緒にFieldRiseを育てていきましょう！"
    )
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
    print("LINE通知を送信しました")
    return 0


if __name__ == "__main__":
    sys.exit(main())
