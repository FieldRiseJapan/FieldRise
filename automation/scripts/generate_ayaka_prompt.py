#!/usr/bin/env python3
"""Generate the next Ayaka/CTO SUNO verification prompt from Momoka's GitHub report.

This script intentionally performs no audio analysis. It consumes GitHub text artifacts
and delegates only the reasoning/prompt-design step to the OpenAI Responses API.
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(os.environ.get("GITHUB_WORKSPACE", "."))
REPORT = ROOT / "docs/momoka/reports/latest_report.md"
INSTRUCTION = ROOT / "docs/momoka/instructions/latest_verification_prompt.md"
HANDOVER = ROOT / "docs/ayaka/handover/2026-08-28_cafe_001_002_reproduction_handover.md"
OUTPUT = ROOT / "docs/ayaka/outbox/next_suno_verification_prompt.md"

MODEL = os.environ.get("OPENAI_MODEL", "gpt-5.6-luna")


def read(path: Path) -> str:
    if not path.exists():
        raise FileNotFoundError(path)
    return path.read_text(encoding="utf-8")


def call_openai(report: str, instruction: str, handover: str) -> str:
    key = os.environ.get("OPENAI_API_KEY", "")
    if not key:
        raise RuntimeError("OPENAI_API_KEY is not available")

    system = """You are Ayaka, CTO of FieldRise Music AI.
Design the NEXT single-variable SUNO verification experiment from the latest Momoka COO analysis.
Never invent measurements. Separate Fact, Hypothesis, Evidence, and Result.
Preserve the project's 001/002 reproduction protocol and change exactly one variable at a time.
The answer must contain exactly these sections:
1. Verification ID / experiment ID
2. Purpose
3. Generation Prompt (Style of Music)
4. SUNO AI settings
5. Negative / Exclude
6. Changed variable
7. Fixed conditions
8. Evidence basis
9. Expected pass/fail criteria
10. Instruction to Momoka
Use BPM 80–86 in Style of Music for this Cafe project unless the latest evidence explicitly requires another value.
Do not use Essentia or Librosa in the automation design.
"""
    user = f"""LATEST MOMOKA REPORT:\n---\n{report}\n---\n\nCURRENT MOMOKA INSTRUCTION / SOURCE OF TRUTH:\n---\n{instruction}\n---\n\nAYAKA HANDOVER:\n---\n{handover}\n---\n\nCreate the next verification prompt now. Base every decision on the supplied GitHub evidence."""

    payload = json.dumps({"model": MODEL, "input": [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]}).encode("utf-8")
    req = Request(
        "https://api.openai.com/v1/responses",
        data=payload,
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urlopen(req, timeout=120) as response:
        data = json.loads(response.read().decode("utf-8"))

    text = data.get("output_text", "")
    if not text:
        for item in data.get("output", []):
            for content in item.get("content", []):
                if content.get("type") == "output_text":
                    text += content.get("text", "")
    if not text.strip():
        raise RuntimeError("OpenAI returned no output text")
    return text.strip()


def main() -> int:
    report = read(REPORT)
    instruction = read(INSTRUCTION)
    handover = read(HANDOVER)
    result = call_openai(report, instruction, handover)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        "# FieldRise Music AI｜彩花CTO 次回SUNO検証Prompt\n\n"
        f"生成モデル: `{MODEL}`\n\n{result}\n",
        encoding="utf-8",
    )
    print(f"Generated: {OUTPUT}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise
