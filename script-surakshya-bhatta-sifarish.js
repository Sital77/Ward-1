// ══════════════════════════════════════════════════════
//  script-surakshya-bhatta-sifarish.js
//  सामाजिक सुरक्षा भत्ता संरक्षक सिफारिस — Firebase Firestore Logic
// ══════════════════════════════════════════════════════

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

let globalDatabase = [];
window.globalDatabase = globalDatabase;

// ── Social Security Beneficiary Register State (Excel / Firestore) ──
let beneficiaryRegister = [];
let isBeneficiaryRegisterLoaded = false;
let selectedBeneficiaryCardNo = '';
let searchDebounceTimer = null;
window.beneficiaryRegister = beneficiaryRegister;

// Auth ready भएपछि मात्र snapshot listener सुरु गर्ने
(window._firebaseAuthReady || Promise.resolve()).then(() => {
    db.collection("surakshyaBhattaRecords").onSnapshot((snapshot) => {
        globalDatabase = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (!data.isDeleted) {
                globalDatabase.push({ id: doc.id, ...data });
            }
        });
        globalDatabase.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        renderDatabaseTable();
    });

    // सामाजिक सुरक्षा लाभग्राही दर्ता सूची लोड गर्ने
    loadBeneficiaryRegister();
}).catch(() => {});

// ── Helpers ─────────────────────────────────────────
function toNepaliDigit(num) {
    if (num === null || num === undefined) return '';
    const nd = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return num.toString().split('').map(d => (d >= '0' && d <= '9') ? nd[d] : d).join('');
}

function toEnglishDigit(str) {
    if (!str) return '';
    const nepToEng = {'०':'0','१':'1','२':'2','३':'3','४':'4','५':'5','६':'6','७':'7','८':'8','९':'9'};
    return String(str).replace(/[०-९]/g, m => nepToEng[m]);
}

function getSelectedAY() {
    const aySelect = document.getElementById('inPatraSankhya');
    return aySelect ? aySelect.value : '';
}

// ── Custom Field Toggles ─────────────────────────────
function handleRelationChange() {
    const selEl = document.getElementById('selRelation');
    const sel = selEl ? selEl.value : '';
    const grp = document.getElementById('customRelationGroup');
    if (grp) grp.style.display = (sel === 'अन्य' || sel === 'CUSTOM') ? 'block' : 'none';
}

function toggleCustomSign() {
    const val = document.getElementById('inSignAuthority').value;
    const box = document.getElementById('customSignBox');
    if (box) box.style.display = (val === 'CUSTOM') ? 'grid' : 'none';
}

function adjustSignaturePosition(value) {
    const marginEl = document.getElementById('marginVal');
    if (marginEl) marginEl.innerText = toNepaliDigit(value) + " px";
    const docFooter = document.getElementById('docFooterSection');
    if (docFooter) docFooter.style.marginTop = value + "px";
}

// ══════════════════════════════════════════════════════
//  Excel Beneficiary Register Operations (Firestore Backend)
// ══════════════════════════════════════════════════════

async function loadBeneficiaryRegister() {
    try {
        const statusEl = document.getElementById('beneficiaryRegisterStatus');
        if (statusEl) statusEl.innerText = 'रजिष्टर लोड हुँदैछ...';

        const snapshot = await db.collection("socialSecurityBeneficiaries").get();
        beneficiaryRegister = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            beneficiaryRegister.push({
                cardNo: String(data.cardNo || doc.id).trim(),
                name: String(data.name || '').trim(),
                accountNo: String(data.accountNo || '').trim(),
                allowanceType: String(data.allowanceType || '').trim(),
                fatherName: String(data.fatherName || '').trim(),
                spouseName: String(data.spouseName || '').trim(),
                age: String(data.age || '').trim(),
                address: String(data.address || '').trim(),
                ward: String(data.ward || '१').trim()
            });
        });
        isBeneficiaryRegisterLoaded = true;
        window.beneficiaryRegister = beneficiaryRegister;
        if (statusEl) {
            statusEl.innerText = `${toNepaliDigit(beneficiaryRegister.length)} सूचीकृत`;
        }
    } catch (err) {
        console.warn("Could not load beneficiary register:", err);
        const statusEl = document.getElementById('beneficiaryRegisterStatus');
        if (statusEl) statusEl.innerText = '';
    }
}

function onBeneficiarySearchFocus() {
    if (!isBeneficiaryRegisterLoaded) {
        loadBeneficiaryRegister();
    }
    const query = document.getElementById('inBeneficiarySearch').value;
    if (query && query.trim()) {
        renderBeneficiarySearchResults(query);
    }
}

function onBeneficiarySearchInput(query) {
    clearTimeout(searchDebounceTimer);
    const clearBtn = document.getElementById('btnClearBeneficiarySearch');
    if (clearBtn) {
        clearBtn.style.display = query && query.trim() ? 'block' : 'none';
    }
    searchDebounceTimer = setTimeout(() => {
        renderBeneficiarySearchResults(query);
    }, 120);
}

function clearBeneficiarySearch() {
    const input = document.getElementById('inBeneficiarySearch');
    if (input) input.value = '';
    const clearBtn = document.getElementById('btnClearBeneficiarySearch');
    if (clearBtn) clearBtn.style.display = 'none';
    const dropdown = document.getElementById('beneficiarySearchResults');
    if (dropdown) {
        dropdown.innerHTML = '';
        dropdown.style.display = 'none';
    }
}

