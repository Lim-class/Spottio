// ==========================================
// FILE: messages-search.js
// Ricerca Utenti Generale e Chiusura Modali
// ==========================================

function setupSearchListeners() {
    
    // 1. Ricerca Utenti Generale (Sidebar)
    if (userSearchInput) {
        userSearchInput.addEventListener('input', async (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            if (searchTerm.length === 0) { 
                if (typeof hideSearchResults === 'function') hideSearchResults(); 
                return; 
            }
            
            try {
                const snapshot = await db.collection("users").get();
                const filteredUsers = [];
                
                snapshot.forEach(doc => {
                    const docId = doc.id; // UID dell'utente
                    const data = doc.data();
                    const username = data.username || "";
                    
                    if (username.toLowerCase().includes(searchTerm) && docId !== currentUid) {
                        // Inviamo alla UI l'ID, il nome e i dati multimediali/verifica caricate live
                        filteredUsers.push({ 
                            id: docId, 
                            username: username,
                            avatarUrl: data.userPfUri || data.profileImageUrl || "",
                            isVerified: data.isVerified === true
                        });
                    }
                });
                
                if (typeof renderSearchResults === 'function') renderSearchResults(filteredUsers);
            } catch (err) { 
                console.error("Errore ricerca:", err); 
            }
        });
    }

    // Gestione chiusure modali/risultati cliccando fuori
    document.addEventListener('click', (e) => {
        if (userSearchInput && searchResultsContainer && !userSearchInput.contains(e.target) && !searchResultsContainer.contains(e.target)) {
            if (typeof hideSearchResults === 'function') hideSearchResults();
        }
        
        const groupUserSearch = document.getElementById('group-user-search');
        const groupSearchResults = document.getElementById('group-search-results');
        if (groupUserSearch && groupSearchResults && !groupUserSearch.contains(e.target) && !groupSearchResults.contains(e.target)) {
            if (groupSearchResults) groupSearchResults.classList.add('hidden');
        }
    });
}