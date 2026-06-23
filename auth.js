/**
 * auth.js — Sifarish System Authentication Guard
 * Include this script at the TOP of every protected sifarish page.
 * The main portal (index.html) does NOT include this file.
 */
(function () {
    'use strict';
    if (localStorage.getItem('sifarish_auth') !== 'true') {
        // Save the page the user was trying to reach
        localStorage.setItem('sifarish_redirect', window.location.href);
        window.location.replace('login.html');
    }
})();

/** Call this from the logout button on sifarish form pages */
function logout() {
    localStorage.removeItem('sifarish_auth');
    localStorage.removeItem('sifarish_redirect');
    window.location.replace('login.html');
}