function renderBeneficiarySearchResults(rawQuery) {
    const query = (rawQuery || '').trim().toLowerCase();
    const dropdown = document.getElementById('beneficiarySearchResults');
    if (!dropdown) return;

    if (!query) {
        dropdown.innerHTML = '';
        dropdown.style.display = 'none';
        return;
    }

    if (!isBeneficiaryRegisterLoaded && beneficiaryRegister.length === 0) {
        dropdown.innerHTML = `<div style="padding: 12px; text-align: center; color: #4a5568; font-size: 0.88rem;">⏳ लाभग्राही दर्ता सूची लोड हुँदैछ, कृपया एकछिन प्रतिक्षा गर्नुहोस्...</div>`;
        dropdown.style.display = 'block';
        loadBeneficiaryRegister().then(() => renderBeneficiarySearchResults(rawQuery));
        return;
    }

    const queryEn = toEnglishDigit(query);
    const queryNe = toNepaliDigit(query);

    const matches = beneficiaryRegister.filter(item => {
        const nameLower = item.name.toLowerCase();
        const cardStr = item.cardNo.toLowerCase();
        const cardEn = toEnglishDigit(cardStr);
        const cardNe = toNepaliDigit(cardStr);
        const accStr = item.accountNo.toLowerCase();
        const accEn = toEnglishDigit(accStr);
        const accNe = toNepaliDigit(accStr);

        return nameLower.includes(query) ||
               cardStr.includes(query) || cardEn.includes(queryEn) || cardNe.includes(queryNe) ||
               accStr.includes(query) || accEn.includes(queryEn) || accNe.includes(queryNe);
    });

    if (matches.length === 0) {
        dropdown.innerHTML = `
            <div style="padding: 12px 14px; text-align: center; color: #718096; font-size: 0.88rem; line-height: 1.5;">
                ⚠️ दर्ता सूचीमा कुनै लाभग्राही भेटिएन ।<br>
                <span style="font-size: 0.82rem; color: #a0aec0;">कृपया तलका बाकसमा आफैँ नाम, बैंक खाता र परिचयपत्र नं. भर्नुहोस् ।</span>
            </div>
        `;
        dropdown.style.display = 'block';
        return;
    }

    // Limit to top 40 matches for speed
    const displayMatches = matches.slice(0, 40);
    let html = '';
    displayMatches.forEach(item => {
        const familyMeta = item.fatherName ? `बाबु: ${item.fatherName}` : (item.spouseName ? `पति/पत्नी: ${item.spouseName}` : '');
        const ageMeta = item.age ? `उमेर: ${toNepaliDigit(item.age)} वर्ष` : '';
        const addrMeta = item.address ? `ठेगाना: ${item.address}` : 'गौरादह १';
        const typeBadge = item.allowanceType ? `<span class="result-type-badge">${item.allowanceType}</span>` : '';

        // Safe card escaping
        const safeCardNo = item.cardNo.replace(/'/g, "\\'");

        html += `
            <div class="beneficiary-result-item" onclick="selectBeneficiary('${safeCardNo}')" title="यो लाभग्राही चयन गर्नुहोस्">
                <div class="result-primary">
                    <span class="result-name">👤 ${item.name}</span>
                    ${typeBadge}
                </div>
                <div class="result-meta">
                    <span class="result-meta-item"><span class="result-meta-label">परिचय नं:</span> <strong>${toNepaliDigit(item.cardNo)}</strong></span>
                    <span class="result-meta-item"><span class="result-meta-label">खाता नं:</span> ${toNepaliDigit(item.accountNo)}</span>
                    ${familyMeta ? `<span class="result-meta-item">${familyMeta}</span>` : ''}
                    ${ageMeta ? `<span class="result-meta-item">${ageMeta}</span>` : ''}
                    <span class="result-meta-item">${addrMeta}</span>
                </div>
            </div>
        `;
    });

    if (matches.length > displayMatches.length) {
        html += `<div style="padding: 6px 12px; font-size: 0.78rem; color: #718096; text-align: center; background: #f7fafc; border-top: 1px dashed #e2e8f0;">थप खोज्न नाम वा परिचयपत्र नं. विस्तृत गर्नुहोस् (जम्मा ${toNepaliDigit(matches.length)} भेटिए)</div>`;
    }

    dropdown.innerHTML = html;
    dropdown.style.display = 'block';
}

function selectBeneficiary(cardNo) {
    const item = beneficiaryRegister.find(b => b.cardNo === cardNo);
    if (!item) return;

    selectedBeneficiaryCardNo = item.cardNo;
    window._selectedBeneficiaryCardNo = item.cardNo;

    // Populate EXACTLY the three fields from Excel:
    // 1. पुरा नाम -> लाभग्राहीको नाम, थर
    const inName = document.getElementById('inBeneficiaryName');
    if (inName) inName.value = item.name || '';

    // 2. बैंक खाता नं. -> बैंक खाता नम्बर (string, preserve leading zeros)
    const inAcc = document.getElementById('inAccountNo');
    if (inAcc) inAcc.value = String(item.accountNo || '').trim();

    // 3. व्यक्तिगत परिचय नं. -> सामाजिक सुरक्षा परिचयपत्र नं.
    const inCard = document.getElementById('inCardNo');
    if (inCard) inCard.value = String(item.cardNo || '').trim();

    // Close search dropdown
    const dropdown = document.getElementById('beneficiarySearchResults');
    if (dropdown) dropdown.style.display = 'none';

    // Update search box text
    const searchInput = document.getElementById('inBeneficiarySearch');
    if (searchInput) searchInput.value = item.name;

    const clearBtn = document.getElementById('btnClearBeneficiarySearch');
    if (clearBtn) clearBtn.style.display = 'block';

    // Show selection badge
    showSelectedBeneficiaryBadge(item);

    // Update preview (preserves guardian and kista)
    updateDoc();
}

function showSelectedBeneficiaryBadge(item) {
    const badge = document.getElementById('selectedBeneficiaryBadge');
    const nameEl = document.getElementById('selectedBeneficiaryNameText');
    const metaEl = document.getElementById('selectedBeneficiaryMetaText');

    if (badge && nameEl) {
        nameEl.innerText = item.name || '';
        if (metaEl) {
            metaEl.innerText = `(परिचयपत्र नं: ${toNepaliDigit(item.cardNo)}${item.allowanceType ? ' | ' + item.allowanceType : ''})`;
        }
        badge.style.display = 'flex';
    }
}

function unlinkSelectedBeneficiary() {
    selectedBeneficiaryCardNo = '';
    window._selectedBeneficiaryCardNo = '';
    const badge = document.getElementById('selectedBeneficiaryBadge');
    if (badge) badge.style.display = 'none';
}

// ── In-browser Excel Register Import / Sync Tool ──
function triggerExcelImport() {
    const picker = document.getElementById('inExcelFilePicker');
    if (picker) picker.click();
}

async function handleExcelFileSelect(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!confirm(`के तपाईं "${file.name}" बाट सामाजिक सुरक्षा लाभग्राही सूची अद्यावधिक गर्न चाहनुहुन्छ?`)) {
        e.target.value = '';
        return;
    }

    try {
        const text = await file.text();
        let records = [];
        if (text.includes('<tr') || text.includes('<TR')) {
            records = parseHtmlTableBeneficiaries(text, file.name);
        } else {
            records = parseCsvBeneficiaries(text, file.name);
        }

        if (!records || records.length === 0) {
            alert("फाइलमा कुनै वैध लाभग्राही रेकर्ड भेटिएन । आवश्यक महलहरू (पुरा नाम, बैंक खाता नं., व्यक्तिगत परिचय नं.) जाँच गर्नुहोस् ।");
            e.target.value = '';
            return;
        }

        const btn = document.querySelector('.btn-import-excel');
        const origText = btn ? btn.innerText : '';
        if (btn) btn.innerText = "⏳ अद्यावधिक हुँदैछ...";

        // Batch upload in chunks of 400
        const batchSize = 400;
        let committedCount = 0;
        for (let i = 0; i < records.length; i += batchSize) {
            const batchChunk = records.slice(i, i + batchSize);
            const batch = db.batch();
            batchChunk.forEach(item => {
                const docRef = db.collection("socialSecurityBeneficiaries").doc(item.cardNo);
                batch.set(docRef, item, { merge: true });
            });
            await batch.commit();
            committedCount += batchChunk.length;
        }

        if (btn) btn.innerText = origText;
        alert(`सफलतापूर्वक ${toNepaliDigit(committedCount)} लाभग्राहीको विवरण सुरक्षित/अद्यावधिक गरियो ।`);
        await loadBeneficiaryRegister();
    } catch (err) {
        console.error("Excel import error:", err);
        alert("एक्सेल आयात गर्दा समस्या भयो! कृपया फाइलको ढाँचा जाँच्नुहोस् ।");
    } finally {
        e.target.value = '';
    }
}

