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

let rowCounter = 0;
let activeRowIds = [];
let globalDatabase = [];
window.globalDatabase = globalDatabase;

// Auth ready भएपछि मात्र snapshot listener start गर्ने
(window._firebaseAuthReady || Promise.resolve()).then(() => {
    db.collection("gharBatoRecords").onSnapshot((snapshot) => {
        globalDatabase = [];
        snapshot.forEach((doc) => {
            globalDatabase.push({ id: doc.id, ...doc.data() });
        });
        globalDatabase.sort((a, b) => b.timestamp - a.timestamp);
        window.globalDatabase = globalDatabase;
        renderDatabaseTable();
    });
}).catch(() => {});


// Converts english digits into clean Nepali unicode numbers
function toNepaliDigit(num) {
    const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return num.toString().split('').map(digit => nepaliDigits[digit] || digit).join('');
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function toggleGharDetailRow(rowId, status) {
    const block = document.getElementById(rowId);
    if (!block) return;
    const wrapper = block.querySelector('.ghar-detail-wrapper');
    if (wrapper) {
        wrapper.style.display = (status === 'भएको') ? 'block' : 'none';
    }
}
window.toggleGharDetailRow = toggleGharDetailRow;
window.escapeHtml = escapeHtml;

function toggleBatoDetailRow(rowId, status) {
    const block = document.getElementById(rowId);
    if (!block) return;
    const wrapper = block.querySelector('.bato-detail-wrapper');
    const customInput = block.querySelector('.input-bato-custom');
    const valMsg = block.querySelector('.bato-validation-msg');
    const hiddenBato = block.querySelector('.input-bato');

    const isCustom = (status === 'आफैँ हाल्नुहोस्' || status === 'CUSTOM');
    if (wrapper) {
        wrapper.style.display = isCustom ? 'block' : 'none';
    }
    if (valMsg) {
        valMsg.style.display = 'none';
    }
    if (customInput) {
        customInput.style.borderColor = '#cbd5e0';
        if (isCustom && !customInput.value.trim()) {
            setTimeout(() => {
                try { customInput.focus(); } catch (e) {}
            }, 50);
        }
    }
    if (hiddenBato) {
        if (isCustom) {
            hiddenBato.value = customInput ? customInput.value.trim() : '';
        } else {
            hiddenBato.value = status || '';
        }
    }
}
window.toggleBatoDetailRow = toggleBatoDetailRow;

function handleBatoCustomInput(rowId) {
    const block = document.getElementById(rowId);
    if (!block) return;
    const customInput = block.querySelector('.input-bato-custom');
    const valMsg = block.querySelector('.bato-validation-msg');
    const hiddenBato = block.querySelector('.input-bato');

    if (customInput) {
        const val = customInput.value.trim();
        if (val) {
            if (valMsg) valMsg.style.display = 'none';
            customInput.style.borderColor = '#cbd5e0';
        }
        if (hiddenBato) {
            hiddenBato.value = val;
        }
    }
}
window.handleBatoCustomInput = handleBatoCustomInput;

// Controls Abhilekh Popup Modal Overlay Visibility
function toggleModal(show) {
    const modal = document.getElementById('abhilekhModal');
    if (show) {
        modal.style.display = 'flex';
        renderDatabaseTable();
    } else {
        modal.style.display = 'none';
    }
}

// Adjusts the top margin of the signature section live
function adjustSignaturePosition(value) {
    document.getElementById('marginVal').innerText = toNepaliDigit(value) + " px";
    document.getElementById('docFooterSection').style.marginTop = value + "px";
}

// Dynamically Appends a New Land Record Block Row into Form Panel Container
function addKittaRow(data = null) {
    rowCounter++;
    const rowId = 'kitta_row_' + rowCounter;
    activeRowIds.push(rowId);

    const hasGhar = data && data.ghar === 'भएको';
    const noGhar = data && data.ghar === 'नभएको';
    const gharDetail = (data && data.gharDetail) ? data.gharDetail : '';

    // Handle Bato (Road) Type & Custom Description
    let batoOption = (data && data.batoOption) ? data.batoOption : '';
    let batoCustom = (data && data.batoCustom) ? data.batoCustom : '';
    let batoVal = (data && data.bato) ? data.bato : '';

    // If batoOption was not explicitly saved (legacy record)
    if (!batoOption && batoVal && batoVal !== '-') {
        if (batoVal === 'पक्की बाटो भएको') {
            batoOption = 'पक्की बाटो भएको';
        } else if (batoVal === 'ग्राभेल बाटो भएको') {
            batoOption = 'ग्राभेल बाटो भएको';
        } else if (batoVal === 'कच्ची बाटो भएको') {
            batoOption = 'कच्ची बाटो भएको';
        } else {
            batoOption = 'आफैँ हाल्नुहोस्';
            batoCustom = batoVal;
        }
    }

    const isPakki = (batoOption === 'पक्की बाटो भएको');
    const isGravel = (batoOption === 'ग्राभेल बाटो भएको');
    const isKachhi = (batoOption === 'कच्ची बाटो भएको');
    const isCustom = (batoOption === 'आफैँ हाल्नुहोस्' || batoOption === 'CUSTOM');

    let effectiveBato = '';
    if (isCustom) {
        effectiveBato = batoCustom;
    } else if (isPakki || isGravel || isKachhi) {
        effectiveBato = batoOption;
    } else if (batoVal && batoVal !== '-') {
        effectiveBato = batoVal;
    }

    const container = document.getElementById('kittaRowsContainer');
    const rowHtml = `
        <div class="kitta-row-block" id="${rowId}">
            <div class="row-num-badge">क्रम संख्या: <span class="row-index-display"></span></div>
            <button type="button" class="btn-delete-row" id="del_btn_${rowId}" onclick="removeKittaRow('${rowId}')">हटाउनुस्</button>
            <div class="table-row-input-grid">
                <input type="text" class="input-sit" placeholder="सिट नं." value="${data ? escapeHtml(data.sit || '') : ''}" oninput="updateDoc()">
                <input type="text" class="input-kitta" placeholder="कि.नं." value="${data ? escapeHtml(data.kitta || '') : ''}" oninput="updateDoc()">
                <input type="text" class="input-area" placeholder="क्षेत्रफल" value="${data ? escapeHtml(data.area || '') : ''}" oninput="updateDoc()">
            </div>
            <div class="form-group" style="margin-bottom: 8px;">
                <label style="font-size:0.82rem; font-weight:600; color:#2d3748; margin-bottom:4px; display:block;">घरको अवस्था :</label>
                <div class="radio-container">
                    <div class="radio-option">
                        <input type="radio" id="g_v_${rowCounter}" name="gharStatus_${rowCounter}" value="भएको" ${hasGhar ? 'checked' : ''} onchange="toggleGharDetailRow('${rowId}', 'भएको'); updateDoc();">
                        <label for="g_v_${rowCounter}" class="radio-label" style="padding:4px; font-size:0.8rem;">भएको</label>
                    </div>
                    <div class="radio-option">
                        <input type="radio" id="g_nv_${rowCounter}" name="gharStatus_${rowCounter}" value="नभएको" ${noGhar ? 'checked' : ''} onchange="toggleGharDetailRow('${rowId}', 'नभएको'); updateDoc();">
                        <label for="g_nv_${rowCounter}" class="radio-label" style="padding:4px; font-size:0.8rem;">नभएको</label>
                    </div>
                </div>
                <div class="ghar-detail-wrapper" id="ghar_detail_wrapper_${rowId}" style="display: ${hasGhar ? 'block' : 'none'}; margin-top: 6px;">
                    <label style="font-size:0.75rem; color:#4a5568; display:block; margin-bottom:2px;">घरको विवरण (कोष्ठकभित्र देखिने) :</label>
                    <input type="text" class="input-ghar-detail" placeholder="उदा: दुई तले पक्की घर" value="${escapeHtml(gharDetail)}" oninput="updateDoc()" style="width:100%; padding:5px 8px; font-size:0.82rem; border:1px solid #cbd5e0; border-radius:4px; box-sizing:border-box;">
                </div>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
                <label style="font-size:0.82rem; font-weight:600; color:#2d3748; margin-bottom:4px; display:block;">बाटोको प्रकार / विवरण :</label>
                <div class="radio-container bato-radio-group">
                    <div class="radio-option">
                        <input type="radio" id="bato_p_${rowCounter}" name="batoStatus_${rowCounter}" value="पक्की बाटो भएको" ${isPakki ? 'checked' : ''} onchange="toggleBatoDetailRow('${rowId}', 'पक्की बाटो भएको'); updateDoc();">
                        <label for="bato_p_${rowCounter}" class="radio-label">पक्की बाटो भएको</label>
                    </div>
                    <div class="radio-option">
                        <input type="radio" id="bato_g_${rowCounter}" name="batoStatus_${rowCounter}" value="ग्राभेल बाटो भएको" ${isGravel ? 'checked' : ''} onchange="toggleBatoDetailRow('${rowId}', 'ग्राभेल बाटो भएको'); updateDoc();">
                        <label for="bato_g_${rowCounter}" class="radio-label">ग्राभेल बाटो भएको</label>
                    </div>
                    <div class="radio-option">
                        <input type="radio" id="bato_k_${rowCounter}" name="batoStatus_${rowCounter}" value="कच्ची बाटो भएको" ${isKachhi ? 'checked' : ''} onchange="toggleBatoDetailRow('${rowId}', 'कच्ची बाटो भएको'); updateDoc();">
                        <label for="bato_k_${rowCounter}" class="radio-label">कच्ची बाटो भएको</label>
                    </div>
                    <div class="radio-option">
                        <input type="radio" id="bato_c_${rowCounter}" name="batoStatus_${rowCounter}" value="आफैँ हाल्नुहोस्" ${isCustom ? 'checked' : ''} onchange="toggleBatoDetailRow('${rowId}', 'आफैँ हाल्नुहोस्'); updateDoc();">
                        <label for="bato_c_${rowCounter}" class="radio-label">आफैँ हाल्नुहोस्</label>
                    </div>
                </div>
                <div class="bato-detail-wrapper" id="bato_detail_wrapper_${rowId}" style="display: ${isCustom ? 'block' : 'none'};">
                    <label>बाटोको विवरण (आफैँ लेख्नुहोस्) :</label>
                    <input type="text" class="input-bato-custom" placeholder="उदा: ढलान गरिएको बाटो भएको" value="${escapeHtml(batoCustom)}" oninput="handleBatoCustomInput('${rowId}'); updateDoc();">
                    <div class="bato-validation-msg" id="bato_val_msg_${rowId}">⚠️ कृपया बाटोको विवरण अनिवार्य लेख्नुहोस् ।</div>
                </div>
                <input type="hidden" class="input-bato" value="${escapeHtml(effectiveBato)}">
            </div>
            <input type="text" class="input-remarks" placeholder="कैफियत" value="${data ? escapeHtml(data.remarks || '') : ''}" oninput="updateDoc()" style="margin-top:6px; padding:6px;">
        </div>
    `;
    container.insertAdjacentHTML('beforeend', rowHtml);
    reindexFormRows();
    updateDoc();
}

// Removes target element block securely from DOM hierarchy
function removeKittaRow(rowId) {
    if (activeRowIds.length <= 1) return;
    document.getElementById(rowId).remove();
    activeRowIds = activeRowIds.filter(id => id !== rowId);
    reindexFormRows();
    updateDoc();
}

window.toggleLandUseSection = function () {
    const chk = document.getElementById('chkLandUseZone');
    const container = document.getElementById('landUseZoneContainer');
    if (chk && container) {
        container.style.display = chk.checked ? 'block' : 'none';
    }
    const stmtBox = document.getElementById('lblLandUseStatement');
    if (stmtBox && chk) {
        stmtBox.style.display = chk.checked ? 'block' : 'none';
    }
    if (typeof updateDoc === 'function') {
        updateDoc();
    }
};

function getSelectedLandUseZone() {
    const chk = document.getElementById('chkLandUseZone');
    if (!chk || !chk.checked) return 'NONE';
    const radios = document.getElementsByName('zoneRadio');
    for (let r of radios) {
        if (r.checked) return r.value;
    }
    return 'व्यवसायिक शहरी क्षेत्र';
}

function setSelectedLandUseZone(val) {
    const chk = document.getElementById('chkLandUseZone');
    if (!chk) return;
    if (!val || val === 'NONE') {
        chk.checked = false;
    } else {
        chk.checked = true;
        const radios = document.getElementsByName('zoneRadio');
        for (let r of radios) {
            if (r.value === val) {
                r.checked = true;
            }
        }
    }
    window.toggleLandUseSection();
}

// Automatically recalculates loop serialization counts
function reindexFormRows() {
    activeRowIds.forEach((id, index) => {
        document.getElementById(id).querySelector('.row-index-display').innerText = toNepaliDigit(index + 1);
        document.getElementById(`del_btn_${id}`).style.display = (activeRowIds.length === 1) ? 'none' : 'block';
    });
}

// Safely sets innerText on an element by ID (null-safe for cloud template injection)
function safeSetText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
    return el;
}

