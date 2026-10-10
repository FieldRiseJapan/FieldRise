import hashlib
import pathlib
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

REPO = pathlib.Path(__file__).resolve().parents[1]
SCRIPT = REPO / 'automation/sns_auto_posting/tiktok/photo/tools/apply_hidden_css_windows.cmd'
REL = pathlib.Path('automation/sns_auto_posting/tiktok/photo/style.css')
ORIGINAL = subprocess.check_output(['git', 'show', 'e9babbaa5c8838bbdf8609cc1f4d172004b088b3:' + REL.as_posix()], cwd=REPO)
FIXED = (REPO / REL).read_bytes()
ns = {'__name__': 'css_apply_test'}
exec(compile(SCRIPT.read_text().split('\n', 1)[1], str(SCRIPT), 'exec'), ns)

class CssApplyTests(unittest.TestCase):
    def setup_folder(self, root, css=ORIGINAL):
        target = root / REL
        target.parent.mkdir(parents=True)
        target.write_bytes(css)
        sibling = target.parent / 'page.mjs'
        sibling.write_bytes(b'synthetic unchanged JavaScript')
        return target, sibling

    def test_exact_patch_backup_and_second_apply_no_duplicate(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            target, sibling = self.setup_folder(root)
            before = sibling.read_bytes()
            ns['apply'](root)
            self.assertEqual(target.read_bytes(), FIXED)
            backups = list(target.parent.glob('*.bak'))
            self.assertEqual(len(backups), 1)
            self.assertEqual(backups[0].read_bytes(), ORIGINAL)
            ns['apply'](root)
            self.assertEqual(len(list(target.parent.glob('*.bak'))), 1)
            self.assertEqual(target.read_bytes(), FIXED)
            self.assertEqual(sibling.read_bytes(), before)
            self.assertFalse(list(target.parent.glob('*.tmp')))

    def test_missing_target_and_unapproved_css_never_overwritten(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            with self.assertRaises(ValueError): ns['apply'](root)
            target, _ = self.setup_folder(root, b'/* unapproved synthetic CSS */')
            with self.assertRaises(ValueError): ns['apply'](root)
            self.assertEqual(target.read_bytes(), b'/* unapproved synthetic CSS */')
            self.assertFalse(list(target.parent.glob('*.bak')))

    def test_replace_failure_retains_original_backup_and_cleans_temp(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            target, _ = self.setup_folder(root)
            with patch.object(ns['os'], 'replace', side_effect=PermissionError('synthetic locked CSS')):
                with self.assertRaises(PermissionError): ns['apply'](root)
            self.assertEqual(target.read_bytes(), ORIGINAL)
            self.assertEqual(list(target.parent.glob('*.bak'))[0].read_bytes(), ORIGINAL)
            self.assertFalse(list(target.parent.glob('*.tmp')))

    def test_existing_manual_rule_no_write(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            raw = ORIGINAL + b'\n[hidden] { display: none !important; }\n'
            target, _ = self.setup_folder(root, raw)
            ns['apply'](root)
            self.assertEqual(target.read_bytes(), raw)
            self.assertFalse(list(target.parent.glob('*.bak')))

    def test_python_launcher_core_real_execution(self):
        with tempfile.TemporaryDirectory(prefix='css folder with spaces ') as tmp:
            root = pathlib.Path(tmp)
            target, _ = self.setup_folder(root)
            result = subprocess.run([sys.executable, '-x', str(SCRIPT), str(root)], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr + result.stdout)
            self.assertIn('PASS:', result.stdout)
            self.assertEqual(hashlib.sha256(target.read_bytes()).hexdigest(), ns['FIXED_SHA'])

if __name__ == '__main__': unittest.main()
