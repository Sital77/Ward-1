// ══════════════════════════════════════════════════════
//  script-jaggadhani-patra.js
//  जग्गाधनीपूर्जा रजिष्ट्रेसन सिफारिस — Firebase Firestore Logic
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
let rowCounter = 0;
let activeRowIds = [];

// Auth ready listener
(window._firebaseAuthReady || Promise.resolve()).then(() => {
    db.collection("jaggadhaniPoojaRecords").onSnapshot((snapshot) => {
        globalDatabase = [];
        snapshot.forEach((doc) => {
            globalDatabase.push({ id: doc.id, ...doc.data() });
        });
        globalDatabase.sort((a, b) => b.timestamp - a.timestamp);
        renderDatabaseTable();
    });
}).catch(() => {});

// Helpers
window.toNepaliDigit = function (num) {
    if (num === null || num === undefined) return '';
    const nd = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return num.toString().split('').map(d => nd[d] || d).join('');
};

window.getSelectedAY = function () {
    const radios = document.querySelectorAll('input[name="ayRadio"]');
    for (const r of radios) { if (r.checked) return r.value; }
    return '२०८२/०८३';
};

window.toggleModal = function (show) {
    const modal = document.getElementById('abhilekhModal');
    if (modal) {
        modal.style.display = show ? 'flex' : 'none';
        if (show) renderDatabaseTable();
    }
};

window.adjustSignaturePosition = function (value) {
    const marginVal = document.getElementById('marginVal');
    const docFooter = document.getElementById('docFooterSection');
    if (marginVal) marginVal.innerText = window.toNepaliDigit(value) + " px";
    if (docFooter) docFooter.style.marginTop = value + "px";
};

window.toggleCustomSign = function () {
    const val = document.getElementById('inSignAuthority').value;
    const box = document.getElementById('customSignBox');
    if (box) box.style.display = (val === 'CUSTOM') ? 'grid' : 'none';
};

window.toggleAddressFields = function () {
    const chk = document.getElementById('chkChangeAddress');
    const box = document.getElementById('custAddressBox');
    if (box) box.style.display = (chk && chk.checked) ? 'grid' : 'none';
};

// Add/remove kitta rows
window.addKittaRow = function (data = null) {
    rowCounter++;
    const rowId = 'kitta_row_' + rowCounter;
    activeRowIds.push(rowId);

    const container = document.getElementById('kittaRowsContainer');
    const rowHtml = `
        <div class="house-row-block" id="${rowId}">
            <div style="display:flex; justify-between; align-items:center; margin-bottom:8px;">
                <span style="font-weight:bold; font-size:0.9rem;">क्रम संख्या: <span class="row-index-display"></span></span>
                <button type="button" class="btn-delete-row" id="del_${rowId}" onclick="removeKittaRow('${rowId}')" style="background:#e53e3e; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:0.8rem;">हटाउनुस्</button>
            </div>
            <div class="row-grid" style="grid-template-columns: 1fr 1fr 1fr;">
                <div class="form-group" style="margin-bottom:0;">
                    <label style="font-size:0.85rem;">सिट नं. (वैकल्पिक):</label>
                    <input type="text" class="inp-sheet" placeholder="उदा: १७९०२१७" value="${data ? (data.sheet || '') : ''}" oninput="updateDoc()">
                </div>
                <div class="form-group" style="margin-bottom:0;">
                    <label style="font-size:0.85rem;">कित्ता नं.:</label>
                    <input type="text" class="inp-kitta" placeholder="उदा: ३३२०" value="${data ? (data.kitta || '') : ''}" oninput="updateDoc()">
                </div>
                <div class="form-group" style="margin-bottom:0;">
                    <label style="font-size:0.85rem;">क्षेत्रफल (व.मि):</label>
                    <input type="text" class="inp-area" placeholder="उदा: २०८७.६०" value="${data ? (data.area || '') : ''}" oninput="updateDoc()">
                </div>
            </div>
        </div>
    `;
    if (container) container.insertAdjacentHTML('beforeend', rowHtml);
    reindexRows();
    window.updateDoc();
};

window.removeKittaRow = function (rowId) {
    if (activeRowIds.length <= 1) return;
    const el = document.getElementById(rowId);
    if (el) el.remove();
    activeRowIds = activeRowIds.filter(id => id !== rowId);
    reindexRows();
    window.updateDoc();
};

