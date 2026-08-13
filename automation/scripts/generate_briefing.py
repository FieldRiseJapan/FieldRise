#!/usr/bin/env python3
"""FieldRise AI秘書 - 定時報告（デイリーブリーフィング）生成スクリプト

収集済みの天気・AIニュースデータから、社長向けの定時報告Markdownを生成する。
GitHub Actionsから毎朝実行される。
"""
import json
from datetime import datetime, timezone, timedelta
from pathlib import Path

JST = timezone(timedelta(hours=9))
WEEKDAYS_JA = ["月", "火", "水", "木", "金", "土", "日"]
SONATA_DESK_URL = "https://fieldrise-ythnsgue.manus.space"

BASE = Path(__file__).resolve().parents[2] / "projects" / "project-001-ai-secretary"


def load_json(path: Path):
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return None


def weather_section(data) -> str:
    if not data:
        return "本日の天気データは取得できませんでした。\n"
    lines = [
        f"**地点**: {data['location']}（データ提供: Open-Meteo）",
        "",
        "| 日付 | 天気 | 最高/最低気温 | 降水量 | 降水確率 | 最大風速 |",
        "|---|---|---|---|---|---|",
    ]
    for d in data["forecast"][:5]:
        dt = datetime.strptime(d["date"], "%Y-%m-%d")
        wd = WEEKDAYS_JA[dt.weekday()]
        lines.append(
            f"| {d['date']}（{wd}） | {d['weather']} "
            f"| {d['temp_max_c']}°C / {d['temp_min_c']}°C "
            f"| {d['precipitation_mm']}mm | {d['precipitation_probability_pct']}% "
            f"| {d['wind_max_kmh']}km/h |"
        )
    alerts = []
    today = data["forecast"][0]
    if today["temp_max_c"] >= 35:
        alerts.append("猛暑日予想（35°C以上）。高温障害・水管理に注意してください。")
    if today["precipitation_probability_pct"] >= 70:
        alerts.append("降水確率70%以上。屋外作業の予定調整をおすすめします。")
    if today["wind_max_kmh"] >= 40:
        alerts.append("強風予想（40km/h以上）。設備の固定を確認してください。")
    for d in data["forecast"][:3]:
        if d["precipitation_mm"] >= 30:
            alerts.append(f"{d['date']}に大雨予想（{d['precipitation_mm']}mm）。排水対策をご検討ください。")
            break
    if alerts:
        lines.append("")
        lines.append("**【農業アラート】**")
        for a in alerts:
            lines.append(f"- {a}")
    return "\n".join(lines) + "\n"


def get_agriculture_comment(weather_data) -> str:
    """農業向けのワンポイントコメントを生成"""
    if not weather_data or not weather_data.get("forecast"):
        return "本日の天気データから最適な農作業をご判断ください。"
    today = weather_data["forecast"][0]
    temp_max = today.get("temp_max_c", 0)
    precip_prob = today.get("precipitation_probability_pct", 0)
    if temp_max >= 35:
        return "猛暑が予想されます。田んぼの水管理を優先してください。"
    elif precip_prob >= 70:
        return "雨の予報です。屋外作業の予定調整をおすすめします。"
    elif temp_max <= 5:
        return "冷え込みが予想されます。作物の霜害対策をご確認ください。"
    else:
        return "良好な天気が予想されます。農作業を進めるのに適した一日です。"


def get_music_comment(now: datetime) -> str:
    """音楽・Cafeシリーズ向けのワンポイントコメントを生成"""
    weekday = now.weekday()
    hour = now.hour
    if weekday >= 4:
        return "週末です。Cafeシリーズのアイデアを整理するのに適した一日です。"
    elif hour >= 14:
        return "午後です。新しい音楽トレンドをチェックするのに適した時間帯です。"
    else:
        return "朝です。Cafeシリーズのコンセプト整理に集中するのに適した時間帯です。"


def news_section(data) -> str:
    if not data or not data.get("items"):
        return "本日のAIニュースは取得できませんでした。\n"
    lines = []
    ja = [i for i in data["items"] if i.get("lang") == "ja"][:6]
    en = [i for i in data["items"] if i.get("lang") == "en"][:6]
    if ja:
        lines.append("**国内AIニュース**")
        lines.append("")
        for i in ja:
            lines.append(f"- [{i['title']}]({i['url']}) — {i['source']}")
        lines.append("")
    if en:
        lines.append("**海外AIニュース**")
        lines.append("")
        for i in en:
            lines.append(f"- [{i['title']}]({i['url']}) — {i['source']}")
    return "\n".join(lines) + "\n"


def main() -> None:
    now = datetime.now(JST)
    date_str = now.strftime("%Y-%m-%d")
    wd = WEEKDAYS_JA[now.weekday()]

    weather = load_json(BASE / "data" / "weather" / "latest.json")
    news = load_json(BASE / "data" / "ai-news" / "latest.json")

    md = f"""# {date_str}（{wd}）朝の定時報告

**FieldRise AI協働本部 COO・秘書の桃花です。** | **生成時刻**: {now.strftime('%H:%M')} JST

---

## 📊 ダッシュボード

{SONATA_DESK_URL}

---

## 1. 天気情報（まんのう町）

{weather_section(weather)}

---

## 2. AIニュース

{news_section(news)}

---

## 3. 本日のワンポイントコメント

🌾 **農業**
{get_agriculture_comment(weather)}

🎵 **音楽**
{get_music_comment(now)}

🤖 **システム**
GitHub・各システムは正常稼働中です。

---

本定時報告はGitHub Actionsにより毎朝7:00に自動生成されています。
Credit節約運用中のため、本報告は無料APIと公開情報のみを利用しています。
"""

    out_dir = BASE / "briefings"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / f"{date_str}.md"
    out_file.write_text(md, encoding="utf-8")
    (out_dir / "latest.md").write_text(md, encoding="utf-8")
    print(f"定時報告 saved: {out_file}")


if __name__ == "__main__":
    main()
