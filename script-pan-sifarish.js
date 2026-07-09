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
function toggleBandaDocType() {
    const mode = document.getElementById('currentMode').value;
    const isBanda = (mode === 'banda');

    // Preview elements visibility
    document.getElementById('bodyKholne').style.display = (mode === 'kholne') ? 'block' : 'none';
    document.getElementById('bodyBanda').style.display = isBanda ? 'block' : 'none';
    document.getElementById('docFooterSection').style.display = 'flex';
}


function setMode(mode) {
    document.getElementById('currentMode').value = mode;

    const btnKholne = document.getElementById('btnKholne');
    const btnBanda  = document.getElementById('btnBanda');

    const sifarisNamaSection = document.getElementById('sifarisNamaSection');
    const panSection         = document.getElementById('panSection');

    if (mode === 'kholne') {
        btnKholne.className = "mode-btn active-kholne";
        btnBanda.className  = "mode-btn";
        sifarisNamaSection.style.display = "block";
        panSection.style.display         = "none";
    } else {
        btnKholne.className = "mode-btn";
        btnBanda.className  = "mode-btn active-banda";
        sifarisNamaSection.style.display = "block";
        panSection.style.display         = "block";
    }
    
    toggleBandaDocType();
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

    // Recipient Address update
    let receiverOffice = 'gauradaha';
    const receiverRadios = document.getElementsByName('receiverOfficeRadio');
    for (const r of receiverRadios) {
        if (r.checked) { receiverOffice = r.value; break; }
    }
    const lblReceiverAddress = document.getElementById('lblReceiverAddress');
    if (lblReceiverAddress) {
        if (receiverOffice === 'damak') {
            lblReceiverAddress.innerHTML = 'श्री आन्तरिक राजश्व कार्यालय<br>दमक, झापा ।';
        } else {
            lblReceiverAddress.innerHTML = 'श्री करदाता सेवा कार्यालय<br>गौरादह नगरपालिका<br>गौरादह, झापा ।';
        }
    }

    // Darta details
    const hasDarta = document.getElementById('chkDarta').checked;
    const dartaNo  = document.getElementById('inDartaNo').value  || '';
    const dartaMiti= document.getElementById('inDartaMiti').value|| '';


    // Subject dynamic update based on mode
    if (mode === 'kholne') {
        document.getElementById('lblSubject').innerHTML = "स्थायी लेखा नम्बर सिफारिस सम्बन्धमा ।";
    } else {
        document.getElementById('lblSubject').innerHTML = "स्थायी लेखा नम्बर बन्द गरिदिने सम्बन्धमा ।";
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

    let receiverOfficeVal = 'gauradaha';
    const receiverRadios = document.getElementsByName('receiverOfficeRadio');
    for (const r of receiverRadios) {
        if (r.checked) { receiverOfficeVal = r.value; break; }
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
        receiverOfficeRadio: receiverOfficeVal,
        subject:         mode === 'kholne' ? "स्थायी लेखा नं. सिफारिस (खोल्ने)" : "स्थायी लेखा नं. सिफारिस (बन्द)",
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
            await db.collection("panRecords").doc(recordId).update(obj);
        } else {
            const docRef = await db.collection("panRecords").add(obj);
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
    const formatted = `${y}/${m}/${day} ${hr}:${min}`;
    const toNep = typeof toNepaliDigit === 'function' ? toNepaliDigit : (window.toNepaliDigit || (x => x));
    return toNep(formatted);
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
                <td>
                    <b>${rec.name || '-'}</b>
                    ${rec.timestamp ? `<div style="font-size:0.78rem; color:#718096; margin-top:2px;">⏱️ ${formatTimestamp(rec.timestamp)}</div>` : ''}
                </td>
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
    setMode(mode);

    // Recipient office
    const roVal = rec.receiverOfficeRadio || 'gauradaha';
    const receiverRadios = document.getElementsByName('receiverOfficeRadio');
    receiverRadios.forEach(r => { r.checked = (r.value === roVal); });


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
    return 1146;
}

function formatFiscalYear(startYear) {
    const suffix = String(startYear + 1).slice(-2);
    return toNepaliDigit(`${startYear}/${suffix}`);
}

function initializeFiscalYear(bsYear, bsMonth) {
    try {
        let startYear = bsYear;
        if (bsMonth < 4) startYear = bsYear - 1;
        const suffix = String(startYear + 1).slice(-2);
        const currFY1 = toNepaliDigit(`${startYear}/${suffix}`);
        const currFY2 = toNepaliDigit(`${startYear}/0${suffix}`);
        const radios = document.querySelectorAll('input[name="ayRadio"]');
        let matched = false;
        radios.forEach(r => {
            if (r.value === currFY1 || r.value === currFY2) { r.checked = true; matched = true; }
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
    } catch (e) { console.error("Date init error:", e); }
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

// ── Bootstrap ─────────────────────────────────────────
window.onload = function () {
    initializeAutomaticDate();
    adjustSignaturePosition(40);
    setMode('kholne'); // start with kholne mode
    document.querySelectorAll('input[name="receiverOfficeRadio"]').forEach(radio => {
        radio.addEventListener('change', updateDoc);
    });
};

window.addEventListener('templateInjected', function() {
    initializeAutomaticDate();
});
