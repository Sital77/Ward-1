#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
test_guardian_social_security_test_workflow.py
Comprehensive test suite validating:
- Isolated test recommendation "संरक्षक सामाजिक सुरक्षा सिफारिस टेस्ट"
- Preservation of production recommendation "सामाजिक सुरक्षा भत्ता संरक्षक सिफारिस"
- 3-page order: Page 1 = Bank recommendation, Page 2 = Applicant request, Page 3 = Schedule 2
- Official letterhead on Page 1 only; No logo on Page 2 and Page 3
- Agricultural Development Bank Gauradaha branch (No Prime Commercial Bank)
- Ward No. 1 adaptation throughout (No Ward No. 4)
- Secretary on Left (default: अनिता अधिकारी), Chairperson on Right (Ward 1 config)
- Automatic sequential recommendation number starting at 100
- Single quarter selection and propagation across all 3 pages
- Date automatic generation and preservation on reopen
- Complete removal of broken "बिहे नगरेको प्रमाणित" from active UI while historical data is preserved
"""

import os
import re
import sys

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
print("GUARDIAN SOCIAL SECURITY RECOMMENDATION (TEST PHASE) VALIDATION SUITE")
print("=" * 80)

# ── GROUP 1: File Existence & Production Isolation ──
print("\n[TEST GROUP 1] File Existence & Production Isolation:")
check("surakshya-sanrakshak-test.html exists", os.path.exists("surakshya-sanrakshak-test.html"))
check("script-surakshya-sanrakshak-test.js exists", os.path.exists("script-surakshya-sanrakshak-test.js"))

check("Production surakshya-bhatta-sifarish.html is preserved", os.path.exists("surakshya-bhatta-sifarish.html"))
check("Production script-surakshya-bhatta-sifarish.js is preserved", os.path.exists("script-surakshya-bhatta-sifarish.js"))

prod_html = open("surakshya-bhatta-sifarish.html", encoding="utf-8").read()
check("Production recommendation retains its original display name",
      "सामाजिक सुरक्षा भत्ता संरक्षक सिफारिस" in prod_html and "संरक्षक सामाजिक सुरक्षा सिफारिस टेस्ट" not in prod_html)

# ── GROUP 2: Registry & Navigation Integration ──
print("\n[TEST GROUP 2] System Registry & Navigation Integration:")
index_html = open("index.html", encoding="utf-8").read()
font_settings_js = open("font-settings.js", encoding="utf-8").read()
search_html = open("citizen-search.html", encoding="utf-8").read()
bin_html = open("recycle-bin.html", encoding="utf-8").read()
backup_js = open("backup-manager.js", encoding="utf-8").read()

check("index.html registers exact display name 'संरक्षक सामाजिक सुरक्षा सिफारिस टेस्ट'",
      "'surakshya-sanrakshak-test': 'संरक्षक सामाजिक सुरक्षा सिफारिस टेस्ट'" in index_html)

check("index.html defaultBuiltInList has surakshya-sanrakshak-test",
      "{ id: 'surakshya-sanrakshak-test', title: 'संरक्षक सामाजिक सुरक्षा सिफारिस टेस्ट'" in index_html)

check("index.html order array includes surakshya-sanrakshak-test",
      "'surakshya-sanrakshak-test'" in index_html)

check("font-settings.js maps surakshya-sanrakshak-test to surakshyaSanrakshakTestRecords",
      "'surakshya-sanrakshak-test': { collection: 'surakshyaSanrakshakTestRecords'" in font_settings_js)

check("citizen-search.html includes surakshyaSanrakshakTestRecords",
      "surakshyaSanrakshakTestRecords" in search_html)

check("recycle-bin.html includes surakshyaSanrakshakTestRecords",
      "surakshyaSanrakshakTestRecords" in bin_html)

check("backup-manager.js backs up surakshyaSanrakshakTestRecords",
      "'surakshyaSanrakshakTestRecords'" in backup_js)

# ── GROUP 3: Obsolete Broken Marriage Recommendation Removal ──
print("\n[TEST GROUP 3] Removal of Broken 'बिहे नगरेको प्रमाणित':")
check("index.html filters out broken/obsolete marriage recommendations",
      "t.title.includes('बिहे नगरेको') || t.title.includes('विवाह नगरेको')" in index_html)

check("Active defaultBuiltInList does not contain obsolete marriage module",
      "arko-bibaha" not in index_html and "bihe-nagareko" not in index_html)

check("Valid recommendations अविवाहित प्रमाणित and विवाह प्रमाणित remain active",
      "'abibahit-pramanit': 'अविवाहित प्रमाणित'" in index_html and
      "'bibaha-pramanit': 'विवाह प्रमाणित'" in index_html)

# ── GROUP 4: Three-Page Order & Structural Validation ──
print("\n[TEST GROUP 4] Exact Three-Page Order & Structural Layout:")
test_html = open("surakshya-sanrakshak-test.html", encoding="utf-8").read()
test_js = open("script-surakshya-sanrakshak-test.js", encoding="utf-8").read()

# Check page order in HTML
p1_pos = test_html.find('id="page1"')
p2_pos = test_html.find('id="page2"')
p3_pos = test_html.find('id="page3"')

check("All 3 pages exist in DOM", p1_pos != -1 and p2_pos != -1 and p3_pos != -1)
check("Page 1 precedes Page 2", p1_pos < p2_pos)
check("Page 2 precedes Page 3", p2_pos < p3_pos)

# Page 1: Bank recommendation (बैंकलाई दिने सिफारिस)
p1_content = test_html[p1_pos:p2_pos]
check("Page 1 has official letterhead", "custom-svg-letterhead" in p1_content)
check("Page 1 is addressed to Agricultural Development Bank Gauradaha",
      "कृषि विकास बैंक लिमिटेड" in p1_content and "शाखा कार्यालय, गौरादह, झापा" in p1_content)
check("Page 1 contains no Prime Commercial Bank", "प्राईम" not in p1_content and "Prime" not in p1_content)
check("Page 1 contains no Ward No. 4 references", "वडा नं. ४" not in p1_content and "वडा नं. ०४" not in p1_content)
check("Page 1 has Secretary signature on LEFT and Chairperson on RIGHT",
      "lblP1SecName" in p1_content and "lblP1ChairName" in p1_content and
      p1_content.find("lblP1SecName") < p1_content.find("lblP1ChairName"))

# Page 2: Applicant's request (सेवाग्राहीले दिने निवेदन)
p2_content = test_html[p2_pos:p3_pos]
check("Page 2 has NO official letterhead", "custom-svg-letterhead" not in p2_content)
check("Page 2 is addressed to Ward 1 Chairperson",
      "गौरादह नगरपालिका, वडा नं. १ को कार्यालय" in p2_content)
check("Page 2 contains no Prime Commercial Bank", "प्राईम" not in p2_content and "Prime" not in p2_content)
check("Page 2 contains no Ward No. 4 references", "वडा नं. ४" not in p2_content and "वडा नं. ०४" not in p2_content)
check("Page 2 has blank applicant signature field",
      "निवेदक (संरक्षक) को दस्तखत" in p2_content)

# Page 3: Schedule 2 (अनुसूची–२: संरक्षक सिफारिस)
p3_content = test_html[p3_pos:]
check("Page 3 has NO official letterhead", "custom-svg-letterhead" not in p3_content)
check("Page 3 heading is अनुसूची–२", "अनुसूची–२" in p3_content and "दफा ३ को उपदफा (७)" in p3_content)
check("Page 3 has recommendation number and date meta bar",
      "lblP3RecNo" in p3_content and "lblP3Miti" in p3_content)
check("Page 3 office is Ward No. 1 Gauradaha Jhapa",
      "गौरादह नगरपालिका, वडा नं. १ को कार्यालय" in p3_content)
check("Page 3 contains no Ward No. 4 or Durga Mani Basnet",
      "वडा नं. ४" not in p3_content and "दुर्गामणी" not in p3_content)

# ── GROUP 5: Recommendation Numbering (Starting at 100) ──
print("\n[TEST GROUP 5] Sequential Recommendation Numbering (Starts at 100):")
check("Sequence allocator defaults to 100",
      "let nextSeq = 100" in test_js)
check("Sequence allocator increments atomically",
      "nextSeq = data.currentSeq + 1" in test_js or "nextSeq = fallbackSeq" in test_js)
check("Counter document uses persistent collection sifarish_counters/guardian_test_seq",
      "sifarish_counters" in test_js and "guardian_test_seq" in test_js)
check("Sequential number is synchronized to Page 1 and Page 3",
      "lblP1RecNo" in test_js and "lblP3RecNo" in test_js)
check("Existing records preserve their saved recommendation number on edit/reopen",
      "existing.recommendationNo" in test_js)

# ── GROUP 6: Single Quarter Rule Enforcement ──
print("\n[TEST GROUP 6] Single Quarter Rule Enforcement:")
check("HTML provides single-select quarter dropdown with 4 quarters",
      'id="selQuarter"' in test_html and "प्रथम त्रैमासिक" in test_html and "चतुर्थ त्रैमासिक" in test_html)
check("No multi-quarter or cumulative quarters in single select",
      "त्रैमासिकसम्म" not in test_html)
check("JavaScript synchronizes single selected quarter to Page 1, Page 2 and Page 3",
      "lblP1Quarter" in test_js and "lblP2Quarter" in test_js)

# ── GROUP 7: Date Handling & Automatic Population ──
print("\n[TEST GROUP 7] Date Handling & Nepal Sambat:")
check("Date initializes from NepaliFunctions.GetCurrentBsDate()",
      "NepaliFunctions.GetCurrentBsDate" in test_js)
check("Nepal Sambat calculates from nepal-sambat-tithi.js",
      "getOfficialNepalSambatTithi" in test_js)
check("Saved date is preserved when loading record for edit",
      "setVal('inMiti', rec.miti" in test_js)

# ── GROUP 8: Ward Secretary Default & Chairperson Config ──
print("\n[TEST GROUP 8] Ward Secretary Default & Chairperson Config:")
check("Ward Secretary defaults to 'अनिता अधिकारी'",
      "अनिता अधिकारी" in test_html and "वडा सचिव" in test_html)
check("Ward Chairperson uses existing Ward 1 configuration",
      "inSignAuthority" in test_html and "नगेन्द्र भण्डारी" in test_html)
check("Acting chairpersons supported in Ward 1 options",
      "कार्यवाहक वडा अध्यक्ष" in test_html)

# ── GROUP 9: Print Styles & Tab Selector ──
print("\n[TEST GROUP 9] Print Styles & Tab Navigation:")
check("HTML has preview tab buttons for 1. बैंक सिफारिस, 2. निवेदन, 3. अनुसूची–२, and All",
      "tabBtnP1" in test_html and "tabBtnP2" in test_html and "tabBtnP3" in test_html and "tabBtnAll" in test_html)
check("CSS enforces page-break-after: always for printing exactly 3 pages",
      "page-break-after: always" in test_html)
check("Print-all and single-page print workflows supported",
      "printSingleCurrentPage" in test_js and "printAndSaveSystem" in test_js)

# ── GROUP 10: Refinements, Typography, Spacing & Secretary Toggle ──
print("\n[TEST GROUP 10] Layout Refinements, Typography & Secretary Toggle Validation:")

# 1. Secretary toggle checkbox in input panel
check("Secretary toggle checkbox (chkShowSecretary) exists in HTML",
      "chkShowSecretary" in test_html)
check("Label 'वडा सचिवको हस्ताक्षर देखाउने' is present in HTML",
      "वडा सचिवको हस्ताक्षर देखाउने" in test_html)
check("Secretary toggle defaults to ON (checked)",
      'id="chkShowSecretary" checked' in test_html or 'checked' in re.search(r'<input[^>]*id="chkShowSecretary"[^>]*>', test_html).group(0))

# 2. Secretary toggle CSS & JavaScript
check("JavaScript defines toggleSecretaryVisibility()",
      "toggleSecretaryVisibility" in test_js)
check("CSS contains rule to hide secretary signature block",
      "body.hide-p1-secretary #p1SecSignatureBlock" in test_html)
check("CSS ensures chairperson remains right-aligned when secretary signature is hidden",
      "body.hide-p1-secretary #p1ChairSignatureBlock" in test_html and "margin-left: auto" in test_html)
check("showSecretary preference is saved with recommendation record",
      "showSecretary:" in test_js or "showSecretary :" in test_js)
check("Saved showSecretary preference is restored when reopening record",
      "rec.showSecretary" in test_js)

# 3. Removal of checklist from editor panel
check("Editor panel removes 'संलग्न कागजातहरूको चेकलिस्ट'",
      "संलग्न कागजातहरूको चेकलिस्ट" not in test_html and "संलग्न कागजातहरू (चेकलिस्ट)" not in test_html)
check("Editor panel removes unused chkDoc1 checkbox",
      "chkDoc1" not in test_html)

# 4. Retention of document list on Page 2 (Applicant's application)
page2_section = test_html[test_html.find('id="page2"'):test_html.find('id="page3"')]
check("Printed Page 2 (निवेदन) retains its intended supporting-document list",
      "संलग्न कागजातहरू :" in page2_section)
check("Page 2 document list items preserved",
      "निवेदक (संरक्षक) को नागरिकताको प्रतिलिपि" in page2_section)

# 5. Page 2 Applicant Signature
check("Page 2 has applicant signature label",
      "निवेदक (संरक्षक) को दस्तखत" in page2_section)
check("Page 2 applicant signature label is placed ABOVE the signature line",
      page2_section.find("निवेदक (संरक्षक) को दस्तखत") < page2_section.find("border-top: 1.5px dashed"))

# 6. Page 3 Schedule 2 enlarged thumbprint and stamp boxes
page3_section = test_html[test_html.find('id="page3"'):]
check("Schedule 2 has dedicated blank boxes for signing and stamping",
      "guardian-sig-box" in page3_section or "schedule2-blank-box" in page3_section)
check("Schedule 2 signature/stamp areas are enlarged (85px height)",
      "85px" in page3_section)
check("Guardian signature area has NO printed placeholder text inside",
      "(हस्ताक्षर / औंठाछापको लागि खाली स्थान)" not in page3_section)
check("Ward office stamp area has NO printed placeholder text inside",
      "(कार्यालयको छापका लागि खाली स्थान)" not in page3_section)

# 7. Page 1 Typography & Spacing
page1_section = test_html[test_html.find('id="page1"'):test_html.find('id="page2"')]
check("Page 1 bank recipient uses standardized spacing class",
      "p1-bank-recipient" in page1_section)
check("Page 1 subject uses standardized spacing wrapper",
      "p1-subject-wrapper" in page1_section)
check("Template integrates --doc-font-size token",
      "--doc-font-size" in test_html)
check("Template integrates --subject-font-size token",
      "--subject-font-size" in test_html)
check("Template integrates --table-font-size token",
      "--table-font-size" in test_html)
check("Template integrates --sig-font-size token",
      "--sig-font-size" in test_html)

# 8. Plain neutral payment period styling
check("Payment period uses plain neutral background",
      ".period-section" in test_html and "background: #ffffff" in test_html)
check("Overly colorful #c05621 removed from payment period section",
      "#c05621" not in test_html)

print("\n" + "=" * 80)
print(f"TEST RESULTS: {passed} PASSED, {failed} FAILED")
print("=" * 80)

if failed > 0:
    sys.exit(1)
