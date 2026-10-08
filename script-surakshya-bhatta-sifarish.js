// ══════════════════════════════════════════════════════
//  script-surakshya-bhatta-sifarish.js
//  सामाजिक सुरक्षा भत्ता संरक्षक सिफारिस — Firebase Firestore Logic
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

// Auth ready भएपछि मात्र snapshot listener सुरु गर्ने
(window._firebaseAuthReady || Promise.resolve()).then(() => {
    db.collection("surakshyaBhattaRecords").onSnapshot((snapshot) => {
        globalDatabase = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (!data.isDeleted) {
                globalDatabase.push({ id: doc.id, ...data });
            }
        });
        globalDatabase.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        renderDatabaseTable();
    });
}).catch(() => {});

// ── Helpers ─────────────────────────────────────────
function toNepaliDigit(num) {
    if (num === null || num === undefined) return '';
    const nd = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return num.toString().split('').map(d => (d >= '0' && d <= '9') ? nd[d] : d).join('');
}

function getSelectedAY() {
    const aySelect = document.getElementById('inPatraSankhya');
    return aySelect ? aySelect.value : '';
}

// ── Custom Field Toggles ─────────────────────────────
function toggleGuardianCitSection() {
    const chk = document.getElementById('chkGuardianCit');
    const sec = document.getElementById('guardianCitSection');
    if (sec) sec.style.display = chk.checked ? 'block' : 'none';
}

function toggleCardNoSection() {
    const chk = document.getElementById('chkCardNo');
    const sec = document.getElementById('cardNoSection');
    if (sec) sec.style.display = (chk && chk.checked) ? 'block' : 'none';
}

function handleRelationChange() {
    const sel = document.getElementById('selRelation').value;
    const grp = document.getElementById('customRelationGroup');
    if (grp) grp.style.display = (sel === 'CUSTOM') ? 'block' : 'none';
}

function toggleCustomSign() {
    const val = document.getElementById('inSignAuthority').value;
    const box = document.getElementById('customSignBox');
    if (box) box.style.display = (val === 'CUSTOM') ? 'grid' : 'none';
}

function adjustSignaturePosition(value) {
    const marginEl = document.getElementById('marginVal');
    if (marginEl) marginEl.innerText = toNepaliDigit(value) + " px";
    const docFooter = document.getElementById('docFooterSection');
    if (docFooter) docFooter.style.marginTop = value + "px";
}

function resetForm() {
    document.getElementById('editRecordIndex').value = '';
    document.getElementById('formMainTitle').innerText = '🛡️ सामाजिक सुरक्षा भत्ता संरक्षक सिफारिस';
    const btnNew = document.getElementById('btnNewForm');
    if (btnNew) btnNew.style.display = 'none';

    // Clear beneficiary
    document.getElementById('inBeneficiaryName').value = '';
    document.getElementById('inAccountNo').value = '';
    const chkCard = document.getElementById('chkCardNo');
    if (chkCard) chkCard.checked = false;
    document.getElementById('inCardNo').value = '';
    toggleCardNoSection();

    // Clear guardian
    document.getElementById('selRelation').value = 'छोरा';
    document.getElementById('inCustomRelation').value = '';
    handleRelationChange();
    document.getElementById('inGuardianName').value = '';

    // Reset guardian cit
    const chkCit = document.getElementById('chkGuardianCit');
    if (chkCit) chkCit.checked = false;
    document.getElementById('inGuardianCitNo').value = '';
    document.getElementById('inGuardianCitDate').value = '';
    document.getElementById('inGuardianCitDistrict').value = 'झापा';
    toggleGuardianCitSection();

    // Reset signatory & margin
    document.getElementById('inSignAuthority').value = 'नगेन्द्र भण्डारी|वडा अध्यक्ष';
    document.getElementById('inCustomSignName').value = '';
    document.getElementById('inCustomSignTitle').value = '';
    toggleCustomSign();
    document.getElementById('inSigMargin').value = '40';
    adjustSignaturePosition(40);

    initializeAutomaticDate();
    updateDoc();
}