function reindexRows() {
    activeRowIds.forEach((id, index) => {
        const block = document.getElementById(id);
        if (block) {
            const idxSpan = block.querySelector('.row-index-display');
            if (idxSpan) idxSpan.innerText = window.toNepaliDigit(index + 1);
            const delBtn = document.getElementById(`del_${id}`);
            if (delBtn) delBtn.style.display = activeRowIds.length === 1 ? 'none' : 'inline-block';
        }
    });
}

function collectKittaRows() {
    const rows = [];
    activeRowIds.forEach(id => {
        const block = document.getElementById(id);
        if (block) {
            const sheet = block.querySelector('.inp-sheet') ? block.querySelector('.inp-sheet').value.trim() : '';
            const kitta = block.querySelector('.inp-kitta') ? block.querySelector('.inp-kitta').value.trim() : '';
            const area = block.querySelector('.inp-area') ? block.querySelector('.inp-area').value.trim() : '';
            rows.push({ sheet, kitta, area });
        }
    });
    return rows;
}

window.updateNepalSambatFromMiti = function () {
    const mitiVal = document.getElementById('inMiti').value.trim();
    const parts = mitiVal.split('/');
    if (parts.length >= 1 && parts[0].length === 4) {
        const bsYear = parseInt(parts[0], 10);
        if (!isNaN(bsYear)) {
            document.getElementById('inNepalSamvat').value = window.toNepaliDigit(bsYear - 937);
        }
    }
};

// Live document preview updater
window.updateDoc = function () {
    const ay = window.getSelectedAY();
    const chalani = document.getElementById('inChalani').value || '.......';
    const miti = document.getElementById('inMiti').value || '२०८३/.......';
    const ns = document.getElementById('inNepalSamvat').value || '११४६';

    const applicantName = document.getElementById('inApplicantName').value.trim() || '...................';
    
    // Address logic: default Ward 1 Gauradaha
    const chkAddress = document.getElementById('chkChangeAddress');
    let addressStr = "झापा जिल्ला गौरादह नगरपालिका वडा नं. १";
    if (chkAddress && chkAddress.checked) {
        const dist = document.getElementById('inCustDistrict').value.trim() || 'झापा';
        const palika = document.getElementById('inCustPalika').value.trim() || 'गौरादह नगरपालिका';
        const wada = document.getElementById('inCustWada').value.trim() || '१';
        addressStr = `${dist} जिल्ला ${palika} वडा नं. ${wada}`;
    }

    // Citizenship details (optional)
    const citNo = document.getElementById('inCitNo').value.trim();
    const citDate = document.getElementById('inCitDate').value.trim();
    const citDist = document.getElementById('inCitDistrict').value.trim();

    let citSentence = '';
    let citTapasil = '';
    if (citNo) {
        citSentence = `(ना.प्र.नं. <span class="fill-space">${citNo}</span>`;
        if (citDate) citSentence += `, जारी मिति: <span class="fill-space">${citDate}</span>`;
        if (citDist) citSentence += `, जारी जिल्ला: <span class="fill-space">${citDist}</span>`;
        citSentence += `)`;

        citTapasil = `ना.प्र.नं. ${citNo}`;
        if (citDate) citTapasil += `, जारी मिति: ${citDate}`;
        if (citDist) citTapasil += `, जारी जिल्ला: ${citDist}`;
    }

    // Waris details
    const warisDate = document.getElementById('inWarisDate').value.trim() || '.........';
    const regNo = document.getElementById('inRegNo').value.trim() || '........';

    // Kittas
    const lands = collectKittaRows();
    let kittaSentenceParts = [];
    lands.forEach(land => {
        const sheetStr = land.sheet ? `(सिट नं. <span class="fill-space">${land.sheet}</span>) ` : '';
        const kittaStr = land.kitta || '......';
        const areaStr = land.area || '......';
        kittaSentenceParts.push(`${sheetStr}कित्ता नं. <span class="fill-space">${kittaStr}</span>, क्षेत्रफल: <span class="fill-space">${areaStr}</span> व.मि.`);
    });
    
    let kittaSentence = kittaSentenceParts.join(', ');
    if (!kittaSentence) {
        kittaSentence = `(सिट नं. <span class="fill-space">......</span>) कित्ता नं. <span class="fill-space">......</span>, क्षेत्रफल: <span class="fill-space">......</span> व.मि.`;
    }

    // Three generation optional
    const fatherName = document.getElementById('inFatherName').value.trim();
    const husbandName = document.getElementById('inHusbandName').value.trim();
    const grandFatherName = document.getElementById('inGrandfatherName').value.trim();

    // DOM Update
    document.getElementById('lblAY').innerText = ay;
    document.getElementById('lblChalani').innerText = chalani;
    document.getElementById('lblMiti').innerText = miti;
    document.getElementById('lblNepalSamvat').innerText = ns;

    document.getElementById('lblApplicantName').innerText = applicantName;
    document.getElementById('lblCitDetails').innerHTML = citSentence;
    document.getElementById('lblWarisDate').innerText = warisDate;
    document.getElementById('lblRegNo').innerText = regNo;
    document.getElementById('lblKittaSentence').innerHTML = kittaSentence;

    // Tapasil
    document.getElementById('lblTapasilName').innerText = applicantName;
    document.getElementById('lblTapasilAddress').innerText = addressStr;

    const rowCit = document.getElementById('rowTapasilCit');
    const lblCit = document.getElementById('lblTapasilCit');
    if (citTapasil) {
        rowCit.style.display = 'table-row';
        lblCit.innerText = citTapasil;
    } else {
        rowCit.style.display = 'none';
    }

    const rowFat = document.getElementById('rowFather');
    if (fatherName) { rowFat.style.display = 'table-row'; document.getElementById('lblFather').innerText = fatherName; }
    else { rowFat.style.display = 'none'; }

    const rowHus = document.getElementById('rowHusband');
    if (husbandName) { rowHus.style.display = 'table-row'; document.getElementById('lblHusband').innerText = husbandName; }
    else { rowHus.style.display = 'none'; }

    const rowGfat = document.getElementById('rowGrandfather');
    if (grandFatherName) { rowGfat.style.display = 'table-row'; document.getElementById('lblGrandfather').innerText = grandFatherName; }
    else { rowGfat.style.display = 'none'; }

    // Signature
    const sigAuth = document.getElementById('inSignAuthority').value;
    const lblSignName = document.getElementById('lblSignName');
    const lblSignPost = document.getElementById('lblSignPost');

    if (sigAuth === 'CUSTOM') {
        lblSignName.innerText = document.getElementById('inCustomSignName').value.trim() || '...................';
        lblSignPost.innerText = document.getElementById('inCustomSignPost').value.trim() || 'अधिकारी';
    } else {
        lblSignName.innerText = '...................';
        lblSignPost.innerText = sigAuth;
    }
};

