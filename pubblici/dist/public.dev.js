"use strict";

// public.js
// Lista di parole offensive in varie lingue
var badWords = ['cazzo', 'merda', 'vaffanculo', 'puttana', 'stronzo', 'deficiente', 'idiota', 'fuck', 'shit', 'asshole', 'bitch', 'damn', 'bastard', 'cunt', 'putain', 'merde', 'connard', 'salope', 'bâtard', 'joder', 'puta', 'cabrón', 'gilipollas', 'scheiße', 'arschloch', 'hure', 'verdammt']; // Funzione per controllare se un testo contiene parolacce

function containsBadWords(text) {
  if (!text) return false;
  var lowerCaseText = text.toLowerCase();
  return badWords.some(function (word) {
    return lowerCaseText.includes(word);
  });
} // Funzione per salvare le segnalazioni nel localStorage


function saveReport(report) {
  var reports = JSON.parse(localStorage.getItem('reports')) || [];
  reports.unshift(report);
  localStorage.setItem('reports', JSON.stringify(reports));
} // Funzione per mostrare un messaggio personalizzato (ho spostato questa funzione in un file utility)


function displayMessage(message, type) {
  var statusMessage = document.getElementById('status-message');

  if (statusMessage) {
    statusMessage.textContent = message;

    if (type === 'success') {
      statusMessage.className = 'mt-4 text-green-600 font-medium';
    } else if (type === 'error') {
      statusMessage.className = 'mt-4 text-red-600 font-medium';
    } else {
      statusMessage.className = 'mt-4 text-gray-600 font-medium';
    }

    statusMessage.style.display = 'block';
  }
} // **AGGIORNAMENTO IMPORTANTE:** Funzione per eliminare un post
// Ora controlla se l'utente attuale è il proprietario del post o un admin


function deletePost(index) {
  var posts = JSON.parse(localStorage.getItem('publicPosts')) || [];
  var currentUser = localStorage.getItem('currentUser'); // Recupera l'utente attuale

  var postToDelete = posts[index]; // Post che si vuole eliminare
  // Se l'utente non è loggato, non può eliminare nulla

  if (!currentUser) {
    displayMessage('Devi essere loggato per eliminare un post.', 'error');
    return;
  } // Controlla se l'utente attuale è il proprietario del post o l'admin


  if (currentUser === postToDelete.username || currentUser === 'admin') {
    // L'utente è autorizzato, procede con l'eliminazione
    posts.splice(index, 1);
    localStorage.setItem('publicPosts', JSON.stringify(posts));
    loadPosts(); // Ricarica i post dopo l'eliminazione

    displayMessage('Post eliminato con successo.', 'success');
  } else {
    // L'utente non è autorizzato
    displayMessage('Non sei autorizzato a eliminare questo post.', 'error');
  }
} // Funzione per eliminare un commento specifico da un post


function deleteComment(postIndex, commentIndex) {
  var posts = JSON.parse(localStorage.getItem('publicPosts')) || [];
  var currentUser = localStorage.getItem('currentUser');
  var comment = posts[postIndex].comments[commentIndex]; // Controlla se l'utente attuale è l'autore del commento o l'amministratore

  if (currentUser === comment.username || currentUser === 'admin') {
    posts[postIndex].comments.splice(commentIndex, 1);
    localStorage.setItem('publicPosts', JSON.stringify(posts));
    loadPosts();
  } else {
    displayMessage('Non sei autorizzato a eliminare questo commento.', 'error');
  }
} // Funzione per eliminare tutti i post. Deve essere globale per essere chiamata da pubblici.html.


function deleteAllPosts() {
  var modal = document.getElementById('confirmation-modal');
  modal.classList.remove('hidden');

  document.getElementById('confirm-delete').onclick = function () {
    localStorage.removeItem('publicPosts');
    loadPosts();
    modal.classList.add('hidden');
  };

  document.getElementById('cancel-delete').onclick = function () {
    modal.classList.add('hidden');
  };
} // Funzione per salvare i post in localStorage


function savePost(post) {
  var posts = JSON.parse(localStorage.getItem('publicPosts')) || [];
  posts.unshift(post);
  localStorage.setItem('publicPosts', JSON.stringify(posts));
} // Funzione per aggiungere un commento a un post specifico


