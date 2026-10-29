// ============================================================================
// जग्गा वर्गीकरण सिफारिस प्रणाली - गौरादह नगरपालिका
// Controller Script: script-bargikaran-sifarish.js
// ============================================================================

// 1. Firebase Configuration & Firestore Init
const firebaseConfig = {
    apiKey: "AIzaSyC3uCmLgNN8s0FDMIrkgxR8eH_AvJ_D3J4",
    authDomain: "gauradaha-ward1.firebaseapp.com",
    projectId: "gauradaha-ward1",
    storageBucket: "gauradaha-ward1.firebasestorage.app",
    messagingSenderId: "905617778132",
    appId: "1:905617778132:web:b8149cf37ae3f3c3b42241"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

let globalDatabase = [];
window.globalDatabase = globalDatabase;
let rowCounter = 0;
let activeRowIds = [];
const LOCAL_STORAGE_KEY = 'bargikaran_sifarish_records_local';
window._isSavingInProgress = false;
let searchDebounceTimer = null;
let importSourcesLoaded = false;

// Sources for Importing Data (चार किल्ला / बाटो / घर बाटो)
let importSources = {
    charkilla: [],
    bato: [],
    gharbato: []
};
let currentImportFilter = 'all';

// HTML escape helper for XSS prevention and safe table rendering
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// 2. Nepali Digits Converter
window.toNepaliDigit = function (num) {
    if (num === undefined || num === null) return '';
    const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return num.toString().split('').map(d => nepaliDigits[d] !== undefined ? nepaliDigits[d] : d).join('');
};

window.toEnglishDigit = function (num) {
    if (num === undefined || num === null) return '';
    const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return num.toString().split('').map(d => {
        const idx = nepaliDigits.indexOf(d);
        return idx !== -1 ? String(idx) : d;
    }).join('');
};

// 3. Fiscal Year & Automatic Date Conversion
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
        console.error("Fiscal year init error:", error);
    }
}

function getNepalSambatYear(date) {
    const d = date || new Date();
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    let ns = y - 879;
    if (m < 10 || (m === 10 && day < 25)) {
        ns = ns - 1;
    }
    return ns;
}

window.initializeAutomaticDate = function () {
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
            nepaliBSDateStr = window.toNepaliDigit(`${bsYearVal}/${bsMStr}/${bsDStr}`);
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

        if (typeof window.updateDoc === 'function') window.updateDoc();
    } catch (error) {
        console.error("Auto date init error:", error);
    }
};

window.updateNepalSambatFromMiti = function () {
    if (window.NepalSambat && typeof window.NepalSambat.updateNepalSambatFromMiti === 'function') {
        window.NepalSambat.updateNepalSambatFromMiti();
        return;
    }
    try {
        const mitiVal = document.getElementById('inMiti').value || '';
        const parts = mitiVal.split('/');
        if (parts.length >= 1 && parts[0].length === 4) {
            const bsYear = parseInt(parts[0].replace(/[०-९]/g, d => "०१२३४५६७८९".indexOf(d) !== -1 ? "०१२३४५६७८९".indexOf(d) : d), 10);
            if (!isNaN(bsYear)) {
                const nsYear = bsYear - 937;
                document.getElementById('inNepalSamvat').value = window.toNepaliDigit(nsYear);
            }
        }
    } catch (e) {
        console.log("Nepal Samvat calculation notice:", e);
    }
};

