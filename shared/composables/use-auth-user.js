// =========================================================================
// FILE: shared/composables/use-auth-user.js
// Stato Utente Reattivo Centralizzato (Vue 3 + Vanilla JS) e Auto-Migrazione
// =========================================================================

window.Spottio = window.Spottio || {};

(function() {
    let authState = null;
    let isInitialized = false;
    const readyCallbacks = [];

    function ensureReactiveState() {
        if (authState) return authState;

        const initialUid = localStorage.getItem('currentUid') || null;
        const initialUsername = localStorage.getItem('currentUser') || '';

        if (typeof window.Vue !== 'undefined' && Vue.ref) {
            authState = {
                uid: Vue.ref(initialUid),
                username: Vue.ref(initialUsername),
                isAdmin: Vue.ref(false),
                isVerified: Vue.ref(false),
                avatarUrl: Vue.ref(''),
                userData: Vue.ref(null),
                isReady: Vue.ref(false)
            };
        } else {
            authState = {
                uid: { value: initialUid },
                username: { value: initialUsername },
                isAdmin: { value: false },
                isVerified: { value: false },
                avatarUrl: { value: '' },
                userData: { value: null },
                isReady: { value: false }
            };
        }
        return authState;
    }

    function notifyReady(userPayload) {
        while (readyCallbacks.length > 0) {
            const cb = readyCallbacks.shift();
            try { cb(userPayload); } catch (e) { console.error(e); }
        }
    }

    function initAuthListener() {
        if (isInitialized) return;
        const state = ensureReactiveState();

        const waitForFirebase = setInterval(() => {
            const authInstance = window.auth || (window.firebase && firebase.auth && firebase.auth());
            const dbInstance = window.db || (window.firebase && firebase.firestore && firebase.firestore());

            if (authInstance && dbInstance) {
                clearInterval(waitForFirebase);
                isInitialized = true;

                authInstance.onAuthStateChanged(async (firebaseUser) => {
                    if (!firebaseUser) {
                        state.uid.value = null;
                        state.username.value = '';
                        state.isAdmin.value = false;
                        state.isVerified.value = false;
                        state.avatarUrl.value = '';
                        state.userData.value = null;
                        state.isReady.value = true;
                        notifyReady(null);
                        return;
                    }

                    state.uid.value = firebaseUser.uid;
                    localStorage.setItem('currentUid', firebaseUser.uid);

                    try {
                        const docRef = dbInstance.collection('users').doc(firebaseUser.uid);
                        const doc = await docRef.get();

                        if (doc.exists) {
                            const data = doc.data();
                            const uname = data.username || state.username.value || 'Utente';

                            state.username.value = uname;
                            state.isAdmin.value = data.isAdmin === true;
                            state.isVerified.value = data.isVerified === true;
                            state.avatarUrl.value = data.userPfUri || data.profileImageUrl || data.profileImage || '';
                            state.userData.value = { id: doc.id, ...data };

                            localStorage.setItem('currentUser', uname);

                            // Popola anche la userCache globale per evitare letture duplicate
                            window.userCache = window.userCache || {};
                            window.userCache[firebaseUser.uid] = data;

                            // Auto-normalizzazione silenziosa di username_lower per ricerche veloci
                            const expectedLower = uname.toLowerCase().trim();
                            if (data.username_lower !== expectedLower) {
                                docRef.update({ username_lower: expectedLower }).catch(() => {});
                            }
                        }
                    } catch (err) {
                        console.warn('Errore sincronizzazione profilo in useAuthUser:', err);
                    } finally {
                        state.isReady.value = true;
                        notifyReady({
                            uid: state.uid.value,
                            username: state.username.value,
                            isAdmin: state.isAdmin.value,
                            userData: state.userData.value
                        });
                    }
                });
            }
        }, 30);
    }

    window.useAuthUser = function() {
        const state = ensureReactiveState();
        initAuthListener();

        const getCurrentUid = () => state.uid.value;
        const getCurrentUsername = () => state.username.value;

        const onAuthReady = (callback) => {
            if (state.isReady.value) {
                callback(state.uid.value ? {
                    uid: state.uid.value,
                    username: state.username.value,
                    isAdmin: state.isAdmin.value,
                    userData: state.userData.value
                } : null);
            } else {
                readyCallbacks.push(callback);
            }
        };

        return {
            ...state,
            getCurrentUid,
            getCurrentUsername,
            onAuthReady
        };
    };

    // Espone anche su window.Spottio
    window.Spottio.useAuthUser = window.useAuthUser;
})();