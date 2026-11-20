#!/usr/bin/env python3
"""Validate a repository_dispatch Muse MARKET payload without printing report content."""
import base64
import binascii
import json
import sys
from pathlib import Path
from muse_autosave_validate import validate

def main():
    if len(sys.argv) != 2:
        raise SystemExit("usage: receive_muse_dispatch.py event.json")
    event = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    payload = event.get("client_payload")
    if not isinstance(payload, dict) or set(payload) != {"metadata", "content_b64"}:
        raise ValueError("invalid dispatch payload")
    metadata = payload["metadata"]
    encoded = payload["content_b64"]
    if not isinstance(metadata, dict) or not isinstance(encoded, str) or len(encoded) > 690000:
        raise ValueError("invalid or oversized content")
    try:
        content = base64.b64decode(encoded, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise ValueError("invalid base64 content") from exc
    target = Path(validate(metadata, content))
    if target.exists():
        raise ValueError("report already exists; refusing overwrite")
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(content)
    if target.read_bytes() != content:
        raise ValueError("read-back mismatch")
    print("Validated Muse MARKET report saved at:", target)

if __name__ == "__main__":
    try:
        main()
    except (ValueError, KeyError, json.JSONDecodeError) as exc:
        print("Muse dispatch rejected:", str(exc), file=sys.stderr)
        raise SystemExit(1)
