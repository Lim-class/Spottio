// =========================================================================
// FILE: shared/js/spottio-user-utils.js
// Utility Utente: Avatar, Profili, Relazioni (Follow/Pending) & Flashspot
// =========================================================================

window.Spottio = window.Spottio || {};

Object.assign(window.Spottio, {
    getVerifiedBadge: function(isVerified, customClasses = "w-4 h-4 text-blue-500 ml-1 inline-block shrink-0 align-middle") {
        if (!isVerified) return '';
        return `<svg class="${customClasses}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" title="Profilo Verificato"><path fill-rule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307a4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497a4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549a4.49 4.49 0 01-3.498-1.306a4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497a4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" /></svg>`;
    },

    useVerifiedBadges: function() {
        const { computed } = Vue;
        const verifiedBadgeIcon = computed(() => window.Spottio?.getVerifiedBadge(true, "w-5 h-5 text-blue-500 ml-1 inline-block align-middle") || '');
        const verifiedBadgeIconSmall = computed(() => window.Spottio?.getVerifiedBadge(true, "w-4 h-4 text-blue-500 ml-1 inline-block align-middle") || '');
        return { verifiedBadgeIcon, verifiedBadgeIconSmall };
    },

    getAvatarClasses: function(hasStories, isLocked = false) {
        if (isLocked) {
            return {
                wrapper: "relative shrink-0 select-none pointer-events-none",
                img: "w-20 h-20 rounded-2xl object-cover shadow-md border border-gray-100 bg-gray-100"
            };
        }
        if (hasStories) {
            return {
                wrapper: "relative cursor-pointer p-[3px] rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 shrink-0",
                img: "w-20 h-20 rounded-full object-cover border-2 border-white shadow-md"
            };
        }
        return {
            wrapper: "relative cursor-pointer shrink-0",
            img: "w-20 h-20 rounded-2xl object-cover shadow-md border border-gray-100"
        };
    },

    navigateToUserProfile: function(uid) {
        if (!uid) return;
        localStorage.setItem('currentUserProfileId', uid);
        window.location.href = `../utente/utente.html?uid=${encodeURIComponent(uid)}`;
    },

    getAvatarHtml: function(avatarUrl, name, customClasses = "w-10 h-10", isGroup = false, hasStories = false) {
        const safeName = this.escape(name || "U");
        const initial = safeName.charAt(0).toUpperCase();
        const borderClass = hasStories ? 'border-2 border-white' : 'border border-gray-100';

        let baseAvatarHtml = '';
        if (isGroup) {
            baseAvatarHtml = `<div class="${customClasses} rounded-full bg-green-500 flex items-center justify-center text-white font-bold shrink-0 shadow-sm ${borderClass} relative">${initial}<span class="absolute bottom-0 right-0 w-3 h-3 bg-white rounded-full border border-green-500 flex items-center justify-center"><svg class="w-2 h-2 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path></svg></span></div>`;
        } else if (avatarUrl && avatarUrl.trim() !== "") {
            baseAvatarHtml = `<img src="${this.escape(avatarUrl)}" alt="${safeName}" class="${customClasses} rounded-full object-cover shadow-sm ${borderClass} shrink-0">`;
        } else {
            baseAvatarHtml = `<div class="${customClasses} rounded-full bg-gradient-to-tr from-blue-500 to-blue-300 flex items-center justify-center text-white font-bold shrink-0 shadow-sm ${borderClass}">${initial}</div>`;
        }

        if (hasStories) {
            return `<div class="p-[2.5px] rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 inline-flex items-center justify-center shrink-0 shadow-sm">${baseAvatarHtml}</div>`;
        }

        return baseAvatarHtml;
    },

    getPostCategories: function(postData) {
        if (!postData) return ["Generale"];
        return postData.categories || [postData.category || "Generale"];
    },

    isFlashspotActive: function(timestamp, duration) {
        if (!timestamp) return false;
        const now = new Date();
        const postTime = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
        const durationVal = duration === 'permanent' ? 24 : (parseInt(duration) || 24);
        const expirationTime = new Date(postTime.getTime() + durationVal * 60 * 60 * 1000);
        return now <= expirationTime;
    },

    hasActiveFlashspot: async function(targetUid, viewerUid = null) {
        if (!targetUid || !window.db) return false;
        
        const currentViewer = viewerUid || this.getCurrentUid();
        const cacheKey = `${targetUid}_${currentViewer}`;
        window._activeFlashspotCache = window._activeFlashspotCache || {};
        const now = Date.now();
        
        if (window._activeFlashspotCache[cacheKey] && (now - window._activeFlashspotCache[cacheKey].checkedAt < 45000)) {
            return window._activeFlashspotCache[cacheKey].hasActive;
        }

        try {
            if (targetUid !== currentViewer) {
                const targetProfile = await this.getUserProfile(targetUid);
                if (targetProfile && targetProfile.isPrivate) {
                    const targetDoc = await window.db.collection("users").doc(targetUid).get();
                    const followers = targetDoc.exists ? (targetDoc.data().followers || []) : [];
                    if (!followers.includes(currentViewer)) {
                        window._activeFlashspotCache[cacheKey] = { hasActive: false, checkedAt: now };
                        return false;
                    }
                }
            }

            const snap = await window.db.collection("posts")
                .where("user", "==", targetUid)
                .limit(20)
                .get();

            let hasActive = false;
            snap.forEach(doc => {
                const data = doc.data();
                if ((data.type === 'flashspot' || data.type === 'story') && window.Spottio.isFlashspotActive(data.timestamp, data.duration)) {
                    hasActive = true;
                }
            });

            window._activeFlashspotCache[cacheKey] = { hasActive, checkedAt: now };
            return hasActive;
        } catch (e) {
            return false;
        }
    },

    getUserProfile: async function(uid) {
        window.userCache = window.userCache || {};
        if (window.userCache[uid]) return window.userCache[uid];

        try {
            const doc = await window.db.collection("users").doc(uid).get();
            if (doc.exists) {
                const data = doc.data();
                const profile = {
                    uid: doc.id,
                    username: data.username || uid,
                    userPfUri: data.userPfUri || data.profileImageUrl || "",
                    isVerified: data.isVerified === true,
                    isPrivate: data.isPrivate === true || data.isPrivate === "true",
                    isAdmin: data.isAdmin === true
                };
                window.userCache[uid] = profile;
                return profile;
            }
        } catch (e) {
            console.error("Errore recupero profilo:", e);
        }
        const fallbackProfile = { uid, username: uid, userPfUri: "", isVerified: false, isPrivate: false };
        window.userCache[uid] = fallbackProfile;
        return fallbackProfile;
    },

    resolveUsersList: async function(uidsArray, viewerUid = null) {
        if (!uidsArray || uidsArray.length === 0) return [];
        try {
            const docs = await Promise.all(uidsArray.map(uid => window.db.collection("users").doc(uid).get()));
            const list = [];
            for (const docSnap of docs) {
                if (docSnap.exists) {
                    const d = docSnap.data();
                    const hasStories = await this.hasActiveFlashspot(docSnap.id, viewerUid);
                    list.push({
                        uid: docSnap.id,
                        username: d.username || "Utente",
                        avatar: d.userPfUri || d.profileImage || "",
                        isVerified: d.isVerified === true,
                        hasStories: hasStories
                    });
                }
            }
            return list;
        } catch (e) {
            console.error("Errore resolveUsersList:", e);
            return [];
        }
    },

    listenToUserProfile: function(uid, fallbackUsername, callback) {
        if (!uid || !window.db) return null;
        return window.db.collection('users').doc(uid).onSnapshot((doc) => {
            if (doc.exists) {
                const d = doc.data();
                const userData = {
                    username: d.username || fallbackUsername || 'Utente Sconosciuto',
                    bio: d.bio || '',
                    userPfUri: d.userPfUri || d.profileImage || "",
                    profileImage: d.profileImage || '',
                    isVerified: d.isVerified === true,
                    isPrivate: d.isPrivate === true,
                    followers: d.followers || [],
                    following: d.following || [],
                    pending_follows: d.pending_follows || []
                };
                callback(userData, true);
            } else {
                callback(null, false);
            }
        }, (e) => console.error("Errore listener profilo:", e));
    },

    relationships: {
        async toggleFollow(currentUid, targetUid, isFollowing, isPending, isTargetPrivate) {
            if (!currentUid || currentUid === 'null' || !targetUid) throw new Error("Utente non autenticato.");
            const targetRef = window.db.collection("users").doc(targetUid);
            const currentRef = window.db.collection("users").doc(currentUid);

            if (window._activeFlashspotCache) {
                delete window._activeFlashspotCache[`${targetUid}_${currentUid}`];
            }

            if (isFollowing) {
                await targetRef.update({ followers: firebase.firestore.FieldValue.arrayRemove(currentUid) });
                await currentRef.set({ following: firebase.firestore.FieldValue.arrayRemove(targetUid) }, { merge: true });
                return { action: 'unfollowed' };
            } else if (isPending) {
                await targetRef.update({ pending_follows: firebase.firestore.FieldValue.arrayRemove(currentUid) });
                return { action: 'cancelled_request' };
            } else {
                if (isTargetPrivate) {
                    await targetRef.update({ pending_follows: firebase.firestore.FieldValue.arrayUnion(currentUid) });
                    return { action: 'requested' };
                } else {
                    await targetRef.update({ followers: firebase.firestore.FieldValue.arrayUnion(currentUid) });
                    await currentRef.set({ following: firebase.firestore.FieldValue.arrayUnion(targetUid) }, { merge: true });
                    return { action: 'followed' };
                }
            }
        },

        async unfollow(currentUid, targetUid) {
            if (window._activeFlashspotCache) {
                delete window._activeFlashspotCache[`${targetUid}_${currentUid}`];
            }
            await window.db.collection("users").doc(currentUid).update({ following: firebase.firestore.FieldValue.arrayRemove(targetUid) });
            await window.db.collection("users").doc(targetUid).update({ followers: firebase.firestore.FieldValue.arrayRemove(currentUid) });
        },

        async removeFollower(currentUid, followerUid) {
            if (window._activeFlashspotCache) {
                delete window._activeFlashspotCache[`${currentUid}_${followerUid}`];
            }
            await window.db.collection("users").doc(currentUid).update({ followers: firebase.firestore.FieldValue.arrayRemove(followerUid) });
            await window.db.collection("users").doc(followerUid).update({ following: firebase.firestore.FieldValue.arrayRemove(currentUid) });
        },

        async acceptFollowRequest(currentUid, requesterUid) {
            if (window._activeFlashspotCache) {
                delete window._activeFlashspotCache[`${currentUid}_${requesterUid}`];
            }
            const currentRef = window.db.collection("users").doc(currentUid);
            const requesterRef = window.db.collection("users").doc(requesterUid);
            await currentRef.update({
                pending_follows: firebase.firestore.FieldValue.arrayRemove(requesterUid),
                followers: firebase.firestore.FieldValue.arrayUnion(requesterUid)
            });
            await requesterRef.set({ following: firebase.firestore.FieldValue.arrayUnion(currentUid) }, { merge: true });
        },

        async rejectFollowRequest(currentUid, requesterUid) {
            await window.db.collection("users").doc(currentUid).update({
                pending_follows: firebase.firestore.FieldValue.arrayRemove(requesterUid)
            });
        }
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
    }
});