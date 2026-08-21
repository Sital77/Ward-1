// ══════════════════════════════════════════════════════
//  script-bibaha-pramanit.js
//  विवाह प्रमाणित सिफारिस — Firebase Firestore & UI Logic
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

// Track if user explicitly edited husband or wife sections directly
let husbandDirectlyEdited = false;
let wifeDirectlyEdited = false;

// Auth ready भएपछि मात्र snapshot listener start गर्ने
(window._firebaseAuthReady || Promise.resolve()).then(() => {
    db.collection("bibahaRecords").onSnapshot((snapshot) => {
        globalDatabase = [];
        snapshot.forEach((doc) => {
            globalDatabase.push({ id: doc.id, ...doc.data() });
        });
        globalDatabase.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        renderDatabaseTable();
    });
}).catch(() => {});

// ── Helpers ─────────────────────────────────────────
function toNepaliDigit(num) {
    if (num === null || num === undefined) return '';
    const nd = ['०','१','२','३','४','५','६','७','८','९'];
    return num.toString().split('').map(d => nd[d] || d).join('');
}

function getSelectedAY() {
    const el = document.getElementById('inPatraSankhya');
    return el ? el.value : '२०८३/०८४';
}

function getSelectedApplicantType() {
    const radios = document.getElementsByName('appTypeRadio');
    for (const r of radios) { if (r.checked) return r.value; }
    return 'wife';
}

// ── Custom Field Toggles ─────────────────────────────
function toggleCustomReceiver() {
    const radios = document.getElementsByName('recRadio');
    let isCustom = false;
    for (const r of radios) {
        if (r.checked && r.value === 'CUSTOM') {
            isCustom = true;
            break;
        }
    }
    const input = document.getElementById('inCustomReceiver');
    if (input) input.style.display = isCustom ? 'block' : 'none';
}

function toggleHusbandGrandpa() {
    const chk = document.getElementById('chkHusbandGrandpa');
    const sec = document.getElementById('husbandGrandpaSection');
    if (sec) sec.style.display = chk.checked ? 'block' : 'none';
}

function toggleHusbandParents() {
    const chk = document.getElementById('chkHusbandParents');
    const sec = document.getElementById('husbandParentsSection');
    if (sec) sec.style.display = chk.checked ? 'block' : 'none';
}

function toggleHusbandCit() {
    const chk = document.getElementById('chkHusbandCit');
    const sec = document.getElementById('husbandCitSection');
    if (sec) sec.style.display = chk.checked ? 'block' : 'none';
}

function toggleWifeGrandpa() {
    const chk = document.getElementById('chkWifeGrandpa');
    const sec = document.getElementById('wifeGrandpaSection');
    if (sec) sec.style.display = chk.checked ? 'block' : 'none';
}

function toggleWifeParents() {
    const chk = document.getElementById('chkWifeParents');
    const sec = document.getElementById('wifeParentsSection');
    if (sec) sec.style.display = chk.checked ? 'block' : 'none';
}

function toggleWifeCit() {
    const chk = document.getElementById('chkWifeCit');
    const sec = document.getElementById('wifeCitSection');
    if (sec) sec.style.display = chk.checked ? 'block' : 'none';
}

function togglePhotoClauseSection() {
    const chk = document.getElementById('chkPhotoClause');
    const coupleSec = document.getElementById('marriageCoupleSection');
    if (coupleSec) {
        coupleSec.style.display = (chk && chk.checked) ? 'flex' : 'none';
    }
}

function toggleCustomSign() {
    const val = document.getElementById('inSignAuthority').value;
    const box = document.getElementById('customSignBox');
    if (box) box.style.display = (val === 'CUSTOM') ? 'grid' : 'none';
}

function adjustSignaturePosition(value) {
    const lbl = document.getElementById('marginVal');
    if (lbl) lbl.innerText = toNepaliDigit(value) + " px";
    const sec = document.getElementById('docFooterSection');
    if (sec) sec.style.marginTop = value + "px";
}

