// ══════════════════════════════════════════════════════════════
//  script-surakshya-sanrakshak-test.js
//  संरक्षक सामाजिक सुरक्षा सिफारिस टेस्ट — Firebase Firestore Logic
//  Ward No. 1, Gauradaha Municipality, Jhapa
//  Sequential Counter starting at 100, 3-Page Document Generation
// ══════════════════════════════════════════════════════════════

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
window.globalDatabase = globalDatabase;

// ── Social Security Beneficiary Register State (Excel / Firestore) ──
const BENEFICIARY_CACHE_KEY = 'ss_beneficiaries_registry_v2';
const BENEFICIARY_CACHE_TIME_KEY = 'ss_beneficiaries_meta_v2';
const CACHE_TTL_MS = 2 * 60 * 60 * 1000;

let beneficiaryRegister = [];
let isBeneficiaryRegisterLoaded = false;
let beneficiaryLoadPromise = null;
let selectedBeneficiaryCardNo = '';
let searchDebounceTimer = null;
let beneficiarySearchSequence = 0;
window.beneficiaryRegister = beneficiaryRegister;

let currentArchivePage = 1;
const ARCHIVE_PAGE_SIZE = 25;
let archiveSearchDebounceTimer = null;
let isSavingInProgress = false;
let activePreviewTab = 1; // 1, 2, 3, or 'all'

// ── Devanagari Digit Helper ──
function toNepaliDigit(num) {
    if (num === null || num === undefined) return '';
    const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return String(num).replace(/[0-9]/g, d => nepaliDigits[d]);
}

function toEnglishDigit(str) {
    if (str === null || str === undefined) return '';
    const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    let res = String(str);
    for (let i = 0; i < 10; i++) {
        res = res.split(nepaliDigits[i]).join(String(i));
    }
    return res;
}

function normalizeDevanagari(text) {
    if (!text) return '';
    return String(text)
        .normalize('NFC')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .trim()
        .toLowerCase();
}

function preIndexRecord(rec) {
    const bName = String(rec.beneficiaryName || rec.name || '').trim();
    const gName = String(rec.guardianName || '').trim();
    const acc = String(rec.accountNo || '').trim();
    const card = String(rec.cardNo || '').trim();
    const chalani = String(rec.chalani || '').trim();
    const miti = String(rec.miti || '').trim();
    const recNo = String(rec.recommendationNo || '').trim();

    rec._search = {
        bNameNorm: normalizeDevanagari(bName),
        gNameNorm: normalizeDevanagari(gName),
        accClean: acc.toLowerCase(),
        accEn: toEnglishDigit(acc).toLowerCase(),
        accNe: toNepaliDigit(acc),
        cardClean: card.toLowerCase(),
        cardEn: toEnglishDigit(card).toLowerCase(),
        cardNe: toNepaliDigit(card),
        recNoEn: toEnglishDigit(recNo),
        recNoNe: toNepaliDigit(recNo),
        chalaniClean: chalani.toLowerCase(),
        chalaniEn: toEnglishDigit(chalani).toLowerCase(),
        chalaniNe: toNepaliDigit(chalani),
        mitiClean: miti.toLowerCase()
    };
    return rec;
}

// ── Realtime Listener for surakshyaSanrakshakTestRecords ──
(window._firebaseAuthReady || Promise.resolve()).then(() => {
    db.collection("surakshyaSanrakshakTestRecords").onSnapshot((snapshot) => {
        globalDatabase = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (!data.isDeleted) {
                globalDatabase.push(preIndexRecord({ id: doc.id, ...data }));
            }
        });
        globalDatabase.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        const modal = document.getElementById('abhilekhModal');
        if (modal && modal.style.display === 'flex') {
            renderDatabaseTable();
        }
    });

    loadBeneficiaryRegister();
}).catch(() => {});

// ── Fiscal Year Dropdown Setup ──
function populateFiscalYearDropdown() {
    const selPatra = document.getElementById('inPatraSankhya');
    if (!selPatra) return;
    const currentYear = 2083;
    const years = [
        `२०८३/०८४`,
        `२०८४/०८५`,
        `२०८२/०८३`,
        `२०८१/०८२`
    ];
    selPatra.innerHTML = '';
    years.forEach(y => {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        selPatra.appendChild(opt);
    });
    selPatra.value = `२०८३/०८४`;
}

// ── Date and Nepal Sambat Automatic Initialization ──
function initDefaultDate() {
    const mitiInput = document.getElementById('inMiti');
    if (!mitiInput) return;
    if (mitiInput.value && mitiInput.value.trim() !== '') return;

    try {
        if (typeof NepaliFunctions !== 'undefined' && NepaliFunctions.GetCurrentBsDate) {
            const curDate = NepaliFunctions.GetCurrentBsDate();
            const y = toNepaliDigit(curDate.year);
            const m = toNepaliDigit(String(curDate.month).padStart(2, '0'));
            const d = toNepaliDigit(String(curDate.day).padStart(2, '0'));
            mitiInput.value = `${y}/${m}/${d}`;
        } else {
            mitiInput.value = '२०८३/०२/१८';
        }
    } catch (e) {
        mitiInput.value = '२०८३/०२/१८';
    }
    updateNepalSambatFromMiti();
}

function updateNepalSambatFromMiti() {
    const mitiVal = document.getElementById('inMiti').value.trim();
    const nsInput = document.getElementById('inNepalSamvat');
    if (!mitiVal) {
        if (nsInput) nsInput.value = '';
        return;
    }

    try {
        if (typeof window.getOfficialNepalSambatTithi === 'function') {
            const result = window.getOfficialNepalSambatTithi(mitiVal);
            if (result && result.year) {
                const nsFormatted = `${result.year} ${result.monthAndPaksha || ''} ${result.dayName || ''} ${result.dayNumber || ''}`.replace(/\s+/g, ' ').trim();
                if (nsInput) nsInput.value = nsFormatted;
                return;
            }
        }
        if (nsInput && !nsInput.value) {
            nsInput.value = '११४६';
        }
    } catch (e) {
        if (nsInput && !nsInput.value) nsInput.value = '११४६';
    }
}

