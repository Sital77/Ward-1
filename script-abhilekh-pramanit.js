// ══════════════════════════════════════════════════════
//  script-abhilekh-pramanit.js
//  अभिलेख प्रमाणित सिफारिस — Firebase Firestore Logic
// ══════════════════════════════════════════════════════

const firebaseConfig = {
    apiKey: "AIzaSyC3uCmLgNN8s0FDMIrkgxR8eH_AvJ_D3J4",
    authDomain: "gauradaha-ward1.firebaseapp.com",
    projectId: "gauradaha-ward1",
    storageBucket: "gauradaha-ward1.firebasestorage.app",
    messagingSenderId: "905617778132",
    appId: "1:905617778132:web:b8149cf37ae3f3c3b42241"
};

const app = firebase.initializeApp(firebaseConfig);
const db  = firebase.firestore();

let globalDatabase = [];

// Real-time listener for abhilekhRecords
db.collection("abhilekhRecords").onSnapshot((snapshot) => {
    globalDatabase = [];
    snapshot.forEach((doc) => {
        globalDatabase.push({ id: doc.id, ...doc.data() });
    });
    globalDatabase.sort((a, b) => b.timestamp - a.timestamp);
    renderDatabaseTable();
});

// ── Helpers ─────────────────────────────────────────
function toNepaliDigit(num) {
    const nd = ['०','१','२','३','४','५','६','७','८','९'];
    return num.toString().split('').map(d => nd[d] || d).join('');
}

function getSelectedMuniType() {
    const radios = document.querySelectorAll('input[name="muniTypeRadio"]');
    for (const r of radios) { if (r.checked) return r.value; }
    return 'गाउँपालिका';
}

function getSelectedChildGender() {
    const radios = document.querySelectorAll('input[name="childGenderRadio"]');
    for (const r of radios) { if (r.checked) return r.value; }
    return 'छोरी';
}

// ── Mode toggle ─────────────────────────────────────
function setMode(mode) {
    document.getElementById('currentMode').value = mode;

    const btnJanma = document.getElementById('btnJanma');
    const btnBibaha = document.getElementById('btnBibaha');

    const formJanma = document.getElementById('formSectionJanma');
    const formBibaha = document.getElementById('formSectionBibaha');

    const bodyJanma = document.getElementById('bodyTextJanma');
    const bodyBibaha = document.getElementById('bodyTextBibaha');

    const tapsilJanma = document.getElementById('tapsilSectionJanma');
    const tapsilBibaha = document.getElementById('tapsilSectionBibaha');

    if (mode === 'janma') {
        btnJanma.className = "mode-btn active-kholne";
        btnBibaha.className = "mode-btn";

        formJanma.style.display = "block";
        formBibaha.style.display = "none";

        bodyJanma.style.display = "block";
        bodyBibaha.style.display = "none";

        tapsilJanma.style.display = "block";
        tapsilBibaha.style.display = "none";
    } else {
        btnJanma.className = "mode-btn";
        btnBibaha.className = "mode-btn active-banda";

        formJanma.style.display = "none";
        formBibaha.style.display = "block";

        bodyJanma.style.display = "none";
        bodyBibaha.style.display = "block";

        tapsilJanma.style.display = "none";
        tapsilBibaha.style.display = "block";
    }
    
    updateDoc();
}

// ── Custom Field Toggles ─────────────────────────────
function toggleRegistrarSection() {
    const chk = document.getElementById('chkRegistrar');
    document.getElementById('registrarSection').style.display = chk.checked ? 'block' : 'none';
    document.getElementById('lblRegistrarRow').style.display = chk.checked ? 'flex' : 'none';
    document.getElementById('lblRegistrarRowBibaha').style.display = chk.checked ? 'flex' : 'none';
}

function toggleCustomSign() {
    const val = document.getElementById('inSignAuthority').value;
    document.getElementById('customSignBox').style.display = (val === 'CUSTOM') ? 'grid' : 'none';
}

function adjustSignaturePosition(value) {
    document.getElementById('marginVal').innerText = toNepaliDigit(value) + " px";
    document.getElementById('docFooterSection').style.marginTop = value + "px";
}

