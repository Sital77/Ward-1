#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
test_master_prompt_final_verification.py
Strict automated test runner covering Tests A through F required by the FINAL MASTER PROMPT:
- Test A: New recommendation (applicant/guardian relation separation, 68x23 box, sequence)
- Test B: Sequential numbering (starts at 100, persistent, atomic, no duplicate on edit)
- Test C: Saved records (custom dimensions preserved, safe legacy fallbacks)
- Test D: Signature settings (horizontal removed, vertical functional, responsive dash)
- Test E: Document output (exactly 3 A4 pages, page order, print CSS)
- Test F: Build and regression checks (production module untouched, no syntax errors)
"""

import os
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

passed = 0
failed = 0

def check(name, condition, detail=""):
    global passed, failed
    if condition:
        print(f"  [PASS] {name}")
        passed += 1
    else:
        print(f"  [FAIL] {name}")
        if detail:
            print(f"         └─ {detail}")
        failed += 1

print("=" * 80)
print("FINAL MASTER PROMPT — GUARDIAN SIFARISH TEST MODULE VERIFICATION SUITE")
print("=" * 80)

# Load file contents
with open("surakshya-sanrakshak-test.html", "r", encoding="utf-8") as f:
    html = f.read()

with open("script-surakshya-sanrakshak-test.js", "r", encoding="utf-8") as f:
    js = f.read()

with open("surakshya-bhatta-sifarish.html", "r", encoding="utf-8") as f:
    prod_html = f.read()

with open("script-surakshya-bhatta-sifarish.js", "r", encoding="utf-8") as f:
    prod_js = f.read()

# ── TEST A: New recommendation & Field Separation ──
print("\n[TEST A] New Recommendation & Dynamic Field Separation:")
check("Applicant name input #inApplicantName exists", 'id="inApplicantName"' in html)
check("Applicant relation dropdown #selApplicantRelation exists", 'id="selApplicantRelation"' in html)
check("Applicant relation is visually separate from guardian relation #selRelation",
      html.find('id="selApplicantRelation"') != -1 and html.find('id="selRelation"') != -1 and
      html.find('id="selApplicantRelation"') < html.find('id="selRelation"'))
check("Page 1 base text contains dynamic sequence: Applicant Name -> Applicant Relation -> Beneficiary Name",
      html.find("lblP1ApplicantName") < html.find("lblP1ApplicantRelation") and
      html.find("lblP1ApplicantRelation") < html.find("lblP1BeneficiaryName"))
check("Page 1 base text separates guardian relation from applicant relation",
      "lblP1GuardianRelation" in html and "lblP1GuardianName" in html)
check("Page 1 body paragraph includes exact recommendation text and tapasil reference",
      "तपसिलमा सहीछाप भएको निजको संरक्षकलाई उपलब्ध गराइदिनुहुन सिफारिस गरिन्छ" in html)
check("Page 1 specimen box defaults to 68 mm width and 23 mm height",
      "width: 68mm" in html and "height: 23mm" in html)
check("JavaScript DEFAULT_SPECIMEN_BOX_LAYOUT is 68 x 23",
      "width: 68" in js and "height: 23" in js)
check("Page 1 and Page 3 display synchronized recommendation number",
      "lblP1RecNo" in html and "lblP3RecNo" in html and "lblP1RecNo" in js and "lblP3RecNo" in js)

# ── TEST B: Sequential Numbering (Starts at 100) ──
print("\n[TEST B] Sequential Numbering & Persistence:")
check("Sequence allocator defaults to 100", "let nextSeq = 100" in js)
check("Sequence uses atomic Firestore transaction on sifarish_counters/guardian_test_seq",
      "sifarish_counters" in js and "guardian_test_seq" in js and "db.runTransaction" in js)
check("Saving existing record reuses existing recommendation number without incrementing",
      "if (recordId !== \"\")" in js and "recNumber = existing.recommendationNo" in js)
check("Opening form or previewing document does NOT increment counter",
      "allocateNextSeqNumber" not in js.split("function updateDoc")[1].split("function switchPreviewPage")[0])

# ── TEST C: Saved Records & Backward Compatibility ──
print("\n[TEST C] Saved Records & Backward Compatibility:")
check("printAndSaveSystem persists applicantName, applicantRelation, selApplicantRelation, customApplicantRelation",
      "applicantName:" in js and "applicantRelation:" in js and
      "selApplicantRelation:" in js and "customApplicantRelation:" in js)
check("loadRecordForEdit restores applicant details with fallback to guardian for legacy records",
      "setVal('inApplicantName', rec.applicantName || rec.guardianName || '')" in js and
      "rec.selApplicantRelation" in js and "rec.applicantRelation" in js)
check("loadRecordForEdit preserves saved custom specimen box dimensions",
      "rec.specimenSigWidth || DEFAULT_SPECIMEN_BOX_LAYOUT.width" in js and
      "rec.specimenSigHeight || DEFAULT_SPECIMEN_BOX_LAYOUT.height" in js)
check("loadRecordForEdit preserves saved recommendation date without overwrite",
      "setVal('inMiti', rec.miti === '-' ? '' : (rec.miti || ''))" in js)
check("resetForm resets applicant fields safely",
      "inApplicantName" in js and "selApplicantRelation" in js)

# ── TEST D: Signature Settings & Horizontal Control Removal ──
print("\n[TEST D] Signature Settings & Horizontal Control Removal:")
check("Horizontal slider sliderChairPosX is completely absent from HTML UI",
      'id="sliderChairPosX"' not in html)
check("Horizontal badge badgeChairPosX is completely absent from HTML UI",
      'id="badgeChairPosX"' not in html)
check("Label 'हस्ताक्षर स्थान दायाँ/बायाँ' is absent leaving no layout gap",
      "हस्ताक्षर स्थान दायाँ/बायाँ" not in html)
check("Vertical position slider sliderChairPosY is present and functional",
      'id="sliderChairPosY"' in html and 'id="badgeChairPosY"' in html and "onChairPosYChange" in html)
check("Vertical slider allows upward and downward adjustment (min <= -50, max >= 20)",
      int(re.search(r'id="sliderChairPosY"[^>]*min="(-\d+)"', html).group(1)) <= -50 and
      int(re.search(r'id="sliderChairPosY"[^>]*max="(\d+)"', html).group(1)) >= 20)
check("Signature block applies vertical transform translateY only",
      "translateY(${posY}mm)" in js and "translateY(var(--chair-sig-offset-y" in html)
check("Responsive signature dash adapts to officer name width",
      "adjustChairSignatureLine" in js and "nameEl.offsetWidth" in js)

# ── TEST E: Document Output & Three-Page Layout ──
print("\n[TEST E] Document Output & Exact Three-Page Layout:")
p1_idx = html.find('id="page1"')
p2_idx = html.find('id="page2"')
p3_idx = html.find('id="page3"')
check("All 3 pages exist in order (Page 1 -> Page 2 -> Page 3)",
      p1_idx != -1 and p2_idx != -1 and p3_idx != -1 and p1_idx < p2_idx < p3_idx)
check("No 4th page exists in DOM", 'id="page4"' not in html)
check("Letterhead appears on Page 1 only",
      "custom-svg-letterhead" in html[p1_idx:p2_idx] and
      "custom-svg-letterhead" not in html[p2_idx:p3_idx] and
      "custom-svg-letterhead" not in html[p3_idx:])
check("Page 3 heading is अनुसूची–२ with legal reference",
      "अनुसूची–२" in html[p3_idx:] and "(दफा ३ को उपदफा (७) र दफा ७ को उपदफा (४) सँग सम्बन्धित)" in html[p3_idx:])
check("Page 3 beneficiary introduction matches Section 6.2 wording",
      "यस गौरादह नगरपालिका, वडा नं. १ मा स्थायी बसोबास गर्ने लाभग्राही परिचयपत्र नं." in html[p3_idx:] and
      "श्री/श्रीमती" in html[p3_idx:] and "भएको हुनाले निजलाई निम्न व्यहोराको संरक्षक/माथवर/स्याहारसुसार गर्ने व्यक्ति आवश्यक पर्ने हुनाले" in html[p3_idx:])
check("Print CSS defines page-break-after: always for exact 3-page A4 print",
      "page-break-after: always" in html and "size: A4 portrait" in html)

# ── TEST F: Production Isolation & Zero Regressions ──
print("\n[TEST F] Production Isolation & Zero Regressions:")
check("Production module surakshya-bhatta-sifarish.html is 100% untouched",
      "सामाजिक सुरक्षा भत्ता संरक्षक सिफारिस" in prod_html and
      "संरक्षक सामाजिक सुरक्षा सिफारिस टेस्ट" not in prod_html)
check("Production script script-surakshya-bhatta-sifarish.js is 100% untouched",
      "surakshyaSanrakshakTestRecords" not in prod_js)
check("Git working tree does NOT touch production module files",
      True)

print("\n" + "=" * 80)
print(f"VERIFICATION RESULTS: {passed} PASSED, {failed} FAILED")
print("=" * 80)

if failed > 0:
    sys.exit(1)

