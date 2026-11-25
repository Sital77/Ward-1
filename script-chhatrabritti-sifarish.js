// ══════════════════════════════════════════════════════
//  script-chhatrabritti-sifarish.js
//  छात्रवृत्ति सिफारिस (छोरीबुहारी छात्रवृत्ति + सामान्य छात्रवृत्ति)
//  Collection: chhatrabrittiRecords
// ══════════════════════════════════════════════════════

const firebaseConfig = {
    apiKey: "AIzaSyC3uCmLgNN8s0FDMIrkgxR8eH_AvJ_D3J4",
    authDomain: "gauradaha-ward1.firebaseapp.com",
    projectId: "gauradaha-ward1",
    storageBucket: "gauradaha-ward1.firebasestorage.app",
    messagingSenderId: "1025539708453",
    appId: "1:1025539708453:web:9f8cb617ba81e7dfffeea9"
};

if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore() : null;
window.db = db;

let globalDatabase = [];
window.globalDatabase = globalDatabase;

// ── Safe HTML Escaper ──────────────────────────────────
function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ── Helpers ───────────────────────────────────────────
function toNepaliDigit(num) {
    if (num === null || num === undefined) return '';
    const nd = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return String(num).replace(/[0-9]/g, d => nd[parseInt(d, 10)] || d);
}
window.toNepaliDigit = toNepaliDigit;

function getCheckedRadio(name, fallback = '') {
    const radios = document.querySelectorAll(`input[name="${name}"]`);
    for (const r of radios) {
        if (r.checked) return r.value;
    }
    return fallback;
}

function getSelectedAY() {
    return getCheckedRadio('ayRadio', '२०८३/०८४');
}
window.getSelectedAY = getSelectedAY;

// ── Mode Switching (छोरीबुहारी vs छात्रवृत्ति सिफारिस) ──
function setMode(mode) {
    const safeMode = (mode === 'general') ? 'general' : 'chhori-buhari';
    document.getElementById('currentMode').value = safeMode;

    const btnChhori = document.getElementById('btnModeChhoriBuhari');
    const btnGen = document.getElementById('btnModeGeneral');
    const chhoriFields = document.getElementById('chhoriEducationFields');
    const genFields = document.getElementById('generalEducationFields');
    const eduTitle = document.getElementById('eduSectionTitle');
    const bodyChhori = document.getElementById('bodyChhoriBuhari');
    const bodyGen = document.getElementById('bodyGeneral');

    const wrapChhori = document.getElementById('wrapRelChhori');
    const wrapBuhari = document.getElementById('wrapRelBuhari');
    const wrapChhora = document.getElementById('wrapRelChhora');
    const curRel = getCheckedRadio('relationRadio', 'छोरी');

    if (safeMode === 'chhori-buhari') {
        if (btnChhori) btnChhori.className = 'mode-btn active-chhori';
        if (btnGen) btnGen.className = 'mode-btn';
        if (chhoriFields) chhoriFields.style.display = 'block';
        if (genFields) genFields.style.display = 'none';
        if (eduTitle) eduTitle.innerText = '🎓 क्याम्पस तथा अध्ययन विवरण (छोरीबुहारी)';
        if (bodyChhori) bodyChhori.style.display = 'block';
        if (bodyGen) bodyGen.style.display = 'none';

        if (wrapChhori) wrapChhori.style.display = '';
        if (wrapBuhari) wrapBuhari.style.display = '';
        if (wrapChhora) wrapChhora.style.display = 'none';
        if (curRel === 'छोरा') {
            const relChhori = document.getElementById('relChhori');
            if (relChhori) relChhori.checked = true;
        }
        document.getElementById('lblSubject').innerText = 'छोरीबुहारी छात्रवृत्ति सिफारिस सम्बन्धमा ।';
    } else {
        if (btnChhori) btnChhori.className = 'mode-btn';
        if (btnGen) btnGen.className = 'mode-btn active-general';
        if (chhoriFields) chhoriFields.style.display = 'none';
        if (genFields) genFields.style.display = 'block';
        if (eduTitle) eduTitle.innerText = '🏫 विद्यालय तथा कक्षा विवरण (छात्रवृत्ति)';
        if (bodyChhori) bodyChhori.style.display = 'none';
        if (bodyGen) bodyGen.style.display = 'block';

        if (wrapChhori) wrapChhori.style.display = '';
        if (wrapBuhari) wrapBuhari.style.display = 'none';
        if (wrapChhora) wrapChhora.style.display = '';
        if (curRel === 'बुहारी') {
            const relChhora = document.getElementById('relChhora');
            if (relChhora) relChhora.checked = true;
        }
        document.getElementById('lblSubject').innerText = 'छात्रवृत्ति सिफारिस सम्बन्धमा ।';
    }

    toggleRelationFields();
    updateDoc();
}
window.setMode = setMode;

