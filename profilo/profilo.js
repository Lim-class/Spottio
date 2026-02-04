document.addEventListener('DOMContentLoaded', () => {
    const profileForm = document.getElementById('profile-form');
    const profileImageInput = document.getElementById('profile-image');
    const imageCaptionTextarea = document.getElementById('image-caption');
    const profilePreview = document.getElementById('profile-preview');
    const statusMessage = document.getElementById('status-message');

    // Funzione per salvare i dati del profilo in localStorage
    function saveProfile(profile) {
        localStorage.setItem('userProfile', JSON.stringify(profile));
    }

    // Funzione per caricare e visualizzare i dati del profilo
    function loadProfile() {
        const profile = JSON.parse(localStorage.getItem('userProfile'));
        if (profile) {
            let contentHtml = '<h3 class="text-2xl font-bold text-gray-800 mb-4">Profilo attuale</h3>';
            if (profile.image) {
                contentHtml += `<img src="${profile.image}" alt="Immagine del profilo" class="mx-auto rounded-full w-48 h-48 object-cover mb-4 shadow-md">`;
            } else {
                 // Immagine segnaposto
                contentHtml += `<img src="https://placehold.co/192x192/EBF4FF/4A90E2?text=P" alt="Placeholder per l'immagine del profilo" class="mx-auto rounded-full w-48 h-48 object-cover mb-4 shadow-md">`;
            }
            if (profile.caption) {
                contentHtml += `
                    <div class="mt-4 p-4 bg-gray-100 rounded-lg">
                        <p class="text-center italic text-gray-600">"${profile.caption}"</p>
                    </div>
                `;
            }
            profilePreview.innerHTML = contentHtml;
            profilePreview.style.display = 'block';

            // Pre-popola i campi del form per la modifica
            imageCaptionTextarea.value = profile.caption || '';
        } else {
            profilePreview.style.display = 'none';
        }
    }

    // Gestisce l'invio del form
    if (profileForm) {
        profileForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const file = profileImageInput.files[0];
            const caption = imageCaptionTextarea.value.trim();
            let profile = JSON.parse(localStorage.getItem('userProfile')) || {};

            // Aggiorna la biografia
            profile.caption = caption;

            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    profile.image = e.target.result;
                    saveProfile(profile);
                    loadProfile();
                    // Messaggio di successo
                    statusMessage.textContent = 'Profilo aggiornato con successo!';
                    statusMessage.className = 'mt-4 text-green-600 font-medium';
                    statusMessage.style.display = 'block';
                    setTimeout(() => statusMessage.style.display = 'none', 3000);
                };
                reader.readAsDataURL(file);
            } else {
                // Se non c'è un'immagine, salva solo la biografia
                saveProfile(profile);
                loadProfile();
                // Messaggio di successo
                statusMessage.textContent = 'Profilo aggiornato con successo!';
                statusMessage.className = 'mt-4 text-green-600 font-medium';
                statusMessage.style.display = 'block';
                setTimeout(() => statusMessage.style.display = 'none', 3000);
            }
        });
    }

    // Carica il profilo all'avvio della pagina
    loadProfile();
});