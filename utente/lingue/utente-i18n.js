// utente/lingue/utente-i18n.js
import { initProfileTranslations } from '../../profilo/lingue/profilo-i18n.js';
import itUserTranslations from './it.js';

const userLanguageLoaders = {
    'it': () => Promise.resolve({ default: itUserTranslations }),
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
    'ko': () => import('./ko.js'),
    'ko-kp': () => import('./ko.js'),
    'ko-kr': () => import('./ko.js')
};

export async function initUserTranslations() {
    // 1. Inizializza le traduzioni condivise del profilo e la navbar
    await initProfileTranslations();

    let langCode = localStorage.getItem('selectedLanguage') || navigator.language || 'it';
    langCode = langCode.toLowerCase();

    if (typeof window.getDictionaryKey === 'function') {
        langCode = window.getDictionaryKey(langCode);
    } else if (langCode.startsWith('ko')) {
        langCode = 'ko';
    }

    const loader = userLanguageLoaders[langCode] || userLanguageLoaders['it'];

    try {
        const module = await loader();
        const activeUserTranslations = module.default || module;

        // Unione con fallback italiano di utente
        const mergedUser = Object.assign({}, itUserTranslations, activeUserTranslations);

        // Estende il dizionario globale della lingua attiva
        window.translations[langCode] = Object.assign(window.translations[langCode] || {}, mergedUser);
        window.translations['it'] = Object.assign(window.translations['it'] || {}, itUserTranslations);

        if (langCode === 'ko') {
            window.translations['ko-kp'] = Object.assign(window.translations['ko-kp'] || {}, mergedUser);
            window.translations['ko-kr'] = Object.assign(window.translations['ko-kr'] || {}, mergedUser);
        }

        return window.translations[langCode];
    } catch (err) {
        console.error("Errore caricamento traduzioni utente:", err);
        window.translations['it'] = Object.assign(window.translations['it'] || {}, itUserTranslations);
        return window.translations['it'];
    }
}