// ── Atomic Sequence Number Allocation (Starts at 100) ──
async function allocateNextSeqNumber() {
    try {
        const counterRef = db.collection('sifarish_counters').doc('guardian_test_seq');
        const assignedSeq = await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(counterRef);
            let nextSeq = 100;
            if (doc.exists) {
                const data = doc.data();
                if (typeof data.currentSeq === 'number' && data.currentSeq >= 100) {
                    nextSeq = data.currentSeq + 1;
                }
            }
            // Reconcile with existing records in globalDatabase to guarantee no duplicates
            const maxExisting = globalDatabase.reduce((max, r) => {
                const n = parseInt(toEnglishDigit(r.recommendationNo || 0), 10);
                return !isNaN(n) && n > max ? n : max;
            }, 99);
            if (maxExisting >= nextSeq) {
                nextSeq = maxExisting + 1;
            }

            transaction.set(counterRef, {
                currentSeq: nextSeq,
                lastIssuedAt: firebase.firestore.FieldValue.serverTimestamp(),
                ward: "1",
                module: "guardian_social_security_test"
            }, { merge: true });

            return nextSeq;
        });
        return assignedSeq;
    } catch (err) {
        console.warn("Firestore transaction failed, applying memory reconciliation fallback:", err);
        let maxSeq = 99;
        globalDatabase.forEach(r => {
            const n = parseInt(toEnglishDigit(r.recommendationNo || 0), 10);
            if (!isNaN(n) && n > maxSeq) maxSeq = n;
        });
        const fallbackSeq = maxSeq + 1;
        try {
            await db.collection('sifarish_counters').doc('guardian_test_seq').set({
                currentSeq: fallbackSeq,
                lastIssuedAt: firebase.firestore.FieldValue.serverTimestamp(),
                ward: "1",
                module: "guardian_social_security_test"
            }, { merge: true });
        } catch (e) {}
        return fallbackSeq;
    }
}

