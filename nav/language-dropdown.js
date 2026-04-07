document.addEventListener('DOMContentLoaded', () => {
    // Definizione del contenuto HTML del menu a tendina corretto (Fix tag <div> mancante)
    const dropdownHtml = `
        <div id="language-dropdown-menu" class="absolute top-full mt-2 w-max min-w-full bg-white border border-gray-200 rounded-lg shadow-lg hidden z-10 p-1">
            <button class="lang-option w-full flex items-center p-3 hover:bg-gray-100 rounded-t-lg" data-lang="ar" data-text="العربية">
                <img src="https://flagcdn.com/sa.svg" alt="Bandiera Araba" class="h-4 w-6 mr-2">
                العربية
            </button>
            <button class="lang-option w-full flex items-center p-3 hover:bg-gray-100" data-lang="de" data-text="Deutsch">
                <img src="https://flagcdn.com/de.svg" alt="Bandiera Tedesca" class="h-4 w-6 mr-2">
                Deutsch
            </button>
            <button class="lang-option w-full flex items-center p-3 hover:bg-gray-100" data-lang="en" data-text="English">
                <img src="https://flagcdn.com/gb.svg" alt="Bandiera Inglese" class="h-4 w-6 mr-2">
                English
            </button>
            <button class="lang-option w-full flex items-center p-3 hover:bg-gray-100" data-lang="es" data-text="Español">
                <img src="https://flagcdn.com/es.svg" alt="Bandiera Spagnola" class="h-4 w-6 mr-2">
                Español
            </button>
            <button class="lang-option w-full flex items-center p-3 hover:bg-gray-100" data-lang="fr" data-text="Français">
                <img src="https://flagcdn.com/fr.svg" alt="Bandiera Francese" class="h-4 w-6 mr-2">
                Français
            </button>
            <button class="lang-option w-full flex items-center p-3 hover:bg-gray-100" data-lang="hi" data-text="हिन्दी">
                <img src="https://flagcdn.com/in.svg" alt="Bandiera Indiana" class="h-4 w-6 mr-2">
                हिन्दी
            </button>
            <button class="lang-option w-full flex items-center p-3 hover:bg-gray-100" data-lang="it" data-text="Italiano">
                <img src="https://flagcdn.com/it.svg" alt="Bandiera Italiana" class="h-4 w-6 mr-2">
                Italiano
            </button>
            <button class="lang-option w-full flex items-center p-3 hover:bg-gray-100" data-lang="ja" data-text="日本語">
                <img src="https://flagcdn.com/jp.svg" alt="Bandiera Giapponese" class="h-4 w-6 mr-2">
                日本語
            </button>
            <button class="lang-option w-full flex items-center p-3 hover:bg-gray-100" data-lang="nl" data-text="Nederlands">
                <img src="https://flagcdn.com/nl.svg" alt="Bandiera Olandese" class="h-4 w-6 mr-2">
                Nederlands
            </button>
            <button class="lang-option w-full flex items-center p-3 hover:bg-gray-100" data-lang="pl" data-text="Polski">
                <img src="https://flagcdn.com/pl.svg" alt="Bandiera Polacca" class="h-4 w-6 mr-2">
                Polski
            </button>
            <button class="lang-option w-full flex items-center p-3 hover:bg-gray-100" data-lang="ru" data-text="Русский">
                <img src="https://flagcdn.com/ru.svg" alt="Bandiera Russa" class="h-4 w-6 mr-2">
                Русский
            </button>
            <button class="lang-option w-full flex items-center p-3 hover:bg-gray-100" data-lang="zh" data-text="中文">
                <img src="https://flagcdn.com/cn.svg" alt="Bandiera Cinese" class="h-4 w-6 mr-2">
                中文
            </button>
            <button class="lang-option w-full flex items-center p-3 hover:bg-gray-100" data-lang="ko-kp" data-text="조선말">
                <img src="https://flagcdn.com/kp.svg" alt="Bandiera Coreana del Nord" class="h-4 w-6 mr-2">
                조선말
            </button>
            <button class="lang-option w-full flex items-center p-3 hover:bg-gray-100 rounded-b-lg" data-lang="ko-kr" data-text="한국어">
                <img src="https://flagcdn.com/kr.svg" alt="Bandiera Coreana del Sud" class="h-4 w-6 mr-2">
                한국어
            </button>
        </div>
    `;

    // Oggetto con le traduzioni per i vari testi dell'interfaccia
    const translations = {
        'it': {
            menuTitle: 'Menu',
            navPubblici: 'Pubblici',
            navCercaPersone: 'Cerca Persone',
            navMessaggi: 'Messaggi',
            navPosta: 'Posta',
            navSegnalazioni: 'Segnalazioni',
            navProfilo: 'Profilo',
            navImpostazioni: 'Impostazioni',
            navAdmin: 'Gestione Utenti',
            logout: 'Esci',
            impostazioniTitle: 'Impostazioni',
            impostazioniDesc: 'Configura le preferenze del tuo account.',
            backgroundTitle: 'Colore di Sfondo',
            deleteAccountTitle: 'Elimina Account',
            deleteAccountDesc: 'Questa azione è irreversibile. Eliminerà permanentemente il tuo account e tutti i dati associati.',
            deleteAccountBtn: 'Elimina il mio account',
            modalTitle: 'Sei sicuro?',
            modalDesc: 'Vuoi davvero eliminare il tuo account? Questa azione non può essere annullata.',
            modalCancelBtn: 'Annulla',
            modalConfirmBtn: 'Elimina'
        },
        // Traduzioni da file esterni (controllo di sicurezza se i file non sono ancora caricati)
        'en': en_translations,
        'es': es_translations,
        'fr': fr_translations,
        'de': de_translations,
        'ar': ar_translations,
        'ru': ru_translations,
        'ja': ja_translations,
        'nl': nl_translations,
        'zh': zh_translations,
        'hi': hi_translations,
        'pl': pl_translations,
        'ko-kp': kokp_translations,
        'ko-kr': kokr_translations
    };

    // 5. Gestione Cambio Lingua
    document.querySelectorAll('.lang-option').forEach(option => {
        option.addEventListener('click', () => {
            const lang = option.getAttribute('data-lang');
            const text = option.getAttribute('data-text');
            const flagSrc = option.querySelector('img').src;

            // Aggiorna UI (Bandiera e Testo)
            if (selectedFlag) selectedFlag.src = flagSrc;
            if (selectedLangText) selectedLangText.textContent = text;
            
            localStorage.setItem('selectedLanguage', lang);
            updateContent(lang);
            
            if (languageDropdownMenu) languageDropdownMenu.classList.add('hidden');
            if (dropdownIcon) dropdownIcon.classList.remove('rotate-180');
        });
    });
    
    // Funzione per aggiornare il contenuto e salvare la scelta nel browser
    const updateContent = (lang) => {
        // 1. Salva la lingua nel localStorage per tenerla in memoria
        localStorage.setItem('selectedLanguage', lang);
        
        // 2. Traduci gli elementi senza sovrascrivere le icone (SVG)
        const elementsToTranslate = document.querySelectorAll('[data-translate]');
        elementsToTranslate.forEach(element => {
            const key = element.getAttribute('data-translate');
            if (translations[lang] && translations[lang][key]) {
                
                // Cerca uno span interno dedicato al testo (es. .nav-text o #logout-text)
                const textSpan = element.querySelector('.nav-text, #logout-text');
                
                if (textSpan) {
                    // Aggiorna SOLO lo span, le icone SVG restano intatte
                    textSpan.textContent = translations[lang][key];
                } else {
                    // Fallback se non ci sono span (es. vecchi titoli senza SVG)
                    element.textContent = translations[lang][key];
                }
            }
        });
    };

    // Aggiungi il contenuto del menu a tendina al DOM
    const container = document.getElementById('language-dropdown-container');
    if (container) {
        container.innerHTML = dropdownHtml;
    }

    const languageToggle = document.getElementById('language-toggle');
    const languageDropdownMenu = document.getElementById('language-dropdown-menu');
    const dropdownIcon = document.getElementById('dropdown-icon');
    const selectedFlag = document.getElementById('selected-flag');
    const selectedLangText = document.getElementById('selected-lang-text');
    const langOptions = document.querySelectorAll('.lang-option');

    // 4. Gestione Apertura/Chiusura (Solo se esistono nella pagina)
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

    // Listener per le opzioni del menu
    langOptions.forEach(option => {
        option.addEventListener('click', () => {
            const lang = option.getAttribute('data-lang');
            const text = option.getAttribute('data-text');
            const flagSrc = option.querySelector('img').src;

            // Aggiorna la bandiera e il testo nel pulsante principale
            if (selectedFlag && selectedLangText) {
                selectedFlag.src = flagSrc;
                selectedFlag.alt = `Bandiera ${text}`;
                selectedLangText.textContent = text;
            }
            
            // Chiudi il menu a tendina
            languageDropdownMenu.classList.add('hidden');
            dropdownIcon.classList.remove('rotate-180');

            // Chiama la funzione di traduzione
            updateContent(lang);
        });
    });

    // Aspettiamo 100 millisecondi per assicurarci che nav.js e il footer abbiano generato l'HTML
    setTimeout(() => {
        const savedLang = localStorage.getItem('selectedLanguage') || 'it';
        updateContent(savedLang);
        
        // Sincronizza la bandiera iniziale
        const initialOption = document.querySelector(`.lang-option[data-lang="${savedLang}"]`);
        if (initialOption && selectedFlag && selectedLangText) {
            selectedFlag.src = initialOption.querySelector('img').src;
            selectedLangText.textContent = initialOption.getAttribute('data-text');
        }
    }, 150);
});