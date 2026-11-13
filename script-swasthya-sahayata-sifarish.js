// ══════════════════════════════════════════════════════
//  script-swasthya-sahayata-sifarish.js
//  स्वास्थ्य सहायता सिफारिस — Firebase Firestore & Classic Layout Logic
//  Collection: swasthyaSahayataRecords
// ══════════════════════════════════════════════════════

const firebaseConfig = {
    apiKey: "AIzaSyC3uCmLgNN8s0FDMIrkgxR8eH_AvJ_D3J4",
    authDomain: "gauradaha-ward1.firebaseapp.com",
    projectId: "gauradaha-ward1",
    storageBucket: "gauradaha-ward1.firebasestorage.app",
    messagingSenderId: "905617778132",
    appId: "1:905617778132:web:b8149cf37ae3f3c3b42241"
};

if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore() : null;
window.db = db;

let globalDatabase = [];
window.globalDatabase = globalDatabase;

// ── 1. Digit & Year Helpers ──
function toNepaliDigit(num) {
    if (num === null || num === undefined) return '';
    const nd = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return String(num).split('').map(c => (c >= '0' && c <= '9') ? nd[parseInt(c, 10)] : c).join('');
}
window.toNepaliDigit = toNepaliDigit;

function getSelectedAY() {
    const radios = document.querySelectorAll('input[name="ayRadio"]');
    for (const r of radios) {
        if (r.checked) return r.value;
    }
    return '२०८३/०८४';
}
window.getSelectedAY = getSelectedAY;

// ── 2. Management Section Toggle (Hidden by Default) ──
function toggleManagementSection() {
    const sec = document.getElementById('sectionManagement');
    const btn = document.getElementById('btnToggleMgmt');
    if (!sec || !btn) return;
    const isHidden = (sec.style.display === 'none' || sec.style.display === '');
    sec.style.display = isHidden ? 'block' : 'none';
    btn.innerHTML = isHidden ? '⚙️ सिफारिस व्यवस्थापन सेटिङ लुकाउनुहोस्' : '⚙️ सिफारिस व्यवस्थापन सेटिङ देखाउनुहोस्';
}
window.toggleManagementSection = toggleManagementSection;

// ── 3. Signatory Selection & Position ──
function toggleCustomSign() {
    const val = document.getElementById('inSignAuthority')?.value || '';
    const box = document.getElementById('customSignBox');
    if (box) box.style.display = (val === 'CUSTOM') ? 'block' : 'none';
}
window.toggleCustomSign = toggleCustomSign;

function adjustSignaturePosition(val) {
    const badge = document.getElementById('marginVal');
    if (badge) badge.innerText = toNepaliDigit(val) + " px";
    const footer = document.getElementById('docFooterSection');
    if (footer) footer.style.marginTop = val + "px";
}
window.adjustSignaturePosition = adjustSignaturePosition;

// ── 4. Disease Type Toggle ──
function onDiseaseTypeChange() {
    const val = document.getElementById('inDiseaseType')?.value || 'मुटु रोग';
    const div = document.getElementById('divOtherDisease');
    if (div) {
        div.style.display = (val === 'अन्य') ? 'block' : 'none';
    }
    updateDoc();
}
window.onDiseaseTypeChange = onDiseaseTypeChange;

// ── 5. Mobile & UI Helpers ──
function setMobileTab(tab) {
    const isForm = tab === 'form';
    document.querySelector('.input-panel')?.classList.toggle('active', isForm);
    document.querySelector('.preview-panel')?.classList.toggle('active', !isForm);
    document.getElementById('btnMobForm')?.classList.toggle('active', isForm);
    document.getElementById('btnMobPreview')?.classList.toggle('active', !isForm);
}
window.setMobileTab = setMobileTab;

function toggleModal(show) {
    const modal = document.getElementById('abhilekhModal');
    if (!modal) return;
    modal.style.display = show ? 'flex' : 'none';
    if (show) renderDatabaseTable();
}
window.toggleModal = toggleModal;

function exportToPdf() {
    window.print();
}
window.exportToPdf = exportToPdf;

