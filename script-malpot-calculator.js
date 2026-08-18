// ============================================================================
// मालपोत तथा भूमिकर हिसाब प्रणाली - गौरादह नगरपालिका
// JavaScript Controller & Fast Rate Testing Engine
// ============================================================================

// 1. JSON दररेट डाटा (Fallback सहित - आधिकारिक दररेट २०८३)
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

// Global State
let currentUnitMode = 'sqm'; // Default: 'sqm'
let kittaList = [];
const SQM_PER_DHUR = 16.9315; // 1 Kattha = 338.63 m^2 = 20 Dhur => 1 Dhur = 16.9315 m^2
const SQFT_PER_DHUR = 182.249;

// 2. Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Attempt dynamic fetch from malpot-rates.json
    fetch('./malpot-rates.json')
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data) && data.length > 0) {
                malpotRatesData = data;
            }
            initCategoryDropdown();
        })
        .catch(err => {
            console.log("Using default fallback JSON rates data:", err);
            initCategoryDropdown();
        });

    // Dark Mode preference load
    if (localStorage.getItem('malpot-dark-mode') === 'true') {
        document.body.classList.add('dark-mode');
    }

    // Set Live Nepali Date in header
    updateLiveNepaliDate();
});

// Update Live Nepali Date in Header
function updateLiveNepaliDate() {
    const today = new Date();
    const bsYear = 2083;
    const bsMonths = ['बैशाख', 'जेठ', 'असार', 'साउन', 'भदौ', 'असोज', 'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फाल्गुन', 'चैत्र'];
    const bsMonth = bsMonths[(today.getMonth() + 8) % 12];
    const bsDay = today.getDate();
    
    const mitiStr = `मिति: ${toNepaliDigit(bsYear)} ${bsMonth} ${toNepaliDigit(bsDay)} गते`;
    const badge = document.getElementById('liveMitiBadge');
    if (badge) badge.textContent = mitiStr;
}

// 3. Nepali Number & Words Helper Functions
function toNepaliDigit(num) {
    if (num === undefined || num === null) return '०';
    const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return num.toString().replace(/\d/g, d => nepaliDigits[d]);
}

function formatCurrency(amount) {
    if (isNaN(amount) || amount === null) return '०';
    const rounded = Math.round(amount);
    const formatted = rounded.toLocaleString('en-IN');
    return toNepaliDigit(formatted);
}

function convertNumberToNepaliWords(numberVal) {
    let num = parseInt(numberVal, 10);
    if (isNaN(num) || num <= 0) return 'शून्य';

    const ones = ['', 'एक', 'दुई', 'तीन', 'चार', 'पाँच', 'छ', 'सात', 'आठ', 'नौ', 'दस',
        'एघार', 'बाह्र', 'तेह्र', 'चौध', 'पन्ध्र', 'सोह्र', 'सत्र', 'अठार', 'उन्नाइस', 'बीस',
        'एकाइस', 'बाइस', 'त्रिइस', 'चौबिस', 'पच्चिस', 'छब्बिस', 'सत्ताइस', 'अठ्ठाइस', 'उनन्तीस', 'तीस',
        'एकतीस', 'बत्तीस', 'तेत्तीस', 'चौत्तीस', 'पैंतीस', 'छत्तीस', 'सरतीस', 'अड्तीस', 'उनन्चालीस', 'चालीस',
        'एकचालीस', 'बयालीस', 'त्रिचालीस', 'चौवालीस', 'पैंतालीस', 'छयालीस', 'सच्चालीस', 'अढ्चालीस', 'उनन्पचास', 'पचास',
        'एकान्न', 'बाउन्न', 'त्रिपन्न', 'चौपन्न', 'पचपन्न', 'छप्पन्न', 'सन्तान्न', 'अन्ठाउन्न', 'उनन्साठ्ठी', 'साठ्ठी',
        'एकसट्ठी', 'ब्यासट्ठी', 'त्रिसट्ठी', 'चौसट्ठी', 'पैंसट्ठी', 'छ्यासट्ठी', 'सत्सट्ठी', 'अड्सट्ठी', 'उनन्सत्तरी', 'सत्तरी',
        'एकहत्तर', 'बहत्तर', 'त्रिहत्तर', 'चौहत्तर', 'पचहत्तर', 'छ्याहत्तर', 'सतहत्तर', 'अठहत्तर', 'उनासी', 'असी',
        'एकासी', 'बयासी', 'त्रियासी', 'चौरासी', 'पचासी', 'छयासी', 'सत्तासी', 'अठासी', 'उनान्नब्बे', 'नब्बे',
        'एकान्नब्बे', 'बयान्नब्बे', 'त्रियान्नब्बे', 'चौरान्नब्बे', 'पञ्चान्नब्बे', 'छयान्नब्बे', 'सन्तान्नब्बे', 'अन्ठान्नब्बे', 'उनान्सय'];

    function twoDigits(n) {
        if (n <= 0) return '';
        return ones[n] || '';
    }

    let words = [];
    let arab = Math.floor(num / 1000000000);
    num %= 1000000000;
    if (arab > 0) words.push(twoDigits(arab) + ' अर्ब');

    let crore = Math.floor(num / 10000000);
    num %= 10000000;
    if (crore > 0) words.push(twoDigits(crore) + ' करोड');

    let lakh = Math.floor(num / 100000);
    num %= 100000;
    if (lakh > 0) words.push(twoDigits(lakh) + ' लाख');

    let thousand = Math.floor(num / 1000);
    num %= 1000;
    if (thousand > 0) words.push(twoDigits(thousand) + ' हजार');

    let hundred = Math.floor(num / 100);
    num %= 100;
    if (hundred > 0) words.push(twoDigits(hundred) + ' सय');

    if (num > 0) words.push(twoDigits(num));

    return words.join(' ');
}