// ── Smart Sync Between Applicant & Couple ──────────────
function handleApplicantRadioClick(type) {
    if (type === 'husband') {
        const hName = document.getElementById('inHusbandName').value.trim();
        const hDist = document.getElementById('inHusbandDistrict').value.trim();
        const hMuni = document.getElementById('inHusbandMuni').value.trim();
        const hWada = document.getElementById('inHusbandWada').value.trim();
        const hCit  = document.getElementById('inHusbandCitNo').value.trim();

        if (hName) document.getElementById('inApplicantName').value = hName;
        if (hDist) document.getElementById('inApplicantDistrict').value = hDist;
        if (hMuni) document.getElementById('inApplicantMuni').value = hMuni;
        if (hWada) document.getElementById('inApplicantWada').value = hWada;
        if (hCit)  document.getElementById('inApplicantCitNo').value = hCit;
    } else if (type === 'wife') {
        const wName = document.getElementById('inWifeName').value.trim();
        const hDist = document.getElementById('inHusbandDistrict').value.trim();
        const wDist = document.getElementById('inWifeDistrict').value.trim();
        const hMuni = document.getElementById('inHusbandMuni').value.trim();
        const wMuni = document.getElementById('inWifeMuni').value.trim();
        const hWada = document.getElementById('inHusbandWada').value.trim();
        const wWada = document.getElementById('inWifeWada').value.trim();
        const wCit  = document.getElementById('inWifeCitNo').value.trim();

        if (wName) document.getElementById('inApplicantName').value = wName;
        document.getElementById('inApplicantDistrict').value = hDist || wDist || 'झापा';
        document.getElementById('inApplicantMuni').value     = hMuni || wMuni || 'गौरादह नगरपालिका';
        document.getElementById('inApplicantWada').value     = hWada || wWada || '१';
        if (wCit)  document.getElementById('inApplicantCitNo').value = wCit;
    }
}

function handleApplicantFieldInput(field) {
    const appType = getSelectedApplicantType();

    if (appType === 'husband' && !husbandDirectlyEdited) {
        if (field === 'name') {
            document.getElementById('inHusbandName').value = document.getElementById('inApplicantName').value;
        } else if (field === 'district') {
            document.getElementById('inHusbandDistrict').value = document.getElementById('inApplicantDistrict').value;
        } else if (field === 'muni') {
            document.getElementById('inHusbandMuni').value = document.getElementById('inApplicantMuni').value;
        } else if (field === 'wada') {
            document.getElementById('inHusbandWada').value = document.getElementById('inApplicantWada').value;
        } else if (field === 'citNo') {
            document.getElementById('inHusbandCitNo').value = document.getElementById('inApplicantCitNo').value;
        }
    } else if (appType === 'wife' && !wifeDirectlyEdited) {
        if (field === 'name') {
            document.getElementById('inWifeName').value = document.getElementById('inApplicantName').value;
        } else if (field === 'citNo') {
            document.getElementById('inWifeCitNo').value = document.getElementById('inApplicantCitNo').value;
        }
    }
}

function handleHusbandDirectInput(field) {
    husbandDirectlyEdited = true;
}

function handleWifeDirectInput(field) {
    wifeDirectlyEdited = true;
}

// ── Smart Marriage Date Formatter ─────────────────────
function formatMarriageDateText(inputDate) {
    if (!inputDate || !inputDate.trim()) {
        return '.................... गतेमा';
    }

    let val = inputDate.trim();

    // If user already typed explicit 'सालमा' or 'गतेमा'
    if (val.includes('सालमा') || val.includes('गतेमा')) {
        return val;
    }
    if (val.endsWith('गते')) {
        return val.replace(/गते$/, 'गतेमा');
    }
    if (val.endsWith('साल')) {
        return val.replace(/साल$/, 'सालमा');
    }

    // Check if input is Year Only (e.g. 4 digits like 2078, २०७८, 2048, २०४८)
    const isYearOnly = /^[०-९0-9]{4}$/.test(val);

    if (isYearOnly) {
        return `${val} सालमा`;
    } else {
        return `${val} गतेमा`;
    }
}

