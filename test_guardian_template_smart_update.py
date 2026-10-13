"""
Gauradaha Ward No. 1 - Social Security Guardian Recommendation Template
and Smart Record Update Test Suite
"""

import re
import sys

# Ensure UTF-8 stdout on Windows console
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
print("GAURADAHA WARD NO. 1 - GUARDIAN SIFARISH TEMPLATE & SMART UPDATE TEST SUITE")
print("=" * 80)

# Read HTML and JS files
with open("surakshya-bhatta-sifarish.html", "r", encoding="utf-8") as f:
    html_content = f.read()

with open("script-surakshya-bhatta-sifarish.js", "r", encoding="utf-8") as f:
    js_content = f.read()

# ── GROUP 1: RECOMMENDATION LETTER FORMAT VERIFICATION ──
print("\n[GROUP 1] Recommendation Letter Formal Nepali Format:")
body_para_match = re.search(r'<div class="letter-body-para" id="bodyText">([\s\S]*?)</div>', html_content)
assert_test(body_para_match is not None, "Body paragraph #bodyText element exists")

if body_para_match:
    body_text = body_para_match.group(1)
    assert_test("प्रस्तुत विषयमा झापा जिल्ला गौरादह नगरपालिका वडा नं. १ बसोबास गर्नुहुने" in body_text,
                "Formal municipal opening with 'वडा नं. १' present")
    assert_test("सामाजिक सुरक्षा भत्ता लाभग्राही" in body_text,
                "Beneficiary designation present")
    assert_test('id="lblBeneficiaryName"' in body_text,
                "Dynamic placeholder #lblBeneficiaryName present")
    assert_test("तहाँ बैंकमा रहेको खाता नं." in body_text,
                "Bank account reference present")
    assert_test('id="lblAccountNo"' in body_text,
                "Dynamic placeholder #lblAccountNo present")
    assert_test("शारीरिक रूपमा अशक्त/बिरामी भई हिँडडुल गर्न असमर्थ हुनुभएकोले" in body_text,
                "Inability to travel due to physical condition present")
    assert_test("उक्त खातामा जम्मा भएको चालू आर्थिक वर्षको" in body_text,
                "Current fiscal year quarter reference present")
    assert_test('id="lblKista1"' in body_text,
                "First dynamic quarter placeholder #lblKista1 present")
    assert_test('id="lblKista2"' in body_text,
                "Second dynamic quarter placeholder #lblKista2 present")
    assert_test("तपसिलको दस्तखत भएको" in body_text,
                "Specimen signature reference in body present ('तपसिलको दस्तखत भएको')")
    assert_test('id="lblRelation"' in body_text,
                "Dynamic relation placeholder #lblRelation present")
    assert_test('id="lblGuardianName"' in body_text,
                "Dynamic guardian name placeholder #lblGuardianName present")
    assert_test('id="lblGuardianCitNo"' in body_text,
                "Guardian citizenship number placeholder #lblGuardianCitNo present")
    assert_test('id="lblGuardianCitDate"' in body_text,
                "Guardian citizenship date placeholder #lblGuardianCitDate present")
    assert_test("लाई रकम बुझिलिने व्यवस्था मिलाइदिनुहुन सिफारिस साथ अनुरोध छ" in body_text,
                "Formal recommendation closing sentence present")

# ── GROUP 2: LEFT-ALIGNED TAPASIL & RIGHT-ALIGNED SPECIMEN SIGNATURE BOX ──
print("\n[GROUP 2] Left-Aligned 'तपसिल' and Right-Aligned Specimen Signature Box:")
tapsil_block_match = re.search(r'<div class="beneficiary-summary"[^>]*id="beneficiarySummaryBlock"[^>]*>([\s\S]*?)</div>\s*<!-- ── Sample Signature', html_content)
assert_test(tapsil_block_match is not None, "Tapasil block #beneficiarySummaryBlock exists")

if tapsil_block_match:
    tapsil_content = tapsil_block_match.group(1)
    assert_test("तपसिल :" in tapsil_content, "Tapasil title 'तपसिल :' present")
    assert_test('id="lblTblBeneficiaryName"' in tapsil_content, "Beneficiary name row #lblTblBeneficiaryName present")
    assert_test('id="lblTblAccountNo"' in tapsil_content, "Bank account row #lblTblAccountNo present")
    assert_test('id="lblTblCardNo"' in tapsil_content, "Social security card row #lblTblCardNo present")
    assert_test('id="lblTblGuardianName"' in tapsil_content, "Guardian name row #lblTblGuardianName present")
    assert_test('id="lblTblRelation"' not in tapsil_content, "Relation row #lblTblRelation is REMOVED from Tapasil")

assert_test('id="lblRelation"' in html_content, "Relation field #lblRelation remains functional in body text")
assert_test('id="specimenSigCard"' in html_content, "Specimen signature card #specimenSigCard present")
assert_test("नमुना दस्तखत" in html_content, "Specimen signature label 'नमुना दस्तखत' present")
assert_test('id="specimenSigBox"' in html_content, "Specimen signature box #specimenSigBox present")

