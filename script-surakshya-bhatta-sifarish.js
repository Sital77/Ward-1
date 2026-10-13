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
const BENEFICIARY_CACHE_KEY = 'ss_beneficiaries_registry_v2';
const BENEFICIARY_CACHE_TIME_KEY = 'ss_beneficiaries_meta_v2';
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours freshness TTL

let beneficiaryRegister = [];
let isBeneficiaryRegisterLoaded = false;
let beneficiaryLoadPromise = null;
let selectedBeneficiaryCardNo = '';
let searchDebounceTimer = null;
let beneficiarySearchSequence = 0;
window.beneficiaryRegister = beneficiaryRegister;

let currentArchivePage = 1;
const ARCHIVE_PAGE_SIZE = 25;
let archiveSearchDebounceTimer = null;
let isSavingInProgress = false;

// ── Nepali Unicode Normalization Helper ──────────────
function normalizeDevanagari(text) {
    if (!text) return '';
    return String(text)
        .normalize('NFC')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .trim()
        .toLowerCase();
}

function preIndexBeneficiary(item) {
    const rawName = String(item.name || '').trim();
    const rawCard = String(item.cardNo || '').trim();
    const rawAcc = String(item.accountNo || '').trim();
    const rawFather = String(item.fatherName || '').trim();
    const rawSpouse = String(item.spouseName || '').trim();

    item._search = {
        nameNorm: normalizeDevanagari(rawName),
        cardNorm: rawCard.toLowerCase(),
        cardEn: toEnglishDigit(rawCard).toLowerCase(),
        cardNe: toNepaliDigit(rawCard),
        accNorm: rawAcc.toLowerCase(),
        accEn: toEnglishDigit(rawAcc).toLowerCase(),
        accNe: toNepaliDigit(rawAcc),
        familyNorm: normalizeDevanagari((rawFather ? rawFather + ' ' : '') + rawSpouse)
    };
    return item;
}

function preIndexHistoricalRecord(rec) {
    const bName = String(rec.beneficiaryName || rec.name || '').trim();
    const gName = String(rec.guardianName || '').trim();
    const acc = String(rec.accountNo || '').trim();
    const card = String(rec.cardNo || '').trim();
    const chalani = String(rec.chalani || '').trim();
    const miti = String(rec.miti || '').trim();

    rec._search = {
        bNameNorm: normalizeDevanagari(bName),
        gNameNorm: normalizeDevanagari(gName),
        accClean: acc.toLowerCase(),
        accEn: toEnglishDigit(acc).toLowerCase(),
        accNe: toNepaliDigit(acc),
        cardClean: card.toLowerCase(),
        cardEn: toEnglishDigit(card).toLowerCase(),
        cardNe: toNepaliDigit(card),
        chalaniClean: chalani.toLowerCase(),
        chalaniEn: toEnglishDigit(chalani).toLowerCase(),
        chalaniNe: toNepaliDigit(chalani),
        mitiClean: miti.toLowerCase()
    };
    return rec;
}

// Auth ready भएपछि मात्र snapshot listener सुरु गर्ने
(window._firebaseAuthReady || Promise.resolve()).then(() => {
    db.collection("surakshyaBhattaRecords").onSnapshot((snapshot) => {
        globalDatabase = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (!data.isDeleted) {
                globalDatabase.push(preIndexHistoricalRecord({ id: doc.id, ...data }));
            }
        });
        globalDatabase.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        updateGuardianSuggestions();

        // Modal खुला छ भने मात्र तालिका रेन्डर गर्ने (पृष्ठभूमिमा अनावश्यक DOM बन्न नदिने)
        const modal = document.getElementById('abhilekhModal');
        if (modal && modal.style.display === 'flex') {
            renderDatabaseTable();
        }
    });

    // सामाजिक सुरक्षा लाभग्राही दर्ता सूची लोड गर्ने (क्यासबाट तुरुन्तै)
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
//  Excel Beneficiary Register Operations (Firestore Backend & Cache)
// ══════════════════════════════════════════════════════

function hydrateBeneficiariesFromStorage() {
    try {
        const cachedRaw = localStorage.getItem(BENEFICIARY_CACHE_KEY);
        if (!cachedRaw) return false;
        const cached = JSON.parse(cachedRaw);
        if (!Array.isArray(cached) || cached.length === 0) return false;

        beneficiaryRegister = cached.map(preIndexBeneficiary);
        isBeneficiaryRegisterLoaded = true;
        window.beneficiaryRegister = beneficiaryRegister;

        const statusEl = document.getElementById('beneficiaryRegisterStatus');
        if (statusEl) {
            statusEl.innerHTML = `<span style="color:#276749; font-weight:600;">✓ ${toNepaliDigit(beneficiaryRegister.length)} सूचीकृत</span>`;
        }
        updateGuardianSuggestions();
        return true;
    } catch (e) {
        console.warn("Storage cache read failed:", e);
        return false;
    }
}

