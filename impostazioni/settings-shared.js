// settings-shared.js
window.SettingsModules = window.SettingsModules || {};
window.translations = window.translations || {};

// Helper unico per registrare traduzioni, sincronizzando varianti coreane
window.SettingsModules.registerTranslations = function(data) {
    const koreanDict = data['ko'] || data['ko-kp'] || data['ko-kr'];
    if (koreanDict) {
        data['ko'] = koreanDict;
        data['ko-kp'] = koreanDict;
        data['ko-kr'] = koreanDict;
    }

    Object.keys(data).forEach(lang => {
        window.translations[lang] = Object.assign(window.translations[lang] || {}, data[lang]);
    });
};

// Helper centralizzato (punta al Single Source of Truth)
window.SettingsModules.getUid = function() {
    return window.Spottio ? window.Spottio.getCurrentUid() : localStorage.getItem('currentUid');
};