// ── Live Document Preview Updater ─────────────────────
function updateDoc() {
    const ay      = getSelectedAY();
    const chalani = document.getElementById('inChalani').value || '';
    const miti    = document.getElementById('inMiti').value || '';
    const ns      = document.getElementById('inNepalSamvat').value || '';

    // Letterhead
    if (document.getElementById('lblAY')) document.getElementById('lblAY').innerText = ay;
    if (document.getElementById('lblChalani')) document.getElementById('lblChalani').innerText = chalani;
    if (document.getElementById('lblMiti')) document.getElementById('lblMiti').innerText = miti;
    if (document.getElementById('lblNepalSamvat')) document.getElementById('lblNepalSamvat').innerText = ns;

    // Receiver
    const recRadios = document.getElementsByName('recRadio');
    let recVal = 'जो जस सँग सम्बन्धित छ ।';
    for (const r of recRadios) {
        if (r.checked) {
            if (r.value === 'CUSTOM') {
                recVal = (document.getElementById('inCustomReceiver').value || '....................') + ' ।';
            } else {
                recVal = r.value + ' ।';
            }
            break;
        }
    }
    if (document.getElementById('lblReceiver')) document.getElementById('lblReceiver').innerText = recVal;

    // ── Applicant details in Preview ──
    const appDist = document.getElementById('inApplicantDistrict').value.trim() || 'झापा';
    const appMuni = document.getElementById('inApplicantMuni').value.trim() || 'गौरादह नगरपालिका';
    const appWada = document.getElementById('inApplicantWada').value.trim() || '१';
    const appName = document.getElementById('inApplicantName').value.trim() || '....................';
    const appCit  = document.getElementById('inApplicantCitNo').value.trim();

    if (document.getElementById('lblApplicantDistrict')) document.getElementById('lblApplicantDistrict').innerText = appDist;
    if (document.getElementById('lblApplicantMuni')) document.getElementById('lblApplicantMuni').innerText = appMuni;
    if (document.getElementById('lblApplicantWada')) document.getElementById('lblApplicantWada').innerText = toNepaliDigit(appWada);
    if (document.getElementById('lblApplicantName')) document.getElementById('lblApplicantName').innerText = appName;
    if (document.getElementById('lblApplicantCit')) {
        document.getElementById('lblApplicantCit').innerText = appCit ? ` (ना.प्र.नं.${appCit})` : '';
    }

    // ── Husband details in Preview ──
    const hDist = document.getElementById('inHusbandDistrict').value.trim() || 'झापा';
    const hMuni = document.getElementById('inHusbandMuni').value.trim() || 'गौरादह नगरपालिका';
    const hWada = document.getElementById('inHusbandWada').value.trim() || '१';
    const hName = document.getElementById('inHusbandName').value.trim() || '....................';
    
    if (document.getElementById('lblHusbandAddress')) {
        document.getElementById('lblHusbandAddress').innerText = `${hDist} जिल्ला ${hMuni} वडा नं.${toNepaliDigit(hWada)}`;
    }
    if (document.getElementById('lblHusbandName')) {
        document.getElementById('lblHusbandName').innerText = hName;
    }

    // Husband Lineage (Grandpa directly without 'बाजे' prefix)
    const hasHGrandpa = document.getElementById('chkHusbandGrandpa').checked;
    const hGrandpaName = document.getElementById('inHusbandGrandpaName').value.trim();
    const hasHParents = document.getElementById('chkHusbandParents').checked;
    const hFather = document.getElementById('inHusbandFatherName').value.trim();
    const hMother = document.getElementById('inHusbandMotherName').value.trim();

    let hLineageParts = [];
    if (hasHGrandpa && hGrandpaName) {
        hLineageParts.push(`${hGrandpaName}को नाति`);
    }
    if (hasHParents) {
        if (hFather && hMother) {
            hLineageParts.push(`${hFather} तथा ${hMother}को छोरा`);
        } else if (hFather) {
            hLineageParts.push(`बुवा ${hFather}को छोरा`);
        } else if (hMother) {
            hLineageParts.push(`आमा ${hMother}को छोरा`);
        }
    }
    const hLineageStr = hLineageParts.length > 0 ? (hLineageParts.join(', ') + ' ') : '';
    if (document.getElementById('lblHusbandLineage')) {
        document.getElementById('lblHusbandLineage').innerText = hLineageStr;
    }

    // Husband Citizenship in paragraph
    const hasHCit = document.getElementById('chkHusbandCit').checked;
    const hCitNo = document.getElementById('inHusbandCitNo').value.trim();
    const hCitDate = document.getElementById('inHusbandCitDate').value.trim();
    const hCitDist = document.getElementById('inHusbandCitDistrict').value.trim();

    let hCitPara = '';
    if (hasHCit && (hCitNo || hCitDate || hCitDist)) {
        let items = [];
        if (hCitNo) items.push(`ना.प्र.नं.${hCitNo}`);
        if (hCitDate) items.push(`जारी मिति: ${hCitDate}`);
        if (hCitDist) items.push(`जिल्ला: ${hCitDist}`);
        hCitPara = ` (${items.join(', ')})`;
    }
    if (document.getElementById('lblHusbandCit')) {
        document.getElementById('lblHusbandCit').innerText = hCitPara;
    }

    // ── Wife details in Preview ──
    const wDist = document.getElementById('inWifeDistrict').value.trim() || 'झापा';
    const wMuni = document.getElementById('inWifeMuni').value.trim() || 'कमल गाउँपालिका';
    const wWada = document.getElementById('inWifeWada').value.trim() || '६';
    const wName = document.getElementById('inWifeName').value.trim() || '....................';

    if (document.getElementById('lblWifeAddress')) {
        document.getElementById('lblWifeAddress').innerText = `${wDist} जिल्ला ${wMuni} वडा नं.${toNepaliDigit(wWada)}`;
    }
    if (document.getElementById('lblWifeName')) {
        document.getElementById('lblWifeName').innerText = wName;
    }

    // Wife Lineage (Grandpa directly without 'बाजे' prefix)
    const hasWGrandpa = document.getElementById('chkWifeGrandpa').checked;
    const wGrandpaName = document.getElementById('inWifeGrandpaName').value.trim();
    const hasWParents = document.getElementById('chkWifeParents').checked;
    const wFather = document.getElementById('inWifeFatherName').value.trim();
    const wMother = document.getElementById('inWifeMotherName').value.trim();

    let wLineageParts = [];
    if (hasWGrandpa && wGrandpaName) {
        wLineageParts.push(`${wGrandpaName}को नातिनी`);
    }
    if (hasWParents) {
        if (wFather && wMother) {
            wLineageParts.push(`${wFather} तथा ${wMother}को छोरी`);
        } else if (wFather) {
            wLineageParts.push(`बुवा ${wFather}को छोरी`);
        } else if (wMother) {
            wLineageParts.push(`आमा ${wMother}को छोरी`);
        }
    }
    const wLineageStr = wLineageParts.length > 0 ? (wLineageParts.join(', ') + ' ') : '';
    if (document.getElementById('lblWifeLineage')) {
        document.getElementById('lblWifeLineage').innerText = wLineageStr;
    }

    // Wife Citizenship in paragraph
    const hasWCit = document.getElementById('chkWifeCit').checked;
    const wCitNo = document.getElementById('inWifeCitNo').value.trim();
    const wCitDate = document.getElementById('inWifeCitDate').value.trim();
    const wCitDist = document.getElementById('inWifeCitDistrict').value.trim();

    let wCitPara = '';
    if (hasWCit && (wCitNo || wCitDate || wCitDist)) {
        let items = [];
        if (wCitNo) items.push(`ना.प्र.नं.${wCitNo}`);
        if (wCitDate) items.push(`जारी मिति: ${wCitDate}`);
        if (wCitDist) items.push(`जिल्ला: ${wCitDist}`);
        wCitPara = ` (${items.join(', ')})`;
    }
    if (document.getElementById('lblWifeCit')) {
        document.getElementById('lblWifeCit').innerText = wCitPara;
    }

    // ── Marriage details & Dynamic Date Suffix in Preview ──
    const rawMarrMiti = document.getElementById('inMarriageMiti').value;
    const formattedMiti = formatMarriageDateText(rawMarrMiti);
    const marrType    = document.getElementById('inMarriageType').value.trim() || 'सामाजिक परम्परा अनुसार';
    const hasPhotoClause = document.getElementById('chkPhotoClause').checked;

    if (document.getElementById('lblMarriageMiti')) {
        document.getElementById('lblMarriageMiti').innerText = formattedMiti;
    }
    if (document.getElementById('lblMarriageType')) {
        document.getElementById('lblMarriageType').innerText = marrType;
    }
    if (document.getElementById('lblPhotoClause')) {
        document.getElementById('lblPhotoClause').innerText = hasPhotoClause ? 'निज दुवैको फोटो टाँस गरी, ' : '';
    }

    // Couple photo section toggle
    togglePhotoClauseSection();

    // ── Couple Identification Cards (Bottom Section - Name only under photo box) ──
    if (document.getElementById('lblHusbandCardName')) {
        document.getElementById('lblHusbandCardName').innerText = hName;
    }
    if (document.getElementById('lblWifeCardName')) {
        document.getElementById('lblWifeCardName').innerText = wName;
    }

    // ── Signature Preview ──
    const sigVal = document.getElementById('inSignAuthority').value;
    const lblSigName  = document.getElementById('lblSigName');
    const lblSigTitle = document.getElementById('lblSigTitle');

    if (sigVal === 'BLANK') {
        if (lblSigName) lblSigName.innerText = '';
        if (lblSigTitle) lblSigTitle.innerText = '';
    } else if (sigVal === 'CUSTOM') {
        if (lblSigName) lblSigName.innerText = document.getElementById('inCustomSignName').value.trim() || '....................';
        if (lblSigTitle) lblSigTitle.innerText = document.getElementById('inCustomSignTitle').value.trim() || '....................';
    } else {
        const parts = sigVal.split('|');
        if (lblSigName) lblSigName.innerText = parts[0] || '';
        if (lblSigTitle) lblSigTitle.innerText = parts[1] || '';
    }
}

