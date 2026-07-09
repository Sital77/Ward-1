// Dynamic Font Styling Controls and CMS Loader for Recommendation System
(function () {
    'use strict';

    function protectSourceCode() {
        // Safe inspection enabled: devtools and right-click allowed
    }
    try { protectSourceCode(); } catch(e){}

    let db;
    const firebaseConfig = {
        apiKey: "AIzaSyC3uCmLgNN8s0FDMIrkgxR8eH_AvJ_D3J4",
        authDomain: "gauradaha-ward1.firebaseapp.com",
        projectId: "gauradaha-ward1",
        storageBucket: "gauradaha-ward1.firebasestorage.app",
        messagingSenderId: "905617778132",
        appId: "1:905617778132:web:b8149cf37ae3f3c3b42241"
    };

    // Collection map for checking duplicate citizens
    const collectionMap = {
        'gharbato': { collection: 'gharBatoRecords', title: 'घर बाटो प्रमाणित' },
        'charkilla': { collection: 'charKillaRecords', title: 'चार किल्ला प्रमाणित' },
        'bato-pramanit': { collection: 'batoPramanitRecords', title: 'बाटो प्रमाणित' },
        'pariwarik-bibaran': { collection: 'pariwarikRecords', title: 'पारिवारिक विवरण प्रमाणित' },
        'suchana-tans': { collection: 'suchanaTansRecords', title: 'सूचना टाँस पत्र' },
        'ghar-kayam': { collection: 'gharKayamRecords', title: 'घर कायम सिफारिस' },
        'pan-sifarish': { collection: 'panRecords', title: 'स्थायी लेखा नं. सिफारिस' },
        'abibahit-pramanit': { collection: 'abibahitRecords', title: 'अविवाहित प्रमाणित' },
        'apangata-sifarish': { collection: 'apangataRecords', title: 'अपाङ्गता परिचयपत्र सिफारिस' },
        'abhilekh-pramanit': { collection: 'abhilekhRecords', title: 'अभिलेख प्रमाणित' },
        'arko-bibaha-nagareko': { collection: 'arkoBibahaRecords', title: 'अर्को विवाह नगरेको प्रमाणित' },
        'bank-sifarish': { collection: 'bankRecords', title: 'सामाजिक सुरक्षा बैंक सिफारिस' }
    };

    // Intercept firebase initializeApp to prevent duplicate app errors
    if (window.firebase) {
        const originalInitializeApp = firebase.initializeApp;
        firebase.initializeApp = function (config, name) {
            if (!name && firebase.apps.length > 0) {
                return firebase.apps[0];
            }
            return originalInitializeApp.apply(this, arguments);
        };

        // Dynamically redirect all Firestore collection queries to ward-specific collections for other wards
        if (firebase.firestore) {
            const originalCollection = firebase.firestore.Firestore.prototype.collection;
            firebase.firestore.Firestore.prototype.collection = function (name) {
                const ward = localStorage.getItem('sifarish_ward') || '1';
                if (ward !== '1') {
                    return originalCollection.call(this, name + "_w" + ward);
                }
                return originalCollection.call(this, name);
            };
        }
    }

    // 1. Detect which sifarish template page we are on
    const path = window.location.pathname;
    let templateId = '';
    let isDynamic = false;

    if (path.includes('gharbato.html')) templateId = 'gharbato';
    else if (path.includes('charkilla.html')) templateId = 'charkilla';
    else if (path.includes('bato-pramanit.html')) templateId = 'bato-pramanit';
    else if (path.includes('apangata-sifarish.html')) templateId = 'apangata-sifarish';
    else if (path.includes('abibahit-pramanit.html')) templateId = 'abibahit-pramanit';
    else if (path.includes('ghar-kayam.html')) templateId = 'ghar-kayam';
    else if (path.includes('pan-sifarish.html')) templateId = 'pan-sifarish';
    else if (path.includes('pariwarik-bibaran.html')) templateId = 'pariwarik-bibaran';
    else if (path.includes('suchana-tans.html')) templateId = 'suchana-tans';
    else if (path.includes('abhilekh-pramanit.html')) templateId = 'abhilekh-pramanit';
    else if (path.includes('arko-bibaha-nagareko.html')) templateId = 'arko-bibaha-nagareko';
    else if (path.includes('bank-sifarish.html')) templateId = 'bank-sifarish';
    else if (path.includes('dynamic-sifarish.html')) {
        templateId = new URLSearchParams(window.location.search).get('id') || '';
        isDynamic = true;
    }

    // Set up a promise to block window.onload execution until the database template loads
    let resolveTemplatePromise;
    const loadTemplatePromise = new Promise((resolve) => {
        resolveTemplatePromise = resolve;
        setTimeout(resolve, 3500); // 3.5s fallback timeout
    });

    if (templateId && !isDynamic) {
        // Intercept window.onload assigner
        let originalOnload = window.onload;
        Object.defineProperty(window, 'onload', {
            get: function () { return originalOnload; },
            set: function (fn) {
                let executed = false;
                const runOnce = async () => {
                    if (executed) return;
                    executed = true;
                    try {
                        await loadTemplatePromise;
                    } catch (e) {
                        console.error("Error waiting for template load:", e);
                    }
                    fn();
                };

                originalOnload = runOnce;
                
                if (document.readyState === 'complete') {
                    runOnce();
                } else {
                    window.addEventListener('load', runOnce);
                }
            },
            configurable: true
        });

        if (window.firebase) {
            try {
                if (!firebase.apps.length) {
                    firebase.initializeApp(firebaseConfig);
                }
                db = firebase.firestore();

                // First check local sync cache for instant render of admin edits
                let localOverride = null;
                try {
                    const localList = JSON.parse(localStorage.getItem('custom_sifarish_templates') || '[]');
                    localOverride = localList.find(t => t.id === templateId);
                } catch(e) {}

                if (localOverride && (localOverride.status === 'Active' || localOverride.status === 'Published' || !localOverride.status) && localOverride.template_content) {
                    injectTemplateHTML(localOverride.template_content);
                }

                // Fetch dynamic template content from Firestore database
                db.collection('sifarish_templates').doc(templateId).get().then((doc) => {
                    if (doc.exists) {
                        const data = doc.data();
                        if ((data.status === 'Active' || data.status === 'Published') && data.template_content) {
                            injectTemplateHTML(data.template_content);
                        }
                        resolveTemplatePromise();
                    } else if (!localOverride) {
                        // Document doesn't exist yet, so automatically seed it from local HTML
                        seedLocalContent(db, templateId)
                            .then(resolveTemplatePromise)
                            .catch(resolveTemplatePromise);
                    } else {
                        resolveTemplatePromise();
                    }
                }).catch((err) => {
                    console.error("Firestore template loading error:", err);
                    resolveTemplatePromise();
                });
            } catch (e) {
                console.error("Firebase load setup failed:", e);
                resolveTemplatePromise();
            }
        } else {
            resolveTemplatePromise();
        }
    } else {
        resolveTemplatePromise();
    }

    // Helper: Replace existing page elements after the red line with the database template
    function injectTemplateHTML(htmlContent) {
        const redLine = document.querySelector('.header-red-line');
        if (!redLine || !htmlContent) return;

        // Auto-migrate any stored आ.व. references in Firestore template to प.सं.
        htmlContent = htmlContent.replace(/आ\.व\.\s*<span id="(lblPatraSankhya|lblAY)"/g, 'प.सं. <span id="$1"');

        // Clean up everything after the red line
        while (redLine.nextSibling) {
            redLine.nextSibling.remove();
        }

        // Insert new database-managed HTML elements
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        if (!tempDiv.querySelector('#lblReceiverAddress')) {
            const firstChild = tempDiv.firstElementChild;
            if (firstChild) {
                firstChild.id = 'receiverBlock';
                if (firstChild.children && firstChild.children.length > 0) {
                    firstChild.children[0].id = 'lblReceiverAddress';
                } else {
                    firstChild.id = 'lblReceiverAddress';
                }
            }
        }
        while (tempDiv.firstChild) {
            redLine.parentNode.insertBefore(tempDiv.firstChild, null);
        }

        // Immediately trigger live synchronization of dates and form fields into newly injected DOM
        setTimeout(() => {
            localizePageForWard();
            setupDynamicSignatures();
            if (typeof initializeAutomaticDate === 'function') {
                initializeAutomaticDate();
            }
            if (typeof updateDoc === 'function') {
                updateDoc();
            }
            window.dispatchEvent(new Event('templateInjected'));
        }, 30);
    }

    function localizePageForWard() {
        const ward = localStorage.getItem('sifarish_ward') || '1';
        const toNep = (n) => String(n).split('').map(c => '०१२३४५६७८९'[parseInt(c)] || c).join('');
        const wardNep = toNep(ward);

        const searchDigit = (ward === '1') ? '३' : '१';
        const replaceDigit = wardNep;

        const titleRegex = new RegExp(`${searchDigit}\\s*न[ं]?\\s*[\\.\\-]*\\s*वडा`, 'g');
        const wardRegex = new RegExp(`वडा\\s*न[ं]?\\s*[\\.\\-]*\\s*${searchDigit}`, 'g');

        // Document Title
        document.title = document.title.replace(new RegExp(`वडा\\s*न[ं]?\\s*[\\.\\-]*\\s*${searchDigit}`, 'g'), "वडा नं. " + replaceDigit);

        // Replace wada-title (e.g. "१ नं. वडा कार्यालय" -> "३ नं. वडा कार्यालय")
        document.querySelectorAll('.wada-title').forEach(el => {
            el.innerHTML = el.innerHTML
                .replace(titleRegex, `${replaceDigit} नं. वडा`)
                .replace(new RegExp(`${searchDigit} नं वडा`, 'g'), `${replaceDigit} नं वडा`);
        });

        // Replace muni-wada-line
        document.querySelectorAll('.muni-wada-line').forEach(el => {
            el.innerHTML = el.innerHTML.replace(wardRegex, `वडा नं. ${replaceDigit}`);
        });

        // Replace ward numbers inside preview letter paragraph text
        const selectors = ['.letter-body-para', '.letter-body', '#bodyText', '#bodyTextJanma', '#bodyTextBibaha', '#bodyTextTransfer'];
        selectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
                el.innerHTML = el.innerHTML.replace(wardRegex, `वडा नं. ${replaceDigit}`);
            });
        });

        // Replace email
        const email = (ward === '3') ? 'gauradahaward3@gmail.com' : 'ward1.gauradaha@gmail.com';
        document.querySelectorAll('.email-t').forEach(el => {
            el.innerText = `Email: ${email}`;
        });
    }

    function setupDynamicSignatures() {
        const ward = localStorage.getItem('sifarish_ward') || '1';
        const select = document.getElementById('inSignAuthority');
        if (!select) return;

        // Page-specific signature configurations
        const isAbhilekh = templateId === 'abhilekh-pramanit';
        const isBankSifarish = templateId === 'bank-sifarish';

        // Default signatures (वडा अध्यक्ष) for most pages
        const defaultSignatures = {
            '1': [
                { value: "नगेन्द्र भण्डारी|वडा अध्यक्ष", text: "वडा अध्यक्ष - नगेन्द्र भण्डारी" },
                { value: "अन्जु निरौला|कार्यवाहक वडा अध्यक्ष", text: "कार्यवाहक वडा अध्यक्ष - अन्जु निरौला" },
                { value: "लक्ष्मीदेवी विश्वकर्मा|कार्यवाहक वडा अध्यक्ष", text: "कार्यवाहक वडा अध्यक्ष - लक्ष्मीदेवी विश्वकर्मा" },
                { value: "केशर बहादुर खवास भुजेल|कार्यवाहक वडा अध्यक्ष", text: "कार्यवाहक वडा अध्यक्ष - केशर बहादुर खवास भुजेल" },
                { value: "जमुन राई|कार्यवाहक वडा अध्यक्ष", text: "कार्यवाहक वडा अध्यक्ष - जमुन राई" }
            ],
            '3': [
                { value: "दिलिप कुमार भण्डारी|वडा अध्यक्ष", text: "वडा अध्यक्ष - दिलिप कुमार भण्डारी" },
                { value: "होमनाथ थापा|कार्यवाहक वडा अध्यक्ष", text: "कार्यवाहक वडा अध्यक्ष - होमनाथ थापा" },
                { value: "कल्पना अधिकारी|कार्यवाहक वडा अध्यक्ष", text: "कार्यवाहक वडा अध्यक्ष - कल्पना अधिकारी" }
            ]
        };

        // अभिलेख प्रमाणित — स्थानीय पञ्जिकाधिकारी signatures
        const abhilekhSignatures = {
            '1': [
                { value: "अनिता अधिकारी|स्थानीय पञ्जिकाधिकारी", text: "स्थानीय पञ्जिकाधिकारी - अनिता अधिकारी" }
            ],
            '3': [
                { value: "मेनुका बस्नेत|स्थानीय पञ्जिकाधिकारी", text: "स्थानीय पञ्जिकाधिकारी - मेनुका बस्नेत" }
            ]
        };

        // बैंक सिफारिस — वडा सचिव + वडा अध्यक्ष signatures
        const bankSignatures = {
            '1': [
                { value: "अनिता अधिकारी|वडा सचिव", text: "वडा सचिव - अनिता अधिकारी" },
                { value: "नगेन्द्र भण्डारी|वडा अध्यक्ष", text: "वडा अध्यक्ष - नगेन्द्र भण्डारी" },
                { value: "अन्जु निरौला|कार्यवाहक वडा अध्यक्ष", text: "कार्यवाहक वडा अध्यक्ष - अन्जु निरौला" },
                { value: "लक्ष्मीदेवी विश्वकर्मा|कार्यवाहक वडा अध्यक्ष", text: "कार्यवाहक वडा अध्यक्ष - लक्ष्मीदेवी विश्वकर्मा" }
            ],
            '3': [
                { value: "मेनुका बस्नेत|वडा सचिव", text: "वडा सचिव - मेनुका बस्नेत" },
                { value: "दिलिप कुमार भण्डारी|वडा अध्यक्ष", text: "वडा अध्यक्ष - दिलिप कुमार भण्डारी" },
                { value: "होमनाथ थापा|कार्यवाहक वडा अध्यक्ष", text: "कार्यवाहक वडा अध्यक्ष - होमनाथ थापा" },
                { value: "कल्पना अधिकारी|कार्यवाहक वडा अध्यक्ष", text: "कार्यवाहक वडा अध्यक्ष - कल्पना अधिकारी" }
            ]
        };

        // Choose the right signature set based on page
        let signatures;
        if (isAbhilekh) {
            signatures = abhilekhSignatures;
        } else if (isBankSifarish) {
            signatures = bankSignatures;
        } else {
            signatures = defaultSignatures;
        }

        const wardSigns = signatures[ward];
        if (wardSigns) {
            const originalOptions = Array.from(select.options);
            const customOpt = originalOptions.find(o => o.value === 'CUSTOM');
            const blankOpt = originalOptions.find(o => o.value === 'BLANK');

            select.innerHTML = '';
            wardSigns.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.value;
                opt.textContent = s.text;
                select.appendChild(opt);
            });

            if (customOpt) select.appendChild(customOpt);
            if (blankOpt) select.appendChild(blankOpt);
        }
    }

    // Helper: Seeds local HTML into Firestore for first-time migration
    async function seedLocalContent(db, id) {
        try {
            const redLine = document.querySelector('.header-red-line');
            if (!redLine) return;

            const tempContainer = document.createElement('div');
            let sibling = redLine.nextSibling;
            while (sibling) {
                tempContainer.appendChild(sibling.cloneNode(true));
                sibling = sibling.nextSibling;
            }
            const localContent = tempContainer.innerHTML;

            const titles = {
                'gharbato': 'घर बाटो प्रमाणित',
                'charkilla': 'चार किल्ला प्रमाणित',
                'bato-pramanit': 'बाटो प्रमाणित',
                'pariwarik-bibaran': 'पारिवारिक विवरण प्रमाणित',
                'suchana-tans': 'सूचना टाँस पत्र',
                'ghar-kayam': 'घर कायम सिफारिस',
                'pan-sifarish': 'स्थायी लेखा नं. सिफारिस',
                'abibahit-pramanit': 'अविवाहित प्रमाणित',
                'apangata-sifarish': 'अपाङ्गता परिचयपत्र सिफारिस',
                'abhilekh-pramanit': 'अभिलेख प्रमाणित',
                'arko-bibaha-nagareko': 'अर्को विवाह नगरेको प्रमाणित',
                'bank-sifarish': 'सामाजिक सुरक्षा बैंक सिफारिस'
            };

            const categories = {
                'gharbato': 'जग्गा सम्बन्धि',
                'charkilla': 'जग्गा सम्बन्धि',
                'bato-pramanit': 'जग्गा सम्बन्धि',
                'pariwarik-bibaran': 'व्यक्तिगत प्रमाणित',
                'suchana-tans': 'कार्यालय/प्रशासन',
                'ghar-kayam': 'जग्गा सम्बन्धि',
                'pan-sifarish': 'कार्यालय/प्रशासन',
                'abibahit-pramanit': 'व्यक्तिगत प्रमाणित',
                'apangata-sifarish': 'व्यक्तिगत प्रमाणित',
                'abhilekh-pramanit': 'व्यक्तिगत प्रमाणित',
                'arko-bibaha-nagareko': 'व्यक्तिगत प्रमाणित',
                'bank-sifarish': 'व्यक्तिगत प्रमाणित'
            };

            await db.collection('sifarish_templates').doc(id).set({
                id: id,
                title: titles[id] || id,
                category: categories[id] || 'अन्य',
                template_content: localContent,
                font_family: 'Mukta',
                default_font_size: 13,
                status: 'Active',
                created_at: firebase.firestore.FieldValue.serverTimestamp(),
                updated_at: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log(`Successfully seeded sifarish template for ${id} in Firestore.`);
        } catch (e) {
            console.error("Self-seeding template failed:", e);
        }
    }

    // 2. Setup dynamic Font & Styling options card in the input panel
    function initFontSettings() {
        localizePageForWard();
        setupDynamicSignatures();

        // Enforce Nepal Samvat 1146 globally across all forms and live previews
        const enforceNepalSamvat1146 = () => {
            const inNS = document.getElementById('inNepalSamvat');
            if (inNS && inNS.value !== '११४६') {
                inNS.value = '११४६';
                if (typeof updateDoc === 'function') updateDoc();
            }
            const lblNS = document.getElementById('lblNepalSamvat');
            if (lblNS && lblNS.innerText !== '११४६') {
                lblNS.innerText = '११४६';
            }
        };
        enforceNepalSamvat1146();
        setTimeout(enforceNepalSamvat1146, 50);
        setTimeout(enforceNepalSamvat1146, 300);
        setTimeout(enforceNepalSamvat1146, 1000);
        window.addEventListener('templateInjected', enforceNepalSamvat1146);
        document.addEventListener('input', (e) => {
            if (e.target && e.target.id === 'inMiti') {
                setTimeout(enforceNepalSamvat1146, 10);
            }
        });

        const btnPrint = document.querySelector('.btn-print');
        if (!btnPrint) return;

        // Initialize Firebase / Firestore if it wasn't done yet (e.g., dynamic-sifarish page)
        if (window.firebase && !db) {
            try {
                if (!firebase.apps.length) {
                    firebase.initializeApp(firebaseConfig);
                }
                db = firebase.firestore();
            } catch(e) {
                console.error("Firebase init in font settings failed:", e);
            }
        }

        // Register duplicate citizen warning listener
        if (db && templateId) {
            document.addEventListener('change', function (event) {
                const target = event.target;
                let isNameInput = false;
                let fieldName = 'name';
                
                if (target.id === 'inName') {
                    isNameInput = true;
                    fieldName = 'name';
                } else if (isDynamic && target.classList.contains('input-dynamic-field')) {
                    // Check if it is the first dynamic input field (used as applicantName)
                    const firstDynamicInput = document.querySelector('.input-dynamic-field');
                    if (firstDynamicInput && target === firstDynamicInput) {
                        isNameInput = true;
                        fieldName = 'applicantName';
                    }
                }

                if (!isNameInput) return;

                const nameVal = target.value.trim();
                if (!nameVal) return;

                let col = '';
                let tTitle = '';
                if (isDynamic) {
                    col = 'dynamicSifarishRecords';
                    tTitle = document.title || 'सिफारिस';
                } else {
                    const mapping = collectionMap[templateId];
                    if (mapping) {
                        col = mapping.collection;
                        tTitle = mapping.title;
                    }
                }

                if (!col) return;

                const currentRecordId = document.getElementById('editRecordIndex') ? document.getElementById('editRecordIndex').value : '';

                db.collection(col)
                    .where(fieldName, '==', nameVal)
                    .get()
                    .then(snapshot => {
                        const docs = [];
                        snapshot.forEach(doc => {
                            if (doc.id !== currentRecordId) {
                                docs.push({ id: doc.id, ...doc.data() });
                            }
                        });
                        if (docs.length > 0) {
                            // Sort by timestamp descending to find latest
                            docs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                            const latest = docs[0];
                            const timestamp = latest.timestamp || Date.now();
                            const diffTime = Math.abs(Date.now() - timestamp);
                            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                            const msg = `⚠ This citizen already received\n${tTitle}\n${diffDays} days ago.\n\nOpen Previous ?`;
                            if (confirm(msg)) {
                                if (isDynamic) {
                                    if (typeof window.editRecord === 'function') {
                                        window.editRecord(latest.id);
                                    } else if (typeof editRecord === 'function') {
                                        editRecord(latest.id);
                                    }
                                } else {
                                    if (typeof window.editFromDB === 'function') {
                                        window.editFromDB(latest.id);
                                    } else if (typeof editFromDB === 'function') {
                                        editFromDB(latest.id);
                                    }
                                }
                            }
                        }
                    })
                    .catch(err => {
                        console.error("Duplicate citizen check query failed:", err);
                    });
            });
        }

        // 1. Get saved styling values or defaults (Size: 13pt, Italic: false, Color: black)
        const savedSize = localStorage.getItem('doc_font_size') || '13';
        const savedItalic = localStorage.getItem('doc_font_style') === 'italic';
        const savedColor = localStorage.getItem('doc_text_color') || '#000000';

        // 2. Inject Dynamic Style tag for preview controls
        let styleTag = document.getElementById('dynamic-font-settings-style');
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'dynamic-font-settings-style';
            document.head.appendChild(styleTag);
        }

        // 3. Inject CSS styles for the Font Settings Card UI
        let cardStyleTag = document.getElementById('font-settings-ui-style');
        if (!cardStyleTag) {
            cardStyleTag = document.createElement('style');
            cardStyleTag.id = 'font-settings-ui-style';
            cardStyleTag.textContent = `
                .font-settings-card {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 16px;
                    margin: 15px 0 20px 0;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }
                .font-settings-title {
                    font-size: 1rem;
                    font-weight: 700;
                    color: #1e293b;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    border-bottom: 1px dashed #cbd5e0;
                    padding-bottom: 8px;
                }
                .font-settings-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 12px;
                }
                .font-settings-row:last-child {
                    margin-bottom: 0;
                }
                .font-settings-label {
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: #4a5568;
                }
                .font-settings-control {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                /* Slider styling */
                .font-settings-slider {
                    width: 120px;
                    accent-color: #2b6cb0;
                    cursor: pointer;
                    height: 6px;
                    border-radius: 3px;
                }
                .font-settings-val {
                    font-size: 0.9rem;
                    font-weight: 700;
                    color: #2b6cb0;
                    min-width: 42px;
                    text-align: right;
                }
                /* Color Picker */
                .font-settings-color {
                    border: none;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    cursor: pointer;
                    background: none;
                    padding: 0;
                }
                .font-settings-color::-webkit-color-swatch-wrapper {
                    padding: 0;
                }
                .font-settings-color::-webkit-color-swatch {
                    border: 2px solid #cbd5e0;
                    border-radius: 50%;
                }
                /* Presets */
                .color-presets {
                    display: flex;
                    gap: 6px;
                }
                .color-preset {
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    cursor: pointer;
                    border: 1px solid #cbd5e0;
                    transition: transform 0.2s;
                }
                .color-preset:hover {
                    transform: scale(1.25);
                }
                /* Switch / Checkbox styling */
                .font-settings-switch {
                    position: relative;
                    display: inline-block;
                    width: 44px;
                    height: 24px;
                }
                .font-settings-switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .slider-toggle {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #cbd5e0;
                    transition: .3s;
                    border-radius: 24px;
                }
                .slider-toggle:before {
                    position: absolute;
                    content: "";
                    height: 16px;
                    width: 16px;
                    left: 4px;
                    bottom: 4px;
                    background-color: white;
                    transition: .3s;
                    border-radius: 50%;
                }
                input:checked + .slider-toggle {
                    background-color: #2b6cb0;
                }
                input:checked + .slider-toggle:before {
                    transform: translateX(20px);
                }
            `;
            document.head.appendChild(cardStyleTag);
        }

        // 4. Function to apply styles dynamically
        function applyStyles(sz, it, col) {
            styleTag.textContent = `
                :root {
                    --doc-font-size: ${sz}pt;
                    --doc-font-style: ${it ? 'italic' : 'normal'};
                    --doc-text-color: ${col};
                }
                
                /* Apply Font size, line spacing (1.5) and color to all document body elements EXCEPT letterhead */
                .a4-page,
                .a4-page *:not(.letterhead-container):not(.letterhead-container *):not(.doc-header-wrapper):not(.doc-header-wrapper *):not(.meta-line):not(.meta-line *):not(.lh-right):not(.lh-right *):not(.lh-center):not(.lh-center *):not(.lh-left):not(.lh-left *):not(.header-section):not(.header-section *):not(.doc-header):not(.doc-header *):not(.patra-chalani-row):not(.patra-chalani-row *):not(.qr-code-box):not(.qr-code-box *) {
                    font-size: var(--doc-font-size) !important;
                    color: var(--doc-text-color) !important;
                    line-height: 1.5 !important;
                }
                
                .letter-body,
                .letter-body-para,
                .details-table,
                .details-table td,
                .details-table th,
                .land-table,
                .land-table td,
                .land-table th,
                .landuse-container,
                .address-to,
                .subject-container {
                    font-style: var(--doc-font-style) !important;
                }
                
                /* Explicit exclusions to protect standard letterhead & signature normal styles */
                .letterhead-container,
                .letterhead-container *,
                .doc-header-wrapper,
                .doc-header-wrapper *,
                .meta-line,
                .meta-line *,
                .lh-right,
                .lh-right *,
                .lh-center,
                .lh-center *,
                .lh-left,
                .lh-left *,
                .header-section,
                .header-section *,
                .doc-header,
                .doc-header *,
                .patra-chalani-row,
                .patra-chalani-row *,
                .subject-title,
                .subject-title *,
                .signature-block,
                .signature-block * {
                    font-style: normal !important;
                }
            `;
        }

        // Apply styles initially
        applyStyles(savedSize, savedItalic, savedColor);

        // 5. Create Controls UI widget
        const card = document.createElement('div');
        card.className = 'font-settings-card';
        card.innerHTML = `
            <div class="font-settings-title">
                🎨 अक्षर र सजावट सेटिङ (Font & Styling)
            </div>
            <div class="font-settings-row">
                <span class="font-settings-label">अक्षरको साइज (Size):</span>
                <div class="font-settings-control">
                    <input type="range" class="font-settings-slider" id="fsSlider" min="10" max="26" value="${savedSize}">
                    <span class="font-settings-val" id="fsVal">${savedSize} pt</span>
                </div>
            </div>
            <div class="font-settings-row">
                <span class="font-settings-label">छड्के अक्षर (Italic):</span>
                <div class="font-settings-control">
                    <label class="font-settings-switch">
                        <input type="checkbox" id="fsItalic" ${savedItalic ? 'checked' : ''}>
                        <span class="slider-toggle"></span>
                    </label>
                </div>
            </div>
            <div class="font-settings-row">
                <span class="font-settings-label">अक्षरको रङ्ग (Color):</span>
                <div class="font-settings-control">
                    <div class="color-presets">
                        <div class="color-preset" style="background-color: #000000;" data-color="#000000" title="Black"></div>
                        <div class="color-preset" style="background-color: #1e3a8a;" data-color="#1e3a8a" title="Dark Blue"></div>
                        <div class="color-preset" style="background-color: #7f1d1d;" data-color="#7f1d1d" title="Dark Red"></div>
                        <div class="color-preset" style="background-color: #064e3b;" data-color="#064e3b" title="Dark Green"></div>
                    </div>
                    <input type="color" class="font-settings-color" id="fsColor" value="${savedColor}">
                </div>
            </div>
        `;

        // Insert widget above print button in the sidebar panel
        if (btnPrint.parentNode) {
            btnPrint.parentNode.insertBefore(card, btnPrint);
        }

        // 6. Bind events
        const slider = document.getElementById('fsSlider');
        const valLabel = document.getElementById('fsVal');
        const italicCheckbox = document.getElementById('fsItalic');
        const colorPicker = document.getElementById('fsColor');

        slider.addEventListener('input', (e) => {
            const sz = e.target.value;
            valLabel.textContent = `${sz} pt`;
            localStorage.setItem('doc_font_size', sz);
            applyStyles(sz, italicCheckbox.checked, colorPicker.value);
        });

        italicCheckbox.addEventListener('change', (e) => {
            const it = e.target.checked;
            localStorage.setItem('doc_font_style', it ? 'italic' : 'normal');
            applyStyles(slider.value, it, colorPicker.value);
        });

        colorPicker.addEventListener('input', (e) => {
            const col = e.target.value;
            localStorage.setItem('doc_text_color', col);
            applyStyles(slider.value, italicCheckbox.checked, col);
        });

        document.querySelectorAll('.color-preset').forEach(preset => {
            preset.addEventListener('click', () => {
                const col = preset.getAttribute('data-color');
                colorPicker.value = col;
                localStorage.setItem('doc_text_color', col);
                applyStyles(slider.value, italicCheckbox.checked, col);
            });
        });

        // 7. Automatic Nepali Date Banner Badge Display
        try {
            const nepaliMonths = ["बैशाख", "जेठ", "असार", "साउन", "भदौ", "असोज", "कार्तिक", "मंसिर", "पुष", "माघ", "फागुन", "चैत"];
            const nepaliDays = ["आइतबार", "सोमबार", "मंगलबार", "बुधबार", "बिहिबार", "शुक्रबार", "शनिबार"];
            const today = new Date();
            const dayName = nepaliDays[today.getDay()];
            let bsY = today.getFullYear() + 57;
            let bsM = 3;
            let bsD = today.getDate() >= 16 ? today.getDate() - 15 : today.getDate() + 16;
            if (bsD > 32) bsD = 30;
            const converter = window["@sbmdkl/nepali-date-converter"];
            if (!converter && (window._fontBadgeRetries || 0) < 5) {
                window._fontBadgeRetries = (window._fontBadgeRetries || 0) + 1;
                setTimeout(initFontSettings, 400);
            }
            if (converter && typeof converter.adToBs === 'function') {
                try {
                    const yyyy = today.getFullYear();
                    const mm = String(today.getMonth() + 1).padStart(2, '0');
                    const dd = String(today.getDate()).padStart(2, '0');
                    const bsDate = converter.adToBs(`${yyyy}-${mm}-${dd}`);
                    if (typeof bsDate === 'string') {
                        const pts = bsDate.split(/[-/]/);
                        bsY = parseInt(pts[0], 10); bsM = parseInt(pts[1], 10); bsD = parseInt(pts[2], 10);
                    } else if (bsDate && typeof bsDate === 'object') {
                        bsY = bsDate.bsYear || bsY; bsM = bsDate.bsMonth || bsM; bsD = bsDate.bsDay || bsD;
                    }
                } catch(e){}
            }
            const toNep = (n) => String(n).split('').map(c => '०१२३४५६७८९'[parseInt(c)] || c).join('');
            const dateStr = `मिति : ${toNep(bsY)} ${nepaliMonths[bsM - 1] || 'असार'} ${toNep(bsD)} गते, ${dayName}`;
            
            let badge = document.getElementById('nepaliDateBannerBadge');
            if (!badge) {
                badge = document.createElement('div');
                badge.id = 'nepaliDateBannerBadge';
                badge.style.cssText = 'background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: #fff; padding: 12px 16px; border-radius: 10px; font-weight: 600; font-size: 14px; margin-bottom: 15px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 12px rgba(30,58,138,0.25); border: 1px solid rgba(255,255,255,0.25); font-family: inherit;';
                if (card && card.parentNode) {
                    card.parentNode.insertBefore(badge, card);
                }
            }
            badge.innerHTML = `<span>🗓️ <strong>स्वचालित नेपाली मिति:</strong></span> <span style="background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 13px; letter-spacing: 0.5px;">${dateStr}</span>`;
        } catch(e) {}
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFontSettings);
    } else {
        initFontSettings();
    }
})();
