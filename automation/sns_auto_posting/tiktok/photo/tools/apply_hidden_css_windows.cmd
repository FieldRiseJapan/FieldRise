@py -3 -x "%~f0" %* & pause & exit /b
# Single-file Windows launcher plus Python 3 implementation. No network access.
import hashlib
import os
import re
import sys
import tempfile
import uuid
from datetime import datetime, timezone
from pathlib import Path

OLD_SHA = '20dab296d72709e0150ba5517ea8c9ecb59d4e5f1e104bad0471e11dcea4cb3b'
FIXED_SHA = 'bde2bc396abc82bdb9b91e3982dfdb14c3eddb2230df82694e2f3ecdcb08adee'
SUFFIX = b'\n/* Author display rules must never reveal controls marked hidden. */\n[hidden]{display:none!important}\n'
REL = Path('automation/sns_auto_posting/tiktok/photo/style.css')
DEFAULT_ROOT = Path.home() / 'Downloads' / 'FieldRise-e9babbaa5c8838bbdf8609cc1f4d172004b088b3'

def sha(data):
    return hashlib.sha256(data).hexdigest()

def has_rule(data):
    return bool(re.search(r'\[hidden\]\s*\{\s*display\s*:\s*none\s*!important\s*;?\s*\}', data.decode('utf-8-sig'), re.I))

def apply(root):
    root = Path(root).resolve(strict=True)
    target = root / REL
    if not target.is_file() or target.is_symlink() or target.resolve() != target:
        raise ValueError('Target CSS not found or redirected. No files changed.')
    original = target.read_bytes()
    if has_rule(original):
        print('ALREADY APPLIED: hidden rule exists. No files changed.')
        print('CSS SHA-256: ' + sha(original))
        return
    if sha(original) != OLD_SHA:
        raise ValueError('CSS differs from the approved e9babbaa version. No files changed.')
    replacement = original + SUFFIX
    if sha(replacement) != FIXED_SHA or not has_rule(replacement):
        raise ValueError('Patch verification failed. No files changed.')
    stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    backup = target.with_name('style.css.before-hidden-fix.' + stamp + '.' + uuid.uuid4().hex + '.bak')
    with backup.open('xb') as out:
        out.write(original)
        out.flush()
        os.fsync(out.fileno())
    if backup.read_bytes() != original:
        raise ValueError('Backup verification failed. Original CSS unchanged.')
    temp = None
    try:
        with tempfile.NamedTemporaryFile(prefix='style.css.hidden-fix.', suffix='.tmp', dir=target.parent, delete=False) as out:
            temp = Path(out.name)
            out.write(replacement)
            out.flush()
            os.fsync(out.fileno())
        if temp.read_bytes() != replacement or target.read_bytes() != original:
            raise ValueError('CSS changed during preparation. Update cancelled; original not overwritten.')
        os.replace(temp, target)
        temp = None
        if target.read_bytes() != replacement:
            raise ValueError('Post-update verification failed. Keep backup; do not auto-restore over unknown changes.')
        print('PASS: CSS updated and verified. Data, JavaScript and browser storage were not accessed.')
        print('CSS SHA-256: ' + sha(replacement))
        print('Backup: ' + str(backup))
        print('For approved rollback only: stop changes, copy the backup over this style.css.')
        print('Next browser check: Ctrl+F5. CSS visibility and saving are separate checks.')
    finally:
        if temp is not None and temp.exists():
            temp.unlink()

if __name__ == '__main__':
    try:
        if len(sys.argv) > 2:
            raise ValueError('Use zero arguments, or one project folder argument.')
        apply(Path(sys.argv[1]) if len(sys.argv) == 2 else DEFAULT_ROOT)
    except Exception as error:
        print('FAIL: ' + str(error))
        print('Do not reset browser storage. Keep both JSON backups. Report this message.')
        sys.exit(1)
