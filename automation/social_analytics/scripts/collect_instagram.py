#!/usr/bin/env python3
"""Collect Instagram professional account and owned-media insights via the official API."""
from __future__ import annotations

import os
from urllib.parse import urlencode

from common import http_json, now_iso, write_json_atomic

API_BASE = "https://graph.instagram.com/v26.0"


def get_json(path: str, token: str, **params: str) -> dict:
    query = urlencode({**params, "access_token": token})
    return http_json(f"{API_BASE}/{path}?{query}")


def insight_value(media_id: str, metric: str, token: str) -> int | None:
    try:
        result = get_json(f"{media_id}/insights", token, metric=metric)
        values = result.get("data", [])
        if not values:
            return None
        return int(values[0].get("values", [{}])[0].get("value", 0))
    except RuntimeError as error:
        print(f"WARN: {metric} unavailable for {media_id}: {error}")
        return None


def main() -> None:
    token = os.getenv("INSTAGRAM_ACCESS_TOKEN", "").strip() or os.getenv("META_ACCESS_TOKEN", "").strip()
    user_id = os.getenv("INSTAGRAM_USER_ID", "").strip()
    if not token:
        print("SKIP: INSTAGRAM_ACCESS_TOKEN or META_ACCESS_TOKEN is not configured")
        return

    account_fields = "id,username,followers_count,follows_count,media_count,biography"
    # Instagram Login tokens can resolve the authorized professional account through /me.
    account = get_json(user_id or "me", token, fields=account_fields)
    user_id = account.get("id", user_id)
    if not user_id:
        raise RuntimeError("Instagram token response did not provide a professional account ID")
    media_response = get_json(
        f"{user_id}/media",
        token,
        fields="id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count",
        limit="25",
    )

    posts = []
    for media in media_response.get("data", []):
        media_id = media["id"]
        metrics = {name: insight_value(media_id, name, token) for name in ("shares", "saved", "total_interactions", "reach", "views")}
        posts.append(
            {
                "id": media_id,
                "permalink": media.get("permalink", ""),
                "format": "reel" if media.get("media_product_type") == "REELS" else media.get("media_type", "unknown").lower(),
                "published_at": media.get("timestamp", ""),
                "caption": media.get("caption", ""),
                "likes": int(media.get("like_count", 0)),
                "comments": int(media.get("comments_count", 0)),
                "shares": metrics["shares"] or 0,
                "saves": metrics["saved"] or 0,
                "interactions": metrics["total_interactions"] or int(media.get("like_count", 0)) + int(media.get("comments_count", 0)),
                "reach": metrics["reach"] or 0,
                "views": metrics["views"] or 0,
            }
        )

    payload = {
        "platform": "instagram",
        "captured_at": now_iso(),
        "source": "Instagram API with Instagram Login / official owned-media insights",
        "account": {
            "id": account.get("id", user_id),
            "username": account.get("username", ""),
            "followers_count": int(account.get("followers_count", 0)),
            "following_count": int(account.get("follows_count", 0)),
            "media_count": int(account.get("media_count", 0)),
            "biography": account.get("biography", ""),
        },
        "posts": posts,
        "limitations": [
            "一部メディア形式では対応しないインサイトが空になる場合がある。",
            "Instagramは一部インサイトを最大48時間遅延して返却する場合がある。",
        ],
    }
    write_json_atomic("instagram_latest.json", payload)


if __name__ == "__main__":
    main()
