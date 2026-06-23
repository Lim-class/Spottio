// ==========================================
// FILE: chat-lists-renderer.js
// Rendering delle Liste (Sidebar, Ricerca, Gruppi)
// ==========================================

/**
 * Disegna l'anteprima nella barra laterale (Gestisce sia DM che Gruppi)
 */
function renderChatListItem(chatId, displayName, lastMessage, isSelected, isGroup, avatarUrl, isVerified) {
    const chatsListContainer = document.getElementById('chats-list');
    if (!chatsListContainer) return;

    const chatDiv = document.createElement('div');
    chatDiv.className = `flex items-center p-3 mb-2 rounded-xl cursor-pointer transition-all duration-200 w-full min-w-0 ${isSelected ? 'bg-blue-100 shadow-sm' : 'hover:bg-gray-100'}`;
    
    // ✨ MAGIA CODICE PULITO
    const verifiedBadge = window.Spottio.getVerifiedBadge(isVerified, "w-4 h-4 text-blue-500 ml-1 inline-block shrink-0");

    const avatarHtml = window.Spottio.getAvatarHtml(avatarUrl, displayName, "w-12 h-12 mr-3 text-lg", isGroup);

    chatDiv.innerHTML = `
        ${avatarHtml}
        <div class="flex-grow overflow-hidden min-w-0">
            <div class="flex items-center gap-0.5">
                <h4 class="font-semibold text-gray-800 truncate">${displayName}</h4>
                ${verifiedBadge}
            </div>
            <p class="text-xs text-gray-500 truncate">${lastMessage || 'Nessun messaggio'}</p>
        </div>
    `;
    
    chatDiv.onclick = () => startNewChat(chatId, displayName, isGroup);
    chatsListContainer.appendChild(chatDiv);
}

function renderSearchResults(users) {
    const searchResultsContainer = document.getElementById('search-results');
    if (!searchResultsContainer) return;

    searchResultsContainer.innerHTML = '';
    if (users.length > 0) {
        users.forEach(user => {
            const div = document.createElement('div');
            div.className = 'p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0 flex items-center gap-3 transition-colors';
            
            // ✨ MAGIA CODICE PULITO
            const verifiedBadge = window.Spottio.getVerifiedBadge(user.isVerified, "w-4 h-4 text-blue-500 ml-1 inline-block shrink-0");

            const avatarHtml = window.Spottio.getAvatarHtml(user.avatarUrl, user.username, "w-10 h-10");

            div.innerHTML = `
                ${avatarHtml}
                <div class="flex items-center gap-0.5 text-gray-700 font-medium">
                    <span>${user.username}</span>
                    ${verifiedBadge}
                </div>
            `;
            
            div.onclick = () => {
                startNewChat(user.id, user.username, false);
                const userSearchInput = document.getElementById('user-search');
                if (userSearchInput) userSearchInput.value = '';
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
    const searchResultsContainer = document.getElementById('search-results');
    if (searchResultsContainer) {
        searchResultsContainer.innerHTML = '';
        searchResultsContainer.classList.add('hidden');
    }
}

// Render dei tag nel modale di creazione gruppo
function renderSelectedMembers() {
    const selectedMembersList = document.getElementById('selected-members-list');
    if (!selectedMembersList) return;
    
    selectedMembersList.innerHTML = '';
    selectedGroupMembers.forEach(memberObj => {
        const tag = document.createElement('div');
        tag.className = 'bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded flex items-center gap-1';
        tag.innerHTML = `
            ${memberObj.username}
            <button class="text-green-600 hover:text-green-900 ml-1 font-bold" onclick="removeMember('${memberObj.uid}')">&times;</button>
        `;
        selectedMembersList.appendChild(tag);
    });
}

window.removeMember = function(uid) {
    selectedGroupMembers = selectedGroupMembers.filter(m => m.uid !== uid);
    renderSelectedMembers();
}