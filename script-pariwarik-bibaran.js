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
let isFirstRowSynced = true;

// ३. रियल-टाइम डाटाबेस सिङ्क — Auth ready भएपछि मात्र
(window._firebaseAuthReady || Promise.resolve()).then(() => {
    db.collection("pariwarikRecords").onSnapshot((snapshot) => {
        globalDatabase = [];
        snapshot.forEach((doc) => {
            globalDatabase.push({ id: doc.id, ...doc.data() });
        });
        globalDatabase.sort((a, b) => b.timestamp - a.timestamp);
        renderDatabaseTable();
    });
}).catch(() => {});


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

window.handleFirstRowManualEdit = function (rowId) {
    if (activeRowIds.length > 0 && activeRowIds[0] === rowId) {
        isFirstRowSynced = false;
    }
}

window.addFamilyRow = function (data = null) {
    rowCounter++;
    const rowId = 'family_row_' + rowCounter;
    activeRowIds.push(rowId);

    const container = document.getElementById('familyRowsContainer');
    
    // Determine values to populate
    let nameVal = data ? (data.name || '') : '';
    let docVal = data ? (data.document || '') : '';
    let issueDateVal = data ? (data.issueDate || '') : '';
    let addressVal = data ? (data.address || '') : '';
    let relVal = data ? (data.relationship || '') : '';

    if (activeRowIds.length === 1 && !data && isFirstRowSynced) {
        nameVal = document.getElementById('inName').value;
        docVal = document.getElementById('inCitNo').value;
        issueDateVal = document.getElementById('inCitDate') ? document.getElementById('inCitDate').value : '';
        relVal = 'निवेदक';
    }

    const rowHtml = `
        <div class="member-row-block" id="${rowId}">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <div class="row-num-badge">क्रम संख्या: <span class="row-index-display"></span></div>
                <button type="button" class="btn-delete-row" id="del_btn_${rowId}" onclick="removeFamilyRow('${rowId}')" style="background:#fee2e2; color:#dc2626; border:1px solid #fca5a5; padding:3px 8px; border-radius:4px; font-size:0.8rem; cursor:pointer;">❌ हटाउनुस्</button>
            </div>
            
            <div class="form-group" style="margin-bottom: 8px;">
                <label style="font-size:0.8rem; color:#2d3748; font-weight:700;">नाम थर (अनिवार्य):</label>
                <input type="text" class="input-member-name" placeholder="उदा: रेखा देवी गन्गाई" value="${nameVal}" oninput="handleFirstRowManualEdit('${rowId}'); updateDoc()">
            </div>
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                <div class="form-group" style="margin-bottom: 0;">
                    <label style="font-size:0.75rem; color:#4a5568; font-weight:700;">ना.प्र.नं./ज.द.नं. (अनिवार्य):</label>
                    <input type="text" class="input-member-document" placeholder="उदा: ०४०३०४८/३११ वा ज.द.नं. ५१" value="${docVal}" oninput="handleFirstRowManualEdit('${rowId}'); updateDoc()">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label style="font-size:0.75rem; color:#4a5568; font-weight:700;">नाता (अनिवार्य):</label>
                    <input type="text" class="input-member-relationship" list="relList" placeholder="उदा: निवेदक / पति / छोरी" value="${relVal}" oninput="handleFirstRowManualEdit('${rowId}'); updateDoc()">
                </div>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 0;">
                <div class="form-group" style="margin-bottom: 0;">
                    <label style="font-size:0.75rem; color:#4a5568; font-weight:700;">जारी मिति (ऐच्छिक):</label>
                    <input type="text" class="input-member-issuedate" placeholder="उदा: २०६३/१०/०८" value="${issueDateVal}" oninput="handleFirstRowManualEdit('${rowId}'); updateDoc()">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label style="font-size:0.75rem; color:#4a5568; font-weight:700;">ठेगाना (ऐच्छिक):</label>
                    <input type="text" class="input-member-address" placeholder="उदा: गौरादह न.पा.-१" value="${addressVal}" oninput="handleFirstRowManualEdit('${rowId}'); updateDoc()">
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', rowHtml);
    reindexFormRows();
    updateDoc();
};

window.removeFamilyRow = function (rowId) {
    if (activeRowIds.length > 0 && activeRowIds[0] === rowId) {
        // If first row is cleared, empty its inputs and stop auto-sync
        const block = document.getElementById(rowId);
        if (block) {
            if (block.querySelector('.input-member-name')) block.querySelector('.input-member-name').value = '';
            if (block.querySelector('.input-member-document')) block.querySelector('.input-member-document').value = '';
            if (block.querySelector('.input-member-issuedate')) block.querySelector('.input-member-issuedate').value = '';
            if (block.querySelector('.input-member-address')) block.querySelector('.input-member-address').value = '';
            if (block.querySelector('.input-member-relationship')) block.querySelector('.input-member-relationship').value = '';
        }
        isFirstRowSynced = false;
        updateDoc();
        return;
    }

    if (activeRowIds.length <= 1) return;
    const el = document.getElementById(rowId);
    if (el) el.remove();
    activeRowIds = activeRowIds.filter(id => id !== rowId);
    reindexFormRows();
    updateDoc();
};

function reindexFormRows() {
    activeRowIds.forEach((id, index) => {
        const block = document.getElementById(id);
        if (block) {
            block.querySelector('.row-index-display').innerText = window.toNepaliDigit(index + 1);
            const delBtn = document.getElementById(`del_btn_${id}`);
            if (delBtn) {
                // First row delete button is always visible so user can clear it
                if (index === 0) {
                    delBtn.style.display = 'block';
                } else {
                    delBtn.style.display = (activeRowIds.length === 1) ? 'none' : 'block';
                }
            }
        }
    });
}


window.updateDoc = function () {
    // Sync first row details if enabled
    if (isFirstRowSynced && activeRowIds.length > 0) {
        const firstRowId = activeRowIds[0];
        const firstRowBlock = document.getElementById(firstRowId);
        if (firstRowBlock) {
            const applicantName = document.getElementById('inName').value;
            const citNo = document.getElementById('inCitNo').value;
            const citDate = document.getElementById('inCitDate') ? document.getElementById('inCitDate').value : '';
            
            const nameInput = firstRowBlock.querySelector('.input-member-name');
            const docInput = firstRowBlock.querySelector('.input-member-document');
            const issueDateInput = firstRowBlock.querySelector('.input-member-issuedate');
            const relInput = firstRowBlock.querySelector('.input-member-relationship');
            
            if (nameInput && document.activeElement !== nameInput) {
                nameInput.value = applicantName;
            }
            if (docInput && document.activeElement !== docInput) {
                docInput.value = citNo;
            }
            if (issueDateInput && document.activeElement !== issueDateInput && citDate) {
                issueDateInput.value = citDate;
            }
            if (relInput && document.activeElement !== relInput && !relInput.value) {
                relInput.value = 'निवेदक';
            }
        }
    }

    document.getElementById('lblPatraSankhya').innerText = document.getElementById('inPatraSankhya').value;
    document.getElementById('lblChalani').innerText = document.getElementById('inChalani').value || '';
    document.getElementById('lblMiti').innerText = document.getElementById('inMiti').value || '........';
    document.getElementById('lblNepalSamvat').innerText = document.getElementById('inNepalSamvat').value || '........';

    const selectedWada = document.getElementById('inWadaNo').value;
    document.getElementById('lblWadaBody1').innerText = selectedWada;
    document.getElementById('lblWadaBody2').innerText = selectedWada;

    const nameVal = document.getElementById('inName').value || '...........................';
    document.getElementById('lblApplicantName').innerText = nameVal;

    const citNo = (document.getElementById('inCitNo') ? document.getElementById('inCitNo').value : '').trim();
    const citDate = (document.getElementById('inCitDate') ? document.getElementById('inCitDate').value : '').trim();
    const citDistrict = (document.getElementById('inCitDistrict') ? document.getElementById('inCitDistrict').value : '').trim();
    const citBlock = document.getElementById('lblCitBlock');
    
    const citParts = [];
    if (citNo !== "") {
        let cleanNo = citNo.replace(/^ना\.?\s*प्र\.?\s*नं\.?\s*[:ः]?\s*/i, '');
        citParts.push("ना.प्र.नं." + cleanNo);
    }
    if (citDate !== "") {
        let cleanDate = citDate.replace(/^जारी\s*मिति\s*[:ः]?\s*/i, '');
        citParts.push("जारी मिति: " + cleanDate);
    }
    if (citDistrict !== "") {
        let cleanDistrict = citDistrict.replace(/^जारी\s*जिल्ला\s*[:ः]?\s*/i, '').replace(/^जिल्ला\s*[:ः]?\s*/i, '');
        citParts.push(cleanDistrict);
    }

    if (citParts.length > 0) {
        citBlock.innerText = " (" + citParts.join(', ') + ")";
        citBlock.style.display = 'inline';
    } else {
        citBlock.innerText = "";
        citBlock.style.display = 'none';
    }

    const ownerVal = document.getElementById('inOwnerName').value || nameVal;
    document.getElementById('lblOwnerName').innerText = ownerVal;

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

    // Dynamic Columns Evaluation: Check if any row has issueDate or address
    let hasIssueDate = false;
    let hasAddress = false;
    const memberRows = [];

    activeRowIds.forEach((id) => {
        const block = document.getElementById(id);
        if (block) {
            const mName = block.querySelector('.input-member-name') ? block.querySelector('.input-member-name').value.trim() : '';
            const mDoc = block.querySelector('.input-member-document') ? block.querySelector('.input-member-document').value.trim() : '';
            const mIssueDate = block.querySelector('.input-member-issuedate') ? block.querySelector('.input-member-issuedate').value.trim() : '';
            const mAddress = block.querySelector('.input-member-address') ? block.querySelector('.input-member-address').value.trim() : '';
            const mRel = block.querySelector('.input-member-relationship') ? block.querySelector('.input-member-relationship').value.trim() : '';

            if (mIssueDate !== '') hasIssueDate = true;
            if (mAddress !== '') hasAddress = true;

            memberRows.push({ mName, mDoc, mIssueDate, mAddress, mRel });
        }
    });

    const thead = document.getElementById('outputTableHead') || (document.getElementById('familyDetailsTable') ? document.getElementById('familyDetailsTable').querySelector('thead') : null);
    const tbody = document.getElementById('outputTableBody');

    if (thead) {
        if (hasIssueDate && hasAddress) {
            thead.innerHTML = `
                <tr>
                    <th style="width: 7%;">क्र.स.</th>
                    <th style="width: 27%;">नाम थर</th>
                    <th style="width: 22%;">ना.प्र.नं./ज.द.नं.</th>
                    <th style="width: 17%;">जारी मिति</th>
                    <th style="width: 16%;">ठेगाना</th>
                    <th style="width: 11%;">नाता</th>
                </tr>
            `;
        } else if (hasIssueDate && !hasAddress) {
            thead.innerHTML = `
                <tr>
                    <th style="width: 8%;">क्र.स.</th>
                    <th style="width: 32%;">नाम थर</th>
                    <th style="width: 24%;">ना.प्र.नं./ज.द.नं.</th>
                    <th style="width: 20%;">जारी मिति</th>
                    <th style="width: 16%;">नाता</th>
                </tr>
            `;
        } else if (!hasIssueDate && hasAddress) {
            thead.innerHTML = `
                <tr>
                    <th style="width: 8%;">क्र.स.</th>
                    <th style="width: 32%;">नाम थर</th>
                    <th style="width: 24%;">ना.प्र.नं./ज.द.नं.</th>
                    <th style="width: 20%;">ठेगाना</th>
                    <th style="width: 16%;">नाता</th>
                </tr>
            `;
        } else {
            // Default 4 columns (क्र.स., नाम थर, ना.प्र.नं./ज.द.नं., नाता)
            thead.innerHTML = `
                <tr>
                    <th style="width: 8%;">क्र.स.</th>
                    <th style="width: 42%;">नाम थर</th>
                    <th style="width: 30%;">ना.प्र.नं./ज.द.नं.</th>
                    <th style="width: 20%;">नाता</th>
                </tr>
            `;
        }
    }

    if (tbody) {
        tbody.innerHTML = '';
        memberRows.forEach((row, index) => {
            const sn = window.toNepaliDigit(index + 1);
            const nameDisplay = row.mName || '................';
            
            if (hasIssueDate && hasAddress) {
                tbody.insertAdjacentHTML('beforeend', `
                    <tr>
                        <td>${sn}.</td>
                        <td style="text-align: left; padding-left: 8px; font-weight: 600;">${nameDisplay}</td>
                        <td>${row.mDoc || '-'}</td>
                        <td>${row.mIssueDate || '-'}</td>
                        <td>${row.mAddress || '-'}</td>
                        <td>${row.mRel || '-'}</td>
                    </tr>
                `);
            } else if (hasIssueDate && !hasAddress) {
                tbody.insertAdjacentHTML('beforeend', `
                    <tr>
                        <td>${sn}.</td>
                        <td style="text-align: left; padding-left: 8px; font-weight: 600;">${nameDisplay}</td>
                        <td>${row.mDoc || '-'}</td>
                        <td>${row.mIssueDate || '-'}</td>
                        <td>${row.mRel || '-'}</td>
                    </tr>
                `);
            } else if (!hasIssueDate && hasAddress) {
                tbody.insertAdjacentHTML('beforeend', `
                    <tr>
                        <td>${sn}.</td>
                        <td style="text-align: left; padding-left: 8px; font-weight: 600;">${nameDisplay}</td>
                        <td>${row.mDoc || '-'}</td>
                        <td>${row.mAddress || '-'}</td>
                        <td>${row.mRel || '-'}</td>
                    </tr>
                `);
            } else {
                tbody.insertAdjacentHTML('beforeend', `
                    <tr>
                        <td>${sn}.</td>
                        <td style="text-align: left; padding-left: 8px; font-weight: 600;">${nameDisplay}</td>
                        <td>${row.mDoc || '-'}</td>
                        <td>${row.mRel || '-'}</td>
                    </tr>
                `);
            }
        });
    }
};

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
                name: block.querySelector('.input-member-name') ? block.querySelector('.input-member-name').value.trim() : '',
                document: block.querySelector('.input-member-document') ? block.querySelector('.input-member-document').value.trim() : '',
                issueDate: block.querySelector('.input-member-issuedate') ? block.querySelector('.input-member-issuedate').value.trim() : '',
                address: block.querySelector('.input-member-address') ? block.querySelector('.input-member-address').value.trim() : '',
                relationship: block.querySelector('.input-member-relationship') ? block.querySelector('.input-member-relationship').value.trim() : ''
            });
        }
    });

    const currentObj = {
        patra: document.getElementById('inPatraSankhya').value,
        chalani: document.getElementById('inChalani').value.trim() || '-',
        wada: document.getElementById('inWadaNo').value,
        name: name,
        citNo: document.getElementById('inCitNo') ? document.getElementById('inCitNo').value.trim() : '',
        citDate: document.getElementById('inCitDate') ? document.getElementById('inCitDate').value.trim() : '',
        citDistrict: document.getElementById('inCitDistrict') ? document.getElementById('inCitDistrict').value.trim() : '',
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

    const btn = document.querySelector('.btn-print');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = "⏳ सुरक्षित हुँदैछ...";
    }

    try {
        if (recordId !== "") {
            await db.collection("pariwarikRecords").doc(recordId).update(currentObj);
        } else {
            const docRef = await db.collection("pariwarikRecords").add(currentObj);
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

window.editFromDB = function (id) {
    const rec = globalDatabase.find(r => r.id === id);
    if (!rec) return;

    isFirstRowSynced = false;
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
    if (document.getElementById('inCitDistrict')) {
        document.getElementById('inCitDistrict').value = rec.citDistrict || '';
    }
    
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

window.addEventListener('templateInjected', function() {
    initializeAutomaticDate();
});

