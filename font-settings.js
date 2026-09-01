// Dynamic Font Styling Controls and CMS Loader for Recommendation System
(function () {
    'use strict';

    // Ensure Nepal emblem favicon is present across all pages
    (function ensureFavicon() {
        const faviconUrl = 'https://upload.wikimedia.org/wikipedia/commons/2/23/Emblem_of_Nepal.svg';
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            link.type = 'image/svg+xml';
            link.href = faviconUrl;
            document.head.appendChild(link);
        } else {
            link.href = faviconUrl;
        }
        let appleTouch = document.querySelector("link[rel='apple-touch-icon']");
        if (!appleTouch) {
            appleTouch = document.createElement('link');
            appleTouch.rel = 'apple-touch-icon';
            appleTouch.href = faviconUrl;
            document.head.appendChild(appleTouch);
        }
    })();

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
        'bibaha-pramanit': { collection: 'bibahaRecords', title: 'विवाह प्रमाणित' },
        'apangata-sifarish': { collection: 'apangataRecords', title: 'अपाङ्गता परिचयपत्र सिफारिस' },
        'abhilekh-pramanit': { collection: 'abhilekhRecords', title: 'अभिलेख प्रमाणित' },
        'arko-bibaha-nagareko': { collection: 'arkoBibahaRecords', title: 'अर्को विवाह नगरेको प्रमाणित' },
        'yojana-bank-sifarish': { collection: 'yojanaBankRecords', title: 'योजनाको बैंक खाता सिफारिस' },
        'bank-sifarish': { collection: 'bankRecords', title: 'सामाजिक सुरक्षा बैंक सिफारिस' },
        'aamdani-pramanit': { collection: 'aamdaniPramanitRecords', title: 'आम्दानी प्रमाणित सिफारिस' },
        'bargikaran-sifarish': { collection: 'bargikaranSifarishRecords', title: 'जग्गा वर्गीकरण सिफारिस' },
        'jaggadhani-pratilipi': { collection: 'jaggadhaniPratilipiRecords', title: 'धनीपूर्जा प्रतिलिपि सिफारिस' },
        'jaggadhani-patra': { collection: 'jaggadhaniPoojaRecords', title: 'जग्गाधनीपूर्जा रजिष्ट्रेसन' },
        'nabalak-parichayapatra': { collection: 'nabalakRecords', title: 'नाबालक परिचय पत्र सिफारिस' }
    };

    // Intercept firebase initializeApp to prevent duplicate app errors
    if (window.firebase) {
        const initAuthReadyPromise = () => {
            if (window._firebaseAuthReady) return window._firebaseAuthReady;
            window._firebaseAuthReady = new Promise((resolve) => {
                const authReadyTimeout = setTimeout(() => {

                    resolve();
                }, 8000); // 8 second safety fallback

                const tryAuth = async (user) => {
                    clearTimeout(authReadyTimeout);
                    if (user) {
                        resolve();
                        return;
                    }
                    try {
                        await firebase.auth().signInAnonymously();
                        resolve();
                        return;
                    } catch (e1) {

                    }
                    resolve();
                };

                if (firebase.auth && firebase.apps.length > 0) {
                    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
                        unsubscribe();
                        tryAuth(user);
                    });
                } else {
                    resolve();
                }
            });
            return window._firebaseAuthReady;
        };

        const originalInitializeApp = firebase.initializeApp;
        firebase.initializeApp = function (config, name) {
            let appResult;
            if (!name && firebase.apps.length > 0) {
                appResult = firebase.apps[0];
            } else {
                appResult = originalInitializeApp.apply(this, arguments);
            }
            initAuthReadyPromise();
            return appResult;
        };

        if (firebase.apps.length > 0) {
            initAuthReadyPromise();
        }

        // Dynamically redirect all Firestore collection queries to ward-specific collections for other wards
        if (firebase.firestore) {
            let lastPermissionAlertTime = 0;
            const originalAlert = window.alert;
            if (originalAlert) {
                window.alert = function (message) {
                    if (typeof message === 'string' && message.includes('Firebase Security Rules')) {
                        lastPermissionAlertTime = Date.now();
                    } else if (typeof message === 'string' && (message.includes('इन्टरनेट कनेक्सन जाँच्नुहोस्') || message.includes('डिलिट गर्न समस्या भयो'))) {
                        if (Date.now() - lastPermissionAlertTime < 4000) {
                            return; // Suppress misleading internet error alert right after showing true permission-denied alert
                        }
                    }
                    return originalAlert.apply(this, arguments);
                };
            }

            // Helper to guarantee valid Firebase Auth session and handle permission-denied gracefully
            const ensureAuthBeforeWrite = async () => {
                if (typeof firebase !== 'undefined' && firebase.auth) {
                    let user = firebase.auth().currentUser;
                    if (!user) {
                        try {
                            const cred = await firebase.auth().signInAnonymously();
                            user = cred.user;
                        } catch (e1) {

                        }
                    }
                }
            };

            const runWithAuthAndRetry = async (origFn, context, args) => {
                await ensureAuthBeforeWrite();
                try {
                    return await origFn.apply(context, args);
                } catch (e) {
                    if (e && (e.code === 'permission-denied' || (e.message && e.message.toLowerCase().includes('permission')))) {
                        let retried = false;
                        if (typeof firebase !== 'undefined' && firebase.auth && !firebase.auth().currentUser) {
                            try {
                                await firebase.auth().signInAnonymously();
                                if (firebase.auth().currentUser) { retried = true; }
                            } catch (err) {

                            }
                        }
                        if (retried) {
                            try { return await origFn.apply(context, args); } catch (e2) { e = e2; }
                        }
                    }

                    if (e && (e.code === 'permission-denied' || (e.message && e.message.toLowerCase().includes('permission')))) {
                        e.handledByAuthGuard = true;
                        const user = typeof firebase !== 'undefined' && firebase.auth ? firebase.auth().currentUser : null;
                        if (!user) {
                            alert("⚠️ Firebase Security Rules ले डाटा सुरक्षित/हटाउन अनुमति दिएन! (request.auth != null नियम लागू छ)।\n\nतपाईं हाल Firebase मा लग-इन हुनुहुन्न वा सेसन समाप्त भएको छ। कृपया लग-इन पेज (login.html) मा गएर वडाको इमेल र पासवर्ड राखेर लग-इन गर्नुहोस्।");
                        } else {
                            alert("⚠️ Firebase Security Rules ले हालको खाता (" + (user.email || 'User') + ") लाई डाटा सुरक्षित/हटाउन अनुमति दिएन।");
                        }
                    }
                    throw e;
                }
            };

            if (firebase.firestore.CollectionReference && firebase.firestore.CollectionReference.prototype) {
                const origAdd = firebase.firestore.CollectionReference.prototype.add;
                if (origAdd) {
                    firebase.firestore.CollectionReference.prototype.add = async function () {
                        return await runWithAuthAndRetry(origAdd, this, arguments);
                    };
                }
            }

            if (firebase.firestore.DocumentReference && firebase.firestore.DocumentReference.prototype) {
                const origUpdate = firebase.firestore.DocumentReference.prototype.update;
                if (origUpdate) {
                    firebase.firestore.DocumentReference.prototype.update = async function () {
                        return await runWithAuthAndRetry(origUpdate, this, arguments);
                    };
                }

                const origSet = firebase.firestore.DocumentReference.prototype.set;
                if (origSet) {
                    firebase.firestore.DocumentReference.prototype.set = async function () {
                        return await runWithAuthAndRetry(origSet, this, arguments);
                    };
                }

                const origDelete = firebase.firestore.DocumentReference.prototype.delete;
                if (origDelete) {
                    firebase.firestore.DocumentReference.prototype.delete = async function () {
                        return await runWithAuthAndRetry(origDelete, this, arguments);
                    };
                }
            }

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
    else if (path.includes('bibaha-pramanit.html')) templateId = 'bibaha-pramanit';
    else if (path.includes('ghar-kayam.html')) templateId = 'ghar-kayam';
    else if (path.includes('pan-sifarish.html')) templateId = 'pan-sifarish';
    else if (path.includes('pariwarik-bibaran.html')) templateId = 'pariwarik-bibaran';
    else if (path.includes('suchana-tans.html')) templateId = 'suchana-tans';
    else if (path.includes('abhilekh-pramanit.html')) templateId = 'abhilekh-pramanit';
    else if (path.includes('arko-bibaha-nagareko.html')) templateId = 'arko-bibaha-nagareko';
    else if (path.includes('yojana-bank-sifarish.html')) templateId = 'yojana-bank-sifarish';
    else if (path.includes('bank-sifarish.html')) templateId = 'bank-sifarish';
    else if (path.includes('nabalak-parichayapatra.html')) templateId = 'nabalak-parichayapatra';
    else if (path.includes('jaggadhani-pratilipi.html')) templateId = 'jaggadhani-pratilipi';
    else if (path.includes('aamdani-pramanit.html')) templateId = 'aamdani-pramanit';
    else if (path.includes('bargikaran-sifarish.html')) templateId = 'bargikaran-sifarish';
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

    // yojana-bank-sifarish and bank-sifarish have their own complete JS logic - skip template loading entirely
    const skipTemplateLoad = (templateId === 'yojana-bank-sifarish' || templateId === 'bank-sifarish');

    if (templateId && !isDynamic && !skipTemplateLoad) {
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
                    if (localOverride && localOverride.template_content) {
                        if (localOverride.template_content.includes('पूजी') || localOverride.template_content.includes('किताामा')) {
                            localOverride = null;
                        }
                        if (localOverride && templateId === 'bato-pramanit' && (!localOverride.template_content.includes('lblLandUseStatement') || !localOverride.template_content.includes('भू-उपयोग ऐन'))) {
                            localOverride = null;
                        }
                        if (localOverride && templateId === 'gharbato' && (!localOverride.template_content.includes('lblLandUseStatement') || !localOverride.template_content.includes('भू-उपयोग ऐन'))) {
                            localOverride = null;
                        }
                        if (localOverride && templateId === 'charkilla' && (!localOverride.template_content.includes('lblLandUseStatement') || !localOverride.template_content.includes('भू-उपयोग ऐन') || (localOverride.template_content.includes('नाममा तहाँ') && !localOverride.template_content.includes('श्री भुमी प्रशासन')))) {
                            localOverride = null;
                        }
                        if (localOverride && templateId === 'nabalak-parichayapatra' && !localOverride.template_content.includes('lblDynamicRelation')) {
                            localOverride = null;
                        }
                        if (localOverride && templateId === 'suchana-tans' && (localOverride.template_content.includes('A4-242.jpg') || localOverride.template_content.includes('letterheadType'))) {
                            localOverride = null;
                        }
                        if (localOverride && templateId === 'ghar-kayam' && (localOverride.template_content.includes('जम्मा<br>क्षेत्रफल') || localOverride.template_content.includes('जम्मा क्षेत्रफल'))) {
                            localOverride = null;
                        }
                        if (localOverride && templateId === 'aamdani-pramanit' && (!localOverride.template_content.includes('globalLandAddr') || localOverride.template_content.includes('width: 250px;'))) {
                            localOverride = null;
                        }
                        if (localOverride && templateId === 'pariwarik-bibaran' && (!localOverride.template_content.includes('outputTableHead') || !localOverride.template_content.includes('familyDetailsTable'))) {
                            localOverride = null;
                        }
                    }
                } catch(e) {}

                if (localOverride && (localOverride.status === 'Active' || localOverride.status === 'Published' || !localOverride.status) && localOverride.template_content) {
                    injectTemplateHTML(localOverride.template_content);
                }

                // Fetch dynamic template content from Firestore database
                db.collection('sifarish_templates').doc(templateId).get().then((doc) => {
                    if (doc.exists) {
                        const data = doc.data();
                        let isOutdated = false;
                        if (!data.template_content) {
                            isOutdated = true;
                        } else if (templateId === 'bato-pramanit' && (!data.template_content.includes('lblLandUseStatement') || !data.template_content.includes('भू-उपयोग ऐन') || !data.template_content.includes('lblSelectedZone'))) {
                            isOutdated = true;
                        } else if (templateId === 'gharbato' && (!data.template_content.includes('lblLandUseStatement') || !data.template_content.includes('भू-उपयोग ऐन') || !data.template_content.includes('lblSelectedZone'))) {
                            isOutdated = true;
                        } else if (templateId === 'charkilla' && (!data.template_content.includes('lblLandUseStatement') || !data.template_content.includes('भू-उपयोग ऐन') || !data.template_content.includes('lblSelectedZone') || (data.template_content.includes('नाममा तहाँ') && !data.template_content.includes('श्री भुमी प्रशासन')))) {
                            isOutdated = true;
                        } else if (templateId === 'nabalak-parichayapatra' && (!data.template_content.includes('lblDynamicRelation') || !data.template_content.includes('lblDynamicChildName'))) {
                            isOutdated = true;
                        } else if (templateId === 'suchana-tans' && (data.template_content.includes('किताामा') || data.template_content.includes('पूजी') || data.template_content.includes('A4-242.jpg') || data.template_content.includes('letterheadType'))) {
                            isOutdated = true;
                        } else if (templateId === 'bank-sifarish' && (!data.template_content.includes('lblTapasilCitLabel') || !data.template_content.includes('rowTapasilNid'))) {
                            isOutdated = true;
                        } else if (templateId === 'ghar-kayam' && (!data.template_content.includes('पूर्जा/सेस्तामा') || data.template_content.includes('पूजी') || data.template_content.includes('किताामा') || data.template_content.includes('जम्मा<br>क्षेत्रफल') || data.template_content.includes('जम्मा क्षेत्रफल'))) {
                            isOutdated = true;
                        } else if (templateId === 'abhilekh-pramanit' && (!data.template_content.includes('receiverAddressContainer') || data.template_content.includes('lblReceiverAddress'))) {
                            isOutdated = true;
                        } else if (templateId === 'aamdani-pramanit' && (!data.template_content.includes('globalLandAddr') || data.template_content.includes('width: 250px;') || !data.template_content.includes('lblLandDetails'))) {
                            isOutdated = true;
                        } else if (templateId === 'pariwarik-bibaran' && (!data.template_content.includes('outputTableHead') || !data.template_content.includes('familyDetailsTable'))) {
                            isOutdated = true;
                        }

                        if (isOutdated) {
                            seedLocalContent(db, templateId)
                                .then(resolveTemplatePromise)
                                .catch(resolveTemplatePromise);
                        } else if ((data.status === 'Active' || data.status === 'Published') && data.template_content) {
                            injectTemplateHTML(data.template_content);
                            resolveTemplatePromise();
                        } else {
                            resolveTemplatePromise();
                        }
                    } else if (!localOverride) {
                        // Document doesn't exist yet, so automatically seed it from local HTML
                        seedLocalContent(db, templateId)
                            .then(resolveTemplatePromise)
                            .catch(resolveTemplatePromise);
                    } else {
                        resolveTemplatePromise();
                    }
                }).catch((err) => {
                    resolveTemplatePromise();
                });
            } catch (e) {

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
        if (!tempDiv.querySelector('#lblReceiverAddress') && !tempDiv.querySelector('#receiverAddressContainer')) {
            const firstChild = tempDiv.firstElementChild;
            if (firstChild) {
                if (!firstChild.id) firstChild.id = 'receiverBlock';
                if (firstChild.children && firstChild.children.length > 0) {
                    if (!firstChild.children[0].id) firstChild.children[0].id = 'lblReceiverAddress';
                } else {
                    if (!firstChild.id) firstChild.id = 'lblReceiverAddress';
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
        const replaceDigit = wardNep;

        // 1. Document Title
        if (document.title) {
            document.title = document.title
                .replace(/वडा\s*न[ं]?\s*[\.\-]*\s*[०-९\d]+/g, "वडा नं. " + replaceDigit)
                .replace(/Ward\s*\d+/gi, "Ward " + ward);
        }

        // 2. Header & Title Elements
        document.querySelectorAll('.wada-title').forEach(el => {
            el.innerHTML = el.innerHTML
                .replace(/[१३२४५६७८९\d]+\s*न[ं]?\s*[\.\-]*\s*वडा/g, `${replaceDigit} नं. वडा`)
                .replace(/वडा\s*न[ं]?\s*[\.\-]*\s*[१३२४५६७८९\d]+/g, `वडा नं. ${replaceDigit}`);
        });

        document.querySelectorAll('.muni-wada-line').forEach(el => {
            el.innerHTML = el.innerHTML.replace(/वडा\s*न[ं]?\s*[\.\-]*\s*[१३२४५६७८९\d]+/g, `वडा नं. ${replaceDigit}`);
        });

        // Email address
        const email = (ward === '3') ? 'gauradahaward3@gmail.com' : 'ward1.gauradaha@gmail.com';
        document.querySelectorAll('.email-t').forEach(el => {
            el.innerText = `Email: ${email}`;
        });

        // Stamps & System Footers
        const nabalakStamp = document.getElementById('lblNabalakOfficeStamp');
        if (nabalakStamp) {
            nabalakStamp.innerText = 'गौरादह नगरपालिका वडा नं. ' + replaceDigit + ' कार्यालय';
        }
        document.querySelectorAll('.system-footer').forEach(el => {
            el.innerText = `गौरादह नगरपालिका वडा नं.${replaceDigit} • डिजिटल प्रणाली ©Sital Adhikari`;
        });

        // 3. Form Default Inputs & Selects for Ward
        const wardInputIds = [
            'inApplicantWadaNo', 'inWadaNo', 'inResidentWada', 'inLandWada', 
            'inWada', 'inSabikWada', 'inHalWada', 'inCustWada', 'wardSelect'
        ];
        wardInputIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (el.tagName === 'SELECT') {
                    const opt = Array.from(el.options).find(o => 
                        o.value === ward || 
                        o.value === replaceDigit || 
                        o.text.includes(`वडा नं. ${replaceDigit}`) || 
                        o.text.includes(`वडा नं. ${ward}`) || 
                        o.text.includes(`वडा ${replaceDigit}`) ||
                        o.text.includes(replaceDigit)
                    );
                    if (opt && el.value !== opt.value) {
                        el.value = opt.value;
                        if (typeof onWardOrCategoryChange === 'function') {
                            try { onWardOrCategoryChange(); } catch(e){}
                        }
                    }
                } else if (el.tagName === 'INPUT') {
                    if (!el.dataset.userEdited) {
                        if (!el.value || el.value === '१' || el.value === '1' || el.value === '३' || el.value === '3') {
                            el.value = replaceDigit;
                        }
                    }
                    if (el.placeholder && (el.placeholder.includes('१') || el.placeholder.includes('३'))) {
                        el.placeholder = el.placeholder.replace(/[१३]/g, replaceDigit);
                    }
                    el.addEventListener('input', () => { el.dataset.userEdited = 'true'; }, { once: true });
                }
            }
        });

        // Row input classes (.inp-hal-wada, .input-hal)
        document.querySelectorAll('.inp-hal-wada, .input-hal').forEach(el => {
            if (!el.dataset.userEdited && (!el.value || el.value === '१' || el.value === '३' || el.value.includes('गौरादह न.पा वडा नं.'))) {
                el.value = `गौरादह न.पा वडा नं.${replaceDigit}`;
            }
            el.addEventListener('input', () => { el.dataset.userEdited = 'true'; }, { once: true });
        });

        // 4. Letter Body Paragraphs in Preview
        const selectors = [
            '.letter-body-para', '.letter-body', '#bodyText', '#bodyTextJanma', 
            '#bodyTextBibaha', '#bodyTextTransfer', '#bodyBanda', '#bodyKholne'
        ];
        selectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
                el.innerHTML = el.innerHTML
                    .replace(/वडा\s*न[ं]?\s*[\.\-]*\s*[१३](?!\d)/g, `वडा नं.${replaceDigit}`)
                    .replace(/[१३]\s*न[ं]?\s*[\.\-]*\s*वडा/g, `${replaceDigit} नं. वडा`);
            });
        });

        // 5. Preview Spans
        const wardSpans = ['lblWadaBody', 'lblWadaBodyBanda', 'lblWadaSpan', 'lblLandWada', 'lblResidentWada', 'lblSifarisWada'];
        wardSpans.forEach(id => {
            const sp = document.getElementById(id);
            if (sp && (!sp.innerText || sp.innerText === '१' || sp.innerText === '३' || sp.innerText === '....' || sp.innerText === '...')) {
                sp.innerText = replaceDigit;
            }
        });
    }

    function setupDynamicSignatures() {
        const ward = localStorage.getItem('sifarish_ward') || '1';
        const select = document.getElementById('inSignAuthority');
        if (!select) return;

        // Page-specific signature configurations
        const isAbhilekh = templateId === 'abhilekh-pramanit';
        const isBankSifarish = templateId === 'bank-sifarish';

        let customSigList = null;
        try {
            customSigList = JSON.parse(localStorage.getItem('custom_signing_authorities') || '[]');
        } catch(e) {}

        // Force-correct Ward 3 sig_9 name (होमनाथ → हेमनाथ) in any cached data
        const SIG_VERSION = 'sig_v3_hemnath';
        if (localStorage.getItem('sig_authority_version') !== SIG_VERSION) {
            // Clear stale cached data so fresh defaults or Firestore corrected data loads
            localStorage.removeItem('custom_signing_authorities');
            localStorage.setItem('sig_authority_version', SIG_VERSION);
            customSigList = null;
        }
        if (customSigList && Array.isArray(customSigList) && customSigList.length > 0) {
            let migrated = false;
            customSigList.forEach(s => {
                if (s.name === 'होमनाथ थापा' || (s.id === 'sig_9' && s.ward === '3')) {
                    if (s.name !== 'हेमनाथ थापा') {
                        s.name = 'हेमनाथ थापा';
                        migrated = true;
                    }
                }
            });
            if (migrated) {
                localStorage.setItem('custom_signing_authorities', JSON.stringify(customSigList));
            }
        }

        let wardSigns = [];
        if (customSigList && customSigList.length > 0) {
            let filterCat = 'default';
            if (isAbhilekh) filterCat = 'abhilekh-pramanit';
            else if (isBankSifarish) filterCat = 'bank-sifarish';

            const matched = customSigList.filter(s => s.ward === ward && (s.category === filterCat || s.category === 'default' || !s.category));
            if (matched.length > 0) {
                wardSigns = matched.map(m => ({
                    value: `${m.name}|${m.title}`,
                    text: `${m.title} - ${m.name}`
                }));
            }
        }

        if (wardSigns.length === 0) {
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
                    { value: "हेमनाथ थापा|कार्यवाहक वडा अध्यक्ष", text: "कार्यवाहक वडा अध्यक्ष - हेमनाथ थापा" },
                    { value: "मेनुका बस्नेत|वडा सचिव", text: "वडा सचिव - मेनुका बस्नेत" },
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
                    { value: "दिलिप कुमार भण्डारी|वडा अध्यक्ष", text: "वडा अध्यक्ष - दिलिप कुमार भण्डारी" },
                    { value: "हेमनाथ थापा|कार्यवाहक वडा अध्यक्ष", text: "कार्यवाहक वडा अध्यक्ष - हेमनाथ थापा" },
                    { value: "मेनुका बस्नेत|वडा सचिव", text: "वडा सचिव - मेनुका बस्नेत" },
                    { value: "कल्पना अधिकारी|कार्यवाहक वडा अध्यक्ष", text: "कार्यवाहक वडा अध्यक्ष - कल्पना अधिकारी" }
                ]
            };

            let signatures;
            if (isAbhilekh) signatures = abhilekhSignatures;
            else if (isBankSifarish) signatures = bankSignatures;
            else signatures = defaultSignatures;
            wardSigns = signatures[ward] || [];
        }

        if (wardSigns && wardSigns.length > 0) {
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
                'bibaha-pramanit': 'विवाह प्रमाणित',
                'apangata-sifarish': 'अपाङ्गता परिचयपत्र सिफारिस',
                'abhilekh-pramanit': 'अभिलेख प्रमाणित',
                'arko-bibaha-nagareko': 'अर्को विवाह नगरेको प्रमाणित',
                'yojana-bank-sifarish': 'योजनाको बैंक खाता सिफारिस',
                'yojana-samjhauta': 'योजना सम्झौता सिफारिस',
                'bank-sifarish': 'सामाजिक सुरक्षा बैंक सिफारिस',
                'aamdani-pramanit': 'आम्दानी प्रमाणित सिफारिस',
                'bargikaran-sifarish': 'जग्गा वर्गीकरण सिफारिस',
                'jaggadhani-pratilipi': 'धनीपूर्जा प्रतिलिपि सिफारिस',
                'nabalak-parichayapatra': 'नाबालक परिचय पत्र सिफारिस'
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
                'bibaha-pramanit': 'व्यक्तिगत प्रमाणित',
                'apangata-sifarish': 'व्यक्तिगत प्रमाणित',
                'abhilekh-pramanit': 'व्यक्तिगत प्रमाणित',
                'arko-bibaha-nagareko': 'व्यक्तिगत प्रमाणित',
                'yojana-bank-sifarish': 'कार्यालय/प्रशासन',
                'yojana-samjhauta': 'कार्यालय/प्रशासन',
                'bank-sifarish': 'व्यक्तिगत प्रमाणित',
                'aamdani-pramanit': 'व्यक्तिगत प्रमाणित',
                'bargikaran-sifarish': 'जग्गा सम्बन्धि',
                'jaggadhani-pratilipi': 'जग्गा सम्बन्धि',
                'nabalak-parichayapatra': 'व्यक्तिगत प्रमाणित'
            };

            await db.collection('sifarish_templates').doc(id).set({
                id: id,
                title: titles[id] || id,
                category: categories[id] || 'अन्य',
                template_content: localContent,
                font_family: 'Mukta',
                default_font_size: (id === 'nabalak-parichayapatra') ? 11 : 14,
                status: 'Active',
                created_at: firebase.firestore.FieldValue.serverTimestamp(),
                updated_at: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

        } catch (e) {

        }
    }

    function initFontSettings() {
        localizePageForWard();
        setupDynamicSignatures();

        window.addEventListener('storage', (e) => {
            if (e.key === 'custom_signing_authorities' || e.key === 'sifarish_ward') {
                setupDynamicSignatures();
            }
        });
        window.addEventListener('signing_authorities_updated', setupDynamicSignatures);
        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
            try {
                firebase.firestore().collection('signing_authorities').onSnapshot(snap => {
                    const list = [];
                    snap.forEach(doc => {
                        const data = doc.data();
                        const item = { id: doc.id, ...data };
                        if (item.name === 'होमनाथ थापा' || (item.id === 'sig_9' && item.ward === '3')) {
                            if (item.name !== 'हेमनाथ थापा') {
                                item.name = 'हेमनाथ थापा';
                                try {
                                    firebase.firestore().collection('signing_authorities').doc(doc.id).set({ name: 'हेमनाथ थापा' }, { merge: true }).catch(e => {});
                                } catch(e) {}
                            }
                        }
                        list.push(item);
                    });
                    if (list.length > 0) {
                        localStorage.setItem('custom_signing_authorities', JSON.stringify(list));
                        setupDynamicSignatures();
                    }
                }, err => {});
            } catch(e) {}
        }

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

                    });
            });
        }

        // 1. Get saved styling values or defaults (Size: 11pt for nabalak-parichayapatra, 14pt for others)
        const isNabalak = (templateId === 'nabalak-parichayapatra' || window.location.pathname.includes('nabalak-parichayapatra.html'));
        const defaultFontSize = isNabalak ? '11' : '14';
        let savedSize = localStorage.getItem('doc_font_size_' + (templateId || 'global'));
        if (!savedSize) {
            const globalSize = localStorage.getItem('doc_font_size');
            savedSize = (globalSize && globalSize !== '13' && globalSize !== '14' && globalSize !== '11') ? globalSize : defaultFontSize;
        }
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

                /* Nabalak Parichayapatra table & compact layout scaling */
                .nabalak-tbl,
                .nabalak-tbl * {
                    font-size: calc(var(--doc-font-size) * 0.82) !important;
                    line-height: 1.35 !important;
                }
                .sifarish-para,
                .sifarish-para * {
                    font-size: calc(var(--doc-font-size) * 0.85) !important;
                    line-height: 1.35 !important;
                }
                #lblPhotoBox,
                #lblPhotoBox * {
                    font-size: 7.5pt !important;
                    line-height: 1.2 !important;
                }
            `;
        }

        // Apply styles initially
        applyStyles(savedSize, savedItalic, savedColor);

        // 5. Create Controls UI widget safely (prevent duplicates)
        let card = document.getElementById('fontSettingsCard');
        if (!card) {
            card = document.createElement('div');
            card.id = 'fontSettingsCard';
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

            // 6. Bind events (once)
            const slider = document.getElementById('fsSlider');
            const valLabel = document.getElementById('fsVal');
            const italicCheckbox = document.getElementById('fsItalic');
            const colorPicker = document.getElementById('fsColor');

            if (slider) {
                slider.addEventListener('input', (e) => {
                    const sz = e.target.value;
                    if (valLabel) valLabel.textContent = `${sz} pt`;
                    localStorage.setItem('doc_font_size_' + (templateId || 'global'), sz);
                    localStorage.setItem('doc_font_size', sz);
                    applyStyles(sz, italicCheckbox ? italicCheckbox.checked : false, colorPicker ? colorPicker.value : '#000000');
                });
            }

            if (italicCheckbox) {
                italicCheckbox.addEventListener('change', (e) => {
                    const it = e.target.checked;
                    localStorage.setItem('doc_font_style', it ? 'italic' : 'normal');
                    applyStyles(slider ? slider.value : savedSize, it, colorPicker ? colorPicker.value : '#000000');
                });
            }

            if (colorPicker) {
                colorPicker.addEventListener('input', (e) => {
                    const col = e.target.value;
                    localStorage.setItem('doc_text_color', col);
                    applyStyles(slider ? slider.value : savedSize, italicCheckbox ? italicCheckbox.checked : false, col);
                });
            }

            card.querySelectorAll('.color-preset').forEach(preset => {
                preset.addEventListener('click', () => {
                    const col = preset.getAttribute('data-color');
                    if (colorPicker) colorPicker.value = col;
                    localStorage.setItem('doc_text_color', col);
                    applyStyles(slider ? slider.value : savedSize, italicCheckbox ? italicCheckbox.checked : false, col);
                });
            });
        }

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
            
            // Auto-populate date fields if they are empty or have hardcoded placeholders
            setTimeout(() => {
                try {
                    const yStr = toNep(bsY);
                    const mStr = toNep(String(bsM).padStart(2, '0'));
                    const dStr = toNep(String(bsD).padStart(2, '0'));
                    const autoMiti = `${yStr}/${mStr}/${dStr}`;
                    const mFields = ['inMiti', 'inSubmitMiti', 'inCustomCertifiedMiti'];
                    let updated = false;
                    mFields.forEach(id => {
                        const el = document.getElementById(id);
                        if (el && (!el.value || el.value.trim() === '' || el.value === '२०८३/' || el.value === '२०८३/०२/२७' || el.value === '२०८३/०२/१८')) {
                            el.value = autoMiti;
                            updated = true;
                        }
                    });
                    if (updated && typeof updateDoc === 'function') {
                        updateDoc();
                    }
                } catch(err) {

                }
            }, 500);
            
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

            // Dynamic Ward Number & Signatures Initialization
            try {
                localizePageForWard();
                setupDynamicSignatures();
                if (typeof updateDoc === 'function') {
                    try { updateDoc(); } catch(e) {}
                }
            } catch(e) { /* logged */ }
        } catch(e) {}
    }

    // Run ward localization and signature setup on all lifecycle stages
    window.addEventListener('templateInjected', () => {
        try {
            localizePageForWard();
            setupDynamicSignatures();
            if (typeof updateDoc === 'function') {
                try { updateDoc(); } catch(e) {}
            }
        } catch(e) {}
    });

    window.addEventListener('load', () => {
        try {
            localizePageForWard();
            setupDynamicSignatures();
        } catch(e) {}
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFontSettings);
    } else {
        initFontSettings();
    }
})();


