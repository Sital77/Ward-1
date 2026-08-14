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

let landRowCounter = 0;
let activeLandRowIds = [];

let incomeRowCounter = 0;
let activeIncomeRowIds = [];

let globalDatabase = [];

// Auth ready snapshot listener
(window._firebaseAuthReady || Promise.resolve()).then(() => {
    db.collection("aamdaniPramanitRecords").onSnapshot((snapshot) => {
        globalDatabase = [];
        snapshot.forEach((doc) => {
            globalDatabase.push({ id: doc.id, ...doc.data() });
        });
        globalDatabase.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        renderDatabaseTable();
    });
}).catch((e) => { /* logged */ });

// Number conversions
window.toNepaliDigit = function(num) {
    if (num === null || num === undefined) return '';
    const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return num.toString().split('').map(digit => nepaliDigits[digit] || digit).join('');
};

window.toEnglishNumber = function(numStr) {
    if (!numStr) return '';
    const neToEn = { '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9' };
    return numStr.toString().split('').map(char => neToEn[char] || char).join('');
};

window.parseAmount = function(str) {
    if (!str) return 0;
    const engStr = window.toEnglishNumber(str).replace(/,/g, '').trim();
    const val = parseFloat(engStr);
    return isNaN(val) ? 0 : val;
};

window.formatNepaliCurrency = function(num) {
    if (isNaN(num)) return "०";
    let n = num.toString().split(".");
    let x1 = n[0];
    let x2 = n.length > 1 ? "." + n[1] : "";
    let last3 = x1.substring(x1.length - 3);
    let other = x1.substring(0, x1.length - 3);
    if (other !== "") last3 = "," + last3;
    let formatted = other.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + last3 + x2;
    return window.toNepaliDigit(formatted);
};

// Nepali Number-to-Words Converter
const nepaliWords0to99 = [
    "शून्य", "एक", "दुई", "तीन", "चार", "पाँच", "छ", "सात", "आठ", "नौ", "दस",
    "एघार", "बाह्र", "तेह्र", "चौध", "पन्ध्र", "सोह्र", "सत्र", "अठार", "उन्नाइस", "बीस",
    "एकाइस", "बाइस", "तैस", "चौबिस", "पच्चिस", "छब्बिस", "सत्ताइस", "अठ्ठाइस", "उनन्तीस", "तीस",
    "एकतीस", "बत्तीस", "तेत्तीस", "चौँतीस", "पैँतीस", "छत्तीस", "सैँतीस", "अठतीस", "उनन्चालीस", "चालीस",
    "एकचालीस", "बयालीस", "त्रिचालीस", "चौवालिस", "पैँतालीस", "छियालीस", "सत्चालीस", "अठचालीस", "उनन्पचास", "पचास",
    "एकपन्न", "बाउन्न", "त्रिपन्न", "चौवन", "पचपन्न", "छप्पन्न", "सन्ताउन्न", "अन्ठाउन्न", "उनन्साठ्ठी", "साठ्ठी",
    "एकसाठ्ठी", "बासाठ्ठी", "त्रिसाठ्ठी", "चौँसाठ्ठी", "पैँसाठ्ठी", "छियासाठ्ठी", "सत्साठ्ठी", "अठसाठ्ठी", "उनन्सत्तारी", "सत्तरी",
    "एकहत्तर", "बहत्तर", "त्रिहत्तर", "चौहत्तर", "पचहत्तर", "छियत्तर", "सतहत्तर", "अठहत्तर", "उनासी", "असी",
    "एकासी", "बयासी", "त्रियासी", "चौरासी", "पचासी", "छियासी", "सत्तासी", "अठासी", "उनान्नब्बे", "नब्बे",
    "एकान्नब्बे", "बयानब्बे", "त्रियान्नब्बे", "चौरान्नब्बे", "पञ्चान्नब्बे", "छियान्नब्बे", "सन्थान्नब्बे", "अन्ठान्नब्बे", "उनान्सय"
];

