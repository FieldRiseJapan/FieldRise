import importlib.util
import tempfile
import unittest
from datetime import datetime, timezone, timedelta
from pathlib import Path


SCRIPT_PATH = Path(__file__).parents[2] / "automation" / "scripts" / "monitor_line_briefing.py"
SPEC = importlib.util.spec_from_file_location("monitor_line_briefing", SCRIPT_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


JST = timezone(timedelta(hours=9))


class LineBriefingMonitorTest(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self.temp_dir.name)
        self.marker = self.root / "last_line_briefing_sent_jst.txt"
        self.briefings = self.root / "briefings"
        self.briefings.mkdir()
        self.now = datetime(2026, 9, 8, 7, 5, tzinfo=JST)

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_passes_when_today_was_sent_and_briefing_exists(self):
        self.marker.write_text("2026-09-08\n", encoding="utf-8")
        briefing = self.briefings / "2026-09-08.md"
        briefing.write_text("# 定時報告\n", encoding="utf-8")

        result = MODULE.check_delivery(self.marker, briefing, self.now)

        self.assertEqual(result["status"], "pass")
        self.assertEqual(result["sent_date"], "2026-09-08")
        self.assertTrue(result["briefing_exists"])

    def test_detects_missing_today_marker(self):
        briefing = self.briefings / "2026-09-08.md"
        briefing.write_text("# 定時報告\n", encoding="utf-8")

        result = MODULE.check_delivery(self.marker, briefing, self.now)

        self.assertEqual(result["status"], "attention_required")
        self.assertEqual(result["reason"], "line_not_marked_sent_today")

    def test_detects_stale_marker(self):
        self.marker.write_text("2026-09-07\n", encoding="utf-8")
        briefing = self.briefings / "2026-09-08.md"
        briefing.write_text("# 定時報告\n", encoding="utf-8")

        result = MODULE.check_delivery(self.marker, briefing, self.now)

        self.assertEqual(result["status"], "attention_required")
        self.assertEqual(result["reason"], "line_not_marked_sent_today")

    def test_detects_missing_briefing_even_when_marker_is_present(self):
        self.marker.write_text("2026-09-08\n", encoding="utf-8")
        briefing = self.briefings / "2026-09-08.md"

        result = MODULE.check_delivery(self.marker, briefing, self.now)

        self.assertEqual(result["status"], "attention_required")
        self.assertEqual(result["reason"], "briefing_missing")


if __name__ == "__main__":
    unittest.main()
