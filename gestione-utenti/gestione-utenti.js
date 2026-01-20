// Gestione Utenti con Firestore (Login, Registrazione, Admin, Sospensione)

// Usa DOMContentLoaded per evitare conflitti con altri script (es. nav.js)
document.addEventListener('DOMContentLoaded', function() {
    const savedLang = localStorage.getItem('language') || 'it'; 
    if (typeof setLanguage !== 'undefined') {
        setLanguage(savedLang);
    }

    // Avvia il listener solo se siamo nella pagina di gestione (se esiste la lista)
    if (document.getElementById('users-list')) {
        // Piccolo ritardo per assicurarsi che window.db sia inizializzato
        setTimeout(listenToUsers, 500); 
    }
});

// Funzione per mostrare messaggi
function showMessage(message, isError = false) {
    const messageContainer = document.getElementById('message-container');
    if (messageContainer) {
        messageContainer.innerHTML = `<p class="p-4 mb-6 rounded-xl font-medium text-sm text-center shadow-sm ${isError ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}">${message}</p>`;
        setTimeout(() => messageContainer.innerHTML = '', 4000);
    }
}

// --- LOGICA DI LOGIN ---
document.getElementById('loginForm')?.addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const lang = localStorage.getItem('language') || 'it';

    if(!window.db) {
        showMessage("Errore: Database non connesso.", true);
        return;
    }

    window.db.collection('users').where('username', '==', username).get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                showMessage(translations[lang]?.loginError || "Utente non trovato", true);
                return;
            }

            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();

            if (userData.password === password) {
                if (userData.isSuspended) {
                    showMessage("Questo account è stato sospeso dall'amministratore.", true);
                    return;
                }

                showMessage(translations[lang]?.loginSuccess || "Login effettuato!");
                localStorage.setItem('currentUser', username);
                
                if (userData.isAdmin) {
                    localStorage.setItem('isAdmin', 'true');
                } else {
                    localStorage.removeItem('isAdmin');
                }

                setTimeout(() => window.location.href = 'pubblici.html', 1000);
            } else {
                showMessage(translations[lang]?.loginError || "Password errata", true);
            }
        })
        .catch((error) => {
            console.error("Errore Login:", error);
            showMessage("Errore durante l'accesso: " + error.message, true);
        });
});

// --- LOGICA DI REGISTRAZIONE ---
document.getElementById('signupForm')?.addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('signup-username').value.trim();
    const password = document.getElementById('signup-password').value.trim();
    const lang = localStorage.getItem('language') || 'it';

    if(!window.db) return;
    const usersRef = window.db.collection('users');

    usersRef.where('username', '==', username).get()
        .then((snapshot) => {
            if (!snapshot.empty) {
                showMessage(translations[lang]?.signupUsernameExists || "Username già esistente", true);
                return;
            }

            usersRef.add({
                username: username,
                password: password,
                isAdmin: false,
                isSuspended: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(() => {
                showMessage(translations[lang]?.signupSuccess || "Registrazione avvenuta!", false);
                setTimeout(() => {
                    toggleForms(true);
                    const loginInput = document.getElementById('login-username');
                    if(loginInput) loginInput.value = username;
                }, 1500);
            });
        })
        .catch((err) => showMessage("Errore registrazione: " + err.message, true));
});

// Toggle forms
document.getElementById('show-signup')?.addEventListener('click', (e) => { e.preventDefault(); toggleForms(false); });
document.getElementById('show-login')?.addEventListener('click', (e) => { e.preventDefault(); toggleForms(true); });


// --- LOGICA AMMINISTRAZIONE (LISTA UTENTI) ---

function listenToUsers() {
    const spinner = document.getElementById('loading-spinner');
    const usersList = document.getElementById('users-list');
    
    if(!window.db) {
        if(usersList) usersList.innerHTML = '<p class="text-red-500 text-center p-4">Errore: Database non inizializzato.</p>';
        return;
    }

    if(spinner) spinner.classList.remove('hidden');

    // Ascoltatore in tempo reale
    window.db.collection('users').orderBy('username').onSnapshot((snapshot) => {
        usersList.innerHTML = ''; // Pulisce la lista
        if(spinner) spinner.classList.add('hidden');

        if(snapshot.empty) {
            usersList.innerHTML = '<p class="text-center p-4 text-gray-500">Nessun utente trovato nel database.</p>';
            return;
        }

        snapshot.forEach((doc) => {
            const user = doc.data();
            const docId = doc.id;

            // Opzionale: Nascondi l'admin stesso dalla lista per evitare auto-cancellazione
            if (user.username === 'admin') return; 

            const userRow = document.createElement('div');
            userRow.className = 'user-row flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-100 last:border-0';

            const suspendBtnText = user.isSuspended ? 'Sblocca' : 'Blocca';
            const suspendBtnClass = user.isSuspended 
                ? 'bg-green-500 hover:bg-green-600 text-white' 
                : 'bg-yellow-500 hover:bg-yellow-600 text-white';
            
            const suspendedBadge = user.isSuspended 
                ? `<span class="ml-2 bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded">Sospeso</span>` 
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
    }, (error) => {
        // Gestione Errori Visibile
        console.error("Errore recupero utenti:", error);
        if(spinner) spinner.classList.add('hidden');
        if (usersList) {
            usersList.innerHTML = `
                <div class="p-4 text-red-600 bg-red-50 rounded-lg text-center border border-red-200">
                    <p class="font-bold">Impossibile caricare gli utenti</p>
                    <p class="text-sm mt-1">${error.message}</p>
                    <p class="text-xs mt-2 text-gray-500">Verifica la connessione o i permessi del database.</p>
                </div>`;
        }
    });
}

// Aggiungi utente (Admin)
document.getElementById('addUserForm')?.addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('new-username').value.trim();
    const password = document.getElementById('new-password').value.trim();

    if(!window.db) return;
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
    }).catch(err => showMessage("Errore: " + err.message, true));
});

// Sospendi / Sblocca
window.toggleSuspendUser = function(docId, currentStatus) {
    window.db.collection('users').doc(docId).update({
        isSuspended: !currentStatus
    })
    .then(() => console.log("Stato utente aggiornato"))
    .catch(err => showMessage("Errore modifica stato: " + err.message, true));
};

// Cancellazione Utente
let userToDeleteId = null;

window.confirmDeleteUser = function(docId, username) {
    userToDeleteId = docId;
    const modal = document.getElementById('confirmation-modal');
    const userSpan = document.getElementById('user-to-delete');
    
    if (userSpan) userSpan.textContent = username;
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'block'; // Forza display block per visibilità
    }
};

document.getElementById('cancel-delete')?.addEventListener('click', () => {
    const modal = document.getElementById('confirmation-modal');
    if(modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
    userToDeleteId = null;
});

document.getElementById('confirm-delete')?.addEventListener('click', () => {
    if (userToDeleteId) {
        window.db.collection('users').doc(userToDeleteId).delete()
            .then(() => {
                showMessage("Utente eliminato.", false);
                const modal = document.getElementById('confirmation-modal');
                if(modal) {
                    modal.classList.add('hidden');
                    modal.style.display = 'none';
                }
            })
            .catch(err => showMessage("Errore eliminazione: " + err.message, true));
    }
});
