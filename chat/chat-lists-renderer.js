// ==========================================
// FILE: chat-lists-renderer.js
// Rendering delle Liste (Sidebar, Ricerca, Gruppi)
// ==========================================

/**
 * Disegna l'anteprima nella barra laterale (Gestisce sia DM che Gruppi)
 */
function renderChatListItem(chatId, displayName, lastMessage, isSelected, isGroup) {
    const chatDiv = document.createElement('div');
    chatDiv.className = `flex items-center p-3 mb-2 rounded-xl cursor-pointer transition-all duration-200 w-full min-w-0 ${isSelected ? 'bg-blue-100 shadow-sm' : 'hover:bg-gray-100'}`;
    
    // Colore e icona diversi se è un gruppo
    const avatarColor = isGroup ? 'bg-green-500' : 'bg-blue-500';
    const initial = displayName ? displayName.charAt(0).toUpperCase() : '?';

    chatDiv.innerHTML = `
        <div class="w-12 h-12 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold mr-3 shrink-0 shadow-sm relative">
            ${initial}
            ${isGroup ? '<span class="absolute bottom-0 right-0 w-3 h-3 bg-white rounded-full border border-green-500 flex items-center justify-center"><svg class="w-2 h-2 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path></svg></span>' : ''}
        </div>
        
        <div class="flex-grow overflow-hidden min-w-0">
            <h4 class="font-semibold text-gray-800 truncate">${displayName}</h4>
            <p class="text-xs text-gray-500 truncate">${lastMessage || 'Nessun messaggio'}</p>
        </div>
    `;
    
    chatDiv.onclick = () => startNewChat(chatId, displayName, isGroup);
    chatsListContainer.appendChild(chatDiv);
}

function renderSearchResults(users) {
    searchResultsContainer.innerHTML = '';
    if (users.length > 0) {
        users.forEach(user => {
            const div = document.createElement('div');
            div.className = 'p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0 text-gray-700 font-medium transition-colors';
            div.textContent = user.username;
            div.onclick = () => {
                startNewChat(user.username, user.username, false);
                userSearchInput.value = '';
                hideSearchResults();
            };
            searchResultsContainer.appendChild(div);
        });
        searchResultsContainer.classList.remove('hidden');
    } else {
        searchResultsContainer.innerHTML = '<div class="p-3 text-gray-400 italic text-sm text-center">Nessun utente trovato</div>';
        searchResultsContainer.classList.remove('hidden');
    }
}

function hideSearchResults() {
    searchResultsContainer.innerHTML = '';
    searchResultsContainer.classList.add('hidden');
}

// Render dei tag nel modale di creazione gruppo
function renderSelectedMembers() {
    selectedMembersList.innerHTML = '';
    selectedGroupMembers.forEach(member => {
        const tag = document.createElement('div');
        tag.className = 'bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded flex items-center gap-1';
        tag.innerHTML = `
            ${member}
            <button class="text-green-600 hover:text-green-900 ml-1 font-bold" onclick="removeMember('${member}')">&times;</button>
        `;
        selectedMembersList.appendChild(tag);
    });
}

// Resa globale per permettere l'onclick nell'HTML generato
window.removeMember = function(member) {
    selectedGroupMembers = selectedGroupMembers.filter(m => m !== member);
    renderSelectedMembers();
}