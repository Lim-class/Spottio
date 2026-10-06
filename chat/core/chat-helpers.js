// =========================================================================
// FILE: chat/core/chat-helpers.js
// Gestione Caching Utenti, Sanitizzazione e Rendering Media Chat
// =========================================================================

window.userCache = window.userCache || {};

window.resolveUids = async function(uidArray) {
    const missingUids = Array.from(new Set(uidArray.filter(uid => uid && !window.userCache[uid] && uid !== "Sistema")));
    if (missingUids.length === 0) return;

    const chunkSize = 10;
    for (let i = 0; i < missingUids.length; i += chunkSize) {
        const chunk = missingUids.slice(i, i + chunkSize);
        try {
            const snap = await window.db.collection("users")
                .where(firebase.firestore.FieldPath.documentId(), "in", chunk)
                .get();
            snap.forEach(doc => {
                window.userCache[doc.id] = doc.data();
            });
        } catch (e) {
            console.error("Errore nel resolveUids a lotti:", e);
        }
    }
};

function useChatHelpers() {
    const escapeHtml = (unsafe) => {
        if (!unsafe) return '';
        return String(unsafe)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    const formatMessageContent = (text, isDeleted, isGroup, isMe) => {
        if (isDeleted) {
            const colorClass = isMe ? 'text-white' : 'text-gray-500';
            return `<span class="italic ${colorClass} opacity-80 flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636"></path></svg> Questo messaggio è stato eliminato</span>`;
        }

        if (text.startsWith('image:') || text.startsWith('video:') || text.startsWith('audio:')) {
            const [type, rawUrl] = text.split(/:(.+)/);
            const isSafe = window.SpottioMediaService ? window.SpottioMediaService.isSafeUrl(rawUrl) : (rawUrl && rawUrl.startsWith('https://'));
            
            if (!isSafe) {
                return `<p class="text-xs text-red-400 italic">[Media non valido o non sicuro]</p>`;
            }

            const cleanUrl = encodeURI(rawUrl);
            if (type === 'image') {
                return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer"><img src="${cleanUrl}" class="rounded-xl max-h-60 object-cover cursor-pointer hover:opacity-95 transition-opacity mt-1"></a>`;
            }
            if (type === 'video') {
                return `<video src="${cleanUrl}" controls playsinline class="rounded-xl max-h-60 w-full focus:outline-none mt-1"></video>`;
            }
            if (type === 'audio') {
                return `
                    <div class="my-1.5 flex flex-col gap-1 w-full max-w-[260px] sm:max-w-xs">
                        <audio controls preload="auto" playsinline class="w-full h-9 rounded-lg focus:outline-none">
                            <source src="${cleanUrl}" type="audio/webm">
                            <source src="${cleanUrl}" type="audio/ogg">
                            <source src="${cleanUrl}" type="audio/mp4">
                            <source src="${cleanUrl}" type="audio/mpeg">
                            <source src="${cleanUrl}">
                            Il tuo browser non supporta la riproduzione del vocale.
                        </audio>
                    </div>
                `;
            }
        }

        let safeText = escapeHtml(text);
        if (isGroup) {
            safeText = safeText.replace(/@(\w+)/g, '<span class="text-blue-600 font-bold bg-blue-50 px-1 rounded shadow-sm">@$1</span>');
        }
        return `<p class="text-sm leading-relaxed whitespace-pre-wrap">${safeText}</p>`;
    };

    const formatDateLabel = (date) => {
        const today = new Date(); 
        const yesterday = new Date(); 
        yesterday.setDate(today.getDate() - 1);
        if (date.toDateString() === today.toDateString()) return "Oggi";
        if (date.toDateString() === yesterday.toDateString()) return "Ieri";
        return date.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const getAvatar = (url, name, classes, isGroup) => {
        const safeName = escapeHtml(name || '');
        if (isGroup && url && (window.SpottioMediaService ? window.SpottioMediaService.isSafeUrl(url) : true)) {
            return `<div class="${classes} rounded-full flex items-center justify-center bg-green-500 shrink-0 overflow-hidden border border-gray-100"><img src="${encodeURI(url)}" class="w-full h-full object-cover"></div>`;
        }
        return window.Spottio.getAvatarHtml(url, safeName, classes, isGroup);
    };

    const verifiedIcon = (classes) => window.Spottio.getVerifiedBadge(true, classes);

    return { escapeHtml, formatMessageContent, formatDateLabel, getAvatar, verifiedIcon };
}