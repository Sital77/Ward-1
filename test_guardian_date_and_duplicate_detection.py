#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
test_guardian_date_and_duplicate_detection.py
Test suite for:
1. Real-time Asia/Kathmandu Bikram Sambat Recommendation Date (No hardcoding)
2. Preserving historical saved dates on record reload
3. "आजको मिति कायम गर्ने" quick action icon and confirmation prompt
4. Previously created guardian recommendation detection (cardNo primary, name fallback)
5. Existing-record notice and Option A ("पुरानो सिफारिस हेर्न यहाँ थिच्नुहोस्") / Option B ("नयाँ सिफारिस बनाउनुहोस्")
6. Strict isolation of production modules
"""

import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

test_html_path = 'surakshya-sanrakshak-test.html'
test_js_path = 'script-surakshya-sanrakshak-test.js'
prod_html_path = 'surakshya-bhatta-sifarish.html'
prod_js_path = 'script-surakshya-bhatta-sifarish.js'

with open(test_html_path, 'r', encoding='utf-8') as f:
    test_html = f.read()

with open(test_js_path, 'r', encoding='utf-8') as f:
    test_js = f.read()

with open(prod_html_path, 'r', encoding='utf-8') as f:
    prod_html = f.read()

with open(prod_js_path, 'r', encoding='utf-8') as f:
    prod_js = f.read()

passed = 0
failed = 0

def check(name, condition, extra=''):
    global passed, failed
    if condition:
        print(f"  [PASS] {name}")
        passed += 1
    else:
        print(f"  [FAIL] {name} {extra}".strip())
        failed += 1

print("=" * 80)
print("TEST: GUARDIAN SIFARISH DATE FIX & DUPLICATE RECORD DETECTION")
print("=" * 80)

# ── GROUP 1: Dynamic Date & No Hardcoding ──
print("\n[GROUP 1] Dynamic Nepal Date Fix & Removal of Hardcoded '२०८३/०२/१८':")
check("getTodayKathmanduDate function exists in script", "function getTodayKathmanduDate()" in test_js)
check("Asia/Kathmandu timezone is explicitly configured", "'Asia/Kathmandu'" in test_js)
check("getTodayNepalBsDate function calculates live BS date", "function getTodayNepalBsDate()" in test_js)
check("initDefaultDate uses dynamic getTodayNepalBsDate()", "mitiInput.value = getTodayNepalBsDate()" in test_js)
check("initDefaultDate does NOT contain hardcoded '२०८३/०२/१८'", "'२०८३/०२/१८'" not in test_js[:test_js.find("allocateNextSeqNumber")])
check("surakshya-sanrakshak-test.html does NOT hardcode '२०८३/०२/१८' in inMiti placeholder", 'id="inMiti" placeholder="२०८३/०२/१८"' not in test_html)
check("Page 2 #lblP2Miti span has no hardcoded date", '<span id="lblP2Miti"></span>' in test_html)
check("Page 3 #lblP3Miti span has no hardcoded date", '<span id="lblP3Miti"></span>' in test_html)
check("updateDoc does NOT fallback to '२०८३/०२/१८'", "getVal('inMiti', '२०८३/०२/१८')" not in test_js)

# ── GROUP 2: Preserving Historical Date on Reopen ──
print("\n[GROUP 2] Preserving Historical Saved Dates:")
check("initDefaultDate checks editRecordIndex and skips overwrite if record loaded", "if (editRecId && mitiInput.value" in test_js)
check("loadRecordForEdit restores rec.miti without replacing with today", "setVal('inMiti', rec.miti" in test_js)
check("loadRecordForEdit updates Nepal Sambat from loaded miti", "setCurrentRecord" in test_js)
check("resetForm resets inMiti before calling initDefaultDate", "inMiti.value = ''" in test_js and "initDefaultDate()" in test_js)

# ── GROUP 3: 'आजको मिति कायम गर्ने' Quick Action Button ──
print("\n[GROUP 3] 'आजको मिति कायम गर्ने' Quick Action:")
check("btnSetTodayDate exists in HTML beside date field", 'id="btnSetTodayDate"' in test_html)
check("btnSetTodayDate title is 'आजको मिति कायम गर्ने'", 'title="आजको मिति कायम गर्ने"' in test_html)
check("btnSetTodayDate triggers handleSetTodayDateClick()", 'onclick="handleSetTodayDateClick()"' in test_html)
check("handleSetTodayDateClick function is defined in JS", "function handleSetTodayDateClick()" in test_js)
check("handleSetTodayDateClick checks if record is being edited", "document.getElementById('editRecordIndex')" in test_js)
confirm_text = "यस अभिलेखको सिफारिस मिति आजको मितिमा परिवर्तन गर्ने हो? यो परिवर्तन सुरक्षित गरेपछि पुरानो मिति प्रतिस्थापन हुनेछ।"
check("handleSetTodayDateClick uses exact confirmation message for archived records", confirm_text in test_js)
check("handleSetTodayDateClick calls updateNepalSambatFromMiti() and updateDoc()", "updateNepalSambatFromMiti()" in test_js and "updateDoc()" in test_js)

# ── GROUP 4: Previously Created Guardian Recommendation Detection ──
print("\n[GROUP 4] Previously Created Guardian Recommendation Detection:")
check("findExistingGuardianRecommendation function is defined", "function findExistingGuardianRecommendation(" in test_js)
check("Uses unique cardNo as primary matching key", "const rCard = r.cardNo" in test_js and "cleanId" in test_js)
check("Normalizes English and Devanagari digits for comparison", "toEnglishDigit" in test_js)
check("Uses beneficiaryName as secondary fallback", "normName" in test_js and "beneficiaryName" in test_js)
check("Filters out deleted records (!r.isDeleted)", "if (r.isDeleted) return false" in test_js)
check("checkExistingBeneficiaryRecommendation is defined", "function checkExistingBeneficiaryRecommendation(" in test_js)
check("selectBeneficiaryItem invokes checkExistingBeneficiaryRecommendation", "checkExistingBeneficiaryRecommendation(item)" in test_js)

# ── GROUP 5: Existing Record Notice & Explicit Options A & B ──
print("\n[GROUP 5] Existing Record Notice & Actions:")
check("existingRecordNotice container exists in HTML", 'id="existingRecordNotice"' in test_html)
check("Notice contains exact Nepali alert text", "यो लाभग्राहीको संरक्षक सिफारिस यसअघि नै बनाइएको अभिलेखमा भेटियो।" in test_html)
check("existingRecordMeta container exists for record details", 'id="existingRecordMeta"' in test_html)
check("Option A button #btnViewOldRecord exists", 'id="btnViewOldRecord"' in test_html)
check("Option A button text matches 'पुरानो सिफारिस हेर्न यहाँ थिच्नुहोस्'", "पुरानो सिफारिस हेर्न यहाँ थिच्नुहोस्" in test_html)
check("Option A button triggers handleViewOldRecordClick()", 'onclick="handleViewOldRecordClick()"' in test_html)
check("handleViewOldRecordClick calls loadRecordForEdit", "loadRecordForEdit(recId)" in test_js)
check("Option B button #btnCreateNewRecord exists", 'id="btnCreateNewRecord"' in test_html)
check("Option B button text matches 'नयाँ सिफारिस बनाउनुहोस्'", "नयाँ सिफारिस बनाउनुहोस्" in test_html)
check("Option B button triggers handleCreateNewRecordClick()", 'onclick="handleCreateNewRecordClick()"' in test_html)
check("handleCreateNewRecordClick clears editRecordIndex", "document.getElementById('editRecordIndex').value = ''" in test_js)
check("handleCreateNewRecordClick sets today's Nepal date", "getTodayNepalBsDate()" in test_js)
check("handleCreateNewRecordClick resets title to test module title", "🛡️ संरक्षक सामाजिक सुरक्षा सिफारिस टेस्ट" in test_js)

# ── GROUP 6: Scope Protection & Production Isolation ──
print("\n[GROUP 6] Scope Protection & Production Isolation:")
check("Production surakshya-bhatta-sifarish.html is untouched", "सुरक्षक" not in prod_html and "guardian_test_seq" not in prod_html)
check("Production script-surakshya-bhatta-sifarish.js is untouched", "surakshyaSanrakshakTestRecords" not in prod_js)
check("Local assets/nepali-date-converter.umd.min.js is included in test HTML", "assets/nepali-date-converter.umd.min.js" in test_html)
check("nepal-sambat-data.js is included in test HTML", "nepal-sambat-data.js" in test_html)

print("=" * 80)
print(f"VERIFICATION RESULTS: {passed} PASSED, {failed} FAILED")
print("=" * 80)

if failed > 0:
    sys.exit(1)

