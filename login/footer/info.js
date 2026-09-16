// info.js

// Funzione globale per renderizzare in sicurezza le sezioni senza HTML injection (innerHTML)
window.renderTextSection = function(container, data) {
    if (!container || !data) return;
    container.innerHTML = ""; // Pulisce il contenitore prima del re-render

    // Gestione se la struttura è un array di paragrafi semplici (es. Storia)
    if (Array.isArray(data.paragraphs)) {
        data.paragraphs.forEach(text => {
            const p = document.createElement('p');
            p.className = "text-gray-700 leading-relaxed text-base mb-4";
            p.textContent = text;
            container.appendChild(p);
        });
        return;
    }

    // Gestione se la struttura è a blocchi (es. Privacy e Policy)
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

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const section = urlParams.get('section') || 'privacy';

    const titleElement = document.getElementById('info-title');
    const contentElement = document.getElementById('info-content');
    const pageTitle = document.getElementById('page-title');

    // Funzione principale che aggiorna la pagina con la lingua corrente
    function renderPage() {
        const lang = localStorage.getItem('selectedLanguage') || 'it';
        let data;

        if (section === 'storia') {
            data = (window.storiaData && window.storiaData[lang]) || window.storiaData['it'];
        } else if (section === 'policy') {
            data = (window.policyData && window.policyData[lang]) || window.policyData['it'];
        } else {
            // Default: Privacy
            data = (window.privacyData && window.privacyData[lang]) || window.privacyData['it'];
        }

        if (data) {
            if (pageTitle) pageTitle.textContent = data.pageTitle || data.title;
            if (titleElement) titleElement.textContent = data.title;
            if (contentElement) window.renderTextSection(contentElement, data);
        }
    }

    // Carica la pagina al primo avvio
    renderPage();

    // Ricarica i contenuti quando l'utente cambia lingua (evento dispatchato da language-dropdown.js)
    document.addEventListener('languageChanged', renderPage);
});