// ── DOM Update Function: Synchronizes Form to All 3 Pages ──
function updateDoc() {
    const getVal = (id, def = '') => {
        const el = document.getElementById(id);
        return el ? (el.value.trim() || def) : def;
    };
    const setTxt = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    };

    const patraSankhya = getVal('inPatraSankhya', '२०८३/०८४');
    const chalani = getVal('inChalani', '');
    const miti = getVal('inMiti', '२०८३/०२/१८');
    const ns = getVal('inNepalSamvat', '११४६');
    const fiscalYear = getVal('selFiscalYear', patraSankhya);
    const quarter = getVal('selQuarter', 'प्रथम त्रैमासिक');

    // Recommendation Number display
    const editRecId = getVal('editRecordIndex', '');
    let displayRecNo = '१००';
    if (editRecId !== '') {
        const existingRec = globalDatabase.find(r => r.id === editRecId);
        if (existingRec && existingRec.recommendationNo) {
            displayRecNo = toNepaliDigit(existingRec.recommendationNo);
        }
    }
    const badgeRecNo = document.getElementById('badgeRecNoDisplay');
    if (badgeRecNo) {
        badgeRecNo.innerText = editRecId ? `नं. ${displayRecNo}` : 'स्वतः उत्पन्न हुने (१०० बाट सुरु)';
    }

    // Beneficiary Details
    const beneficiaryName = getVal('inBeneficiaryName', '..................');
    const beneficiaryCit = getVal('inBeneficiaryCitNo', '');
    const cardNo = getVal('inCardNo', '..................');
    const accountNo = getVal('inAccountNo', '..................');
    const condition = getVal('inConditionDetail', 'वृद्ध तथा अशक्त भई हिँडडुल गर्न असमर्थ');
    const benefitCategory = getVal('selBenefitCategory', 'जेष्ठ नागरिक');

    // Guardian Details
    const guardianName = getVal('inGuardianName', '..................');
    const selRel = getVal('selRelation', 'छोरा');
    const customRel = getVal('inCustomRelation', '');
    const relation = (selRel === 'अन्य' || selRel === 'CUSTOM') ? (customRel || 'संरक्षक') : selRel;
    const guardianAddress = getVal('inGuardianAddress', 'गौरादह नगरपालिका वडा नं. १, झापा');
    const guardianPhone = getVal('inGuardianPhone', '..................');
    const guardianCitNo = getVal('inGuardianCitNo', '..................');
    const guardianCitDistrict = getVal('inGuardianCitDistrict', 'झापा');
    const guardianNid = getVal('inGuardianNid', '');

    // Signatures
    // Secretary (Page 1 Left)
    const secSelect = getVal('inSecretarySelect', 'अनिता अधिकारी|वडा सचिव');
    let secName = 'अनिता अधिकारी';
    let secTitle = 'वडा सचिव';
    if (secSelect === 'CUSTOM') {
        secName = getVal('inCustomSecretaryName', '..................');
        secTitle = getVal('inCustomSecretaryTitle', 'वडा सचिव');
    } else if (secSelect === 'BLANK') {
        secName = '';
        secTitle = 'वडा सचिव';
    } else if (secSelect.includes('|')) {
        const parts = secSelect.split('|');
        secName = parts[0] || 'अनिता अधिकारी';
        secTitle = parts[1] || 'वडा सचिव';
    }

    // Chairperson (Page 1 Right, and Page 3)
    const signAuth = getVal('inSignAuthority', 'नगेन्द्र भण्डारी|वडा अध्यक्ष');
    let chairName = 'नगेन्द्र भण्डारी';
    let chairTitle = 'वडा अध्यक्ष';
    if (signAuth === 'CUSTOM') {
        chairName = getVal('inCustomSignName', '..................');
        chairTitle = getVal('inCustomSignTitle', 'वडा अध्यक्ष');
    } else if (signAuth === 'BLANK') {
        chairName = '';
        chairTitle = 'वडा अध्यक्ष';
    } else if (signAuth.includes('|')) {
        const parts = signAuth.split('|');
        chairName = parts[0] || 'नगेन्द्र भण्डारी';
        chairTitle = parts[1] || 'वडा अध्यक्ष';
    }

    // ──────────────────────────────────────────
    // 1. UPDATE PAGE 1 (Bank Recommendation)
    // ──────────────────────────────────────────
    setTxt('lblPatraSankhya', patraSankhya);
    setTxt('lblAY', patraSankhya);
    setTxt('lblChalani', toNepaliDigit(chalani));
    setTxt('lblMiti', miti);
    setTxt('lblNepalSamvat', ns);

    setTxt('lblBankName', 'कृषि विकास बैंक लिमिटेड');
    setTxt('lblBankBranch', 'शाखा कार्यालय, गौरादह, झापा');
    setTxt('lblSubject', 'सामाजिक सुरक्षा भत्ताको रकम संरक्षकलाई उपलब्ध गराइदिने बारे ।');

    setTxt('lblP1GuardianName', guardianName);
    setTxt('lblP1GuardianName2', guardianName);
    setTxt('lblP1Relation', relation);
    setTxt('lblP1BeneficiaryName', beneficiaryName);
    setTxt('lblP1Condition', condition);
    setTxt('lblP1RecNo', displayRecNo);
    setTxt('lblP1AY', fiscalYear);
    setTxt('lblP1Quarter', quarter); // CRITICAL SINGLE QUARTER RULE

    // Tapasil
    setTxt('lblP1TblBeneficiaryName', beneficiaryName);
    setTxt('lblP1TblCardNo', cardNo);
    setTxt('lblP1TblAccountNo', accountNo);
    setTxt('lblP1TblGuardianName', guardianName);

    const rowCit1 = document.getElementById('rowP1TblBeneficiaryCit');
    if (rowCit1) {
        if (beneficiaryCit) {
            rowCit1.style.display = 'table-row';
            setTxt('lblP1TblBeneficiaryCit', beneficiaryCit);
        } else {
            rowCit1.style.display = 'none';
        }
    }

    // Signatures Page 1 (Secretary LEFT, Chairperson RIGHT)
    setTxt('lblP1SecName', secName);
    setTxt('lblP1SecTitle', secTitle);
    setTxt('lblP1ChairName', chairName);
    setTxt('lblP1ChairTitle', chairTitle);

    // ──────────────────────────────────────────
    // 2. UPDATE PAGE 2 (Applicant's Request)
    // ──────────────────────────────────────────
    setTxt('lblP2Miti', miti);
    setTxt('lblP2GuardianName', guardianName);
    setTxt('lblP2GuardianCitNo', guardianCitNo);
    setTxt('lblP2GuardianCitDistrict', guardianCitDistrict);
    setTxt('lblP2Relation', relation);
    setTxt('lblP2BeneficiaryName', beneficiaryName);
    setTxt('lblP2Condition', condition);
    setTxt('lblP2AY', fiscalYear);
    setTxt('lblP2Quarter', quarter); // CRITICAL SINGLE QUARTER RULE

    // Two-Column details
    setTxt('lblP2CardBeneficiaryName', beneficiaryName);
    setTxt('lblP2CardCardNo', cardNo);
    setTxt('lblP2CardAccountNo', accountNo);

    const rowCit2 = document.getElementById('rowP2BeneficiaryCit');
    if (rowCit2) {
        if (beneficiaryCit) {
            rowCit2.style.display = 'block';
            setTxt('lblP2CardBeneficiaryCit', beneficiaryCit);
        } else {
            rowCit2.style.display = 'none';
        }
    }

    setTxt('lblP2CardGuardianName', guardianName);
    setTxt('lblP2CardRelation', relation);
    setTxt('lblP2CardAddress', guardianAddress);
    setTxt('lblP2CardPhone', guardianPhone);
    setTxt('lblP2CardCitNo', guardianCitNo);

    const rowNid2 = document.getElementById('rowP2CardNid');
    if (rowNid2) {
        if (guardianNid) {
            rowNid2.style.display = 'block';
            setTxt('lblP2CardNid', guardianNid);
        } else {
            rowNid2.style.display = 'none';
        }
    }

    // ──────────────────────────────────────────
    // 3. UPDATE PAGE 3 (Official Schedule 2)
    // ──────────────────────────────────────────
    setTxt('lblP3RecNo', displayRecNo);
    setTxt('lblP3Miti', miti);
    setTxt('lblP3CardNo', cardNo);
    setTxt('lblP3Category', benefitCategory);
    setTxt('lblP3BeneficiaryName', beneficiaryName);
    setTxt('lblP3Condition', condition);

    // Schedule 2 Details
    setTxt('lblP3GuardianName', guardianName);
    setTxt('lblP3GuardianAddress', guardianAddress);
    setTxt('lblP3Relation', relation);
    setTxt('lblP3GuardianPhone', guardianPhone);
    setTxt('lblP3GuardianNid', guardianNid || '-');
    setTxt('lblP3GuardianCitNo', guardianCitNo);
    setTxt('lblP3GuardianCitDistrict', guardianCitDistrict);

    setTxt('lblP3ChairName', chairName);
    setTxt('lblP3ChairTitle', `(${chairTitle})`);
    setTxt('lblP3ValidityAY', fiscalYear);

    toggleSecretaryVisibility();
}

// ── Preview Tab Switching ──
function switchPreviewPage(page) {
    activePreviewTab = page;
    const tabs = ['tabBtnP1', 'tabBtnP2', 'tabBtnP3', 'tabBtnAll'];
    tabs.forEach(t => {
        const btn = document.getElementById(t);
        if (btn) btn.classList.remove('active');
    });

    const p1 = document.getElementById('page1');
    const p2 = document.getElementById('page2');
    const p3 = document.getElementById('page3');

    if (page === 1) {
        document.getElementById('tabBtnP1').classList.add('active');
        if (p1) p1.style.display = 'flex';
        if (p2) p2.style.display = 'none';
        if (p3) p3.style.display = 'none';
    } else if (page === 2) {
        document.getElementById('tabBtnP2').classList.add('active');
        if (p1) p1.style.display = 'none';
        if (p2) p2.style.display = 'flex';
        if (p3) p3.style.display = 'none';
    } else if (page === 3) {
        document.getElementById('tabBtnP3').classList.add('active');
        if (p1) p1.style.display = 'none';
        if (p2) p2.style.display = 'none';
        if (p3) p3.style.display = 'flex';
    } else {
        document.getElementById('tabBtnAll').classList.add('active');
        if (p1) p1.style.display = 'flex';
        if (p2) p2.style.display = 'flex';
        if (p3) p3.style.display = 'flex';
    }
}

