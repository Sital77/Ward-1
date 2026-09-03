// ══════════════════════════════════════════════════════
//  script-suchana-tans.js
//  सूचना टाँस सम्बन्धमा पत्र — Firebase Firestore Logic
// ══════════════════════════════════════════════════════

const firebaseConfig = {
    apiKey: "AIzaSyC3uCmLgNN8s0FDMIrkgxR8eH_AvJ_D3J4",
    authDomain: "gauradaha-ward1.firebaseapp.com",
    projectId: "gauradaha-ward1",
    storageBucket: "gauradaha-ward1.firebasestorage.app",
    messagingSenderId: "905617778132",
    appId: "1:905617778132:web:b8149cf37ae3f3c3b42241"
};

if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const db = firebase.firestore();

let globalDatabase = [];

// Auth ready भएपछि मात्र snapshot listener start गर्ने
(window._firebaseAuthReady || Promise.resolve()).then(() => {
    db.collection("suchanaTansRecords").onSnapshot((snapshot) => {
        globalDatabase = [];
        snapshot.forEach((doc) => {
            const d = doc.data();
            if (d.isDeleted) return; // 🗑️ Skip soft-deleted items
            globalDatabase.push({ id: doc.id, ...d });
        });
        globalDatabase.sort((a, b) => b.timestamp - a.timestamp);
        renderDatabaseTable();
    });
}).catch(() => {});


// ── Helper: English digits → Nepali digits ──────────
function toNepaliDigit(num) {
    const nd = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return num.toString().split('').map(d => nd[d] || d).join('');
}

// ── Modal toggle ────────────────────────────────────
function toggleModal(show) {
    const modal = document.getElementById('abhilekhModal');
    modal.style.display = show ? 'flex' : 'none';
    if (show) renderDatabaseTable();
}

// ── Signature margin slider ─────────────────────────
function adjustSignaturePosition(value) {
    document.getElementById('marginVal').innerText = toNepaliDigit(value) + " px";
    document.getElementById('docFooterSection').style.marginTop = value + "px";
}

// ── Custom sign toggle ──────────────────────────────
function toggleCustomSign() {
    const val = document.getElementById('inSignAuthority').value;
    document.getElementById('customSignBox').style.display = (val === 'CUSTOM') ? 'grid' : 'none';
}

// ── Get selected आ.व. ───────────────────────────────
function getSelectedAY() {
    const radios = document.querySelectorAll('input[name="ayRadio"]');
    for (const r of radios) { if (r.checked) return r.value; }
    return '';
}

// ── Live preview updater ────────────────────────────
function updateDoc() {
    const ay = getSelectedAY();
    const bodyAY = document.getElementById('inBodyAY').value;
    const chalani = document.getElementById('inChalani').value || '';
    const bodyChalani = document.getElementById('inBodyChalani').value || '';
    const miti = document.getElementById('inMiti').value || '........';
    const ns = document.getElementById('inNepalSamvat').value || '........';
    const wada = document.getElementById('inWadaNo').value;
    const praaptaMiti = document.getElementById('inPraaptaMiti').value || '........';

    // Header
    const lblAY = document.getElementById('lblAY');
    if (lblAY) lblAY.innerText = ay;
    const lblChalani = document.getElementById('lblChalani');
    if (lblChalani) lblChalani.innerText = chalani;
    const lblMiti = document.getElementById('lblMiti');
    if (lblMiti) lblMiti.innerText = miti;
    const lblNepalSamvat = document.getElementById('lblNepalSamvat');
    if (lblNepalSamvat) lblNepalSamvat.innerText = ns;

    // Body
    if (document.getElementById('lblBodyAY')) document.getElementById('lblBodyAY').innerText = bodyAY;
    if (document.getElementById('lblBodyChalani')) document.getElementById('lblBodyChalani').innerText = bodyChalani;
    if (document.getElementById('lblBodyWada')) document.getElementById('lblBodyWada').innerText = wada;
    if (document.getElementById('lblPraaptaMiti')) document.getElementById('lblPraaptaMiti').innerText = praaptaMiti;

    // Signature
    const signSelect = document.getElementById('inSignAuthority').value;
    let sigName = "", sigTitle = "";
    const lblSigName = document.getElementById('lblSigName');
    if (signSelect === 'BLANK') {
        sigName = "";
        sigTitle = "";
        lblSigName.style.borderTop = "none";
    } else {
        lblSigName.style.borderTop = "1.5px dashed #000";
        if (signSelect === 'CUSTOM') {
            sigName = document.getElementById('inCustomSignName').value || '....................';
            sigTitle = document.getElementById('inCustomSignTitle').value || '....................';
        } else {
            const parts = signSelect.split('|');
            sigName = parts[0];
            sigTitle = parts[1];
        }
    }
    lblSigName.innerText = sigName;
    document.getElementById('lblSigTitle').innerText = sigTitle;
}