// ── 6. Date Helpers (Kathmandu Time UTC +5:45) ──
function getKathmanduISODate() {
    const now = new Date();
    const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
    const ktmMs = utcMs + (5 * 3600000) + (45 * 60000);
    const ktm = new Date(ktmMs);
    const y = ktm.getFullYear();
    const m = String(ktm.getMonth() + 1).padStart(2, '0');
    const d = String(ktm.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function setCurrentNepaliDate() {
    const iso = getKathmanduISODate();
    let bsDate = '२०८३/०१/०१';
    try {
        const converter = window["@sbmdkl/nepali-date-converter"];
        if (converter && typeof converter.adToBs === 'function') {
            const res = converter.adToBs(iso);
            if (res) {
                const parts = res.split('-');
                if (parts.length === 3) {
                    bsDate = `${toNepaliDigit(parts[0])}/${toNepaliDigit(parts[1])}/${toNepaliDigit(parts[2])}`;
                }
            }
        } else {
            bsDate = '२०८३/०१/०१';
        }
    } catch (e) {
        bsDate = '२०८३/०१/०१';
    }

    const dateInput = document.getElementById('inMiti');
    if (dateInput) {
        dateInput.value = bsDate;
    }
    updateDoc();
}
window.setCurrentNepaliDate = setCurrentNepaliDate;

// ── 7. Live Preview Updater (Classic Sifarish Layout) ──
function updateDoc() {
    // Part 1: Patient details
    const patientName = document.getElementById('inPatientName')?.value.trim() || '';
    const citNo = document.getElementById('inCitNo')?.value.trim() || '';
    const citDate = document.getElementById('inCitDate')?.value.trim() || '';
    const citDistrict = document.getElementById('inCitDistrict')?.value.trim() || 'झापा';

    const lblPat = document.getElementById('lblPatientName');
    if (lblPat) lblPat.textContent = patientName || '..................';
    const lblCit = document.getElementById('lblCitNo');
    if (lblCit) lblCit.textContent = citNo || '..................';
    const lblCDate = document.getElementById('lblCitDate');
    if (lblCDate) lblCDate.textContent = citDate || '..................';
    const lblDist = document.getElementById('lblCitDistrict');
    if (lblDist) lblDist.textContent = citDistrict || 'झापा';

    // Part 2: Health & Treatment details
    const hospitalName = document.getElementById('inHospitalName')?.value.trim() || '';
    const diseaseType = document.getElementById('inDiseaseType')?.value || 'मुटु रोग';
    const otherDisease = document.getElementById('inOtherDiseaseName')?.value.trim() || '';
    const certifiedDetails = document.getElementById('inHospitalCertifiedDetails')?.value.trim() || '';

    const lblHosp = document.getElementById('lblHospitalName');
    if (lblHosp) lblHosp.textContent = hospitalName || '..................';

    // Effective disease display name
    let effectiveDisease = diseaseType;
    if (diseaseType === 'अन्य') {
        effectiveDisease = otherDisease || '(अन्य रोग)';
    }
    const lblDis = document.getElementById('lblDiseaseName');
    if (lblDis) lblDis.textContent = effectiveDisease;

    // Certified details inside quotation marks
    const lblCert = document.getElementById('lblCertifiedDetails');
    if (lblCert) lblCert.textContent = certifiedDetails || '..................';

    // Signatory resolution from existing system (<select id="inSignAuthority">)
    const signSelect = document.getElementById('inSignAuthority')?.value || 'नगेन्द्र भण्डारी|वडा अध्यक्ष';
    let sigName = "", sigTitle = "";
    const lblSigName = document.getElementById('lblSigName');
    const lblSigTitle = document.getElementById('lblSigTitle');

    if (signSelect === 'BLANK') {
        sigName = "";
        sigTitle = "";
        if (lblSigName) lblSigName.style.borderTop = "none";
    } else {
        if (lblSigName) lblSigName.style.borderTop = "1.5px dashed #000";
        if (signSelect === 'CUSTOM') {
            sigName = document.getElementById('inCustomSignName')?.value.trim() || '....................';
            sigTitle = document.getElementById('inCustomSignTitle')?.value.trim() || '....................';
        } else {
            const parts = signSelect.split('|');
            sigName = parts[0] || '';
            sigTitle = parts[1] || '';
        }
    }
    if (lblSigName) lblSigName.textContent = sigName;
    if (lblSigTitle) lblSigTitle.textContent = sigTitle;

    // Dynamic Ward Number
    const wardNum = (window.MultiWard && typeof window.MultiWard.getActiveWard === 'function')
        ? window.MultiWard.getActiveWard()
        : (localStorage.getItem('sifarish_ward') || '1');
    const wardNep = toNepaliDigit(wardNum);

    const lblWard = document.getElementById('lblWardNum');
    if (lblWard) lblWard.textContent = wardNep;

    // Letterhead metadata
    const curAY = getSelectedAY();
    const lblAY = document.getElementById('lblAY');
    if (lblAY) lblAY.textContent = curAY;

    const chalani = document.getElementById('inChalani')?.value.trim() || '';
    const lblChal = document.getElementById('lblChalani');
    if (lblChal) lblChal.textContent = chalani;

    const miti = document.getElementById('inMiti')?.value.trim() || '';
    const lblMiti = document.getElementById('lblMiti');
    if (lblMiti) lblMiti.textContent = miti;

    // Multi-Ward dynamic letterhead
    if (window.MultiWard && typeof window.MultiWard.applyLetterheadToDocument === 'function') {
        window.MultiWard.applyLetterheadToDocument(document);
    }

    // Nepal Sambat sync
    if (window.NepalSambat && typeof window.NepalSambat.updateNepalSambatUI === 'function') {
        window.NepalSambat.updateNepalSambatUI();
    }
}
window.updateDoc = updateDoc;

// ── 8. Single Main Action: Save and Print Record ──
async function saveAndPrintRecord() {
    const patName = document.getElementById('inPatientName')?.value.trim();
    if (!patName) {
        alert("कृपया बिरामीको पूरा नाम लेख्नुहोस् ।");
        document.getElementById('inPatientName')?.focus();
        return;
    }

    const citNo = document.getElementById('inCitNo')?.value.trim();
    if (!citNo) {
        alert("कृपया नागरिकता प्रमाणपत्र नम्बर लेख्नुहोस् ।");
        document.getElementById('inCitNo')?.focus();
        return;
    }

    const hosp = document.getElementById('inHospitalName')?.value.trim();
    if (!hosp) {
        alert("कृपया उपचार गराइरहेको अस्पतालको नाम लेख्नुहोस् ।");
        document.getElementById('inHospitalName')?.focus();
        return;
    }

    const disType = document.getElementById('inDiseaseType')?.value || 'मुटु रोग';
    if (disType === 'अन्य') {
        const otherDis = document.getElementById('inOtherDiseaseName')?.value.trim();
        if (!otherDis) {
            alert("कृपया अन्य रोगको नाम लेख्नुहोस् ।");
            document.getElementById('inOtherDiseaseName')?.focus();
            return;
        }
    }

    const ward = (window.MultiWard && typeof window.MultiWard.getActiveWard === 'function')
        ? window.MultiWard.getActiveWard()
        : (localStorage.getItem('sifarish_ward') || '1');
    const editId = document.getElementById('editRecordIndex')?.value.trim() || '';

    const signSelect = document.getElementById('inSignAuthority')?.value || 'नगेन्द्र भण्डारी|वडा अध्यक्ष';
    let sigName = "", sigTitle = "";
    if (signSelect === 'CUSTOM') {
        sigName = document.getElementById('inCustomSignName')?.value.trim() || '';
        sigTitle = document.getElementById('inCustomSignTitle')?.value.trim() || '';
    } else if (signSelect !== 'BLANK') {
        const parts = signSelect.split('|');
        sigName = parts[0] || '';
        sigTitle = parts[1] || '';
    }

    const recordData = {
        patientName: patName,
        citNo: citNo,
        citDate: document.getElementById('inCitDate')?.value.trim() || '',
        citDistrict: document.getElementById('inCitDistrict')?.value.trim() || 'झापा',
        hospitalName: hosp,
        diseaseType: disType,
        otherDiseaseName: document.getElementById('inOtherDiseaseName')?.value.trim() || '',
        certifiedDetails: document.getElementById('inHospitalCertifiedDetails')?.value.trim() || '',
        miti: document.getElementById('inMiti')?.value.trim() || '',
        chalani: document.getElementById('inChalani')?.value.trim() || '',
        ay: getSelectedAY(),
        patraSankhya: getSelectedAY(),
        ns: document.getElementById('inNepalSamvat')?.value.trim() || '',
        signAuth: signSelect,
        customSignName: document.getElementById('inCustomSignName')?.value.trim() || '',
        customSignTitle: document.getElementById('inCustomSignTitle')?.value.trim() || '',
        signatoryName: sigName,
        signatoryTitle: sigTitle,
        sigMargin: document.getElementById('inSigMargin')?.value || '40',
        scheme: 'विपन्न नागरिक औषधि उपचार वापतको सहुलियत कार्यक्रम',
        municipality_id: 'gauradaha',
        ward_id: parseInt(ward, 10),
        createdWard: String(ward),
        updatedAt: Date.now()
    };

    try {
        let savedId = editId;

        if (db) {
            if (editId) {
                // In-place update
                await db.collection('swasthyaSahayataRecords').doc(editId).update(recordData);
                const idx = globalDatabase.findIndex(r => r.id === editId);
                if (idx !== -1) {
                    globalDatabase[idx] = { ...globalDatabase[idx], ...recordData };
                } else {
                    globalDatabase.unshift({ id: editId, ...recordData });
                }
            } else {
                recordData.createdAt = Date.now();
                // Deduplication check
                const existingSnap = await db.collection('swasthyaSahayataRecords')
                    .where('createdWard', '==', String(ward))
                    .where('patientName', '==', patName)
                    .limit(1)
                    .get();

                if (!existingSnap.empty) {
                    savedId = existingSnap.docs[0].id;
                    await db.collection('swasthyaSahayataRecords').doc(savedId).update(recordData);
                    const idx = globalDatabase.findIndex(r => r.id === savedId);
                    if (idx !== -1) {
                        globalDatabase[idx] = { ...globalDatabase[idx], ...recordData };
                    } else {
                        globalDatabase.unshift({ id: savedId, ...recordData });
                    }
                } else {
                    const docRef = await db.collection('swasthyaSahayataRecords').add(recordData);
                    savedId = docRef.id;
                    globalDatabase.unshift({ id: savedId, ...recordData });
                }
            }
        } else {
            // Offline fallback
            if (!savedId) savedId = 'swasthya_' + Date.now();
            const idx = globalDatabase.findIndex(r => r.id === savedId);
            if (idx !== -1) globalDatabase[idx] = { ...globalDatabase[idx], ...recordData };
            else globalDatabase.unshift({ id: savedId, ...recordData });
        }

        document.getElementById('editRecordIndex').value = savedId;
        document.getElementById('formMainTitle').innerText = "🔄 सम्पादन मोड: " + patName;
        renderDatabaseTable();

        // Open print dialog only after successful save
        window.print();
    } catch (err) {
        console.error("[Swasthya] Save failed:", err);
        alert("अभिलेख सुरक्षित गर्न सकिएन: " + (err.message || err));
    }
}
window.saveAndPrintRecord = saveAndPrintRecord;

// ── 9. Archive Load & Reprint ──
function editFromDB(id) {
    const rec = globalDatabase.find(r => r.id === id);
    if (!rec) return;

    document.getElementById('editRecordIndex').value = id;
    document.getElementById('formMainTitle').innerText = "🔄 सम्पादन मोड: " + (rec.patientName || '');

    // Patient inputs
    if (document.getElementById('inPatientName')) document.getElementById('inPatientName').value = rec.patientName || '';
    if (document.getElementById('inCitNo')) document.getElementById('inCitNo').value = rec.citNo || '';
    if (document.getElementById('inCitDate')) document.getElementById('inCitDate').value = rec.citDate || '';
    if (document.getElementById('inCitDistrict')) document.getElementById('inCitDistrict').value = rec.citDistrict || 'झापा';

    // Health inputs
    if (document.getElementById('inHospitalName')) document.getElementById('inHospitalName').value = rec.hospitalName || '';
    if (document.getElementById('inDiseaseType')) document.getElementById('inDiseaseType').value = rec.diseaseType || 'मुटु रोग';
    if (document.getElementById('inOtherDiseaseName')) document.getElementById('inOtherDiseaseName').value = rec.otherDiseaseName || '';
    if (document.getElementById('inHospitalCertifiedDetails')) document.getElementById('inHospitalCertifiedDetails').value = rec.certifiedDetails || '';

    onDiseaseTypeChange();

    // Meta inputs
    if (document.getElementById('inChalani')) document.getElementById('inChalani').value = rec.chalani || '';
    if (document.getElementById('inMiti')) document.getElementById('inMiti').value = rec.miti || '';
    if (document.getElementById('inNepalSamvat')) document.getElementById('inNepalSamvat').value = rec.ns || '';

    // AY radio
    const radios = document.querySelectorAll('input[name="ayRadio"]');
    radios.forEach(r => {
        r.checked = (r.value === rec.ay || r.value === rec.patraSankhya);
    });

    // Signatory restoration
    const signVal = rec.signAuth || (rec.signatoryName && rec.signatoryTitle ? `${rec.signatoryName}|${rec.signatoryTitle}` : 'नगेन्द्र भण्डारी|वडा अध्यक्ष');
    const sel = document.getElementById('inSignAuthority');
    if (sel) {
        sel.value = signVal;
        if (sel.value !== signVal && signVal !== 'CUSTOM' && signVal !== 'BLANK') {
            const opt = document.createElement('option');
            opt.value = signVal;
            opt.textContent = `${rec.signatoryTitle || ''} - ${rec.signatoryName || ''}`;
            sel.insertBefore(opt, sel.firstChild);
            sel.value = signVal;
        }
    }
    if (signVal === 'CUSTOM') {
        document.getElementById('customSignBox').style.display = 'block';
        document.getElementById('inCustomSignName').value = rec.customSignName || rec.signatoryName || '';
        document.getElementById('inCustomSignTitle').value = rec.customSignTitle || rec.signatoryTitle || '';
    } else {
        document.getElementById('customSignBox').style.display = 'none';
    }

    if (rec.sigMargin) {
        const sigSlider = document.getElementById('inSigMargin');
        if (sigSlider) sigSlider.value = rec.sigMargin;
        adjustSignaturePosition(rec.sigMargin);
    }

    updateDoc();
    toggleModal(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.editFromDB = editFromDB;

function reprintFromDB(id) {
    editFromDB(id);
    window.print();
}
window.reprintFromDB = reprintFromDB;

// ── 10. Archive Search & Table Rendering ──
function onSearchInput(query) {
    renderDatabaseTable(query);
}
window.onSearchInput = onSearchInput;

function renderDatabaseTable(searchQuery = '') {
    const tbody = document.getElementById('abhilekhTableBody');
    if (!tbody) return;

    const q = (searchQuery || '').trim().toLowerCase();
    const ward = (window.MultiWard && typeof window.MultiWard.getActiveWard === 'function')
        ? window.MultiWard.getActiveWard()
        : (localStorage.getItem('sifarish_ward') || '1');
    const isSuper = (window.MultiWard && typeof window.MultiWard.isSuperAdmin === 'function')
        ? window.MultiWard.isSuperAdmin()
        : (localStorage.getItem('sifarish_admin') === 'true');

    const filtered = globalDatabase.filter(r => {
        const wardMatch = isSuper || (String(r.createdWard || r.ward_id) === String(ward));
        if (!wardMatch) return false;
        if (!q) return true;
        const pat = (r.patientName || '').toLowerCase();
        const cit = (r.citNo || '').toLowerCase();
        const chal = (r.chalani || '').toLowerCase();
        const hosp = (r.hospitalName || '').toLowerCase();
        return pat.includes(q) || cit.includes(q) || chal.includes(q) || hosp.includes(q);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px; color: #a0aec0;">कुनै अभिलेख फेला परेन।</td></tr>`;
        return;
    }

    let html = '';
    filtered.forEach(r => {
        const dis = r.diseaseType === 'अन्य' ? (r.otherDiseaseName || 'अन्य') : (r.diseaseType || '-');
        html += `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px;">${r.chalani || '-'}</td>
                <td style="padding: 8px;">${r.miti || '-'}</td>
                <td style="padding: 8px; font-weight: 700; color: #2d3748;">${r.patientName || '-'}</td>
                <td style="padding: 8px;">${r.hospitalName || '-'}</td>
                <td style="padding: 8px;">${dis}</td>
                <td style="padding: 8px; text-align: center;">
                    <button type="button" onclick="editFromDB('${r.id}')" style="background: #3182ce; color: #fff; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; margin-right: 4px;">खोल्नुहोस् / सम्पादन</button>
                    <button type="button" onclick="reprintFromDB('${r.id}')" style="background: #4a5568; color: #fff; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">प्रिन्ट</button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}
window.renderDatabaseTable = renderDatabaseTable;

// ── 11. Initialization on Page Load ──
async function initSwasthyaModule() {
    setCurrentNepaliDate();
    toggleCustomSign();

    const ward = (window.MultiWard && typeof window.MultiWard.getActiveWard === 'function')
        ? window.MultiWard.getActiveWard()
        : (localStorage.getItem('sifarish_ward') || '1');

    if (window.MultiWard && typeof window.MultiWard.getNextChalani === 'function') {
        try {
            const chalaniVal = await window.MultiWard.getNextChalani(db, 'swasthya', ward);
            const chalInput = document.getElementById('inChalani');
            if (chalInput && !chalInput.value) {
                chalInput.value = chalaniVal;
            }
        } catch (e) {
            console.warn('[Swasthya] Chalani fetch error:', e);
        }
    }

    if (db) {
        try {
            db.collection('swasthyaSahayataRecords')
                .onSnapshot(snap => {
                    globalDatabase = [];
                    snap.forEach(doc => {
                        globalDatabase.push({ id: doc.id, ...doc.data() });
                    });
                    globalDatabase.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
                    window.globalDatabase = globalDatabase;
                    renderDatabaseTable();
                }, err => {
                    console.warn('[Swasthya] Realtime listener error:', err);
                });
        } catch (err) {
            console.warn('[Swasthya] Firestore setup error:', err);
        }
    }

    updateDoc();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSwasthyaModule);
} else {
    initSwasthyaModule();
}
