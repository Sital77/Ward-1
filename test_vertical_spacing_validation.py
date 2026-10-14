import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = r"c:\Users\user\Downloads\deploy-6a992c0f2df4500008756bf1"

print("="*80)
print("GAURADAHA WARD NO. 1 - VERTICAL SPACING STANDARDIZATION VALIDATION SUITE")
print("="*80)

passed = 0
failed = 0

def assert_test(cond, desc, details=""):
    global passed, failed
    if cond:
        print(f"  [PASS] {desc}")
        passed += 1
    else:
        print(f"  [FAIL] {desc} - {details}")
        failed += 1

# ── GROUP 1: Shared Stylesheets (charkilla.css & style.css) ──
print("\n[TEST GROUP 1] Shared Stylesheets Spacing Tokens & Canonical Rules:")

with open(os.path.join(ROOT_DIR, "charkilla.css"), "r", encoding="utf-8") as f:
    charkilla = f.read()

with open(os.path.join(ROOT_DIR, "style.css"), "r", encoding="utf-8") as f:
    style_css = f.read()

assert_test("--doc-para-spacing: 10px" in charkilla, "charkilla.css defines --doc-para-spacing: 10px")
assert_test("--doc-para-spacing: 10px" in style_css, "style.css defines --doc-para-spacing: 10px")

# Check recipient block rules in charkilla.css
assert_test("line-height: 1.25 !important" in charkilla, "charkilla.css enforces recipient line-height: 1.25 !important")
assert_test("margin-top: 6px !important" in charkilla, "charkilla.css enforces recipient margin-top: 6px !important")
assert_test("margin-bottom: 8px !important" in charkilla, "charkilla.css enforces recipient margin-bottom: 8px !important")

# Check subject block rules in charkilla.css
assert_test("margin: 6px 0 10px 0 !important" in charkilla, "charkilla.css enforces subject margin: 6px 0 10px 0 !important")

# Check tapasil spacing
assert_test("margin: 8px 0 4px 0 !important" in charkilla, "charkilla.css enforces tapasil title margin: 8px 0 4px 0 !important")
assert_test("padding: 4px 4px !important" in charkilla, "charkilla.css enforces table cell padding: 4px 4px !important")

# Check print media in charkilla.css
assert_test("@media print" in charkilla and "margin: 6px 0 10px 0 !important" in charkilla, "charkilla.css print media enforces standardized subject margin")

# ── GROUP 2: Dynamic Font Settings (font-settings.js) ──
print("\n[TEST GROUP 2] Dynamic Font Settings Manager (font-settings.js):")

with open(os.path.join(ROOT_DIR, "font-settings.js"), "r", encoding="utf-8") as f:
    font_settings = f.read()

assert_test("--doc-para-spacing: 10px" in font_settings, "font-settings.js sets --doc-para-spacing: 10px in root styles")
assert_test("margin: 6px 0 10px 0 !important" in font_settings, "font-settings.js applies subject margin: 6px 0 10px 0 !important dynamically")
assert_test("line-height: 1.25 !important" in font_settings, "font-settings.js applies recipient line-height: 1.25 !important dynamically")
assert_test("margin-top: 6px !important" in font_settings, "font-settings.js applies recipient margin-top: 6px !important dynamically")
assert_test("margin-bottom: 8px !important" in font_settings, "font-settings.js applies recipient margin-bottom: 8px !important dynamically")
assert_test("padding: 4px 4px !important" in font_settings, "font-settings.js applies table padding: 4px 4px !important dynamically")

# ── GROUP 3: Template-Level Audit Across All 22 Recommendation Templates ──
print("\n[TEST GROUP 3] Template-Level Spacing Audit Across All Recommendation Templates:")

