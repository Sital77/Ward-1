// १. तपाईंको गुगल फायरबेसको साँचो (API Keys)
const firebaseConfig = {
    apiKey: "AIzaSyC3uCmLgNN8s0FDMIrkgxR8eH_AvJ_D3J4",
    authDomain: "gauradaha-ward1.firebaseapp.com",
    projectId: "gauradaha-ward1",
    storageBucket: "gauradaha-ward1.firebasestorage.app",
    messagingSenderId: "905617778132",
    appId: "1:905617778132:web:b8149cf37ae3f3c3b42241"
};

// २. क्लाउड डाटाबेस चालु गर्ने
if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const db = firebase.firestore();

let globalDatabase = [];
let rowCounter = 0;
let activeRowIds = [];

// ३. रियल-टाइम डाटाबेस सिङ्क — Auth ready भएपछि मात्र
(window._firebaseAuthReady || Promise.resolve()).then(() => {
    db.collection("batoPramanitRecords").onSnapshot((snapshot) => {
        globalDatabase = [];
        snapshot.forEach((doc) => {
            globalDatabase.push({ id: doc.id, ...doc.data() });
        });
        // नयाँ सिफारिस माथि देखिने गरी समय (Timestamp) अनुसार मिलाउने
        globalDatabase.sort((a, b) => b.timestamp - a.timestamp);
        renderDatabaseTable();
    });
}).catch(() => {});


// =========================================================================
// ५. HTML सँग काम गर्न फङ्सनहरूलाई 'window' मा जोड्नुपर्छ (किनकि यो मोड्युल हो)
// =========================================================================

window.toNepaliDigit = function (num) {
    const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return num.toString().split('').map(digit => nepaliDigits[digit] || digit).join('');
}

window.toggleModal = function (show) {
    const modal = document.getElementById('abhilekhModal');
    modal.style.display = show ? 'flex' : 'none';
    if (show) renderDatabaseTable();
}

window.adjustSignaturePosition = function (value) {
    document.getElementById('marginVal').innerText = window.toNepaliDigit(value) + " px";
    document.getElementById('docFooterSection').style.marginTop = value + "px";
}

