window.userCache = window.userCache || {}; 

window.renderPost = async function(postId, post, currentUser, isAdmin) {
    const postsContainer = document.getElementById('posts-container');
    
    const postElement = document.createElement('div');
    postElement.id = `post-${postId}`;
    postElement.className = 'bg-white p-6 rounded-2xl shadow-md post mb-6 border border-gray-100 transition duration-300 hover:shadow-lg w-full';

    postElement.innerHTML = `
        <div class="animate-pulse flex space-x-4">
            <div class="rounded-full bg-gray-200 h-10 w-10"></div>
            <div class="flex-1 space-y-4 py-1">
                <div class="h-3 bg-gray-200 rounded w-1/4"></div>
                <div class="space-y-2"><div class="h-3 bg-gray-200 rounded"></div><div class="h-3 bg-gray-200 rounded w-5/6"></div></div>
            </div>
        </div>
    `;
    postsContainer.appendChild(postElement);

    const postOwnerUid = post.user || post.author; 
    let authorUsername = "Utente Anonimo";
    let authorPfUri = ""; 
    let isVerified = false;

    if (postOwnerUid && postOwnerUid.length > 10) { 
        if (window.userCache[postOwnerUid]) {
            const cachedUser = window.userCache[postOwnerUid];
            authorUsername = cachedUser.username || authorUsername;
            authorPfUri = cachedUser.userPfUri || "";
            isVerified = cachedUser.isVerified || false;
        } else {
            try {
                const userDoc = await window.db.collection("users").doc(postOwnerUid).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    authorUsername = userData.username || authorUsername;
                    authorPfUri = userData.userPfUri || userData.profileImageUrl || "";
                    isVerified = userData.isVerified === true;
                    
                    window.userCache[postOwnerUid] = {
                        username: authorUsername, userPfUri: authorPfUri, isVerified: isVerified
                    };
                }
            } catch (error) { console.error("Errore post cache:", error); }
        }
    } else if (postOwnerUid) {
        authorUsername = postOwnerUid;
    }

    const isOwner = (currentUser === authorUsername) || (localStorage.getItem('currentUid') === postOwnerUid);
    const authorInitial = authorUsername[0] ? authorUsername[0].toUpperCase() : '?';

    // ✨ MAGIA DEL CODICE PULITO: Richiama la spunta blu
    const verifiedBadge = window.Spottio.getVerifiedBadge(isVerified, "w-4 h-4 text-blue-500 ml-1 inline-block shrink-0");

    const avatarHtml = window.Spottio.getAvatarHtml(authorPfUri, authorUsername, "w-10 h-10");

    const dateDisplay = window.Spottio.formatTimestamp(post.timestamp) || "Data non disponibile";

    const postCategory = window.Spottio.escape(post.category || "Generale");
    const categoryBadge = `<span class="bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">${postCategory}</span>`;
    const safeText = window.Spottio.escape(post.text);

    let mediaHtml = '';
    if (post.mediaUri) {
        const isVideoContent = (post.video !== undefined) ? post.video : post.isVideo;
        if (isVideoContent) {
            mediaHtml = `<video src="${window.Spottio.escape(post.mediaUri)}" controls class="w-full h-auto rounded-lg mb-4 bg-black max-h-96 object-contain"></video>`;
        } else {
            mediaHtml = `<img src="${window.Spottio.escape(post.mediaUri)}" class="w-full h-auto rounded-lg mb-4 shadow-sm max-h-96 object-cover cursor-pointer" onclick="window.open(this.src)">`;
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
                <span class="font-bold text-blue-600">${window.Spottio.escape(c.user || c.author || "Anonimo")}</span>
                <span class="text-[10px] text-gray-400">${window.Spottio.escape(c.formattedDate || "")}</span>
            </div>
            <p class="text-gray-700 leading-snug whitespace-pre-wrap break-words">${window.Spottio.escape(c.text)}</p>
        </div>
    `).join('');

    const actionButtons = window.Spottio.getPostActionButtons(postId, post.text, postCategory, isOwner, isAdmin);

    const safeEncodedText = encodeURIComponent(post.text || '').replace(/'/g, "%27");
    const reportBtn = (!isOwner && currentUser !== "Guest") ? `
        <button onclick="reportPost('${postId}', '${window.Spottio.escape(authorUsername)}', decodeURIComponent('${safeEncodedText}'))" class="text-gray-400 hover:text-yellow-600 transition p-2 rounded-full hover:bg-yellow-50"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.332 16c-.77 1.333.192 3 1.732 3z" /></svg></button>
    ` : '';

    postElement.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
                ${avatarHtml}
                <div class="ml-3">
                    <div class="flex items-center gap-1">
                        <span class="font-semibold text-gray-800">${window.Spottio.escape(authorUsername)}</span>
                        ${verifiedBadge}
                        <div class="ml-2">${categoryBadge}</div>
                    </div>
                    <p class="text-xs text-gray-400">${dateDisplay}</p>
                </div>
            </div>
            <div class="flex items-center">${reportBtn}${actionButtons}</div>
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
};