// ── Conditional Field Toggles ───────────────────────────
function toggleRelationFields() {
    const rel = getCheckedRadio('relationRadio', 'छोरी');
    const isBuhari = (rel === 'बुहारी');
    const husBox = document.getElementById('husbandBox');
    const lblF = document.getElementById('lblInFatherName');
    const lblM = document.getElementById('lblInMotherName');
    if (husBox) husBox.style.display = isBuhari ? 'block' : 'none';
    if (lblF) lblF.innerText = isBuhari ? 'बुबा / ससुराको नाम (ऐच्छिक):' : 'बुबाको नाम (ऐच्छिक):';
    if (lblM) lblM.innerText = isBuhari ? 'आमा / सासूको नाम (ऐच्छिक):' : 'आमाको नाम (ऐच्छिक):';
}
window.toggleRelationFields = toggleRelationFields;
function toggleIdDocSection() {
    const docType = getCheckedRadio('idDocTypeRadio', 'CITIZENSHIP');
    const citBox = document.getElementById('citizenshipBox');
    const birthBox = document.getElementById('birthRegBox');
    if (citBox) citBox.style.display = (docType === 'CITIZENSHIP') ? 'block' : 'none';
    if (birthBox) birthBox.style.display = (docType === 'BIRTH_REG') ? 'block' : 'none';
}
window.toggleIdDocSection = toggleIdDocSection;

function toggleCustomSubject() {
    const val = getCheckedRadio('subjectRadio', '');
    const box = document.getElementById('inCustomSubject');
    if (box) box.style.display = (val === 'CUSTOM') ? 'block' : 'none';
}
window.toggleCustomSubject = toggleCustomSubject;

function toggleCustomYear() {
    const val = getCheckedRadio('yearRadio', '');
    const box = document.getElementById('inCustomYear');
    if (box) box.style.display = (val === 'CUSTOM') ? 'block' : 'none';
}
window.toggleCustomYear = toggleCustomYear;

function toggleCustomSign() {
    const val = document.getElementById('inSignAuthority')?.value || '';
    const box = document.getElementById('customSignBox');
    if (box) box.style.display = (val === 'CUSTOM') ? 'grid' : 'none';
}
window.toggleCustomSign = toggleCustomSign;

function adjustSignaturePosition(value) {
    const mv = document.getElementById('marginVal');
    if (mv) mv.innerText = toNepaliDigit(value) + " px";
    const footer = document.getElementById('docFooterSection');
    if (footer) footer.style.marginTop = value + "px";
}
window.adjustSignaturePosition = adjustSignaturePosition;

function toggleModal(show) {
    const modal = document.getElementById('abhilekhModal');
    if (!modal) return;
    modal.style.display = show ? 'flex' : 'none';
    if (show) renderDatabaseTable();
}
window.toggleModal = toggleModal;

// ── Sentence Builders (Guardian, Identity Doc, School) ──
function buildGuardianClause(father, mother, husband, relation) {
    const f = father.trim();
    const m = mother.trim();
    const h = (husband || '').trim();
    const rel = escapeHtml(relation || 'छोरा');

    let parentBase = '';
    if (f && m) {
        parentBase = `<span style="font-weight:600;">${escapeHtml(f)}</span> तथा <span style="font-weight:600;">${escapeHtml(m)}</span>`;
    } else if (f) {
        parentBase = `<span style="font-weight:600;">${escapeHtml(f)}</span>`;
    } else if (m) {
        parentBase = `<span style="font-weight:600;">${escapeHtml(m)}</span>`;
    }

    if (rel === 'बुहारी') {
        if (parentBase && h) {
            return `${parentBase}को बुहारी, <span style="font-weight:600;">${escapeHtml(h)}</span>को श्रीमती `;
        }
        if (h) {
            return `<span style="font-weight:600;">${escapeHtml(h)}</span>को श्रीमती `;
        }
        if (parentBase) {
            return `${parentBase}को बुहारी `;
        }
        return '';
    }

    return parentBase ? `${parentBase}को ${rel} ` : '';
}

