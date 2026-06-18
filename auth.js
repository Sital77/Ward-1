/**
 * auth.js — Sifarish System Authentication Guard
 * Include this script at the TOP of every protected sifarish page.
 * The main portal (index.html) does NOT include this file.
 */
(function () {
    'use strict';
    if (sessionStorage.getItem('sifarish_auth') !== 'true') {
        // Save the page the user was trying to reach
        sessionStorage.setItem('sifarish_redirect', window.location.href);
        window.location.replace('login.html');
    }
})();

/** Call this from the logout button on sifarish form pages */
function logout() {
    sessionStorage.removeItem('sifarish_auth');
    sessionStorage.removeItem('sifarish_redirect');
    window.location.replace('login.html');
}