// Database CRUD
window.saveRecordToDatabase = function () {
    const applicantName = document.getElementById('inApplicantName').value.trim();
    if (!applicantName) {
        alert('⚠️ कृपया निवेदक / जग्गाधनीको नाम लेख्नुहोस्।');
        return;
    }

    const chkAddress = document.getElementById('chkChangeAddress');
    const isCustomAddress = chkAddress ? chkAddress.checked : false;

    const recordData = {
        ay: window.getSelectedAY(),
        chalani: document.getElementById('inChalani').value.trim(),
        miti: document.getElementById('inMiti').value.trim(),
        nepalSamvat: document.getElementById('inNepalSamvat').value.trim(),
        applicantName: applicantName,
        isCustomAddress: isCustomAddress,
        custDistrict: document.getElementById('inCustDistrict').value.trim(),
        custPalika: document.getElementById('inCustPalika').value.trim(),
        custWada: document.getElementById('inCustWada').value.trim(),
        citNo: document.getElementById('inCitNo').value.trim(),
        citDate: document.getElementById('inCitDate').value.trim(),
        citDistrict: document.getElementById('inCitDistrict').value.trim(),
        warisDate: document.getElementById('inWarisDate').value.trim(),
        regNo: document.getElementById('inRegNo').value.trim(),
        lands: collectKittaRows(),
        fatherName: document.getElementById('inFatherName').value.trim(),
        husbandName: document.getElementById('inHusbandName').value.trim(),
        grandfatherName: document.getElementById('inGrandfatherName').value.trim(),
        signAuthority: document.getElementById('inSignAuthority').value,
        customSignName: document.getElementById('inCustomSignName').value.trim(),
        customSignPost: document.getElementById('inCustomSignPost').value.trim(),
        timestamp: Date.now()
    };

    const editIndex = document.getElementById('editRecordIndex').value;
    if (editIndex !== '') {
        db.collection("jaggadhaniPoojaRecords").doc(editIndex).update(recordData).then(() => {
            alert('✅ अभिलेख सफलतापूर्वक अद्यावधिक गरियो।');
            document.getElementById('editRecordIndex').value = '';
        }).catch((err) => {
            alert('❌ त्रुटि: ' + err.message);
        });
    } else {
        db.collection("jaggadhaniPoojaRecords").add(recordData).then(() => {
            alert('✅ अभिलेख सफलतापूर्वक सेभ गरियो।');
        }).catch((err) => {
            alert('❌ त्रुटि: ' + err.message);
        });
    }
};