// ── Modal toggle ─────────────────────────────────────
function toggleModal(show) {
    const modal = document.getElementById('abhilekhModal');
    modal.style.display = show ? 'flex' : 'none';
    if (show) renderDatabaseTable();
}

// ── Live Preview Updater ──────────────────────────────
function updateDoc() {
    const mode = document.getElementById('currentMode').value;
    
    const ay = document.getElementById('inPatraSankhya').value || '';
    const chalani = document.getElementById('inChalani').value || '';
    const miti = document.getElementById('inMiti').value || '';
    const ns = document.getElementById('inNepalSamvat').value || '';

    // Letterhead
    const lblAY = document.getElementById('lblAY');
    if (lblAY) lblAY.innerText = ay;
    const lblChalani = document.getElementById('lblChalani');
    if (lblChalani) lblChalani.innerText = chalani;
    const lblMiti = document.getElementById('lblMiti');
    if (lblMiti) lblMiti.innerText = miti || '........';
    const lblNS = document.getElementById('lblNepalSamvat');
    if (lblNS) lblNS.innerText = ns || '........';

    // Recipient address
    const targetMuniType = getSelectedMuniType();
    const targetMuniName = document.getElementById('inMuniName').value || '..................';
    const targetWadaNo = document.getElementById('inTargetWadaNo').value || '...';
    
    const lblTargetOffice = document.getElementById('lblTargetOffice');
    if (lblTargetOffice) {
        lblTargetOffice.innerHTML = `${targetMuniName} ${targetMuniType}, वडा नं. ${toNepaliDigit(targetWadaNo)} ।`;
    }

    // बसाईसराई मिति
    const migrationMiti = document.getElementById('inMigrationMiti').value || '....................';

    if (mode === 'janma') {
        // Birth mode preview updates
        const father = document.getElementById('inFatherName').value || '..................';
        const mother = document.getElementById('inMotherName').value || '..................';
        const child = document.getElementById('inChildName').value || '..................';
        const gender = getSelectedChildGender();
        
        const birthDate = document.getElementById('inBirthDate').value || '..................';
        const birthRegNo = document.getElementById('inBirthRegNo').value || '..................';
        const birthRegDate = document.getElementById('inBirthRegDate').value || '..................';

        // Body Text
        const lblMigrationMiti = document.getElementById('lblMigrationMiti');
        if (lblMigrationMiti) lblMigrationMiti.innerText = migrationMiti;
        const lblFather = document.getElementById('lblFather');
        if (lblFather) lblFather.innerText = father;
        const lblMother = document.getElementById('lblMother');
        if (lblMother) lblMother.innerText = mother;
        const lblGenderWord = document.getElementById('lblGenderWord');
        if (lblGenderWord) lblGenderWord.innerText = gender;
        const lblChildName = document.getElementById('lblChildName');
        if (lblChildName) lblChildName.innerText = child;

        // Tapsil
        const lblTapsilName = document.getElementById('lblTapsilName');
        if (lblTapsilName) lblTapsilName.innerText = child;
        const lblTapsilBirthDate = document.getElementById('lblTapsilBirthDate');
        if (lblTapsilBirthDate) lblTapsilBirthDate.innerText = birthDate;
        const lblTapsilBirthRegNo = document.getElementById('lblTapsilBirthRegNo');
        if (lblTapsilBirthRegNo) lblTapsilBirthRegNo.innerText = birthRegNo;
        const lblTapsilBirthRegDate = document.getElementById('lblTapsilBirthRegDate');
        if (lblTapsilBirthRegDate) lblTapsilBirthRegDate.innerText = birthRegDate;
        const lblTapsilFather = document.getElementById('lblTapsilFather');
        if (lblTapsilFather) lblTapsilFather.innerText = father;
        const lblTapsilMother = document.getElementById('lblTapsilMother');
        if (lblTapsilMother) lblTapsilMother.innerText = mother;
        
        // Registrar option
        const chkRegistrar = document.getElementById('chkRegistrar');
        const regName = document.getElementById('inRegistrarName').value || '..................';
        const lblTapsilRegistrar = document.getElementById('lblTapsilRegistrar');
        if (lblTapsilRegistrar) lblTapsilRegistrar.innerText = regName;
        
    } else {
        // Marriage mode preview updates
        const husband = document.getElementById('inHusbandName').value || '..................';
        const wife = document.getElementById('inWifeName').value || '..................';
        
        // Default combined marriage name if custom not typed
        const defaultMarriageName = (husband !== '..................' || wife !== '..................') ? `${husband} र ${wife}` : '';
        const marriageName = document.getElementById('inTapsilMarriageName').value || defaultMarriageName || '..................';

        const marriageDate = document.getElementById('inMarriageDate').value || '..................';
        const marriageRegNo = document.getElementById('inMarriageRegNo').value || '..................';
        const marriageRegDate = document.getElementById('inMarriageRegDate').value || '..................';

        // Body Text
        const lblMigrationMitiBibaha = document.getElementById('lblMigrationMitiBibaha');
        if (lblMigrationMitiBibaha) lblMigrationMitiBibaha.innerText = migrationMiti;
        const lblHusband = document.getElementById('lblHusband');
        if (lblHusband) lblHusband.innerText = husband;
        const lblWife = document.getElementById('lblWife');
        if (lblWife) lblWife.innerText = wife;

        // Tapsil
        const lblTapsilMarriageName = document.getElementById('lblTapsilMarriageName');
        if (lblTapsilMarriageName) lblTapsilMarriageName.innerText = marriageName;
        const lblTapsilMarriageRegDate = document.getElementById('lblTapsilMarriageRegDate');
        if (lblTapsilMarriageRegDate) lblTapsilMarriageRegDate.innerText = marriageRegDate;
        const lblTapsilMarriageDate = document.getElementById('lblTapsilMarriageDate');
        if (lblTapsilMarriageDate) lblTapsilMarriageDate.innerText = marriageDate;
        const lblTapsilMarriageRegNo = document.getElementById('lblTapsilMarriageRegNo');
        if (lblTapsilMarriageRegNo) lblTapsilMarriageRegNo.innerText = marriageRegNo;
        
        // Registrar option
        const chkRegistrar = document.getElementById('chkRegistrar');
        const regName = document.getElementById('inRegistrarName').value || '..................';
        const lblTapsilRegistrarBibaha = document.getElementById('lblTapsilRegistrarBibaha');
        if (lblTapsilRegistrarBibaha) lblTapsilRegistrarBibaha.innerText = regName;
    }

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
            sigName = document.getElementById('inCustomSignName').value || '....................';
            sigTitle = document.getElementById('inCustomSignTitle').value || '....................';
        } else {
            const signData = signSelect.split('|');
            sigName = signData[0];
            sigTitle = signData[1];
        }
    }
    if (lblSigName) lblSigName.innerText = sigName;
    if (lblSigTitle) lblSigTitle.innerText = sigTitle;
}

