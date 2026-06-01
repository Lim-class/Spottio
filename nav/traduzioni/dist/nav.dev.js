"use strict";

// nav.js
// Questo script gestisce la creazione e il caricamento della barra di navigazione.
document.addEventListener('DOMContentLoaded', function () {
  // Funzione per caricare la navigazione dinamicamente
  function loadNavigation() {
    // Seleziona il contenitore della navigazione
    var navContainer = document.getElementById('nav-container');

    if (navContainer) {
      // Codice HTML per la navigazione
      var navHTML = "\n                <nav class=\"flex flex-col space-y-4 w-full\">\n            <a href=\"pubblici.html\" class=\"nav-link text-lg font-medium text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition duration-200\" data-translate=\"navPubblici\">Pubblici</a>\n            <a href=\"cerca-persone.html\" class=\"nav-link text-lg font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-100 p-2 rounded-lg transition duration-200\" data-translate=\"navCercaPersone\">Cerca Persone</a>\n            <a href=\"messaggi.html\" class=\"nav-link text-lg font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-100 p-2 rounded-lg transition duration-200\" data-translate=\"navMessaggi\">Messaggi</a>\n            <a href=\"posta.html\" class=\"nav-link text-lg font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-100 p-2 rounded-lg transition duration-200\" data-translate=\"navPosta\">Posta</a>\n            <a href=\"profilo.html\" class=\"nav-link text-lg font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-100 p-2 rounded-lg transition duration-200\" data-translate=\"navProfilo\">Profilo</a>\n            <a href=\"impostazioni.html\" class=\"nav-link text-lg font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-100 p-2 rounded-lg transition duration-200\" data-translate=\"navImpostazioni\">Impostazioni</a>\n            <!-- Nuovo link per la gestione utenti, nascosto di default -->\n            <a href=\"gestione-utenti.html\" id=\"admin-link\" class=\"nav-link text-lg font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-100 p-2 rounded-lg transition duration-200 hidden\" data-translate=\"navAdmin\">Gestione Utenti</a>\n        </nav>\n            "; // Inserisce il codice HTML nel contenitore

      navContainer.innerHTML = navHTML;
    }
  } // Chiama la funzione per caricare la navigazione


  loadNavigation();
});