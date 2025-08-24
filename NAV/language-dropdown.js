document.addEventListener('DOMContentLoaded', () => {
    // Definizione del contenuto HTML del menu a tendina
    const dropdownHtml = `
        <div id="language-dropdown-menu" class="absolute top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg hidden z-10">
            <button class="lang-option w-full flex items-center p-3 hover:bg-gray-100 rounded-t-lg" data-lang="it" data-text="Italiano">
                <img src="https://flagcdn.com/it.svg" alt="Bandiera Italiana" class="h-4 w-6 mr-2">
                Italiano
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
            <button class="lang-option w-full flex items-center p-3 hover:bg-gray-100" data-lang="de" data-text="Deutsch">
                <img src="https://flagcdn.com/de.svg" alt="Bandiera Tedesca" class="h-4 w-6 mr-2">
                Deutsch
            </button>
            <button class="lang-option w-full flex items-center p-3 hover:bg-gray-100" data-lang="ar" data-text="العربية">
                <img src="https://flagcdn.com/sa.svg" alt="Bandiera Araba" class="h-4 w-6 mr-2">
                العربية
            </button>
            <button class="lang-option w-full flex items-center p-3 hover:bg-gray-100" data-lang="ru" data-text="Русский">
                <img src="https://flagcdn.com/ru.svg" alt="Bandiera Russa" class="h-4 w-6 mr-2">
                Русский
            </button>
            <button class="lang-option w-full flex items-center p-3 hover:bg-gray-100" data-lang="ja" data-text="日本語">
                <img src="https://flagcdn.com/jp.svg" alt="Bandiera Giapponese" class="h-4 w-6 mr-2">
                日本語
            </button>
            <button class="lang-option w-full flex items-center p-3 hover:bg-gray-100" data-lang="nl" data-text="Nederlands">
                <img src="https://flagcdn.com/nl.svg" alt="Bandiera Olandese" class="h-4 w-6 mr-2">
                Nederlands
            </button>
            <button class="lang-option w-full flex items-center p-3 hover:bg-gray-100" data-lang="zh" data-text="中文">
                <img src="https://flagcdn.com/cn.svg" alt="Bandiera Cinese" class="h-4 w-6 mr-2">
                中文
            </button>
            <button class="lang-option w-full flex items-center p-3 hover:bg-gray-100" data-lang="hi" data-text="हिन्दी">
                <img src="https://flagcdn.com/in.svg" alt="Bandiera Indiana" class="h-4 w-6 mr-2">
                हिन्दी
            </button>
            <button class="lang-option w-full flex items-center p-3 hover:bg-gray-100" data-lang="pl" data-text="Polski">
                <img src="https://flagcdn.com/pl.svg" alt="Bandiera Polacca" class="h-4 w-6 mr-2">
                Polski
            </button>
            <button class="lang-option w-full flex items-center p-3 hover:bg-gray-100" data-lang="ko-kp" data-text="조선말 ">
                <img src="https://flagcdn.com/kp.svg" alt="Bandiera Coreana del Nord" class="h-4 w-6 mr-2">
                조선말
            </button>
            <button class="lang-option w-full flex items-center p-3 hover:bg-gray-100 rounded-b-lg" data-lang="ko-kr" data-text="한국어 ">
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
        // Traduzioni esistenti (si presuppone che gli oggetti en_translations, es_translations e fr_translations siano definiti altrove)
        'en': en_translations,
        'es': es_translations,
        'fr': fr_translations,
        // Nuove traduzioni
        'de': {
            menuTitle: 'Menü',
            navPubblici: 'Öffentlich',
            navCercaPersone: 'Personen suchen',
            navMessaggi: 'Nachrichten',
            navPosta: 'Mail',
            navSegnalazioni: 'Berichte',
            navProfilo: 'Profil',
            navImpostazioni: 'Einstellungen',
            navAdmin: 'Benutzerverwaltung',
            logout: 'Abmelden',
            impostazioniTitle: 'Einstellungen',
            impostazioniDesc: 'Konfigurieren Sie Ihre Kontoeinstellungen.',
            backgroundTitle: 'Hintergrundfarbe',
            deleteAccountTitle: 'Konto löschen',
            deleteAccountDesc: 'Diese Aktion ist irreversibel. Ihr Konto und alle zugehörigen Daten werden dauerhaft gelöscht.',
            deleteAccountBtn: 'Mein Konto löschen',
            modalTitle: 'Bist du sicher?',
            modalDesc: 'Möchten Sie Ihr Konto wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
            modalCancelBtn: 'Abbrechen',
            modalConfirmBtn: 'Löschen'
        },
        'ar': {
            menuTitle: 'القائمة',
            navPubblici: 'عام',
            navCercaPersone: 'البحث عن أشخاص',
            navMessaggi: 'الرسائل',
            navPosta: 'البريد',
            navSegnalazioni: 'تقارير',
            navProfilo: 'الملف الشخصي',
            navImpostazioni: 'الإعدادات',
            navAdmin: 'إدارة المستخدمين',
            logout: 'تسجيل الخروج',
            impostazioniTitle: 'الإعدادات',
            impostazioniDesc: 'قم بتكوين تفضيلات حسابك.',
            backgroundTitle: 'لون الخلفية',
            deleteAccountTitle: 'حذف الحساب',
            deleteAccountDesc: 'هذا الإجراء لا رجعة فيه. سيتم حذف حسابك وجميع البيانات المرتبطة به بشكل دائم.',
            deleteAccountBtn: 'حذف حسابي',
            modalTitle: 'هل أنت متأكد؟',
            modalDesc: 'هل تريد حقًا حذف حسابك؟ لا يمكن التراجع عن هذا الإجراء.',
            modalCancelBtn: 'إلغاء',
            modalConfirmBtn: 'حذف'
        },
        'ru': {
            menuTitle: 'Меню',
            navPubblici: 'Публичные',
            navCercaPersone: 'Найти людей',
            navMessaggi: 'Сообщения',
            navPosta: 'Почта',
            navSegnalazioni: 'Отчеты',
            navProfilo: 'Профиль',
            navImpostazioni: 'Настройки',
            navAdmin: 'Управление пользователями',
            logout: 'Выйти',
            impostazioniTitle: 'Настройки',
            impostazioniDesc: 'Настройте параметры своей учетной записи.',
            backgroundTitle: 'Цвет фона',
            deleteAccountTitle: 'Удалить аккаунт',
            deleteAccountDesc: 'Это действие необратимо. Ваш аккаунт и все связанные с ним данные будут удалены навсегда.',
            deleteAccountBtn: 'Удалить мой аккаунт',
            modalTitle: 'Вы уверены?',
            modalDesc: 'Вы действительно хотите удалить свой аккаунт? Это действие нельзя отменить.',
            modalCancelBtn: 'Отмена',
            modalConfirmBtn: 'Удалить'
        },
        'ja': {
            menuTitle: 'メニュー',
            navPubblici: 'パブリック',
            navCercaPersone: '人を探す',
            navMessaggi: 'メッセージ',
            navPosta: 'メール',
            navSegnalazioni: 'レポート',
            navProfilo: 'プロフィール',
            navImpostazioni: '設定',
            navAdmin: 'ユーザー管理',
            logout: 'ログアウト',
            impostazioniTitle: '設定',
            impostazioniDesc: 'アカウント設定を構成します。',
            backgroundTitle: '背景色',
            deleteAccountTitle: 'アカウントを削除',
            deleteAccountDesc: 'この操作は元に戻せません。アカウントと関連データがすべて永久に削除されます。',
            deleteAccountBtn: 'アカウントを削除',
            modalTitle: 'よろしいですか？',
            modalDesc: '本当にアカウントを削除しますか？この操作は元に戻せません。',
            modalCancelBtn: 'キャンセル',
            modalConfirmBtn: '削除'
        },
        'nl': {
            menuTitle: 'Menu',
            navPubblici: 'Openbaar',
            navCercaPersone: 'Mensen zoeken',
            navMessaggi: 'Berichten',
            navPosta: 'Post',
            navSegnalazioni: 'Rapporten',
            navProfilo: 'Profiel',
            navImpostazioni: 'Instellingen',
            navAdmin: 'Gebruikersbeheer',
            logout: 'Uitloggen',
            impostazioniTitle: 'Instellingen',
            impostazioniDesc: 'Configureer de voorkeuren van uw account.',
            backgroundTitle: 'Achtergrondkleur',
            deleteAccountTitle: 'Account verwijderen',
            deleteAccountDesc: 'Deze actie is onomkeerbaar. Uw account en alle bijbehorende gegevens worden permanent verwijderd.',
            deleteAccountBtn: 'Mijn account verwijderen',
            modalTitle: 'Weet je het zeker?',
            modalDesc: 'Wil je echt je account verwijderen? Deze actie kan niet ongedaan worden gemaakt.',
            modalCancelBtn: 'Annuleren',
            modalConfirmBtn: 'Verwijderen'
        },
        'zh': {
            menuTitle: '菜单',
            navPubblici: '公共',
            navCercaPersone: '找人',
            navMessaggi: '消息',
            navPosta: '邮件',
            navSegnalazioni: '报告',
            navProfilo: '个人资料',
            navImpostazioni: '设置',
            navAdmin: '用户管理',
            logout: '登出',
            impostazioniTitle: '设置',
            impostazioniDesc: '配置您的账户偏好。',
            backgroundTitle: '背景颜色',
            deleteAccountTitle: '删除账户',
            deleteAccountDesc: '此操作不可逆。您的账户及所有相关数据将被永久删除。',
            deleteAccountBtn: '删除我的账户',
            modalTitle: '你确定吗？',
            modalDesc: '你真的想删除你的账户吗？此操作无法撤销。',
            modalCancelBtn: '取消',
            modalConfirmBtn: '删除'
        },
        // Traduzioni aggiunte
        'hi': {
            menuTitle: 'मेन्यू',
            navPubblici: 'सार्वजनिक',
            navCercaPersone: 'लोग ढूंढें',
            navMessaggi: 'संदेश',
            navPosta: 'डाक',
            navSegnalazioni: 'रिपोर्ट',
            navProfilo: 'प्रोफ़ाइल',
            navImpostazioni: 'सेटिंग्स',
            navAdmin: 'उपयोगकर्ता प्रबंधन',
            logout: 'लॉग आउट',
            impostazioniTitle: 'सेटिंग्स',
            impostazioniDesc: 'अपने खाते की प्राथमिकताओं को कॉन्फ़िगर करें।',
            backgroundTitle: 'पृष्ठभूमि रंग',
            deleteAccountTitle: 'खाता हटाएँ',
            deleteAccountDesc: 'यह क्रिया अपरिवर्तनीय है। आपका खाता और उससे जुड़ा सभी डेटा स्थायी रूप से हटा दिया जाएगा।',
            deleteAccountBtn: 'मेरा खाता हटाएँ',
            modalTitle: 'क्या आप सुनिश्चित हैं?',
            modalDesc: 'क्या आप वाकई अपना खाता हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।',
            modalCancelBtn: 'रद्द करें',
            modalConfirmBtn: 'हटाएँ'
        },
        'pl': {
            menuTitle: 'Menu',
            navPubblici: 'Publiczne',
            navCercaPersone: 'Szukaj osób',
            navMessaggi: 'Wiadomości',
            navPosta: 'Poczta',
            navSegnalazioni: 'Raporty',
            navProfilo: 'Profil',
            navImpostazioni: 'Ustawienia',
            navAdmin: 'Zarządzanie użytkownikami',
            logout: 'Wyloguj',
            impostazioniTitle: 'Ustawienia',
            impostazioniDesc: 'Skonfiguruj preferencje swojego konta.',
            backgroundTitle: 'Kolor tła',
            deleteAccountTitle: 'Usuń konto',
            deleteAccountDesc: 'Ta akcja jest nieodwracalna. Spowoduje to trwałe usunięcie Twojego konta i wszystkich powiązanych danych.',
            deleteAccountBtn: 'Usuń moje konto',
            modalTitle: 'Jesteś pewien?',
            modalDesc: 'Czy na pewno chcesz usunąć swoje konto? Tej akcji nie można cofnąć.',
            modalCancelBtn: 'Anuluj',
            modalConfirmBtn: 'Usuń'
        },
        'ko-kp': {
            menuTitle: '메뉴',
            navPubblici: '공개',
            navCercaPersone: '사람 찾기',
            navMessaggi: '메시지',
            navPosta: '우편',
            navSegnalazioni: '보고서',
            navProfilo: '프로필',
            navImpostazioni: '설정',
            navAdmin: '사용자 관리',
            logout: '로그아웃',
            impostazioniTitle: '설정',
            impostazioniDesc: '계정 기본 설정을 구성합니다.',
            backgroundTitle: '배경색',
            deleteAccountTitle: '계정 삭제',
            deleteAccountDesc: '이 작업은 되돌릴 수 없습니다. 귀하의 계정 및 모든 관련 데이터가 영구적으로 삭제됩니다.',
            deleteAccountBtn: '내 계정 삭제',
            modalTitle: '확실합니까?',
            modalDesc: '정말로 계정을 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.',
            modalCancelBtn: '취소',
            modalConfirmBtn: '삭제'
        },
        'ko-kr': {
            menuTitle: '메뉴',
            navPubblici: '공개',
            navCercaPersone: '사람 찾기',
            navMessaggi: '메시지',
            navPosta: '우편',
            navSegnalazioni: '보고서',
            navProfilo: '프로필',
            navImpostazioni: '설정',
            navAdmin: '사용자 관리',
            logout: '로그아웃',
            impostazioniTitle: '설정',
            impostazioniDesc: '계정 기본 설정을 구성합니다.',
            backgroundTitle: '배경색',
            deleteAccountTitle: '계정 삭제',
            deleteAccountDesc: '이 작업은 되돌릴 수 없습니다. 귀하의 계정 및 모든 관련 데이터가 영구적으로 삭제됩니다.',
            deleteAccountBtn: '내 계정 삭제',
            modalTitle: '확실합니까?',
            modalDesc: '정말로 계정을 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.',
            modalCancelBtn: '취소',
            modalConfirmBtn: '삭제'
        }
    };
    
    // Funzione per aggiornare il contenuto di testo degli elementi di navigazione.
    const updateContent = (lang) => {
        // Applica le traduzioni a tutti gli elementi con l'attributo data-translate
        const elementsToTranslate = document.querySelectorAll('[data-translate]');
        elementsToTranslate.forEach(element => {
            const key = element.getAttribute('data-translate');
            if (translations[lang] && translations[lang][key]) {
                element.textContent = translations[lang][key];
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

    // Listener per il click sul pulsante di toggle
    if (languageToggle && languageDropdownMenu) {
        languageToggle.addEventListener('click', () => {
            languageDropdownMenu.classList.toggle('hidden');
            dropdownIcon.classList.toggle('rotate-180');
        });

        // Chiudi il dropdown quando si clicca fuori
        document.addEventListener('click', (event) => {
            if (!languageToggle.contains(event.target) && !languageDropdownMenu.contains(event.target)) {
                languageDropdownMenu.classList.add('hidden');
                dropdownIcon.classList.remove('rotate-180');
            }
        });
    }

    // Listener per le opzioni del menu
    langOptions.forEach(option => {
        option.addEventListener('click', () => {
            const lang = option.getAttribute('data-lang');
            const text = option.getAttribute('data-text');
            const flagSrc = option.querySelector('img').src;

            // Aggiorna la bandiera e il testo
            selectedFlag.src = flagSrc;
            selectedFlag.alt = `Bandiera ${text}`;
            selectedLangText.textContent = text;
            
            // Chiudi il menu a tendina
            languageDropdownMenu.classList.add('hidden');
            dropdownIcon.classList.remove('rotate-180');

            // Chiama la funzione di traduzione
            updateContent(lang);
        });
    });

    // Imposta la lingua di default (italiano) al caricamento della pagina
    updateContent('it');
});