// ── Date Automation ───────────────────────────────────
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
            nepaliBSDateStr = toNepaliDigit(englishBSDateStr);
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
            bsDayVal = bsD;
            const bsMStr = String(bsMonthVal).padStart(2, '0');
            const bsDStr = String(bsDayVal).padStart(2, '0');
            nepaliBSDateStr = toNepaliDigit(`${bsYearVal}/${bsMStr}/${bsDStr}`);
        }

        initializeFiscalYear(bsYearVal, bsMonthVal);

        const today = new Date();
        const nsYear = getNepalSambatYear(today);
        nepaliNSYearStr = toNepaliDigit(nsYear);

        const inMiti = document.getElementById('inMiti');
        if (inMiti) {
            inMiti.value = nepaliBSDateStr;
        }

        const inNepalSamvat = document.getElementById('inNepalSamvat');
        if (inNepalSamvat) {
            inNepalSamvat.value = nepaliNSYearStr;
        }

        updateDoc();
        fetchCurrentNepalSambat();
    } catch(e) {
        console.error("Date calculation crash:", e);
    }
}

function getNepalSambatYear(date) {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    let nsYear = y - 937;
    if (m > 11 || (m === 11 && d >= 12)) {
        nsYear = y - 936;
    }
    return nsYear;
}

