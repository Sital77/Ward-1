// ══════════════════════════════════════════════════════
//  script-nabalak-parichayapatra.js
//  नाबालक परिचय पत्र सिफारिस — Firebase Firestore Logic & UI Handlers
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
let currentUploadedPhotoData = null;

// Auth ready भएपछि मात्र snapshot listener start गर्ने
(window._firebaseAuthReady || Promise.resolve()).then(() => {
    db.collection("nabalakRecords").onSnapshot((snapshot) => {
        globalDatabase = [];
        snapshot.forEach((doc) => {
            globalDatabase.push({ id: doc.id, ...doc.data() });
        });
        globalDatabase.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        renderDatabaseTable();
    });
}).catch(() => {});


// ── Helpers ─────────────────────────────────────────
function toNepaliDigit(num) {
    const nd = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return (num || '').toString().split('').map(d => nd[d] || d).join('');
}

function toEnglishDigit(num) {
    const ndMap = { '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9' };
    return (num || '').toString().split('').map(d => ndMap[d] || d).join('');
}

function getSelectedAY() {
    const radios = document.querySelectorAll('input[name="ayRadio"]');
    for (const r of radios) { if (r.checked) return r.value; }
    return '२०८३/०८४';
}

// ── Tabs Navigation Handler (Screenshot 3 style) ────────
function switchTab(tabId, btnElement) {
    const allTabs = document.querySelectorAll('.custom-tab-content');
    const allBtns = document.querySelectorAll('.custom-tab-btn');

    allTabs.forEach(t => t.classList.remove('active'));
    allBtns.forEach(b => b.classList.remove('active'));

    const targetTab = document.getElementById(tabId);
    if (targetTab) targetTab.classList.add('active');
    if (btnElement) btnElement.classList.add('active');
}

// ── Photo Upload & Management (Screenshot 1 style) ──────
function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        currentUploadedPhotoData = e.target.result;

        // Update input side preview
        const container = document.getElementById('photoPreviewContainer');
        if (container) {
            container.innerHTML = `<img src="${currentUploadedPhotoData}" alt="Uploaded Photo">`;
        }

        // Update remove button
        const btnRemove = document.getElementById('btnRemovePhoto');
        if (btnRemove) btnRemove.style.display = 'inline-block';

        // Update print preview side
        const printBox = document.getElementById('lblPhotoBox');
        if (printBox) {
            printBox.innerHTML = `<img src="${currentUploadedPhotoData}" alt="Photo" style="max-width:100%; max-height:100%; object-fit:cover;">`;
        }
    };
    reader.readAsDataURL(file);
}

function removePhoto() {
    currentUploadedPhotoData = null;
    const container = document.getElementById('photoPreviewContainer');
    if (container) {
        container.innerHTML = `<span style="font-size: 2rem; color: #a0aec0;">👤</span>`;
    }
    const btnRemove = document.getElementById('btnRemovePhoto');
    if (btnRemove) btnRemove.style.display = 'none';
    const photoInput = document.getElementById('inPhotoUpload');
    if (photoInput) photoInput.value = '';

    const printBox = document.getElementById('lblPhotoBox');
    if (printBox) {
        printBox.innerHTML = `फोटो`;
    }
}

// ── Address Helpers ─────────────────────────────────
function copyBirthToPermanent() {
    const chk = document.getElementById('chkSameAsBirth');
    if (!chk || !chk.checked) return;

    const dist = document.getElementById('inBirthDistrict').value.trim();
    const rm = document.getElementById('inBirthRM').value.trim();
    const ward = document.getElementById('inBirthWard').value.trim();

    if (dist) document.getElementById('inPermDistrict').value = dist;
    if (rm) document.getElementById('inPermRM').value = rm;
    if (ward) {
        const wardSelect = document.getElementById('inPermWard');
        for (let i = 0; i < wardSelect.options.length; i++) {
            if (wardSelect.options[i].value === ward || toNepaliDigit(wardSelect.options[i].value) === ward) {
                wardSelect.selectedIndex = i;
                break;
            }
        }
    }
}

// ── DOB & Age Converter ─────────────────────────────
function autoFormatDateInput(elem, sep = '/') {
    if (!elem) return;
    let val = elem.value.trim();
    if (!val) return;

    // If pure 8 digits without separators (e.g., 20610202 or २०६१०२०२)
    if (/^[०-९0-9]{8}$/.test(val)) {
        elem.value = val.slice(0, 4) + sep + val.slice(4, 6) + sep + val.slice(6, 8);
        return;
    }
    // If pure 5 digits (e.g., 20610 or २०६१०) -> user just typed the 5th digit
    if (/^[०-९0-9]{5}$/.test(val)) {
        elem.value = val.slice(0, 4) + sep + val.slice(4);
        return;
    }
    // If pure 6 digits without separator (e.g., 206102 or २०६१०२)
    if (/^[०-९0-9]{6}$/.test(val)) {
        elem.value = val.slice(0, 4) + sep + val.slice(4, 6);
        return;
    }
    // If pure 7 digits without separator (e.g., 2061020 or २०६१०२०)
    if (/^[०-९0-9]{7}$/.test(val)) {
        elem.value = val.slice(0, 4) + sep + val.slice(4, 6) + sep + val.slice(6);
        return;
    }
    // If 4 digits + separator + 3 digits (e.g., 2061/020 or २०६१/०२० or 2061-020)
    if (/^[०-९0-9]{4}[/.-][०-९0-9]{3}$/.test(val)) {
        elem.value = val.slice(0, 7) + sep + val.slice(7);
        return;
    }
    // If 4 digits + separator + 4 digits without second separator (e.g., 2061/0202 or २०६१/०२०२)
    if (/^[०-९0-9]{4}[/.-][०-९0-9]{4}$/.test(val)) {
        elem.value = val.slice(0, 7) + sep + val.slice(7, 9);
        return;
    }
}

