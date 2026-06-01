"use strict";

document.addEventListener('DOMContentLoaded', function () {
  var profileForm = document.getElementById('profile-form');
  var profileImageInput = document.getElementById('profile-image');
  var imageCaptionTextarea = document.getElementById('image-caption');
  var profilePreview = document.getElementById('profile-preview');
  var statusMessage = document.getElementById('status-message'); // Funzione per salvare i dati del profilo in localStorage

  function saveProfile(profile) {
    localStorage.setItem('userProfile', JSON.stringify(profile));
  } // Funzione per caricare e visualizzare i dati del profilo


  function loadProfile() {
    var profile = JSON.parse(localStorage.getItem('userProfile'));

    if (profile) {
      var contentHtml = '<h3 class="text-2xl font-bold text-gray-800 mb-4">Profilo attuale</h3>';

      if (profile.image) {
        contentHtml += "<img src=\"".concat(profile.image, "\" alt=\"Immagine del profilo\" class=\"mx-auto rounded-full w-48 h-48 object-cover mb-4 shadow-md\">");
      } else {
        // Immagine segnaposto
        contentHtml += "<img src=\"https://placehold.co/192x192/EBF4FF/4A90E2?text=P\" alt=\"Placeholder per l'immagine del profilo\" class=\"mx-auto rounded-full w-48 h-48 object-cover mb-4 shadow-md\">";
      }

      if (profile.caption) {
        contentHtml += "\n                    <div class=\"mt-4 p-4 bg-gray-100 rounded-lg\">\n                        <p class=\"text-center italic text-gray-600\">\"".concat(profile.caption, "\"</p>\n                    </div>\n                ");
      }

      profilePreview.innerHTML = contentHtml;
      profilePreview.style.display = 'block'; // Pre-popola i campi del form per la modifica

      imageCaptionTextarea.value = profile.caption || '';
    } else {
      profilePreview.style.display = 'none';
    }
  } // Gestisce l'invio del form


  if (profileForm) {
    profileForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var file = profileImageInput.files[0];
      var caption = imageCaptionTextarea.value.trim();
      var profile = JSON.parse(localStorage.getItem('userProfile')) || {}; // Aggiorna la biografia

      profile.caption = caption;

      if (file) {
        var reader = new FileReader();

        reader.onload = function (e) {
          profile.image = e.target.result;
          saveProfile(profile);
          loadProfile(); // Messaggio di successo

          statusMessage.textContent = 'Profilo aggiornato con successo!';
          statusMessage.className = 'mt-4 text-green-600 font-medium';
          statusMessage.style.display = 'block';
          setTimeout(function () {
            return statusMessage.style.display = 'none';
          }, 3000);
        };

        reader.readAsDataURL(file);
      } else {
        // Se non c'è un'immagine, salva solo la biografia
        saveProfile(profile);
        loadProfile(); // Messaggio di successo

        statusMessage.textContent = 'Profilo aggiornato con successo!';
        statusMessage.className = 'mt-4 text-green-600 font-medium';
        statusMessage.style.display = 'block';
        setTimeout(function () {
          return statusMessage.style.display = 'none';
        }, 3000);
      }
    });
  } // Carica il profilo all'avvio della pagina


  loadProfile();
});