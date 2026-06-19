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

const app = firebase.initializeApp(firebaseConfig);
const db  = firebase.firestore();

let globalDatabase = [];

// ── Real-time listener ──────────────────────────────
db.collection("suchanaTansRecords").onSnapshot((snapshot) => {
    globalDatabase = [];
    snapshot.forEach((doc) => {
        globalDatabase.push({ id: doc.id, ...doc.data() });
    });
    globalDatabase.sort((a, b) => b.timestamp - a.timestamp);
    renderDatabaseTable();
});

// ── Helper: English digits → Nepali digits ──────────
function toNepaliDigit(num) {
    const nd = ['०','१','२','३','४','५','६','७','८','९'];
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
    const ay       = getSelectedAY();
    const chalani  = document.getElementById('inChalani').value       || '........';
    const miti     = document.getElementById('inMiti').value           || '........';
    const ns       = document.getElementById('inNepalSamvat').value    || '........';
    const wada     = document.getElementById('inWadaNo').value;
    const sandhiyar= document.getElementById('inSandhiyarName').value  || '.....................';
    const praaptaMiti= document.getElementById('inPraaptaMiti').value  || '........';
    const tansMiti = document.getElementById('inTansMiti').value       || '........';

    // Header
    document.getElementById('lblAY').innerText          = ay;
    document.getElementById('lblChalani').innerText     = chalani;
    document.getElementById('lblMiti').innerText        = miti;
    document.getElementById('lblNepalSamvat').innerText = ns;
    document.getElementById('lblWadaHeader').innerText  = wada;

    // Body
    document.getElementById('lblBodyAY').innerText       = ay;
    document.getElementById('lblBodyChalani').innerText  = chalani;
    document.getElementById('lblBodyWada').innerText     = wada;
    document.getElementById('lblSandhiyarName').innerText= sandhiyar;
    document.getElementById('lblPraaptaMiti').innerText  = praaptaMiti;
    document.getElementById('lblTansMiti').innerText     = tansMiti;

    // Signature
    const signSelect = document.getElementById('inSignAuthority').value;
    let sigName = '', sigTitle = '';
    if (signSelect === 'CUSTOM') {
        sigName  = document.getElementById('inCustomSignName').value  || '....................';
        sigTitle = document.getElementById('inCustomSignTitle').value || '....................';
    } else {
        const parts = signSelect.split('|');
        sigName  = parts[0];
        sigTitle = parts[1];
    }
    document.getElementById('lblSigName').innerText = sigName;
    document.getElementById('lblSigTitle').innerText = sigTitle;
}

// ── Print & Save ────────────────────────────────────
async function printAndSaveSystem() {
    const sandhiyar = document.getElementById('inSandhiyarName').value.trim();
    if (!sandhiyar) {
        alert("कृपया सँधियारको नाम अनिवार्य लेख्नुहोस् ।");
        return;
    }

    const ay          = getSelectedAY();
    const chalani     = document.getElementById('inChalani').value.trim()        || '-';
    const miti        = document.getElementById('inMiti').value.trim()            || '-';
    const ns          = document.getElementById('inNepalSamvat').value.trim()     || '-';
    const wada        = document.getElementById('inWadaNo').value;
    const praaptaMiti = document.getElementById('inPraaptaMiti').value.trim()    || '-';
    const tansMiti    = document.getElementById('inTansMiti').value.trim()        || '-';
    const signAuth    = document.getElementById('inSignAuthority').value;
    const customSignName  = document.getElementById('inCustomSignName').value;
    const customSignTitle = document.getElementById('inCustomSignTitle').value;
    const sigMargin   = document.getElementById('inSigMargin').value;

    const recordId = document.getElementById('editRecordIndex').value;

    const obj = {
        ay, chalani, miti, ns, wada,
        name: sandhiyar,        // use sandhiyar as searchable name
        sandhiyar, praaptaMiti, tansMiti,
        subject: "सूचना टाँस",
        signAuth, customSignName, customSignTitle, sigMargin,
        timestamp: Date.now()
    };

    try {
        if (recordId !== "") {
            await db.collection("suchanaTansRecords").doc(recordId).update(obj);
            document.getElementById('editRecordIndex').value = "";
            document.getElementById('formMainTitle').innerText = "📝 सूचना टाँस पत्र प्रविष्टि";
        } else {
            await db.collection("suchanaTansRecords").add(obj);
        }
        window.print();
    } catch (e) {
        console.error(e);
        alert("क्लाउडमा डाटा सुरक्षित गर्दा समस्या भयो! इन्टरनेट कनेक्सन जाँच्नुहोस् ।");
    }
}

