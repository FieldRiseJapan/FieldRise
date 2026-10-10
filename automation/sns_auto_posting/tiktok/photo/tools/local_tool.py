"""Read-only diagnostics and loopback-only static server; no third-party packages."""
import argparse
import hashlib
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import platform
import re
import subprocess
import threading
from urllib.error import HTTPError
from urllib.request import urlopen
from urllib.parse import unquote, urlsplit

PHOTO = Path(__file__).resolve().parents[1]
ASSETS = ['index.html', 'style.css', 'page.mjs', 'core.mjs', 'batch.mjs', 'data.mjs', 'workflow.mjs', 'assist.mjs']
BASE = '0838123cadbe43e2b948eb262fc33f2694dbf241'

class IdParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.csp = ''
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id'):
            self.ids.append(attrs['id'])
        if attrs.get('http-equiv', '').lower() == 'content-security-policy':
            self.csp = attrs.get('content', '')

class Handler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, '.mjs': 'text/javascript', '.css': 'text/css', '.html': 'text/html; charset=utf-8'}
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PHOTO), **kwargs)
    def do_GET(self):
        path = unquote(urlsplit(self.path).path)
        if path not in ['/'] + ['/' + n for n in ASSETS]:
            self.send_error(404)
            return
        super().do_GET()
    def do_HEAD(self):
        path = unquote(urlsplit(self.path).path)
        if path not in ['/'] + ['/' + n for n in ASSETS]:
            self.send_error(404)
            return
        super().do_HEAD()
    def list_directory(self, path):
        self.send_error(404)
    def translate_path(self, path):
        resolved = Path(super().translate_path(path)).resolve()
        if resolved != PHOTO and PHOTO not in resolved.parents:
            return str(PHOTO / '__blocked__')
        return str(resolved)
    def log_message(self, *args):
        pass

def diagnose():
    checks = []
    def result(name, ok, detail=''):
        checks.append({'name': name, 'status': 'PASS' if ok else 'FAIL', 'detail': detail})
    result('required static assets', all((PHOTO / n).is_file() for n in ASSETS))
    parser = IdParser()
    parser.feed((PHOTO / 'index.html').read_text(encoding='utf-8'))
    result('unique HTML ids', len(parser.ids) == len(set(parser.ids)))
    page = (PHOTO / 'page.mjs').read_text(encoding='utf-8')
    result('static UI references', not (set(re.findall(r"\$\('([^']+)'\)", page)) - set(parser.ids)))
    result('CSP network restriction', all(s in parser.csp for s in ["connect-src 'none'", "script-src 'self'", "object-src 'none'", "base-uri 'none'", "form-action 'none'"]))
    sources = '\n'.join((PHOTO / n).read_text(encoding='utf-8') for n in ASSETS)
    result('no fetch/XHR/WebSocket API', not re.search(r'\b(fetch\s*\(|XMLHttpRequest|WebSocket\s*\()', sources))
    patterns = [r'gh[pousr]_[A-Za-z0-9]{30,}', r'github_pat_[A-Za-z0-9_]{50,}', r'AKIA[A-Z0-9]{16}', r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----', r'eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}']
    result('known secret patterns', not any(re.search(p, sources) for p in patterns), 'Known patterns only; values are never printed.')
    try:
        for module in PHOTO.glob('*.mjs'):
            subprocess.run(['node', '--check', str(module)], check=True, capture_output=True, timeout=30)
        result('Node syntax', True)
    except FileNotFoundError:
        checks.append({'name': 'Node syntax', 'status': 'BLOCKED', 'detail': 'Node.js not available; browser validation still required.'})
    except (subprocess.SubprocessError, OSError):
        result('Node syntax', False, 'Syntax command failed; no source/secret contents printed.')
    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        for name in ASSETS:
            with urlopen(f'http://127.0.0.1:{server.server_port}/{name}', timeout=5) as response:
                content = response.read()
                mime = response.headers.get_content_type()
                result('HTTP ' + name, content == (PHOTO / name).read_bytes() and (not name.endswith('.mjs') or mime == 'text/javascript'))
        with urlopen(f'http://127.0.0.1:{server.server_port}/', timeout=5) as response:
            result('HTTP entry route', response.read() == (PHOTO / 'index.html').read_bytes())
        try:
            urlopen(f'http://127.0.0.1:{server.server_port}/tools/local_tool.py', timeout=5)
            result('non-public local files blocked', False)
        except HTTPError as error:
            result('non-public local files blocked', error.code == 404)
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)
    return {'platform': platform.system(), 'baseline': BASE, 'checks': checks, 'windows_browser': 'NOT TESTED', 'real_images_os_zip_clipboard': 'NOT TESTED', 'assets': [{'name': n, 'sha256': hashlib.sha256((PHOTO / n).read_bytes()).hexdigest()} for n in ASSETS]}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=['diagnose', 'serve'])
    parser.add_argument('--port', type=int, default=8000)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    if args.mode == 'diagnose':
        report = diagnose()
        data = json.dumps(report, ensure_ascii=False, indent=2)
        if args.output:
            args.output.write_text(data, encoding='utf-8')
        print(data)
        return int(any(c['status'] == 'FAIL' for c in report['checks']))
    if not 1024 <= args.port <= 65535:
        parser.error('Port must be between 1024 and 65535.')
    try:
        server = ThreadingHTTPServer(('127.0.0.1', args.port), Handler)
    except OSError:
        print('Cannot bind loopback port. Close the previous server or use --port 8001; browser storage is separate for each port.')
        return 1
    print(f'Open http://127.0.0.1:{args.port}/ in Chrome or Edge. Ctrl+C stops the server. No external posting or deployment.')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