function formatFiscalYear(startYear) {
    const endYear = startYear + 1;
    const endYearSuffix = String(endYear).slice(-2);
    return toNepaliDigit(`${startYear}/${endYearSuffix}`);
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
        console.error("Error initializing fiscal year:", error);
    }
}

function updateNepalSambatFromMiti() {
    const mitiVal = document.getElementById('inMiti').value;
    const pts = mitiVal.split(/[-/]/);
    if (pts.length === 3) {
        const bsY = parseInt(pts[0], 10);
        const bsM = parseInt(pts[1], 10);
        const bsD = parseInt(pts[2], 10);
        if (!isNaN(bsY) && !isNaN(bsM) && !isNaN(bsD)) {
            const inNS = document.getElementById('inNepalSamvat');
            const converter = window["@sbmdkl/nepali-date-converter"];
            if (converter && typeof converter.bsToAd === 'function') {
                try {
                    const adDate = converter.bsToAd(`${bsY}-${String(bsM).padStart(2,'0')}-${String(bsD).padStart(2,'0')}`);
                    if (adDate) {
                        const d = new Date(adDate);
                        if (!isNaN(d.getTime())) {
                            const ns = getNepalSambatYear(d);
                            if (inNS) inNS.value = toNepaliDigit(ns);
                        }
                    }
                } catch(e){}
            } else {
                let nsYear = bsY - 937;
                if (bsM > 7 || (bsM === 7 && bsD >= 15)) {
                    nsYear = bsY - 936;
                }
                if (inNS) inNS.value = toNepaliDigit(nsYear);
            }
        }
    }
}

// ── Nepal Sambat widget proxy API loader ─────────────
async function fetchCurrentNepalSambat() {
    const targetUrl = 'https://www.nepalsambat.com/widget/nsstandard.php';
    const proxyUrls = [
        'https://corsproxy.io/?' + encodeURIComponent(targetUrl),
        'https://api.allorigins.win/get?url=' + encodeURIComponent(targetUrl)
    ];

    for (const url of proxyUrls) {
        try {
            const res = await fetch(url);
            if (!res.ok) continue;
            let text = "";
            if (url.includes('allorigins')) {
                const json = await res.json();
                text = json.contents;
            } else {
                text = await res.text();
            }
            if (text && text.includes('Nepal Sambat')) {
                const match = text.match(/Nepal Sambat\s+([०-९\d]+)\s+([^\d<]+)\s+([०-९\d]+)/i);
                if (match) {
                    const nsYear = match[1];
                    const nsTithi = match[2].trim();
                    const dayDigit = match[3];
                    const fullNepalSambat = `${nsYear} ${nsTithi}${dayDigit}`.trim();
                    const inNS = document.getElementById('inNepalSamvat');
                    if (inNS && fullNepalSambat.length > 3) {
                        inNS.value = fullNepalSambat;
                        updateDoc();
                        return;
                    }
                }
            }
        } catch (err) {
            console.warn("Proxy attempt failed:", url, err);
        }
    }
}

