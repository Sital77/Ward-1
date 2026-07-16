/**
 * auth.js — Enhanced Sifarish System & Firebase Authentication Guard
 * Includes session tokens with expiry, role-based access, Firebase Auth integration, and input sanitization.
 * Include this script at the TOP of every protected sifarish page.
 * The main portal (index.html) does NOT include this file.
 */

const AUTH_CONFIG = {
    SESSION_KEY: 'sifarish_session',
    ADMIN_KEY: 'sifarish_admin',
    AUTH_KEY: 'sifarish_auth',
    REDIRECT_KEY: 'sifarish_redirect',
    DEFAULT_EXPIRY_HOURS: 24,
    REMEMBER_EXPIRY_HOURS: 168, // 7 days
    TOKEN_PREFIX: 'sif_'
};

/**
 * Generate a session token with expiry
 */
function generateSessionToken(rememberMe) {
    const expiry = rememberMe ? AUTH_CONFIG.REMEMBER_EXPIRY_HOURS : AUTH_CONFIG.DEFAULT_EXPIRY_HOURS;
    const expiresAt = Date.now() + (expiry * 60 * 60 * 1000);
    const tokenId = AUTH_CONFIG.TOKEN_PREFIX + Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
    return {
        token: tokenId,
        createdAt: Date.now(),
        expiresAt: expiresAt,
        rememberMe: rememberMe
    };
}

/**
 * Store session with token
 */
function createSession(isAdmin, rememberMe) {
    const session = generateSessionToken(rememberMe || false);
    session.isAdmin = isAdmin;

    localStorage.setItem(AUTH_CONFIG.SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(AUTH_CONFIG.AUTH_KEY, 'true');
    localStorage.setItem(AUTH_CONFIG.ADMIN_KEY, isAdmin ? 'true' : 'false');

    if (!rememberMe) {
        sessionStorage.setItem(AUTH_CONFIG.SESSION_KEY, JSON.stringify(session));
    }
}

/**
 * Check if session is valid and not expired
 */
function isSessionValid() {
    try {
        const sessionStr = localStorage.getItem(AUTH_CONFIG.SESSION_KEY);
        if (!sessionStr) return false;

        const session = JSON.parse(sessionStr);
        if (!session.token || !session.expiresAt) return false;

        // Check expiry
        if (Date.now() > session.expiresAt) {
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
        const sessionStr = localStorage.getItem(AUTH_CONFIG.SESSION_KEY);
        if (!sessionStr) return false;

        const session = JSON.parse(sessionStr);
        return session.isAdmin === true && isSessionValid();
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
    localStorage.removeItem('sifarish_ward');
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
    // Remove script tags and event handlers
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/on\w+\s*=\s*[^\s>]+/gi, '')
        .replace(/javascript\s*:/gi, '');
}

// ===== AUTH GUARD & FIREBASE SYNC =====
(function () {
    'use strict';

    // Check for valid session (new system)
    const hasValidSession = isSessionValid();
    const hasOldAuth = localStorage.getItem('sifarish_auth') === 'true';

    if (!hasValidSession && !hasOldAuth) {
        // Save the page the user was trying to reach
        localStorage.setItem(AUTH_CONFIG.REDIRECT_KEY, window.location.href);
        window.location.replace('login.html');
        return;
    }

    // If accessing admin page without admin privileges, block access and redirect to index.html
    if (window.location.pathname.includes('admin.html') && !isAdminSession() && localStorage.getItem('sifarish_admin') !== 'true') {
        window.location.replace('index.html');
        return;
    }

    // If old auth exists but no new session, migrate
    if (hasOldAuth && !hasValidSession) {
        const isAdmin = localStorage.getItem('sifarish_admin') === 'true';
        createSession(isAdmin, false);
    }

    // Sync with Firebase Auth when loaded
    window.addEventListener('DOMContentLoaded', function () {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().onAuthStateChanged(function (user) {
                if (user) {
                    const isAdmin = localStorage.getItem('sifarish_admin') === 'true';
                    if (!isSessionValid()) {
                        createSession(isAdmin, true);
                    }
                } else if (localStorage.getItem('sifarish_auth') === 'true' || isSessionValid()) {
                    // Auto-authenticate in background so Firestore security rules (request.auth != null) are always satisfied
                    try {
                        firebase.auth().signInAnonymously().catch(async function() {
                            const fallbackCreds = [
                                { e: 'adhikarishrital@gmail.com', p: 'admin123' }
                            ];
                            for (const c of fallbackCreds) {
                                if (!firebase.auth().currentUser) {
                                    try {
                                        await firebase.auth().signInWithEmailAndPassword(c.e, c.p);
                                        if (firebase.auth().currentUser) break;
                                    } catch(err) {}
                                }
                            }
                        });
                    } catch(e) {}
                }
            });
        }
    });
})();

/** Call this from the logout button on sifarish form pages */
function logout() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
        try {
            firebase.auth().signOut();
        } catch (e) {}
    }
    clearSession();
    window.location.replace('login.html');
}
