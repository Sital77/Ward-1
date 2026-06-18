// १. तपाईंको गुगल फायरबेसको साँचो (API Keys)
const firebaseConfig = {
    apiKey: "AIzaSyC3uCmLgNN8s0FDMIrkgxR8eH_AvJ_D3J4",
    authDomain: "gauradaha-ward1.firebaseapp.com",
    projectId: "gauradaha-ward1",
    storageBucket: "gauradaha-ward1.firebasestorage.app",
    messagingSenderId: "905617778132",
    appId: "1:905617778132:web:b8149cf37ae3f3c3b42241"
};

// २. क्लाउड डाटाबेस चालु गर्ने
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let globalDatabase = [];

// ३. रियल-टाइम डाटाबेस सिङ्क (कुनै कम्प्युटरमा डाटा थपिँदा आफैं अपडेट हुने)
db.collection("batoPramanitRecords").onSnapshot((snapshot) => {
    globalDatabase = [];
    snapshot.forEach((doc) => {
        globalDatabase.push({ id: doc.id, ...doc.data() });
    });
    // नयाँ सिफारिस माथि देखिने गरी समय (Timestamp) अनुसार मिलाउने
    globalDatabase.sort((a, b) => b.timestamp - a.timestamp);
    renderDatabaseTable();
});

// =========================================================================
// ५. HTML सँग काम गर्न फङ्सनहरूलाई 'window' मा जोड्नुपर्छ (किनकि यो मोड्युल हो)
// =========================================================================

window.toNepaliDigit = function (num) {
    const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return num.toString().split('').map(digit => nepaliDigits[digit] || digit).join('');
}

window.toggleModal = function (show) {
    const modal = document.getElementById('abhilekhModal');
    modal.style.display = show ? 'flex' : 'none';
    if (show) renderDatabaseTable();
}

window.adjustSignaturePosition = function (value) {
    document.getElementById('marginVal').innerText = window.toNepaliDigit(value) + " px";
    document.getElementById('docFooterSection').style.marginTop = value + "px";
}

window.toggleCustomSign = function () {
    const val = document.getElementById('inSignAuthority').value;
    document.getElementById('customSignBox').style.display = (val === 'CUSTOM') ? 'grid' : 'none';
}

window.updateDoc = function () {
    document.getElementById('lblPatraSankhya').innerText = document.getElementById('inPatraSankhya').value;
    document.getElementById('lblChalani').innerText = document.getElementById('inChalani').value || '........';
    document.getElementById('lblMiti').innerText = document.getElementById('inMiti').value || '........';
    document.getElementById('lblNepalSamvat').innerText = document.getElementById('inNepalSamvat').value || '........';

    const selectedWada = document.getElementById('inWadaNo').value;
    document.getElementById('lblWadaHeader').innerText = selectedWada;
    document.getElementById('lblWadaBody1').innerText = selectedWada;
    document.getElementById('lblWadaBody2').innerText = selectedWada;
    document.getElementById('lblSabikAddress').innerText = 'गौरादह गा.वि.स. वडा नं. ' + (document.getElementById('inSabikWada').value || '...');

    document.getElementById('lblOwnerName').innerText = document.getElementById('inName').value || '...........................';

    const citNo = document.getElementById('inCitNo').value.trim();
    const citDate = document.getElementById('inCitDate').value.trim();
    let citText = "";

    if (citNo !== "") citText += "ना.प्र.नं. " + citNo;
    if (citDate !== "") {
        if (citText !== "") citText += ", ";
        citText += "जारी मिति: " + citDate;
    }

    const citBlock = document.getElementById('lblCitBlock');
    if (citText !== "") {
        citBlock.innerText = " (" + citText + ") ";
        citBlock.style.display = 'inline';
    } else {
        citBlock.style.display = 'none';
    }

    document.getElementById('lblKittaNo').innerText = document.getElementById('inKitta').value || '.......';
    document.getElementById('lblArea').innerText = document.getElementById('inArea').value || '.......';
    document.getElementById('lblDirection').innerText = document.getElementById('inDirection').value || '.......';
    document.getElementById('lblRoadWidth').innerText = document.getElementById('inRoadWidth').value || '....';

    const roadType = document.getElementById('inRoadType').value;
    document.getElementById('lblRoadType').innerText = roadType + ' बाटो';

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
}

