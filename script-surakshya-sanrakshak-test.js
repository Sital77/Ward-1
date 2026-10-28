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
            const converter = window["@sbmdkl/nepali-date-converter"];
            if (converter && typeof converter.adToBs === 'function') {
                const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kathmandu" }));
                const yyyy = now.getFullYear();
                const mm = String(now.getMonth() + 1).padStart(2, '0');
                const dd = String(now.getDate()).padStart(2, '0');
                const bs = converter.adToBs(`${yyyy}-${mm}-${dd}`);
                mitiInput.value = toNepaliDigit(typeof bs === 'string' ? bs.replace(/-/g, '/') : `${bs.year}/${String(bs.month).padStart(2, '0')}/${String(bs.day).padStart(2, '0')}`);
            } else {
                mitiInput.value = '२०८३/०२/१८';
            }
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

    // Applicant Details
    const guardianName = getVal('inGuardianName', '..................');
    const applicantName = getVal('inApplicantName', guardianName);
    const selAppRel = getVal('selApplicantRelation', 'छोरा');
    const customAppRel = getVal('inCustomApplicantRelation', '');
    const applicantRelation = (selAppRel === 'अन्य' || selAppRel === 'CUSTOM') ? (customAppRel || 'छोरा') : selAppRel;

    // Guardian Details
    const selRel = getVal('selRelation', 'छोरा');
    const customRel = getVal('inCustomRelation', '');
    const relation = (selRel === 'अन्य' || selRel === 'CUSTOM') ? (customRel || 'संरक्षक') : selRel;
    const guardianAddress = getVal('inGuardianAddress', 'गौरादह नगरपालिका वडा नं. १, झापा');
    const guardianPhone = getVal('inGuardianPhone', '..................');
    const guardianCitNo = getVal('inGuardianCitNo', '..................');
    const guardianCitDistrict = getVal('inGuardianCitDistrict', 'झापा');
    const guardianNid = getVal('inGuardianNid', '');

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

    setTxt('lblP1ApplicantName', applicantName);
    setTxt('lblP1ApplicantRelation', applicantRelation);
    setTxt('lblP1GuardianRelation', relation);
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

    // Signatures Page 1 (Chairperson on RIGHT)
    setTxt('lblP1ChairName', chairName);
    setTxt('lblP1ChairTitle', chairTitle);
    adjustChairSignatureLine();

    // ──────────────────────────────────────────
    // 2. UPDATE PAGE 2 (Applicant's Request)
    // ──────────────────────────────────────────
    setTxt('lblP2Miti', miti);
    setTxt('lblP2ApplicantName', applicantName);
    setTxt('lblP2ApplicantRelation', applicantRelation);
    setTxt('lblP2GuardianName', applicantName);
    setTxt('lblP2GuardianCitNo', guardianCitNo);
    setTxt('lblP2GuardianCitDistrict', guardianCitDistrict);
    setTxt('lblP2Relation', applicantRelation);
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

// ── Applicant & Guardian Input Handlers ──
function onApplicantNameInput() {
    const el = document.getElementById('inApplicantName');
    if (el) el._autoSynced = false;
    updateDoc();
}

function onGuardianNameInput() {
    const gName = document.getElementById('inGuardianName')?.value || '';
    const appInput = document.getElementById('inApplicantName');
    if (appInput && (appInput._autoSynced !== false || !appInput.value)) {
        appInput.value = gName;
        appInput._autoSynced = true;
    }
    updateDoc();
}

function handleApplicantRelationChange() {
    const sel = document.getElementById('selApplicantRelation')?.value;
    const box = document.getElementById('customApplicantRelationGroup');
    if (box) {
        box.style.display = (sel === 'अन्य') ? 'block' : 'none';
    }
}

