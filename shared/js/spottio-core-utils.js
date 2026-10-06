// =========================================================================
// FILE: shared/js/spottio-core-utils.js
// Utility Core: Traduzioni, Sessione, Formattazione, Media & Sharing
// =========================================================================

window.Spottio = window.Spottio || {};

Object.assign(window.Spottio, {
    DEFAULT_APP_LOGO: "https://i.ibb.co/b5HgvzCB/Spottio-Logo-2.png",

    escape: function(str) {
        if (!str) return '';
        return String(str).replace(/[&<>'"]/g, tag => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        }[tag] || tag));
    },

    translate: function(key, defaultText, lang) {
        const selectedLang = lang || localStorage.getItem('selectedLanguage') || 'it';
        const dictKey = (typeof window.getDictionaryKey === 'function') ? window.getDictionaryKey(selectedLang) : selectedLang;
        
        if (window.translations && window.translations[dictKey] && window.translations[dictKey][key]) {
            return window.translations[dictKey][key];
        }
        if (window.t && typeof window.t === 'function') {
            const res = window.t(key);
            if (res && res !== key) return res;
        }
        return defaultText;
    },

    useLanguageSync: function(onLangChange) {
        const { ref, onMounted } = Vue;
        const currentLang = ref(localStorage.getItem('selectedLanguage') || 'it');

        onMounted(() => {
            const handleLanguageSwitch = async (event) => {
                const newLang = event?.detail?.lang || localStorage.getItem('selectedLanguage') || 'it';
                currentLang.value = newLang;
                if (typeof onLangChange === 'function') {
                    await onLangChange(newLang);
                }
            };

            window.addEventListener('languageChanged', handleLanguageSwitch);
            window.addEventListener('storage', (e) => {
                if (e.key === 'selectedLanguage') handleLanguageSwitch();
            });
        });

        const translateText = (key, defaultText) => {
            return window.Spottio.translate(key, defaultText, currentLang.value);
        };

        return { currentLang, translateText };
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

    getSession: function() {
        const username = localStorage.getItem('currentUser') || "Guest";
        return {
            uid: this.getCurrentUid() || username,
            username: username,
            isAdmin: localStorage.getItem('isAdmin') === 'true',
            isGuest: !username || username === "Guest" || username === "null"
        };
    },

    onAuthReady: function(callback) {
        const checkAuth = setInterval(() => {
            const authInstance = window.auth || (typeof firebase !== 'undefined' && firebase.auth ? firebase.auth() : null);
            if (authInstance) {
                clearInterval(checkAuth);
                authInstance.onAuthStateChanged((user) => {
                    if (user && user.uid) {
                        localStorage.setItem('currentUid', user.uid);
                    }
                    callback(user);
                });
            }
        }, 100);
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

    calculatePreferenceDecay: function(score, lastUpdateTimestamp) {
        if (!lastUpdateTimestamp) return score;
        const now = new Date();
        const lastUpdateDate = typeof lastUpdateTimestamp.toDate === 'function' ? lastUpdateTimestamp.toDate() : new Date(lastUpdateTimestamp);
        const diffDays = Math.ceil(Math.abs(now - lastUpdateDate) / (1000 * 60 * 60 * 24));
        
        let currentScore = score || 0;
        if (diffDays >= 28) {
            const periods = Math.floor(diffDays / 28);
            currentScore = Math.floor(currentScore / Math.pow(2, periods));
        }
        return currentScore;
    },

    sharePost: async function(postId, postText) {
        const currentPath = window.location.pathname;
        const basePath = currentPath.substring(0, currentPath.lastIndexOf('/'));
        const shareUrl = `${window.location.origin}${basePath}/spot.html?post=${postId}`;
        const shareTitle = "Guarda questo spot su Spottio!";
        const shareText = postText ? `"${postText.substring(0, 80)}..."` : shareTitle;

        if (navigator.share) {
            try {
                await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
                return;
            } catch (err) {
                if (err.name === 'AbortError') return;
            }
        }

        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(shareUrl);
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = shareUrl;
                textArea.style.position = "fixed";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            alert("Link dello spot copiato negli appunti! Invialo a chi vuoi.");
        } catch (err) {
            console.error("Errore durante la copia del link:", err);
            alert("Impossibile copiare il link negli appunti.");
        }
    },

    uploadToCloudinary: async function(file, customTransforms = 'f_auto,q_auto') {
        if (!file) return null;
        const cloudName = "c32kn8tz";
        const uploadPreset = "spottio_preset";

        const isVideo = file.type ? file.type.startsWith('video/') : false;
        const isAudio = file.type ? file.type.startsWith('audio/') : false;
        const resourceType = (isVideo || isAudio) ? "video" : "image";
        
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
            method: "POST", 
            body: formData
        });

        if (!response.ok) {
            const errorDetails = await response.json().catch(() => ({}));
            console.error("Dettaglio errore Cloudinary:", errorDetails);
            throw new Error("Errore durante l'upload del media.");
        }

        const data = await response.json();
        let finalUrl = data.secure_url;

        if (!isAudio && !isVideo && customTransforms) {
            finalUrl = finalUrl.replace('/upload/', `/upload/${customTransforms}/`);
        }

        return { 
            url: finalUrl, 
            isVideo: isVideo,
            isAudio: isAudio
        };
    }
});