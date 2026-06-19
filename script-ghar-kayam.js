// ══════════════════════════════════════════════════════
//  script-ghar-kayam.js
//  घर कायम सिफारिस — Firebase Firestore Logic
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
let rowCounter = 0;
let activeRowIds = [];

// Real-time listener
db.collection("gharKayamRecords").onSnapshot((snapshot) => {
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

// ── Modal toggle ─────────────────────────────────────
function toggleModal(show) {
    const modal = document.getElementById('abhilekhModal');
    modal.style.display = show ? 'flex' : 'none';
    if (show) renderDatabaseTable();
}

// ── Signature margin ──────────────────────────────────
function adjustSignaturePosition(value) {
    document.getElementById('marginVal').innerText = toNepaliDigit(value) + " px";
    document.getElementById('docFooterSection').style.marginTop = value + "px";
}

// ── Custom sign toggle ────────────────────────────────
function toggleCustomSign() {
    const val = document.getElementById('inSignAuthority').value;
    document.getElementById('customSignBox').style.display = (val === 'CUSTOM') ? 'grid' : 'none';
}

// ── Add/Remove house rows ─────────────────────────────
function addHouseRow(data = null) {
    rowCounter++;
    const rowId = 'house_row_' + rowCounter;
    activeRowIds.push(rowId);

    const container = document.getElementById('houseRowsContainer');
    const rowHtml = `
        <div class="house-row-block" id="${rowId}">
            <div class="row-num-badge">क्रम संख्या: <span class="row-index-display"></span></div>
            <button type="button" class="btn-delete-row" id="del_${rowId}" onclick="removeHouseRow('${rowId}')">हटाउनुस्</button>

            <div class="row-grid">
                <div class="form-group">
                    <label>साविक वडा नं.:</label>
                    <input type="text" class="inp-sabik-wada" placeholder="गौरादह ३" value="${data ? data.sabikWada : ''}" oninput="updateDoc()">
                </div>
                <div class="form-group">
                    <label>हाल वडा नं.:</label>
                    <input type="text" class="inp-hal-wada" placeholder="गौरादह न.पा वडा नं.१" value="${data ? data.halWada : ''}" oninput="updateDoc()">
                </div>
            </div>

            <div class="row-grid">
                <div class="form-group">
                    <label>किता नं.:</label>
                    <input type="text" class="inp-kitta" placeholder="१८२" value="${data ? data.kitta : ''}" oninput="updateDoc()">
                </div>
                <div class="form-group">
                    <label>सिट नं.:</label>
                    <input type="text" class="inp-sit" placeholder="१७०३३८" value="${data ? data.sit : ''}" oninput="updateDoc()">
                </div>
            </div>

            <div class="row-grid">
                <div class="form-group">
                    <label>क्षेत्रफल (व.मि):</label>
                    <input type="text" class="inp-area" placeholder="३३८.६३ व.मि" value="${data ? data.area : ''}" oninput="updateDoc()">
                </div>
                <div class="form-group">
                    <label>जम्मा क्षेत्रफल (व.फि):</label>
                    <input type="text" class="inp-total-area" placeholder="१३१२.४९ व.फि" value="${data ? data.totalArea : ''}" oninput="updateDoc()">
                </div>
            </div>

            <div class="form-group">
                <label>घरको प्रकार:</label>
                <input type="text" class="inp-ghar-type" placeholder="आरसी सी फ्रेम स्ट्रक्चर भएको एक तलाको घर" value="${data ? data.gharType : ''}" oninput="updateDoc()">
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', rowHtml);
    reindexRows();
    updateDoc();
}

function removeHouseRow(rowId) {
    if (activeRowIds.length <= 1) return;
    document.getElementById(rowId).remove();
    activeRowIds = activeRowIds.filter(id => id !== rowId);
    reindexRows();
    updateDoc();
}

function reindexRows() {
    activeRowIds.forEach((id, index) => {
        const block = document.getElementById(id);
        if (block) {
            block.querySelector('.row-index-display').innerText = toNepaliDigit(index + 1);
            const delBtn = document.getElementById(`del_${id}`);
            if (delBtn) delBtn.style.display = activeRowIds.length === 1 ? 'none' : 'block';
        }
    });
}

function collectHouseRows() {
    const rows = [];
    activeRowIds.forEach(id => {
        const block = document.getElementById(id);
        if (block) {
            rows.push({
                sabikWada: block.querySelector('.inp-sabik-wada').value.trim(),
                halWada:   block.querySelector('.inp-hal-wada').value.trim(),
                kitta:     block.querySelector('.inp-kitta').value.trim(),
                sit:       block.querySelector('.inp-sit').value.trim(),
                area:      block.querySelector('.inp-area').value.trim(),
                totalArea: block.querySelector('.inp-total-area').value.trim(),
                gharType:  block.querySelector('.inp-ghar-type').value.trim()
            });
        }
    });
    return rows;
}

// ── Live preview updater ──────────────────────────────
function updateDoc() {
    const ay      = getSelectedAY();
    const chalani = document.getElementById('inChalani').value     || '........';
    const miti    = document.getElementById('inMiti').value         || '........';
    const ns      = document.getElementById('inNepalSamvat').value  || '........';
    const wada    = document.getElementById('inWadaNo').value;
    const name    = document.getElementById('inName').value         || '....................';
    const citNo   = document.getElementById('inCitNo').value        || '........';
    const citDate = document.getElementById('inCitDate').value      || '........';
    const citDist = document.getElementById('inCitDistrict').value  || '........';
    const gharMiti= document.getElementById('inGharMiti').value     || '........';

    // Letterhead
    document.getElementById('lblAY').innerText          = ay;
    document.getElementById('lblChalani').innerText     = chalani;
    document.getElementById('lblMiti').innerText        = miti;
    document.getElementById('lblNepalSamvat').innerText = ns;

    // Body
    document.getElementById('lblWadaBody').innerText    = wada;
    document.getElementById('lblName').innerText        = name;
    document.getElementById('lblCitNo').innerText       = citNo;
    document.getElementById('lblCitDate').innerText     = citDate;
    document.getElementById('lblCitDistrict').innerText = citDist;
    document.getElementById('lblGharMiti').innerText    = gharMiti;

    // House table preview
    const rows = collectHouseRows();
    const tbody = document.getElementById('lblHouseTableBody');
    tbody.innerHTML = '';
    if (rows.length === 0) {
        tbody.innerHTML = `<tr><td>१.</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`;
    } else {
        rows.forEach((row, idx) => {
            const wadaCell = row.sabikWada || row.halWada
                ? `साविक ${row.sabikWada || '...'}<br>हाल ${row.halWada || '...'}`
                : '';
            tbody.insertAdjacentHTML('beforeend', `
                <tr>
                    <td>${toNepaliDigit(idx + 1)}.</td>
                    <td style="text-align:left;">${wadaCell}</td>
                    <td>${row.kitta || ''}</td>
                    <td>${row.sit || ''}</td>
                    <td>${row.area || ''}</td>
                    <td style="text-align:left;">${row.gharType || ''}</td>
                    <td>${row.totalArea || ''}</td>
                </tr>
            `);
        });
    }

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

// ── Print & Save ──────────────────────────────────────
async function printAndSaveSystem() {
    const name = document.getElementById('inName').value.trim();
    if (!name) {
        alert("कृपया निवेदकको नाम अनिवार्य लेख्नुहोस् ।");
        return;
    }

    const houseRows = collectHouseRows();
    const recordId  = document.getElementById('editRecordIndex').value;

    const obj = {
        ay:          getSelectedAY(),
        chalani:     document.getElementById('inChalani').value.trim()      || '-',
        miti:        document.getElementById('inMiti').value.trim()          || '-',
        ns:          document.getElementById('inNepalSamvat').value.trim()   || '-',
        wada:        document.getElementById('inWadaNo').value,
        sabikWada:   document.getElementById('inSabikWada').value.trim()    || '-',
        name,
        citNo:       document.getElementById('inCitNo').value.trim()        || '-',
        citDate:     document.getElementById('inCitDate').value.trim()      || '-',
        citDistrict: document.getElementById('inCitDistrict').value.trim()  || '-',
        gharMiti:    document.getElementById('inGharMiti').value.trim()     || '-',
        houseRows,
        subject:     "घर कायम सिफारिस",
        signAuth:    document.getElementById('inSignAuthority').value,
        customSignName:  document.getElementById('inCustomSignName').value,
        customSignTitle: document.getElementById('inCustomSignTitle').value,
        sigMargin:   document.getElementById('inSigMargin').value,
        timestamp:   Date.now()
    };

    try {
        if (recordId !== "") {
            await db.collection("gharKayamRecords").doc(recordId).update(obj);
            document.getElementById('editRecordIndex').value = "";
            document.getElementById('formMainTitle').innerText = "🏠 घर कायम सिफारिस प्रविष्टि";
        } else {
            await db.collection("gharKayamRecords").add(obj);
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
        tbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td><b>${toNepaliDigit(counter)}</b></td>
                <td><b>${rec.name || '-'}</b></td>
                <td><span style="color:#2b6cb0; font-weight:bold;">${rec.subject || 'घर कायम सिफारिस'}</span></td>
                <td>${rec.miti || '-'}</td>
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

    // Fiscal Year radio
    const radios = document.querySelectorAll('input[name="ayRadio"]');
    radios.forEach(r => { r.checked = (r.value === rec.ay); });

    document.getElementById('inChalani').value      = rec.chalani === '-' ? '' : (rec.chalani || '');
    document.getElementById('inMiti').value         = rec.miti || '';
    document.getElementById('inNepalSamvat').value  = rec.ns || '';
    document.getElementById('inWadaNo').value       = rec.wada || '१';
    document.getElementById('inSabikWada').value    = rec.sabikWada === '-' ? '' : (rec.sabikWada || '');
    document.getElementById('inName').value         = rec.name || '';
    document.getElementById('inCitNo').value        = rec.citNo === '-' ? '' : (rec.citNo || '');
    document.getElementById('inCitDate').value      = rec.citDate === '-' ? '' : (rec.citDate || '');
    document.getElementById('inCitDistrict').value  = rec.citDistrict === '-' ? '' : (rec.citDistrict || '');
    document.getElementById('inGharMiti').value     = rec.gharMiti === '-' ? '' : (rec.gharMiti || '');

    // House rows
    document.getElementById('houseRowsContainer').innerHTML = '';
    activeRowIds = [];
    const rows = rec.houseRows && rec.houseRows.length ? rec.houseRows : [{}];
    rows.forEach(row => addHouseRow(row));

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
            await db.collection("gharKayamRecords").doc(id).delete();
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

    } catch (e) { console.error("Date init error:", e); }
}

// ── Bootstrap ─────────────────────────────────────────
window.onload = function () {
    initializeAutomaticDate();
    addHouseRow();
    adjustSignaturePosition(40);
    updateDoc();
};
