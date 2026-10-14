import os, re, sys

sys.stdout.reconfigure(encoding='utf-8')

print("=" * 80)
print("GAURADAHA WARD NO. 1 - MASTER PROMPT LAYOUT & FORMATTING VERIFICATION")
print("=" * 80)

passed = 0
failed = 0

def check(desc, condition, details=""):
    global passed, failed
    if condition:
        passed += 1
        print(f"  [PASS] {desc}")
    else:
        failed += 1
        print(f"  [FAIL] {desc}")
        if details:
            print(f"         └─ {details}")

print("\n[TEST GROUP 1] Nabalak Parichayapatra Layout Protection:")
nabalak_html = open("nabalak-parichayapatra.html", encoding="utf-8").read()
charkilla_css = open("charkilla.css", encoding="utf-8").read()
font_settings_js = open("font-settings.js", encoding="utf-8").read()

check("nabalak-parichayapatra.html sifarish-para preserves 7.2pt / 1.15 line-height",
      "font-size: 7.2pt !important;" in nabalak_html and "line-height: 1.15 !important;" in nabalak_html)
check("font-settings.js protects nabalak-parichayapatra from generic 13pt inflation",
      ".sifarish-para" in font_settings_js and "font-size: 7.2pt !important;" in font_settings_js)
check("nabalak-parichayapatra.html has red subject-label",
      'class="subject-label"' in nabalak_html and 'विषय:' in nabalak_html)
check("nabalak-parichayapatra.html print pages have compact padding",
      "padding: 3mm 6mm !important;" in nabalak_html and "padding: 5mm 8mm !important;" in nabalak_html)

print("\n[TEST GROUP 2] Body Paragraph Justification & Zero Unintended Indentation:")
check("charkilla.css sets text-indent: 0 !important for body paragraphs",
      "text-indent: 0 !important;" in charkilla_css or "text-indent: 0;" in charkilla_css)
check("font-settings.js sets text-indent: 0 !important in dynamic CSS",
      "text-indent: 0 !important;" in font_settings_js)

# Verify no non-zero text-indent in any HTML or CSS file
all_templates = [f for f in os.listdir('.') if f.endswith('.html') and f not in ['login.html', 'analytics.html', 'superadmin-dashboard.html', 'superadmin-login.html', 'original_nabalak.html', 'citizen-search.html', 'recycle-bin.html', 'malpot-calculator.html', 'calculator.html', 'jaribana-hisab.html', 'admin.html']]
non_zero_indents = []
for t in all_templates:
    c = open(t, encoding='utf-8').read()
    matches = re.findall(r'text-indent\s*:\s*([^;]+);', c)
    bad = [m for m in matches if m.strip() not in ['0', '0px', '0 !important', '0px !important']]
    if bad:
        non_zero_indents.append((t, bad))
check("All recommendation templates have zero unintended text-indent",
      len(non_zero_indents) == 0, f"Found in: {non_zero_indents}")

# Verify no leading &nbsp; before body text
leading_nbsp = []
for t in all_templates:
    c = open(t, encoding='utf-8').read()
    if re.search(r'(&nbsp;{1,15}\s*(?:प्रस्तुत|उपरोक्त|प्रस्तूत))', c):
        leading_nbsp.append(t)
check("No template has leading &nbsp; before opening body paragraph",
      len(leading_nbsp) == 0, f"Found in: {leading_nbsp}")

print("\n[TEST GROUP 3] Subject Font Size in PAN Recommendation (स्थायी लेखा नं.):")
pan_html = open("pan-sifarish.html", encoding="utf-8").read()
check("pan-sifarish.html uses standard .subject-line container",
      '<div class="subject-line">' in pan_html)
check("pan-sifarish.html has red .subject-label",
      '<span class="subject-label"' in pan_html and 'विषय:-' in pan_html)
check("pan-sifarish.html body paragraphs have no hardcoded leading indent",
      "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;प्रस्तुत" not in pan_html)

