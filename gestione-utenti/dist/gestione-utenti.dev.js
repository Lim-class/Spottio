"use strict";

// gestione-utenti.js
document.addEventListener('DOMContentLoaded', function () {
  var usersList = document.getElementById('users-list');
  var reportedPostsList = document.getElementById('reported-posts-list');
  var confirmationModal = document.getElementById('confirmation-modal');
  var confirmDeleteButton = document.getElementById('confirm-delete');
  var cancelDeleteButton = document.getElementById('cancel-delete');
  var userToDeleteSpan = document.getElementById('user-to-delete'); // Nuove variabili per la gestione delle segnalazioni

  var reportModal = document.getElementById('report-modal');
  var confirmReportDeleteButton = document.getElementById('confirm-report-delete');
  var cancelReportDeleteButton = document.getElementById('cancel-report-delete');
  var userToDelete = null;
  var reportedPostToDeleteIndex = null; // Funzione per mostrare un modale di allerta personalizzato

  function showCustomAlert(message) {
    var alertModal = document.getElementById('custom-alert-modal');
    var alertMessage = document.getElementById('custom-alert-message');
    alertMessage.textContent = message;
    alertModal.classList.remove('hidden');
    var closeButton = document.getElementById('custom-alert-close');

    closeButton.onclick = function () {
      alertModal.classList.add('hidden');
    };
  } // Funzione per caricare gli utenti dal localStorage


  function loadUsers() {
    var users = JSON.parse(localStorage.getItem('users')) || [];
    usersList.innerHTML = '';

    if (users.length === 0) {
      usersList.innerHTML = '<p class="text-gray-500 text-center">Nessun utente registrato.</p>';
      return;
    }

    users.forEach(function (user) {
      var userRow = document.createElement('div');
      userRow.className = 'user-row';
      userRow.innerHTML = "\n                <span class=\"text-lg font-medium text-gray-700\">".concat(user.username, "</span>\n                <button onclick=\"showDeleteUserModal('").concat(user.username, "')\" class=\"text-red-500 hover:text-red-700 transition-colors duration-200\">\n                    Elimina Utente\n                </button>\n            ");
      usersList.appendChild(userRow);
    });
  } // Funzione per eliminare un utente


  function deleteUser(username) {
    var users = JSON.parse(localStorage.getItem('users')) || [];
    users = users.filter(function (user) {
      return user.username !== username;
    });
    localStorage.setItem('users', JSON.stringify(users));
    loadUsers();
  } // Funzione per mostrare il modale di conferma eliminazione utente


  window.showDeleteUserModal = function (username) {
    userToDelete = username;
    userToDeleteSpan.textContent = username;
    confirmationModal.classList.remove('hidden');
  }; // Funzione per caricare i post segnalati


  function loadReportedPosts() {
    var reportedPosts = JSON.parse(localStorage.getItem('reportedPosts')) || [];
    reportedPostsList.innerHTML = '';

    if (reportedPosts.length === 0) {
      reportedPostsList.innerHTML = '<p class="text-gray-500 text-center">Nessun post segnalato.</p>';
      return;
    }

    reportedPosts.forEach(function (report, index) {
      var reportRow = document.createElement('div');
      reportRow.className = 'report-row bg-gray-50 p-4 rounded-lg shadow-sm';
      reportRow.innerHTML = "\n                <div>\n                    <p class=\"text-sm text-gray-600 mb-2\">Segnalato da: <span class=\"font-bold\">".concat(report.reportedBy, "</span></p>\n                    <div class=\"bg-white p-3 rounded-lg border border-gray-200\">\n                        <p class=\"text-sm text-gray-800 font-medium\">Contenuto del post:</p>\n                        <p class=\"text-xs text-gray-700 italic\">").concat(report.postContent.text, "</p>\n                    </div>\n                </div>\n                <div class=\"flex space-x-2 mt-4 sm:mt-0\">\n                    <button onclick=\"showDeleteReportedPostModal(").concat(index, ")\" class=\"px-3 py-1 bg-red-500 text-white text-xs rounded-full hover:bg-red-600 transition-colors duration-200\">\n                        Elimina Post\n                    </button>\n                    <button onclick=\"ignoreReport(").concat(index, ")\" class=\"px-3 py-1 bg-gray-500 text-white text-xs rounded-full hover:bg-gray-600 transition-colors duration-200\">\n                        Ignora\n                    </button>\n                </div>\n            ");
      reportedPostsList.appendChild(reportRow);
    });
  } // Funzione per mostrare il modale di conferma per eliminare un post segnalato


  window.showDeleteReportedPostModal = function (index) {
    reportedPostToDeleteIndex = index;
    reportModal.classList.remove('hidden');
  }; // Funzione per eliminare un post segnalato e il post originale


  window.deleteReportedPost = function () {
    if (reportedPostToDeleteIndex !== null) {
      var reportedPosts = JSON.parse(localStorage.getItem('reportedPosts')) || [];
      var reportedPost = reportedPosts[reportedPostToDeleteIndex]; // Elimina il post originale da publicPosts

      var publicPosts = JSON.parse(localStorage.getItem('publicPosts')) || [];
      publicPosts = publicPosts.filter(function (post, index) {
        return index !== reportedPost.postId;
      });
      localStorage.setItem('publicPosts', JSON.stringify(publicPosts)); // Elimina il post dall'elenco delle segnalazioni

      reportedPosts.splice(reportedPostToDeleteIndex, 1);
      localStorage.setItem('reportedPosts', JSON.stringify(reportedPosts));
      loadReportedPosts();
      reportModal.classList.add('hidden');
      showCustomAlert("Post segnalato e post originale eliminati con successo.");
    }
  }; // Funzione per ignorare una segnalazione (rimuove solo la segnalazione)


  window.ignoreReport = function (index) {
    var reportedPosts = JSON.parse(localStorage.getItem('reportedPosts')) || [];
    reportedPosts.splice(index, 1);
    localStorage.setItem('reportedPosts', JSON.stringify(reportedPosts));
    loadReportedPosts();
    showCustomAlert("Segnalazione ignorata.");
  }; // Event listeners per i modali


  confirmDeleteButton.onclick = function () {
    deleteUser(userToDelete);
    confirmationModal.classList.add('hidden');
  };

  cancelDeleteButton.onclick = function () {
    confirmationModal.classList.add('hidden');
  };

  confirmReportDeleteButton.onclick = function () {
    deleteReportedPost();
  };

  cancelReportDeleteButton.onclick = function () {
    reportModal.classList.add('hidden');
  }; // Carica gli utenti e le segnalazioni all'avvio


  loadUsers();
  loadReportedPosts();
});