window.addKittaRow = function (data = null) {
    rowCounter++;
    const rowId = 'kitta_row_' + rowCounter;
    activeRowIds.push(rowId);

    const container = document.getElementById('kittaRowsContainer');
    const rowHtml = `
        <div class="kitta-row-block" id="${rowId}">
            <div class="row-num-badge">क्रम संख्या: <span class="row-index-display"></span></div>
            <button type="button" class="btn-delete-row" id="del_btn_${rowId}" onclick="removeKittaRow('${rowId}')">हटाउनुस्</button>
            
            <div class="row-grid" style="grid-template-columns: 1fr 1fr 1fr;">
                <div class="form-group">
                    <label>सिट नं. (वैकल्पिक):</label>
                    <input type="text" class="input-sit" placeholder="उदा: २ ग" value="${data ? (data.sit || '') : ''}" oninput="updateDoc()">
                </div>
                <div class="form-group">
                    <label>कित्ता नं.:</label>
                    <input type="text" class="input-kitta" placeholder="उदा: १५२" value="${data ? data.kitta : ''}" oninput="updateDoc()">
                </div>
                <div class="form-group">
                    <label>क्षेत्रफल (व.मि):</label>
                    <input type="text" class="input-area" placeholder="उदा: ३५०" value="${data ? data.area : ''}" oninput="updateDoc()">
                </div>
            </div>

            <div class="form-group">
                <label>बाटोको दिशा (छान्नुस् वा आफैँ लेख्नुस्):</label>
                <input type="text" class="input-direction" list="dirList" placeholder="उदा: पूर्व" value="${data ? data.direction : ''}" oninput="updateDoc()">
            </div>

            <div class="row-grid">
                <div class="form-group">
                    <label>बाटोको चौडाइ (फिटमा):</label>
                    <input type="text" class="input-road-width" placeholder="उदा: २०" value="${data ? data.roadWidth : ''}" oninput="updateDoc()">
                </div>
                <div class="form-group">
                    <label>बाटोको प्रकार:</label>
                    <select class="input-road-type" onchange="updateDoc()">
                        <option value="पक्की" ${data && data.roadType === 'पक्की' ? 'selected' : ''}>पक्की</option>
                        <option value="कच्ची" ${data && data.roadType === 'कच्ची' ? 'selected' : ''}>कच्ची</option>
                        <option value="ग्राभेल" ${data && data.roadType === 'ग्राभेल' ? 'selected' : ''}>ग्राभेल</option>
                    </select>
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', rowHtml);
    reindexFormRows();
    window.updateDoc();
}

window.removeKittaRow = function (rowId) {
    if (activeRowIds.length <= 1) return;
    document.getElementById(rowId).remove();
    activeRowIds = activeRowIds.filter(id => id !== rowId);
    reindexFormRows();
    window.updateDoc();
}

function reindexFormRows() {
    activeRowIds.forEach((id, index) => {
        const block = document.getElementById(id);
        if (block) {
            block.querySelector('.row-index-display').innerText = window.toNepaliDigit(index + 1);
            const delBtn = document.getElementById(`del_btn_${id}`);
            if (delBtn) {
                delBtn.style.display = (activeRowIds.length === 1) ? 'none' : 'block';
            }
        }
    });
}

function generateLandDetailsText(lands) {
    if (!lands || lands.length === 0) {
        return `दर्ता कायम रहेको कित्ता नं. <span class="fill-space">.......</span> को क्षेत्रफल: <span class="fill-space">.......</span> व.मि जग्गाको <span class="fill-space">.......</span> तर्फ <span class="fill-space">....</span> फुटे <span class="fill-space">.......</span> बाटो भएको व्यहोरा प्रमाणित गरिन्छ ।`;
    }
    
    let parts = [];
    lands.forEach((land) => {
        const sit = land.sit ? land.sit.trim() : '';
        const kitta = land.kitta || '.......';
        const area = land.area || '.......';
        const direction = land.direction || '.......';
        const roadWidth = land.roadWidth || '....';
        const roadType = land.roadType || '.......';
        
        const sitText = sit ? `(सिट नं. <span class="fill-space">${sit}</span>) ` : '';
        parts.push(`${sitText}कित्ता नं. <span class="fill-space">${kitta}</span> को क्षेत्रफल: <span class="fill-space">${area}</span> व.मि जग्गाको <span class="fill-space">${direction}</span> तर्फ <span class="fill-space">${roadWidth}</span> फुटे <span class="fill-space">${roadType}</span> बाटो भएको`);
    });
    
    let text = "दर्ता कायम रहेको ";
    if (parts.length === 1) {
        text += parts[0];
    } else {
        const lastPart = parts.pop();
        text += parts.join(", ") + " तथा " + lastPart;
    }
    text += " व्यहोरा प्रमाणित गरिन्छ ।";
    return text;
}

window.toggleCustomSign = function () {
    const val = document.getElementById('inSignAuthority').value;
    document.getElementById('customSignBox').style.display = (val === 'CUSTOM') ? 'grid' : 'none';
}

window.toggleAddressFields = function() {
    const isChecked = document.getElementById('chkChangeAddress').checked;
    document.getElementById('custAddressBox').style.display = isChecked ? 'grid' : 'none';
}

window.updateDoc = function () {
    document.getElementById('lblPatraSankhya').innerText = document.getElementById('inPatraSankhya').value;
    document.getElementById('lblChalani').innerText = document.getElementById('inChalani').value || '';
    document.getElementById('lblMiti').innerText = document.getElementById('inMiti').value || '........';
    document.getElementById('lblNepalSamvat').innerText = document.getElementById('inNepalSamvat').value || '........';

    const selectedWada = document.getElementById('inWadaNo').value;
    const changeAddress = document.getElementById('chkChangeAddress').checked;

    document.getElementById('defaultLetterBody').style.display = changeAddress ? 'none' : 'block';
    document.getElementById('customLetterBody').style.display = changeAddress ? 'block' : 'none';

    const nameVal = document.getElementById('inName').value || '...........................';
    const citNo = document.getElementById('inCitNo').value.trim();
    const citDate = document.getElementById('inCitDate').value.trim();
    let citText = "";

    if (citNo !== "") citText += "ना.प्र.नं. " + citNo;
    if (citDate !== "") {
        if (citText !== "") citText += ", ";
        citText += "जारी मिति: " + citDate;
    }

    let lands = [];
    activeRowIds.forEach(id => {
        const block = document.getElementById(id);
        if (block) {
            lands.push({
                sit: block.querySelector('.input-sit') ? block.querySelector('.input-sit').value.trim() : '',
                kitta: block.querySelector('.input-kitta').value.trim(),
                area: block.querySelector('.input-area').value.trim(),
                direction: block.querySelector('.input-direction').value.trim(),
                roadWidth: block.querySelector('.input-road-width').value.trim(),
                roadType: block.querySelector('.input-road-type').value
            });
        }
    });

    const landDetailsText = generateLandDetailsText(lands);

    if (changeAddress) {
        document.getElementById('lblCustDistrict').innerText = document.getElementById('inCustDistrict').value || '..........';
        document.getElementById('lblCustPalika').innerText = document.getElementById('inCustPalika').value || '..........';
        document.getElementById('lblCustWada').innerText = document.getElementById('inCustWada').value || '.........';
        document.getElementById('lblOwnerNameCust').innerText = nameVal;
        
        const citBlockCust = document.getElementById('lblCitBlockCust');
        if (citText !== "") {
            citBlockCust.innerText = " (" + citText + ")";
            citBlockCust.style.display = 'inline';
        } else {
            citBlockCust.style.display = 'none';
        }
        
        document.getElementById('lblWadaBody2Cust').innerText = selectedWada;
        document.getElementById('lblLandDetailsCust').innerHTML = landDetailsText;
    } else {
        document.getElementById('lblWadaBody1').innerText = selectedWada;
        document.getElementById('lblWadaBody2').innerText = selectedWada;

        const sabikWada = document.getElementById('inSabikWada').value.trim();
        const lblSabikContainer = document.getElementById('lblSabikContainer');
        if (sabikWada === '') {
            if (lblSabikContainer) lblSabikContainer.style.display = 'none';
        } else {
            if (lblSabikContainer) lblSabikContainer.style.display = 'inline';
            document.getElementById('lblSabikAddress').innerText = 'गौरादह गा.वि.स. वडा नं. ' + sabikWada;
        }

        document.getElementById('lblOwnerName').innerText = nameVal;

        const citBlock = document.getElementById('lblCitBlock');
        if (citText !== "") {
            citBlock.innerText = " (" + citText + ")";
            citBlock.style.display = 'inline';
        } else {
            citBlock.style.display = 'none';
        }

        const lblLandDetails = document.getElementById('lblLandDetails');
        if (lblLandDetails) {
            lblLandDetails.innerHTML = landDetailsText;
        }
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
}

// ६. क्लाउडमा डाटा सेभ गर्ने फङ्सन
window.printAndSaveSystem = async function () {
    const name = document.getElementById('inName').value.trim();
    if (!name) { alert("कृपया निवेदकको नाम अनिवार्य लेख्नुहोस् ।"); return; }

    const btn = document.querySelector('.btn-print');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = "⏳ सुरक्षित हुँदैछ...";
    }

    const recordId = document.getElementById('editRecordIndex').value; 

    let lands = [];
    activeRowIds.forEach(id => {
        const block = document.getElementById(id);
        if (block) {
            lands.push({
                sit: block.querySelector('.input-sit') ? block.querySelector('.input-sit').value.trim() : '',
                kitta: block.querySelector('.input-kitta').value.trim(),
                area: block.querySelector('.input-area').value.trim(),
                direction: block.querySelector('.input-direction').value.trim(),
                roadWidth: block.querySelector('.input-road-width').value.trim(),
                roadType: block.querySelector('.input-road-type').value
            });
        }
    });

    const currentObj = {
        patra: document.getElementById('inPatraSankhya').value,
        chalani: document.getElementById('inChalani').value.trim() || '-',
        wada: document.getElementById('inWadaNo').value,
        name: name,
        citNo: document.getElementById('inCitNo').value,
        citDate: document.getElementById('inCitDate').value,
        miti: document.getElementById('inMiti').value,
        subject: "बाटो प्रमाणित सिफारिस",
        ns: document.getElementById('inNepalSamvat').value,
        sabikWada: document.getElementById('inSabikWada').value,
        changeAddress: document.getElementById('chkChangeAddress').checked,
        custDistrict: document.getElementById('inCustDistrict').value,
        custPalika: document.getElementById('inCustPalika').value,
        custWada: document.getElementById('inCustWada').value,
        sit: lands[0] ? lands[0].sit : '',
        kitta: lands[0] ? lands[0].kitta : '',
        area: lands[0] ? lands[0].area : '',
        direction: lands[0] ? lands[0].direction : '',
        roadWidth: lands[0] ? lands[0].roadWidth : '',
        roadType: lands[0] ? lands[0].roadType : 'पक्की',
        landDetails: lands,
        signAuth: document.getElementById('inSignAuthority').value,
        customSignName: document.getElementById('inCustomSignName').value,
        customSignTitle: document.getElementById('inCustomSignTitle').value,
        sigMargin: document.getElementById('inSigMargin').value,
        timestamp: Date.now() 
    };

    try {
        if (recordId !== "") {
            await db.collection("batoPramanitRecords").doc(recordId).update(currentObj);
        } else {
            const docRef = await db.collection("batoPramanitRecords").add(currentObj);
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

window.renderDatabaseTable = function () {
    const tbody = document.getElementById('dbTableBody');
    const search = document.getElementById('searchField').value.trim().toLowerCase();
    tbody.innerHTML = '';
    let counter = 0;

    globalDatabase.forEach((rec) => {
        if (search && !rec.name.toLowerCase().includes(search)) return;
        counter++;
        tbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td><b>${window.toNepaliDigit(counter)}</b></td>
                <td><b>${rec.name}</b></td>
                <td><span style="color:#2b6cb0; font-weight:bold;">${rec.subject}</span></td>
                <td>
                    ${window.toNepaliDigit(rec.miti)}
                    ${rec.timestamp ? `<div style="font-size:0.78rem; color:#718096; margin-top:2px;">⏱️ ${formatTimestamp(rec.timestamp)}</div>` : ''}
                </td>
                <td>
                    <div style="display:flex; gap:4px;">
                        <button class="btn-action btn-edit-db" onclick="editFromDB('${rec.id}')">📝</button>
                        <button class="btn-action btn-del-db" onclick="deleteFromDB('${rec.id}')">❌</button>
                    </div>
                </td>
            </tr>
        `);
    });
}

