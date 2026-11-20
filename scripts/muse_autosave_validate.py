#!/usr/bin/env python3
"""Validate a Muse MARKET report before any GitHub write. No network or writes."""
import hashlib
import json
import re
import sys
from pathlib import Path

ID = re.compile(r"[A-Za-z0-9_-]{3,100}\Z")
DATE = re.compile(r"20\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\Z")
MONTH = re.compile(r"20\d{2}-(0[1-9]|1[0-2])\Z")
SHA = re.compile(r"[a-f0-9]{64}\Z")

def validate(metadata, content):
    if set(metadata) != {"report_id", "stream", "cadence", "period", "content_sha256", "source"}:
        raise ValueError("unexpected or missing metadata fields")
    if not isinstance(metadata["report_id"], str) or not ID.fullmatch(metadata["report_id"]):
        raise ValueError("invalid report_id")
    if metadata["stream"] != "MARKET" or metadata["source"] != "muse":
        raise ValueError("invalid stream/source")
    cadence, period = metadata["cadence"], metadata["period"]
    if cadence not in ("weekly", "monthly") or not isinstance(period, str):
        raise ValueError("invalid cadence/period")
    if not (DATE.fullmatch(period) if cadence == "weekly" else MONTH.fullmatch(period)):
        raise ValueError("invalid period")
    sha = metadata["content_sha256"]
    if not isinstance(sha, str) or not SHA.fullmatch(sha):
        raise ValueError("invalid hash")
    if hashlib.sha256(content).hexdigest() != sha:
        raise ValueError("hash mismatch")
    text = content.decode("utf-8")
    if not text.strip() or len(content) > 512_000:
        raise ValueError("empty or oversized report")
    if f"REPORT_ID: {metadata['report_id']}" not in text or f"PERIOD: {period}" not in text:
        raise ValueError("missing matching report markers")
    filename = f"{period}_tiktok_jazz_{cadence}.md"
    return f"docs/muse/research/{cadence}/{filename}"

def main():
    if len(sys.argv) != 3:
        raise SystemExit("usage: muse_autosave_validate.py metadata.json report.md")
    metadata = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    content = Path(sys.argv[2]).read_bytes()
    print(validate(metadata, content))

if __name__ == "__main__":
    main()