templates = [
    "aamdani-pramanit.html",
    "abhilekh-pramanit.html",
    "abibahit-pramanit.html",
    "apangata-sifarish.html",
    "arko-bibaha-nagareko.html",
    "bank-sifarish.html",
    "bargikaran-sifarish.html",
    "bato-pramanit.html",
    "bibaha-pramanit.html",
    "charkilla.html",
    "dynamic-sifarish.html",
    "ghar-kayam.html",
    "gharbato.html",
    "jaggadhani-patra.html",
    "jaggadhani-pratilipi.html",
    "nabalak-parichayapatra.html",
    "pan-sifarish.html",
    "pariwarik-bibaran.html",
    "suchana-tans.html",
    "surakshya-bhatta-sifarish.html",
    "yojana-bank-sifarish.html",
    "yojana-samjhauta.html"
]

all_exist = True
for t in templates:
    p = os.path.join(ROOT_DIR, t)
    if not os.path.exists(p):
        all_exist = False
        print(f"  Missing template: {t}")
assert_test(all_exist, f"All {len(templates)} target recommendation templates exist")

# Verify no template has trailing <br> in address
trailing_br_files = []
for t in templates:
    p = os.path.join(ROOT_DIR, t)
    with open(p, "r", encoding="utf-8") as f:
        c = f.read()
    # Check for <div class="...address-to...">...<br></div>
    matches = re.findall(r'(<(?:div|p|span)[^>]*class="[^"]*(?:address-to|receiver-address-block)[^"]*"[^>]*>.*?)(</(?:div|p|span)>)', c, re.DOTALL)
    for block, _ in matches:
        stripped = block.strip()
        if stripped.endswith("<br>") or stripped.endswith("<br/>") or stripped.endswith("<br />"):
            trailing_br_files.append(t)

assert_test(len(trailing_br_files) == 0, "No recommendation template has trailing <br> in recipient address", f"Found in: {trailing_br_files}")

# Verify no template has hardcoded line-height 1.9 / 1.95 in <style>
line_height_overrides = []
for t in templates:
    p = os.path.join(ROOT_DIR, t)
    with open(p, "r", encoding="utf-8") as f:
        c = f.read()
    styles = re.findall(r'<style[^>]*>(.*?)</style>', c, re.DOTALL)
    for s in styles:
        if re.search(r'line-height\s*:\s*1\.9[5]?;', s):
            line_height_overrides.append(t)

assert_test(len(line_height_overrides) == 0, "No recommendation template has hardcoded line-height 1.9/1.95 override", f"Found in: {line_height_overrides}")

# Verify no template has docFooterSection margin-top > 40px
oversized_footers = []
for t in templates:
    p = os.path.join(ROOT_DIR, t)
    with open(p, "r", encoding="utf-8") as f:
        c = f.read()
    matches = re.findall(r'id=["\']docFooterSection["\'][^>]*style=["\']([^"\']*)["\']', c)
    for st in matches:
        m = re.search(r'margin-top\s*:\s*(\d+)px', st)
        if m and int(m.group(1)) > 40:
            oversized_footers.append((t, m.group(1)))

assert_test(len(oversized_footers) == 0, "No recommendation template has docFooterSection margin-top > 40px", f"Found in: {oversized_footers}")

# Verify no template has tapasil-title margin-top > 10px
oversized_tapasil = []
for t in templates:
    p = os.path.join(ROOT_DIR, t)
    with open(p, "r", encoding="utf-8") as f:
        c = f.read()
    matches = re.findall(r'class=["\'][^"\']*tapasil-title[^"\']*["\'][^>]*style=["\']([^"\']*)["\']', c)
    for st in matches:
        m = re.search(r'margin-top\s*:\s*(\d+)px', st)
        if m and int(m.group(1)) > 10:
            oversized_tapasil.append((t, m.group(1)))

assert_test(len(oversized_tapasil) == 0, "No recommendation template has tapasil-title margin-top > 10px", f"Found in: {oversized_tapasil}")

print("\n" + "="*80)
print(f"TEST RESULTS: {passed} PASSED, {failed} FAILED")
print("="*80)

if failed > 0:
    sys.exit(1)
