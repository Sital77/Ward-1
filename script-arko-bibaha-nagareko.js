// ══════════════════════════════════════════════════════
//  script-arko-bibaha-nagareko.js
//  अर्को विवाह नगरेको प्रमाणित — Firebase Firestore Logic
// ══════════════════════════════════════════════════════

const firebaseConfig = {
    apiKey: "AIzaSyC3uCmLgNN8s0FDMIrkgxR8eH_AvJ_D3J4",
    authDomain: "gauradaha-ward1.firebaseapp.com",
    projectId: "gauradaha-ward1",
    storageBucket: "gauradaha-ward1.firebasestorage.app",
    messagingSenderId: "905617778132",
    appId: "1:905617778132:web:b8149cf37ae3f3c3b42241"
};

const app = firebase.initializeApp(firebaseConfig);
const db  = firebase.firestore();

let globalDatabase = [];

// Real-time listener for arkoBibahaRecords
db.collection("arkoBibahaRecords").onSnapshot((snapshot) => {
    globalDatabase = [];
    snapshot.forEach((doc) => {
        globalDatabase.push({ id: doc.id, ...doc.data() });
    });
    globalDatabase.sort((a, b) => b.timestamp - a.timestamp);
    renderDatabaseTable();
});

// ── Helpers ─────────────────────────────────────────
function toNepaliDigit(num) {
    const nd = ['०','१','२','३','४','५','६','७','८','९'];
    return num.toString().split('').map(d => nd[d] || d).join('');
}

function getSelectedAY() {
    const aySelect = document.getElementById('inPatraSankhya');
    return aySelect ? aySelect.value : '';
}

// ── Custom Field Toggles ─────────────────────────────
function toggleCitizenshipSection() {
    const chk = document.getElementById('chkCitizenship');
    document.getElementById('citizenshipSection').style.display = chk.checked ? 'block' : 'none';
}

function toggleCustomSign() {
    const val = document.getElementById('inSignAuthority').value;
    document.getElementById('customSignBox').style.display = (val === 'CUSTOM') ? 'grid' : 'none';
}

function adjustSignaturePosition(value) {
    document.getElementById('marginVal').innerText = toNepaliDigit(value) + " px";
    document.getElementById('docFooterSection').style.marginTop = value + "px";
}

// ── Modal toggle ─────────────────────────────────────
function toggleModal(show) {
    const modal = document.getElementById('abhilekhModal');
    modal.style.display = show ? 'flex' : 'none';
    if (show) renderDatabaseTable();
}

// ── Live Preview Updater ──────────────────────────────
function updateDoc() {
    const ay      = getSelectedAY();
    const chalani = document.getElementById('inChalani').value     || '';
    const miti    = document.getElementById('inMiti').value         || '';
    const ns      = document.getElementById('inNepalSamvat').value  || '';
    const name    = document.getElementById('inName').value         || '';
    const submitMiti = document.getElementById('inSubmitMiti').value || '';

    // Letterhead
    const lblAY = document.getElementById('lblAY');
    if (lblAY) lblAY.innerText = ay;
    const lblChalani = document.getElementById('lblChalani');
    if (lblChalani) lblChalani.innerText = chalani;
    const lblMiti = document.getElementById('lblMiti');
    if (lblMiti) lblMiti.innerText = miti || '........';
    const lblNS = document.getElementById('lblNepalSamvat');
    if (lblNS) lblNS.innerText = ns || '........';

    // Applicant Name
    const lblApplicantName = document.getElementById('lblApplicantName');
    if (lblApplicantName) lblApplicantName.innerText = name || '..................';
    const lblApplicantName2 = document.getElementById('lblApplicantName2');
    if (lblApplicantName2) lblApplicantName2.innerText = name || '..................';

    // Submit Date
    const lblSubmitMiti = document.getElementById('lblSubmitMiti');
    if (lblSubmitMiti) lblSubmitMiti.innerText = submitMiti || '..................';

    // Citizenship details formatting logic
    const chkCit = document.getElementById('chkCitizenship').checked;
    const inCitNo = document.getElementById('inCitNo').value.trim();
    const inCitDate = document.getElementById('inCitDate').value.trim();
    let citBlockText = "";
    if (chkCit && inCitNo) {
        citBlockText = `ना.प्र.नं.${toNepaliDigit(inCitNo)}`;
        if (inCitDate) {
            citBlockText += `, जारी मिति: ${toNepaliDigit(inCitDate)}`;
        }
    }
    
    const lblCitBlock = document.getElementById('lblCitBlock');
    if (lblCitBlock) {
        lblCitBlock.innerText = citBlockText ? ` ${citBlockText}` : "";
    }

    // Signature Block updates
    const signSelect = document.getElementById('inSignAuthority').value;
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
            sigName = document.getElementById('inCustomSignName').value || '....................';
            sigTitle = document.getElementById('inCustomSignTitle').value || '....................';
        } else {
            const signData = signSelect.split('|');
            sigName = signData[0];
            sigTitle = signData[1];
        }
    }
    if (lblSigName) lblSigName.innerText = sigName;
    if (lblSigTitle) lblSigTitle.innerText = sigTitle;
}

