/**
 * auth.js — Sifarish System Authentication Guard & Utilities
 * Bulletproof, fast, backward-compatible, no redirect loops.
 */

(function () {
    const faviconUrl = 'assets/emblem_of_nepal.svg';
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/svg+xml';
        link.href = faviconUrl;
        document.head.appendChild(link);
    }
})();

const AUTH_CONFIG = {
    SESSION_KEY: 'sifarish_session',
    ADMIN_KEY: 'sifarish_admin',
    AUTH_KEY: 'sifarish_auth',
    REDIRECT_KEY: 'sifarish_redirect',
    DEFAULT_EXPIRY_HOURS: 8760,
    REMEMBER_EXPIRY_HOURS: 8760,
    TOKEN_PREFIX: 'sif_'
};

function generateSessionToken(rememberMe, isAdmin) {
    const expiry = rememberMe ? AUTH_CONFIG.REMEMBER_EXPIRY_HOURS : AUTH_CONFIG.DEFAULT_EXPIRY_HOURS;
    const expiresAt = Date.now() + (expiry * 60 * 60 * 1000);
    const tokenId = AUTH_CONFIG.TOKEN_PREFIX + Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
    return {
        token: tokenId,
        createdAt: Date.now(),
        expiresAt: expiresAt,
        rememberMe: rememberMe,
        isAdmin: !!isAdmin
    };
}

function createSession(isAdmin, rememberMe) {
    const user = (localStorage.getItem('sifarish_user') || '').trim().toLowerCase();
    if (user === 'wada1' || user === 'wada3') {
        isAdmin = false;
    }
    const session = generateSessionToken(rememberMe || false, isAdmin);
    session.isAdmin = !!isAdmin;
    localStorage.setItem(AUTH_CONFIG.SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(AUTH_CONFIG.AUTH_KEY, 'true');
    localStorage.setItem(AUTH_CONFIG.ADMIN_KEY, isAdmin ? 'true' : 'false');
}

function isSessionValid() {
    try {
        if (localStorage.getItem(AUTH_CONFIG.AUTH_KEY) === 'true') {
            return true;
        }
        const sessionStr = localStorage.getItem(AUTH_CONFIG.SESSION_KEY);
        if (!sessionStr) return false;
        const session = JSON.parse(sessionStr);
        if (!session.token || !session.expiresAt) return false;
        if (Date.now() > session.expiresAt) return false;
        return true;
    } catch (e) {
        return false;
    }
}

function isAdminSession() {
    try {
        const user = (localStorage.getItem('sifarish_user') || '').trim().toLowerCase();
        if (user === 'wada1' || user === 'wada3') {
            if (localStorage.getItem(AUTH_CONFIG.ADMIN_KEY) === 'true') {
                localStorage.setItem(AUTH_CONFIG.ADMIN_KEY, 'false');
            }
            return false;
        }
        if (localStorage.getItem(AUTH_CONFIG.ADMIN_KEY) === 'true') return true;
        const sessionStr = localStorage.getItem(AUTH_CONFIG.SESSION_KEY);
        if (!sessionStr) return false;
        const session = JSON.parse(sessionStr);
        return session.isAdmin === true;
    } catch (e) {
        return false;
    }
}

// Universal Nepali / English digit conversion
window.toNepaliDigit = function (num) {
    if (num === null || num === undefined) return '';
    const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return String(num).replace(/[0-9]/g, d => nepaliDigits[d]);
};

window.toEnglishDigit = function (num) {
    if (num === null || num === undefined) return '';
    const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return String(num).replace(/[०-९]/g, d => {
        const idx = nepaliDigits.indexOf(d);
        return idx !== -1 ? String(idx) : d;
    });
};

// Universal Sifarish letter digit converter (transforms ASCII 0-9 into Nepali digits ०-९ in preview and print)
window.convertSifarishDigitsToNepali = function () {
    const toNep = typeof window.toNepaliDigit === 'function' ? window.toNepaliDigit : (x => x);
    const containers = document.querySelectorAll('.a4-page, #printArea, #printPage1, #printPage2, .preview-panel .document, .print-container, #printDocument');
    if (!containers || containers.length === 0) return;

    containers.forEach(container => {
        const walker = document.createTreeWalker(
            container,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function (node) {
                    const parent = node.parentElement;
                    if (!parent) return NodeFilter.FILTER_REJECT;
                    const tag = parent.tagName;
                    if (tag === 'SCRIPT' || tag === 'STYLE') return NodeFilter.FILTER_REJECT;
                    if (parent.closest('.no-nepali-digits, .no-convert, .english-text, [data-no-nepali="true"]')) return NodeFilter.FILTER_REJECT;
                    const id = parent.id || '';
                    if (id.endsWith('EN') || id.endsWith('EN_tbl') || id.includes('DOB_AD') || id.endsWith('_AD')) return NodeFilter.FILTER_REJECT;
                    if (/[0-9]/.test(node.nodeValue)) {
                        return NodeFilter.FILTER_ACCEPT;
                    }
                    return NodeFilter.FILTER_SKIP;
                }
            },
            false
        );

        const nodesToUpdate = [];
        while (walker.nextNode()) {
            nodesToUpdate.push(walker.currentNode);
        }

        nodesToUpdate.forEach(node => {
            node.nodeValue = toNep(node.nodeValue);
        });
    });
};

