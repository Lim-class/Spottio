// load-nav-scripts.js

// Usiamo document.write per iniettare gli script in modo sincrono.
// NOTA: Il tag di chiusura dello script ha lo slash "escapato" (<\/script>) per evitare errori di lettura.

document.write('<script src="../ingressoAdmin/ingressoAdmin.js"><\/script>');
document.write('<script src="../impostazioni/background-color.js"><\/script>');
document.write('<script src="../nav/language-dropdown.js"><\/script>');
document.write('<script src="../nav/nav.js"><\/script>');
document.write('<script src="../language-menu.js"><\/script>');


// App write o Backblaze B2