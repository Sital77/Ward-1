// मालपोत तथा भूमिकर हिसाब प्रणाली - जावास्क्रिप्ट लजिक

// JSON दररेट डाटा (Fallback सहित)
let malpotRatesData = [
  {
    "category": "१. (व्यवसायीक) शहरी क्षेत्र",
    "subCategories": [
      {
        "id": "1.1",
        "description": "पक्की सडकले छोएका जग्गा जमिनमा १० धुर सम्मको",
        "rates": {
          "ward_1_2_3": { "base_rate": 80, "per_dhur_extra": 7 },
          "ward_4_5": { "base_rate": 70, "per_dhur_extra": 6 },
          "ward_7": { "base_rate": 74, "per_dhur_extra": 6 },
          "ward_6_8": { "base_rate": 68, "per_dhur_extra": 5.5 },
          "ward_9": { "base_rate": 70, "per_dhur_extra": 6 }
        }
      },
      {
        "id": "1.2",
        "description": "ग्राभेल सडकले छोएका जग्गा जमिनमा १० धुर सम्मको",
        "rates": {
          "ward_1_2_3": { "base_rate": 74, "per_dhur_extra": 6 },
          "ward_4_5": { "base_rate": 61.5, "per_dhur_extra": 5 },
          "ward_7": { "base_rate": 65.5, "per_dhur_extra": 5.5 },
          "ward_6_8": { "base_rate": 55, "per_dhur_extra": 4 },
          "ward_9": { "base_rate": 61.5, "per_dhur_extra": 5 }
        }
      },
      {
        "id": "1.3",
        "description": "माटो सतह भएका सडकले छोएका जग्गा जमिनमा १० धुर सम्मको",
        "rates": {
          "ward_1_2_3": { "base_rate": 65.5, "per_dhur_extra": 5 },
          "ward_4_5": { "base_rate": 53, "per_dhur_extra": 4 },
          "ward_7": { "base_rate": 47, "per_dhur_extra": 4.5 },
          "ward_6_8": { "base_rate": 45, "per_dhur_extra": 3 },
          "ward_9": { "base_rate": 53, "per_dhur_extra": 4 }
        }
      },
      {
        "id": "1.4",
        "description": "कुनै पनि प्रकारको सडकले नछोएका जग्गा जमिनमा १० धुर सम्मको",
        "rates": {
          "ward_1_2_3": { "base_rate": 57, "per_dhur_extra": 4.5 },
          "ward_4_5": { "base_rate": 45, "per_dhur_extra": 3 },
          "ward_7": { "base_rate": 49, "per_dhur_extra": 3.5 },
          "ward_6_8": { "base_rate": 39, "per_dhur_extra": 2 },
          "ward_9": { "base_rate": 45, "per_dhur_extra": 3 }
        }
      }
    ]
  },
  {
    "category": "२. आवासीय क्षेत्र",
    "subCategories": [
      {
        "id": "2.1",
        "description": "पक्की सडकले छोएका जग्गा जमिनमा १० धुर सम्मको",
        "rates": {
          "ward_1_2_3": { "base_rate": 72, "per_dhur_extra": 6 },
          "ward_4_5": { "base_rate": 60, "per_dhur_extra": 5 },
          "ward_7": { "base_rate": 68, "per_dhur_extra": 5.5 },
          "ward_6_8": { "base_rate": 60, "per_dhur_extra": 5 },
          "ward_9": { "base_rate": 60, "per_dhur_extra": 5 }
        }
      },
      {
        "id": "2.2",
        "description": "ग्राभेल सडकले छोएका जग्गा जमिनमा १० धुर सम्मको",
        "rates": {
          "ward_1_2_3": { "base_rate": 64, "per_dhur_extra": 5 },
          "ward_4_5": { "base_rate": 52, "per_dhur_extra": 4 },
          "ward_7": { "base_rate": 60, "per_dhur_extra": 5 },
          "ward_6_8": { "base_rate": 52, "per_dhur_extra": 4 },
          "ward_9": { "base_rate": 52, "per_dhur_extra": 4 }
        }
      },
      {
        "id": "2.3",
        "description": "माटो सतह भएका सडकले छोएका जग्गा जमिनमा १० धुर सम्मको",
        "rates": {
          "ward_1_2_3": { "base_rate": 56, "per_dhur_extra": 4.5 },
          "ward_4_5": { "base_rate": 44, "per_dhur_extra": 3 },
          "ward_7": { "base_rate": 52, "per_dhur_extra": 4 },
          "ward_6_8": { "base_rate": 44, "per_dhur_extra": 3 },
          "ward_9": { "base_rate": 44, "per_dhur_extra": 3 }
        }
      },
      {
        "id": "2.4",
        "description": "कुनै पनि प्रकारको सडकले नछोएका जग्गा जमिनमा १० धुर सम्मको",
        "rates": {
          "ward_1_2_3": { "base_rate": 48, "per_dhur_extra": 3.5 },
          "ward_4_5": { "base_rate": 36, "per_dhur_extra": 2.5 },
          "ward_7": { "base_rate": 44, "per_dhur_extra": 4 },
          "ward_6_8": { "base_rate": 36, "per_dhur_extra": 2.5 },
          "ward_9": { "base_rate": 36, "per_dhur_extra": 2.5 }
        }
      }
    ]
  },
  {
    "category": "३. कृषि क्षेत्र",
    "subCategories": [
      {
        "id": "3.1",
        "description": "पक्की सडकले छोएका जग्गा जमिनमा १० धुर सम्मको",
        "rates": {
          "ward_1_2_3": { "base_rate": 52.5, "per_dhur_extra": 4 },
          "ward_4_5": { "base_rate": 48.5, "per_dhur_extra": 4 },
          "ward_7": { "base_rate": 48.5, "per_dhur_extra": 4 },
          "ward_6_8": { "base_rate": 48.5, "per_dhur_extra": 4 },
          "ward_9": { "base_rate": 48.5, "per_dhur_extra": 4 }
        }
      },
      {
        "id": "3.2",
        "description": "ग्राभेल सडकले छोएका जग्गा जमिनमा १० धुर सम्मको",
        "rates": {
          "ward_1_2_3": { "base_rate": 45, "per_dhur_extra": 3.5 },
          "ward_4_5": { "base_rate": 44, "per_dhur_extra": 3 },
          "ward_7": { "base_rate": 44, "per_dhur_extra": 3 },
          "ward_6_8": { "base_rate": 44, "per_dhur_extra": 3 },
          "ward_9": { "base_rate": 44, "per_dhur_extra": 3 }
        }
      },
      {
        "id": "3.3",
        "description": "माटो सतह भएका सडकले छोएका जग्गा जमिनमा १० धुर सम्मको",
        "rates": {
          "ward_1_2_3": { "base_rate": 37.5, "per_dhur_extra": 2.5 },
          "ward_4_5": { "base_rate": 33.5, "per_dhur_extra": 2 },
          "ward_7": { "base_rate": 33.5, "per_dhur_extra": 2 },
          "ward_6_8": { "base_rate": 33.5, "per_dhur_extra": 2 },
          "ward_9": { "base_rate": 33.5, "per_dhur_extra": 2 }
        }
      },
      {
        "id": "3.4",
        "description": "कुनै पनि प्रकारको सडकले नछोएका जग्गा जमिनमा १० धुर सम्मको",
        "rates": {
          "ward_1_2_3": { "base_rate": 30, "per_dhur_extra": 2 },
          "ward_4_5": { "base_rate": 26, "per_dhur_extra": 1.5 },
          "ward_7": { "base_rate": 26, "per_dhur_extra": 1.5 },
          "ward_6_8": { "base_rate": 26, "per_dhur_extra": 1.5 },
          "ward_9": { "base_rate": 26, "per_dhur_extra": 1.5 }
        }
      }
    ]
  },
  {
    "category": "४. औद्योगिक क्षेत्र",
    "subCategories": [
      {
        "id": "4.1",
        "description": "पक्की सडकले छोएका जग्गा जमिनमा १० धुर सम्मको",
        "rates": {
          "ward_1_2_3": { "base_rate": 72, "per_dhur_extra": 5.5 },
          "ward_4_5": { "base_rate": 55, "per_dhur_extra": 4.5 },
          "ward_7": { "base_rate": 59.5, "per_dhur_extra": 4.5 },
          "ward_6_8": { "base_rate": 47, "per_dhur_extra": 3.5 },
          "ward_9": { "base_rate": 55, "per_dhur_extra": 4.5 }
        }
      },
      {
        "id": "4.2",
        "description": "ग्राभेल सडकले छोएका जग्गा जमिनमा १० धुर सम्मको",
        "rates": {
          "ward_1_2_3": { "base_rate": 59.5, "per_dhur_extra": 4.5 },
          "ward_4_5": { "base_rate": 45, "per_dhur_extra": 3.5 },
          "ward_7": { "base_rate": 51, "per_dhur_extra": 4 },
          "ward_6_8": { "base_rate": 41, "per_dhur_extra": 2.5 },
          "ward_9": { "base_rate": 47, "per_dhur_extra": 3.5 }
        }
      },
      {
        "id": "4.3",
        "description": "माटो सतह भएका सडकले छोएका जग्गा जमिनमा १० धुर सम्मको",
        "rates": {
          "ward_1_2_3": { "base_rate": 51, "per_dhur_extra": 4 },
          "ward_4_5": { "base_rate": 45, "per_dhur_extra": 3.5 },
          "ward_7": { "base_rate": 47, "per_dhur_extra": 3.5 },
          "ward_6_8": { "base_rate": 45, "per_dhur_extra": 3.5 },
          "ward_9": { "base_rate": 47, "per_dhur_extra": 3.5 }
        }
      },
      {
        "id": "4.4",
        "description": "कुनै पनि प्रकारको सडकले नछोएका जग्गा जमिनमा १० धुर सम्मको",
        "rates": {
          "ward_1_2_3": { "base_rate": 42, "per_dhur_extra": 3 },
          "ward_4_5": { "base_rate": 35, "per_dhur_extra": 2.5 },
          "ward_7": { "base_rate": 38, "per_dhur_extra": 2.5 },
          "ward_6_8": { "base_rate": 35, "per_dhur_extra": 2.5 },
          "ward_9": { "base_rate": 35, "per_dhur_extra": 2.5 }
        }
      }
    ]
  }
];