// Backward compatibility alias
window.convertCitElementsToNepali = function () {
    if (typeof window.convertSifarishDigitsToNepali === 'function') {
        window.convertSifarishDigitsToNepali();
    }
};

// Universal Sifarish Input Auto-Conversion (English 0-9 -> Nepali ०-९)
(function setupUniversalSifarishDigitConverter() {
    function isEligibleInput(el) {
        if (!el) return false;
        const tag = el.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') return false;

        if (tag === 'INPUT') {
            const type = (el.type || 'text').toLowerCase();
            if (type === 'password' || type === 'email' || type === 'number' || 
                type === 'file' || type === 'checkbox' || type === 'radio' || 
                type === 'range' || type === 'button' || type === 'submit' || 
                type === 'reset' || type === 'color' || type === 'hidden') {
                return false;
            }
        }

        const id = el.id || '';
        const cls = el.className || '';
        if (cls.includes('no-nepali-digits') || cls.includes('no-convert') || cls.includes('english-input') || cls.includes('english-text')) return false;
        if (id.endsWith('EN') || id.endsWith('_AD') || id.includes('DOB_AD')) return false;
        if (el.dataset && (el.dataset.noNepaliDigit === 'true' || el.dataset.noNepaliDigits === 'true')) return false;

        const path = (window.location.pathname || '').toLowerCase();
        if (path.includes('login.html')) return false;
        if (path.includes('calculator.html') || path.includes('malpot-calculator.html') || path.includes('jaribana-hisab.html')) return false;

        if (path.includes('admin.html')) {
            const lowerId = id.toLowerCase();
            const lowerName = (el.name || '').toLowerCase();
            if (lowerId.includes('pass') || lowerId.includes('pwd') || lowerId.includes('user') || lowerId.includes('key') || lowerId.includes('token') || lowerId.includes('secret') || lowerId.includes('email') ||
                lowerName.includes('pass') || lowerName.includes('pwd') || lowerName.includes('user') || lowerName.includes('key') || lowerName.includes('token') || lowerName.includes('email')) {
                return false;
            }
        }

        return true;
    }

    function handleDigitInput(el) {
        if (!isEligibleInput(el)) return;
        const val = el.value;
        if (val && /[0-9]/.test(val)) {
            const start = el.selectionStart;
            const end = el.selectionEnd;
            el.value = window.toNepaliDigit(val);
            if (start !== null && end !== null && typeof el.setSelectionRange === 'function') {
                try {
                    el.setSelectionRange(start, end);
                } catch (e) {}
            }
            if (typeof updateDoc === 'function') {
                try { updateDoc(); } catch (e) {}
            }
            if (typeof window.convertSifarishDigitsToNepali === 'function') {
                try { window.convertSifarishDigitsToNepali(); } catch (e) {}
            }
        }
    }

    function convertAllExistingInputs() {
        try {
            const inputs = document.querySelectorAll('.input-panel input, .input-panel textarea, form input, form textarea, table input, .kitta-row-block input');
            inputs.forEach(inp => {
                if (isEligibleInput(inp) && inp.value && /[0-9]/.test(inp.value)) {
                    inp.value = window.toNepaliDigit(inp.value);
                }
            });
            if (typeof updateDoc === 'function') {
                try { updateDoc(); } catch (e) {}
            }
            if (typeof window.convertSifarishDigitsToNepali === 'function') {
                try { window.convertSifarishDigitsToNepali(); } catch (e) {}
            }
        } catch (e) {}
    }

    let isConvertingObserver = false;
    function setupLetterObserver() {
        const containers = document.querySelectorAll('.a4-page, #printArea, #printPage1, #printPage2');
        if (!containers || containers.length === 0) return;

        const observer = new MutationObserver((mutations) => {
            if (isConvertingObserver) return;
            let needsConversion = false;
            for (const m of mutations) {
                if (m.type === 'characterData' && /[0-9]/.test(m.target.nodeValue)) {
                    needsConversion = true;
                    break;
                } else if (m.type === 'childList') {
                    for (const node of m.addedNodes) {
                        if (node.nodeType === Node.TEXT_NODE && /[0-9]/.test(node.nodeValue)) {
                            needsConversion = true;
                            break;
                        } else if (node.nodeType === Node.ELEMENT_NODE && /[0-9]/.test(node.textContent)) {
                            needsConversion = true;
                            break;
                        }
                    }
                    if (needsConversion) break;
                }
            }
            if (needsConversion) {
                isConvertingObserver = true;
                try {
                    window.convertSifarishDigitsToNepali();
                } finally {
                    isConvertingObserver = false;
                }
            }
        });

        containers.forEach(c => {
            try {
                observer.observe(c, { childList: true, subtree: true, characterData: true });
            } catch (e) {}
        });
    }

    document.addEventListener('input', e => handleDigitInput(e.target), true);
    document.addEventListener('paste', e => setTimeout(() => handleDigitInput(e.target), 10), true);
    document.addEventListener('blur', e => handleDigitInput(e.target), true);
    document.addEventListener('change', e => handleDigitInput(e.target), true);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            convertAllExistingInputs();
            setupLetterObserver();
        });
    } else {
        setTimeout(() => {
            convertAllExistingInputs();
            setupLetterObserver();
        }, 50);
    }

    window.addEventListener('load', () => {
        convertAllExistingInputs();
        setupLetterObserver();
    });

    window.addEventListener('beforeprint', () => {
        if (typeof window.convertSifarishDigitsToNepali === 'function') {
            try { window.convertSifarishDigitsToNepali(); } catch (e) {}
        }
    });

    if (typeof window.print === 'function') {
        const nativePrint = window.print;
        window.print = function () {
            try { window.convertSifarishDigitsToNepali(); } catch (e) {}
            return nativePrint.apply(this, arguments);
        };
    }
})();

