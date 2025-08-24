// nav.js

// Questo script gestisce la creazione e il caricamento della barra di navigazione.

document.addEventListener('DOMContentLoaded', () => {
    // Funzione per caricare la navigazione dinamicamente
    function loadNavigation() {
        // Seleziona il contenitore della navigazione
        const navContainer = document.getElementById('nav-container');

        if (navContainer) {
            // Codice HTML per la navigazione con icone SVG
            const navHTML = `
                <nav class="flex flex-col space-y-4 w-full">
            <a href="pubblici.html" class="nav-link text-lg font-medium text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition duration-200 flex items-center gap-2" data-translate="navPubblici">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Pubblici
            </a>
            <a href="cerca-persone.html" class="nav-link text-lg font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-100 p-2 rounded-lg transition duration-200 flex items-center gap-2" data-translate="navCercaPersone">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Cerca Persone
            </a>
            <a href="messaggi.html" class="nav-link text-lg font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-100 p-2 rounded-lg transition duration-200 flex items-center gap-2" data-translate="navMessaggi">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Messaggi
            </a>
            <a href="posta.html" class="nav-link text-lg font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-100 p-2 rounded-lg transition duration-200 flex items-center gap-2" data-translate="navPosta">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Posta
            </a>
            <a href="profilo.html" class="nav-link text-lg font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-100 p-2 rounded-lg transition duration-200 flex items-center gap-2" data-translate="navProfilo">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profilo
            </a>
            <a href="impostazioni.html" class="nav-link text-lg font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-100 p-2 rounded-lg transition duration-200 flex items-center gap-2" data-translate="navImpostazioni">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.525.293.93.55 1.065 1.066z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Impostazioni
            </a>
            <!-- Nuovo link per la gestione utenti, nascosto di default -->
            <a href="gestione-utenti.html" id="admin-link" class="nav-link text-lg font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-100 p-2 rounded-lg transition duration-200 hidden flex items-center gap-2" data-translate="navAdmin">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9.25 10m0-2a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2zM4 16a2 2 0 01-2-2V8a2 2 0 012-2h3l-2 4m0 0l2 4h-2l2 4h-2" />
                </svg>
                Gestione Utenti
            </a>
            <!-- Nuovo link per la gestione segnalazioni, nascosto di default -->
            <a href="Segnalazioni.html" id="admin-link-segnalazioni" class="nav-link text-lg font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-100 p-2 rounded-lg transition duration-200 hidden flex items-center gap-2" data-translate="navSegnalazioni">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Segnalazioni
            </a>
        </nav>
            `;

            // Inserisce il codice HTML nel contenitore
            navContainer.innerHTML = navHTML;
        }
    }

    // Chiama la funzione per caricare la navigazione
    loadNavigation();
});
