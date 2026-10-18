// =========================================================================
// FILE: shared/js/spottio-anti-inspect.js
// Protezione Globale: Domain Lock, Anti-DevTools, Anti-Console & Anti-Print
// =========================================================================
(function() {
    'use strict';

    // ---------------------------------------------------------------------
    // 1. DOMAIN LOCK & ANTI-CLONING (spottio1.vercel.app)
    // ---------------------------------------------------------------------
    const ALLOWED_HOSTS = [
        'spottio1.vercel.app',
        'localhost',
        '127.0.0.1'
    ];

    const currentHost = (window.location.hostname || '').toLowerCase();
    const isAuthorizedHost = ALLOWED_HOSTS.some(function(allowed) {
        return currentHost === allowed || currentHost.endsWith('.' + allowed);
    });

    if (!isAuthorizedHost) {
        if (window.stop) {
            window.stop();
        }
        if (document.documentElement) {
            document.documentElement.innerHTML = '';
        }
        window.location.replace('https://spottio1.vercel.app/');
        throw new Error('Ambiente non autorizzato. Esecuzione terminata.');
    }

    // Anti-Clickjacking (impedisce l'esecuzione dentro iframe non autorizzati)
    if (window.top !== window.self) {
        try {
            window.top.location = window.self.location;
        } catch (e) {
            if (document.documentElement) {
                document.documentElement.innerHTML = '';
            }
            window.location.replace('https://spottio1.vercel.app/');
        }
    }

    // ---------------------------------------------------------------------
    // 2. STERILIZZAZIONE COMPLETA DELLA CONSOLE JAVASCRIPT
    // ---------------------------------------------------------------------
    const noop = function() {};
    const consoleMethods = [
        'log', 'debug', 'info', 'warn', 'error', 'table', 'trace',
        'dir', 'dirxml', 'group', 'groupCollapsed', 'groupEnd', 'time',
        'timeEnd', 'timeLog', 'count', 'countReset', 'assert', 'profile', 'clear'
    ];

    consoleMethods.forEach(function(method) {
        try {
            Object.defineProperty(window.console, method, {
                value: noop,
                writable: false,
                configurable: false
            });
        } catch (err) {
            try {
                window.console[method] = noop;
            } catch (ignored) {}
        }
    });

    // ---------------------------------------------------------------------
    // 3. FUNZIONE DI BLOCCO EVENTI
    // ---------------------------------------------------------------------
    function suppressEvent(e) {
        if (!e) return false;
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        e.returnValue = false;
        return false;
    }

    // ---------------------------------------------------------------------
    // 4. INTERCETTAZIONE SCORCIATOIE CRITICHE (CAPTURE PHASE)
    // ---------------------------------------------------------------------
    function handleKeyDown(e) {
        const code = e.code || '';
        const key = (e.key || '').toUpperCase();
        const keyCode = e.keyCode || e.which;
        const isCtrlOrMeta = e.ctrlKey || e.metaKey;
        const isShift = e.shiftKey;
        const isAlt = e.altKey;

        // F12 (DevTools)
        if (code === 'F12' || key === 'F12' || keyCode === 123) {
            return suppressEvent(e);
        }

        // Ctrl + Shift + I / J / C (DevTools, Console, Ispettore Elementi)
        if (isCtrlOrMeta && isShift && (
            code === 'KeyI' || key === 'I' || keyCode === 73 ||
            code === 'KeyJ' || key === 'J' || keyCode === 74 ||
            code === 'KeyC' || key === 'C' || keyCode === 67
        )) {
            return suppressEvent(e);
        }

        // Mac Safari: Cmd + Option + I / J / C / U
        if (isCtrlOrMeta && isAlt && (
            code === 'KeyI' || key === 'I' ||
            code === 'KeyJ' || key === 'J' ||
            code === 'KeyC' || key === 'C' ||
            code === 'KeyU' || key === 'U'
        )) {
            return suppressEvent(e);
        }

        // Ctrl + U (Visualizza sorgente pagina)
        if (isCtrlOrMeta && !isShift && (code === 'KeyU' || key === 'U' || keyCode === 85)) {
            return suppressEvent(e);
        }

        // Ctrl + S (Salva pagina con sorgente)
        if (isCtrlOrMeta && !isShift && (code === 'KeyS' || key === 'S' || keyCode === 83)) {
            return suppressEvent(e);
        }

        // Ctrl + P oppure Cmd + P (Stampa pagina o salva PDF)
        if (isCtrlOrMeta && !isShift && (code === 'KeyP' || key === 'P' || keyCode === 80)) {
            return suppressEvent(e);
        }
    }

    const captureOptions = { capture: true, passive: false };
    window.addEventListener('keydown', handleKeyDown, captureOptions);
    document.addEventListener('keydown', handleKeyDown, captureOptions);

    // ---------------------------------------------------------------------
    // 5. BLOCCO TASTO DESTRO (Menu contestuale)
    // ---------------------------------------------------------------------
    window.addEventListener('contextmenu', suppressEvent, captureOptions);
    document.addEventListener('contextmenu', suppressEvent, captureOptions);

    // ---------------------------------------------------------------------
    // 6. BLOCCO STAMPA NATIVA DA MENU DEL BROWSER (beforeprint)
    // ---------------------------------------------------------------------
    window.addEventListener('beforeprint', function(e) {
        suppressEvent(e);
        if (document.body) {
            document.body.style.display = 'none';
        }
    });

    window.addEventListener('afterprint', function() {
        if (document.body) {
            document.body.style.display = '';
        }
    });

    // ---------------------------------------------------------------------
    // 7. BLOCCO DRAG & DROP DEI CONTENUTI NON TESTUALI
    // ---------------------------------------------------------------------
    window.addEventListener('dragstart', function(e) {
        if (e.target && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            suppressEvent(e);
        }
    }, captureOptions);

    // ---------------------------------------------------------------------
    // 8. DEBUGGER TRAP (Apertura forzata DevTools da menu browser)
    // ---------------------------------------------------------------------
    setInterval(function() {
        const start = performance.now();
        (function() {
            return false;
        }['constructor']('debugger')());
        const end = performance.now();

        // Se passano più di 100ms, il thread è stato interrotto dal debugger dei DevTools
        if (end - start > 100) {
            if (document.body) {
                document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0f172a;color:#f87171;font-family:sans-serif;font-size:18px;font-weight:bold;text-align:center;padding:24px;">Ambiente non sicuro rilevato.<br>Chiudere gli strumenti di sviluppo per continuare.</div>';
            }
        }
    }, 1000);

})();