// ── Print & Save ──────────────────────────────────────
async function printAndSaveSystem() {
    const mode = document.getElementById('currentMode').value;
    let name = '';
    
    if (mode === 'janma') {
        name = document.getElementById('inChildName').value.trim();
        if (!name) {
            alert("कृपया छोरा/छोरीको नाम अनिवार्य लेख्नुहोस् ।");
            return;
        }
    } else {
        const husband = document.getElementById('inHusbandName').value.trim();
        const wife = document.getElementById('inWifeName').value.trim();
        if (!husband || !wife) {
            alert("कृपया श्रीमान र श्रीमती दुवैको नाम अनिवार्य लेख्नुहोस् ।");
            return;
        }
        name = `${husband} र ${wife}`;
    }

    const recordId = document.getElementById('editRecordIndex').value;

    const obj = {
        mode:            mode,
        ay:              document.getElementById('inPatraSankhya').value,
        chalani:         document.getElementById('inChalani').value.trim()        || '-',
        miti:            document.getElementById('inMiti').value.trim()            || '-',
        ns:              document.getElementById('inNepalSamvat').value.trim()     || '-',
        
        muniType:        getSelectedMuniType(),
        muniName:        document.getElementById('inMuniName').value.trim()        || '',
        targetWadaNo:    document.getElementById('inTargetWadaNo').value.trim()    || '',
        migrationMiti:   document.getElementById('inMigrationMiti').value.trim()   || '',

        // Birth fields
        fatherName:      document.getElementById('inFatherName').value.trim()      || '',
        motherName:      document.getElementById('inMotherName').value.trim()      || '',
        childGender:     getSelectedChildGender(),
        childName:       document.getElementById('inChildName').value.trim()       || '',
        birthDate:       document.getElementById('inBirthDate').value.trim()       || '',
        birthRegNo:      document.getElementById('inBirthRegNo').value.trim()       || '',
        birthRegDate:    document.getElementById('inBirthRegDate').value.trim()     || '',

        // Marriage fields
        husbandName:     document.getElementById('inHusbandName').value.trim()     || '',
        wifeName:        document.getElementById('inWifeName').value.trim()        || '',
        tapsilMarriageName: document.getElementById('inTapsilMarriageName').value.trim() || '',
        marriageDate:    document.getElementById('inMarriageDate').value.trim()    || '',
        marriageRegNo:   document.getElementById('inMarriageRegNo').value.trim()   || '',
        marriageRegDate: document.getElementById('inMarriageRegDate').value.trim()  || '',

        // Common
        hasRegistrar:    document.getElementById('chkRegistrar').checked,
        registrarName:   document.getElementById('inRegistrarName').value.trim()   || '',

        subject:         "अभिलेख प्रमाणित सिफारिस",
        name:            name, // for database grid displays
        signAuth:        document.getElementById('inSignAuthority').value,
        customSignName:  document.getElementById('inCustomSignName').value.trim(),
        customSignTitle: document.getElementById('inCustomSignTitle').value.trim(),
        sigMargin:       document.getElementById('inSigMargin').value,
        timestamp:       Date.now()
    };

    const btn = document.querySelector('.btn-print');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = "⏳ सुरक्षित हुँदैछ...";
    }

    try {
        if (recordId !== "") {
            await db.collection("abhilekhRecords").doc(recordId).update(obj);
        } else {
            const docRef = await db.collection("abhilekhRecords").add(obj);
            document.getElementById('editRecordIndex').value = docRef.id;
            document.getElementById('formMainTitle').innerText = "🔄 सम्पादन मोड";
        }
        window.print();
    } catch (e) {
        console.error(e);
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
    return toNepaliDigit(`${y}/${m}/${day} - ${hr}:${min}`);
}

