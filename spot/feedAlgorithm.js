// spot/algoritmoFeed/feedAlgorithm.js - LOGICA CENTRALE ALGORITMO E FILTRI PRIVACY

window.FeedAlgorithm = {
    cachedPreferences: {},
    followingList: [],

    async loadPreferences() {
        this.cachedPreferences = {};
        this.followingList = [];
        const currentUser = localStorage.getItem('currentUser') || "Guest";
        const userKey = window.Spottio.getCurrentUid() || currentUser;

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
                    let needsDbSync = false;
                    const updatePayload = {};

                    for (const [category, data] of Object.entries(rawPrefs)) {
                        let rawScore = 0;
                        let lastUpdate = null;

                        if (typeof data === 'number') {
                            rawScore = data;
                        } else if (data && typeof data === 'object') {
                            rawScore = data.score || 0;
                            lastUpdate = data.lastUpdate || null;
                        }

                        let decayedScore = rawScore;
                        if (window.Spottio && typeof window.Spottio.calculatePreferenceDecay === 'function' && lastUpdate) {
                            decayedScore = window.Spottio.calculatePreferenceDecay(rawScore, lastUpdate);
                        }

                        if (decayedScore !== rawScore) {
                            needsDbSync = true;
                            updatePayload[`preferences.${category}.score`] = decayedScore;
                            updatePayload[`preferences.${category}.lastUpdate`] = firebase.firestore.FieldValue.serverTimestamp();
                        }

                        this.cachedPreferences[category] = decayedScore;
                    }

                    if (needsDbSync) {
                        try {
                            await window.db.collection("users").doc(userKey).update(updatePayload);
                        } catch (syncErr) {
                            console.warn("Errore sincronizzazione decadimento preferenze su DB:", syncErr);
                        }
                    }
                }
            }
        } catch (err) {
            console.error("Errore nel recupero dati algoritmo:", err);
        }
        return this.cachedPreferences;
    },

    // 4. Controllo Visibilità Singolo Post Unificato
    async canViewPost(authorId, currentUid, feedMode = 'explore') {
        if (!authorId) return false;
        if (feedMode !== 'explore') return true;

        await window.Spottio.getUserProfile(authorId);
        const isPrivate = window.userCache && window.userCache[authorId]?.isPrivate === true;
        const isFollowing = (this.followingList && this.followingList.includes(authorId)) || authorId === currentUid;
        return !isPrivate || isFollowing;
    },

    async filterPosts(rawPosts, currentUid, feedMode = 'explore') {
        const validPosts = [];
        const usersToFetch = new Set();
        
        rawPosts.forEach(post => {
            const authorId = post.data.user;
            if (authorId) usersToFetch.add(authorId);
        });

        const fetchPromises = Array.from(usersToFetch).map(uid => window.Spottio.getUserProfile(uid));
        await Promise.all(fetchPromises);

        for (const post of rawPosts) {
            const authorId = post.data.user;
            const canView = await this.canViewPost(authorId, currentUid, feedMode);
            if (canView) validPosts.push(post);
        }

        return validPosts;
    },

    sortPosts(postsArray) {
        return postsArray.sort((a, b) => {
            const catsA = window.Spottio.getPostCategories(a.data);
            const catsB = window.Spottio.getPostCategories(b.data);
            
            const maxPuntiA = Math.max(...catsA.map(cat => this.cachedPreferences[cat] || 0));
            const maxPuntiB = Math.max(...catsB.map(cat => this.cachedPreferences[cat] || 0));
            
            if (maxPuntiB === maxPuntiA) {
                const timeA = a.data.timestamp ? (typeof a.data.timestamp === 'number' ? a.data.timestamp : (typeof a.data.timestamp.toDate === 'function' ? a.data.timestamp.toDate().getTime() : 0)) : 0;
                const timeB = b.data.timestamp ? (typeof b.data.timestamp === 'number' ? b.data.timestamp : (typeof b.data.timestamp.toDate === 'function' ? b.data.timestamp.toDate().getTime() : 0)) : 0;
                return timeB - timeA;
            }
            return maxPuntiB - maxPuntiA;
        });
    },

    async updateScore(category, points) {
        const currentUser = localStorage.getItem('currentUser') || "Guest";
        const userKey = window.Spottio.getCurrentUid() || currentUser;

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