// Core Dynamic Preview Updates Sync Controller Engine
function updateDoc() {
    safeSetText('lblPatraSankhya', document.getElementById('inPatraSankhya').value);
    safeSetText('lblChalani', document.getElementById('inChalani').value || '');
    safeSetText('lblMiti', document.getElementById('inMiti').value || '........');
    const inNSVal_script = document.getElementById('inNepalSamvat').value || '........';
    safeSetText('lblNepalSamvat', (window.NepalSambat && window.NepalSambat.formatPrint) ? window.NepalSambat.formatPrint(inNSVal_script, document.getElementById('inMiti')?.value) : inNSVal_script);
    safeSetText('lblOfficeName', document.getElementById('inOffice').value || '........');

    const officeAddr = document.getElementById('inOfficeAddress').value;
    safeSetText('lblOfficeAddress', officeAddr ? officeAddr + ' ।' : '........ ।');

    const selectedWada = document.getElementById('inWadaNo').value;
    safeSetText('lblWadaBody', selectedWada);
    safeSetText('lblSabikAddress', 'गौरादह गा.वि.स. वडा नं. ' + (document.getElementById('inSabikWada').value || '...'));

    safeSetText('lblOwnerName', document.getElementById('inName').value || '...........................');

    // Land Use Act Statement Controller
    const selectedZone = getSelectedLandUseZone();
    const stmtBox = document.getElementById('lblLandUseStatement');
    if (stmtBox) {
        if (selectedZone === 'NONE') {
            stmtBox.style.display = 'none';
        } else {
            stmtBox.style.display = 'block';
            safeSetText('lblSelectedZone', selectedZone);
            
            // Calculate total kittas count (from rows or comma/space/र separated kitta numbers)
            let kittaCount = 0;
            activeRowIds.forEach(id => {
                const block = document.getElementById(id);
                if (block) {
                    const kittaInput = block.querySelector('.input-kitta');
                    const kVal = kittaInput ? kittaInput.value.trim() : '';
                    if (kVal) {
                        const splitted = kVal.split(/[,،\s+र/]+/).filter(x => x.trim().length > 0);
                        kittaCount += Math.max(1, splitted.length);
                    } else {
                        kittaCount += 1;
                    }
                }
            });
            if (kittaCount === 0) kittaCount = activeRowIds.length;

            const isPlural = kittaCount >= 2;
            const kittaPhrase = isPlural ? 'माथि उल्लेखित कित्ताहरूको' : 'माथि उल्लेखित कित्ता नम्बरको';
            const landText = isPlural ? 'जग्गाहरू' : 'जग्गा';

            const kp = document.getElementById('lblKittaPhrase');
            if (kp) kp.innerText = kittaPhrase;
            safeSetText('lblLandPlural1', landText);
            safeSetText('lblLandPlural2', landText);
        }
    }

    const signSelect = document.getElementById('inSignAuthority').value;
    let sigName = "", sigTitle = "";
    const lblSigName = document.getElementById('lblSigName');
    if (signSelect === 'BLANK') {
        sigName = "";
        sigTitle = "";
        if (lblSigName) lblSigName.style.borderTop = "none";
    } else {
        if (lblSigName) lblSigName.style.borderTop = "1.5px dashed #000";
        if (signSelect === 'CUSTOM') {
            sigName = document.getElementById('inCustomSignName').value || '....................';
            sigTitle = document.getElementById('inCustomSignTitle').value || '....................';
        } else {
            const signData = signSelect.split('|');
            sigName = signData[0];
            sigTitle = signData[1];
        }
    }
    if (lblSigName) lblSigName.innerText = sigName;
    safeSetText('lblSigTitle', sigTitle);

    const tbody = document.getElementById('outputTableBody');
    if (tbody) {
        tbody.innerHTML = '';

        activeRowIds.forEach((id, index) => {
            const block = document.getElementById(id);
            if (block) {
                const checkedRadio = block.querySelector('input[type="radio"][name^="gharStatus_"]:checked');
                const gharVal = checkedRadio ? checkedRadio.value : '-';
                const detailInput = block.querySelector('.input-ghar-detail');
                const detailVal = (detailInput && gharVal === 'भएको') ? detailInput.value.trim() : '';

                let gharCellContent = '-';
                if (gharVal === 'भएको') {
                    if (detailVal) {
                        gharCellContent = `भएको<div class="ghar-detail-text" style="font-size: 0.85em; line-height: 1.25; margin-top: 2px; font-weight: normal;">(${escapeHtml(detailVal)})</div>`;
                    } else {
                        gharCellContent = `भएको`;
                    }
                } else if (gharVal === 'नभएको') {
                    gharCellContent = `नभएको`;
                }

                // Road (बाटोको प्रकार) extraction
                let batoCellContent = '-';
                const checkedBatoRadio = block.querySelector('input[type="radio"][name^="batoStatus_"]:checked');
                const customBatoInput = block.querySelector('.input-bato-custom');
                const hiddenBato = block.querySelector('.input-bato');

                if (checkedBatoRadio) {
                    const choice = checkedBatoRadio.value;
                    if (choice === 'आफैँ हाल्नुहोस्' || choice === 'CUSTOM') {
                        const customVal = customBatoInput ? customBatoInput.value.trim() : '';
                        batoCellContent = customVal ? escapeHtml(customVal) : '-';
                    } else {
                        batoCellContent = escapeHtml(choice);
                    }
                } else if (hiddenBato && hiddenBato.value && hiddenBato.value !== '-') {
                    batoCellContent = escapeHtml(hiddenBato.value);
                }

                const tableRowHtml = `
                    <tr>
                        <td>${toNepaliDigit(index + 1)}</td>
                        <td>${selectedWada}</td>
                        <td>${escapeHtml(block.querySelector('.input-sit')?.value || '-')}</td>
                        <td>${escapeHtml(block.querySelector('.input-kitta')?.value || '-')}</td>
                        <td>${escapeHtml(block.querySelector('.input-area')?.value || '-')}</td>
                        <td>${gharCellContent}</td>
                        <td>${batoCellContent}</td>
                        <td>${escapeHtml(block.querySelector('.input-remarks')?.value || '-')}</td>
                    </tr>
                `;
                tbody.insertAdjacentHTML('beforeend', tableRowHtml);
            }
        });
    }
}