// ── Single Page Print Action ──
function printSingleCurrentPage() {
    let p = activePreviewTab;
    if (p === 'all') p = 1;

    document.body.classList.remove('print-p1-only', 'print-p2-only', 'print-p3-only');
    document.body.classList.add(`print-p${p}-only`);

    window.print();

    // Revert print classes
    setTimeout(() => {
        document.body.classList.remove('print-p1-only', 'print-p2-only', 'print-p3-only');
    }, 1000);
}

// ── Relations Dropdown ──
function handleRelationChange() {
    const sel = document.getElementById('selRelation').value;
    const box = document.getElementById('customRelationGroup');
    if (box) {
        box.style.display = (sel === 'अन्य') ? 'block' : 'none';
    }
}

// ── Ward Secretary Signature Toggle (वडा सचिवको हस्ताक्षर देखाउने/लुकाउने) ──
function toggleSecretaryVisibility() {
    const chk = document.getElementById('chkShowSecretary');
    const show = chk ? chk.checked : true;
    const p1SecBlock = document.getElementById('p1SecSignatureBlock');
    const p1ChairBlock = document.getElementById('p1ChairSignatureBlock');
    const secConfigGroup = document.getElementById('secretaryConfigGroup');

    if (show) {
        document.body.classList.remove('hide-p1-secretary');
        if (p1SecBlock) p1SecBlock.style.display = 'block';
        if (p1ChairBlock) p1ChairBlock.style.marginLeft = '';
        if (secConfigGroup) secConfigGroup.style.opacity = '1';
    } else {
        document.body.classList.add('hide-p1-secretary');
        if (p1SecBlock) p1SecBlock.style.display = 'none';
        if (p1ChairBlock) p1ChairBlock.style.marginLeft = 'auto';
        if (secConfigGroup) secConfigGroup.style.opacity = '0.6';
    }
}

// ── Secretary Dropdown ──
function handleSecretaryChange() {
    const sel = document.getElementById('inSecretarySelect').value;
    const box = document.getElementById('customSecretaryBox');
    if (box) {
        box.style.display = (sel === 'CUSTOM') ? 'grid' : 'none';
    }
}

// ── Chairperson Dropdown ──
function toggleCustomSign() {
    const val = document.getElementById('inSignAuthority').value;
    const customBox = document.getElementById('customSignBox');
    if (customBox) {
        customBox.style.display = (val === 'CUSTOM') ? 'grid' : 'none';
    }
}

// ── Officer Signature Vertical Position Controls ──
function onSecPosYChange(val) {
    const v = parseInt(val, 10) || 0;
    const badge = document.getElementById('badgeSecPosY');
    if (badge) badge.textContent = `${v} mm`;
    const slider = document.getElementById('sliderSecPosY');
    if (slider && slider.value !== String(v)) slider.value = v;

    const block = document.getElementById('p1SecSignatureBlock');
    if (block) {
        block.style.setProperty('--sec-sig-offset-y', `${v}mm`);
        block.style.transform = `translateY(${v}mm)`;
    }
    document.documentElement.style.setProperty('--sec-sig-offset-y', `${v}mm`);
    const page1 = document.getElementById('page1');
    if (page1) page1.style.setProperty('--sec-sig-offset-y', `${v}mm`);
}

function onChairPosYChange(val) {
    const v = parseInt(val, 10) || 0;
    const badge = document.getElementById('badgeChairPosY');
    if (badge) badge.textContent = `${v} mm`;
    const slider = document.getElementById('sliderChairPosY');
    if (slider && slider.value !== String(v)) slider.value = v;

    const block = document.getElementById('p1ChairSignatureBlock');
    if (block) {
        block.style.setProperty('--chair-sig-offset-y', `${v}mm`);
        block.style.transform = `translateY(${v}mm)`;
    }
    document.documentElement.style.setProperty('--chair-sig-offset-y', `${v}mm`);
    const page1 = document.getElementById('page1');
    if (page1) page1.style.setProperty('--chair-sig-offset-y', `${v}mm`);
}

function resetSecPosition() {
    onSecPosYChange(0);
}

function resetChairPosition() {
    onChairPosYChange(0);
}

function resetOfficerPositions() {
    resetSecPosition();
    resetChairPosition();
}

