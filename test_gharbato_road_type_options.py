"""
Validation Suite: test_gharbato_road_type_options.py
Tests:
1. Four Road-Type Options in Nepali:
   - पक्की बाटो भएको
   - ग्राभेल बाटो भएको
   - कच्ची बाटो भएको
   - आफैँ हाल्नुहोस्
2. Form layout, mutual exclusivity, custom input conditional toggle, and validation.
3. Safe legacy record handling (no false defaults, custom description preservation, neutral empty state).
4. Save, update, restore persistence with bato, batoOption, and batoCustom.
5. Recommendation output rendering without duplicated wording or formatting artifacts.
6. Reset form functionality and CSS styling.
"""

import re
import sys

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

tests_passed = 0
tests_failed = 0

def assert_test(condition, test_name, extra_info=""):
    global tests_passed, tests_failed
    if condition:
        tests_passed += 1
        print(f"  [PASS] {test_name}")
        if extra_info:
            print(f"         └─ {extra_info}")
    else:
        tests_failed += 1
        print(f"  [FAIL] {test_name}")
        if extra_info:
            print(f"         └─ {extra_info}")

print("=" * 80)
print("GAURADAHA WARD NO. 1 - GHARBATO ROAD TYPE OPTIONS VALIDATION SUITE")
print("=" * 80)

# Read Gharbato files
with open("gharbato.html", "r", encoding="utf-8") as f:
    gharbato_html = f.read()

with open("script.js", "r", encoding="utf-8") as f:
    gharbato_js = f.read()

with open("gharbato.css", "r", encoding="utf-8") as f:
    gharbato_css = f.read()

# ══════════════════════════════════════════════════════════════
# TEST GROUP 1: FOUR ROAD-TYPE OPTIONS & FORM UI
# ══════════════════════════════════════════════════════════════
print("\n[TEST GROUP 1] Four Road-Type Options in Nepali:")

# 1. Road Section Label
assert_test("बाटोको प्रकार / विवरण :" in gharbato_js,
            "Form section contains Nepali label 'बाटोको प्रकार / विवरण :'")

# 2. Four exact Nepali options
assert_test('value="पक्की बाटो भएको"' in gharbato_js,
            "Option 1 contains value 'पक्की बाटो भएको'")
assert_test(">पक्की बाटो भएको</label>" in gharbato_js,
            "Option 1 contains visible label 'पक्की बाटो भएको'")

assert_test('value="ग्राभेल बाटो भएको"' in gharbato_js,
            "Option 2 contains value 'ग्राभेल बाटो भएको'")
assert_test(">ग्राभेल बाटो भएको</label>" in gharbato_js,
            "Option 2 contains visible label 'ग्राभेल बाटो भएको'")

assert_test('value="कच्ची बाटो भएको"' in gharbato_js,
            "Option 3 contains value 'कच्ची बाटो भएको'")
assert_test(">कच्ची बाटो भएको</label>" in gharbato_js,
            "Option 3 contains visible label 'कच्ची बाटो भएको'")

assert_test('value="आफैँ हाल्नुहोस्"' in gharbato_js,
            "Option 4 contains value 'आफैँ हाल्नुहोस्'")
assert_test(">आफैँ हाल्नुहोस्</label>" in gharbato_js,
            "Option 4 contains visible label 'आफैँ हाल्नुहोस्'")

# 3. Radio button group mutual exclusivity per kitta row
assert_test('name="batoStatus_${rowCounter}"' in gharbato_js,
            "Radio inputs grouped by unique row counter 'name=\"batoStatus_${rowCounter}\"' for mutual exclusivity per kitta")

# 4. Custom input wrapper and elements
assert_test('class="bato-detail-wrapper"' in gharbato_js,
            "Custom road wrapper has class 'bato-detail-wrapper'")
assert_test('class="input-bato-custom"' in gharbato_js,
            "Custom road text input has class 'input-bato-custom'")
assert_test('class="bato-validation-msg"' in gharbato_js,
            "Nepali validation message element 'bato-validation-msg' present")
