#!/usr/bin/env python3
"""定時報告とLINE通知にSonata Desk URLが含まれることを検証する。"""

import importlib.util
import tempfile
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
GENERATOR_PATH = REPO_ROOT / "automation" / "scripts" / "generate_briefing.py"
NOTIFIER_PATH = REPO_ROOT / "automation" / "scripts" / "send_line_notification.py"
SONATA_DESK_URL = "https://fieldrisejapan.github.io/FieldRise/sonata-desk/"


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"module load failed: {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main() -> None:
    generator = load_module("generate_briefing", GENERATOR_PATH)
    notifier = load_module("send_line_notification", NOTIFIER_PATH)

    with tempfile.TemporaryDirectory() as temp_dir:
        generator.BASE = Path(temp_dir)
        generator.main()
        briefing = (Path(temp_dir) / "briefings" / "latest.md").read_text(encoding="utf-8")

    line_text = notifier.extract_summary(briefing)
    assert SONATA_DESK_URL in briefing, "briefing must include Sonata Desk URL"
    assert SONATA_DESK_URL in line_text, "LINE text must include Sonata Desk URL"
    assert line_text.index(SONATA_DESK_URL) < line_text.index("詳細はこちら:"), (
        "dashboard URL must be included before the briefing detail URL"
    )
    print("PASS: Sonata Desk URL is included in briefing and LINE notification")


if __name__ == "__main__":
    main()