// ── Modal toggle ─────────────────────────────────────
function toggleModal(show) {
    const modal = document.getElementById('abhilekhModal');
    if (modal) modal.style.display = show ? 'flex' : 'none';
    if (show) renderDatabaseTable();
}

// ── Live Preview Updater ──────────────────────────────
function updateDoc() {
    const ay = getSelectedAY();
    const chalani = toNepaliDigit(document.getElementById('inChalani').value.trim());
    const miti = toNepaliDigit(document.getElementById('inMiti').value.trim());
    const ns = toNepaliDigit(document.getElementById('inNepalSamvat').value.trim());

    // Bank and Subject
    const bankName = document.getElementById('inBankName').value.trim() || 'कृषि विकास बैंक लिमिटेड';
    const bankBranch = document.getElementById('inBankBranch').value.trim() || 'गौरादह शाखा, झापा';
    const subject = document.getElementById('inSubject').value.trim() || 'सिफारिस सम्बन्धमा ।';

    // Beneficiary
    const beneficiaryName = document.getElementById('inBeneficiaryName').value.trim();
    const rawAccountNo = document.getElementById('inAccountNo').value.trim();
    const accountNo = toNepaliDigit(rawAccountNo);
    const rawCardNo = document.getElementById('inCardNo').value.trim();
    const cardNo = toNepaliDigit(rawCardNo);

    // Guardian
    const selRel = document.getElementById('selRelation').value;
    let relation = selRel;
    if (selRel === 'CUSTOM') {
        relation = document.getElementById('inCustomRelation').value.trim() || 'संरक्षक';
    }
    const guardianName = document.getElementById('inGuardianName').value.trim();

    // Guardian Citizenship block
    const chkCit = document.getElementById('chkGuardianCit').checked;
    const rawCitNo = document.getElementById('inGuardianCitNo').value.trim();
    const citNo = toNepaliDigit(rawCitNo);
    const rawCitDate = document.getElementById('inGuardianCitDate').value.trim();
    const citDate = toNepaliDigit(rawCitDate);
    const citDistrict = document.getElementById('inGuardianCitDistrict').value.trim() || 'झापा';

    // Update Letterhead
    const lblAY = document.getElementById('lblAY');
    if (lblAY) lblAY.innerText = ay;
    const lblChalani = document.getElementById('lblChalani');
    if (lblChalani) lblChalani.innerText = chalani;
    const lblMiti = document.getElementById('lblMiti');
    if (lblMiti) lblMiti.innerText = miti || '........';
    const lblNS = document.getElementById('lblNepalSamvat');
    if (lblNS) lblNS.innerText = ns || '........';

    // Update Bank & Subject
    const lblBankName = document.getElementById('lblBankName');
    if (lblBankName) lblBankName.innerText = bankName;
    const lblBankBranch = document.getElementById('lblBankBranch');
    if (lblBankBranch) lblBankBranch.innerText = bankBranch;
    const lblSubject = document.getElementById('lblSubject');
    if (lblSubject) lblSubject.innerText = subject;

    // Update Body Text Placeholders
    const lblBeneficiary = document.getElementById('lblBeneficiaryName');
    if (lblBeneficiary) lblBeneficiary.innerText = beneficiaryName || '..................';

    const lblAcc = document.getElementById('lblAccountNo');
    if (lblAcc) lblAcc.innerText = accountNo || '.........................';

    const lblRel = document.getElementById('lblRelation');
    if (lblRel) lblRel.innerText = relation || 'हकवाला';

    const lblGrd = document.getElementById('lblGuardianName');
    if (lblGrd) lblGrd.innerText = guardianName || '..................';

    // Citizenship Clause: (नागरिकता प्र.नं. ..., जारी मिति: ..., जारी जिल्ला: ...)
    const lblCitBlock = document.getElementById('lblGuardianCitBlock');
    if (lblCitBlock) {
        if (chkCit) {
            let citText = ` (नागरिकता प्र.नं. ${citNo || '..................'}`;
            if (citDate) citText += `, जारी मिति: ${citDate}`;
            if (citDistrict) citText += `, जारी जिल्ला: ${citDistrict}`;
            citText += `) को`;
            lblCitBlock.innerText = citText;
        } else {
            lblCitBlock.innerText = "को";
        }
    }

    // Update Beneficiary Summary Table
    const lblTblBeneficiary = document.getElementById('lblTblBeneficiaryName');
    if (lblTblBeneficiary) lblTblBeneficiary.innerText = beneficiaryName || '..................';

    const lblTblAcc = document.getElementById('lblTblAccountNo');
    if (lblTblAcc) lblTblAcc.innerText = accountNo || '..................';

    const chkCard = document.getElementById('chkCardNo') ? document.getElementById('chkCardNo').checked : false;
    const rowTblCard = document.getElementById('rowTblCardNo');
    if (rowTblCard) {
        rowTblCard.style.display = chkCard ? '' : 'none';
    }
    const lblTblCard = document.getElementById('lblTblCardNo');
    if (lblTblCard) lblTblCard.innerText = cardNo || '..................';

    // Signature Block updates
    const signSelect = document.getElementById('inSignAuthority').value;
    let sigName = "", sigTitle = "";
    const lblSigName = document.getElementById('lblSigName');
    const lblSigTitle = document.getElementById('lblSigTitle');

    if (signSelect === 'BLANK') {
        sigName = "";
        sigTitle = "";
        if (lblSigName) lblSigName.style.borderTop = "none";
    } else {
        if (lblSigName) lblSigName.style.borderTop = "1.5px dashed #000";
        if (signSelect === 'CUSTOM') {
            sigName = document.getElementById('inCustomSignName').value.trim() || '....................';
            sigTitle = document.getElementById('inCustomSignTitle').value.trim() || '....................';
        } else {
            const signData = signSelect.split('|');
            sigName = signData[0] || '';
            sigTitle = signData[1] || '';
        }
    }
    if (lblSigName) lblSigName.innerText = sigName;
    if (lblSigTitle) lblSigTitle.innerText = sigTitle;
}

