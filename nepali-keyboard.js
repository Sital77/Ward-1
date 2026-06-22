/**
 * ═══════════════════════════════════════════════════════════════
 *  Traditional Nepali (Preeti) Keyboard — Unicode Converter
 *  Converts English keystrokes → Nepali Unicode via Preeti layout
 *  Auto-injects a toggle switch into the sidebar input-panel.
 * ═══════════════════════════════════════════════════════════════
 */
(function () {
    'use strict';

    /* ─── Preeti → Unicode Character Map ─── */
    var PREETI_MAP = {
        /* ── Numbers ── */
        '1': '\u0967', '2': '\u0968', '3': '\u0969', '4': '\u096A', '5': '\u096B',
        '6': '\u096C', '7': '\u096D', '8': '\u096E', '9': '\u096F', '0': '\u0966',

        /* ── Shifted Numbers ── */
        '!': '\u091C\u094D\u091E',   /* ज्ञ */
        '@': '\u0908',               /* ई  */
        '#': '\u0918',               /* घ  */
        '$': '\u0926\u094D\u0927',   /* द्ध */
        '%': '\u091B',               /* छ  */
        '^': '\u091F',               /* ट  */
        '&': '\u0920',               /* ठ  */
        '*': '\u0921',               /* ड  */
        '(': '\u0922',               /* ढ  */
        ')': '\u0923',               /* ण  */

        /* ── Lowercase Letters ── */
        'a': '\u092C',  /* ब */   'b': '\u0926',  /* द */   'c': '\u0905',  /* अ */
        'd': '\u092E',  /* म */   'e': '\u092D',  /* भ */   'f': '\u093E',  /* ा */
        'g': '\u0928',  /* न */   'h': '\u091C',  /* ज */   'i': '\u0937',  /* ष */
        'j': '\u0935',  /* व */   'k': '\u092A',  /* प */   'l': '\u093F',  /* ि */
        'm': '\u0938',  /* स */   'n': '\u0932',  /* ल */   'o': '\u092F',  /* य */
        'p': '\u0909',  /* उ */   'q': '\u0924\u094D\u0930', /* त्र */
        'r': '\u091A',  /* च */   's': '\u0915',  /* क */   't': '\u0924',  /* त */
        'u': '\u0917',  /* ग */   'v': '\u0916',  /* ख */   'w': '\u0927',  /* ध */
        'x': '\u0939',  /* ह */   'y': '\u0925',  /* थ */   'z': '\u0936',  /* श */

        /* ── Uppercase Letters ── */
        'A': '\u0906',  /* आ */   'B': '\u0901',  /* ँ  */   'C': '\u090B',  /* ऋ */
        'D': '\u0902',  /* ं  */   'E': '\u0910',  /* ऐ */   'F': '\u0943',  /* ृ */
        'G': '\u0919',  /* ङ  */   'H': '\u091E',  /* ञ */   'I': '\u0915\u094D\u0937', /* क्ष */
        'J': '\u094B',  /* ो */   'K': '\u092B',  /* फ */   'L': '\u0940',  /* ी */
        'M': '\u0964',  /* ।  */   'N': '\u0965',  /* ॥  */   'O': '\u0907',  /* इ */
        'P': '\u090F',  /* ए  */   'Q': '\u0924\u094D\u0924', /* त्त */
        'R': '\u091B',  /* छ  */   'S': '\u0915\u094D', /* क् */
        'T': '\u091F',  /* ट  */   'U': '\u0918',  /* घ */   'V': '\u0950',  /* ॐ */
        'W': '\u0922',  /* ढ  */   'X': '\u0901',  /* ँ  */   'Y': '\u0920',  /* ठ */
        'Z': '\u0936\u094D', /* श् */

        /* ── Symbols ── */
        '`': '\u091E',          /* ञ */
        '~': '\u090A',          /* ऊ */
        '-': '\u094C',          /* ौ */
        '_': '\u0914',          /* औ */
        '=': '\u0924\u094D\u0930', /* त्र */
        '+': '\u0923',          /* ण */
        '[': '\u0942',          /* ू */
        '{': '\u090A',          /* ऊ */
        ']': '\u0947',          /* े */
        '}': '\u0948',          /* ै */
        '\\': '\u094D',         /* ् (halant) */
        '|': '\u094D',          /* ् (halant) */
        ';': '\u0938',          /* स */
        ':': '\u0903',          /* ः (visarga) */
        "'": '\u0941',          /* ु */
        '"': '\u0942',          /* ू */
        '.': '\u0964',          /* । (danda) */
        '>': '\u0936\u094D\u0930', /* श्र */
        '/': '\u0930',          /* र */
        '?': '\u0930\u0941'     /* रु */
    };

    var STORAGE_KEY = 'nepaliKeyboardEnabled';
    var isEnabled = localStorage.getItem(STORAGE_KEY) === 'true';

    /* ─── Insert text at cursor position ─── */
    function insertAtCursor(el, text) {
        var start = el.selectionStart;
        var end = el.selectionEnd;
        var val = el.value;
        el.value = val.substring(0, start) + text + val.substring(end);
        var newPos = start + text.length;
        el.selectionStart = el.selectionEnd = newPos;
        /* Fire input event so live-preview updates */
        el.dispatchEvent(new Event('input', { bubbles: true }));
    }

    /* ─── Keydown handler ─── */
    function handleKeyDown(e) {
        if (!isEnabled) return;

        /* Allow browser shortcuts (Ctrl+C, Ctrl+V, etc.) */
        if (e.ctrlKey || e.altKey || e.metaKey) return;

        var el = e.target;

        /* Only intercept text inputs & textareas */
        if (el.tagName === 'SELECT') return;
        if (el.tagName === 'INPUT') {
            var t = (el.type || 'text').toLowerCase();
            if (t !== 'text' && t !== 'search' && t !== '') return;
        } else if (el.tagName !== 'TEXTAREA') {
            return;
        }

        var ch = e.key;
        /* Only single printable characters */
        if (ch.length !== 1) return;

        var mapped = PREETI_MAP[ch];
        if (mapped !== undefined) {
            e.preventDefault();
            insertAtCursor(el, mapped);
        }
    }

    /* ─── Build & inject the toggle bar ─── */
    function buildToggle() {
        var header = document.querySelector('.header-action-container');
        if (!header) return;

        var bar = document.createElement('div');
        bar.id = 'nepaliKbBar';
        applyBarStyle(bar);

        bar.innerHTML =
            '<div style="display:flex;align-items:center;gap:10px;">' +
                '<span style="font-size:1.35rem;">⌨️</span>' +
                '<div>' +
                    '<div id="kbTitle" style="font-weight:700;font-size:0.92rem;color:' + (isEnabled ? '#fff' : '#2d3748') + ';">' +
                        'Traditional नेपाली Keyboard (Preeti)' +
                    '</div>' +
                    '<div id="kbModeLabel" style="font-size:0.78rem;font-weight:600;color:' + (isEnabled ? '#bee3f8' : '#718096') + ';">' +
                        (isEnabled ? '✅ सक्रिय — Preeti Mode ON' : '⭕ निष्क्रिय — OFF') +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div id="kbSwitch" style="' +
                'width:50px;height:28px;border-radius:14px;position:relative;flex-shrink:0;cursor:pointer;' +
                'background:' + (isEnabled ? '#48bb78' : '#a0aec0') + ';transition:background 0.3s;">' +
                '<div id="kbDot" style="' +
                    'width:24px;height:24px;border-radius:50%;background:#fff;position:absolute;top:2px;' +
                    (isEnabled ? 'right:2px;left:auto;' : 'left:2px;right:auto;') +
                    'transition:all 0.3s;box-shadow:0 2px 4px rgba(0,0,0,0.25);">' +
                '</div>' +
            '</div>';

        bar.addEventListener('click', function () {
            isEnabled = !isEnabled;
            localStorage.setItem(STORAGE_KEY, isEnabled ? 'true' : 'false');
            refreshUI(bar);
        });

        /* Insert right after the header-action-container */
        header.parentNode.insertBefore(bar, header.nextSibling);
    }

    function applyBarStyle(bar) {
        bar.style.cssText =
            'display:flex;align-items:center;justify-content:space-between;' +
            'padding:11px 16px;margin-bottom:18px;border-radius:10px;' +
            'cursor:pointer;user-select:none;transition:all 0.3s ease;' +
            'background:' + (isEnabled
                ? 'linear-gradient(135deg,#2b6cb0,#2c5282)'
                : '#edf2f7') + ';' +
            'border:1.5px solid ' + (isEnabled ? '#2b6cb0' : '#cbd5e0') + ';';
    }

    function refreshUI(bar) {
        /* Bar background */
        bar.style.background = isEnabled
            ? 'linear-gradient(135deg,#2b6cb0,#2c5282)'
            : '#edf2f7';
        bar.style.borderColor = isEnabled ? '#2b6cb0' : '#cbd5e0';

        /* Title text color */
        var title = document.getElementById('kbTitle');
        if (title) title.style.color = isEnabled ? '#fff' : '#2d3748';

        /* Subtitle */
        var label = document.getElementById('kbModeLabel');
        if (label) {
            label.style.color = isEnabled ? '#bee3f8' : '#718096';
            label.textContent = isEnabled
                ? '✅ सक्रिय — Preeti Mode ON'
                : '⭕ निष्क्रिय — OFF';
        }

        /* Toggle switch */
        var sw = document.getElementById('kbSwitch');
        if (sw) sw.style.background = isEnabled ? '#48bb78' : '#a0aec0';

        var dot = document.getElementById('kbDot');
        if (dot) {
            if (isEnabled) {
                dot.style.left = 'auto';
                dot.style.right = '2px';
            } else {
                dot.style.left = '2px';
                dot.style.right = 'auto';
            }
        }
    }

    /* ─── Keyboard shortcut: Alt+N to toggle quickly ─── */
    function handleShortcut(e) {
        if (e.altKey && (e.key === 'n' || e.key === 'N')) {
            e.preventDefault();
            isEnabled = !isEnabled;
            localStorage.setItem(STORAGE_KEY, isEnabled ? 'true' : 'false');
            var bar = document.getElementById('nepaliKbBar');
            if (bar) refreshUI(bar);
        }
    }

    /* ─── Init on DOM ready ─── */
    function init() {
        buildToggle();
        document.addEventListener('keydown', handleKeyDown, true);
        document.addEventListener('keydown', handleShortcut, false);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