// 4. Tapasheel Kitta Rows Management
// Default classification for new rows is initially blank (or syncs from main zone if chosen)
window.addKittaRow = function (data = null) {
    rowCounter++;
    const rowId = 'kitta_row_' + rowCounter;
    activeRowIds.push(rowId);

    const defaultSabik = data ? (data.sabikWada || 'गौरादह गाविस ९') : 'गौरादह गाविस ९';
    const defaultHal = data ? (data.halWada || 'गौरादह वडा नं. १') : 'गौरादह वडा नं. १';
    const defaultKitta = data ? (data.kitta || '') : '';
    const defaultArea = data ? (data.area || '') : '';
    
    // Single Source of Truth: Inherit mainZone if available, otherwise initially blank
    const currentMainZone = (document.getElementById('inMainZoneDisplay')?.value || '').trim();
    const defaultKaifiyat = data ? (data.kaifiyat || '') : currentMainZone;

    const container = document.getElementById('kittaRowsContainer');
    if (!container) return;

    const rowHtml = `
        <div class="kitta-row-block" id="${rowId}">
            <div class="row-num-badge">कित्ता क्रम: <span class="row-index-display"></span></div>
            <button type="button" class="btn-delete-row" id="del_btn_${rowId}" onclick="removeKittaRow('${rowId}')">हटाउनुस्</button>
            
            <div class="row-grid">
                <div class="form-group">
                    <label style="font-size:0.83rem;">साबिकको वडा / गा.वि.स.:</label>
                    <input type="text" class="input-sabik" placeholder="उदा: गौरादह गाविस ९" value="${escapeHtml(defaultSabik)}" oninput="updateDoc()">
                </div>
                <div class="form-group">
                    <label style="font-size:0.83rem;">हालको वडा नं.:</label>
                    <input type="text" class="input-hal" placeholder="उदा: गौरादह वडा नं. १" value="${escapeHtml(defaultHal)}" oninput="updateDoc()">
                </div>
            </div>

            <div class="row-grid" style="grid-template-columns: 1fr 1fr;">
                <div class="form-group">
                    <label style="font-size:0.83rem;">कि.नं. (कित्ता नम्बर):</label>
                    <input type="text" class="input-kitta" placeholder="उदा: १६९८" value="${escapeHtml(defaultKitta)}" oninput="updateDoc()">
                </div>
                <div class="form-group">
                    <label style="font-size:0.83rem;">क्षेत्रफल (ब.मि. / वर्ग मिटर):</label>
                    <input type="text" class="input-area" placeholder="उदा: ३३८.६३" value="${escapeHtml(defaultArea)}" oninput="updateDoc()">
                </div>
            </div>

            <div class="form-group" style="margin-bottom:0;">
                <label style="font-size:0.83rem;">कैफियत / वर्गीकरण क्षेत्र:</label>
                <input type="text" class="input-kaifiyat" list="categoryList" placeholder="वर्गीकरण क्षेत्र छनौट गर्नुहोस्" value="${escapeHtml(defaultKaifiyat)}" oninput="onKaifiyatInput(this); updateDoc()">
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', rowHtml);
    reindexFormRows();
    window.updateDoc();
};

window.removeKittaRow = function (rowId) {
    if (activeRowIds.length <= 1) {
        alert("⚠️ कम्तिमा एउटा कित्ता विवरण हुनुपर्छ !");
        return;
    }
    const el = document.getElementById(rowId);
    if (el) el.remove();
    activeRowIds = activeRowIds.filter(id => id !== rowId);
    reindexFormRows();
    window.updateDoc();
};

function reindexFormRows() {
    activeRowIds.forEach((id, index) => {
        const block = document.getElementById(id);
        if (block) {
            const numSpan = block.querySelector('.row-index-display');
            if (numSpan) numSpan.innerText = window.toNepaliDigit(index + 1);
            const delBtn = document.getElementById(`del_btn_${id}`);
            if (delBtn) {
                delBtn.style.display = (activeRowIds.length === 1) ? 'none' : 'block';
            }
        }
    });
}

// When user selects a main classification zone in 'ऐन तथा निर्णय व्यहोरा'
window.onMainZoneChange = function (val) {
    if (!val) return;
    // Synchronize rows that are either blank or match previous default
    activeRowIds.forEach(id => {
        const block = document.getElementById(id);
        if (block) {
            const inp = block.querySelector('.input-kaifiyat');
            if (inp && (!inp.value || inp.value === 'व्यावसायिक शहरी क्षेत्र' || inp.value === 'व्यवसायिक शहरी क्षेत्र')) {
                inp.value = val;
            }
        }
    });
    window.updateDoc();
};

function onKaifiyatInput(inputEl) {
    const val = inputEl.value.trim();
    if (val) {
        const mainZoneInp = document.getElementById('inMainZoneDisplay');
        if (mainZoneInp && !mainZoneInp.value) {
            mainZoneInp.value = val;
        }
    }
}

function getKittaRowsData() {
    const list = [];
    activeRowIds.forEach(id => {
        const block = document.getElementById(id);
        if (block) {
            list.push({
                sabikWada: block.querySelector('.input-sabik').value.trim(),
                halWada: block.querySelector('.input-hal').value.trim(),
                kitta: block.querySelector('.input-kitta').value.trim(),
                area: block.querySelector('.input-area').value.trim(),
                kaifiyat: block.querySelector('.input-kaifiyat').value.trim()
            });
        }
    });
    return list;
}

// 5. Custom Address Toggle
window.toggleAddressFields = function () {
    const chk = document.getElementById('chkChangeAddress');
    const box = document.getElementById('custAddressBox');
    if (chk && box) {
        box.style.display = chk.checked ? 'grid' : 'none';
    }
};

// 6. Signature Authority Toggle & Margin Adjustment
window.toggleCustomSign = function () {
    const sel = document.getElementById('inSignAuthority').value;
    const box = document.getElementById('customSignBox');
    if (box) {
        box.style.display = (sel === 'CUSTOM') ? 'grid' : 'none';
    }
};

window.adjustSignaturePosition = function (val) {
    const lbl = document.getElementById('marginVal');
    if (lbl) lbl.innerText = window.toNepaliDigit(val) + " px";
    const docFooter = document.getElementById('docFooterSection');
    if (docFooter) docFooter.style.marginTop = val + "px";
};

// 7. Live Document Preview Updater
window.updateDoc = function () {
    // 1. Header Details
    const patraSankhyaEl = document.getElementById('inPatraSankhya');
    const chalaniEl = document.getElementById('inChalani');
    const mitiEl = document.getElementById('inMiti');
    const nepalSamvatEl = document.getElementById('inNepalSamvat');
    const receiverEl = document.getElementById('inReceiver');
    const subjectEl = document.getElementById('inSubject');

    const patraSankhya = patraSankhyaEl ? patraSankhyaEl.value : '२०८२/०८३';
    const chalani = chalaniEl ? chalaniEl.value.trim() : '';
    const miti = mitiEl ? mitiEl.value.trim() : '२०८३/';
    const nepalSamvat = nepalSamvatEl ? nepalSamvatEl.value.trim() : '११४६';
    const receiver = receiverEl ? receiverEl.value.trim() : 'श्री यो जोजस सँग सम्बन्धित छ ।';
    const subject = subjectEl ? subjectEl.value.trim() : 'वर्गीकरण सिफारिस सम्बन्धमा ।';

    const lblPatra = document.getElementById('lblPatraSankhya');
    if (lblPatra) lblPatra.innerText = patraSankhya || '२०८२/०८३';

    const lblChalani = document.getElementById('lblChalani');
    if (lblChalani) lblChalani.innerText = window.toNepaliDigit(chalani) || '';

    const lblMiti = document.getElementById('lblMiti');
    if (lblMiti) lblMiti.innerText = window.toNepaliDigit(miti) || '२०८३/';

    const lblNepalSamvat = document.getElementById('lblNepalSamvat');
    if (lblNepalSamvat) lblNepalSamvat.innerText = (window.NepalSambat && window.NepalSambat.formatPrint) ? window.NepalSambat.formatPrint(nepalSamvat, document.getElementById('inMiti')?.value) : (window.toNepaliDigit(nepalSamvat) || '११४६');

    const lblReceiver = document.getElementById('lblReceiver');
    if (lblReceiver) lblReceiver.innerText = receiver || 'श्री यो जोजस सँग सम्बन्धित छ ।';

    const lblSubject = document.getElementById('lblSubject');
    if (lblSubject) lblSubject.innerText = subject || 'वर्गीकरण सिफारिस सम्बन्धमा ।';

    // 2. Applicant & Resident Details
    const nameEl = document.getElementById('inName');
    const name = (nameEl ? nameEl.value.trim() : '') || '.......................';
    
    const isCustomAddr = document.getElementById('chkChangeAddress') ? document.getElementById('chkChangeAddress').checked : false;
    const loggedWard = localStorage.getItem('sifarish_ward') || '1';
    let palikaText = (document.getElementById('inPalika') ? document.getElementById('inPalika').value.trim() : '') || 'गौरादह नगरपालिका';
    let wadaText = (document.getElementById('inWadaNo') ? document.getElementById('inWadaNo').value.trim() : '') || window.toNepaliDigit(loggedWard);

    if (isCustomAddr) {
        const custDist = document.getElementById('inCustDistrict') ? document.getElementById('inCustDistrict').value.trim() : '';
        const custPal = document.getElementById('inCustPalika') ? document.getElementById('inCustPalika').value.trim() : '';
        const custWad = document.getElementById('inCustWada') ? document.getElementById('inCustWada').value.trim() : '';
        
        let customParts = [];
        if (custDist) customParts.push(`${custDist} जिल्ला`);
        if (custPal) customParts.push(custPal);
        palikaText = customParts.join(' ') || palikaText;
        wadaText = custWad || wadaText;
    }

    const citNo = document.getElementById('inCitNo') ? document.getElementById('inCitNo').value.trim() : '';
    const citDate = document.getElementById('inCitDate') ? document.getElementById('inCitDate').value.trim() : '';
    let citText = '';
    if (citNo) {
        citText = ` (ना.प्र.नं. ${window.toNepaliDigit(citNo)}${citDate ? ', जारी मिति: ' + window.toNepaliDigit(citDate) : ''}) `;
    }

    const lblPalikaSpan = document.getElementById('lblPalikaSpan');
    if (lblPalikaSpan) lblPalikaSpan.innerText = palikaText;

    const lblWadaSpan = document.getElementById('lblWadaSpan');
    if (lblWadaSpan) lblWadaSpan.innerText = window.toNepaliDigit(wadaText);

    const lblApplicantName = document.getElementById('lblApplicantName');
    if (lblApplicantName) lblApplicantName.innerText = name;

    const lblCitInfoSpan = document.getElementById('lblCitInfoSpan');
    if (lblCitInfoSpan) lblCitInfoSpan.innerText = citText;

    // 3. Tapasheel Table Rendering (Zero gap layout)
    const kittaList = getKittaRowsData();
    const tableBody = document.getElementById('lblTapasheelTableBody');
    if (tableBody) {
        tableBody.innerHTML = '';
        if (kittaList.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td>१.</td>
                    <td>गौरादह गाविस ९</td>
                    <td>गौरादह वडा नं. १</td>
                    <td></td>
                    <td></td>
                    <td>-</td>
                </tr>
            `;
        } else {
            kittaList.forEach((item, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${window.toNepaliDigit(index + 1)}.</strong></td>
                    <td>${escapeHtml(item.sabikWada || '-')}</td>
                    <td>${escapeHtml(item.halWada || '-')}</td>
                    <td><strong>${window.toNepaliDigit(item.kitta) || ''}</strong></td>
                    <td>${window.toNepaliDigit(item.area) || ''}</td>
                    <td><strong>${escapeHtml(item.kaifiyat || '-')}</strong></td>
                `;
                tableBody.appendChild(tr);
            });
        }
    }

    // 4. Paragraph 2 (Act & Decision Clause)
    const actName = (document.getElementById('inActName') ? document.getElementById('inActName').value.trim() : '') || 'भू-उपयोग ऐन २०७६ को दफा २०';
    const decisionDate = (document.getElementById('inDecisionDate') ? document.getElementById('inDecisionDate').value.trim() : '') || '२०७९/१०/२६';
    
    // Single Source of Truth for Classification:
    // Read directly from #inMainZoneDisplay, fallback to first kitta's kaifiyat, or leave placeholder
    const mainZoneSelect = document.getElementById('inMainZoneDisplay');
    const mainZone = (mainZoneSelect ? mainZoneSelect.value.trim() : '') || (kittaList[0] ? (kittaList[0].kaifiyat || '') : '');

    const validKittas = kittaList.filter(k => k.kitta && k.kitta.trim() !== '');
    const kittaCount = validKittas.length > 0 ? validKittas.length : kittaList.length;
    const landText = kittaCount > 1 ? 'जग्गाहरू' : 'जग्गा';

    const lblAct = document.getElementById('lblActClause');
    if (lblAct) lblAct.innerText = actName;

    const lblDec = document.getElementById('lblDecisionDate');
    if (lblDec) lblDec.innerText = window.toNepaliDigit(decisionDate);

    const lblZone = document.getElementById('lblMainZoneSpan');
    if (lblZone) {
        lblZone.innerText = mainZone || '....................';
    }

    const lblLandPlural1 = document.getElementById('lblLandPlural1');
    if (lblLandPlural1) lblLandPlural1.innerText = landText;

    const lblLandPlural2 = document.getElementById('lblLandPlural2');
    if (lblLandPlural2) lblLandPlural2.innerText = landText;

    // 5. Signature Section
    const signAuth = document.getElementById('inSignAuthority') ? document.getElementById('inSignAuthority').value : 'नगेन्द्र भण्डारी|वडा अध्यक्ष';
    let sigName = 'नगेन्द्र भण्डारी';
    let sigTitle = 'वडा अध्यक्ष';

    if (signAuth === 'BLANK') {
        sigName = '';
        sigTitle = '';
    } else if (signAuth === 'CUSTOM') {
        sigName = document.getElementById('inCustomSignName') ? document.getElementById('inCustomSignName').value.trim() : '';
        sigTitle = document.getElementById('inCustomSignTitle') ? document.getElementById('inCustomSignTitle').value.trim() : '';
    } else {
        const parts = signAuth.split('|');
        sigName = parts[0];
        sigTitle = parts[1] || 'वडा अध्यक्ष';
    }

    const lblSigName = document.getElementById('lblSigName');
    if (lblSigName) lblSigName.innerText = sigName;

    const lblSigTitle = document.getElementById('lblSigTitle');
    if (lblSigTitle) lblSigTitle.innerText = sigTitle;
};

// 8. Print and Save Workflow — Safe Duplicate Prevention & Updating by Stable ID
window.printAndSaveSystem = async function () {
    if (window._isSavingInProgress) return;
    const btn = document.querySelector('.btn-print');
    const origBtnText = btn ? btn.innerText : '🖨️ प्रिन्ट र सुरक्षित गर्नुस्';

    const applicantName = document.getElementById('inName') ? document.getElementById('inName').value.trim() : '';
    if (!applicantName) {
        alert("⚠️ कृपया निवेदकको पुरा नाम लेख्नुहोस् !");
        if (document.getElementById('inName')) document.getElementById('inName').focus();
        return;
    }

    const kittaData = getKittaRowsData();
    const mainZone = document.getElementById('inMainZoneDisplay') ? document.getElementById('inMainZoneDisplay').value.trim() : '';

    if (!mainZone && !kittaData.some(k => k.kaifiyat)) {
        alert("⚠️ कृपया जग्गाको वर्गीकरण क्षेत्र (मुख्य वर्गीकरण क्षेत्र) छनौट गर्नुहोस् !");
        if (document.getElementById('inMainZoneDisplay')) document.getElementById('inMainZoneDisplay').focus();
        return;
    }

    const chalaniNo = document.getElementById('inChalani') ? document.getElementById('inChalani').value.trim() : '';
    const miti = document.getElementById('inMiti') ? document.getElementById('inMiti').value.trim() : '';
    const recordId = document.getElementById('editRecordIndex') ? document.getElementById('editRecordIndex').value.trim() : '';

    const recordData = {
        template: 'bargikaran-sifarish',
        patraSankhya: document.getElementById('inPatraSankhya') ? document.getElementById('inPatraSankhya').value : '',
        chalani: chalaniNo,
        miti: miti,
        nepalSamvat: document.getElementById('inNepalSamvat') ? document.getElementById('inNepalSamvat').value.trim() : '',
        ns: document.getElementById('inNepalSamvat') ? document.getElementById('inNepalSamvat').value.trim() : '',
        receiver: document.getElementById('inReceiver') ? document.getElementById('inReceiver').value.trim() : '',
        subject: document.getElementById('inSubject') ? document.getElementById('inSubject').value.trim() : '',
        applicantName: applicantName,
        palika: document.getElementById('inPalika') ? document.getElementById('inPalika').value.trim() : '',
        wadaNo: document.getElementById('inWadaNo') ? document.getElementById('inWadaNo').value.trim() : '',
        citNo: document.getElementById('inCitNo') ? document.getElementById('inCitNo').value.trim() : '',
        citDate: document.getElementById('inCitDate') ? document.getElementById('inCitDate').value.trim() : '',
        isCustomAddr: document.getElementById('chkChangeAddress') ? document.getElementById('chkChangeAddress').checked : false,
        custDistrict: document.getElementById('inCustDistrict') ? document.getElementById('inCustDistrict').value.trim() : '',
        custPalika: document.getElementById('inCustPalika') ? document.getElementById('inCustPalika').value.trim() : '',
        custWada: document.getElementById('inCustWada') ? document.getElementById('inCustWada').value.trim() : '',
        kittaList: kittaData,
        actName: document.getElementById('inActName') ? document.getElementById('inActName').value.trim() : '',
        decisionDate: document.getElementById('inDecisionDate') ? document.getElementById('inDecisionDate').value.trim() : '',
        mainZone: mainZone,
        signAuthority: document.getElementById('inSignAuthority') ? document.getElementById('inSignAuthority').value : '',
        customSignName: document.getElementById('inCustomSignName') ? document.getElementById('inCustomSignName').value.trim() : '',
        customSignTitle: document.getElementById('inCustomSignTitle') ? document.getElementById('inCustomSignTitle').value.trim() : '',
        createdBy: localStorage.getItem('sifarish_user') || 'wada1',
        createdWard: localStorage.getItem('sifarish_ward') || '1',
        hasNepalSambatTithi: true,
        nsFeatureVersion: 1,
        nsRolloutCommit: 'd2ba29cef12ba2cfdd7cb211861af69f57880811',
        timestamp: Date.now()
    };

    window._isSavingInProgress = true;
    if (btn) {
        btn.disabled = true;
        btn.innerText = "⏳ सुरक्षित हुँदैछ...";
    }

    try {
        let finalId = recordId;
        if (db && db.collection) {
            if (recordId !== '') {
                // UPDATE existing record in Firestore using its stable primary key
                await db.collection("bargikaranSifarishRecords").doc(recordId).set(recordData, { merge: true });
                showToast("✅ सिफारिस अद्यावधिक (Update) भयो !");
            } else {
                // CREATE genuinely new record in Firestore
                const docRef = await db.collection("bargikaranSifarishRecords").add(recordData);
                finalId = docRef.id;
                document.getElementById('editRecordIndex').value = finalId;
                const titleEl = document.getElementById('formMainTitle');
                if (titleEl) titleEl.innerText = "🔄 जग्गा वर्गीकरण सिफारिस (सम्पादन मोड)";
                showToast("✅ नयाँ सिफारिस सुरक्षित भयो !");
            }
        }

        // Keep local storage synchronized with stable IDs
        try {
            let localList = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
            const savedItem = { id: finalId || ('local_' + Date.now()), ...recordData };
            const existingIdx = localList.findIndex(r => r.id === savedItem.id);
            if (existingIdx !== -1) {
                localList[existingIdx] = savedItem;
            } else {
                localList.unshift(savedItem);
            }
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localList));
        } catch (e) { }

    } catch (err) {
        console.error("Firestore save error:", err);
        showToast("⚠️ क्लाउड सिङ्क असफल, स्थानीय रूपमा सुरक्षित गरियो ।");
    } finally {
        window._isSavingInProgress = false;
        if (btn) {
            btn.disabled = false;
            btn.innerText = origBtnText;
        }
    }

    window.print();
};

// 9. Abhilekh (Records Modal) Rendering & Operations
window.toggleModal = function (show) {
    const modal = document.getElementById('abhilekhModal');
    if (modal) {
        modal.style.display = show ? 'flex' : 'none';
        if (show) {
            modal.classList.add('active');
            renderDatabaseTable();
        } else {
            modal.classList.remove('active');
        }
    }
};

window.onSearchInputDebounced = function () {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
        renderDatabaseTable();
    }, 150);
};

function renderDatabaseTable() {
    const searchField = document.getElementById('searchField');
    const searchVal = (searchField ? searchField.value : '').trim().toLowerCase();
    const searchEn = window.toEnglishDigit(searchVal);
    const searchNe = window.toNepaliDigit(searchVal);
    const tbody = document.getElementById('dbTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    // Primary source is globalDatabase (Firestore live sync); fallback to local cache
    let list = [];
    if (globalDatabase.length > 0) {
        list = globalDatabase;
    } else {
        try {
            list = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
        } catch (e) {
            list = [];
        }
    }

    // Filter out soft-deleted records
    const activeList = list.filter(item => !item.isDeleted);

    const filtered = activeList.filter(item => {
        if (!searchVal) return true;
        const name = (item.applicantName || '').toLowerCase();
        const chalani = (item.chalani || '').toLowerCase();
        const chalaniEn = window.toEnglishDigit(chalani);
        const chalaniNe = window.toNepaliDigit(chalani);
        const citNo = (item.citNo || '').toLowerCase();
        const citNoEn = window.toEnglishDigit(citNo);
        const citNoNe = window.toNepaliDigit(citNo);
        const kittaStr = (item.kittaList || []).map(k => k.kitta).join(' ').toLowerCase();
        const kittaEn = window.toEnglishDigit(kittaStr);
        const kittaNe = window.toNepaliDigit(kittaStr);
        const zoneStr = (item.mainZone || '').toLowerCase();

        return name.includes(searchVal) ||
               chalani.includes(searchVal) || chalaniEn.includes(searchEn) || chalaniNe.includes(searchNe) ||
               citNo.includes(searchVal) || citNoEn.includes(searchEn) || citNoNe.includes(searchNe) ||
               kittaStr.includes(searchVal) || kittaEn.includes(searchEn) || kittaNe.includes(searchNe) ||
               zoneStr.includes(searchVal);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; padding:25px; color:#64748b;">
                    कुनै पनि वर्गीकरण सिफारिस अभिलेख फेला परेन ।
                </td>
            </tr>
        `;
        return;
    }

    filtered.forEach((rec, idx) => {
        const kittaSummary = (rec.kittaList || []).map(k => `कि.नं. ${window.toNepaliDigit(k.kitta)} (${window.toNepaliDigit(k.area)} ब.मि.)`).join('<br>') || '-';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="text-align:center;"><strong>${window.toNepaliDigit(idx + 1)}</strong></td>
            <td>
                <div style="font-weight:700; color:#1e40af;">${escapeHtml(rec.applicantName || '-')}</div>
                <div style="font-size:0.82rem; color:#64748b;">च.नं. ${window.toNepaliDigit(rec.chalani) || '-'}</div>
            </td>
            <td style="font-size:0.9rem;">${kittaSummary}</td>
            <td><strong style="color:#0f766e;">${escapeHtml(rec.mainZone || '-')}</strong></td>
            <td style="font-size:0.88rem;">${window.toNepaliDigit(rec.miti) || '-'}</td>
            <td>
                <div style="display:flex; gap:4px;">
                    <button type="button" class="btn-del" style="background:#2563eb;" onclick="loadRecordForEdit('${rec.id}')" title="फारममा लोड गर्नुहोस्">✏️ लोड</button>
                    <button type="button" class="btn-del" style="background:#ef4444;" onclick="deleteRecord('${rec.id}')" title="मेटाउनुहोस्">🗑️</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Fixed Wrong-Person Bug: Look up record by its exact, immutable string ID
window.loadRecordForEdit = function (recordId) {
    if (!recordId) return;

    let rec = globalDatabase.find(r => r.id === recordId);
    if (!rec) {
        try {
            const local = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
            rec = local.find(r => r.id === recordId);
        } catch (e) { }
    }

    if (!rec) {
        alert("⚠️ यो अभिलेख फेला परेन !");
        return;
    }

    // Guard against wrong-record leak
    if (rec.id !== recordId) {
        console.error("Mismatch error: requested", recordId, "got", rec.id);
        return;
    }

    // Safely clear form state first to eliminate any stale data flash
    resetFormFieldsOnly();

    if (window.NepalSambat && typeof window.NepalSambat.setCurrentRecord === 'function') {
        window.NepalSambat.setCurrentRecord(rec);
    }

    // Set stable primary key in editRecordIndex
    const editRecordIndex = document.getElementById('editRecordIndex');
    if (editRecordIndex) editRecordIndex.value = rec.id;

    const titleEl = document.getElementById('formMainTitle');
    if (titleEl) titleEl.innerText = "🔄 जग्गा वर्गीकरण सिफारिस (सम्पादन मोड)";

    if (rec.patraSankhya && document.getElementById('inPatraSankhya')) document.getElementById('inPatraSankhya').value = rec.patraSankhya;
    if (rec.chalani !== undefined && document.getElementById('inChalani')) document.getElementById('inChalani').value = rec.chalani === '-' ? '' : rec.chalani;
    if (rec.miti && document.getElementById('inMiti')) document.getElementById('inMiti').value = rec.miti;
    if (document.getElementById('inNepalSamvat')) document.getElementById('inNepalSamvat').value = (rec.nepalSamvat !== '-' && rec.nepalSamvat) ? rec.nepalSamvat : ((rec.ns !== '-' && rec.ns) ? rec.ns : '');
    if (rec.receiver && document.getElementById('inReceiver')) document.getElementById('inReceiver').value = rec.receiver;
    if (rec.subject && document.getElementById('inSubject')) document.getElementById('inSubject').value = rec.subject;
    if (rec.applicantName && document.getElementById('inName')) document.getElementById('inName').value = rec.applicantName;
    if (rec.palika && document.getElementById('inPalika')) document.getElementById('inPalika').value = rec.palika;
    if (rec.wadaNo && document.getElementById('inWadaNo')) document.getElementById('inWadaNo').value = rec.wadaNo;
    if (rec.citNo && document.getElementById('inCitNo')) document.getElementById('inCitNo').value = rec.citNo;
    if (rec.citDate && document.getElementById('inCitDate')) document.getElementById('inCitDate').value = rec.citDate;

    if (document.getElementById('chkChangeAddress')) {
        document.getElementById('chkChangeAddress').checked = !!rec.isCustomAddr;
        toggleAddressFields();
    }
    if (rec.custDistrict && document.getElementById('inCustDistrict')) document.getElementById('inCustDistrict').value = rec.custDistrict;
    if (rec.custPalika && document.getElementById('inCustPalika')) document.getElementById('inCustPalika').value = rec.custPalika;
    if (rec.custWada && document.getElementById('inCustWada')) document.getElementById('inCustWada').value = rec.custWada;

    // Reset and reload kitta rows
    const container = document.getElementById('kittaRowsContainer');
    if (container) container.innerHTML = '';
    activeRowIds = [];
    rowCounter = 0;

    if (Array.isArray(rec.kittaList) && rec.kittaList.length > 0) {
        rec.kittaList.forEach(k => addKittaRow(k));
    } else {
        addKittaRow({
            sabikWada: 'गौरादह गाविस ९',
            halWada: 'गौरादह वडा नं. १',
            kitta: '',
            area: '',
            kaifiyat: rec.mainZone || ''
        });
    }

    if (rec.actName && document.getElementById('inActName')) document.getElementById('inActName').value = rec.actName;
    if (rec.decisionDate && document.getElementById('inDecisionDate')) document.getElementById('inDecisionDate').value = rec.decisionDate;

    // Restore saved classification faithfully without forcing default
    const savedZone = (rec.mainZone || (rec.kittaList && rec.kittaList[0] ? rec.kittaList[0].kaifiyat : '') || '').trim();
    const zoneSelect = document.getElementById('inMainZoneDisplay');
    if (zoneSelect) {
        if (savedZone === 'व्यवसायिक शहरी क्षेत्र') {
            zoneSelect.value = 'व्यावसायिक शहरी क्षेत्र';
        } else {
            zoneSelect.value = savedZone;
        }
    }

    if (rec.signAuthority && document.getElementById('inSignAuthority')) {
        document.getElementById('inSignAuthority').value = rec.signAuthority;
        toggleCustomSign();
    }
    if (rec.customSignName && document.getElementById('inCustomSignName')) document.getElementById('inCustomSignName').value = rec.customSignName;
    if (rec.customSignTitle && document.getElementById('inCustomSignTitle')) document.getElementById('inCustomSignTitle').value = rec.customSignTitle;

    window.updateDoc();
    toggleModal(false);
    showToast(`✅ ${rec.applicantName} को सिफारिस सम्पादनका लागि लोड भयो ।`);
};

// Soft-Delete with Recycle Bin Integration
window.deleteRecord = async function (recordId) {
    if (!recordId) return;
    const rec = globalDatabase.find(r => r.id === recordId);
    const applicant = rec ? rec.applicantName : '';
    if (!confirm(`के तपाईं ${applicant ? applicant + ' को ' : ''}यो सिफारिस अभिलेख हटाउन निश्चित हुनुहुन्छ?\n(यो रेकर्ड १०० दिनसम्म रद्दीको टोकरीमा सुरक्षित रहनेछ)`)) return;

    try {
        if (db && db.collection) {
            await db.collection("bargikaranSifarishRecords").doc(recordId).update({
                isDeleted: true,
                deletedAtMillis: Date.now()
            });

            try {
                await db.collection("deleted_records_log").doc(recordId).set({
                    originalId: recordId,
                    collectionName: 'bargikaranSifarishRecords',
                    recordData: rec || {},
                    deletedAtMillis: Date.now()
                });
            } catch (logErr) {
                console.log("Recycle bin log notice:", logErr);
            }
        }

        // Update local cache
        try {
            let local = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
            local = local.filter(r => r.id !== recordId);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(local));
        } catch (e) { }

        showToast("🗑️ रेकर्ड रद्दीको टोकरीमा सारियो ।");
    } catch (e) {
        console.error("Delete error:", e);
        alert("डिलिट गर्न समस्या भयो: " + e.message);
    }
};

// Clean Form Reset for Starting a New Recommendation
window.resetFormForNew = function () {
    const editRecordIndex = document.getElementById('editRecordIndex');
    if (editRecordIndex) editRecordIndex.value = '';
    const formTitle = document.getElementById('formMainTitle');
    if (formTitle) formTitle.innerText = "🗺️ जग्गा वर्गीकरण सिफारिस";

    resetFormFieldsOnly();

    // Classification MUST start blank for new recommendation
    const mainZoneSelect = document.getElementById('inMainZoneDisplay');
    if (mainZoneSelect) mainZoneSelect.value = '';

    // Reset kitta rows to a single clean row with empty classification
    const container = document.getElementById('kittaRowsContainer');
    if (container) container.innerHTML = '';
    activeRowIds = [];
    rowCounter = 0;
    addKittaRow({
        sabikWada: 'गौरादह गाविस ९',
        halWada: 'गौरादह वडा नं. १',
        kitta: '',
        area: '',
        kaifiyat: ''
    });

    window.initializeAutomaticDate();
    window.updateDoc();
    showToast("ℹ️ नयाँ सिफारिस फारम तयार भयो ।");
};

function resetFormFieldsOnly() {
    if (document.getElementById('inName')) document.getElementById('inName').value = '';
    if (document.getElementById('inChalani')) document.getElementById('inChalani').value = '';
    if (document.getElementById('inCitNo')) document.getElementById('inCitNo').value = '';
    if (document.getElementById('inCitDate')) document.getElementById('inCitDate').value = '';
    if (document.getElementById('inReceiver')) document.getElementById('inReceiver').value = 'श्री यो जोजस सँग सम्बन्धित छ ।';
    if (document.getElementById('inPalika')) document.getElementById('inPalika').value = 'गौरादह नगरपालिका';
    if (document.getElementById('inWadaNo')) document.getElementById('inWadaNo').value = window.toNepaliDigit(localStorage.getItem('sifarish_ward') || '1');
    
    const chkAddr = document.getElementById('chkChangeAddress');
    if (chkAddr) {
        chkAddr.checked = false;
        toggleAddressFields();
    }
    if (document.getElementById('inCustDistrict')) document.getElementById('inCustDistrict').value = '';
    if (document.getElementById('inCustPalika')) document.getElementById('inCustPalika').value = '';
    if (document.getElementById('inCustWada')) document.getElementById('inCustWada').value = '';
}

window.exportRecordsToCSV = function () {
    let list = globalDatabase.length > 0 ? globalDatabase : [];
    if (list.length === 0) {
        try {
            list = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
        } catch (e) { }
    }

    const activeList = list.filter(r => !r.isDeleted);
    if (activeList.length === 0) {
        alert("⚠️ निर्यात गर्न कुनै अभिलेख फेला परेन !");
        return;
    }

    let csvContent = "\uFEFFक्र.सं.,चलानी नं.,मिति,निवेदकको नाम,वडा,कित्ता विवरण,वर्गीकरण क्षेत्र\n";
    activeList.forEach((rec, idx) => {
        const kittaText = (rec.kittaList || []).map(k => `कि.नं. ${k.kitta} (${k.area} ब.मि.)`).join('; ');
        csvContent += `"${idx + 1}","${rec.chalani || ''}","${rec.miti || ''}","${rec.applicantName || ''}","${rec.wadaNo || '१'}","${kittaText}","${rec.mainZone || ''}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bargikaran_sifarish_records_${Date.now()}.csv`;
    link.click();
};

// ════════════════════════════════════════════════════════════════════════════
// 10. Data Import System (Lazy Loaded for Speed)
// ════════════════════════════════════════════════════════════════════════════

window.openImportModal = function () {
    const modal = document.getElementById('importModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
        loadImportSourcesOnDemand();
    }
};

window.closeImportModal = function () {
    const modal = document.getElementById('importModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
};

window.setImportFilter = function (filterType) {
    currentImportFilter = filterType;
    document.querySelectorAll('.filter-tab').forEach(tab => tab.classList.remove('active'));
    if (filterType === 'all' && document.getElementById('tabAll')) document.getElementById('tabAll').classList.add('active');
    if (filterType === 'charkilla' && document.getElementById('tabCharkilla')) document.getElementById('tabCharkilla').classList.add('active');
    if (filterType === 'bato' && document.getElementById('tabBato')) document.getElementById('tabBato').classList.add('active');
    if (filterType === 'gharbato' && document.getElementById('tabGharbato')) document.getElementById('tabGharbato').classList.add('active');
    renderImportTable();
};

// Lazy loading: only fetch import sources when user explicitly uses the import modal
function loadImportSourcesOnDemand() {
    reloadImportSources();
    if (!importSourcesLoaded && db && db.collection) {
        importSourcesLoaded = true;
        db.collection("charKillaRecords").limit(120).get().then(snapshot => {
            importSources.charkilla = [];
            snapshot.forEach(doc => {
                const d = doc.data();
                if (!d.isDeleted) importSources.charkilla.push({ id: doc.id, ...d });
            });
            importSources.charkilla.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            renderImportTable();
        }).catch(e => console.log("Charkilla import notice:", e));

        db.collection("batoPramanitRecords").limit(120).get().then(snapshot => {
            importSources.bato = [];
            snapshot.forEach(doc => {
                const d = doc.data();
                if (!d.isDeleted) importSources.bato.push({ id: doc.id, ...d });
            });
            importSources.bato.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            renderImportTable();
        }).catch(e => console.log("Bato import notice:", e));

        db.collection("gharBatoRecords").limit(120).get().then(snapshot => {
            importSources.gharbato = [];
            snapshot.forEach(doc => {
                const d = doc.data();
                if (!d.isDeleted) importSources.gharbato.push({ id: doc.id, ...d });
            });
            importSources.gharbato.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            renderImportTable();
        }).catch(e => console.log("Gharbato import notice:", e));
    } else {
        renderImportTable();
    }
}

window.reloadImportSources = function () {
    try {
        const localChar = JSON.parse(localStorage.getItem('charkilla_records_local') || localStorage.getItem('charKillaRecords') || '[]');
        if (localChar.length > 0 && importSources.charkilla.length === 0) importSources.charkilla = localChar;
    } catch(e) {}

    try {
        const localBato = JSON.parse(localStorage.getItem('bato_records_local') || localStorage.getItem('batoPramanitRecords') || '[]');
        if (localBato.length > 0 && importSources.bato.length === 0) importSources.bato = localBato;
    } catch(e) {}

    try {
        const localGhar = JSON.parse(localStorage.getItem('gharbato_records_local') || localStorage.getItem('gharBatoRecords') || '[]');
        if (localGhar.length > 0 && importSources.gharbato.length === 0) importSources.gharbato = localGhar;
    } catch(e) {}

    renderImportTable();
};

window.renderImportTable = function () {
    const searchVal = (document.getElementById('importSearchField') ? document.getElementById('importSearchField').value : '').trim().toLowerCase();
    const tbody = document.getElementById('importTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    let combinedList = [];

    if (currentImportFilter === 'all' || currentImportFilter === 'charkilla') {
        importSources.charkilla.forEach((item, idx) => {
            combinedList.push({ ...item, _sourceType: 'charkilla', _origIdx: idx });
        });
    }

    if (currentImportFilter === 'all' || currentImportFilter === 'bato') {
        importSources.bato.forEach((item, idx) => {
            combinedList.push({ ...item, _sourceType: 'bato', _origIdx: idx });
        });
    }

    if (currentImportFilter === 'all' || currentImportFilter === 'gharbato') {
        importSources.gharbato.forEach((item, idx) => {
            combinedList.push({ ...item, _sourceType: 'gharbato', _origIdx: idx });
        });
    }

    const filtered = combinedList.filter(item => {
        if (!searchVal) return true;
        const name = (item.name || item.applicantName || '').toLowerCase();
        const chalani = (item.chalani || '').toLowerCase();
        const kittaList = item.kittas || item.landDetails || item.kittaList || [];
        const kittaStr = kittaList.map(k => k.kitta || k.kittaNo || '').join(' ').toLowerCase() + ' ' + (item.kitta || '').toLowerCase();
        return name.includes(searchVal) || chalani.includes(searchVal) || kittaStr.includes(searchVal);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; padding:25px; color:#64748b;">
                    कुनै पनि चार किल्ला वा बाटो प्रमाणित रेकर्ड फेला परेन ।
                </td>
            </tr>
        `;
        return;
    }

    filtered.forEach((rec, idx) => {
        let badgeHtml = '';
        if (rec._sourceType === 'charkilla') {
            badgeHtml = '<span class="source-badge badge-charkilla">🗺️ चार किल्ला</span>';
        } else if (rec._sourceType === 'bato') {
            badgeHtml = '<span class="source-badge badge-bato">🛣️ बाटो प्रमाणित</span>';
        } else {
            badgeHtml = '<span class="source-badge badge-gharbato">🏠 घर बाटो</span>';
        }

        const name = rec.name || rec.applicantName || '-';
        const wada = rec.wada || rec.wadaNo || '१';

        let kittaDetails = [];
        if (Array.isArray(rec.kittas) && rec.kittas.length > 0) {
            kittaDetails = rec.kittas.map(k => `कि.नं. ${window.toNepaliDigit(k.kitta)} (${window.toNepaliDigit(k.area || '-')} ब.मि.)`);
        } else if (Array.isArray(rec.landDetails) && rec.landDetails.length > 0) {
            kittaDetails = rec.landDetails.map(k => `कि.नं. ${window.toNepaliDigit(k.kitta)} (${window.toNepaliDigit(k.area || '-')} ब.मि.)`);
        } else if (Array.isArray(rec.kittaList) && rec.kittaList.length > 0) {
            kittaDetails = rec.kittaList.map(k => `कि.नं. ${window.toNepaliDigit(k.kitta)} (${window.toNepaliDigit(k.area || '-')} ब.मि.)`);
        } else if (rec.kitta) {
            kittaDetails = [`कि.नं. ${window.toNepaliDigit(rec.kitta)} (${window.toNepaliDigit(rec.area || '-')} ब.मि.)`];
        }

        const kittaSummaryHtml = kittaDetails.length > 0 ? kittaDetails.slice(0, 3).join('<br>') + (kittaDetails.length > 3 ? `<br><small style="color:#64748b;">+ थप ${window.toNepaliDigit(kittaDetails.length - 3)} कित्ता...</small>` : '') : '-';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${badgeHtml}</td>
            <td>
                <div style="font-weight:700; color:#1e40af; font-size:0.95rem;">${escapeHtml(name)}</div>
                <div style="font-size:0.8rem; color:#64748b;">वडा नं. ${window.toNepaliDigit(wada)} ${rec.citNo ? '• ना.नं: ' + window.toNepaliDigit(rec.citNo) : ''}</div>
            </td>
            <td style="font-size:0.88rem;">${kittaSummaryHtml}</td>
            <td>
                <div style="font-size:0.85rem; font-weight:600;">${window.toNepaliDigit(rec.miti) || '-'}</div>
                <div style="font-size:0.8rem; color:#64748b;">च.नं. ${window.toNepaliDigit(rec.chalani) || '-'}</div>
            </td>
            <td>
                <button type="button" class="btn-import-header" style="padding:5px 10px; font-size:0.82rem;" onclick="importRecordIntoForm('${rec._sourceType}', ${rec._origIdx})">
                    📥 यो डाटा भर्नुस्
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
};

window.importRecordIntoForm = function (sourceType, origIdx) {
    const list = importSources[sourceType] || [];
    const rec = list[origIdx];
    if (!rec) {
        alert("⚠️ डाटा लोड गर्न सकिएन !");
        return;
    }

    const applicantName = rec.name || rec.applicantName || '';
    if (applicantName && document.getElementById('inName')) {
        document.getElementById('inName').value = applicantName;
    }

    if (document.getElementById('inPalika')) document.getElementById('inPalika').value = 'गौरादह नगरपालिका';
    if (document.getElementById('inWadaNo')) document.getElementById('inWadaNo').value = rec.wada || rec.wadaNo || '१';

    if (rec.citNo && document.getElementById('inCitNo')) document.getElementById('inCitNo').value = rec.citNo;
    if (rec.citDate && document.getElementById('inCitDate')) document.getElementById('inCitDate').value = rec.citDate;

    const hasCustomAddr = !!(rec.changeAddress || rec.isCustomAddr);
    if (document.getElementById('chkChangeAddress')) {
        document.getElementById('chkChangeAddress').checked = hasCustomAddr;
        toggleAddressFields();
        if (hasCustomAddr) {
            if (rec.custDistrict && document.getElementById('inCustDistrict')) document.getElementById('inCustDistrict').value = rec.custDistrict;
            if (rec.custPalika && document.getElementById('inCustPalika')) document.getElementById('inCustPalika').value = rec.custPalika;
            if (rec.custWada && document.getElementById('inCustWada')) document.getElementById('inCustWada').value = rec.custWada;
        }
    }

    const container = document.getElementById('kittaRowsContainer');
    if (container) container.innerHTML = '';
    activeRowIds = [];
    rowCounter = 0;

    let kittaItems = [];
    if (Array.isArray(rec.kittas) && rec.kittas.length > 0) {
        kittaItems = rec.kittas;
    } else if (Array.isArray(rec.landDetails) && rec.landDetails.length > 0) {
        kittaItems = rec.landDetails;
    } else if (Array.isArray(rec.kittaList) && rec.kittaList.length > 0) {
        kittaItems = rec.kittaList;
    } else if (rec.kitta) {
        kittaItems = [{ kitta: rec.kitta, area: rec.area || '' }];
    }

    const sabikWadaText = rec.sabikWada ? (rec.sabikWada.includes('गा') ? rec.sabikWada : `गौरादह गाविस ${rec.sabikWada}`) : 'गौरादह गाविस ९';
    const halWadaText = `गौरादह वडा नं. ${rec.wada || '१'}`;
    const defaultZone = (rec.landUseZone && rec.landUseZone !== 'NONE') ? rec.landUseZone : (document.getElementById('inMainZoneDisplay').value || '');

    if (kittaItems.length > 0) {
        kittaItems.forEach(k => {
            addKittaRow({
                sabikWada: k.sabikWada || sabikWadaText,
                halWada: k.halWada || halWadaText,
                kitta: k.kitta || k.kittaNo || '',
                area: k.area || '',
                kaifiyat: k.kaifiyat || defaultZone
            });
        });
    } else {
        addKittaRow({
            sabikWada: sabikWadaText,
            halWada: halWadaText,
            kitta: '',
            area: '',
            kaifiyat: defaultZone
        });
    }

    if (rec.landUseZone && rec.landUseZone !== 'NONE' && document.getElementById('inMainZoneDisplay')) {
        document.getElementById('inMainZoneDisplay').value = rec.landUseZone;
    }

    window.updateDoc();
    closeImportModal();
    showToast(`✅ ${applicantName} को ${sourceType === 'charkilla' ? 'चार किल्ला' : (sourceType === 'bato' ? 'बाटो' : 'घर बाटो')} विवरण सफलतापूर्वक लोड भयो !`);
};

function showToast(message) {
    let toast = document.getElementById('toastContainer');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toastContainer';
        document.body.appendChild(toast);
    }
    toast.innerText = message;
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 4000);
}

// Diagnostic helper to inspect existing historical records for suspected duplicates
window.detectHistoricalDuplicates = function () {
    const map = {};
    const suspected = [];
    globalDatabase.forEach(rec => {
        const name = (rec.applicantName || '').trim().toLowerCase();
        const chalani = (rec.chalani || '').trim();
        const kitta = (rec.kittaList || []).map(k => k.kitta).sort().join(',');
        const key = `${name}|${chalani}|${kitta}`;
        if (!map[key]) {
            map[key] = [];
        }
        map[key].push(rec);
    });

    Object.keys(map).forEach(k => {
        if (map[k].length > 1) {
            suspected.push({
                key: k,
                count: map[k].length,
                records: map[k].map(r => ({ id: r.id, name: r.applicantName, chalani: r.chalani, miti: r.miti, time: r.timestamp }))
            });
        }
    });

    console.log(`[Diagnostic] Found ${suspected.length} suspected duplicate group(s) in historical archive:`, suspected);
    return suspected;
};

// 11. Initialization on Load — Clean Blank State & Instant Loading
window.onload = function () {
    window.initializeAutomaticDate();
    if (activeRowIds.length === 0) {
        addKittaRow({
            sabikWada: 'गौरादह गाविस ९',
            halWada: 'गौरादह वडा नं. १',
            kitta: '',
            area: '',
            kaifiyat: ''
        });
    }
    window.adjustSignaturePosition(35);
    window.updateDoc();
};

window.addEventListener('templateInjected', function () {
    window.initializeAutomaticDate();
});

// Real-Time Firebase Listener — Only subscribe to Bargikaran records on startup for fast loading
document.addEventListener('DOMContentLoaded', () => {
    (window._firebaseAuthReady || Promise.resolve()).then(() => {
        if (db && db.collection) {
            db.collection("bargikaranSifarishRecords").onSnapshot((snapshot) => {
                globalDatabase = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    if (!data.isDeleted) {
                        globalDatabase.push({ id: doc.id, ...data });
                    }
                });
                globalDatabase.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

                // Synchronize local storage cache for instant cross-computer / offline resilience
                try {
                    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(globalDatabase));
                } catch (e) { }

                // Update sync status indicator in Abhilekh modal
                const badge = document.getElementById('syncStatusBadge');
                if (badge) {
                    badge.innerText = `🟢 क्लाउड सिङ्क सक्रिय (${window.toNepaliDigit(globalDatabase.length)} रेकर्ड)`;
                    badge.style.background = '#dcfce7';
                    badge.style.color = '#166534';
                }

                renderDatabaseTable();
            }, (err) => {
                console.warn("Firestore snapshot error/fallback:", err);
                const badge = document.getElementById('syncStatusBadge');
                if (badge) {
                    badge.innerText = '🟡 अफलाइन क्यास';
                    badge.style.background = '#fef3c7';
                    badge.style.color = '#92400e';
                }
            });
        }
    }).catch(() => {});
});