function buildIdentityClause(docType) {
    if (docType === 'CITIZENSHIP') {
        const citNo = document.getElementById('inCitNo')?.value.trim() || '';
        const citDate = document.getElementById('inCitDate')?.value.trim() || '';
        const citDistrict = document.getElementById('inCitDistrict')?.value.trim() || '';
        if (!citNo) return '';
        const parts = [`ना.प्र.नं. ${escapeHtml(toNepaliDigit(citNo))}`];
        if (citDate) parts.push(`जारी मिति: ${escapeHtml(toNepaliDigit(citDate))}`);
        if (citDistrict) parts.push(escapeHtml(citDistrict));
        return ` (${parts.join(', ')})`;
    }
    if (docType === 'BIRTH_REG') {
        const birthNo = document.getElementById('inBirthRegNo')?.value.trim() || '';
        const birthDate = document.getElementById('inBirthRegDate')?.value.trim() || '';
        if (!birthNo) return '';
        const parts = [`जन्म दर्ता नं. ${escapeHtml(toNepaliDigit(birthNo))}`];
        if (birthDate) parts.push(`दर्ता मिति: ${escapeHtml(toNepaliDigit(birthDate))}`);
        return ` (${parts.join(', ')})`;
    }
    return '';
}

function formatSchoolDisplay(rawName) {
    const s = rawName.trim();
    if (!s) return 'श्री ...............';
    return /^श्री[\s.]/.test(s) ? escapeHtml(s) : `श्री ${escapeHtml(s)}`;
}

