// nav.js

// 1. CARICAMENTO DINAMICO DEL FILE NAV.CSS
(function loadNavCSS() {
    // Evita di caricare il CSS più di una volta se già presente
    if (!document.querySelector('link[href*="nav.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = '../nav/nav.css'; // Percorso relativo al file nav.css
        document.head.appendChild(link);
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    // Funzione principale per caricare la navigazione
    function loadNavigation() {
        
        // 1. TROVA O CREA IL CONTENITORE DELLA SIDEBAR
        let sidebar = document.getElementById('sidebar-container');
        
        if (!sidebar) {
            sidebar = document.createElement('div');
            sidebar.id = 'sidebar-container';
            sidebar.className = "w-1/5 bg-white p-6 rounded-r-2xl shadow-xl flex flex-col justify-start items-start sticky top-0 h-screen overflow-y-auto custom-scrollbar transition-all duration-300";
            
            sidebar.innerHTML = `
                <h2 id="menu-title" class="text-2xl font-bold text-gray-800 mb-6 w-full"></h2>
                <div id="nav-container" class="w-full"></div>
            `;
            
            document.body.insertBefore(sidebar, document.body.firstChild);
        }

        const navContainer = document.getElementById('nav-container');
        const menuTitle = document.getElementById('menu-title');

        // 2. GESTIONE HAMBURGER E SIDEBAR
        if (menuTitle && sidebar) {
            menuTitle.innerHTML = `
                <button id="toggle-sidebar" class="p-2 rounded-lg transition-colors focus:outline-none flex items-center justify-center w-full" title="Menu">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            `;
            menuTitle.className = "text-2xl font-bold text-gray-800 mb-4 w-full";

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

        // 3. GESTIONE LINK DI NAVIGAZIONE
        if (navContainer) {
            const navHTML = `
            <nav class="flex flex-col space-y-4 w-full">
                <a href="../pubblici/pubblici.html" class="nav-link text-lg font-medium text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition duration-200 flex items-center gap-2" data-translate="navPubblici">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span class="nav-text">Pubblici</span>
                </a>
                <a href="../cerca-persone/cerca-persone.html" class="nav-link text-lg font-medium text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition duration-200 flex items-center gap-2" data-translate="navCercaPersone">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span class="nav-text">Cerca</span>
                </a>
                <a href="../posta/posta.html" class="nav-link text-lg font-medium text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition duration-200 flex items-center gap-2" data-translate="navPosta">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <span class="nav-text">Posta</span>
                </a>
                <a href="../chat/chat.html" class="nav-link text-lg font-medium text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition duration-200 flex items-center gap-2" data-translate="navMessaggi">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <span class="nav-text">Messaggi</span>
                </a>
                <a href="../profilo/profilo.html" class="nav-link text-lg font-medium text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition duration-200 flex items-center gap-2" data-translate="navProfilo">
                    <img id="nav-profile-img" 
                         src="https://i.ibb.co/b5HgvzCB/Spottio-Logo-2.png" 
                         class="w-7 h-7 rounded-full object-cover shrink-0 border border-gray-200 shadow-sm" 
                         alt="Profilo">
                    <span class="nav-text">Profilo</span>
                </a>
            </nav>
            `;
            navContainer.innerHTML = navHTML;

            // Caricamento dinamico dell'immagine profilo da Firebase Firestore
            loadNavProfileImage();
        }

        // 4. EVIDENZIA PAGINA ATTIVA
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
        
        // Notifica agli altri script che la navbar è pronta nel DOM
        document.dispatchEvent(new Event('navReady'));
    }

    loadNavigation();
});

// Funzione per caricare l'immagine del profilo nella navbar
async function loadNavProfileImage() {
    const navImg = document.getElementById('nav-profile-img');
    if (!navImg) return;

    const auth = window.auth || (typeof firebase !== 'undefined' ? firebase.auth() : null);
    const db = window.db || (typeof firebase !== 'undefined' ? firebase.firestore() : null);

    if (auth && db) {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const userDoc = await db.collection("users").doc(user.uid).get();
                    if (userDoc.exists) {
                        const data = userDoc.data();
                        const avatarUrl = data.userPfUri || data.profileImage;
                        if (avatarUrl) {
                            navImg.src = avatarUrl;
                        }
                    }
                } catch (error) {
                    console.error("Errore nel caricamento dell'immagine profilo nella navbar:", error);
                }
            }
        });
    }
}