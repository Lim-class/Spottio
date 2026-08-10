// gestione-impostazioni.js

// Funzione globale condivisa per renderizzare il testo senza innerHTML
window.renderTextSection = window.renderTextSection || function(container, data) {
    if (!container || !data) return;
    container.innerHTML = ""; 

    if (Array.isArray(data.paragraphs)) {
        data.paragraphs.forEach(text => {
            const p = document.createElement('p');
            p.className = "text-gray-700 leading-relaxed text-base mb-4";
            p.textContent = text;
            container.appendChild(p);
        });
        return;
    }

    if (Array.isArray(data.blocks)) {
        data.blocks.forEach(block => {
            if (block.type === 'p') {
                const p = document.createElement('p');
                p.className = block.highlight
                    ? "text-gray-700 font-semibold leading-relaxed text-base mb-3"
                    : "text-gray-600 leading-relaxed text-base mb-3";
                p.textContent = block.text;
                container.appendChild(p);
            } else if (block.type === 'h2') {
                const h2 = document.createElement('h2');
                h2.className = "text-xl font-bold text-gray-800 mt-6 mb-2";
                h2.textContent = block.text;
                container.appendChild(h2);
            } else if (block.type === 'ul' && Array.isArray(block.items)) {
                const ul = document.createElement('ul');
                ul.className = "list-disc list-inside text-gray-600 leading-relaxed text-base space-y-2 mb-4";
                
                block.items.forEach(item => {
                    const li = document.createElement('li');
                    if (item.label) {
                        const strong = document.createElement('strong');
                        strong.textContent = item.label + ": ";
                        li.appendChild(strong);
                        li.appendChild(document.createTextNode(item.text));
                    } else {
                        li.textContent = item.text;
                    }
                    ul.appendChild(li);
                });
                container.appendChild(ul);
            }
        });
    }
};

// Funzione per aggiornare i testi di Storia, Privacy e Policy nelle Impostazioni in base alla lingua
function updateSettingsSections() {
    const lang = localStorage.getItem('selectedLanguage') || 'it';

    const containerStoria = document.getElementById('storia-content');
    const containerPrivacy = document.getElementById('privacy-content');
    const containerPolicy = document.getElementById('policy-content');

    if (containerStoria && window.storiaData) {
        const data = window.storiaData[lang] || window.storiaData['it'];
        window.renderTextSection(containerStoria, data);
    }

    if (containerPrivacy && window.privacyData) {
        const data = window.privacyData[lang] || window.privacyData['it'];
        window.renderTextSection(containerPrivacy, data);
    }

    if (containerPolicy && window.policyData) {
        const data = window.policyData[lang] || window.policyData['it'];
        window.renderTextSection(containerPolicy, data);
    }
}

// Inizializza la lingua all'avvio e ascolta i cambiamenti
document.addEventListener('DOMContentLoaded', updateSettingsSections);
document.addEventListener('languageChanged', updateSettingsSections);

// --- LOGICA ORIGINALE DEGLI ACCORDION ---

// Funzione per gestire l'apertura/chiusura ESCLUSIVA delle MACRO-CATEGORIE PRINCIPALI
function toggleMacro(id) {
    const macroIds = ['macro-aspetto', 'macro-sicurezza', 'macro-privacy', 'macro-info', 'macro-admin', 'macro-avanzate'];
    
    macroIds.forEach(mac => {
        const section = document.getElementById(mac);
        const icon = document.getElementById('icon-' + mac);
        
        if (!section) return;

        if (mac === id) {
            const isHidden = section.classList.contains('hidden');
            if (isHidden) {
                section.classList.remove('hidden');
                if (icon) icon.style.transform = 'rotate(180deg)';
            } else {
                section.classList.add('hidden');
                if (icon) icon.style.transform = 'rotate(0deg)';
            }
        } else {
            section.classList.add('hidden');
            if (icon) icon.style.transform = 'rotate(0deg)';
        }
    });
}

