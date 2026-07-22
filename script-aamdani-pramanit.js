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
}).catch((e) => console.error("Firebase Snapshot Error:", e));

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

// Dynamic Land Rows
window.addLandRow = function(data = null) {
    landRowCounter++;
    const rowId = 'land_row_' + landRowCounter;
    activeLandRowIds.push(rowId);

    const container = document.getElementById('landRowsContainer');
    if (!container) return;

    const rowHtml = `
        <div class="builder-row" id="${rowId}">
            <input type="text" class="input-sit" placeholder="सिट नं." value="${data && data.sit ? data.sit : ''}" oninput="updateDoc()">
            <input type="text" class="input-kitta" placeholder="कि.नं." value="${data && data.kitta ? data.kitta : ''}" oninput="updateDoc()">
            <input type="text" class="input-area" placeholder="क्षेत्रफल" value="${data && data.area ? data.area : ''}" oninput="updateDoc()">
            <button type="button" class="btn-remove" onclick="removeLandRow('${rowId}')">❌</button>
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

    const totalWords = document.getElementById('inTotalWords');
    safeSetText('lblTotalWords', totalWords && totalWords.value ? totalWords.value : '..........................');

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
    let landDetailsText = "";
    if (activeLandRowIds.length === 0) {
        landDetailsText = "सिट नं. ..... कि.नं. ..... को ज.वि. .....";
    } else {
        const parts = [];
        activeLandRowIds.forEach((id) => {
            const block = document.getElementById(id);
            if (block) {
                const sitInput = block.querySelector('.input-sit');
                const kittaInput = block.querySelector('.input-kitta');
                const areaInput = block.querySelector('.input-area');

                const s = sitInput && sitInput.value ? sitInput.value : '.....';
                const k = kittaInput && kittaInput.value ? kittaInput.value : '.....';
                const a = areaInput && areaInput.value ? areaInput.value : '.....';
                parts.push(`सिट नं. ${s} कि.नं. ${k} को ज.वि. ${a}`);
            }
        });
        landDetailsText = parts.join(" तथा ");
    }
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

                    const bName = bNameInput && bNameInput.value ? bNameInput.value : '-';
                    const bAmtStr = bAmtInput && bAmtInput.value ? bAmtInput.value : '0';
                    const bAmt = parseFloat(window.toEnglishNumber(bAmtStr)) || 0;
                    totalIncome += bAmt;
                    
                    const formattedAmt = bAmt > 0 ? window.formatNepaliCurrency(bAmt) + '/-' : (bAmtStr.trim() !== '' ? window.toNepaliDigit(bAmtStr) + '/-' : '-');
                    
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

// Initial Add 1 Land and 1 Income Row
window.onload = function() {
    addLandRow();
    addIncomeRow();
};

window.renderDatabaseTable = function() {
    const tbody = document.getElementById('dbTableBody');
    if (!tbody) return;

    const searchField = document.getElementById('searchField');
    const searchVal = searchField ? searchField.value.trim().toLowerCase() : '';
    tbody.innerHTML = '';
    
    let displayList = globalDatabase;
    if (searchVal) {
        displayList = displayList.filter(d => (d.name || '').toLowerCase().includes(searchVal));
    }

    if (displayList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">कुनै डाटा भेटिएन</td></tr>';
        return;
    }

    displayList.forEach((data, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${window.toNepaliDigit(index + 1)}</td>
            <td style="font-weight:600; color:#2c5282;">${data.name || '-'}</td>
            <td>आम्दानी प्रमाणित</td>
            <td>${data.miti || '-'}</td>
            <td>
                <button class="btn-action-small" onclick="loadRecordForEdit('${data.id}')" style="background:#3182ce; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">✏️ हेर्नुस्</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
};

window.loadRecordForEdit = function(recordId) {
    const record = globalDatabase.find(r => r.id === recordId);
    if (!record) return;

    const editField = document.getElementById('editRecordIndex');
    if (editField) editField.value = recordId;

    if (document.getElementById('inPatraSankhya')) document.getElementById('inPatraSankhya').value = record.patraSankhya || '२०८३/०८४';
    if (document.getElementById('inChalani')) document.getElementById('inChalani').value = record.chalani || '';
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

    toggleModal(false);
    updateDoc();
    alert('✅ रेकर्ड लोड भयो !');
};

window.printAndSaveSystem = async function() {
    const nameEl = document.getElementById('inName');
    if (!nameEl || !nameEl.value.trim()) {
        alert("⚠️ कृपया निवेदकको नाम लेख्नुहोस् !");
        return;
    }

    const editIdEl = document.getElementById('editRecordIndex');
    const editId = editIdEl ? editIdEl.value : '';
    
    const landRowsData = activeLandRowIds.map(id => {
        const block = document.getElementById(id);
        return {
            sit: block && block.querySelector('.input-sit') ? block.querySelector('.input-sit').value : '',
            kitta: block && block.querySelector('.input-kitta') ? block.querySelector('.input-kitta').value : '',
            area: block && block.querySelector('.input-area') ? block.querySelector('.input-area').value : ''
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
        landRows: landRowsData,
        incomeRows: incomeRowsData,
        timestamp: editId ? undefined : Date.now()
    };

    try {
        if (editId) {
            await db.collection("aamdaniPramanitRecords").doc(editId).update(docData);
        } else {
            await db.collection("aamdaniPramanitRecords").add(docData);
        }
        
        // Hide panel & Print
        const panel = document.querySelector('.input-panel');
        if (panel) panel.style.display = 'none';
        window.print();
        setTimeout(() => {
            if (panel) panel.style.display = 'block';
            if (editIdEl) editIdEl.value = '';
            if (!editId) {
                // Clear out form for next entry
                if (document.getElementById('inChalani')) document.getElementById('inChalani').value = '';
                if (document.getElementById('inName')) document.getElementById('inName').value = '';
                if (document.getElementById('inCitNo')) document.getElementById('inCitNo').value = '';
                if (document.getElementById('inCitDate')) document.getElementById('inCitDate').value = '';
                if (document.getElementById('inTotalWords')) document.getElementById('inTotalWords').value = '';
                
                const landCont = document.getElementById('landRowsContainer');
                if (landCont) landCont.innerHTML = '';
                activeLandRowIds = [];
                addLandRow();
                
                const incCont = document.getElementById('incomeRowsContainer');
                if (incCont) incCont.innerHTML = '';
                activeIncomeRowIds = [];
                addIncomeRow();
                
                updateDoc();
            }
        }, 1000);

    } catch (e) {
        alert("Error saving record: " + e.message);
    }
};
