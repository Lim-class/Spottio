"use strict";

// Controlla il nome utente al caricamento della pagina e mostra il link se è admin
window.onload = function () {
  var currentUser = localStorage.getItem('currentUser');

  if (currentUser === 'admin') {
    var adminLink = document.getElementById('admin-link');

    if (adminLink) {
      adminLink.classList.remove('hidden');
      document.getElementById('admin-link-segnalazioni').classList.remove('hidden');
    }
  }
};