function addComment(index) {
  var commentInput = document.getElementById("comment-input-".concat(index));
  var commentText = commentInput.value.trim();
  var currentUser = localStorage.getItem('currentUser');

  if (!commentText) {
    return;
  }

  if (containsBadWords(commentText)) {
    var report = {
      reporter: 'Sistema Automatico',
      reportedUser: currentUser,
      postText: commentText,
      reason: 'Contenuto inappropriato',
      description: 'Commento segnalato automaticamente per linguaggio offensivo',
      timestamp: new Date().toISOString()
    };
    saveReport(report);
    displayMessage('Il commento contiene contenuti inappropriati ed è stato segnalato.', 'error');
    return;
  }

  var posts = JSON.parse(localStorage.getItem('publicPosts')) || [];

  if (!posts[index].comments) {
    posts[index].comments = [];
  }

  var newComment = {
    username: currentUser || 'Ospite',
    text: commentText,
    timestamp: new Date().toISOString()
  };
  posts[index].comments.push(newComment);
  localStorage.setItem('publicPosts', JSON.stringify(posts));
  commentInput.value = '';
  loadPosts();
} // Funzione per gestire i "Mi piace"


function toggleLike(index) {
  var posts = JSON.parse(localStorage.getItem('publicPosts')) || [];
  var currentUser = localStorage.getItem('currentUser');

  if (!currentUser) {
    displayMessage('Devi essere loggato per mettere "Mi piace".', 'error');
    return;
  }

  var post = posts[index];

  if (!post.likes) {
    post.likes = [];
  }

  var likeIndex = post.likes.indexOf(currentUser);

  if (likeIndex > -1) {
    // L'utente ha già messo mi piace, lo rimuove
    post.likes.splice(likeIndex, 1);
  } else {
    // L'utente non ha ancora messo mi piace, lo aggiunge
    post.likes.push(currentUser);
  }

  localStorage.setItem('publicPosts', JSON.stringify(posts));
  loadPosts();
} // Funzione per caricare e visualizzare i post


function loadPosts() {
  var postsContainer = document.getElementById('posts-container');
  if (!postsContainer) return;
  var posts = JSON.parse(localStorage.getItem('publicPosts')) || [];
  var currentUser = localStorage.getItem('currentUser');
  postsContainer.innerHTML = '';
  posts.forEach(function (post, index) {
    var postElement = document.createElement('div');
    postElement.className = 'bg-white p-6 rounded-2xl shadow-md post';
    var fileContent = '';

    if (post.image) {
      fileContent = "<img src=\"".concat(post.image, "\" alt=\"Immagine allegata\" class=\"w-full h-auto rounded-lg mb-4\">");
    } else if (post.file) {
      // Per i file, mostra un'icona e un link
      fileContent = "\n                <div class=\"flex items-center space-x-2 mb-4\">\n                    <svg class=\"w-6 h-6 text-gray-500\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\">\n                        <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M9 12h6m-3-3v6m-4-2H7a2 2 0 00-2 2v4a2 2 0 002 2h10a2 2 0 002-2v-4a2 2 0 00-2-2h-2\"></path>\n                    </svg>\n                    <a href=\"".concat(post.file, "\" download=\"").concat(post.fileName, "\" class=\"text-blue-600 hover:underline font-medium\">").concat(post.fileName, "</a>\n                </div>\n            ");
    }

    var likesCount = post.likes ? post.likes.length : 0;
    var likedByCurrentUser = post.likes && post.likes.includes(currentUser);
    var likeButtonClass = likedByCurrentUser ? 'text-red-500' : 'text-gray-500';
    var deleteButton = ''; // Mostra il pulsante di eliminazione solo se l'utente è l'autore del post o un admin

    if (currentUser && (currentUser === post.username || currentUser === 'admin')) {
      deleteButton = "<button onclick=\"deletePost(".concat(index, ")\" class=\"text-red-500 hover:text-red-700 ml-4\">Elimina</button>");
    } // Genera HTML per i commenti


    var commentsHtml = '';

    if (post.comments && post.comments.length > 0) {
      commentsHtml = "<div class=\"mt-4 border-t pt-4 space-y-3\">\n                ".concat(post.comments.map(function (comment, commentIndex) {
        var deleteCommentButton = ''; // Mostra il pulsante di eliminazione per i commenti se l'utente è l'autore o un admin

        if (currentUser && (currentUser === comment.username || currentUser === 'admin')) {
          deleteCommentButton = "<button onclick=\"deleteComment(".concat(index, ", ").concat(commentIndex, ")\" class=\"text-xs text-red-500 hover:text-red-700 ml-2\">Elimina</button>");
        }

        return "\n                        <div class=\"text-sm\">\n                            <span class=\"font-semibold\">".concat(comment.username, ":</span>\n                            <span>").concat(comment.text, "</span>\n                            ").concat(deleteCommentButton, "\n                        </div>\n                    ");
      }).join(''), "\n            </div>");
    } // Aggiungi la logica per mostrare il pulsante di segnalazione se l'utente non è il proprietario


    var reportButton = '';

    if (currentUser && currentUser !== post.username && currentUser !== 'admin') {
      reportButton = "<button onclick=\"reportPost(".concat(index, ")\" class=\"text-gray-500 hover:text-red-600 transition-colors duration-200\"><i class=\"fas fa-flag\"></i> Segnala</button>");
    } // Aggiungi la logica per mostrare l'username, il timestamp e l'immagine del profilo


    var userProfileHtml = "\n            <div class=\"flex items-center mb-4\">\n                <img src=\"https://placehold.co/40x40/cccccc/000000?text=".concat(post.username[0].toUpperCase(), "\" alt=\"Avatar\" class=\"w-10 h-10 rounded-full mr-3\">\n                <div>\n                    <span class=\"font-semibold text-gray-800\">").concat(post.username, "</span>\n                    <p class=\"text-sm text-gray-500\">").concat(new Date(post.timestamp).toLocaleString(), "</p>\n                </div>\n            </div>\n        ");
    postElement.innerHTML = "\n            ".concat(userProfileHtml, "\n            <p class=\"text-gray-700 mb-4\">").concat(post.text, "</p>\n            ").concat(fileContent, "\n            <div class=\"flex items-center justify-between mt-4 border-t pt-4\">\n                <div class=\"flex items-center space-x-4\">\n                    <button onclick=\"toggleLike(").concat(index, ")\" class=\"flex items-center space-x-2 ").concat(likeButtonClass, " transition-colors duration-200\">\n                        <svg class=\"w-6 h-6\" fill=\"currentColor\" viewBox=\"0 0 24 24\">\n                            <path d=\"M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z\"/>\n                        </svg>\n                        <span class=\"font-medium\">").concat(likesCount, "</span>\n                    </button>\n                    ").concat(reportButton, "\n                    ").concat(deleteButton, "\n                </div>\n            </div>\n            <!-- Sezione commenti -->\n            <div class=\"mt-4\">\n                <div class=\"flex items-center mt-2\">\n                    <input type=\"text\" id=\"comment-input-").concat(index, "\" placeholder=\"Aggiungi un commento...\" class=\"flex-grow p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500\">\n                    <button onclick=\"addComment(").concat(index, ")\" class=\"ml-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 transition duration-300\">Invia</button>\n                </div>\n                ").concat(commentsHtml, "\n            </div>\n        ");
    postsContainer.appendChild(postElement);
  });
} // Event listener per il caricamento iniziale della pagina


