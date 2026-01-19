import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// --- CONFIGURAZIONE FIREBASE ---
const firebaseConfig = {
    apiKey: "LA_TUA_API_KEY",
    authDomain: "IL_TUO_PROGETTO.firebaseapp.com",
    projectId: "IL_TUO_PROGETTO",
    storageBucket: "IL_TUO_PROGETTO.appspot.com",
    messagingSenderId: "IL_TUO_SENDER_ID",
    appId: " IL_TUO_APP_ID"
};

// Inizializzazione
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

document.addEventListener('DOMContentLoaded', () => {
    const profileForm = document.getElementById('profile-form');
    const profileImageInput = document.getElementById('profile-image');
    const imageCaptionTextarea = document.getElementById('image-caption');
    const profilePreview = document.getElementById('profile-preview');
    const statusMessage = document.getElementById('status-message');

    // Mostra un messaggio di stato temporaneo
    function showStatus(text, isError = false) {
        statusMessage.textContent = text;
        statusMessage.className = `mt-4 text-center text-sm font-medium ${isError ? 'text-red-600' : 'text-green-600'}`;
        statusMessage.style.display = 'block';
        setTimeout(() => statusMessage.style.display = 'none', 4000);
    }

    // Carica e visualizza i dati del profilo da Firebase
    async function loadProfile(user) {
        try {
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const profile = docSnap.data();
                
                let contentHtml = '<h3 class="text-2xl font-bold text-gray-800 mb-4">Profilo attuale</h3>';
                const imgSrc = profile.image || "https://placehold.co/192x192/EBF4FF/4A90E2?text=P";
                
                contentHtml += `<img src="${imgSrc}" alt="Profilo" class="mx-auto rounded-full w-48 h-48 object-cover mb-4 shadow-md">`;
                
                if (profile.caption) {
                    contentHtml += `
                        <div class="mt-4 p-4 bg-gray-100 rounded-lg">
                            <p class="text-center italic text-gray-600">"${profile.caption}"</p>
                        </div>
                    `;
                }
                
                profilePreview.innerHTML = contentHtml;
                profilePreview.style.display = 'block';
                imageCaptionTextarea.value = profile.caption || '';
            }
        } catch (error) {
            console.error("Errore nel caricamento profilo:", error);
        }
    }

    // Gestore invio form
    if (profileForm) {
        profileForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const user = auth.currentUser;
            if (!user) {
                showStatus("Devi essere loggato per salvare!", true);
                return;
            }

            const file = profileImageInput.files[0];
            const caption = imageCaptionTextarea.value.trim();

            try {
                showStatus("Salvataggio in corso...", false);
                let imageUrl = null;

                // 1. Se l'utente ha selezionato un file, caricalo su Storage
                if (file) {
                    // Creiamo un riferimento unico: cartella 'profiles' / 'ID_UTENTE' / 'nome_file'
                    const storageRef = ref(storage, `profiles/${user.uid}/${file.name}`);
                    const uploadResult = await uploadBytes(storageRef, file);
                    imageUrl = await getDownloadURL(uploadResult.ref);
                }

                // 2. Prepariamo i dati per Firestore
                const userData = {
                    caption: caption,
                    lastUpdate: new Date()
                };
                
                // Aggiungiamo l'URL dell'immagine solo se è stata caricata
                if (imageUrl) {
                    userData.image = imageUrl;
                }

                // 3. Salviamo su Firestore nel documento dedicato all'utente
                await setDoc(doc(db, "users", user.uid), userData, { merge: true });

                showStatus("Profilo aggiornato con successo!");
                loadProfile(user); // Ricarica l'anteprima
                profileForm.reset(); // Pulisce il selettore file

            } catch (error) {
                console.error("Errore durante il salvataggio:", error);
                showStatus("Errore durante il caricamento. Riprova.", true);
            }
        });
    }

    // Controlla se l'utente è loggato all'avvio
    onAuthStateChanged(auth, (user) => {
        if (user) {
            loadProfile(user);
        } else {
            profilePreview.style.display = 'none';
            // Qui potresti reindirizzare l'utente alla pagina di login se necessario
            // window.location.href = 'index.html';
        }
    });
});
