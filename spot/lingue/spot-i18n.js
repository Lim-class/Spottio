import itTranslations from './it.js';

const languageLoaders = {
    'it': () => Promise.resolve({ default: itTranslations }),
    'en': () => import('./en.js'),
    'es': () => import('./es.js'),
    'fr': () => import('./fr.js'),
    'de': () => import('./de.js'),
    'ar': () => import('./ar.js'),
    'ru': () => import('./ru.js'),
    'ja': () => import('./ja.js'),
    'nl': () => import('./nl.js'),
    'pl': () => import('./pl.js'),
    'zh': () => import('./zh.js'),
    'hi': () => import('./hi.js'),
    'ko': () => import('./ko.js')
};

export async function initSpotTranslations() {
    window.translations = window.translations || {};

    const rawLang = localStorage.getItem('selectedLanguage') || navigator.language || 'it';
    const normalize = window.getDictionaryKey || ((code) => (code && code.startsWith('ko') ? 'ko' : code || 'it'));
    const langKey = normalize(rawLang);

    const loader = languageLoaders[langKey] || languageLoaders['it'];

    try {
        const module = await loader();
        const activeTranslations = module.default || module;
        const merged = Object.assign({}, itTranslations, activeTranslations);

        window.translations[langKey] = Object.assign(window.translations[langKey] || {}, merged);
        window.translations['it'] = Object.assign(window.translations['it'] || {}, itTranslations);

        if (typeof window.translatePage === 'function') {
            window.translatePage(langKey);
        }

        return { langKey, dictionary: merged };
    } catch (err) {
        console.error("Errore caricamento traduzioni Spot:", err);
        window.translations['it'] = Object.assign(window.translations['it'] || {}, itTranslations);
        return { langKey: 'it', dictionary: itTranslations };
    }
}