// Global State Variables
let currentUnitMode = 'bigha'; // 'bigha' or 'sqm'
let kittaList = [];

// DOM Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Attempt dynamic fetch first
    fetch('./malpot-rates.json')
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data) && data.length > 0) {
                malpotRatesData = data;
            }
            initCategoryDropdown();
        })
        .catch(err => {
            console.log("Fallback JSON data used.");
            initCategoryDropdown();
        });

    // Dark Mode preference load
    if (localStorage.getItem('malpot-dark-mode') === 'true') {
        document.body.classList.add('dark-mode');
    }
});

// Wards Mapping Helper
function getWardGroupKey(wardNum) {
    const w = parseInt(wardNum, 10);
    if (w === 1 || w === 2 || w === 3) return 'ward_1_2_3';
    if (w === 4 || w === 5) return 'ward_4_5';
    if (w === 7) return 'ward_7';
    if (w === 6 || w === 8) return 'ward_6_8';
    if (w === 9) return 'ward_9';
    return 'ward_1_2_3';
}

// Number Formatting Helper
function toNepaliNum(num) {
    if (num === undefined || num === null) return '०';
    const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return num.toString().replace(/\d/g, d => nepaliDigits[d]);
}

function formatCurrency(amount) {
    const formatted = Math.round(amount).toLocaleString('en-IN');
    return toNepaliNum(formatted);
}

