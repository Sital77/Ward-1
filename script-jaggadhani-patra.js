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

// Auth ready भएपछि snapshot listener start गर्ने
(window._firebaseAuthReady || Promise.resolve()).then(() => {
    db.collection("jaggadhaniPoojaRecords").onSnapshot((snapshot) => {
        globalDatabase = [];
        snapshot.forEach((doc) => {
            globalDatabase.push({ id: doc.id, ...doc.data() });
        });
        globalDatabase.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        renderDatabaseTable();
    });
}).catch(() => {});

// Helpers
window.toNepaliDigit = function (num) {
    if (num === null || num === undefined) return '';
    const nd = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return num.toString().split('').map(d => nd[d] || d).join('');
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
        <div class="house-row-block" id="${rowId}" style="background:#ffffff; border:1px solid #cbd5e0; padding:12px; border-radius:8px; margin-bottom:10px; position:relative;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="font-weight:bold; font-size:0.88rem; color:#2d3748;">क्रम संख्या: <span class="row-index-display"></span></span>
                <button type="button" class="btn-delete-row" id="del_${rowId}" onclick="removeKittaRow('${rowId}')" style="background:#e53e3e; color:white; border:none; padding:3px 8px; border-radius:4px; cursor:pointer; font-size:0.8rem;">हटाउनुस्</button>
            </div>
            <div class="row-grid" style="grid-template-columns: 1fr 1fr 1fr; gap:10px;">
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

function generateKittaSentence(lands) {
    if (!lands || lands.length === 0) {
        return `(सिट नं. <span class="fill-space" style="min-width:50px;">.......</span>) कित्ता नं. <span class="fill-space" style="min-width:40px;">.......</span>, क्षेत्रफल: <span class="fill-space" style="min-width:60px;">.......</span> व.मिको`;
    }

    let parts = [];
    lands.forEach(l => {
        const sheet = l.sheet ? l.sheet.trim() : '';
        const kitta = l.kitta ? l.kitta.trim() : '.......';
        const area = l.area ? l.area.trim() : '.......';
        const sheetText = sheet ? `(सिट नं. <span class="fill-space">${sheet}</span>) ` : '';
        parts.push(`${sheetText}कित्ता नं. <span class="fill-space">${kitta}</span>, क्षेत्रफल: <span class="fill-space">${area}</span> व.मिको`);
    });

    if (parts.length === 1) {
        return parts[0];
    } else {
        const last = parts.pop();
        return parts.join(', ') + ' तथा ' + last;
    }
}

// Live preview updater
window.updateDoc = function () {
    const patra = document.getElementById('inPatraSankhya').value || '२०८२/०८३';
    const chalani = document.getElementById('inChalani').value.trim() || '';
    const miti = document.getElementById('inMiti').value.trim() || '२०८३/';
    const ns = document.getElementById('inNepalSamvat').value.trim() || '११४६';

    document.getElementById('lblPatraSankhya').innerText = patra;
    document.getElementById('lblChalani').innerText = chalani;
    document.getElementById('lblMiti').innerText = miti;
    document.getElementById('lblNepalSamvat').innerText = ns;

    const applicantName = document.getElementById('inApplicantName').value.trim() || '.......';
    const selectedWada = document.getElementById('inWadaNo').value || '१';
    const isChangeAddress = document.getElementById('chkChangeAddress').checked;

    // Citizenship string
    const citNo = document.getElementById('inCitNo').value.trim();
    const citDate = document.getElementById('inCitDate').value.trim();
    let citText = "";
    if (citNo !== "") citText += "ना.प्र.नं. " + citNo;
    if (citDate !== "") {
        if (citText !== "") citText += ", ";
        citText += "जारी मिति: " + citDate;
    }

    // Waris details
    const warisDate = document.getElementById('inWarisDate').value.trim() || '.........';
    const regNo = document.getElementById('inRegNo').value.trim() || '........';

    // Land details
    const lands = collectKittaRows();
    const kittaSentence = generateKittaSentence(lands);

    // Toggle letter bodies based on Change Address checkbox
    const defaultBody = document.getElementById('defaultLetterBody');
    const customBody = document.getElementById('customLetterBody');

    if (isChangeAddress) {
        defaultBody.style.display = 'none';
        customBody.style.display = 'block';

        const custDist = document.getElementById('inCustDistrict').value.trim() || '.......';
        const custPalika = document.getElementById('inCustPalika').value.trim() || '.......';
        const custWada = document.getElementById('inCustWada').value.trim() || '.......';

        document.getElementById('lblCustDistrict').innerText = custDist;
        document.getElementById('lblCustPalika').innerText = custPalika;
        document.getElementById('lblCustWada').innerText = custWada;
        document.getElementById('lblApplicantNameCust').innerText = applicantName;

        const citBlockCust = document.getElementById('lblCitBlockCust');
        if (citText !== "") {
            citBlockCust.innerText = " (" + citText + ")";
            citBlockCust.style.display = 'inline';
        } else {
            citBlockCust.style.display = 'none';
        }

        document.getElementById('lblWarisDateCust').innerText = warisDate;
        document.getElementById('lblRegNoCust').innerText = regNo;
        document.getElementById('lblKittaSentenceCust').innerHTML = kittaSentence;

        // Tapasil Address
        document.getElementById('lblTapasilAddress').innerText = `${custDist} जिल्ला ${custPalika} वडा नं. ${custWada}`;
    } else {
        defaultBody.style.display = 'block';
        customBody.style.display = 'none';

        document.getElementById('lblWadaBody').innerText = selectedWada;
        document.getElementById('lblApplicantName').innerText = applicantName;

        const citBlock = document.getElementById('lblCitBlock');
        if (citText !== "") {
            citBlock.innerText = " (" + citText + ")";
            citBlock.style.display = 'inline';
        } else {
            citBlock.style.display = 'none';
        }

        document.getElementById('lblWarisDate').innerText = warisDate;
        document.getElementById('lblRegNo').innerText = regNo;
        document.getElementById('lblKittaSentence').innerHTML = kittaSentence;

        // Tapasil Address
        document.getElementById('lblTapasilAddress').innerText = `झापा जिल्ला गौरादह नगरपालिका वडा नं. ${selectedWada}`;
    }

    // Tapasil Fields
    document.getElementById('lblTapasilName').innerText = applicantName;

    const rowCit = document.getElementById('rowTapasilCit');
    const lblCit = document.getElementById('lblTapasilCit');
    if (citText !== "") {
        rowCit.style.display = 'block';
        lblCit.innerText = citText;
    } else {
        rowCit.style.display = 'none';
    }

    const fatherName = document.getElementById('inFatherName').value.trim();
    const rowFather = document.getElementById('rowFather');
    if (fatherName !== "") {
        rowFather.style.display = 'block';
        document.getElementById('lblFather').innerText = fatherName;
    } else {
        rowFather.style.display = 'none';
    }

    const husbandName = document.getElementById('inHusbandName').value.trim();
    const rowHusband = document.getElementById('rowHusband');
    if (husbandName !== "") {
        rowHusband.style.display = 'block';
        document.getElementById('lblHusband').innerText = husbandName;
    } else {
        rowHusband.style.display = 'none';
    }

    const grandfatherName = document.getElementById('inGrandfatherName').value.trim();
    const rowGrandfather = document.getElementById('rowGrandfather');
    if (grandfatherName !== "") {
        rowGrandfather.style.display = 'block';
        document.getElementById('lblGrandfather').innerText = grandfatherName;
    } else {
        rowGrandfather.style.display = 'none';
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
            sigName = document.getElementById('inCustomSignName').value.trim() || '....................';
            sigTitle = document.getElementById('inCustomSignTitle').value.trim() || '....................';
        } else {
            const signData = signSelect.split('|');
            sigName = signData[0];
            sigTitle = signData[1];
        }
    }
    lblSigName.innerText = sigName;
    document.getElementById('lblSigTitle').innerText = sigTitle;
};

