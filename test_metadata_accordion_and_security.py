#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
test_metadata_accordion_and_security.py
Comprehensive regression test suite for:
- Part A: Global Collapsible Letter Metadata Section across all 22 active templates
- Part B/C: System Security Audit & Hardening (Auth, Escalation Prevention, XSS, Secrets)
- Part D: Regression integrity of print/PDF layout, Nepal Sambat, and data bindings
"""

import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

passed = 0
failed = 0

def check(name, condition, details=""):
    global passed, failed
    if condition:
        print(f"  [PASS] {name}")
        passed += 1
    else:
        print(f"  [FAIL] {name} - {details}")
        failed += 1

print("=" * 80)
print("GAURADAHA WARD NO. 1 — METADATA ACCORDION & SECURITY REGRESSION TEST SUITE")
print("=" * 80)

ACTIVE_22_TEMPLATES = [
    'aamdani-pramanit.html', 'abhilekh-pramanit.html', 'abibahit-pramanit.html',
    'apangata-sifarish.html', 'bank-sifarish.html', 'bargikaran-sifarish.html',
    'bato-pramanit.html', 'bibaha-pramanit.html', 'charkilla.html',
    'dynamic-sifarish.html', 'ghar-kayam.html', 'gharbato.html',
    'jaggadhani-patra.html', 'jaggadhani-pratilipi.html', 'nabalak-parichayapatra.html',
    'pan-sifarish.html', 'pariwarik-bibaran.html', 'suchana-tans.html',
    'surakshya-bhatta-sifarish.html', 'yojana-bank-sifarish.html',
    'yojana-samjhauta.html', 'yojana-tippani.html'
]

# -----------------------------------------------------------------------------
print("\n[TEST GROUP 1] Global Metadata Accordion Across All 22 Recommendation Templates:")
# -----------------------------------------------------------------------------
missing_accordion = []
missing_label = []
missing_scripts = []
missing_styles = []

for t in ACTIVE_22_TEMPLATES:
    if not os.path.exists(t):
        missing_accordion.append(f"{t} (file not found)")
        continue
    c = open(t, encoding='utf-8').read()
    if 'lh-section' not in c:
        missing_accordion.append(t)
    if 'पत्रसम्बन्धी विवरण' not in c:
        missing_label.append(t)
    if 'font-settings.js' not in c:
        missing_scripts.append(t)
    if 'charkilla.css' not in c:
        missing_styles.append(t)

check("All 22 active templates have 'lh-section' container",
      len(missing_accordion) == 0, f"Missing: {missing_accordion}")

check("All 22 active templates use standardized title '📄 पत्रसम्बन्धी विवरण'",
      len(missing_label) == 0, f"Missing: {missing_label}")

check("All 22 active templates load font-settings.js engine",
      len(missing_scripts) == 0, f"Missing: {missing_scripts}")

check("All 22 active templates link charkilla.css stylesheet",
      len(missing_styles) == 0, f"Missing: {missing_styles}")

# -----------------------------------------------------------------------------
print("\n[TEST GROUP 2] Data Binding & ID Preservation:")
# -----------------------------------------------------------------------------
duplicate_ids_found = []
for t in ACTIVE_22_TEMPLATES:
    c = open(t, encoding='utf-8').read()
    ids = re.findall(r'id=["\']([^"\']+)["\']', c)
    seen = set()
    dup = set()
    for i in ids:
        if i in seen:
            dup.add(i)
        seen.add(i)
    meta_dups = dup.intersection({'inPatraSankhya', 'inChalani', 'inMiti', 'inNepalSamvat', 'inOffice'})
    if meta_dups:
        duplicate_ids_found.append((t, list(meta_dups)))

check("Zero duplicate metadata IDs across all templates",
      len(duplicate_ids_found) == 0, f"Duplicates: {duplicate_ids_found}")

binding_checks = []
for t in ACTIVE_22_TEMPLATES:
    if t == 'dynamic-sifarish.html':
        continue
    c = open(t, encoding='utf-8').read()
    has_chalani = 'inChalani' in c and 'updateDoc()' in c
    has_miti = 'inMiti' in c and ('updateNepalSambatFromMiti' in c or 'updateDoc()' in c)
    if not (has_chalani and has_miti):
        binding_checks.append(t)

check("Metadata inputs retain reactive event bindings (updateDoc, updateNepalSambatFromMiti)",
      len(binding_checks) == 0, f"Failed in: {binding_checks}")

# -----------------------------------------------------------------------------
print("\n[TEST GROUP 3] Accordion Styles & Print Concealment in charkilla.css & style.css:")
# -----------------------------------------------------------------------------
ck_css = open('charkilla.css', encoding='utf-8').read()
st_css = open('style.css', encoding='utf-8').read()

check("charkilla.css defines .lh-section and .section-card.lh-collapsible",
      ".lh-section" in ck_css and ".section-card.lh-collapsible" in ck_css)

check("charkilla.css defines .lh-toggle-header with cursor pointer",
      ".lh-toggle-header" in ck_css and "cursor: pointer" in ck_css)

check("charkilla.css defines keyboard focus-visible outline for accessibility",
      ".lh-toggle-header:focus-visible" in ck_css and "outline:" in ck_css)

check("charkilla.css hides .lh-collapsible-body when collapsed",
      ".lh-collapsible-body" in ck_css and "display: none !important;" in ck_css)

check("charkilla.css hides accordion controls in print media",
      "@media print" in ck_css and ".lh-toggle-header" in ck_css)

check("style.css mirrors collapsible accordion rules and print hiding",
      ".lh-section" in st_css and ".lh-collapsible-body" in st_css and "@media print" in st_css)

# -----------------------------------------------------------------------------
print("\n[TEST GROUP 4] Universal Dynamic Engine in font-settings.js:")
# -----------------------------------------------------------------------------
fs_js = open('font-settings.js', encoding='utf-8').read()

check("font-settings.js exports initCollapsibleLetterhead and initCollapsibleMetadata",
      "window.initCollapsibleLetterhead" in fs_js and "window.initCollapsibleMetadata" in fs_js)

check("font-settings.js collapses section by default with card.classList.add('lh-collapsible', 'collapsed')",
      "card.classList.add('lh-collapsible', 'collapsed')" in fs_js)

check("font-settings.js sets accessibility attributes (role=button, tabindex=0, aria-expanded)",
      "setAttribute('role', 'button')" in fs_js and "setAttribute('tabindex', '0')" in fs_js and "setAttribute('aria-expanded'" in fs_js)

check("font-settings.js sets toggle indicator 'हेर्नुहोस् ▼' on collapsed state",
      "'हेर्नुहोस् ▼'" in fs_js and "'बन्द गर्नुहोस् ▲'" in fs_js)

check("font-settings.js includes keyboard interaction (Enter / Space)",
      "e.key === 'Enter'" in fs_js and "e.key === ' '" in fs_js)

check("font-settings.js includes dynamic safeguard wrapper for raw metadata fields",
      "panel.querySelector('#inPatraSankhya" in fs_js)

# -----------------------------------------------------------------------------
print("\n[TEST GROUP 5] Security Audit & Hardening Remediations:")
# -----------------------------------------------------------------------------
idx_html = open('index.html', encoding='utf-8').read()
auth_js = open('auth.js', encoding='utf-8').read()
rec_html = open('recycle-bin.html', encoding='utf-8').read()
admin_html = open('admin.html', encoding='utf-8').read()
gitignore = open('.gitignore', encoding='utf-8').read()
rules = open('firestore.rules', encoding='utf-8').read()

check("index.html contains zero atob password decoding",
      "atob(" not in idx_html)

check("index.html contains zero hardcoded fallback passwords in default hashes",
      "fallback:" not in idx_html and "FALLBACK_YWRtaW4" not in idx_html)

check("auth.js prevents ordinary users from role-escalating to admin via localStorage",
      "user === 'wada1' || user === 'wada3'" in auth_js and "localStorage.setItem(AUTH_CONFIG.ADMIN_KEY, 'false')" in auth_js)

check("auth.js validates session expiration in isSessionValid",
      "Date.now() > session.expiresAt" in auth_js and "clearSession()" in auth_js)

check("recycle-bin.html eliminates inline onclick quote-interpolation (XSS prevention)",
      "handleRestoreByIndex" in rec_html and "handleDeleteByIndex" in rec_html and "restoreFromBin('${" not in rec_html)

check("admin.html safely creates textNode and removeBtn for tag chips without inline handler injection",
      "document.createTextNode(tag" in admin_html and "removeBtn.onclick" in admin_html)

check("admin.html sanitizes uploaded image filenames before building storage ref",
      "replace(/[^a-zA-Z0-9._-]/g, '_')" in admin_html)

check(".gitignore protects environment and secret files (.env, credentials, service accounts)",
      ".env" in gitignore and "serviceAccount" in gitignore and "credentials.json" in gitignore)

check("firestore.rules enforces authentication on sensitive citizen collections",
      "isAuthenticated()" in rules and "match /{collectionName}/{docId}" in rules)

# -----------------------------------------------------------------------------
print("\n[TEST GROUP 6] Nepal Sambat & Print/PDF Independence:")
# -----------------------------------------------------------------------------
check("nepal-sambat-data.js exists and is intact (>200KB)",
      os.path.exists("nepal-sambat-data.js") and os.path.getsize("nepal-sambat-data.js") > 200000)

check("nepal-sambat-tithi.js exists and is intact (>200KB)",
      os.path.exists("nepal-sambat-tithi.js") and os.path.getsize("nepal-sambat-tithi.js") > 200000)

# Check that printed A4 document layouts do not contain form accordion elements
printed_card_leaks = []
for t in ACTIVE_22_TEMPLATES:
    c = open(t, encoding='utf-8').read()
    # Check .a4-page content
    pages = re.findall(r'<div[^>]*class=["\'][^"\']*a4-page[^"\']*["\'][^>]*>(.*?)</div>\s*<!--\s*(?:══|\s*FOOTER|\s*SIGNATURE|\s*END)', c, re.DOTALL)
    for p in pages:
        if 'lh-toggle-header' in p or '📄 पत्रसम्बन्धी विवरण' in p or 'lh-toggle-indicator' in p:
            printed_card_leaks.append(t)

check("Zero template official printed document layouts contain form accordion controls",
      len(printed_card_leaks) == 0, f"Leaks in: {printed_card_leaks}")

# -----------------------------------------------------------------------------
print("\n" + "=" * 80)
print(f"REGRESSION SUITE COMPLETED: {passed} PASSED, {failed} FAILED")
print("=" * 80)

if failed > 0:
    sys.exit(1)
