// ══════════════════════════════════════════════════════
//  script-pan-sifarish.js
//  स्थायी लेखा नं. सिफारिस (खोल्ने / बन्द गर्ने) — Firebase Firestore Logic
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

// Real-time listener for panRecords
db.collection("panRecords").onSnapshot((snapshot) => {
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
    const radios = document.querySelectorAll('input[name="ayRadio"]');
    for (const r of radios) { if (r.checked) return r.value; }
    return '';
}

// ── Mode toggle ─────────────────────────────────────
function setMode(mode) {
    document.getElementById('currentMode').value = mode;

    const btnKholne = document.getElementById('btnKholne');
    const btnBanda  = document.getElementById('btnBanda');

    const sifarisNamaSection = document.getElementById('sifarisNamaSection');
    const panSection         = document.getElementById('panSection');

    const bodyKholne = document.getElementById('bodyKholne');
    const bodyBanda  = document.getElementById('bodyBanda');

    if (mode === 'kholne') {
        // Toggle buttons
        btnKholne.className = "mode-btn active-kholne";
        btnBanda.className  = "mode-btn";

        // Form Fields
        sifarisNamaSection.style.display = "block";
        panSection.style.display         = "none";

        // Preview Letters
        bodyKholne.style.display = "block";
        bodyBanda.style.display  = "none";
    } else {
        // Toggle buttons
        btnKholne.className = "mode-btn";
        btnBanda.className  = "mode-btn active-banda";

        // Form Fields
        sifarisNamaSection.style.display = "block";
        panSection.style.display         = "block";

        // Preview Letters
        bodyKholne.style.display = "none";
        bodyBanda.style.display  = "block";
    }
    
    // Sync initial name if needed
    syncNivedakName();
    toggleSifarisNama();
    updateDoc();
}

// ── Form handlers ──────────────────────────────────
function toggleCustomPalika() {
    const radios = document.getElementsByName('palikaRadio');
    let isCustom = false;
    for (const r of radios) {
        if (r.checked && r.value === 'CUSTOM') {
            isCustom = true;
            break;
        }
    }
    document.getElementById('inCustomPalika').style.display = isCustom ? 'block' : 'none';
}

function syncNivedakName() {
    const radios = document.getElementsByName('sifarisNamaRadio');
    let sifarisNamaType = 'nivedak';
    for (const r of radios) {
        if (r.checked) {
            sifarisNamaType = r.value;
            break;
        }
    }
    if (sifarisNamaType === 'nivedak') {
        const nameVal = document.getElementById('inName').value;
        document.getElementById('inSifarisNama').value = nameVal;
    }
}

function toggleSifarisNama() {
    const radios = document.getElementsByName('sifarisNamaRadio');
    let isCustom = false;
    for (const r of radios) {
        if (r.checked && r.value === 'custom') {
            isCustom = true;
            break;
        }
    }
    const inputField = document.getElementById('inSifarisNama');
    inputField.style.display = isCustom ? 'block' : 'none';
    if (!isCustom) {
        // If not custom (i.e. 'nivedak'), copy value from inName
        const nameVal = document.getElementById('inName').value;
        inputField.value = nameVal;
    }
}

function toggleDarta() {
    const chk = document.getElementById('chkDarta');
    document.getElementById('dartaSection').style.display = chk.checked ? 'block' : 'none';
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

// ── Live preview updater ──────────────────────────────
function updateDoc() {
    const mode    = document.getElementById('currentMode').value;
    const ay      = getSelectedAY();
    const chalani = document.getElementById('inChalani').value     || '';
    const miti    = document.getElementById('inMiti').value         || '';
    const ns      = document.getElementById('inNepalSamvat').value  || '';
    const wada    = document.getElementById('inWadaNo').value.trim()|| '१';
    const name    = document.getElementById('inName').value         || '';
    const business= document.getElementById('inBusiness').value     || '';

    // Palika calculation
    let palikaVal = '';
    const palikaRadios = document.getElementsByName('palikaRadio');
    for (const r of palikaRadios) {
        if (r.checked) {
            palikaVal = r.value;
            break;
        }
    }
    if (palikaVal === 'CUSTOM') {
        palikaVal = document.getElementById('inCustomPalika').value || '';
    }

    // Letterhead
    document.getElementById('lblAY').innerText          = ay;
    document.getElementById('lblChalani').innerText     = chalani;
    document.getElementById('lblMiti').innerText        = miti;
    document.getElementById('lblNepalSamvat').innerText = ns;

    // Darta details
    const hasDarta = document.getElementById('chkDarta').checked;
    const dartaNo  = document.getElementById('inDartaNo').value  || '';
    const dartaMiti= document.getElementById('inDartaMiti').value|| '';

    // Subject dynamic update based on mode
    if (mode === 'kholne') {
        document.getElementById('lblSubject').innerText = "स्थायी लेखा नम्बर सिफारिस सम्बन्धमा ।";
    } else {
        document.getElementById('lblSubject').innerText = "स्थायी लेखा नम्बर बन्द गरिदिने सम्बन्धमा ।";
    }

    // sifarisNama resolution for preview
    const sifarisNamaRadios = document.getElementsByName('sifarisNamaRadio');
    let sifarisNamaType = 'nivedak';
    for (const r of sifarisNamaRadios) {
        if (r.checked) { sifarisNamaType = r.value; break; }
    }
    let sifarisNamaVal = '';
    if (sifarisNamaType === 'nivedak') {
        sifarisNamaVal = 'निज निवेदकको';
    } else {
        const customName = document.getElementById('inSifarisNama').value.trim();
        sifarisNamaVal = customName ? (customName + 'को') : '';
    }

    if (mode === 'kholne') {
        document.getElementById('lblPalika').innerText     = palikaVal;
        document.getElementById('lblWadaBody').innerText   = wada;
        document.getElementById('lblNameK').innerText       = name;
        document.getElementById('lblSifarisNamaK').innerText = sifarisNamaVal;
        document.getElementById('lblBusinessK').innerText   = business;

        const lblDartaK = document.getElementById('lblDartaK');
        if (hasDarta) {
            lblDartaK.style.display = 'inline';
            document.getElementById('lblDartaNoK').innerText   = `व्यवसाय दर्ता नं. ${dartaNo}, `;
            document.getElementById('lblDartaMitiK').innerText = `व्यवसाय दर्ता मिति: ${dartaMiti}`;
        } else {
            lblDartaK.style.display = 'none';
        }
    } else {
        document.getElementById('lblPalikaBanda').innerText = palikaVal;
        document.getElementById('lblWadaBodyBanda').innerText = wada;
        document.getElementById('lblNameBanda').innerText   = name;
        document.getElementById('lblSifarisNama').innerText = sifarisNamaVal;
        document.getElementById('lblBusinessBanda').innerText = business;

        const lblDartaBanda = document.getElementById('lblDartaBanda');
        if (hasDarta) {
            lblDartaBanda.style.display = 'inline';
            document.getElementById('lblDartaNoBanda').innerText = `व्यवसाय दर्ता नं. ${dartaNo}, `;
            document.getElementById('lblDartaMitiBanda').innerText = `व्यवसाय दर्ता मिति: ${dartaMiti}`;
        } else {
            lblDartaBanda.style.display = 'none';
        }

        const panVal = document.getElementById('inPAN').value || '';
        document.getElementById('lblPAN').innerText = panVal;
    }

    // Signature
    const signSelect = document.getElementById('inSignAuthority').value;
    let sigName = '', sigTitle = '';
    if (signSelect === 'CUSTOM') {
        sigName  = document.getElementById('inCustomSignName').value  || '';
        sigTitle = document.getElementById('inCustomSignTitle').value || '';
    } else {
        const parts = signSelect.split('|');
        sigName  = parts[0];
        sigTitle = parts[1];
    }
    document.getElementById('lblSigName').innerText = sigName;
    document.getElementById('lblSigTitle').innerText = sigTitle;
}

// ── Print & Save ──────────────────────────────────────
async function printAndSaveSystem() {
    const name = document.getElementById('inName').value.trim();
    if (!name) {
        alert("कृपया निवेदकको नाम अनिवार्य लेख्नुहोस् ।");
        return;
    }

    const mode = document.getElementById('currentMode').value;
    const recordId = document.getElementById('editRecordIndex').value;

    let palikaVal = '';
    const palikaRadios = document.getElementsByName('palikaRadio');
    for (const r of palikaRadios) {
        if (r.checked) { palikaVal = r.value; break; }
    }

    let sifarisNamaType = 'nivedak';
    const sifarisNamaRadios = document.getElementsByName('sifarisNamaRadio');
    for (const r of sifarisNamaRadios) {
        if (r.checked) { sifarisNamaType = r.value; break; }
    }

    const obj = {
        mode,
        ay:              getSelectedAY(),
        chalani:         document.getElementById('inChalani').value.trim()      || '-',
        miti:            document.getElementById('inMiti').value.trim()          || '-',
        ns:              document.getElementById('inNepalSamvat').value.trim()   || '-',
        palikaRadio:     palikaVal,
        customPalika:    document.getElementById('inCustomPalika').value.trim()  || '',
        wada:            document.getElementById('inWadaNo').value.trim(),
        name,
        sifarisNamaRadio: sifarisNamaType,
        sifarisNama:     document.getElementById('inSifarisNama').value.trim()   || '',
        business:        document.getElementById('inBusiness').value.trim()      || '',
        hasDarta:        document.getElementById('chkDarta').checked,
        dartaNo:         document.getElementById('inDartaNo').value.trim()      || '',
        dartaMiti:       document.getElementById('inDartaMiti').value.trim()    || '',
        panVal:          document.getElementById('inPAN').value.trim()          || '',
        subject:         mode === 'kholne' ? "स्थायी लेखा नं. सिफारिस (खोल्ने)" : "स्थायी लेखा नं. सिफारिस (बन्द)",
        signAuth:        document.getElementById('inSignAuthority').value,
        customSignName:  document.getElementById('inCustomSignName').value.trim(),
        customSignTitle: document.getElementById('inCustomSignTitle').value.trim(),
        sigMargin:       document.getElementById('inSigMargin').value,
        timestamp:       Date.now()
    };

    try {
        if (recordId !== "") {
            await db.collection("panRecords").doc(recordId).update(obj);
            document.getElementById('editRecordIndex').value = "";
            document.getElementById('formMainTitle').innerText = "📑 स्थायी लेखा नं. सिफारिस";
        } else {
            await db.collection("panRecords").add(obj);
        }
        window.print();
    } catch (e) {
        console.error(e);
        alert("क्लाउडमा डाटा सुरक्षित गर्दा समस्या भयो! इन्टरनेट कनेक्सन जाँच्नुहोस् ।");
    }
}

// ── Render abhilekh table ─────────────────────────────
function renderDatabaseTable() {
    const tbody  = document.getElementById('dbTableBody');
    const search = document.getElementById('searchField').value.trim().toLowerCase();
    tbody.innerHTML = '';
    let counter = 0;
    globalDatabase.forEach((rec) => {
        if (search && !(rec.name || '').toLowerCase().includes(search)) return;
        counter++;
        const recType = rec.mode === 'kholne' ? 'खोल्ने' : 'बन्द गर्ने';
        const typeBadge = rec.mode === 'kholne' 
            ? `<span style="color:#276749; background:#c6f6d5; padding:2px 8px; border-radius:12px; font-weight:bold; font-size:0.8rem;">${recType}</span>`
            : `<span style="color:#9b2c2c; background:#fed7d7; padding:2px 8px; border-radius:12px; font-weight:bold; font-size:0.8rem;">${recType}</span>`;

        tbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td><b>${toNepaliDigit(counter)}</b></td>
                <td><b>${rec.name || '-'}</b></td>
                <td>${typeBadge}</td>
                <td>${rec.business || '-'}</td>
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

// ── Edit from DB ──────────────────────────────────────
function editFromDB(id) {
    const rec = globalDatabase.find(r => r.id === id);
    if (!rec) return;

    document.getElementById('editRecordIndex').value = id;
    document.getElementById('formMainTitle').innerText = "🔄 सम्पादन मोड";

    // Switch mode
    const mode = rec.mode || 'kholne';
    document.getElementById('currentMode').value = mode;

    // Toggle active state manually
    const btnKholne = document.getElementById('btnKholne');
    const btnBanda  = document.getElementById('btnBanda');
    if (mode === 'kholne') {
        btnKholne.className = "mode-btn active-kholne";
        btnBanda.className  = "mode-btn";
        document.getElementById('sifarisNamaSection').style.display = "none";
        document.getElementById('panSection').style.display         = "none";
        document.getElementById('bodyKholne').style.display = "block";
        document.getElementById('bodyBanda').style.display  = "none";
    } else {
        btnKholne.className = "mode-btn";
        btnBanda.className  = "mode-btn active-banda";
        document.getElementById('sifarisNamaSection').style.display = "block";
        document.getElementById('panSection').style.display         = "block";
        document.getElementById('bodyKholne').style.display = "none";
        document.getElementById('bodyBanda').style.display  = "block";
    }

    // Fiscal Year radio
    const radios = document.querySelectorAll('input[name="ayRadio"]');
    radios.forEach(r => { r.checked = (r.value === rec.ay); });

    document.getElementById('inChalani').value      = rec.chalani === '-' ? '' : (rec.chalani || '');
    document.getElementById('inMiti').value         = rec.miti || '';
    document.getElementById('inNepalSamvat').value  = rec.ns || '';
    document.getElementById('inWadaNo').value       = rec.wada || '१';
    document.getElementById('inName').value         = rec.name || '';
    document.getElementById('inBusiness').value     = rec.business || '';

    // Palika
    const palikaRadios = document.getElementsByName('palikaRadio');
    palikaRadios.forEach(r => {
        r.checked = (r.value === rec.palikaRadio);
    });
    if (rec.palikaRadio === 'CUSTOM') {
        document.getElementById('inCustomPalika').style.display = 'block';
        document.getElementById('inCustomPalika').value = rec.customPalika || '';
    } else {
        document.getElementById('inCustomPalika').style.display = 'none';
    }

    // Darta Checkbox and inputs
    const chkDarta = document.getElementById('chkDarta');
    chkDarta.checked = rec.hasDarta || false;
    toggleDarta();
    document.getElementById('inDartaNo').value   = rec.dartaNo || '';
    document.getElementById('inDartaMiti').value = rec.dartaMiti || '';

    // SifarisNama (both modes)
    const sifarisNamaRadios = document.getElementsByName('sifarisNamaRadio');
    sifarisNamaRadios.forEach(r => {
        r.checked = (r.value === rec.sifarisNamaRadio);
    });
    toggleSifarisNama();
    document.getElementById('inSifarisNama').value = rec.sifarisNama || '';

    // PAN (banda only)
    if (mode === 'banda') {
        document.getElementById('inPAN').value = rec.panVal || '';
    } else {
        document.getElementById('inPAN').value = '';
    }

    document.getElementById('inSignAuthority').value = rec.signAuth || 'नगेन्द्र भण्डारी|वडा अध्यक्ष';
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

// ── Delete from DB ────────────────────────────────────
async function deleteFromDB(id) {
    if (confirm("के तपाईं यो रेकर्ड क्लाउड डाटाबेसबाट स्थायी रूपमा हटाउन चाहनुहुन्छ?")) {
        try {
            await db.collection("panRecords").doc(id).delete();
        } catch (e) {
            console.error(e);
            alert("डिलिट गर्न समस्या भयो ।");
        }
    }
}

// ── Nepal Sambat helper ───────────────────────────────
function getNepalSambatYear(adDate) {
    const year = adDate.getFullYear();
    const newYearDates = {
        2020: new Date(2020,10,15), 2021: new Date(2021,10,5),
        2022: new Date(2022, 9,26), 2023: new Date(2023,10,14),
        2024: new Date(2024,10, 2), 2025: new Date(2025, 9,22),
        2026: new Date(2026,10,10), 2027: new Date(2027, 9,31),
        2028: new Date(2028, 9,19), 2029: new Date(2029,10, 7),
        2030: new Date(2030, 9,27), 2031: new Date(2031,10,15),
    };
    const ny = newYearDates[year];
    if (ny) return adDate >= ny ? year - 879 : year - 880;
    return adDate.getMonth() > 9 ? year - 879 : year - 880;
}

function formatFiscalYear(startYear) {
    const suffix = '0' + String(startYear + 1).slice(-2);
    return toNepaliDigit(`${startYear}/${suffix}`);
}

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
        if (!matched && radios.length) radios[radios.length - 1].checked = true;
    } catch (e) { console.error(e); }
}

// ── Auto-fill date on page load ───────────────────────
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
            const bsMStr = String(bsMonthVal).padStart(2, '0');
            nepaliBSDateStr = toNepaliDigit(`${bsYearVal}/${bsMStr}/`);
        }

        initializeFiscalYear(bsYearVal, bsMonthVal);

        const today  = new Date();
        const nsYear = getNepalSambatYear(today);

        const inMiti = document.getElementById('inMiti');
        if (inMiti) inMiti.value = nepaliBSDateStr;
        const inNS = document.getElementById('inNepalSamvat');
        if (inNS) inNS.value = toNepaliDigit(nsYear);

        fetchCurrentNepalSambat();
    } catch (e) { console.error("Date init error:", e); }
}

function updateNepalSambatFromMiti() {
    const inMiti = document.getElementById('inMiti');
    const inNS = document.getElementById('inNepalSamvat');
    if (!inMiti || !inNS) return;

    const bsDateStr = inMiti.value.trim();
    if (!bsDateStr) return;

    const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    let engMiti = bsDateStr.split('').map(char => {
        const index = nepaliDigits.indexOf(char);
        return index !== -1 ? index : char;
    }).join('');

    const parts = engMiti.split(/[-/.]/);
    if (parts.length >= 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
            const converter = window["@sbmdkl/nepali-date-converter"];
            if (converter && typeof converter.bsToAd === 'function') {
                try {
                    const formattedBsStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const adResult = converter.bsToAd(formattedBsStr);
                    let adDate = null;
                    if (typeof adResult === 'string') {
                        adDate = new Date(adResult);
                    } else if (adResult && typeof adResult === 'object') {
                        const adY = adResult.year || adResult.adYear;
                        const adM = adResult.month || adResult.adMonth;
                        const adD = adResult.day || adResult.adDay;
                        if (adY && adM && adD) {
                            adDate = new Date(adY, adM - 1, adD);
                        }
                    }
                    if (adDate && !isNaN(adDate.getTime())) {
                        const nsYear = getNepalSambatYear(adDate);
                        inNS.value = toNepaliDigit(nsYear);
                    }
                } catch (e) {
                    console.error("Error converting BS to AD:", e);
                }
            } else {
                let nsYear = y - 937;
                if (m > 7 || (m === 7 && d >= 15)) {
                    nsYear = y - 936;
                }
                inNS.value = toNepaliDigit(nsYear);
            }
        }
    }
}

