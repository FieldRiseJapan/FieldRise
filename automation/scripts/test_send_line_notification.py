import importlib.util
import unittest
from pathlib import Path


SCRIPT_PATH = Path(__file__).with_name("send_line_notification.py")
SPEC = importlib.util.spec_from_file_location("send_line_notification", SCRIPT_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


class SendLineNotificationTest(unittest.TestCase):
    def test_summary_includes_required_fieldrise_urls(self):
        text = MODULE.extract_summary("## AIニュース\n- テスト項目\n")

        self.assertIn("📊 FieldRise AI Control Dashboard", text)
        self.assertIn("https://fieldrisejapan.github.io/FieldRise/ai-control-dashboard/", text)
        self.assertIn("🎵 Runa-Girl8215｜Café Series", text)
        self.assertIn("https://fieldrisejapan.github.io/FieldRise.RunaGirl8215/", text)
        self.assertIn("詳細はこちら:", text)


if __name__ == "__main__":
    unittest.main()