window.convertNumberToNepaliWords = function(num) {
    if (isNaN(num) || num <= 0) return "";
    num = Math.floor(num);

    function get99Words(n) {
        if (n <= 0) return "";
        return nepaliWords0to99[n] || "";
    }

    let parts = [];

    // Arab (10^9)
    if (num >= 1000000000) {
        let arab = Math.floor(num / 1000000000);
        num %= 1000000000;
        parts.push(get99Words(arab) + " अरब");
    }

    // Crore (10^7)
    if (num >= 10000000) {
        let crore = Math.floor(num / 10000000);
        num %= 10000000;
        parts.push(get99Words(crore) + " करोड");
    }

    // Lakh (10^5)
    if (num >= 100000) {
        let lakh = Math.floor(num / 100000);
        num %= 100000;
        parts.push(get99Words(lakh) + " लाख");
    }

    // Thousand (10^3)
    if (num >= 1000) {
        let thousand = Math.floor(num / 1000);
        num %= 1000;
        parts.push(get99Words(thousand) + " हजार");
    }

    // Hundred (10^2)
    if (num >= 100) {
        let hundred = Math.floor(num / 100);
        num %= 100;
        parts.push(get99Words(hundred) + " सय");
    }

    // Remaining 1-99
    if (num > 0) {
        parts.push(get99Words(num));
    }

    return parts.join(" ");
};

// Controls Abhilekh Popup
window.toggleModal = function(show) {
    const modal = document.getElementById('abhilekhModal');
    if (modal) {
        modal.style.display = show ? 'flex' : 'none';
        if (show) renderDatabaseTable();
    }
};

// Signature position
window.adjustSignaturePosition = function(value) {
    const marginVal = document.getElementById('marginVal');
    if (marginVal) marginVal.innerText = window.toNepaliDigit(value) + " px";
    const docFooter = document.getElementById('docFooterSection');
    if (docFooter) {
        docFooter.style.marginTop = value + "px";
    }
};

// Safely sets innerText on an element by ID
function safeSetText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
    return el;
}

// Dynamic Land Rows with Optional Address Fields
window.addLandRow = function(data = null) {
    landRowCounter++;
    const rowId = 'land_row_' + landRowCounter;
    activeLandRowIds.push(rowId);

    const container = document.getElementById('landRowsContainer');
    if (!container) return;

    const rowHtml = `
        <div class="builder-row-land" id="${rowId}" style="background:#fff; padding:10px; border-radius:6px; box-shadow:0 1px 3px rgba(0,0,0,0.05); border:1px solid #edf2f7; margin-bottom:10px;">
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:6px;">
                <input type="text" class="input-sit" placeholder="सिट नं." value="${data && data.sit ? data.sit : ''}" oninput="updateDoc()">
                <input type="text" class="input-kitta" placeholder="कि.नं." value="${data && data.kitta ? data.kitta : ''}" oninput="updateDoc()">
                <input type="text" class="input-area" placeholder="क्षेत्रफल" value="${data && data.area ? data.area : ''}" oninput="updateDoc()">
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr auto; gap:8px; align-items:center;">
                <input type="text" class="input-land-dist" placeholder="जिल्ला (फरक भएमा)" value="${data && data.dist ? data.dist : ''}" oninput="updateDoc()">
                <input type="text" class="input-land-palika" placeholder="पालिका (फरक भएमा)" value="${data && data.palika ? data.palika : ''}" oninput="updateDoc()">
                <input type="text" class="input-land-wada" placeholder="वडा (फरक भएमा)" value="${data && data.wada ? data.wada : ''}" oninput="updateDoc()">
                <button type="button" class="btn-remove" onclick="removeLandRow('${rowId}')">❌</button>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', rowHtml);
    updateDoc();
};

window.removeLandRow = function(rowId) {
    const idx = activeLandRowIds.indexOf(rowId);
    if (idx > -1) activeLandRowIds.splice(idx, 1);
    const el = document.getElementById(rowId);
    if (el) el.remove();
    updateDoc();
};

// Dynamic Income Rows
window.addIncomeRow = function(data = null) {
    incomeRowCounter++;
    const rowId = 'income_row_' + incomeRowCounter;
    activeIncomeRowIds.push(rowId);

    const container = document.getElementById('incomeRowsContainer');
    if (!container) return;

    const rowHtml = `
        <div class="builder-row-income" id="${rowId}">
            <input type="text" class="input-business" placeholder="व्यवसायको नाम" value="${data && data.business ? data.business : ''}" oninput="updateDoc()">
            <input type="text" class="input-amount" placeholder="आम्दानी (रू)" value="${data && data.amount ? data.amount : ''}" oninput="updateDoc()">
            <button type="button" class="btn-remove" onclick="removeIncomeRow('${rowId}')">❌</button>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', rowHtml);
    updateDoc();
};

