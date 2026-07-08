const firebaseConfig = {
    apiKey: "AIzaSyC3uCmLgNN8s0FDMIrkgxR8eH_AvJ_D3J4",
    authDomain: "gauradaha-ward1.firebaseapp.com",
    projectId: "gauradaha-ward1",
    storageBucket: "gauradaha-ward1.firebasestorage.app",
    messagingSenderId: "905617778132",
    appId: "1:905617778132:web:b8149cf37ae3f3c3b42241"
};

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let rowCounter = 0;
let activeRowIds = [];
let globalDatabase = [];

db.collection("gharBatoRecords").onSnapshot((snapshot) => {
    globalDatabase = [];
    snapshot.forEach((doc) => {
        globalDatabase.push({ id: doc.id, ...doc.data() });
    });
    globalDatabase.sort((a, b) => b.timestamp - a.timestamp);
    renderDatabaseTable();
});

// Converts english digits into clean Nepali unicode numbers
function toNepaliDigit(num) {
    const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return num.toString().split('').map(digit => nepaliDigits[digit] || digit).join('');
}

// Controls Abhilekh Popup Modal Overlay Visibility
function toggleModal(show) {
    const modal = document.getElementById('abhilekhModal');
    if (show) {
        modal.style.display = 'flex';
        renderDatabaseTable();
    } else {
        modal.style.display = 'none';
    }
}

// Adjusts the top margin of the signature section live
function adjustSignaturePosition(value) {
    document.getElementById('marginVal').innerText = toNepaliDigit(value) + " px";
    document.getElementById('docFooterSection').style.marginTop = value + "px";
}

// Dynamically Appends a New Land Record Block Row into Form Panel Container
function addKittaRow(data = null) {
    rowCounter++;
    const rowId = 'kitta_row_' + rowCounter;
    activeRowIds.push(rowId);

    const container = document.getElementById('kittaRowsContainer');
    const rowHtml = `
        <div class="kitta-row-block" id="${rowId}">
            <div class="row-num-badge">क्रम संख्या: <span class="row-index-display"></span></div>
            <button type="button" class="btn-delete-row" id="del_btn_${rowId}" onclick="removeKittaRow('${rowId}')">हटाउनुस्</button>
            <div class="table-row-input-grid">
                <input type="text" class="input-sit" placeholder="सिट नं." value="${data ? data.sit : ''}" oninput="updateDoc()">
                <input type="text" class="input-kitta" placeholder="कि.नं." value="${data ? data.kitta : ''}" oninput="updateDoc()">
                <input type="text" class="input-area" placeholder="क्षेत्रफल" value="${data ? data.area : ''}" oninput="updateDoc()">
            </div>
            <div class="form-group" style="margin-bottom: 8px;">
                <label style="font-size:0.75rem;">घर स्थिति:</label>
                <div class="radio-container">
                    <div class="radio-option">
                        <input type="radio" id="g_v_${rowCounter}" name="gharStatus_${rowCounter}" value="भएको" ${data && data.ghar === 'भएको' ? 'checked' : ''} onclick="updateDoc()">
                        <label for="g_v_${rowCounter}" class="radio-label" style="padding:4px; font-size:0.8rem;">भएको</label>
                    </div>
                    <div class="radio-option">
                        <input type="radio" id="g_nv_${rowCounter}" name="gharStatus_${rowCounter}" value="नभएको" ${data && data.ghar === 'नभएको' ? 'checked' : ''} onclick="updateDoc()">
                        <label for="g_nv_${rowCounter}" class="radio-label" style="padding:4px; font-size:0.8rem;">नभएको</label>
                    </div>
                </div>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
                <select class="input-bato" onchange="updateDoc()">
                    <option value="-">-- बाटोको विवरण --</option>
                    <option value="पक्की बाटो भएको" ${data && data.bato === 'पक्की बाटो भएको' ? 'selected' : ''}>पक्की बाटो भएको</option>
                    <option value="ग्राभेल बाटो भएको" ${data && data.bato === 'ग्राभेल बाटो भएको' ? 'selected' : ''}>ग्राभेल बाटो भएको</option>
                    <option value="माटोको बाटो भएको" ${data && data.bato === 'माटोको बाटो भएको' ? 'selected' : ''}>माटोको बाटो भएको</option>
                    <option value="कच्ची बाटो भएको" ${data && data.bato === 'कच्ची बाटो भएको' ? 'selected' : ''}>कच्ची बाटो भएको</option>
                    <option value="कुनै पनि प्रकारको बाटोले नभेट्ने" ${data && data.bato === 'कुनै पनि प्रकारको बाटोले नभेट्ने' ? 'selected' : ''}>कुनै पनि प्रकारको बाटोले नभेट्ने</option>
                    <option value="बगाएको" ${data && data.bato === 'बगाएको' ? 'selected' : ''}>बगाएको</option>
                </select>
            </div>
            <input type="text" class="input-remarks" placeholder="कैफियत" value="${data ? data.remarks : ''}" oninput="updateDoc()" style="margin-top:6px; padding:6px;">
        </div>
    `;
    container.insertAdjacentHTML('beforeend', rowHtml);
    reindexFormRows();
    updateDoc();
}

