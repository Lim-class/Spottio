// ==========================================
// FILE: chat-messages-renderer.js
// Rendering dei Messaggi e della Conversazione
// ==========================================

function renderSingleMessage(docId, text, sender, isMe, timeStr, isGroup, isDeleted, isEdited) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `w-full flex ${isMe ? 'justify-end' : 'justify-start'} mb-3 px-2`;
    
    const bubbleStyles = isMe 
        ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none' 
        : 'bg-white text-gray-800 rounded-2xl rounded-tl-none border border-gray-200';
        
    const timeStyles = isMe ? 'text-blue-200' : 'text-gray-400';
    const senderLabel = (!isMe && isGroup) ? `<span class="text-[10px] font-bold text-green-600 block mb-1">${sender}</span>` : '';

    let messageContent = text;
    let editTag = isEdited && !isDeleted ? `<span class="text-[10px] italic opacity-75 mr-1">(modificato)</span>` : '';

    if (isDeleted) {
        messageContent = `<span class="italic text-white opacity-80 flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg> Questo messaggio è stato eliminato</span>`;
        if(!isMe) messageContent = messageContent.replace('text-white', 'text-gray-500');
        editTag = '';
    }

    // MENU CONTESTUALE (POPOVER)
    let actionMenu = '';
    if (isMe && !isDeleted) {
        const safeText = text.replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, '\\n');
        
        actionMenu = `
            <div class="absolute top-2 -left-10 opacity-0 group-hover:opacity-100 transition-opacity duration-150 dynamic-menu-container">
                <button onclick="toggleActionMenu(event, '${docId}')" class="p-2 bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full shadow-md border border-gray-100 transition-all cursor-pointer flex items-center justify-center">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 10a2 2 0 100 4 2 2 0 000-4zM12 4a2 2 0 100 4 2 2 0 000-4zM12 16a2 2 0 100 4 2 2 0 000-4z"/></svg>
                </button>
                
                <div id="dropdown-${docId}" class="hidden absolute left-0 mt-1 w-32 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden text-sm animate-fadeIn">
                    <button onclick="inlineEditInit('${docId}', '${safeText}')" class="w-full text-left px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2 font-medium">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        Modifica
                    </button>
                    <button onclick="inlineDeleteInit('${docId}')" class="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100 flex items-center gap-2 font-medium">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        Elimina
                    </button>
                </div>
            </div>
        `;
    }

    msgDiv.innerHTML = `
        <div class="relative w-fit max-w-[80%] sm:max-w-[50%] px-4 py-2.5 shadow-sm flex flex-col ${bubbleStyles} group transition-all duration-200">
            ${actionMenu}
            ${senderLabel}
            
            <div id="text-container-${docId}">
                <p class="text-sm leading-relaxed whitespace-pre-wrap" style="overflow-wrap: anywhere; word-break: break-word;">${messageContent}</p>
            </div>

            <div id="editor-container-${docId}" class="hidden w-full min-w-[200px] mt-1 text-gray-800">
                <textarea id="input-${docId}" class="w-full p-2 text-sm rounded-lg border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" rows="2"></textarea>
                <div class="flex justify-end gap-1.5 mt-2">
                    <button onclick="inlineEditCancel('${docId}')" class="px-2 py-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors">Annulla</button>
                    <button onclick="inlineEditSave('${docId}')" class="px-2 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">Salva</button>
                </div>
            </div>

            <div class="flex justify-end items-center mt-1.5">
                ${editTag}
                <span class="text-[10px] font-medium ${timeStyles}">${timeStr}</span>
            </div>
        </div>
    `;
    
    messagesContainer.appendChild(msgDiv);
}

/**
 * Crea il divisore temporale in stile WhatsApp
 */
function renderDateSeparator(dateText) {
    const separator = document.createElement('div');
    separator.className = 'flex justify-center my-6';
    separator.innerHTML = `
        <div class="bg-blue-50 text-blue-600 text-xs font-bold px-4 py-1.5 rounded-full shadow-sm border border-blue-100 uppercase tracking-wider">
            ${dateText}
        </div>
    `;
    messagesContainer.appendChild(separator);
}

// ==========================================
// FUNZIONI HELPER PER IL MENU CONTESTUALE
// ==========================================
window.toggleActionMenu = function(event, docId) {
    event.stopPropagation();
    document.querySelectorAll('[id^="dropdown-"]').forEach(el => {
        if(el.id !== `dropdown-${docId}`) el.classList.add('hidden');
    });
    
    const dropdown = document.getElementById(`dropdown-${docId}`);
    if (dropdown) dropdown.classList.toggle('hidden');
};

document.addEventListener('click', () => {
    document.querySelectorAll('[id^="dropdown-"]').forEach(el => el.classList.add('hidden'));
});