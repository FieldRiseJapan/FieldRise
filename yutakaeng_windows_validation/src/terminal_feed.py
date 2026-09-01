"""yutakaengの解析進行を、実際の処理内容に対応したターミナル表示へ整形する。"""

from __future__ import annotations

from pathlib import Path
import re


def startup_lines(input_path: str) -> list[str]:
    """解析開始時に一度だけ表示する、実行構成と安全性の説明を返す。"""
    filename = Path(input_path).name
    return [
        f"yutakaeng@LOCAL:~$ python yutakaeng.py --offline --input {filename}",
        "from pipeline import run_pipeline",
        "# LOCAL OCR ONLY — NO CLOUD UPLOAD",
        "document = fitz.open(input_pdf)",
        "progress(0, document.page_count)",
        "rows = []",
        "for page_index, page in enumerate(document, 1):",
    ]


def format_pipeline_event(code: str, message: str) -> str:
    """実際に発生したイベントを、対応する処理呼出しと結果を併記して返す。"""
    page_match = re.search(r"ページ\s*(\d+)", message)
    page_index = max(0, int(page_match.group(1)) - 1) if page_match else "page_index - 1"
    snippets = {
        "PDF_OPEN": "document = fitz.open(input_pdf)",
        "PAGE_RENDER": f"page = document[{page_index}]\nimage = render_page(page, dpi=300)",
        "ORDER_SCAN": "order_no = extract_order_number(image)",
        "PANEL_SCAN": "panel_no = extract_panel_number(image)",
        "FRAME_DETECT": "frames = detect_frames(image)",
        "RULE_FILTER": "rows = apply_business_rules(rows, mode=selected_mode)",
        "SHEET_GROUP": "groups = group_rows_by_wire_code(rows)",
        "EXCEL_WRITE_DONE": "output_xlsx = write_excel(groups, order_no, desktop_path())",
        "REVIEW_IMAGES_READY": "save_warning_cell_crops(rows, review_dir)",
        "PIPELINE_COMPLETE": "return output_xlsx",
        "PIPELINE_ERROR": "raise PipelineError(details)",
    }
    snippet = snippets.get(code)
    if snippet:
        return f">>> {snippet}\n# {code}: {message}"
    return f">>> {code}\n# {message}"
