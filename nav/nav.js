// nav.js

document.addEventListener('DOMContentLoaded', () => {
    // Funzione principale per caricare la navigazione
    function loadNavigation() {
        const navContainer = document.getElementById('nav-container');
        const menuTitle = document.getElementById('menu-title');
        
        // Identifica la sidebar (il genitore del titolo del menu o del container di navigazione)
        const sidebar = menuTitle ? menuTitle.parentElement : null;

        // Inserimento Stile CSS Dinamico per gestire Mobile e Desktop
        const style = document.createElement('style');
        style.innerHTML = `
            /* ==========================================
               MOBILE: BOTTOM NAVIGATION BAR (sotto 768px)
               ========================================== */
            @media (max-width: 767px) {
                /* EVITA L'OVERFLOW: Aggiunge spazio in fondo al corpo della pagina 
                   pari all'altezza della barra (75px) + un margine di sicurezza */
                body {
                    padding-bottom: calc(75px + 20px + env(safe-area-inset-bottom)) !important;
                }

                /* Annulla l'ingombro della sidebar desktop */
                #sidebar-container {
                    position: static !important;
                    width: 0 !important;
                    height: 0 !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    background: transparent !important;
                    box-shadow: none !important;
                    border: none !important;
                }

                /* Barra fissa in basso */
                #nav-container {
                    position: fixed !important;
                    bottom: 0 !important;
                    left: 0 !important;
                    width: 100vw !important;
                    height: 75px !important;
                    background-color: white !important;
                    border-top: 1px solid #e5e7eb !important;
                    display: flex !important;
                    flex-direction: row !important;
                    justify-content: space-around !important;
                    align-items: center !important;
                    z-index: 999 !important;
                    padding-bottom: env(safe-area-inset-bottom) !important;
                }

                #nav-container nav {
                    display: flex !important;
                    flex-direction: row !important;
                    width: 100% !important;
                    justify-content: space-around !important;
                    align-items: center !important;
                }

                /* Effetto pillola e icone per mobile */
                .nav-link {
                    flex-direction: column !important;
                    gap: 4px !important;
                    padding: 8px 12px !important;
                    border-radius: 9999px !important;
                }

                .nav-text {
                    display: block !important;
                    font-size: 10px !important;
                    font-weight: 600;
                }

                /* Nasconde elementi superflui */
                #menu-title, #toggle-sidebar {
                    display: none !important;
                }
            }

            /* ==========================================
               DESKTOP: SIDEBAR (768px e oltre)
               ========================================== */
            @media (min-width: 768px) {
                /* Rimuove il padding del body su desktop */
                body {
                    padding-bottom: 0 !important;
                }

                .sidebar-collapsed {
                    width: 80px !important;
                }

                .sidebar-collapsed .nav-text,
                .sidebar-collapsed #selected-lang-text,
                .sidebar-collapsed #dropdown-icon,
                .sidebar-collapsed #logout-text {
                    display: none !important;
                }

                .nav-link.active {
                    background-color: #f3f4f6;
                    color: #2563eb;
                }
            }
        `;
        document.head.appendChild(style);

        // 1. GESTIONE HAMBURGER E SIDEBAR
        if (menuTitle && sidebar) {
            menuTitle.innerHTML = `
                <button id="toggle-sidebar" class="p-2 rounded-lg transition-colors focus:outline-none flex items-center justify-center w-full" title="Menu">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            `;
            menuTitle.classList.remove('mb-6');
            menuTitle.classList.add('mb-4');

            const toggleBtn = document.getElementById('toggle-sidebar');
            
            const setSidebarState = (isCollapsed) => {
                if (isCollapsed) {
                    sidebar.classList.add('sidebar-collapsed');
                } else {
                    sidebar.classList.remove('sidebar-collapsed');
                }
                localStorage.setItem('sidebarState', isCollapsed ? 'collapsed' : 'expanded');
            };

            toggleBtn.addEventListener('click', () => {
                const isCurrentlyCollapsed = sidebar.classList.contains('sidebar-collapsed');
                setSidebarState(!isCurrentlyCollapsed);
            });

            if (localStorage.getItem('sidebarState') === 'collapsed') {
                setSidebarState(true);
            }
        }

        // 2. GESTIONE LINK DI NAVIGAZIONE
        if (navContainer) {
            // Nota: Rimosso "hidden md:inline" dai vari <span class="nav-text">
            // Modificata l'icona della posta per farla sembrare un "+" centrale come nella tua foto
            const navHTML = `
            <nav class="flex flex-col space-y-4 w-full">
                <a href="pubblici.html" class="nav-link text-lg font-medium text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition duration-200 flex items-center gap-2" data-translate="navPubblici">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span class="nav-text">Pubblici</span>
                </a>
                <a href="cerca-persone.html" class="nav-link text-lg font-medium text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition duration-200 flex items-center gap-2" data-translate="navCercaPersone">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span class="nav-text">Cerca</span>
                </a>
                <a href="posta.html" class="nav-link text-lg font-medium text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition duration-200 flex items-center gap-2" data-translate="navPosta">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <span class="nav-text">Posta</span>
                </a>
                <a href="chat.html" class="nav-link text-lg font-medium text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition duration-200 flex items-center gap-2" data-translate="navMessaggi">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <span class="nav-text">Messaggi</span>
                </a>
                <a href="profilo.html" class="nav-link text-lg font-medium text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition duration-200 flex items-center gap-2" data-translate="navProfilo">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span class="nav-text">Profilo</span>
                </a>
            </nav>
            `;
            navContainer.innerHTML = navHTML;
        }

        // 3. EVIDENZIA PAGINA ATTIVA (Effetto pillola su mobile)
        const currentPage = window.location.pathname.split("/").pop();
        if (currentPage) {
            document.querySelectorAll('.nav-link').forEach(link => {
                const href = link.getAttribute('href');
                if (href === currentPage) {
                    link.classList.add('active');
                    link.classList.remove('text-gray-600');
                }
            });
        }
    }

    loadNavigation();
});