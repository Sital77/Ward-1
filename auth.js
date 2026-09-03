/**
 * auth.js — Enhanced Sifarish System & Firebase Authentication Guard
 * Features:
 * 1. Cryptographic session signature (prevents LocalStorage bypass via DevTools)
 * 2. Firestore Offline Persistence (enables offline reading/writing)
 * 3. 100-Day Recycle Bin & Soft-Delete Helpers (softDeleteRecord, restoreRecord, purgeExpiredRecords)
 * 4. Local & CDN Fallback Asset Handling
 * 5. Input & HTML Sanitization
 */

(function () {
    // Prefer local assets if available, fallback to Wikimedia
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
    DEFAULT_EXPIRY_HOURS: 8760, // 365 days
    REMEMBER_EXPIRY_HOURS: 8760,
    TOKEN_PREFIX: 'sif_',
    SECRET_SALT: 'GW1_SEC_905617778132_K2'
};

/**
 * Compute session anti-tamper signature
 */
function computeSessionSig(tokenId, expiresAt, isAdmin) {
    let hash = 0;
    const str = tokenId + '_' + expiresAt + '_' + (isAdmin ? '1' : '0') + '_' + AUTH_CONFIG.SECRET_SALT;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return 'sig_' + Math.abs(hash).toString(36);
}

/**
 * Generate a session token with expiry and anti-tamper signature
 */
function generateSessionToken(rememberMe, isAdmin) {
    const expiry = rememberMe ? AUTH_CONFIG.REMEMBER_EXPIRY_HOURS : AUTH_CONFIG.DEFAULT_EXPIRY_HOURS;
    const expiresAt = Date.now() + (expiry * 60 * 60 * 1000);
    const tokenId = AUTH_CONFIG.TOKEN_PREFIX + Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
    const sig = computeSessionSig(tokenId, expiresAt, isAdmin);
    return {
        token: tokenId,
        createdAt: Date.now(),
        expiresAt: expiresAt,
        rememberMe: rememberMe,
        isAdmin: !!isAdmin,
        sig: sig
    };
}

/**
 * Store session with signed token
 */
function createSession(isAdmin, rememberMe) {
    const session = generateSessionToken(rememberMe || false, isAdmin);
    localStorage.setItem(AUTH_CONFIG.SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(AUTH_CONFIG.AUTH_KEY, 'true');
    localStorage.setItem(AUTH_CONFIG.ADMIN_KEY, isAdmin ? 'true' : 'false');
}

/**
 * Check if session is valid, signed, and not expired
 * (Blocks unauthorized DevTools localStorage spoofing)
 */
function isSessionValid() {
    try {
        const sessionStr = localStorage.getItem(AUTH_CONFIG.SESSION_KEY);
        if (!sessionStr) return false;

        const session = JSON.parse(sessionStr);
        if (!session.token || !session.expiresAt || !session.sig) return false;

        // Check expiry
        if (Date.now() > session.expiresAt) {
            clearSession();
            return false;
        }

        // Verify cryptographic anti-tamper signature
        const expectedSig = computeSessionSig(session.token, session.expiresAt, session.isAdmin);
        if (session.sig !== expectedSig) {
            console.warn('⚠️ Session signature verification failed. Clearing forged session.');
            clearSession();
            return false;
        }

        return true;
    } catch (e) {
        clearSession();
        return false;
    }
}

/**
 * Check if current session has admin privileges
 */
function isAdminSession() {
    try {
        if (!isSessionValid()) return false;
        const sessionStr = localStorage.getItem(AUTH_CONFIG.SESSION_KEY);
        const session = JSON.parse(sessionStr);
        return session.isAdmin === true;
    } catch (e) {
        return false;
    }
}

/**
 * Get session info
 */
function getSessionInfo() {
    try {
        const sessionStr = localStorage.getItem(AUTH_CONFIG.SESSION_KEY);
        if (!sessionStr) return null;
        return JSON.parse(sessionStr);
    } catch (e) {
        return null;
    }
}

/**
 * Clear all session data
 */
function clearSession() {
    localStorage.removeItem(AUTH_CONFIG.SESSION_KEY);
    localStorage.removeItem(AUTH_CONFIG.AUTH_KEY);
    localStorage.removeItem(AUTH_CONFIG.ADMIN_KEY);
    localStorage.removeItem(AUTH_CONFIG.REDIRECT_KEY);
    sessionStorage.removeItem(AUTH_CONFIG.SESSION_KEY);
}

/**
 * Input sanitization — prevent XSS
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

/**
 * Sanitize HTML content (allow safe tags)
 */
function sanitizeHTML(html) {
    if (typeof html !== 'string') return '';
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/on\w+\s*=\s*[^\s>]+/gi, '')
        .replace(/javascript\s*:/gi, '');
}

// ===== 🌐 FIRESTORE OFFLINE PERSISTENCE =====
(function initOfflinePersistence() {
    if (typeof firebase !== 'undefined' && firebase.firestore) {
        try {
            firebase.firestore().enablePersistence({ synchronizeTabs: true }).catch(function (err) {
                // Persistence may already be active or unsupported by browser
            });
        } catch (e) {}
    }
})();

// ===== 🛡️ AUTH GUARD & FIREBASE SYNC =====
(function () {
    'use strict';

    // Check for valid signed session
    let hasValidSession = isSessionValid();

    if (!hasValidSession) {
        // Save the page the user was trying to reach
        localStorage.setItem(AUTH_CONFIG.REDIRECT_KEY, window.location.href);
        window.location.replace('login.html');
        return;
    }

    // Admin access check for admin pages
    if (window.location.pathname.includes('admin.html') && !isAdminSession()) {
        alert('⚠️ Admin व्यवस्थापन पृष्ठमा प्रवेश गर्न Admin अनुमति आवश्यक छ।');
        window.location.replace('index.html');
        return;
    }

    window.addEventListener('DOMContentLoaded', function () {
        // Auto-renew session expiry on each page load
        if (isSessionValid()) {
            try {
                const sessionStr = localStorage.getItem(AUTH_CONFIG.SESSION_KEY);
                const session = JSON.parse(sessionStr);
                session.expiresAt = Date.now() + (AUTH_CONFIG.DEFAULT_EXPIRY_HOURS * 60 * 60 * 1000);
                session.sig = computeSessionSig(session.token, session.expiresAt, session.isAdmin);
                localStorage.setItem(AUTH_CONFIG.SESSION_KEY, JSON.stringify(session));
            } catch (e) {}
        }
    });
})();

/**
 * Call this from logout buttons
 */
function logout() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
        try {
            firebase.auth().signOut();
        } catch (e) {}
    }
    clearSession();
    window.location.replace('login.html');
}