async function fetchCurrentNepalSambat() {
    try {
        const url = 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://www.nepalsambat.com/widget/nsstandard.php');
        const res = await fetch(url);
        if (!res.ok) return;
        const html = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const rows = doc.querySelectorAll('.row');
        if (rows.length >= 2) {
            const nsYear = rows[0].innerText.trim();
            const nsTithi = rows[1].innerText.trim();
            
            const tithiMap = {
                'पारु': '१', 'प्रतिपदा': '१',
                'दुतिया': '२', 'द्वितीया': '२',
                'तृतिया': '३', 'तृतीया': '३',
                'चौथि': '४', 'चतुर्थी': '४',
                'पञ्चमी': '५',
                'खस्थि': '६', 'षष्ठी': '६',
                'सप्तमी': '७',
                'अष्टमी': '८',
                'नवमी': '९',
                'दशमी': '१०',
                'एकादशी': '११',
                'दुवादशी': '१२', 'द्वादशी': '१२',
                'त्रयोदशी': '१३',
                'चह्रे': '१४', 'चतुर्दशी': '१४',
                'पुन्ही': '१५', 'पूर्णिमा': '१५',
                'आमाइ': '१५', 'औंसी': '१५'
            };
            
            let dayDigit = '';
            for (const key in tithiMap) {
                if (nsTithi.includes(key)) {
                    dayDigit = ' ' + tithiMap[key];
                    break;
                }
            }
            
            const fullNepalSambat = `${nsYear} ${nsTithi}${dayDigit}`;
            const inNS = document.getElementById('inNepalSamvat');
            if (inNS) {
                inNS.value = fullNepalSambat;
                if (typeof updateDoc === 'function') {
                    updateDoc();
                }
            }
        }
    } catch (e) {
        console.error("Error fetching Nepal Sambat widget:", e);
    }
}

// ── Bootstrap ─────────────────────────────────────────
window.onload = function () {
    initializeAutomaticDate();
    adjustSignaturePosition(40);
    setMode('kholne'); // start with kholne mode
};
