const firebaseConfig = {
    apiKey: "AIzaSyC3uCmLgNN8s0FDMIrkgxR8eH_AvJ_D3J4",
    authDomain: "gauradaha-ward1.firebaseapp.com",
    projectId: "gauradaha-ward1",
    storageBucket: "gauradaha-ward1.firebasestorage.app",
    messagingSenderId: "905617778132",
    appId: "1:905617778132:web:b8149cf37ae3f3c3b42241"
};

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let rowCounter = 0;
let activeRowIds = [];
let globalDatabase = [];

db.collection("charKillaRecords").onSnapshot((snapshot) => {
    globalDatabase = [];
    snapshot.forEach((doc) => {
        globalDatabase.push({ id: doc.id, ...doc.data() });
    });
    globalDatabase.sort((a, b) => b.timestamp - a.timestamp);
    renderDatabaseTable();
});

function toNepaliDigit(num) {
    const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return num.toString().split('').map(digit => nepaliDigits[digit] || digit).join('');
}

function toggleModal(show) {
    const modal = document.getElementById('abhilekhModal');
    modal.style.display = show ? 'flex' : 'none';
    if(show) renderDatabaseTable();
}

function adjustSignaturePosition(value) {
    document.getElementById('marginVal').innerText = toNepaliDigit(value) + " px";
    document.getElementById('docFooterSection').style.marginTop = value + "px";
}