document.addEventListener('DOMContentLoaded', function () {
  // Gestisce il form di pubblicazione
  var publicPostForm = document.getElementById('public-post-form');

  if (publicPostForm) {
    publicPostForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var postText = document.getElementById('post-text').value.trim();
      var fileInput = document.getElementById('file-upload');
      var file = fileInput.files[0];
      var currentUser = localStorage.getItem('currentUser');
      var statusMessage = document.getElementById('status-message');
      var fileNameDisplay = document.getElementById('file-name');

      if (!currentUser) {
        displayMessage('Devi essere loggato per pubblicare un post.', 'error');
        return;
      }

      if (!postText && !file) {
        displayMessage('Il post non può essere vuoto.', 'error');
        return;
      }

      if (containsBadWords(postText)) {
        var report = {
          reporter: 'Sistema Automatico',
          reportedUser: currentUser,
          postText: postText,
          reason: 'Contenuto inappropriato',
          description: 'Post segnalato automaticamente per linguaggio offensivo',
          timestamp: new Date().toISOString()
        };
        saveReport(report);
        displayMessage('Il tuo post contiene contenuti inappropriati ed è stato segnalato.', 'error');
        publicPostForm.reset();
        fileNameDisplay.textContent = '';
        return;
      }

      var post = {
        username: currentUser,
        text: postText,
        timestamp: new Date().toISOString()
      };

      if (file) {
        var reader = new FileReader();

        reader.onload = function (e) {
          post.file = e.target.result;
          post.fileName = file.name;

          if (file.type.startsWith('image/')) {
            post.image = e.target.result;
            delete post.file;
            delete post.fileName;
          }

          savePost(post);
          publicPostForm.reset();
          fileNameDisplay.textContent = '';
          statusMessage.textContent = 'Post pubblicato con successo!';
          statusMessage.className = 'mt-4 text-green-600 font-medium';
          statusMessage.style.display = 'block';
        };

        reader.readAsDataURL(file);
      } else {
        savePost(post);
        publicPostForm.reset();
        statusMessage.textContent = 'Post pubblicato con successo!';
        statusMessage.className = 'mt-4 text-green-600 font-medium';
        statusMessage.style.display = 'block';
      }
    });
  }

  loadPosts();
});