// ── Print & Save ────────────────────────────────────
async function printAndSaveSystem() {
    const ay = getSelectedAY();
    const bodyAY = document.getElementById('inBodyAY').value;
    const chalani = document.getElementById('inChalani').value.trim() || '-';
    const bodyChalani = document.getElementById('inBodyChalani').value.trim() || '-';
    const miti = document.getElementById('inMiti').value.trim() || '-';
    const ns = document.getElementById('inNepalSamvat').value.trim() || '-';
    const wada = document.getElementById('inWadaNo').value;
    const praaptaMiti = document.getElementById('inPraaptaMiti').value.trim() || '-';
    const signAuth = document.getElementById('inSignAuthority').value;
    const customSignName = document.getElementById('inCustomSignName').value;
    const customSignTitle = document.getElementById('inCustomSignTitle').value;
    const sigMargin = document.getElementById('inSigMargin').value;

    const recordId = document.getElementById('editRecordIndex').value;

    const displayName = (chalani !== '-' && chalani) ? chalani : ((bodyChalani !== '-' && bodyChalani) ? bodyChalani : 'सूचना टाँस');

    const obj = {
        ay, bodyAY, chalani, bodyChalani, miti, ns, wada,
        name: displayName,
        praaptaMiti,
        subject: "सूचना टाँस",
        signAuth, customSignName, customSignTitle, sigMargin,
        timestamp: Date.now()
    };

    const btn = document.querySelector('.btn-print');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = "⏳ सुरक्षित हुँदैछ...";
    }

    try {
        if (recordId !== "") {
            await db.collection("suchanaTansRecords").doc(recordId).update(obj);
        } else {
            const docRef = await db.collection("suchanaTansRecords").add(obj);
            document.getElementById('editRecordIndex').value = docRef.id;
            document.getElementById('formMainTitle').innerText = "🔄 सम्पादन मोड";
        }
        window.print();
    } catch (e) {
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
    const formatted = `${y}/${m}/${day} ${hr}:${min}`;
    const toNep = typeof toNepaliDigit === 'function' ? toNepaliDigit : (window.toNepaliDigit || (x => x));
    return toNep(formatted);
}

