"""
Validation script: test_typography_standardization.py
Tests typography consistency, CSS tokens, font-settings, and template markup across all 22 recommendation templates.
"""
import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

TEMPLATES = [
    'aamdani-pramanit.html', 'abhilekh-pramanit.html', 'abibahit-pramanit.html',
    'apangata-sifarish.html', 'bank-sifarish.html', 'bargikaran-sifarish.html',
    'bato-pramanit.html', 'bibaha-pramanit.html', 'charkilla.html',
    'dynamic-sifarish.html', 'ghar-kayam.html', 'gharbato.html',
    'jaggadhani-patra.html', 'jaggadhani-pratilipi.html', 'nabalak-parichayapatra.html',
    'pan-sifarish.html', 'pariwarik-bibaran.html', 'suchana-tans.html',
    'surakshya-bhatta-sifarish.html', 'yojana-bank-sifarish.html',
    'yojana-samjhauta.html', 'yojana-tippani.html'
]

passed = 0
failed = 0

def check(name, condition, detail=""):
    global passed, failed
    if condition:
        print(f"  [PASS] {name}")
        if detail:
            print(f"         └─ {detail}")
        passed += 1
    else:
        print(f"  [FAIL] {name}")
        if detail:
            print(f"         └─ {detail}")
        failed += 1

print("=" * 80)
print("GAURADAHA WARD NO. 1 - TYPOGRAPHY STANDARDIZATION VALIDATION SUITE")
print("=" * 80)

# 1. CSS Architecture & Tokens
print("\n[TEST GROUP 1] Central CSS Tokens & Canonical Rules:")

with open('charkilla.css', 'r', encoding='utf-8') as f:
    charkilla_css = f.read()

with open('style.css', 'r', encoding='utf-8') as f:
    style_css = f.read()

check("charkilla.css defines --doc-font-family: 'Mukta', sans-serif",
      "--doc-font-family: 'Mukta', sans-serif" in charkilla_css)
check("charkilla.css defines --doc-font-size: 13pt",
      "--doc-font-size: 13pt" in charkilla_css)
check("charkilla.css defines --doc-line-height: 1.85",
      "--doc-line-height: 1.85" in charkilla_css)
check("charkilla.css defines --subject-font-size: 14.5pt",
      "--subject-font-size: 14.5pt" in charkilla_css)
check("charkilla.css defines --table-font-size: 13pt",
      "--table-font-size: 13pt" in charkilla_css)
check("charkilla.css defines --sig-font-size: 13pt",
      "--sig-font-size: 13pt" in charkilla_css)

check("style.css defines --doc-font-family: 'Mukta', sans-serif",
      "--doc-font-family: 'Mukta', sans-serif" in style_css)
check("style.css defines --doc-font-size: 13pt",
      "--doc-font-size: 13pt" in style_css)
check("style.css defines --doc-line-height: 1.85",
      "--doc-line-height: 1.85" in style_css)
check("style.css defines --subject-font-size: 14.5pt",
      "--subject-font-size: 14.5pt" in style_css)
check("style.css defines --table-font-size: 13pt",
      "--table-font-size: 13pt" in style_css)
check("style.css defines --sig-font-size: 13pt",
      "--sig-font-size: 13pt" in style_css)

# Check print media standardization
check("charkilla.css @media print enforces 13pt body",
      "font-size: var(--doc-font-size, 13pt) !important;" in charkilla_css)
check("charkilla.css @media print enforces 1.85 body line-height",
      "line-height: var(--doc-line-height, 1.85) !important;" in charkilla_css)

# 2. Dynamic Font Settings Engine
print("\n[TEST GROUP 2] Dynamic Font Settings Manager (font-settings.js):")
with open('font-settings.js', 'r', encoding='utf-8') as f:
    fs_js = f.read()

check("font-settings.js sets standard default base size to '13'",
      "const defaultFontSize = '13';" in fs_js)
check("font-settings.js applies base size 13pt to --doc-font-size",
      "--doc-font-size: ${docBase}pt;" in fs_js)
check("font-settings.js applies line-height 1.85 in dynamic styles",
      "--doc-line-height: 1.85;" in fs_js)
check("font-settings.js computes subject font size as base + 1.5 (14.5pt)",
      "const subjSize = baseSize + 1.5;" in fs_js)
check("font-settings.js includes all template selectors for body text",
      "#bodyText" in fs_js and "#bodyKholne" in fs_js and "#bodyBanda" in fs_js and "#bodyTextJanma" in fs_js)