// Removes target element block securely from DOM hierarchy
function removeKittaRow(rowId) {
    if (activeRowIds.length <= 1) return;
    document.getElementById(rowId).remove();
    activeRowIds = activeRowIds.filter(id => id !== rowId);
    reindexFormRows();
    updateDoc();
}

// Automatically recalculates loop serialization counts
function reindexFormRows() {
    activeRowIds.forEach((id, index) => {
        document.getElementById(id).querySelector('.row-index-display').innerText = toNepaliDigit(index + 1);
        document.getElementById(`del_btn_${id}`).style.display = (activeRowIds.length === 1) ? 'none' : 'block';
    });
}

// Core Dynamic Preview Updates Sync Controller Engine
function updateDoc() {
    document.getElementById('lblPatraSankhya').innerText = document.getElementById('inPatraSankhya').value;
    document.getElementById('lblChalani').innerText = document.getElementById('inChalani').value || '';
    document.getElementById('lblMiti').innerText = document.getElementById('inMiti').value || '........';
    document.getElementById('lblNepalSamvat').innerText = document.getElementById('inNepalSamvat').value || '........';
    document.getElementById('lblOfficeName').innerText = document.getElementById('inOffice').value || '........';
    document.getElementById('lblOfficeAddress').innerText = document.getElementById('inOfficeAddress').value ? document.getElementById('inOfficeAddress').value + ' ।' : '........ ।';

    const selectedWada = document.getElementById('inWadaNo').value;
    document.getElementById('lblWadaBody').innerText = selectedWada;
    document.getElementById('lblSabikAddress').innerText = 'गौरादह गा.वि.स. वडा नं. ' + (document.getElementById('inSabikWada').value || '...');

    document.getElementById('lblOwnerName').innerText = document.getElementById('inName').value || '...........................';

    // Land Use Act Statement Controller
    const selectedZone = document.getElementById('inLandUseZone').value;
    const stmtBox = document.getElementById('lblLandUseStatement');
    if (selectedZone === 'NONE') {
        stmtBox.style.display = 'none';
    } else {
        stmtBox.style.display = 'block';
        document.getElementById('lblSelectedZone').innerText = selectedZone;
    }

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
            const signData = signSelect.split('|');
            sigName = signData[0];
            sigTitle = signData[1];
        }
    }
    lblSigName.innerText = sigName;
    document.getElementById('lblSigTitle').innerText = sigTitle;

    const tbody = document.getElementById('outputTableBody');
    tbody.innerHTML = '';

    activeRowIds.forEach((id, index) => {
        const block = document.getElementById(id);
        if (block) {
            const checkedRadio = block.querySelector('input[type="radio"]:checked');
            const tableRowHtml = `
                <tr>
                    <td>${toNepaliDigit(index + 1)}</td>
                    <td>${selectedWada}</td>
                    <td>${block.querySelector('.input-sit').value || '-'}</td>
                    <td>${block.querySelector('.input-kitta').value || '-'}</td>
                    <td>${block.querySelector('.input-area').value || '-'}</td>
                    <td>${checkedRadio ? checkedRadio.value : '-'}</td>
                    <td>${block.querySelector('.input-bato').value}</td>
                    <td>${block.querySelector('.input-remarks').value || '-'}</td>
                </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', tableRowHtml);
        }
    });
}

// Trigger Print Framework and Synchronize State Matrix Into Storage
async function printAndSaveSystem() {
    const name = document.getElementById('inName').value.trim();
    if (!name) { alert("कृपया जग्गाधनीको नाम अनिवार्य लेख्नुहोस् ।"); return; }

    const chalani = document.getElementById('inChalani').value.trim() || '-';
    const patra = document.getElementById('inPatraSankhya').value;
    const wada = document.getElementById('inWadaNo').value;
    const miti = document.getElementById('inMiti').value;

    let kittaRecords = [];
    activeRowIds.forEach(id => {
        const block = document.getElementById(id);
        if (block) {
            const checkedRadio = block.querySelector('input[type="radio"]:checked');
            kittaRecords.push({
                sit: block.querySelector('.input-sit').value,
                kitta: block.querySelector('.input-kitta').value,
                area: block.querySelector('.input-area').value,
                ghar: checkedRadio ? checkedRadio.value : '-',
                bato: block.querySelector('.input-bato').value,
                remarks: block.querySelector('.input-remarks').value
            });
        }
    });

    const recordId = document.getElementById('editRecordIndex').value;
    const currentObj = {
        patra, chalani, wada, name, miti,
        subject: "घर बाटो प्रमाणित",
        ns: document.getElementById('inNepalSamvat').value,
        office: document.getElementById('inOffice').value,
        officeAddress: document.getElementById('inOfficeAddress').value,
        sabikWada: document.getElementById('inSabikWada').value,
        signAuth: document.getElementById('inSignAuthority').value,
        customSignName: document.getElementById('inCustomSignName').value,
        customSignTitle: document.getElementById('inCustomSignTitle').value,
        sigMargin: document.getElementById('inSigMargin').value,
        landUseZone: document.getElementById('inLandUseZone').value,
        kittas: kittaRecords,
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
            await db.collection("gharBatoRecords").doc(recordId).update(currentObj);
        } else {
            const docRef = await db.collection("gharBatoRecords").add(currentObj);
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

// Renders the Modal Grid Elements Based on Target Parameters Filter Queries
function renderDatabaseTable() {
    const tbody = document.getElementById('dbTableBody');
    const search = document.getElementById('searchField').value.trim().toLowerCase();
    tbody.innerHTML = '';

    let counter = 0;
    globalDatabase.forEach((rec) => {
        if (search && !rec.name.toLowerCase().includes(search)) return;
        counter++;
        const rowHtml = `
            <tr>
                <td><b>${toNepaliDigit(counter)}</b></td>
                <td><b>${rec.name}</b></td>
                <td><span style="color:#a51d24; font-weight:bold;">${rec.subject}</span></td>
                <td>
                    ${toNepaliDigit(rec.miti)}
                    ${rec.timestamp ? `<div style="font-size:0.8rem; color:#718096; margin-top:2px;">⏱️ ${formatTimestamp(rec.timestamp)}</div>` : ''}
                </td>
                <td>
                    <div style="display:flex; gap:4px;">
                        <button class="btn-action btn-edit-db" onclick="editFromDB('${rec.id}')">📝</button>
                        <button class="btn-action btn-del-db" onclick="deleteFromDB('${rec.id}')">❌</button>
                    </div>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', rowHtml);
    });
}

