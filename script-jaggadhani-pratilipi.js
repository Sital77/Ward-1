// ══════════════════════════════════════════════════════
//  script-jaggadhani-pratilipi.js
//  जग्गाधनी पूर्जा प्रतिलिपि सिफारिस — Firebase Firestore Logic
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

// Auth ready भएपछि मात्र snapshot listener start गर्ने
(window._firebaseAuthReady || Promise.resolve()).then(() => {
    db.collection("jaggadhaniPratilipiRecords").onSnapshot((snapshot) => {
        globalDatabase = [];
        snapshot.forEach((doc) => {
            globalDatabase.push({ id: doc.id, ...doc.data() });
        });
        globalDatabase.sort((a, b) => b.timestamp - a.timestamp);
        renderDatabaseTable();
    });
}).catch(() => {});


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

// ── Add/Remove kitta rows ─────────────────────────────
function addKittaRow(data = null) {
    rowCounter++;
    const rowId = 'kitta_row_' + rowCounter;
    activeRowIds.push(rowId);

    const container = document.getElementById('kittaRowsContainer');
    const rowHtml = `
        <div class="house-row-block" id="${rowId}">
            <div class="row-num-badge">क्रम संख्या: <span class="row-index-display"></span></div>
            <button type="button" class="btn-delete-row" id="del_${rowId}" onclick="removeKittaRow('${rowId}')">हटाउनुस्</button>

            <div class="row-grid">
                <div class="form-group">
                    <label>सिट नं. (वैकल्पिक):</label>
                    <input type="text" class="inp-sheet" placeholder="उदा: ०७-१०२-क" value="${data ? (data.sheet || '') : ''}" oninput="updateDoc()">
                </div>
                <div class="form-group">
                    <label>कित्ता नं.:</label>
                    <input type="text" class="inp-kitta" placeholder="उदा: १५२" value="${data ? (data.kitta || '') : ''}" oninput="updateDoc()">
                </div>
            </div>

            <div class="row-grid">
                <div class="form-group">
                    <label>जग्गाको क्षेत्रफल:</label>
                    <input type="text" class="inp-area" placeholder="उदा: ०-१-२-३ वा ३५० व.मि" value="${data ? (data.area || '') : ''}" oninput="updateDoc()">
                </div>
                <div class="form-group">
                    <label>कैफियत:</label>
                    <input type="text" class="inp-remarks" placeholder="उदा: -" value="${data ? (data.remarks || '-') : '-'}" oninput="updateDoc()">
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', rowHtml);
    reindexRows();
    updateDoc();
}

function removeKittaRow(rowId) {
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

function collectKittaRows() {
    const rows = [];
    activeRowIds.forEach(id => {
        const block = document.getElementById(id);
        if (block) {
            rows.push({
                sheet:   block.querySelector('.inp-sheet').value.trim(),
                kitta:   block.querySelector('.inp-kitta').value.trim(),
                area:    block.querySelector('.inp-area').value.trim(),
                remarks: block.querySelector('.inp-remarks').value.trim() || '-'
            });
        }
    });
    return rows;
}

// ── Live preview updater ──────────────────────────────
function updateDoc() {
    const ay      = getSelectedAY();
    const chalani = document.getElementById('inChalani').value     || '';
    const miti    = document.getElementById('inMiti').value         || '........';
    const ns      = document.getElementById('inNepalSamvat').value  || '........';

    // Letterhead
    document.getElementById('lblAY').innerText          = ay;
    document.getElementById('lblChalani').innerText     = chalani;
    document.getElementById('lblMiti').innerText        = miti;
    document.getElementById('lblNepalSamvat').innerText = ns;

    // Applicant & Residence
    const district      = document.getElementById('inDistrict').value.trim()     || '........';
    const palikaType    = document.getElementById('inPalikaType').value          || 'नगरपालिका';
    const palikaName    = document.getElementById('inPalikaName').value.trim()   || '........';
    const residentWada  = document.getElementById('inResidentWada').value.trim() || '....';
    const applicantName = document.getElementById('inApplicantName').value.trim()|| '....................';

    document.getElementById('lblDistrict').innerText      = district;
    document.getElementById('lblPalikaType').innerText    = palikaType;
    document.getElementById('lblPalikaName').innerText    = palikaName;
    document.getElementById('lblResidentWada').innerText  = residentWada;
    document.getElementById('lblApplicantName').innerText = applicantName;

    // Citizenship details
    const citNo   = document.getElementById('inCitNo').value.trim();
    const citDate = document.getElementById('inCitDate').value.trim();
    const citDist = document.getElementById('inCitDistrict').value.trim();

    const lblCitDetailsSpan = document.getElementById('lblCitDetailsSpan');
    const divDetailCit      = document.getElementById('divDetailCit');
    if (citNo || citDate || citDist) {
        lblCitDetailsSpan.innerHTML = `(ना.प्र.नं. <span style="font-weight:bold;">${citNo || '...'}</span>, जारी मिति: <span style="font-weight:bold;">${citDate || '...'}</span>, <span style="font-weight:bold;">${citDist || '...'}</span>)`;
        divDetailCit.style.display = 'block';
        document.getElementById('lblDetailCitNo').innerText       = citNo || '...';
        document.getElementById('lblDetailCitDate').innerText     = citDate || '...';
        document.getElementById('lblDetailCitDistrict').innerText = citDist || '...';
    } else {
        lblCitDetailsSpan.innerHTML = '';
        divDetailCit.style.display = 'none';
    }

    // Family details
    const fatherName      = document.getElementById('inFatherName').value.trim();
    const grandfatherName = document.getElementById('inGrandfatherName').value.trim();
    const husbandName     = document.getElementById('inHusbandName').value.trim();

    const divDetailFather = document.getElementById('divDetailFather');
    if (fatherName) {
        divDetailFather.style.display = 'block';
        document.getElementById('lblDetailFather').innerText = fatherName;
    } else {
        divDetailFather.style.display = 'none';
    }

    const divDetailGrandfather = document.getElementById('divDetailGrandfather');
    if (grandfatherName) {
        divDetailGrandfather.style.display = 'block';
        document.getElementById('lblDetailGrandfather').innerText = grandfatherName;
    } else {
        divDetailGrandfather.style.display = 'none';
    }

    const divDetailHusband = document.getElementById('divDetailHusband');
    if (husbandName) {
        divDetailHusband.style.display = 'block';
        document.getElementById('lblDetailHusband').innerText = husbandName;
    } else {
        divDetailHusband.style.display = 'none';
    }

    // Details block name
    document.getElementById('lblDetailName').innerText = applicantName;

    // Kitta Table and paragraph summary
    const rows = collectKittaRows();
    const tbody = document.getElementById('lblKittaTableBody');
    tbody.innerHTML = '';

    let sheetsList = [];
    let kittasList = [];
    let areasList  = [];

    if (rows.length === 0) {
        tbody.innerHTML = `<tr><td>१</td><td></td><td></td><td></td><td>-</td></tr>`;
        document.getElementById('lblLandSummarySpan').innerText = "(सिट नं. ........, कित्ता नं. ........ को क्षेत्रफल: ........ व.मि)";
    } else {
        rows.forEach((row, idx) => {
            if (row.sheet && row.sheet !== '-') sheetsList.push(row.sheet);
            if (row.kitta) kittasList.push(row.kitta);
            if (row.area) areasList.push(row.area);

            tbody.insertAdjacentHTML('beforeend', `
                <tr>
                    <td>${toNepaliDigit(idx + 1)}</td>
                    <td>${row.sheet || ''}</td>
                    <td>${row.kitta || ''}</td>
                    <td>${row.area || ''}</td>
                    <td>${row.remarks || '-'}</td>
                </tr>
            `);
        });

        // Summary span inside letter paragraph
        let summaryText = "";
        if (rows.length === 1) {
            const r = rows[0];
            const sheetStr = r.sheet ? `सिट नं. ${r.sheet}, ` : '';
            summaryText = `(${sheetStr}कित्ता नं. ${r.kitta || '...'} को क्षेत्रफल: ${r.area || '...'})`;
        } else {
            const parts = rows.map(r => {
                const sheetStr = (r.sheet && r.sheet !== '-') ? `सिट नं. ${r.sheet}, ` : '';
                return `${sheetStr}कित्ता नं. ${r.kitta || '...'} को क्षेत्रफल: ${r.area || '...'}`;
            });
            summaryText = `(${parts.join(' तथा ')})`;
        }
        document.getElementById('lblLandSummarySpan').innerText = summaryText;
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
    const applicantName = document.getElementById('inApplicantName').value.trim();
    if (!applicantName) {
        alert("कृपया निवेदकको नाम अनिवार्य लेख्नुहोस् ।");
        return;
    }

    const kittaRows = collectKittaRows();
    const recordId  = document.getElementById('editRecordIndex').value;

    const obj = {
        ay:              getSelectedAY(),
        chalani:         document.getElementById('inChalani').value.trim()        || '-',
        miti:            document.getElementById('inMiti').value.trim()           || '-',
        ns:              document.getElementById('inNepalSamvat').value.trim()    || '-',
        district:        document.getElementById('inDistrict').value.trim()       || 'झापा',
        palikaType:      document.getElementById('inPalikaType').value            || 'नगरपालिका',
        palikaName:      document.getElementById('inPalikaName').value.trim()     || 'गौरादह',
        residentWada:    document.getElementById('inResidentWada').value.trim()   || '१',
        name:            applicantName,
        citNo:           document.getElementById('inCitNo').value.trim()          || '-',
        citDate:         document.getElementById('inCitDate').value.trim()        || '-',
        citDistrict:     document.getElementById('inCitDistrict').value.trim()    || '-',
        fatherName:      document.getElementById('inFatherName').value.trim()     || '',
        grandfatherName: document.getElementById('inGrandfatherName').value.trim()|| '',
        husbandName:     document.getElementById('inHusbandName').value.trim()    || '',
        kittaRows,
        subject:         "जग्गाधनी पूर्जा प्रतिलिपि सिफारिस",
        signAuth:        document.getElementById('inSignAuthority').value,
        customSignName:  document.getElementById('inCustomSignName').value,
        customSignTitle: document.getElementById('inCustomSignTitle').value,
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
            await db.collection("jaggadhaniPratilipiRecords").doc(recordId).update(obj);
        } else {
            const docRef = await db.collection("jaggadhaniPratilipiRecords").add(obj);
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
        tbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td><b>${toNepaliDigit(counter)}</b></td>
                <td><b>${rec.name || '-'}</b></td>
                <td><span style="color:#2b6cb0; font-weight:bold;">${rec.subject || 'जग्गाधनी पूर्जा प्रतिलिपि सिफारिस'}</span></td>
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

// ── Edit from DB ──────────────────────────────────────
function editFromDB(id) {
    const rec = globalDatabase.find(r => r.id === id);
    if (!rec) return;

    document.getElementById('editRecordIndex').value = id;
    document.getElementById('formMainTitle').innerText = "🔄 सम्पादन मोड";

    // Fiscal Year radio
    const radios = document.querySelectorAll('input[name="ayRadio"]');
    radios.forEach(r => { r.checked = (r.value === rec.ay); });

    document.getElementById('inChalani').value        = rec.chalani === '-' ? '' : (rec.chalani || '');
    document.getElementById('inMiti').value           = rec.miti || '';
    document.getElementById('inNepalSamvat').value    = rec.ns || '';
    document.getElementById('inDistrict').value       = rec.district || 'झापा';
    document.getElementById('inPalikaType').value     = rec.palikaType || 'नगरपालिका';
    document.getElementById('inPalikaName').value     = rec.palikaName || 'गौरादह';
    document.getElementById('inResidentWada').value   = rec.residentWada || '१';
    document.getElementById('inApplicantName').value  = rec.name || '';
    document.getElementById('inCitNo').value          = rec.citNo === '-' ? '' : (rec.citNo || '');
    document.getElementById('inCitDate').value        = rec.citDate === '-' ? '' : (rec.citDate || '');
    document.getElementById('inCitDistrict').value    = rec.citDistrict === '-' ? '' : (rec.citDistrict || '');
    document.getElementById('inFatherName').value     = rec.fatherName || '';
    document.getElementById('inGrandfatherName').value= rec.grandfatherName || '';
    document.getElementById('inHusbandName').value    = rec.husbandName || '';

    // Kitta rows
    document.getElementById('kittaRowsContainer').innerHTML = '';
    activeRowIds = [];
    const rows = rec.kittaRows && rec.kittaRows.length ? rec.kittaRows : [{}];
    rows.forEach(row => addKittaRow(row));

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
            await db.collection("jaggadhaniPratilipiRecords").doc(id).delete();
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
    return toNepaliDigit(`${startYear}/0${suffix}`);
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
    addKittaRow();
    adjustSignaturePosition(40);
    updateDoc();
};

window.addEventListener('templateInjected', function() {
    initializeAutomaticDate();
});