// ── Date Automation ───────────────────────────────────
function initializeAutomaticDate() {
    try {
        let nepaliBSDateStr = "";
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
            const adYear = today.getFullYear();
            const adMonth = today.getMonth() + 1;
            const adDay = today.getDate();
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
            bsYearVal = bsY;
            bsMonthVal = bsM;
            let bsD = adDay >= 16 ? adDay - 15 : adDay + 16;
            if (bsD > 32) bsD = 30;
            const bsDayVal = bsD;
            const bsMStr = String(bsMonthVal).padStart(2, '0');
            const bsDStr = String(bsDayVal).padStart(2, '0');
            nepaliBSDateStr = toNepaliDigit(`${bsYearVal}/${bsMStr}/${bsDStr}`);
        }

        initializeFiscalYear(bsYearVal, bsMonthVal);

        const inMiti = document.getElementById('inMiti');
        if (inMiti) inMiti.value = nepaliBSDateStr;

        const inNepalSamvat = document.getElementById('inNepalSamvat');
        if (inNepalSamvat) inNepalSamvat.value = '११४६';

        updateDoc();
        fetchCurrentNepalSambat();
    } catch (e) {}
}

function formatFiscalYear(startYear) {
    const endYear = startYear + 1;
    const endYearSuffix = String(endYear).slice(-2);
    return toNepaliDigit(`${startYear}/0${endYearSuffix}`);
}

function initializeFiscalYear(bsYear, bsMonth) {
    try {
        let currentStartYear = bsYear;
        if (bsMonth < 4) currentStartYear = bsYear - 1;

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
    } catch (error) {}
}

