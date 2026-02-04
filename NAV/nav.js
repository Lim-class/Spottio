// nav.js

document.addEventListener('DOMContentLoaded', () => {
    // Funzione principale per caricare la navigazione
    function loadNavigation() {
        const navContainer = document.getElementById('nav-container');
        const menuTitle = document.getElementById('menu-title');
        
        // Identifica la sidebar (il genitore del titolo del menu o del container di navigazione)
        const sidebar = menuTitle ? menuTitle.parentElement : null;

        // Inserimento Stile CSS Dinamico per gestire la chiusura
        const style = document.createElement('style');
        style.innerHTML = `
            /* Stile base quando la sidebar è chiusa */
            .sidebar-collapsed {
                width: 80px !important; /* Larghezza fissa ridotta */
                padding-left: 0.5rem !important;
                padding-right: 0.5rem !important;
            }
            
            /* Nascondi i testi dei link, della lingua e del logout */
            .sidebar-collapsed .nav-text,
            .sidebar-collapsed #selected-lang-text,
            .sidebar-collapsed #dropdown-icon,
            .sidebar-collapsed #logout-text {
                display: none !important;
            }

            /* Gestione Logout: mostra icona quando chiuso */
            .sidebar-collapsed #logout-link {
                justify-content: center;
            }
            .sidebar-collapsed #logout-icon {
                display: block !important;
            }

            /* Centra il contenuto del bottone lingua */
            .sidebar-collapsed #language-toggle {
                justify-content: center;
                padding-left: 0;
                padding-right: 0;
            }
            .sidebar-collapsed #selected-flag {
                margin-right: 0 !important;
            }

            /* Centra i link di navigazione */
            .sidebar-collapsed .nav-link {
                justify-content: center;
                padding-left: 0;
                padding-right: 0;
            }
            
            /* Centro il titolo/hamburger */
            .sidebar-collapsed #menu-title {
                display: flex;
                justify-content: center;
                padding: 0;
                margin-bottom: 1.5rem !important;
            }

            /* Stile del bottone Hamburger */
            #toggle-sidebar:hover {
                background-color: #f3f4f6;
            }
        `;
        document.head.appendChild(style);

        // 1. GESTIONE HAMBURGER E SIDEBAR
        if (menuTitle && sidebar) {
            // Sostituisce il testo "Menu" con l'icona Hamburger
            menuTitle.innerHTML = `
                <button id="toggle-sidebar" class="p-2 rounded-lg transition-colors focus:outline-none flex items-center justify-center w-full" title="Menu">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            `;
            // Rimuove margine inferiore eccessivo per centrare meglio quando chiuso
            menuTitle.classList.remove('mb-6');
            menuTitle.classList.add('mb-4');

            const toggleBtn = document.getElementById('toggle-sidebar');
            
            // Funzione per applicare lo stato
            const setSidebarState = (isCollapsed) => {
                if (isCollapsed) {
                    sidebar.classList.add('sidebar-collapsed');
                } else {
                    sidebar.classList.remove('sidebar-collapsed');
                }
                localStorage.setItem('sidebarState', isCollapsed ? 'collapsed' : 'expanded');
            };

            // Listener sul click
            toggleBtn.addEventListener('click', () => {
                const isCurrentlyCollapsed = sidebar.classList.contains('sidebar-collapsed');
                setSidebarState(!isCurrentlyCollapsed);
            });

            // Ripristina lo stato al caricamento
            if (localStorage.getItem('sidebarState') === 'collapsed') {
                setSidebarState(true);
            }
        }

        // 2. GESTIONE LINK DI NAVIGAZIONE
        if (navContainer) {
            const navHTML = `
            <nav class="flex flex-col space-y-4 w-full">
                <a href="pubblici.html" class="nav-link text-lg font-medium text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition duration-200 flex items-center gap-2" data-translate="navPubblici">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span class="nav-text hidden md:inline">Pubblici</span>
                </a>
                <a href="cerca-persone.html" class="nav-link text-lg font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-100 p-2 rounded-lg transition duration-200 flex items-center gap-2" data-translate="navCercaPersone">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span class="nav-text hidden md:inline">Cerca Persone</span>
                </a>
                <a href="messaggi.html" class="nav-link text-lg font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-100 p-2 rounded-lg transition duration-200 flex items-center gap-2" data-translate="navMessaggi">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <span class="nav-text hidden md:inline">Messaggi</span>
                </a>
                <a href="posta.html" class="nav-link text-lg font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-100 p-2 rounded-lg transition duration-200 flex items-center gap-2" data-translate="navPosta">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span class="nav-text hidden md:inline">Posta</span>
                </a>
                <a href="profilo.html" class="nav-link text-lg font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-100 p-2 rounded-lg transition duration-200 flex items-center gap-2" data-translate="navProfilo">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span class="nav-text hidden md:inline">Profilo</span>
                </a>
                <a href="impostazioni.html" class="nav-link text-lg font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-100 p-2 rounded-lg transition duration-200 flex items-center gap-2" data-translate="navImpostazioni">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.525.293.93.55 1.065 1.066z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span class="nav-text hidden md:inline">Impostazioni</span>
                </a>
                <a href="gestione-utenti.html" id="admin-link" class="nav-link text-lg font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-100 p-2 rounded-lg transition duration-200 hidden flex items-center gap-2" data-translate="navAdmin">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9.25 10m0-2a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2zM4 16a2 2 0 01-2-2V8a2 2 0 012-2h3l-2 4m0 0l2 4h-2l2 4h-2" />
                    </svg>
                    <span class="nav-text hidden md:inline">Gestione Utenti</span>
                </a>
                <a href="Segnalazioni.html" id="admin-link-segnalazioni" class="nav-link text-lg font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-100 p-2 rounded-lg transition duration-200 hidden flex items-center gap-2" data-translate="navSegnalazioni">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span class="nav-text hidden md:inline">Segnalazioni</span>
                </a>
            </nav>
            `;
            navContainer.innerHTML = navHTML;
        }

        // 3. FIX LOGOUT: Aggiungiamo un'icona nascosta di default al link di logout
        const logoutLink = document.getElementById('logout-link');
        if (logoutLink) {
            // Mettiamo il testo attuale in uno span e aggiungiamo un'icona SVG nascosta
            const currentText = logoutLink.innerHTML;
            logoutLink.innerHTML = `
                <span id="logout-text">${currentText}</span>
                <svg id="logout-icon" style="display:none;" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
            `;
            logoutLink.classList.add('flex', 'items-center');
        }
    }

    loadNavigation();
});