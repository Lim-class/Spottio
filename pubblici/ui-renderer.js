// ui-renderer.js - Generazione del DOM per i Post

window.renderPost = function(postId, post, currentUser, isAdmin) {
    const postsContainer = document.getElementById('posts-container');
    const postElement = document.createElement('div');
    postElement.id = `post-${postId}`;
    postElement.className = 'bg-white p-6 rounded-2xl shadow-md post mb-6 border border-gray-100 transition duration-300 hover:shadow-lg w-full';

    const authorName = (post.user && post.user !== "") ? post.user : 
                       (post.author && post.author !== "") ? post.author : 
                       "Utente Anonimo";
    
    const authorInitial = authorName[0] ? authorName[0].toUpperCase() : '?';

    // FUNZIONE DI SICUREZZA: Previene attacchi XSS e la rottura del layout (es. con codice Java/HTML)
    const escapeHTML = (str) => {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag]));
    };

    // Rendiamo sicuro il testo principale per l'inserimento nel DOM
    const safeText = escapeHTML(post.text);

    // Gestione del badge della categoria con sanitizzazione HTML inclusa
    const postCategory = post.category || "Generale";
    const categoryBadge = `<span class="bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">${escapeHTML(postCategory)}</span>`;

    const avatarHtml = post.userPfUri 
        ? `<img src="${escapeHTML(post.userPfUri)}" class="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-200" alt="${escapeHTML(authorName)}">`
        : `<div class="w-10 h-10 bg-gradient-to-tr from-blue-500 to-blue-300 rounded-full flex items-center justify-center text-white font-bold shadow-sm">${authorInitial}</div>`;

    let dateDisplay = "Data non disponibile";
    if (post.timestamp) {
        const dateObj = typeof post.timestamp === 'number' ? new Date(post.timestamp) : post.timestamp.toDate();
        dateDisplay = dateObj.toLocaleString('it-IT');
    }

    let mediaHtml = '';
    if (post.mediaUri) {
        const isVideoContent = (post.video !== undefined) ? post.video : post.isVideo;
        if (isVideoContent) {
            mediaHtml = `<video src="${escapeHTML(post.mediaUri)}" controls class="w-full h-auto rounded-lg mb-4 bg-black max-h-96 object-contain"></video>`;
        } else {
            mediaHtml = `<img src="${escapeHTML(post.mediaUri)}" class="w-full h-auto rounded-lg mb-4 shadow-sm max-h-96 object-cover cursor-pointer" onclick="window.open(this.src)">`;
        }
    }

    const likes = post.likes || [];
    const hasLiked = likes.includes(currentUser);
    const likeColor = hasLiked ? 'text-red-500' : 'text-gray-500';
    const likeIconFill = hasLiked ? 'currentColor' : 'none';

    const comments = post.comments || [];
    let commentsHtml = comments.map(c => `
        <div class="bg-gray-50 p-3 rounded-xl mb-2 text-sm border border-gray-200">
            <div class="flex justify-between items-start mb-1">
                <span class="font-bold text-blue-600">${escapeHTML(c.user || c.author || "Anonimo")}</span>
                <span class="text-[10px] text-gray-400">${escapeHTML(c.formattedDate || "")}</span>
            </div>
            <p class="text-gray-700 leading-snug whitespace-pre-wrap break-words">${escapeHTML(c.text)}</p>
        </div>
    `).join('');

    let actionButtons = '';
    const postOwner = post.user || post.author; 
    if (currentUser === postOwner || isAdmin) {
        const safeEditCategory = escapeHTML(postCategory);
        const safeEditText = encodeURIComponent(post.text || '').replace(/'/g, "%27");

        const editBtn = `<button onclick="window.openEditModal('${postId}', decodeURIComponent('${safeEditText}'), '${safeEditCategory}')" class="text-blue-400 hover:text-blue-600 transition p-2 rounded-full hover:bg-blue-50" title="Modifica post">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
        </button>`;

        const deleteBtn = `<button onclick="window.confirmDeletePost('${postId}')" class="text-red-400 hover:text-red-600 transition p-2 rounded-full hover:bg-red-50" title="Elimina post">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>`;

        actionButtons = editBtn + deleteBtn;
    }

    // FIX: Codifichiamo il testo in modo sicuro per inserirlo come argomento nella funzione JS dentro a `onclick` 
    const safeEncodedText = encodeURIComponent(post.text || '').replace(/'/g, "%27");

    const reportBtn = currentUser !== postOwner && currentUser !== "Guest" ? `
        <button onclick="reportPost('${postId}', '${escapeHTML(authorName)}', decodeURIComponent('${safeEncodedText}'))" class="text-gray-400 hover:text-yellow-600 transition p-2 rounded-full hover:bg-yellow-50" title="Segnala post">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.332 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </button>
    ` : '';

    postElement.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
                ${avatarHtml}
                <div class="ml-3">
                    <div class="flex items-center gap-2">
                        <span class="font-semibold text-gray-800">${escapeHTML(authorName)}</span>
                        ${categoryBadge}
                    </div>
                    <p class="text-xs text-gray-400">${dateDisplay}</p>
                </div>
            </div>
            <div class="flex items-center">
                ${reportBtn}
                ${actionButtons}
            </div>
        </div>
        
        <p class="text-gray-700 mb-4 whitespace-pre-wrap leading-relaxed break-words overflow-hidden">${safeText}</p>
        
        ${mediaHtml}
        
        <div class="flex items-center space-x-6 border-t py-3 mt-4">
            <button id="like-btn-${postId}" onclick="window.toggleLike('${postId}')" class="flex items-center space-x-2 ${likeColor} transition hover:scale-105">
                <svg id="like-icon-${postId}" class="w-6 h-6" fill="${likeIconFill}" stroke="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                <span id="like-count-${postId}">${likes.length}</span>
            </button>
            <button onclick="window.toggleComments('${postId}')" class="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition hover:scale-105">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                <span id="comment-count-${postId}">${comments.length}</span>
            </button>
        </div>
        
        <div id="comment-section-${postId}" style="display: none;" class="border-t pt-4 mt-2 animate-fade-in">
            <div id="comments-list-${postId}" class="max-h-60 overflow-y-auto custom-scrollbar mb-3 pr-1">
                ${commentsHtml || `<p id="no-comments-${postId}" class="text-xs italic text-gray-400">Nessun commento.</p>`}
            </div>
            <div class="flex mt-2 bg-gray-100 rounded-xl p-1 items-center">
                <input type="text" id="comment-input-${postId}" placeholder="Scrivi un commento..." class="flex-grow bg-transparent border-none p-2 text-sm outline-none placeholder-gray-500 text-gray-800">
                <button onclick="window.addComment('${postId}')" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm">Invia</button>
            </div>
        </div>
    `;
    postsContainer.appendChild(postElement);
};

// Non esiste (Vulnerabilità XSS).