// Pulls Specific History Context Variables Back onto Screen
function editFromDB(id) {
    const rec = globalDatabase.find(r => r.id === id);
    if (!rec) return;
    document.getElementById('editRecordIndex').value = id;
    document.getElementById('formMainTitle').innerText = "🔄 सम्पादन मोड";

    document.getElementById('inPatraSankhya').value = rec.patra;
    document.getElementById('inChalani').value = rec.chalani === '-' ? '' : rec.chalani;
    document.getElementById('inMiti').value = rec.miti;
    document.getElementById('inNepalSamvat').value = rec.ns;
    document.getElementById('inOffice').value = rec.office;
    document.getElementById('inOfficeAddress').value = rec.officeAddress;
    document.getElementById('inWadaNo').value = rec.wada;
    document.getElementById('inSabikWada').value = rec.sabikWada;
    document.getElementById('inName').value = rec.name;
    document.getElementById('inSignAuthority').value = rec.signAuth;
    if (rec.signAuth === 'CUSTOM') {
        document.getElementById('customSignBox').style.display = 'grid';
        document.getElementById('inCustomSignName').value = rec.customSignName || '';
        document.getElementById('inCustomSignTitle').value = rec.customSignTitle || '';
    } else {
        document.getElementById('customSignBox').style.display = 'none';
    }

    document.getElementById('inLandUseZone').value = rec.landUseZone || 'NONE';

    if (rec.sigMargin) {
        document.getElementById('inSigMargin').value = rec.sigMargin;
        adjustSignaturePosition(rec.sigMargin);
    }

    document.getElementById('kittaRowsContainer').innerHTML = '';
    activeRowIds = [];
    rec.kittas.forEach(kData => { addKittaRow(kData); });
    updateDoc();
    toggleModal(false);
}

