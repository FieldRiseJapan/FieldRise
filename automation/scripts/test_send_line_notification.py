import importlib.util
import os
import unittest
from pathlib import Path


SCRIPT_PATH = Path(__file__).with_name("send_line_notification.py")
os.environ["SOCIAL_DASHBOARD_URL"] = "https://socialdash-f6zzqx89.manus.space"
SPEC = importlib.util.spec_from_file_location("send_line_notification", SCRIPT_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


class SendLineNotificationTest(unittest.TestCase):
    def test_summary_includes_dashboard_url(self):
        text = MODULE.extract_summary("## AIニュース\n- テスト項目\n")

        self.assertIn("SNS分析ダッシュボード:", text)
        self.assertIn("https://socialdash-f6zzqx89.manus.space", text)
        self.assertIn("詳細はこちら:", text)


if __name__ == "__main__":
    unittest.main()
