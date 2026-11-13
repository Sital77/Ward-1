/**
 * Gauradaha Municipal Sifarish Management System
 * Health Assistance Recommendation (स्वास्थ्य सहायता सिफारिस)
 * (script-swasthya-sahayata-sifarish.js)
 * 
 * Complies with:
 * - Nepal Government Impoverished Citizen Medical Scheme (विपन्न नागरिक औषधि उपचार सहुलियत कार्यक्रम)
 * - Multi-Ward Architecture & Independent Chalani Numbering
 * - Centralized Deduplication & Save Service
 * - Live Preview & Print Typography Controls
 */

(function (window) {
    'use strict';

    // ── 1. Firebase Initialization ──
    const firebaseConfig = {
        apiKey: "AIzaSyC3uCmLgNN8s0FDMIrkgxR8eH_AvJ_D3J4",
        authDomain: "gauradaha-ward1.firebaseapp.com",
        projectId: "gauradaha-ward1",
        storageBucket: "gauradaha-ward1.firebasestorage.app",
        messagingSenderId: "905617778132",
        appId: "1:905617778132:web:b8149cf37ae3f3c3b42241"
    };

    if (typeof firebase !== 'undefined' && !firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const db = (typeof firebase !== 'undefined') ? firebase.firestore() : null;

    let globalDatabase = [];
    window.globalDatabase = globalDatabase;

    let currentPage = 1;
    const PAGE_SIZE = 10;
    let currentSearchTerm = '';

    // ── 2. Helper Functions ──
    function toNepDigit(num) {
        if (num === null || num === undefined) return '';
        const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
        return String(num).replace(/[0-9]/g, d => nepaliDigits[d]);
    }

    function toEngDigit(str) {
        if (!str) return '';
        const nepaliDigits = { '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9' };
        return String(str).replace(/[०-९]/g, d => nepaliDigits[d] || d);
    }

    function getSelectedAY() {
        const radios = document.querySelectorAll('input[name="ayRadio"]');
        for (const r of radios) {
            if (r.checked) return r.value;
        }
        return '२०८३/०८४';
    }

    // ── 3. Real-time Snapshot Listener ──
    function initDatabaseListener() {
        if (!db) return;
        (window._firebaseAuthReady || Promise.resolve()).then(() => {
            db.collection("swasthyaSahayataRecords").onSnapshot((snapshot) => {
                globalDatabase = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    if (!data.isDeleted) {
                        globalDatabase.push({ id: doc.id, ...data });
                    }
                });
                globalDatabase.sort((a, b) => (b.timestamp || b.createdAt || 0) - (a.timestamp || a.createdAt || 0));
                window.globalDatabase = globalDatabase;
                renderDatabaseTable();
            }, (err) => {
                console.warn("[SwasthyaSifarish] Firestore snapshot listener note:", err);
            });
        }).catch(() => {});
    }

    // ── 4. Disease Type Selection Logic ──
    window.onDiseaseTypeChange = function () {
        const dSelect = document.getElementById('inDiseaseType');
        const dType = dSelect ? dSelect.value : 'मुटु रोग';
        const otherWrap = document.getElementById('otherDiseaseWrap');
        const otherInp = document.getElementById('inOtherDiseaseName');

        if (dType === 'अन्य') {
            if (otherWrap) otherWrap.style.display = 'block';
            if (otherInp) otherInp.focus();
        } else {
            if (otherWrap) otherWrap.style.display = 'none';
            if (otherInp) otherInp.value = '';
        }
    };

    // ── 5. Signatory Handling ──
    window.onSignAuthorityChange = function () {
        const authSelect = document.getElementById('inSignAuthority');
        const val = authSelect ? authSelect.value : 'CHAIRPERSON';
        const customBox = document.getElementById('customSignFields');
        if (customBox) {
            customBox.style.display = (val === 'CUSTOM') ? 'block' : 'none';
        }
        updateDoc();
    };

    function resolveSignatory() {
        const authSelect = document.getElementById('inSignAuthority');
        const signVal = authSelect ? authSelect.value : 'CHAIRPERSON';
        const activeWard = (window.MultiWard && typeof window.MultiWard.getActiveWard === 'function')
            ? window.MultiWard.getActiveWard()
            : (localStorage.getItem('sifarish_ward') || '1');
        const profile = (window.MultiWard && typeof window.MultiWard.getWardProfile === 'function')
            ? window.MultiWard.getWardProfile(activeWard)
            : { chairperson: 'तिलक प्रसाद दाहाल', secretary: 'हेमनाथ थापा' };

        if (signVal === 'CHAIRPERSON') {
            return {
                name: profile.chairperson || 'तिलक प्रसाद दाहाल',
                title: 'वडा अध्यक्ष'
            };
        } else if (signVal === 'ACTING_CHAIRPERSON') {
            return {
                name: profile.actingChairperson || profile.chairperson || 'कार्यवाहक वडा अध्यक्ष',
                title: 'कार्यवाहक वडा अध्यक्ष'
            };
        } else if (signVal === 'SECRETARY') {
            return {
                name: profile.secretary || 'हेमनाथ थापा',
                title: 'वडा सचिव'
            };
        } else {
            const cName = document.getElementById('inCustomSignName')?.value.trim();
            const cTitle = document.getElementById('inCustomSignTitle')?.value.trim();
            return {
                name: cName || 'अधिकृत हस्ताक्षरकर्ता',
                title: cTitle || 'प्रशासकीय अधिकृत'
            };
        }
    }

    // ── 6. Independent Atomic Chalani Number Generation ──
    window.generateAutoChalani = async function () {
        if (!window.MultiWard || typeof window.MultiWard.getNextChalani !== 'function') {
            const cur = parseInt(localStorage.getItem('swasthya_local_chalani') || '1', 10);
            localStorage.setItem('swasthya_local_chalani', String(cur + 1));
            const chalaniEl = document.getElementById('inChalani');
            if (chalaniEl) chalaniEl.value = toNepDigit(cur);
            updateDoc();
            return;
        }
        const activeWard = window.MultiWard.getActiveWard();
        const nextNum = await window.MultiWard.getNextChalani(db, 'swasthya', activeWard);
        const chalaniEl = document.getElementById('inChalani');
        if (chalaniEl) chalaniEl.value = nextNum;
        updateDoc();
    };

    // ── 7. Current Date (Asia/Kathmandu +5:45) ──
    window.setCurrentKathmanduDate = function () {
        try {
            const now = new Date();
            const ktmOffsetMinutes = 345;
            const localOffsetMinutes = now.getTimezoneOffset();
            const totalOffset = ktmOffsetMinutes + localOffsetMinutes;
            const ktmDate = new Date(now.getTime() + totalOffset * 60000);

            const yyyy = ktmDate.getFullYear();
            const mm = String(ktmDate.getMonth() + 1).padStart(2, '0');
            const dd = String(ktmDate.getDate()).padStart(2, '0');
            const adKey = `${yyyy}-${mm}-${dd}`;

            const converter = window["@sbmdkl/nepali-date-converter"];
            if (converter && typeof converter.adToBs === 'function') {
                const bs = converter.adToBs(adKey);
                if (typeof bs === 'string') {
                    const bsStr = bs.replace(/-/g, '/');
                    const mitiInp = document.getElementById('inMiti');
                    if (mitiInp) mitiInp.value = toNepDigit(bsStr);
                    updateDoc();
                    return;
                }
            }

            if (window.NepaliFunctions && typeof window.NepaliFunctions.AD2BS === 'function') {
                const bsObj = window.NepaliFunctions.AD2BS({
                    year: yyyy,
                    month: parseInt(mm, 10),
                    day: parseInt(dd, 10)
                });
                const bsStr = `${bsObj.year}/${String(bsObj.month).padStart(2, '0')}/${String(bsObj.day).padStart(2, '0')}`;
                const mitiInp = document.getElementById('inMiti');
                if (mitiInp) mitiInp.value = toNepDigit(bsStr);
                updateDoc();
                return;
            }

            // Fallback: If converter not ready, calculate roughly
            let bsYear = yyyy + 57;
            let bsMonth = ktmDate.getMonth() + 8;
            if (bsMonth > 12) { bsMonth -= 12; } else { bsYear -= 1; }
            let bsDay = ktmDate.getDate() + 14;
            if (bsDay > 30) { bsDay -= 30; bsMonth += 1; }
            const bsFallback = `${toNepDigit(bsYear)}/${toNepDigit(String(bsMonth).padStart(2, '0'))}/${toNepDigit(String(bsDay).padStart(2, '0'))}`;
            const mitiInp = document.getElementById('inMiti');
            if (mitiInp && !mitiInp.value) mitiInp.value = bsFallback;
        } catch (e) {
            console.warn('[SwasthyaSifarish] Date calc warning:', e);
            const mitiInp = document.getElementById('inMiti');
            if (mitiInp && !mitiInp.value) mitiInp.value = '२०८३/०७/२८';
        }
        updateDoc();
    };

    // ── 8. Live Preview Updater (Core Data Binding) ──
    window.updateDoc = function () {
        const activeWard = (window.MultiWard && typeof window.MultiWard.getActiveWard === 'function')
            ? window.MultiWard.getActiveWard()
            : (localStorage.getItem('sifarish_ward') || '1');
        const wardNep = toNepDigit(activeWard);

        // Active Ward Digit in letterhead and body paragraph
        const wardEl = document.getElementById('lblWardNum');
        if (wardEl) wardEl.textContent = wardNep;

        // Letterhead metadata
        const ay = getSelectedAY();
        const chalani = document.getElementById('inChalani')?.value.trim() || '';
        const miti = document.getElementById('inMiti')?.value.trim() || '';
        const nsVal = document.getElementById('inNepalSamvat')?.value.trim() || '११४६';

        const lblAY = document.getElementById('lblAY');
        if (lblAY) lblAY.textContent = ay;
        const lblChalani = document.getElementById('lblChalani');
        if (lblChalani) lblChalani.textContent = chalani || '';
        const lblMiti = document.getElementById('lblMiti');
        if (lblMiti) lblMiti.textContent = miti || '';
        const lblNS = document.getElementById('lblNepalSamvat');
        if (lblNS) {
            lblNS.textContent = (window.NepalSambat && typeof window.NepalSambat.formatPrint === 'function')
                ? window.NepalSambat.formatPrint(nsVal, miti)
                : nsVal;
        }

        // Part 1: Patient details
        const patientName = document.getElementById('inPatientName')?.value.trim() || '';
        const citNo = document.getElementById('inCitNo')?.value.trim() || '';
        const citDate = document.getElementById('inCitDate')?.value.trim() || '';
        const citDistrict = document.getElementById('inCitDistrict')?.value.trim() || 'झापा';

        const lblPat = document.getElementById('lblPatientName');
        if (lblPat) lblPat.textContent = patientName || '..................';
        const lblCit = document.getElementById('lblCitNo');
        if (lblCit) lblCit.textContent = citNo || '..................';
        const lblCDate = document.getElementById('lblCitDate');
        if (lblCDate) lblCDate.textContent = citDate || '..................';
        const lblDist = document.getElementById('lblCitDistrict');
        if (lblDist) lblDist.textContent = citDistrict || 'झापा';

        // Part 2: Health & Treatment details
        const hospitalName = document.getElementById('inHospitalName')?.value.trim() || '';
        const diseaseType = document.getElementById('inDiseaseType')?.value || 'मुटु रोग';
        const otherDisease = document.getElementById('inOtherDiseaseName')?.value.trim() || '';
        const certifiedDetails = document.getElementById('inHospitalCertifiedDetails')?.value.trim() || '';

        const lblHosp = document.getElementById('lblHospitalName');
        if (lblHosp) lblHosp.textContent = hospitalName || '..................';

        // Effective disease display name
        let effectiveDisease = diseaseType;
        if (diseaseType === 'अन्य') {
            effectiveDisease = otherDisease || '(अन्य रोग)';
        }
        const lblDis = document.getElementById('lblDiseaseName');
        if (lblDis) lblDis.textContent = effectiveDisease;

        // Certified details inside quotation marks
        const lblCert = document.getElementById('lblCertifiedDetails');
        if (lblCert) lblCert.textContent = certifiedDetails || '..................';

        // Signatory block
        const sig = resolveSignatory();
        const lblSigName = document.getElementById('lblSigName');
        if (lblSigName) lblSigName.textContent = sig.name;
        const lblSigTitle = document.getElementById('lblSigTitle');
        if (lblSigTitle) lblSigTitle.textContent = sig.title;

        // Apply Multi-Ward dynamic letterhead
        if (window.MultiWard && typeof window.MultiWard.applyLetterheadToDocument === 'function') {
            window.MultiWard.applyLetterheadToDocument(document.getElementById('printArea'));
        }
    };

    // ── 9. Typography Sliders ──
    window.adjustFontSize = function (val) {
        document.documentElement.style.setProperty('--doc-font-size', `${val}pt`);
        const el = document.getElementById('fontSizeVal');
        if (el) el.textContent = `${toNepDigit(val)} pt`;
    };

    window.adjustLineHeight = function (val) {
        document.documentElement.style.setProperty('--doc-line-height', val);
        const el = document.getElementById('lineHeightVal');
        if (el) el.textContent = toNepDigit(val);
    };

    window.adjustTopMargin = function (val) {
        document.documentElement.style.setProperty('--doc-top-margin', `${val}mm`);
        const el = document.getElementById('topMarginVal');
        if (el) el.textContent = `${toNepDigit(val)} mm`;
        const page = document.getElementById('printArea');
        if (page) page.style.paddingTop = `${val}mm`;
    };

    window.adjustSideMargin = function (val) {
        document.documentElement.style.setProperty('--doc-side-margin', `${val}mm`);
        const el = document.getElementById('sideMarginVal');
        if (el) el.textContent = `${toNepDigit(val)} mm`;
        const page = document.getElementById('printArea');
        if (page) {
            page.style.paddingLeft = `${val}mm`;
            page.style.paddingRight = `${val}mm`;
        }
    };

    window.adjustSignaturePosition = function (val) {
        const foot = document.getElementById('docFooterSection');
        if (foot) foot.style.marginTop = `${val}px`;
        const el = document.getElementById('sigMarginVal');
        if (el) el.textContent = `${toNepDigit(val)} px`;
    };

    window.resetPrintControls = function () {
        const fs = document.getElementById('inFontSize');
        if (fs) { fs.value = 13.5; adjustFontSize(13.5); }
        const lh = document.getElementById('inLineHeight');
        if (lh) { lh.value = 1.8; adjustLineHeight(1.8); }
        const tm = document.getElementById('inTopMargin');
        if (tm) { tm.value = 15; adjustTopMargin(15); }
        const sm = document.getElementById('inSideMargin');
        if (sm) { sm.value = 20; adjustSideMargin(20); }
        const sig = document.getElementById('inSigMargin');
        if (sig) { sig.value = 40; adjustSignaturePosition(40); }
    };

    // ── 10. Quick Print Only (No DB Write) ──
    window.quickPrintOnly = function () {
        if (window.SifarishSaveService && typeof window.SifarishSaveService.showToast === 'function') {
            window.SifarishSaveService.showToast("सिफारिस प्रिन्ट मात्र गरिँदैछ (अभिलेखमा कुनै परिवर्तन गरिएको छैन) ।", "info");
        }
        window.print();
    };

    // ── 11. Save and Print (Deduplicated & Multi-Ward Isolated) ──
    window.saveAndPrintRecord = async function () {
        const patientName = document.getElementById('inPatientName')?.value.trim();
        const citNo = document.getElementById('inCitNo')?.value.trim();
        const hospitalName = document.getElementById('inHospitalName')?.value.trim();
        const diseaseType = document.getElementById('inDiseaseType')?.value;
        const otherDisease = document.getElementById('inOtherDiseaseName')?.value.trim();
        const certifiedDetails = document.getElementById('inHospitalCertifiedDetails')?.value.trim();

        // Validation
        if (!patientName) {
            alert("⚠️ कृपया बिरामीको पूरा नाम लेख्नुहोस् ।");
            document.getElementById('inPatientName')?.focus();
            return;
        }
        if (!citNo) {
            alert("⚠️ कृपया बिरामीको नागरिकता नम्बर लेख्नुहोस् ।");
            document.getElementById('inCitNo')?.focus();
            return;
        }
        if (!hospitalName) {
            alert("⚠️ कृपया उपचार गराइरहेको अस्पतालको नाम लेख्नुहोस् ।");
            document.getElementById('inHospitalName')?.focus();
            return;
        }
        if (diseaseType === 'अन्य' && !otherDisease) {
            alert("⚠️ कृपया 'अन्य' रोगको नाम लेख्नुहोस् ।");
            document.getElementById('inOtherDiseaseName')?.focus();
            return;
        }
        if (!certifiedDetails) {
            alert("⚠️ कृपया अस्पतालबाट प्रमाणित भएको रोग वा समस्याको विवरण लेख्नुहोस् ।");
            document.getElementById('inHospitalCertifiedDetails')?.focus();
            return;
        }

        const activeWard = (window.MultiWard && typeof window.MultiWard.getActiveWard === 'function')
            ? window.MultiWard.getActiveWard()
            : (localStorage.getItem('sifarish_ward') || '1');
        const activeUser = (window.MultiWard && typeof window.MultiWard.getCurrentUser === 'function')
            ? window.MultiWard.getCurrentUser()
            : (localStorage.getItem('sifarish_user') || 'wada1');

        let effectiveDisease = diseaseType;
        if (diseaseType === 'अन्य') {
            effectiveDisease = otherDisease;
        }

        const recordId = document.getElementById('editRecordIndex')?.value.trim() || '';
        const sig = resolveSignatory();

        const recordData = {
            patientName: patientName,
            name: patientName,
            applicantName: patientName,
            citNo: citNo,
            citizenshipNo: citNo,
            citDate: document.getElementById('inCitDate')?.value.trim() || '',
            citDistrict: document.getElementById('inCitDistrict')?.value.trim() || 'झापा',
            hospitalName: hospitalName,
            diseaseType: diseaseType,
            otherDiseaseName: otherDisease,
            effectiveDisease: effectiveDisease,
            certifiedDetails: certifiedDetails,
            ay: getSelectedAY(),
            chalani: document.getElementById('inChalani')?.value.trim() || '',
            miti: document.getElementById('inMiti')?.value.trim() || '',
            signatoryName: sig.name,
            signatoryTitle: sig.title,
            ward_id: parseInt(activeWard, 10),
            createdWard: String(activeWard),
            municipality_id: 'gauradaha',
            subject: 'स्वास्थ्य सहायता उपलब्ध गराईदिने बारे ।',
            scheme: 'विपन्न नागरिक औषधि उपचार वापतको सहुलियत कार्यक्रम'
        };

        const btn = document.getElementById('btnSaveAndPrint');

        try {
            if (window.SifarishSaveService && typeof window.SifarishSaveService.saveOrUpdateRecord === 'function') {
                const res = await window.SifarishSaveService.saveOrUpdateRecord({
                    db: db,
                    collectionName: 'swasthyaSahayataRecords',
                    data: recordData,
                    recordId: recordId,
                    editIndexId: 'editRecordIndex',
                    btnElement: btn,
                    formTitleId: 'formMainTitle',
                    formTitlePrefix: '🔄 सम्पादन मोड: '
                });

                if (res.blocked) return;

                if (res.savedId) {
                    document.getElementById('editRecordIndex').value = res.savedId;
                }

                if (window.MultiWard && typeof window.MultiWard.logAuditEvent === 'function') {
                    window.MultiWard.logAuditEvent(db, 'HEALTH_RECOMMENDATION_SAVED', {
                        patientName: patientName,
                        hospital: hospitalName,
                        disease: effectiveDisease,
                        action: res.action,
                        recordId: res.savedId
                    });
                }
            } else if (db) {
                if (recordId) {
                    recordData.lastUpdatedAt = Date.now();
                    recordData.lastUpdatedBy = activeUser;
                    await db.collection('swasthyaSahayataRecords').doc(recordId).set(recordData, { merge: true });
                } else {
                    recordData.createdAt = Date.now();
                    recordData.createdBy = activeUser;
                    const docRef = await db.collection('swasthyaSahayataRecords').add(recordData);
                    document.getElementById('editRecordIndex').value = docRef.id;
                }
            }

            window.print();
        } catch (err) {
            console.error('[SwasthyaSifarish] Save error:', err);
            alert("⚠️ अभिलेख सुरक्षित गर्दा त्रुटि भयो! कृपया पुन: प्रयास गर्नुहोस्।");
        }
    };

    // ── 12. Export to PDF ──
    window.exportToPdf = function () {
        window.print();
    };

    // ── 13. Abhilekh Modal & Search ──
    window.toggleModal = function (show) {
        const modal = document.getElementById('abhilekhModal');
        if (!modal) return;
        modal.style.display = show ? 'flex' : 'none';
        if (show) {
            renderDatabaseTable();
            setTimeout(() => {
                document.getElementById('searchField')?.focus();
            }, 50);
        }
    };

    window.onArchiveSearchInput = function (val) {
        currentSearchTerm = (val || '').trim();
        currentPage = 1;
        const btnClear = document.getElementById('btnClearArchiveSearch');
        if (btnClear) {
            btnClear.style.display = currentSearchTerm ? 'block' : 'none';
        }
        renderDatabaseTable();
    };

    window.clearArchiveSearch = function () {
        const inp = document.getElementById('searchField');
        if (inp) inp.value = '';
        currentSearchTerm = '';
        const btnClear = document.getElementById('btnClearArchiveSearch');
        if (btnClear) btnClear.style.display = 'none';
        currentPage = 1;
        renderDatabaseTable();
    };

    window.renderDatabaseTable = function () {
        const tbody = document.getElementById('dbTableBody');
        const summary = document.getElementById('dbTableSummary');
        const pagination = document.getElementById('dbTablePagination');
        if (!tbody) return;

        const sTerm = currentSearchTerm.toLowerCase();
        const sEn = toEngDigit(sTerm);
        const sNe = toNepDigit(sTerm);

        const filtered = globalDatabase.filter(item => {
            if (!sTerm) return true;
            const pName = (item.patientName || item.name || '').toLowerCase();
            const cit = (item.citNo || item.citizenshipNo || '').toLowerCase();
            const citEn = toEngDigit(cit);
            const citNe = toNepDigit(cit);
            const chalani = (item.chalani || '').toLowerCase();
            const chalaniEn = toEngDigit(chalani);
            const chalaniNe = toNepDigit(chalani);
            const hosp = (item.hospitalName || '').toLowerCase();
            const disease = (item.effectiveDisease || item.diseaseType || '').toLowerCase();

            return pName.includes(sTerm) ||
                cit.includes(sTerm) || citEn.includes(sEn) || citNe.includes(sNe) ||
                chalani.includes(sTerm) || chalaniEn.includes(sEn) || chalaniNe.includes(sNe) ||
                hosp.includes(sTerm) ||
                disease.includes(sTerm);
        });

        const totalRecords = filtered.length;
        const totalPages = Math.ceil(totalRecords / PAGE_SIZE) || 1;
        if (currentPage > totalPages) currentPage = totalPages;

        const startIdx = (currentPage - 1) * PAGE_SIZE;
        const pageRecords = filtered.slice(startIdx, startIdx + PAGE_SIZE);

        if (summary) {
            summary.textContent = `कुल अभिलेख: ${toNepDigit(totalRecords)} वटा ${currentSearchTerm ? `(खोजी परिणाम)` : ''}`;
        }

        if (pageRecords.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 28px; color: #a0aec0;">कुनै अभिलेख फेला परेन।</td></tr>`;
            if (pagination) pagination.innerHTML = '';
            return;
        }

        tbody.innerHTML = pageRecords.map((rec, idx) => {
            const sn = toNepDigit(startIdx + idx + 1);
            const ch = rec.chalani ? toNepDigit(rec.chalani) : '-';
            const dt = rec.miti || '-';
            const pName = rec.patientName || rec.name || '-';
            const cit = rec.citNo || rec.citizenshipNo || '-';
            const hosp = rec.hospitalName || '-';
            const dis = rec.effectiveDisease || rec.diseaseType || '-';

            return `
                <tr style="border-bottom: 1px solid #edf2f7; transition: background 0.15s;" onmouseover="this.style.background='#f7fafc'" onmouseout="this.style.background='transparent'">
                    <td style="padding: 10px 8px; font-weight: 700;">${sn}</td>
                    <td style="padding: 10px 8px; font-weight: 700; color: #2b6cb0;">${ch}</td>
                    <td style="padding: 10px 8px; color: #4a5568;">${dt}</td>
                    <td style="padding: 10px 8px; font-weight: 700; color: #1a202c;">${pName}</td>
                    <td style="padding: 10px 8px; color: #4a5568;">${cit}</td>
                    <td style="padding: 10px 8px; font-size: 0.85rem;">
                        <div style="font-weight: 600; color: #2d3748;">${hosp}</div>
                        <div style="color: #e53e3e; font-size: 0.8rem;">${dis}</div>
                    </td>
                    <td style="padding: 10px 8px; text-align: center;">
                        <div style="display: flex; gap: 6px; justify-content: center;">
                            <button type="button" onclick="editFromDB('${rec.id}')" title="सम्पादन तथा खोल्नुहोस्" style="padding: 5px 10px; background: #ebf8ff; border: 1px solid #90cdf4; border-radius: 6px; cursor: pointer; color: #2b6cb0; font-weight: 600; font-size: 0.82rem;">✏️ खोल्नुस्</button>
                            <button type="button" onclick="reprintFromDB('${rec.id}')" title="पुनः प्रिन्ट गर्नुहोस्" style="padding: 5px 8px; background: #edf2f7; border: 1px solid #cbd5e0; border-radius: 6px; cursor: pointer; color: #4a5568; font-size: 0.82rem;">🖨️</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Pagination buttons
        if (pagination) {
            pagination.innerHTML = `
                <div>पृष्ठ ${toNepDigit(currentPage)} / ${toNepDigit(totalPages)}</div>
                <div style="display: flex; gap: 6px;">
                    <button type="button" ${currentPage <= 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})" style="padding: 4px 10px; border-radius: 6px; border: 1px solid #cbd5e0; background: #fff; cursor: ${currentPage <= 1 ? 'not-allowed' : 'pointer'};">अघिल्लो</button>
                    <button type="button" ${currentPage >= totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})" style="padding: 4px 10px; border-radius: 6px; border: 1px solid #cbd5e0; background: #fff; cursor: ${currentPage >= totalPages ? 'not-allowed' : 'pointer'};">पछिल्लो</button>
                </div>
            `;
        }
    };

    window.changePage = function (p) {
        currentPage = p;
        renderDatabaseTable();
    };

    // ── 14. Edit & Reopen from Archive ──
    window.editFromDB = function (docId) {
        const item = globalDatabase.find(x => x.id === docId);
        if (!item) return;

        const editIdx = document.getElementById('editRecordIndex');
        if (editIdx) editIdx.value = docId;

        // Populate fields
        const patInp = document.getElementById('inPatientName');
        if (patInp) patInp.value = item.patientName || item.name || '';

        const citInp = document.getElementById('inCitNo');
        if (citInp) citInp.value = item.citNo || item.citizenshipNo || '';

        const citDateInp = document.getElementById('inCitDate');
        if (citDateInp) citDateInp.value = item.citDate || '';

        const distInp = document.getElementById('inCitDistrict');
        if (distInp) distInp.value = item.citDistrict || 'झापा';

        const hospInp = document.getElementById('inHospitalName');
        if (hospInp) hospInp.value = item.hospitalName || '';

        const disSelect = document.getElementById('inDiseaseType');
        if (disSelect) {
            if (['मुटु रोग', 'क्यान्सर', 'अन्य'].includes(item.diseaseType)) {
                disSelect.value = item.diseaseType;
            } else {
                disSelect.value = 'अन्य';
            }
        }

        const otherInp = document.getElementById('inOtherDiseaseName');
        if (otherInp) {
            otherInp.value = item.otherDiseaseName || (item.diseaseType === 'अन्य' ? item.effectiveDisease : '') || '';
        }

        const certInp = document.getElementById('inHospitalCertifiedDetails');
        if (certInp) certInp.value = item.certifiedDetails || '';

        const chalaniInp = document.getElementById('inChalani');
        if (chalaniInp) chalaniInp.value = item.chalani || '';

        const mitiInp = document.getElementById('inMiti');
        if (mitiInp) mitiInp.value = item.miti || '';

        // Select AY radio
        if (item.ay) {
            const radios = document.querySelectorAll('input[name="ayRadio"]');
            radios.forEach(r => {
                if (r.value === item.ay) r.checked = true;
            });
        }

        // Trigger toggles and update
        onDiseaseTypeChange();
        updateDoc();

        // Update form title
        const formTitle = document.getElementById('formMainTitle');
        if (formTitle) {
            formTitle.textContent = `🔄 सम्पादन मोड: ${item.patientName || item.name || ''}`;
        }

        toggleModal(false);

        // Feedback toast
        if (window.SifarishSaveService && typeof window.SifarishSaveService.showToast === 'function') {
            window.SifarishSaveService.showToast(`अभिलेख खोलियो: ${item.patientName || item.name}`, 'info');
        }
    };

    // ── 15. Reprint Directly ──
    window.reprintFromDB = function (docId) {
        editFromDB(docId);
        setTimeout(() => {
            window.print();
        }, 300);
    };

    // ── 16. Mobile Tab Navigation ──
    window.setMobileTab = function (tab) {
        const btnForm = document.getElementById('btnMobForm');
        const btnPreview = document.getElementById('btnMobPreview');
        const inPanel = document.querySelector('.input-panel');
        const prevPanel = document.querySelector('.preview-panel');

        if (tab === 'form') {
            if (btnForm) btnForm.classList.add('active');
            if (btnPreview) btnPreview.classList.remove('active');
            if (inPanel) inPanel.style.display = 'block';
            if (prevPanel) prevPanel.style.display = 'none';
        } else {
            if (btnPreview) btnPreview.classList.add('active');
            if (btnForm) btnForm.classList.remove('active');
            if (inPanel) inPanel.style.display = 'none';
            if (prevPanel) prevPanel.style.display = 'block';
        }
    };

    // ── 17. Initialization ──
    function init() {
        initDatabaseListener();
        setCurrentKathmanduDate();
        updateDoc();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})(typeof window !== 'undefined' ? window : this);
