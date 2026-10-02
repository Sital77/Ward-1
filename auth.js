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

// Global Citizenship Number Auto-Conversion (English 0-9 -> Nepali ०-९)
(function setupCitizenshipConverter() {
    function isCitField(el) {
        if (!el || el.tagName !== 'INPUT' || (el.type !== 'text' && el.type !== 'search' && el.type !== '')) return false;
        const id = (el.id || '').toLowerCase();
        const name = (el.name || '').toLowerCase();
        const cls = (el.className || '').toLowerCase();
        const placeholder = (el.placeholder || '').toLowerCase();
        if (id.includes('cit') || id.includes('nagarik') || id.includes('nagrik') || id.includes('citizenship')) return true;
        if (name.includes('cit') || name.includes('nagarik') || name.includes('nagrik') || name.includes('citizenship')) return true;
        if (cls.includes('member-document') || cls.includes('cit-input') || cls.includes('cit-field')) return true;
        if (placeholder.includes('नागरिकता') || placeholder.includes('ना.प्र.नं') || placeholder.includes('ना.नं') || placeholder.includes('नाप्रनं') || placeholder.includes('नागरिक')) return true;

        const parent = el.closest('.input-group, .form-group, td, tr, div');
        if (parent) {
            const lbl = parent.querySelector('label');
            if (lbl && /नागरिकता|ना\.?प्र\.?नं|ना\.?नं|नागरिक/i.test(lbl.innerText || '')) return true;
            const prev = el.previousElementSibling;
            if (prev && /नागरिकता|ना\.?प्र\.?नं|ना\.?नं|नागरिक/i.test(prev.innerText || '')) return true;
        }
        return false;
    }

    function handleCitInput(el) {
        if (!isCitField(el)) return;
        const val = el.value;
        if (/[0-9]/.test(val)) {
            const start = el.selectionStart;
            const end = el.selectionEnd;
            el.value = window.toNepaliDigit(val);
            if (start !== null && end !== null) {
                el.setSelectionRange(start, end);
            }
            if (typeof updateDoc === 'function') {
                try { updateDoc(); } catch (e) {}
            }
            if (typeof convertCitElementsToNepali === 'function') {
                try { convertCitElementsToNepali(); } catch (e) {}
            }
        }
    }

    document.addEventListener('input', e => handleCitInput(e.target), true);
    document.addEventListener('paste', e => setTimeout(() => handleCitInput(e.target), 10), true);
    document.addEventListener('blur', e => handleCitInput(e.target), true);
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