function parseHtmlTableBeneficiaries(html, sourceName) {
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    const tdRegex = /<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi;
    const stripTags = str => str.replace(/<[^>]+>/g, '').replace(/&nbsp;/gi, ' ').trim();

    let trMatch;
    const rows = [];
    while ((trMatch = trRegex.exec(html)) !== null) {
        const rowContent = trMatch[1];
        let tdMatch;
        const cells = [];
        while ((tdMatch = tdRegex.exec(rowContent)) !== null) {
            cells.push(stripTags(tdMatch[1]));
        }
        if (cells.length > 0) rows.push(cells);
    }

    if (rows.length < 2) return [];

    const headers = rows[0];
    const colMap = {};
    headers.forEach((h, idx) => { colMap[h] = idx; });

    const reqCols = ['पुरा नाम', 'बैंक खाता नं.', 'व्यक्तिगत परिचय नं.'];
    for (const req of reqCols) {
        if (colMap[req] === undefined) {
            console.error("Required column missing:", req);
            return [];
        }
    }

    const idxName = colMap['पुरा नाम'];
    const idxAcc = colMap['बैंक खाता नं.'];
    const idxCard = colMap['व्यक्तिगत परिचय नं.'];
    const idxType = colMap['सामाजिक सुरक्षाको किसिम'] ?? -1;
    const idxFather = colMap['बाबुको नाम'] ?? -1;
    const idxSpouse = colMap['पति/पत्नीको नाम'] ?? -1;
    const idxAge = colMap['उमेर'] ?? -1;
    const idxAddr = colMap['ठेगाना'] ?? -1;

    const seenIds = new Set();
    const records = [];

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length <= Math.max(idxName, idxAcc, idxCard)) continue;

        const cardNo = String(row[idxCard] || '').trim();
        const name = String(row[idxName] || '').trim();
        const accNo = String(row[idxAcc] || '').trim();

        if (!cardNo || !name || seenIds.has(cardNo)) continue;
        seenIds.add(cardNo);

        records.push({
            cardNo: cardNo,
            name: name,
            accountNo: accNo,
            allowanceType: (idxType !== -1 && row[idxType]) ? String(row[idxType]).trim() : '',
            fatherName: (idxFather !== -1 && row[idxFather]) ? String(row[idxFather]).trim() : '',
            spouseName: (idxSpouse !== -1 && row[idxSpouse]) ? String(row[idxSpouse]).trim() : '',
            age: (idxAge !== -1 && row[idxAge]) ? String(row[idxAge]).trim() : '',
            address: (idxAddr !== -1 && row[idxAddr]) ? String(row[idxAddr]).trim() : '',
            ward: '१',
            sourceFile: sourceName,
            updatedAt: Date.now()
        });
    }

    return records;
}

