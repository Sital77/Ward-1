"""
import_beneficiaries.py
Secure repeatable import pipeline for Social Security Beneficiary Register.
Reads the Excel (.xls HTML table) file from `excel data/` and syncs records
to the secure Cloud Firestore collection `socialSecurityBeneficiaries`.

Privacy: Never logs sensitive citizen data.
"""

import os
import sys
import re
import json
import urllib.request
import urllib.error
import time

sys.stdout.reconfigure(encoding='utf-8')

EXCEL_DIR = "excel data"
COLLECTION_NAME = "socialSecurityBeneficiaries"
FIREBASE_API_KEY = "AIzaSyC3uCmLgNN8s0FDMIrkgxR8eH_AvJ_D3J4"
FIREBASE_PROJECT_ID = "gauradaha-ward1"

def locate_excel_file():
    if not os.path.exists(EXCEL_DIR):
        print(f"Error: Directory '{EXCEL_DIR}' does not exist.")
        return None
    files = [f for f in os.listdir(EXCEL_DIR) if f.lower().endswith(('.xls', '.xlsx', '.csv'))]
    if not files:
        print(f"Error: No Excel/CSV file found in '{EXCEL_DIR}'.")
        return None
    return os.path.join(EXCEL_DIR, files[0])

def parse_excel_records(filepath):
    print(f"Processing source file: {os.path.basename(filepath)}")
    with open(filepath, "r", encoding="utf-8-sig", errors="ignore") as f:
        content = f.read()

    rows = re.findall(r'<tr[^>]*>(.*?)</tr>', content, re.DOTALL | re.IGNORECASE)
    if not rows:
        print("Error: No table rows found in file.")
        return None, []

    # Parse headers
    header_cells = re.findall(r'<t[hd][^>]*>(.*?)</t[hd]>', rows[0], re.DOTALL | re.IGNORECASE)
    headers = [re.sub(r'<[^>]+>', '', c).strip() for c in header_cells]

    col_map = {}
    for i, h in enumerate(headers):
        col_map[h] = i

    required_cols = ['पुरा नाम', 'बैंक खाता नं.', 'व्यक्तिगत परिचय नं.']
    for col in required_cols:
        if col not in col_map:
            print(f"Error: Required column '{col}' missing from headers.")
            return None, []

    print(f"Column mapping confirmed: पुरा नाम (idx {col_map['पुरा नाम']}), बैंक खाता नं. (idx {col_map['बैंक खाता नं.']}), व्यक्तिगत परिचय नं. (idx {col_map['व्यक्तिगत परिचय नं.']})")

    idx_name = col_map['पुरा नाम']
    idx_acc = col_map['बैंक खाता नं.']
    idx_card = col_map['व्यक्तिगत परिचय नं.']
    idx_type = col_map.get('सामाजिक सुरक्षाको किसिम', -1)
    idx_father = col_map.get('बाबुको नाम', -1)
    idx_spouse = col_map.get('पति/पत्नीको नाम', -1)
    idx_age = col_map.get('उमेर', -1)
    idx_addr = col_map.get('ठेगाना', -1)

    records = []
    seen_ids = set()
    skipped_count = 0
    duplicate_count = 0

    for r in rows[1:]:
        cells = re.findall(r'<t[hd][^>]*>(.*?)</t[hd]>', r, re.DOTALL | re.IGNORECASE)
        cleaned = [re.sub(r'<[^>]+>', '', c).replace('&nbsp;', ' ').strip() for c in cells]
        if len(cleaned) <= max(idx_name, idx_acc, idx_card):
            skipped_count += 1
            continue

        card_no = cleaned[idx_card].strip()
        name = cleaned[idx_name].strip()
        acc_no = cleaned[idx_acc].strip()

        if not card_no or not name:
            skipped_count += 1
            continue

        if card_no in seen_ids:
            duplicate_count += 1
            continue

        seen_ids.add(card_no)

        rec = {
            "cardNo": card_no,
            "name": name,
            "accountNo": acc_no,
            "allowanceType": cleaned[idx_type].strip() if idx_type != -1 and idx_type < len(cleaned) else "",
            "fatherName": cleaned[idx_father].strip() if idx_father != -1 and idx_father < len(cleaned) else "",
            "spouseName": cleaned[idx_spouse].strip() if idx_spouse != -1 and idx_spouse < len(cleaned) else "",
            "age": cleaned[idx_age].strip() if idx_age != -1 and idx_age < len(cleaned) else "",
            "address": cleaned[idx_addr].strip() if idx_addr != -1 and idx_addr < len(cleaned) else "",
            "ward": "१",
            "sourceFile": os.path.basename(filepath),
            "updatedAt": int(time.time() * 1000)
        }
        records.append(rec)

    stats = {
        "totalRows": len(rows) - 1,
        "validRecords": len(records),
        "skippedRecords": skipped_count,
        "duplicateRecords": duplicate_count
    }
    return stats, records

