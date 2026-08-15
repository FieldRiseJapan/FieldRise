#!/usr/bin/env python3
"""桃花の正式報告を判定し、LINE通知用の冪等なreceiptを生成する。"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import time
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Callable
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

FINAL_STATUSES = {"completed", "blocked", "failed"}
LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push"
MAX_RETRY_WINDOW = timedelta(hours=24)


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def normalise_status(value: str) -> str:
    return value.strip().strip("`").lower()


def table_value(markdown: str, label: str) -> str:
    pattern = rf"^\|\s*{re.escape(label)}\s*\|\s*(.*?)\s*\|\s*$"
    match = re.search(pattern, markdown, flags=re.MULTILINE)
    return match.group(1).strip() if match else ""


def first_heading(markdown: str) -> str:
    match = re.search(r"^#\s+(.+?)\s*$", markdown, flags=re.MULTILINE)
    return match.group(1).strip() if match else "桃花｜#未指定｜FieldRise｜正式タスク"


def clean_markdown(value: str) -> str:
    value = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", value)
    value = value.replace("`", "").replace("**", "").strip()
    return re.sub(r"\s+", " ", value)


def report_metadata(markdown: str) -> dict[str, str]:
    receipt_key = clean_markdown(table_value(markdown, "Receipt key"))
    status = normalise_status(table_value(markdown, "状態"))
    issue = clean_markdown(table_value(markdown, "関連Issue")) or "未指定"
    next_action = clean_markdown(table_value(markdown, "次のアクション"))
    blocker = clean_markdown(table_value(markdown, "ブロッカー"))
    heading = clean_markdown(first_heading(markdown))

    if not receipt_key:
        raise ValueError("正式報告書から Receipt key を取得できません。")
    if not status:
        raise ValueError("正式報告書から 状態 を取得できません。")

    issue_number = "未指定"
    issue_match = re.search(r"#(\d+)", heading)
    if issue_match:
        issue_number = issue_match.group(1)
    elif re.fullmatch(r"\d+", issue):
        issue_number = issue

    if heading.startswith("桃花｜"):
        execution_name = heading
    else:
        execution_name = f"桃花｜#{issue_number}｜FieldRise｜{heading}"

    return {
        "receipt_key": receipt_key,
        "status": status,
        "issue": issue,
        "issue_number": issue_number,
        "execution_name": execution_name,
        "next_action": next_action or "正式報告書の詳細を確認してください。",
        "blocker": blocker or "正式報告書の状態を確認してください。",
    }


def task_id_for(receipt_key: str) -> str:
    digest = hashlib.sha256(receipt_key.encode("utf-8")).hexdigest()[:24]
    return f"momoka-{digest}"


def receipt_path_for(receipts_dir: Path, receipt_key: str) -> Path:
    digest = hashlib.sha256(receipt_key.encode("utf-8")).hexdigest()[:32]
    return receipts_dir / f"{digest}.json"


def read_json(path: Path) -> dict[str, Any] | None:
    if not path.exists():
        return None
    with path.open("r", encoding="utf-8") as stream:
        return json.load(stream)


def parse_iso8601(value: str) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def compose_message(metadata: dict[str, str], occurred_at: str, report_url: str) -> str:
    status = metadata["status"]
    title = "タスク完了通知" if status == "completed" else "問題発生通知"
    lines = [
        f"{title}",
        f"実行名: {metadata['execution_name']}",
        f"Issue: #{metadata['issue_number']}",
        f"状態: {status}",
        f"完了日時: {occurred_at}",
        "GitHub正式報告: 記録済み",
    ]
    if status == "completed":
        lines.append("概要: 正式報告書が completed と判定されました。")
    else:
        lines.extend(
            [
                f"理由: {metadata['blocker']}",
                f"社長に必要な対応: {metadata['next_action']}",
            ]
        )
    lines.append(f"詳細: {report_url}")
    return "\n".join(lines)[:5000]


def http_header(headers: Any, name: str) -> str | None:
    if headers is None:
        return None
    getter = getattr(headers, "get", None)
    return getter(name) if getter else None


def send_line_message(
    token: str,
    target_id: str,
    message: str,
    retry_key: str,
    opener: Callable[..., Any] = urlopen,
    retry_delay_seconds: float = 1.0,
) -> dict[str, Any]:
    """LINE Push APIを最大1回再試行する。返却値に秘密情報は含めない。"""
    payload = json.dumps(
        {"to": target_id, "messages": [{"type": "text", "text": message}]},
        ensure_ascii=False,
    ).encode("utf-8")
    attempts = 0
    last_status: int | None = None
    last_request_id: str | None = None
    accepted_request_id: str | None = None
    last_error = ""

    for attempt in range(2):
        attempts += 1
        request = Request(
            LINE_PUSH_URL,
            data=payload,
            method="POST",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}",
                "X-Line-Retry-Key": retry_key,
            },
        )
        try:
            response = opener(request, timeout=20)
            status_code = int(response.getcode())
            headers = getattr(response, "headers", None)
            body = response.read().decode("utf-8", errors="replace") if hasattr(response, "read") else ""
        except HTTPError as error:
            status_code = int(error.code)
            headers = error.headers
            body = error.read().decode("utf-8", errors="replace")
        except (URLError, TimeoutError, OSError) as error:
            status_code = 0
            headers = None
            body = ""
            last_error = f"通信エラー: {type(error).__name__}"

        last_status = status_code
        last_request_id = http_header(headers, "X-Line-Request-Id") or last_request_id
        accepted_request_id = http_header(headers, "X-Line-Accepted-Request-Id") or accepted_request_id

        if 200 <= status_code < 300:
            return {
                "sent": True,
                "notification_id": last_request_id,
                "http_status": status_code,
                "attempts": attempts,
                "detail": "LINE Messaging APIがPush Messageを受理しました。",
            }
        if status_code == 409 and accepted_request_id:
            return {
                "sent": True,
                "notification_id": accepted_request_id,
                "http_status": status_code,
                "attempts": attempts,
                "detail": "同一Retry Keyの先行送信がLINEに受理済みであることを確認しました。",
            }
        if status_code != 500 or attempt == 1:
            break
        if retry_delay_seconds:
            time.sleep(retry_delay_seconds)

    if not last_error:
        last_error = f"LINE Messaging APIがHTTP {last_status} を返しました。"
    # API本文はアクセストークンや個人情報を含む可能性があるため保存・出力しない。
    return {
        "sent": False,
        "notification_id": last_request_id,
        "http_status": last_status,
        "attempts": attempts,
        "detail": last_error,
    }


def process_notification(
    report_path: Path,
    receipts_dir: Path,
    report_commit: str,
    report_url: str,
    occurred_at: str,
    mode: str,
    line_token: str,
    line_target_id: str,
    opener: Callable[..., Any] = urlopen,
    retry_delay_seconds: float = 1.0,
) -> dict[str, Any]:
    markdown = report_path.read_text(encoding="utf-8")
    metadata = report_metadata(markdown)
    task_id = task_id_for(metadata["receipt_key"])
    receipt_path = receipt_path_for(receipts_dir, metadata["receipt_key"])
    existing = read_json(receipt_path)

    result: dict[str, Any] = {
        "schema_version": 1,
        "task_id": task_id,
        "issue_number": metadata["issue_number"],
        "execution_name": metadata["execution_name"],
        "receipt_key": metadata["receipt_key"],
        "report_path": str(report_path),
        "report_commit": report_commit,
        "report_url": report_url,
        "status": metadata["status"],
        "notification_type": ("task_completed" if metadata["status"] == "completed" else "task_problem" if metadata["status"] in {"blocked", "failed"} else "none"),
        "generated_at": utc_now(),
        "receipt_path": str(receipt_path),
    }

    if metadata["status"] not in FINAL_STATUSES:
        result.update(
            {
                "action": "no_notification_required",
                "notification_status": "not_requested",
                "detail": f"状態 {metadata['status']} は自動通知対象外です。",
                "write_receipt": False,
            }
        )
        return result

    if existing and existing.get("notification_status") == "sent":
        result.update(
            {
                "action": "duplicate_skipped",
                "notification_status": "sent",
                "notification_id": existing.get("notification_id"),
                "sent_at": existing.get("sent_at"),
                "detail": "同一Receipt keyの通知はすでに送信済みのため、再送しません。",
                "write_receipt": False,
            }
        )
        return result

    retry_key = str(uuid.uuid5(uuid.NAMESPACE_URL, f"{task_id}:{metadata['status']}"))
    if existing and existing.get("notification_status") == "failed":
        previous_attempt = parse_iso8601(str(existing.get("attempted_at", "")))
        if previous_attempt and datetime.now(timezone.utc) - previous_attempt > MAX_RETRY_WINDOW:
            result.update(
                {
                    "action": "retry_window_expired",
                    "notification_status": "failed",
                    "retry_key": retry_key,
                    "detail": "前回送信試行から24時間を超えたため、重複防止を優先して自動再送を停止しました。",
                    "write_receipt": False,
                }
            )
            return result

    message = compose_message(metadata, occurred_at, report_url)
    result["message_preview"] = message
    result["retry_key"] = retry_key

    if mode == "dry_run":
        result.update(
            {
                "action": "dry_run_receipt_written",
                "notification_status": "dry_run",
                "attempted_at": utc_now(),
                "detail": "安全テストとして通知内容・状態判定・receiptのみを検証し、LINE APIは呼び出していません。",
                "write_receipt": True,
            }
        )
        return result

    if not line_token or not line_target_id:
        result.update(
            {
                "action": "send_failed",
                "notification_status": "failed",
                "attempted_at": utc_now(),
                "detail": "必要なGitHub Actions Secret（LINE_CHANNEL_ACCESS_TOKENまたはLINE_TARGET_ID）が未設定です。",
                "write_receipt": True,
            }
        )
        return result

    send_result = send_line_message(
        line_token,
        line_target_id,
        message,
        retry_key,
        opener=opener,
        retry_delay_seconds=retry_delay_seconds,
    )
    result.update(
        {
            "action": "sent" if send_result["sent"] else "send_failed",
            "notification_status": "sent" if send_result["sent"] else "failed",
            "attempted_at": utc_now(),
            "notification_id": send_result.get("notification_id"),
            "http_status": send_result.get("http_status"),
            "attempts": send_result.get("attempts"),
            "detail": send_result["detail"],
            "write_receipt": True,
        }
    )
    if send_result["sent"]:
        result["sent_at"] = utc_now()
    return result


def write_receipt(result: dict[str, Any]) -> None:
    path = Path(result["receipt_path"])
    path.parent.mkdir(parents=True, exist_ok=True)
    # 通知本文は監査に必要な範囲に限定し、トークン・宛先IDは保存しない。
    receipt = {key: value for key, value in result.items() if key not in {"receipt_path", "write_receipt"}}
    path.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--report-path", required=True)
    parser.add_argument("--receipts-dir", required=True)
    parser.add_argument("--report-commit", required=True)
    parser.add_argument("--report-url", required=True)
    parser.add_argument("--occurred-at", required=True)
    parser.add_argument("--mode", choices=("send", "dry_run"), required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--retry-delay-seconds", type=float, default=1.0)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        result = process_notification(
            report_path=Path(args.report_path),
            receipts_dir=Path(args.receipts_dir),
            report_commit=args.report_commit,
            report_url=args.report_url,
            occurred_at=args.occurred_at,
            mode=args.mode,
            line_token=os.environ.get("LINE_CHANNEL_ACCESS_TOKEN", ""),
            line_target_id=os.environ.get("LINE_TARGET_ID", ""),
            retry_delay_seconds=args.retry_delay_seconds,
        )
        if result["write_receipt"]:
            write_receipt(result)
        Path(args.output).write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        return 0
    except (OSError, ValueError, json.JSONDecodeError) as error:
        safe = {"action": "processing_failed", "detail": f"通知処理を完了できませんでした: {type(error).__name__}"}
        Path(args.output).write_text(json.dumps(safe, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(safe["detail"], file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