# CSS alignment verification: Tapasil is LEFT, Specimen Box alone is RIGHT
assert_test(".beneficiary-summary" in html_content and "margin-left: 0" in html_content,
            "CSS aligns .beneficiary-summary to the LEFT with margin-left: 0")
assert_test(".specimen-signature-container" in html_content and "margin-left: auto" in html_content,
            "CSS aligns .specimen-signature-container alone to the RIGHT with margin-left: auto")
assert_test(".specimen-signature-card" in html_content and "border: 1.5px solid #000" in html_content,
            "CSS sets solid bordered box for specimen signature")
assert_test("@media print" in html_content and ".beneficiary-summary" in html_content and "margin-left: 0 !important" in html_content,
            "@media print enforces LEFT-aligned Tapasil during printing")
assert_test(".specimen-signature-card" in html_content and "print-color-adjust: exact" in html_content,
            "@media print enforces exact border reproduction on print/PDF")

# ── GROUP 3: DUPLICATE / REUSE CONFIRMATION MODAL ──
print("\n[GROUP 3] Quarterly Reuse & Duplicate Detection Modal:")
assert_test('id="duplicateRecordModal"' in html_content, "Duplicate confirmation modal #duplicateRecordModal exists")
assert_test("पहिले सिफारिस बनाइएको छ" in html_content, "Modal title 'पहिले सिफारिस बनाइएको छ' present")
assert_test("यस लाभग्राहीको नाममा यसअघि सामाजिक सुरक्षा भत्ता संरक्षक सिफारिस बनाइएको अभिलेख भेटियो" in html_content,
            "Modal prompt message matches requirement")
assert_test('id="btnChooseUpdateRecord"' in html_content and "हो, अद्यावधिक गर्नुहोस्" in html_content,
            "Modal update button 'हो, अद्यावधिक गर्नुहोस्' present")
assert_test('id="btnChooseNewRecord"' in html_content and "होइन, नयाँ सिफारिस बनाउँछु" in html_content,
            "Modal new record button 'होइन, नयाँ सिफारिस बनाउँछु' present")
assert_test('id="duplicateRecordsContainer"' in html_content,
            "Container for past record selection #duplicateRecordsContainer present")

# ── GROUP 4: JAVASCRIPT LOGIC & SMART UPDATE WORKFLOW ──
print("\n[GROUP 4] JavaScript Matching, Safe Update & Date Automation:")
assert_test("function findMatchingHistoricalRecords" in js_content,
            "findMatchingHistoricalRecords function implemented")
assert_test("function checkDuplicateBeneficiaryRecommendation" in js_content,
            "checkDuplicateBeneficiaryRecommendation function implemented")
assert_test("function showDuplicateConfirmationModal" in js_content,
            "showDuplicateConfirmationModal function implemented")
assert_test("function handleDuplicateChoice" in js_content,
            "handleDuplicateChoice function implemented")
assert_test("function applyQuarterlyUpdate" in js_content,
            "applyQuarterlyUpdate function implemented")

# Stable identifier matching
assert_test("toEnglishDigit(r.cardNo || r.beneficiaryRefId" in js_content,
            "Matching checks stable cardNo / beneficiaryRefId")
assert_test("toEnglishDigit(r.accountNo" in js_content,
            "Matching checks stable bank accountNo fallback")

# Update preserves record ID & sets current Nepal date
apply_code = js_content.split("function applyQuarterlyUpdate")[1].split("function updateGuardianSuggestions")[0]
assert_test("document.getElementById('editRecordIndex').value = rec.id" in apply_code,
            "applyQuarterlyUpdate reuses existing record ID")
assert_test("initializeAutomaticDate()" in apply_code,
            "applyQuarterlyUpdate automatically sets recommendation date to current Nepal date")
assert_test("selKista" in apply_code,
            "applyQuarterlyUpdate allows reviewing and editing fiscal quarter")
assert_test("updateDoc()" in apply_code,
            "applyQuarterlyUpdate updates document live preview")

# UpdateDoc Tapasil population
assert_test("lblTblGuardianName" in js_content and "lblTblRelation" in js_content,
            "updateDoc populates guardian name and relation into Tapasil table")

# Safe saving & history preservation
save_code = js_content.split("async function printAndSaveSystem")[1].split("function formatTimestamp")[0]
assert_test("obj.quarterlyHistory" in save_code,
            "printAndSaveSystem preserves quarterly history audit trail")
assert_test("isSavingInProgress" in save_code,
            "Double-click submission protection enabled")

# Window exports for testing and inter-module access
assert_test("window.checkDuplicateBeneficiaryRecommendation" in js_content,
            "checkDuplicateBeneficiaryRecommendation exported on window")
assert_test("window.applyQuarterlyUpdate" in js_content,
            "applyQuarterlyUpdate exported on window")
assert_test("window.handleDuplicateChoice" in js_content,
            "handleDuplicateChoice exported on window")

# ── SUMMARY ──
print("\n" + "=" * 80)
print(f"TEST RESULTS: {tests_passed} PASSED, {tests_failed} FAILED")
print("=" * 80)

if tests_failed > 0:
    sys.exit(1)
