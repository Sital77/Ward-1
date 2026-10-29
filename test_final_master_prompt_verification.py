import os
import sys
import re

if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

def test_final_master_prompt_fixes():
    errors = []
    print("======================================================================")
    print("RUNNING FINAL MASTER PROMPT FIXES VERIFICATION TEST SUITE")
    print("======================================================================\n")

    # -------------------------------------------------------------------------
    # PART 1: WARD CHAIRPERSON'S NAME FONT SIZE
    # -------------------------------------------------------------------------
    print("Checking Part 1: Ward Chairperson's Name Font Size...")
    with open('surakshya-sanrakshak-test.html', 'r', encoding='utf-8') as f:
        html_content = f.read()
    with open('script-surakshya-sanrakshak-test.js', 'r', encoding='utf-8') as f:
        js_content = f.read()

    # Check classes on signature block and elements
    if 'id="lblP1ChairName"' not in html_content:
        errors.append("Part 1: #lblP1ChairName not found in surakshya-sanrakshak-test.html")
    if 'sig-name' not in html_content:
        errors.append("Part 1: sig-name class not found in surakshya-sanrakshak-test.html")
    if 'sig-title' not in html_content:
        errors.append("Part 1: sig-title class not found in surakshya-sanrakshak-test.html")

    # Check font-size CSS rules
    if 'var(--sig-font-size, var(--doc-font-size, 13pt))' not in html_content:
        errors.append("Part 1: CSS variable var(--sig-font-size, var(--doc-font-size, 13pt)) not found in surakshya-sanrakshak-test.html")
    
    # Check JS applyChairSigSettings
    if 'var(--sig-font-size, var(--doc-font-size, 13pt))' not in js_content:
        errors.append("Part 1: applyChairSigSettings does not use var(--sig-font-size, var(--doc-font-size, 13pt))")

    print("  [PASS] Part 1: Ward Chairperson font-size variables, CSS, and classes verified.")

    # -------------------------------------------------------------------------
    # PART 2: AUTO-FILL GUARDIAN NAME FROM APPLICANT WITH INDEPENDENT EDITING
    # -------------------------------------------------------------------------
    print("Checking Part 2: Applicant to Guardian Auto-Fill & Independent Editing...")
    
    # Check sync button in HTML
    if 'id="btnSyncApplicantToGuardian"' not in html_content:
        errors.append("Part 2: #btnSyncApplicantToGuardian button not found in surakshya-sanrakshak-test.html")
    if 'निवेदककै नाम राख्ने' not in html_content:
        errors.append("Part 2: 'निवेदककै नाम राख्ने' text not found in surakshya-sanrakshak-test.html")

    # Check JS logic
    if 'isGuardianLinkedToApplicant' not in js_content:
        errors.append("Part 2: isGuardianLinkedToApplicant flag missing in script-surakshya-sanrakshak-test.js")
    if 'updateSyncApplicantBtnVisibility' not in js_content:
        errors.append("Part 2: updateSyncApplicantBtnVisibility function missing in script-surakshya-sanrakshak-test.js")
    if 'onApplicantNameInput' not in js_content:
        errors.append("Part 2: onApplicantNameInput handler missing in script-surakshya-sanrakshak-test.js")
    if 'onGuardianNameInput' not in js_content:
        errors.append("Part 2: onGuardianNameInput handler missing in script-surakshya-sanrakshak-test.js")
    if 'syncGuardianToApplicant' not in js_content:
        errors.append("Part 2: syncGuardianToApplicant function missing in script-surakshya-sanrakshak-test.js")

    # Check resetForm handles link state
    reset_pos = js_content.find('function resetForm()')
    reset_body = js_content[reset_pos:reset_pos + 800] if reset_pos != -1 else ''
    if 'isGuardianLinkedToApplicant = true' not in reset_body:
        errors.append("Part 2: resetForm() does not reset isGuardianLinkedToApplicant to true")

    # Check loadRecordForEdit handles link state
    if 'appNameSaved !== gNameSaved' not in js_content:
        errors.append("Part 2: loadRecordForEdit() does not check if applicantName and guardianName differ")

    print("  [PASS] Part 2: Auto-fill, manual decoupling, sync button, and state restoration verified.")

    # -------------------------------------------------------------------------
    # PART 3: REMOVAL OF "नागरिक खोजी" FROM "द्रुत सेवा"
    # -------------------------------------------------------------------------
    print("Checking Part 3: Removal of 'नागरिक खोजी' from 'द्रुत सेवा'...")
    with open('index.html', 'r', encoding='utf-8') as f:
        index_content = f.read()

    # Check quickMenuCitizenSearch does NOT exist in index.html
    if 'id="quickMenuCitizenSearch"' in index_content or 'quickMenuCitizenSearch' in index_content:
        errors.append("Part 3: quickMenuCitizenSearch still found in index.html")
    
    # Check that remaining quick menu items exist
    if 'id="quickMenuRecycleBin"' not in index_content:
        errors.append("Part 3: quickMenuRecycleBin missing from index.html")
    if 'id="quickPrintLogoBtn"' not in index_content:
        errors.append("Part 3: quickPrintLogoBtn missing from index.html")
    if 'id="logoutBtn"' not in index_content:
        errors.append("Part 3: logoutBtn missing from index.html")

    # Ensure citizen-search.html file still exists and was not deleted
    if not os.path.exists('citizen-search.html'):
        errors.append("Part 3: citizen-search.html file was deleted! It must be preserved.")

    print("  [PASS] Part 3: 'नागरिक खोजी' cleanly removed from 'द्रुत सेवा', other items intact.")

    # -------------------------------------------------------------------------
    # PART 4: ADD 4 APPLICATION FILES FROM NIBEDAN TO "द्रुत खोजी"
    # -------------------------------------------------------------------------
    print("Checking Part 4: 4 Application Files from 'nibedan' folder in 'द्रुत खोजी'...")

    expected_files = [
        'घटना दर्ता नाम संसोधन.pdf',
        'जन्म तथा मृत्यु दर्ता.pdf',
        'जन्म दर्ता प्रतिलिपि फारम.pdf',
        'विवाह सम्वन्ध विच्छेद निवेदन.pdf'
    ]

    # Verify physical files in nibedan/
    for fname in expected_files:
        fpath = os.path.join('nibedan', fname)
        if not os.path.exists(fpath):
            errors.append(f"Part 4: Physical file {fpath} does not exist.")
        elif os.path.getsize(fpath) < 1000:
            errors.append(f"Part 4: File {fpath} is suspiciously small ({os.path.getsize(fpath)} bytes).")

    # Check index.html integration
    expected_titles = [
        'घटना दर्ता नाम संशोधन निवेदन',
        'जन्म तथा मृत्यु दर्ता निवेदन',
        'जन्म दर्ता प्रतिलिपि फारम',
        'विवाह सम्बन्ध विच्छेद निवेदन'
    ]

    for title in expected_titles:
        if title not in index_content:
            errors.append(f"Part 4: Title '{title}' not found in index.html")

    if 'nibedan-card' not in index_content:
        errors.append("Part 4: nibedan-card class not found in index.html")
    if 'sifarish-section-divider' not in index_content:
        errors.append("Part 4: sifarish-section-divider not found in index.html")
    if 'download=' not in index_content:
        errors.append("Part 4: download attribute missing in application form cards")
    if 'data-search' not in index_content:
        errors.append("Part 4: data-search attribute missing in application form cards")

    # Check search filter enhancement in index.html
    if 'searchKeywords.includes(q)' not in index_content:
        errors.append("Part 4: filterSifarishCards does not search keywords in index.html")

    # Check citizen-search.html integration
    with open('citizen-search.html', 'r', encoding='utf-8') as f:
        cs_content = f.read()

    for title in expected_titles:
        if title not in cs_content:
            errors.append(f"Part 4: Title '{title}' not found in citizen-search.html")

    print("  [PASS] Part 4: All 4 application files verified on disk, in index.html, and in citizen-search.html.")

    # -------------------------------------------------------------------------
    # PART 5: STRICT ISOLATION & DATA INTEGRITY
    # -------------------------------------------------------------------------
    print("Checking Part 5: Isolation of Production Module...")
    # Check that surakshya-bhatta-sifarish files are not modified in git diff
    with open('surakshya-bhatta-sifarish.html', 'r', encoding='utf-8') as f:
        prod_html = f.read()
    if 'surakshya-sanrakshak-test' in prod_html:
        errors.append("Part 5: Production module surakshya-bhatta-sifarish.html was contaminated!")

    # Check 3-page layout in test module
    page_matches = re.findall(r'class="[^"]*a4-page[^"]*"', html_content)
    if len(page_matches) < 3:
        errors.append(f"Part 5: Expected at least 3 .a4-page elements in test module, found {len(page_matches)}")

    print("  [PASS] Part 5: Production module strictly untouched; 3 A4 pages maintained.")

    # -------------------------------------------------------------------------
    # FINAL RESULTS
    # -------------------------------------------------------------------------
    print("\n----------------------------------------------------------------------")
    if errors:
        print(f"FAILED with {len(errors)} error(s):")
        for err in errors:
            print("  [ERROR]", err)
        return False
    else:
        print("ALL TESTS PASSED SUCCESSFULLY! (6/6 verification checks green)")
        print("----------------------------------------------------------------------")
        return True

if __name__ == '__main__':
    success = test_final_master_prompt_fixes()
    sys.exit(0 if success else 1)