function updateNepalSambatFromMiti() {
    const inNS = document.getElementById('inNepalSamvat');
    if (inNS) {
        inNS.value = '११४६';
        updateDoc();
    }
}

async function fetchCurrentNepalSambat() {
    const inNS = document.getElementById('inNepalSamvat');
    if (inNS) {
        inNS.value = '११४६';
        updateDoc();
    }
}

// ── Print & Save ──────────────────────────────────────
async function printAndSaveSystem() {
    const beneficiaryName = document.getElementById('inBeneficiaryName').value.trim();
    if (!beneficiaryName) {
        alert("कृपया सामाजिक सुरक्षा लाभग्राहीको नाम अनिवार्य लेख्नुहोस् ।");
        document.getElementById('inBeneficiaryName').focus();
        return;
    }

    const guardianName = document.getElementById('inGuardianName').value.trim();
    if (!guardianName) {
        alert("कृपया संरक्षक / हकवालाको नाम अनिवार्य लेख्नुहोस् ।");
        document.getElementById('inGuardianName').focus();
        return;
    }

    const recordId = document.getElementById('editRecordIndex').value;

    const selRel = document.getElementById('selRelation').value;
    const relation = (selRel === 'CUSTOM')
        ? (document.getElementById('inCustomRelation').value.trim() || 'संरक्षक')
        : selRel;

    const obj = {
        ay:                   getSelectedAY(),
        chalani:              document.getElementById('inChalani').value.trim() || '-',
        miti:                 document.getElementById('inMiti').value.trim() || '-',
        ns:                   document.getElementById('inNepalSamvat').value.trim() || '-',
        bankName:             document.getElementById('inBankName').value.trim() || 'कृषि विकास बैंक लिमिटेड',
        bankBranch:           document.getElementById('inBankBranch').value.trim() || 'गौरादह शाखा, झापा',
        subject:              document.getElementById('inSubject').value.trim() || 'सिफारिस सम्बन्धमा ।',
        beneficiaryName:      beneficiaryName,
        name:                 beneficiaryName, // standard search field alias
        accountNo:            document.getElementById('inAccountNo').value.trim() || '',
        hasCardNo:            document.getElementById('chkCardNo') ? document.getElementById('chkCardNo').checked : false,
        cardNo:               (document.getElementById('chkCardNo') && document.getElementById('chkCardNo').checked)
                                ? document.getElementById('inCardNo').value.trim()
                                : '',
        relation:             relation,
        guardianName:         guardianName,
        hasGuardianCit:       document.getElementById('chkGuardianCit').checked,
        guardianCitNo:        document.getElementById('inGuardianCitNo').value.trim() || '',
        guardianCitDate:      document.getElementById('inGuardianCitDate').value.trim() || '',
        guardianCitDistrict:  document.getElementById('inGuardianCitDistrict').value.trim() || '',
        signAuth:             document.getElementById('inSignAuthority').value,
        customSignName:       document.getElementById('inCustomSignName').value.trim(),
        customSignTitle:      document.getElementById('inCustomSignTitle').value.trim(),
        sigMargin:            document.getElementById('inSigMargin').value,
        createdBy:            localStorage.getItem('sifarish_user') || 'wada1',
        createdWard:          localStorage.getItem('sifarish_ward') || '1',
        timestamp:            Date.now()
    };

    const btn = document.querySelector('.btn-print');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = "⏳ सुरक्षित हुँदैछ...";
    }

    try {
        if (recordId !== "") {
            await db.collection("surakshyaBhattaRecords").doc(recordId).update(obj);
        } else {
            const docRef = await db.collection("surakshyaBhattaRecords").add(obj);
            document.getElementById('editRecordIndex').value = docRef.id;
            document.getElementById('formMainTitle').innerText = "🔄 सम्पादन मोड: " + beneficiaryName;
        }
        const btnNew = document.getElementById('btnNewForm');
        if (btnNew) btnNew.style.display = 'inline-block';
        window.print();
    } catch (e) {
        console.error(e);
        if (confirm("क्लाउडमा डाटा सुरक्षित गर्दा समस्या भयो! इन्टरनेट नहुँदा पनि प्रिन्ट गर्न चाहनुहुन्छ?")) {
            window.print();
        }
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
    return toNepaliDigit(`${y}/${m}/${day} - ${hr}:${min}`);
}