// ── Render abhilekh table ───────────────────────────
function renderDatabaseTable() {
    const tbody  = document.getElementById('dbTableBody');
    const search = document.getElementById('searchField').value.trim().toLowerCase();
    tbody.innerHTML = '';
    let counter = 0;
    globalDatabase.forEach((rec) => {
        if (search && !rec.sandhiyar.toLowerCase().includes(search)) return;
        counter++;
        tbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td><b>${toNepaliDigit(counter)}</b></td>
                <td><b>${rec.sandhiyar}</b></td>
                <td><span style="color:#2b6cb0; font-weight:bold;">${rec.subject}</span></td>
                <td>${toNepaliDigit(rec.miti)}</td>
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

    document.getElementById('inChalani').value        = rec.chalani === '-' ? '' : rec.chalani;
    document.getElementById('inMiti').value           = rec.miti;
    document.getElementById('inNepalSamvat').value    = rec.ns;
    document.getElementById('inWadaNo').value         = rec.wada;
    document.getElementById('inSandhiyarName').value  = rec.sandhiyar;
    document.getElementById('inPraaptaMiti').value    = rec.praaptaMiti;
    document.getElementById('inTansMiti').value       = rec.tansMiti;
    document.getElementById('inSignAuthority').value  = rec.signAuth;

    if (rec.signAuth === 'CUSTOM') {
        document.getElementById('customSignBox').style.display = 'grid';
        document.getElementById('inCustomSignName').value  = rec.customSignName  || '';
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
    if (confirm("के तपाईं यो रेकर्ड क्लाउड डेटाबेसबाट स्थायी रूपमा हटाउन चाहनुहुन्छ?")) {
        try {
            await db.collection("suchanaTansRecords").doc(id).delete();
        } catch (e) {
            console.error(e);
            alert("डिलिट गर्न समस्या भयो ।");
        }
    }
}

// ── Nepal Sambat helper ─────────────────────────────
function getNepalSambatYear(adDate) {
    const year = adDate.getFullYear();
    const newYearDates = {
        2020: new Date(2020,10,15), 2021: new Date(2021,10,5),
        2022: new Date(2022, 9,26), 2023: new Date(2023,10,14),
        2024: new Date(2024,10, 2), 2025: new Date(2025, 9,22),
        2026: new Date(2026,10,10), 2027: new Date(2027, 9,31),
        2028: new Date(2028, 9,19), 2029: new Date(2029,10, 7),
        2030: new Date(2030, 9,27), 2031: new Date(2031,10,15),
        2032: new Date(2032,10, 3), 2033: new Date(2033, 9,23),
        2034: new Date(2034,10,12), 2035: new Date(2035,10, 1)
    };
    const ny = newYearDates[year];
    if (ny) return adDate >= ny ? year - 879 : year - 880;
    if (adDate.getMonth() > 9 || (adDate.getMonth() === 9 && adDate.getDate() >= 25))
        return year - 879;
    return year - 880;
}

function formatFiscalYear(startYear) {
    const suffix = '0' + String(startYear + 1).slice(-2);
    return toNepaliDigit(`${startYear}/${suffix}`);
}

// ── Auto-detect current आ.व. and pre-select radio ──
function initializeFiscalYear(bsYear, bsMonth) {
    try {
        let startYear = bsYear;
        if (bsMonth < 4) startYear = bsYear - 1;
        const currFY = formatFiscalYear(startYear);
        const radios = document.querySelectorAll('input[name="ayRadio"]');
        let matched = false;
        radios.forEach(r => {
            if (r.value === currFY) { r.checked = true; matched = true; }
        });
        // fallback: select last option if no match
        if (!matched && radios.length) radios[radios.length - 1].checked = true;
    } catch (e) { console.error(e); }
}

// ── Auto-fill date on page load ─────────────────────
function initializeAutomaticDate() {
    try {
        let nepaliBSDateStr = '';
        let bsYearVal  = 2083;
        let bsMonthVal = 2;

        const converter = window["@sbmdkl/nepali-date-converter"];
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
                bsYearVal  = bsDate.bsYear  || bsDate.year  || bsDate.currentYear  || 2083;
                bsMonthVal = bsDate.bsMonth || bsDate.month || bsDate.currentMonth || 2;
                bsDayVal   = bsDate.bsDay   || bsDate.day   || bsDate.currentDay   || 1;
            }
            const bsM = String(bsMonthVal).padStart(2, '0');
            const bsD = String(bsDayVal).padStart(2, '0');
            nepaliBSDateStr = toNepaliDigit(`${bsYearVal}/${bsM}/${bsD}`);
        } else {
            const today = new Date();
            bsYearVal  = today.getFullYear() + 57;
            bsMonthVal = 2;
            nepaliBSDateStr = toNepaliDigit(`${bsYearVal}/`);
        }

        initializeFiscalYear(bsYearVal, bsMonthVal);

        const today = new Date();
        const nsYear = getNepalSambatYear(today);

        const inMiti = document.getElementById('inMiti');
        if (inMiti) inMiti.value = nepaliBSDateStr;

        const inPraaptaMiti = document.getElementById('inPraaptaMiti');
        if (inPraaptaMiti) inPraaptaMiti.value = nepaliBSDateStr;

        const inTansMiti = document.getElementById('inTansMiti');
        if (inTansMiti) inTansMiti.value = nepaliBSDateStr;

        const inNS = document.getElementById('inNepalSamvat');
        if (inNS) inNS.value = toNepaliDigit(nsYear);

    } catch (e) { console.error("Date init error:", e); }
}

// ── Bootstrap ───────────────────────────────────────
window.onload = function () {
    initializeAutomaticDate();
    adjustSignaturePosition(40);
    updateDoc();
};
