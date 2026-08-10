// language-dropdown.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. DIZIONARIO GLOBALE DELLE TRADUZIONI (Solo menu di navigazione ed elementi base)
    window.translations = window.translations || {};

    const baseTranslations = {
        'it': {
            menuTitle: 'Menu', navPubblici: 'Spot', navCercaPersone: 'Trova', navMessaggi: 'Chat', navPosta: 'Spotta', navProfilo: 'Profilo', navImpostazioni: 'Impostazioni', navAdmin: 'Gestione Utenti', logout: 'Esci'
        },
        'en': {
            menuTitle: 'Menu', navPubblici: 'Public', navCercaPersone: 'Search People', navMessaggi: 'Messages', navPosta: 'Inbox', navProfilo: 'Profile', navImpostazioni: 'Settings', navAdmin: 'User Management', logout: 'Log Out'
        },
        'es': {
            menuTitle: 'Menú', navPubblici: 'Públicos', navCercaPersone: 'Buscar Personas', navMessaggi: 'Mensajes', navPosta: 'Buzón', navProfilo: 'Perfil', navImpostazioni: 'Ajustes', navAdmin: 'Gestión de Usuarios', logout: 'Cerrar sesión'
        },
        'fr': {
            menuTitle: 'Menu', navPubblici: 'Publics', navCercaPersone: 'Rechercher', navMessaggi: 'Messages', navPosta: 'Boîte de réception', navProfilo: 'Profil', navImpostazioni: 'Paramètres', navAdmin: 'Gestion Utilisateurs', logout: 'Déconnexion'
        },
        'de': {
            menuTitle: 'Menü', navPubblici: 'Öffentlich', navCercaPersone: 'Personen suchen', navMessaggi: 'Nachrichten', navPosta: 'Posteingang', navProfilo: 'Profil', navImpostazioni: 'Einstellungen', navAdmin: 'Benutzerverwaltung', logout: 'Abmelden'
        },
        'ar': {
            menuTitle: 'القائمة', navPubblici: 'عام', navCercaPersone: 'بحث عن أشخاص', navMessaggi: 'رسائل', navPosta: 'صندوق الوارد', navProfilo: 'الملف الشخصي', navImpostazioni: 'الإعدادات', navAdmin: 'إدارة المستخدمين', logout: 'تسجيل خروج'
        },
        'ru': {
            menuTitle: 'Меню', navPubblici: 'Публичные', navCercaPersone: 'Поиск людей', navMessaggi: 'Сообщения', navPosta: 'Почта', navProfilo: 'Профиль', navImpostazioni: 'Настройки', navAdmin: 'Управление пользователями', logout: 'Выйти'
        },
        'ja': {
            menuTitle: 'メニュー', navPubblici: '公開', navCercaPersone: '検索', navMessaggi: 'メッセージ', navPosta: '受信トレイ', navProfilo: 'プロフィール', navImpostazioni: '設定', navAdmin: 'ユーザー管理', logout: 'ログアウト'
        },
        'nl': {
            menuTitle: 'Menu', navPubblici: 'Openbaar', navCercaPersone: 'Zoeken', navMessaggi: 'Berichten', navPosta: 'Postvak IN', navProfilo: 'Profiel', navImpostazioni: 'Instellingen', navAdmin: 'Gebruikersbeheer', logout: 'Uitloggen'
        },
        'pl': {
            menuTitle: 'Menu', navPubblici: 'Publiczne', navCercaPersone: 'Szukaj', navMessaggi: 'Wiadomości', navPosta: 'Skrzynka', navProfilo: 'Profil', navImpostazioni: 'Ustawienia', navAdmin: 'Zarządzanie', logout: 'Wyloguj'
        },
        'zh': {
            menuTitle: '菜单', navPubblici: '公开', navCercaPersone: '搜寻', navMessaggi: '消息', navPosta: '收件箱', navProfilo: '个人资料', navImpostazioni: '设置', navAdmin: '用户管理', logout: '登出'
        },
        'hi': {
            menuTitle: 'मेनू', navPubblici: 'सार्वजनिक', navCercaPersone: 'लोग खोजें', navMessaggi: 'संदेश', navPosta: 'इनबॉक्स', navProfilo: 'प्रोफ़ाइल', navImpostazioni: 'सेटिंग्स', navAdmin: 'उपयोगकर्ता प्रबंधन', logout: 'लॉग आउट'
        },
        'ko-kp': {
            menuTitle: '메뉴', navPubblici: '공개', navCercaPersone: '사람 찾기', navMessaggi: '메시지', navPosta: '받은 편지함', navProfilo: '프로필', navImpostazioni: '설정', navAdmin: '사용자 관리', logout: '로그아웃'
        },
        'ko-kr': {
            menuTitle: '메뉴', navPubblici: '공개', navCercaPersone: '사람 찾기', navMessaggi: '메시지', navPosta: '받은 편지함', navProfilo: '프로필', navImpostazioni: '설정', navAdmin: '사용자 관리', logout: '로그아웃'
        }
    };

    // Unisce le traduzioni base con qualsiasi altra traduzione caricata precedentemente
    Object.keys(baseTranslations).forEach(lang => {
        window.translations[lang] = Object.assign({}, baseTranslations[lang], window.translations[lang] || {});
    });

    // 2. FUNZIONE GLOBALE DI TRADUZIONE JS
    window.t = function(key) {
        const lang = localStorage.getItem('selectedLanguage') || 'it';
        if (window.translations[lang] && window.translations[lang][key]) {
            return window.translations[lang][key];
        }
        if (window.translations['it'] && window.translations['it'][key]) {
            return window.translations['it'][key];
        }
        return key; 
    };

    // 3. HTML DEL MENU A TENDINA DELLE LINGUE
    // Assicurati che getLanguageDropdownHTML() sia definita in un altro script caricato prima (es. ui-actions.js) 
    // oppure includi la sua logica qui se era presente originariamente
    const dropdownHtml = typeof getLanguageDropdownHTML === "function" ? getLanguageDropdownHTML() : ''; 

    // 4. SALVATAGGIO LINGUA SU FIRESTORE
    const saveLanguageToFirestore = async (lang) => {
        if (window.auth && window.db) {
            const user = window.auth.currentUser;
            if (user) {
                try {
                    const username = localStorage.getItem('username');
                    if (username) {
                        await window.db.collection('users').doc(username).update({ language: lang });
                    } else {
                        const snapshot = await window.db.collection('users').where('email', '==', user.email).get();
                        if (!snapshot.empty) {
                            await snapshot.docs[0].ref.update({ language: lang });
                        }
                    }
                } catch (error) {
                    console.error("Errore durante il salvataggio della lingua su Firestore:", error);
                }
            }
        }
    };
    
    // 5. APPLICAZIONE DEI TESTI AL DOM
    const updateContent = (lang) => {
        localStorage.setItem('selectedLanguage', lang);
        
        const elementsToTranslate = document.querySelectorAll('[data-translate]');
        elementsToTranslate.forEach(element => {
            const key = element.getAttribute('data-translate');
            if (window.translations[lang] && window.translations[lang][key]) {
                if (element.tagName.toLowerCase() === 'title') {
                    document.title = window.translations[lang][key];
                } 
                // Condizione per gli attributi placeholder (es: Input testuali)
                else if (element.tagName.toLowerCase() === 'input' && element.hasAttribute('placeholder')) {
                    element.setAttribute('placeholder', window.translations[lang][key]);
                } 
                else {
                    const textSpan = element.querySelector('.nav-text, #logout-text');
                    if (textSpan) {
                        textSpan.textContent = window.translations[lang][key];
                    } else {
                        element.textContent = window.translations[lang][key];
                    }
                }
            }
        });
        
        document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    };

    // 6. INIZIALIZZAZIONE UI E LISTENER
    const container = document.getElementById('language-dropdown-container');
    if (container && dropdownHtml) {
        container.innerHTML = dropdownHtml;
    }

    const languageToggle = document.getElementById('language-toggle');
    const languageDropdownMenu = document.getElementById('language-dropdown-menu');
    const dropdownIcon = document.getElementById('dropdown-icon');
    const selectedFlag = document.getElementById('selected-flag');
    const selectedLangText = document.getElementById('selected-lang-text');
    const langOptions = document.querySelectorAll('.lang-option');

    if (languageToggle && languageDropdownMenu) {
        languageToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            languageDropdownMenu.classList.toggle('hidden');
            if (dropdownIcon) dropdownIcon.classList.toggle('rotate-180');
        });

        document.addEventListener('click', (event) => {
            if (!languageToggle.contains(event.target) && !languageDropdownMenu.contains(event.target)) {
                languageDropdownMenu.classList.add('hidden');
                if (dropdownIcon) dropdownIcon.classList.remove('rotate-180');
            }
        });
    }

    const syncFlagUI = (lang) => {
        const option = document.querySelector(`.lang-option[data-lang="${lang}"]`);
        if (option && selectedFlag && selectedLangText) {
            selectedFlag.src = option.querySelector('img').src;
            selectedFlag.alt = `Bandiera ${option.getAttribute('data-text')}`;
            selectedLangText.textContent = option.getAttribute('data-text');
        }
    };

    if (langOptions) {
        langOptions.forEach(option => {
            option.addEventListener('click', async () => {
                const lang = option.getAttribute('data-lang');
                
                const currentLang = localStorage.getItem('selectedLanguage') || 'it';
                
                if (languageDropdownMenu) languageDropdownMenu.classList.add('hidden');
                if (dropdownIcon) dropdownIcon.classList.remove('rotate-180');

                if (lang === currentLang) {
                    return;
                }

                updateContent(lang);
                syncFlagUI(lang);
                await saveLanguageToFirestore(lang);
            });
        });
    }

    document.addEventListener('navReady', () => {
        let currentLang = localStorage.getItem('selectedLanguage') || 'it';
        updateContent(currentLang);
    });

    // 7. CARICAMENTO IMMEDIATO DELLA LINGUA LOCALE
    let langToLoad = localStorage.getItem('selectedLanguage') || 'it';
    updateContent(langToLoad);
    syncFlagUI(langToLoad);

    // 8. SINCRONIZZAZIONE CON FIRESTORE ALL'AVVIO
    if (window.auth && window.db) {
        window.auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    let userDoc = null;
                    const username = localStorage.getItem('username');

                    if (username) {
                        userDoc = await window.db.collection('users').doc(username).get();
                    } else {
                        const snapshot = await window.db.collection('users').where('email', '==', user.email).get();
                        if (!snapshot.empty) {
                            userDoc = snapshot.docs[0];
                        }
                    }

                    if (userDoc && userDoc.exists) {
                        const dbLang = userDoc.data().language;
                        if (dbLang && dbLang !== langToLoad) {
                            updateContent(dbLang);
                            syncFlagUI(dbLang);
                        }
                    }
                } catch (e) {
                    console.error("Errore recupero lingua da Firestore all'avvio:", e);
                }
            }
        });
    }
});