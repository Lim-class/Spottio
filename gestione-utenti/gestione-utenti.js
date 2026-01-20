// Gestione Utenti con Firestore (Login, Registrazione, Admin, Sospensione)

// Inizializza la lingua all'avvio
window.onload = function() {
    const savedLang = localStorage.getItem('language') || 'it'; 
    if (typeof setLanguage !== 'undefined') {
        setLanguage(savedLang);
    }
    // Avvia il listener solo se siamo nella pagina di gestione
    if (document.getElementById('users-list')) {
        listenToUsers();
    }
};

// Funzione per mostrare messaggi
function showMessage(message, isError = false) {
    const messageContainer = document.getElementById('message-container');
    if (messageContainer) {
        messageContainer.innerHTML = `<p class="p-4 mb-6 rounded-xl font-medium text-sm text-center shadow-sm ${isError ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}">${message}</p>`;
        // Rimuovi il messaggio dopo 3 secondi
        setTimeout(() => messageContainer.innerHTML = '', 3000);
    }
}

// --- LOGICA DI LOGIN ---
document.getElementById('loginForm')?.addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const lang = localStorage.getItem('language') || 'it';

    // Query a Firestore
    window.db.collection('users').where('username', '==', username).get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                showMessage(translations[lang].loginError || "Utente non trovato", true);
                return;
            }

            // Prendiamo il primo documento trovato (l'username dovrebbe essere univoco)
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();

            // Verifica Password
            if (userData.password === password) {
                // VERIFICA SE SOSPESO
                if (userData.isSuspended) {
                    showMessage("Questo account è stato sospeso dall'amministratore.", true);
                    return;
                }

                showMessage(translations[lang].loginSuccess || "Login effettuato!");
                localStorage.setItem('currentUser', username);
                
                // Se è admin, salva un flag (opzionale, per UI locale)
                if (userData.isAdmin) {
                    localStorage.setItem('isAdmin', 'true');
                } else {
                    localStorage.removeItem('isAdmin');
                }

                // Redirect
                setTimeout(() => window.location.href = 'pubblici.html', 1000);
            } else {
                showMessage(translations[lang].loginError || "Password errata", true);
            }
        })
        .catch((error) => {
            console.error("Errore Login:", error);
            showMessage("Errore di connessione.", true);
        });
});

// --- LOGICA DI REGISTRAZIONE (Pubblica) ---
document.getElementById('signupForm')?.addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('signup-username').value.trim();
    const password = document.getElementById('signup-password').value.trim();
    const lang = localStorage.getItem('language') || 'it';

    const usersRef = window.db.collection('users');

    // Controlla duplicati
    usersRef.where('username', '==', username).get()
        .then((snapshot) => {
            if (!snapshot.empty) {
                showMessage(translations[lang].signupUsernameExists || "Username già esistente", true);
                return;
            }

            // Crea utente
            usersRef.add({
                username: username,
                password: password,
                isAdmin: false,
                isSuspended: false, // Default attivo
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(() => {
                showMessage(translations[lang].signupSuccess || "Registrazione avvenuta!", false);
                setTimeout(() => {
                    toggleForms(true); // Torna al login
                    document.getElementById('login-username').value = username;
                }, 1500);
            });
        })
        .catch((err) => showMessage("Errore durante la registrazione", true));
});

// Gestione toggle form Login/Signup
document.getElementById('show-signup')?.addEventListener('click', (e) => { e.preventDefault(); toggleForms(false); });
document.getElementById('show-login')?.addEventListener('click', (e) => { e.preventDefault(); toggleForms(true); });


// --- LOGICA AMMINISTRAZIONE (Gestione Utenti) ---

