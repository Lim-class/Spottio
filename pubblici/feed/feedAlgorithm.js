// pubblici/algoritmoFeed/feedAlgorithm.js - LOGICA CENTRALE ALGORITMO E FILTRI PRIVACY

window.FeedAlgorithm = {
    cachedPreferences: {},
    followingList: [],

    // Recupera preferenze e lista seguiti
    async loadPreferences() {
        this.cachedPreferences = {};
        this.followingList = [];
        const currentUser = localStorage.getItem('currentUser') || "Guest";
        const userKey = localStorage.getItem('currentUid') || currentUser;

        if (currentUser === "Guest" || currentUser === "null" || !window.db) {
            return this.cachedPreferences;
        }

        try {
            const userDoc = await window.db.collection("users").doc(userKey).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                this.followingList = userData.following || []; 

                if (userData.preferences) {
                    const rawPrefs = userData.preferences;
                    for (const [category, data] of Object.entries(rawPrefs)) {
                        if (typeof data === 'number') {
                            this.cachedPreferences[category] = data;
                            continue;
                        }
                        let currentScore = data.score || 0;
                        if (window.Spottio && typeof window.Spottio.calculatePreferenceDecay === 'function') {
                            currentScore = window.Spottio.calculatePreferenceDecay(currentScore, data.lastUpdate);
                        }
                        this.cachedPreferences[category] = currentScore;
                    }
                }
            }
        } catch (err) {
            console.error("Errore nel recupero dati algoritmo:", err);
        }
        return this.cachedPreferences;
    },

    // Filtra i post privati ottimizzando le letture tramite Pre-Caching dei profili
    async filterPosts(rawPosts, currentUid, feedMode = 'explore') {
        const validPosts = [];
        window.userCache = window.userCache || {};

        // 1. Trova gli autori univoci di cui non abbiamo ancora i dati in cache
        const usersToFetch = new Set();
        rawPosts.forEach(post => {
            const authorId = post.data.user || post.data.author;
            // Fetchiamo tutti per verificare oggettivamente lo status del profilo
            if (authorId && window.userCache[authorId] === undefined) {
                usersToFetch.add(authorId);
            }
        });

        // 2. Scarica i profili mancanti in parallelo per azzerare i tempi d'attesa
        const fetchPromises = Array.from(usersToFetch).map(async (uid) => {
            try {
                const doc = await window.db.collection('users').doc(uid).get();
                if (doc.exists) {
                    const data = doc.data();
                    window.userCache[uid] = {
                        // Resilienza: controlla sia boolean che stringa per sicurezza
                        isPrivate: data.isPrivate === true || data.isPrivate === "true",
                        username: data.username || uid,
                        userPfUri: data.userPfUri || data.profileImageUrl || "",
                        isVerified: data.isVerified === true
                    };
                } else {
                    // Fallback sicuro se l'utente non esiste
                    window.userCache[uid] = { isPrivate: true }; 
                }
            } catch (e) {
                console.error(`Errore recupero utente ${uid}:`, e);
                window.userCache[uid] = { isPrivate: true }; 
            }
        });

        await Promise.all(fetchPromises);

        // 3. Applica il filtro in base al TAB in cui ci troviamo
        for (const post of rawPosts) {
            const authorId = post.data.user || post.data.author;

            if (!authorId) continue; 

            const isPrivate = window.userCache[authorId]?.isPrivate === true;
            
            if (feedMode === 'explore') {
                // [TAB ESPLORA]
                // Rimosso il bypass dell'Admin. In esplora devono apparire SOLO ed ESCLUSIVAMENTE 
                // i post pubblici. Così vedi esattamente ciò che vede il pubblico.
                if (isPrivate === false) {
                    validPosts.push(post);
                }
            } else if (feedMode === 'following') {
                // [TAB SEGUITI]
                // Se Firebase ci ha restituito il post qui, significa che l'autore è nel nostro
                // array 'following'. Lo mostriamo a prescindere che sia pubblico o privato.
                validPosts.push(post);
            }
        }

        return validPosts;
    },

    sortPosts(postsArray) {
        return postsArray.sort((a, b) => {
            const catA = a.data.category || "Generale";
            const catB = b.data.category || "Generale";
            const puntiA = this.cachedPreferences[catA] || 0;
            const puntiB = this.cachedPreferences[catB] || 0;
            
            if (puntiB === puntiA) {
                const timeA = a.data.timestamp ? (typeof a.data.timestamp === 'number' ? a.data.timestamp : (typeof a.data.timestamp.toDate === 'function' ? a.data.timestamp.toDate().getTime() : 0)) : 0;
                const timeB = b.data.timestamp ? (typeof b.data.timestamp === 'number' ? b.data.timestamp : (typeof b.data.timestamp.toDate === 'function' ? b.data.timestamp.toDate().getTime() : 0)) : 0;
                return timeB - timeA;
            }
            return puntiB - puntiA;
        });
    },

    async updateScore(category, points) {
        const currentUser = localStorage.getItem('currentUser') || "Guest";
        const userKey = localStorage.getItem('currentUid') || currentUser;

        if (currentUser === "Guest" || currentUser === "null" || !window.db) return;

        try {
            const userRef = window.db.collection("users").doc(userKey);
            await userRef.set({
                preferences: {
                    [category]: {
                        score: firebase.firestore.FieldValue.increment(points),
                        lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
                    }
                }
            }, { merge: true });
        } catch (err) {
            console.warn("Errore aggiornamento punti:", err);
        }
    }
};