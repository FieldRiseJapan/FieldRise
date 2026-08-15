"""桃花の正式指示から、実行開始前に唯一のexecution_nameを生成・検証する。"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

FORBIDDEN_VALUES = {"", "未指定", "task", "untitled", "unknown", "桃花受領：未指定"}
FORMAL_NAME_PATTERN = re.compile(r"桃花｜(?:#\d+｜)?[^｜\n`]+｜[^\n`]+")


def clean(value: str) -> str:
    """Markdown装飾を取り除き、表示用の単一行文字列へ正規化する。"""
    value = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", value)
    value = value.replace("`", "").replace("**", "").strip()
    return re.sub(r"\s+", " ", value)


def is_forbidden(value: str) -> bool:
    return clean(value).casefold() in FORBIDDEN_VALUES


def first_heading(markdown: str) -> str:
    match = re.search(r"^#\s+(.+?)\s*$", markdown, flags=re.MULTILINE)
    return clean(match.group(1)) if match else ""


def labeled_value(markdown: str, labels: tuple[str, ...]) -> str:
    joined = "|".join(re.escape(label) for label in labels)
    match = re.search(
        rf"^\s*(?:\*\*)?(?:{joined})(?:\*\*)?\s*[:：]\s*(.+?)\s*$",
        markdown,
        flags=re.IGNORECASE | re.MULTILINE,
    )
    return clean(match.group(1)) if match else ""


def formal_name(markdown: str) -> str:
    """指示書が明示した、具体値を持つ正式名を最優先で返す。"""
    for match in FORMAL_NAME_PATTERN.finditer(markdown):
        candidate = clean(match.group(0).rstrip("。."))
        try:
            _, project_name, task_name = parse_formal_name(candidate)
        except ValueError:
            continue
        if project_name != "プロジェクト名" and task_name != "作業内容" and not any(
            is_forbidden(value) for value in (project_name, task_name)
        ):
            return candidate
    return ""


def issue_number_from(markdown: str, name: str = "") -> str:
    """明示済み正式名、次にIssue表記の順で番号を抽出する。"""
    match = re.search(r"桃花｜#(\d+)｜", name or markdown)
    if match:
        return match.group(1)
    match = re.search(r"(?:GitHub\s*)?[Ii]ssue\s*#(\d+)", markdown)
    if match:
        return match.group(1)
    match = re.search(r"関連[Ii]ssue\s*\|\s*[^\n|]*#?(\d+)", markdown)
    return match.group(1) if match else ""


def project_from(markdown: str) -> str:
    explicit = labeled_value(markdown, ("プロジェクト名", "Project", "Project Name"))
    if explicit:
        return "" if is_forbidden(explicit) else explicit
    if re.search(r"\bAI\s+Control\s+Dashboard\b", markdown, flags=re.IGNORECASE):
        return "AI Control Dashboard"
    return ""


def task_from(markdown: str, issue_title: str) -> str:
    explicit = labeled_value(markdown, ("作業内容", "タスク名", "Task", "Task Name", "Work"))
    if explicit:
        return "" if is_forbidden(explicit) else explicit
    title = clean(issue_title)
    if title and not is_forbidden(title):
        title = re.sub(r"^[【\[].*?[】\]]\s*", "", title)
        title = re.sub(r"^#\d+\s*", "", title).strip(" ：:")
        if title and not is_forbidden(title):
            return title
    heading = first_heading(markdown)
    if heading and not is_forbidden(heading):
        heading = re.sub(r"^(?:桃花への)?(?:正式)?(?:修正)?指示書[｜:：\-–—]*", "", heading).strip()
        if heading and not is_forbidden(heading):
            return heading
    return ""


def parse_formal_name(name: str) -> tuple[str, str, str]:
    parts = [part.strip() for part in name.split("｜")]
    if len(parts) < 3 or parts[0] != "桃花":
        raise ValueError("正式execution_nameの形式が不正です。")
    if parts[1].startswith("#"):
        if len(parts) != 4 or not parts[1][1:].isdigit():
            raise ValueError("正式execution_nameのIssue番号または区切りが不正です。")
        return parts[1][1:], parts[2], parts[3]
    if len(parts) != 3:
        raise ValueError("Issue番号なしのexecution_nameの形式が不正です。")
    return "", parts[1], parts[2]


def generate_execution_metadata(markdown: str, issue_title: str = "") -> dict[str, str]:
    """禁止名を使わず、指示書由来の正式な実行メタデータを返す。"""
    declared_name = formal_name(markdown)
    if declared_name:
        issue_number, project_name, task_name = parse_formal_name(declared_name)
        if any(is_forbidden(value) for value in (project_name, task_name)):
            raise ValueError("正式execution_nameに禁止された値が含まれています。")
        return {
            "execution_name": declared_name,
            "issue_number": issue_number,
            "project_name": project_name,
            "task_name": task_name,
            "source": "instruction_declared_name",
        }

    issue_number = issue_number_from(markdown)
    project_name = project_from(markdown)
    task_name = task_from(markdown, issue_title)
    if not project_name:
        raise ValueError("プロジェクト名を取得できないため、実行名を生成せず開始を停止します。")
    if not task_name:
        raise ValueError("作業内容を取得できないため、実行名を生成せず開始を停止します。")
    if any(is_forbidden(value) for value in (project_name, task_name)):
        raise ValueError("禁止された既定値をexecution_nameに使用できません。")

    execution_name = "｜".join(
        ["桃花", *( [f"#{issue_number}"] if issue_number else [] ), project_name, task_name]
    )
    return {
        "execution_name": execution_name,
        "issue_number": issue_number,
        "project_name": project_name,
        "task_name": task_name,
        "source": "instruction_and_issue_metadata",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="桃花のexecution_nameを生成する")
    parser.add_argument("instruction_path", type=Path)
    parser.add_argument("--issue-title", default="")
    parser.add_argument("--issue-number-only", action="store_true")
    args = parser.parse_args()

    markdown = args.instruction_path.read_text(encoding="utf-8")
    declared_name = formal_name(markdown)
    if args.issue_number_only:
        print(issue_number_from(markdown, declared_name))
        return 0

    try:
        metadata = generate_execution_metadata(markdown, args.issue_title)
    except ValueError as exc:
        print(f"実行名生成失敗: {exc}", file=sys.stderr)
        return 2
    print(json.dumps(metadata, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