function renderDatabaseTable() {
    const tbody = document.getElementById('abhilekhTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    globalDatabase.forEach((rec, idx) => {
        const kittaList = (rec.lands || []).map(l => l.kitta).filter(Boolean).join(', ');
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #e2e8f0';
        tr.innerHTML = `
            <td style="padding: 8px; text-align: center;">${window.toNepaliDigit(idx + 1)}</td>
            <td style="padding: 8px;">${rec.chalani || '-'}</td>
            <td style="padding: 8px;">${rec.miti || '-'}</td>
            <td style="padding: 8px; font-weight: bold;">${rec.applicantName || '-'}</td>
            <td style="padding: 8px;">${kittaList || '-'}</td>
            <td style="padding: 8px; text-align: center;">
                <button onclick="editRecord('${rec.id}')" style="background: #3182ce; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; margin-right: 4px;">सम्पादन</button>
                <button onclick="deleteRecord('${rec.id}')" style="background: #e53e3e; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">हटाउनुस्</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.filterAbhilekhTable = function () {
    const query = document.getElementById('searchAbhilekhInput').value.toLowerCase();
    const rows = document.querySelectorAll('#abhilekhTableBody tr');
    rows.forEach(tr => {
        const text = tr.innerText.toLowerCase();
        tr.style.display = text.includes(query) ? '' : 'none';
    });
};

window.editRecord = function (id) {
    const rec = globalDatabase.find(r => r.id === id);
    if (!rec) return;

    document.getElementById('editRecordIndex').value = id;
    document.getElementById('inChalani').value = rec.chalani || '';
    document.getElementById('inMiti').value = rec.miti || '';
    document.getElementById('inNepalSamvat').value = rec.nepalSamvat || '';
    document.getElementById('inApplicantName').value = rec.applicantName || '';

    const chkAddress = document.getElementById('chkChangeAddress');
    if (chkAddress) {
        chkAddress.checked = !!rec.isCustomAddress;
        window.toggleAddressFields();
    }
    document.getElementById('inCustDistrict').value = rec.custDistrict || '';
    document.getElementById('inCustPalika').value = rec.custPalika || '';
    document.getElementById('inCustWada').value = rec.custWada || '';

    document.getElementById('inCitNo').value = rec.citNo || '';
    document.getElementById('inCitDate').value = rec.citDate || '';
    document.getElementById('inCitDistrict').value = rec.citDistrict || '';

    document.getElementById('inWarisDate').value = rec.warisDate || '';
    document.getElementById('inRegNo').value = rec.regNo || '';

    document.getElementById('inFatherName').value = rec.fatherName || '';
    document.getElementById('inHusbandName').value = rec.husbandName || '';
    document.getElementById('inGrandfatherName').value = rec.grandfatherName || '';

    // Clear kitta rows and load
    document.getElementById('kittaRowsContainer').innerHTML = '';
    activeRowIds = [];
    rowCounter = 0;

    if (rec.lands && rec.lands.length > 0) {
        rec.lands.forEach(l => window.addKittaRow(l));
    } else {
        window.addKittaRow();
    }

    if (rec.signAuthority) {
        document.getElementById('inSignAuthority').value = rec.signAuthority;
        window.toggleCustomSign();
    }
    document.getElementById('inCustomSignName').value = rec.customSignName || '';
    document.getElementById('inCustomSignPost').value = rec.customSignPost || '';

    window.toggleModal(false);
    window.updateDoc();
};

window.deleteRecord = function (id) {
    if (confirm('के तपाईं यो अभिलेख मेटाउन निश्चित हुनुहुन्छ?')) {
        db.collection("jaggadhaniPoojaRecords").doc(id).delete().then(() => {
            alert('✅ अभिलेख मेटाइयो।');
        }).catch((err) => {
            alert('❌ त्रुटि: ' + err.message);
        });
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.addKittaRow();
});