// ── Database Operations ───────────────────────────────
function renderDatabaseTable() {
    const tbody = document.getElementById('dbTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const query = document.getElementById('searchField').value.trim().toLowerCase();

    const filtered = globalDatabase.filter(rec => {
        const text = (rec.name || '').toLowerCase() + ' ' + (rec.childName || '').toLowerCase() + ' ' + (rec.husbandName || '').toLowerCase() + ' ' + (rec.wifeName || '').toLowerCase();
        return text.includes(query);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:15px; color:#a0aec0;">कुनै रेकर्ड भेटिएन ।</td></tr>`;
        return;
    }

    filtered.forEach((rec, index) => {
        const row = document.createElement('tr');
        const typeLabel = rec.mode === 'janma' ? '👶 जन्म दर्ता' : '💑 विवाह दर्ता';
        row.innerHTML = `
            <td>${toNepaliDigit(index + 1)}</td>
            <td><b>${rec.name || '-'}</b></td>
            <td>${typeLabel}</td>
            <td>${formatTimestamp(rec.timestamp)}</td>
            <td>
                <div style="display:flex; gap:4px; justify-content:center;">
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

    if (!confirm("के तपाईं यो रेकर्ड सम्पादन गर्न चाहनुहुन्छ? यसले हालको फॉर्मको डाटा प्रतिस्थापन गर्नेछ ।")) {
        return;
    }

    document.getElementById('editRecordIndex').value = rec.id;
    document.getElementById('formMainTitle').innerText = "🔄 सम्पादन मोड";

    // Set Mode
    setMode(rec.mode || 'janma');

    // Letterhead
    const inPS = document.getElementById('inPatraSankhya');
    if (inPS) inPS.value = rec.ay || '';
    document.getElementById('inChalani').value = rec.chalani !== '-' ? rec.chalani : '';
    document.getElementById('inMiti').value = rec.miti !== '-' ? rec.miti : '';
    document.getElementById('inNepalSamvat').value = rec.ns !== '-' ? rec.ns : '';

    // Recipient office & Migration
    const muniRadios = document.querySelectorAll('input[name="muniTypeRadio"]');
    for (const r of muniRadios) {
        r.checked = (r.value === rec.muniType);
    }
    document.getElementById('inMuniName').value = rec.muniName || '';
    document.getElementById('inTargetWadaNo').value = rec.targetWadaNo || '';
    document.getElementById('inMigrationMiti').value = rec.migrationMiti || '';

    // Birth Mode fields
    document.getElementById('inFatherName').value = rec.fatherName || '';
    document.getElementById('inMotherName').value = rec.motherName || '';
    
    const genRadios = document.querySelectorAll('input[name="childGenderRadio"]');
    for (const r of genRadios) {
        r.checked = (r.value === rec.childGender);
    }
    document.getElementById('inChildName').value = rec.childName || '';
    document.getElementById('inBirthDate').value = rec.birthDate || '';
    document.getElementById('inBirthRegNo').value = rec.birthRegNo || '';
    document.getElementById('inBirthRegDate').value = rec.birthRegDate || '';

    // Marriage Mode fields
    document.getElementById('inHusbandName').value = rec.husbandName || '';
    document.getElementById('inWifeName').value = rec.wifeName || '';
    document.getElementById('inTapsilMarriageName').value = rec.tapsilMarriageName || '';
    document.getElementById('inMarriageDate').value = rec.marriageDate || '';
    document.getElementById('inMarriageRegNo').value = rec.marriageRegNo || '';
    document.getElementById('inMarriageRegDate').value = rec.marriageRegDate || '';

    // Common Registrar Settings
    const chkReg = document.getElementById('chkRegistrar');
    chkReg.checked = !!rec.hasRegistrar;
    document.getElementById('inRegistrarName').value = rec.registrarName || '';
    toggleRegistrarSection();

    // Signature authority
    document.getElementById('inSignAuthority').value = rec.signAuth || 'अनिता अधिकारी|स्थानीय पञ्जिकाधिकारी';
    document.getElementById('inCustomSignName').value = rec.customSignName || '';
    document.getElementById('inCustomSignTitle').value = rec.customSignTitle || '';
    toggleCustomSign();

    // Signature margin spacing
    const margin = rec.sigMargin || '40';
    document.getElementById('inSigMargin').value = margin;
    adjustSignaturePosition(margin);

    updateDoc();
    toggleModal(false);
}

async function deleteRecord(id) {
    if (!confirm("के तपाईं साच्चिकै यो रेकर्ड स्थायी रूपमा हटाउन चाहनुहुन्छ?")) {
        return;
    }
    try {
        await db.collection("abhilekhRecords").doc(id).delete();
        alert("रेकर्ड सफलतापूर्वक हटाइयो ।");
    } catch(e) {
        console.error(e);
        alert("रेकर्ड हटाउन समस्या भयो! इन्टरनेट कनेक्सन जाँच्नुहोस् ।");
    }
}

// Page Bootstrap Init
window.onload = function () {
    initializeAutomaticDate();
    adjustSignaturePosition(40);
};

window.addEventListener('templateInjected', function() {
    initializeAutomaticDate();
});
