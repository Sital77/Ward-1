// ══════════════════════════════════════════════════════
//  script-suchana-tans.js
//  सूचना टाँस सम्बन्धमा पत्र — Firebase Firestore Logic
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

// ── Real-time listener ──────────────────────────────
db.collection("suchanaTansRecords").onSnapshot((snapshot) => {
    globalDatabase = [];
    snapshot.forEach((doc) => {
        globalDatabase.push({ id: doc.id, ...doc.data() });
    });
    globalDatabase.sort((a, b) => b.timestamp - a.timestamp);
    renderDatabaseTable();
});

// ── Helper: English digits → Nepali digits ──────────
function toNepaliDigit(num) {
    const nd = ['०','१','२','३','४','५','६','७','८','९'];
    return num.toString().split('').map(d => nd[d] || d).join('');
}

// ── Modal toggle ────────────────────────────────────
function toggleModal(show) {
    const modal = document.getElementById('abhilekhModal');
    modal.style.display = show ? 'flex' : 'none';
    if (show) renderDatabaseTable();
}

// ── Signature margin slider ─────────────────────────
function adjustSignaturePosition(value) {
    document.getElementById('marginVal').innerText = toNepaliDigit(value) + " px";
    document.getElementById('docFooterSection').style.marginTop = value + "px";
}

// ── Custom sign toggle ──────────────────────────────
function toggleCustomSign() {
    const val = document.getElementById('inSignAuthority').value;
    document.getElementById('customSignBox').style.display = (val === 'CUSTOM') ? 'grid' : 'none';
}

// ── Get selected आ.व. ───────────────────────────────
function getSelectedAY() {
    const radios = document.querySelectorAll('input[name="ayRadio"]');
    for (const r of radios) { if (r.checked) return r.value; }
    return '';
}

// ── Live preview updater ────────────────────────────
function updateDoc() {
    const ay          = getSelectedAY();
    const bodyAY      = document.getElementById('inBodyAY').value;
    const chalani     = document.getElementById('inChalani').value       || '';
    const bodyChalani = document.getElementById('inBodyChalani').value   || '';
    const miti        = document.getElementById('inMiti').value           || '........';
    const ns          = document.getElementById('inNepalSamvat').value    || '........';
    const wada        = document.getElementById('inWadaNo').value;
    const praaptaMiti = document.getElementById('inPraaptaMiti').value   || '........';

    // Header
    document.getElementById('lblAY').innerText          = ay;
    document.getElementById('lblChalani').innerText     = chalani;
    document.getElementById('lblMiti').innerText        = miti;
    document.getElementById('lblNepalSamvat').innerText = ns;

    // Body
    document.getElementById('lblBodyAY').innerText       = bodyAY;
    document.getElementById('lblBodyChalani').innerText  = bodyChalani;
    document.getElementById('lblBodyWada').innerText     = wada;
    document.getElementById('lblPraaptaMiti').innerText  = praaptaMiti;

    // Signature
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
            const parts = signSelect.split('|');
            sigName = parts[0];
            sigTitle = parts[1];
        }
    }
    lblSigName.innerText = sigName;
    document.getElementById('lblSigTitle').innerText = sigTitle;
}