function parseCsvBeneficiaries(csv, sourceName) {
    const lines = csv.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) return [];

    const parseLine = line => {
        const result = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"' && (i === 0 || line[i - 1] !== '\\')) {
                inQuotes = !inQuotes;
            } else if (ch === ',' && !inQuotes) {
                result.push(cur.trim().replace(/^"|"$/g, ''));
                cur = '';
            } else {
                cur += ch;
            }
        }
        result.push(cur.trim().replace(/^"|"$/g, ''));
        return result;
    };

    const headers = parseLine(lines[0]);
    const colMap = {};
    headers.forEach((h, idx) => { colMap[h] = idx; });

    const reqCols = ['पुरा नाम', 'बैंक खाता नं.', 'व्यक्तिगत परिचय नं.'];
    for (const req of reqCols) {
        if (colMap[req] === undefined) return [];
    }

    const idxName = colMap['पुरा नाम'];
    const idxAcc = colMap['बैंक खाता नं.'];
    const idxCard = colMap['व्यक्तिगत परिचय नं.'];
    const idxType = colMap['सामाजिक सुरक्षाको किसिम'] ?? -1;
    const idxFather = colMap['बाबुको नाम'] ?? -1;
    const idxSpouse = colMap['पति/पत्नीको नाम'] ?? -1;
    const idxAge = colMap['उमेर'] ?? -1;
    const idxAddr = colMap['ठेगाना'] ?? -1;

    const seenIds = new Set();
    const records = [];

    for (let i = 1; i < lines.length; i++) {
        const row = parseLine(lines[i]);
        if (row.length <= Math.max(idxName, idxAcc, idxCard)) continue;

        const cardNo = String(row[idxCard] || '').trim();
        const name = String(row[idxName] || '').trim();
        const accNo = String(row[idxAcc] || '').trim();

        if (!cardNo || !name || seenIds.has(cardNo)) continue;
        seenIds.add(cardNo);

        records.push({
            cardNo: cardNo,
            name: name,
            accountNo: accNo,
            allowanceType: (idxType !== -1 && row[idxType]) ? String(row[idxType]).trim() : '',
            fatherName: (idxFather !== -1 && row[idxFather]) ? String(row[idxFather]).trim() : '',
            spouseName: (idxSpouse !== -1 && row[idxSpouse]) ? String(row[idxSpouse]).trim() : '',
            age: (idxAge !== -1 && row[idxAge]) ? String(row[idxAge]).trim() : '',
            address: (idxAddr !== -1 && row[idxAddr]) ? String(row[idxAddr]).trim() : '',
            ward: '१',
            sourceFile: sourceName,
            updatedAt: Date.now()
        });
    }

    return records;
}

// Close search dropdown on outside click
document.addEventListener('click', function(e) {
    const container = document.getElementById('beneficiaryLookupContainer');
    const dropdown = document.getElementById('beneficiarySearchResults');
    if (container && dropdown && !container.contains(e.target)) {
        dropdown.style.display = 'none';
    }
});

function resetForm() {
    if (window.NepalSambat && typeof window.NepalSambat.clearCurrentRecord === 'function') {
        window.NepalSambat.clearCurrentRecord();
    }
    document.getElementById('editRecordIndex').value = '';
    document.getElementById('formMainTitle').innerText = '🛡️ सामाजिक सुरक्षा भत्ता संरक्षक सिफारिस';
    const btnNew = document.getElementById('btnNewForm');
    if (btnNew) btnNew.style.display = 'none';

    // Clear beneficiary search state
    clearBeneficiarySearch();
    unlinkSelectedBeneficiary();

    // Clear beneficiary
    document.getElementById('inBeneficiaryName').value = '';
    document.getElementById('inAccountNo').value = '';
    document.getElementById('inCardNo').value = '';
    if (document.getElementById('selKista')) {
        document.getElementById('selKista').value = 'प्रथम त्रैमासिक';
    }

    // Clear guardian
    if (document.getElementById('selRelation')) {
        document.getElementById('selRelation').value = 'छोरा';
    }
    if (document.getElementById('inCustomRelation')) {
        document.getElementById('inCustomRelation').value = '';
    }
    handleRelationChange();

    document.getElementById('inGuardianName').value = '';
    document.getElementById('inGuardianCitNo').value = '';
    document.getElementById('inGuardianCitDate').value = '';

    // Reset signatory & margin
    document.getElementById('inSignAuthority').value = 'नगेन्द्र भण्डारी|वडा अध्यक्ष';
    document.getElementById('inCustomSignName').value = '';
    document.getElementById('inCustomSignTitle').value = '';
    toggleCustomSign();
    document.getElementById('inSigMargin').value = '40';
    adjustSignaturePosition(40);

    initializeAutomaticDate();
    updateDoc();
}

// ── Modal toggle ─────────────────────────────────────
function toggleModal(show) {
    const modal = document.getElementById('abhilekhModal');
    if (modal) modal.style.display = show ? 'flex' : 'none';
    if (show) renderDatabaseTable();
}

