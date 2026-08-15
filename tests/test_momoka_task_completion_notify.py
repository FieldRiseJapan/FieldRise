from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
import momoka_task_completion_notify as notify  # noqa: E402


REPORT_TEMPLATE = """# 桃花｜#42｜FieldRise｜通知試験

| 項目 | 内容 |
|---|---|
| Receipt key | `receipt-test-42` |
| 関連Issue | 42 |
| 状態 | `{status}` |
| 次のアクション | {next_action} |
| ブロッカー | {blocker} |
"""


class FakeResponse:
    def __init__(self, status: int, request_id: str | None = None, accepted_id: str | None = None):
        self.status = status
        self.headers = {}
        if request_id:
            self.headers["X-Line-Request-Id"] = request_id
        if accepted_id:
            self.headers["X-Line-Accepted-Request-Id"] = accepted_id

    def getcode(self) -> int:
        return self.status

    def read(self) -> bytes:
        return b"{}"


class MomokaTaskCompletionNotifyTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.report = self.root / "latest_report.md"
        self.receipts = self.root / "receipts"

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def write_report(self, status: str) -> None:
        self.report.write_text(
            REPORT_TEMPLATE.format(
                status=status,
                next_action="確認してください。",
                blocker="API設定が必要です。",
            ),
            encoding="utf-8",
        )

    def process(self, status: str, mode: str = "dry_run", token: str = "", target: str = "") -> dict:
        self.write_report(status)
        return notify.process_notification(
            report_path=self.report,
            receipts_dir=self.receipts,
            report_commit="a" * 40,
            report_url="https://example.test/report",
            occurred_at="2026-08-15T01:00:00Z",
            mode=mode,
            line_token=token,
            line_target_id=target,
            retry_delay_seconds=0,
        )

    def test_in_progress_does_not_create_or_send_notification(self) -> None:
        result = self.process("in_progress")
        self.assertEqual(result["action"], "no_notification_required")
        self.assertEqual(result["notification_status"], "not_requested")
        self.assertFalse(result["write_receipt"])

    def test_delivery_test_is_explicit_in_message_and_receipt(self) -> None:
        report = REPORT_TEMPLATE.format(
            status="completed",
            next_action="到達を確認してください。",
            blocker="なし。",
        ) + "| Delivery test | true |\n"
        metadata = notify.report_metadata(report)
        message = notify.compose_message(metadata, "2026-08-15T01:00:00Z", "https://example.test/report")
        self.assertEqual(metadata["delivery_test"], "true")
        self.assertIn("LINE本番テスト通知", message)
        self.assertIn("本番到達確認用テスト通知", message)

    def test_completed_dry_run_creates_safe_receipt(self) -> None:
        result = self.process("completed")
        self.assertEqual(result["action"], "dry_run_receipt_written")
        self.assertEqual(result["notification_status"], "dry_run")
        self.assertTrue(result["write_receipt"])
        self.assertIn("タスク完了通知", result["message_preview"])
        notify.write_receipt(result)
        stored = json.loads(Path(result["receipt_path"]).read_text(encoding="utf-8"))
        self.assertEqual(stored["task_id"], result["task_id"])
        self.assertNotIn("LINE_CHANNEL_ACCESS_TOKEN", stored)
        self.assertNotIn("LINE_TARGET_ID", stored)

    def test_blocked_and_failed_create_problem_message(self) -> None:
        for status in ("blocked", "failed"):
            result = self.process(status)
            self.assertEqual(result["notification_type"], "task_problem")
            self.assertIn("問題発生通知", result["message_preview"])
            self.assertIn("社長に必要な対応", result["message_preview"])

    def test_same_sent_receipt_is_not_sent_again(self) -> None:
        first = self.process("completed")
        notify.write_receipt(first)
        receipt_path = Path(first["receipt_path"])
        stored = json.loads(receipt_path.read_text(encoding="utf-8"))
        stored.update({"notification_status": "sent", "notification_id": "line-123", "sent_at": "2026-08-15T01:02:00Z"})
        receipt_path.write_text(json.dumps(stored), encoding="utf-8")
        second = self.process("completed")
        self.assertEqual(second["action"], "duplicate_skipped")
        self.assertEqual(second["notification_status"], "sent")
        self.assertFalse(second["write_receipt"])

    def test_blocked_then_completed_is_a_new_notification_event(self) -> None:
        blocked = self.process("blocked")
        notify.write_receipt(blocked)
        blocked_stored = json.loads(Path(blocked["receipt_path"]).read_text(encoding="utf-8"))
        blocked_stored.update({"notification_status": "sent", "sent_at": "2026-08-15T01:02:00Z"})
        Path(blocked["receipt_path"]).write_text(json.dumps(blocked_stored), encoding="utf-8")
        completed = self.process("completed")
        self.assertEqual(completed["action"], "dry_run_receipt_written")
        self.assertNotEqual(completed["receipt_path"], blocked["receipt_path"])

    def test_missing_secret_is_recorded_as_failed_not_sent(self) -> None:
        result = self.process("completed", mode="send")
        self.assertEqual(result["action"], "send_failed")
        self.assertEqual(result["notification_status"], "failed")
        self.assertIn("GitHub Actions Secret", result["detail"])

    def test_line_retry_uses_the_same_key_and_records_accepted_id(self) -> None:
        requests = []
        responses = iter(
            [
                FakeResponse(500, request_id="attempt-1"),
                FakeResponse(409, request_id="attempt-2", accepted_id="accepted-1"),
            ]
        )

        def opener(request, timeout):
            requests.append(request)
            return next(responses)

        result = notify.send_line_message(
            "token-value",
            "Utarget",
            "test message",
            "123e4567-e89b-12d3-a456-426614174000",
            opener=opener,
            retry_delay_seconds=0,
        )
        self.assertTrue(result["sent"])
        self.assertEqual(result["notification_id"], "accepted-1")
        self.assertEqual(result["attempts"], 2)
        self.assertEqual(len(requests), 2)
        self.assertEqual(
            requests[0].get_header("X-line-retry-key"),
            requests[1].get_header("X-line-retry-key"),
        )


if __name__ == "__main__":
    unittest.main()