// ── Print & Save Workflow (Normalized Single Record) ──
async function printAndSaveSystem() {
    const beneficiaryName = document.getElementById('inBeneficiaryName').value.trim();
    if (!beneficiaryName) {
        alert("कृपया सामाजिक सुरक्षा लाभग्राहीको नाम, थर अनिवार्य लेख्नुहोस् ।");
        document.getElementById('inBeneficiaryName').focus();
        return;
    }

    const guardianName = document.getElementById('inGuardianName').value.trim();
    if (!guardianName) {
        alert("कृपया रकम बुझ्ने संरक्षकको नाम, थर अनिवार्य लेख्नुहोस् ।");
        document.getElementById('inGuardianName').focus();
        return;
    }

    if (isSavingInProgress) return;
    isSavingInProgress = true;

    const btn = document.querySelector('.btn-print');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = "⏳ सुरक्षित हुँदैछ...";
    }

    try {
        const recordId = document.getElementById('editRecordIndex').value;
        const selRel = document.getElementById('selRelation') ? document.getElementById('selRelation').value : 'छोरा';
        const customRel = document.getElementById('inCustomRelation') ? document.getElementById('inCustomRelation').value.trim() : '';
        const relation = (selRel === 'अन्य' || selRel === 'CUSTOM') ? (customRel || 'संरक्षक') : selRel;

        const fiscalYear = document.getElementById('selFiscalYear') ? document.getElementById('selFiscalYear').value : '२०८३/०८४';
        const quarter = document.getElementById('selQuarter') ? document.getElementById('selQuarter').value : 'प्रथम त्रैमासिक';

        // Check or allocate sequential recommendation number
        let recNumber = 100;
        if (recordId !== "") {
            const existing = globalDatabase.find(r => r.id === recordId);
            if (existing && existing.recommendationNo) {
                recNumber = existing.recommendationNo;
            }
        } else {
            recNumber = await allocateNextSeqNumber();
        }

        const obj = {
            recommendationNo:     recNumber,
            ay:                   document.getElementById('inPatraSankhya').value.trim() || '२०८३/०८४',
            chalani:              document.getElementById('inChalani').value.trim() || '-',
            miti:                 document.getElementById('inMiti').value.trim() || '-',
            ns:                   document.getElementById('inNepalSamvat').value.trim() || '-',
            fiscalYear:           fiscalYear,
            quarter:              quarter, // Single selected quarter
            bankName:             'कृषि विकास बैंक लिमिटेड',
            bankBranch:           'गौरादह शाखा, झापा',
            subject:              'सामाजिक सुरक्षा भत्ताको रकम संरक्षकलाई उपलब्ध गराइदिने बारे ।',
            beneficiaryName:      beneficiaryName,
            name:                 beneficiaryName,
            beneficiaryCitNo:     document.getElementById('inBeneficiaryCitNo').value.trim(),
            cardNo:               document.getElementById('inCardNo').value.trim(),
            benefitCategory:      document.getElementById('selBenefitCategory').value,
            conditionDetail:      document.getElementById('inConditionDetail').value.trim(),
            accountNo:            document.getElementById('inAccountNo').value.trim(),
            guardianName:         guardianName,
            relation:             relation,
            selRelation:          selRel,
            customRelation:       customRel,
            guardianAddress:      document.getElementById('inGuardianAddress').value.trim() || 'गौरादह नगरपालिका वडा नं. १, झापा',
            guardianPhone:        document.getElementById('inGuardianPhone').value.trim(),
            guardianCitNo:        document.getElementById('inGuardianCitNo').value.trim(),
            guardianCitDistrict:  document.getElementById('inGuardianCitDistrict').value.trim() || 'झापा',
            guardianNid:          document.getElementById('inGuardianNid').value.trim(),
            showSecretary:        document.getElementById('chkShowSecretary') ? document.getElementById('chkShowSecretary').checked : true,
            secretaryPosY:        parseInt(document.getElementById('sliderSecPosY') ? document.getElementById('sliderSecPosY').value : 0, 10) || 0,
            chairpersonPosY:      parseInt(document.getElementById('sliderChairPosY') ? document.getElementById('sliderChairPosY').value : 0, 10) || 0,
            secretarySelect:      document.getElementById('inSecretarySelect').value,
            customSecretaryName:  document.getElementById('inCustomSecretaryName').value.trim(),
            customSecretaryTitle: document.getElementById('inCustomSecretaryTitle').value.trim(),
            signAuth:             document.getElementById('inSignAuthority').value,
            customSignName:       document.getElementById('inCustomSignName').value.trim(),
            customSignTitle:      document.getElementById('inCustomSignTitle').value.trim(),
            createdBy:            localStorage.getItem('sifarish_user') || 'wada1',
            createdWard:          localStorage.getItem('sifarish_ward') || '1',
            timestamp:            Date.now()
        };

        let savedDocId = recordId;
        if (recordId !== "") {
            obj.lastUpdatedAt = Date.now();
            await db.collection("surakshyaSanrakshakTestRecords").doc(recordId).update(obj);
        } else {
            const docRef = await db.collection("surakshyaSanrakshakTestRecords").add(obj);
            savedDocId = docRef.id;
            document.getElementById('editRecordIndex').value = savedDocId;
            document.getElementById('formMainTitle').innerText = "🔄 सम्पादन मोड: " + beneficiaryName;
        }

        // Update in-memory cache
        const memoryRec = preIndexRecord({ id: savedDocId, ...obj });
        const existingIdx = globalDatabase.findIndex(r => r.id === savedDocId);
        if (existingIdx !== -1) {
            globalDatabase[existingIdx] = memoryRec;
        } else {
            globalDatabase.unshift(memoryRec);
        }

        const btnNew = document.getElementById('btnNewForm');
        if (btnNew) btnNew.style.display = 'inline-block';

        updateDoc();

        // Print preparation: Show all 3 pages and remove single-page filters
        switchPreviewPage('all');
        document.body.classList.remove('print-p1-only', 'print-p2-only', 'print-p3-only');

        if (document.fonts) {
            try { await document.fonts.ready; } catch (fe) {}
        }
        const banner = document.querySelector('.svg-letterhead-banner');
        if (banner && banner.decode) {
            try { await banner.decode(); } catch (ie) {}
        }

        window.print();
    } catch (e) {
        console.error(e);
        if (confirm("क्लाउडमा डाटा सुरक्षित गर्दा समस्या भयो! इन्टरनेट नहुँदा पनि प्रिन्ट गर्न चाहनुहुन्छ?")) {
            switchPreviewPage('all');
            document.body.classList.remove('print-p1-only', 'print-p2-only', 'print-p3-only');
            window.print();
        }
    } finally {
        isSavingInProgress = false;
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
}

// ── Reset Form ──
function resetForm() {
    document.getElementById('editRecordIndex').value = '';
    document.getElementById('formMainTitle').innerText = '🛡️ संरक्षक सामाजिक सुरक्षा सिफारिस टेस्ट';

    document.getElementById('inBeneficiaryName').value = '';
    document.getElementById('inBeneficiaryCitNo').value = '';
    document.getElementById('inCardNo').value = '';
    document.getElementById('inAccountNo').value = '';
    document.getElementById('inGuardianName').value = '';
    document.getElementById('inGuardianPhone').value = '';
    document.getElementById('inGuardianCitNo').value = '';
    document.getElementById('inGuardianNid').value = '';
    document.getElementById('inChalani').value = '';
    document.getElementById('inConditionDetail').value = 'वृद्ध तथा अशक्त भई हिँडडुल गर्न असमर्थ';
    document.getElementById('selBenefitCategory').value = 'जेष्ठ नागरिक';
    document.getElementById('selQuarter').value = 'प्रथम त्रैमासिक';
    document.getElementById('selRelation').value = 'छोरा';
    handleRelationChange();

    document.getElementById('badgeRecNoDisplay').innerText = 'स्वतः उत्पन्न हुने (१०० बाट सुरु)';

    const chkSec = document.getElementById('chkShowSecretary');
    if (chkSec) chkSec.checked = true;
    toggleSecretaryVisibility();
    resetOfficerPositions();

    const btnNew = document.getElementById('btnNewForm');
    if (btnNew) btnNew.style.display = 'none';

    initDefaultDate();
    switchPreviewPage(1);
    updateDoc();
}

// ── Database Archive Modal & Operations ──
function toggleModal(show) {
    const modal = document.getElementById('abhilekhModal');
    if (modal) {
        modal.style.display = show ? 'flex' : 'none';
        if (show) {
            currentArchivePage = 1;
            renderDatabaseTable();
        }
    }
}