// Deletes the Record Entry Permanently
async function deleteFromDB(id) {
    if (confirm("के तपाईं यो रेकर्ड क्लाउड डेटाबेसबाट स्थायी रूपमा हटाउन चाहनुहुन्छ?")) {
        try {
            await db.collection("gharBatoRecords").doc(id).delete();
        } catch (e) {
            console.error(e);
            alert("डिलिट गर्न समस्या भयो ।");
        }
    }
}

function getNepalSambatYear(adDate) {
    return 1146;
}

function toggleCustomSign() {
    const val = document.getElementById('inSignAuthority').value;
    document.getElementById('customSignBox').style.display = (val === 'CUSTOM') ? 'grid' : 'none';
}

function formatFiscalYear(startYear) {
    const endYear = startYear + 1;
    const endYearSuffix = String(endYear).slice(-2);
    const englishFY = `${startYear}/${endYearSuffix}`;
    return toNepaliDigit(englishFY);
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
            nepaliBSDateStr = (typeof toNepaliDigit === 'function' ? toNepaliDigit : window.toNepaliDigit)(`${bsYearVal}/${bsMStr}/${bsDStr}`);
        }

        initializeFiscalYear(bsYearVal, bsMonthVal);

        const today = new Date();
        const nsYear = getNepalSambatYear(today);
        nepaliNSYearStr = toNepaliDigit(nsYear);

        const inMiti = document.getElementById('inMiti');
        if (inMiti) {
            inMiti.value = nepaliBSDateStr;
        }

        const inNepalSamvat = document.getElementById('inNepalSamvat');
        if (inNepalSamvat) {
            inNepalSamvat.value = nepaliNSYearStr;
        }

        if (typeof updateDoc === 'function') updateDoc();
        fetchCurrentNepalSambat();
    } catch (error) {
        console.error("Error initializing automatic date:", error);
    }
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

// Page Bootstrap Init
window.onload = function () {
    initializeAutomaticDate();
    addKittaRow();
    adjustSignaturePosition(40);
};

window.addEventListener('templateInjected', function() {
    initializeAutomaticDate();
});