function saveBeneficiariesToStorage(records) {
    try {
        const cleanList = records.map(r => ({
            cardNo: r.cardNo,
            name: r.name,
            accountNo: r.accountNo,
            allowanceType: r.allowanceType || '',
            fatherName: r.fatherName || '',
            spouseName: r.spouseName || '',
            age: r.age || '',
            address: r.address || '',
            ward: r.ward || '१'
        }));
        localStorage.setItem(BENEFICIARY_CACHE_KEY, JSON.stringify(cleanList));
        localStorage.setItem(BENEFICIARY_CACHE_TIME_KEY, String(Date.now()));
    } catch (e) {
        console.warn("Storage cache write failed:", e);
    }
}

async function loadBeneficiaryRegister(options = {}) {
    const forceRefresh = Boolean(options && options.forceRefresh);

    // 1. क्यासबाट तुरुन्तै लोड (0 ms synchronous hydration)
    if (!forceRefresh && !isBeneficiaryRegisterLoaded) {
        const hydrated = hydrateBeneficiariesFromStorage();
        if (hydrated) {
            const lastSaved = parseInt(localStorage.getItem(BENEFICIARY_CACHE_TIME_KEY) || '0', 10);
            if (Date.now() - lastSaved < CACHE_TTL_MS) {
                return beneficiaryRegister;
            }
        }
    }

    // 2. पहिले नै रिक्वेस्ट चलिरहेको भए सोही promise फर्काउने (Duplicate Request Lock)
    if (beneficiaryLoadPromise) {
        return beneficiaryLoadPromise;
    }

    const statusEl = document.getElementById('beneficiaryRegisterStatus');
    if (statusEl && !isBeneficiaryRegisterLoaded) {
        statusEl.innerHTML = `<span style="color:#2b6cb0; font-weight:600;">⏳ सूची लोड हुँदैछ...</span>`;
    }

    beneficiaryLoadPromise = (async () => {
        try {
            const snapshot = await db.collection("socialSecurityBeneficiaries").get();
            const freshList = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.isDeleted) return;
                const item = {
                    cardNo: String(data.cardNo || doc.id).trim(),
                    name: String(data.name || '').trim(),
                    accountNo: String(data.accountNo || '').trim(),
                    allowanceType: String(data.allowanceType || '').trim(),
                    fatherName: String(data.fatherName || '').trim(),
                    spouseName: String(data.spouseName || '').trim(),
                    age: String(data.age || '').trim(),
                    address: String(data.address || '').trim(),
                    ward: String(data.ward || '१').trim()
                };
                if (item.cardNo && item.name) {
                    freshList.push(preIndexBeneficiary(item));
                }
            });

            if (freshList.length > 0) {
                beneficiaryRegister = freshList;
                isBeneficiaryRegisterLoaded = true;
                window.beneficiaryRegister = beneficiaryRegister;
                saveBeneficiariesToStorage(freshList);
            }

            if (statusEl) {
                statusEl.innerHTML = `<span style="color:#276749; font-weight:600;">✓ ${toNepaliDigit(beneficiaryRegister.length)} सूचीकृत</span>`;
            }
            updateGuardianSuggestions();
            return beneficiaryRegister;
        } catch (err) {
            console.warn("Could not load beneficiary register:", err);
            if (statusEl) {
                if (beneficiaryRegister.length > 0) {
                    statusEl.innerHTML = `<span style="color:#276749; font-weight:600;">✓ ${toNepaliDigit(beneficiaryRegister.length)} सूचीकृत</span>`;
                } else {
                    statusEl.innerHTML = `<span style="color:#e53e3e; font-weight:600;">⚠️ सूची लोड भएन</span> <button onclick="loadBeneficiaryRegister({forceRefresh:true})" style="border:none;background:none;color:#3182ce;cursor:pointer;text-decoration:underline;font-size:0.75rem;">पुनः प्रयास</button>`;
                }
            }
            return beneficiaryRegister;
        } finally {
            beneficiaryLoadPromise = null;
        }
    })();

    return beneficiaryLoadPromise;
}

function onBeneficiarySearchFocus() {
    if (!isBeneficiaryRegisterLoaded) {
        loadBeneficiaryRegister();
    }
    const query = document.getElementById('inBeneficiarySearch').value;
    if (query && query.trim()) {
        renderBeneficiarySearchResults(query, ++beneficiarySearchSequence);
    }
}

