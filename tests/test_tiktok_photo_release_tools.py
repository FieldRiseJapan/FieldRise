import importlib.util
from pathlib import Path
import unittest
ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / 'automation/sns_auto_posting/tiktok/photo/tools/local_tool.py'
spec = importlib.util.spec_from_file_location('photo_local_tool', PATH)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
class ReleaseToolsTests(unittest.TestCase):
    def test_diagnostics_real_loopback_http_assets_and_mime(self):
        result = module.diagnose()
        self.assertFalse(any(c['status'] == 'FAIL' for c in result['checks']))
        self.assertEqual(result['windows_browser'], 'NOT TESTED')
        self.assertEqual(len(result['assets']), 9)
        self.assertTrue(all(len(a['sha256']) == 64 for a in result['assets']))
    def test_launcher_no_network_install_or_global_policy_change(self):
        text = (PATH.parent / 'start_windows.ps1').read_text()
        self.assertNotIn('Set-ExecutionPolicy', text)
        self.assertNotIn('Invoke-WebRequest', text)
        self.assertIn('DiagnoseOnly', text)
