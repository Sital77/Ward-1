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
check("Page 1 has Chairperson signature on RIGHT and NO Secretary signature block",
      "lblP1ChairName" in p1_content and "lblP1SecName" not in p1_content and "p1SecSignatureBlock" not in p1_content)

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

# ── GROUP 8: Signatory Configuration (Ward Chairperson Only) ──
print("\n[TEST GROUP 8] Ward Chairperson Configuration & Secretary Removal:")
check("Ward Secretary is completely removed from signatory config",
      "inSecretarySelect" not in test_html and "chkShowSecretary" not in test_html and "अनिता अधिकारी" not in test_html)
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

# ── GROUP 10: Refinements, Typography, Spacing & Duplicate Removal ──
print("\n[TEST GROUP 10] Layout Refinements, Typography & Duplicate Removal:")

# 1. Removal of duplicate bank fields from form panel
check("Separate duplicate bank name input field (inBankName) is removed from UI",
      'id="inBankName"' not in test_html)
check("Separate duplicate bank branch input field (inBankBranch) is removed from UI",
      'id="inBankBranch"' not in test_html)

# 2. Bank Heading printed on Page 1
page1_section = test_html[test_html.find('id="page1"'):test_html.find('id="page2"')]
check("Bank heading line 1 has 'श्री कृषि विकास बैंक लिमिटेड' and is bold",
      "<strong>श्री कृषि विकास बैंक लिमिटेड</strong>" in page1_section)
check("Bank heading line 2 has 'शाखा कार्यालय, गौरादह, झापा' and is bold",
      "<strong>शाखा कार्यालय, गौरादह, झापा</strong>" in page1_section)
check("Page 1 bank recipient uses standardized spacing class",
      "p1-bank-recipient" in page1_section)
check("Bank recipient has gap after bank name before branch line",
      ".p1-bank-recipient .bank-name-line" in test_html and "margin-bottom: 4px" in test_html)
check("Bank recipient block has 2-3 spacing units (24px) margin-bottom before subject",
      ".p1-bank-recipient" in test_html and "margin-bottom: 24px" in test_html)

# 3. Subject Typography & Shared Base Font Size
check("Subject label 'विषय:' is bold (font-weight: 700)",
      ".p1-subject-wrapper .subject-label" in test_html and "font-weight: 700" in test_html)
check("Subject label 'विषय:' is red (#e51a23)",
      "color: #e51a23" in test_html)
check("Subject line text has regular font-weight (font-weight: 400)",
      ".p1-subject-wrapper .subject-line" in test_html and "font-weight: 400" in test_html and
      ".p1-subject-wrapper #lblSubject" in test_html)
check("Subject label and subject text share exact same font-size (--doc-font-size, 13pt)",
      ".p1-subject-wrapper .subject-label" in test_html and
      ".p1-subject-wrapper #lblSubject" in test_html and
      "font-size: var(--doc-font-size, 13pt)" in test_html)
check("Subject line has no underline or bottom border",
      "text-decoration: none !important" in test_html and "border-bottom: none !important" in test_html)
check("Subject wrapper has consistent gap below subject before body",
      ".p1-subject-wrapper" in test_html and "margin: 14px 0 18px 0" in test_html)

# 4. Removal of checklist from editor panel
check("Editor panel removes 'संलग्न कागजातहरूको चेकलिस्ट'",
      "संलग्न कागजातहरूको चेकलिस्ट" not in test_html and "संलग्न कागजातहरू (चेकलिस्ट)" not in test_html)
check("Editor panel removes unused chkDoc1 checkbox",
      "chkDoc1" not in test_html)

# 5. Retention of document list on Page 2 (Applicant's application)
page2_section = test_html[test_html.find('id="page2"'):test_html.find('id="page3"')]
check("Printed Page 2 (निवेदन) retains its intended supporting-document list",
      "संलग्न कागजातहरू :" in page2_section)
check("Page 2 document list items preserved",
      "निवेदक (संरक्षक) को नागरिकताको प्रतिलिपि" in page2_section)

# 6. Page 2 Applicant Signature
check("Page 2 has applicant signature label",
      "निवेदक (संरक्षक) को दस्तखत" in page2_section)