// ── Date Automation ───────────────────────────────────
function initializeAutomaticDate() {
    try {
        let nepaliBSDateStr = "";
        let nepaliNSYearStr = "";
        let bsYearVal = 2083;
        let bsMonthVal = 2;

        const converter = window["@sbmdkl/nepali-date-converter"];
        if (!converter && (window._dateInitRetries || 0) < 5) {
            window._dateInitRetries = (window._dateInitRetries || 0) + 1;
            setTimeout(initializeAutomaticDate, 400);
        }
        if (converter && typeof converter.adToBs === 'function') {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            const adDateStr = `${yyyy}-${mm}-${dd}`;

            const bsDate = converter.adToBs(adDateStr);
            let bsDayVal = 27;
            if (typeof bsDate === 'string') {
                const parts = bsDate.split(/[-/]/);
                bsYearVal = parseInt(parts[0], 10);
                bsMonthVal = parseInt(parts[1], 10);
                bsDayVal = parseInt(parts[2], 10);
            } else if (bsDate && typeof bsDate === 'object') {
                bsYearVal = bsDate.bsYear || bsDate.year || bsDate.currentYear || 2083;
                bsMonthVal = bsDate.bsMonth || bsDate.month || bsDate.currentMonth || 2;
                bsDayVal = bsDate.bsDay || bsDate.day || bsDate.currentDay || 27;
            }

            const bsYear = bsYearVal;
            const bsMonth = String(bsMonthVal).padStart(2, '0');
            const bsDay = String(bsDayVal).padStart(2, '0');
            const englishBSDateStr = `${bsYear}/${bsMonth}/${bsDay}`;
            nepaliBSDateStr = toNepaliDigit(englishBSDateStr);
        } else {
            const today = new Date();
            const adYear  = today.getFullYear();
            const adMonth = today.getMonth() + 1;
            const adDay   = today.getDate();
            let bsY = adYear + 57;
            let bsM = 1;
            if (adMonth === 1) { bsM = adDay >= 15 ? 10 : 9; bsY = adYear + 56; }
            else if (adMonth === 2) { bsM = adDay >= 13 ? 11 : 10; bsY = adYear + 56; }
            else if (adMonth === 3) { bsM = adDay >= 14 ? 12 : 11; bsY = adYear + 56; }
            else if (adMonth === 4) { if (adDay >= 14) { bsM = 1; bsY = adYear + 57; } else { bsM = 12; bsY = adYear + 56; } }
            else if (adMonth === 5) { bsM = adDay >= 15 ? 2 : 1; }
            else if (adMonth === 6) { bsM = adDay >= 15 ? 3 : 2; }
            else if (adMonth === 7) { bsM = adDay >= 16 ? 4 : 3; }
            else if (adMonth === 8) { bsM = adDay >= 17 ? 5 : 4; }
            else if (adMonth === 9) { bsM = adDay >= 17 ? 6 : 5; }
            else if (adMonth === 10) { bsM = adDay >= 18 ? 7 : 6; }
            else if (adMonth === 11) { bsM = adDay >= 17 ? 8 : 7; }
            else if (adMonth === 12) { bsM = adDay >= 16 ? 9 : 8; }
            bsYearVal  = bsY;
            bsMonthVal = bsM;
            let bsD = adDay >= 16 ? adDay - 15 : adDay + 16;
            if (bsD > 32) bsD = 30;
            bsDayVal = bsD;
            const bsMStr = String(bsMonthVal).padStart(2, '0');
            const bsDStr = String(bsDayVal).padStart(2, '0');
            nepaliBSDateStr = toNepaliDigit(`${bsYearVal}/${bsMStr}/${bsDStr}`);
        }

        initializeFiscalYear(bsYearVal, bsMonthVal);

        const today = new Date();
        const nsYear = getNepalSambatYear(today);
        nepaliNSYearStr = toNepaliDigit(nsYear);

        const inMiti = document.getElementById('inMiti');
        if (inMiti) {
            inMiti.value = nepaliBSDateStr;
        }

        const inSubmitMiti = document.getElementById('inSubmitMiti');
        if (inSubmitMiti) {
            inSubmitMiti.value = nepaliBSDateStr;
        }

        const inNepalSamvat = document.getElementById('inNepalSamvat');
        if (inNepalSamvat) {
            inNepalSamvat.value = nepaliNSYearStr;
        }

        updateDoc();
        fetchCurrentNepalSambat();
    } catch(e) {
        console.error("Date calculation crash:", e);
    }
}