window.removeIncomeRow = function(rowId) {
    const idx = activeIncomeRowIds.indexOf(rowId);
    if (idx > -1) activeIncomeRowIds.splice(idx, 1);
    const el = document.getElementById(rowId);
    if (el) el.remove();
    updateDoc();
};

window.toggleCustomSign = function() {
    const signEl = document.getElementById('inSignAuthority');
    if (!signEl) return;
    const val = signEl.value;
    const box = document.getElementById('customSignBox');
    if (box) {
        box.style.display = (val === 'CUSTOM') ? 'grid' : 'none';
    }
};

window.updateNepalSambatFromMiti = function() {
    const inNS = document.getElementById('inNepalSamvat');
    if (inNS && !inNS.value) {
        inNS.value = '११४६';
        updateDoc();
    }
};

function generateLandDetailsText() {
    if (activeLandRowIds.length === 0) {
        return "सिट नं. ..... कि.नं. ..... को ज.वि. .....";
    }

    const globalDist = document.getElementById('inLandDist') ? document.getElementById('inLandDist').value.trim() : '';
    const globalPalika = document.getElementById('inLandPalika') ? document.getElementById('inLandPalika').value.trim() : '';
    const globalWada = document.getElementById('inLandWada') ? document.getElementById('inLandWada').value.trim() : '';

    const parts = [];
    activeLandRowIds.forEach((id) => {
        const block = document.getElementById(id);
        if (block) {
            const sitInput = block.querySelector('.input-sit');
            const kittaInput = block.querySelector('.input-kitta');
            const areaInput = block.querySelector('.input-area');

            const distInput = block.querySelector('.input-land-dist');
            const palikaInput = block.querySelector('.input-land-palika');
            const wadaInput = block.querySelector('.input-land-wada');

            const s = sitInput && sitInput.value.trim() ? sitInput.value.trim() : '';
            const k = kittaInput && kittaInput.value.trim() ? kittaInput.value.trim() : '.....';
            const a = areaInput && areaInput.value.trim() ? areaInput.value.trim() : '.....';

            const rDist = distInput && distInput.value.trim() ? distInput.value.trim() : '';
            const rPalika = palikaInput && palikaInput.value.trim() ? palikaInput.value.trim() : '';
            const rWada = wadaInput && wadaInput.value.trim() ? wadaInput.value.trim() : '';

            let prefixAddr = '';
            if (rDist || rPalika || rWada) {
                const targetDist = rDist || globalDist || '.......';
                const targetPalika = rPalika || globalPalika || '.......';
                const targetWada = rWada || globalWada || '...';
                prefixAddr = `${targetDist} जिल्ला ${targetPalika} वडा नं. ${targetWada} स्थित `;
            }

            const sitText = s ? `सिट नं. ${s} ` : '';
            parts.push(`${prefixAddr}${sitText}कि.नं. ${k} को ज.वि. ${a}`);
        }
    });
    return parts.join(" तथा ");
}

