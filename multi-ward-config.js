/**
 * Gauradaha Municipal Sifarish Management Platform — Multi-Ward Core Configuration Engine
 * (multi-ward-config.js)
 * 
 * Central Super Admin + 9 Independent Ward Architecture
 * Handles:
 * - Dynamic 9-Ward metadata & configuration
 * - Configurable Municipality tenant profile (Gauradaha default, extensible)
 * - Strict Ward Context Resolution (Super Admin switcher vs Locked Ward Staff)
 * - Ward-specific Letterhead, Contact, and Address resolution
 * - Ward-specific Former VDC / Local Area Master Data
 * - Strict Land Classification Gatekeeper (Ward 1 + Super Admin only)
 * - Independent Atomic Chalani Number Generation
 * - Audit Logging Engine
 */

(function (window) {
    'use strict';

    const MultiWard = window.MultiWard || {};

    // ── 1. Default Municipal Profile ──
    MultiWard.DEFAULT_MUNICIPALITY = {
        id: 'gauradaha',
        nameNepali: 'गौरादह नगरपालिका',
        nameEnglish: 'Gauradaha Municipality',
        officeNepali: 'नगर कार्यपालिकाको कार्यालय',
        provinceNepali: 'कोशी प्रदेश',
        districtNepali: 'झापा',
        defaultTotalWards: 9,
        countryNepali: 'नेपाल',
        emblemUrl: 'assets/emblem_of_nepal.svg'
    };

    // ── 2. 9 Independent Ward Profiles ──
    const DEFAULT_WARD_PROFILES = {
        '1': {
            wardNumber: 1,
            wardNameNepali: '१ नं. वडा कार्यालय',
            officeAddress: 'गौरादह, झापा',
            email: 'ward1.gauradaha@gmail.com',
            phone: '०२३-५८०१२१',
            letterheadBannerUrl: '',
            chairperson: 'तिलक प्रसाद दाहाल',
            secretary: 'हेमनाथ थापा',
            formerVDCs: [
                'साविक गौरादह गा.वि.स. वडा नं. १',
                'साविक गौरादह गा.वि.स. वडा नं. २',
                'साविक गौरादह गा.वि.स. वडा नं. ३'
            ],
            toles: ['गौरादह बजार', 'डोंगी चोक', 'मिलन चोक', 'जनता चोक', 'शान्ति टोल'],
            hasLandClassification: true
        },
        '2': {
            wardNumber: 2,
            wardNameNepali: '२ नं. वडा कार्यालय',
            officeAddress: 'गौरादह, झापा',
            email: 'ward2.gauradaha@gmail.com',
            phone: '०२३-५८०१२२',
            letterheadBannerUrl: '',
            chairperson: 'गोपाल प्रसाद निरौला',
            secretary: 'राम कुमार बस्नेत',
            formerVDCs: [
                'साविक गौरादह गा.वि.स. वडा नं. ३',
                'साविक गौरादह गा.वि.स. वडा नं. ४'
            ],
            toles: ['खजुरगाछी चोक', 'प्रगति टोल', 'सिर्जना बस्ती'],
            hasLandClassification: false
        },
        '3': {
            wardNumber: 3,
            wardNameNepali: '३ नं. वडा कार्यालय',
            officeAddress: 'गौरादह, झापा',
            email: 'gauradahaward3@gmail.com',
            phone: '०२३-५८०१२३',
            letterheadBannerUrl: '',
            chairperson: 'गजेन्द्र घिमिरे',
            secretary: 'हेमनाथ थापा',
            formerVDCs: [
                'साविक गौरादह गा.वि.स. वडा नं. ५',
                'साविक गौरादह गा.वि.स. वडा नं. ६'
            ],
            toles: ['धोबा चोक', 'नवप्रभात टोल', 'सूर्यमुखी टोल'],
            hasLandClassification: false
        },
        '4': {
            wardNumber: 4,
            wardNameNepali: '४ नं. वडा कार्यालय',
            officeAddress: 'गौरादह, झापा',
            email: 'ward4.gauradaha@gmail.com',
            phone: '०२३-५८०१२४',
            letterheadBannerUrl: '',
            chairperson: 'दुर्गा प्रसाद भट्टराई',
            secretary: 'कृष्ण बहादुर श्रेष्ठ',
            formerVDCs: [
                'साविक कोहबरा गा.वि.स. वडा नं. १',
                'साविक कोहबरा गा.वि.स. वडा नं. २'
            ],
            toles: ['कोहबरा चोक', 'हरियाली टोल', 'विशाल चोक'],
            hasLandClassification: false
        },
        '5': {
            wardNumber: 5,
            wardNameNepali: '५ नं. वडा कार्यालय',
            officeAddress: 'गौरादह, झापा',
            email: 'ward5.gauradaha@gmail.com',
            phone: '०२३-५८०१२५',
            letterheadBannerUrl: '',
            chairperson: 'यादव चन्द्र भट्टराई',
            secretary: 'सुरेन्द्र अधिकारी',
            formerVDCs: [
                'साविक कोहबरा गा.वि.स. वडा नं. ३',
                'साविक कोहबरा गा.वि.स. वडा नं. ४'
            ],
            toles: ['चपामारी', 'लक्ष्मी टोल', 'उत्तर बस्ती'],
            hasLandClassification: false
        },
        '6': {
            wardNumber: 6,
            wardNameNepali: '६ नं. वडा कार्यालय',
            officeAddress: 'गौरादह, झापा',
            email: 'ward6.gauradaha@gmail.com',
            phone: '०२३-५८०१२६',
            letterheadBannerUrl: '',
            chairperson: 'खड्ग नारायण राजवंशी',
            secretary: 'दिलीप कुमार महतो',
            formerVDCs: [
                'साविक कोहबरा गा.वि.स. वडा नं. ५',
                'साविक कोहबरा गा.वि.स. वडा नं. ६'
            ],
            toles: ['दामुनगाछी', 'राजवंशी टोल', 'कवि चोक'],
            hasLandClassification: false
        },
        '7': {
            wardNumber: 7,
            wardNameNepali: '७ नं. वडा कार्यालय',
            officeAddress: 'गौरादह, झापा',
            email: 'ward7.gauradaha@gmail.com',
            phone: '०२३-५८०१२७',
            letterheadBannerUrl: '',
            chairperson: 'उद्धव प्रसाद अधिकारी',
            secretary: 'मीन कुमार खड्का',
            formerVDCs: [
                'साविक जुरोपानी गा.वि.स. वडा नं. १',
                'साविक जुरोपानी गा.वि.स. वडा नं. २'
            ],
            toles: ['जुरोपानी बजार', 'सिमलबारी', 'सरस्वती टोल'],
            hasLandClassification: false
        },
        '8': {
            wardNumber: 8,
            wardNameNepali: '८ नं. वडा कार्यालय',
            officeAddress: 'गौरादह, झापा',
            email: 'ward8.gauradaha@gmail.com',
            phone: '०२३-५८०१२८',
            letterheadBannerUrl: '',
            chairperson: 'ईश्वरी प्रसाद दाहाल',
            secretary: 'प्रकाश पौडेल',
            formerVDCs: [
                'साविक जुरोपानी गा.वि.स. वडा नं. ३',
                'साविक जुरोपानी गा.वि.स. वडा नं. ४'
            ],
            toles: ['स्कुल डाँडा', 'मिलन बस्ती', 'ज्ञानोदय टोल'],
            hasLandClassification: false
        },
        '9': {
            wardNumber: 9,
            wardNameNepali: '९ नं. वडा कार्यालय',
            officeAddress: 'गौरादह, झापा',
            email: 'ward9.gauradaha@gmail.com',
            phone: '०२३-५८०१२९',
            letterheadBannerUrl: '',
            chairperson: 'पुष्पलाल ढकाल',
            secretary: 'सन्तोष दाहाल',
            formerVDCs: [
                'साविक बैगुनधुरा गा.वि.स. वडा नं. १',
                'साविक बैगुनधुरा गा.वि.स. वडा नं. २'
            ],
            toles: ['बैगुनधुरा बजार', 'कमल टोल', 'शान्तिनगर'],
            hasLandClassification: false
        }
    };

    // ── Helper: Digits ──
    MultiWard.toNepaliDigit = function (n) {
        if (n === null || n === undefined) return '';
        const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
        return String(n).replace(/[0-9]/g, d => nepaliDigits[d]);
    };

    MultiWard.toEnglishDigit = function (n) {
        if (n === null || n === undefined) return '';
        const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
        return String(n).replace(/[०-९]/g, d => {
            const idx = nepaliDigits.indexOf(d);
            return idx !== -1 ? String(idx) : d;
        });
    };

    // ── 3. Active Ward Context & Permissions ──
    MultiWard.getCurrentUser = function () {
        return (localStorage.getItem('sifarish_user') || '').trim();
    };

    MultiWard.getUserRole = function () {
        const user = MultiWard.getCurrentUser().toLowerCase();
        const role = localStorage.getItem('sifarish_role') || '';
        const isAdmin = localStorage.getItem('sifarish_admin') === 'true';

        if (user === 'sital' || role === 'super_admin' || (user === 'admin' && isAdmin)) {
            return 'super_admin';
        }
        if (role === 'ward_admin') {
            return 'ward_admin';
        }
        return 'ward_staff';
    };

    MultiWard.isSuperAdmin = function () {
        return MultiWard.getUserRole() === 'super_admin';
    };

    MultiWard.getActiveWard = function () {
        const user = MultiWard.getCurrentUser().toLowerCase();
        // Ward-bound accounts are strictly locked to their assigned ward
        const wardMatch = user.match(/^wada([1-9])$|^ward([1-9])$/);
        if (wardMatch && !MultiWard.isSuperAdmin()) {
            const boundWard = wardMatch[1] || wardMatch[2];
            localStorage.setItem('sifarish_ward', boundWard);
            return boundWard;
        }

        const storedWard = localStorage.getItem('sifarish_ward');
        if (storedWard && ['1','2','3','4','5','6','7','8','9'].includes(storedWard)) {
            return storedWard;
        }
        return '1';
    };

    MultiWard.setActiveWard = function (wardNum) {
        const cleanWard = String(wardNum || '1').trim();
        if (!['1','2','3','4','5','6','7','8','9'].includes(cleanWard)) {
            console.error('Invalid ward number:', wardNum);
            return false;
        }

        // Only Super Admin can freely switch wards
        if (!MultiWard.isSuperAdmin()) {
            const currentWard = MultiWard.getActiveWard();
            if (currentWard !== cleanWard) {
                console.warn('[MultiWard] Non-super-admin user cannot switch ward contexts.');
                return false;
            }
        }

        localStorage.setItem('sifarish_ward', cleanWard);
        window.dispatchEvent(new CustomEvent('wardChanged', { detail: { ward: cleanWard } }));
        return true;
    };

    // ── 4. Ward Profile Loader & Syncer ──
    MultiWard.getWardProfile = function (wardNum) {
        const w = String(wardNum || MultiWard.getActiveWard());
        try {
            const cached = localStorage.getItem(`ward_profile_${w}`);
            if (cached) {
                const parsed = JSON.parse(cached);
                return { ...(DEFAULT_WARD_PROFILES[w] || DEFAULT_WARD_PROFILES['1']), ...parsed };
            }
        } catch (e) {}
        return DEFAULT_WARD_PROFILES[w] || DEFAULT_WARD_PROFILES['1'];
    };

    MultiWard.saveWardProfileLocal = function (wardNum, profileData) {
        const w = String(wardNum);
        const existing = MultiWard.getWardProfile(w);
        const merged = { ...existing, ...profileData, wardNumber: parseInt(w, 10) };
        localStorage.setItem(`ward_profile_${w}`, JSON.stringify(merged));
        return merged;
    };

    MultiWard.syncWardProfilesFromFirestore = async function (db) {
        if (!db) return;
        try {
            const snap = await db.collection('ward_profiles').get();
            snap.forEach(doc => {
                const data = doc.data();
                if (data && doc.id) {
                    localStorage.setItem(`ward_profile_${doc.id}`, JSON.stringify(data));
                }
            });
        } catch (e) {
            console.warn('[MultiWard] Could not fetch remote ward profiles:', e);
        }
    };

    // ── 5. Land Classification Access Gate ──
    MultiWard.canAccessLandClassification = function () {
        const activeWard = MultiWard.getActiveWard();
        const isSuper = MultiWard.isSuperAdmin();
        // Exclusively Ward 1 and Super Admin
        return isSuper || activeWard === '1';
    };

    // ── 6. Independent Atomic Numbering (Chalani) ──
    MultiWard.getNextChalani = async function (db, recType, wardNum) {
        const w = String(wardNum || MultiWard.getActiveWard());
        const type = recType || 'general';
        const docKey = `ward_${w}_${type}`;
        
        if (!db) {
            // Local fallback
            const localKey = `counter_w${w}_${type}`;
            let current = parseInt(localStorage.getItem(localKey) || '0', 10) + 1;
            localStorage.setItem(localKey, String(current));
            return MultiWard.toNepaliDigit(current);
        }

        try {
            const counterRef = db.collection('sifarish_counters').doc(docKey);
            const nextVal = await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(counterRef);
                let count = 1;
                if (doc.exists) {
                    count = (doc.data().lastNumber || 0) + 1;
                }
                transaction.set(counterRef, {
                    lastNumber: count,
                    ward_id: parseInt(w, 10),
                    type: type,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                return count;
            });
            return MultiWard.toNepaliDigit(nextVal);
        } catch (e) {
            console.warn('[MultiWard] Transaction counter failed, falling back:', e);
            const fallbackKey = `counter_w${w}_${type}`;
            let cur = parseInt(localStorage.getItem(fallbackKey) || '1', 10) + 1;
            localStorage.setItem(fallbackKey, String(cur));
            return MultiWard.toNepaliDigit(cur);
        }
    };

    // ── 7. Central Audit Logging Engine ──
    MultiWard.logAuditEvent = async function (db, action, details) {
        const user = MultiWard.getCurrentUser() || 'system';
        const ward = MultiWard.getActiveWard();
        const role = MultiWard.getUserRole();
        const payload = {
            timestamp: Date.now(),
            action: action || 'UNKNOWN_ACTION',
            user: user,
            ward_id: parseInt(ward, 10),
            role: role,
            details: details || {},
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
        };

        try {
            if (db && typeof firebase !== 'undefined') {
                payload.serverTimestamp = firebase.firestore.FieldValue.serverTimestamp();
                await db.collection('audit_logs').add(payload);
            }
        } catch (e) {
            console.warn('[MultiWard] Audit log writing error:', e);
        }
    };

    // ── 8. Dynamic Letterhead Renderer ──
    MultiWard.applyLetterheadToDocument = function (container) {
        if (!container && typeof document !== 'undefined') {
            container = document;
        }
        if (!container) return;

        const wardNum = MultiWard.getActiveWard();
        const profile = MultiWard.getWardProfile(wardNum);
        const wardNep = MultiWard.toNepaliDigit(wardNum);

        // Update office titles
        const titles = container.querySelectorAll('.wada-title, .header-ward-title, .print-ward-title');
        titles.forEach(el => {
            el.innerHTML = `${wardNep} नं. वडा कार्यालय`;
        });

        // Update email displays
        const emails = container.querySelectorAll('.email-t, .header-email, .ward-email-display');
        emails.forEach(el => {
            el.innerText = `Email: ${profile.email}`;
            el.classList.add('no-convert', 'english-text');
        });

        // Update address displays
        const addresses = container.querySelectorAll('.address-t, .header-address');
        addresses.forEach(el => {
            el.innerText = profile.officeAddress || `${MultiWard.DEFAULT_MUNICIPALITY.districtNepali}, ${MultiWard.DEFAULT_MUNICIPALITY.provinceNepali}`;
        });

        // If custom banner exists, display it
        if (profile.letterheadBannerUrl) {
            const letterheadHeader = container.querySelector('.letterhead, .print-letterhead, .official-letterhead');
            if (letterheadHeader) {
                letterheadHeader.dataset.customBanner = profile.letterheadBannerUrl;
            }
        }
    };

    window.MultiWard = MultiWard;

})(typeof window !== 'undefined' ? window : this);

