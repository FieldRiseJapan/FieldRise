"""Small utilities for API collectors. Credentials are read only from environment variables."""
from __future__ import annotations

import json
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"


def now_iso() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")


def require_env(*names: str) -> dict[str, str] | None:
    values = {name: os.getenv(name, "").strip() for name in names}
    missing = [name for name, value in values.items() if not value]
    if missing:
        print(f"SKIP: missing required secret(s): {', '.join(missing)}")
        return None
    return values


def http_json(url: str, *, method: str = "GET", headers: dict[str, str] | None = None, data: dict[str, Any] | None = None) -> dict[str, Any]:
    body = None
    request_headers = {"Accept": "application/json", **(headers or {})}
    if data is not None:
        body = urlencode(data).encode("utf-8")
        request_headers.setdefault("Content-Type", "application/x-www-form-urlencoded")
    request = Request(url, data=body, method=method, headers=request_headers)
    try:
        with urlopen(request, timeout=45) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        payload = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {error.code} from {url}: {payload[:500]}") from error


def post_json(url: str, payload: dict[str, Any], headers: dict[str, str] | None = None) -> dict[str, Any]:
    body = json.dumps(payload).encode("utf-8")
    request = Request(
        url,
        data=body,
        method="POST",
        headers={"Accept": "application/json", "Content-Type": "application/json", **(headers or {})},
    )
    try:
        with urlopen(request, timeout=45) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        response_body = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {error.code} from {url}: {response_body[:500]}") from error


def write_json_atomic(filename: str, payload: dict[str, Any]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    target = DATA_DIR / filename
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=DATA_DIR, delete=False) as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
        f.write("\n")
        temporary = Path(f.name)
    temporary.replace(target)
    print(f"UPDATED: {target.relative_to(ROOT)}")