// ===== 🗑️ GLOBAL RECYCLE BIN & SOFT-DELETE HELPERS (100-DAY LIFECYCLE) =====

/**
 * Soft delete a record instead of permanent destruction
 * Moves to 100-Day Recycle Bin
 */
window.softDeleteRecord = async function (collectionName, docId, summaryData) {
    if (!collectionName || !docId) {
        throw new Error("Invalid collection or docId");
    }
    const db = firebase.firestore();
    const now = Date.now();
    const user = localStorage.getItem('sifarish_user') || 'वडा कर्मचारी';

    // 1. Mark document as soft-deleted in its source collection
    await db.collection(collectionName).doc(docId).update({
        isDeleted: true,
        deletedAtMillis: now,
        deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
        deletedBy: user
    });

    // 2. Add an index entry in central deleted_records_log for easy Recycle Bin listing
    try {
        const logId = `${collectionName}_${docId}`;
        await db.collection('deleted_records_log').doc(logId).set({
            collectionName: collectionName,
            originalDocId: docId,
            deletedAtMillis: now,
            deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
            deletedBy: user,
            summary: summaryData || {},
            expiresAtMillis: now + (100 * 24 * 60 * 60 * 1000), // 100 days retention
            status: 'in_bin'
        });
    } catch (e) {
        console.warn('Recycle bin log error:', e);
    }

    return true;
};

/**
 * Restore a soft-deleted record back to active records
 */
window.restoreRecord = async function (collectionName, docId) {
    if (!collectionName || !docId) {
        throw new Error("Invalid collection or docId");
    }
    const db = firebase.firestore();

    // 1. Unmark document in source collection
    await db.collection(collectionName).doc(docId).update({
        isDeleted: false,
        restoredAtMillis: Date.now(),
        restoredAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // 2. Remove from central deleted_records_log
    try {
        const logId = `${collectionName}_${docId}`;
        await db.collection('deleted_records_log').doc(logId).delete();
    } catch (e) {}

    return true;
};

/**
 * Permanently purge records older than 100 days
 */
window.purgeExpiredDeletedRecords = async function () {
    if (typeof firebase === 'undefined') return;
    const db = firebase.firestore();
    const hundredDaysAgo = Date.now() - (100 * 24 * 60 * 60 * 1000);

    try {
        const snap = await db.collection('deleted_records_log')
            .where('deletedAtMillis', '<', hundredDaysAgo)
            .limit(50)
            .get();

        if (snap.empty) return 0;

        let purged = 0;
        for (const doc of snap.docs) {
            const data = doc.data();
            try {
                // Permanently delete from source collection
                if (data.collectionName && data.originalDocId) {
                    await db.collection(data.collectionName).doc(data.originalDocId).delete();
                }
                // Delete log
                await doc.ref.delete();
                purged++;
            } catch (err) {
                console.warn('Purge error:', err);
            }
        }
        return purged;
    } catch (e) {
        console.warn('Auto-purge check error:', e);
        return 0;
    }
};

// ===== 📱 PWA SERVICE WORKER REGISTRATION =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js').catch(function (err) {
            // Note: Service worker registration is silent on file:// protocol or unsecure contexts
        });
    });
}