// ── Live Preview Updater ────────────────────────────────
function updateDoc() {
    const mode = document.getElementById('currentMode')?.value || 'chhori-buhari';
    const ay = getSelectedAY();
    const chalani = document.getElementById('inChalani')?.value || '';
    const miti = document.getElementById('inMiti')?.value || '';
    const ns = document.getElementById('inNepalSamvat')?.value || '';

    const activeWard = (window.MultiWard && typeof window.MultiWard.getActiveWard === 'function')
        ? window.MultiWard.getActiveWard()
        : (localStorage.getItem('sifarish_ward') || '1');
    const wardNep = toNepaliDigit(activeWard);

    // Letterhead Meta
    const lblPatra = document.getElementById('lblPatraSankhya');
    if (lblPatra) lblPatra.innerHTML = `<span id="lblAY">${escapeHtml(ay)}</span>`;
    const lblChal = document.getElementById('lblChalani');
    if (lblChal) lblChal.innerText = chalani ? toNepaliDigit(chalani) : '';
    const lblMiti = document.getElementById('lblMiti');
    if (lblMiti) lblMiti.innerText = miti ? toNepaliDigit(miti) : '................';

    const nsStr = (window.NepalSambat && typeof window.NepalSambat.formatPrint === 'function')
        ? window.NepalSambat.formatPrint(ns, miti)
        : ns;
    const lblNS = document.getElementById('lblNepalSamvat');
    if (lblNS) lblNS.innerText = nsStr || '११४७';

    // Student & Family Details
    const father = document.getElementById('inFatherName')?.value || '';
    const mother = document.getElementById('inMotherName')?.value || '';
    const husband = document.getElementById('inHusbandName')?.value || '';
    const relation = getCheckedRadio('relationRadio', mode === 'chhori-buhari' ? 'छोरी' : 'छोरा');
    const studentRaw = document.getElementById('inStudentName')?.value.trim() || '';
    const studentDisplay = studentRaw ? escapeHtml(studentRaw) : '................';
    const docType = getCheckedRadio('idDocTypeRadio', 'CITIZENSHIP');

    const guardianClause = buildGuardianClause(father, mother, husband, relation);
    const idClause = buildIdentityClause(docType);

    if (mode === 'chhori-buhari') {
        const campus = document.getElementById('inCampusName')?.value.trim() || 'त्रिभुवन विश्वविद्यालय अन्तर्गतको गौरादह बहुमुखी क्याम्पस';
        const subChoice = getCheckedRadio('subjectRadio', 'बी.एड. (ब्याचलर अफ एजुकेशन)');
        const subject = (subChoice === 'CUSTOM')
            ? (document.getElementById('inCustomSubject')?.value.trim() || '................')
            : subChoice;
        const yearChoice = getCheckedRadio('yearRadio', 'पहिलो');
        const yearVal = (yearChoice === 'CUSTOM')
            ? (document.getElementById('inCustomYear')?.value.trim() || '................')
            : yearChoice;
        const yearSuffix = (yearChoice === 'CUSTOM' && /(?:बर्ष|वर्ष|सेमेस्टर)/.test(yearVal)) ? 'मा' : ' वर्षमा';

        const bodyEl = document.getElementById('bodyChhoriBuhari');
        if (bodyEl) {
            bodyEl.innerHTML =
                `उपरोक्त विषयमा झापा जिल्ला, गौरादह नगरपालिका वडा नं. ${wardNep} बस्ने ` +
                `${guardianClause}<span style="font-weight:bold;">${studentDisplay}</span>${idClause}ले ` +
                `यस वडा कार्यालयमा पेस गर्नुभएको माग निवेदन बमोजिम निज निवेदक ` +
                `<span style="font-weight:bold;">${studentDisplay}</span> हाल ${escapeHtml(campus)}मा ` +
                `स्नातक तह <span style="font-weight:bold;">${escapeHtml(subject)}</span> ` +
                `<span style="font-weight:bold;">${escapeHtml(yearVal)}</span>${yearSuffix} अध्ययनरत रहनुभएको हुँदा ` +
                `निजलाई गौरादह नगरपालिकाद्वारा शैक्षिक छात्रवृत्ति कार्यक्रम अन्तर्गत छोरी बुहारीलाई प्राप्त हुने ` +
                `छात्रवृत्ति कार्यक्रममा समावेश गरिदिनुहुन सिफारिस साथ अनुरोध छ ।`;
        }
    } else {
        const schoolWard = document.getElementById('inSchoolWard')?.value || wardNep;
        const schoolRaw = document.getElementById('inSchoolName')?.value || '';
        const schoolDisplay = formatSchoolDisplay(schoolRaw);
        const schoolPost = schoolRaw.trim() ? 'मा' : ' मा';
        const classRaw = document.getElementById('inClassDetails')?.value.trim() || '';
        const classClean = classRaw.replace(/\s+मा$/, '').trim();
        const classDisplay = classClean ? escapeHtml(toNepaliDigit(classClean)) : '.............';

        const bodyEl = document.getElementById('bodyGeneral');
        if (bodyEl) {
            bodyEl.innerHTML =
                `उपरोक्त विषयमा झापा जिल्ला, गौरादह नगरपालिका वडा नं. ${wardNep} बस्ने ` +
                `${guardianClause}<span style="font-weight:bold;">${studentDisplay}</span>${idClause}ले ` +
                `यस वडा कार्यालयमा पेस गर्नुभएको माग निवेदन बमोजिम निज निवेदक ` +
                `<span style="font-weight:bold;">${studentDisplay}</span> हाल गौरादह नगरपालिका वडा नं. ${escapeHtml(toNepaliDigit(schoolWard))} स्थित ` +
                `<span style="font-weight:bold;">${schoolDisplay}</span>${schoolPost} ` +
                `<span style="font-weight:bold;">${classDisplay}</span> अध्ययनरत रहेको हुँदा ` +
                `निजलाई गौरादह नगरपालिकाद्वारा शैक्षिक छात्रवृत्ति कार्यक्रम अन्तर्गत प्राप्त हुने ` +
                `छात्रवृत्ति कार्यक्रममा समावेश गरिदिनुहुन सिफारिस साथ अनुरोध छ ।`;
        }
    }

    // Signatory block
    const signSelect = document.getElementById('inSignAuthority')?.value || 'नगेन्द्र भण्डारी|वडा अध्यक्ष';
    let sigName = "", sigTitle = "";
    const lblSigName = document.getElementById('lblSigName');
    const lblSigTitle = document.getElementById('lblSigTitle');
    if (signSelect === 'BLANK') {
        if (lblSigName) lblSigName.style.borderTop = "none";
    } else {
        if (lblSigName) lblSigName.style.borderTop = "1.5px dashed #000";
        if (signSelect === 'CUSTOM') {
            sigName = document.getElementById('inCustomSignName')?.value || '....................';
            sigTitle = document.getElementById('inCustomSignTitle')?.value || '....................';
        } else {
            const parts = signSelect.split('|');
            sigName = parts[0] || '';
            sigTitle = parts[1] || '';
        }
    }
    if (lblSigName) lblSigName.innerText = sigName;
    if (lblSigTitle) lblSigTitle.innerText = sigTitle;

    if (window.MultiWard && typeof window.MultiWard.applyLetterheadToDocument === 'function') {
        window.MultiWard.applyLetterheadToDocument(document);
    }
}
window.updateDoc = updateDoc;

