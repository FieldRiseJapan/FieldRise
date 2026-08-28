import sys
import tempfile
from pathlib import Path

from openpyxl import load_workbook

sys.path.insert(0, str(Path(__file__).parent / "src"))
from pipeline import WireRow, compose_mark_text, write_excel


def check(actual, expected, label):
    if actual != expected:
        raise AssertionError(f"{label}: expected={expected!r} actual={actual!r}")
    print(f"OK  {label}")


with tempfile.TemporaryDirectory() as temp_dir:
    output_dir = Path(temp_dir)
    rows = [
        WireRow(1, "P1-F1", "YF", "マルチコネクター", "1", "FL1A11", "L-A", "R-Y2", ["Y2"], "未確認", "", "", "", "1A"),
        WireRow(1, "P1-F1", "YF", "マルチコネクター", "2", "", "L-B", "R-Y2", ["Y2"], "警告あり", "", "主文字未読取", ""),
    ]
    output = write_excel(rows, Path("sample.pdf"), "要確認", output_dir, lambda *_: None)
    workbook = load_workbook(output, data_only=True)
    worksheet = workbook["Y2"]
    expected_headers = ["マーク主文字", "マーク個数", "読取状態", "確認状態", "L側接続先", "R側接続先", "線コード", "見出し", "種別", "PDFページ", "枠ID", "行番号", "警告・除外理由"]
    check([cell.value for cell in worksheet[5]], expected_headers, "hot-marker column order")
    check([worksheet.cell(6, column).value for column in range(1, 4)], ["YF", None, None], "standalone header row")
    check([worksheet.cell(7, column).value for column in range(1, 8)], ["YF-FL1A11", 2, "読取済み", "確認不要", "L-A", "R-Y2", "Y2"], "main row below header")
    check([worksheet.cell(8, column).value for column in range(1, 4)], [None, 0, "警告あり"], "unread main text receives zero marks")
    check(compose_mark_text("3A", "T1(2)", "BTBT2BP"), "T1-BTBT2BP", "terminal block prefix without panel number")
    check(worksheet.freeze_panes, "A6", "top layout is frozen below headers")

print("ALL EXCEL LAYOUT TESTS PASSED")
