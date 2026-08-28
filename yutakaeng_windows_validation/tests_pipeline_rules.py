import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "src"))
from pipeline import choose_main_candidate, exclusion_reason, extract_wire_codes, is_internal_wire_reference, main_candidate_is_safe, normalize_side_candidate, side_candidate_is_safe


def check(actual, expected, label):
    if actual != expected:
        raise AssertionError(f"{label}: expected={expected!r} actual={actual!r}")
    print(f"OK  {label}")


check(extract_wire_codes("RIGHT-Y5"), ["Y5"], "RIGHT cross-panel wire code")
check(extract_wire_codes("LEFT-Y5"), ["Y5"], "LEFT cross-panel wire code")
check(extract_wire_codes("LEFT-Y5/RIGHT-Y5"), ["Y5"], "LEFT/RIGHT duplicate wire code")
check(normalize_side_candidate("RIGHT-Y5上"), "RIGHT-Y5", "cross-panel non-ASCII suffix removed")
check(normalize_side_candidate("LEFT-Y5一"), "LEFT-Y5", "cross-panel dash suffix removed")
check(normalize_side_candidate("RIGHT-Y51"), "RIGHT-Y51", "cross-panel numeric suffix is not guessed")
check(extract_wire_codes("T1:1-Y2"), ["Y2"], "wire code after terminal reference")
check(extract_wire_codes("5Y"), ["5Y"], "size-first wire code")
check(extract_wire_codes("YF-A01"), [], "connector terminal reference excluded")
check(exclusion_reason("DT1 (2)", "", ""), "対象外: 扉付きDT系端子台", "DT terminal block excluded")
check(exclusion_reason("T1 (2)", "D-Y0.5", ""), "対象外: 線コードがD-で始まる", "D-prefixed wire code excluded")
check(exclusion_reason("T1 (2)", "I/L", ""), "対象外: 端子台接続先のIは盤内行き", "internal-panel I excluded")
check(is_internal_wire_reference("T1 (2)", "I/L", ""), True, "internal-panel I detected")
check(is_internal_wire_reference("YF", "I/L", ""), False, "I on connector is not internal-panel mode")
check(exclusion_reason("T1 (2)", "I/L", "", keep_internal=True), "", "internal-panel I retained in dedicated mode")
check(exclusion_reason("ZT1 (14)", "RIGHT-Y5", "T1-1"), "", "ZT RIGHT remains included")
check(exclusion_reason("ZT1 (14)", "LEFT-Y5", "T1-1"), "", "ZT LEFT remains included")
check(exclusion_reason("ZT1 (14)", "LEFT-Y5/RIGHT-Y5", "T1-1"), "", "ZT LEFT and RIGHT remain included")
check(main_candidate_is_safe("D31S14", 0.95), True, "safe main text accepted")
check(main_candidate_is_safe("BTBP", 0.99), True, "verified alpha-only main text accepted")
check(main_candidate_is_safe("RTRP", 0.99), False, "unknown alpha-only main text rejected")
check(main_candidate_is_safe("AC729S11L", 0.99), False, "terminal-border suffix main text rejected")
check(main_candidate_is_safe("C711S11", 0.99), False, "missing-prefix AC-series main text rejected")
check(main_candidate_is_safe("RTRP?", 0.99), False, "symbol-noise main text rejected")
check(main_candidate_is_safe("1234", 0.99), False, "numeric-only main text rejected")
check(choose_main_candidate(("D31S14", 0.97), ("D31S1", 0.95)), ("D31S14", ""), "truncated narrow main text complemented")
check(choose_main_candidate(("BTBP", 0.99), ("BTBP", 0.99)), ("BTBP", ""), "matching main text accepted")
check(choose_main_candidate(("BTBP", 0.99), ("D31S14", 0.99)), ("", "主文字候補不一致"), "conflicting main text rejected")
# T1:4のようにコロンを明確に読めた端子参照は、先頭欠落誤読の規則で誤って捨てない。
check(side_candidate_is_safe("T1:4-Y2", 0.92), True, "clear terminal reference accepted")
check(side_candidate_is_safe("7T2:4-Y2", 0.92), False, "missing-leading-Z reference rejected")
check(side_candidate_is_safe("T14", 0.92), False, "ambiguous terminal reference rejected")
print("ALL RULE TESTS PASSED")