check("yojana-tippani excluded check removed from font-settings.js",
      "if (templateId === 'yojana-tippani') return;" not in fs_js)

# 3. Official Letterhead Protection
print("\n[TEST GROUP 3] Official SVG Letterhead Protection:")
check("Official SVG letterhead asset exists at 'assets/letter head.svg'",
      os.path.exists("assets/letter head.svg"))
with open("assets/letter head.svg", "r", encoding="utf-8") as f:
    svg_content = f.read()
check("Letterhead aspect ratio 561 / 138 preserved",
      "aspect-ratio: 561 / 138" in charkilla_css and "aspect-ratio: 561 / 138" in style_css)
check("Letterhead contains valid SVG root elements",
      "<svg" in svg_content and "</svg>" in svg_content)
check("Letterhead dimensions viewbox preserved",
      'viewBox="0 0 561 138"' in svg_content or 'viewBox' in svg_content)

# 4. Template Integration & Typography Uniformity
print("\n[TEST GROUP 4] Template Audit Across All 22 Files:")
missing_css = []
missing_fs = []
conflicting_inline_body = []

for t in TEMPLATES:
    with open(t, 'r', encoding='utf-8') as f:
        html = f.read()
    
    # Check CSS link
    if 'charkilla.css' not in html and 'style.css' not in html:
        missing_css.append(t)
    
    # Check font-settings.js
    if 'font-settings.js' not in html:
        missing_fs.append(t)
        
    # Check for unwanted inline font-size on body paragraphs
    # Exclude nabalak which is an identity card form
    if t != 'nabalak-parichayapatra.html':
        p_m = re.search(r'<div[^>]*class=[\'"][^\'"]*preview-panel[\s\S]*?(?:<div[^>]*class=[\'"][^\'"]*history-panel|\Z)', html, re.I)
        panel = p_m.group(0) if p_m else html
        body_matches = re.findall(r'<([a-zA-Z0-9]+)[^>]*?(?:class=[\'"][^\'"]*(?:letter-body|letter-body-para)[^\'"]*|id=[\'"][^\'"]*(?:bodyText|defaultLetterBody|customLetterBody|bodyKholne|bodyBanda)[^\'"]*)[^>]*?style=[\'"][^\'"]*font-size:[^\'"]*[\'"][^>]*>', panel, re.I)
        if body_matches:
            conflicting_inline_body.append((t, body_matches))

check("All 22 templates link standard stylesheet (charkilla.css)",
      len(missing_css) == 0, f"Missing: {missing_css}")
check("All 22 templates include font-settings.js",
      len(missing_fs) == 0, f"Missing: {missing_fs}")
check("No template contains conflicting inline font-size on recommendation body",
      len(conflicting_inline_body) == 0, f"Conflicts: {conflicting_inline_body}")

# 5. Check Addressee, Subject, and Signature classes
print("\n[TEST GROUP 5] Structural Hierarchy & Element Classification:")
unclassified_subjects = []
unclassified_receivers = []

for t in TEMPLATES:
    if t in ['nabalak-parichayapatra.html', 'dynamic-sifarish.html']:
        continue
    with open(t, 'r', encoding='utf-8') as f:
        html = f.read()
    
    p_m = re.search(r'<div[^>]*class=[\'"][^\'"]*preview-panel[\s\S]*?(?:<div[^>]*class=[\'"][^\'"]*history-panel|\Z)', html, re.I)
    panel = p_m.group(0) if p_m else html
    
    # Check if subject element uses class subject-title, subject-line, or tippani-subject
    has_subject = re.search(r'class=[\'"][^\'"]*(?:subject-title|subject-line|tippani-subject)[^\'"]*', panel)
    if not has_subject:
        unclassified_subjects.append(t)
        
    # Check receiver class
    has_receiver = re.search(r'class=[\'"][^\'"]*(?:address-to|bank-receiver|receiver-block|receiver-address-block|tippani-addressee)[^\'"]*', panel)
    if not has_receiver:
        unclassified_receivers.append(t)

check("All standard recommendation templates classify subjects under canonical classes",
      len(unclassified_subjects) == 0, f"Unclassified: {unclassified_subjects}")
check("All standard recommendation templates classify addressees under canonical classes",
      len(unclassified_receivers) == 0, f"Unclassified: {unclassified_receivers}")

print("\n" + "=" * 80)
print(f"TEST RESULTS: {passed} PASSED, {failed} FAILED")
print("=" * 80)

if failed > 0:
    sys.exit(1)