function onBeneficiarySearchInput(query) {
    clearTimeout(searchDebounceTimer);
    const clearBtn = document.getElementById('btnClearBeneficiarySearch');
    if (clearBtn) {
        clearBtn.style.display = query && query.trim() ? 'block' : 'none';
    }
    const seq = ++beneficiarySearchSequence;
    searchDebounceTimer = setTimeout(() => {
        renderBeneficiarySearchResults(query, seq);
    }, 280); // Sensible 280ms debounce
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

function renderBeneficiarySearchResults(rawQuery, seq) {
    if (seq !== undefined && seq !== beneficiarySearchSequence) {
        return; // Stale sequence guard: newer search in progress
    }
    const dropdown = document.getElementById('beneficiarySearchResults');
    if (!dropdown) return;

    const query = (rawQuery || '').trim();
    if (!query) {
        dropdown.innerHTML = '';
        dropdown.style.display = 'none';
        return;
    }

    if (!isBeneficiaryRegisterLoaded && beneficiaryRegister.length === 0) {
        dropdown.innerHTML = `<div style="padding: 12px; text-align: center; color: #2b6cb0; font-size: 0.88rem;">⏳ लाभग्राही दर्ता सूची लोड हुँदैछ, कृपया एकछिन प्रतिक्षा गर्नुहोस्...</div>`;
        dropdown.style.display = 'block';
        loadBeneficiaryRegister().then(() => {
            if (seq === undefined || seq === beneficiarySearchSequence) {
                renderBeneficiarySearchResults(rawQuery, seq);
            }
        });
        return;
    }

    const qNorm = normalizeDevanagari(query);
    const qLower = query.toLowerCase();
    const qEn = toEnglishDigit(query).toLowerCase();
    const qNe = toNepaliDigit(query);

    const matches = [];
    for (let i = 0; i < beneficiaryRegister.length; i++) {
        const item = beneficiaryRegister[i];
        const s = item._search;
        if (!s) continue;

        if (s.nameNorm.includes(qNorm) ||
            s.cardNorm.includes(qLower) || s.cardEn.includes(qEn) || s.cardNe.includes(qNe) ||
            s.accNorm.includes(qLower) || s.accEn.includes(qEn) || s.accNe.includes(qNe) ||
            s.familyNorm.includes(qNorm)) {
            matches.push(item);
        }
    }

    if (matches.length === 0) {
        dropdown.innerHTML = `
            <div style="padding: 14px 16px; text-align: center; color: #718096; font-size: 0.88rem; line-height: 1.5;">
                <div style="font-weight: 700; color: #c53030; margin-bottom: 3px;">कुनै विवरण भेटिएन</div>
                <span style="font-size: 0.82rem; color: #a0aec0;">दर्ता सूचीमा कुनै लाभग्राही भेटिएन । कृपया तलका बाकसमा आफैँ नाम, बैंक खाता र परिचयपत्र नं. भर्नुहोस् ।</span>
            </div>
        `;
        dropdown.style.display = 'block';
        return;
    }

    // Limit to top 30 matches for fastest DOM render
    const displayMatches = matches.slice(0, 30);
    let html = '';
    displayMatches.forEach(item => {
        const familyMeta = item.fatherName ? `बाबु: ${item.fatherName}` : (item.spouseName ? `पति/पत्नी: ${item.spouseName}` : '');
        const ageMeta = item.age ? `उमेर: ${toNepaliDigit(item.age)} वर्ष` : '';
        const addrMeta = item.address ? `ठेगाना: ${item.address}` : 'गौरादह १';
        const typeBadge = item.allowanceType ? `<span class="result-type-badge">${item.allowanceType}</span>` : '';
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
        html += `<div style="padding: 7px 12px; font-size: 0.78rem; color: #4a5568; text-align: center; background: #f7fafc; border-top: 1px dashed #e2e8f0; font-weight:600;">थप खोज्न नाम वा परिचयपत्र नं. विस्तृत गर्नुहोस् (जम्मा ${toNepaliDigit(matches.length)} भेटिए)</div>`;
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

    // Check previous recommendation for repeat guardian suggestion
    checkRepeatGuardianSuggestion(item);

    // Check for previous recommendation duplicate / quarterly reuse
    checkDuplicateBeneficiaryRecommendation(item);
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
    const guardianBox = document.getElementById('guardianQuickSuggestion');
    if (guardianBox) guardianBox.style.display = 'none';
}

function checkRepeatGuardianSuggestion(item) {
    const box = document.getElementById('guardianQuickSuggestion');
    if (!box) return;

    if (!item || !globalDatabase || globalDatabase.length === 0) {
        box.style.display = 'none';
        return;
    }

    const prev = globalDatabase.find(r =>
        (item.cardNo && r.cardNo === item.cardNo) ||
        (item.accountNo && r.accountNo === item.accountNo) ||
        (item.name && (r.beneficiaryName === item.name || r.name === item.name))
    );

    if (prev && prev.guardianName && prev.guardianName.trim()) {
        const gName = prev.guardianName.trim();
        const rel = prev.relation || prev.selRelation || 'संरक्षक';
        const citNo = prev.guardianCitNo || '';
        const citDate = prev.guardianCitDate || '';

        box.innerHTML = `
            <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-weight: 700;">💡 अघिल्लो सिफारिसको संरक्षक:</span>
                <span><strong>${gName}</strong> (${rel})</span>
            </div>
            <button type="button" onclick="applyPreviousGuardian('${gName.replace(/'/g, "\\'")}', '${rel.replace(/'/g, "\\'")}', '${citNo.replace(/'/g, "\\'")}', '${citDate.replace(/'/g, "\\'")}')"
                style="background: #276749; color: #fff; border: none; border-radius: 4px; padding: 4px 8px; font-size: 0.8rem; font-weight: 700; cursor: pointer;">
                विवरण भर्नुहोस् 📋
            </button>
        `;
        box.style.display = 'flex';
    } else {
        box.style.display = 'none';
    }
}

function applyPreviousGuardian(name, rel, citNo, citDate) {
    if (document.getElementById('inGuardianName')) {
        document.getElementById('inGuardianName').value = name || '';
    }
    const standardRelations = [
        'छोरा', 'छोरी', 'पति', 'पत्नी', 'बुबा', 'आमा',
        'दाजु', 'भाइ', 'दिदी', 'बहिनी', 'नाति', 'नातिनी', 'बुहारी', 'ज्वाइँ'
    ];
    const selRelEl = document.getElementById('selRelation');
    const customRelEl = document.getElementById('inCustomRelation');
    if (standardRelations.includes(rel)) {
        if (selRelEl) selRelEl.value = rel;
        if (customRelEl) customRelEl.value = '';
    } else {
        if (selRelEl) selRelEl.value = 'अन्य';
        if (customRelEl) customRelEl.value = rel;
    }
    handleRelationChange();

    if (document.getElementById('inGuardianCitNo')) {
        document.getElementById('inGuardianCitNo').value = citNo || '';
    }
    if (document.getElementById('inGuardianCitDate')) {
        document.getElementById('inGuardianCitDate').value = citDate || '';
    }
    const box = document.getElementById('guardianQuickSuggestion');
    if (box) box.style.display = 'none';
    updateDoc();
}

// ══════════════════════════════════════════════════════
//  Quarterly Recommendation Reuse & Duplicate Detection
// ══════════════════════════════════════════════════════
let pendingDuplicateMatches = [];
let pendingBeneficiaryItem = null;

function findMatchingHistoricalRecords(item) {
    if (!item || !globalDatabase || globalDatabase.length === 0) return [];

    const cardEn = toEnglishDigit(item.cardNo || '').trim().toLowerCase();
    const accEn = toEnglishDigit(item.accountNo || '').trim().toLowerCase();

    return globalDatabase.filter(r => {
        if (r.isDeleted) return false;

        // 1. Stable Beneficiary ID check (cardNo / beneficiaryRefId)
        const rCardEn = toEnglishDigit(r.cardNo || r.beneficiaryRefId || '').trim().toLowerCase();
        if (cardEn && rCardEn && cardEn === rCardEn) {
            return true;
        }

        // 2. Fallback check on account number (preserves distinction between people of same name)
        const rAccEn = toEnglishDigit(r.accountNo || '').trim().toLowerCase();
        if (accEn && rAccEn && accEn === rAccEn) {
            return true;
        }

        return false;
    }).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

function checkDuplicateBeneficiaryRecommendation(item) {
    if (!item) return;
    const matches = findMatchingHistoricalRecords(item);
    if (!matches || matches.length === 0) {
        return; // No previous recommendation found
    }

    pendingDuplicateMatches = matches;
    pendingBeneficiaryItem = item;

    showDuplicateConfirmationModal(matches, item);
}

function showDuplicateConfirmationModal(matches, item) {
    const modal = document.getElementById('duplicateRecordModal');
    const container = document.getElementById('duplicateRecordsContainer');
    const msgEl = document.getElementById('duplicateModalMessage');
    if (!modal || !container) return;

    if (msgEl) {
        msgEl.innerText = "यस लाभग्राहीको नाममा यसअघि सामाजिक सुरक्षा भत्ता संरक्षक सिफारिस बनाइएको अभिलेख भेटियो। के तपाईं पुरानो सिफारिसलाई अद्यावधिक गर्न चाहनुहुन्छ?";
    }

    if (matches.length === 1) {
        const rec = matches[0];
        container.innerHTML = `
            <div style="font-size: 0.9rem; line-height: 1.6; color: #2d3748;">
                <div style="margin-bottom: 8px; font-weight: 700; color: #2b6cb0;">
                    👤 लाभग्राही: ${rec.beneficiaryName || item.name}
                    <span style="color: #718096; font-size: 0.82rem; font-weight: normal; margin-left: 6px;">(परिचयपत्र नं: ${toNepaliDigit(rec.cardNo || item.cardNo)})</span>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #fff; padding: 10px 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <div><strong>📅 अघिल्लो मिति:</strong> <span style="color: #c53030; font-weight: 700;">${toNepaliDigit(rec.miti || '-')}</span></div>
                    <div><strong>📄 च.नं.:</strong> ${toNepaliDigit(rec.chalani || '-')}</div>
                    <div><strong>🤝 अघिल्लो संरक्षक:</strong> ${rec.guardianName || '-'} (${rec.relation || '-'})</div>
                    <div><strong>💰 अघिल्लो किस्ता:</strong> ${rec.kista || '-'}</div>
                </div>
                <div style="margin-top: 8px; font-size: 0.8rem; color: #718096; display: flex; justify-content: space-between;">
                    <span>अभिलेख संकेत (ID): <code style="background: #edf2f7; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem;">${rec.id}</code></span>
                    <span>${rec.timestamp ? formatTimestamp(rec.timestamp) : ''}</span>
                </div>
            </div>
        `;
    } else {
        let listHtml = `
            <div style="font-size: 0.88rem; margin-bottom: 8px; color: #4a5568;">
                यस लाभग्राहीका जम्मा <strong>${toNepaliDigit(matches.length)}</strong> वटा अघिल्ला सिफारिसहरू भेटिए। कृपया अद्यावधिक गर्न चाहेको सिफारिस छान्नुहोस्:
            </div>
        `;
        matches.forEach((rec, idx) => {
            const isChecked = idx === 0 ? 'checked' : '';
            listHtml += `
                <label style="display: flex; gap: 10px; padding: 8px 10px; background: #fff; border: 1.5px solid ${idx === 0 ? '#3182ce' : '#e2e8f0'}; border-radius: 8px; margin-bottom: 6px; cursor: pointer; align-items: flex-start; transition: border-color 0.15s;">
                    <input type="radio" name="duplicateRecordChoice" value="${rec.id}" ${isChecked} style="margin-top: 4px;">
                    <div style="font-size: 0.86rem; line-height: 1.45; flex-grow: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <strong style="color: #2b6cb0;">📅 मिति: ${toNepaliDigit(rec.miti || '-')}</strong>
                            <span style="font-size: 0.8rem; color: #718096;">च.नं: ${toNepaliDigit(rec.chalani || '-')}</span>
                        </div>
                        <div style="color: #4a5568; margin-top: 2px;">संरक्षक: <strong>${rec.guardianName || '-'}</strong> (${rec.relation || '-'}) | किस्ता: ${rec.kista || '-'}</div>
                        <div style="font-size: 0.76rem; color: #a0aec0; margin-top: 2px;">अभिलेख आईडी: ${rec.id}</div>
                    </div>
                </label>
            `;
        });
        container.innerHTML = listHtml;
    }

    modal.style.display = 'flex';
}

function closeDuplicateModal() {
    const modal = document.getElementById('duplicateRecordModal');
    if (modal) modal.style.display = 'none';
}

function handleDuplicateChoice(choice) {
    closeDuplicateModal();

    if (choice === 'update') {
        let selectedId = '';
        if (pendingDuplicateMatches.length === 1) {
            selectedId = pendingDuplicateMatches[0].id;
        } else {
            const checkedRadio = document.querySelector('input[name="duplicateRecordChoice"]:checked');
            selectedId = checkedRadio ? checkedRadio.value : (pendingDuplicateMatches[0] ? pendingDuplicateMatches[0].id : '');
        }

        if (selectedId) {
            applyQuarterlyUpdate(selectedId);
        }
    } else {
        // 'new': Continue with normal new recommendation workflow
        document.getElementById('editRecordIndex').value = '';
        const btnNew = document.getElementById('btnNewForm');
        if (btnNew) btnNew.style.display = 'none';
        document.getElementById('formMainTitle').innerText = '🛡️ सामाजिक सुरक्षा भत्ता संरक्षक सिफारिस';
        // Keep populated beneficiary details from registry, ensure authoritative current date
        initializeAutomaticDate();
        updateDoc();
    }
}

function applyQuarterlyUpdate(recordId) {
    const rec = globalDatabase.find(r => r.id === recordId);
    if (!rec) return;

    if (window.NepalSambat && typeof window.NepalSambat.setCurrentRecord === 'function') {
        window.NepalSambat.setCurrentRecord(rec);
    }

    // 1. Open or reuse existing recommendation record (preserving ID)
    document.getElementById('editRecordIndex').value = rec.id;
    document.getElementById('formMainTitle').innerText = "🔄 अद्यावधिक मोड: " + (rec.beneficiaryName || rec.name || '');

    // 2. Populate form with existing beneficiary details
    document.getElementById('inBeneficiaryName').value = rec.beneficiaryName || rec.name || '';
    document.getElementById('inAccountNo').value = (rec.accountNo !== undefined && rec.accountNo !== null) ? String(rec.accountNo) : '';
    document.getElementById('inCardNo').value = rec.cardNo || '';

    selectedBeneficiaryCardNo = rec.cardNo || rec.beneficiaryRefId || '';
    window._selectedBeneficiaryCardNo = selectedBeneficiaryCardNo;
    const searchInput = document.getElementById('inBeneficiarySearch');
    if (searchInput) searchInput.value = rec.beneficiaryName || rec.name || '';
    const clearBtn = document.getElementById('btnClearBeneficiarySearch');
    if (clearBtn) clearBtn.style.display = 'block';

    showSelectedBeneficiaryBadge({
        name: rec.beneficiaryName || rec.name || '',
        cardNo: selectedBeneficiaryCardNo,
        allowanceType: ''
    });

    // Populate guardian details
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

    // Bank & Subject
    document.getElementById('inBankName').value = rec.bankName || 'कृषि विकास बैंक लिमिटेड';
    document.getElementById('inBankBranch').value = rec.bankBranch || 'गौरादह शाखा, झापा';
    document.getElementById('inSubject').value = rec.subject || 'सिफारिस सम्बन्धमा ।';

    // Signatory
    document.getElementById('inSignAuthority').value = rec.signAuth || 'नगेन्द्र भण्डारी|वडा अध्यक्ष';
    document.getElementById('inCustomSignName').value = rec.customSignName || '';
    document.getElementById('inCustomSignTitle').value = rec.customSignTitle || '';
    toggleCustomSign();

    const margin = rec.sigMargin || '40';
    document.getElementById('inSigMargin').value = margin;
    adjustSignaturePosition(margin);

    // Fiscal quarter from previous record (editable by user)
    if (document.getElementById('selKista') && rec.kista) {
        document.getElementById('selKista').value = rec.kista;
    }

    // 3. Automatically set recommendation date to CURRENT Nepal date
    initializeAutomaticDate();

    // Allow updating chalani
    if (rec.chalani && rec.chalani !== '-') {
        document.getElementById('inChalani').value = rec.chalani;
    }

    const btnNew = document.getElementById('btnNewForm');
    if (btnNew) btnNew.style.display = 'inline-block';

    updateDoc();
}

function updateGuardianSuggestions() {
    const datalist = document.getElementById('guardianSuggestionsList');
    if (!datalist) return;
    const names = new Set();

    globalDatabase.forEach(r => {
        if (r.guardianName && r.guardianName.trim()) {
            names.add(r.guardianName.trim());
        }
    });

    beneficiaryRegister.forEach(b => {
        if (b.fatherName && b.fatherName.trim()) names.add(b.fatherName.trim());
        if (b.spouseName && b.spouseName.trim()) names.add(b.spouseName.trim());
    });

    let html = '';
    names.forEach(n => {
        html += `<option value="${n}"></option>`;
    });
    datalist.innerHTML = html;
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
        try { localStorage.removeItem(BENEFICIARY_CACHE_KEY); } catch (ce) {}
        await loadBeneficiaryRegister({ forceRefresh: true });
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

    // Update Beneficiary Summary Table (तपसिल)
    const lblTblBeneficiary = document.getElementById('lblTblBeneficiaryName');
    if (lblTblBeneficiary) lblTblBeneficiary.innerText = beneficiaryName || '..................';

    const lblTblAcc = document.getElementById('lblTblAccountNo');
    if (lblTblAcc) lblTblAcc.innerText = accountNo || '..................';

    const lblTblCard = document.getElementById('lblTblCardNo');
    if (lblTblCard) lblTblCard.innerText = cardNo || '..................';

    const lblTblGrd = document.getElementById('lblTblGuardianName');
    if (lblTblGrd) lblTblGrd.innerText = guardianName || '..................';

    const lblTblRel = document.getElementById('lblTblRelation');
    if (lblTblRel) lblTblRel.innerText = relation || '..................';

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

    if (isSavingInProgress) return;
    isSavingInProgress = true;

    const btn = document.querySelector('.btn-print');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = "⏳ सुरक्षित हुँदैछ...";
    }

    try {
        let savedDocId = recordId;
        if (recordId !== "") {
            const existingRec = globalDatabase.find(r => r.id === recordId);
            if (existingRec && existingRec.miti && existingRec.miti !== obj.miti) {
                const historyEntry = {
                    miti: existingRec.miti,
                    kista: existingRec.kista || 'प्रथम त्रैमासिक',
                    chalani: existingRec.chalani || '-',
                    timestamp: existingRec.timestamp || Date.now(),
                    archivedAt: Date.now()
                };
                obj.quarterlyHistory = Array.isArray(existingRec.quarterlyHistory)
                    ? [...existingRec.quarterlyHistory, historyEntry]
                    : [historyEntry];
            }
            obj.lastUpdatedAt = Date.now();
            await db.collection("surakshyaBhattaRecords").doc(recordId).update(obj);
        } else {
            const docRef = await db.collection("surakshyaBhattaRecords").add(obj);
            savedDocId = docRef.id;
            document.getElementById('editRecordIndex').value = savedDocId;
            document.getElementById('formMainTitle').innerText = "🔄 सम्पादन मोड: " + beneficiaryName;
        }

        // इन-मेमोरी क्यास तुरुन्तै अपडेट गर्ने (० ms लेग)
        const memoryRec = preIndexHistoricalRecord({ id: savedDocId, ...obj });
        const existingIdx = globalDatabase.findIndex(r => r.id === savedDocId);
        if (existingIdx !== -1) {
            globalDatabase[existingIdx] = memoryRec;
        } else {
            globalDatabase.unshift(memoryRec);
        }
        updateGuardianSuggestions();

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
        isSavingInProgress = false;
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

// ── Database Operations (Paginated & Debounced) ──────
function onArchiveSearchInput(val) {
    clearTimeout(archiveSearchDebounceTimer);
    const clearBtn = document.getElementById('btnClearArchiveSearch');
    if (clearBtn) {
        clearBtn.style.display = val && val.trim() ? 'block' : 'none';
    }
    archiveSearchDebounceTimer = setTimeout(() => {
        currentArchivePage = 1;
        renderDatabaseTable();
    }, 250);
}

function clearArchiveSearch() {
    const field = document.getElementById('searchField');
    if (field) field.value = '';
    const clearBtn = document.getElementById('btnClearArchiveSearch');
    if (clearBtn) clearBtn.style.display = 'none';
    currentArchivePage = 1;
    renderDatabaseTable();
}

function changeArchivePage(newPage) {
    currentArchivePage = newPage;
    renderDatabaseTable();
}

function renderDatabaseTable() {
    const tbody = document.getElementById('dbTableBody');
    if (!tbody) return;

    const modal = document.getElementById('abhilekhModal');
    // यदि मोडल बन्द छ भने अनावश्यक DOM अपडेट नगर्ने
    if (modal && modal.style.display === 'none') {
        return;
    }

    const searchInput = document.getElementById('searchField');
    const rawQuery = searchInput ? searchInput.value.trim() : '';
    const qNorm = normalizeDevanagari(rawQuery);
    const qLower = rawQuery.toLowerCase();
    const qEn = toEnglishDigit(rawQuery).toLowerCase();
    const qNe = toNepaliDigit(rawQuery);

    const filtered = globalDatabase.filter(rec => {
        if (!rawQuery) return true;
        const s = rec._search;
        if (!s) return true;

        return s.bNameNorm.includes(qNorm) ||
               s.gNameNorm.includes(qNorm) ||
               s.cardClean.includes(qLower) || s.cardEn.includes(qEn) || s.cardNe.includes(qNe) ||
               s.accClean.includes(qLower) || s.accEn.includes(qEn) || s.accNe.includes(qNe) ||
               s.chalaniClean.includes(qLower) || s.chalaniEn.includes(qEn) || s.chalaniNe.includes(qNe) ||
               s.mitiClean.includes(qLower);
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / ARCHIVE_PAGE_SIZE));

    if (currentArchivePage > totalPages) {
        currentArchivePage = totalPages;
    }
    if (currentArchivePage < 1) {
        currentArchivePage = 1;
    }

    const startIndex = (currentArchivePage - 1) * ARCHIVE_PAGE_SIZE;
    const endIndex = Math.min(startIndex + ARCHIVE_PAGE_SIZE, total);
    const pageRecords = filtered.slice(startIndex, endIndex);

    const summaryEl = document.getElementById('dbTableSummary');
    if (summaryEl) {
        if (total === 0) {
            summaryEl.innerHTML = `<span style="color:#718096; font-size:0.85rem;">कुनै रेकर्ड फेला परेन</span>`;
        } else {
            summaryEl.innerHTML = `
                <span>जम्मा <strong>${toNepaliDigit(total)}</strong> वटा सिफारिस रेकर्डहरू ${rawQuery ? `(खोजी: "${rawQuery}")` : ''}</span>
                <span>देखाइएको: <strong>${toNepaliDigit(startIndex + 1)}–${toNepaliDigit(endIndex)}</strong></span>
            `;
        }
    }

    tbody.innerHTML = '';

    if (total === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:#718096; font-size:0.95rem;">⚠️ कुनै विवरण भेटिएन ।</td></tr>`;
        const paginationEl = document.getElementById('dbTablePagination');
        if (paginationEl) paginationEl.innerHTML = '';
        return;
    }

    const fragment = document.createDocumentFragment();
    pageRecords.forEach((rec, idx) => {
        const row = document.createElement('tr');
        const relationStr = rec.relation ? ` (${rec.relation})` : '';
        const rowNum = startIndex + idx + 1;
        row.innerHTML = `
            <td>${toNepaliDigit(rowNum)}</td>
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
        fragment.appendChild(row);
    });
    tbody.appendChild(fragment);

    const paginationEl = document.getElementById('dbTablePagination');
    if (paginationEl) {
        if (totalPages <= 1) {
            paginationEl.innerHTML = `<span style="color:#718096; font-size:0.83rem;">पृष्ठ १ / १ (जम्मा ${toNepaliDigit(total)} रेकर्ड)</span>`;
        } else {
            paginationEl.innerHTML = `
                <div style="display:flex; gap:6px; align-items:center;">
                    <button type="button" onclick="changeArchivePage(1)" ${currentArchivePage === 1 ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : 'style="cursor:pointer;"'} class="btn-action" style="padding:4px 8px; font-size:0.8rem; background:#edf2f7; border:1px solid #cbd5e0; border-radius:4px;">⏮️ पहिलो</button>
                    <button type="button" onclick="changeArchivePage(${currentArchivePage - 1})" ${currentArchivePage === 1 ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : 'style="cursor:pointer;"'} class="btn-action" style="padding:4px 8px; font-size:0.8rem; background:#edf2f7; border:1px solid #cbd5e0; border-radius:4px;">◀ अघिल्लो</button>
                </div>
                <div style="font-weight:700; color:#2b6cb0; font-size:0.88rem;">
                    पृष्ठ ${toNepaliDigit(currentArchivePage)} / ${toNepaliDigit(totalPages)} (जम्मा ${toNepaliDigit(total)})
                </div>
                <div style="display:flex; gap:6px; align-items:center;">
                    <button type="button" onclick="changeArchivePage(${currentArchivePage + 1})" ${currentArchivePage === totalPages ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : 'style="cursor:pointer;"'} class="btn-action" style="padding:4px 8px; font-size:0.8rem; background:#edf2f7; border:1px solid #cbd5e0; border-radius:4px;">अर्को ▶</button>
                    <button type="button" onclick="changeArchivePage(${totalPages})" ${currentArchivePage === totalPages ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : 'style="cursor:pointer;"'} class="btn-action" style="padding:4px 8px; font-size:0.8rem; background:#edf2f7; border:1px solid #cbd5e0; border-radius:4px;">अन्तिम ⏭️</button>
                </div>
            `;
        }
    }
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

// Explicit window exports for module interoperability & testing
window.toggleModal = toggleModal;
window.renderDatabaseTable = renderDatabaseTable;
window.onArchiveSearchInput = onArchiveSearchInput;
window.clearArchiveSearch = clearArchiveSearch;
window.changeArchivePage = changeArchivePage;
window.applyPreviousGuardian = applyPreviousGuardian;
window.updateGuardianSuggestions = updateGuardianSuggestions;
window.loadBeneficiaryRegister = loadBeneficiaryRegister;
window.onBeneficiarySearchInput = onBeneficiarySearchInput;
window.selectBeneficiary = selectBeneficiary;
window.clearBeneficiarySearch = clearBeneficiarySearch;
window.loadRecordToForm = loadRecordToForm;
window.deleteRecord = deleteRecord;
window.resetForm = resetForm;
window.updateDoc = updateDoc;
window.printAndSaveSystem = printAndSaveSystem;
window.hydrateBeneficiariesFromStorage = hydrateBeneficiariesFromStorage;
window.checkDuplicateBeneficiaryRecommendation = checkDuplicateBeneficiaryRecommendation;
window.findMatchingHistoricalRecords = findMatchingHistoricalRecords;
window.showDuplicateConfirmationModal = showDuplicateConfirmationModal;
window.closeDuplicateModal = closeDuplicateModal;
window.handleDuplicateChoice = handleDuplicateChoice;
window.applyQuarterlyUpdate = applyQuarterlyUpdate;