// ── Live Preview Updater ──────────────────────────────
function updateDoc() {
    const ay = getSelectedAY();
    const chalani = toNepaliDigit(document.getElementById('inChalani').value.trim());
    const miti = toNepaliDigit(document.getElementById('inMiti').value.trim());
    const ns = toNepaliDigit(document.getElementById('inNepalSamvat').value.trim());

    // Bank and Subject
    const bankName = document.getElementById('inBankName').value.trim() || 'कृषि विकास बैंक लिमिटेड';
    const bankBranch = document.getElementById('inBankBranch').value.trim() || 'गौरादह शाखा, झापा';
    const subject = document.getElementById('inSubject').value.trim() || 'सिफारिस सम्बन्धमा ।';

    // Beneficiary
    const beneficiaryName = document.getElementById('inBeneficiaryName').value.trim();
    // Preserve leading zeros: treat as string
    const rawAccountNo = (document.getElementById('inAccountNo').value !== undefined && document.getElementById('inAccountNo').value !== null)
        ? String(document.getElementById('inAccountNo').value).trim()
        : '';
    const accountNo = toNepaliDigit(rawAccountNo);
    const rawCardNo = document.getElementById('inCardNo').value.trim();
    const cardNo = toNepaliDigit(rawCardNo);

    // Payment Quarter (भुक्तानी किस्ता)
    const kistaEl = document.getElementById('selKista');
    const kista = (kistaEl && kistaEl.value) ? kistaEl.value : 'प्रथम त्रैमासिक';

    // Guardian
    const selRel = document.getElementById('selRelation') ? document.getElementById('selRelation').value : 'छोरा';
    let relation = selRel;
    if (selRel === 'अन्य' || selRel === 'CUSTOM') {
        relation = document.getElementById('inCustomRelation').value.trim() || 'संरक्षक';
    }
    const guardianName = document.getElementById('inGuardianName').value.trim();

    // Guardian Citizenship
    const rawCitNo = document.getElementById('inGuardianCitNo').value.trim();
    const citNo = toNepaliDigit(rawCitNo);
    const rawCitDate = document.getElementById('inGuardianCitDate').value.trim();
    const citDate = toNepaliDigit(rawCitDate);

    // Update Letterhead
    const lblAY = document.getElementById('lblAY');
    if (lblAY) lblAY.innerText = ay;
    const lblPatraSankhya = document.getElementById('lblPatraSankhya');
    if (lblPatraSankhya && !lblAY) lblPatraSankhya.innerText = ay;

    const lblChalani = document.getElementById('lblChalani');
    if (lblChalani) lblChalani.innerText = chalani;
    const lblMiti = document.getElementById('lblMiti');
    if (lblMiti) lblMiti.innerText = miti || '........';
    const lblNS = document.getElementById('lblNepalSamvat');
    if (lblNS) lblNS.innerText = (window.NepalSambat && window.NepalSambat.formatPrint) ? window.NepalSambat.formatPrint(ns, miti) : (ns || '........');

    // Update Bank & Subject
    const lblBankName = document.getElementById('lblBankName');
    if (lblBankName) lblBankName.innerText = bankName;
    const lblBankBranch = document.getElementById('lblBankBranch');
    if (lblBankBranch) lblBankBranch.innerText = bankBranch;
    const lblSubject = document.getElementById('lblSubject');
    if (lblSubject) lblSubject.innerText = subject;

    // Update Body Text Placeholders
    const lblBeneficiary = document.getElementById('lblBeneficiaryName');
    if (lblBeneficiary) lblBeneficiary.innerText = beneficiaryName || '..................';

    const lblAcc = document.getElementById('lblAccountNo');
    if (lblAcc) lblAcc.innerText = accountNo || '.........................';

    // Both occurrences of भुक्तानी किस्ता
    const lblKista1 = document.getElementById('lblKista1');
    if (lblKista1) lblKista1.innerText = kista;
    const lblKista2 = document.getElementById('lblKista2');
    if (lblKista2) lblKista2.innerText = kista;

    const lblRel = document.getElementById('lblRelation');
    if (lblRel) lblRel.innerText = relation || 'संरक्षक';

    const lblGrd = document.getElementById('lblGuardianName');
    if (lblGrd) lblGrd.innerText = guardianName || '..................';

    const lblCitNo = document.getElementById('lblGuardianCitNo');
    if (lblCitNo) lblCitNo.innerText = citNo || '..................';

    const lblCitDate = document.getElementById('lblGuardianCitDate');
    if (lblCitDate) lblCitDate.innerText = citDate || '..................';

    // Update Beneficiary Summary Table
    const lblTblBeneficiary = document.getElementById('lblTblBeneficiaryName');
    if (lblTblBeneficiary) lblTblBeneficiary.innerText = beneficiaryName || '..................';

    const lblTblAcc = document.getElementById('lblTblAccountNo');
    if (lblTblAcc) lblTblAcc.innerText = accountNo || '..................';

    const rowTblCard = document.getElementById('rowTblCardNo');
    const lblTblCard = document.getElementById('lblTblCardNo');
    if (rowTblCard) {
        if (cardNo) {
            rowTblCard.style.display = '';
            if (lblTblCard) lblTblCard.innerText = cardNo;
        } else {
            rowTblCard.style.display = 'none';
        }
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
            sigName = document.getElementById('inCustomSignName').value.trim() || '....................';
            sigTitle = document.getElementById('inCustomSignTitle').value.trim() || '....................';
        } else {
            const signData = signSelect.split('|');
            sigName = signData[0] || '';
            sigTitle = signData[1] || '';
        }
    }
    if (lblSigName) lblSigName.innerText = sigName;
    if (lblSigTitle) lblSigTitle.innerText = sigTitle;
}

