import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "src"))
from pipeline import exclusion_reason, extract_wire_codes


def check(actual, expected, label):
    if actual != expected:
        raise AssertionError(f"{label}: expected={expected!r} actual={actual!r}")
    print(f"OK  {label}: {actual!r}")


check(extract_wire_codes("RIGHT-Y5"), ["Y5"], "RIGHT盤間線コード")
check(extract_wire_codes("LEFT-Y5/RIGHT-Y5"), ["Y5"], "LEFT/RIGHT重複線コード")
check(extract_wire_codes("T1:1-Y2"), ["Y2"], "端子台後ろの線コード")
check(extract_wire_codes("5Y"), ["5Y"], "サイズ先行線コード")
check(extract_wire_codes("YF-A01"), [], "コネクター端子参照は除外")
check(exclusion_reason("DT1 (2)", "", ""), "対象外: 扉付きDT系端子台", "DT端子台除外")
check(exclusion_reason("T1 (2)", "D-Y0.5", ""), "対象外: 線コードがD-で始まる", "D線コード除外")
check(exclusion_reason("T1 (2)", "I/L", ""), "対象外: 端子台接続先のIは盤内行き", "盤内I除外")
check(exclusion_reason("ZT1 (14)", "RIGHT-Y5", "T1-1"), "", "ZT RIGHTは対象に残す")
print("ALL RULE TESTS PASSED")