// ── Print & Save ────────────────────────────────────
async function printAndSaveSystem() {
    const sandhiyar = document.getElementById('inSandhiyarName').value.trim();
    if (!sandhiyar) {
        alert("कृपया सँधियारको नाम अनिवार्य लेख्नुहोस् ।");
        return;
    }

    const ay          = getSelectedAY();
    const bodyAY      = document.getElementById('inBodyAY').value;
    const chalani     = document.getElementById('inChalani').value.trim()        || '-';
    const bodyChalani = document.getElementById('inBodyChalani').value.trim()    || '-';
    const miti        = document.getElementById('inMiti').value.trim()            || '-';
    const ns          = document.getElementById('inNepalSamvat').value.trim()     || '-';
    const wada        = document.getElementById('inWadaNo').value;
    const praaptaMiti = document.getElementById('inPraaptaMiti').value.trim()    || '-';
    const signAuth    = document.getElementById('inSignAuthority').value;
    const customSignName  = document.getElementById('inCustomSignName').value;
    const customSignTitle = document.getElementById('inCustomSignTitle').value;
    const sigMargin   = document.getElementById('inSigMargin').value;

    const recordId = document.getElementById('editRecordIndex').value;

    const obj = {
        ay, bodyAY, chalani, bodyChalani, miti, ns, wada,
        name: chalani,
        praaptaMiti,
        subject: "सूचना टाँस",
        signAuth, customSignName, customSignTitle, sigMargin,
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
            await db.collection("suchanaTansRecords").doc(recordId).update(obj);
        } else {
            const docRef = await db.collection("suchanaTansRecords").add(obj);
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
    const formatted = `${y}/${m}/${day} ${hr}:${min}`;
    const toNep = typeof toNepaliDigit === 'function' ? toNepaliDigit : (window.toNepaliDigit || (x => x));
    return toNep(formatted);
}

// ── Render abhilekh table ───────────────────────────
function renderDatabaseTable() {
    const tbody  = document.getElementById('dbTableBody');
    const search = document.getElementById('searchField').value.trim().toLowerCase();
    tbody.innerHTML = '';
    let counter = 0;
    globalDatabase.forEach((rec) => {
        const chalaniVal = (rec.chalani || '').toLowerCase();
        if (search && !chalaniVal.includes(search)) return;
        counter++;
        tbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td><b>${toNepaliDigit(counter)}</b></td>
                <td><b>${rec.chalani || '-'}</b></td>
                <td><span style="color:#2b6cb0; font-weight:bold;">${rec.subject}</span></td>
                <td>
                    ${rec.miti || '-'}
                    ${rec.timestamp ? `<div style="font-size:0.78rem; color:#718096; margin-top:2px;">⏱️ ${formatTimestamp(rec.timestamp)}</div>` : ''}
                </td>
                <td>
                    <div style="display:flex; gap:4px;">
                        <button class="btn-action btn-edit-db" onclick="editFromDB('${rec.id}')">📝</button>
                        <button class="btn-action btn-del-db"  onclick="deleteFromDB('${rec.id}')">❌</button>
                    </div>
                </td>
            </tr>
        `);
    });
}

// ── Edit record from DB ─────────────────────────────
function editFromDB(id) {
    const rec = globalDatabase.find(r => r.id === id);
    if (!rec) return;

    document.getElementById('editRecordIndex').value = id;
    document.getElementById('formMainTitle').innerText = "🔄 सम्पादन मोड";

    // आ.व. radio
    const radios = document.querySelectorAll('input[name="ayRadio"]');
    radios.forEach(r => { r.checked = (r.value === rec.ay); });

    // पत्रमा उल्लेख आ.व. dropdown
    document.getElementById('inBodyAY').value = rec.bodyAY || rec.ay || '२०८०/०८१';

    document.getElementById('inChalani').value        = rec.chalani === '-' ? '' : rec.chalani;
    document.getElementById('inBodyChalani').value     = rec.bodyChalani === '-' ? '' : (rec.bodyChalani || rec.chalani || '');
    document.getElementById('inMiti').value           = rec.miti;
    document.getElementById('inNepalSamvat').value    = rec.ns;
    document.getElementById('inWadaNo').value         = rec.wada;
    document.getElementById('inPraaptaMiti').value    = rec.praaptaMiti;
    document.getElementById('inSignAuthority').value  = rec.signAuth;

    if (rec.signAuth === 'CUSTOM') {
        document.getElementById('customSignBox').style.display = 'grid';
        document.getElementById('inCustomSignName').value  = rec.customSignName  || '';
        document.getElementById('inCustomSignTitle').value = rec.customSignTitle || '';
    } else {
        document.getElementById('customSignBox').style.display = 'none';
    }

    if (rec.sigMargin) {
        document.getElementById('inSigMargin').value = rec.sigMargin;
        adjustSignaturePosition(rec.sigMargin);
    }

    updateDoc();
    toggleModal(false);
}

// ── Delete record ───────────────────────────────────
async function deleteFromDB(id) {
    if (confirm("के तपाईं यो रेकर्ड क्लाउड डेटाबेसबाट स्थायी रूपमा हटाउन चाहनुहुन्छ?")) {
        try {
            await db.collection("suchanaTansRecords").doc(id).delete();
        } catch (e) {
            console.error(e);
            alert("डिलिट गर्न समस्या भयो ।");
        }
    }
}

// ── Nepal Sambat helper ─────────────────────────────
function getNepalSambatYear(adDate) {
    const year = adDate.getFullYear();
    const newYearDates = {
        2020: new Date(2020,10,15), 2021: new Date(2021,10,5),
        2022: new Date(2022, 9,26), 2023: new Date(2023,10,14),
        2024: new Date(2024,10, 2), 2025: new Date(2025, 9,22),
        2026: new Date(2026,10,10), 2027: new Date(2027, 9,30),
        2028: new Date(2028, 9,19), 2029: new Date(2029,10, 7),
        2030: new Date(2030, 9,27), 2031: new Date(2031,10,15),
        2032: new Date(2032,10, 3), 2033: new Date(2033, 9,23),
        2034: new Date(2034,10,12), 2035: new Date(2035,10, 1)
    };
    const ny = newYearDates[year];
    if (ny) return adDate >= ny ? year - 879 : year - 880;
    if (adDate.getMonth() > 9 || (adDate.getMonth() === 9 && adDate.getDate() >= 25))
        return year - 879;
    return year - 880;
}

function formatFiscalYear(startYear) {
    const suffix = String(startYear + 1).slice(-2);
    return toNepaliDigit(`${startYear}/${suffix}`);
}

// ── Auto-detect current आ.व. and pre-select radio ──
function initializeFiscalYear(bsYear, bsMonth) {
    try {
        let startYear = bsYear;
        if (bsMonth < 4) startYear = bsYear - 1;
        const suffix = String(startYear + 1).slice(-2);
        const currFY1 = toNepaliDigit(`${startYear}/${suffix}`);
        const currFY2 = toNepaliDigit(`${startYear}/0${suffix}`);
        
        // Select letterhead FY radio
        const radios = document.querySelectorAll('input[name="ayRadio"]');
        let matched = false;
        radios.forEach(r => {
            if (r.value === currFY1 || r.value === currFY2) { r.checked = true; matched = true; }
        });
        // fallback: select last option if no match
        if (!matched && radios.length) radios[radios.length - 1].checked = true;

        // Select body FY option
        const inBodyAY = document.getElementById('inBodyAY');
        if (inBodyAY) {
            inBodyAY.value = currFY1;
        }
    } catch (e) { console.error(e); }
}

// ── Auto-fill date on page load ─────────────────────
function initializeAutomaticDate() {
    try {
        let nepaliBSDateStr = '';
        let bsYearVal  = 2083;
        let bsMonthVal = 2;

        const converter = window["@sbmdkl/nepali-date-converter"];
        if (converter && typeof converter.adToBs === 'function') {
            const today = new Date();
            const yyyy  = today.getFullYear();
            const mm    = String(today.getMonth() + 1).padStart(2, '0');
            const dd    = String(today.getDate()).padStart(2, '0');
            const bsDate = converter.adToBs(`${yyyy}-${mm}-${dd}`);

            let bsDayVal = 1;
            if (typeof bsDate === 'string') {
                const parts = bsDate.split(/[-/]/);
                bsYearVal  = parseInt(parts[0], 10);
                bsMonthVal = parseInt(parts[1], 10);
                bsDayVal   = parseInt(parts[2], 10);
            } else if (bsDate && typeof bsDate === 'object') {
                bsYearVal  = bsDate.bsYear  || bsDate.year  || bsDate.currentYear  || 2083;
                bsMonthVal = bsDate.bsMonth || bsDate.month || bsDate.currentMonth || 2;
                bsDayVal   = bsDate.bsDay   || bsDate.day   || bsDate.currentDay   || 1;
            }
            const bsM = String(bsMonthVal).padStart(2, '0');
            const bsD = String(bsDayVal).padStart(2, '0');
            nepaliBSDateStr = toNepaliDigit(`${bsYearVal}/${bsM}/${bsD}`);
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
            nepaliBSDateStr = (typeof toNepaliDigit === 'function' ? toNepaliDigit : window.toNepaliDigit)(`${bsYearVal}/${bsMStr}/${bsDStr}`);
        }

        initializeFiscalYear(bsYearVal, bsMonthVal);

        const today = new Date();
        const nsYear = getNepalSambatYear(today);

        const inMiti = document.getElementById('inMiti');
        if (inMiti) inMiti.value = nepaliBSDateStr;

        const inPraaptaMiti = document.getElementById('inPraaptaMiti');
        if (inPraaptaMiti) inPraaptaMiti.value = nepaliBSDateStr;

        const inNS = document.getElementById('inNepalSamvat');
        if (inNS) inNS.value = toNepaliDigit(nsYear);

        if (typeof updateDoc === 'function') updateDoc();
        fetchCurrentNepalSambat();
    } catch (e) { console.error("Date init error:", e); }
}

function updateNepalSambatFromMiti() {
    const inMiti = document.getElementById('inMiti');
    const inNS = document.getElementById('inNepalSamvat');
    if (!inMiti || !inNS) return;

    const bsDateStr = inMiti.value.trim();
    if (!bsDateStr) return;

    const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    let engMiti = bsDateStr.split('').map(char => {
        const index = nepaliDigits.indexOf(char);
        return index !== -1 ? index : char;
    }).join('');

    const parts = engMiti.split(/[-/.]/);
    if (parts.length >= 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
            const converter = window["@sbmdkl/nepali-date-converter"];
            if (converter && typeof converter.bsToAd === 'function') {
                try {
                    const formattedBsStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const adResult = converter.bsToAd(formattedBsStr);
                    let adDate = null;
                    if (typeof adResult === 'string') {
                        adDate = new Date(adResult);
                    } else if (adResult && typeof adResult === 'object') {
                        const adY = adResult.year || adResult.adYear;
                        const adM = adResult.month || adResult.adMonth;
                        const adD = adResult.day || adResult.adDay;
                        if (adY && adM && adD) {
                            adDate = new Date(adY, adM - 1, adD);
                        }
                    }
                    if (adDate && !isNaN(adDate.getTime())) {
                        const nsYear = getNepalSambatYear(adDate);
                        inNS.value = toNepaliDigit(nsYear);
                    }
                } catch (e) {
                    console.error("Error converting BS to AD:", e);
                }
            } else {
                let nsYear = y - 937;
                if (m > 7 || (m === 7 && d >= 15)) {
                    nsYear = y - 936;
                }
                inNS.value = toNepaliDigit(nsYear);
            }
        }
    }
}

async function fetchCurrentNepalSambat() {
    const targetUrl = 'https://www.nepalsambat.com/widget/nsstandard.php';
    const proxyUrls = [
        'https://corsproxy.io/?' + encodeURIComponent(targetUrl),
        'https://api.allorigins.win/raw?url=' + encodeURIComponent(targetUrl),
        'https://thingproxy.freeboard.io/fetch/' + targetUrl
    ];
    for (const url of proxyUrls) {
        try {
            const res = await fetch(url);
            if (!res.ok) continue;
            const html = await res.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const rows = doc.querySelectorAll('.row');
            if (rows.length >= 2) {
                const nsYear = rows[0].innerText.trim();
                const nsTithi = rows[1].innerText.trim();
                
                const tithiMap = {
                    'पारु': '१', 'प्रतिपदा': '१', 'दुतिया': '२', 'द्वितीया': '२',
                    'तृतिया': '३', 'तृतीया': '३', 'चौथि': '४', 'चतुर्थी': '४',
                    'पञ्चमी': '५', 'खस्थि': '६', 'षष्ठी': '६', 'सप्तमी': '७',
                    'अष्टमी': '८', 'नवमी': '९', 'दशमी': '१०', 'एकादशी': '११',
                    'दुवादशी': '१२', 'द्वादशी': '१२', 'त्रयोदशी': '१३',
                    'चह्रे': '१४', 'चतुर्दशी': '१४', 'पुन्ही': '१५', 'पूर्णिमा': '१५',
                    'आमाइ': '१५', 'औंसी': '१५'
                };
                
                let dayDigit = '';
                for (const key in tithiMap) {
                    if (nsTithi.includes(key)) {
                        dayDigit = ' ' + tithiMap[key];
                        break;
                    }
                }
                
                const fullNepalSambat = `${nsYear} ${nsTithi}${dayDigit}`.trim();
                const inNS = document.getElementById('inNepalSamvat');
                if (inNS && fullNepalSambat.length > 3) {
                    inNS.value = fullNepalSambat;
                    if (typeof updateDoc === 'function') {
                        updateDoc();
                    }
                    return;
                }
            }
        } catch (err) {
            console.warn("Proxy attempt failed:", url, err);
        }
    }
}

// ── Bootstrap ───────────────────────────────────────
window.onload = function () {
    initializeAutomaticDate();
    adjustSignaturePosition(40);
    updateDoc();
};