function clearSession() {
    localStorage.removeItem(AUTH_CONFIG.SESSION_KEY);
    localStorage.removeItem(AUTH_CONFIG.AUTH_KEY);
    localStorage.removeItem(AUTH_CONFIG.ADMIN_KEY);
    localStorage.removeItem(AUTH_CONFIG.REDIRECT_KEY);
    sessionStorage.removeItem(AUTH_CONFIG.SESSION_KEY);
}

function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

function sanitizeHTML(html) {
    if (typeof html !== 'string') return '';
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/on\w+\s*=\s*[^\s>]+/gi, '')
        .replace(/javascript\s*:/gi, '');
}

// ===== AUTH GUARD =====
(function () {
    'use strict';

    // Do not run guard on login.html
    const currentPath = window.location.pathname.toLowerCase();
    if (currentPath.includes('login.html')) {
        return;
    }

    const hasValidSession = isSessionValid();

    if (!hasValidSession) {
        localStorage.setItem(AUTH_CONFIG.REDIRECT_KEY, window.location.href);
        window.location.replace('login.html');
        return;
    }

    if (currentPath.includes('admin.html') && !isAdminSession()) {
        alert('⚠️ Admin व्यवस्थापन पृष्ठमा प्रवेश गर्न Admin अनुमति आवश्यक छ।');
        window.location.replace('index.html');
        return;
    }
})();

function logout() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
        try { firebase.auth().signOut(); } catch (e) {}
    }
    clearSession();
    window.location.replace('login.html');
}

// ===== RECYCLE BIN & SOFT DELETE HELPERS =====
window.softDeleteRecord = async function (collectionName, docId, summaryData) {
    if (!collectionName || !docId) return false;
    const db = firebase.firestore();
    const now = Date.now();
    const user = localStorage.getItem('sifarish_user') || 'वडा कर्मचारी';

    await db.collection(collectionName).doc(docId).update({
        isDeleted: true,
        deletedAtMillis: now,
        deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
        deletedBy: user
    });

    try {
        const logId = `${collectionName}_${docId}`;
        await db.collection('deleted_records_log').doc(logId).set({
            collectionName: collectionName,
            originalDocId: docId,
            deletedAtMillis: now,
            deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
            deletedBy: user,
            summary: summaryData || {},
            expiresAtMillis: now + (100 * 24 * 60 * 60 * 1000),
            status: 'in_bin'
        });
    } catch (e) {}
    return true;
};

window.restoreRecord = async function (collectionName, docId) {
    if (!collectionName || !docId) return false;
    const db = firebase.firestore();

    await db.collection(collectionName).doc(docId).update({
        isDeleted: false,
        restoredAtMillis: Date.now(),
        restoredAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    try {
        const logId = `${collectionName}_${docId}`;
        await db.collection('deleted_records_log').doc(logId).delete();
    } catch (e) {}
    return true;
};

window.purgeExpiredDeletedRecords = async function () {
    if (typeof firebase === 'undefined') return 0;
    const db = firebase.firestore();
    const hundredDaysAgo = Date.now() - (100 * 24 * 60 * 60 * 1000);

    try {
        const snap = await db.collection('deleted_records_log')
            .where('deletedAtMillis', '<', hundredDaysAgo)
            .limit(50)
            .get();

        if (snap.empty) return 0;
        for (const doc of snap.docs) {
            const data = doc.data();
            if (data.collectionName && data.originalDocId) {
                await db.collection(data.collectionName).doc(data.originalDocId).delete().catch(() => {});
            }
            await doc.ref.delete().catch(() => {});
        }
        return snap.size;
    } catch (e) {
        return 0;
    }
};

// Unregister any broken service worker that intercepts clicks
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function (registrations) {
        for (let registration of registrations) {
            registration.unregister();
        }
    }).catch(function () {});
}