function autoConvertBsToAd() {
    try {
        const bsInputElem = document.getElementById('inDOB_BS');
        if (!bsInputElem) return;
        autoFormatDateInput(bsInputElem, '/');
        const bsDateStr = bsInputElem.value.trim();
        if (!bsDateStr) return;

        // Convert any Nepali digits (`०-९`) to English digits (`0-9`)
        const engDateStr = toEnglishDigit(bsDateStr).replace(/[.-]/g, '/').trim();
        const parts = engDateStr.split('/');
        if (parts.length === 3) {
            const yr = parseInt(parts[0], 10);
            const mo = parseInt(parts[1], 10);
            const da = parseInt(parts[2], 10);
            if (!isNaN(yr) && !isNaN(mo) && !isNaN(da) && yr >= 1970 && yr <= 2100 && mo >= 1 && mo <= 12 && da >= 1 && da <= 32) {
                const converter = window["@sbmdkl/nepali-date-converter"];
                if (converter && typeof converter.bsToAd === 'function') {
                    let adResult = null;
                    const strDash = `${yr}-${String(mo).padStart(2, '0')}-${String(da).padStart(2, '0')}`;
                    const strSlash = `${yr}/${String(mo).padStart(2, '0')}/${String(da).padStart(2, '0')}`;
                    try {
                        adResult = converter.bsToAd(strDash);
                    } catch (err1) {
                        try {
                            adResult = converter.bsToAd(strSlash);
                        } catch (err2) { }
                    }

                    let adFormatted = '';
                    if (adResult instanceof Date || (typeof adResult === 'object' && adResult !== null && typeof adResult.getFullYear === 'function')) {
                        const adYr = adResult.getFullYear();
                        const adMo = String(adResult.getMonth() + 1).padStart(2, '0');
                        const adDa = String(adResult.getDate()).padStart(2, '0');
                        adFormatted = `${adYr}-${adMo}-${adDa}`;
                    } else if (typeof adResult === 'string' && adResult.trim() !== '') {
                        adFormatted = adResult.trim().replace(/\//g, '-');
                    }

                    if (adFormatted) {
                        const adElem = document.getElementById('inDOB_AD');
                        if (adElem && adElem.value !== adFormatted) {
                            adElem.value = adFormatted;
                            if (typeof updateDoc === 'function') updateDoc();
                        }
                    }
                }
            }
        }
    } catch (e) { }
}

function calculateApproxAge(bsDateStr) {
    if (!bsDateStr) return '....';
    const engDateStr = toEnglishDigit(bsDateStr);
    const parts = engDateStr.split(/[-/.]/);
    if (parts.length > 0) {
        const yr = parseInt(parts[0], 10);
        if (!isNaN(yr) && yr > 2000) {
            let currBsYr = 2083;
            try {
                const converter = window["@sbmdkl/nepali-date-converter"];
                if (converter && typeof converter.adToBs === 'function') {
                    const today = new Date();
                    const bsToday = converter.adToBs(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
                    if (typeof bsToday === 'string') {
                        const todayYr = parseInt(bsToday.split(/[-/.]/)[0], 10);
                        if (!isNaN(todayYr) && todayYr > 2000) currBsYr = todayYr;
                    }
                }
            } catch (e) { }
            const age = currBsYr - yr;
            return age > 0 ? toNepaliDigit(age) : '०';
        }
    }
    return '....';
}

function autoFillGuardian(type) {
    const permRM = document.getElementById('inPermRM').value.trim();
    const permWard = document.getElementById('inPermWard').value;
    const permDist = document.getElementById('inPermDistrict').value.trim();

    if (type === 'father') {
        const fatherNP = document.getElementById('inFatherNameNP').value.trim();
        const fatherAddr = document.getElementById('inFatherAddress').value.trim();
        const fatherCit = document.getElementById('inFatherCitNo').value.trim();
        const fatherType = document.getElementById('inFatherCitType').value;
        const fatherDist = document.getElementById('inFatherCitDist').value.trim();
        const fatherNid = document.getElementById('inFatherNidNo').value.trim();

        let addr = fatherAddr;
        if (!addr && permRM && permDist) {
            addr = `${permRM}-${permWard}, ${permDist}`;
        }
        document.getElementById('inGuardianNameAddr').value = fatherNP ? `${fatherNP} (बुबा)${addr ? ', ' + addr : ''}` : '';
        document.getElementById('inGuardianCitNo').value = fatherCit;
        document.getElementById('inGuardianCitType').value = fatherType;
        document.getElementById('inGuardianCitDist').value = fatherDist;
        document.getElementById('inGuardianNidNo').value = fatherNid;
    } else if (type === 'mother') {
        const motherNP = document.getElementById('inMotherNameNP').value.trim();
        const motherAddr = document.getElementById('inMotherAddress').value.trim();
        const motherCit = document.getElementById('inMotherCitNo').value.trim();
        const motherType = document.getElementById('inMotherCitType').value;
        const motherDist = document.getElementById('inMotherCitDist').value.trim();
        const motherNid = document.getElementById('inMotherNidNo').value.trim();

        let addr = motherAddr;
        if (!addr && permRM && permDist) {
            addr = `${permRM}-${permWard}, ${permDist}`;
        }
        document.getElementById('inGuardianNameAddr').value = motherNP ? `${motherNP} (आमा)${addr ? ', ' + addr : ''}` : '';
        document.getElementById('inGuardianCitNo').value = motherCit;
        document.getElementById('inGuardianCitType').value = motherType;
        document.getElementById('inGuardianCitDist').value = motherDist;
        document.getElementById('inGuardianNidNo').value = motherNid;
    } else {
        document.getElementById('inGuardianNameAddr').value = '';
        document.getElementById('inGuardianCitNo').value = '';
        document.getElementById('inGuardianCitType').value = '';
        document.getElementById('inGuardianCitDist').value = '';
        document.getElementById('inGuardianNidNo').value = '';
    }
    updateDoc();
}

// ── Main UI Update Document Function ─────────────────
function updateDoc() {
    // Sync guardian if selected father/mother
    const guardSelect = document.querySelector('input[name="guardSelect"]:checked');
    const permRM_raw = document.getElementById('inPermRM').value.trim();
    const permWard_raw = document.getElementById('inPermWard').value;
    const permDist_raw = document.getElementById('inPermDistrict').value.trim();

    if (guardSelect && guardSelect.value === 'father') {
        const fatherNP_raw = document.getElementById('inFatherNameNP').value.trim();
        const fatherAddr_raw = document.getElementById('inFatherAddress').value.trim();
        const fatherCit_raw = document.getElementById('inFatherCitNo').value.trim();
        const fatherType_raw = document.getElementById('inFatherCitType').value;
        const fatherDist_raw = document.getElementById('inFatherCitDist').value.trim();
        const fatherNid_raw = document.getElementById('inFatherNidNo').value.trim();

        let addr = fatherAddr_raw;
        if (!addr && permRM_raw && permDist_raw) {
            addr = `${permRM_raw}-${permWard_raw}, ${permDist_raw}`;
        }
        document.getElementById('inGuardianNameAddr').value = fatherNP_raw ? `${fatherNP_raw} (बुबा)${addr ? ', ' + addr : ''}` : '';
        document.getElementById('inGuardianCitNo').value = fatherCit_raw;
        document.getElementById('inGuardianCitType').value = fatherType_raw;
        document.getElementById('inGuardianCitDist').value = fatherDist_raw;
        document.getElementById('inGuardianNidNo').value = fatherNid_raw;
    } else if (guardSelect && guardSelect.value === 'mother') {
        const motherNP_raw = document.getElementById('inMotherNameNP').value.trim();
        const motherAddr_raw = document.getElementById('inMotherAddress').value.trim();
        const motherCit_raw = document.getElementById('inMotherCitNo').value.trim();
        const motherType_raw = document.getElementById('inMotherCitType').value;
        const motherDist_raw = document.getElementById('inMotherCitDist').value.trim();
        const motherNid_raw = document.getElementById('inMotherNidNo').value.trim();

        let addr = motherAddr_raw;
        if (!addr && permRM_raw && permDist_raw) {
            addr = `${permRM_raw}-${permWard_raw}, ${permDist_raw}`;
        }
        document.getElementById('inGuardianNameAddr').value = motherNP_raw ? `${motherNP_raw} (आमा)${addr ? ', ' + addr : ''}` : '';
        document.getElementById('inGuardianCitNo').value = motherCit_raw;
        document.getElementById('inGuardianCitType').value = motherType_raw;
        document.getElementById('inGuardianCitDist').value = motherDist_raw;
        document.getElementById('inGuardianNidNo').value = motherNid_raw;
    }

    // 1. Names
    const firstNP = document.getElementById('inNameFirstNP').value.trim();
    const midNP = document.getElementById('inNameMidNP').value.trim();
    const lastNP = document.getElementById('inNameLastNP').value.trim();
    const fullNP = [firstNP, midNP, lastNP].filter(Boolean).join(' ') || '................';

    const firstEN = document.getElementById('inNameFirstEN').value.trim();
    const midEN = document.getElementById('inNameMidEN').value.trim();
    const lastEN = document.getElementById('inNameLastEN').value.trim();
    const fullEN = [firstEN, midEN, lastEN].filter(Boolean).join(' ').toUpperCase() || '................';

    document.getElementById('lblNameNP_tbl').innerText = fullNP;
    if (document.getElementById('lblNameEN_tbl')) document.getElementById('lblNameEN_tbl').innerText = fullEN;
    if (document.getElementById('lblNameNP_Sif')) document.getElementById('lblNameNP_Sif').innerText = fullNP;

    // Page 2 Name Bindings
    if (document.getElementById('lblNameNP_P2')) document.getElementById('lblNameNP_P2').innerText = fullNP;
    if (document.getElementById('lblNameNP_P2_box')) document.getElementById('lblNameNP_P2_box').innerText = fullNP;
    if (document.getElementById('lblNameNP_P2_right')) document.getElementById('lblNameNP_P2_right').innerText = fullNP;

    // 2. Birth Reg No & DOB
    const birthRegNo = document.getElementById('inBirthRegNo').value.trim() || '................';
    if (document.getElementById('lblBirthReg_tbl')) document.getElementById('lblBirthReg_tbl').innerText = birthRegNo;
    if (document.getElementById('lblBirthRegEN_tbl')) document.getElementById('lblBirthRegEN_tbl').innerText = birthRegNo !== '................' ? toEnglishDigit(birthRegNo) : '................';

    if (typeof autoFormatDateInput === 'function') autoFormatDateInput(document.getElementById('inDOB_AD'), '-');
    const dobBS = document.getElementById('inDOB_BS').value.trim();
    const dobAD = document.getElementById('inDOB_AD').value.trim();

    // Split DOB BS
    const engDobBS = toEnglishDigit(dobBS);
    const bsParts = engDobBS.split(/[-/.]/);
    if (document.getElementById('lblDOB_BS_Year')) document.getElementById('lblDOB_BS_Year').innerText = bsParts[0] ? toNepaliDigit(bsParts[0]) : '.........';
    if (document.getElementById('lblDOB_BS_Month')) document.getElementById('lblDOB_BS_Month').innerText = bsParts[1] ? toNepaliDigit(bsParts[1].padStart(2, '0')) : '...............';
    if (document.getElementById('lblDOB_BS_Day')) document.getElementById('lblDOB_BS_Day').innerText = bsParts[2] ? toNepaliDigit(bsParts[2].padStart(2, '0')) : '................';

    // Split DOB AD
    const engDobAD = toEnglishDigit(dobAD);
    const adParts = engDobAD.split(/[-/.]/);
    if (document.getElementById('lblDOB_AD_Year')) document.getElementById('lblDOB_AD_Year').innerText = adParts[0] || '.........';
    if (document.getElementById('lblDOB_AD_Month')) document.getElementById('lblDOB_AD_Month').innerText = adParts[1] ? adParts[1].padStart(2, '0') : '...............';
    if (document.getElementById('lblDOB_AD_Day')) document.getElementById('lblDOB_AD_Day').innerText = adParts[2] ? adParts[2].padStart(2, '0') : '................';

    if (document.getElementById('lblDOB_Sif')) document.getElementById('lblDOB_Sif').innerText = dobBS ? toNepaliDigit(engDobBS.replace(/[.-]/g, '/')) : '................';
    if (document.getElementById('lblAge_Sif')) document.getElementById('lblAge_Sif').innerText = calculateApproxAge(dobBS);

    // 3. Gender, Religion, Caste, Contact
    const genderVal = document.getElementById('inGender').value || 'पुरुष|Male';
    const [genNP, genEN] = genderVal.split('|');
    if (document.getElementById('lblGenderNP_tbl')) document.getElementById('lblGenderNP_tbl').innerText = genNP || '................';
    if (document.getElementById('lblGenderEN_tbl')) document.getElementById('lblGenderEN_tbl').innerText = genEN || '................';
    const relText = (genNP === 'महिला') ? 'छोरी' : ((genNP === 'अन्य') ? 'छोरा/छोरी' : 'छोरा');
    const titleText = (genNP === 'महिला') ? 'सुश्री' : ((genNP === 'अन्य') ? 'श्री/सुश्री' : 'श्री');
    if (document.getElementById('lblRelation_Sif')) document.getElementById('lblRelation_Sif').innerText = relText;
    if (document.getElementById('lblRelation_P2_box')) document.getElementById('lblRelation_P2_box').innerText = relText;
    if (document.getElementById('lblTitle_Sif')) document.getElementById('lblTitle_Sif').innerText = titleText;

    const relVal = document.getElementById('inReligion').value || '';
    const relENMap = { 'हिन्दू': 'Hindu', 'बौद्ध': 'Buddhist', 'किरात': 'Kirat', 'क्रिश्चियन': 'Christian', 'इस्लाम': 'Islam', 'अन्य': 'Other' };
    if (document.getElementById('lblReligion_tbl')) document.getElementById('lblReligion_tbl').innerText = relVal || '................';
    if (document.getElementById('lblReligionEN_tbl')) document.getElementById('lblReligionEN_tbl').innerText = relENMap[relVal] || '................';

    const casteVal = document.getElementById('inCaste').value.trim() || '................';
    if (document.getElementById('lblCaste_tbl')) document.getElementById('lblCaste_tbl').innerText = casteVal;
    if (document.getElementById('lblCasteEN_tbl')) document.getElementById('lblCasteEN_tbl').innerText = casteVal.toUpperCase();

    const contactNo = document.getElementById('inContactNo').value.trim() || '................................';
    if (document.getElementById('lblContact_tbl')) document.getElementById('lblContact_tbl').innerText = contactNo;

    // 4. Addresses
    const birthDist = document.getElementById('inBirthDistrict').value.trim() || '................';
    const birthRM = document.getElementById('inBirthRM').value.trim() || '................';
    const birthWard = document.getElementById('inBirthWard').value.trim() || '....';

    let birthPlaceNP = '................';
    if (birthDist !== '................' || birthRM !== '................') {
        birthPlaceNP = `${birthRM} - ${birthWard}, ${birthDist}`;
    }
    if (document.getElementById('lblBirthPlaceNP_tbl')) document.getElementById('lblBirthPlaceNP_tbl').innerText = birthPlaceNP;
    if (document.getElementById('lblRecRM_Sif')) document.getElementById('lblRecRM_Sif').innerText = birthRM;
    if (document.getElementById('lblRecWard_Sif')) document.getElementById('lblRecWard_Sif').innerText = birthWard;

    const birthPlaceEN = document.getElementById('inBirthPlaceEN').value.trim() || (birthRM !== '................' ? `${birthRM.toUpperCase()}-${birthWard}, ${birthDist.toUpperCase()}` : '................');
    if (document.getElementById('lblBirthPlaceEN_tbl')) document.getElementById('lblBirthPlaceEN_tbl').innerText = birthPlaceEN;

    const permProv = document.getElementById('inPermProvince').value.trim() || '................';
    const permDist = document.getElementById('inPermDistrict').value.trim() || '................';
    const permRM = document.getElementById('inPermRM').value.trim() || '................';
    const permWard = document.getElementById('inPermWard').value || '....';
    const permToleNP = document.getElementById('inPermToleNP').value.trim() || '................';

    if (document.getElementById('lblPermProv_tbl')) document.getElementById('lblPermProv_tbl').innerText = permProv;
    if (document.getElementById('lblPermDist_tbl')) document.getElementById('lblPermDist_tbl').innerText = permDist;
    if (document.getElementById('lblPermRM_tbl')) document.getElementById('lblPermRM_tbl').innerText = permRM;
    if (document.getElementById('lblPermWard_tbl')) document.getElementById('lblPermWard_tbl').innerText = permWard;
    if (document.getElementById('lblPermToleNP_tbl')) document.getElementById('lblPermToleNP_tbl').innerText = permToleNP;
    if (document.getElementById('lblPermRM_Sif')) document.getElementById('lblPermRM_Sif').innerText = permRM;
    if (document.getElementById('lblPermWard_Sif')) document.getElementById('lblPermWard_Sif').innerText = permWard;

    // Permanent Address EN
    const provENMap = { 'कोशी': 'KOSHI', 'मधेश': 'MADHESH', 'बागमती': 'BAGMATI', 'गण्डकी': 'GANDAKI', 'लुम्बिनी': 'LUMBINI', 'कर्णाली': 'KARNALI', 'सुदूरपश्चिम': 'SUDURPASCHIM' };
    if (document.getElementById('lblPermProvEN_tbl')) document.getElementById('lblPermProvEN_tbl').innerText = provENMap[permProv] || (permProv !== '................' ? permProv.toUpperCase() : '................');
    if (document.getElementById('lblPermDistEN_tbl')) document.getElementById('lblPermDistEN_tbl').innerText = permDist !== '................' ? permDist.toUpperCase() : '................';
    if (document.getElementById('lblPermRM_EN_tbl')) document.getElementById('lblPermRM_EN_tbl').innerText = permRM !== '................' ? permRM.toUpperCase() : '................';
    if (document.getElementById('lblPermWard_EN_tbl')) document.getElementById('lblPermWard_EN_tbl').innerText = permWard !== '....' ? toEnglishDigit(permWard) : '....';
    if (document.getElementById('lblPermToleEN_tbl')) document.getElementById('lblPermToleEN_tbl').innerText = permToleNP !== '................' ? permToleNP.toUpperCase() : '................';

    // 5. Family Tabs Details
    const fatherNP = document.getElementById('inFatherNameNP').value.trim() || '................';
    const fatherAddr = document.getElementById('inFatherAddress').value.trim() || (permRM !== '................' ? `${permRM} - ${permWard}, ${permDist}` : '................');
    const fatherCit = document.getElementById('inFatherCitNo').value.trim() || '................';
    const fatherType = (document.getElementById('inFatherCitType') ? document.getElementById('inFatherCitType').value.trim() : '') || '................';
    const fatherDist = (document.getElementById('inFatherCitDist') ? document.getElementById('inFatherCitDist').value.trim() : '') || '................';
    const fatherNid = (document.getElementById('inFatherNidNo') ? document.getElementById('inFatherNidNo').value.trim() : '') || '................';

    if (document.getElementById('lblFatherName_tbl')) document.getElementById('lblFatherName_tbl').innerText = fatherNP;
    if (document.getElementById('lblFatherAddr_tbl')) document.getElementById('lblFatherAddr_tbl').innerText = fatherAddr;
    if (document.getElementById('lblFatherCit_tbl')) {
        document.getElementById('lblFatherCit_tbl').innerText = fatherCit.includes(',') ? fatherCit.split(',')[0].trim() : fatherCit;
    }
    if (document.getElementById('lblFatherCitType_tbl')) document.getElementById('lblFatherCitType_tbl').innerText = fatherType;
    if (document.getElementById('lblFatherCitDist_tbl')) document.getElementById('lblFatherCitDist_tbl').innerText = fatherDist;
    if (document.getElementById('lblFatherNid_tbl')) document.getElementById('lblFatherNid_tbl').innerText = fatherNid;

    const motherNP = document.getElementById('inMotherNameNP').value.trim() || '................';
    const motherAddr = document.getElementById('inMotherAddress').value.trim() || (permRM !== '................' ? `${permRM} - ${permWard}, ${permDist}` : '................');
    const motherCit = document.getElementById('inMotherCitNo').value.trim() || '................';
    const motherType = (document.getElementById('inMotherCitType') ? document.getElementById('inMotherCitType').value.trim() : '') || '................';
    const motherDist = (document.getElementById('inMotherCitDist') ? document.getElementById('inMotherCitDist').value.trim() : '') || '................';
    const motherNid = (document.getElementById('inMotherNidNo') ? document.getElementById('inMotherNidNo').value.trim() : '') || '................';

    if (document.getElementById('lblMotherName_tbl')) document.getElementById('lblMotherName_tbl').innerText = motherNP;
    if (document.getElementById('lblMotherAddr_tbl')) document.getElementById('lblMotherAddr_tbl').innerText = motherAddr;
    if (document.getElementById('lblMotherCit_tbl')) {
        document.getElementById('lblMotherCit_tbl').innerText = motherCit.includes(',') ? motherCit.split(',')[0].trim() : motherCit;
    }
    if (document.getElementById('lblMotherCitType_tbl')) document.getElementById('lblMotherCitType_tbl').innerText = motherType;
    if (document.getElementById('lblMotherCitDist_tbl')) document.getElementById('lblMotherCitDist_tbl').innerText = motherDist;
    if (document.getElementById('lblMotherNid_tbl')) document.getElementById('lblMotherNid_tbl').innerText = motherNid;

    const guardianNP = document.getElementById('inGuardianNameAddr').value.trim() || '................';
    const guardCit = document.getElementById('inGuardianCitNo').value.trim() || '................';
    const guardType = (document.getElementById('inGuardianCitType') ? document.getElementById('inGuardianCitType').value.trim() : '') || '................';
    const guardDist = (document.getElementById('inGuardianCitDist') ? document.getElementById('inGuardianCitDist').value.trim() : '') || '................';
    const guardNid = (document.getElementById('inGuardianNidNo') ? document.getElementById('inGuardianNidNo').value.trim() : '') || '................';

    if (document.getElementById('lblGuardian_tbl')) document.getElementById('lblGuardian_tbl').innerText = guardianNP;
    if (document.getElementById('lblGuardianCit_tbl')) document.getElementById('lblGuardianCit_tbl').innerText = guardCit;
    if (document.getElementById('lblGuardianCitType_tbl')) document.getElementById('lblGuardianCitType_tbl').innerText = guardType;
    if (document.getElementById('lblGuardianNid_tbl')) document.getElementById('lblGuardianNid_tbl').innerText = guardNid;

    const grandfatherNP = (document.getElementById('inGrandfatherName') ? document.getElementById('inGrandfatherName').value.trim() : '') || '................';
    const grandfatherNid = (document.getElementById('inGrandfatherNidNo') ? document.getElementById('inGrandfatherNidNo').value.trim() : '') || '................';
    const grandmotherNP = (document.getElementById('inGrandmotherName') ? document.getElementById('inGrandmotherName').value.trim() : '') || '................';
    const grandmotherNid = (document.getElementById('inGrandmotherNidNo') ? document.getElementById('inGrandmotherNidNo').value.trim() : '') || '................';

    if (document.getElementById('lblGrandfatherName_tbl')) document.getElementById('lblGrandfatherName_tbl').innerText = grandfatherNP;
    if (document.getElementById('lblGrandfatherNid_tbl')) document.getElementById('lblGrandfatherNid_tbl').innerText = grandfatherNid;
    if (document.getElementById('lblGrandmotherName_tbl')) document.getElementById('lblGrandmotherName_tbl').innerText = grandmotherNP;
    if (document.getElementById('lblGrandmotherNid_tbl')) document.getElementById('lblGrandmotherNid_tbl').innerText = grandmotherNid;

    // Page 1 Submit Box Bindings (Nivedak ko Namthar, Thegana, Nata)
    const activeTabFather = document.getElementById('tabFather') && document.getElementById('tabFather').classList.contains('active');
    const activeTabMother = document.getElementById('tabMother') && document.getElementById('tabMother').classList.contains('active');
    const activeTabGuard = document.getElementById('tabGuardian') && document.getElementById('tabGuardian').classList.contains('active');

    let submitName = fatherNP;
    let submitAddr = fatherAddr;
    let submitRel = 'बाबु';

    if (activeTabMother) {
        submitName = motherNP;
        submitAddr = motherAddr;
        submitRel = 'आमा';
    } else if (activeTabGuard) {
        submitName = guardianNP;
        submitAddr = (permRM !== '................') ? `${permRM} - ${permWard}, ${permDist}` : '................';
        submitRel = 'संरक्षक';
    }

    if (document.getElementById('lblSubmitName_P1')) document.getElementById('lblSubmitName_P1').innerText = submitName;
    if (document.getElementById('lblSubmitAddr_P1')) document.getElementById('lblSubmitAddr_P1').innerText = submitAddr;
    if (document.getElementById('lblSubmitRelation_P1')) document.getElementById('lblSubmitRelation_P1').innerText = submitRel;

    // Page 2 Recommendation & Sanakhat Bindings (Keep active Page 1 bindings only)
    if (document.getElementById('lblSifFather')) document.getElementById('lblSifFather').innerText = fatherNP;
    if (document.getElementById('lblSifMother')) document.getElementById('lblSifMother').innerText = motherNP;

    // 6. Letterhead & Dates
    const miti = document.getElementById('inMiti').value.trim() || '................';
    if (document.getElementById('lblSubmitMiti_P1')) document.getElementById('lblSubmitMiti_P1').innerText = miti;
    if (document.getElementById('lblSifarishMiti')) document.getElementById('lblSifarishMiti').innerText = miti;

    const recOfficeSel = document.getElementById('inReceiverOffice').value;
    if (recOfficeSel === 'CUSTOM') {
        const custRec = document.getElementById('inCustomReceiver').value.trim() || 'इलाका प्रशासन कार्यालय, गौरीगञ्ज ।';
        if (document.getElementById('lblReceiverOffice')) document.getElementById('lblReceiverOffice').innerHTML = `श्री प्रमुख जिल्ला अधिकारीज्यू,<br>${custRec}`;
        if (document.getElementById('inCustomReceiver')) document.getElementById('inCustomReceiver').style.display = 'block';
    } else {
        // Parse the selected value which contains the full address like 'श्री प्रमुख जिल्ला अधिकारीज्यू, इलाका प्रशासन कार्यालय, गौरीगञ्ज ।'
        const parts = recOfficeSel.split(',');
        if (parts.length >= 2) {
            const line1 = parts[0].trim();
            const line2 = parts.slice(1).join(',').trim();
            if (document.getElementById('lblReceiverOffice')) document.getElementById('lblReceiverOffice').innerHTML = `${line1},<br>${line2}`;
        } else {
            if (document.getElementById('lblReceiverOffice')) document.getElementById('lblReceiverOffice').innerHTML = recOfficeSel;
        }
        if (document.getElementById('inCustomReceiver')) document.getElementById('inCustomReceiver').style.display = 'none';
    }

    // 7. Sign Authority
    toggleCustomSign();
}

function toggleCustomSign() {
    const sel = document.getElementById('inSignAuthority').value;
    const box = document.getElementById('customSignBox');
    const contactNo = document.getElementById('inContactNo') ? document.getElementById('inContactNo').value.trim() : '................................';

    if (sel === 'CUSTOM') {
        if (box) box.style.display = 'grid';
        const cName = document.getElementById('inCustomSignName').value.trim() || '........';
        const cTitle = document.getElementById('inCustomSignTitle').value.trim() || '........';
        if (document.getElementById('lblSigName')) document.getElementById('lblSigName').innerText = cName;
        if (document.getElementById('lblSigTitle')) document.getElementById('lblSigTitle').innerText = cTitle;
        if (document.getElementById('lblSigContact')) document.getElementById('lblSigContact').innerText = contactNo || '................................';
    } else if (sel === 'BLANK') {
        if (box) box.style.display = 'none';
        if (document.getElementById('lblSigName')) document.getElementById('lblSigName').innerText = '';
        if (document.getElementById('lblSigTitle')) document.getElementById('lblSigTitle').innerText = '';
        if (document.getElementById('lblSigContact')) document.getElementById('lblSigContact').innerText = '';
    } else {
        if (box) box.style.display = 'none';
        const [name, title] = sel.split('|');
        const finalName = name || 'नगेन्द्र भण्डारी';
        const finalTitle = title || 'वडा अध्यक्ष';
        if (document.getElementById('lblSigName')) document.getElementById('lblSigName').innerText = finalName;
        if (document.getElementById('lblSigTitle')) document.getElementById('lblSigTitle').innerText = finalTitle;
        if (document.getElementById('lblSigContact')) document.getElementById('lblSigContact').innerText = contactNo || '................................';
    }
}

function adjustSignaturePosition(marginVal) {
    const section = document.getElementById('docFooterSection');
    if (section) section.style.marginTop = marginVal + 'px';
    const label = document.getElementById('marginVal');
    if (label) label.innerText = toNepaliDigit(marginVal) + ' px';
}

function updateNepalSambatFromMiti() {
    const inNS = document.getElementById('inNepalSamvat');
    if (inNS && !inNS.value) inNS.value = '११४६';
}

// ── Auto-fill Date on Page Load ─────────────────────
function initializeAutomaticDate() {
    try {
        let nepaliBSDateStr = '२०८३/०३/२६';
        const converter = window["@sbmdkl/nepali-date-converter"];
        if (converter && typeof converter.adToBs === 'function') {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            const bsDate = converter.adToBs(`${yyyy}-${mm}-${dd}`);
            if (typeof bsDate === 'string') {
                nepaliBSDateStr = toNepaliDigit(bsDate.replace(/-/g, '/'));
            }
        }
        const inMiti = document.getElementById('inMiti');
        if (inMiti && !inMiti.value) inMiti.value = nepaliBSDateStr;
        const inNS = document.getElementById('inNepalSamvat');
        if (inNS && !inNS.value) inNS.value = '११४६';
        updateDoc();
    } catch (e) { }
}

// ── Database & Modal Handlers ───────────────────────
function toggleModal(show) {
    const modal = document.getElementById('abhilekhModal');
    if (!modal) return;
    modal.style.display = show ? 'flex' : 'none';
    if (show) renderDatabaseTable();
}

function renderDatabaseTable() {
    const tbody = document.getElementById('dbTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const query = (document.getElementById('searchField') ? document.getElementById('searchField').value.trim().toLowerCase() : '');
    const filtered = globalDatabase.filter(r => {
        if (!query) return true;
        return (r.nameFirstNP || '').toLowerCase().includes(query) ||
            (r.birthRegNo || '').toLowerCase().includes(query) ||
            (r.fatherNP || '').toLowerCase().includes(query);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px; color: #718096;">कुनै अभिलेख फेला परेन ।</td></tr>`;
        return;
    }

    filtered.forEach((r, idx) => {
        const tr = document.createElement('tr');
        const fullName = [r.nameFirstNP, r.nameMidNP, r.nameLastNP].filter(Boolean).join(' ') || r.nameNP || '-';
        const father = r.fatherNP || '-';
        tr.innerHTML = `
            <td style="text-align:center;">${toNepaliDigit(idx + 1)}</td>
            <td style="font-weight:600; color:#2b6cb0;">${fullName}</td>
            <td>${r.birthRegNo || '-'}</td>
            <td>${father}</td>
            <td style="text-align:center;">
                <button onclick="populateFormForEdit('${r.id}')" style="background:#3182ce; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">✏️ खोल्नुहोस्</button>
                <button onclick="deleteFromDB('${r.id}')" style="background:#e53e3e; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; margin-left: 4px;">🗑️ हटाउनुहोस्</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function deleteFromDB(id) {
    if (confirm("के तपाईं यो रेकर्ड क्लाउड डेटाबेसबाट स्थायी रूपमा हटाउन चाहनुहुन्छ?")) {
        try {
            await db.collection("nabalakRecords").doc(id).delete();
        } catch (e) {

            alert("डिलिट गर्न समस्या भयो ।");
        }
    }
}

function populateFormForEdit(recordId) {
    const r = globalDatabase.find(item => item.id === recordId);
    if (!r) return;

    document.getElementById('editRecordIndex').value = r.id || '';
    document.getElementById('formMainTitle').innerText = "🔄 सम्पादन मोड (नाबालक परिचय पत्र)";

    if (r.chalani) document.getElementById('inChalani').value = r.chalani;
    if (r.miti) document.getElementById('inMiti').value = r.miti;
    if (r.ns) document.getElementById('inNepalSamvat').value = r.ns;
    if (r.idType) document.getElementById('inIdType').value = r.idType;
    if (r.birthRegNo) document.getElementById('inBirthRegNo').value = r.birthRegNo;
    if (r.dobBS) document.getElementById('inDOB_BS').value = r.dobBS;
    if (r.dobAD) document.getElementById('inDOB_AD').value = r.dobAD;

    if (r.nameFirstNP) document.getElementById('inNameFirstNP').value = r.nameFirstNP;
    if (r.nameMidNP) document.getElementById('inNameMidNP').value = r.nameMidNP;
    if (r.nameLastNP) document.getElementById('inNameLastNP').value = r.nameLastNP;
    if (r.nameFirstEN) document.getElementById('inNameFirstEN').value = r.nameFirstEN;
    if (r.nameMidEN) document.getElementById('inNameMidEN').value = r.nameMidEN;
    if (r.nameLastEN) document.getElementById('inNameLastEN').value = r.nameLastEN;

    if (r.gender) document.getElementById('inGender').value = r.gender;
    if (r.religion) document.getElementById('inReligion').value = r.religion;
    if (r.caste) document.getElementById('inCaste').value = r.caste;
    if (r.contactNo) document.getElementById('inContactNo').value = r.contactNo;

    if (r.photoData) {
        currentUploadedPhotoData = r.photoData;
        document.getElementById('photoPreviewContainer').innerHTML = `<img src="${currentUploadedPhotoData}" alt="Uploaded Photo">`;
        document.getElementById('btnRemovePhoto').style.display = 'inline-block';
        document.getElementById('lblPhotoBox').innerHTML = `<img src="${currentUploadedPhotoData}" alt="Photo">`;
    }

    if (r.fatherNP) document.getElementById('inFatherNameNP').value = r.fatherNP;
    if (r.fatherCit) document.getElementById('inFatherCitNo').value = r.fatherCit;
    if (r.fatherNid) document.getElementById('inFatherNidNo').value = r.fatherNid;

    if (r.motherNP) document.getElementById('inMotherNameNP').value = r.motherNP;
    if (r.motherCit) document.getElementById('inMotherCitNo').value = r.motherCit;
    if (r.motherNid) document.getElementById('inMotherNidNo').value = r.motherNid;

    if (r.spouseNP && document.getElementById('inSpouseNameNP')) document.getElementById('inSpouseNameNP').value = r.spouseNP;
    if (r.spouseAddr && document.getElementById('inSpouseAddress')) document.getElementById('inSpouseAddress').value = r.spouseAddr;
    if (r.spouseCit && document.getElementById('inSpouseCitNo')) document.getElementById('inSpouseCitNo').value = r.spouseCit;
    if (r.spouseCitType && document.getElementById('inSpouseCitType')) document.getElementById('inSpouseCitType').value = r.spouseCitType;
    if (r.spouseNid && document.getElementById('inSpouseNidNo')) document.getElementById('inSpouseNidNo').value = r.spouseNid;

    if (r.guardianNid) document.getElementById('inGuardianNidNo').value = r.guardianNid;

    if (r.grandfatherNP) document.getElementById('inGrandfatherName').value = r.grandfatherNP;
    if (r.grandfatherNid) document.getElementById('inGrandfatherNidNo').value = r.grandfatherNid;
    if (r.grandmotherNP) document.getElementById('inGrandmotherName').value = r.grandmotherNP;
    if (r.grandmotherNid) document.getElementById('inGrandmotherNidNo').value = r.grandmotherNid;

    toggleModal(false);
    updateDoc();
}

// ── Print & Save to Firestore ───────────────────────
async function printAndSaveSystem() {
    const firstNP = document.getElementById('inNameFirstNP').value.trim();
    if (!firstNP) {
        alert("कृपया निवेदक (नाबालक) को पहिलो नाम अनिवार्य लेख्नुहोस् ।");
        return;
    }

    const fatherNP = document.getElementById('inFatherNameNP').value.trim();
    const motherNP = document.getElementById('inMotherNameNP').value.trim();
    const birthReg = document.getElementById('inBirthRegNo').value.trim();
    const dobBS = document.getElementById('inDOB_BS').value.trim();

    const birthDist = document.getElementById('inBirthDistrict').value.trim();
    const birthRM = document.getElementById('inBirthRM').value.trim();
    const birthWard = document.getElementById('inBirthWard').value.trim();

    const permDist = document.getElementById('inPermDistrict').value.trim();
    const permRM = document.getElementById('inPermRM').value.trim();
    const permWard = document.getElementById('inPermWard').value;

    let missingFields = [];
    if (!fatherNP && !motherNP) {
        missingFields.push("बुबा वा आमाको नाम");
    }
    if (!birthReg) {
        missingFields.push("जन्म दर्ता नम्बर");
    }
    if (!dobBS) {
        missingFields.push("जन्म मिति");
    }
    if (!birthDist || !birthRM || !birthWard) {
        missingFields.push("जन्मस्थान");
    }
    if (!permDist || !permRM || !permWard) {
        missingFields.push("स्थायी बसोबास");
    }

    if (missingFields.length > 0) {
        alert("तपाईंले निम्न विवरणहरू हाल्न बिर्सिनुभयो, कृपया विवरणहरू थप्नुहोस्:\n- " + missingFields.join("\n- "));
        return;
    }

    const recordId = document.getElementById('editRecordIndex').value;

    const obj = {
        ay: getSelectedAY(),
        chalani: document.getElementById('inChalani').value.trim() || '-',
        miti: document.getElementById('inMiti').value.trim() || '-',
        ns: document.getElementById('inNepalSamvat').value.trim() || '-',
        idType: document.getElementById('inIdType').value,
        birthRegNo: document.getElementById('inBirthRegNo').value.trim() || '',
        dobBS: document.getElementById('inDOB_BS').value.trim() || '',
        dobAD: document.getElementById('inDOB_AD').value.trim() || '',
        nameFirstNP: document.getElementById('inNameFirstNP').value.trim() || '',
        nameMidNP: document.getElementById('inNameMidNP').value.trim() || '',
        nameLastNP: document.getElementById('inNameLastNP').value.trim() || '',
        nameFirstEN: document.getElementById('inNameFirstEN').value.trim() || '',
        nameMidEN: document.getElementById('inNameMidEN').value.trim() || '',
        nameLastEN: document.getElementById('inNameLastEN').value.trim() || '',
        gender: document.getElementById('inGender').value,
        religion: document.getElementById('inReligion').value,
        caste: document.getElementById('inCaste').value.trim() || '',
        contactNo: document.getElementById('inContactNo').value.trim() || '',
        photoData: currentUploadedPhotoData || null,
        fatherNP: document.getElementById('inFatherNameNP').value.trim() || '',
        fatherCit: document.getElementById('inFatherCitNo').value.trim() || '',
        fatherNid: (document.getElementById('inFatherNidNo') ? document.getElementById('inFatherNidNo').value.trim() : ''),
        motherNP: document.getElementById('inMotherNameNP').value.trim() || '',
        motherCit: document.getElementById('inMotherCitNo').value.trim() || '',
        motherNid: (document.getElementById('inMotherNidNo') ? document.getElementById('inMotherNidNo').value.trim() : ''),
        spouseNP: (document.getElementById('inSpouseNameNP') ? document.getElementById('inSpouseNameNP').value.trim() : ''),
        spouseAddr: (document.getElementById('inSpouseAddress') ? document.getElementById('inSpouseAddress').value.trim() : ''),
        spouseCit: (document.getElementById('inSpouseCitNo') ? document.getElementById('inSpouseCitNo').value.trim() : ''),
        spouseCitType: (document.getElementById('inSpouseCitType') ? document.getElementById('inSpouseCitType').value : ''),
        spouseNid: (document.getElementById('inSpouseNidNo') ? document.getElementById('inSpouseNidNo').value.trim() : ''),
        guardianNid: (document.getElementById('inGuardianNidNo') ? document.getElementById('inGuardianNidNo').value.trim() : ''),
        grandfatherNP: document.getElementById('inGrandfatherName').value.trim() || '',
        grandfatherNid: (document.getElementById('inGrandfatherNidNo') ? document.getElementById('inGrandfatherNidNo').value.trim() : ''),
        grandmotherNP: (document.getElementById('inGrandmotherName') ? document.getElementById('inGrandmotherName').value.trim() : ''),
        grandmotherNid: (document.getElementById('inGrandmotherNidNo') ? document.getElementById('inGrandmotherNidNo').value.trim() : ''),
        signAuth: document.getElementById('inSignAuthority').value,
        sigMargin: document.getElementById('inSigMargin').value,
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
            await db.collection("nabalakRecords").doc(recordId).update(obj);
        } else {
            const docRef = await db.collection("nabalakRecords").add(obj);
            document.getElementById('editRecordIndex').value = docRef.id;
            document.getElementById('formMainTitle').innerText = "🔄 सम्पादन मोड (नाबालक परिचय पत्र)";
        }
        window.print();
    } catch (e) {

        alert("क्लाउडमा डाटा सुरक्षित गर्दा समस्या भयो! तर प्रिन्ट सुरु गरिँदैछ ।");
        window.print();
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
}

// ── Auto-Fill from Birth Certificate HTML ─────────────────────
function handleBirthCertUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const htmlText = e.target.result;
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, "text/html");

            function getTextByStrongLabel(doc, labelPart) {
                const strongs = doc.querySelectorAll('strong, b');
                for (let s of strongs) {
                    let sText = s.innerText || s.textContent || '';
                    if (sText.includes(labelPart)) {
                        let p = s.parentElement;
                        let fullText = p.innerText || p.textContent || '';
                        let idx = fullText.indexOf(sText);
                        if (idx !== -1) {
                            let remainder = fullText.substring(idx + sText.length).trim();
                            remainder = remainder.replace(/^[:\s-]+/, '').trim();
                            if (remainder) return remainder;
                        }
                    }
                }
                return "";
            }

            // 1. Registration No
            const regNoRaw = getTextByStrongLabel(doc, "दर्ता नम्बर (Registration No.):") || getTextByStrongLabel(doc, "दर्ता नम्बर");
            if (regNoRaw && document.getElementById('inBirthRegNo')) {
                let parts = regNoRaw.split(/\s|\(/);
                document.getElementById('inBirthRegNo').value = parts[0] || regNoRaw;
            }

            // 2. Child Full Name Nepali
            const nameNpRaw = getTextByStrongLabel(doc, "पूरा नाम :");
            if (nameNpRaw && document.getElementById('inNameFirstNP')) {
                let names = nameNpRaw.split(/\s+/);
                if (names.length === 1) {
                    document.getElementById('inNameFirstNP').value = names[0];
                    document.getElementById('inNameMidNP').value = '';
                    document.getElementById('inNameLastNP').value = '';
                } else if (names.length === 2) {
                    document.getElementById('inNameFirstNP').value = names[0];
                    document.getElementById('inNameMidNP').value = '';
                    document.getElementById('inNameLastNP').value = names[1];
                } else if (names.length >= 3) {
                    document.getElementById('inNameFirstNP').value = names[0];
                    document.getElementById('inNameLastNP').value = names[names.length - 1];
                    document.getElementById('inNameMidNP').value = names.slice(1, names.length - 1).join(' ');
                }
            }

            // 3. Child Full Name English
            const nameEnRaw = getTextByStrongLabel(doc, "Full Name :");
            if (nameEnRaw && document.getElementById('inNameFirstEN')) {
                let names = nameEnRaw.split(/\s+/);
                if (names.length === 1) {
                    document.getElementById('inNameFirstEN').value = names[0];
                    document.getElementById('inNameMidEN').value = '';
                    document.getElementById('inNameLastEN').value = '';
                } else if (names.length === 2) {
                    document.getElementById('inNameFirstEN').value = names[0];
                    document.getElementById('inNameMidEN').value = '';
                    document.getElementById('inNameLastEN').value = names[1];
                } else if (names.length >= 3) {
                    document.getElementById('inNameFirstEN').value = names[0];
                    document.getElementById('inNameLastEN').value = names[names.length - 1];
                    document.getElementById('inNameMidEN').value = names.slice(1, names.length - 1).join(' ');
                }
            }

            // 4. Gender
            const genderRaw = getTextByStrongLabel(doc, "लिङ्ग/Sex:") || getTextByStrongLabel(doc, "लिङ्ग");
            if (genderRaw && document.getElementById('inGender')) {
                if (genderRaw.includes("पुरूष") || genderRaw.includes("पुरुष") || genderRaw.toUpperCase().includes("MALE")) {
                    document.getElementById('inGender').value = "पुरुष|Male";
                } else if (genderRaw.includes("महिला") || genderRaw.toUpperCase().includes("FEMALE")) {
                    document.getElementById('inGender').value = "महिला|Female";
                } else {
                    document.getElementById('inGender').value = "अन्य|Other";
                }
            }

            // 5. DOB
            const dobRaw = getTextByStrongLabel(doc, "जन्म मिति /Date of Birth:") || getTextByStrongLabel(doc, "जन्म मिति");
            if (dobRaw && document.getElementById('inDOB_BS')) {
                let bsMatch = dobRaw.match(/([०-९]{4}[/-][०-९]{1,2}[/-][०-९]{1,2})/);
                if (bsMatch) {
                    document.getElementById('inDOB_BS').value = bsMatch[1].replace(/-/g, '/');
                    if (typeof autoConvertBsToAd === 'function') autoConvertBsToAd();
                } else {
                    let bsMatchEn = dobRaw.match(/(\d{4}[/-]\d{1,2}[/-]\d{1,2})/);
                    if (bsMatchEn) {
                        document.getElementById('inDOB_BS').value = bsMatchEn[1].replace(/-/g, '/');
                        if (typeof autoConvertBsToAd === 'function') autoConvertBsToAd();
                    }
                }
            }

            // 6. Birth Place
            const birthPlaceRaw = getTextByStrongLabel(doc, "जन्म स्थान/Birth Place:") || getTextByStrongLabel(doc, "जन्म स्थान");
            if (birthPlaceRaw) {
                let npPart = birthPlaceRaw.split('(')[0].trim();
                let wardMatch = npPart.match(/वडा\s*नं\.?\s*([०-९0-9]+)/);
                if (wardMatch && document.getElementById('inBirthWard')) document.getElementById('inBirthWard').value = wardMatch[1];
                let rmMatch = npPart.match(/([^,]+(?:नगरपालिका|गाउँपालिका|उपमहानगरपालिका|महानगरपालिका))/);
                if (rmMatch && document.getElementById('inBirthRM')) {
                    document.getElementById('inBirthRM').value = rmMatch[1].replace(/-.*$/, '').trim();
                }
                let distMatch = npPart.match(/([^,\s]+)\s*जिल्ला/);
                if (distMatch && document.getElementById('inBirthDistrict')) {
                    document.getElementById('inBirthDistrict').value = distMatch[1];
                }
            }

            // 7. Permanent Address
            const permPlaceRaw = getTextByStrongLabel(doc, "स्थायी ठेगाना:");
            if (permPlaceRaw) {
                let wardMatch = permPlaceRaw.match(/वडा\s*नं\.?\s*([०-९0-9]+)/);
                if (wardMatch && document.getElementById('inPermWard')) document.getElementById('inPermWard').value = wardMatch[1];
                let rmMatch = permPlaceRaw.match(/([^,]+(?:नगरपालिका|गाउँपालिका|उपमहानगरपालिका|महानगरपालिका))/);
                if (rmMatch && document.getElementById('inPermRM')) {
                    document.getElementById('inPermRM').value = rmMatch[1].replace(/-.*$/, '').trim();
                }
                let distMatch = permPlaceRaw.match(/([^,\s]+)\s*जिल्ला/);
                if (distMatch && document.getElementById('inPermDistrict')) {
                    document.getElementById('inPermDistrict').value = distMatch[1];
                }
                let provMatch = permPlaceRaw.match(/([^,\s]+)\s*प्रदेश/);
                if (provMatch && document.getElementById('inPermProvince')) {
                    document.getElementById('inPermProvince').value = provMatch[1];
                }
            }

            // 8. Grandfather
            const gfRaw = getTextByStrongLabel(doc, "बाजेको पूरा नाम:");
            if (gfRaw && document.getElementById('inGrandfatherName')) document.getElementById('inGrandfatherName').value = gfRaw;

            // Helper to find Father/Mother specifics by section traversing
            function getParentInfo(doc, headerText) {
                let strongs = doc.querySelectorAll('strong, b');
                for (let s of strongs) {
                    if (s.innerText && s.innerText.includes(headerText)) {
                        let tr = s.closest('tr');
                        if (!tr) continue;
                        let curr = tr.nextElementSibling;
                        let name = "";
                        let cit = "";
                        for (let i = 0; i < 6 && curr; i++) {
                            let text = curr.innerText || curr.textContent || "";
                            if (text.includes("पूरा नाम:")) {
                                name = text.split("पूरा नाम:")[1].trim();
                            } else if (text.includes("नागरिकता प्रमाणपत्र नं.") || text.includes("राष्ट्रिय परिचय नं.")) {
                                let rawCit = text.split(/Passport No\.:|:/).pop().trim();
                                cit = rawCit.split(/\s|\(/)[0];
                            }
                            curr = curr.nextElementSibling;
                        }
                        return { name, cit };
                    }
                }
                return { name: "", cit: "" };
            }

            const fatherInfo = getParentInfo(doc, "बाबुको विवरण");
            if (fatherInfo.name && document.getElementById('inFatherNameNP')) document.getElementById('inFatherNameNP').value = fatherInfo.name;
            if (fatherInfo.cit && document.getElementById('inFatherCitNo')) document.getElementById('inFatherCitNo').value = fatherInfo.cit;

            const motherInfo = getParentInfo(doc, "आमाको विवरण");
            if (motherInfo.name && document.getElementById('inMotherNameNP')) document.getElementById('inMotherNameNP').value = motherInfo.name;
            if (motherInfo.cit && document.getElementById('inMotherCitNo')) document.getElementById('inMotherCitNo').value = motherInfo.cit;

            if (typeof updateDoc === 'function') updateDoc();
            alert("जन्म दर्ता फाइलबाट विवरणहरू सफलतापूर्वक भरिएको छ!");
        } catch (err) {

            alert("फाइल पढ्दा समस्या भयो। कृपया सही जन्म दर्ता HTML फाइल छान्नुहोस्।");
        } finally {
            if (event.target) event.target.value = '';
        }
    };
    reader.readAsText(file);
}
window.handleBirthCertUpload = handleBirthCertUpload;

// ── Smart Copy & Paste Features ───────────────────────────────

function toggleSmartPasteBox(show) {
    const box = document.getElementById('smartPasteContainer');
    const formBox = document.getElementById('formPasteContainer');
    if (box) {
        box.style.display = show ? 'block' : 'none';
        if (show && formBox) formBox.style.display = 'none';
        if (show) {
            const inp = document.getElementById('smartPasteInput');
            if (inp) {
                inp.value = '';
                inp.focus();
            }
        }
    }
}
window.toggleSmartPasteBox = toggleSmartPasteBox;

function toggleFormPasteBox(show) {
    const formBox = document.getElementById('formPasteContainer');
    const smartBox = document.getElementById('smartPasteContainer');
    if (formBox) {
        formBox.style.display = show ? 'block' : 'none';
        if (show && smartBox) smartBox.style.display = 'none';
        if (show) {
            const inp = document.getElementById('formPasteInput');
            if (inp) {
                inp.value = '';
                inp.focus();
            }
        }
    }
}
window.toggleFormPasteBox = toggleFormPasteBox;

function executeSmartPaste() {
    const inp = document.getElementById('smartPasteInput');
    if (!inp || !inp.value.trim()) {
        alert("कृपया पहिले जन्म दर्ताको विवरण (Text वा HTML) पेस्ट गर्नुहोस्!");
        return;
    }
    const content = inp.value.trim();

    if (content.includes('<table') || content.includes('<p') || content.includes('<strong') || content.includes('<div') || content.includes('<tr')) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, "text/html");

        function getTextByStrongLabel(doc, labelPart) {
            const strongs = doc.querySelectorAll('strong, b');
            for (let s of strongs) {
                let sText = s.innerText || s.textContent || '';
                if (sText.includes(labelPart)) {
                    let p = s.parentElement;
                    let fullText = p.innerText || p.textContent || '';
                    let idx = fullText.indexOf(sText);
                    if (idx !== -1) {
                        let remainder = fullText.substring(idx + sText.length).trim();
                        remainder = remainder.replace(/^[:\s-]+/, '').trim();
                        if (remainder) return remainder;
                    }
                }
            }
            return "";
        }

        const regNoRaw = getTextByStrongLabel(doc, "दर्ता नम्बर (Registration No.):") || getTextByStrongLabel(doc, "दर्ता नम्बर");
        if (regNoRaw && document.getElementById('inBirthRegNo')) {
            document.getElementById('inBirthRegNo').value = regNoRaw.split(/\s|\(/)[0] || regNoRaw;
        }

        const nameNpRaw = getTextByStrongLabel(doc, "पूरा नाम :");
        if (nameNpRaw && document.getElementById('inNameFirstNP')) {
            let names = nameNpRaw.split(/\s+/);
            if (names.length === 1) {
                document.getElementById('inNameFirstNP').value = names[0];
                document.getElementById('inNameMidNP').value = '';
                document.getElementById('inNameLastNP').value = '';
            } else if (names.length === 2) {
                document.getElementById('inNameFirstNP').value = names[0];
                document.getElementById('inNameMidNP').value = '';
                document.getElementById('inNameLastNP').value = names[1];
            } else if (names.length >= 3) {
                document.getElementById('inNameFirstNP').value = names[0];
                document.getElementById('inNameLastNP').value = names[names.length - 1];
                document.getElementById('inNameMidNP').value = names.slice(1, names.length - 1).join(' ');
            }
        }

        const nameEnRaw = getTextByStrongLabel(doc, "Full Name :");
        if (nameEnRaw && document.getElementById('inNameFirstEN')) {
            let names = nameEnRaw.split(/\s+/);
            if (names.length === 1) {
                document.getElementById('inNameFirstEN').value = names[0];
                document.getElementById('inNameMidEN').value = '';
                document.getElementById('inNameLastEN').value = '';
            } else if (names.length === 2) {
                document.getElementById('inNameFirstEN').value = names[0];
                document.getElementById('inNameMidEN').value = '';
                document.getElementById('inNameLastEN').value = names[1];
            } else if (names.length >= 3) {
                document.getElementById('inNameFirstEN').value = names[0];
                document.getElementById('inNameLastEN').value = names[names.length - 1];
                document.getElementById('inNameMidEN').value = names.slice(1, names.length - 1).join(' ');
            }
        }

        const genderRaw = getTextByStrongLabel(doc, "लिङ्ग/Sex:") || getTextByStrongLabel(doc, "लिङ्ग");
        if (genderRaw && document.getElementById('inGender')) {
            if (genderRaw.includes("पुरूष") || genderRaw.includes("पुरुष") || genderRaw.toUpperCase().includes("MALE")) {
                document.getElementById('inGender').value = "पुरुष|Male";
            } else if (genderRaw.includes("महिला") || genderRaw.toUpperCase().includes("FEMALE")) {
                document.getElementById('inGender').value = "महिला|Female";
            } else {
                document.getElementById('inGender').value = "अन्य|Other";
            }
        }

        const dobRaw = getTextByStrongLabel(doc, "जन्म मिति /Date of Birth:") || getTextByStrongLabel(doc, "जन्म मिति");
        if (dobRaw && document.getElementById('inDOB_BS')) {
            let bsMatch = dobRaw.match(/([०-९]{4}[/-][०-९]{1,2}[/-][०-९]{1,2})/);
            if (bsMatch) {
                document.getElementById('inDOB_BS').value = bsMatch[1].replace(/-/g, '/');
                if (typeof autoConvertBsToAd === 'function') autoConvertBsToAd();
            } else {
                let bsMatchEn = dobRaw.match(/(\d{4}[/-]\d{1,2}[/-]\d{1,2})/);
                if (bsMatchEn) {
                    document.getElementById('inDOB_BS').value = bsMatchEn[1].replace(/-/g, '/');
                    if (typeof autoConvertBsToAd === 'function') autoConvertBsToAd();
                }
            }
        }

        const birthPlaceRaw = getTextByStrongLabel(doc, "जन्म स्थान/Birth Place:") || getTextByStrongLabel(doc, "जन्म स्थान");
        if (birthPlaceRaw) {
            let npPart = birthPlaceRaw.split('(')[0].trim();
            let wardMatch = npPart.match(/वडा\s*नं\.?\s*([०-९0-9]+)/);
            if (wardMatch && document.getElementById('inBirthWard')) document.getElementById('inBirthWard').value = wardMatch[1];
            let rmMatch = npPart.match(/([^,]+(?:नगरपालिका|गाउँपालिका|उपमहानगरपालिका|महानगरपालिका))/);
            if (rmMatch && document.getElementById('inBirthRM')) {
                document.getElementById('inBirthRM').value = rmMatch[1].replace(/-.*$/, '').trim();
            }
            let distMatch = npPart.match(/([^,\s]+)\s*जिल्ला/);
            if (distMatch && document.getElementById('inBirthDistrict')) {
                document.getElementById('inBirthDistrict').value = distMatch[1];
            }
        }

        const permPlaceRaw = getTextByStrongLabel(doc, "स्थायी ठेगाना:");
        if (permPlaceRaw) {
            let wardMatch = permPlaceRaw.match(/वडा\s*नं\.?\s*([०-९0-9]+)/);
            if (wardMatch && document.getElementById('inPermWard')) document.getElementById('inPermWard').value = wardMatch[1];
            let rmMatch = permPlaceRaw.match(/([^,]+(?:नगरपालिका|गाउँपालिका|उपमहानगरपालिका|महानगरपालिका))/);
            if (rmMatch && document.getElementById('inPermRM')) {
                document.getElementById('inPermRM').value = rmMatch[1].replace(/-.*$/, '').trim();
            }
            let distMatch = permPlaceRaw.match(/([^,\s]+)\s*जिल्ला/);
            if (distMatch && document.getElementById('inPermDistrict')) {
                document.getElementById('inPermDistrict').value = distMatch[1];
            }
            let provMatch = permPlaceRaw.match(/([^,\s]+)\s*प्रदेश/);
            if (provMatch && document.getElementById('inPermProvince')) {
                document.getElementById('inPermProvince').value = provMatch[1];
            }
        }

        const gfRaw = getTextByStrongLabel(doc, "बाजेको पूरा नाम:");
        if (gfRaw && document.getElementById('inGrandfatherName')) document.getElementById('inGrandfatherName').value = gfRaw;

        function getParentInfo(doc, headerText) {
            let strongs = doc.querySelectorAll('strong, b');
            for (let s of strongs) {
                if (s.innerText && s.innerText.includes(headerText)) {
                    let tr = s.closest('tr');
                    if (!tr) continue;
                    let curr = tr.nextElementSibling;
                    let name = "";
                    let cit = "";
                    for (let i = 0; i < 6 && curr; i++) {
                        let text = curr.innerText || curr.textContent || "";
                        if (text.includes("पूरा नाम:")) {
                            name = text.split("पूरा नाम:")[1].trim();
                        } else if (text.includes("नागरिकता प्रमाणपत्र नं.") || text.includes("राष्ट्रिय परिचय नं.")) {
                            let rawCit = text.split(/Passport No\.:|:/).pop().trim();
                            cit = rawCit.split(/\s|\(/)[0];
                        }
                        curr = curr.nextElementSibling;
                    }
                    return { name, cit };
                }
            }
            return { name: "", cit: "" };
        }

        const fatherInfo = getParentInfo(doc, "बाबुको विवरण");
        if (fatherInfo.name && document.getElementById('inFatherNameNP')) document.getElementById('inFatherNameNP').value = fatherInfo.name;
        if (fatherInfo.cit && document.getElementById('inFatherCitNo')) document.getElementById('inFatherCitNo').value = fatherInfo.cit;

        const motherInfo = getParentInfo(doc, "आमाको विवरण");
        if (motherInfo.name && document.getElementById('inMotherNameNP')) document.getElementById('inMotherNameNP').value = motherInfo.name;
        if (motherInfo.cit && document.getElementById('inMotherCitNo')) document.getElementById('inMotherCitNo').value = motherInfo.cit;

    } else {
        const lines = content.split(/\r?\n/);
        for (let line of lines) {
            line = line.trim();
            if (!line) continue;

            if ((line.includes("दर्ता नम्बर") || line.includes("Registration No")) && document.getElementById('inBirthRegNo')) {
                let parts = line.split(/[:\s(]+/);
                for (let p of parts) {
                    if (/[०-९0-9]{10,}/.test(p)) {
                        document.getElementById('inBirthRegNo').value = p.replace(/\)/g, '');
                        break;
                    }
                }
            } else if (line.includes("पूरा नाम") && !line.includes("बाजेको") && !line.includes("बाबुको") && !line.includes("आमाको") && document.getElementById('inNameFirstNP')) {
                let val = line.split(/[:\-–]+/).pop().trim();
                let names = val.split(/\s+/);
                if (names.length === 1) {
                    document.getElementById('inNameFirstNP').value = names[0];
                } else if (names.length === 2) {
                    document.getElementById('inNameFirstNP').value = names[0];
                    document.getElementById('inNameLastNP').value = names[1];
                } else if (names.length >= 3) {
                    document.getElementById('inNameFirstNP').value = names[0];
                    document.getElementById('inNameLastNP').value = names[names.length - 1];
                    document.getElementById('inNameMidNP').value = names.slice(1, names.length - 1).join(' ');
                }
            } else if ((line.includes("जन्म मिति") || line.includes("Date of Birth")) && document.getElementById('inDOB_BS')) {
                let bsMatch = line.match(/([०-९0-9]{4}[/-][०-९0-9]{1,2}[/-][०-९0-9]{1,2})/);
                if (bsMatch) {
                    document.getElementById('inDOB_BS').value = bsMatch[1].replace(/-/g, '/');
                    if (typeof autoConvertBsToAd === 'function') autoConvertBsToAd();
                }
            } else if ((line.includes("लिङ्ग") || line.includes("Sex")) && document.getElementById('inGender')) {
                if (line.includes("पुरूष") || line.includes("पुरुष") || line.toUpperCase().includes("MALE")) {
                    document.getElementById('inGender').value = "पुरुष|Male";
                } else if (line.includes("महिला") || line.toUpperCase().includes("FEMALE")) {
                    document.getElementById('inGender').value = "महिला|Female";
                }
            } else if (line.includes("बाजेको पूरा नाम") && document.getElementById('inGrandfatherName')) {
                document.getElementById('inGrandfatherName').value = line.split(/[:\-–]+/).pop().trim();
            }
        }
    }

    if (typeof updateDoc === 'function') updateDoc();
    alert("पेस्ट गरिएको डाटाबाट विवरणहरू सफलतापूर्वक भरिएको छ!");
    toggleSmartPasteBox(false);
}
window.executeSmartPaste = executeSmartPaste;

function copyFormDataToClipboard() {
    const dataObj = {
        chalani: document.getElementById('inChalani').value.trim(),
        miti: document.getElementById('inMiti').value.trim(),
        birthRegNo: document.getElementById('inBirthRegNo').value.trim(),
        dobBS: document.getElementById('inDOB_BS').value.trim(),
        dobAD: document.getElementById('inDOB_AD').value.trim(),
        nameFirstNP: document.getElementById('inNameFirstNP').value.trim(),
        nameMidNP: document.getElementById('inNameMidNP').value.trim(),
        nameLastNP: document.getElementById('inNameLastNP').value.trim(),
        nameFirstEN: document.getElementById('inNameFirstEN').value.trim(),
        nameMidEN: document.getElementById('inNameMidEN').value.trim(),
        nameLastEN: document.getElementById('inNameLastEN').value.trim(),
        gender: document.getElementById('inGender').value,
        religion: document.getElementById('inReligion').value,
        caste: document.getElementById('inCaste').value.trim(),
        contactNo: document.getElementById('inContactNo').value.trim(),
        birthDistrict: document.getElementById('inBirthDistrict').value.trim(),
        birthRM: document.getElementById('inBirthRM').value.trim(),
        birthWard: document.getElementById('inBirthWard').value.trim(),
        permProvince: document.getElementById('inPermProvince').value.trim(),
        permDistrict: document.getElementById('inPermDistrict').value.trim(),
        permRM: document.getElementById('inPermRM').value.trim(),
        permWard: document.getElementById('inPermWard').value.trim(),
        permToleNP: document.getElementById('inPermToleNP').value.trim(),
        fatherNameNP: document.getElementById('inFatherNameNP').value.trim(),
        fatherCitNo: document.getElementById('inFatherCitNo').value.trim(),
        motherNameNP: document.getElementById('inMotherNameNP').value.trim(),
        motherCitNo: document.getElementById('inMotherCitNo').value.trim(),
        grandfatherName: document.getElementById('inGrandfatherName') ? document.getElementById('inGrandfatherName').value.trim() : ''
    };

    const jsonText = JSON.stringify(dataObj, null, 2);

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(jsonText).then(() => {
            alert("✅ फारमको सम्पूर्ण डाटा (JSON) क्लिपबोर्डमा सफलतापूर्वक कपी भयो!\nतपाईँले यसलाई कतै सेभ गर्न वा पछि पेस्ट गरेर भर्न सक्नुहुन्छ।");
        }).catch(err => {

            prompt("फारम विवरण कपी गर्न तलको टेक्स्ट कपी (Ctrl+C) गर्नुहोस्:", jsonText);
        });
    } else {
        prompt("फारम विवरण कपी गर्न तलको टेक्स्ट कपी (Ctrl+C) गर्नुहोस्:", jsonText);
    }
}
window.copyFormDataToClipboard = copyFormDataToClipboard;

function executeFormPaste() {
    const inp = document.getElementById('formPasteInput');
    if (!inp || !inp.value.trim()) {
        alert("कृपया कपी गरिएको JSON डाटा यहाँ पेस्ट गर्नुहोस्!");
        return;
    }
    try {
        const d = JSON.parse(inp.value.trim());
        if (d.chalani !== undefined) document.getElementById('inChalani').value = d.chalani;
        if (d.miti !== undefined) document.getElementById('inMiti').value = d.miti;
        if (d.birthRegNo !== undefined) document.getElementById('inBirthRegNo').value = d.birthRegNo;
        if (d.dobBS !== undefined) document.getElementById('inDOB_BS').value = d.dobBS;
        if (d.dobAD !== undefined) document.getElementById('inDOB_AD').value = d.dobAD;
        if (d.nameFirstNP !== undefined) document.getElementById('inNameFirstNP').value = d.nameFirstNP;
        if (d.nameMidNP !== undefined) document.getElementById('inNameMidNP').value = d.nameMidNP;
        if (d.nameLastNP !== undefined) document.getElementById('inNameLastNP').value = d.nameLastNP;
        if (d.nameFirstEN !== undefined) document.getElementById('inNameFirstEN').value = d.nameFirstEN;
        if (d.nameMidEN !== undefined) document.getElementById('inNameMidEN').value = d.nameMidEN;
        if (d.nameLastEN !== undefined) document.getElementById('inNameLastEN').value = d.nameLastEN;
        if (d.gender !== undefined) document.getElementById('inGender').value = d.gender;
        if (d.religion !== undefined) document.getElementById('inReligion').value = d.religion;
        if (d.caste !== undefined) document.getElementById('inCaste').value = d.caste;
        if (d.contactNo !== undefined) document.getElementById('inContactNo').value = d.contactNo;
        if (d.birthDistrict !== undefined) document.getElementById('inBirthDistrict').value = d.birthDistrict;
        if (d.birthRM !== undefined) document.getElementById('inBirthRM').value = d.birthRM;
        if (d.birthWard !== undefined) document.getElementById('inBirthWard').value = d.birthWard;
        if (d.permProvince !== undefined) document.getElementById('inPermProvince').value = d.permProvince;
        if (d.permDistrict !== undefined) document.getElementById('inPermDistrict').value = d.permDistrict;
        if (d.permRM !== undefined) document.getElementById('inPermRM').value = d.permRM;
        if (d.permWard !== undefined) document.getElementById('inPermWard').value = d.permWard;
        if (d.permToleNP !== undefined) document.getElementById('inPermToleNP').value = d.permToleNP;
        if (d.fatherNameNP !== undefined) document.getElementById('inFatherNameNP').value = d.fatherNameNP;
        if (d.fatherCitNo !== undefined) document.getElementById('inFatherCitNo').value = d.fatherCitNo;
        if (d.motherNameNP !== undefined) document.getElementById('inMotherNameNP').value = d.motherNameNP;
        if (d.motherCitNo !== undefined) document.getElementById('inMotherCitNo').value = d.motherCitNo;
        if (d.grandfatherName !== undefined && document.getElementById('inGrandfatherName')) document.getElementById('inGrandfatherName').value = d.grandfatherName;

        if (typeof updateDoc === 'function') updateDoc();
        alert("✅ कपी गरिएको डाटाबाट फारम सफलतापूर्वक भरिएको छ!");
        toggleFormPasteBox(false);
    } catch (e) {

        alert("डाटा פורम्याट मिलेन! कृपया सही JSON डाटा पेस्ट गर्नुहोस्।");
    }
}
window.executeFormPaste = executeFormPaste;

// ── Bootstrap ─────────────────────────────────────────
window.onload = function () {
    initializeAutomaticDate();
    adjustSignaturePosition(5);
    updateDoc();
};