check("Page 2 applicant signature label is placed ABOVE the signature line",
      page2_section.find("निवेदक (संरक्षक) को दस्तखत") < page2_section.find("border-top: 1.5px dashed"))

# 7. Page 3 Schedule 2 enlarged thumbprint and stamp boxes
page3_section = test_html[test_html.find('id="page3"'):]
check("Schedule 2 has dedicated blank boxes for signing and stamping",
      "guardian-sig-box" in page3_section or "schedule2-blank-box" in page3_section)
check("Schedule 2 signature/stamp areas are enlarged (85px height)",
      "85px" in page3_section)
check("Guardian signature area has NO printed placeholder text inside",
      "(हस्ताक्षर / औंठाछापको लागि खाली स्थान)" not in page3_section)
check("Ward office stamp area has NO printed placeholder text inside",
      "(कार्यालयको छापका लागि खाली स्थान)" not in page3_section)

# 8. Plain neutral payment period styling
check("Payment period uses plain neutral background",
      ".period-section" in test_html and "background: #ffffff" in test_html)
check("Overly colorful #c05621 removed from payment period section",
      "#c05621" not in test_html)

# ── GROUP 11: Chairperson Slider & Draggable Specimen Box ──
print("\n[TEST GROUP 11] Chairperson Slider & Draggable Specimen Box:")

# 1. Chairperson Vertical Slider
check("Secretary position slider (sliderSecPosY) is completely removed",
      'id="sliderSecPosY"' not in test_html and "badgeSecPosY" not in test_html)
check("Chairperson position slider (sliderChairPosY) exists in HTML",
      'id="sliderChairPosY"' in test_html)
check("Chairperson slider has label 'वडा अध्यक्षको हस्ताक्षर स्थान (माथि/तल)'",
      "वडा अध्यक्षको हस्ताक्षर स्थान (माथि/तल)" in test_html)
check("Badge displays badgeChairPosY exists with mm unit",
      'id="badgeChairPosY"' in test_html and "0 mm" in test_html)
check("Reset option 'पूर्वनिर्धारित स्थानमा फर्काउनुहोस्' exists for Chairperson",
      "resetChairPosition" in test_html and "पूर्वनिर्धारित स्थानमा फर्काउनुहोस्" in test_html)
check("Chairperson slider allows meaningful upward movement (min <= -50)",
      re.search(r'id="sliderChairPosY"[^>]*min="(-\d+)"', test_html) and
      int(re.search(r'id="sliderChairPosY"[^>]*min="(-\d+)"', test_html).group(1)) <= -50)
check("Chairperson slider allows controlled downward movement (max >= 20)",
      re.search(r'id="sliderChairPosY"[^>]*max="(\d+)"', test_html) and
      int(re.search(r'id="sliderChairPosY"[^>]*max="(\d+)"', test_html).group(1)) >= 20)
check("JavaScript defines onChairPosYChange and resetChairPosition",
      "function onChairPosYChange" in test_js and "function resetChairPosition" in test_js)
check("chairpersonPosY is saved with recommendation record",
      "chairpersonPosY:" in test_js)
check("chairpersonPosY is restored when editing a record",
      "rec.chairpersonPosY" in test_js)
check("resetForm resets chairperson slider to default",
      "resetChairPosition()" in test_js)
check("Print CSS includes transform rule for chairperson",
      "@media print" in test_html and "transform: translateY(var(--chair-sig-offset-y" in test_html)

# 2. Draggable Specimen Signature Box
check("Tapasil and Specimen Signature are arranged in a side-by-side flex row",
      ".tapasil-specimen-row" in test_html and "display: flex" in test_html and
      "justify-content: space-between" in test_html and "align-items: flex-start" in test_html)
check("Tapasil heading remains left-aligned",
      ".p1-tapasil-title" in test_html and "text-align: left" in test_html)
check("Specimen signature card is on the right side of tapasil",
      "specimen-signature-container" in test_html and "specimen-signature-card" in test_html and
      "align-items: flex-end" in test_html)
check("Specimen signature box is clearly labelled 'नमुना दस्तखत'",
      "specimen-signature-title" in test_html and "नमुना दस्तखत" in test_html)