// ── Relations Dropdown (Guardian) ──
function handleRelationChange() {
    const sel = document.getElementById('selRelation').value;
    const box = document.getElementById('customRelationGroup');
    if (box) {
        box.style.display = (sel === 'अन्य') ? 'block' : 'none';
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

// ══════════════════════════════════════════════════════
//  Chairperson Signature Appearance & Position Controller
// ══════════════════════════════════════════════════════
const DEFAULT_CHAIR_SIG_SETTINGS = {
    lineStyle: 'dashed', // 'dashed' | 'dotted' | 'solid' | 'none'
    lineWidth: 180,      // in px (100 - 250)
    fontSize: 13,        // in pt (10 - 18)
    posX: 0,             // 0 mm fixed
    posY: 0              // in mm (-70 - 25)
};

const CHAIR_SIG_STORAGE_KEY = 'guardian_test_chair_sig_settings';
let currentChairSigSettings = { ...DEFAULT_CHAIR_SIG_SETTINGS };

function adjustChairSignatureLine() {
    const nameEl = document.getElementById('lblP1ChairName');
    const lineEl = document.getElementById('p1SigLine');
    if (nameEl && lineEl) {
        const measuredWidth = nameEl.offsetWidth;
        if (measuredWidth > 0) {
            lineEl.style.width = `${Math.max(measuredWidth, 100)}px`;
        }
    }
}

function applyChairSigSettings(settings, skipStorage = false) {
    if (!settings) settings = DEFAULT_CHAIR_SIG_SETTINGS;
    const style = ['dashed', 'dotted', 'solid', 'none'].includes(settings.lineStyle) ? settings.lineStyle : DEFAULT_CHAIR_SIG_SETTINGS.lineStyle;
    const width = Math.min(Math.max(parseInt(settings.lineWidth, 10) || DEFAULT_CHAIR_SIG_SETTINGS.lineWidth, 100), 250);
    const fontSize = Math.min(Math.max(parseFloat(settings.fontSize) || DEFAULT_CHAIR_SIG_SETTINGS.fontSize, 10), 18);
    const posY = Math.min(Math.max(parseInt(settings.posY, 10) || 0, -70), 25);

    currentChairSigSettings = { lineStyle: style, lineWidth: width, fontSize: fontSize, posX: 0, posY: posY };

    // Apply CSS variables to root and page1
    const root = document.documentElement;
    if (root) {
        root.style.setProperty('--chair-sig-line-style', style);
        root.style.setProperty('--chair-sig-line-width', `${width}px`);
        root.style.setProperty('--chair-sig-font-size', `${fontSize}pt`);
        root.style.setProperty('--chair-sig-offset-y', `${posY}mm`);
        root.style.setProperty('--officer-name-gap', '6.5px');
    }

    const page1 = document.getElementById('page1');
    if (page1) {
        page1.style.setProperty('--chair-sig-line-style', style);
        page1.style.setProperty('--chair-sig-line-width', `${width}px`);
        page1.style.setProperty('--chair-sig-font-size', `${fontSize}pt`);
        page1.style.setProperty('--chair-sig-offset-y', `${posY}mm`);
        page1.style.setProperty('--officer-name-gap', '6.5px');
    }

    // Apply vertical position transform solely to signature block
    const block = document.getElementById('p1ChairSignatureBlock');
    if (block) {
        block.style.setProperty('--chair-sig-offset-y', `${posY}mm`);
        block.style.transform = `translateY(${posY}mm)`;
    }

    // Adapt signature line automatically
    adjustChairSignatureLine();

    // Synchronize UI Form Controls
    const sliderPos = document.getElementById('sliderChairPosY');
    if (sliderPos && sliderPos.value !== String(posY)) sliderPos.value = posY;
    const badgePos = document.getElementById('badgeChairPosY');
    if (badgePos) badgePos.textContent = `${posY} mm`;

    const selStyle = document.getElementById('selChairSigLineStyle');
    if (selStyle && selStyle.value !== style) selStyle.value = style;

    const sliderWidth = document.getElementById('sliderChairSigLineWidth');
    if (sliderWidth && sliderWidth.value !== String(width)) sliderWidth.value = width;
    const numWidth = document.getElementById('numChairSigLineWidth');
    if (numWidth && numWidth.value !== String(width)) numWidth.value = width;
    const badgeWidth = document.getElementById('badgeChairSigLineWidth');
    if (badgeWidth) badgeWidth.textContent = `${width} px`;

    const sliderFont = document.getElementById('sliderChairSigFontSize');
    if (sliderFont && sliderFont.value !== String(fontSize)) sliderFont.value = fontSize;
    const numFont = document.getElementById('numChairSigFontSize');
    if (numFont && numFont.value !== String(fontSize)) numFont.value = fontSize;
    const badgeFont = document.getElementById('badgeChairSigFontSize');
    if (badgeFont) badgeFont.textContent = `${fontSize} pt`;

    if (!skipStorage) {
        try {
            localStorage.setItem(CHAIR_SIG_STORAGE_KEY, JSON.stringify(currentChairSigSettings));
        } catch (e) {}
    }
}

function onChairPosXChange(val) {
    // Deprecated horizontal control handler retained as safe stub
}

function onChairSigLineStyleChange(style) {
    applyChairSigSettings({ ...currentChairSigSettings, lineStyle: style });
}

function onChairSigLineWidthChange(width) {
    const val = parseInt(width, 10);
    if (isNaN(val)) return;
    applyChairSigSettings({ ...currentChairSigSettings, lineWidth: val });
}

function onChairSigFontSizeChange(size) {
    const val = parseFloat(size);
    if (isNaN(val)) return;
    applyChairSigSettings({ ...currentChairSigSettings, fontSize: val });
}

function onChairPosYChange(val) {
    const v = parseInt(val, 10) || 0;
    applyChairSigSettings({ ...currentChairSigSettings, posY: v });
}

function resetChairPosition() {
    applyChairSigSettings({ ...currentChairSigSettings, posX: 0, posY: 0 });
}

function resetChairSignatureSettings() {
    applyChairSigSettings(DEFAULT_CHAIR_SIG_SETTINGS);
}

function loadStoredChairSigSettings() {
    try {
        const stored = localStorage.getItem(CHAIR_SIG_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed) {
                applyChairSigSettings(parsed, true);
                return;
            }
        }
    } catch (e) {}
    applyChairSigSettings(DEFAULT_CHAIR_SIG_SETTINGS, true);
}

// ══════════════════════════════════════════════════════
//  Specimen Signature Box Controller (नमुना दस्तखत बक्स)
// ══════════════════════════════════════════════════════
const DEFAULT_SPECIMEN_BOX_LAYOUT = {
    width: 68,   // in mm (30 - 85)
    height: 23,  // in mm (10 - 40)
    posX: 0,     // in mm (-90 - 40)
    posY: 0      // in mm (-60 - 60)
};

const SPECIMEN_BOX_LIMITS = {
    minWidth: 30,
    maxWidth: 85,
    minHeight: 10,
    maxHeight: 40,
    minPosX: -90,
    maxPosX: 40,
    minPosY: -60,
    maxPosY: 60
};

const SPECIMEN_BOX_STORAGE_KEY = 'guardian_test_specimen_box_settings';
let currentSpecimenBoxLayout = { ...DEFAULT_SPECIMEN_BOX_LAYOUT };

function validateSpecimenDimensions(w, h, x, y) {
    let width = DEFAULT_SPECIMEN_BOX_LAYOUT.width;
    let height = DEFAULT_SPECIMEN_BOX_LAYOUT.height;
    let posX = DEFAULT_SPECIMEN_BOX_LAYOUT.posX;
    let posY = DEFAULT_SPECIMEN_BOX_LAYOUT.posY;

    if (typeof w === 'object' && w !== null) {
        if (w.width !== undefined) width = parseFloat(w.width);
        if (w.height !== undefined) height = parseFloat(w.height);
        if (w.posX !== undefined) posX = parseFloat(w.posX);
        if (w.posY !== undefined) posY = parseFloat(w.posY);
    } else {
        if (w !== undefined) width = parseFloat(w);
        if (h !== undefined) height = parseFloat(h);
        if (x !== undefined) posX = parseFloat(x);
        if (y !== undefined) posY = parseFloat(y);
    }

    const safeWidth = isNaN(width) ? DEFAULT_SPECIMEN_BOX_LAYOUT.width : Math.min(Math.max(Math.round(width), SPECIMEN_BOX_LIMITS.minWidth), SPECIMEN_BOX_LIMITS.maxWidth);
    const safeHeight = isNaN(height) ? DEFAULT_SPECIMEN_BOX_LAYOUT.height : Math.min(Math.max(Math.round(height), SPECIMEN_BOX_LIMITS.minHeight), SPECIMEN_BOX_LIMITS.maxHeight);
    const safeX = isNaN(posX) ? DEFAULT_SPECIMEN_BOX_LAYOUT.posX : Math.min(Math.max(Math.round(posX), SPECIMEN_BOX_LIMITS.minPosX), SPECIMEN_BOX_LIMITS.maxPosX);
    const safeY = isNaN(posY) ? DEFAULT_SPECIMEN_BOX_LAYOUT.posY : Math.min(Math.max(Math.round(posY), SPECIMEN_BOX_LIMITS.minPosY), SPECIMEN_BOX_LIMITS.maxPosY);

    return { width: safeWidth, height: safeHeight, posX: safeX, posY: safeY };
}

function applySpecimenBoxLayout(layout, skipStorage = false) {
    if (!layout) layout = DEFAULT_SPECIMEN_BOX_LAYOUT;
    const validated = validateSpecimenDimensions(layout);
    currentSpecimenBoxLayout = { ...validated };

    const card = document.getElementById('specimenSigCard');
    if (card) {
        card.style.left = `${validated.posX}mm`;
        card.style.top = `${validated.posY}mm`;
        card.style.width = `${validated.width}mm`;
    }

    const box = document.getElementById('specimenSigBox');
    if (box) {
        box.style.height = `${validated.height}mm`;
    }

    // Sync input controls and badges
    const setElemVal = (id, val) => {
        const el = document.getElementById(id);
        if (el && el.value !== String(val)) el.value = val;
    };
    const setElemText = (id, txt) => {
        const el = document.getElementById(id);
        if (el) el.textContent = txt;
    };

    setElemVal('sliderSigWidth', validated.width);
    setElemVal('numSigWidth', validated.width);
    setElemText('badgeSigWidth', `${validated.width} mm`);

    setElemVal('sliderSigHeight', validated.height);
    setElemVal('numSigHeight', validated.height);
    setElemText('badgeSigHeight', `${validated.height} mm`);

    setElemVal('sliderSigPosX', validated.posX);
    setElemVal('numSigPosX', validated.posX);
    setElemText('badgeSigPosX', `${validated.posX} mm`);

    setElemVal('sliderSigPosY', validated.posY);
    setElemVal('numSigPosY', validated.posY);
    setElemText('badgeSigPosY', `${validated.posY} mm`);

    if (!skipStorage) {
        try {
            localStorage.setItem(SPECIMEN_BOX_STORAGE_KEY, JSON.stringify(validated));
        } catch (e) {}
    }
}

function onSigBoxLayoutSlider(prop, val) {
    const num = parseFloat(val);
    if (isNaN(num)) return;
    const updated = { ...currentSpecimenBoxLayout, [prop]: num };
    applySpecimenBoxLayout(updated);
}

function onSigBoxLayoutInput(prop, val) {
    const num = parseFloat(val);
    if (isNaN(num)) return;
    const updated = { ...currentSpecimenBoxLayout, [prop]: num };
    applySpecimenBoxLayout(updated);
}

function resetSpecimenBoxLayout() {
    applySpecimenBoxLayout(DEFAULT_SPECIMEN_BOX_LAYOUT);
}

function loadStoredSpecimenBoxLayout() {
    try {
        const stored = localStorage.getItem(SPECIMEN_BOX_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed) {
                // If stored has old default 48x18, upgrade cleanly to 68x23
                if (parsed.width === 48 && parsed.height === 18) {
                    parsed.width = 68;
                    parsed.height = 23;
                }
                applySpecimenBoxLayout(parsed, true);
                return;
            }
        }
    } catch (e) {}
    applySpecimenBoxLayout(DEFAULT_SPECIMEN_BOX_LAYOUT, true);
}

