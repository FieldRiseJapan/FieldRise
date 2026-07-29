#!/usr/bin/env python3
"""FieldRise AI秘書 - 天気情報収集スクリプト

香川県まんのう町の天気予報をOpen-Meteo API（無料・キー不要）から取得し、
JSONとして保存する。GitHub Actionsから毎日実行される。
"""
import json
import urllib.request
from datetime import datetime, timezone, timedelta
from pathlib import Path

# 香川県まんのう町（仲多度郡）の座標
LOCATION_NAME = "香川県まんのう町"
LATITUDE = 34.19
LONGITUDE = 133.83

JST = timezone(timedelta(hours=9))

# WMO天気コード → 日本語
WEATHER_CODES = {
    0: "快晴", 1: "晴れ", 2: "一部曇り", 3: "曇り",
    45: "霧", 48: "着氷性の霧",
    51: "霧雨（弱）", 53: "霧雨", 55: "霧雨（強）",
    56: "着氷性霧雨（弱）", 57: "着氷性霧雨（強）",
    61: "雨（弱）", 63: "雨", 65: "雨（強）",
    66: "着氷性の雨（弱）", 67: "着氷性の雨（強）",
    71: "雪（弱）", 73: "雪", 75: "雪（強）", 77: "細氷",
    80: "にわか雨（弱）", 81: "にわか雨", 82: "にわか雨（強）",
    85: "にわか雪（弱）", 86: "にわか雪（強）",
    95: "雷雨", 96: "雷雨（雹を伴う）", 99: "雷雨（激しい雹）",
}


def fetch_weather() -> dict:
    url = (
        "https://api.open-meteo.com/v1/forecast"
        f"?latitude={LATITUDE}&longitude={LONGITUDE}"
        "&daily=weather_code,temperature_2m_max,temperature_2m_min,"
        "precipitation_sum,precipitation_probability_max,wind_speed_10m_max"
        "&timezone=Asia%2FTokyo&forecast_days=7"
    )
    with urllib.request.urlopen(url, timeout=30) as res:
        return json.load(res)


def main() -> None:
    now = datetime.now(JST)
    raw = fetch_weather()
    daily = raw["daily"]

    days = []
    for i, date in enumerate(daily["time"]):
        code = daily["weather_code"][i]
        days.append({
            "date": date,
            "weather": WEATHER_CODES.get(code, f"不明(code={code})"),
            "temp_max_c": daily["temperature_2m_max"][i],
            "temp_min_c": daily["temperature_2m_min"][i],
            "precipitation_mm": daily["precipitation_sum"][i],
            "precipitation_probability_pct": daily["precipitation_probability_max"][i],
            "wind_max_kmh": daily["wind_speed_10m_max"][i],
        })

    output = {
        "location": LOCATION_NAME,
        "latitude": LATITUDE,
        "longitude": LONGITUDE,
        "collected_at": now.isoformat(),
        "source": "Open-Meteo (https://open-meteo.com/)",
        "forecast": days,
    }

    out_dir = Path(__file__).resolve().parents[2] / "projects" / "project-001-ai-secretary" / "data" / "weather"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / f"{now.strftime('%Y-%m-%d')}.json"
    out_file.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    # 最新版も固定名で保存（定時報告生成が参照）
    (out_dir / "latest.json").write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"weather saved: {out_file}")


if __name__ == "__main__":
    main()
