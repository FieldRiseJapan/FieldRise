import io
import json
import os
import unittest
from unittest.mock import patch

from automation.scripts import generate_ayaka_prompt as prompt


class OfflineResponseTests(unittest.TestCase):
    def parse(self, data):
        response = io.BytesIO(json.dumps(data).encode())
        with patch.dict(os.environ, {"OPENAI_API_KEY": "synthetic"}, clear=True), patch.object(prompt, "urlopen", return_value=response):
            return prompt.call_openai("sample", "sample", "sample")

    def test_nested_output(self):
        self.assertEqual(self.parse({"output": [{"content": [{"type": "output_text", "text": "OK"}]}]}), "OK")

    def test_empty_output(self):
        with self.assertRaisesRegex(RuntimeError, "no output text"):
            self.parse({})
