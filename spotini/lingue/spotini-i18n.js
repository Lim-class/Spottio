import { initSpotTranslations } from '../../spot/lingue/spot-i18n.js';
import itSpotiniTranslations from './it.js';

const spotiniLoaders = {
    'it': () => Promise.resolve({ default: itSpotiniTranslations }),
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

export async function initSpotiniTranslations() {
    await initSpotTranslations();

    const rawLang = localStorage.getItem('selectedLanguage') || navigator.language || 'it';
    const normalize = window.getDictionaryKey || ((code) => (code && code.startsWith('ko') ? 'ko' : code || 'it'));
    const langKey = normalize(rawLang);

    const loader = spotiniLoaders[langKey] || spotiniLoaders['it'];

    try {
        const module = await loader();
        const activeTranslations = module.default || module;
        const merged = Object.assign({}, itSpotiniTranslations, activeTranslations);

        window.translations[langKey] = Object.assign(window.translations[langKey] || {}, merged);
        window.translations['it'] = Object.assign(window.translations['it'] || {}, itSpotiniTranslations);

        return window.translations[langKey];
    } catch (e) {
        console.error("Errore caricamento i18n Spotini:", e);
        window.translations['it'] = Object.assign(window.translations['it'] || {}, itSpotiniTranslations);
        return window.translations['it'];
    }
}