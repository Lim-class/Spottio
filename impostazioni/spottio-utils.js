// ==========================================
// FILE: impostazioni/spottio-utils.js
// Utility Globali Leggere (Sicurezza, Badge, Avatar, Format Data)
// ==========================================

window.Spottio = window.Spottio || {};

Object.assign(window.Spottio, {
    escape: function(str) {
        if (!str) return '';
        return String(str).replace(/[&<>'"]/g, tag => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        }[tag] || tag));
    },

    getVerifiedBadge: function(isVerified, customClasses = "w-4 h-4 text-blue-500 ml-1 inline-block shrink-0 align-middle") {
        if (!isVerified) return '';
        return `<svg class="${customClasses}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" title="Profilo Verificato"><path fill-rule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307a4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497a4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549a4.49 4.49 0 01-3.498-1.306a4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497a4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" /></svg>`;
    },

    getAvatarHtml: function(avatarUrl, name, customClasses = "w-10 h-10", isGroup = false) {
        const safeName = this.escape(name || "U");
        const initial = safeName.charAt(0).toUpperCase();

        if (isGroup) {
            return `<div class="${customClasses} rounded-full bg-green-500 flex items-center justify-center text-white font-bold shrink-0 shadow-sm border border-gray-100 relative">${initial}<span class="absolute bottom-0 right-0 w-3 h-3 bg-white rounded-full border border-green-500 flex items-center justify-center"><svg class="w-2 h-2 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path></svg></span></div>`;
        }
        if (avatarUrl && avatarUrl.trim() !== "") {
            return `<img src="${this.escape(avatarUrl)}" alt="${safeName}" class="${customClasses} rounded-full object-cover shadow-sm border border-gray-100 shrink-0">`;
        } 
        return `<div class="${customClasses} rounded-full bg-gradient-to-tr from-blue-500 to-blue-300 flex items-center justify-center text-white font-bold shrink-0 shadow-sm border border-gray-100">${initial}</div>`;
    },

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

    getPostCategories: function(postData) {
        if (!postData) return ["Generale"];
        return postData.categories || [postData.category || "Generale"];
    },

    getUserProfile: async function(uid) {
        window.userCache = window.userCache || {};
        if (window.userCache[uid]) return window.userCache[uid];

        try {
            const doc = await window.db.collection("users").doc(uid).get();
            if (doc.exists) {
                const data = doc.data();
                const profile = {
                    username: data.username || uid,
                    userPfUri: data.userPfUri || data.profileImageUrl || "",
                    isVerified: data.isVerified === true,
                    isPrivate: data.isPrivate === true || data.isPrivate === "true"
                };
                window.userCache[uid] = profile;
                return profile;
            }
        } catch (e) {
            console.error("Errore recupero profilo:", e);
        }
        const fallbackProfile = { username: uid, userPfUri: "", isVerified: false, isPrivate: true };
        window.userCache[uid] = fallbackProfile;
        return fallbackProfile;
    },

    getCategoriesList: async function() {
        const list = ["Generale"];
        try {
            const snapshot = await window.db.collection('categories').get();
            snapshot.forEach(doc => {
                const name = doc.data().name;
                if (name && !list.includes(name)) list.push(name);
            });
        } catch (e) {
            console.error("Errore recupero categorie:", e);
        }
        return list;
    },

    formatTimestamp: function(timestamp) {
        if (!timestamp) return '';
        const dateObj = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        const timeStr = dateObj.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        
        if (dateObj.toDateString() === today.toDateString()) return `Oggi alle ${timeStr}`;
        if (dateObj.toDateString() === yesterday.toDateString()) return `Ieri alle ${timeStr}`;
        return dateObj.toLocaleDateString('it-IT') + ' ' + timeStr;
    },

    getPostActionButtons: function(postId, postText, categories, isOwner, isAdmin) {
        if (!isOwner && !isAdmin) return '';
        let safeCategories = Array.isArray(categories) ? JSON.stringify(categories).replace(/"/g, '&quot;') : (categories.startsWith('[') ? categories : JSON.stringify([categories]).replace(/"/g, '&quot;'));
        const safeText = encodeURIComponent(postText || '').replace(/'/g, "%27");

        return `
            <button onclick="window.openEditModal('${postId}', decodeURIComponent('${safeText}'), '${safeCategories}')" class="text-blue-400 hover:text-blue-600 transition p-2 rounded-full hover:bg-blue-50"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
            <button onclick="window.confirmDeletePost('${postId}')" class="text-red-400 hover:text-red-600 transition p-2 rounded-full hover:bg-red-50"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
        `;
    },

    calculatePreferenceDecay: function(score, lastUpdateTimestamp) {
        if (!lastUpdateTimestamp) return score;
        const now = new Date();
        const lastUpdateDate = typeof lastUpdateTimestamp.toDate === 'function' ? lastUpdateTimestamp.toDate() : new Date(lastUpdateTimestamp);
        const diffDays = Math.ceil(Math.abs(now - lastUpdateDate) / (1000 * 60 * 60 * 24));
        
        let currentScore = score || 0;
        if (diffDays >= 30) currentScore = currentScore / Math.pow(2, Math.floor(diffDays / 30));
        return currentScore;
    },

    sharePost: async function(postId, postText) {
        const isHttp = window.location.protocol.startsWith('http');
        const shareUrl = isHttp ? `${window.location.origin}/pubblici/pubblici.html?post=${postId}` : window.location.href.split('?')[0] + `?post=${postId}`;
        const shareTitle = "Guarda questo spot su Spottio!";
        const shareText = postText ? `"${postText.substring(0, 80)}..."` : shareTitle;

        if (isHttp && navigator.share) {
            try { await navigator.share({ title: shareTitle, text: shareText, url: shareUrl }); } catch (err) {}
        } else {
            try {
                await navigator.clipboard.writeText(shareUrl);
                alert("Link dello spot copiato negli appunti! Invialo a chi vuoi.");
            } catch (err) { alert("Impossibile copiare il link negli appunti."); }
        }
    }
});