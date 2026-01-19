import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// Configurazione Firebase (Sostituisci con i tuoi dati dalla console Firebase)
const firebaseConfig = {
    apiKey: "IL_TUO_API_KEY",
    authDomain: "IL_TUO_PROGETTO.firebaseapp.com",
    projectId: "IL_TUO_PROGETTO",
    storageBucket: "IL_TUO_PROGETTO.appspot.com",
    messagingSenderId: "ID_SENDER",
    appId: "ID_APP"
};

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

    // Funzione per visualizzare i dati nel DOM
    function renderProfileUI(data) {
        if (data) {
            let contentHtml = '<h3 class="text-2xl font-bold text-gray-800 mb-4">Profilo attuale</h3>';
            const imgSrc = data.image || "https://placehold.co/192x192/EBF4FF/4A90E2?text=P";
            
            contentHtml += `<img src="${imgSrc}" alt="Profilo" class="mx-auto rounded-full w-48 h-48 object-cover mb-4 shadow-md">`;
            
            if (data.caption) {
                contentHtml += `
                    <div class="mt-4 p-4 bg-gray-100 rounded-lg">
                        <p class="text-center italic text-gray-600">"${data.caption}"</p>
                    </div>
                `;
            }
            profilePreview.innerHTML = contentHtml;
            profilePreview.style.display = 'block';
            imageCaptionTextarea.value = data.caption || '';
        } else {
            profilePreview.style.display = 'none';
        }
    }

    // Carica il profilo da Firestore
    async function loadProfile(user) {
        try {
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                renderProfileUI(docSnap.data());
            } else {
                renderProfileUI(null);
            }
        } catch (error) {
            console.error("Errore caricamento:", error);
        }
    }

    // Monitora lo stato dell'utente (Loggato o no)
    onAuthStateChanged(auth, (user) => {
        if (user) {
            loadProfile(user);
        } else {
            console.log("Nessun utente loggato");
            profilePreview.style.display = 'none';
        }
    });

    // Gestione Invio Form
    if (profileForm) {
        profileForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const user = auth.currentUser;

            if (!user) {
                alert("Devi effettuare l'accesso per salvare il profilo.");
                return;
            }

            const file = profileImageInput.files[0];
            const caption = imageCaptionTextarea.value.trim();
            let imageUrl = null;

            try {
                statusMessage.textContent = 'Salvataggio in corso...';
                statusMessage.className = 'mt-4 text-blue-600 font-medium';
                statusMessage.style.display = 'block';

                // 1. Caricamento Immagine se presente
                if (file) {
                    const storageRef = ref(storage, `profiles/${user.uid}/avatar.jpg`);
                    const snapshot = await uploadBytes(storageRef, file);
                    imageUrl = await getDownloadURL(snapshot.ref);
                }

                // 2. Salvataggio dati su Firestore
                const profileData = {
                    caption: caption,
                    updatedAt: new Date()
                };
                if (imageUrl) profileData.image = imageUrl;

                await setDoc(doc(db, "users", user.uid), profileData, { merge: true });

                // Successo
                statusMessage.textContent = 'Profilo aggiornato con successo!';
                statusMessage.className = 'mt-4 text-green-600 font-medium';
                loadProfile(user);
                
                setTimeout(() => statusMessage.style.display = 'none', 3000);
            } catch (error) {
                console.error("Errore salvataggio:", error);
                statusMessage.textContent = 'Errore durante il salvataggio.';
                statusMessage.className = 'mt-4 text-red-600 font-medium';
            }
        });
    }
});