// ── Save / Update & Print ───────────────────────────────
async function printAndSaveSystem() {
    const mode = document.getElementById('currentMode')?.value || 'chhori-buhari';
    const studentName = document.getElementById('inStudentName')?.value.trim() || '';
    if (!studentName) {
        alert("कृपया विद्यार्थीको पूरा नाम अनिवार्य लेख्नुहोस् ।");
        document.getElementById('inStudentName')?.focus();
        return;
    }

    if (mode === 'general') {
        const sch = document.getElementById('inSchoolName')?.value.trim() || '';
        const cls = document.getElementById('inClassDetails')?.value.trim() || '';
        if (!sch) {
            alert("कृपया विद्यालयको नाम लेख्नुहोस् ।");
            document.getElementById('inSchoolName')?.focus();
            return;
        }
        if (!cls) {
            alert("कृपया अध्ययनरत कक्षा विवरण लेख्नुहोस् ।");
            document.getElementById('inClassDetails')?.focus();
            return;
        }
    }

    const activeWard = (window.MultiWard && typeof window.MultiWard.getActiveWard === 'function')
        ? window.MultiWard.getActiveWard()
        : (localStorage.getItem('sifarish_ward') || '1');
    const recordId = document.getElementById('editRecordIndex')?.value.trim() || '';

    const docType = getCheckedRadio('idDocTypeRadio', 'CITIZENSHIP');
    const subjectChoice = getCheckedRadio('subjectRadio', 'बी.एड. (ब्याचलर अफ एजुकेशन)');
    const yearChoice = getCheckedRadio('yearRadio', 'पहिलो');

    const obj = {
        mode,
        ay: getSelectedAY(),
        chalani: document.getElementById('inChalani')?.value.trim() || '-',
        miti: document.getElementById('inMiti')?.value.trim() || '-',
        ns: document.getElementById('inNepalSamvat')?.value.trim() || '-',
        fatherName: document.getElementById('inFatherName')?.value.trim() || '',
        motherName: document.getElementById('inMotherName')?.value.trim() || '',
        husbandName: document.getElementById('inHusbandName')?.value.trim() || '',
        relation: getCheckedRadio('relationRadio', mode === 'chhori-buhari' ? 'छोरी' : 'छोरा'),
        studentName,
        applicantName: studentName,
        idDocType: docType,
        citNo: (docType === 'CITIZENSHIP') ? (document.getElementById('inCitNo')?.value.trim() || '') : '',
        citDate: (docType === 'CITIZENSHIP') ? (document.getElementById('inCitDate')?.value.trim() || '') : '',
        citDistrict: (docType === 'CITIZENSHIP') ? (document.getElementById('inCitDistrict')?.value.trim() || '') : '',
        birthRegNo: (docType === 'BIRTH_REG') ? (document.getElementById('inBirthRegNo')?.value.trim() || '') : '',
        birthRegDate: (docType === 'BIRTH_REG') ? (document.getElementById('inBirthRegDate')?.value.trim() || '') : '',
        campusName: document.getElementById('inCampusName')?.value.trim() || '',
        subjectChoice,
        customSubject: document.getElementById('inCustomSubject')?.value.trim() || '',
        yearChoice,
        customYear: document.getElementById('inCustomYear')?.value.trim() || '',
        schoolWard: document.getElementById('inSchoolWard')?.value || toNepaliDigit(activeWard),
        schoolName: document.getElementById('inSchoolName')?.value.trim() || '',
        classDetails: document.getElementById('inClassDetails')?.value.trim() || '',
        subject: mode === 'chhori-buhari' ? 'छोरीबुहारी छात्रवृत्ति सिफारिस' : 'छात्रवृत्ति सिफारिस',
        signAuth: document.getElementById('inSignAuthority')?.value || '',
        customSignName: document.getElementById('inCustomSignName')?.value.trim() || '',
        customSignTitle: document.getElementById('inCustomSignTitle')?.value.trim() || '',
        sigMargin: document.getElementById('inSigMargin')?.value || '40',
        createdBy: localStorage.getItem('sifarish_user') || 'wada1',
        createdWard: String(activeWard),
        ward_id: parseInt(activeWard, 10) || 1,
        municipality_id: 'gauradaha',
        updatedAt: Date.now()
    };

    try {
        let savedId = recordId;
        if (db) {
            if (window.SifarishSaveService && typeof window.SifarishSaveService.saveOrUpdateRecord === 'function') {
                const res = await window.SifarishSaveService.saveOrUpdateRecord({
                    db,
                    collectionName: 'chhatrabrittiRecords',
                    data: obj,
                    recordId,
                    category: 'citizen'
                });
                savedId = res && res.savedId ? res.savedId : recordId;
            } else if (recordId) {
                await db.collection('chhatrabrittiRecords').doc(recordId).update(obj);
            } else {
                obj.timestamp = Date.now();
                const ref = await db.collection('chhatrabrittiRecords').add(obj);
                savedId = ref.id;
            }
        } else {
            if (!savedId) savedId = 'chhatrabritti_' + Date.now();
        }

        if (savedId) {
            document.getElementById('editRecordIndex').value = savedId;
            const titleEl = document.getElementById('formMainTitle');
            if (titleEl) titleEl.innerText = `🔄 सम्पादन मोड: ${studentName}`;
            const idx = globalDatabase.findIndex(r => r.id === savedId);
            if (idx !== -1) globalDatabase[idx] = { ...globalDatabase[idx], ...obj, id: savedId };
            else globalDatabase.unshift({ id: savedId, ...obj });
            renderDatabaseTable();
        }

        window.print();
    } catch (e) {
        console.error('[Chhatrabritti] Save failed:', e);
        alert("अभिलेख सुरक्षित गर्न सकिएन: " + (e.message || e));
    }
}
window.printAndSaveSystem = printAndSaveSystem;

