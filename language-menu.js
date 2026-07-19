// language-menu.js

const APP_LANGUAGES = [
    { code: 'ar', text: 'العربية', flag: 'sa.svg', alt: 'Bandiera Araba' },
    { code: 'de', text: 'Deutsch', flag: 'de.svg', alt: 'Bandiera Tedesca' },
    { code: 'en', text: 'English', flag: 'gb.svg', alt: 'Bandiera Inglese' },
    { code: 'es', text: 'Español', flag: 'es.svg', alt: 'Bandiera Spagnola' },
    { code: 'fr', text: 'Français', flag: 'fr.svg', alt: 'Bandiera Francese' },
    { code: 'hi', text: 'हिन्दी', flag: 'in.svg', alt: 'Bandiera Indiana' },
    { code: 'it', text: 'Italiano', flag: 'it.svg', alt: 'Bandiera Italiana' },
    { code: 'ja', text: '日本語', flag: 'jp.svg', alt: 'Bandiera Giapponese' },
    { code: 'nl', text: 'Nederlands', flag: 'nl.svg', alt: 'Bandiera Olandese' },
    { code: 'pl', text: 'Polski', flag: 'pl.svg', alt: 'Bandiera Polacca' },
    { code: 'ru', text: 'Русский', flag: 'ru.svg', alt: 'Bandiera Russa' },
    { code: 'zh', text: '中文', flag: 'cn.svg', alt: 'Bandiera Cinese' },
    { code: 'ko-kp', text: '조선말', flag: 'kp.svg', alt: 'Bandiera Coreana del Nord' },
    { code: 'ko-kr', text: '한국어', flag: 'kr.svg', alt: 'Bandiera Coreana del Sud' }
];

function getLanguageDropdownHTML() {
    const optionsHtml = APP_LANGUAGES.map((lang, index) => {
        // Applica i bordi arrotondati al primo e all'ultimo elemento
        const roundedClass = index === 0 ? 'rounded-t-lg' : (index === APP_LANGUAGES.length - 1 ? 'rounded-b-lg' : '');
        return `
        <button class="lang-option w-full flex items-center p-3 hover:bg-gray-100 ${roundedClass}" data-lang="${lang.code}" data-text="${lang.text}">
            <img src="https://flagcdn.com/${lang.flag}" alt="${lang.alt}" class="h-4 w-6 mr-2">${lang.text}
        </button>`;
    }).join('');

    return `
    <div id="language-dropdown-menu" class="absolute top-full mt-2 w-max min-w-full bg-white border border-gray-200 rounded-lg shadow-lg hidden z-10 p-1">
        ${optionsHtml}
    </div>`;
}