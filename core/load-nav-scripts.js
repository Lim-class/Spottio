// load-nav-scripts.js - Iniezione Sidebar e Script di Navigazione

// Usiamo document.write per iniettare gli script in modo sincrono.
// NOTA: Il tag di chiusura dello script ha lo slash "escapato" (<\/script>) per evitare errori di lettura.

// Iniezione automatica della struttura di base della Sidebar se non presente nel DOM
document.write(`
<script>
    (function() {
        if (!document.getElementById('sidebar-container')) {
            var sidebar = document.createElement('div');
            sidebar.id = 'sidebar-container';
            sidebar.className = 'w-1/5 bg-white p-6 rounded-r-2xl shadow-xl flex flex-col justify-start items-start sticky top-0 h-screen overflow-y-auto custom-scrollbar transition-all duration-300';
            sidebar.innerHTML = '<h2 id="menu-title" class="text-2xl font-bold text-gray-800 mb-6 w-full"></h2><div id="nav-container" class="w-full"></div>';
            document.body.insertBefore(sidebar, document.body.firstChild);
        }
    })();
<\/script>
`);

document.write('<script src="../core/language-menu.js"><\/script>');
document.write('<script src="../ingressoAdmin/ingressoAdmin.js"><\/script>');
document.write('<script src="../impostazioni/background-color.js"><\/script>');
document.write('<script src="../nav/language-dropdown.js"><\/script>');
document.write('<script src="../nav/nav.js"><\/script>');

// App write o Backblaze B2