// ── Database Operations ───────────────────────────────
function renderDatabaseTable() {
    const tbody = document.getElementById('dbTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const query = document.getElementById('searchField').value.trim().toLowerCase();
    const queryEn = (window.toEnglishDigit || (x => x))(query);
    const queryNe = (window.toNepaliDigit || (x => x))(query);

    const filtered = globalDatabase.filter(rec => {
        if (!query) return true;
        const bName = (rec.beneficiaryName || rec.name || '').toLowerCase();
        const gName = (rec.guardianName || '').toLowerCase();
        const acc = (rec.accountNo || '').toLowerCase();
        const accEn = (window.toEnglishDigit || (x => x))(acc);
        const accNe = (window.toNepaliDigit || (x => x))(acc);
        const chalani = (rec.chalani || '').toLowerCase();
        const chalaniEn = (window.toEnglishDigit || (x => x))(chalani);
        const chalaniNe = (window.toNepaliDigit || (x => x))(chalani);
        const card = (rec.cardNo || '').toLowerCase();

        return bName.includes(query) ||
               gName.includes(query) ||
               card.includes(query) ||
               acc.includes(query) || acc.includes(queryNe) || accEn.includes(queryEn) || accNe.includes(queryNe) ||
               chalani.includes(query) || chalaniEn.includes(queryEn) || chalaniNe.includes(queryNe);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:18px; color:#a0aec0;">कुनै रेकर्ड भेटिएन ।</td></tr>`;
        return;
    }

    filtered.forEach((rec, index) => {
        const row = document.createElement('tr');
        const relationStr = rec.relation ? ` (${rec.relation})` : '';
        row.innerHTML = `
            <td>${toNepaliDigit(index + 1)}</td>
            <td><b>${rec.beneficiaryName || rec.name || '-'}</b></td>
            <td>${toNepaliDigit(rec.accountNo || '-')}</td>
            <td>${rec.guardianName || '-'}${relationStr}</td>
            <td>${formatTimestamp(rec.timestamp)}</td>
            <td>
                <div style="display:flex; gap:6px; justify-content:center;">
                    <button class="action-edit-btn" onclick="loadRecordToForm('${rec.id}')" title="सम्पादन">✏️</button>
                    <button class="action-del-btn" onclick="deleteRecord('${rec.id}')" title="हटाउनुहोस्">❌</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function loadRecordToForm(id) {
    const rec = globalDatabase.find(r => r.id === id);
    if (!rec) return;

    if (!confirm("के तपाईं यो रेकर्ड सम्पादन गर्न चाहनुहुन्छ? यसले हालको फारमको डाटा प्रतिस्थापन गर्नेछ ।")) {
        return;
    }

    document.getElementById('editRecordIndex').value = rec.id;
    document.getElementById('formMainTitle').innerText = "🔄 सम्पादन मोड: " + (rec.beneficiaryName || '');

    // Letterhead
    const inPS = document.getElementById('inPatraSankhya');
    if (inPS) inPS.value = rec.ay || '';
    document.getElementById('inChalani').value = rec.chalani !== '-' ? rec.chalani : '';
    document.getElementById('inMiti').value = rec.miti !== '-' ? rec.miti : '';
    document.getElementById('inNepalSamvat').value = rec.ns !== '-' ? rec.ns : '';

    // Bank & Subject
    document.getElementById('inBankName').value = rec.bankName || 'कृषि विकास बैंक लिमिटेड';
    document.getElementById('inBankBranch').value = rec.bankBranch || 'गौरादह शाखा, झापा';
    document.getElementById('inSubject').value = rec.subject || 'सिफारिस सम्बन्धमा ।';

    // Beneficiary
    document.getElementById('inBeneficiaryName').value = rec.beneficiaryName || rec.name || '';
    document.getElementById('inAccountNo').value = rec.accountNo || '';
    // Optional Card No
    const chkCard = document.getElementById('chkCardNo');
    if (chkCard) {
        chkCard.checked = !!(rec.hasCardNo || (rec.cardNo && rec.cardNo !== '-'));
    }
    document.getElementById('inCardNo').value = rec.cardNo || '';
    toggleCardNoSection();

    // Guardian
    const standardRelations = ['छोरा', 'छोरी', 'श्रीमान', 'श्रीमती', 'बुहारी', 'नाति', 'नातिनी', 'भाइ', 'दाइ', 'दिदी', 'बहिनी', 'हकवाला', 'संरक्षक'];
    const relVal = rec.relation || 'छोरा';
    if (standardRelations.includes(relVal)) {
        document.getElementById('selRelation').value = relVal;
        document.getElementById('inCustomRelation').value = '';
    } else {
        document.getElementById('selRelation').value = 'CUSTOM';
        document.getElementById('inCustomRelation').value = relVal;
    }
    handleRelationChange();

    document.getElementById('inGuardianName').value = rec.guardianName || '';

    // Guardian Citizenship
    const chkCit = document.getElementById('chkGuardianCit');
    chkCit.checked = !!rec.hasGuardianCit;
    document.getElementById('inGuardianCitNo').value = rec.guardianCitNo || '';
    document.getElementById('inGuardianCitDate').value = rec.guardianCitDate || '';
    document.getElementById('inGuardianCitDistrict').value = rec.guardianCitDistrict || 'झापा';
    toggleGuardianCitSection();

    // Signature authority
    document.getElementById('inSignAuthority').value = rec.signAuth || 'नगेन्द्र भण्डारी|वडा अध्यक्ष';
    document.getElementById('inCustomSignName').value = rec.customSignName || '';
    document.getElementById('inCustomSignTitle').value = rec.customSignTitle || '';
    toggleCustomSign();

    // Signature margin spacing
    const margin = rec.sigMargin || '40';
    document.getElementById('inSigMargin').value = margin;
    adjustSignaturePosition(margin);

    updateDoc();
    const btnNew = document.getElementById('btnNewForm');
    if (btnNew) btnNew.style.display = 'inline-block';
    toggleModal(false);
}

async function deleteRecord(id) {
    const rec = globalDatabase.find(r => r.id === id);
    if (!rec) return;

    if (!confirm(`के तपाईं "${rec.beneficiaryName || 'यो रेकर्ड'}" लाई रद्दीको टोकरीमा पठाउन चाहनुहुन्छ?`)) {
        return;
    }

    try {
        if (typeof window.softDeleteRecord === 'function') {
            await window.softDeleteRecord('surakshyaBhattaRecords', id, {
                title: rec.beneficiaryName || rec.name || '',
                name: rec.beneficiaryName || rec.name || '',
                beneficiaryName: rec.beneficiaryName || rec.name || '',
                guardianName: rec.guardianName || '',
                accountNo: rec.accountNo || '',
                chalani: rec.chalani || '',
                type: 'सामाजिक सुरक्षा भत्ता संरक्षक सिफारिस'
            });
        } else {
            await db.collection("surakshyaBhattaRecords").doc(id).delete();
        }
        alert("रेकर्ड सफलतापूर्वक सुरक्षित रूपमा हटाइयो ।");
    } catch (e) {
        console.error(e);
        alert("रेकर्ड हटाउन समस्या भयो! इन्टरनेट कनेक्सन जाँच्नुहोस् ।");
    }
}

// Page Bootstrap Init
window.onload = function () {
    initializeAutomaticDate();
    adjustSignaturePosition(40);
};

window.addEventListener('templateInjected', function () {
    initializeAutomaticDate();
});