// Funzione per gestire l'apertura/chiusura delle SINGOLE SOTTO-VOCI
function toggleSection(id) {
    const sections = [
        { id: 'section-lingua', icon: 'icon-section-lingua' }, 
        { id: 'section-email', icon: 'icon-section-email' }, 
        { id: 'section-color', icon: 'icon-section-color' },
        { id: 'section-download', icon: 'icon-section-download' },
        { id: 'section-logout', icon: 'icon-section-logout' },
        { id: 'section-delete', icon: 'icon-section-delete' },
        { id: 'section-privacy', icon: 'icon-section-privacy' },
        { id: 'section-export', icon: 'icon-section-export' },
        { id: 'section-storia', icon: 'icon-section-storia' },
        { id: 'section-privacy-doc', icon: 'icon-section-privacy-doc' },
        { id: 'section-policy', icon: 'icon-section-policy' },
        { id: 'section-password', icon: 'icon-section-password'},
        { id: 'section-admin', icon: 'icon-section-admin'},
        { id: 'section-dob', icon: 'icon-section-dob'}
    ];
    
    sections.forEach(sec => {
        const section = document.getElementById(sec.id);
        const icon = document.getElementById(sec.icon);
        
        if (!section) return;

        if (sec.id === id) {
            const isHidden = section.classList.contains('hidden');
            if (isHidden) {
                section.classList.remove('hidden');
                if (icon) icon.style.transform = 'rotate(180deg)';
            } else {
                section.classList.add('hidden');
                if (icon) icon.style.transform = 'rotate(0deg)';
            }
        } else {
            section.classList.add('hidden');
            if (icon) icon.style.transform = 'rotate(0deg)';
        }
    });
}

// Funzione avanzata di Ricerca (cerca sia nel titolo della macro che nei singoli elementi)
function filterSettings() {
    const input = document.getElementById('searchSettings');
    const filter = input.value.toLowerCase();
    
    const macros = document.querySelectorAll('.macro-category');
    
    macros.forEach(macro => {
        if (macro.id === 'macro-cat-admin' && !macro.classList.contains('is-admin-active')) {
            macro.style.display = 'none';
            return;
        }
        
        const macroTitleEl = macro.querySelector('button > span:first-child');
        const macroTitleText = macroTitleEl ? macroTitleEl.innerText.toLowerCase() : "";
        
        const matchesMacroTitle = filter !== "" && macroTitleText.includes(filter);

        const subItems = macro.querySelectorAll('.sub-accordion-item');
        let hasVisibleMatch = false;
        
        subItems.forEach(item => {
            const titleElement = item.querySelector('button > span:first-child'); 
            if (titleElement) {
                const titleText = titleElement.innerText.toLowerCase();
                
                if (matchesMacroTitle || titleText.includes(filter)) {
                    item.style.display = ""; 
                    hasVisibleMatch = true;
                } else {
                    item.style.display = "none"; 
                    const content = item.querySelector('div[id^="section-"]');
                    if (content && !content.classList.contains('hidden')) {
                        content.classList.add('hidden');
                        const icon = item.querySelector('span[id^="icon-section-"]');
                        if (icon) icon.style.transform = 'rotate(0deg)';
                    }
                }
            }
        });

        if (filter === "") {
            macro.style.display = "";
            const macroContent = macro.querySelector('.macro-content');
            const macroIcon = macro.querySelector('.macro-icon');
            if (macroContent) macroContent.classList.add('hidden'); 
            if (macroIcon) macroIcon.style.transform = 'rotate(0deg)';
        } else {
            if (hasVisibleMatch || matchesMacroTitle) {
                macro.style.display = "";
                const macroContent = macro.querySelector('.macro-content');
                const macroIcon = macro.querySelector('.macro-icon');
                if (macroContent) macroContent.classList.remove('hidden'); 
                if (macroIcon) macroIcon.style.transform = 'rotate(180deg)';
            } else {
                macro.style.display = "none"; 
            }
        }
    });
}

// Logica permessi: Rende visibile il pannello admin SOLO se l'utente è amministratore
document.addEventListener('DOMContentLoaded', () => {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const adminCategory = document.getElementById('macro-cat-admin');
    
    if (isAdmin && adminCategory) {
        adminCategory.classList.add('is-admin-active');
        adminCategory.classList.remove('hidden');
    }
});