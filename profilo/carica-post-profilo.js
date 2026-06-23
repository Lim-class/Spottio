async function loadUserPosts() {
    const dbInstance = window.db || firebase.firestore();
    const container = document.getElementById('user-posts-container');
    if (!container) return;

    const tx = (key, defaultTesto) => window.t ? window.t(key) : defaultTesto;
    container.innerHTML = `<p class="text-gray-500 italic col-span-full text-center">${tx('loadingPosts', 'Caricamento dei tuoi post...')}</p>`;

    // RECUPERO UID CENTRALIZZATO
    const currentUid = window.Spottio.getCurrentUid();
    const currentUsername = localStorage.getItem('currentUser');

    if (!currentUid) {
        container.innerHTML = `<p class="text-red-500 col-span-full text-center">${tx('userNotFound', 'Errore: utente non identificato per il caricamento post.')}</p>`;
        return;
    }

    try {
        const postsRef = dbInstance.collection('posts')
                                   .where('user', '==', currentUid)
                                   .orderBy('timestamp', 'desc');

        const snapshot = await postsRef.get();
        
        const numberElement = document.getElementById('post-count-number');
        if (numberElement) {
            numberElement.textContent = snapshot.size;
        }

        container.innerHTML = '';

        if (snapshot.empty) {
            container.innerHTML = `<p class="text-gray-400 italic col-span-full text-center py-4">${tx('noPostsFound', "Nessun post trovato per l'utente")} <b>${currentUsername}</b>.</p>`;
            return;
        }

        snapshot.forEach(doc => {
            const post = doc.data();
            const postElement = document.createElement('div');
            postElement.className = "bg-white p-5 rounded-2xl shadow-md border border-gray-100 flex flex-col justify-between transition-all hover:shadow-lg";
            
            const content = post.text ? escapeHTML(post.text) : tx('noTextPost', 'Post senza testo');
            const category = post.category ? escapeHTML(post.category) : tx('generalCategory', 'Generale');

            let dateString = '';
            if (post.timestamp) {
                const dateObj = typeof post.timestamp.toDate === 'function' ? post.timestamp.toDate() : new Date(post.timestamp);
                dateString = dateObj.toLocaleDateString('it-IT') + ' ' + dateObj.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
            }

            postElement.innerHTML = `
                <div>
                    <p class="text-gray-800 text-base leading-relaxed mb-4">${content}</p>
                </div>
                <div class="mt-2 flex justify-between items-center border-t border-gray-50 pt-3">
                    <span class="inline-block px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-semibold">
                        ${category}
                    </span>
                    <span class="text-xs text-gray-400 font-medium">${dateString}</span>
                </div>
            `;
            container.appendChild(postElement);
        });
    } catch (error) {
        console.error("❌ DEBUG ERRORE FIRESTORE:", error);
        
        if (error.message && error.message.includes("requires an index")) {
            container.innerHTML = `<p class="text-orange-600 col-span-full text-center text-sm p-4 bg-orange-50 rounded-xl border border-orange-200">
                <b>${tx('missingIndex', "Manca l'indice su Firebase!")}</b><br>
                Firebase richiede un nuovo indice per cercare per <b>user</b> (UID) e ordinare per <b>timestamp</b>.<br>
                Premi <b>F12</b>, vai nella scheda Console e clicca sul link blu per crearlo.
            </p>`;
        } else {
            container.innerHTML = `<p class="text-red-500 col-span-full text-center">${tx('cannotLoadPosts', 'Impossibile caricare i post.')}</p>`;
        }
    }
}

function escapeHTML(str) {
    if (window.Spottio && window.Spottio.escape) return window.Spottio.escape(str);
    return String(str).replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

document.addEventListener('DOMContentLoaded', () => {
    const checkDbInterval = setInterval(() => {
        if ((window.db || (typeof firebase !== 'undefined' && firebase.firestore)) && localStorage.getItem('currentUid')) {
            clearInterval(checkDbInterval);
            loadUserPosts();
        }
    }, 100);
});