// Print and Save to Database
window.printAndSaveSystem = async function () {
    const applicantName = document.getElementById('inApplicantName').value.trim();
    if (!applicantName) {
        alert("कृपया निवेदकको नाम अनिवार्य लेख्नुहोस् ।");
        return;
    }

    const btn = document.querySelector('.btn-print');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = "⏳ सुरक्षित हुँदैछ...";
    }

    const recordId = document.getElementById('editRecordIndex').value;
    const lands = collectKittaRows();
    const isChangeAddress = document.getElementById('chkChangeAddress').checked;

    const recordData = {
        patra: document.getElementById('inPatraSankhya').value,
        chalani: document.getElementById('inChalani').value.trim() || '-',
        miti: document.getElementById('inMiti').value.trim(),
        ns: document.getElementById('inNepalSamvat').value.trim(),
        name: applicantName,
        wada: document.getElementById('inWadaNo').value,
        sabikWada: document.getElementById('inSabikWada').value.trim(),
        citNo: document.getElementById('inCitNo').value.trim(),
        citDate: document.getElementById('inCitDate').value.trim(),
        changeAddress: isChangeAddress,
        custDistrict: document.getElementById('inCustDistrict').value.trim(),
        custPalika: document.getElementById('inCustPalika').value.trim(),
        custWada: document.getElementById('inCustWada').value.trim(),
        warisDate: document.getElementById('inWarisDate').value.trim(),
        regNo: document.getElementById('inRegNo').value.trim(),
        lands: lands,
        fatherName: document.getElementById('inFatherName').value.trim(),
        husbandName: document.getElementById('inHusbandName').value.trim(),
        grandfatherName: document.getElementById('inGrandfatherName').value.trim(),
        signAuthority: document.getElementById('inSignAuthority').value,
        customSignName: document.getElementById('inCustomSignName').value.trim(),
        customSignTitle: document.getElementById('inCustomSignTitle').value.trim(),
        sigMargin: document.getElementById('inSigMargin').value,
        subject: "जग्गाधनीपूर्जा रजिष्ट्रेसन सिफारिस",
        timestamp: Date.now()
    };

    try {
        if (recordId !== "") {
            await db.collection("jaggadhaniPoojaRecords").doc(recordId).update(recordData);
        } else {
            const docRef = await db.collection("jaggadhaniPoojaRecords").add(recordData);
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
};

function renderDatabaseTable() {
    const tbody = document.getElementById('dbTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const search = (document.getElementById('searchField') ? document.getElementById('searchField').value.trim().toLowerCase() : '');

    const filtered = globalDatabase.filter(r => {
        if (!search) return true;
        const name = (r.name || '').toLowerCase();
        const chalani = (r.chalani || '').toLowerCase();
        return name.includes(search) || chalani.includes(search);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:15px; color:#718096;">कुनै अभिलेख फेला परेन ।</td></tr>`;
        return;
    }

    filtered.forEach((rec, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="text-align:center;">${window.toNepaliDigit(idx + 1)}</td>
            <td style="font-weight:bold;">${rec.name || '-'}</td>
            <td>${rec.subject || 'जग्गाधनीपूर्जा रजिष्ट्रेसन'}</td>
            <td>${rec.miti || '-'}</td>
            <td style="text-align:center;">
                <button class="btn-action-edit" onclick="editRecord('${rec.id}')" style="background:#3182ce; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:0.8rem; margin-right:4px;">सम्पादन</button>
                <button class="btn-action-del" onclick="deleteRecord('${rec.id}')" style="background:#e53e3e; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:0.8rem;">हटाउनुस्</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.editRecord = function (id) {
    const rec = globalDatabase.find(r => r.id === id);
    if (!rec) return;

    document.getElementById('editRecordIndex').value = id;
    document.getElementById('formMainTitle').innerText = "🔄 सम्पादन मोड";

    document.getElementById('inPatraSankhya').value = rec.patra || '२०८२/०८३';
    document.getElementById('inChalani').value = (rec.chalani === '-' ? '' : rec.chalani) || '';
    document.getElementById('inMiti').value = rec.miti || '२०८३/';
    document.getElementById('inNepalSamvat').value = rec.ns || '११४६';

    document.getElementById('inApplicantName').value = rec.name || '';
    document.getElementById('inWadaNo').value = rec.wada || '१';
    document.getElementById('inSabikWada').value = rec.sabikWada || '';
    document.getElementById('inCitNo').value = rec.citNo || '';
    document.getElementById('inCitDate').value = rec.citDate || '';

    const chk = document.getElementById('chkChangeAddress');
    chk.checked = !!rec.changeAddress;
    window.toggleAddressFields();

    document.getElementById('inCustDistrict').value = rec.custDistrict || '';
    document.getElementById('inCustPalika').value = rec.custPalika || '';
    document.getElementById('inCustWada').value = rec.custWada || '';

    document.getElementById('inWarisDate').value = rec.warisDate || '';
    document.getElementById('inRegNo').value = rec.regNo || '';

    document.getElementById('inFatherName').value = rec.fatherName || '';
    document.getElementById('inHusbandName').value = rec.husbandName || '';
    document.getElementById('inGrandfatherName').value = rec.grandfatherName || '';

    // Lands
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
    document.getElementById('inCustomSignTitle').value = rec.customSignTitle || '';
    if (rec.sigMargin) {
        document.getElementById('inSigMargin').value = rec.sigMargin;
        window.adjustSignaturePosition(rec.sigMargin);
    }

    window.toggleModal(false);
    window.updateDoc();
};

window.deleteRecord = function (id) {
    if (confirm("के तपाईं यो अभिलेख मेटाउन निश्चित हुनुहुन्छ?")) {
        db.collection("jaggadhaniPoojaRecords").doc(id).delete().then(() => {
            alert("अभिलेख मेटाइयो ।");
        }).catch((err) => {
            alert("त्रुटि: " + err.message);
        });
    }
};

// Initial Setup on load
document.addEventListener('DOMContentLoaded', () => {
    window.addKittaRow();
    window.updateDoc();
});
