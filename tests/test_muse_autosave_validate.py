import hashlib
import unittest
from scripts.muse_autosave_validate import validate

class ValidateTests(unittest.TestCase):
    def setUp(self):
        self.content = b"REPORT_ID: FR-MUSE-TEST-001\nPERIOD: 2026-11-16\nMarket findings\n"
        self.meta = {
            "report_id": "FR-MUSE-TEST-001",
            "stream": "MARKET",
            "cadence": "weekly",
            "period": "2026-11-16",
            "content_sha256": hashlib.sha256(self.content).hexdigest(),
            "source": "muse",
        }
    def test_valid(self):
        self.assertEqual(validate(self.meta, self.content),
                         "docs/muse/research/weekly/2026-11-16_tiktok_jazz_weekly.md")
    def test_wrong_hash(self):
        self.meta["content_sha256"] = "0" * 64
        with self.assertRaises(ValueError): validate(self.meta, self.content)
    def test_wrong_stream(self):
        self.meta["stream"] = "FIELD TEST"
        with self.assertRaises(ValueError): validate(self.meta, self.content)
    def test_wrong_period(self):
        self.meta["period"] = "../other"
        with self.assertRaises(ValueError): validate(self.meta, self.content)

if __name__ == "__main__":
    unittest.main()
