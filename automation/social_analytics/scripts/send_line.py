#!/usr/bin/env python3
"""Send the already-generated morning report through LINE Messaging API when secrets are configured."""
from __future__ import annotations

import json
import os
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
REPORT_FILE = ROOT / "reports" / "morning_report_latest.txt"
ENDPOINT = "https://api.line.me/v2/bot/message/push"


def main() -> None:
    token = os.getenv("LINE_CHANNEL_ACCESS_TOKEN", "").strip()
    target = os.getenv("LINE_TARGET_ID", "").strip()
    if not token or not target:
        print("SKIP: LINE secrets are not configured")
        return
    message = REPORT_FILE.read_text(encoding="utf-8")
    payload = json.dumps({"to": target, "messages": [{"type": "text", "text": message[:5000]}]}).encode("utf-8")
    request = Request(
        ENDPOINT,
        data=payload,
        method="POST",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    try:
        with urlopen(request, timeout=30) as response:
            print(f"LINE notification sent: HTTP {response.status}")
    except HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"LINE notification failed: HTTP {error.code}: {detail[:300]}") from error


if __name__ == "__main__":
    main()
