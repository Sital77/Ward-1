/**
 * Gauradaha Ward No. 1 Sifarish Management System
 * Centralized Safe Save & Deduplication Service (sifarish-save-service.js)
 * 
 * Responsibilities:
 * 1. Safe Nepali Text Normalization & space-insensitive indexing
 * 2. Pre-save deduplication query by unique identity keys (Yojana, Citizen, Land)
 * 3. Atomic Save / Update: if document exists, updates in place; if not, inserts new
 * 4. Concurrency lock against rapid multi-clicks
 * 5. Distinct Quick Print vs Save/Update & Print separation
 * 6. Non-intrusive UI feedback (Nepali toast alerts)
 */

(function (window) {
    'use strict';

    // ── Concurrency / In-Flight Mutex ──
    let isSaveInProgress = false;
    const inFlightRequests = new Map();

    // ── Devanagari Digit Converter ──
    function toNepaliDigits(input) {
        if (input === null || input === undefined) return '';
        const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
        return String(input).replace(/[0-9]/g, function (d) {
            return nepaliDigits[parseInt(d, 10)];
        });
    }

    function toEnglishDigits(input) {
        if (!input) return '';
        const nepaliDigits = { '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9' };
        return String(input).replace(/[०-९]/g, function (d) {
            return nepaliDigits[d] || d;
        });
    }

    // ── Nepali Text Normalizer ──
    function normalizeNepaliText(text) {
        if (!text) return '';
        return String(text)
            .normalize('NFC')
            .replace(/[\u200B-\u200D\uFEFF]/g, '') // remove zero-width spaces/joiners
            .trim()
            .toLowerCase();
    }

    // Normalize text removing ALL spaces (for "राम बहादुर" vs "रामबहादुर" matching)
    function normalizeNoSpace(text) {
        return normalizeNepaliText(text).replace(/\s+/g, '');
    }

    // ── Build Unique Identity Key for Deduplication ──
    function buildRecordIdentityKey(arg1, arg2) {
        let colName = '';
        let data = null;
        if (typeof arg1 === 'string' && typeof arg2 === 'object' && arg2 !== null) {
            colName = arg1;
            data = arg2;
        } else if (typeof arg1 === 'object' && arg1 !== null) {
            data = arg1;
            colName = typeof arg2 === 'string' ? arg2 : (data._collection || '');
        }

        if (!data) return '';
        const normCol = String(colName || '').trim();

        // 1. Yojana (योजना) Collections or Category
        if (normCol === 'yojana' || normCol === 'yojanaSamjhautaRecords' || normCol === 'yojanaTippaniRecords' || normCol === 'yojanaBankRecords' || normCol === 'test_yojanaRecords' || normCol === 'test_rapidRecords') {
            const pName = data.projectName || data.committeeName || data.name || data.budgetTitle || '';
            const ay = data.ay || data.fiscalYear || '';
            const ward = data.createdWard || data.ward || '1';
            const cleanPName = normalizeNoSpace(pName);
            if (!cleanPName) return '';
            return `yojana___${cleanPName}___${normalizeNepaliText(ay)}___${ward}`;
        }

        // 2. Citizen / Personal (व्यक्तिगत) Collections or Category
        const personalCols = [
            'citizen', 'surakshyaSanrakshakTestRecords', 'surakshyaBhattaRecords', 'bankRecords',
            'apangataRecords', 'panRecords', 'abibahitRecords', 'bibahaRecords',
            'nabalakRecords', 'pariwarikRecords', 'aamdaniPramanitRecords', 'abhilekhRecords',
            'test_citizenRecords'
        ];
        if (personalCols.includes(normCol)) {
            // Check primary unique identifiers first
            const primaryId = data.cardNo || data.citNo || data.beneficiaryCitNo || data.citizenshipNo || data.nid || data.panNo || '';
            const cleanId = toEnglishDigits(primaryId).replace(/[^0-9a-zA-Z]/g, '').trim();
            if (cleanId) {
                return `citizen_id___${cleanId}`;
            }

            // Fallback: Safe combination of name + relative / DOB / fiscal year
            const citizenName = data.beneficiaryName || data.applicantName || data.name || '';
            const cleanName = normalizeNoSpace(citizenName);
            const relativeName = normalizeNoSpace(data.fatherName || data.spouseName || data.guardianName || '');
            const ay = normalizeNepaliText(data.ay || data.fiscalYear || '');
            if (!cleanName) return '';
            return `citizen_profile___${cleanName}___${relativeName}___${ay}`;
        }

        // 3. Land / Property (जग्गा) Collections or Category
        const landCols = [
            'land', 'charKillaRecords', 'gharBatoRecords', 'batoPramanitRecords',
            'bargikaranSifarishRecords', 'jaggadhaniPratilipiRecords', 'jaggadhaniPoojaRecords',
            'gharKayamRecords', 'suchanaTansRecords'
        ];
        if (landCols.includes(normCol)) {
            const appName = normalizeNoSpace(data.applicantName || data.name || data.ownerName || '');
            const kitta = toEnglishDigits(data.kittaNo || data.plotNo || data.kitta || '').replace(/[^0-9]/g, '');
            const ward = data.createdWard || data.ward || '1';
            if (appName && kitta) {
                return `land_kitta___${appName}___${kitta}___${ward}`;
            }
            const sheet = normalizeNoSpace(data.sheetNo || data.nakshaSheet || '');
            if (appName && sheet) {
                return `land_profile___${appName}___${sheet}___${ward}`;
            }
        }

        // 4. General fallback
        const genName = normalizeNoSpace(data.name || data.applicantName || data.committeeName || data.projectName || data.title || '');
        const genAY = normalizeNepaliText(data.ay || data.fiscalYear || '');
        return genName ? `gen___${genName}___${genAY}` : '';
    }

    // ── Find Existing Record by Identity ──
    async function findExistingRecord(arg1, arg2, arg3, arg4) {
        let db = null;
        let colName = '';
        let data = null;
        let currentEditId = '';

        if (Array.isArray(arg1)) {
            // Called as findExistingRecord(recordsArray, data, category)
            const records = arg1;
            data = arg2;
            const category = arg3 || '';
            if (!data) return null;
            const targetKey = buildRecordIdentityKey(data, category);
            if (!targetKey) return null;
            for (const item of records) {
                if (item.isDeleted) continue;
                const itemKey = buildRecordIdentityKey(item, category);
                if (itemKey && itemKey === targetKey) {
                    return item;
                }
            }
            return null;
        }

        db = arg1;
        colName = arg2;
        data = arg3;
        currentEditId = arg4 || '';

        if (!data) return null;
        const targetKey = buildRecordIdentityKey(colName, data);
        if (!targetKey) return null;

        // 1. Check in-memory database cache if available on page
        const inMemory = Array.isArray(window.globalDatabase) ? window.globalDatabase : [];
        for (const item of inMemory) {
            if (item.isDeleted) continue;
            if (currentEditId && item.id === currentEditId) continue;
            const itemKey = buildRecordIdentityKey(colName, item);
            if (itemKey && itemKey === targetKey) {
                return item;
            }
        }

        // 2. Query Firestore if db connection is provided
        if (!db) return null;
        try {
            // A. If citizen has a primary cardNo/citNo, query directly
            const primaryId = data.cardNo || data.citNo || data.beneficiaryCitNo || data.citizenshipNo || '';
            if (primaryId) {
                const snap = await db.collection(colName).where('cardNo', '==', primaryId).limit(5).get();
                for (const doc of snap.docs) {
                    if (currentEditId && doc.id === currentEditId) continue;
                    const d = doc.data();
                    if (!d.isDeleted) return { id: doc.id, ...d };
                }
            }

            // B. If Yojana, query by projectName
            const pName = data.projectName || data.name || '';
            if (pName) {
                const snap = await db.collection(colName).where('projectName', '==', pName).limit(5).get();
                for (const doc of snap.docs) {
                    if (currentEditId && doc.id === currentEditId) continue;
                    const d = doc.data();
                    if (!d.isDeleted) return { id: doc.id, ...d };
                }
            }

            // C. Fallback: Scan recent records from collection (up to 60) to catch spacing/quote variants
            const recentSnap = await db.collection(colName).orderBy('timestamp', 'desc').limit(60).get();
            for (const doc of recentSnap.docs) {
                if (currentEditId && doc.id === currentEditId) continue;
                const d = doc.data();
                if (d.isDeleted) continue;
                const docKey = buildRecordIdentityKey(colName, d);
                if (docKey && docKey === targetKey) {
                    return { id: doc.id, ...d };
                }
            }
        } catch (e) {
            console.warn("[SifarishSaveService] findExistingRecord query warning:", e);
        }

        return null;
    }

    // ── Toast Notification Helper ──
    function showToast(message, type = 'info') {
        const existing = document.getElementById('sifarishToastNotification');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'sifarishToastNotification';
        const bgColors = {
            success: '#2b6cb0',
            warning: '#c05621',
            error: '#9b2c2c',
            info: '#2d3748'
        };
        const icons = {
            success: '✅',
            warning: '⚠️',
            error: '❌',
            info: 'ℹ️'
        };

        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: ${bgColors[type] || bgColors.info};
            color: #ffffff;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 14px rgba(0,0,0,0.25);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 0.95rem;
            font-weight: 600;
            z-index: 999999;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: sifarishToastFadeIn 0.25s ease-out;
            max-width: 450px;
        `;
        toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
        document.body.appendChild(toast);

        setTimeout(() => {
            if (toast && toast.parentNode) {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }
        }, 3800);
    }

    // ── Unified Atomic Save/Update Function ──
    async function saveOrUpdateRecord(options) {
        const db = options.db;
        const collectionName = options.collectionName || options.colName;
        const data = options.data || options.recordData;
        let recordId = options.recordId || '';
        const category = options.category || '';
        const editIndexId = options.editIndexId || 'editRecordIndex';
        const btnElement = options.btnElement || null;
        const formTitleId = options.formTitleId || 'formMainTitle';
        const formTitlePrefix = options.formTitlePrefix || '🔄 सम्पादन मोड: ';

        if (!db || !collectionName || !data) {
            throw new Error("Missing db, collectionName, or data in SifarishSaveService.saveOrUpdateRecord");
        }

        // Rapid click & in-flight guard
        const identityKey = buildRecordIdentityKey(collectionName, data) || collectionName;
        if (isSaveInProgress || inFlightRequests.has(identityKey)) {
            console.warn("[SifarishSaveService] Save already in progress, blocking concurrent save request.");
            return { blocked: true, action: 'locked' };
        }

        isSaveInProgress = true;
        inFlightRequests.set(identityKey, true);

        const originalBtnText = btnElement ? btnElement.innerHTML : '';
        if (btnElement) {
            btnElement.disabled = true;
            btnElement.innerHTML = `⏳ सुरक्षित हुँदैछ...`;
        }

        try {
            const editIndexEl = typeof document !== 'undefined' ? document.getElementById(editIndexId) : null;
            let editId = recordId || (editIndexEl ? editIndexEl.value.trim() : '');

            // Check if record already exists by identity if editId is not set
            let existingDoc = null;
            if (!editId) {
                existingDoc = await findExistingRecord(db, collectionName, data, editId);
                if (existingDoc && existingDoc.id) {
                    editId = existingDoc.id;
                    if (editIndexEl) editIndexEl.value = editId;
                }
            }

            const timestampNow = Date.now();
            let savedId = editId;
            let wasUpdated = false;

            if (editId) {
                // Update existing record
                wasUpdated = true;
                data.lastUpdatedAt = timestampNow;
                data.lastUpdatedBy = localStorage.getItem('sifarish_user') || 'wada1';
                await db.collection(collectionName).doc(editId).set(data, { merge: true });
                savedId = editId;
                if (typeof showToast === 'function') {
                    showToast("अवस्थित अभिलेख फेला पर्यो - सोही अभिलेख अपडेट गरियो !", "info");
                }
            } else {
                // Create brand new record
                data.timestamp = timestampNow;
                data.createdAt = timestampNow;
                data.createdBy = data.createdBy || localStorage.getItem('sifarish_user') || 'wada1';
                data.createdWard = data.createdWard || localStorage.getItem('sifarish_ward') || '1';
                const docRef = await db.collection(collectionName).add(data);
                savedId = docRef.id;
                if (editIndexEl) editIndexEl.value = savedId;
                if (typeof showToast === 'function') {
                    showToast("नयाँ सिफारिस अभिलेख सफलतापूर्वक सुरक्षित भयो !", "success");
                }
            }

            // Update page UI title to reflect edit mode
            const formTitleEl = typeof document !== 'undefined' ? document.getElementById(formTitleId) : null;
            if (formTitleEl) {
                const docDisplayName = data.projectName || data.beneficiaryName || data.applicantName || data.name || '';
                formTitleEl.innerText = `${formTitlePrefix}${docDisplayName}`;
            }

            return {
                success: true,
                savedId: savedId,
                action: wasUpdated ? 'updated' : 'created'
            };
        } finally {
            isSaveInProgress = false;
            inFlightRequests.delete(identityKey);
            if (btnElement) {
                btnElement.disabled = false;
                btnElement.innerHTML = originalBtnText;
            }
        }
    }

    // ── Quick Print Only (No Database Write) ──
    function printOnly() {
        if (typeof showToast === 'function') {
            showToast("सिफारिस प्रिन्ट मात्र गरिँदैछ (अभिलेखमा कुनै परिवर्तन गरिएको छैन) ।", "info");
        }
        window.print();
    }

    // Expose Global Service
    window.SifarishSaveService = {
        toNepaliDigits,
        toEnglishDigits,
        normalizeNepaliText,
        normalizeNoSpace,
        buildRecordIdentityKey,
        findExistingRecord,
        showToast,
        saveOrUpdateRecord,
        printOnly
    };

})(window);
