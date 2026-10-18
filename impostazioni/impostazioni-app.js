// impostazioni-app.js
const { createApp, ref, onMounted } = Vue;

const app = createApp({
    setup() {
        const currentLang = ref(localStorage.getItem('selectedLanguage') || 'it');
        const searchQuery = ref('');
        const isAdmin = ref(localStorage.getItem('isAdmin') === 'true');

        // Accordion state
        const activeMacro = ref(null);
        const activeSection = ref(null);

        // Funzione Traduzione
        const t = (key, fallback = '') => {
            const dictKey = window.getDictionaryKey ? window.getDictionaryKey(currentLang.value) : currentLang.value;
            const dict = (window.translations && window.translations[dictKey]) || 
                         (window.translations && window.translations[currentLang.value]) || 
                         (window.translations && window.translations['it']) || 
                         {};
            return dict[key] !== undefined ? dict[key] : (fallback || key);
        };

        const toggleMacro = (macroKey) => {
            if (activeMacro.value === macroKey) {
                activeMacro.value = null;
                activeSection.value = null;
            } else {
                activeMacro.value = macroKey;
                activeSection.value = null;
            }
        };

        const toggleSection = (sectKey) => {
            activeSection.value = activeSection.value === sectKey ? null : sectKey;
        };

        // Aggiorna la lingua e notifica la navbar
        window.addEventListener('spottio-language-changed', (e) => {
            currentLang.value = e.detail;
            if (typeof window.translatePage === 'function') {
                window.translatePage(e.detail);
            }
        });

        onMounted(() => {
            if (typeof window.translatePage === 'function') {
                window.translatePage(currentLang.value);
            }
        });

        return {
            currentLang,
            searchQuery,
            isAdmin,
            activeMacro,
            activeSection,
            t,
            toggleMacro,
            toggleSection
        };
    }
});

// Registrazione componenti collocati nelle rispettive cartelle
if (window.SettingsComponents) {
    if (window.SettingsComponents.MacroAspetto) app.component('macro-aspetto', window.SettingsComponents.MacroAspetto);
    if (window.SettingsComponents.MacroSicurezza) app.component('macro-sicurezza', window.SettingsComponents.MacroSicurezza);
    if (window.SettingsComponents.MacroPrivacy) app.component('macro-privacy', window.SettingsComponents.MacroPrivacy);
    if (window.SettingsComponents.MacroInfo) app.component('macro-info', window.SettingsComponents.MacroInfo);
    if (window.SettingsComponents.MacroAmministrazione) app.component('macro-amministrazione', window.SettingsComponents.MacroAmministrazione);
    if (window.SettingsComponents.MacroAvanzate) app.component('macro-avanzate', window.SettingsComponents.MacroAvanzate);
}

app.mount('#vue-settings-app');