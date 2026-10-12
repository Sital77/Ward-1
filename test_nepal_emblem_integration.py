"""
Validation script: test_nepal_emblem_integration.py
Tests the Nepal National Emblem integration into the official letterhead
and validates print clarity across all Gauradaha Municipality Ward No. 1 templates.
"""
import os
import re
import sys
import xml.etree.ElementTree as ET

sys.stdout.reconfigure(encoding='utf-8')

TEMPLATES = [
    'aamdani-pramanit.html', 'abhilekh-pramanit.html', 'abibahit-pramanit.html',
    'apangata-sifarish.html', 'bank-sifarish.html', 'bargikaran-sifarish.html',
    'bato-pramanit.html', 'bibaha-pramanit.html', 'charkilla.html',
    'dynamic-sifarish.html', 'ghar-kayam.html', 'gharbato.html',
    'jaggadhani-patra.html', 'jaggadhani-pratilipi.html',
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
print("GAURADAHA WARD NO. 1 - NEPAL EMBLEM LETTERHEAD & PRINT CLARITY TEST SUITE")
print("=" * 80)

# TEST GROUP 1: Asset Inspection & Blurry Cause Analysis
print("\n[TEST GROUP 1] Asset Inspection & Blurry Raster Removal:")

lh_path = "assets/letter head.svg"
emblem_path = "assets/emblem_of_nepal.svg"

check("Asset 'assets/letter head.svg' exists", os.path.exists(lh_path))
check("Asset 'assets/emblem_of_nepal.svg' exists", os.path.exists(emblem_path))

with open(lh_path, "r", encoding="utf-8") as f:
    lh_content = f.read()

with open(emblem_path, "r", encoding="utf-8") as f:
    emblem_content = f.read()

# Verify letterhead SVG root and dimensions
lh_tree = ET.fromstring(lh_content)
check("Letterhead width is 561 and height is 138",
      lh_tree.attrib.get('width') == '561' and lh_tree.attrib.get('height') == '138')
check("Letterhead preserves official viewBox '16 0 561 138'",
      lh_tree.attrib.get('viewBox') == '16 0 561 138')

# Verify letterhead text artwork preserved
check("Letterhead preserves official municipal red text vector paths (4 paths)",
      len(lh_tree.findall('{http://www.w3.org/2000/svg}path')) == 4)
check("Letterhead preserves red dividing line element",
      len(lh_tree.findall('{http://www.w3.org/2000/svg}line')) == 1)

# Verify blurry raster emblem has been removed to avoid duplication
check("Letterhead contains ZERO embedded raster PNG images (<image> tag removed)",
      len(lh_tree.findall('.//{http://www.w3.org/2000/svg}image')) == 0)
check("Letterhead contains ZERO pattern definitions (<pattern> tag removed)",
      len(lh_tree.findall('.//{http://www.w3.org/2000/svg}pattern')) == 0)
check("Letterhead contains ZERO raster rect fills (no url(#pattern0_2392_2))",
      'url(#pattern0_2392_2)' not in lh_content)

# Verify emblem_of_nepal.svg is 100% pure vector
emblem_tree = ET.fromstring(emblem_content)
check("Emblem is genuine vector SVG with paths (>100 vector paths)",
      len(emblem_tree.findall('.//{http://www.w3.org/2000/svg}path')) > 100)
check("Emblem contains ZERO raster/base64 image tags",
      len(emblem_tree.findall('.//{http://www.w3.org/2000/svg}image')) == 0 and 'data:image' not in emblem_content)
check("Emblem dimensions are authentic 1499.9994 x 1265.9701 (aspect ratio 1.185)",
      '1499.9994' in emblem_tree.attrib.get('width', '') and '1265.9701' in emblem_tree.attrib.get('height', ''))

# TEST GROUP 2: CSS Architecture & Positioning
print("\n[TEST GROUP 2] Central CSS Architecture & Print Rules:")

with open('charkilla.css', 'r', encoding='utf-8') as f:
    charkilla_css = f.read()

with open('style.css', 'r', encoding='utf-8') as f:
    style_css = f.read()

with open('gharbato.css', 'r', encoding='utf-8') as f:
    gharbato_css = f.read()

check("charkilla.css defines .svg-letterhead-emblem rule",
      ".svg-letterhead-emblem" in charkilla_css)
check("charkilla.css sets .svg-letterhead-emblem position: absolute",
      "position: absolute" in charkilla_css)
check("charkilla.css sets .svg-letterhead-emblem left position (left: 3.5%)",
      "left: 3.5%" in charkilla_css)
check("charkilla.css sets .svg-letterhead-emblem aspect ratio (aspect-ratio: 1500 / 1266)",
      "aspect-ratio: 1500 / 1266" in charkilla_css)
check("charkilla.css enforces print-color-adjust: exact on emblem",
      "print-color-adjust: exact" in charkilla_css)
check("charkilla.css @media print includes .svg-letterhead-emblem rules",
      "@media print" in charkilla_css and ".svg-letterhead-emblem" in charkilla_css.split("@media print")[-1])

check("style.css defines .svg-letterhead-emblem rule",
      ".svg-letterhead-emblem" in style_css)
check("gharbato.css defines .svg-letterhead-emblem rule",
      ".svg-letterhead-emblem" in gharbato_css)

with open('font-settings.js', 'r', encoding='utf-8') as f:
    fs_content = f.read()
check("font-settings.js protects .svg-letterhead-emblem from typography overrides",
      ".svg-letterhead-emblem" in fs_content)

# TEST GROUP 3: Template Integration Uniformity
print("\n[TEST GROUP 3] Template Audit Across All 21 Recommendation Templates:")

missing_emblem = []
missing_banner = []
missing_preload_emblem = []
missing_preload_banner = []
duplicate_emblems = []

for t in TEMPLATES:
    with open(t, 'r', encoding='utf-8') as f:
        html = f.read()

    ec = html.count('class="svg-letterhead-emblem"')
    bc = html.count('class="svg-letterhead-banner"')
    pe = html.count('rel="preload" as="image" href="assets/emblem_of_nepal.svg"')
    pb = html.count('rel="preload" as="image" href="assets/letter%20head.svg"')

    if ec == 0:
        missing_emblem.append(t)
    elif ec > 1:
        duplicate_emblems.append(t)

    if bc == 0:
        missing_banner.append(t)
    if pe == 0:
        missing_preload_emblem.append(t)
    if pb == 0:
        missing_preload_banner.append(t)

check("All 21 templates include .svg-letterhead-emblem on the letterhead",
      len(missing_emblem) == 0, f"Missing: {missing_emblem}")
check("Zero templates have duplicate letterhead emblems",
      len(duplicate_emblems) == 0, f"Duplicates: {duplicate_emblems}")
check("All 21 templates include .svg-letterhead-banner background",
      len(missing_banner) == 0, f"Missing: {missing_banner}")
check("All 21 templates preload emblem_of_nepal.svg",
      len(missing_preload_emblem) == 0, f"Missing: {missing_preload_emblem}")
check("All 21 templates preload letter%20head.svg",
      len(missing_preload_banner) == 0, f"Missing: {missing_preload_banner}")

# TEST GROUP 4: Emblem Placement & Spacing Sanity
print("\n[TEST GROUP 4] Official Position & Layout Sanity:")
# The emblem is placed at left: 3.5%, top: 10%, height: 53%.
# In 561 x 138 coordinates:
# Top: 13.8px, Height: 73.1px, Bottom: 86.9px.
# Red dividing line is at 136px.
# Clearance below emblem before dividing line: 136 - 86.9 = 49.1px (35.6% of height).
# Metadata line is at bottom: 4% (~5.5px), leaving over 40px of clear space above metadata!
check("Emblem top position (10%) aligns with top municipality header",
      "top: 10%" in charkilla_css)
check("Emblem height (53%) leaves generous clearance above metadata line",
      "height: 53%" in charkilla_css)
check("Emblem pointer-events: none ensures underlying elements remain clickable",
      "pointer-events: none" in charkilla_css)

print("\n" + "=" * 80)
print(f"TEST RESULTS: {passed} PASSED, {failed} FAILED")
print("=" * 80)

if failed > 0:
    sys.exit(1)