// ७. क्लाउडबाट डाटा एडिट गर्ने
window.editFromDB = function (id) {
    const rec = globalDatabase.find(r => r.id === id);
    if (!rec) return;

    document.getElementById('editRecordIndex').value = id;
    document.getElementById('formMainTitle').innerText = "🔄 सम्पादन मोड";

    document.getElementById('inPatraSankhya').value = rec.patra;
    document.getElementById('inChalani').value = rec.chalani === '-' ? '' : rec.chalani;
    document.getElementById('inMiti').value = rec.miti;
    document.getElementById('inNepalSamvat').value = rec.ns;
    document.getElementById('inWadaNo').value = rec.wada;
    document.getElementById('inSabikWada').value = (rec.sabikWada === '-' || !rec.sabikWada) ? '' : rec.sabikWada;
    document.getElementById('inName').value = rec.name;
    document.getElementById('inCitNo').value = rec.citNo || '';
    document.getElementById('inCitDate').value = rec.citDate || '';

    // Custom address toggle and fields
    const changeAddress = rec.changeAddress || false;
    document.getElementById('chkChangeAddress').checked = changeAddress;
    document.getElementById('inCustDistrict').value = rec.custDistrict || '';
    document.getElementById('inCustPalika').value = rec.custPalika || '';
    document.getElementById('inCustWada').value = rec.custWada || '';
    window.toggleAddressFields();

    // Load landDetails with legacy fallback
    let lands = rec.landDetails;
    if (!lands || !Array.isArray(lands)) {
        lands = [{
            sit: rec.sit || '',
            kitta: rec.kitta || '',
            area: rec.area || '',
            direction: rec.direction || '',
            roadWidth: rec.roadWidth || '',
            roadType: rec.roadType || 'पक्की'
        }];
    }

    document.getElementById('kittaRowsContainer').innerHTML = '';
    activeRowIds = [];
    lands.forEach(land => {
        window.addKittaRow(land);
    });

    document.getElementById('inSignAuthority').value = rec.signAuth;
    if (rec.signAuth === 'CUSTOM') {
        document.getElementById('customSignBox').style.display = 'grid';
        document.getElementById('inCustomSignName').value = rec.customSignName || '';
        document.getElementById('inCustomSignTitle').value = rec.customSignTitle || '';
    } else {
        document.getElementById('customSignBox').style.display = 'none';
    }

    if (rec.sigMargin) {
        document.getElementById('inSigMargin').value = rec.sigMargin;
        window.adjustSignaturePosition(rec.sigMargin);
    }

    window.updateDoc();
    window.toggleModal(false);
}

