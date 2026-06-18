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
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let globalDatabase = [];
let rowCounter = 0;
let activeRowIds = [];

// ३. रियल-टाइम डाटाबेस सिङ्क
db.collection("pariwarikRecords").onSnapshot((snapshot) => {
    globalDatabase = [];
    snapshot.forEach((doc) => {
        globalDatabase.push({ id: doc.id, ...doc.data() });
    });
    globalDatabase.sort((a, b) => b.timestamp - a.timestamp);
    renderDatabaseTable();
});

// =========================================================================
// फङ्सनहरूलाई 'window' मा जोड्नुपर्छ (किनकि यो मोड्युल हो)
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

window.toggleCustomSign = function () {
    const val = document.getElementById('inSignAuthority').value;
    document.getElementById('customSignBox').style.display = (val === 'CUSTOM') ? 'grid' : 'none';
}

window.syncOwnerName = function () {
    const applicantName = document.getElementById('inName').value;
    const ownerInput = document.getElementById('inOwnerName');
    if (!ownerInput.dataset.userEdited) {
        ownerInput.value = applicantName;
    }
}

window.addFamilyRow = function (data = null) {
    rowCounter++;
    const rowId = 'family_row_' + rowCounter;
    activeRowIds.push(rowId);

    const container = document.getElementById('familyRowsContainer');
    const rowHtml = `
        <div class="member-row-block" id="${rowId}">
            <div class="row-num-badge">क्रम संख्या: <span class="row-index-display"></span></div>
            <button type="button" class="btn-delete-row" id="del_btn_${rowId}" onclick="removeFamilyRow('${rowId}')">हटाउनुस्</button>
            
            <div class="form-group" style="margin-bottom: 8px;">
                <label style="font-size:0.75rem; color:#4a5568; font-weight:700;">नाम थर:</label>
                <input type="text" class="input-member-name" placeholder="उदा: रोजना श्रेष्ठ" value="${data ? data.name : ''}" oninput="updateDoc()">
            </div>
            
            <div class="row-grid" style="margin-bottom: 0;">
                <div class="form-group" style="margin-bottom: 0;">
                    <label style="font-size:0.75rem; color:#4a5568; font-weight:700;">ना.प्र.नं./ज.द.नं.:</label>
                    <input type="text" class="input-member-document" placeholder="उदा: ३४१५/२४०" value="${data ? data.document : ''}" oninput="updateDoc()">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label style="font-size:0.75rem; color:#4a5568; font-weight:700;">नाता:</label>
                    <input type="text" class="input-member-relationship" list="relList" placeholder="उदा: श्रीमती" value="${data ? data.relationship : ''}" oninput="updateDoc()">
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', rowHtml);
    reindexFormRows();
    updateDoc();
}

window.removeFamilyRow = function (rowId) {
    if (activeRowIds.length <= 1) return;
    const el = document.getElementById(rowId);
    if (el) el.remove();
    activeRowIds = activeRowIds.filter(id => id !== rowId);
    reindexFormRows();
    updateDoc();
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

window.updateDoc = function () {
    document.getElementById('lblPatraSankhya').innerText = document.getElementById('inPatraSankhya').value;
    document.getElementById('lblChalani').innerText = document.getElementById('inChalani').value || '........';
    document.getElementById('lblMiti').innerText = document.getElementById('inMiti').value || '........';
    document.getElementById('lblNepalSamvat').innerText = document.getElementById('inNepalSamvat').value || '........';

    const selectedWada = document.getElementById('inWadaNo').value;
    document.getElementById('lblWadaHeader').innerText = selectedWada;
    document.getElementById('lblWadaBody1').innerText = selectedWada;
    document.getElementById('lblWadaBody2').innerText = selectedWada;

    const nameVal = document.getElementById('inName').value || '...........................';
    document.getElementById('lblApplicantName').innerText = nameVal;

    const citNo = document.getElementById('inCitNo').value.trim();
    const citDate = document.getElementById('inCitDate').value.trim();
    const citBlock = document.getElementById('lblCitBlock');
    
    let citText = "";
    if (citNo !== "") {
        citText += "ना.प्र.नं. " + citNo;
    }
    if (citDate !== "") {
        if (citText !== "") citText += ", ";
        citText += "जारी मिति: " + citDate;
    }

    if (citText !== "") {
        citBlock.innerText = " (" + citText + ")";
        citBlock.style.display = 'inline';
    } else {
        citBlock.style.display = 'none';
    }

    const ownerVal = document.getElementById('inOwnerName').value || nameVal;
    document.getElementById('lblOwnerName').innerText = ownerVal;

    const signSelect = document.getElementById('inSignAuthority').value;
    let sigName = "", sigTitle = "";
    if (signSelect === 'CUSTOM') {
        sigName = document.getElementById('inCustomSignName').value || '....................';
        sigTitle = document.getElementById('inCustomSignTitle').value || '....................';
    } else {
        const signData = signSelect.split('|');
        sigName = signData[0];
        sigTitle = signData[1];
    }
    document.getElementById('lblSigName').innerText = sigName;
    document.getElementById('lblSigTitle').innerText = sigTitle;

    const tbody = document.getElementById('outputTableBody');
    tbody.innerHTML = ''; 

    activeRowIds.forEach((id, index) => {
        const block = document.getElementById(id);
        if (block) {
            const mName = block.querySelector('.input-member-name').value || '';
            const mDoc = block.querySelector('.input-member-document').value || '-';
            const mRel = block.querySelector('.input-member-relationship').value || '-';
            
            tbody.insertAdjacentHTML('beforeend', `
                <tr>
                    <td>${window.toNepaliDigit(index + 1)}</td>
                    <td style="text-align: left; padding-left: 15px; font-weight: bold;">${mName || '................'}</td>
                    <td>${mDoc}</td>
                    <td>${mRel}</td>
                </tr>
            `);
        }
    });
}

// ६. क्लाउडमा डाटा सेभ गर्ने फङ्सन
window.printAndSaveSystem = async function () {
    const name = document.getElementById('inName').value.trim();
    if (!name) { alert("कृपया निवेदकको नाम अनिवार्य लेख्नुहोस् ।"); return; }

    const recordId = document.getElementById('editRecordIndex').value;

    let familyRecords = [];
    activeRowIds.forEach(id => {
        const block = document.getElementById(id);
        if (block) {
            familyRecords.push({
                name: block.querySelector('.input-member-name').value.trim(),
                document: block.querySelector('.input-member-document').value.trim(),
                relationship: block.querySelector('.input-member-relationship').value.trim()
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
        subject: "पारिवारिक विवरण प्रमाणित",
        ns: document.getElementById('inNepalSamvat').value,
        sabikWada: document.getElementById('inSabikWada').value,
        ownerName: document.getElementById('inOwnerName').value,
        signAuth: document.getElementById('inSignAuthority').value,
        customSignName: document.getElementById('inCustomSignName').value,
        customSignTitle: document.getElementById('inCustomSignTitle').value,
        sigMargin: document.getElementById('inSigMargin').value,
        members: familyRecords,
        timestamp: Date.now()
    };

    try {
        if (recordId !== "") {
            await db.collection("pariwarikRecords").doc(recordId).update(currentObj);
            document.getElementById('editRecordIndex').value = "";
            document.getElementById('formMainTitle').innerText = "📝 पारिवारिक विवरण प्रविष्टि";
        } else {
            await db.collection("pariwarikRecords").add(currentObj);
        }
        window.print();
    } catch (e) {
        console.error(e);
        alert("क्लाउडमा डाटा सुरक्षित गर्दा समस्या भयो! इन्टरनेट कनेक्सन जाँच्नुहोस् ।");
    }
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
                <td>${window.toNepaliDigit(rec.miti)}</td>
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
    document.getElementById('inSabikWada').value = rec.sabikWada;
    document.getElementById('inName').value = rec.name;
    document.getElementById('inCitNo').value = rec.citNo || '';
    document.getElementById('inCitDate').value = rec.citDate || '';
    
    const ownerInput = document.getElementById('inOwnerName');
    ownerInput.value = rec.ownerName || rec.name;
    ownerInput.dataset.userEdited = "true";

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

    // Dynamic rows rebuild
    document.getElementById('familyRowsContainer').innerHTML = '';
    activeRowIds = [];
    if (rec.members && rec.members.length > 0) {
        rec.members.forEach(m => window.addFamilyRow(m));
    } else {
        window.addFamilyRow();
    }

    window.updateDoc();
    window.toggleModal(false);
}

window.deleteFromDB = async function (id) {
    if (confirm("के तपाईं यो रेकर्ड क्लाउड डाटाबेसबाट स्थायी रूपमा हटाउन चाहनुहुन्छ?")) {
        try {
            await db.collection("pariwarikRecords").doc(id).delete();
        } catch (e) {
            console.error(e);
            alert("डिलिट गर्न समस्या भयो ।");
        }
    }
}

function getNepalSambatYear(adDate) {
    const year = adDate.getFullYear();
    const newYearDates = {
        2020: new Date(2020, 10, 15),
        2021: new Date(2021, 10, 5),
        2022: new Date(2022, 9, 26),
        2023: new Date(2023, 10, 14),
        2024: new Date(2024, 10, 2),
        2025: new Date(2025, 9, 22),
        2026: new Date(2026, 10, 10),
        2027: new Date(2027, 9, 31),
        2028: new Date(2028, 9, 19),
        2029: new Date(2029, 10, 7),
        2030: new Date(2030, 9, 27),
        2031: new Date(2031, 10, 15),
        2032: new Date(2032, 10, 3),
        2033: new Date(2033, 9, 23),
        2034: new Date(2034, 10, 12),
        2035: new Date(2035, 10, 1)
    };
    const newYearDate = newYearDates[year];
    if (newYearDate) {
        if (adDate >= newYearDate) {
            return year - 879;
        } else {
            return year - 880;
        }
    }
    if (adDate.getMonth() > 9 || (adDate.getMonth() === 9 && adDate.getDate() >= 25)) {
        return year - 879;
    } else {
        return year - 880;
    }
}

function formatFiscalYear(startYear) {
    const endYear = startYear + 1;
    const endYearSuffix = '0' + String(endYear).slice(-2);
    const englishFY = `${startYear}/${endYearSuffix}`;
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
            const year = today.getFullYear();
            bsYearVal = year + 57;
            bsMonthVal = today.getMonth() < 6 ? 2 : 4;
            nepaliBSDateStr = window.toNepaliDigit(`${bsYearVal}/`);
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
    } catch (error) {
        console.error("Error initializing automatic date:", error);
    }
}

// User edit tracking setup for owner name input
document.addEventListener("DOMContentLoaded", () => {
    const ownerInput = document.getElementById('inOwnerName');
    if (ownerInput) {
        ownerInput.addEventListener("input", () => {
            ownerInput.dataset.userEdited = "true";
        });
    }
});

window.onload = function () {
    initializeAutomaticDate();
    window.addFamilyRow();
    window.updateDoc();
    window.adjustSignaturePosition(40);
};
