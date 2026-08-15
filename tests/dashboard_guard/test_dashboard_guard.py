#!/usr/bin/env python3
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
MODULE_PATH = REPO_ROOT / "automation" / "dashboard_guard" / "dashboard_guard.py"
spec = importlib.util.spec_from_file_location("dashboard_guard", MODULE_PATH)
assert spec and spec.loader
GUARD = importlib.util.module_from_spec(spec)
spec.loader.exec_module(GUARD)


class DashboardGuardTests(unittest.TestCase):
    def test_config_declares_no_automatic_dashboard_changes(self):
        config = json.loads((REPO_ROOT / "automation/dashboard_guard/config.json").read_text(encoding="utf-8"))
        boundary = config["approval_boundary"]
        self.assertIn("dashboard source code", boundary["must_not_modify"])
        self.assertIn("main branch", boundary["must_not_modify"])
        self.assertTrue(boundary["manual_approval_required_for"])

    def test_public_url_failure_proposes_but_never_applies_repair(self):
        advice = GUARD.repair_advice(
            {"kind": "public_url", "name": "test", "status": "fail", "http_status": 404}
        )
        self.assertIsNotNone(advice)
        self.assertTrue(advice["approval_required"])
        self.assertIn("禁止", advice["automatic_change"])

    def test_invalid_json_is_detected_without_modifying_source(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            relative = "broken.json"
            target = root / relative
            target.write_text("{invalid", encoding="utf-8")
            before = target.read_text(encoding="utf-8")
            result = GUARD.check_json_source(root, relative)
            self.assertEqual(result["status"], "fail")
            self.assertEqual(before, target.read_text(encoding="utf-8"))

    def test_markdown_report_states_no_unapproved_changes(self):
        report = {
            "generated_at": "2026-08-15T00:00:00Z",
            "status": "attention_required",
            "checks": [{"kind": "build", "name": "test", "status": "fail", "error": "failed"}],
            "repair_advice": [GUARD.repair_advice({"kind": "build", "name": "test", "status": "fail"})],
        }
        markdown = GUARD.markdown_report(report)
        self.assertIn("承認なしの変更: **実施していません**", markdown)
        self.assertIn("自動変更: 禁止", markdown)


if __name__ == "__main__":
    unittest.main()