check("Specimen signature card has bordered rectangle and dedicated signing space",
      ".specimen-signature-card" in test_html and "border: 1.5px solid #000000" in test_html and
      ".specimen-signature-box" in test_html and "height: 18mm" in test_html)
check("Specimen signature card is styled with grab cursor and position relative",
      ".specimen-signature-card" in test_html and "cursor: grab" in test_html and "position: relative" in test_html)
check("Specimen signature row preserves all recipient detail labels on left",
      "lblP1TblBeneficiaryName" in test_html and "lblP1TblCardNo" in test_html and
      "lblP1TblAccountNo" in test_html and "lblP1TblGuardianName" in test_html)
check("JavaScript defines applySpecimenBoxLayout and resetSpecimenBoxLayout",
      "function applySpecimenBoxLayout" in test_js and "function resetSpecimenBoxLayout" in test_js)
check("JavaScript defines initSpecimenBoxDraggable for mouse and touch drag",
      "function initSpecimenBoxDraggable" in test_js and "mousedown" in test_js and "touchstart" in test_js)
check("Draggable handler supports horizontal (X) and vertical (Y) movement",
      "deltaX_mm" in test_js and "deltaY_mm" in test_js)
check("specimenSigPosX and specimenSigPosY are saved with recommendation record",
      "specimenSigPosX:" in test_js and "specimenSigPosY:" in test_js)
check("specimenSigPosX and specimenSigPosY are restored when editing a record",
      "rec.specimenSigPosX" in test_js and "rec.specimenSigPosY" in test_js)
check("resetForm resets specimen box layout to default",
      "resetSpecimenBoxLayout()" in test_js)
check("Reset button exists in UI for specimen signature box",
      "resetSpecimenBoxLayout()" in test_html and "पूर्वनिर्धारित स्थानमा फर्काउनुहोस्" in test_html)

# ── GROUP 12: Ward Chairperson Signature Controls & Resizable Specimen Box ──
print("\n[TEST GROUP 12] Ward Chairperson Signature Controls & Resizable Specimen Box:")

# 1. Signature Appearance Controls
check("Signature line style selector (selChairSigLineStyle) exists in HTML",
      'id="selChairSigLineStyle"' in test_html)
check("Signature line style selector supports dashed, dotted, solid, and none",
      'value="dashed"' in test_html and 'value="dotted"' in test_html and
      'value="solid"' in test_html and 'value="none"' in test_html)
check("Signature line width slider (sliderChairSigLineWidth) and numeric input exist",
      'id="sliderChairSigLineWidth"' in test_html and 'id="numChairSigLineWidth"' in test_html)
check("Officer name font size slider (sliderChairSigFontSize) and numeric input exist",
      'id="sliderChairSigFontSize"' in test_html and 'id="numChairSigFontSize"' in test_html)
check("Reset button for Chairperson signature settings exists in UI",
      "resetChairSignatureSettings()" in test_html)
check("CSS uses dedicated --officer-name-gap of approximately 6-7px (6.5px)",
      "--officer-name-gap" in test_html and "6.5px" in test_html)
check("JavaScript defines applyChairSigSettings, onChairSigLineStyleChange, onChairSigLineWidthChange, onChairSigFontSizeChange",
      "function applyChairSigSettings" in test_js and
      "function onChairSigLineStyleChange" in test_js and
      "function onChairSigLineWidthChange" in test_js and
      "function onChairSigFontSizeChange" in test_js)
check("Chairperson signature settings are stored and restored in localStorage",
      "CHAIR_SIG_STORAGE_KEY" in test_js and "loadStoredChairSigSettings" in test_js)
check("Chairperson signature settings persist with record on save",
      "chairSigLineStyle:" in test_js and "chairSigLineWidth:" in test_js and "chairSigFontSize:" in test_js)
check("Chairperson signature settings are restored when record is reopened",
      "rec.chairSigLineStyle" in test_js and "rec.chairSigLineWidth" in test_js and "rec.chairSigFontSize" in test_js)
check("resetForm resets chairperson signature settings to defaults",
      "resetChairSignatureSettings()" in test_js)

# 2. Resizable Specimen Box Controls
check("Specimen box width slider (sliderSigWidth) and numeric input exist",
      'id="sliderSigWidth"' in test_html and 'id="numSigWidth"' in test_html)
