// nav/language-dropdown.js

(function() {
    // Dizionario completo delle traduzioni per la navbar
    const navTranslations = {
        'it': {
            navPubblici: 'Spot',
            navSpotini: 'Spotini',
            navCercaPersone: 'Cerca',
            navPosta: 'Posta',
            navMessaggi: 'Messaggi',
            navProfilo: 'Profilo',
            adminActions: 'Visualizza Segnalazioni'
        },
        'en': {
            navPubblici: 'Spots',
            navSpotini: 'Spotini',
            navCercaPersone: 'Search',
            navPosta: 'Post',
            navMessaggi: 'Messages',
            navProfilo: 'Profile',
            adminActions: 'View Reports'
        },
        'es': {
            navPubblici: 'Spots',
            navSpotini: 'Spotini',
            navCercaPersone: 'Buscar',
            navPosta: 'Publicar',
            navMessaggi: 'Mensajes',
            navProfilo: 'Perfil',
            adminActions: 'Ver Reportes'
        },
        'fr': {
            navPubblici: 'Spots',
            navSpotini: 'Spotini',
            navCercaPersone: 'Recherche',
            navPosta: 'Publier',
            navMessaggi: 'Messages',
            navProfilo: 'Profil',
            adminActions: 'Voir les Signalements'
        },
        'de': {
            navPubblici: 'Spots',
            navSpotini: 'Spotini',
            navCercaPersone: 'Suche',
            navPosta: 'Posten',
            navMessaggi: 'Nachrichten',
            navProfilo: 'Profil',
            adminActions: 'Meldungen anzeigen'
        },
        'ar': {
            navPubblici: 'سبوت',
            navSpotini: 'سبوتيني',
            navCercaPersone: 'بحث',
            navPosta: 'نشر',
            navMessaggi: 'الرسائل',
            navProfilo: 'الملف الشخصي',
            adminActions: 'عرض التقارير'
        },
        'ru': {
            navPubblici: 'Споты',
            navSpotini: 'Спотини',
            navCercaPersone: 'Поиск',
            navPosta: 'Опубликовать',
            navMessaggi: 'Сообщения',
            navProfilo: 'Профиль',
            adminActions: 'Просмотр жалоб'
        },
        'ja': {
            navPubblici: 'スポット',
            navSpotini: 'スポティーニ',
            navCercaPersone: '検索',
            navPosta: '投稿',
            navMessaggi: 'メッセージ',
            navProfilo: 'プロフィール',
            adminActions: '報告を見る'
        },
        'nl': {
            navPubblici: 'Spots',
            navSpotini: 'Spotini',
            navCercaPersone: 'Zoeken',
            navPosta: 'Plaatsen',
            navMessaggi: 'Berichten',
            navProfilo: 'Profiel',
            adminActions: 'Meldingen bekijken'
        },
        'pl': {
            navPubblici: 'Spoty',
            navSpotini: 'Spotini',
            navCercaPersone: 'Szukaj',
            navPosta: 'Opublikuj',
            navMessaggi: 'Wiadomości',
            navProfilo: 'Profil',
            adminActions: 'Wyświetl Zgłoszenia'
        },
        'zh': {
            navPubblici: '动态',
            navSpotini: '微动态',
            navCercaPersone: '搜索',
            navPosta: '发布',
            navMessaggi: '消息',
            navProfilo: '个人资料',
            adminActions: '查看举报'
        },
        'hi': {
            navPubblici: 'स्पॉट्स',
            navSpotini: 'स्पॉटिनी',
            navCercaPersone: 'खोजें',
            navPosta: 'पोस्ट करें',
            navMessaggi: 'संदेश',
            navProfilo: 'प्रोफ़ाइल',
            adminActions: 'रिपोर्ट देखें'
        },
        'ko': {
            navPubblici: '스팟',
            navSpotini: '스포티니',
            navCercaPersone: '검색',
            navPosta: '게시',
            navMessaggi: '메시지',
            navProfilo: '프로필',
            adminActions: '신고 보기'
        }
    };

    navTranslations['ko-kp'] = navTranslations['ko'];
    navTranslations['ko-kr'] = navTranslations['ko'];

    if (window.SettingsModules && typeof window.SettingsModules.registerTranslations === 'function') {
        window.SettingsModules.registerTranslations(navTranslations);
    } else {
        window.translations = window.translations || {};
        Object.keys(navTranslations).forEach(lang => {
            window.translations[lang] = Object.assign(window.translations[lang] || {}, navTranslations[lang]);
        });
    }

    // nav/language-dropdown.js (estratto traduzione pagina)
    function translatePage(langCode) {
        const normalize = window.getDictionaryKey || ((code) => code || 'it');
        const dictKey = normalize(langCode);
        const currentDict = (window.translations && window.translations[dictKey]) || navTranslations[dictKey] || navTranslations['it'] || {};

        document.querySelectorAll('[data-translate]').forEach(el => {
            const key = el.getAttribute('data-translate');
            if (currentDict[key]) {
                const navTextSpan = el.querySelector('.nav-text');
                if (navTextSpan) {
                    navTextSpan.textContent = currentDict[key];
                } else {
                    el.textContent = currentDict[key];
                }
            }
        });
    }

    window.translatePage = translatePage;

    function setupLanguageDropdown() {
        const toggleBtn = document.getElementById('language-toggle');
        const container = document.getElementById('language-dropdown-container');

        if (!toggleBtn || !container) return;

        // Se la pagina contiene l'app Vue di impostazioni, lascia la gestione degli eventi a Vue
        if (document.getElementById('vue-settings-app')) {
            const currentLang = localStorage.getItem('selectedLanguage') || 'it';
            translatePage(currentLang);
            return;
        }

        if (!document.getElementById('language-dropdown-menu')) {
            if (typeof window.getLanguageDropdownHTML === 'function') {
                container.innerHTML = window.getLanguageDropdownHTML();
            }
        }

        const menu = document.getElementById('language-dropdown-menu');
        const flagImg = document.getElementById('selected-flag');
        const textSpan = document.getElementById('selected-lang-text');
        const iconSvg = document.getElementById('dropdown-icon');

        const currentLang = localStorage.getItem('selectedLanguage') || 'it';
        document.documentElement.lang = currentLang;

        function updateTrigger(code) {
            const languages = window.APP_LANGUAGES || [];
            const active = languages.find(l => l.code === code) || languages.find(l => l.code === 'it') || languages[0];
            if (!active) return;

            if (flagImg) flagImg.src = `https://flagcdn.com/${active.flag}`;
            if (textSpan) textSpan.textContent = active.text;
        }

        updateTrigger(currentLang);
        translatePage(currentLang);

        toggleBtn.onclick = function(e) {
            e.stopPropagation();
            if (!menu) return;
            const isHidden = menu.classList.contains('hidden');
            menu.classList.toggle('hidden', !isHidden);
            if (iconSvg) iconSvg.classList.toggle('rotate-180', isHidden);
        };

        document.addEventListener('click', function(e) {
            if (menu && !menu.contains(e.target) && !toggleBtn.contains(e.target)) {
                menu.classList.add('hidden');
                if (iconSvg) iconSvg.classList.remove('rotate-180');
            }
        });

        container.querySelectorAll('.lang-option').forEach(btn => {
            btn.onclick = function(e) {
                e.stopPropagation();
                const code = this.getAttribute('data-lang');
                if (!code) return;

                localStorage.setItem('selectedLanguage', code);
                document.documentElement.lang = code;

                updateTrigger(code);
                translatePage(code);

                if (menu) menu.classList.add('hidden');
                if (iconSvg) iconSvg.classList.remove('rotate-180');

                window.dispatchEvent(new CustomEvent('spottio-language-changed', { detail: code }));
            };
        });
    }

    // Traduce la navbar non appena nav.js notifica che il DOM è pronto
    document.addEventListener('navReady', () => {
        const lang = localStorage.getItem('selectedLanguage') || 'it';
        translatePage(lang);
    });

    // Ascolta cambi di lingua provenienti da altre parti dell'app
    window.addEventListener('spottio-language-changed', (e) => {
        if (e.detail) translatePage(e.detail);
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupLanguageDropdown);
    } else {
        setupLanguageDropdown();
    }

    window.setupLanguageDropdown = setupLanguageDropdown;
})();