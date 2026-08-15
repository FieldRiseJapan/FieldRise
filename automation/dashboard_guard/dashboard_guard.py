#!/usr/bin/env python3
"""Read-only dashboard monitor and repair-advice generator.

This program never edits dashboard source, static deployment artifacts, GitHub
settings, workflow permissions, branches, or issues. It only writes a local
machine-readable report to the caller-specified report directory. GitHub Actions
may later attach that report to an approval-required issue.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import textwrap
import urllib.error
import urllib.request
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

DEFAULT_CONFIG = Path("automation/dashboard_guard/config.json")
MAX_OUTPUT = 4_000


def utc_now() -> str:
    return datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def truncate(value: str, limit: int = MAX_OUTPUT) -> str:
    return value if len(value) <= limit else f"{value[:limit]}\n… output truncated …"


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def command(command: list[str], cwd: Path, timeout: int = 180) -> dict[str, Any]:
    try:
        result = subprocess.run(
            command,
            cwd=cwd,
            text=True,
            capture_output=True,
            timeout=timeout,
            check=False,
        )
        return {
            "command": " ".join(command),
            "returncode": result.returncode,
            "stdout": truncate(result.stdout),
            "stderr": truncate(result.stderr),
        }
    except subprocess.TimeoutExpired as error:
        return {
            "command": " ".join(command),
            "returncode": 124,
            "stdout": truncate(error.stdout or ""),
            "stderr": f"timeout after {timeout} seconds",
        }


def check_url(target: dict[str, Any]) -> dict[str, Any]:
    request = urllib.request.Request(
        target["url"],
        headers={"User-Agent": "FieldRise-Dashboard-Guard/1.0"},
    )
    result: dict[str, Any] = {
        "kind": "public_url",
        "name": target["name"],
        "url": target["url"],
        "expected_status": target.get("expected_status", 200),
    }
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            body = response.read(1_000_000).decode("utf-8", errors="replace")
            missing = [text for text in target.get("required_text", []) if text not in body]
            result.update(
                {
                    "status": "pass" if response.status == result["expected_status"] and not missing else "fail",
                    "http_status": response.status,
                    "final_url": response.url,
                    "missing_text": missing,
                    "content_type": response.headers.get("content-type", ""),
                }
            )
    except urllib.error.HTTPError as error:
        result.update({"status": "fail", "http_status": error.code, "error": str(error)})
    except (urllib.error.URLError, TimeoutError, OSError) as error:
        result.update({"status": "fail", "error": str(error)})
    return result


def check_json_source(repo_root: Path, relative_path: str) -> dict[str, Any]:
    source = repo_root / relative_path
    result: dict[str, Any] = {"kind": "json_source", "path": relative_path}
    if not source.exists():
        result.update({"status": "fail", "error": "file does not exist"})
        return result
    try:
        data = load_json(source)
        result.update({"status": "pass", "top_level": type(data).__name__})
    except (OSError, json.JSONDecodeError) as error:
        result.update({"status": "fail", "error": str(error)})
    return result


def check_dashboard(repo_root: Path, target: dict[str, Any]) -> list[dict[str, Any]]:
    directory = repo_root / target["directory"]
    records: list[dict[str, Any]] = []
    if not directory.exists():
        return [{"kind": "dashboard", "name": target["name"], "status": "fail", "error": "directory does not exist"}]

    typecheck = command([target["package_manager"], "exec", "tsc", "--noEmit"], directory)
    typecheck.update({"kind": "typecheck", "name": target["name"], "status": "pass" if typecheck["returncode"] == 0 else "fail"})
    records.append(typecheck)

    build = command([target["package_manager"], "build"], directory)
    build.update({"kind": "build", "name": target["name"], "status": "pass" if build["returncode"] == 0 else "fail"})
    records.append(build)
    return records


def repair_advice(record: dict[str, Any]) -> dict[str, Any] | None:
    if record.get("status") == "pass":
        return None
    kind = record.get("kind")
    if kind == "public_url":
        return {
            "severity": "high",
            "target": record.get("name"),
            "approval_required": True,
            "proposed_action": "公開設定・カスタムURL・直近のPagesビルドを人が確認し、再公開前に承認を得る。",
            "safe_diagnostics": [
                "GitHub Pages の最新ビルド状態を確認する",
                "公開物が main ブランチの対象サブパスに存在するか確認する",
                "HTTP応答と公開URLを再テストする",
            ],
            "automatic_change": "禁止（公開・再デプロイ・URL変更は行わない）",
        }
    if kind == "json_source":
        return {
            "severity": "high",
            "target": record.get("path"),
            "approval_required": True,
            "proposed_action": "正本データ生成元を確認し、再生成コマンドと差分を提示する。",
            "safe_diagnostics": ["JSON構文エラー位置を確認する", "生成スクリプトの読み取り検証を実行する"],
            "automatic_change": "禁止（正本JSONの再生成・上書きは行わない）",
        }
    if kind in {"typecheck", "build"}:
        return {
            "severity": "medium",
            "target": record.get("name"),
            "approval_required": True,
            "proposed_action": "失敗ログを基に、影響ファイルを限定したパッチ候補を別ブランチ用として作成する。",
            "safe_diagnostics": ["依存関係のロックファイル整合を確認する", "失敗コマンドをローカルで再現する"],
            "automatic_change": "禁止（ダッシュボード本体・公開物・mainを変更しない）",
        }
    return {
        "severity": "medium",
        "target": record.get("name", record.get("path", "unknown")),
        "approval_required": True,
        "proposed_action": "手動レビュー用の診断記録を作成する。",
        "automatic_change": "禁止",
    }


def markdown_report(report: dict[str, Any]) -> str:
    rows = []
    for record in report["checks"]:
        target = record.get("name") or record.get("path") or record.get("url") or "unknown"
        detail = record.get("error") or f"HTTP {record.get('http_status', '—')}"
        rows.append(f"| {record['kind']} | {target} | {record['status']} | {detail} |")
    advice = report["repair_advice"]
    advice_section = "\n".join(
        f"### {item['target']}\n\n- 重要度: {item['severity']}\n- 承認: 必須\n- 提案: {item['proposed_action']}\n- 自動変更: {item['automatic_change']}"
        for item in advice
    ) or "問題は検出されませんでした。"
    return textwrap.dedent(
        f"""\
        # Dashboard Guard Report

        - 実行時刻: {report['generated_at']}
        - 結果: **{report['status']}**
        - 承認なしの変更: **実施していません**

        | 検査 | 対象 | 結果 | 詳細 |
        |---|---|---|---|
        {os.linesep.join(rows)}

        ## 修正提案（承認待ち）

        {advice_section}
        """
    )


def run(repo_root: Path, config: dict[str, Any]) -> dict[str, Any]:
    checks: list[dict[str, Any]] = []
    for target in config.get("public_urls", []):
        checks.append(check_url(target))
    for source in config.get("json_sources", []):
        checks.append(check_json_source(repo_root, source))
    for dashboard in config.get("dashboards", []):
        checks.extend(check_dashboard(repo_root, dashboard))

    advice = [item for record in checks if (item := repair_advice(record)) is not None]
    return {
        "generated_at": utc_now(),
        "status": "pass" if not advice else "attention_required",
        "checks": checks,
        "repair_advice": advice,
        "safety": config.get("approval_boundary", {}),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Read-only FieldRise dashboard guard")
    parser.add_argument("--config", default=str(DEFAULT_CONFIG))
    parser.add_argument("--output-dir", default=None)
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[2]
    config_path = (repo_root / args.config).resolve() if not Path(args.config).is_absolute() else Path(args.config)
    config = load_json(config_path)
    output_dir = Path(args.output_dir) if args.output_dir else repo_root / config["report_directory"]
    output_dir.mkdir(parents=True, exist_ok=True)

    report = run(repo_root, config)
    stem = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    json_path = output_dir / f"dashboard-guard-{stem}.json"
    markdown_path = output_dir / f"dashboard-guard-{stem}.md"
    json_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    markdown_path.write_text(markdown_report(report), encoding="utf-8")
    print(json.dumps({"status": report["status"], "json": str(json_path), "markdown": str(markdown_path)}, ensure_ascii=False))
    return 0 if report["status"] == "pass" else 2


if __name__ == "__main__":
    raise SystemExit(main())