// ── Modal toggle ─────────────────────────────────────
function toggleModal(show) {
    const modal = document.getElementById('abhilekhModal');
    if (modal) modal.style.display = show ? 'flex' : 'none';
    if (show) renderDatabaseTable();
}

// ── Print & Save System ──────────────────────────────
async function printAndSaveSystem() {
    const hName = document.getElementById('inHusbandName').value.trim();
    const wName = document.getElementById('inWifeName').value.trim();

    if (!hName || !wName) {
        alert("कृपया श्रीमान् र श्रीमती दुवैको नाम अनिवार्य रूपमा लेख्नुहोस् !");
        return;
    }

    const recordId = document.getElementById('editRecordIndex').value;
    const obj = {
        ay:                  getSelectedAY(),
        patra:               getSelectedAY(),
        chalani:             document.getElementById('inChalani').value.trim() || '-',
        miti:                document.getElementById('inMiti').value.trim() || '-',
        ns:                  document.getElementById('inNepalSamvat').value.trim() || '११४६',
        recRadio:            document.querySelector('input[name="recRadio"]:checked')?.value || 'जो जस सँग सम्बन्धित छ',
        customReceiver:      document.getElementById('inCustomReceiver')?.value.trim() || '',
        subject:             'विवाह प्रमाणित सम्बन्धमा ।',
        
        // Applicant
        appType:             getSelectedApplicantType(),
        applicantName:       document.getElementById('inApplicantName').value.trim(),
        applicantDistrict:   document.getElementById('inApplicantDistrict').value.trim(),
        applicantMuni:       document.getElementById('inApplicantMuni').value.trim(),
        applicantWada:       document.getElementById('inApplicantWada').value.trim(),
        applicantCitNo:      document.getElementById('inApplicantCitNo').value.trim(),

        // Husband
        husbandName:         hName,
        husbandDistrict:     document.getElementById('inHusbandDistrict').value.trim(),
        husbandMuni:         document.getElementById('inHusbandMuni').value.trim(),
        husbandWada:         document.getElementById('inHusbandWada').value.trim(),
        hasHusbandGrandpa:   document.getElementById('chkHusbandGrandpa').checked,
        husbandGrandpaName:  document.getElementById('inHusbandGrandpaName').value.trim(),
        hasHusbandParents:   document.getElementById('chkHusbandParents').checked,
        husbandFatherName:   document.getElementById('inHusbandFatherName').value.trim(),
        husbandMotherName:   document.getElementById('inHusbandMotherName').value.trim(),
        hasHusbandCit:       document.getElementById('chkHusbandCit').checked,
        husbandCitNo:        document.getElementById('inHusbandCitNo').value.trim(),
        husbandCitDate:      document.getElementById('inHusbandCitDate').value.trim(),
        husbandCitDistrict:  document.getElementById('inHusbandCitDistrict').value.trim(),

        // Wife
        wifeName:            wName,
        wifeDistrict:        document.getElementById('inWifeDistrict').value.trim(),
        wifeMuni:            document.getElementById('inWifeMuni').value.trim(),
        wifeWada:            document.getElementById('inWifeWada').value.trim(),
        hasWifeGrandpa:      document.getElementById('chkWifeGrandpa').checked,
        wifeGrandpaName:     document.getElementById('inWifeGrandpaName').value.trim(),
        hasWifeParents:      document.getElementById('chkWifeParents').checked,
        wifeFatherName:      document.getElementById('inWifeFatherName').value.trim(),
        wifeMotherName:      document.getElementById('inWifeMotherName').value.trim(),
        hasWifeCit:          document.getElementById('chkWifeCit').checked,
        wifeCitNo:           document.getElementById('inWifeCitNo').value.trim(),
        wifeCitDate:         document.getElementById('inWifeCitDate').value.trim(),
        wifeCitDistrict:     document.getElementById('inWifeCitDistrict').value.trim(),

        // Marriage Info
        marriageMiti:        document.getElementById('inMarriageMiti').value.trim(),
        marriageType:        document.getElementById('inMarriageType').value.trim(),
        hasPhotoClause:      document.getElementById('chkPhotoClause').checked,

        // Sign
        signAuth:            document.getElementById('inSignAuthority').value,
        customSignName:      document.getElementById('inCustomSignName').value.trim(),
        customSignTitle:     document.getElementById('inCustomSignTitle').value.trim(),
        sigMargin:           document.getElementById('inSigMargin').value,
        name:                `${hName} र ${wName}`,
        timestamp:           Date.now()
    };

    const btn = document.querySelector('.btn-print');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = "⏳ सुरक्षित हुँदैछ...";
    }

    try {
        if (recordId !== "") {
            await db.collection("bibahaRecords").doc(recordId).update(obj);
        } else {
            const docRef = await db.collection("bibahaRecords").add(obj);
            document.getElementById('editRecordIndex').value = docRef.id;
            document.getElementById('formMainTitle').innerText = "🔄 सम्पादन मोड (विवाह प्रमाणित)";
        }
        window.print();
    } catch (e) {
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
    return toNepaliDigit(formatted);
}

