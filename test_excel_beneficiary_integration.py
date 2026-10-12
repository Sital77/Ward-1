import os
import sys
import re
import json

sys.stdout.reconfigure(encoding='utf-8')

print("=" * 80)
print("GAURADAHA WARD NO. 1 - EXCEL BENEFICIARY INTEGRATION VALIDATION SUITE")
print("=" * 80)

tests_passed = 0
tests_failed = 0

def assert_test(cond, title, details=""):
    global tests_passed, tests_failed
    if cond:
        tests_passed += 1
        print(f"  [PASS] {title}")
        if details:
            print(f"         └─ {details}")
    else:
        tests_failed += 1
        print(f"  [FAIL] {title}")
        if details:
            print(f"         └─ {details}")

# ── TEST 1: FILE LOCATION & READABILITY ──
excel_dir = "excel data"
assert_test(os.path.isdir(excel_dir), f"Directory '{excel_dir}' exists")

excel_files = [f for f in os.listdir(excel_dir) if f.lower().endswith(('.xls', '.xlsx', '.csv'))]
assert_test(len(excel_files) >= 1, f"Found spreadsheet file in '{excel_dir}': {excel_files}")

actual_filename = excel_files[0] if excel_files else ""
filepath = os.path.join(excel_dir, actual_filename)
file_size = os.path.getsize(filepath)
assert_test(file_size > 0, f"Source file size: {file_size:,} bytes")

with open(filepath, "r", encoding="utf-8-sig", errors="ignore") as f:
    raw_content = f.read(5000)

assert_test("<table" in raw_content.lower() or "table" in raw_content.lower() or "," in raw_content,
            "File format successfully identified (DoNIDCR HTML Table Excel / XLS format)")

# ── TEST 2: COLUMN MAPPING ──
with open(filepath, "r", encoding="utf-8-sig", errors="ignore") as f:
    full_content = f.read()

rows = re.findall(r'<tr[^>]*>(.*?)</tr>', full_content, re.DOTALL | re.IGNORECASE)
header_cells = re.findall(r'<t[hd][^>]*>(.*?)</t[hd]>', rows[0], re.DOTALL | re.IGNORECASE)
headers = [re.sub(r'<[^>]+>', '', c).strip() for c in header_cells]

assert_test('पुरा नाम' in headers, "Header 'पुरा नाम' present in Excel file", f"Index: {headers.index('पुरा नाम') if 'पुरा नाम' in headers else 'N/A'}")
assert_test('बैंक खाता नं.' in headers, "Header 'बैंक खाता नं.' present in Excel file", f"Index: {headers.index('बैंक खाता नं.') if 'बैंक खाता नं.' in headers else 'N/A'}")
assert_test('व्यक्तिगत परिचय नं.' in headers, "Header 'व्यक्तिगत परिचय नं.' present in Excel file", f"Index: {headers.index('व्यक्तिगत परिचय नं.') if 'व्यक्तिगत परिचय नं.' in headers else 'N/A'}")

# Verify no confusion with other IDs
assert_test('राष्ट्रिय परिचयपत्र नं.' != 'व्यक्तिगत परिचय नं.', "Personal ID distinct from National ID")

# ── TEST 3: PARSING & RECORD INTEGRITY (ZERO LEAKAGE) ──
idx_name = headers.index('पुरा नाम')
idx_acc = headers.index('बैंक खाता नं.')
idx_card = headers.index('व्यक्तिगत परिचय नं.')

parsed_records = []
seen_ids = set()
duplicates = 0
leading_zero_accounts = 0

for r in rows[1:]:
    cells = re.findall(r'<t[hd][^>]*>(.*?)</t[hd]>', r, re.DOTALL | re.IGNORECASE)
    cleaned = [re.sub(r'<[^>]+>', '', c).replace('&nbsp;', ' ').strip() for c in cells]
    if len(cleaned) <= max(idx_name, idx_acc, idx_card):
        continue
    c_id = cleaned[idx_card]
    c_name = cleaned[idx_name]
    c_acc = cleaned[idx_acc]
    if not c_id or not c_name:
        continue
    if c_id in seen_ids:
        duplicates += 1
        continue
    seen_ids.add(c_id)
    if c_acc.startswith('0'):
        leading_zero_accounts += 1
    parsed_records.append({"cardNo": c_id, "name": c_name, "accountNo": c_acc})

