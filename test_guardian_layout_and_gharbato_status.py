"""
Validation Suite: test_guardian_layout_and_gharbato_status.py
Tests:
1. Social Security Guardian Recommendation: Left-aligned Tapasil, removed relationship row,
   preserved relation in body text, right-aligned specimen signature box.
2. Gharbato Recommendation: Mutually exclusive 'भएको'/'नभएको' options,
   dynamic parenthetical house detail, safe state transitions, save/restore persistence,
   and backwards compatibility with old records.
"""

import os
import re
import sys

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

tests_passed = 0
tests_failed = 0

def assert_test(condition, test_name, extra_info=""):
    global tests_passed, tests_failed
    if condition:
        tests_passed += 1
        print(f"  [PASS] {test_name}")
        if extra_info:
            print(f"         └─ {extra_info}")
    else:
        tests_failed += 1
        print(f"  [FAIL] {test_name}")
        if extra_info:
            print(f"         └─ {extra_info}")

print("=" * 80)
print("GAURADAHA WARD NO. 1 - GUARDIAN LAYOUT & GHARBATO HOUSE STATUS VALIDATION")
print("=" * 80)

# Read Guardian files
with open("surakshya-bhatta-sifarish.html", "r", encoding="utf-8") as f:
    guardian_html = f.read()

with open("script-surakshya-bhatta-sifarish.js", "r", encoding="utf-8") as f:
    guardian_js = f.read()

# Read Gharbato files
with open("gharbato.html", "r", encoding="utf-8") as f:
    gharbato_html = f.read()

with open("script.js", "r", encoding="utf-8") as f:
    gharbato_js = f.read()

# ══════════════════════════════════════════════════════════════
# TASK 1: GUARDIAN SIFARISH LAYOUT & TAPASIL ALIGNMENT
# ══════════════════════════════════════════════════════════════
print("\n[TASK 1] Social Security Guardian Recommendation Layout:")

# 1. Body Text Relation Functionality Preserved
assert_test('id="lblRelation"' in guardian_html,
            "Guardian relationship field #lblRelation remains in body text (#bodyText)")
assert_test("तपसिलको दस्तखत भएको <strong id=\"lblRelation\">" in guardian_html,
            "Body text formal sentence maintains relationship placeholder")
assert_test("const lblRel = document.getElementById('lblRelation');" in guardian_js,
            "JS updateDoc continues updating #lblRelation in body text")

# 2. Tapasil Table Left-Aligned & Relation Row Removed
tapasil_match = re.search(r'<div class="beneficiary-summary"[^>]*id="beneficiarySummaryBlock"[^>]*>([\s\S]*?)</div>\s*<!-- ── Sample Signature', guardian_html)
assert_test(tapasil_match is not None, "Tapasil block #beneficiarySummaryBlock exists as dedicated left container")

if tapasil_match:
    t_content = tapasil_match.group(1)
    assert_test("तपसिल :" in t_content, "Tapasil heading 'तपसिल :' present")
    assert_test('id="lblTblBeneficiaryName"' in t_content, "Tapasil contains beneficiary name row")
    assert_test('id="lblTblAccountNo"' in t_content, "Tapasil contains bank account number row")
    assert_test('id="lblTblCardNo"' in t_content, "Tapasil contains social security card number row")
    assert_test('id="lblTblGuardianName"' in t_content, "Tapasil contains guardian name row")
    assert_test('id="lblTblRelation"' not in t_content, "Relationship row #lblTblRelation is completely REMOVED from Tapasil")
    assert_test("लाभग्राहीसँगको नाता" not in t_content, "Text 'लाभग्राहीसँगको नाता' does not appear in printed Tapasil")

# 3. CSS Alignment: Tapasil on LEFT, Specimen Box on RIGHT
assert_test(".beneficiary-summary" in guardian_html and "margin-left: 0" in guardian_html,
            "CSS sets Tapasil .beneficiary-summary to LEFT (margin-left: 0)")
assert_test(".specimen-signature-container" in guardian_html and "margin-left: auto" in guardian_html,
            "CSS aligns .specimen-signature-container alone to RIGHT (margin-left: auto)")
assert_test(".tapasil-specimen-row" in guardian_html and "justify-content: space-between" in guardian_html,
            "Flex row arranges Tapasil on left and specimen signature on right")
assert_test("@media print" in guardian_html and "margin-left: 0 !important" in guardian_html,
            "@media print guarantees left-aligned Tapasil in print and PDF")