// 4. Ward Mapping Helper
function getWardGroupKey(wardNum) {
    const w = parseInt(wardNum, 10);
    if (w === 1 || w === 2 || w === 3) return 'ward_1_2_3';
    if (w === 4 || w === 5) return 'ward_4_5';
    if (w === 7) return 'ward_7';
    if (w === 6 || w === 8) return 'ward_6_8';
    if (w === 9) return 'ward_9';
    return 'ward_1_2_3';
}

// 5. Category & Subcategory Dropdown Logic
function initCategoryDropdown() {
    const catSelect = document.getElementById('categorySelect');
    catSelect.innerHTML = '<option value="">-- वर्ग छान्नुहोस् --</option>';
    malpotRatesData.forEach((cat, index) => {
        const opt = document.createElement('option');
        opt.value = index;
        opt.textContent = cat.category;
        catSelect.appendChild(opt);
    });

    // Auto select first category & subcategory by default for quick instant testing
    if (malpotRatesData.length > 0) {
        catSelect.value = "0";
        updateSubCategories();
        const subSelect = document.getElementById('subCategorySelect');
        if (subSelect.options.length > 1) {
            subSelect.selectedIndex = 1;
        }
        updateRatePreview();
    }
}

function onWardOrCategoryChange() {
    updateSubCategories();
    const subSelect = document.getElementById('subCategorySelect');
    if (subSelect.options.length > 1) {
        subSelect.selectedIndex = 1;
    }
    updateRatePreview();
}

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
}

function updateRatePreview() {
    const wardVal = document.getElementById('wardSelect').value;
    const catIndex = document.getElementById('categorySelect').value;
    const subCatId = document.getElementById('subCategorySelect').value;
    const previewText = document.getElementById('ratePreviewText');
    const badgePill = document.getElementById('rateBadgePill');

    if (!wardVal || catIndex === "" || !subCatId) {
        previewText.textContent = "वर्ग र सडक छान्नुहोस्";
        badgePill.textContent = `वडा नं. ${toNepaliDigit(wardVal || 1)}`;
        return;
    }

    const categoryObj = malpotRatesData[catIndex];
    const subCatObj = categoryObj.subCategories.find(s => s.id === subCatId);
    if (!subCatObj) return;

    const wardKey = getWardGroupKey(wardVal);
    const rateInfo = subCatObj.rates[wardKey];

    previewText.innerHTML = `१० धुर सम्म: <strong>रु. ${toNepaliDigit(rateInfo.base_rate)}</strong> | १० धुर माथि: <strong>रु. ${toNepaliDigit(rateInfo.per_dhur_extra)}/धुर</strong>`;
    badgePill.textContent = `वडा नं. ${toNepaliDigit(wardVal)}`;
    calculateLiveArea();
}