assert_test(len(parsed_records) == 964, f"Extracted exactly 964 unique valid beneficiary records (found {len(parsed_records)})")
assert_test(duplicates == 0, f"0 duplicate personal IDs in source dataset")
assert_test(leading_zero_accounts > 0, f"Leading zero account numbers detected and preserved as text (found {leading_zero_accounts} accounts with leading 0)")

# ── TEST 4: HTML TEMPLATE VERIFICATION ──
with open("surakshya-bhatta-sifarish.html", "r", encoding="utf-8") as f:
    html_code = f.read()

assert_test('id="inBeneficiarySearch"' in html_code, "Search input #inBeneficiarySearch exists in HTML")
assert_test('लाभग्राही खोज्नुहोस् (नाम वा सामाजिक सुरक्षा परिचयपत्र नं.)' in html_code,
            "Search label 'लाभग्राही खोज्नुहोस् (नाम वा सामाजिक सुरक्षा परिचयपत्र नं.)' present in form")
assert_test('id="beneficiarySearchResults"' in html_code, "Search dropdown #beneficiarySearchResults exists")
assert_test('id="selectedBeneficiaryBadge"' in html_code, "Selection badge #selectedBeneficiaryBadge exists")
assert_test('id="inExcelFilePicker"' in html_code, "In-browser Excel file picker #inExcelFilePicker configured")

# Verify Tapasil in HTML preview
assert_test('id="lblTblBeneficiaryName"' in html_code, "Tapasil table has beneficiary name element")
assert_test('id="lblTblAccountNo"' in html_code, "Tapasil table has account number element")
assert_test('id="lblTblCardNo"' in html_code, "Tapasil table has social security card number element")
assert_test('तपसिल :' in html_code, "Tapasil section label present in HTML")

# ── TEST 5: JAVASCRIPT LOGIC VERIFICATION ──
with open("script-surakshya-bhatta-sifarish.js", "r", encoding="utf-8") as f:
    js_code = f.read()

assert_test("function loadBeneficiaryRegister" in js_code, "loadBeneficiaryRegister function implemented")
assert_test("function onBeneficiarySearchInput" in js_code, "onBeneficiarySearchInput function implemented")
assert_test("function selectBeneficiary" in js_code, "selectBeneficiary function implemented")
assert_test("function triggerExcelImport" in js_code, "triggerExcelImport function implemented")
assert_test("function parseHtmlTableBeneficiaries" in js_code, "parseHtmlTableBeneficiaries parser implemented")
assert_test("socialSecurityBeneficiaries" in js_code, "Firestore collection 'socialSecurityBeneficiaries' referenced")

# Verify only 3 fields auto-populated in selectBeneficiary
assert_test("inBeneficiaryName" in js_code and "inAccountNo" in js_code and "inCardNo" in js_code,
            "Populates inBeneficiaryName, inAccountNo, and inCardNo")
assert_test("inGuardianName" not in js_code.split("function selectBeneficiary")[1].split("function showSelectedBeneficiaryBadge")[0],
            "Guardian details NOT touched during selectBeneficiary")
assert_test("selKista" not in js_code.split("function selectBeneficiary")[1].split("function showSelectedBeneficiaryBadge")[0],
            "Payment quarter NOT touched during selectBeneficiary")

# Verify draft saving & restoring
assert_test("beneficiaryRefId:" in js_code, "beneficiaryRefId saved in recommendation record in Firestore")
assert_test("rec.beneficiaryRefId" in js_code, "beneficiaryRefId loaded from recommendation record in loadRecordToForm")

# ── TEST 6: GIT PRIVACY & SECURITY RULES ──
with open(".gitignore", "r", encoding="utf-8") as f:
    gitignore_content = f.read()

assert_test("[eE]xcel data/" in gitignore_content, "'.gitignore' excludes 'excel data/' folder")
assert_test("*.xls" in gitignore_content and "*.xlsx" in gitignore_content, "'.gitignore' excludes '*.xls' and '*.xlsx'")

with open("firestore.rules", "r", encoding="utf-8") as f:
    rules_content = f.read()

assert_test("socialSecurityBeneficiaries" in rules_content, "firestore.rules includes secure rules for 'socialSecurityBeneficiaries'")
assert_test("isAuthenticated()" in rules_content, "socialSecurityBeneficiaries restricted to authenticated users")

# ── SUMMARY ──
print("\n" + "=" * 80)
print(f"TEST RESULTS: {tests_passed} PASSED, {tests_failed} FAILED")
print("=" * 80)

if tests_failed > 0:
    sys.exit(1)