print("\n[TEST GROUP 4] Red 'विषय:-' Label Standard Across Templates:")
check("charkilla.css defines .subject-label in red (#e51a23)",
      ".subject-label" in charkilla_css and "#e51a23" in charkilla_css)
check("font-settings.js defines .subject-label with print-color-adjust",
      ".subject-label" in font_settings_js and "print-color-adjust: exact" in font_settings_js)

missing_subject_labels = []
for t in all_templates:
    c = open(t, encoding='utf-8').read()
    if 'विषय' in c:
        if 'subject-label' not in c:
            missing_subject_labels.append(t)
check("All recommendation templates with subject lines have .subject-label",
      len(missing_subject_labels) == 0, f"Missing: {missing_subject_labels}")

print("\n[TEST GROUP 5] Inspection of Unmarried Status Certification (अविवाहित प्रमाणित):")
abibahit_html = open("abibahit-pramanit.html", encoding="utf-8").read()
check("abibahit-pramanit.html exists and is intact", len(abibahit_html) > 5000)
check("abibahit-pramanit.html has red subject-label",
      '<span class="subject-label"' in abibahit_html and 'विषय:-' in abibahit_html)
check("abibahit-pramanit.html body has text-align: justify",
      "text-align: justify;" in abibahit_html)
check("abibahit-pramanit.html links charkilla.css and font-settings.js",
      "charkilla.css" in abibahit_html and "font-settings.js" in abibahit_html)

print("\n[TEST GROUP 6] Tapasil and Detail Section Left-Alignment:")
check("charkilla.css forces tapasil headings text-align: left !important",
      "text-align: left !important;" in charkilla_css and ".tapasil-title" in charkilla_css)
check("font-settings.js forces tapasil headings text-align: left !important",
      "text-align: left !important;" in font_settings_js and ".tapasil-title" in font_settings_js)

# Check all templates for any centered tapasil heading
centered_tapasil = []
for t in all_templates:
    c = open(t, encoding='utf-8').read()
    if re.search(r'class=[\'"][^\'"]*(?:tapasil|tapsil|tapasheel)[^\'"]*[\'"][^>]*style=[\'"][^\'"]*text-align:\s*center', c):
        centered_tapasil.append(t)
check("No template has inline text-align: center on tapasil headings",
      len(centered_tapasil) == 0, f"Found in: {centered_tapasil}")

print("\n[TEST GROUP 7] Collapsible Letterhead Details UI:")
check("font-settings.js implements initCollapsibleLetterhead",
      "initCollapsibleLetterhead" in font_settings_js)
check("charkilla.css defines styling for collapsible letterhead cards",
      ".lh-toggle-header" in charkilla_css and ".lh-collapsible-body" in charkilla_css)

print("\n[TEST GROUP 8] Obsolete 'विवाह नगरेको प्रमाणित' Module Removal:")
check("arko-bibaha-nagareko.html is completely deleted",
      not os.path.exists("arko-bibaha-nagareko.html"))

# Check that no navigation links to arko-bibaha-nagareko
references_to_arko = []
for root, dirs, files in os.walk('.'):
    if '.git' in root or '.gemini' in root or 'brain' in root:
        continue
    for f in files:
        if f.endswith(('.html', '.js', '.json')) and f != 'test_master_prompt_layout_fixes.py':
            content = open(os.path.join(root, f), encoding='utf-8', errors='ignore').read()
            if 'arko-bibaha-nagareko' in content:
                references_to_arko.append(os.path.join(root, f))
check("Zero active navigation references to arko-bibaha-nagareko",
      len(references_to_arko) == 0, f"Found in: {references_to_arko}")

print("\n" + "=" * 80)
print(f"TEST RESULTS: {passed} PASSED, {failed} FAILED")
print("=" * 80)

if failed > 0:
    sys.exit(1)