# 4. Specimen Signature Box Formatting
assert_test('id="specimenSigCard"' in guardian_html, "Specimen signature card #specimenSigCard present")
assert_test("नमुना दस्तखत" in guardian_html, "Specimen card header 'नमुना दस्तखत' present")
assert_test('id="specimenSigBox"' in guardian_html, "Empty specimen signature box #specimenSigBox present")
assert_test(".specimen-signature-card" in guardian_html and "border: 1.5px solid #000" in guardian_html,
            "Specimen box has visible 1.5px solid border")
assert_test(".specimen-signature-card" in guardian_html and "print-color-adjust: exact" in guardian_html,
            "Specimen box enforces exact border in print/PDF output")

# ══════════════════════════════════════════════════════════════
# TASK 2: GHARBATO RECOMMENDATION — HOUSE STATUS OPTION
# ══════════════════════════════════════════════════════════════
print("\n[TASK 2] Gharbato Recommendation — House Status & Parenthetical Detail:")

# 1. Form Label and Radio Group
assert_test("घरको अवस्था :" in gharbato_js,
            "Form contains Nepali label 'घरको अवस्था :'")
assert_test('value="भएको"' in gharbato_js and 'value="नभएको"' in gharbato_js,
            "Radio group contains mutually exclusive 'भएको' and 'नभएको' options")
assert_test("name=\"gharStatus_${rowCounter}\"" in gharbato_js,
            "Radio inputs grouped by unique row counter for mutual exclusivity per kitta")

# 2. No automatic default to 'भएको' unless explicitly specified
assert_test("const hasGhar = data && data.ghar === 'भएको';" in gharbato_js,
            "Does not automatically select 'भएको' for new/unspecified records")
assert_test("const noGhar = data && data.ghar === 'नभएको';" in gharbato_js,
            "Correctly identifies 'नभएको' from data")

# 3. Editable Parenthetical Detail Input
assert_test("घरको विवरण (कोष्ठकभित्र देखिने) :" in gharbato_js,
            "Detail input has label 'घरको विवरण (कोष्ठकभित्र देखिने) :'")
assert_test("class=\"input-ghar-detail\"" in gharbato_js,
            "Input field has class 'input-ghar-detail'")
assert_test("class=\"ghar-detail-wrapper\"" in gharbato_js,
            "Detail wrapper exists for conditional display")
assert_test("display: ${hasGhar ? 'block' : 'none'}" in gharbato_js,
            "Detail input only displayed when 'भएको' is selected")

# 4. Toggle Handler & State Transition Safety
assert_test("function toggleGharDetailRow" in gharbato_js,
            "toggleGharDetailRow function implemented")
assert_test("wrapper.style.display = (status === 'भएको') ? 'block' : 'none';" in gharbato_js,
            "toggleGharDetailRow hides wrapper when 'नभएको' selected and reveals when 'भएको' selected")

# 5. Dynamic Recommendation Output in updateDoc()
assert_test("const gharVal = checkedRadio ? checkedRadio.value : '-';" in gharbato_js,
            "updateDoc extracts checked house status value")
assert_test("const detailVal = (detailInput && gharVal === 'भएको') ? detailInput.value.trim() : '';" in gharbato_js,
            "updateDoc only includes detailVal if gharVal === 'भएको'")
assert_test("(${escapeHtml(detailVal)})" in gharbato_js,
            "Parenthetical detail enclosed in parentheses below 'भएको'")
assert_test("else if (gharVal === 'नभएको') {" in gharbato_js and "gharCellContent = `नभएको`;" in gharbato_js,
            "When 'नभएको' selected, displays 'नभएको' with zero parenthetical details")

# 6. Save & DB Synchronization
assert_test("ghar: gharStatus" in gharbato_js,
            "printAndSaveSystem persists selected house status")
assert_test("gharDetail: detailVal" in gharbato_js,
            "printAndSaveSystem persists parenthetical house detail")

# 7. Edit / Reopening Persistence in editFromDB & addKittaRow
assert_test("const gharDetail = (data && data.gharDetail) ? data.gharDetail : '';" in gharbato_js,
            "addKittaRow restores saved house detail from record data")
assert_test("rec.kittas.forEach(kData => { addKittaRow(kData); });" in gharbato_js,
            "editFromDB passes saved kitta records directly into addKittaRow")

# 8. Security & HTML Escaping
assert_test("function escapeHtml" in gharbato_js,
            "escapeHtml sanitization function implemented in script.js")
assert_test("escapeHtml(detailVal)" in gharbato_js,
            "User-entered house details are escaped before injection into table cell")

# ══════════════════════════════════════════════════════════════
# SUMMARY
# ══════════════════════════════════════════════════════════════
print("\n" + "=" * 80)
print(f"TEST RESULTS: {tests_passed} PASSED, {tests_failed} FAILED")
print("=" * 80)

if tests_failed > 0:
    sys.exit(1)
