// test-decrypt.js
const crypto = require('crypto');

// Il ciphertext del messaggio vecchio
const ciphertextVecchio = "U2FsdGVkX1/S/OX9wRE+J0hbSqnTfVIQVinnpqjGIMU=";

// Le possibili master key usate in precedenza
const MASTER_KEYS = [
    "Spottio_Master_SecretKey_2026_SecureKey!#",
    "Spottio_Master_SecretKey_2026_SecureKey!",
    "Spottio_Master_SecretKey_2025_SecureKey!#",
    "Spottio_SecretKey_2026",
    "SpottioMasterKey",
    "Spottio_2026",
    "Spottio"
];

// Tutte le possibili varianti degli UID (con OO/0I e con/senza underscore)
const uid1_A = "Ue7ZMpPmFCgylbaOOljYhEwX9jl2";
const uid1_B = "Ue7ZMpPmFCgylbaO0IjYhEwX9jl2";
const uid2_A = "dig6gA1GVOUXsKouWzw5GOnfamC2";
const uid2_B = "dig6gA1GVOUXsKouWzw5G0nfamC2";

const chatIds = [
    `${uid1_A}_${uid2_A}`,
    `${uid2_A}_${uid1_A}`,
    `${uid1_B}_${uid2_B}`,
    `${uid2_B}_${uid1_B}`,
    `${uid1_A}${uid2_A}`,
    `${uid2_A}${uid1_A}`,
    `${uid1_B}${uid2_B}`,
    `${uid2_B}${uid1_B}`,
    uid1_A,
    uid2_A,
    uid1_B,
    uid2_B
];

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

function tryDecrypt(cipherStr, pass) {
    try {
        const cleanStr = cipherStr.replace(/\s/g, '+');
        const raw = Buffer.from(cleanStr, 'base64');
        if (raw.subarray(0, 8).toString('utf-8') !== 'Salted__') return null;

        const salt = raw.subarray(8, 16);
        const encryptedData = raw.subarray(16);
        const { key, iv } = evpBytesToKey(Buffer.from(pass, 'utf-8'), salt);

        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
        return decrypted.toString('utf-8');
    } catch (e) {
        return null;
    }
}

let found = false;

for (const mKey of MASTER_KEYS) {
    for (const cId of chatIds) {
        const candidates = [
            `${mKey}_${cId}`,
            `${mKey}${cId}`,
            cId,
            mKey
        ];

        for (const pass of candidates) {
            const res = tryDecrypt(ciphertextVecchio, pass);
            if (res) {
                console.log("\n=========================================");
                console.log("TROVATA LA COMBINAZIONE DEL MESSAGGIO VECCHIO!");
                console.log("Passphrase esatta:", pass);
                console.log("Testo decifrato:", res);
                console.log("=========================================\n");
                found = true;
                break;
            }
        }
        if (found) break;
    }
    if (found) break;
}

if (!found) {
    console.log("\nAncora non trovato con le varianti standard.");
}