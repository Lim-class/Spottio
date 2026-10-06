// shared/js/spottio-media-service.js
window.SpottioMediaService = (function() {
    const ALLOWED_MIME_TYPES = [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'video/mp4', 'video/webm', 'video/quicktime',
        'audio/webm', 'audio/mp3', 'audio/ogg', 'audio/wav', 'audio/mpeg'
    ];

    const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

    const validateFile = (file) => {
        if (!file) {
            return { valid: false, error: "Nessun file selezionato." };
        }
        if (file.size > MAX_SIZE_BYTES) {
            return { valid: false, error: "Il file supera il limite massimo di 25 MB." };
        }
        const isAllowed = ALLOWED_MIME_TYPES.some(type => file.type.startsWith(type.split('/')[0]) || file.type === type);
        if (!isAllowed) {
            return { valid: false, error: "Formato file non supportato." };
        }
        return { valid: true };
    };

    const upload = async (file) => {
        const validation = validateFile(file);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        const uploadFn = window.uploadMediaToCloudinary || (window.Spottio && window.Spottio.uploadToCloudinary);
        if (typeof uploadFn !== 'function') {
            throw new Error("Modulo upload non disponibile. Verificare posta-media.js.");
        }

        try {
            const result = await uploadFn(file);
            if (!result || !result.url) {
                throw new Error("Risposta non valida dal server di upload.");
            }
            return result;
        } catch (err) {
            console.error("SpottioMediaService - Upload Error:", err);
            throw new Error(err.message || "Errore di connessione durante l'upload.");
        }
    };

    const isSafeUrl = (url) => {
        if (!url || typeof url !== 'string') return false;
        try {
            const parsed = new URL(url);
            return (parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
                   (parsed.hostname.includes('cloudinary.com') || parsed.hostname.includes('ibb.co'));
        } catch (e) {
            return false;
        }
    };

    return {
        upload,
        validateFile,
        isSafeUrl
    };
})();