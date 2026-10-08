// ══════════════════════════════════════════════════════
//  script-yojana-tippani.js
//  वडा स्तरीय योजना टिप्पणी-आदेश — Firebase Firestore Logic
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

// Auth ready भएपछि snapshot listener सुरु गर्ने
(window._firebaseAuthReady || Promise.resolve()).then(() => {
    db.collection("yojanaTippaniRecords").onSnapshot((snapshot) => {
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

function parseNepaliOrEnglishNumber(str) {
    if (!str) return 0;
    const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    let clean = str.toString().replace(/,/g, '').replace(/रु\./g, '').replace(/\/-/g, '').trim();
    let engStr = clean.split('').map(c => {
        const idx = nepaliDigits.indexOf(c);
        return idx !== -1 ? idx : c;
    }).join('');
    const num = parseFloat(engStr);
    return isNaN(num) ? 0 : num;
}

function formatRupeeDisplay(val) {
    if (!val || val.trim() === '') return 'रु. ................';
    const trimmed = val.trim();
    if (trimmed.startsWith('रु.') || trimmed.startsWith('रू.')) return toNepaliDigit(trimmed);
    return `रु. ${toNepaliDigit(trimmed)}`;
}

function getSelectedAY() {
    const aySelect = document.getElementById('inPatraSankhya');
    return aySelect ? aySelect.value : '०८३/८४';
}

function syncBudgetTitle() {
    const pName = document.getElementById('inProjectName').value.trim();
    const bTitle = document.getElementById('inBudgetTitle');
    if (bTitle && (!bTitle.value.trim() || bTitle.dataset.autofilled === "true")) {
        if (pName) {
            bTitle.value = pName.endsWith('कार्यक्रम') ? pName : `${pName} कार्यक्रम`;
            bTitle.dataset.autofilled = "true";
        } else {
            bTitle.value = "";
            bTitle.dataset.autofilled = "false";
        }
    }
}

function calcTotalCost() {
    const grant = parseNepaliOrEnglishNumber(document.getElementById('inGrantAmt').value);
    const pub = parseNepaliOrEnglishNumber(document.getElementById('inPublicParticipationAmt').value);
    const totalEl = document.getElementById('inTotalCostEst');
    if (grant > 0 || pub > 0) {
        const sum = grant + pub;
        if (totalEl && (!totalEl.value || totalEl.dataset.autocalc === "true")) {
            totalEl.value = toNepaliDigit(sum.toLocaleString('en-IN')) + '/-';
            totalEl.dataset.autocalc = "true";
        }
    }
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

function adjustTippaniFontSize(val) {
    const lbl = document.getElementById('lblTippaniFontSizeVal');
    if (lbl) lbl.innerText = toNepaliDigit(val) + " pt";
    
    // Set uniform font size across all text elements in tippani-content
    const elements = document.querySelectorAll('.tippani-content, .tippani-content *, .tippani-title-block, .tippani-main-title, .tippani-subject, .tippani-addressee, .letter-body-para, .tapasill-heading, .tippani-table, .tippani-table td, .doc-footer, .doc-footer *, .signature-block, .signature-block *');
    elements.forEach(el => {
        el.style.fontSize = val + "pt";
    });

    localStorage.setItem('tippani_custom_fontsize', val);
}

function toggleModal(show) {
    const modal = document.getElementById('abhilekhModal');
    if (modal) modal.style.display = show ? 'flex' : 'none';
    if (show) renderDatabaseTable();
}

function resetForm() {
    document.getElementById('editRecordIndex').value = '';
    document.getElementById('formMainTitle').innerText = '📑 वडा स्तरीय योजना टिप्पणी-आदेश';
    clearSelectedPlan();
    const btnNew = document.getElementById('btnNewForm');
    if (btnNew) btnNew.style.display = 'none';

    // Clear Letterhead & Dates
    document.getElementById('inChalani').value = '';
    document.getElementById('inDartaNo').value = '';
    const inNS = document.getElementById('inNepalSamvat');
    if (inNS) inNS.value = '११४६';

    // Clear Project
    document.getElementById('inProjectName').value = '';
    document.getElementById('inProjectArea').value = '';
    document.getElementById('inAgreementDate').value = '';
    document.getElementById('inCompletionDate').value = '';
    document.getElementById('inAllocationType').value = 'वडा स्तरीय';

    // Clear Budget
    const bTitle = document.getElementById('inBudgetTitle');
    bTitle.value = '';
    bTitle.dataset.autofilled = 'false';
    document.getElementById('inGrantAmt').value = '';
    document.getElementById('inPublicParticipationAmt').value = '';
    const totalCost = document.getElementById('inTotalCostEst');
    totalCost.value = '';
    totalCost.dataset.autocalc = 'false';
    document.getElementById('inSubmittedBillAmt').value = '';
    document.getElementById('inEvalAmt').value = '';
    document.getElementById('inPaymentDueAmt').value = '';

    // Clear Decision dates
    document.getElementById('inCommitteeDecisionDate').value = '';
    document.getElementById('inMonitoringDecisionDate').value = '';
    document.getElementById('inEvalDate').value = '';
    document.getElementById('inWardMonitoringDate').value = '';

    // Clear Bank
    document.getElementById('inPayeeName').value = '';
    document.getElementById('inBankName').value = '';
    document.getElementById('inAccountNo').value = '';
    document.querySelectorAll('input[name="bankRadio"]').forEach(r => r.checked = false);
    updateBankRadioVisuals();

    // Signatory
    document.getElementById('inSignAuthority').value = 'अनिता अधिकारी|वडा सचिव';
    document.getElementById('inCustomSignName').value = '';
    document.getElementById('inCustomSignTitle').value = '';
    toggleCustomSign();
    document.getElementById('inSigMargin').value = '10';
    adjustSignaturePosition(10);

    initializeAutomaticDate();
    updateDoc();
}

// ── Bank Radio Scrolling Feature ──────────────────────
const PRESET_BANKS = [
    'सिद्धार्थ बैंक लिमिटेड, गौरादह शाखा',
    'एनआईसी एशिया बैंक लिमिटेड, गौरादह शाखा',
    'कृषि विकास बैंक लिमिटेड, गौरादह शाखा',
    'प्राइम कमर्सियल बैंक लिमिटेड, गौरादह शाखा',
    'प्राइम कमर्सियल बैंक लिमिटेड, ग्वालडुब्बा शाखा',
    'सप्तकोशी डेभलपमेन्ट बैंक लिमिटेड, गौरादह शाखा',
    'एक्सेल डेभलपमेन्ट बैंक लिमिटेड, गौरादह शाखा',
    'एक्सेल डेभलपमेन्ट बैंक लिमिटेड, बैगुन्धुरा शाखा'
];

function onBankRadioChange(radio) {
    const bankInput = document.getElementById('inBankName');
    updateBankRadioVisuals();

    if (radio.value === 'CUSTOM') {
        if (bankInput) {
            if (PRESET_BANKS.includes(bankInput.value.trim())) {
                bankInput.value = '';
            }
            bankInput.focus();
        }
    } else {
        if (bankInput) {
            bankInput.value = radio.value;
        }
    }
    updateDoc();
}

function updateBankRadioVisuals() {
    document.querySelectorAll('.bank-radio-item').forEach(label => {
        const inp = label.querySelector('input[type="radio"]');
        if (inp && inp.checked) {
            label.classList.add('selected');
        } else {
            label.classList.remove('selected');
        }
    });
}

function onBankInputChanged() {
    const val = document.getElementById('inBankName').value.trim();
    syncBankRadioFromValue(val);
}

function syncBankRadioFromValue(val) {
    const radios = document.querySelectorAll('input[name="bankRadio"]');
    let matched = false;

    radios.forEach(r => {
        if (r.value !== 'CUSTOM' && r.value === val) {
            r.checked = true;
            matched = true;
            r.closest('.bank-radio-item')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else if (r.value !== 'CUSTOM') {
            r.checked = false;
        }
    });

    const customRadio = document.querySelector('input[name="bankRadio"][value="CUSTOM"]');
    if (!matched && val) {
        if (customRadio) customRadio.checked = true;
    } else if (!matched && !val) {
        if (customRadio) customRadio.checked = false;
    }

    updateBankRadioVisuals();
}

// ── Budget Title Auto-sync ────────────────────────────
function syncBudgetTitle() {
    const pName = document.getElementById('inProjectName').value.trim();
    const bTitle = document.getElementById('inBudgetTitle');
    if (bTitle && (!bTitle.value || bTitle.dataset.autofilled === "true")) {
        if (pName) {
            bTitle.value = pName + " कार्यक्रम";
            bTitle.dataset.autofilled = "true";
        } else {
            bTitle.value = "";
            bTitle.dataset.autofilled = "false";
        }
    }
}

// ════════════════════════════════════════════════════════════
// ── WARD 1 APPROVED PROJECTS PRESET MANAGEMENT (48 PLANS) ──
// ════════════════════════════════════════════════════════════
let currentSectorFilter = 'ALL';

function initApprovedPlansUI() {
    if (typeof WARD1_APPROVED_PROJECTS === 'undefined' || !Array.isArray(WARD1_APPROVED_PROJECTS)) {
        return;
    }
    populateApprovedPlansDropdown();
    populateProjectDatalist();
}

function populateApprovedPlansDropdown(filterQuery = '', sectorFilter = currentSectorFilter) {
    const sel = document.getElementById('selectApprovedPlan');
    if (!sel || typeof WARD1_APPROVED_PROJECTS === 'undefined') return;

    const currentVal = sel.value;
    sel.innerHTML = '<option value="">-- स्वीकृत योजना छान्नुहोस् (नाम र बजेट स्वतः भरिनेछ) --</option>';

    let list = WARD1_APPROVED_PROJECTS;
    if (sectorFilter && sectorFilter !== 'ALL') {
        list = list.filter(p => p.sector === sectorFilter);
    }
    if (filterQuery && filterQuery.trim()) {
        const q = filterQuery.trim().toLowerCase();
        list = list.filter(p => 
            p.name.toLowerCase().includes(q) || 
            p.sector.toLowerCase().includes(q) ||
            p.budgetNep.includes(q) ||
            String(p.budget).includes(q)
        );
    }

    // Group by sector
    const sectors = [...new Set(list.map(p => p.sector))];
    sectors.forEach(sec => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = sec;
        const secItems = list.filter(p => p.sector === sec);
        secItems.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = `[रु. ${p.budgetNep}] ${p.name}`;
            if (p.id === currentVal) opt.selected = true;
            optgroup.appendChild(opt);
        });
        sel.appendChild(optgroup);
    });
}

function populateProjectDatalist() {
    const dl = document.getElementById('listApprovedProjectNames');
    if (!dl || typeof WARD1_APPROVED_PROJECTS === 'undefined') return;
    dl.innerHTML = '';
    WARD1_APPROVED_PROJECTS.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.name;
        opt.label = `[रु. ${p.budgetNep}] ${p.sector}`;
        dl.appendChild(opt);
    });
}

function filterPlansBySector(sector, btn) {
    currentSectorFilter = sector;
    document.querySelectorAll('.sector-chip').forEach(c => c.classList.remove('active'));
    if (btn) btn.classList.add('active');
    
    const searchVal = document.getElementById('inPlanQuickSearch') ? document.getElementById('inPlanQuickSearch').value : '';
    populateApprovedPlansDropdown(searchVal, sector);
}

function onPlanSearchInput(val) {
    const btnClear = document.getElementById('btnClearPlanSearch');
    if (btnClear) btnClear.style.display = val ? 'inline-block' : 'none';
    populateApprovedPlansDropdown(val, currentSectorFilter);
}

function clearPlanSearch() {
    const inp = document.getElementById('inPlanQuickSearch');
    if (inp) inp.value = '';
    const btnClear = document.getElementById('btnClearPlanSearch');
    if (btnClear) btnClear.style.display = 'none';
    populateApprovedPlansDropdown('', currentSectorFilter);
}

function applySelectedPlan(planId) {
    if (!planId || typeof WARD1_APPROVED_PROJECTS === 'undefined') return;
    const plan = WARD1_APPROVED_PROJECTS.find(p => p.id === planId);
    if (!plan) return;

    // 1. Fill Project Details
    document.getElementById('inProjectName').value = plan.name;
    document.getElementById('inProjectArea').value = plan.sector;

    // 2. Fill Budget Details
    const formattedGrant = toNepaliDigit(plan.budget.toLocaleString('en-IN')) + '/-';
    document.getElementById('inGrantAmt').value = formattedGrant;

    // 3. Sync Budget Title
    const bTitle = document.getElementById('inBudgetTitle');
    if (bTitle) {
        bTitle.value = plan.name + ' कार्यक्रम';
        bTitle.dataset.autofilled = 'true';
    }

    // 4. Auto-calculate total cost
    calcTotalCost();

    // 5. Update Selected Plan Badge
    const badge = document.getElementById('selectedPlanBadge');
    const badgeText = document.getElementById('selectedPlanText');
    if (badge && badgeText) {
        badgeText.innerHTML = `✅ <strong>${plan.name}</strong> • बजेट: <strong>रु. ${plan.budgetNep}/-</strong> (${plan.sector})`;
        badge.style.display = 'flex';
    }

    // 6. Keep dropdown synced
    const sel = document.getElementById('selectApprovedPlan');
    if (sel) sel.value = plan.id;

    // 7. Update Live Document Preview
    updateDoc();
}

function onProjectNameInput(val) {
    if (!val || typeof WARD1_APPROVED_PROJECTS === 'undefined') return;
    const trimmed = val.trim();
    const matched = WARD1_APPROVED_PROJECTS.find(p => p.name === trimmed);
    if (matched) {
        document.getElementById('inProjectArea').value = matched.sector;
        document.getElementById('inGrantAmt').value = toNepaliDigit(matched.budget.toLocaleString('en-IN')) + '/-';
        calcTotalCost();

        const badge = document.getElementById('selectedPlanBadge');
        const badgeText = document.getElementById('selectedPlanText');
        if (badge && badgeText) {
            badgeText.innerHTML = `✅ <strong>${matched.name}</strong> • बजेट: <strong>रु. ${matched.budgetNep}/-</strong> (${matched.sector})`;
            badge.style.display = 'flex';
        }
        const sel = document.getElementById('selectApprovedPlan');
        if (sel) sel.value = matched.id;
    }
}

function clearSelectedPlan() {
    const sel = document.getElementById('selectApprovedPlan');
    if (sel) sel.value = '';
    const badge = document.getElementById('selectedPlanBadge');
    if (badge) badge.style.display = 'none';
    
    document.getElementById('inProjectName').value = '';
    document.getElementById('inProjectArea').value = '';
    document.getElementById('inGrantAmt').value = '';
    const bTitle = document.getElementById('inBudgetTitle');
    if (bTitle) {
        bTitle.value = '';
        bTitle.dataset.autofilled = 'false';
    }
    calcTotalCost();
    updateDoc();
}

function togglePlanTableModal(show) {
    const m = document.getElementById('planTableModal');
    if (m) m.style.display = show ? 'flex' : 'none';
    if (show) {
        const searchInput = document.getElementById('modalPlanSearchField');
        if (searchInput) searchInput.value = '';
        renderModalPlansTable('');
    }
}

function renderModalPlansTable(search = '') {
    const tbody = document.getElementById('modalPlanTableBody');
    if (!tbody || typeof WARD1_APPROVED_PROJECTS === 'undefined') return;
    tbody.innerHTML = '';

    const q = (search || '').trim().toLowerCase();
    const list = WARD1_APPROVED_PROJECTS.filter(p => 
        !q || 
        p.name.toLowerCase().includes(q) || 
        p.sector.toLowerCase().includes(q) ||
        p.budgetNep.includes(q) ||
        String(p.budget).includes(q)
    );

    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:16px; color:#a0aec0;">कुनै योजना भेटिएन।</td></tr>';
        return;
    }

    list.forEach((p, idx) => {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.onmouseover = () => tr.style.backgroundColor = '#f0fff4';
        tr.onmouseout = () => tr.style.backgroundColor = '';
        tr.innerHTML = `
            <td style="text-align: center; font-weight: bold; color: #4a5568;">${toNepaliDigit(idx + 1)}</td>
            <td style="font-size: 0.85rem; color: #2b6cb0; font-weight: 600;">${p.sector}</td>
            <td style="font-weight: 600; color: #1a202c;">${p.name}</td>
            <td style="text-align: right; font-weight: 700; color: #276749; white-space: nowrap;">रु. ${p.budgetNep}/-</td>
            <td style="text-align: center;">
                <button type="button" style="background: #2f855a; color: #fff; border: none; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: 600;"
                    onclick="applySelectedPlan('${p.id}'); togglePlanTableModal(false);">
                    👉 छान्नुहोस्
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ── Live Preview Updater ──────────────────────────────
function updateDoc() {
    const ay = getSelectedAY();
    const chalani = toNepaliDigit(document.getElementById('inChalani').value.trim());
    const dartaNo = toNepaliDigit(document.getElementById('inDartaNo').value.trim());
    const miti = toNepaliDigit(document.getElementById('inMiti').value.trim());
    const ns = toNepaliDigit(document.getElementById('inNepalSamvat') ? document.getElementById('inNepalSamvat').value.trim() : '११४६');

    // Project & Agreement
    const projectName = document.getElementById('inProjectName').value.trim();
    const projectArea = document.getElementById('inProjectArea').value.trim();
    const agreementDate = toNepaliDigit(document.getElementById('inAgreementDate').value.trim());
    const completionDate = toNepaliDigit(document.getElementById('inCompletionDate').value.trim());
    const allocationType = document.getElementById('inAllocationType').value.trim() || 'वडा स्तरीय';

    // Budget & Amounts
    const budgetTitle = document.getElementById('inBudgetTitle').value.trim();
    const grantAmt = document.getElementById('inGrantAmt').value.trim();
    const pubAmt = document.getElementById('inPublicParticipationAmt').value.trim();
    const totalCost = document.getElementById('inTotalCostEst').value.trim();
    const submittedBill = document.getElementById('inSubmittedBillAmt').value.trim();
    const evalAmt = document.getElementById('inEvalAmt').value.trim();
    const paymentDue = document.getElementById('inPaymentDueAmt').value.trim();

    // Decisions
    const commDecDate = toNepaliDigit(document.getElementById('inCommitteeDecisionDate').value.trim());
    const monDecDate = toNepaliDigit(document.getElementById('inMonitoringDecisionDate').value.trim());
    const evalDate = toNepaliDigit(document.getElementById('inEvalDate').value.trim());
    const wardMonDate = toNepaliDigit(document.getElementById('inWardMonitoringDate').value.trim());

    // Bank
    const payeeName = document.getElementById('inPayeeName').value.trim();
    const bankName = document.getElementById('inBankName').value.trim();
    const rawAccountNo = document.getElementById('inAccountNo').value.trim();
    const accountNo = toNepaliDigit(rawAccountNo);

    // Letterhead Update (Standard Ward 1)
    const lblAY = document.getElementById('lblAY');
    if (lblAY) lblAY.innerText = ay;
    const lblChalani = document.getElementById('lblChalani');
    if (lblChalani) lblChalani.innerText = chalani || '..........';
    const lblDarta = document.getElementById('lblDartaNo');
    if (lblDarta) lblDarta.innerText = dartaNo || '..........';
    const lblMiti = document.getElementById('lblMiti');
    if (lblMiti) lblMiti.innerText = miti || '........';
    const lblNS = document.getElementById('lblNepalSamvat');
    if (lblNS) lblNS.innerText = ns || '११४६';

    // Body Paragraph Placeholders
    const lblArea = document.getElementById('lblProjectArea');
    if (lblArea) lblArea.innerText = projectArea || '........................';

    const lblPName = document.getElementById('lblProjectName');
    if (lblPName) lblPName.innerText = projectName || '................................................';

    const lblAgDate = document.getElementById('lblAgreementDate');
    if (lblAgDate) lblAgDate.innerText = agreementDate || '................';

    const lblCompDate = document.getElementById('lblCompletionDate');
    if (lblCompDate) lblCompDate.innerText = completionDate || '................';

    // Tapasil Table Updates
    const lblBTitle = document.getElementById('lblBudgetTitle');
    if (lblBTitle) lblBTitle.innerText = budgetTitle || (projectName ? `${projectName} कार्यक्रम` : '................................................');

    const lblGrant = document.getElementById('lblGrantAmt');
    if (lblGrant) lblGrant.innerText = formatRupeeDisplay(grantAmt);

    const lblPub = document.getElementById('lblPublicParticipationAmt');
    if (lblPub) lblPub.innerText = formatRupeeDisplay(pubAmt);

    const lblTotal = document.getElementById('lblTotalCostEst');
    if (lblTotal) lblTotal.innerText = formatRupeeDisplay(totalCost);

    const lblAlloc = document.getElementById('lblAllocationType');
    if (lblAlloc) lblAlloc.innerText = allocationType;

    const lblCommDate = document.getElementById('lblCommitteeDecisionDate');
    if (lblCommDate) lblCommDate.innerText = commDecDate || '................';

    const lblMonDate = document.getElementById('lblMonitoringDecisionDate');
    if (lblMonDate) lblMonDate.innerText = monDecDate || '................';

    const lblSubBill = document.getElementById('lblSubmittedBillAmt');
    if (lblSubBill) lblSubBill.innerText = formatRupeeDisplay(submittedBill);

    const lblEvDate = document.getElementById('lblEvalDate');
    if (lblEvDate) lblEvDate.innerText = evalDate || '................';

    const lblEvAmt = document.getElementById('lblEvalAmt');
    if (lblEvAmt) lblEvAmt.innerText = evalAmt ? formatRupeeDisplay(evalAmt) : '';

    const lblWMonDate = document.getElementById('lblWardMonitoringDate');
    if (lblWMonDate) lblWMonDate.innerText = wardMonDate || '................';

    const lblPayDue = document.getElementById('lblPaymentDueAmt');
    if (lblPayDue) lblPayDue.innerText = formatRupeeDisplay(paymentDue);

    const lblBName = document.getElementById('lblBankName');
    if (lblBName) lblBName.innerText = bankName || '................................';

    const lblAcc = document.getElementById('lblAccountNo');
    if (lblAcc) lblAcc.innerText = accountNo || '................................';

    const lblPNameVal = document.getElementById('lblPayeeName');
    if (lblPNameVal) lblPNameVal.innerText = payeeName || '................................';

    // Signatory
    const signSelect = document.getElementById('inSignAuthority').value;
    let sigName = "", sigTitle = "";
    const lblSigName = document.getElementById('lblSigName');
    const lblSigTitle = document.getElementById('lblSigTitle');
    const lblSigRole = document.getElementById('lblSigRole');

    if (signSelect === 'BLANK') {
        sigName = "";
        sigTitle = "";
        if (lblSigName) lblSigName.style.borderTop = "none";
        if (lblSigRole) lblSigRole.style.display = "none";
    } else {
        if (lblSigName) lblSigName.style.borderTop = "1.5px dashed #000";
        if (lblSigRole) {
            lblSigRole.style.display = "block";
            lblSigRole.innerText = "पेश गर्ने";
        }
        if (signSelect === 'CUSTOM') {
            sigName = document.getElementById('inCustomSignName').value.trim() || '....................';
            sigTitle = document.getElementById('inCustomSignTitle').value.trim() || '....................';
        } else {
            const parts = signSelect.split('|');
            sigName = parts[0] || '';
            sigTitle = parts[1] || '';
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
        let bsMonthVal = 6;
        let bsDayVal = 22;

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
            if (typeof bsDate === 'string') {
                const parts = bsDate.split(/[-/]/);
                bsYearVal = parseInt(parts[0], 10);
                bsMonthVal = parseInt(parts[1], 10);
                bsDayVal = parseInt(parts[2], 10);
            } else if (bsDate && typeof bsDate === 'object') {
                bsYearVal = bsDate.bsYear || bsDate.year || 2083;
                bsMonthVal = bsDate.bsMonth || bsDate.month || 6;
                bsDayVal = bsDate.bsDay || bsDate.day || 22;
            }

            const bsYear = bsYearVal;
            const bsMonth = String(bsMonthVal).padStart(2, '0');
            const bsDay = String(bsDayVal).padStart(2, '0');
            nepaliBSDateStr = toNepaliDigit(`${bsYear}-${bsMonth}-${bsDay}`);
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
            nepaliBSDateStr = toNepaliDigit(`${bsYearVal}-${bsMStr}-${bsDStr}`);
        }

        initializeFiscalYear(bsYearVal, bsMonthVal);

        const inMiti = document.getElementById('inMiti');
        if (inMiti) inMiti.value = nepaliBSDateStr;

        updateDoc();
    } catch (e) {}
}

function formatFiscalYear(startYear) {
    const endYear = startYear + 1;
    const endYearSuffix = String(endYear).slice(-2);
    const startYearSuffix = String(startYear).slice(-2);
    return toNepaliDigit(`०${startYearSuffix}/${endYearSuffix}`);
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

// ── Print & Save ──────────────────────────────────────
async function printAndSaveSystem() {
    const projectName = document.getElementById('inProjectName').value.trim();
    const budgetTitle = document.getElementById('inBudgetTitle').value.trim();
    const payeeName = document.getElementById('inPayeeName').value.trim();

    if (!projectName && !budgetTitle && !payeeName) {
        alert("कृपया योजनाको नाम, बजेट शीर्षक वा भुक्तानी पाउनेको नाम कम्तीमा एउटा विवरण लेख्नुहोस् ।");
        document.getElementById('inProjectName').focus();
        return;
    }

    const recordId = document.getElementById('editRecordIndex').value;

    const obj = {
        ay:                     getSelectedAY(),
        chalani:                document.getElementById('inChalani').value.trim() || '-',
        dartaNo:                document.getElementById('inDartaNo').value.trim() || '-',
        miti:                   document.getElementById('inMiti').value.trim() || '-',
        nepalSamvat:            document.getElementById('inNepalSamvat') ? document.getElementById('inNepalSamvat').value.trim() : '११४६',
        projectName:            projectName,
        name:                   projectName || budgetTitle || payeeName, // Standard search alias
        projectArea:            document.getElementById('inProjectArea').value.trim() || '',
        agreementDate:          document.getElementById('inAgreementDate').value.trim() || '',
        completionDate:         document.getElementById('inCompletionDate').value.trim() || '',
        allocationType:         document.getElementById('inAllocationType').value.trim() || 'वडा स्तरीय',
        budgetTitle:            budgetTitle,
        grantAmt:               document.getElementById('inGrantAmt').value.trim() || '',
        pubAmt:                 document.getElementById('inPublicParticipationAmt').value.trim() || '',
        totalCost:              document.getElementById('inTotalCostEst').value.trim() || '',
        submittedBill:          document.getElementById('inSubmittedBillAmt').value.trim() || '',
        evalAmt:                document.getElementById('inEvalAmt').value.trim() || '',
        paymentDue:             document.getElementById('inPaymentDueAmt').value.trim() || '',
        commDecDate:            document.getElementById('inCommitteeDecisionDate').value.trim() || '',
        monDecDate:             document.getElementById('inMonitoringDecisionDate').value.trim() || '',
        evalDate:               document.getElementById('inEvalDate').value.trim() || '',
        wardMonDate:            document.getElementById('inWardMonitoringDate').value.trim() || '',
        payeeName:              payeeName,
        bankName:               document.getElementById('inBankName').value.trim() || '',
        accountNo:              document.getElementById('inAccountNo').value.trim() || '',
        signAuth:               document.getElementById('inSignAuthority').value,
        customSignName:         document.getElementById('inCustomSignName').value.trim(),
        customSignTitle:        document.getElementById('inCustomSignTitle').value.trim(),
        sigMargin:              document.getElementById('inSigMargin').value,
        type:                   'वडा स्तरीय योजना टिप्पणी-आदेश',
        createdBy:              localStorage.getItem('sifarish_user') || 'wada1',
        createdWard:            localStorage.getItem('sifarish_ward') || '1',
        timestamp:              Date.now()
    };

    const btn = document.querySelector('.btn-print');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = "⏳ सुरक्षित हुँदैछ...";
    }

    try {
        if (recordId !== "") {
            await db.collection("yojanaTippaniRecords").doc(recordId).update(obj);
        } else {
            const docRef = await db.collection("yojanaTippaniRecords").add(obj);
            document.getElementById('editRecordIndex').value = docRef.id;
            document.getElementById('formMainTitle').innerText = "🔄 सम्पादन मोड: " + (projectName || budgetTitle);
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
    return toNepaliDigit(`${y}/${m}/${day}`);
}

// ── Database Operations ───────────────────────────────
function renderDatabaseTable() {
    const tbody = document.getElementById('dbTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const query = document.getElementById('searchField').value.trim().toLowerCase();

    const filtered = globalDatabase.filter(rec => {
        if (!query) return true;
        const pName = (rec.projectName || '').toLowerCase();
        const bTitle = (rec.budgetTitle || '').toLowerCase();
        const payee = (rec.payeeName || '').toLowerCase();
        const chalani = (rec.chalani || '').toLowerCase();
        const darta = (rec.dartaNo || '').toLowerCase();
        const bName = (rec.bankName || '').toLowerCase();
        const acc = (rec.accountNo || '').toLowerCase();

        return pName.includes(query) ||
               bTitle.includes(query) ||
               payee.includes(query) ||
               chalani.includes(query) ||
               darta.includes(query) ||
               bName.includes(query) ||
               acc.includes(query);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:18px; color:#a0aec0;">कुनै रेकर्ड भेटिएन ।</td></tr>`;
        return;
    }

    filtered.forEach((rec, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${toNepaliDigit(index + 1)}</td>
            <td><b>${rec.projectName || rec.budgetTitle || '-'}</b></td>
            <td>${rec.payeeName || '-'}</td>
            <td>${rec.paymentDue ? formatRupeeDisplay(rec.paymentDue) : '-'}</td>
            <td>${rec.miti || formatTimestamp(rec.timestamp)}</td>
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
    document.getElementById('formMainTitle').innerText = "🔄 सम्पादन मोड: " + (rec.projectName || rec.budgetTitle || '');

    // Letterhead
    const inPS = document.getElementById('inPatraSankhya');
    if (inPS) inPS.value = rec.ay || '०८३/८४';
    document.getElementById('inChalani').value = rec.chalani !== '-' ? rec.chalani : '';
    document.getElementById('inDartaNo').value = rec.dartaNo !== '-' ? rec.dartaNo : '';
    document.getElementById('inMiti').value = rec.miti !== '-' ? rec.miti : '';
    const inNS = document.getElementById('inNepalSamvat');
    if (inNS) inNS.value = rec.nepalSamvat || '११४६';

    // Project
    document.getElementById('inProjectName').value = rec.projectName || '';
    document.getElementById('inProjectArea').value = rec.projectArea || '';
    document.getElementById('inAgreementDate').value = rec.agreementDate || '';
    document.getElementById('inCompletionDate').value = rec.completionDate || '';
    document.getElementById('inAllocationType').value = rec.allocationType || 'वडा स्तरीय';

    // Budget
    document.getElementById('inBudgetTitle').value = rec.budgetTitle || '';
    document.getElementById('inGrantAmt').value = rec.grantAmt || '';
    document.getElementById('inPublicParticipationAmt').value = rec.pubAmt || '';
    document.getElementById('inTotalCostEst').value = rec.totalCost || '';
    document.getElementById('inSubmittedBillAmt').value = rec.submittedBill || '';
    document.getElementById('inEvalAmt').value = rec.evalAmt || '';
    document.getElementById('inPaymentDueAmt').value = rec.paymentDue || '';

    // Decisions
    document.getElementById('inCommitteeDecisionDate').value = rec.commDecDate || '';
    document.getElementById('inMonitoringDecisionDate').value = rec.monDecDate || '';
    document.getElementById('inEvalDate').value = rec.evalDate || '';
    document.getElementById('inWardMonitoringDate').value = rec.wardMonDate || '';

    // Bank
    document.getElementById('inPayeeName').value = rec.payeeName || '';
    document.getElementById('inBankName').value = rec.bankName || '';
    document.getElementById('inAccountNo').value = rec.accountNo || '';
    syncBankRadioFromValue(rec.bankName || '');

    // Signatory
    document.getElementById('inSignAuthority').value = rec.signAuth || 'अनिता अधिकारी|वडा सचिव';
    document.getElementById('inCustomSignName').value = rec.customSignName || '';
    document.getElementById('inCustomSignTitle').value = rec.customSignTitle || '';
    toggleCustomSign();

    const margin = rec.sigMargin || '8';
    document.getElementById('inSigMargin').value = margin;
    adjustSignaturePosition(margin);

    updateDoc();

    // Sync Preset Plan selection badge if matches
    if (typeof WARD1_APPROVED_PROJECTS !== 'undefined') {
        const matched = WARD1_APPROVED_PROJECTS.find(p => p.name === (rec.projectName || '').trim());
        if (matched) {
            const sel = document.getElementById('selectApprovedPlan');
            if (sel) sel.value = matched.id;
            const badge = document.getElementById('selectedPlanBadge');
            const badgeText = document.getElementById('selectedPlanText');
            if (badge && badgeText) {
                badgeText.innerHTML = `✅ <strong>${matched.name}</strong> • बजेट: <strong>रु. ${matched.budgetNep}/-</strong> (${matched.sector})`;
                badge.style.display = 'flex';
            }
        } else {
            const badge = document.getElementById('selectedPlanBadge');
            if (badge) badge.style.display = 'none';
            const sel = document.getElementById('selectApprovedPlan');
            if (sel) sel.value = '';
        }
    }

    const btnNew = document.getElementById('btnNewForm');
    if (btnNew) btnNew.style.display = 'inline-block';
    toggleModal(false);
}

async function deleteRecord(id) {
    const rec = globalDatabase.find(r => r.id === id);
    if (!rec) return;

    if (!confirm(`के तपाईं "${rec.projectName || rec.budgetTitle || 'यो रेकर्ड'}" लाई रद्दीको टोकरीमा पठाउन चाहनुहुन्छ?`)) {
        return;
    }

    try {
        if (typeof window.softDeleteRecord === 'function') {
            await window.softDeleteRecord('yojanaTippaniRecords', id, {
                title: rec.projectName || rec.budgetTitle || 'योजना टिप्पणी-आदेश',
                name: rec.payeeName || rec.projectName || '',
                projectName: rec.projectName || '',
                budgetTitle: rec.budgetTitle || '',
                payeeName: rec.payeeName || '',
                chalani: rec.chalani || '',
                dartaNo: rec.dartaNo || '',
                type: 'वडा स्तरीय योजना टिप्पणी-आदेश'
            });
        } else {
            await db.collection("yojanaTippaniRecords").doc(id).delete();
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
    adjustSignaturePosition(10);

    const inSig = document.getElementById('inSignAuthority');
    if (inSig) {
        inSig.value = 'अनिता अधिकारी|वडा सचिव';
    }
    toggleCustomSign();

    const savedFontSize = localStorage.getItem('tippani_custom_fontsize') || '11';
    const fsSlider = document.getElementById('inTippaniFontSize');
    if (fsSlider) {
        fsSlider.value = savedFontSize;
    }
    adjustTippaniFontSize(savedFontSize);

    initApprovedPlansUI();
    updateBankRadioVisuals();
    syncBankRadioFromValue(document.getElementById('inBankName').value.trim());

    updateDoc();
};

window.addEventListener('templateInjected', function () {
    initializeAutomaticDate();
});