// Trigger Print Framework and Synchronize State Matrix Into Storage
async function printAndSaveSystem() {
    const name = document.getElementById('inName').value.trim();
    if (!name) { alert("कृपया जग्गाधनीको नाम अनिवार्य लेख्नुहोस् ।"); return; }

    // Validation for custom road description when Option 4 is selected
    for (let i = 0; i < activeRowIds.length; i++) {
        const id = activeRowIds[i];
        const block = document.getElementById(id);
        if (!block) continue;

        const checkedBatoRadio = block.querySelector('input[type="radio"][name^="batoStatus_"]:checked');
        if (checkedBatoRadio && (checkedBatoRadio.value === 'आफैँ हाल्नुहोस्' || checkedBatoRadio.value === 'CUSTOM')) {
            const customInput = block.querySelector('.input-bato-custom');
            const customVal = customInput ? customInput.value.trim() : '';
            if (!customVal) {
                const wrapper = block.querySelector('.bato-detail-wrapper');
                if (wrapper) wrapper.style.display = 'block';
                const valMsg = block.querySelector('.bato-validation-msg');
                if (valMsg) valMsg.style.display = 'block';
                if (customInput) {
                    customInput.style.borderColor = '#e53e3e';
                    customInput.focus();
                }
                const kittaVal = block.querySelector('.input-kitta')?.value?.trim();
                const kittaSuffix = kittaVal ? ` (कि.नं. ${toNepaliDigit(kittaVal)})` : (activeRowIds.length > 1 ? ` (क्रम ${toNepaliDigit(i + 1)})` : '');
                alert(`कृपया बाटोको विवरण अनिवार्य लेख्नुहोस्${kittaSuffix} ।`);
                return;
            }
        }
    }

    const chalani = document.getElementById('inChalani').value.trim() || '-';
    const patra = document.getElementById('inPatraSankhya').value;
    const wada = document.getElementById('inWadaNo').value;
    const miti = document.getElementById('inMiti').value;

    let kittaRecords = [];
    activeRowIds.forEach(id => {
        const block = document.getElementById(id);
        if (block) {
            const checkedRadio = block.querySelector('input[type="radio"][name^="gharStatus_"]:checked');
            const gharStatus = checkedRadio ? checkedRadio.value : '-';
            const detailInput = block.querySelector('.input-ghar-detail');
            const detailVal = (detailInput && gharStatus === 'भएको') ? detailInput.value.trim() : '';

            const checkedBatoRadio = block.querySelector('input[type="radio"][name^="batoStatus_"]:checked');
            const customBatoInput = block.querySelector('.input-bato-custom');
            const customBatoVal = customBatoInput ? customBatoInput.value.trim() : '';
            const hiddenBato = block.querySelector('.input-bato');

            let finalBato = '-';
            let batoOptionVal = '';
            if (checkedBatoRadio) {
                batoOptionVal = checkedBatoRadio.value;
                if (batoOptionVal === 'आफैँ हाल्नुहोस्' || batoOptionVal === 'CUSTOM') {
                    batoOptionVal = 'आफैँ हाल्नुहोस्';
                    finalBato = customBatoVal || '-';
                } else {
                    finalBato = batoOptionVal;
                }
            } else if (hiddenBato && hiddenBato.value && hiddenBato.value !== '-') {
                finalBato = hiddenBato.value;
            }

            kittaRecords.push({
                sit: block.querySelector('.input-sit').value,
                kitta: block.querySelector('.input-kitta').value,
                area: block.querySelector('.input-area').value,
                ghar: gharStatus,
                gharDetail: detailVal,
                bato: finalBato,
                batoOption: batoOptionVal,
                batoCustom: customBatoVal,
                remarks: block.querySelector('.input-remarks').value
            });
        }
    });

    const recordId = document.getElementById('editRecordIndex').value;
    const currentObj = {
        patra, chalani, wada, name, miti,
        subject: "घर बाटो प्रमाणित",
        ns: document.getElementById('inNepalSamvat').value,
        office: document.getElementById('inOffice').value,
        officeAddress: document.getElementById('inOfficeAddress').value,
        sabikWada: document.getElementById('inSabikWada').value,
        signAuth: document.getElementById('inSignAuthority').value,
        customSignName: document.getElementById('inCustomSignName').value,
        customSignTitle: document.getElementById('inCustomSignTitle').value,
        sigMargin: document.getElementById('inSigMargin').value,
        landUseZone: getSelectedLandUseZone(),
        kittas: kittaRecords,
        createdBy:           localStorage.getItem('sifarish_user') || 'wada1',
        createdWard:         localStorage.getItem('sifarish_ward') || '1',
        hasNepalSambatTithi: true,
        nsFeatureVersion:    1,
        nsRolloutCommit:     (window.NepalSambat && window.NepalSambat.CONFIG) ? window.NepalSambat.CONFIG.rolloutCommit : 'd2ba29cef12ba2cfdd7cb211861af69f57880811',
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
            await db.collection("gharBatoRecords").doc(recordId).update(currentObj);
        } else {
            const docRef = await db.collection("gharBatoRecords").add(currentObj);
            document.getElementById('editRecordIndex').value = docRef.id;
            document.getElementById('formMainTitle').innerText = "🔄 सम्पादन मोड";
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
    const toNep = typeof toNepaliDigit === 'function' ? toNepaliDigit : (window.toNepaliDigit || (x => x));
    return toNep(formatted);
}

// Renders the Modal Grid Elements Based on Target Parameters Filter Queries
function renderDatabaseTable() {
    const tbody = document.getElementById('dbTableBody');
    const search = document.getElementById('searchField').value.trim().toLowerCase();
    const toNep = typeof toNepaliDigit === 'function' ? toNepaliDigit : (window.toNepaliDigit || (x => x));
    const toEng = typeof toEnglishDigit === 'function' ? toEnglishDigit : (window.toEnglishDigit || (x => x));
    const searchNep = toNep(search);
    const searchEng = toEng(search);
    tbody.innerHTML = '';

    let counter = 0;
    globalDatabase.forEach((rec) => {
        if (rec.isDeleted) return;
        if (search) {
            const targetText = `${rec.name || ''} ${rec.chalani || ''} ${rec.subject || ''}`.toLowerCase();
            const targetNep = toNep(targetText);
            const targetEng = toEng(targetText);
            if (!targetText.includes(search) && !targetNep.includes(searchNep) && !targetEng.includes(searchEng)) {
                return;
            }
        }
        counter++;
        const rowHtml = `
            <tr>
                <td><b>${toNepaliDigit(counter)}</b></td>
                <td><b>${rec.name}</b></td>
                <td><span style="color:#a51d24; font-weight:bold;">${rec.subject}</span></td>
                <td>
                    ${toNepaliDigit(rec.miti)}
                    ${rec.timestamp ? `<div style="font-size:0.8rem; color:#718096; margin-top:2px;">⏱️ ${formatTimestamp(rec.timestamp)}</div>` : ''}
                </td>
                <td>
                    <div style="display:flex; gap:4px;">
                        <button class="btn-action btn-edit-db" onclick="editFromDB('${rec.id}')">📝</button>
                        <button class="btn-action btn-del-db" onclick="deleteFromDB('${rec.id}')">❌</button>
                    </div>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', rowHtml);
    });
}

// Pulls Specific History Context Variables Back onto Screen
function editFromDB(id) {
    const rec = globalDatabase.find(r => r.id === id);
    if (!rec) return;

    if (window.NepalSambat && typeof window.NepalSambat.setCurrentRecord === 'function') {
        window.NepalSambat.setCurrentRecord(rec);
    }
    document.getElementById('editRecordIndex').value = id;
    document.getElementById('formMainTitle').innerText = "🔄 सम्पादन मोड";

    document.getElementById('inPatraSankhya').value = rec.patra;
    document.getElementById('inChalani').value = rec.chalani === '-' ? '' : rec.chalani;
    document.getElementById('inMiti').value = rec.miti;
    document.getElementById('inNepalSamvat').value = rec.ns;
    document.getElementById('inOffice').value = rec.office;
    document.getElementById('inOfficeAddress').value = rec.officeAddress;
    document.getElementById('inWadaNo').value = rec.wada;
    document.getElementById('inSabikWada').value = rec.sabikWada;
    document.getElementById('inName').value = rec.name;
    document.getElementById('inSignAuthority').value = rec.signAuth;
    document.getElementById('inCustomSignName').value = rec.customSignName || '';
    document.getElementById('inCustomSignTitle').value = rec.customSignTitle || '';
    if (rec.signAuth === 'CUSTOM') {
        document.getElementById('customSignBox').style.display = 'grid';
    } else {
        document.getElementById('customSignBox').style.display = 'none';
    }

    setSelectedLandUseZone(rec.landUseZone || 'NONE');

    if (rec.sigMargin) {
        document.getElementById('inSigMargin').value = rec.sigMargin;
        adjustSignaturePosition(rec.sigMargin);
    }

    document.getElementById('kittaRowsContainer').innerHTML = '';
    activeRowIds = [];
    if (Array.isArray(rec.kittas) && rec.kittas.length > 0) {
        rec.kittas.forEach(kData => { addKittaRow(kData); });
    } else if (rec.kittas) {
        rec.kittas.forEach(kData => { addKittaRow(kData); });
    } else {
        addKittaRow(rec);
    }
    updateDoc();
    toggleModal(false);
}

function resetForm() {
    document.getElementById('editRecordIndex').value = '';
    document.getElementById('formMainTitle').innerText = '📝 सिफारिस प्रविष्टि';
    document.getElementById('inChalani').value = '';
    document.getElementById('inName').value = '';
    document.getElementById('inCustomSignName').value = '';
    document.getElementById('inCustomSignTitle').value = '';
    setSelectedLandUseZone('NONE');

    document.getElementById('kittaRowsContainer').innerHTML = '';
    activeRowIds = [];
    addKittaRow();
    initializeAutomaticDate();
    updateDoc();
}
window.resetForm = resetForm;

// Deletes the Record Entry Permanently
async function deleteFromDB(id) {
    if (confirm("के तपाईं यो रेकर्ड क्लाउड डेटाबेसबाट स्थायी रूपमा हटाउन चाहनुहुन्छ?")) {
        try {
            await db.collection("gharBatoRecords").doc(id).delete();
        } catch (e) {

            alert("डिलिट गर्न समस्या भयो ।");
        }
    }
}

function getNepalSambatYear(adDate) {
    return 1146;
}

function toggleCustomSign() {
    const val = document.getElementById('inSignAuthority').value;
    document.getElementById('customSignBox').style.display = (val === 'CUSTOM') ? 'grid' : 'none';
}

function formatFiscalYear(startYear) {
    const endYear = startYear + 1;
    const endYearSuffix = String(endYear).slice(-2);
    const englishFY = `${startYear}/0${endYearSuffix}`;
    return toNepaliDigit(englishFY);
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
            fySelect.value = currFY;
        }
    } catch (error) {

    }
}

function initializeAutomaticDate() {
    try {
        let nepaliBSDateStr = "";
        let nepaliNSYearStr = "";
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
            const adYear  = today.getFullYear();
            const adMonth = today.getMonth() + 1;
            const adDay   = today.getDate();
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
            bsYearVal  = bsY;
            bsMonthVal = bsM;
            let bsD = adDay >= 16 ? adDay - 15 : adDay + 16;
            if (bsD > 32) bsD = 30;
            bsDayVal = bsD;
            const bsMStr = String(bsMonthVal).padStart(2, '0');
            const bsDStr = String(bsDayVal).padStart(2, '0');
            nepaliBSDateStr = (typeof toNepaliDigit === 'function' ? toNepaliDigit : window.toNepaliDigit)(`${bsYearVal}/${bsMStr}/${bsDStr}`);
        }

        initializeFiscalYear(bsYearVal, bsMonthVal);

        const today = new Date();
        const nsYear = getNepalSambatYear(today);
        nepaliNSYearStr = toNepaliDigit(nsYear);

        const inMiti = document.getElementById('inMiti');
        if (inMiti) {
            inMiti.value = nepaliBSDateStr;
        }

        const inNepalSamvat = document.getElementById('inNepalSamvat');
        if (inNepalSamvat) {
            inNepalSamvat.value = nepaliNSYearStr;
        }

        if (typeof updateDoc === 'function') updateDoc();
        fetchCurrentNepalSambat();
    } catch (error) {

    }
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

// Page Bootstrap Init
window.onload = function () {
    initializeAutomaticDate();
    addKittaRow();
    adjustSignaturePosition(40);
    if (typeof window.toggleLandUseSection === 'function') {
        window.toggleLandUseSection();
    }
};

window.addEventListener('templateInjected', function() {
    initializeAutomaticDate();
    if (typeof window.toggleLandUseSection === 'function') {
        window.toggleLandUseSection();
    }
    if (typeof updateDoc === 'function') {
        updateDoc();
    }
});
