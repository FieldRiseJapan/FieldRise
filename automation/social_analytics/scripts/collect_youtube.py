#!/usr/bin/env python3
"""Collect YouTube channel data using owner OAuth when available, otherwise a public API key."""
from __future__ import annotations

import os
from datetime import date, timedelta
from urllib.parse import urlencode

from common import http_json, now_iso, write_json_atomic

TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
DATA_BASE = "https://www.googleapis.com/youtube/v3"
ANALYTICS_BASE = "https://youtubeanalytics.googleapis.com/v2/reports"
# Confirmed public channel for @Runa-Girl8215.
DEFAULT_CHANNEL_ID = "UCHmI-5eV-xPLSVtcO8QOd7A"


def api_get(url: str, *, access_token: str = "", api_key: str = "", **params: str) -> dict:
    request_params = dict(params)
    headers: dict[str, str] = {}
    if access_token:
        headers["Authorization"] = f"Bearer {access_token}"
    elif api_key:
        request_params["key"] = api_key
    else:
        raise RuntimeError("Either access_token or api_key is required")
    return http_json(f"{url}?{urlencode(request_params)}", headers=headers)


def category(title: str) -> str:
    lowered = title.lower()
    if "cafe" in lowered or "café" in lowered:
        return "cafe"
    if "edm" in lowered:
        return "edm"
    if any(term in lowered for term in ("winter", "snow", "christmas", "salju")):
        return "winter"
    if "jazz" in lowered:
        return "jazz"
    return "other"


def collect_channel(*, access_token: str = "", api_key: str = "", mine: bool = False) -> tuple[dict, list[dict]]:
    channel_params = {"part": "snippet,contentDetails,statistics"}
    if mine:
        channel_params["mine"] = "true"
    else:
        channel_params["id"] = os.getenv("YOUTUBE_CHANNEL_ID", DEFAULT_CHANNEL_ID)
    channels = api_get(f"{DATA_BASE}/channels", access_token=access_token, api_key=api_key, **channel_params).get("items", [])
    if not channels:
        raise RuntimeError("No YouTube channel was returned for the configured credentials/channel ID")
    channel = channels[0]
    uploads = channel["contentDetails"]["relatedPlaylists"]["uploads"]
    playlist = api_get(
        f"{DATA_BASE}/playlistItems",
        access_token=access_token,
        api_key=api_key,
        part="snippet,contentDetails",
        playlistId=uploads,
        maxResults="50",
    )
    video_ids = [item["contentDetails"]["videoId"] for item in playlist.get("items", [])]
    videos = api_get(
        f"{DATA_BASE}/videos",
        access_token=access_token,
        api_key=api_key,
        part="snippet,statistics,contentDetails",
        id=",".join(video_ids),
        maxResults="50",
    ).get("items", []) if video_ids else []
    return channel, videos


def normalized_payload(channel: dict, videos: list[dict], *, source: str, daily_analytics: dict, limitations: list[str]) -> dict:
    channel_snippet = channel.get("snippet", {})
    channel_stats = channel.get("statistics", {})
    observed = [
        {
            "id": item.get("id", ""),
            "title": item.get("snippet", {}).get("title", ""),
            "views": int(item.get("statistics", {}).get("viewCount", 0)),
            "age_label": item.get("snippet", {}).get("publishedAt", ""),
            "category": category(item.get("snippet", {}).get("title", "")),
        }
        for item in videos
    ]
    return {
        "platform": "youtube",
        "captured_at": now_iso(),
        "source": source,
        "account": {
            "channel_url": f"https://www.youtube.com/channel/{channel.get('id', '')}",
            "channel_id": channel.get("id", ""),
            "handle": channel_snippet.get("customUrl", channel_snippet.get("title", "")),
            "subscribers": int(channel_stats.get("subscriberCount", 0)),
            "public_video_count": int(channel_stats.get("videoCount", 0)),
            "description": channel_snippet.get("description", ""),
        },
        "videos_observed": observed,
        "daily_analytics": daily_analytics,
        "limitations": limitations,
    }


def main() -> None:
    client_id = os.getenv("YOUTUBE_CLIENT_ID", "").strip()
    client_secret = os.getenv("YOUTUBE_CLIENT_SECRET", "").strip()
    refresh_token = os.getenv("YOUTUBE_REFRESH_TOKEN", "").strip()
    api_key = os.getenv("YOUTUBE_API_KEY", "").strip()

    oauth_ready = all((client_id, client_secret, refresh_token))
    if oauth_ready:
        token = http_json(
            TOKEN_ENDPOINT,
            method="POST",
            data={"client_id": client_id, "client_secret": client_secret, "refresh_token": refresh_token, "grant_type": "refresh_token"},
        )
        access_token = token.get("access_token")
        if not access_token:
            raise RuntimeError("Google token refresh response did not include access_token")
        channel, videos = collect_channel(access_token=access_token, mine=True)
        end_date = date.today() - timedelta(days=1)
        start_date = end_date - timedelta(days=27)
        analytics = api_get(
            ANALYTICS_BASE,
            access_token=access_token,
            ids="channel==MINE",
            startDate=start_date.isoformat(),
            endDate=end_date.isoformat(),
            metrics="views,estimatedMinutesWatched,averageViewDuration,likes,comments,subscribersGained,subscribersLost",
            dimensions="day",
            sort="day",
        )
        payload = normalized_payload(
            channel,
            videos,
            source="YouTube Data API and YouTube Analytics API via authorized channel",
            daily_analytics={"available": True, "start_date": start_date.isoformat(), "end_date": end_date.isoformat(), "column_headers": analytics.get("columnHeaders", []), "rows": analytics.get("rows", [])},
            limitations=["日次分析は処理遅延を避けるため前日までの28日間を取得する。"],
        )
    elif api_key:
        channel, videos = collect_channel(api_key=api_key, mine=False)
        payload = normalized_payload(
            channel,
            videos,
            source="YouTube Data API public channel statistics via API key",
            daily_analytics={"available": False, "rows": []},
            limitations=["APIキーによる公開統計のみ。視聴時間、維持率、CTR、流入元、登録者増減などの所有者分析にはOAuth認可が必要。"],
        )
    else:
        print("SKIP: no complete YouTube OAuth credentials or YOUTUBE_API_KEY is configured")
        return

    write_json_atomic("youtube_latest.json", payload)


if __name__ == "__main__":
    main()