// Category Dropdown Populating
function initCategoryDropdown() {
    const catSelect = document.getElementById('categorySelect');
    catSelect.innerHTML = '<option value="">-- वर्ग छान्नुहोस् --</option>';
    malpotRatesData.forEach((cat, index) => {
        const opt = document.createElement('option');
        opt.value = index;
        opt.textContent = cat.category;
        catSelect.appendChild(opt);
    });
}

// SubCategory Dropdown Updating
function updateSubCategories() {
    const catIndex = document.getElementById('categorySelect').value;
    const subSelect = document.getElementById('subCategorySelect');
    subSelect.innerHTML = '<option value="">-- सडकको विवरण छान्नुहोस् --</option>';

    if (catIndex === "") return;

    const subCats = malpotRatesData[catIndex].subCategories;
    subCats.forEach(sub => {
        const opt = document.createElement('option');
        opt.value = sub.id;
        opt.textContent = `${sub.id} - ${sub.description}`;
        subSelect.appendChild(opt);
    });

    calculateLiveArea();
}

// Switch Area Unit (Bigha/Sqm)
function switchUnit(unit) {
    currentUnitMode = unit;
    const tabBigha = document.getElementById('tabBigha');
    const tabSqm = document.getElementById('tabSqm');
    const bighaSec = document.getElementById('bighaSection');
    const sqmSec = document.getElementById('sqmSection');

    if (unit === 'bigha') {
        tabBigha.classList.add('active');
        tabSqm.classList.remove('active');
        bighaSec.style.display = 'block';
        sqmSec.style.display = 'none';
    } else {
        tabSqm.classList.add('active');
        tabBigha.classList.remove('active');
        bighaSec.style.display = 'none';
        sqmSec.style.display = 'block';
    }
    calculateLiveArea();
}

