from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent / "src"))
from terminal_feed import format_pipeline_event, startup_lines


def check(actual, expected, label):
    if actual != expected:
        raise AssertionError(f"{label}: expected={expected!r} actual={actual!r}")
    print(f"OK  {label}")


initial = startup_lines("wiring_01.pdf")
check(initial[0], "yutakaeng@LOCAL:~$ python yutakaeng.py --offline --input wiring_01.pdf", "command line uses actual offline input")
check(any("from pipeline import run_pipeline" in line for line in initial), True, "startup shows actual pipeline import")
check(any("NO CLOUD UPLOAD" in line for line in initial), True, "startup explicitly shows local-only security")

rendered = format_pipeline_event("PAGE_RENDER", "ページ 2/4 を300dpiで解析しています")
check("page = document[1]" in rendered, True, "page render event exposes the actual page operation")
check("render_page(page, dpi=300)" in rendered, True, "page render event shows actual render call")
check("ページ 2/4" in rendered, True, "page render retains actual progress detail")

ocr = format_pipeline_event("ORDER_SCAN", "ページ1 オーダー番号候補: 25JNG38201W")
check("extract_order_number(image)" in ocr, True, "order scan event exposes actual OCR function")
check("25JNG38201W" in ocr, True, "order scan retains actual result")

frame = format_pipeline_event("FRAME_DETECT", "ページ 1: 9枠候補を検出")
check("frames = detect_frames(image)" in frame, True, "frame detection event exposes actual frame call")

fallback = format_pipeline_event("CUSTOM_EVENT", "処理状態の詳細")
check("CUSTOM_EVENT" in fallback, True, "unknown events remain visible")
check("処理状態の詳細" in fallback, True, "unknown event message remains visible")

print("ALL TERMINAL FEED TESTS PASSED")