// ── Date Automation ───────────────────────────────────
function initializeAutomaticDate() {
    try {
        let nepaliBSDateStr = "";
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
            const adYear = today.getFullYear();
            const adMonth = today.getMonth() + 1;
            const adDay = today.getDate();
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
            bsYearVal = bsY;
            bsMonthVal = bsM;
            let bsD = adDay >= 16 ? adDay - 15 : adDay + 16;
            if (bsD > 32) bsD = 30;
            const bsDayVal = bsD;
            const bsMStr = String(bsMonthVal).padStart(2, '0');
            const bsDStr = String(bsDayVal).padStart(2, '0');
            nepaliBSDateStr = toNepaliDigit(`${bsYearVal}/${bsMStr}/${bsDStr}`);
        }

        initializeFiscalYear(bsYearVal, bsMonthVal);

        const inMiti = document.getElementById('inMiti');
        if (inMiti) inMiti.value = nepaliBSDateStr;

        const inNepalSamvat = document.getElementById('inNepalSamvat');
        if (inNepalSamvat) inNepalSamvat.value = '११४६';

        updateDoc();
        fetchCurrentNepalSambat();
    } catch (e) {}
}

function formatFiscalYear(startYear) {
    const endYear = startYear + 1;
    const endYearSuffix = String(endYear).slice(-2);
    return toNepaliDigit(`${startYear}/0${endYearSuffix}`);
}

