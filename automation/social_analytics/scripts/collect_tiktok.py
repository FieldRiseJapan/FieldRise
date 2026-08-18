#!/usr/bin/env python3
"""Collect authorized TikTok profile and video metrics using the TikTok API."""
from __future__ import annotations

from urllib.parse import urlencode

from common import http_json, now_iso, post_json, require_env, write_json_atomic

TOKEN_ENDPOINT = "https://open.tiktokapis.com/v2/oauth/token/"
API_BASE = "https://open.tiktokapis.com"


def main() -> None:
    env = require_env("TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET", "TIKTOK_REFRESH_TOKEN")
    if env is None:
        return

    token_data = http_json(
        TOKEN_ENDPOINT,
        method="POST",
        data={
            "client_key": env["TIKTOK_CLIENT_KEY"],
            "client_secret": env["TIKTOK_CLIENT_SECRET"],
            "grant_type": "refresh_token",
            "refresh_token": env["TIKTOK_REFRESH_TOKEN"],
        },
    )
    access_token = token_data.get("access_token")
    if not access_token:
        raise RuntimeError("TikTok token refresh response did not include access_token")
    headers = {"Authorization": f"Bearer {access_token}"}

    account_fields = "open_id,display_name,username,profile_deep_link,follower_count,following_count,likes_count,video_count"
    profile = http_json(f"{API_BASE}/v2/user/info/?{urlencode({'fields': account_fields})}", headers=headers)
    profile_data = profile.get("data", {}).get("user", {})

    list_fields = "id"
    listed = post_json(
        f"{API_BASE}/v2/video/list/?{urlencode({'fields': list_fields})}",
        {"max_count": 20},
        headers=headers,
    )
    video_ids = [v["id"] for v in listed.get("data", {}).get("videos", []) if v.get("id")]
    details = []
    if video_ids:
        video_fields = "id,create_time,video_description,duration,share_url,like_count,comment_count,share_count,view_count"
        queried = post_json(
            f"{API_BASE}/v2/video/query/?{urlencode({'fields': video_fields})}",
            {"filters": {"video_ids": video_ids}},
            headers=headers,
        )
        details = queried.get("data", {}).get("videos", [])

    payload = {
        "platform": "tiktok",
        "captured_at": now_iso(),
        "source": "TikTok API via authorized account and refresh token",
        "account": profile_data,
        "videos": details,
        "pagination": {
            "cursor": listed.get("data", {}).get("cursor"),
            "has_more": bool(listed.get("data", {}).get("has_more", False)),
        },
        "token_refresh_expires_in": token_data.get("refresh_expires_in"),
        "limitations": [
            "This job collects the most recent 20 videos on each run; an archive job is required for historical pagination.",
            "The refresh token returned by TikTok is intentionally not written to repository files or logs.",
        ],
    }
    write_json_atomic("tiktok_latest.json", payload)


if __name__ == "__main__":
    main()