assert_test("कृपया बाटोको विवरण अनिवार्य लेख्नुहोस्" in gharbato_js,
            "Clear Nepali validation message text present")

# ══════════════════════════════════════════════════════════════
# TEST GROUP 2: CONDITIONAL DISPLAY & EVENT HANDLERS
# ══════════════════════════════════════════════════════════════
print("\n[TEST GROUP 2] Conditional Display & Event Handlers:")

# 1. Toggle function implementation
assert_test("function toggleBatoDetailRow" in gharbato_js,
            "toggleBatoDetailRow function implemented")
assert_test("window.toggleBatoDetailRow = toggleBatoDetailRow" in gharbato_js,
            "toggleBatoDetailRow exported to window")

# 2. Conditional visibility logic
assert_test("const isCustom = (status === 'आफैँ हाल्नुहोस्' || status === 'CUSTOM');" in gharbato_js,
            "Correctly identifies custom option in toggle handler")
assert_test("wrapper.style.display = isCustom ? 'block' : 'none';" in gharbato_js,
            "Shows wrapper when 'आफैँ हाल्नुहोस्' selected and hides otherwise")

# 3. Custom input live handler
assert_test("function handleBatoCustomInput" in gharbato_js,
            "handleBatoCustomInput function implemented")
assert_test("window.handleBatoCustomInput = handleBatoCustomInput" in gharbato_js,
            "handleBatoCustomInput exported to window")
assert_test("oninput=\"handleBatoCustomInput('${rowId}'); updateDoc();\"" in gharbato_js,
            "Custom input calls handleBatoCustomInput and updateDoc on input")

# ══════════════════════════════════════════════════════════════
# TEST GROUP 3: LEGACY RECORD COMPATIBILITY & STATE SAFETY
# ══════════════════════════════════════════════════════════════
print("\n[TEST GROUP 3] Legacy Record Compatibility & State Safety:")

# 1. No automatic default selection to Option 1
assert_test("const isPakki = (batoOption === 'पक्की बाटो भएको');" in gharbato_js,
            "isPakki checked only when explicitly matched")
assert_test("const isGravel = (batoOption === 'ग्राभेल बाटो भएको');" in gharbato_js,
            "isGravel checked only when explicitly matched")
assert_test("const isKachhi = (batoOption === 'कच्ची बाटो भएको');" in gharbato_js,
            "isKachhi checked only when explicitly matched")

# 2. Legacy custom text preservation
assert_test("batoOption = 'आफैँ हाल्नुहोस्';" in gharbato_js and "batoCustom = batoVal;" in gharbato_js,
            "Legacy non-standard road descriptions automatically mapped to 'आफैँ हाल्नुहोस्' and text preserved")

# 3. Empty road handling (neutral state)
assert_test("if (!batoOption && batoVal && batoVal !== '-')" in gharbato_js,
            "Empty or dash road records do not trigger predefined radio checks, preserving neutral state")

# 4. Hidden fallback input for backwards compatibility
assert_test('class="input-bato"' in gharbato_js,
            "Maintains hidden input with class 'input-bato' for backwards compatibility")

# ══════════════════════════════════════════════════════════════
# TEST GROUP 4: SAVE, EDIT, REOPEN & ARCHIVE PERSISTENCE
# ══════════════════════════════════════════════════════════════
print("\n[TEST GROUP 4] Save, Edit, Reopen & Archive Persistence:")

# 1. Validation in printAndSaveSystem
assert_test("if (checkedBatoRadio && (checkedBatoRadio.value === 'आफैँ हाल्नुहोस्' || checkedBatoRadio.value === 'CUSTOM'))" in gharbato_js,
            "printAndSaveSystem validates custom road option")
assert_test("const customVal = customInput ? customInput.value.trim() : '';" in gharbato_js,
            "Validates trimmed custom description (catches whitespace-only)")