function getNepalSambatYear(adDate) {
    return 1146;
}

function formatFiscalYear(startYear) {
    const endYear = startYear + 1;
    const endYearSuffix = String(endYear).slice(-2);
    return toNepaliDigit(`${startYear}/${endYearSuffix}`);
}

function initializeFiscalYear(bsYear, bsMonth) {
    try {
        let currentStartYear = bsYear;
        if (bsMonth < 4) {
            currentStartYear = bsYear - 1;
        }

        const fySelect = document.getElementById('inPatraSankhya');
        if (fySelect) {
            fySelect.innerHTML = '';

            const prevFY = formatFiscalYear(currentStartYear - 1);
            const currFY = formatFiscalYear(currentStartYear);
            const nextFY = formatFiscalYear(currentStartYear + 1);

            fySelect.insertAdjacentHTML('beforeend', `<option value="${prevFY}">${prevFY}</option>`);
            fySelect.insertAdjacentHTML('beforeend', `<option value="${currFY}" selected>${currFY}</option>`);
            fySelect.insertAdjacentHTML('beforeend', `<option value="${nextFY}">${nextFY}</option>`);
            fySelect.value = currFY;
        }
    } catch (error) {
        console.error("Error initializing fiscal year:", error);
    }
}

function updateNepalSambatFromMiti() {
    const inNS = document.getElementById('inNepalSamvat');
    if (inNS) {
        inNS.value = '११४६';
        if (typeof updateDoc === 'function') updateDoc();
    }
}

// ── Nepal Sambat widget proxy API loader ─────────────
async function fetchCurrentNepalSambat() {
    const inNS = document.getElementById('inNepalSamvat');
    if (inNS) {
        inNS.value = '११४६';
        if (typeof updateDoc === 'function') updateDoc();
    }
}

// ── Print & Save ──────────────────────────────────────
async function printAndSaveSystem() {
    const name = document.getElementById('inName').value.trim();
    if (!name) {
        alert("कृपया निवेदकको नाम अनिवार्य लेख्नुहोस् ।");
        return;
    }

    const recordId = document.getElementById('editRecordIndex').value;

    const obj = {
        ay:              getSelectedAY(),
        chalani:         document.getElementById('inChalani').value.trim()      || '-',
        miti:            document.getElementById('inMiti').value.trim()          || '-',
        ns:              document.getElementById('inNepalSamvat').value.trim()   || '-',
        name:            name,
        hasCit:          document.getElementById('chkCitizenship').checked,
        citNo:           document.getElementById('inCitNo').value.trim()        || '',
        citDate:         document.getElementById('inCitDate').value.trim()      || '',
        submitMiti:      document.getElementById('inSubmitMiti').value.trim()    || '-',
        subject:         "अर्को विवाह नगरेको प्रमाणित",
        signAuth:        document.getElementById('inSignAuthority').value,
        customSignName:  document.getElementById('inCustomSignName').value.trim(),
        customSignTitle: document.getElementById('inCustomSignTitle').value.trim(),
        sigMargin:       document.getElementById('inSigMargin').value,
        timestamp:       Date.now()
    };

    const btn = document.querySelector('.btn-print');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = "⏳ सुरक्षित हुँदैछ...";
    }

    try {
        if (recordId !== "") {
            await db.collection("arkoBibahaRecords").doc(recordId).update(obj);
        } else {
            const docRef = await db.collection("arkoBibahaRecords").add(obj);
            document.getElementById('editRecordIndex').value = docRef.id;
            document.getElementById('formMainTitle').innerText = "🔄 सम्पादन मोड";
        }
        window.print();
    } catch (e) {
        console.error(e);
        alert("क्लाउडमा डाटा सुरक्षित गर्दा समस्या भयो! इन्टरनेट कनेक्सन जाँच्नुहोस् ।");
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
}