// FULLY RECONSTRUCTED KITTA-ROW INJECTION MATRIX WITH FORM SHEET NO FIELD INCLUDED
function addKittaRow(data = null) {
    rowCounter++;
    const rowId = 'kitta_row_' + rowCounter;
    activeRowIds.push(rowId);

    const container = document.getElementById('kittaRowsContainer');
    const rowHtml = `
        <div class="kitta-row-block" id="${rowId}">
            <div class="row-num-badge">क्रम संख्या: <span class="row-index-display"></span></div>
            <button type="button" class="btn-delete-row" id="del_btn_${rowId}" onclick="removeKittaRow('${rowId}')">हटाउनुस्</button>
            
            <div class="table-row-input-grid">
                <div>
                    <label style="font-size:0.75rem; color:#4a5568; font-weight:700;">सिट नं.</label>
                    <input type="text" class="input-sit" placeholder="सिट नं." value="${data ? data.sit : ''}" oninput="updateDoc()">
                </div>
                <div>
                    <label style="font-size:0.75rem; color:#4a5568; font-weight:700;">कि.नं.</label>
                    <input type="text" class="input-kitta" placeholder="कि.नं." value="${data ? data.kitta : ''}" oninput="updateDoc()">
                </div>
                <div>
                    <label style="font-size:0.75rem; color:#4a5568; font-weight:700;">क्षेत्रफल</label>
                    <input type="text" class="input-area" placeholder="क्षेत्रफल" value="${data ? data.area : ''}" oninput="updateDoc()">
                </div>
            </div>

            <div class="direction-matrix-grid">
                <div class="direction-item">
                    <label>➡️ पूर्व दिशाको किल्ला:</label>
                    <input type="text" class="input-east" placeholder="पूर्वको साँध" value="${data ? data.east : ''}" oninput="updateDoc()">
                </div>
                <div class="direction-item">
                    <label>⬅️ पश्चिम दिशाको किल्ला:</label>
                    <input type="text" class="input-west" placeholder="पश्चिमको साँध" value="${data ? data.west : ''}" oninput="updateDoc()">
                </div>
                <div class="direction-item">
                    <label>⬆️ उत्तर दिशाको किल्ला:</label>
                    <input type="text" class="input-north" placeholder="उत्तरको साँध" value="${data ? data.north : ''}" oninput="updateDoc()">
                </div>
                <div class="direction-item">
                    <label>⬇️ दक्षिण दिशाको किल्ला:</label>
                    <input type="text" class="input-south" placeholder="दक्षिणको साँध" value="${data ? data.south : ''}" oninput="updateDoc()">
                </div>
            </div>

            <div style="margin-top:10px;">
                <label style="font-size:0.75rem; color:#4a5568; font-weight:700;">कैफियत:</label>
                <input type="text" class="input-remarks" placeholder="कैफियत भए लेख्नुस्" value="${data ? data.remarks : ''}" oninput="updateDoc()">
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', rowHtml);
    reindexFormRows();
    updateDoc();
}

function removeKittaRow(rowId) {
    if (activeRowIds.length <= 1) return;
    document.getElementById(rowId).remove();
    activeRowIds = activeRowIds.filter(id => id !== rowId);
    reindexFormRows();
    updateDoc();
}

function reindexFormRows() {
    activeRowIds.forEach((id, index) => {
        document.getElementById(id).querySelector('.row-index-display').innerText = toNepaliDigit(index + 1);
        document.getElementById(`del_btn_${id}`).style.display = (activeRowIds.length === 1) ? 'none' : 'block';
    });
}

function updateDoc() {
    document.getElementById('lblPatraSankhya').innerText = document.getElementById('inPatraSankhya').value;
    document.getElementById('lblChalani').innerText = document.getElementById('inChalani').value || '........';
    document.getElementById('lblMiti').innerText = document.getElementById('inMiti').value || '........';
    document.getElementById('lblNepalSamvat').innerText = document.getElementById('inNepalSamvat').value || '........';
    
    const selectedWada = document.getElementById('inWadaNo').value;
    document.getElementById('lblWadaBody').innerText = selectedWada;
    document.getElementById('lblSabikAddress').innerText = 'गौरादह गा.वि.स. वडा नं. ' + (document.getElementById('inSabikWada').value || '...');

    document.getElementById('lblOwnerName').innerText = document.getElementById('inName').value || '...........................';

    const selectedZone = document.getElementById('inLandUseZone').value;
    const stmtBox = document.getElementById('lblLandUseStatement');
    if (selectedZone === 'NONE') {
        stmtBox.style.display = 'none';
    } else {
        stmtBox.style.display = 'block';
        document.getElementById('lblSelectedZone').innerText = selectedZone;
    }

    const signSelect = document.getElementById('inSignAuthority').value;
    let sigName = "", sigTitle = "";
    if (signSelect === 'CUSTOM') {
        sigName = document.getElementById('inCustomSignName').value || '....................';
        sigTitle = document.getElementById('inCustomSignTitle').value || '....................';
    } else {
        const signData = signSelect.split('|');
        sigName = signData[0];
        sigTitle = signData[1];
    }
    document.getElementById('lblSigName').innerText = sigName;
    document.getElementById('lblSigTitle').innerText = sigTitle;

    const tbody = document.getElementById('outputTableBody');
    tbody.innerHTML = ''; 

    activeRowIds.forEach((id, index) => {
        const block = document.getElementById(id);
        if (block) {
            tbody.insertAdjacentHTML('beforeend', `
                <tr>
                    <td>${toNepaliDigit(index + 1)}</td>
                    <td>${selectedWada}</td>
                    <td>${block.querySelector('.input-sit').value || '-'}</td>
                    <td>${block.querySelector('.input-kitta').value || '-'}</td>
                    <td>${block.querySelector('.input-area').value || '-'}</td>
                    <td>${block.querySelector('.input-east').value || '-'}</td>
                    <td>${block.querySelector('.input-west').value || '-'}</td>
                    <td>${block.querySelector('.input-north').value || '-'}</td>
                    <td>${block.querySelector('.input-south').value || '-'}</td>
                    <td>${block.querySelector('.input-remarks').value || '-'}</td>
                </tr>
            `);
        }
    });
}

async function printAndSaveSystem() {
    const name = document.getElementById('inName').value.trim();
    if (!name) { alert("कृपया जग्गाधनीको नाम अनिवार्य लेख्नुहोस् ।"); return; }

    let kittaRecords = [];
    activeRowIds.forEach(id => {
        const block = document.getElementById(id);
        if (block) {
            kittaRecords.push({
                sit: block.querySelector('.input-sit').value,
                kitta: block.querySelector('.input-kitta').value,
                area: block.querySelector('.input-area').value,
                east: block.querySelector('.input-east').value,
                west: block.querySelector('.input-west').value,
                north: block.querySelector('.input-north').value,
                south: block.querySelector('.input-south').value,
                remarks: block.querySelector('.input-remarks').value
            });
        }
    });

    const recordId = document.getElementById('editRecordIndex').value;
    const currentObj = {
        patra: document.getElementById('inPatraSankhya').value,
        chalani: document.getElementById('inChalani').value.trim() || '-',
        wada: document.getElementById('inWadaNo').value,
        name,
        miti: document.getElementById('inMiti').value,
        subject: "चार किल्ला प्रमाणित",
        ns: document.getElementById('inNepalSamvat').value,
        sabikWada: document.getElementById('inSabikWada').value,
        signAuth: document.getElementById('inSignAuthority').value,
        customSignName: document.getElementById('inCustomSignName').value,
        customSignTitle: document.getElementById('inCustomSignTitle').value,
        sigMargin: document.getElementById('inSigMargin').value,
        landUseZone: document.getElementById('inLandUseZone').value, 
        kittas: kittaRecords,
        timestamp: Date.now()
    };

    try {
        if (recordId !== "") {
            await db.collection("charKillaRecords").doc(recordId).update(currentObj);
            document.getElementById('editRecordIndex').value = "";
            document.getElementById('formMainTitle').innerText = "📝 चार किल्ला प्रविष्टि";
        } else {
            await db.collection("charKillaRecords").add(currentObj);
        }
        window.print();
    } catch (e) {
        console.error(e);
        alert("क्लाउडमा डाटा सुरक्षित गर्दा समस्या भयो! इन्टरनेट कनेक्सन जाँच्नुहोस् ।");
    }
}

function renderDatabaseTable() {
    const tbody = document.getElementById('dbTableBody');
    const search = document.getElementById('searchField').value.trim().toLowerCase();
    tbody.innerHTML = '';
    let counter = 0;
    globalDatabase.forEach((rec) => {
        if (search && !rec.name.toLowerCase().includes(search)) return;
        counter++;
        tbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td><b>${toNepaliDigit(counter)}</b></td>
                <td><b>${rec.name}</b></td>
                <td><span style="color:#2b6cb0; font-weight:bold;">${rec.subject}</span></td>
                <td>${toNepaliDigit(rec.miti)}</td>
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

function editFromDB(id) {
    const rec = globalDatabase.find(r => r.id === id);
    if (!rec) return;
    document.getElementById('editRecordIndex').value = id;
    document.getElementById('formMainTitle').innerText = "🔄 सम्पादन मोड";
    document.getElementById('inPatraSankhya').value = rec.patra;
    document.getElementById('inChalani').value = rec.chalani === '-' ? '' : rec.chalani;
    document.getElementById('inMiti').value = rec.miti;
    document.getElementById('inNepalSamvat').value = rec.ns;
    document.getElementById('inWadaNo').value = rec.wada;
    document.getElementById('inSabikWada').value = rec.sabikWada;
    document.getElementById('inName').value = rec.name;
    document.getElementById('inSignAuthority').value = rec.signAuth;
    if (rec.signAuth === 'CUSTOM') {
        document.getElementById('customSignBox').style.display = 'grid';
        document.getElementById('inCustomSignName').value = rec.customSignName || '';
        document.getElementById('inCustomSignTitle').value = rec.customSignTitle || '';
    } else {
        document.getElementById('customSignBox').style.display = 'none';
    }
    document.getElementById('inLandUseZone').value = rec.landUseZone || 'NONE';
    
    if(rec.sigMargin) {
        document.getElementById('inSigMargin').value = rec.sigMargin;
        adjustSignaturePosition(rec.sigMargin);
    }

    document.getElementById('kittaRowsContainer').innerHTML = '';
    activeRowIds = [];
    rec.kittas.forEach(kData => { addKittaRow(kData); });
    updateDoc();
    toggleModal(false);
}

async function deleteFromDB(id) {
    if (confirm("के तपाईं यो रेकर्ड क्लाउड डेटाबेसबाट स्थायी रूपमा हटाउन चाहनुहुन्छ?")) {
        try {
            await db.collection("charKillaRecords").doc(id).delete();
        } catch (e) {
            console.error(e);
            alert("डिलिट गर्न समस्या भयो ।");
        }
    }
}

function getNepalSambatYear(adDate) {
    const year = adDate.getFullYear();
    const newYearDates = {
        2020: new Date(2020, 10, 15),
        2021: new Date(2021, 10, 5),
        2022: new Date(2022, 9, 26),
        2023: new Date(2023, 10, 14),
        2024: new Date(2024, 10, 2),
        2025: new Date(2025, 9, 22),
        2026: new Date(2026, 10, 10),
        2027: new Date(2027, 9, 31),
        2028: new Date(2028, 9, 19),
        2029: new Date(2029, 10, 7),
        2030: new Date(2030, 9, 27),
        2031: new Date(2031, 10, 15),
        2032: new Date(2032, 10, 3),
        2033: new Date(2033, 9, 23),
        2034: new Date(2034, 10, 12),
        2035: new Date(2035, 10, 1)
    };
    const newYearDate = newYearDates[year];
    if (newYearDate) {
        if (adDate >= newYearDate) {
            return year - 879;
        } else {
            return year - 880;
        }
    }
    if (adDate.getMonth() > 9 || (adDate.getMonth() === 9 && adDate.getDate() >= 25)) {
        return year - 879;
    } else {
        return year - 880;
    }
}

function toggleCustomSign() {
    const val = document.getElementById('inSignAuthority').value;
    document.getElementById('customSignBox').style.display = (val === 'CUSTOM') ? 'grid' : 'none';
}

function formatFiscalYear(startYear) {
    const endYear = startYear + 1;
    const endYearSuffix = '0' + String(endYear).slice(-2);
    const englishFY = `${startYear}/${endYearSuffix}`;
    return toNepaliDigit(englishFY);
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
        }
    } catch (error) {
        console.error("Error initializing fiscal year:", error);
    }
}

function initializeAutomaticDate() {
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
            const bsMStr = String(bsMonthVal).padStart(2, '0');
            nepaliBSDateStr = toNepaliDigit(`${bsYearVal}/${bsMStr}/`);
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

        fetchCurrentNepalSambat();
    } catch (error) {
        console.error("Error initializing automatic date:", error);
    }
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
    try {
        const url = 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://www.nepalsambat.com/widget/nsstandard.php');
        const res = await fetch(url);
        if (!res.ok) return;
        const html = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const rows = doc.querySelectorAll('.row');
        if (rows.length >= 2) {
            const nsYear = rows[0].innerText.trim();
            const nsTithi = rows[1].innerText.trim();
            
            const tithiMap = {
                'पारु': '१', 'प्रतिपदा': '१',
                'दुतिया': '२', 'द्वितीया': '२',
                'तृतिया': '३', 'तृतीया': '३',
                'चौथि': '४', 'चतुर्थी': '४',
                'पञ्चमी': '५',
                'खस्थि': '६', 'षष्ठी': '६',
                'सप्तमी': '७',
                'अष्टमी': '८',
                'नवमी': '९',
                'दशमी': '१०',
                'एकादशी': '११',
                'दुवादशी': '१२', 'द्वादशी': '१२',
                'त्रयोदशी': '१३',
                'चह्रे': '१४', 'चतुर्दशी': '१४',
                'पुन्ही': '१५', 'पूर्णिमा': '१५',
                'आमाइ': '१५', 'औंसी': '१५'
            };
            
            let dayDigit = '';
            for (const key in tithiMap) {
                if (nsTithi.includes(key)) {
                    dayDigit = ' ' + tithiMap[key];
                    break;
                }
            }
            
            const fullNepalSambat = `${nsYear} ${nsTithi}${dayDigit}`;
            const inNS = document.getElementById('inNepalSamvat');
            if (inNS) {
                inNS.value = fullNepalSambat;
                if (typeof updateDoc === 'function') {
                    updateDoc();
                }
            }
        }
    } catch (e) {
        console.error("Error fetching Nepal Sambat widget:", e);
    }
}

window.onload = function() {
    initializeAutomaticDate();
    addKittaRow();
    adjustSignaturePosition(40);
};