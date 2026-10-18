// =========================================================================
// FILE: api/crypto.js (Vercel Serverless Function)
// Crittografia/Decifratura AES-256-CBC compatibile OpenSSL / CryptoJS
// =========================================================================

if (process.env.NODE_ENV !== 'production') {
    try { require('dotenv').config(); } catch (e) {}
}

const crypto = require('crypto');

// Garantisce sempre la presenza della chiave completa con '#' per cifrare
const PRIMARY_KEY = "Spottio_Master_SecretKey_2026_SecureKey!#";

// Elenco chiavi valide per decifrare (con '#' per tutti i messaggi fino al 17 ott, e senza '#' per quelli creati col .env senza virgolette)
const DECRYPT_KEYS = [
    "Spottio_Master_SecretKey_2026_SecureKey!#",
    "Spottio_Master_SecretKey_2026_SecureKey!"
];

if (process.env.SPOTTIO_MASTER_KEY && !DECRYPT_KEYS.includes(process.env.SPOTTIO_MASTER_KEY.trim())) {
    DECRYPT_KEYS.unshift(process.env.SPOTTIO_MASTER_KEY.trim());
}

function evpBytesToKey(password, salt) {
    let keyAndIv = Buffer.alloc(0);
    let currentHash = Buffer.alloc(0);

    while (keyAndIv.length < 48) {
        const hash = crypto.createHash('md5');
        hash.update(currentHash);
        hash.update(password);
        hash.update(salt);
        currentHash = hash.digest();
        keyAndIv = Buffer.concat([keyAndIv, currentHash]);
    }

    return {
        key: keyAndIv.subarray(0, 32),
        iv: keyAndIv.subarray(32, 48)
    };
}

function encryptAES(text, chatId) {
    if (!text) return '';
    const salt = crypto.randomBytes(8);
    const passphrase = Buffer.from(`${PRIMARY_KEY}_${String(chatId).trim()}`, 'utf-8');
    const { key, iv } = evpBytesToKey(passphrase, salt);

    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([cipher.update(String(text), 'utf-8'), cipher.final()]);
    
    const payload = Buffer.concat([Buffer.from('Salted__', 'utf-8'), salt, encrypted]);
    return payload.toString('base64');
}

function tryOpenSSLDecrypt(encryptedData, passphrase, salt) {
    try {
        const { key, iv } = evpBytesToKey(Buffer.from(passphrase, 'utf-8'), salt);
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
        const utf8 = decrypted.toString('utf-8');
        return utf8 || null;
    } catch (e) {
        return null;
    }
}

function decryptAES(ciphertext, chatId) {
    if (!ciphertext || typeof ciphertext !== 'string') return '';
    const trimmed = ciphertext.trim();
    if (!trimmed.startsWith('U2FsdGVk')) return trimmed;

    try {
        const cleanBase64 = trimmed.replace(/\s/g, '+');
        const raw = Buffer.from(cleanBase64, 'base64');
        if (raw.length < 16) return '[Messaggio non decifrabile]';

        const header = raw.subarray(0, 8).toString('utf-8');
        if (header !== 'Salted__') return '[Messaggio non decifrabile]';

        const salt = raw.subarray(8, 16);
        const encryptedData = raw.subarray(16);
        const cleanChatId = String(chatId).trim();

        // Prova tutte le chiavi (con '#' e senza '#')
        for (const masterKey of DECRYPT_KEYS) {
            const res = tryOpenSSLDecrypt(encryptedData, `${masterKey}_${cleanChatId}`, salt);
            if (res !== null) return res;
        }

        // Prova anche con l'ordine degli UID invertito se necessario
        const parts = cleanChatId.split('_');
        if (parts.length === 2) {
            const invertedChatId = `${parts[1]}_${parts[0]}`;
            for (const masterKey of DECRYPT_KEYS) {
                const res = tryOpenSSLDecrypt(encryptedData, `${masterKey}_${invertedChatId}`, salt);
                if (res !== null) return res;
            }
        }

        return '[Messaggio non decifrabile]';
    } catch (e) {
        return '[Errore decifrazione]';
    }
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metodo non consentito' });
    }

    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) { body = {}; }
    }

    const { action, text, chatId } = body || {};
    if (!action || !chatId) {
        return res.status(400).json({ error: 'Parametri action o chatId mancanti' });
    }

    if (action === 'encrypt') {
        const result = encryptAES(text || '', chatId);
        return res.status(200).json({ result });
    }

    if (action === 'decrypt') {
        const result = decryptAES(text || '', chatId);
        return res.status(200).json({ result });
    }

    return res.status(400).json({ error: 'Azione sconosciuta' });
};