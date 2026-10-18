// =========================================================================
// FILE: chat/spottio-crypto.js
// Client Bridge crittografico verso Vercel Serverless API
// =========================================================================

window.Spottio = window.Spottio || {};

Object.assign(window.Spottio, {
    getConversationId: function(uidA, uidB) {
        if (!uidA || !uidB) return null;
        return [uidA, uidB].sort().join('_');
    },

    encryptMessage: async function(text, chatId) {
        if (!text) return '';
        try {
            const response = await fetch('/api/crypto', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'encrypt', text, chatId })
            });
            const data = await response.json();
            return data.result || '';
        } catch (e) {
            console.error("Errore cifratura serverless:", e);
            return text;
        }
    },

    decryptMessage: async function(ciphertext, chatId) {
        if (!ciphertext) return '';
        if (!ciphertext.startsWith('U2FsdGVk')) return ciphertext;
        try {
            const response = await fetch('/api/crypto', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'decrypt', text: ciphertext, chatId })
            });
            const data = await response.json();
            return data.result || '[Messaggio non decifrabile]';
        } catch (e) {
            console.error("Errore decifratura serverless:", e);
            return '[Errore decifrazione]';
        }
    }
});