check("Specimen box height slider (sliderSigHeight) and numeric input exist",
      'id="sliderSigHeight"' in test_html and 'id="numSigHeight"' in test_html)
check("Specimen box horizontal pos slider (sliderSigPosX) and numeric input exist",
      'id="sliderSigPosX"' in test_html and 'id="numSigPosX"' in test_html)
check("Specimen box vertical pos slider (sliderSigPosY) and numeric input exist",
      'id="sliderSigPosY"' in test_html and 'id="numSigPosY"' in test_html)
check("Specimen box badge indicators exist for width, height, posX, posY",
      'id="badgeSigWidth"' in test_html and 'id="badgeSigHeight"' in test_html and
      'id="badgeSigPosX"' in test_html and 'id="badgeSigPosY"' in test_html)
check("JavaScript defines onSigBoxLayoutSlider and onSigBoxLayoutInput handlers",
      "function onSigBoxLayoutSlider" in test_js and "function onSigBoxLayoutInput" in test_js)
check("validateSpecimenDimensions supports flexible width, height, posX, and posY",
      "minWidth" in test_js and "maxWidth" in test_js and "minHeight" in test_js and "maxHeight" in test_js)
check("applySpecimenBoxLayout dynamically sets width on card and height on box",
      "card.style.width" in test_js and "box.style.height" in test_js)
check("specimenSigWidth and specimenSigHeight persist with recommendation record",
      "specimenSigWidth:" in test_js and "specimenSigHeight:" in test_js)
check("specimenSigWidth and specimenSigHeight are restored when record is reopened",
      "rec.specimenSigWidth" in test_js and "rec.specimenSigHeight" in test_js)

# ── GROUP 13: UI/UX Refinement: Responsive Dash, Horizontal Position & Beneficiary List ──
print("\n[TEST GROUP 13] Refined UI/UX, Responsive Signature Dash & Beneficiary List:")

# 1. Responsive Signature Dash Line
check("Signature block wraps line and officer name in responsive .p1-sig-inner container",
      ".p1-sig-inner" in test_html and 'id="p1SigLine"' in test_html)
check("Signature dash line has 100% responsive width inside fit-content container",
      ".p1-sig-line" in test_html and "width: 100%" in test_html)
check("JavaScript defines adjustChairSignatureLine to dynamically adapt line to officer name width",
      "function adjustChairSignatureLine" in test_js and "nameEl.offsetWidth" in test_js)
check("updateDoc invokes adjustChairSignatureLine when officer changes",
      "adjustChairSignatureLine();" in test_js)

# 2. Horizontal Signature Positioning
check("Compact horizontal signature position slider (sliderChairPosX) exists in HTML",
      'id="sliderChairPosX"' in test_html and 'id="badgeChairPosX"' in test_html)
check("JavaScript defines onChairPosXChange handler",
      "function onChairPosXChange" in test_js)
check("chairpersonPosX is persisted with recommendation record",
      "chairpersonPosX:" in test_js)
check("chairpersonPosX is restored when record is reopened",
      "rec.chairpersonPosX" in test_js)
check("Transform applies directly to signature block as one cohesive unit",
      "translate(${posX}mm, ${posY}mm)" in test_js or "translate(" in test_html)

# 3. Clean Beneficiary List & Loading State
check("preIndexBeneficiaryItem indexes name, cardNo, accountNo, and allowanceType",
      "function preIndexBeneficiaryItem" in test_js and "nameNorm:" in test_js)
check("Beneficiary search separates person name and registration number cleanly",
      "दर्ता नं:" in test_js and "word-break: break-word" in test_js)
check("Beneficiary search shows loading state when data is pending",
      "दर्ता सूची लोड हुँदैछ" in test_js)
check("Beneficiary search provides clear empty state message",
      "कुनै लाभग्राही फेला परेन" in test_js)
check("Section cards use clean, restrained styling without high-saturation backgrounds",
      "rgba(43, 108, 176, 0.06)" not in test_html and "rgba(56, 161, 105, 0.06)" not in test_html)

print("\n" + "=" * 80)
print(f"TEST RESULTS: {passed} PASSED, {failed} FAILED")
print("=" * 80)

if failed > 0:
    sys.exit(1)