// Listener in tempo reale per la lista utenti
function listenToUsers() {
    const spinner = document.getElementById('loading-spinner');
    if(spinner) spinner.classList.remove('hidden');

    window.db.collection('users').orderBy('username').onSnapshot((snapshot) => {
        const usersList = document.getElementById('users-list');
        usersList.innerHTML = ''; // Pulisce
        
        if(spinner) spinner.classList.add('hidden');

        snapshot.forEach((doc) => {
            const user = doc.data();
            const docId = doc.id;

            // Non mostrare l'admin principale se vuoi proteggerlo, oppure mostralo ma disabilita azioni
            if (user.username === 'admin') return; 

            const userRow = document.createElement('div');
            userRow.className = 'user-row flex items-center justify-between p-4 hover:bg-gray-50 transition';

            // Determina stile e testo bottone sospensione
            const suspendBtnText = user.isSuspended ? 'Sblocca' : 'Blocca';
            const suspendBtnClass = user.isSuspended 
                ? 'bg-green-500 hover:bg-green-600 text-white' 
                : 'bg-yellow-500 hover:bg-yellow-600 text-white';
            
            const suspendedBadge = user.isSuspended 
                ? `<span class="badge-suspended">Sospeso</span>` 
                : '';

            userRow.innerHTML = `
                <div class="flex items-center">
                    <div class="font-medium text-gray-800 text-lg">${user.username}</div>
                    ${suspendedBadge}
                </div>
                <div class="flex space-x-2">
                    <button onclick="toggleSuspendUser('${docId}', ${user.isSuspended})" 
                            class="${suspendBtnClass} px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm transition duration-200">
                        ${suspendBtnText}
                    </button>
                    <button onclick="confirmDeleteUser('${docId}', '${user.username}')" 
                            class="bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-red-600 shadow-sm transition duration-200">
                        Elimina
                    </button>
                </div>
            `;
            usersList.appendChild(userRow);
        });

        if(snapshot.empty) {
            usersList.innerHTML = '<p class="text-center p-4 text-gray-500">Nessun utente trovato.</p>';
        }
    });
}

// Aggiungi utente da pannello Admin
document.getElementById('addUserForm')?.addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('new-username').value.trim();
    const password = document.getElementById('new-password').value.trim();

    const usersRef = window.db.collection('users');

    usersRef.where('username', '==', username).get().then(snapshot => {
        if (!snapshot.empty) {
            showMessage(`L'utente ${username} esiste già.`, true);
            return;
        }

        usersRef.add({
            username: username,
            password: password,
            isAdmin: false,
            isSuspended: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            showMessage(`Utente ${username} aggiunto!`, false);
            document.getElementById('addUserForm').reset();
        });
    });
});

// Sospendi / Riattiva Utente
window.toggleSuspendUser = function(docId, currentStatus) {
    // Inverte lo stato
    window.db.collection('users').doc(docId).update({
        isSuspended: !currentStatus
    })
    .then(() => {
        // Il listener aggiornerà la UI automaticamente
        const action = !currentStatus ? "bloccato" : "sbloccato";
        console.log(`Utente ${action} con successo`);
    })
    .catch(err => showMessage("Errore aggiornamento stato utente", true));
};

// Modale Eliminazione
let userToDeleteId = null;

window.confirmDeleteUser = function(docId, username) {
    userToDeleteId = docId;
    const modal = document.getElementById('confirmation-modal');
    const userSpan = document.getElementById('user-to-delete');
    
    if (userSpan) userSpan.textContent = username;
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex'; // Fix per alcuni layout CSS
    }
};

document.getElementById('cancel-delete')?.addEventListener('click', () => {
    document.getElementById('confirmation-modal').classList.add('hidden');
    document.getElementById('confirmation-modal').style.display = 'none';
    userToDeleteId = null;
});

document.getElementById('confirm-delete')?.addEventListener('click', () => {
    if (userToDeleteId) {
        window.db.collection('users').doc(userToDeleteId).delete()
            .then(() => {
                showMessage("Utente eliminato.", false);
                document.getElementById('confirmation-modal').classList.add('hidden');
                document.getElementById('confirmation-modal').style.display = 'none';
            })
            .catch(err => showMessage("Errore eliminazione utente", true));
    }
});