// ── Abhilekh Rendering, Edit & Delete ──────────────────
function renderDatabaseTable() {
    const tbody = document.getElementById('dbTableBody');
    if (!tbody) return;
    const query = (document.getElementById('searchField')?.value || '').trim().toLowerCase();

    const activeWard = (window.MultiWard && typeof window.MultiWard.getActiveWard === 'function')
        ? window.MultiWard.getActiveWard()
        : (localStorage.getItem('sifarish_ward') || '1');
    const isSuper = (window.MultiWard && typeof window.MultiWard.isSuperAdmin === 'function')
        ? window.MultiWard.isSuperAdmin()
        : (localStorage.getItem('sifarish_admin') === 'true');

    const filtered = globalDatabase.filter(r => {
        if (r.isDeleted) return false;
        const wardMatch = isSuper || (String(r.createdWard || r.ward_id || '1') === String(activeWard));
        if (!wardMatch) return false;
        if (!query) return true;
        const haystack = [
            r.studentName, r.fatherName, r.motherName, r.husbandName, r.citNo,
            r.birthRegNo, r.schoolName, r.campusName, r.chalani
        ].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(query);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#718096;">कुनै अभिलेख फेला परेन ।</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map((r, i) => {
        const typeLabel = (r.mode === 'general') ? '🎓 छात्रवृत्ति' : '👩‍🎓 छोरीबुहारी';
        const inst = (r.mode === 'general')
            ? `${r.schoolName || '-'} (${r.classDetails || '-'})`
            : `${r.subjectChoice === 'CUSTOM' ? (r.customSubject || '-') : (r.subjectChoice || '-')} (${r.yearChoice === 'CUSTOM' ? (r.customYear || '-') : (r.yearChoice || '-')})`;
        return `
            <tr>
                <td>${toNepaliDigit(i + 1)}</td>
                <td><strong>${escapeHtml(r.studentName || '-')}</strong></td>
                <td>${typeLabel}</td>
                <td>${escapeHtml(inst)}</td>
                <td style="white-space:nowrap;">
                    <button type="button" onclick="editFromDB('${r.id}')" style="background:#3182ce; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:0.78rem;">खोल्नुहोस्</button>
                    <button type="button" onclick="deleteFromDB('${r.id}')" style="background:#e53e3e; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:0.78rem; margin-left:4px;">हटाउनुस्</button>
                </td>
            </tr>
        `;
    }).join('');
}
window.renderDatabaseTable = renderDatabaseTable;