function onArchiveSearchInput(val) {
    clearTimeout(archiveSearchDebounceTimer);
    const clearBtn = document.getElementById('btnClearArchiveSearch');
    if (clearBtn) {
        clearBtn.style.display = val && val.trim() ? 'block' : 'none';
    }
    archiveSearchDebounceTimer = setTimeout(() => {
        currentArchivePage = 1;
        renderDatabaseTable();
    }, 250);
}

function clearArchiveSearch() {
    const field = document.getElementById('searchField');
    if (field) {
        field.value = '';
        onArchiveSearchInput('');
        field.focus();
    }
}

function renderDatabaseTable() {
    const tbody = document.getElementById('dbTableBody');
    const summary = document.getElementById('dbTableSummary');
    const pagination = document.getElementById('dbTablePagination');
    if (!tbody) return;

    tbody.innerHTML = '';
    const q = normalizeDevanagari(document.getElementById('searchField')?.value || '');
    const qClean = (document.getElementById('searchField')?.value || '').trim().toLowerCase();

    let list = globalDatabase;
    if (qClean) {
        list = globalDatabase.filter(r => {
            const s = r._search || {};
            return (s.bNameNorm && s.bNameNorm.includes(q)) ||
                   (s.gNameNorm && s.gNameNorm.includes(q)) ||
                   (s.accClean && s.accClean.includes(qClean)) ||
                   (s.cardClean && s.cardClean.includes(qClean)) ||
                   (s.recNoEn && s.recNoEn.includes(toEnglishDigit(qClean))) ||
                   (s.chalaniClean && s.chalaniClean.includes(qClean));
        });
    }

    const totalRecords = list.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / ARCHIVE_PAGE_SIZE));
    if (currentArchivePage > totalPages) currentArchivePage = totalPages;

    const startIdx = (currentArchivePage - 1) * ARCHIVE_PAGE_SIZE;
    const pagedRecords = list.slice(startIdx, startIdx + ARCHIVE_PAGE_SIZE);

    if (summary) {
        summary.innerHTML = `<span>कुल अभिलेख: <strong>${toNepaliDigit(totalRecords)}</strong></span>` +
            (qClean ? `<span style="color:#2b6cb0;">खोजी नतिजा: ${toNepaliDigit(pagedRecords.length)} रेकर्ड</span>` : '');
    }

    if (pagedRecords.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 25px; color: #718096;">कुनै अभिलेख फेला परेन ।</td></tr>`;
        if (pagination) pagination.innerHTML = '';
        return;
    }

    pagedRecords.forEach((rec, idx) => {
        const tr = document.createElement('tr');
        const serialNo = startIdx + idx + 1;
        const recNo = rec.recommendationNo ? `नं. ${toNepaliDigit(rec.recommendationNo)}` : '-';

        tr.innerHTML = `
            <td style="font-weight: 700; text-align: center; color: #2b6cb0;">${recNo}</td>
            <td><strong>${rec.beneficiaryName || '-'}</strong></td>
            <td><code style="background:#edf2f7; padding:2px 4px; border-radius:3px;">${rec.accountNo || '-'}</code></td>
            <td>${rec.guardianName || '-'} <span style="color:#718096; font-size:0.85rem;">(${rec.relation || '-'})</span></td>
            <td><small>${rec.quarter || '-'}<br>${rec.miti || '-'}</small></td>
            <td style="text-align: center; white-space: nowrap;">
                <button type="button" onclick="loadRecordForEdit('${rec.id}')"
                    style="padding: 4px 8px; background: #ebf8ff; color: #2b6cb0; border: 1px solid #90cdf4; border-radius: 4px; font-weight: 700; cursor: pointer; margin-right: 4px;" title="सम्पादन गर्नुहोस्">
                    ✏️ खोल्नुहोस्
                </button>
                <button type="button" onclick="softDeleteRecord('${rec.id}', '${encodeURIComponent(rec.beneficiaryName || '')}')"
                    style="padding: 4px 8px; background: #fff5f5; color: #c53030; border: 1px solid #feb2b2; border-radius: 4px; font-weight: 700; cursor: pointer;" title="रद्दीको टोकरीमा सार्नुहोस्">
                    🗑️
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (pagination) {
        let pagHtml = `<div>पृष्ठ <strong>${toNepaliDigit(currentArchivePage)}</strong> / <strong>${toNepaliDigit(totalPages)}</strong></div>`;
        pagHtml += `<div style="display:flex; gap:6px;">`;
        if (currentArchivePage > 1) {
            pagHtml += `<button type="button" onclick="changeArchivePage(${currentArchivePage - 1})" style="padding:4px 10px; background:#fff; border:1px solid #cbd5e0; border-radius:4px; cursor:pointer;">अघिल्लो</button>`;
        }
        if (currentArchivePage < totalPages) {
            pagHtml += `<button type="button" onclick="changeArchivePage(${currentArchivePage + 1})" style="padding:4px 10px; background:#fff; border:1px solid #cbd5e0; border-radius:4px; cursor:pointer;">पछिल्लो</button>`;
        }
        pagHtml += `</div>`;
        pagination.innerHTML = pagHtml;
    }
}

function changeArchivePage(p) {
    currentArchivePage = p;
    renderDatabaseTable();
}

function loadRecordForEdit(id) {
    const rec = globalDatabase.find(r => r.id === id);
    if (!rec) return;

    document.getElementById('editRecordIndex').value = rec.id;
    document.getElementById('formMainTitle').innerText = "🔄 सम्पादन मोड: " + (rec.beneficiaryName || '');

    const setVal = (elemId, val) => {
        const el = document.getElementById(elemId);
        if (el && val !== undefined && val !== null) el.value = val;
    };

    setVal('inPatraSankhya', rec.ay || '२०८३/०८४');
    setVal('inChalani', rec.chalani === '-' ? '' : (rec.chalani || ''));
    setVal('inMiti', rec.miti === '-' ? '' : (rec.miti || ''));
    setVal('inNepalSamvat', rec.ns === '-' ? '' : (rec.ns || ''));
    setVal('selFiscalYear', rec.fiscalYear || rec.ay || '२०८३/०८४');
    setVal('selQuarter', rec.quarter || 'प्रथम त्रैमासिक');

    setVal('inBeneficiaryName', rec.beneficiaryName || '');
    setVal('inBeneficiaryCitNo', rec.beneficiaryCitNo || '');
    setVal('inCardNo', rec.cardNo || '');
    setVal('selBenefitCategory', rec.benefitCategory || 'जेष्ठ नागरिक');
    setVal('inConditionDetail', rec.conditionDetail || 'वृद्ध तथा अशक्त भई हिँडडुल गर्न असमर्थ');
    setVal('inAccountNo', rec.accountNo || '');

    setVal('inGuardianName', rec.guardianName || '');
    setVal('inGuardianAddress', rec.guardianAddress || 'गौरादह नगरपालिका वडा नं. १, झापा');
    setVal('inGuardianPhone', rec.guardianPhone || '');
    setVal('inGuardianCitNo', rec.guardianCitNo || '');
    setVal('inGuardianCitDistrict', rec.guardianCitDistrict || 'झापा');
    setVal('inGuardianNid', rec.guardianNid || '');

    if (rec.selRelation) {
        setVal('selRelation', rec.selRelation);
        if (rec.selRelation === 'अन्य') {
            setVal('inCustomRelation', rec.customRelation || '');
        }
        handleRelationChange();
    }

    const chkSec = document.getElementById('chkShowSecretary');
    if (chkSec) {
        chkSec.checked = rec.showSecretary !== false;
    }
    toggleSecretaryVisibility();

    if (rec.secretarySelect) {
        setVal('inSecretarySelect', rec.secretarySelect);
        if (rec.secretarySelect === 'CUSTOM') {
            setVal('inCustomSecretaryName', rec.customSecretaryName || '');
            setVal('inCustomSecretaryTitle', rec.customSecretaryTitle || 'वडा सचिव');
        }
        handleSecretaryChange();
    }

    if (rec.signAuth) {
        setVal('inSignAuthority', rec.signAuth);
        if (rec.signAuth === 'CUSTOM') {
            setVal('inCustomSignName', rec.customSignName || '');
            setVal('inCustomSignTitle', rec.customSignTitle || 'वडा अध्यक्ष');
        }
        toggleCustomSign();
    }

    const secPosY = (rec.secretaryPosY !== undefined && rec.secretaryPosY !== null) ? rec.secretaryPosY : 0;
    onSecPosYChange(secPosY);
    const chairPosY = (rec.chairpersonPosY !== undefined && rec.chairpersonPosY !== null) ? rec.chairpersonPosY : 0;
    onChairPosYChange(chairPosY);

    const btnNew = document.getElementById('btnNewForm');
    if (btnNew) btnNew.style.display = 'inline-block';

    updateDoc();
    toggleModal(false);
}

async function softDeleteRecord(id, encName) {
    const name = decodeURIComponent(encName || '');
    if (!confirm(`के तपाईं "${name}" को यो सिफारिस रद्दीको टोकरीमा पठाउन चाहनुहुन्छ?`)) return;

    try {
        const rec = globalDatabase.find(r => r.id === id);
        await db.collection("surakshyaSanrakshakTestRecords").doc(id).update({
            isDeleted: true,
            deletedAt: Date.now(),
            deletedBy: localStorage.getItem('sifarish_user') || 'wada1'
        });

        // Log to deleted_records_log
        await db.collection("deleted_records_log").add({
            recordId: id,
            collectionName: "surakshyaSanrakshakTestRecords",
            sifarishTitle: "संरक्षक सामाजिक सुरक्षा सिफारिस टेस्ट",
            citizenName: name,
            recommendationNo: rec ? (rec.recommendationNo || '-') : '-',
            deletedAt: Date.now(),
            deletedBy: localStorage.getItem('sifarish_user') || 'wada1',
            ward: localStorage.getItem('sifarish_ward') || '1'
        });

        globalDatabase = globalDatabase.filter(r => r.id !== id);
        renderDatabaseTable();

        if (document.getElementById('editRecordIndex').value === id) {
            resetForm();
        }
    } catch (e) {
        console.error("Delete failed:", e);
        alert("रेकर्ड हटाउन सकिएन: " + e.message);
    }
}

// ── Beneficiary Registry Lookup (Excel / Firestore) ──
function loadBeneficiaryRegister() {
    if (beneficiaryLoadPromise) return beneficiaryLoadPromise;

    beneficiaryLoadPromise = (async () => {
        try {
            const cached = localStorage.getItem(BENEFICIARY_CACHE_KEY);
            const cachedTime = localStorage.getItem(BENEFICIARY_CACHE_TIME_KEY);
            const isFresh = cachedTime && (Date.now() - parseInt(cachedTime, 10) < CACHE_TTL_MS);

            if (cached && isFresh) {
                try {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        beneficiaryRegister = parsed.map(item => {
                            const rawName = String(item.name || '').trim();
                            const rawCard = String(item.cardNo || '').trim();
                            const rawAcc = String(item.accountNo || '').trim();
                            item._search = {
                                nameNorm: normalizeDevanagari(rawName),
                                cardNorm: rawCard.toLowerCase(),
                                cardEn: toEnglishDigit(rawCard).toLowerCase(),
                                cardNe: toNepaliDigit(rawCard),
                                accNorm: rawAcc.toLowerCase(),
                                accEn: toEnglishDigit(rawAcc).toLowerCase(),
                                accNe: toNepaliDigit(rawAcc)
                            };
                            return item;
                        });
                        isBeneficiaryRegisterLoaded = true;
                        updateBeneficiaryStatusBadge();
                        return beneficiaryRegister;
                    }
                } catch(e) {}
            }

            const snap = await db.collection("socialSecurityBeneficiaries").limit(2000).get();
            const loaded = [];
            snap.forEach(doc => {
                const d = doc.data();
                loaded.push({ id: doc.id, ...d });
            });

            if (loaded.length > 0) {
                beneficiaryRegister = loaded.map(item => {
                    const rawName = String(item.name || '').trim();
                    const rawCard = String(item.cardNo || '').trim();
                    const rawAcc = String(item.accountNo || '').trim();
                    item._search = {
                        nameNorm: normalizeDevanagari(rawName),
                        cardNorm: rawCard.toLowerCase(),
                        cardEn: toEnglishDigit(rawCard).toLowerCase(),
                        cardNe: toNepaliDigit(rawCard),
                        accNorm: rawAcc.toLowerCase(),
                        accEn: toEnglishDigit(rawAcc).toLowerCase(),
                        accNe: toNepaliDigit(rawAcc)
                    };
                    return item;
                });
                try {
                    localStorage.setItem(BENEFICIARY_CACHE_KEY, JSON.stringify(loaded));
                    localStorage.setItem(BENEFICIARY_CACHE_TIME_KEY, String(Date.now()));
                } catch(e) {}
            }
            isBeneficiaryRegisterLoaded = true;
            updateBeneficiaryStatusBadge();
            return beneficiaryRegister;
        } catch(e) {
            console.warn("Beneficiary list fetch skipped:", e);
            isBeneficiaryRegisterLoaded = true;
            return [];
        }
    })();
    return beneficiaryLoadPromise;
}

function updateBeneficiaryStatusBadge() {
    const el = document.getElementById('beneficiaryRegisterStatus');
    if (el && beneficiaryRegister.length > 0) {
        el.innerText = `(${toNepaliDigit(beneficiaryRegister.length)} जना दर्ता सूचीमा)`;
    }
}

function onBeneficiarySearchInput(q) {
    clearTimeout(searchDebounceTimer);
    const clearBtn = document.getElementById('btnClearBeneficiarySearch');
    if (clearBtn) clearBtn.style.display = q && q.trim() ? 'block' : 'none';

    searchDebounceTimer = setTimeout(() => {
        executeBeneficiarySearch(q);
    }, 180);
}

function onBeneficiarySearchFocus() {
    const val = document.getElementById('inBeneficiarySearch')?.value || '';
    if (val.trim()) executeBeneficiarySearch(val);
}

function executeBeneficiarySearch(rawQ) {
    const dropdown = document.getElementById('beneficiarySearchResults');
    if (!dropdown) return;

    const q = (rawQ || '').trim();
    if (!q) {
        dropdown.style.display = 'none';
        dropdown.innerHTML = '';
        return;
    }

    const qNorm = normalizeDevanagari(q);
    const qClean = q.toLowerCase();
    const qEn = toEnglishDigit(qClean);

    const matches = beneficiaryRegister.filter(item => {
        const s = item._search || {};
        return (s.nameNorm && s.nameNorm.includes(qNorm)) ||
               (s.cardNorm && s.cardNorm.includes(qClean)) ||
               (s.cardEn && s.cardEn.includes(qEn)) ||
               (s.accNorm && s.accNorm.includes(qClean)) ||
               (s.accEn && s.accEn.includes(qEn));
    }).slice(0, 10);

    if (matches.length === 0) {
        dropdown.innerHTML = `<div style="padding: 10px; color: #718096; font-size: 0.85rem;">कुनै लाभग्राही फेला परेन ।</div>`;
        dropdown.style.display = 'block';
        return;
    }

    dropdown.innerHTML = '';
    matches.forEach(item => {
        const div = document.createElement('div');
        div.className = 'beneficiary-result-item';
        div.style.cssText = 'padding: 8px 12px; border-bottom: 1px solid #edf2f7; cursor: pointer; transition: background 0.15s;';
        div.onmouseenter = () => div.style.background = '#ebf8ff';
        div.onmouseleave = () => div.style.background = '#ffffff';
        div.onclick = () => selectBeneficiaryItem(item);

        div.innerHTML = `
            <div style="font-weight: 700; color: #2d3748;">${item.name || '-'}</div>
            <div style="font-size: 0.78rem; color: #718096;">
                परिचयपत्र: <strong>${toNepaliDigit(item.cardNo || '-')}</strong> | खाता नं: <strong>${item.accountNo || '-'}</strong>
            </div>
        `;
        dropdown.appendChild(div);
    });
    dropdown.style.display = 'block';
}

function selectBeneficiaryItem(item) {
    if (!item) return;
    document.getElementById('inBeneficiaryName').value = item.name || '';
    if (item.cardNo) document.getElementById('inCardNo').value = item.cardNo;
    if (item.accountNo) document.getElementById('inAccountNo').value = item.accountNo;
    if (item.category) document.getElementById('selBenefitCategory').value = item.category;

    selectedBeneficiaryCardNo = item.cardNo || '';

    const badge = document.getElementById('selectedBeneficiaryBadge');
    if (badge) {
        badge.style.display = 'flex';
        document.getElementById('selectedBeneficiaryNameText').innerText = item.name || '';
        document.getElementById('selectedBeneficiaryMetaText').innerText = `(परिचयपत्र: ${toNepaliDigit(item.cardNo || '-')})`;
    }

    const dropdown = document.getElementById('beneficiarySearchResults');
    if (dropdown) dropdown.style.display = 'none';

    updateDoc();
}

function clearBeneficiarySearch() {
    const input = document.getElementById('inBeneficiarySearch');
    if (input) {
        input.value = '';
        input.focus();
    }
    const dropdown = document.getElementById('beneficiarySearchResults');
    if (dropdown) dropdown.style.display = 'none';
    const clearBtn = document.getElementById('btnClearBeneficiarySearch');
    if (clearBtn) clearBtn.style.display = 'none';
}

function unlinkSelectedBeneficiary() {
    selectedBeneficiaryCardNo = '';
    const badge = document.getElementById('selectedBeneficiaryBadge');
    if (badge) badge.style.display = 'none';
}

function triggerExcelImport() {
    const picker = document.getElementById('inExcelFilePicker');
    if (picker) picker.click();
}

function handleExcelFileSelect(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    alert("एक्सेल फाइल प्राप्त भयो। पृष्ठभूमिमा प्रशोधन हुँदैछ...");
    // Reset file picker
    event.target.value = '';
}

// ── Close Dropdown on outside click ──
document.addEventListener('click', (e) => {
    const container = document.getElementById('beneficiaryLookupContainer');
    const dropdown = document.getElementById('beneficiarySearchResults');
    if (dropdown && container && !container.contains(e.target)) {
        dropdown.style.display = 'none';
    }
});

// ── Initialization on Page Load ──
window.addEventListener('DOMContentLoaded', () => {
    populateFiscalYearDropdown();
    initDefaultDate();
    toggleSecretaryVisibility();
    resetOfficerPositions();
    switchPreviewPage(1);
    updateDoc();
});