function initSpecimenBoxDraggable() {
    const card = document.getElementById('specimenSigCard');
    if (!card || card._isDraggableInitialized) return;
    card._isDraggableInitialized = true;

    let isDragging = false;
    let startMouseX = 0;
    let startMouseY = 0;
    let startPosX_mm = 0;
    let startPosY_mm = 0;
    const PX_PER_MM = 3.779527559; // 96 DPI / 25.4 mm

    function onPointerDown(e) {
        if (e.type === 'mousedown' && e.button !== 0) return;

        isDragging = true;
        card.classList.add('is-dragging');

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        startMouseX = clientX;
        startMouseY = clientY;
        startPosX_mm = currentSpecimenBoxLayout.posX;
        startPosY_mm = currentSpecimenBoxLayout.posY;

        document.addEventListener('mousemove', onPointerMove, { passive: false });
        document.addEventListener('mouseup', onPointerUp);
        document.addEventListener('touchmove', onPointerMove, { passive: false });
        document.addEventListener('touchend', onPointerUp);

        e.preventDefault();
    }

    function onPointerMove(e) {
        if (!isDragging) return;
        if (e.cancelable) e.preventDefault();

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const deltaX_px = clientX - startMouseX;
        const deltaY_px = clientY - startMouseY;

        const deltaX_mm = Math.round(deltaX_px / PX_PER_MM);
        const deltaY_mm = Math.round(deltaY_px / PX_PER_MM);

        const newX = startPosX_mm + deltaX_mm;
        const newY = startPosY_mm + deltaY_mm;

        applySpecimenBoxLayout({
            ...currentSpecimenBoxLayout,
            posX: newX,
            posY: newY
        }, true);
    }

    function onPointerUp() {
        if (!isDragging) return;
        isDragging = false;
        card.classList.remove('is-dragging');

        document.removeEventListener('mousemove', onPointerMove);
        document.removeEventListener('mouseup', onPointerUp);
        document.removeEventListener('touchmove', onPointerMove);
        document.removeEventListener('touchend', onPointerUp);

        try {
            localStorage.setItem(SPECIMEN_BOX_STORAGE_KEY, JSON.stringify(currentSpecimenBoxLayout));
        } catch (e) {}
    }

    card.addEventListener('mousedown', onPointerDown);
    card.addEventListener('touchstart', onPointerDown, { passive: false });
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

        const applicantName = (document.getElementById('inApplicantName')?.value.trim()) || guardianName;
        const selAppRel = document.getElementById('selApplicantRelation') ? document.getElementById('selApplicantRelation').value : 'छोरा';
        const customAppRel = document.getElementById('inCustomApplicantRelation') ? document.getElementById('inCustomApplicantRelation').value.trim() : '';
        const applicantRelation = (selAppRel === 'अन्य' || selAppRel === 'CUSTOM') ? (customAppRel || 'छोरा') : selAppRel;

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
            applicantName:        applicantName,
            applicantRelation:    applicantRelation,
            selApplicantRelation: selAppRel,
            customApplicantRelation: customAppRel,
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
            chairpersonPosX:      0,
            chairpersonPosY:      currentChairSigSettings.posY,
            chairSigLineStyle:    currentChairSigSettings.lineStyle,
            chairSigLineWidth:    currentChairSigSettings.lineWidth,
            chairSigFontSize:     currentChairSigSettings.fontSize,
            specimenSigPosX:      currentSpecimenBoxLayout.posX,
            specimenSigPosY:      currentSpecimenBoxLayout.posY,
            specimenSigWidth:     currentSpecimenBoxLayout.width,
            specimenSigHeight:    currentSpecimenBoxLayout.height,
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

    const inAppName = document.getElementById('inApplicantName');
    if (inAppName) {
        inAppName.value = '';
        inAppName._autoSynced = true;
    }
    const selAppRel = document.getElementById('selApplicantRelation');
    if (selAppRel) selAppRel.value = 'छोरा';
    const inCustomAppRel = document.getElementById('inCustomApplicantRelation');
    if (inCustomAppRel) inCustomAppRel.value = '';
    handleApplicantRelationChange();

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

    resetChairPosition();
    resetChairSignatureSettings();
    resetSpecimenBoxLayout();

    const btnNew = document.getElementById('btnNewForm');
    if (btnNew) btnNew.style.display = 'none';

    unlinkSelectedBeneficiary();
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
    if (rec.benefitCategory) {
        const selCat = document.getElementById('selBenefitCategory');
        if (selCat) {
            let found = false;
            for (let opt of selCat.options) {
                if (opt.value === rec.benefitCategory) {
                    selCat.value = rec.benefitCategory;
                    found = true;
                    break;
                }
            }
            if (!found) {
                const opt = document.createElement('option');
                opt.value = rec.benefitCategory;
                opt.textContent = rec.benefitCategory;
                selCat.appendChild(opt);
                selCat.value = rec.benefitCategory;
            }
        }
    }
    setVal('inConditionDetail', rec.conditionDetail || 'वृद्ध तथा अशक्त भई हिँडडुल गर्न असमर्थ');
    setVal('inAccountNo', rec.accountNo || '');

    setVal('inApplicantName', rec.applicantName || rec.guardianName || '');
    if (rec.selApplicantRelation) {
        setVal('selApplicantRelation', rec.selApplicantRelation);
        if (rec.selApplicantRelation === 'अन्य') {
            setVal('inCustomApplicantRelation', rec.customApplicantRelation || '');
        }
    } else if (rec.applicantRelation) {
        const selApp = document.getElementById('selApplicantRelation');
        let matched = false;
        if (selApp) {
            for (let opt of selApp.options) {
                if (opt.value === rec.applicantRelation) {
                    selApp.value = rec.applicantRelation;
                    matched = true;
                    break;
                }
            }
        }
        if (!matched) {
            setVal('selApplicantRelation', 'अन्य');
            setVal('inCustomApplicantRelation', rec.applicantRelation);
        }
    } else {
        setVal('selApplicantRelation', rec.selRelation || 'छोरा');
    }
    handleApplicantRelationChange();

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

    if (rec.signAuth) {
        setVal('inSignAuthority', rec.signAuth);
        if (rec.signAuth === 'CUSTOM') {
            setVal('inCustomSignName', rec.customSignName || '');
            setVal('inCustomSignTitle', rec.customSignTitle || 'वडा अध्यक्ष');
        }
        toggleCustomSign();
    }

    const chairSettings = {
        lineStyle: rec.chairSigLineStyle || DEFAULT_CHAIR_SIG_SETTINGS.lineStyle,
        lineWidth: rec.chairSigLineWidth || DEFAULT_CHAIR_SIG_SETTINGS.lineWidth,
        fontSize: rec.chairSigFontSize || DEFAULT_CHAIR_SIG_SETTINGS.fontSize,
        posX: 0,
        posY: (rec.chairpersonPosY !== undefined && rec.chairpersonPosY !== null) ? rec.chairpersonPosY : 0
    };
    applyChairSigSettings(chairSettings);

    const savedLayout = {
        width: rec.specimenSigWidth || DEFAULT_SPECIMEN_BOX_LAYOUT.width,
        height: rec.specimenSigHeight || DEFAULT_SPECIMEN_BOX_LAYOUT.height,
        posX: (rec.specimenSigPosX !== undefined && rec.specimenSigPosX !== null) ? rec.specimenSigPosX : 0,
        posY: (rec.specimenSigPosY !== undefined && rec.specimenSigPosY !== null) ? rec.specimenSigPosY : 0
    };
    applySpecimenBoxLayout(savedLayout);

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
function preIndexBeneficiaryItem(item) {
    const rawName = String(item.name || '').trim();
    const rawCard = String(item.cardNo || '').trim();
    const rawAcc = String(item.accountNo || '').trim();
    const rawType = String(item.allowanceType || item.category || '').trim();
    const rawFather = String(item.fatherName || '').trim();
    const rawSpouse = String(item.spouseName || '').trim();

    item.name = rawName;
    item.cardNo = rawCard;
    item.accountNo = rawAcc;
    item.allowanceType = rawType;
    item.fatherName = rawFather;
    item.spouseName = rawSpouse;

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
}

function loadBeneficiaryRegister() {
    if (beneficiaryLoadPromise) return beneficiaryLoadPromise;

    const statusEl = document.getElementById('beneficiaryRegisterStatus');
    if (statusEl && !isBeneficiaryRegisterLoaded) {
        statusEl.innerHTML = `<span style="color: #718096; font-size: 0.78rem;">⏳ लोड हुँदैछ...</span>`;
    }

    beneficiaryLoadPromise = (async () => {
        try {
            const cached = localStorage.getItem(BENEFICIARY_CACHE_KEY);
            const cachedTime = localStorage.getItem(BENEFICIARY_CACHE_TIME_KEY);
            const isFresh = cachedTime && (Date.now() - parseInt(cachedTime, 10) < CACHE_TTL_MS);

            if (cached && isFresh) {
                try {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        beneficiaryRegister = parsed.map(item => preIndexBeneficiaryItem(item));
                        isBeneficiaryRegisterLoaded = true;
                        updateBeneficiaryStatusBadge();
                        return beneficiaryRegister;
                    }
                } catch(e) {}
            }

            const snap = await db.collection("socialSecurityBeneficiaries").limit(2000).get();
            const loaded = [];
            const seenCards = new Set();
            snap.forEach(doc => {
                const d = doc.data();
                const cardNo = String(d.cardNo || doc.id).trim();
                if (!d.isDeleted && cardNo && !seenCards.has(cardNo)) {
                    seenCards.add(cardNo);
                    loaded.push({ id: doc.id, ...d, cardNo: cardNo });
                }
            });

            if (loaded.length > 0) {
                beneficiaryRegister = loaded.map(item => preIndexBeneficiaryItem(item));
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
            updateBeneficiaryStatusBadge();
            return [];
        } finally {
            beneficiaryLoadPromise = null;
        }
    })();
    return beneficiaryLoadPromise;
}

function updateBeneficiaryStatusBadge() {
    const el = document.getElementById('beneficiaryRegisterStatus');
    if (!el) return;
    if (beneficiaryRegister.length > 0) {
        el.innerHTML = `<span style="color: #4a5568; font-size: 0.78rem;">(${toNepaliDigit(beneficiaryRegister.length)} जना दर्ता सूचीमा)</span>`;
    } else if (isBeneficiaryRegisterLoaded) {
        el.innerHTML = `<span style="color: #718096; font-size: 0.78rem;">(० जना दर्ता सूचीमा)</span>`;
    } else {
        el.innerHTML = `<span style="color: #718096; font-size: 0.78rem;">⏳ लोड हुँदैछ...</span>`;
    }
}

function onBeneficiarySearchInput(q) {
    clearTimeout(searchDebounceTimer);
    const clearBtn = document.getElementById('btnClearBeneficiarySearch');
    if (clearBtn) clearBtn.style.display = q && q.trim() ? 'block' : 'none';

    const seq = ++beneficiarySearchSequence;
    searchDebounceTimer = setTimeout(() => {
        executeBeneficiarySearch(q, seq);
    }, 180);
}

function onBeneficiarySearchFocus() {
    if (!isBeneficiaryRegisterLoaded) {
        loadBeneficiaryRegister();
    }
    const val = document.getElementById('inBeneficiarySearch')?.value || '';
    if (val.trim()) executeBeneficiarySearch(val, ++beneficiarySearchSequence);
}

function executeBeneficiarySearch(rawQ, seq) {
    if (seq !== undefined && seq !== beneficiarySearchSequence) return;

    const dropdown = document.getElementById('beneficiarySearchResults');
    if (!dropdown) return;

    const q = (rawQ || '').trim();
    if (!q) {
        dropdown.style.display = 'none';
        dropdown.innerHTML = '';
        return;
    }

    if (!isBeneficiaryRegisterLoaded && beneficiaryRegister.length === 0) {
        dropdown.innerHTML = `<div style="padding: 10px 14px; text-align: center; color: #718096; font-size: 0.85rem;">⏳ दर्ता सूची लोड हुँदैछ, कृपया एकछिन प्रतिक्षा गर्नुहोस्...</div>`;
        dropdown.style.display = 'block';
        loadBeneficiaryRegister().then(() => {
            if (seq === undefined || seq === beneficiarySearchSequence) {
                executeBeneficiarySearch(rawQ, seq);
            }
        });
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
    }).slice(0, 15);

    if (matches.length === 0) {
        dropdown.innerHTML = `<div style="padding: 12px 14px; text-align: center; color: #718096; font-size: 0.85rem;">कुनै लाभग्राही फेला परेन ।</div>`;
        dropdown.style.display = 'block';
        return;
    }

    dropdown.innerHTML = '';
    matches.forEach(item => {
        const div = document.createElement('div');
        div.className = 'beneficiary-result-item';
        div.style.cssText = 'padding: 8px 12px; border-bottom: 1px solid #edf2f7; cursor: pointer; transition: background 0.15s; background: #ffffff;';
        div.onmouseenter = () => div.style.background = '#f7fafc';
        div.onmouseleave = () => div.style.background = '#ffffff';
        div.onclick = () => selectBeneficiaryItem(item);

        const cardText = item.cardNo ? `दर्ता नं: ${toNepaliDigit(item.cardNo)}` : '-';
        const accText = item.accountNo ? `खाता नं: ${item.accountNo}` : '';
        const typeText = item.allowanceType ? `प्रकार: ${item.allowanceType}` : '';

        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 8px;">
                <span style="font-weight: 600; font-size: 0.9rem; color: #2d3748; overflow-wrap: anywhere; word-break: break-word;">${item.name || '-'}</span>
                <span style="font-size: 0.78rem; color: #4a5568; white-space: nowrap; font-variant-numeric: tabular-nums; background: #f7fafc; padding: 2px 7px; border: 1px solid #e2e8f0; border-radius: 4px;">${cardText}</span>
            </div>
            <div style="font-size: 0.78rem; color: #718096; margin-top: 3px; display: flex; flex-wrap: wrap; gap: 10px;">
                ${accText ? `<span><span style="font-family: monospace; color: #4a5568;">${accText}</span></span>` : ''}
                ${typeText ? `<span>${typeText}</span>` : ''}
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
    if (item.citNo || item.citizenshipNo) {
        document.getElementById('inBeneficiaryCitNo').value = item.citNo || item.citizenshipNo;
    }

    const cat = item.allowanceType || item.category || '';
    if (cat) {
        const selCat = document.getElementById('selBenefitCategory');
        if (selCat) {
            let found = false;
            for (let opt of selCat.options) {
                if (opt.value === cat) {
                    selCat.value = cat;
                    found = true;
                    break;
                }
            }
            if (!found) {
                const opt = document.createElement('option');
                opt.value = cat;
                opt.textContent = cat;
                selCat.appendChild(opt);
                selCat.value = cat;
            }
        }
    }

    selectedBeneficiaryCardNo = item.cardNo || '';

    const badge = document.getElementById('selectedBeneficiaryBadge');
    if (badge) {
        badge.style.display = 'flex';
        document.getElementById('selectedBeneficiaryNameText').innerText = item.name || '';
        document.getElementById('selectedBeneficiaryMetaText').innerText = `(परिचयपत्र: ${toNepaliDigit(item.cardNo || '-')}${cat ? `, वर्ग: ${cat}` : ''})`;
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

function parseHtmlTableBeneficiaries(html, sourceName) {
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    const tdRegex = /<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi;
    const stripTags = str => str.replace(/<[^>]+>/g, '').replace(/&nbsp;/gi, ' ').trim();

    let trMatch;
    const rows = [];
    while ((trMatch = trRegex.exec(html)) !== null) {
        const rowContent = trMatch[1];
        let tdMatch;
        const cells = [];
        while ((tdMatch = tdRegex.exec(rowContent)) !== null) {
            cells.push(stripTags(tdMatch[1]));
        }
        if (cells.length > 0) rows.push(cells);
    }

    if (rows.length < 2) return [];

    const headers = rows[0];
    const colMap = {};
    headers.forEach((h, idx) => { colMap[h] = idx; });

    const idxName = colMap['पुरा नाम'];
    const idxAcc = colMap['बैंक खाता नं.'];
    const idxCard = colMap['व्यक्तिगत परिचय नं.'];
    const idxType = colMap['सामाजिक सुरक्षाको किसिम'] ?? -1;
    const idxCit = colMap['नागरिकता नं'] ?? -1;
    const idxFather = colMap['बाबुको नाम'] ?? -1;
    const idxSpouse = colMap['पति/पत्नीको नाम'] ?? -1;
    const idxAge = colMap['उमेर'] ?? -1;
    const idxAddr = colMap['ठेगाना'] ?? -1;

    if (idxName === undefined || idxAcc === undefined || idxCard === undefined) {
        return [];
    }

    const seenIds = new Set();
    const records = [];

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length <= Math.max(idxName, idxAcc, idxCard)) continue;

        const name = (row[idxName] || '').trim();
        const cardNo = (row[idxCard] || '').trim();
        const accountNo = (row[idxAcc] || '').trim();

        if (!name || !cardNo) continue;
        if (seenIds.has(cardNo)) continue;
        seenIds.add(cardNo);

        const rec = {
            name: name,
            cardNo: cardNo,
            accountNo: accountNo,
            allowanceType: idxType >= 0 ? (row[idxType] || '').trim() : '',
            citNo: idxCit >= 0 ? (row[idxCit] || '').trim() : '',
            fatherName: idxFather >= 0 ? (row[idxFather] || '').trim() : '',
            spouseName: idxSpouse >= 0 ? (row[idxSpouse] || '').trim() : '',
            age: idxAge >= 0 ? (row[idxAge] || '').trim() : '',
            address: idxAddr >= 0 ? (row[idxAddr] || '').trim() : ''
        };
        records.push(rec);
    }
    return records;
}

function handleExcelFileSelect(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            const records = parseHtmlTableBeneficiaries(content, file.name);
            if (records.length > 0) {
                beneficiaryRegister = records.map(r => preIndexBeneficiaryItem(r));
                isBeneficiaryRegisterLoaded = true;
                try {
                    localStorage.setItem(BENEFICIARY_CACHE_KEY, JSON.stringify(records));
                    localStorage.setItem(BENEFICIARY_CACHE_TIME_KEY, String(Date.now()));
                } catch(e) {}
                updateBeneficiaryStatusBadge();
                alert(`सफलतापूर्वक ${toNepaliDigit(records.length)} जना लाभग्राहीहरूको विवरण एक्सेलबाट लोड गरियो ।`);
            } else {
                alert("एक्सेल फाइलबाट लाभग्राही रेकर्ड फेला परेन। कृपया DoNIDCR ढाँचाको सही फाइल छनोट गर्नुहोस्।");
            }
        } catch(err) {
            console.error("Excel parse error:", err);
            alert("फाइल पढ्न सकिएन: " + err.message);
        }
    };
    reader.readAsText(file, 'utf-8');
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
    loadStoredChairSigSettings();
    loadStoredSpecimenBoxLayout();
    initSpecimenBoxDraggable();
    switchPreviewPage(1);
    updateDoc();
});
