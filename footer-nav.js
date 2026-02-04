// footer-nav.js

document.addEventListener("DOMContentLoaded", function() {
    // Definizione del contenuto HTML
    const footerContent = `
        <div class="mt-auto pt-6 flex flex-col items-start w-full space-y-4 relative">
            <div class="relative w-full">
                <button id="language-toggle" class="flex items-center w-full text-lg font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-100 p-2 rounded-lg transition duration-200 focus:outline-none">
                    <img id="selected-flag" src="https://flagcdn.com/it.svg" alt="Bandiera Italiana" class="h-4 w-6 mr-2">
                    <span id="selected-lang-text">Italiano</span>
                    <svg id="dropdown-icon" class="w-4 h-4 ml-auto transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                </button>
                <div id="language-dropdown-container"></div>
            </div>
            <a href="index.html" id="logout-link" class="text-lg font-medium text-red-600 hover:underline transition duration-200" data-translate="logout">
                Esci
            </a>
        </div>
    `;

    // Selezione tramite ID (molto più sicuro)
    const sidebar = document.getElementById('sidebar-container');

    if (sidebar) {
        sidebar.insertAdjacentHTML('beforeend', footerContent);
        
        // Avvisiamo il sistema che il footer è pronto per le traduzioni
        document.dispatchEvent(new Event('footer-loaded'));
    } else {
        console.error("Errore: Elemento #sidebar-container non trovato.");
    }
});