def get_auth_token():
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={FIREBASE_API_KEY}"
    req = urllib.request.Request(
        url,
        data=json.dumps({"returnSecureToken": True}).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        return res.get('idToken')

def import_to_firestore(records):
    token = get_auth_token()
    commit_url = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT_ID}/databases/(default)/documents:commit"

    batch_size = 400
    total_batches = (len(records) + batch_size - 1) // batch_size
    imported_count = 0

    print(f"Starting Firestore upload: {len(records)} records across {total_batches} batches...")

    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        writes = []

        for rec in batch:
            doc_id = rec["cardNo"]
            doc_path = f"projects/{FIREBASE_PROJECT_ID}/databases/(default)/documents/{COLLECTION_NAME}/{doc_id}"
            fields = {
                "cardNo": {"stringValue": rec["cardNo"]},
                "name": {"stringValue": rec["name"]},
                "accountNo": {"stringValue": rec["accountNo"]},
                "allowanceType": {"stringValue": rec["allowanceType"]},
                "fatherName": {"stringValue": rec["fatherName"]},
                "spouseName": {"stringValue": rec["spouseName"]},
                "age": {"stringValue": rec["age"]},
                "address": {"stringValue": rec["address"]},
                "ward": {"stringValue": rec["ward"]},
                "sourceFile": {"stringValue": rec["sourceFile"]},
                "updatedAt": {"integerValue": str(rec["updatedAt"])}
            }
            writes.append({
                "update": {
                    "name": doc_path,
                    "fields": fields
                }
            })

        req = urllib.request.Request(
            commit_url,
            data=json.dumps({"writes": writes}).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {token}'
            }
        )

        with urllib.request.urlopen(req) as resp:
            if resp.status == 200:
                imported_count += len(batch)
                print(f"  ✓ Batch {i // batch_size + 1}/{total_batches}: {len(batch)} records committed successfully.")
            else:
                print(f"  ✗ Batch {i // batch_size + 1} failed with status {resp.status}")

        time.sleep(0.2)

    return imported_count

def main():
    print("=== SOCIAL SECURITY BENEFICIARY IMPORT PIPELINE ===")
    filepath = locate_excel_file()
    if not filepath:
        sys.exit(1)

    stats, records = parse_excel_records(filepath)
    if not records:
        print("Import terminated due to errors.")
        sys.exit(1)

    print(f"Total spreadsheet rows: {stats['totalRows']}")
    print(f"Valid beneficiary records: {stats['validRecords']}")
    print(f"Skipped rows: {stats['skippedRecords']}")
    print(f"Duplicate identifiers: {stats['duplicateRecords']}")

    imported = import_to_firestore(records)
    print(f"\nImport Complete: Successfully synced {imported} records to collection '{COLLECTION_NAME}' in Firestore.")

if __name__ == "__main__":
    main()