// Main sync engine
window.updateDoc = function() {
    const patraSankhya = document.getElementById('inPatraSankhya');
    safeSetText('lblPatraSankhya', patraSankhya ? patraSankhya.value : '');

    const chalani = document.getElementById('inChalani');
    safeSetText('lblChalani', chalani ? chalani.value : '');

    const miti = document.getElementById('inMiti');
    safeSetText('lblMiti', miti && miti.value ? miti.value : '........');

    const nepalSamvat = document.getElementById('inNepalSamvat');
    safeSetText('lblNepalSamvat', nepalSamvat && nepalSamvat.value ? nepalSamvat.value : '........');

    const office = document.getElementById('inOffice');
    safeSetText('lblOfficeName', office && office.value ? office.value : '........');

    const name = document.getElementById('inName');
    safeSetText('lblOwnerName', name && name.value ? name.value : '...........................');

    const dist = document.getElementById('inDist');
    safeSetText('lblDist', dist && dist.value ? dist.value : '........');

    const palika = document.getElementById('inPalika');
    safeSetText('lblPalika', palika && palika.value ? palika.value : '........');

    const wadaNo = document.getElementById('inWadaNo');
    safeSetText('lblWadaBody', wadaNo && wadaNo.value ? wadaNo.value : '...');

    const landDist = document.getElementById('inLandDist');
    safeSetText('lblLandDist', landDist && landDist.value ? landDist.value : '........');

    const landPalika = document.getElementById('inLandPalika');
    safeSetText('lblLandPalika', landPalika && landPalika.value ? landPalika.value : '........');

    const landWada = document.getElementById('inLandWada');
    safeSetText('lblLandWada', landWada && landWada.value ? landWada.value : '...');

    const incomeType = document.getElementById('inIncomeType');
    safeSetText('lblIncomeType', incomeType && incomeType.value ? incomeType.value : '......................');

    // Citizenship block logic
    const citNoEl = document.getElementById('inCitNo');
    const citDateEl = document.getElementById('inCitDate');
    const citNo = citNoEl ? citNoEl.value.trim() : '';
    const citDate = citDateEl ? citDateEl.value.trim() : '';
    const citBlock = document.getElementById('lblCitBlock');
    
    if (citBlock) {
        if (citNo || citDate) {
            citBlock.style.display = 'inline';
            safeSetText('lblCitNo', citNo || '.......');
            safeSetText('lblCitDate', citDate || '.......');
        } else {
            citBlock.style.display = 'none';
        }
    }

    // Build Land Details sentence
    const landDetailsText = generateLandDetailsText();
    safeSetText('lblLandDetails', landDetailsText);

    // Build Income Table and Calculate Total
    const tbody = document.getElementById('outputTableBody');
    if (tbody) {
        tbody.innerHTML = '';
        let totalIncome = 0;

        if (activeIncomeRowIds.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td>१</td>
                    <td>-</td>
                    <td>-</td>
                </tr>
            `;
        } else {
            activeIncomeRowIds.forEach((id, index) => {
                const block = document.getElementById(id);
                if (block) {
                    const bNameInput = block.querySelector('.input-business');
                    const bAmtInput = block.querySelector('.input-amount');

                    const bName = bNameInput && bNameInput.value ? bNameInput.value.trim() : '-';
                    const bAmtStr = bAmtInput && bAmtInput.value ? bAmtInput.value.trim() : '';
                    const bAmt = window.parseAmount(bAmtStr);
                    totalIncome += bAmt;
                    
                    const formattedAmt = bAmt > 0 ? window.formatNepaliCurrency(bAmt) + '/-' : (bAmtStr !== '' ? window.toNepaliDigit(bAmtStr) + '/-' : '-');
                    
                    const rowHtml = `
                        <tr>
                            <td>${window.toNepaliDigit(index + 1)}</td>
                            <td style="text-align:left; padding-left:15px;">${bName}</td>
                            <td>${formattedAmt}</td>
                        </tr>
                    `;
                    tbody.insertAdjacentHTML('beforeend', rowHtml);
                }
            });
        }
        
        safeSetText('lblTotalAmt', totalIncome > 0 ? window.formatNepaliCurrency(totalIncome) : '...........');
        safeSetText('lblTotalTableAmount', totalIncome > 0 ? window.formatNepaliCurrency(totalIncome) + '/-' : '/-');

        // Auto-convert total income number to Nepali Words
        const totalWordsInput = document.getElementById('inTotalWords');
        if (totalWordsInput && (!window._userEditedWords || !totalWordsInput.value.trim())) {
            if (totalIncome > 0) {
                totalWordsInput.value = window.convertNumberToNepaliWords(totalIncome);
            }
        }
        safeSetText('lblTotalWords', totalWordsInput && totalWordsInput.value ? totalWordsInput.value : '..........................');
    }

    // Signature logic
    const signSelect = document.getElementById('inSignAuthority');
    if (signSelect) {
        let sigName = "", sigTitle = "";
        const lblSigName = document.getElementById('lblSigName');
        const signVal = signSelect.value;

        if (signVal === 'BLANK') {
            sigName = "";
            sigTitle = "";
            if (lblSigName) lblSigName.style.borderTop = "none";
        } else {
            if (lblSigName) lblSigName.style.borderTop = "1.5px dashed #000";
            if (signVal === 'CUSTOM') {
                const cName = document.getElementById('inCustomSignName');
                const cTitle = document.getElementById('inCustomSignTitle');
                sigName = cName && cName.value ? cName.value : '....................';
                sigTitle = cTitle && cTitle.value ? cTitle.value : '....................';
            } else {
                const signData = signVal.split('|');
                sigName = signData[0];
                sigTitle = signData[1];
            }
        }
        if (lblSigName) lblSigName.innerText = sigName;
        safeSetText('lblSigTitle', sigTitle);
    }
};

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
    } catch (error) {}
}

function getNepalSambatYear(adDate) {
    return 1146;
}

window.initializeAutomaticDate = function() {
    try {
        let nepaliBSDateStr = "";
        let nepaliNSYearStr = "";
        let bsYearVal = 2083;
        let bsMonthVal = 2;

        const converter = window["@sbmdkl/nepali-date-converter"];
        if (!converter && (window._dateInitRetries || 0) < 5) {
            window._dateInitRetries = (window._dateInitRetries || 0) + 1;
            setTimeout(window.initializeAutomaticDate, 400);
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
    } catch (error) {}
};

// Initial Add 1 Land and 1 Income Row and initialize automatic date
window.onload = function() {
    window.initializeAutomaticDate();
    addLandRow();
    addIncomeRow();
    window.adjustSignaturePosition(40);
};

window.addEventListener('templateInjected', function() {
    window.initializeAutomaticDate();
});

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
    return window.toNepaliDigit(formatted);
}

window.renderDatabaseTable = function() {
    const tbody = document.getElementById('dbTableBody');
    if (!tbody) return;

    const searchField = document.getElementById('searchField');
    const searchVal = searchField ? searchField.value.trim().toLowerCase() : '';
    tbody.innerHTML = '';

    let counter = 0;
    globalDatabase.forEach((rec) => {
        if (searchVal && !(rec.name || '').toLowerCase().includes(searchVal)) return;
        counter++;
        tbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td><b>${window.toNepaliDigit(counter)}</b></td>
                <td><b>${rec.name || '-'}</b></td>
                <td><span style="color:#2b6cb0; font-weight:bold;">आम्दानी प्रमाणित</span></td>
                <td>
                    ${window.toNepaliDigit(rec.miti || '')}
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
};

window.editFromDB = function(recordId) {
    const record = globalDatabase.find(r => r.id === recordId);
    if (!record) return;

    const editField = document.getElementById('editRecordIndex');
    if (editField) editField.value = recordId;

    const formTitle = document.getElementById('formMainTitle');
    if (formTitle) formTitle.innerText = "🔄 सम्पादन मोड";

    if (document.getElementById('inPatraSankhya')) document.getElementById('inPatraSankhya').value = record.patraSankhya || '२०८३/०८४';
    if (document.getElementById('inChalani')) document.getElementById('inChalani').value = record.chalani === '-' ? '' : (record.chalani || '');
    if (document.getElementById('inMiti')) document.getElementById('inMiti').value = record.miti || '';
    if (document.getElementById('inNepalSamvat')) document.getElementById('inNepalSamvat').value = record.nepalSamvat || '';
    
    if (document.getElementById('inOffice')) document.getElementById('inOffice').value = record.office || '';
    if (document.getElementById('inName')) document.getElementById('inName').value = record.name || '';
    if (document.getElementById('inCitNo')) document.getElementById('inCitNo').value = record.citNo || '';
    if (document.getElementById('inCitDate')) document.getElementById('inCitDate').value = record.citDate || '';
    
    if (document.getElementById('inDist')) document.getElementById('inDist').value = record.dist || 'झापा';
    if (document.getElementById('inPalika')) document.getElementById('inPalika').value = record.palika || 'गौरादह नगरपालिका';
    if (document.getElementById('inWadaNo')) document.getElementById('inWadaNo').value = record.wadaNo || '१';
    
    if (document.getElementById('inLandDist')) document.getElementById('inLandDist').value = record.landDist || 'झापा';
    if (document.getElementById('inLandPalika')) document.getElementById('inLandPalika').value = record.landPalika || 'गौरादह नगरपालिका';
    if (document.getElementById('inLandWada')) document.getElementById('inLandWada').value = record.landWada || '१';
    
    if (document.getElementById('inIncomeType')) document.getElementById('inIncomeType').value = record.incomeType || 'कृषि तथा पशुपालन';
    if (document.getElementById('inTotalWords')) document.getElementById('inTotalWords').value = record.totalWords || '';
    window._userEditedWords = true;

    if (document.getElementById('inSignAuthority')) document.getElementById('inSignAuthority').value = record.signAuth || 'नगेन्द्र भण्डारी|वडा अध्यक्ष';
    if (record.signAuth === 'CUSTOM') {
        if (document.getElementById('customSignBox')) document.getElementById('customSignBox').style.display = 'grid';
        if (document.getElementById('inCustomSignName')) document.getElementById('inCustomSignName').value = record.customSignName || '';
        if (document.getElementById('inCustomSignTitle')) document.getElementById('inCustomSignTitle').value = record.customSignTitle || '';
    } else {
        if (document.getElementById('customSignBox')) document.getElementById('customSignBox').style.display = 'none';
    }

    if (record.sigMargin) {
        if (document.getElementById('inSigMargin')) document.getElementById('inSigMargin').value = record.sigMargin;
        window.adjustSignaturePosition(record.sigMargin);
    }

    // Clear existing dynamic rows
    const landContainer = document.getElementById('landRowsContainer');
    if (landContainer) landContainer.innerHTML = '';
    activeLandRowIds = [];
    
    const incomeContainer = document.getElementById('incomeRowsContainer');
    if (incomeContainer) incomeContainer.innerHTML = '';
    activeIncomeRowIds = [];

    if (record.landRows && record.landRows.length > 0) {
        record.landRows.forEach(row => addLandRow(row));
    } else {
        addLandRow();
    }
    
    if (record.incomeRows && record.incomeRows.length > 0) {
        record.incomeRows.forEach(row => addIncomeRow(row));
    } else {
        addIncomeRow();
    }

    window.toggleModal(false);
    window.updateDoc();
};
window.loadRecordForEdit = window.editFromDB;

window.deleteFromDB = async function(id) {
    if (confirm("के तपाईं यो रेकर्ड क्लाउड डेटाबेसबाट स्थायी रूपमा हटाउन चाहनुहुन्छ?")) {
        try {
            await db.collection("aamdaniPramanitRecords").doc(id).delete();
        } catch (e) {
            alert("डिलिट गर्न समस्या भयो: " + e.message);
        }
    }
};

window.printAndSaveSystem = async function() {
    const nameEl = document.getElementById('inName');
    if (!nameEl || !nameEl.value.trim()) {
        alert("⚠️ कृपया निवेदकको नाम अनिवार्य लेख्नुहोस् !");
        return;
    }

    const btn = document.querySelector('.btn-print');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = "⏳ सुरक्षित हुँदैछ...";
    }

    const editIdEl = document.getElementById('editRecordIndex');
    const editId = editIdEl ? editIdEl.value.trim() : '';
    
    const landRowsData = activeLandRowIds.map(id => {
        const block = document.getElementById(id);
        return {
            sit: block && block.querySelector('.input-sit') ? block.querySelector('.input-sit').value : '',
            kitta: block && block.querySelector('.input-kitta') ? block.querySelector('.input-kitta').value : '',
            area: block && block.querySelector('.input-area') ? block.querySelector('.input-area').value : '',
            dist: block && block.querySelector('.input-land-dist') ? block.querySelector('.input-land-dist').value : '',
            palika: block && block.querySelector('.input-land-palika') ? block.querySelector('.input-land-palika').value : '',
            wada: block && block.querySelector('.input-land-wada') ? block.querySelector('.input-land-wada').value : ''
        };
    });
    
    const incomeRowsData = activeIncomeRowIds.map(id => {
        const block = document.getElementById(id);
        return {
            business: block && block.querySelector('.input-business') ? block.querySelector('.input-business').value : '',
            amount: block && block.querySelector('.input-amount') ? block.querySelector('.input-amount').value : ''
        };
    });

    const docData = {
        templateType: 'aamdani-pramanit',
        patraSankhya: document.getElementById('inPatraSankhya') ? document.getElementById('inPatraSankhya').value : '',
        chalani: document.getElementById('inChalani') ? document.getElementById('inChalani').value : '',
        miti: document.getElementById('inMiti') ? document.getElementById('inMiti').value : '',
        nepalSamvat: document.getElementById('inNepalSamvat') ? document.getElementById('inNepalSamvat').value : '',
        office: document.getElementById('inOffice') ? document.getElementById('inOffice').value : '',
        name: document.getElementById('inName') ? document.getElementById('inName').value : '',
        citNo: document.getElementById('inCitNo') ? document.getElementById('inCitNo').value : '',
        citDate: document.getElementById('inCitDate') ? document.getElementById('inCitDate').value : '',
        dist: document.getElementById('inDist') ? document.getElementById('inDist').value : '',
        palika: document.getElementById('inPalika') ? document.getElementById('inPalika').value : '',
        wadaNo: document.getElementById('inWadaNo') ? document.getElementById('inWadaNo').value : '',
        landDist: document.getElementById('inLandDist') ? document.getElementById('inLandDist').value : '',
        landPalika: document.getElementById('inLandPalika') ? document.getElementById('inLandPalika').value : '',
        landWada: document.getElementById('inLandWada') ? document.getElementById('inLandWada').value : '',
        incomeType: document.getElementById('inIncomeType') ? document.getElementById('inIncomeType').value : '',
        totalWords: document.getElementById('inTotalWords') ? document.getElementById('inTotalWords').value : '',
        signAuth: document.getElementById('inSignAuthority') ? document.getElementById('inSignAuthority').value : '',
        customSignName: document.getElementById('inCustomSignName') ? document.getElementById('inCustomSignName').value : '',
        customSignTitle: document.getElementById('inCustomSignTitle') ? document.getElementById('inCustomSignTitle').value : '',
        sigMargin: document.getElementById('inSigMargin') ? document.getElementById('inSigMargin').value : '40',
        landRows: landRowsData,
        incomeRows: incomeRowsData,
        timestamp: Date.now()
    };

    // Sanitize object to remove any undefined properties
    Object.keys(docData).forEach(key => {
        if (docData[key] === undefined) {
            delete docData[key];
        }
    });

    try {
        if (editId) {
            await db.collection("aamdaniPramanitRecords").doc(editId).update(docData);
        } else {
            const docRef = await db.collection("aamdaniPramanitRecords").add(docData);
            if (editIdEl) editIdEl.value = docRef.id;
            const formTitle = document.getElementById('formMainTitle');
            if (formTitle) formTitle.innerText = "🔄 सम्पादन मोड";
        }
        
        window.print();
    } catch (e) {
        alert("क्लाउडमा डाटा सुरक्षित गर्दा समस्या भयो: " + e.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
};