// ── Render abhilekh table ───────────────────────────
function renderDatabaseTable() {
    const tbody = document.getElementById('dbTableBody');
    const search = document.getElementById('searchField').value.trim().toLowerCase();
    tbody.innerHTML = '';
    let counter = 0;
    globalDatabase.forEach((rec) => {
        const chalaniVal = (rec.chalani || rec.name || '').toLowerCase();
        if (search && !chalaniVal.includes(search)) return;
        counter++;
        const displayChalani = (rec.chalani && rec.chalani !== '-') ? rec.chalani : ((rec.bodyChalani && rec.bodyChalani !== '-') ? rec.bodyChalani : '-');
        tbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td><b>${toNepaliDigit(counter)}</b></td>
                <td><b>${displayChalani}</b></td>
                <td><span style="color:#2b6cb0; font-weight:bold;">${rec.subject || 'सूचना टाँस'}</span></td>
                <td>
                    ${rec.miti || '-'}
                    ${rec.timestamp ? `<div style="font-size:0.78rem; color:#718096; margin-top:2px;">⏱️ ${formatTimestamp(rec.timestamp)}</div>` : ''}
                </td>
                <td>
                    <div style="display:flex; gap:4px;">
                        <button class="btn-action btn-edit-db" onclick="editFromDB('${rec.id}')">📝</button>
                        <button class="btn-action btn-del-db"  onclick="deleteFromDB('${rec.id}')">❌</button>
                    </div>
                </td>
            </tr>
        `);
    });
}

// ── Edit record from DB ─────────────────────────────
function editFromDB(id) {
    const rec = globalDatabase.find(r => r.id === id);
    if (!rec) return;

    document.getElementById('editRecordIndex').value = id;
    document.getElementById('formMainTitle').innerText = "🔄 सम्पादन मोड";

    // आ.व. radio
    const radios = document.querySelectorAll('input[name="ayRadio"]');
    radios.forEach(r => { r.checked = (r.value === rec.ay); });

    // पत्रमा उल्लेख आ.व. dropdown
    document.getElementById('inBodyAY').value = rec.bodyAY || rec.ay || '२०८०/०८१';

    document.getElementById('inChalani').value = rec.chalani === '-' ? '' : (rec.chalani || '');
    document.getElementById('inBodyChalani').value = rec.bodyChalani === '-' ? '' : (rec.bodyChalani || '');
    document.getElementById('inMiti').value = rec.miti || '';
    document.getElementById('inNepalSamvat').value = rec.ns || '';
    document.getElementById('inWadaNo').value = rec.wada || '१';
    document.getElementById('inPraaptaMiti').value = rec.praaptaMiti === '-' ? '' : (rec.praaptaMiti || '');
    document.getElementById('inSignAuthority').value = rec.signAuth || 'नगेन्द्र भण्डारी|वडा अध्यक्ष';

    if (rec.signAuth === 'CUSTOM') {
        document.getElementById('customSignBox').style.display = 'grid';
        document.getElementById('inCustomSignName').value = rec.customSignName || '';
        document.getElementById('inCustomSignTitle').value = rec.customSignTitle || '';
    } else {
        document.getElementById('customSignBox').style.display = 'none';
    }

    if (rec.sigMargin) {
        document.getElementById('inSigMargin').value = rec.sigMargin;
        adjustSignaturePosition(rec.sigMargin);
    }

    updateDoc();
    toggleModal(false);
}

// ── Delete record ───────────────────────────────────
async function deleteFromDB(id) {
    const rec = globalDatabase.find(r => r.id === id);
    const chalani = rec ? (rec.bodyChalani || rec.chalani || '') : '';
    if (confirm("के तपाईं यो रेकर्ड हटाउन चाहनुहुन्छ?\n(यो रेकर्ड १०० दिनसम्म रद्दीको टोकरी / Recycle Bin मा सुरक्षित रहनेछ)")) {
        try {
            if (typeof window.softDeleteRecord === 'function') {
                await window.softDeleteRecord("suchanaTansRecords", id, {
                    title: 'सूचना टाँस पत्र' + (chalani ? ' (च.नं. ' + chalani + ')' : ''),
                    category: 'सूचना टाँस पत्र',
                    chalani: chalani,
                    miti: rec ? (rec.praaptaMiti || rec.miti || '') : ''
                });
            } else {
                await db.collection("suchanaTansRecords").doc(id).update({
                    isDeleted: true,
                    deletedAtMillis: Date.now()
                });
            }
        } catch (e) {
            alert("डिलिट गर्न समस्या भयो: " + e.message);
        }
    }
}

// ── Nepal Sambat helper ─────────────────────────────
function getNepalSambatYear(adDate) {
    return 1146;
}

function formatFiscalYear(startYear) {
    const suffix = String(startYear + 1).slice(-2);
    return toNepaliDigit(`${startYear}/${suffix}`);
}

// ── Auto-detect current आ.व. and pre-select radio ──
function initializeFiscalYear(bsYear, bsMonth) {
    try {
        let startYear = bsYear;
        if (bsMonth < 4) startYear = bsYear - 1;
        const suffix = String(startYear + 1).slice(-2);
        const currFY1 = toNepaliDigit(`${startYear}/${suffix}`);
        const currFY2 = toNepaliDigit(`${startYear}/0${suffix}`);

        // Select letterhead FY radio
        const radios = document.querySelectorAll('input[name="ayRadio"]');
        let matched = false;
        radios.forEach(r => {
            if (r.value === currFY1 || r.value === currFY2) { r.checked = true; matched = true; }
        });
        // fallback: select last option if no match
        if (!matched && radios.length) radios[radios.length - 1].checked = true;

        // Select body FY option
        const inBodyAY = document.getElementById('inBodyAY');
        if (inBodyAY) {
            inBodyAY.value = currFY1;
        }
    } catch (e) { /* logged */; }
}

// ── Auto-fill date on page load ─────────────────────
function initializeAutomaticDate() {
    try {
        let nepaliBSDateStr = '';
        let bsYearVal  = 2083;
        let bsMonthVal = 2;

        const converter = window["@sbmdkl/nepali-date-converter"];
        if (!converter && (window._dateInitRetries || 0) < 5) {
            window._dateInitRetries = (window._dateInitRetries || 0) + 1;
            setTimeout(initializeAutomaticDate, 400);
        }
        if (converter && typeof converter.adToBs === 'function') {
            const today = new Date();
            const yyyy  = today.getFullYear();
            const mm    = String(today.getMonth() + 1).padStart(2, '0');
            const dd    = String(today.getDate()).padStart(2, '0');
            const bsDate = converter.adToBs(`${yyyy}-${mm}-${dd}`);

            let bsDayVal = 1;
            if (typeof bsDate === 'string') {
                const parts = bsDate.split(/[-/]/);
                bsYearVal  = parseInt(parts[0], 10);
                bsMonthVal = parseInt(parts[1], 10);
                bsDayVal   = parseInt(parts[2], 10);
            } else if (bsDate && typeof bsDate === 'object') {
                bsYearVal  = bsDate.bsYear  || bsDate.year  || 2083;
                bsMonthVal = bsDate.bsMonth || bsDate.month || 2;
                bsDayVal   = bsDate.bsDay   || bsDate.day   || 1;
            }
            const bsM = String(bsMonthVal).padStart(2, '0');
            const bsD = String(bsDayVal).padStart(2, '0');
            nepaliBSDateStr = toNepaliDigit(`${bsYearVal}/${bsM}/${bsD}`);
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
            const bsMStr = String(bsMonthVal).padStart(2, '0');
            const bsDStr = String(bsD).padStart(2, '0');
            nepaliBSDateStr = (typeof toNepaliDigit === 'function' ? toNepaliDigit : window.toNepaliDigit)(`${bsYearVal}/${bsMStr}/${bsDStr}`);
        }

        initializeFiscalYear(bsYearVal, bsMonthVal);

        const today  = new Date();
        const nsYear = getNepalSambatYear(today);

        const inMiti = document.getElementById('inMiti');
        if (inMiti) inMiti.value = nepaliBSDateStr;
        const inNS = document.getElementById('inNepalSamvat');
        if (inNS) inNS.value = toNepaliDigit(nsYear);

        if (typeof updateDoc === 'function') updateDoc();
        fetchCurrentNepalSambat();
    } catch (e) { /* logged */; }
}

function updateNepalSambatFromMiti() {
    const inNS = document.getElementById('inNepalSamvat');
    if (inNS) {
        inNS.value = '११४६';
        if (typeof updateDoc === 'function') updateDoc();
    }
}

async function fetchCurrentNepalSambat() {
    const inNS = document.getElementById('inNepalSamvat');
    if (inNS) {
        inNS.value = '११४६';
        if (typeof updateDoc === 'function') updateDoc();
    }
}

// ── Bootstrap ───────────────────────────────────────
window.onload = function () {
    initializeAutomaticDate();
    adjustSignaturePosition(40);
    updateDoc();
};

window.addEventListener('templateInjected', function () {
    initializeAutomaticDate();
});