// Calculate Total Dhur from Inputs
function getCurrentTotalDhur() {
    if (currentUnitMode === 'bigha') {
        const b = parseFloat(document.getElementById('inputBigha').value) || 0;
        const k = parseFloat(document.getElementById('inputKattha').value) || 0;
        const d = parseFloat(document.getElementById('inputDhur').value) || 0;
        return (b * 400) + (k * 20) + d;
    } else {
        const sqm = parseFloat(document.getElementById('inputSqm').value) || 0;
        return sqm / 16.9317; // 1 Kattha = 338.63 m^2 = 20 Dhur => 1 Dhur ~ 16.9317 m^2
    }
}

// Convert Dhur to Bigha-Kattha-Dhur Display String
function formatBKDString(totalDhur) {
    if (totalDhur <= 0) return '० धुर';
    
    let bigha = Math.floor(totalDhur / 400);
    let remDhur = totalDhur % 400;
    let kattha = Math.floor(remDhur / 20);
    let dhur = (remDhur % 20).toFixed(2);

    let parts = [];
    if (bigha > 0) parts.push(`${toNepaliNum(bigha)} बिघा`);
    if (kattha > 0) parts.push(`${toNepaliNum(kattha)} कट्ठा`);
    if (parseFloat(dhur) > 0 || parts.length === 0) parts.push(`${toNepaliNum(dhur)} धुर`);

    return parts.join(' ');
}

// Live Area Calculation Badge Update
function calculateLiveArea() {
    const totalDhur = getCurrentTotalDhur();
    const totalKattha = (totalDhur / 20).toFixed(2);
    const bkdText = formatBKDString(totalDhur);

    document.getElementById('liveAreaText').textContent = `${bkdText} (${toNepaliNum(totalKattha)} कट्ठा)`;
}

// Add Parcel / Kitta to List
function addKittaParcel() {
    const wardVal = document.getElementById('wardSelect').value;
    const catIndex = document.getElementById('categorySelect').value;
    const subCatId = document.getElementById('subCategorySelect').value;
    const totalDhur = getCurrentTotalDhur();

    if (!wardVal) {
        alert("⚠️ कृपया वडा छनौट गर्नुहोस्!");
        return;
    }
    if (catIndex === "") {
        alert("⚠️ कृपया जग्गाको क्षेत्र/वर्ग छनौट गर्नुहोस्!");
        return;
    }
    if (!subCatId) {
        alert("⚠️ कृपया सडकको विवरण छनौट गर्नुहोस्!");
        return;
    }
    if (totalDhur <= 0) {
        alert("⚠️ कृपया जग्गाको सही क्षेत्रफल हाल्नुहोस्!");
        return;
    }

    const categoryObj = malpotRatesData[catIndex];
    const subCatObj = categoryObj.subCategories.find(s => s.id === subCatId);
    const wardKey = getWardGroupKey(wardVal);
    const rateInfo = subCatObj.rates[wardKey];

    // Compute Tax
    let baseTax = rateInfo.base_rate;
    let extraDhur = 0;
    let extraTax = 0;

    if (totalDhur > 10) {
        extraDhur = totalDhur - 10;
        extraTax = extraDhur * rateInfo.per_dhur_extra;
    }

    const parcelTax = baseTax + extraTax;

    const newKitta = {
        id: Date.now(),
        ward: wardVal,
        categoryName: categoryObj.category,
        subCatId: subCatId,
        subCatDesc: subCatObj.description,
        totalDhur: totalDhur,
        bkdString: formatBKDString(totalDhur),
        baseRate: rateInfo.base_rate,
        extraRate: rateInfo.per_dhur_extra,
        extraDhur: extraDhur,
        extraTax: extraTax,
        parcelTax: parcelTax
    };

    kittaList.push(newKitta);
    renderKittaTable();
    resetFormInputs();
}

