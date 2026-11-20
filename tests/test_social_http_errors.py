import io
import sys
import traceback
import unittest
from pathlib import Path
from unittest.mock import patch
from urllib.error import HTTPError, URLError

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "automation/social_analytics/scripts"))
import common


class CollectorErrors(unittest.TestCase):
    def test_errors_do_not_expose_request_or_response(self):
        marker = "audit-fixture-not-a-credential"
        url = "https://example.invalid/path?key=" + marker
        for call in (lambda: common.http_json(url), lambda: common.post_json(url, {})):
            for error in (HTTPError(url, 403, marker, {}, io.BytesIO(marker.encode())), URLError(marker)):
                with self.subTest(error=type(error).__name__), patch.object(common, "urlopen", side_effect=error):
                    try:
                        call()
                    except RuntimeError as exc:
                        rendered = "".join(traceback.format_exception(exc))
                        self.assertNotIn(marker, rendered)
                        if isinstance(error, HTTPError):
                            self.assertIn("403", str(exc))
                    else:
                        self.fail("failed request was accepted")

    def test_success_keeps_json_contract(self):
        with patch.object(common, "urlopen", return_value=io.BytesIO(b'{"ok":true}')):
            self.assertEqual(common.http_json("https://example.invalid"), {"ok": True})
