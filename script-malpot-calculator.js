// ============================================================================
// मालपोत तथा भूमिकर हिसाब प्रणाली - गौरादह नगरपालिका
// Instant Real-Time Tax Calculator Engine
// ============================================================================

// 1. JSON दररेट डाटा (आधिकारिक दररेट २०८३)
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
let currentUnitMode = 'sqm'; // 'sqm' or 'bigha'
const SQM_PER_DHUR = 16.9315; // 1 Kattha = 338.63 m² = 20 Dhur => 1 Dhur = 16.9315 m²

// 2. Initialization
document.addEventListener('DOMContentLoaded', () => {
    fetch('./malpot-rates.json')
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data) && data.length > 0) {
                malpotRatesData = data;
            }
            initCategoryDropdown();
        })
        .catch(err => {
            console.log("Using default fallback rates data:", err);
            initCategoryDropdown();
        });

    if (localStorage.getItem('malpot-dark-mode') === 'true') {
        document.body.classList.add('dark-mode');
    }
});

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
    catSelect.innerHTML = '';
    malpotRatesData.forEach((cat, index) => {
        const opt = document.createElement('option');
        opt.value = index;
        opt.textContent = cat.category;
        catSelect.appendChild(opt);
    });

    catSelect.value = "0";
    updateSubCategories();
    const subSelect = document.getElementById('subCategorySelect');
    if (subSelect.options.length > 0) {
        subSelect.selectedIndex = 0;
    }
    calculateInstantTax();
}

function onWardOrCategoryChange() {
    updateSubCategories();
    const subSelect = document.getElementById('subCategorySelect');
    if (subSelect.options.length > 0) {
        subSelect.selectedIndex = 0;
    }
    calculateInstantTax();
}

function updateSubCategories() {
    const catIndex = document.getElementById('categorySelect').value;
    const subSelect = document.getElementById('subCategorySelect');
    subSelect.innerHTML = '';

    if (catIndex === "") return;

    const subCats = malpotRatesData[catIndex].subCategories;
    subCats.forEach(sub => {
        const opt = document.createElement('option');
        opt.value = sub.id;
        opt.textContent = `${sub.id} - ${sub.description}`;
        subSelect.appendChild(opt);
    });
}

// 6. Area Unit Switching (Sqm & Bigha only)
function switchUnit(unit) {
    currentUnitMode = unit;
    
    document.querySelectorAll('.unit-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab${unit.charAt(0).toUpperCase() + unit.slice(1)}`).classList.add('active');

    document.getElementById('sqmSection').style.display = (unit === 'sqm') ? 'block' : 'none';
    document.getElementById('bighaSection').style.display = (unit === 'bigha') ? 'block' : 'none';

    calculateInstantTax();
}

function getCurrentTotalDhur() {
    if (currentUnitMode === 'sqm') {
        const sqm = parseFloat(document.getElementById('inputSqm').value) || 0;
        return sqm / SQM_PER_DHUR;
    } else {
        const b = parseFloat(document.getElementById('inputBigha').value) || 0;
        const k = parseFloat(document.getElementById('inputKattha').value) || 0;
        const d = parseFloat(document.getElementById('inputDhur').value) || 0;
        return (b * 400) + (k * 20) + d;
    }
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

// 7. Instant Automatic Calculation Function (Runs live on input/change)
function calculateInstantTax() {
    const wardVal = document.getElementById('wardSelect').value || "1";
    const catIndex = document.getElementById('categorySelect').value;
    const subCatId = document.getElementById('subCategorySelect').value;
    const totalDhur = getCurrentTotalDhur();

    const taxDisplay = document.getElementById('instantTotalTax');
    const wordsDisplay = document.getElementById('instantTotalWords');
    const areaDisplay = document.getElementById('instantAreaDisplay');
    const bkdDisplay = document.getElementById('instantBkdDisplay');
    const breakdownBox = document.getElementById('instantBreakdownBox');

    if (catIndex === "" || !subCatId || totalDhur <= 0) {
        taxDisplay.textContent = 'रु. ०';
        wordsDisplay.textContent = 'अक्षरमा: शून्य रुपैयाँ मात्र';
        areaDisplay.textContent = '० m²';
        bkdDisplay.textContent = '० धुर';
        breakdownBox.textContent = 'क्षेत्रफल प्रविष्टि गर्नासाथ यहाँ स्वतः दररेट र हिसाब विवरण देखिनेछ।';
        return;
    }

    const categoryObj = malpotRatesData[catIndex];
    const subCatObj = categoryObj.subCategories.find(s => s.id === subCatId);
    if (!subCatObj) return;

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

    const totalTax = Math.round(baseTax + extraTax);
    const totalSqm = (totalDhur * SQM_PER_DHUR).toFixed(2);
    const bkdText = formatBKDString(totalDhur);
    const words = convertNumberToNepaliWords(totalTax);

    taxDisplay.textContent = `रु. ${formatCurrency(totalTax)}`;
    wordsDisplay.textContent = `अक्षरमा: ${words} रुपैयाँ मात्र`;
    areaDisplay.textContent = `${toNepaliDigit(totalSqm)} m²`;
    bkdDisplay.textContent = `${bkdText} (${toNepaliDigit(totalDhur.toFixed(1))} धुर)`;

    let breakdownText = `वडा नं. ${toNepaliDigit(wardVal)} | १० धुरसम्म आधार दर: रु. ${toNepaliDigit(rateInfo.base_rate)}`;
    if (extraDhur > 0) {
        breakdownText += ` + बाँकी ${toNepaliDigit(extraDhur.toFixed(1))} धुरको (रु. ${toNepaliDigit(rateInfo.per_dhur_extra)} का दरले): रु. ${toNepaliDigit(extraTax.toFixed(1))}`;
    }
    breakdownBox.textContent = breakdownText;
}

// 8. Dark Mode Toggle
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('malpot-dark-mode', isDark);
}