function editFromDB(id) {
    const rec = globalDatabase.find(r => r.id === id);
    if (!rec) return;

    if (window.NepalSambat && typeof window.NepalSambat.setCurrentRecord === 'function') {
        window.NepalSambat.setCurrentRecord(rec);
    }

    document.getElementById('editRecordIndex').value = id;
    const titleEl = document.getElementById('formMainTitle');
    if (titleEl) titleEl.innerText = `🔄 सम्पादन मोड: ${rec.studentName || ''}`;

    setMode(rec.mode || 'chhori-buhari');

    document.querySelectorAll('input[name="ayRadio"]').forEach(r => { r.checked = (r.value === rec.ay); });
    document.getElementById('inChalani').value = (rec.chalani === '-' ? '' : (rec.chalani || ''));
    document.getElementById('inMiti').value = (rec.miti === '-' ? '' : (rec.miti || ''));
    document.getElementById('inNepalSamvat').value = (rec.ns === '-' ? '' : (rec.ns || ''));

    document.getElementById('inFatherName').value = rec.fatherName || '';
    document.getElementById('inMotherName').value = rec.motherName || '';
    const husbandInput = document.getElementById('inHusbandName');
    if (husbandInput) husbandInput.value = rec.husbandName || '';
    document.getElementById('inStudentName').value = rec.studentName || '';

    document.querySelectorAll('input[name="relationRadio"]').forEach(r => {
        r.checked = (r.value === (rec.relation || (rec.mode === 'general' ? 'छोरा' : 'छोरी')));
    });
    if (typeof toggleRelationFields === 'function') toggleRelationFields();

    const docType = rec.idDocType || (rec.birthRegNo ? 'BIRTH_REG' : (rec.citNo ? 'CITIZENSHIP' : 'NONE'));
    document.querySelectorAll('input[name="idDocTypeRadio"]').forEach(r => { r.checked = (r.value === docType); });
    toggleIdDocSection();
    document.getElementById('inCitNo').value = rec.citNo || '';
    document.getElementById('inCitDate').value = rec.citDate || '';
    document.getElementById('inCitDistrict').value = rec.citDistrict || 'झापा';
    document.getElementById('inBirthRegNo').value = rec.birthRegNo || '';
    document.getElementById('inBirthRegDate').value = rec.birthRegDate || '';

    if (rec.campusName) document.getElementById('inCampusName').value = rec.campusName;
    document.querySelectorAll('input[name="subjectRadio"]').forEach(r => { r.checked = (r.value === (rec.subjectChoice || 'बी.एड. (ब्याचलर अफ एजुकेशन)')); });
    toggleCustomSubject();
    document.getElementById('inCustomSubject').value = rec.customSubject || '';

    const normalizedYear = rec.yearChoice === 'दोश्रो' ? 'दोस्रो' : (rec.yearChoice || 'पहिलो');
    document.querySelectorAll('input[name="yearRadio"]').forEach(r => { r.checked = (r.value === normalizedYear); });
    toggleCustomYear();
    document.getElementById('inCustomYear').value = rec.customYear || '';

    if (rec.schoolWard) document.getElementById('inSchoolWard').value = rec.schoolWard;
    document.getElementById('inSchoolName').value = rec.schoolName || '';
    document.getElementById('inClassDetails').value = rec.classDetails || '';

    if (rec.signAuth) {
        const sel = document.getElementById('inSignAuthority');
        if (sel) sel.value = rec.signAuth;
    }
    toggleCustomSign();
    document.getElementById('inCustomSignName').value = rec.customSignName || '';
    document.getElementById('inCustomSignTitle').value = rec.customSignTitle || '';
    if (rec.sigMargin) {
        document.getElementById('inSigMargin').value = rec.sigMargin;
        adjustSignaturePosition(rec.sigMargin);
    }

    updateDoc();
    toggleModal(false);
}
window.editFromDB = editFromDB;