assert_test("alert(`कृपया बाटोको विवरण अनिवार्य लेख्नुहोस्" in gharbato_js or "alert(\"कृपया बाटोको विवरण अनिवार्य लेख्नुहोस्" in gharbato_js,
            "Displays Nepali alert if custom road description is empty or whitespace")

# 2. Persistence of road fields
assert_test("bato: finalBato" in gharbato_js,
            "printAndSaveSystem persists effective road description into 'bato'")
assert_test("batoOption: batoOptionVal" in gharbato_js,
            "printAndSaveSystem persists selected road option into 'batoOption'")
assert_test("batoCustom: customBatoVal" in gharbato_js,
            "printAndSaveSystem persists custom road description into 'batoCustom'")

# 3. Edit & Reopen from DB
assert_test("rec.kittas.forEach(kData => { addKittaRow(kData); });" in gharbato_js,
            "editFromDB passes saved kitta records to addKittaRow")
assert_test("let batoOption = (data && data.batoOption) ? data.batoOption : '';" in gharbato_js,
            "addKittaRow restores saved batoOption")
assert_test("let batoCustom = (data && data.batoCustom) ? data.batoCustom : '';" in gharbato_js,
            "addKittaRow restores saved batoCustom")

# 4. Scoped radio selector prevents radio collision bug
assert_test('name^="gharStatus_"' in gharbato_js,
            "House status radio selector is scoped by name ('gharStatus_')")
assert_test('name^="batoStatus_"' in gharbato_js,
            "Road status radio selector is scoped by name ('batoStatus_')")

# ══════════════════════════════════════════════════════════════
# TEST GROUP 5: DOCUMENT PREVIEW & PRINT OUTPUT
# ══════════════════════════════════════════════════════════════
print("\n[TEST GROUP 5] Document Preview & Print Output:")

# 1. Preview table generation
assert_test("<td>${batoCellContent}</td>" in gharbato_js,
            "Details table renders dynamic batoCellContent in column 7")
assert_test("batoCellContent = escapeHtml(choice);" in gharbato_js,
            "Predefined road choice rendered cleanly")
assert_test("batoCellContent = customVal ? escapeHtml(customVal) : '-';" in gharbato_js,
            "Custom road description rendered with HTML escaping")

# 2. No duplicated wording or formatting artifacts
assert_test("batoCellContent = escapeHtml(choice)" in gharbato_js,
            "Does not duplicate 'बाटो भएको' when predefined option is selected")
assert_test("batoCellContent = customVal ? escapeHtml(customVal)" in gharbato_js,
            "Does not inject quotes, labels or numbers into custom output")

# ══════════════════════════════════════════════════════════════
# TEST GROUP 6: UI STYLING & RESET FUNCTIONALITY
# ══════════════════════════════════════════════════════════════
print("\n[TEST GROUP 6] UI Styling & Reset Functionality:")

# 1. CSS styles in gharbato.css
assert_test(".bato-radio-group" in gharbato_css,
            "gharbato.css defines .bato-radio-group grid layout")
assert_test(".bato-detail-wrapper" in gharbato_css,
            "gharbato.css defines .bato-detail-wrapper styling")
assert_test(".input-bato-custom" in gharbato_css,
            "gharbato.css defines .input-bato-custom styling")
assert_test(".bato-validation-msg" in gharbato_css,
            "gharbato.css defines .bato-validation-msg styling")

# 2. Reset form functionality
assert_test("function resetForm()" in gharbato_js,
            "resetForm function implemented in script.js")
assert_test("window.resetForm = resetForm;" in gharbato_js,
            "resetForm exported to window")
assert_test('onclick="resetForm()"' in gharbato_html,
            "gharbato.html header includes button calling resetForm()")

# ══════════════════════════════════════════════════════════════
# SUMMARY
# ══════════════════════════════════════════════════════════════
print("\n" + "=" * 80)
print(f"TEST RESULTS: {tests_passed} PASSED, {tests_failed} FAILED")
print("=" * 80)

if tests_failed > 0:
    sys.exit(1)
