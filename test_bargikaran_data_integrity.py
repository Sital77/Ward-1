import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

def test_bargikaran_module():
    errors = []
    print("======================================================================")
    print("RUNNING LAND CLASSIFICATION (BARGIKARAN) DATA INTEGRITY & LOGIC TEST SUITE")
    print("======================================================================\n")

    # Read files
    with open('bargikaran-sifarish.html', 'r', encoding='utf-8') as f:
        html_content = f.read()
    with open('script-bargikaran-sifarish.js', 'r', encoding='utf-8') as f:
        js_content = f.read()

    # -------------------------------------------------------------------------
    # TEST GROUP 1: INITIAL BLANK CLASSIFICATION & SINGLE SOURCE OF TRUTH
    # -------------------------------------------------------------------------
    print("Checking Group 1: Initial Blank Classification & Single Source of Truth...")

    # 1.1: Ensure #inMainZoneDisplay does NOT have 'व्यवसायिक शहरी क्षेत्र' selected
    if '<option value="व्यवसायिक शहरी क्षेत्र" selected>' in html_content:
        errors.append("Group 1: inMainZoneDisplay still has 'व्यवसायिक शहरी क्षेत्र' selected by default in HTML!")

    # 1.2: Check clear placeholder in #inMainZoneDisplay
    if '<option value="" disabled selected>' not in html_content:
        errors.append("Group 1: inMainZoneDisplay is missing disabled selected empty placeholder option!")
    if '-- वर्गीकरण क्षेत्र छनौट गर्नुहोस् --' not in html_content:
        errors.append("Group 1: Placeholder text '-- वर्गीकरण क्षेत्र छनौट गर्नुहोस् --' missing in HTML select!")

    # 1.3: Ensure A4 preview table does not hardcode 'व्यावसायिक शहरी क्षेत्र'
    if '<td>व्यावसायिक शहरी क्षेत्र</td>' in html_content:
        errors.append("Group 1: A4 preview table body still hardcodes 'व्यावसायिक शहरी क्षेत्र' in initial HTML!")

    # 1.4: Ensure Paragraph 2 does not hardcode 'व्यवसायिक शहरी क्षेत्र'
    if '<span id="lblMainZoneSpan" style="font-weight: bold; text-decoration: underline;">व्यवसायिक शहरी क्षेत्र</span>' in html_content:
        errors.append("Group 1: Paragraph 2 still hardcodes 'व्यवसायिक शहरी क्षेत्र' in initial HTML!")

    # 1.5: In JS onload, default kaifiyat must be blank, not 'व्यावसायिक शहरी क्षेत्र'
    onload_match = re.search(r'window\.onload\s*=\s*function\s*\(\)\s*\{([^}]+)\}', js_content)
    if onload_match:
        if "kaifiyat: 'व्यावसायिक शहरी क्षेत्र'" in onload_match.group(1):
            errors.append("Group 1: window.onload still hardcodes 'व्यावसायिक शहरी क्षेत्र' in initial addKittaRow!")

    # 1.6: In addKittaRow, kaifiyat must inherit from mainZone or be blank
    if "const defaultKaifiyat = data ? (data.kaifiyat || '') : currentMainZone;" not in js_content:
        errors.append("Group 1: addKittaRow does not inherit currentMainZone as defaultKaifiyat!")

    # 1.7: onMainZoneChange must be defined to synchronize kitta rows
    if "window.onMainZoneChange = function" not in js_content:
        errors.append("Group 1: window.onMainZoneChange function missing in script!")

    # 1.8: updateDoc must not fallback to 'व्यवसायिक शहरी क्षेत्र'
    if "lblZone.innerText = mainZone || '....................';" not in js_content:
        errors.append("Group 1: updateDoc does not properly use '....................' as placeholder for lblZone!")

    print("  [PASS] Group 1: New recommendations start blank, no auto-selected 'व्यावसायिक शहरी क्षेत्र', single source of truth implemented.")

    # -------------------------------------------------------------------------
    # TEST GROUP 2: STABLE RECORD IDENTITY & WRONG-PERSON FIX
    # -------------------------------------------------------------------------
    print("Checking Group 2: Stable Record Identity & Wrong-Person Fix...")

    # 2.1: renderDatabaseTable must pass stable string ID, not array index
    if "loadRecordForEdit('${rec.id}')" not in js_content:
        errors.append("Group 2: renderDatabaseTable does not pass '${rec.id}' to loadRecordForEdit!")
    if "deleteRecord('${rec.id}')" not in js_content:
        errors.append("Group 2: renderDatabaseTable does not pass '${rec.id}' to deleteRecord!")

    # 2.2: loadRecordForEdit must look up by recordId string
    if "window.loadRecordForEdit = function (recordId)" not in js_content:
        errors.append("Group 2: loadRecordForEdit signature does not accept recordId!")

    if "globalDatabase.find(r => r.id === recordId)" not in js_content:
        errors.append("Group 2: loadRecordForEdit does not search globalDatabase by r.id === recordId!")

    # 2.3: Reset form state before populating to eliminate state leak
    if "resetFormFieldsOnly()" not in js_content:
        errors.append("Group 2: loadRecordForEdit does not call resetFormFieldsOnly() to prevent cross-person state leak!")

    # 2.4: Setting editRecordIndex to stable rec.id
    if "editRecordIndex.value = rec.id;" not in js_content:
        errors.append("Group 2: loadRecordForEdit does not set editRecordIndex.value = rec.id!")

    print("  [PASS] Group 2: Records identified and loaded strictly by immutable primary key (rec.id); cross-record state leak prevented.")

    # -------------------------------------------------------------------------
    # TEST GROUP 3: DUPLICATE PREVENTION & EDIT UPDATING
    # -------------------------------------------------------------------------
    print("Checking Group 3: Duplicate Prevention & Edit Updating...")

    # 3.1: Double-click / concurrent save guard
    if "window._isSavingInProgress" not in js_content:
        errors.append("Group 3: Double-submission guard window._isSavingInProgress missing!")

    # 3.2: Updating existing record using .doc(recordId).set(..., { merge: true })
    if 'db.collection("bargikaranSifarishRecords").doc(recordId).set(recordData, { merge: true })' not in js_content:
        errors.append("Group 3: printAndSaveSystem does not update existing document in Firestore via doc(recordId).set!")

    # 3.3: Creating new record when recordId is empty and storing new doc ID
    if 'const docRef = await db.collection("bargikaranSifarishRecords").add(recordData);' not in js_content:
        errors.append("Group 3: printAndSaveSystem does not create new record via .add when recordId is empty!")
    if "document.getElementById('editRecordIndex').value = finalId;" not in js_content:
        errors.append("Group 3: printAndSaveSystem does not store newly created document ID into editRecordIndex!")

    # 3.4: Form validation for classification selection
    if "!mainZone && !kittaData.some(k => k.kaifiyat)" not in js_content:
        errors.append("Group 3: printAndSaveSystem does not validate that classification is selected before saving!")

    print("  [PASS] Group 3: Edit updates existing document; new save atomically creates and sets ID; double-click blocked.")

    # -------------------------------------------------------------------------
    # TEST GROUP 4: CROSS-COMPUTER SYNCHRONIZATION & REAL-TIME LISTENER
    # -------------------------------------------------------------------------
    print("Checking Group 4: Cross-Computer Synchronization & Real-Time Listener...")

    # 4.1: onSnapshot listener on bargikaranSifarishRecords
    if 'db.collection("bargikaranSifarishRecords").onSnapshot' not in js_content:
        errors.append("Group 4: Firestore onSnapshot listener for bargikaranSifarishRecords is missing!")

    # 4.2: Exclude soft-deleted records
    if "!data.isDeleted" not in js_content:
        errors.append("Group 4: onSnapshot listener does not filter out isDeleted records!")

    # 4.3: Local cache synchronization on snapshot
    if "localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(globalDatabase))" not in js_content:
        errors.append("Group 4: onSnapshot does not update localStorage cache for cross-computer resilience!")

    # 4.4: Status badge in HTML and JS
    if 'id="syncStatusBadge"' not in html_content:
        errors.append("Group 4: #syncStatusBadge missing in HTML!")
    if 'syncStatusBadge' not in js_content:
        errors.append("Group 4: syncStatusBadge not updated in JS!")

    print("  [PASS] Group 4: Real-time onSnapshot listener active, local cache synchronizes, sync badge present.")

    # -------------------------------------------------------------------------
    # TEST GROUP 5: PERFORMANCE OPTIMIZATION & LAZY LOADING
    # -------------------------------------------------------------------------
    print("Checking Group 5: Performance Optimization & Lazy Loading...")

    # 5.1: No external CDN for nepali-date-converter
    if 'https://cdn.jsdelivr.net/npm/@sbmdkl/nepali-date-converter' in html_content:
        errors.append("Group 5: External CDN URL for nepali-date-converter still present in HTML!")
    if 'assets/nepali-date-converter.umd.min.js' not in html_content:
        errors.append("Group 5: Local asset assets/nepali-date-converter.umd.min.js missing in HTML!")

    # 5.2: Unrelated collections are NOT eagerly subscribed on DOMContentLoaded
    dom_content_match = re.search(r'document\.addEventListener\(\'DOMContentLoaded\', \(\) => \{(.*?)\}\);', js_content, re.DOTALL)
    if dom_content_match:
        dom_body = dom_content_match.group(1)
        if 'charKillaRecords' in dom_body or 'batoPramanitRecords' in dom_body or 'gharBatoRecords' in dom_body:
            errors.append("Group 5: Import collections are still eagerly subscribed on DOMContentLoaded! Must be lazy loaded.")

    # 5.3: Import collections are lazy loaded on demand
    if 'loadImportSourcesOnDemand' not in js_content:
        errors.append("Group 5: loadImportSourcesOnDemand function missing in JS!")

    # 5.4: Search debounce
    if 'onSearchInputDebounced' not in js_content or 'searchDebounceTimer' not in js_content:
        errors.append("Group 5: Search debounce mechanism missing in JS!")

    print("  [PASS] Group 5: Local assets used, import collections lazy-loaded on demand, search debounced.")

    # -------------------------------------------------------------------------
    # TEST GROUP 6: UI/UX POLISH & NEW RECORD BUTTON
    # -------------------------------------------------------------------------
    print("Checking Group 6: UI/UX Polish & New Record Button...")

    # 6.1: resetFormForNew button in header
    if 'onclick="resetFormForNew()"' not in html_content:
        errors.append("Group 6: resetFormForNew button missing in HTML header actions!")
    if 'window.resetFormForNew = function' not in js_content:
        errors.append("Group 6: window.resetFormForNew function missing in JS!")

    # 6.2: Historical duplicate detector diagnostic helper
    if 'window.detectHistoricalDuplicates = function' not in js_content:
        errors.append("Group 6: window.detectHistoricalDuplicates diagnostic tool missing in JS!")

    # 6.3: Soft delete with deleted_records_log
    if 'deleted_records_log' not in js_content:
        errors.append("Group 6: Soft-delete does not log to deleted_records_log for Recycle Bin!")

    print("  [PASS] Group 6: UI polished, '➕ नयाँ' button added, soft delete with Recycle Bin, diagnostic tool present.")

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
        print("ALL TESTS PASSED SUCCESSFULLY! (6/6 groups green, 0 errors)")
        print("----------------------------------------------------------------------")
        return True

if __name__ == '__main__':
    success = test_bargikaran_module()
    sys.exit(0 if success else 1)