// ── Render Database Table ─────────────────────────────
function renderDatabaseTable() {
    const tbody = document.getElementById('dbTableBody');
    if (!tbody) return;
    const search = (document.getElementById('searchField')?.value || '').trim().toLowerCase();
    tbody.innerHTML = '';
    let counter = 0;

    globalDatabase.forEach((rec) => {
        const searchTarget = `${rec.husbandName || ''} ${rec.wifeName || ''} ${rec.applicantName || ''} ${rec.husbandCitNo || ''} ${rec.wifeCitNo || ''}`.toLowerCase();
        if (search && !searchTarget.includes(search)) return;
        counter++;

        tbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td><b>${toNepaliDigit(counter)}</b></td>
                <td><b>${rec.husbandName || '-'}</b><br><small style="color:#718096;">ना.प्र.नं.: ${rec.husbandCitNo || '-'}</small></td>
                <td><b>${rec.wifeName || '-'}</b><br><small style="color:#718096;">ना.प्र.नं.: ${rec.wifeCitNo || '-'}</small></td>
                <td><span style="color:#2b6cb0; font-weight:600;">${rec.marriageMiti || '-'}</span></td>
                <td>
                    ${rec.miti || '-'}
                    ${rec.timestamp ? `<div style="font-size:0.75rem; color:#a0aec0; margin-top:2px;">⏱️ ${formatTimestamp(rec.timestamp)}</div>` : ''}
                </td>
                <td>
                    <div style="display:flex; gap:4px; justify-content:center;">
                        <button class="btn-action btn-edit-db" title="सम्पादन गर्नुहोस्" onclick="editFromDB('${rec.id}')">📝</button>
                        <button class="btn-action btn-del-db" title="हटाउनुहोस्" onclick="deleteFromDB('${rec.id}')">❌</button>
                    </div>
                </td>
            </tr>
        `);
    });

    if (counter === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#a0aec0;">कुनै अभिलेख फेला परेन ।</td></tr>`;
    }
}

// ── Edit Record from DB ────────────────────────────────
function editFromDB(id) {
    const rec = globalDatabase.find(r => r.id === id);
    if (!rec) return;

    document.getElementById('editRecordIndex').value = id;
    document.getElementById('formMainTitle').innerText = "🔄 सम्पादन मोड (विवाह प्रमाणित)";

    // Reset direct edit flags
    husbandDirectlyEdited = false;
    wifeDirectlyEdited = false;

    // Letterhead
    if (rec.ay || rec.patra) {
        document.getElementById('inPatraSankhya').value = rec.ay || rec.patra || '२०८३/०८४';
    }

    document.getElementById('inChalani').value     = rec.chalani === '-' ? '' : (rec.chalani || '');
    document.getElementById('inMiti').value        = rec.miti === '-' ? '' : (rec.miti || '');
    document.getElementById('inNepalSamvat').value = rec.ns || '११४६';

    // Recipient
    const recRadios = document.getElementsByName('recRadio');
    recRadios.forEach(r => { r.checked = (r.value === rec.recRadio); });
    if (rec.recRadio === 'CUSTOM') {
        document.getElementById('inCustomReceiver').style.display = 'block';
        document.getElementById('inCustomReceiver').value = rec.customReceiver || '';
    } else {
        document.getElementById('inCustomReceiver').style.display = 'none';
    }

    // Applicant
    const appRadios = document.getElementsByName('appTypeRadio');
    appRadios.forEach(r => { r.checked = (r.value === rec.appType); });
    document.getElementById('inApplicantName').value     = rec.applicantName || '';
    document.getElementById('inApplicantDistrict').value = rec.applicantDistrict || '';
    document.getElementById('inApplicantMuni').value     = rec.applicantMuni || '';
    document.getElementById('inApplicantWada').value     = rec.applicantWada || '';
    document.getElementById('inApplicantCitNo').value    = rec.applicantCitNo || '';

    // Husband
    document.getElementById('inHusbandName').value        = rec.husbandName || '';
    document.getElementById('inHusbandDistrict').value    = rec.husbandDistrict || '';
    document.getElementById('inHusbandMuni').value        = rec.husbandMuni || '';
    document.getElementById('inHusbandWada').value        = rec.husbandWada || '';

    document.getElementById('chkHusbandGrandpa').checked  = rec.hasHusbandGrandpa || false;
    toggleHusbandGrandpa();
    document.getElementById('inHusbandGrandpaName').value = rec.husbandGrandpaName || '';

    document.getElementById('chkHusbandParents').checked  = rec.hasHusbandParents !== false;
    toggleHusbandParents();
    document.getElementById('inHusbandFatherName').value  = rec.husbandFatherName || '';
    document.getElementById('inHusbandMotherName').value  = rec.husbandMotherName || '';

    document.getElementById('chkHusbandCit').checked      = rec.hasHusbandCit !== false;
    toggleHusbandCit();
    document.getElementById('inHusbandCitNo').value       = rec.husbandCitNo || '';
    document.getElementById('inHusbandCitDate').value     = rec.husbandCitDate || '';
    document.getElementById('inHusbandCitDistrict').value = rec.husbandCitDistrict || '';

    // Wife
    document.getElementById('inWifeName').value        = rec.wifeName || '';
    document.getElementById('inWifeDistrict').value    = rec.wifeDistrict || '';
    document.getElementById('inWifeMuni').value        = rec.wifeMuni || '';
    document.getElementById('inWifeWada').value        = rec.wifeWada || '';

    document.getElementById('chkWifeGrandpa').checked  = rec.hasWifeGrandpa || false;
    toggleWifeGrandpa();
    document.getElementById('inWifeGrandpaName').value = rec.wifeGrandpaName || '';

    document.getElementById('chkWifeParents').checked  = rec.hasWifeParents !== false;
    toggleWifeParents();
    document.getElementById('inWifeFatherName').value  = rec.wifeFatherName || '';
    document.getElementById('inWifeMotherName').value  = rec.wifeMotherName || '';

    document.getElementById('chkWifeCit').checked      = rec.hasWifeCit !== false;
    toggleWifeCit();
    document.getElementById('inWifeCitNo').value       = rec.wifeCitNo || '';
    document.getElementById('inWifeCitDate').value     = rec.wifeCitDate || '';
    document.getElementById('inWifeCitDistrict').value = rec.wifeCitDistrict || '';

    // Marriage Info
    document.getElementById('inMarriageMiti').value = rec.marriageMiti || '';
    document.getElementById('inMarriageType').value = rec.marriageType || 'सामाजिक परम्परा अनुसार';
    document.getElementById('chkPhotoClause').checked = rec.hasPhotoClause !== false;

    // Signature
    if (rec.signAuth) {
        document.getElementById('inSignAuthority').value = rec.signAuth;
        toggleCustomSign();
    }
    if (rec.customSignName) document.getElementById('inCustomSignName').value = rec.customSignName;
    if (rec.customSignTitle) document.getElementById('inCustomSignTitle').value = rec.customSignTitle;
    if (rec.sigMargin) {
        document.getElementById('inSigMargin').value = rec.sigMargin;
        adjustSignaturePosition(rec.sigMargin);
    }

    toggleModal(false);
    updateDoc();
}

// ── Delete Record from DB ──────────────────────────────
async function deleteFromDB(id) {
    if (!confirm("के तपाईं यो विवाह प्रमाणित अभिलेख साँचै मेटाउन चाहनुहुन्छ?")) return;
    try {
        await db.collection("bibahaRecords").doc(id).delete();
        if (document.getElementById('editRecordIndex').value === id) {
            document.getElementById('editRecordIndex').value = '';
            document.getElementById('formMainTitle').innerText = "💑 विवाह प्रमाणित";
        }
    } catch (e) {
        alert("डिलिट गर्न समस्या भयो! इन्टरनेट कनेक्सन जाँच्नुहोस् ।");
    }
}

// ── Auto-convert Date to Nepal Samvat ──────────────────
function updateNepalSambatFromMiti() {
    const mitiVal = (document.getElementById('inMiti')?.value || '').trim();
    if (!mitiVal) return;

    try {
        const parts = mitiVal.split(/[-/]/);
        if (parts.length >= 3) {
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10);
            const d = parseInt(parts[2], 10);
            if (!isNaN(y) && !isNaN(m) && !isNaN(d) && window.NepaliFunctions) {
                // Converter available
            }
        }
    } catch (e) {}
}

// ── Page Initialization ────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    updateDoc();
});