// ६. क्लाउडमा डाटा सेभ गर्ने फङ्सन
window.printAndSaveSystem = async function () {
    const name = document.getElementById('inName').value.trim();
    if (!name) { alert("कृपया निवेदकको नाम अनिवार्य लेख्नुहोस् ।"); return; }

    const recordId = document.getElementById('editRecordIndex').value; // अब यसले क्लाउडको ID बोक्छ

    // डाटाबेस पठाउने प्याकेज
    const currentObj = {
        patra: document.getElementById('inPatraSankhya').value,
        chalani: document.getElementById('inChalani').value.trim() || '-',
        wada: document.getElementById('inWadaNo').value,
        name: name,
        citNo: document.getElementById('inCitNo').value,
        citDate: document.getElementById('inCitDate').value,
        miti: document.getElementById('inMiti').value,
        subject: "बाटो प्रमाणित सिफारिस",
        ns: document.getElementById('inNepalSamvat').value,
        sabikWada: document.getElementById('inSabikWada').value,
        kitta: document.getElementById('inKitta').value,
        area: document.getElementById('inArea').value,
        direction: document.getElementById('inDirection').value,
        roadWidth: document.getElementById('inRoadWidth').value,
        roadType: document.getElementById('inRoadType').value,
        signAuth: document.getElementById('inSignAuthority').value,
        customSignName: document.getElementById('inCustomSignName').value,
        customSignTitle: document.getElementById('inCustomSignTitle').value,
        sigMargin: document.getElementById('inSigMargin').value,
        timestamp: Date.now() // समय रेकर्ड गर्ने
    };

    try {
        if (recordId !== "") {
            // पुरानो रेकर्ड अपडेट (Edit) गर्ने
            await db.collection("batoPramanitRecords").doc(recordId).update(currentObj);
            document.getElementById('editRecordIndex').value = "";
            document.getElementById('formMainTitle').innerText = "📝 बाटो प्रमाणित प्रविष्टि";
        } else {
            // नयाँ रेकर्ड क्लाउडमा थप्ने
            await db.collection("batoPramanitRecords").add(currentObj);
        }
        // काम सफल भएपछि मात्र प्रिन्ट विन्डो खुल्छ
        window.print();
    } catch (e) {
        console.error(e);
        alert("क्लाउडमा डाटा सुरक्षित गर्दा समस्या भयो! इन्टरनेट कनेक्सन जाँच्नुहोस् ।");
    }
}

window.renderDatabaseTable = function () {
    const tbody = document.getElementById('dbTableBody');
    const search = document.getElementById('searchField').value.trim().toLowerCase();
    tbody.innerHTML = '';
    let counter = 0;

    globalDatabase.forEach((rec) => {
        if (search && !rec.name.toLowerCase().includes(search)) return;
        counter++;
        tbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td><b>${window.toNepaliDigit(counter)}</b></td>
                <td><b>${rec.name}</b></td>
                <td><span style="color:#2b6cb0; font-weight:bold;">${rec.subject}</span></td>
                <td>${window.toNepaliDigit(rec.miti)}</td>
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

// ७. क्लाउडबाट डाटा एडिट गर्ने
window.editFromDB = function (id) {
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
    document.getElementById('inCitNo').value = rec.citNo || '';
    document.getElementById('inCitDate').value = rec.citDate || '';

    document.getElementById('inKitta').value = rec.kitta || '';
    document.getElementById('inArea').value = rec.area || '';
    document.getElementById('inDirection').value = rec.direction || '';
    document.getElementById('inRoadWidth').value = rec.roadWidth || '';
    document.getElementById('inRoadType').value = rec.roadType || 'पक्की';

    document.getElementById('inSignAuthority').value = rec.signAuth;
    if (rec.signAuth === 'CUSTOM') {
        document.getElementById('customSignBox').style.display = 'grid';
        document.getElementById('inCustomSignName').value = rec.customSignName || '';
        document.getElementById('inCustomSignTitle').value = rec.customSignTitle || '';
    } else {
        document.getElementById('customSignBox').style.display = 'none';
    }

    if (rec.sigMargin) {
        document.getElementById('inSigMargin').value = rec.sigMargin;
        window.adjustSignaturePosition(rec.sigMargin);
    }

    window.updateDoc();
    window.toggleModal(false);
}

// ८. क्लाउडबाट डाटा डिलिट गर्ने
window.deleteFromDB = async function (id) {
    if (confirm("के तपाईं यो रेकर्ड क्लाउड डाटाबेसबाट स्थायी रूपमा हटाउन चाहनुहुन्छ?")) {
        try {
            await db.collection("batoPramanitRecords").doc(id).delete();
            // डिलिट हुने बित्तिकै onSnapshot ले आफैं टेबल अपडेट गरिदिन्छ !
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

function formatFiscalYear(startYear) {
    const endYear = startYear + 1;
    const endYearSuffix = '0' + String(endYear).slice(-2);
    const englishFY = `${startYear}/${endYearSuffix}`;
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
            nepaliBSDateStr = window.toNepaliDigit(englishBSDateStr);
        } else {
            const today = new Date();
            const year = today.getFullYear();
            bsYearVal = year + 57;
            bsMonthVal = today.getMonth() < 6 ? 2 : 4;
            nepaliBSDateStr = window.toNepaliDigit(`${bsYearVal}/`);
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
    } catch (error) {
        console.error("Error initializing automatic date:", error);
    }
}

window.onload = function () {
    initializeAutomaticDate();
    window.updateDoc();
    window.adjustSignaturePosition(40);
};