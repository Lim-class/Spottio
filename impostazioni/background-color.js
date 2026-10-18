// background-color.js
// Questo script gestisce l'applicazione del colore di sfondo in tutte le pagine
// che lo includono, ad eccezione della pagina di login.

// impostazioni/background-color.js
(function () {
    const THEME_KEY = 'spottio-theme-mode';
    const BG_COLOR_KEY = 'user-background-color';

    function applyTheme(themeMode) {
        const root = document.documentElement;
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const effectiveTheme = (themeMode === 'system') ? (prefersDark ? 'dark' : 'light') : themeMode;

        if (effectiveTheme === 'dark') {
            root.classList.add('dark');
            root.setAttribute('data-theme', 'dark');
            document.body.classList.add('dark-theme-active');
            document.body.style.backgroundColor = '#0b0f19';
        } else {
            root.classList.remove('dark');
            root.setAttribute('data-theme', 'light');
            document.body.classList.remove('dark-theme-active');

            // Ripristina il colore personalizzato precedentemente salvato (o default bianco)
            const savedBg = localStorage.getItem(BG_COLOR_KEY);
            document.body.style.backgroundColor = savedBg || '#ffffff';
        }
    }

    function initTheme() {
        const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
        applyTheme(savedTheme);

        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                if ((localStorage.getItem(THEME_KEY) || 'light') === 'system') {
                    applyTheme('system');
                }
            });
        }
    }

    window.SpottioTheme = {
        getTheme: function () {
            return localStorage.getItem(THEME_KEY) || 'light';
        },
        setTheme: async function (theme) {
            localStorage.setItem(THEME_KEY, theme);
            applyTheme(theme);

            const uid = (window.Spottio && typeof window.Spottio.getCurrentUid === 'function')
                ? window.Spottio.getCurrentUid()
                : localStorage.getItem('currentUid');

            if (uid && window.db) {
                try {
                    await window.db.collection('users').doc(uid).set({ themeMode: theme }, { merge: true });
                } catch (e) {
                    console.warn("Errore salvataggio preferenza tema su Firestore:", e);
                }
            }
            window.dispatchEvent(new CustomEvent('spottio-theme-changed', { detail: theme }));
        },
        // Funzione chiamata quando si seleziona un colore personalizzato
        setColor: async function (colorHex) {
            localStorage.setItem(BG_COLOR_KEY, colorHex);
            // Cliccando su un colore, si esce dal tema scuro forzato
            localStorage.setItem(THEME_KEY, 'light');
            
            const root = document.documentElement;
            root.classList.remove('dark');
            root.setAttribute('data-theme', 'light');
            document.body.classList.remove('dark-theme-active');
            document.body.style.backgroundColor = colorHex;

            const uid = (window.Spottio && typeof window.Spottio.getCurrentUid === 'function')
                ? window.Spottio.getCurrentUid()
                : localStorage.getItem('currentUid');

            if (uid && window.db) {
                try {
                    await window.db.collection('users').doc(uid).set({ 
                        bodyBackgroundColor: colorHex,
                        themeMode: 'light'
                    }, { merge: true });
                } catch (e) {
                    console.warn("Errore salvataggio colore su Firestore:", e);
                }
            }
            window.dispatchEvent(new CustomEvent('spottio-theme-changed', { detail: 'light' }));
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTheme);
    } else {
        initTheme();
    }
})();