// ८. क्लाउडबाट डाटा डिलिट गर्ने
window.deleteFromDB = async function (id) {
    if (confirm("के तपाईं यो रेकर्ड क्लाउड डाटाबेसबाट स्थायी रूपमा हटाउन चाहनुहुन्छ?")) {
        try {
            await db.collection("batoPramanitRecords").doc(id).delete();
            // डिलिट हुने बित्तिकै onSnapshot ले आफैं टेबल अपडेट गरिदिन्छ !
        } catch (e) {

            alert("डिलिट गर्न समस्या भयो ।");
        }
    }
}

function getNepalSambatYear(adDate) {
    return 1146;
}

function formatFiscalYear(startYear) {
    const endYear = startYear + 1;
    const endYearSuffix = String(endYear).slice(-2);
    const englishFY = `${startYear}/0${endYearSuffix}`;
    return window.toNepaliDigit(englishFY);
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
            nepaliBSDateStr = window.toNepaliDigit(englishBSDateStr);
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
            nepaliBSDateStr = (typeof window.toNepaliDigit === 'function' ? window.toNepaliDigit : toNepaliDigit)(`${bsYearVal}/${bsMStr}/${bsDStr}`);
        }

        initializeFiscalYear(bsYearVal, bsMonthVal);

        const today = new Date();
        const nsYear = getNepalSambatYear(today);
        nepaliNSYearStr = window.toNepaliDigit(nsYear);

        const inMiti = document.getElementById('inMiti');
        if (inMiti) {
            inMiti.value = nepaliBSDateStr;
        }

        const inNepalSamvat = document.getElementById('inNepalSamvat');
        if (inNepalSamvat) {
            inNepalSamvat.value = nepaliNSYearStr;
        }

        if (typeof updateDoc === 'function') updateDoc();
        if (typeof window.fetchCurrentNepalSambat === 'function') {
            window.fetchCurrentNepalSambat();
        }
    } catch (error) {

    }
}

window.updateNepalSambatFromMiti = function () {
    const inNS = document.getElementById('inNepalSamvat');
    if (inNS) {
        inNS.value = '११४६';
        if (typeof window.updateDoc === 'function') window.updateDoc();
    }
}

window.fetchCurrentNepalSambat = async function () {
    const inNS = document.getElementById('inNepalSamvat');
    if (inNS) {
        inNS.value = '११४६';
        if (typeof window.updateDoc === 'function') window.updateDoc();
    }
}

window.onload = function () {
    initializeAutomaticDate();
    window.addKittaRow();
    window.adjustSignaturePosition(40);
};

window.addEventListener('templateInjected', function() {
    initializeAutomaticDate();
});