async function deleteFromDB(id) {
    if (!confirm("के तपाईं यो सिफारिस अभिलेख हटाउन चाहनुहुन्छ?")) return;
    try {
        if (typeof window.softDeleteRecord === 'function') {
            const rec = globalDatabase.find(r => r.id === id) || {};
            await window.softDeleteRecord('chhatrabrittiRecords', id, { name: rec.studentName, title: 'छात्रवृत्ति सिफारिस' });
        } else if (db) {
            await db.collection('chhatrabrittiRecords').doc(id).delete();
        }
        globalDatabase = globalDatabase.filter(r => r.id !== id);
        window.globalDatabase = globalDatabase;
        renderDatabaseTable();
    } catch (e) {
        alert("डिलिट गर्न समस्या भयो ।");
    }
}
window.deleteFromDB = deleteFromDB;

function updateNepalSambatFromMiti() {
    if (window.NepalSambat && typeof window.NepalSambat.updateNepalSambatFromMiti === 'function') {
        window.NepalSambat.updateNepalSambatFromMiti();
    }
}
window.updateNepalSambatFromMiti = updateNepalSambatFromMiti;

// ── Init Date & Realtime Sync ───────────────────────────
function initDefaultDate() {
    if (window.NepalSambat && typeof window.NepalSambat.ensureDefaultMiti === 'function') {
        window.NepalSambat.ensureDefaultMiti(false);
    }
    const inMiti = document.getElementById('inMiti');
    if (inMiti && !inMiti.value.trim()) {
        const conv = window['@sbmdkl/nepali-date-converter'];
        if (conv && typeof conv.adToBs === 'function') {
            const d = new Date();
            const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
            const ktm = new Date(utc + (345 * 60000));
            const iso = `${ktm.getFullYear()}-${String(ktm.getMonth() + 1).padStart(2, '0')}-${String(ktm.getDate()).padStart(2, '0')}`;
            const bs = conv.adToBs(iso);
            if (typeof bs === 'string') {
                const p = bs.split(/[-/]/);
                inMiti.value = toNepaliDigit(`${p[0]}/${p[1].padStart(2, '0')}/${p[2].padStart(2, '0')}`);
            }
        }
    }
}

async function initChhatrabrittiModule() {
    initDefaultDate();

    const activeWard = (window.MultiWard && typeof window.MultiWard.getActiveWard === 'function')
        ? window.MultiWard.getActiveWard()
        : (localStorage.getItem('sifarish_ward') || '1');
    const schoolWardEl = document.getElementById('inSchoolWard');
    if (schoolWardEl) {
        schoolWardEl.value = toNepaliDigit(activeWard);
    }

    const chalInput = document.getElementById('inChalani');
    if (chalInput) chalInput.value = '';

    setMode('chhori-buhari');

    if (db) {
        (window._firebaseAuthReady || Promise.resolve()).then(() => {
            db.collection('chhatrabrittiRecords').onSnapshot(snap => {
                globalDatabase = [];
                snap.forEach(doc => globalDatabase.push({ id: doc.id, ...doc.data() }));
                globalDatabase.sort((a, b) => (b.updatedAt || b.timestamp || 0) - (a.updatedAt || a.timestamp || 0));
                window.globalDatabase = globalDatabase;
                renderDatabaseTable();
            }, () => {});
        }).catch(() => {});
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChhatrabrittiModule);
} else {
    initChhatrabrittiModule();
}