// 6. Area Unit Switching & Real-Time Calculation
function switchUnit(unit) {
    currentUnitMode = unit;
    
    // Switch tabs styling
    document.querySelectorAll('.unit-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab${unit.charAt(0).toUpperCase() + unit.slice(1)}`).classList.add('active');

    // Toggle input containers
    document.getElementById('sqmSection').style.display = (unit === 'sqm') ? 'block' : 'none';
    document.getElementById('bighaSection').style.display = (unit === 'bigha') ? 'block' : 'none';
    document.getElementById('ropaniSection').style.display = (unit === 'ropani') ? 'block' : 'none';
    document.getElementById('sqftSection').style.display = (unit === 'sqft') ? 'block' : 'none';

    calculateLiveArea();
}

function getCurrentTotalDhur() {
    if (currentUnitMode === 'sqm') {
        const sqm = parseFloat(document.getElementById('inputSqm').value) || 0;
        return sqm / SQM_PER_DHUR;
    } else if (currentUnitMode === 'bigha') {
        const b = parseFloat(document.getElementById('inputBigha').value) || 0;
        const k = parseFloat(document.getElementById('inputKattha').value) || 0;
        const d = parseFloat(document.getElementById('inputDhur').value) || 0;
        return (b * 400) + (k * 20) + d;
    } else if (currentUnitMode === 'ropani') {
        const r = parseFloat(document.getElementById('inputRopani').value) || 0;
        const a = parseFloat(document.getElementById('inputAana').value) || 0;
        const p = parseFloat(document.getElementById('inputPaisa').value) || 0;
        const daam = parseFloat(document.getElementById('inputDaam').value) || 0;
        const totalRopaniUnits = (r * 256) + (a * 16) + (p * 4) + daam;
        const totalSqm = (totalRopaniUnits / 256) * 508.72;
        return totalSqm / SQM_PER_DHUR;
    } else if (currentUnitMode === 'sqft') {
        const sqft = parseFloat(document.getElementById('inputSqft').value) || 0;
        return sqft / SQFT_PER_DHUR;
    }
    return 0;
}

function formatBKDString(totalDhur) {
    if (totalDhur <= 0) return '० धुर';
    
    let bigha = Math.floor(totalDhur / 400);
    let remDhur = totalDhur % 400;
    let kattha = Math.floor(remDhur / 20);
    let dhur = (remDhur % 20).toFixed(2);

    let parts = [];
    if (bigha > 0) parts.push(`${toNepaliDigit(bigha)} बिघा`);
    if (kattha > 0) parts.push(`${toNepaliDigit(kattha)} कट्ठा`);
    if (parseFloat(dhur) > 0 || parts.length === 0) parts.push(`${toNepaliDigit(dhur)} धुर`);

    return parts.join(' ');
}

function calculateLiveArea() {
    const totalDhur = getCurrentTotalDhur();
    const totalKattha = (totalDhur / 20).toFixed(2);
    const totalSqm = (totalDhur * SQM_PER_DHUR).toFixed(2);
    const bkdText = formatBKDString(totalDhur);

    const liveBadge = document.getElementById('liveAreaText');
    liveBadge.textContent = `${toNepaliDigit(totalSqm)} m² (${toNepaliDigit(totalDhur.toFixed(1))} धुर | ${bkdText})`;
}

// 7. Add Kitta Parcel to Assessment
function addKittaParcel() {
    const wardVal = document.getElementById('wardSelect').value;
    const catIndex = document.getElementById('categorySelect').value;
    const subCatId = document.getElementById('subCategorySelect').value;
    const totalDhur = getCurrentTotalDhur();

    // Validation
    if (!wardVal) {
        alert("⚠️ कृपया वडा नं. छनौट गर्नुहोस्!");
        document.getElementById('wardSelect').focus();
        return;
    }
    if (catIndex === "") {
        alert("⚠️ कृपया जग्गाको क्षेत्र / वर्ग छनौट गर्नुहोस्!");
        document.getElementById('categorySelect').focus();
        return;
    }
    if (!subCatId) {
        alert("⚠️ कृपया सडकको विवरण छनौट गर्नुहोस्!");
        document.getElementById('subCategorySelect').focus();
        return;
    }
    if (totalDhur <= 0) {
        alert("⚠️ कृपया जग्गाको सही क्षेत्रफल (वर्गमिटर वा बिघा-कट्ठा-धुर) हाल्नुहोस्!");
        if (currentUnitMode === 'sqm') document.getElementById('inputSqm').focus();
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

    const parcelTax = Math.round(baseTax + extraTax);
    const totalSqm = (totalDhur * SQM_PER_DHUR).toFixed(2);

    const newKitta = {
        id: Date.now(),
        ward: wardVal,
        categoryName: categoryObj.category,
        subCatId: subCatId,
        subCatDesc: subCatObj.description,
        totalDhur: totalDhur,
        totalSqm: totalSqm,
        bkdString: formatBKDString(totalDhur),
        baseRate: rateInfo.base_rate,
        extraRate: rateInfo.per_dhur_extra,
        extraDhur: extraDhur,
        extraTax: extraTax,
        parcelTax: parcelTax
    };

    kittaList.push(newKitta);
    renderKittaTable();
    resetParcelInputs();
    showToast(`✅ जग्गा हिसाबमा थपियो: रु. ${formatCurrency(parcelTax)}`);
}

// Reset Parcel Inputs
function resetParcelInputs() {
    if (document.getElementById('inputSqm')) document.getElementById('inputSqm').value = '';
    if (document.getElementById('inputBigha')) document.getElementById('inputBigha').value = '0';
    if (document.getElementById('inputKattha')) document.getElementById('inputKattha').value = '0';
    if (document.getElementById('inputDhur')) document.getElementById('inputDhur').value = '0';
    if (document.getElementById('inputRopani')) document.getElementById('inputRopani').value = '0';
    if (document.getElementById('inputAana')) document.getElementById('inputAana').value = '0';
    if (document.getElementById('inputPaisa')) document.getElementById('inputPaisa').value = '0';
    if (document.getElementById('inputDaam')) document.getElementById('inputDaam').value = '0';
    if (document.getElementById('inputSqft')) document.getElementById('inputSqft').value = '';
    calculateLiveArea();
}

// 8. Remove Kitta
function removeKitta(index) {
    kittaList.splice(index, 1);
    renderKittaTable();
    showToast(`🗑️ जग्गा हटाइयो`);
}

function clearAllKittas() {
    if (kittaList.length === 0) return;
    if (confirm("के तपाईं हिसाबमा थपिएका सबै जग्गाहरू हटाउन चाहनुहुन्छ?")) {
        kittaList = [];
        resetParcelInputs();
        renderKittaTable();
        showToast("🔄 सबै जग्गाहरू रिसेट गरियो");
    }
}

// 9. Render Kitta Table & Grand Total Summary
function renderKittaTable() {
    const tbody = document.getElementById('kittaTableBody');
    tbody.innerHTML = '';

    if (kittaList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 35px 15px;">
                    <div style="font-size: 2rem; margin-bottom: 8px;">🌾</div>
                    कुनै पनि जग्गा थपिएको छैन। देब्रेपट्टीको फारम भरेर <strong>"➕ थप्नुस्"</strong> क्लिक गर्नुहोस्।
                </td>
            </tr>
        `;
        document.getElementById('grandTotalTax').textContent = 'रु. ०';
        document.getElementById('grandTotalInWords').textContent = 'अक्षरमा: शून्य रुपैयाँ मात्र';
        document.getElementById('totalKittaCount').textContent = '० वटा';
        document.getElementById('totalSqmCount').textContent = '० m²';
        document.getElementById('totalDhurCount').textContent = '० धुर';
        return;
    }

    let grandTotal = 0;
    let grandDhur = 0;
    let grandSqm = 0;

    kittaList.forEach((kitta, idx) => {
        grandTotal += kitta.parcelTax;
        grandDhur += kitta.totalDhur;
        grandSqm += parseFloat(kitta.totalSqm);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${toNepaliDigit(idx + 1)}</strong></td>
            <td><strong>वडा ${toNepaliDigit(kitta.ward)}</strong></td>
            <td>
                <div style="font-weight:700; font-size:0.92rem;">${kitta.categoryName}</div>
                <div style="font-size:0.82rem; color:var(--text-muted);">${kitta.subCatId} (${kitta.subCatDesc})</div>
            </td>
            <td>
                <div style="font-weight:800; color:var(--primary);">${toNepaliDigit(kitta.totalSqm)} m²</div>
                <div style="font-size:0.82rem; color:var(--secondary); font-weight:700;">${kitta.bkdString} (${toNepaliDigit(kitta.totalDhur.toFixed(1))} धुर)</div>
            </td>
            <td>
                <div style="font-size:0.85rem; color:var(--text-secondary);">आधार: रु. ${toNepaliDigit(kitta.baseRate)}</div>
                <div style="font-size:0.8rem; color:var(--text-muted);">थप (${toNepaliDigit(kitta.extraDhur.toFixed(1))} धुर): रु. ${toNepaliDigit(kitta.extraTax.toFixed(1))}</div>
            </td>
            <td>
                <div style="font-weight:800; color:var(--accent); font-size:1.1rem;">रु. ${formatCurrency(kitta.parcelTax)}</div>
            </td>
            <td>
                <button type="button" class="btn-action-del" onclick="removeKitta(${idx})" title="हटाउनुहोस्">हटाउनुस्</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    const words = convertNumberToNepaliWords(grandTotal);
    document.getElementById('grandTotalTax').textContent = `रु. ${formatCurrency(grandTotal)}`;
    document.getElementById('grandTotalInWords').textContent = `अक्षरमा: ${words} रुपैयाँ मात्र`;
    document.getElementById('totalKittaCount').textContent = `${toNepaliDigit(kittaList.length)} वटा`;
    document.getElementById('totalSqmCount').textContent = `${toNepaliDigit(grandSqm.toFixed(1))} m²`;
    document.getElementById('totalDhurCount').textContent = `${toNepaliDigit(grandDhur.toFixed(1))} धुर`;
}

// 10. Printable Official Municipal Voucher
function printReceipt() {
    if (kittaList.length === 0) {
        alert("⚠️ प्रिन्ट गर्नु अघि कम्तिमा एउटा जग्गा थप्नुहोस्!");
        return;
    }

    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${(today.getMonth()+1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    const voucherNo = `GRD-MK-${Date.now().toString().slice(-6)}`;

    document.getElementById('printDate').textContent = toNepaliDigit(formattedDate);
    document.getElementById('printVoucherNo').textContent = toNepaliDigit(voucherNo);

    const printTbody = document.getElementById('printTableBody');
    printTbody.innerHTML = '';
    let totalTax = 0;
    let totalDhur = 0;
    let totalSqm = 0;

    kittaList.forEach((kitta, idx) => {
        totalTax += kitta.parcelTax;
        totalDhur += kitta.totalDhur;
        totalSqm += parseFloat(kitta.totalSqm);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="text-align:center;">${toNepaliDigit(idx + 1)}</td>
            <td style="text-align:center;">वडा ${toNepaliDigit(kitta.ward)}</td>
            <td>
                <div>${kitta.categoryName}</div>
                <div style="font-size:0.85rem; color:#444;">${kitta.subCatId} - ${kitta.subCatDesc}</div>
            </td>
            <td>
                <strong>${toNepaliDigit(kitta.totalSqm)} m²</strong>
                <div style="font-size:0.85rem;">(${kitta.bkdString} / ${toNepaliDigit(kitta.totalDhur.toFixed(1))} धुर)</div>
            </td>
            <td style="text-align:right;">
                <div>आधार: रु. ${toNepaliDigit(kitta.baseRate)}</div>
                <div style="font-size:0.85rem;">थप: रु. ${toNepaliDigit(kitta.extraTax.toFixed(1))}</div>
            </td>
            <td style="text-align:right;"><strong>रु. ${formatCurrency(kitta.parcelTax)}</strong></td>
        `;
        printTbody.appendChild(tr);
    });

    const words = convertNumberToNepaliWords(totalTax);
    document.getElementById('printGrandTotal').textContent = `रु. ${formatCurrency(totalTax)}`;
    document.getElementById('printGrandTotalWords').textContent = `${words} रुपैयाँ मात्र`;
    document.getElementById('printTotalKittas').textContent = `${toNepaliDigit(kittaList.length)} वटा`;
    document.getElementById('printTotalArea').textContent = `${toNepaliDigit(totalSqm.toFixed(1))} m² (${formatBKDString(totalDhur)})`;

    window.print();
}

// 11. Municipal Rates Sheet Modal
function openRatesModal() {
    renderRatesModalBody();
    document.getElementById('ratesModal').classList.add('active');
}

function closeRatesModal() {
    document.getElementById('ratesModal').classList.remove('active');
}

function renderRatesModalBody() {
    const container = document.getElementById('ratesModalBody');
    let html = '';

    malpotRatesData.forEach((cat) => {
        html += `
            <div style="margin-bottom: 22px;">
                <h3 style="color: var(--primary); font-size: 1.15rem; font-weight: 800; border-bottom: 2px solid var(--border-color); padding-bottom: 6px; margin-bottom: 10px;">
                    ${cat.category}
                </h3>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;" border="1" cellpadding="6" bordercolor="var(--border-color)">
                        <thead>
                            <tr style="background: var(--bg-primary);">
                                <th style="text-align: left;">सडक विवरण</th>
                                <th style="text-align: center;">वडा १,२,३</th>
                                <th style="text-align: center;">वडा ४,५</th>
                                <th style="text-align: center;">वडा ७</th>
                                <th style="text-align: center;">वडा ६,८</th>
                                <th style="text-align: center;">वडा ९</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        cat.subCategories.forEach(sub => {
            html += `
                <tr>
                    <td><strong>${sub.id}</strong> ${sub.description}</td>
                    <td style="text-align: center;">रु. ${toNepaliDigit(sub.rates.ward_1_2_3.base_rate)} <span style="font-size:0.8rem; color:var(--text-muted);">(+${toNepaliDigit(sub.rates.ward_1_2_3.per_dhur_extra)})</span></td>
                    <td style="text-align: center;">रु. ${toNepaliDigit(sub.rates.ward_4_5.base_rate)} <span style="font-size:0.8rem; color:var(--text-muted);">(+${toNepaliDigit(sub.rates.ward_4_5.per_dhur_extra)})</span></td>
                    <td style="text-align: center;">रु. ${toNepaliDigit(sub.rates.ward_7.base_rate)} <span style="font-size:0.8rem; color:var(--text-muted);">(+${toNepaliDigit(sub.rates.ward_7.per_dhur_extra)})</span></td>
                    <td style="text-align: center;">रु. ${toNepaliDigit(sub.rates.ward_6_8.base_rate)} <span style="font-size:0.8rem; color:var(--text-muted);">(+${toNepaliDigit(sub.rates.ward_6_8.per_dhur_extra)})</span></td>
                    <td style="text-align: center;">रु. ${toNepaliDigit(sub.rates.ward_9.base_rate)} <span style="font-size:0.8rem; color:var(--text-muted);">(+${toNepaliDigit(sub.rates.ward_9.per_dhur_extra)})</span></td>
                </tr>
            `;
        });

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// 12. Copy Summary to Clipboard
function copyCalculationSummary() {
    if (kittaList.length === 0) {
        alert("⚠️ कपी गर्न कम्तिमा एउटा जग्गा थप्नुहोस्!");
        return;
    }

    let grandTotal = 0;
    let grandDhur = 0;
    let grandSqm = 0;

    let text = `🏛️ गौरादह नगरपालिका - मालपोत तथा भूमिकर हिसाब विवरण\n`;
    text += `----------------------------------------\n`;

    kittaList.forEach((k, idx) => {
        grandTotal += k.parcelTax;
        grandDhur += k.totalDhur;
        grandSqm += parseFloat(k.totalSqm);
        text += `${idx + 1}. वडा: ${k.ward} | ${k.categoryName} (${k.subCatId})\n`;
        text += `   क्षेत्रफल: ${k.totalSqm} m² (${k.bkdString} / ${k.totalDhur.toFixed(1)} धुर)\n`;
        text += `   भूमिकर रकम: रु. ${k.parcelTax.toLocaleString('en-IN')}\n\n`;
    });

    const words = convertNumberToNepaliWords(grandTotal);
    text += `----------------------------------------\n`;
    text += `💰 कुल भूमिकर: रु. ${grandTotal.toLocaleString('en-IN')}\n`;
    text += `📝 अक्षरमा: ${words} रुपैयाँ मात्र\n`;
    text += `📐 कुल क्षेत्रफल: ${grandSqm.toFixed(1)} m² (${formatBKDString(grandDhur)})\n`;
    text += `गौरादह नगरपालिका डिजिटल प्रणाली`;

    navigator.clipboard.writeText(text).then(() => {
        showToast("📋 हिसाब विवरण क्लिपबोर्डमा कपी भयो!");
    }).catch(err => {
        alert("कपी गर्न सकिएन: " + err);
    });
}

// 13. Dark Mode Toggle
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('malpot-dark-mode', isDark);
    showToast(isDark ? "🌙 डार्क मोड सक्रिय गरियो" : "☀️ लाइट मोड सक्रिय गरियो");
}

// 14. Toast Notification Helper
function showToast(msg) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.transition = 'opacity 0.3s, transform 0.3s';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
