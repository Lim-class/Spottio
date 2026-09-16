// ==========================================
// FILE: impostazioni/spottio-crypto.js
// Crittografia AES e gestione ID Chat
// ==========================================

window.Spottio = window.Spottio || {};

Object.assign(window.Spottio, {
    SYSTEM_MASTER_KEY: "Spottio_Master_SecretKey_2026_SecureKey!#",
    
    getConversationId: function(uidA, uidB) {
        if (!uidA || !uidB) return null;
        return [uidA, uidB].sort().join('_');
    },

    getChatSecretKey: function(chatId) { 
        return this.SYSTEM_MASTER_KEY + "_" + chatId; 
    },

    encryptMessage: function(text, chatId) {
        if (!text) return '';
        return CryptoJS.AES.encrypt(text, this.getChatSecretKey(chatId)).toString();
    },

    decryptMessage: function(ciphertext, chatId) {
        if (!ciphertext) return '';
        if (!ciphertext.startsWith('U2FsdGVk')) return ciphertext; 
        try {
            const bytes = CryptoJS.AES.decrypt(ciphertext, this.getChatSecretKey(chatId));
            return bytes.toString(CryptoJS.enc.Utf8) || "[Messaggio non decifrabile]";
        } catch (e) {
            return "[Errore decifrazione]";
        }
    }
});