// Reset Inputs
function resetFormInputs() {
    document.getElementById('inputBigha').value = '0';
    document.getElementById('inputKattha').value = '0';
    document.getElementById('inputDhur').value = '0';
    document.getElementById('inputSqm').value = '';
    calculateLiveArea();
}

// Remove single kitta
function removeKitta(index) {
    kittaList.splice(index, 1);
    renderKittaTable();
}

// Clear all kittas
function clearAllKittas() {
    if (kittaList.length === 0) return;
    if (confirm("के तपाईं सबै कित्ताहरू हटाउन चाहनुहुन्छ?")) {
        kittaList = [];
        renderKittaTable();
    }
}

// Render Kitta Table & Updates
function renderKittaTable() {
    const tbody = document.getElementById('kittaTableBody');
    tbody.innerHTML = '';

    if (kittaList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 25px;">
                    कुनै पनि कित्ता थपिएको छैन। देब्रेपट्टीको फारम भरेर "+ कित्ता थप्नुहोस्" क्लिक गर्नुहोस्।
                </td>
            </tr>
        `;
        document.getElementById('grandTotalTax').textContent = 'रु. ०';
        document.getElementById('totalKittaCount').textContent = '०';
        document.getElementById('totalDhurCount').textContent = '०';
        return;
    }

    let grandTotal = 0;
    let grandDhur = 0;

    kittaList.forEach((kitta, idx) => {
        grandTotal += kitta.parcelTax;
        grandDhur += kitta.totalDhur;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${toNepaliNum(idx + 1)}</strong></td>
            <td>वडा ${toNepaliNum(kitta.ward)}</td>
            <td>
                <div style="font-weight:700;">${kitta.categoryName}</div>
                <div style="font-size:0.85rem; color:var(--text-muted);">${kitta.subCatId} (${kitta.subCatDesc})</div>
            </td>
            <td>
                <div style="font-weight:700; color:var(--secondary);">${kitta.bkdString}</div>
                <div style="font-size:0.85rem; color:var(--text-muted);">${toNepaliNum(kitta.totalDhur.toFixed(1))} धुर</div>
            </td>
            <td><strong style="color:var(--accent);">रु. ${formatCurrency(kitta.parcelTax)}</strong></td>
            <td><button class="btn-del" onclick="removeKitta(${idx})">हटाउनुस्</button></td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('grandTotalTax').textContent = `रु. ${formatCurrency(grandTotal)}`;
    document.getElementById('totalKittaCount').textContent = toNepaliNum(kittaList.length);
    document.getElementById('totalDhurCount').textContent = toNepaliNum(grandDhur.toFixed(1));
}

// Dark Mode Toggle
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('malpot-dark-mode', isDark);
}

// Printable Receipt Generation
function printReceipt() {
    if (kittaList.length === 0) {
        alert("⚠️ प्रिन्ट गर्नु अघि कम्तिमा एउटा कित्ता थप्नुहोस्!");
        return;
    }

    const ownerName = document.getElementById('ownerName').value.trim() || "नेपाल नागरिक";
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${(today.getMonth()+1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

    document.getElementById('printOwnerName').textContent = ownerName;
    document.getElementById('printDate').textContent = toNepaliNum(formattedDate);

    const printTbody = document.getElementById('printTableBody');
    printTbody.innerHTML = '';
    let totalTax = 0;

    kittaList.forEach((kitta, idx) => {
        totalTax += kitta.parcelTax;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="text-align:center;">${toNepaliNum(idx + 1)}</td>
            <td style="text-align:center;">${toNepaliNum(kitta.ward)}</td>
            <td>${kitta.categoryName} (${kitta.subCatId})</td>
            <td>${kitta.bkdString} (${toNepaliNum(kitta.totalDhur.toFixed(1))} धुर)</td>
            <td style="text-align:right;">रु. ${toNepaliNum(kitta.baseRate)}</td>
            <td style="text-align:right;">रु. ${toNepaliNum(kitta.extraRate)}/धुर</td>
            <td style="text-align:right;"><strong>रु. ${formatCurrency(kitta.parcelTax)}</strong></td>
        `;
        printTbody.appendChild(tr);
    });

    document.getElementById('printGrandTotal').textContent = `रु. ${formatCurrency(totalTax)}`;

    window.print();
}