function initializeFiscalYear(bsYear, bsMonth) {
    try {
        let currentStartYear = bsYear;
        if (bsMonth < 4) currentStartYear = bsYear - 1;

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

function updateNepalSambatFromMiti() {
    if (window.NepalSambat && typeof window.NepalSambat.updateNepalSambatFromMiti === 'function') {
        window.NepalSambat.updateNepalSambatFromMiti();
        return;
    }
    const inNS = document.getElementById('inNepalSamvat');
    if (inNS && !inNS.value) {
        inNS.value = '११४६';
        if (typeof updateDoc === 'function') updateDoc();
    }
}

async function fetchCurrentNepalSambat() {
    if (window.NepalSambat && typeof window.NepalSambat.getCurrentRecord === 'function' && window.NepalSambat.getCurrentRecord()) {
        return;
    }
    const editIdx = document.getElementById('editRecordIndex');
    if (editIdx && editIdx.value) {
        return;
    }
    if (window.NepalSambat && typeof window.NepalSambat.updateNepalSambatFromMiti === 'function') {
        window.NepalSambat.updateNepalSambatFromMiti();
        return;
    }
    const inNS = document.getElementById('inNepalSamvat');
    if (inNS && !inNS.value) {
        inNS.value = '११४६';
        if (typeof updateDoc === 'function') updateDoc();
    }
}

// ── Print & Save ──────────────────────────────────────
async function printAndSaveSystem() {
    const beneficiaryName = document.getElementById('inBeneficiaryName').value.trim();
    if (!beneficiaryName) {
        alert("कृपया सामाजिक सुरक्षा लाभग्राहीको नाम, थर अनिवार्य लेख्नुहोस् ।");
        document.getElementById('inBeneficiaryName').focus();
        return;
    }

    const guardianName = document.getElementById('inGuardianName').value.trim();
    if (!guardianName) {
        alert("कृपया रकम बुझ्ने संरक्षकको नाम, थर अनिवार्य लेख्नुहोस् ।");
        document.getElementById('inGuardianName').focus();
        return;
    }

    const recordId = document.getElementById('editRecordIndex').value;

    const selRel = document.getElementById('selRelation') ? document.getElementById('selRelation').value : 'छोरा';
    const customRel = document.getElementById('inCustomRelation') ? document.getElementById('inCustomRelation').value.trim() : '';
    const relation = (selRel === 'अन्य' || selRel === 'CUSTOM')
        ? (customRel || 'संरक्षक')
        : selRel;

    const kistaEl = document.getElementById('selKista');
    const kista = (kistaEl && kistaEl.value) ? kistaEl.value : 'प्रथम त्रैमासिक';

    const accountNo = document.getElementById('inAccountNo').value.trim();
    const cardNo = document.getElementById('inCardNo').value.trim();
    const guardianCitNo = document.getElementById('inGuardianCitNo').value.trim();
    const guardianCitDate = document.getElementById('inGuardianCitDate').value.trim();

    const obj = {
        ay:                   getSelectedAY(),
        chalani:              document.getElementById('inChalani').value.trim() || '-',
        miti:                 document.getElementById('inMiti').value.trim() || '-',
        ns:                   document.getElementById('inNepalSamvat').value.trim() || '-',
        bankName:             document.getElementById('inBankName').value.trim() || 'कृषि विकास बैंक लिमिटेड',
        bankBranch:           document.getElementById('inBankBranch').value.trim() || 'गौरादह शाखा, झापा',
        subject:              document.getElementById('inSubject').value.trim() || 'सिफारिस सम्बन्धमा ।',
        beneficiaryName:      beneficiaryName,
        name:                 beneficiaryName, // standard search field alias
        accountNo:            accountNo,
        cardNo:               cardNo,
        hasCardNo:            Boolean(cardNo),
        beneficiaryRefId:     selectedBeneficiaryCardNo || '',
        kista:                kista,
        relation:             relation,
        selRelation:          selRel,
        customRelation:       customRel,
        guardianName:         guardianName,
        guardianCitNo:        guardianCitNo,
        guardianCitDate:      guardianCitDate,
        hasGuardianCit:       Boolean(guardianCitNo),
        signAuth:             document.getElementById('inSignAuthority').value,
        customSignName:       document.getElementById('inCustomSignName').value.trim(),
        customSignTitle:      document.getElementById('inCustomSignTitle').value.trim(),
        sigMargin:            document.getElementById('inSigMargin').value,
        createdBy:            localStorage.getItem('sifarish_user') || 'wada1',
        createdWard:          localStorage.getItem('sifarish_ward') || '1',
        hasNepalSambatTithi:  true,
        nsFeatureVersion:     1,
        nsRolloutCommit:      'd2ba29cef12ba2cfdd7cb211861af69f57880811',
        timestamp:            Date.now()
    };

    const btn = document.querySelector('.btn-print');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = "⏳ सुरक्षित हुँदैछ...";
    }

    try {
        if (recordId !== "") {
            await db.collection("surakshyaBhattaRecords").doc(recordId).update(obj);
        } else {
            const docRef = await db.collection("surakshyaBhattaRecords").add(obj);
            document.getElementById('editRecordIndex').value = docRef.id;
            document.getElementById('formMainTitle').innerText = "🔄 सम्पादन मोड: " + beneficiaryName;
        }
        const btnNew = document.getElementById('btnNewForm');
        if (btnNew) btnNew.style.display = 'inline-block';

        if (document.fonts) {
            try { await document.fonts.ready; } catch (fe) {}
        }
        const banner = document.querySelector('.svg-letterhead-banner');
        if (banner && banner.decode) {
            try { await banner.decode(); } catch (ie) {}
        }

        window.print();
    } catch (e) {
        console.error(e);
        if (confirm("क्लाउडमा डाटा सुरक्षित गर्दा समस्या भयो! इन्टरनेट नहुँदा पनि प्रिन्ट गर्न चाहनुहुन्छ?")) {
            window.print();
        }
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
    const queryEn = (window.toEnglishDigit || (x => x))(query);
    const queryNe = (window.toNepaliDigit || (x => x))(query);

    const filtered = globalDatabase.filter(rec => {
        if (!query) return true;
        const bName = (rec.beneficiaryName || rec.name || '').toLowerCase();
        const gName = (rec.guardianName || '').toLowerCase();
        const acc = (rec.accountNo || '').toLowerCase();
        const accEn = (window.toEnglishDigit || (x => x))(acc);
        const accNe = (window.toNepaliDigit || (x => x))(acc);
        const chalani = (rec.chalani || '').toLowerCase();
        const chalaniEn = (window.toEnglishDigit || (x => x))(chalani);
        const chalaniNe = (window.toNepaliDigit || (x => x))(chalani);
        const card = (rec.cardNo || '').toLowerCase();

        return bName.includes(query) ||
               gName.includes(query) ||
               card.includes(query) ||
               acc.includes(query) || acc.includes(queryNe) || accEn.includes(queryEn) || accNe.includes(queryNe) ||
               chalani.includes(query) || chalaniEn.includes(queryEn) || chalaniNe.includes(queryNe);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:18px; color:#a0aec0;">कुनै रेकर्ड भेटिएन ।</td></tr>`;
        return;
    }

    filtered.forEach((rec, index) => {
        const row = document.createElement('tr');
        const relationStr = rec.relation ? ` (${rec.relation})` : '';
        row.innerHTML = `
            <td>${toNepaliDigit(index + 1)}</td>
            <td><b>${rec.beneficiaryName || rec.name || '-'}</b></td>
            <td>${toNepaliDigit(rec.accountNo || '-')}</td>
            <td>${rec.guardianName || '-'}${relationStr}</td>
            <td>${formatTimestamp(rec.timestamp)}</td>
            <td>
                <div style="display:flex; gap:6px; justify-content:center;">
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

    if (window.NepalSambat && typeof window.NepalSambat.setCurrentRecord === 'function') {
        window.NepalSambat.setCurrentRecord(rec);
    }

    if (!confirm("के तपाईं यो रेकर्ड सम्पादन गर्न चाहनुहुन्छ? यसले हालको फारमको डाटा प्रतिस्थापन गर्नेछ ।")) {
        return;
    }

    document.getElementById('editRecordIndex').value = rec.id;
    document.getElementById('formMainTitle').innerText = "🔄 सम्पादन मोड: " + (rec.beneficiaryName || '');

    // Letterhead
    const inPS = document.getElementById('inPatraSankhya');
    if (inPS) inPS.value = rec.ay || '';
    document.getElementById('inChalani').value = rec.chalani !== '-' ? rec.chalani : '';
    document.getElementById('inMiti').value = rec.miti !== '-' ? rec.miti : '';
    document.getElementById('inNepalSamvat').value = rec.ns !== '-' ? rec.ns : '';

    // Bank & Subject
    document.getElementById('inBankName').value = rec.bankName || 'कृषि विकास बैंक लिमिटेड';
    document.getElementById('inBankBranch').value = rec.bankBranch || 'गौरादह शाखा, झापा';
    document.getElementById('inSubject').value = rec.subject || 'सिफारिस सम्बन्धमा ।';

    // Beneficiary
    document.getElementById('inBeneficiaryName').value = rec.beneficiaryName || rec.name || '';
    // Preserve leading zeros and safe handling
    document.getElementById('inAccountNo').value = (rec.accountNo !== undefined && rec.accountNo !== null) ? String(rec.accountNo) : '';
    document.getElementById('inCardNo').value = rec.cardNo || '';
    if (document.getElementById('selKista')) {
        document.getElementById('selKista').value = rec.kista || 'प्रथम त्रैमासिक';
    }

    // Restore beneficiary reference if present, without overwriting saved historical text
    selectedBeneficiaryCardNo = rec.beneficiaryRefId || '';
    window._selectedBeneficiaryCardNo = selectedBeneficiaryCardNo;
    if (selectedBeneficiaryCardNo) {
        const regItem = beneficiaryRegister.find(b => b.cardNo === selectedBeneficiaryCardNo);
        if (regItem) {
            showSelectedBeneficiaryBadge(regItem);
        } else {
            showSelectedBeneficiaryBadge({
                name: rec.beneficiaryName || rec.name || '',
                cardNo: selectedBeneficiaryCardNo,
                allowanceType: ''
            });
        }
        const searchInput = document.getElementById('inBeneficiarySearch');
        if (searchInput) searchInput.value = rec.beneficiaryName || rec.name || '';
        const clearBtn = document.getElementById('btnClearBeneficiarySearch');
        if (clearBtn) clearBtn.style.display = 'block';
    } else {
        unlinkSelectedBeneficiary();
        const searchInput = document.getElementById('inBeneficiarySearch');
        if (searchInput) searchInput.value = '';
        const clearBtn = document.getElementById('btnClearBeneficiarySearch');
        if (clearBtn) clearBtn.style.display = 'none';
    }

    // Guardian
    const standardRelations = [
        'छोरा', 'छोरी', 'पति', 'पत्नी', 'बुबा', 'आमा',
        'दाजु', 'भाइ', 'दिदी', 'बहिनी', 'नाति', 'नातिनी', 'बुहारी', 'ज्वाइँ'
    ];
    const selRelEl = document.getElementById('selRelation');
    const customRelEl = document.getElementById('inCustomRelation');

    let matchedRelation = rec.selRelation || rec.relation || 'छोरा';
    if (standardRelations.includes(matchedRelation)) {
        if (selRelEl) selRelEl.value = matchedRelation;
        if (customRelEl) customRelEl.value = '';
    } else if (matchedRelation === 'श्रीमान') {
        if (selRelEl) selRelEl.value = 'पति';
        if (customRelEl) customRelEl.value = '';
    } else if (matchedRelation === 'श्रीमती') {
        if (selRelEl) selRelEl.value = 'पत्नी';
        if (customRelEl) customRelEl.value = '';
    } else if (matchedRelation === 'दाइ') {
        if (selRelEl) selRelEl.value = 'दाजु';
        if (customRelEl) customRelEl.value = '';
    } else {
        if (selRelEl) selRelEl.value = 'अन्य';
        if (customRelEl) customRelEl.value = rec.customRelation || rec.relation || '';
    }
    handleRelationChange();

    document.getElementById('inGuardianName').value = rec.guardianName || '';
    document.getElementById('inGuardianCitNo').value = rec.guardianCitNo || '';
    document.getElementById('inGuardianCitDate').value = rec.guardianCitDate || '';

    // Signature authority
    document.getElementById('inSignAuthority').value = rec.signAuth || 'नगेन्द्र भण्डारी|वडा अध्यक्ष';
    document.getElementById('inCustomSignName').value = rec.customSignName || '';
    document.getElementById('inCustomSignTitle').value = rec.customSignTitle || '';
    toggleCustomSign();

    // Signature margin spacing
    const margin = rec.sigMargin || '40';
    document.getElementById('inSigMargin').value = margin;
    adjustSignaturePosition(margin);

    updateDoc();
    const btnNew = document.getElementById('btnNewForm');
    if (btnNew) btnNew.style.display = 'inline-block';
    toggleModal(false);
}

async function deleteRecord(id) {
    const rec = globalDatabase.find(r => r.id === id);
    if (!rec) return;

    if (window.NepalSambat && typeof window.NepalSambat.setCurrentRecord === 'function') {
        window.NepalSambat.setCurrentRecord(rec);
    }

    if (!confirm(`के तपाईं "${rec.beneficiaryName || 'यो रेकर्ड'}" लाई रद्दीको टोकरीमा पठाउन चाहनुहुन्छ?`)) {
        return;
    }

    try {
        if (typeof window.softDeleteRecord === 'function') {
            await window.softDeleteRecord('surakshyaBhattaRecords', id, {
                title: rec.beneficiaryName || rec.name || '',
                name: rec.beneficiaryName || rec.name || '',
                beneficiaryName: rec.beneficiaryName || rec.name || '',
                guardianName: rec.guardianName || '',
                accountNo: rec.accountNo || '',
                chalani: rec.chalani || '',
                type: 'सामाजिक सुरक्षा भत्ता संरक्षक सिफारिस'
            });
        } else {
            await db.collection("surakshyaBhattaRecords").doc(id).delete();
        }
        alert("रेकर्ड सफलतापूर्वक सुरक्षित रूपमा हटाइयो ।");
    } catch (e) {
        console.error(e);
        alert("रेकर्ड हटाउन समस्या भयो! इन्टरनेट कनेक्सन जाँच्नुहोस् ।");
    }
}

// Page Bootstrap Init
window.onload = function () {
    initializeAutomaticDate();
    adjustSignaturePosition(40);
};

window.addEventListener('templateInjected', function () {
    initializeAutomaticDate();
});
