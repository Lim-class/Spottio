// ui-renderer.js - Rendering dinamico con supporto Modifica Commenti

window.postEditCache = window.postEditCache || {};

window.renderPost = async function(postId, post, currentUser, isAdmin) {
    const postsContainer = document.getElementById('posts-container');
    
    let postElement = document.getElementById(`post-${postId}`);
    const isUpdate = !!postElement;

    if (!isUpdate) {
        postElement = document.createElement('div');
        postElement.id = `post-${postId}`;
        postElement.className = 'bg-white p-6 rounded-2xl shadow-md post mb-6 border border-gray-100 transition duration-300 hover:shadow-lg w-full';

        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('post') === postId) {
            postElement.classList.add('ring-2', 'ring-blue-500'); 
            postsContainer.prepend(postElement);
        } else {
            postsContainer.appendChild(postElement);
        }
        
        postElement.innerHTML = `
            <div class="animate-pulse flex space-x-4">
                <div class="rounded-full bg-gray-200 h-10 w-10"></div>
                <div class="flex-1 space-y-4 py-1">
                    <div class="h-3 bg-gray-200 rounded w-1/4"></div>
                    <div class="space-y-2"><div class="h-3 bg-gray-200 rounded"></div><div class="h-3 bg-gray-200 rounded w-5/6"></div></div>
                </div>
            </div>
        `;
    }

    const postOwnerUid = post.user || "Anonimo"; 
    const currentUid = window.Spottio.getCurrentUid();
    
    const authorProfile = await window.Spottio.getUserProfile(postOwnerUid);
    const authorUsername = authorProfile.username;
    const authorPfUri = authorProfile.userPfUri;
    const isVerified = authorProfile.isVerified;

    const isOwner = (currentUser === authorUsername) || (currentUid === postOwnerUid);
    const verifiedBadge = window.Spottio.getVerifiedBadge(isVerified, "w-4 h-4 text-blue-500 ml-1 inline-block shrink-0");
    const avatarHtml = window.Spottio.getAvatarHtml(authorPfUri, authorUsername, "w-10 h-10");
    const dateDisplay = window.Spottio.formatTimestamp(post.timestamp) || "Data non disponibile";
    
    const postCategories = window.Spottio.getPostCategories(post);
    
    const categoryBadgeContainer = `
        <div class="flex flex-wrap gap-1 ml-2">
            ${postCategories.map(cat => 
                `<span class="bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200 shadow-sm">${window.Spottio.escape(cat)}</span>`
            ).join('')}
        </div>
    `;

    const safeText = window.Spottio.escape(post.text);
    const mediaHtml = window.renderPostMedia ? window.renderPostMedia(postId, post) : '';

    let postMediaData = (post.mediaList && Array.from(post.mediaList).length > 0) ? post.mediaList : [];
    window.postEditCache[postId] = postMediaData;

    const likes = post.likes || [];
    const hasLiked = likes.includes(currentUser); 
    const likeColor = hasLiked ? 'text-red-500' : 'text-gray-500';
    const likeIconFill = hasLiked ? 'currentColor' : 'none';

    // Rendering dei commenti con opzione Modifica
    const comments = post.comments || [];
    const commentsHtmlArray = await Promise.all(comments.map(async (c, index) => {
        const commenterUid = c.user || "Anonimo";
        let displayUsername = "Anonimo";
        let avatarUri = "";
        
        if (commenterUid !== "Anonimo" && commenterUid !== "Guest") {
            const profile = await window.Spottio.getUserProfile(commenterUid);
            displayUsername = profile.username;
            avatarUri = profile.userPfUri;
        }
        
        const isCommentOwner = (currentUser === displayUsername) || (currentUid === commenterUid) || isAdmin;
        const userAvatar = window.Spottio ? window.Spottio.getAvatarHtml(avatarUri, displayUsername, "w-6 h-6 text-[10px]") : '';
        const displayDate = window.Spottio.formatTimestamp(c.timestamp) || c.formattedDate || "";
        const safeCommentText = window.Spottio.escape(c.text);

        const editCommentBtn = isCommentOwner ? `
            <button onclick="window.editComment('${postId}', ${index})" class="text-gray-400 hover:text-blue-500 ml-2 transition" title="Modifica commento">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
            </button>
        ` : '';

        return `
            <div class="bg-gray-50 p-2.5 rounded-xl mb-2 text-sm border border-gray-100 flex items-start space-x-2.5 transition hover:bg-gray-100/60">
                ${userAvatar}
                <div class="flex-grow min-w-0">
                    <div class="flex justify-between items-center mb-0.5">
                        <div class="flex items-center min-w-0">
                            <span class="font-bold text-xs text-gray-800 hover:underline cursor-pointer truncate">${window.Spottio.escape(displayUsername)}</span>
                            ${editCommentBtn}
                        </div>
                        <span class="text-[10px] text-gray-400 shrink-0 ml-2">${window.Spottio.escape(displayDate)}</span>
                    </div>
                    
                    <!-- Testo Commento Standard -->
                    <p id="comment-text-${postId}-${index}" class="text-gray-700 text-xs leading-relaxed whitespace-pre-wrap break-words">${safeCommentText}</p>
                    
                    <!-- Form Modifica Commento Inline (Inizialmente Nascosto) -->
                    <div id="comment-edit-form-${postId}-${index}" class="hidden flex-col gap-1.5 mt-1">
                        <input type="text" id="comment-edit-input-${postId}-${index}" value="${safeCommentText}" class="w-full bg-white border border-blue-300 rounded-lg px-2 py-1 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <div class="flex justify-end gap-1.5">
                            <button onclick="window.cancelEditComment('${postId}', ${index})" class="px-2 py-0.5 text-[10px] text-gray-500 hover:bg-gray-200 rounded">Annulla</button>
                            <button onclick="window.saveEditedComment('${postId}', ${index})" class="px-2 py-0.5 text-[10px] bg-blue-600 text-white font-semibold rounded hover:bg-blue-700">Salva</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }));
    
    const commentsHtml = commentsHtmlArray.join('');

    const safeCategoriesForEdit = JSON.stringify(postCategories).replace(/"/g, '&quot;');
    const actionButtons = window.Spottio.getPostActionButtons(postId, post.text, safeCategoriesForEdit, isOwner, isAdmin);
    
    const safeEncodedText = encodeURIComponent(post.text || '').replace(/'/g, "%27");
    const reportBtn = (!isOwner && currentUser !== "Guest") ? `
        <button onclick="reportPost('${postId}', '${window.Spottio.escape(authorUsername)}', decodeURIComponent('${safeEncodedText}'))" class="text-gray-400 hover:text-yellow-600 transition p-2 rounded-full hover:bg-yellow-50" title="Segnala Post"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.332 16c-.77 1.333.192 3 1.732 3z" /></svg></button>
    ` : '';

    postElement.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
                ${avatarHtml}
                <div class="ml-3">
                    <div class="flex items-center gap-1">
                        <span class="font-semibold text-gray-800">${window.Spottio.escape(authorUsername)}</span>
                        ${verifiedBadge}
                        ${categoryBadgeContainer}
                    </div>
                    <p class="text-xs text-gray-400">${dateDisplay}</p>
                </div>
            </div>
            <div class="flex items-center">${reportBtn}${actionButtons}</div>
        </div>
        
        <p class="text-gray-700 mb-4 whitespace-pre-wrap leading-relaxed break-words overflow-hidden">${safeText}</p>
        
        ${mediaHtml}
        
        <div class="flex items-center space-x-6 border-t py-3 mt-4">
            <div class="flex items-center space-x-1">
                <button id="like-btn-${postId}" onclick="window.toggleLike('${postId}')" class="flex items-center ${likeColor} transition hover:scale-105 p-1 rounded-full hover:bg-gray-50" title="Mi Piace">
                    <svg id="like-icon-${postId}" class="w-6 h-6" fill="${likeIconFill}" stroke="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                </button>
                <button onclick="window.showLikesModal('${postId}')" class="text-gray-500 font-semibold text-sm hover:underline hover:text-gray-800">
                    <span id="like-count-${postId}">${likes.length}</span>
                </button>
            </div>
            
            <button onclick="window.toggleComments('${postId}')" class="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition hover:scale-105" title="Commenti">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                <span id="comment-count-${postId}">${comments.length}</span>
            </button>
            
            <button onclick="window.Spottio.sharePost('${postId}', decodeURIComponent('${safeEncodedText}'))" class="flex items-center space-x-1 text-gray-500 hover:text-green-600 transition hover:scale-105 p-1 rounded-full hover:bg-gray-50" title="Condividi fuori dall'app">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
            </button>
        </div>
        
        <div id="comment-section-${postId}" style="display: none;" class="border-t border-gray-100 pt-4 mt-2">
            <div id="comments-list-${postId}" class="max-h-60 overflow-y-auto custom-scrollbar mb-3 pr-1 space-y-1">
                ${commentsHtml || `<div id="no-comments-${postId}" class="text-center py-4 text-xs italic text-gray-400">Nessun commento. Sii il primo a commentare!</div>`}
            </div>
            <div class="flex bg-gray-100 rounded-xl p-1.5 items-center border border-transparent focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-200">
                <input 
                    type="text" 
                    id="comment-input-${postId}" 
                    placeholder="Scrivi un commento..." 
                    onkeydown="if(event.key === 'Enter') window.addComment('${postId}')"
                    class="flex-grow bg-transparent border-none px-2 py-1 text-sm outline-none placeholder-gray-400 text-gray-800"
                >
                <button 
                    id="comment-btn-${postId}"
                    onclick="window.addComment('${postId}')" 
                    class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
                    Invia
                </button>
            </div>
        </div>
    `;
};