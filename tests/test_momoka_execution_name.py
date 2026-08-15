import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
import momoka_execution_name as naming  # noqa: E402


class MomokaExecutionNameTests(unittest.TestCase):
    def test_declared_execution_name_is_preserved_for_issue_12(self) -> None:
        markdown = """# 桃花への正式修正指示書

今回：`桃花｜#12｜AI Control Dashboard｜公開後検証・最終確認`

Issue #10のルールを修正する。
"""
        metadata = naming.generate_execution_metadata(markdown, "別のIssueタイトル")
        self.assertEqual(
            metadata["execution_name"],
            "桃花｜#12｜AI Control Dashboard｜公開後検証・最終確認",
        )
        self.assertEqual(metadata["issue_number"], "12")
        self.assertEqual(metadata["project_name"], "AI Control Dashboard")
        self.assertEqual(metadata["task_name"], "公開後検証・最終確認")
        self.assertEqual(metadata["source"], "instruction_declared_name")

    def test_declared_name_skips_generic_rule_template(self) -> None:
        markdown = """# 指示書

原則：`桃花｜#Issue番号｜プロジェクト名｜作業内容`
今回：`桃花｜#12｜AI Control Dashboard｜公開後検証・最終確認`
"""
        metadata = naming.generate_execution_metadata(markdown)
        self.assertEqual(metadata["execution_name"], "桃花｜#12｜AI Control Dashboard｜公開後検証・最終確認")

    def test_metadata_generates_name_before_runtime_when_issue_exists(self) -> None:
        markdown = """# 公開後検証

プロジェクト名：AI Control Dashboard
作業内容：公開後検証・最終確認
Issue #12 を対象にする。
"""
        metadata = naming.generate_execution_metadata(markdown)
        self.assertEqual(
            metadata["execution_name"],
            "桃花｜#12｜AI Control Dashboard｜公開後検証・最終確認",
        )

    def test_issue_number_is_optional_but_project_and_task_are_required(self) -> None:
        markdown = """# 受領

プロジェクト名：AI Control Dashboard
作業内容：運用監査
"""
        metadata = naming.generate_execution_metadata(markdown)
        self.assertEqual(metadata["execution_name"], "桃花｜AI Control Dashboard｜運用監査")
        self.assertEqual(metadata["issue_number"], "")

    def test_missing_project_or_task_blocks_instead_of_using_placeholder(self) -> None:
        with self.assertRaisesRegex(ValueError, "プロジェクト名"):
            naming.generate_execution_metadata("# 未指定\n\nIssue #12")
        with self.assertRaisesRegex(ValueError, "作業内容"):
            naming.generate_execution_metadata("# 未指定\n\nプロジェクト名：AI Control Dashboard")

    def test_forbidden_placeholder_is_rejected(self) -> None:
        markdown = """# 受領

プロジェクト名：AI Control Dashboard
作業内容：未指定
"""
        with self.assertRaisesRegex(ValueError, "作業内容"):
            naming.generate_execution_metadata(markdown)


if __name__ == "__main__":
    unittest.main()