function formatTimestamp(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hr = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return toNepaliDigit(`${y}/${m}/${day} - ${hr}:${min}`);
}

// ── Database Operations ───────────────────────────────
function renderDatabaseTable() {
    const tbody = document.getElementById('dbTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const query = document.getElementById('searchField').value.trim().toLowerCase();

    const filtered = globalDatabase.filter(rec => {
        const text = (rec.name || '').toLowerCase();
        return text.includes(query);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:15px; color:#a0aec0;">कुनै रेकर्ड भेटिएन ।</td></tr>`;
        return;
    }

    filtered.forEach((rec, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${toNepaliDigit(index + 1)}</td>
            <td><b>${rec.name || '-'}</b></td>
            <td>अर्को विवाह नगरेको प्रमाणित</td>
            <td>${formatTimestamp(rec.timestamp)}</td>
            <td>
                <div style="display:flex; gap:4px; justify-content:center;">
                    <button class="action-edit-btn" onclick="loadRecordToForm('${rec.id}')" title="सम्पादन">✏️</button>
                    <button class="action-del-btn" onclick="deleteRecord('${rec.id}')" title="हटाउनुहोस्">❌</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function loadRecordToForm(id) {
    const rec = globalDatabase.find(r => r.id === id);
    if (!rec) return;

    if (!confirm("के तपाईं यो रेकर्ड सम्पादन गर्न चाहनुहुन्छ? यसले हालको फॉर्मको डाटा प्रतिस्थापन गर्नेछ ।")) {
        return;
    }

    document.getElementById('editRecordIndex').value = rec.id;
    document.getElementById('formMainTitle').innerText = "🔄 सम्पादन मोड";

    // Letterhead
    const inPS = document.getElementById('inPatraSankhya');
    if (inPS) inPS.value = rec.ay || '';
    document.getElementById('inChalani').value = rec.chalani !== '-' ? rec.chalani : '';
    document.getElementById('inMiti').value = rec.miti !== '-' ? rec.miti : '';
    document.getElementById('inNepalSamvat').value = rec.ns !== '-' ? rec.ns : '';

    // Applicant Name
    document.getElementById('inName').value = rec.name || '';

    // Citizenship Settings
    const chkCit = document.getElementById('chkCitizenship');
    chkCit.checked = !!rec.hasCit;
    document.getElementById('inCitNo').value = rec.citNo || '';
    document.getElementById('inCitDate').value = rec.citDate || '';
    toggleCitizenshipSection();

    // Submit Date
    document.getElementById('inSubmitMiti').value = rec.submitMiti || '';

    // Signature authority
    document.getElementById('inSignAuthority').value = rec.signAuth || 'नगेन्द्र भण्डारी|वडा अध्यक्ष';
    document.getElementById('inCustomSignName').value = rec.customSignName || '';
    document.getElementById('inCustomSignTitle').value = rec.customSignTitle || '';
    toggleCustomSign();

    // Signature margin spacing
    const margin = rec.sigMargin || '40';
    document.getElementById('inSigMargin').value = margin;
    adjustSignaturePosition(margin);

    updateDoc();
    toggleModal(false);
}

async function deleteRecord(id) {
    if (!confirm("के तपाईं साच्चिकै यो रेकर्ड स्थायी रूपमा हटाउन चाहनुहुन्छ?")) {
        return;
    }
    try {
        await db.collection("arkoBibahaRecords").doc(id).delete();
        alert("रेकर्ड सफलतापूर्वक हटाइयो ।");
    } catch(e) {
        console.error(e);
        alert("रेकर्ड हटाउन समस्या भयो! इन्टरनेट कनेक्सन जाँच्नुहोस् ।");
    }
}

// Page Bootstrap Init
window.onload = function () {
    initializeAutomaticDate();
    adjustSignaturePosition(40);
};

window.addEventListener('templateInjected', function() {
    initializeAutomaticDate();
});
