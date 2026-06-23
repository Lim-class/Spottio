// ==========================================
// FILE: impostazioni/spottio-utils.js
// Utility Globali (Spunta Blu, Sicurezza XSS, Avatar, UID)
// ==========================================

window.Spottio = {
    // 1. Sicurezza XSS
    escape: function(str) {
        if (!str) return '';
        return String(str).replace(/[&<>'"]/g, tag => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        }[tag] || tag));
    },

    // 2. Badge Verificato
    getVerifiedBadge: function(isVerified, customClasses = "w-4 h-4 text-blue-500 ml-1 inline-block shrink-0 align-middle") {
        if (!isVerified) return '';
        return `
            <svg class="${customClasses}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" title="Profilo Verificato">
                <path fill-rule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307a4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497a4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549a4.49 4.49 0 01-3.498-1.306a4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497a4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
            </svg>
        `;
    },

    // 3. Generatore di Avatar
    getAvatarHtml: function(avatarUrl, name, customClasses = "w-10 h-10", isGroup = false) {
        const safeName = this.escape(name || "U");
        const initial = safeName.charAt(0).toUpperCase();

        if (isGroup) {
            return `
                <div class="${customClasses} rounded-full bg-green-500 flex items-center justify-center text-white font-bold shrink-0 shadow-sm border border-gray-100 relative">
                    ${initial}
                    <span class="absolute bottom-0 right-0 w-3 h-3 bg-white rounded-full border border-green-500 flex items-center justify-center">
                        <svg class="w-2 h-2 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path></svg>
                    </span>
                </div>`;
        }

        if (avatarUrl && avatarUrl.trim() !== "") {
            const safeUrl = this.escape(avatarUrl);
            return `<img src="${safeUrl}" alt="${safeName}" class="${customClasses} rounded-full object-cover shadow-sm border border-gray-100 shrink-0">`;
        } 
        
        return `<div class="${customClasses} rounded-full bg-gradient-to-tr from-blue-500 to-blue-300 flex items-center justify-center text-white font-bold shrink-0 shadow-sm border border-gray-100">${initial}</div>`;
    },

    // 4. Recupero sicuro e centralizzato dell'UID Utente
    getCurrentUid: function() {
        let uid = localStorage.getItem('currentUid');
        if (!uid && typeof window !== 'undefined') {
            const authInstance = window.auth || (typeof firebase !== 'undefined' ? firebase.auth() : null);
            if (authInstance && authInstance.currentUser) {
                uid = authInstance.currentUser.uid;
                localStorage.setItem('currentUid', uid); 
            }
        }
        return uid;
    },

    // 5. NUOVO: Generatore di ID Stanza Univoco per Chat Private (DM)
    getConversationId: function(uidA, uidB) {
        if (!uidA || !uidB) return null;
        // Ordina alfabeticamente i due UID e li unisce con un trattino basso
        return [uidA, uidB].sort().join('_');
    },

    // 6. Formattatore universale di timestamp di Firebase
    formatTimestamp: function(timestamp) {
        if (!timestamp) return '';
        const dateObj = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
        
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        
        const timeStr = dateObj.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        
        if (dateObj.toDateString() === today.toDateString()) {
            return `Oggi alle ${timeStr}`;
        } else if (dateObj.toDateString() === yesterday.toDateString()) {
            return `Ieri alle ${timeStr}`;
        } else {
            return dateObj.toLocaleDateString('it-IT') + ' ' + timeStr;
        }
    },

    // 7. Generatore pulsanti di gestione (Modifica/Elimina) per i Post
    getPostActionButtons: function(postId, postText, postCategory, isOwner, isAdmin) {
        if (!isOwner && !isAdmin) return '';

        const safeCategory = this.escape(postCategory || "Generale");
        const safeText = encodeURIComponent(postText || '').replace(/'/g, "%27");

        const editBtn = `<button onclick="window.openEditModal('${postId}', decodeURIComponent('${safeText}'), '${safeCategory}')" class="text-blue-400 hover:text-blue-600 transition p-2 rounded-full hover:bg-blue-50"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>`;
        const deleteBtn = `<button onclick="window.confirmDeletePost('${postId}')" class="text-red-400 hover:text-red-600 transition p-2 rounded-full hover:bg-red-50"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>`;
        
        return editBtn + deleteBtn;
    },

    // 8. Calcolatore del decadimento per l'algoritmo delle preferenze (ogni 30 giorni)
    calculatePreferenceDecay: function(score, lastUpdateTimestamp) {
        if (!lastUpdateTimestamp) return score;
        
        const now = new Date();
        const lastUpdateDate = typeof lastUpdateTimestamp.toDate === 'function' 
            ? lastUpdateTimestamp.toDate() 
            : new Date(lastUpdateTimestamp);
            
        const diffTime = Math.abs(now - lastUpdateDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let currentScore = score || 0;
        if (diffDays >= 30) {
            const decayCycles = Math.floor(diffDays / 30);
            currentScore = currentScore / Math.pow(2, decayCycles);
        }
        return currentScore;
    }
};