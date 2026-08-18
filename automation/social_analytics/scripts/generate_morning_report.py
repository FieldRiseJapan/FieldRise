#!/usr/bin/env python3
"""Create a concise Japanese morning report containing permanent GitHub report URLs."""
from __future__ import annotations

from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
REPORT_DIR = ROOT / "reports"
REPO_URL = "https://github.com/FieldRiseJapan/FieldRise"
JST = ZoneInfo("Asia/Tokyo")
JAPANESE_WEEKDAYS = ["月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日", "日曜日"]


def main() -> None:
    now = datetime.now(JST)
    date_text = f"{now.year}年{now.month}月{now.day}日（{JAPANESE_WEEKDAYS[now.weekday()]}）"
    links = {
        "総合インデックス": f"{REPO_URL}/blob/main/automation/social_analytics/reports/latest_report.md",
        "TikTok": f"{REPO_URL}/blob/main/automation/social_analytics/reports/tiktok_full_analysis.md",
        "Instagram": f"{REPO_URL}/blob/main/automation/social_analytics/reports/instagram_full_analysis.md",
        "YouTube": f"{REPO_URL}/blob/main/automation/social_analytics/reports/youtube_full_analysis.md",
    }
    report = f"""{date_text}朝の定時報告をお届けします。\n\nFieldRise AI協働本部 COO・秘書の桃花です。\n\n【SNS分析レポート】\n・総合インデックス：{links['総合インデックス']}\n・TikTok：{links['TikTok']}\n・Instagram：{links['Instagram']}\n・YouTube：{links['YouTube']}\n\n【更新状況】\n・Instagram：投稿インサイトを基にした初期フル分析を掲載済みです。\n・YouTube：公開データによる初期フル分析を掲載済みです。\n・TikTok：所有者API認可後に実測値グラフを自動追加します。\n\n本日のワンポイントコメント\nCafeシリーズは、YouTubeで用途語を明示した長尺動画を軸にし、同じ導入部分をTikTokとInstagram Reelsに展開すると、シリーズ認知と視聴導線を一つの設計に統合できます。\n"""
    output = REPORT_DIR / "morning_report_latest.txt"
    output.write_text(report, encoding="utf-8")
    print(f"UPDATED: {output.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
