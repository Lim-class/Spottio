// Impostazioni-Avanzate/macro-avanzate.component.js
window.SettingsComponents = window.SettingsComponents || {};

window.SettingsComponents.MacroAvanzate = {
    props: ['searchQuery', 'activeMacro', 'activeSection', 'isAdmin', 't'],
    emits: ['toggle-macro', 'toggle-section'],
    setup(props, { emit }) {
        const { ref, computed } = Vue;

        const showDeleteModal = ref(false);
        const isDeleting = ref(false);
        const deleteProgressMsg = ref('');
        const isExportingPreDelete = ref(false);

        const isOpen = computed(() => {
            if (props.searchQuery && props.searchQuery.trim() !== '') return true;
            return props.activeMacro === 'avanzate';
        });

        const isSectionOpen = (sectKey) => {
            if (props.searchQuery && props.searchQuery.trim() !== '') return true;
            return props.activeSection === sectKey;
        };

        const performLogout = () => {
            if (window.auth) {
                window.auth.signOut()
                    .then(() => window.location.href = '../index.html')
                    .catch(e => alert('Errore: ' + e.message));
            }
        };

        const exportPreDelete = async (format) => {
            isExportingPreDelete.value = true;
            try {
                const uid = window.SettingsModules ? window.SettingsModules.getUid() : localStorage.getItem('currentUid');
                const username = localStorage.getItem('currentUser') || 'Utente';
                if (window.SpottioExport) {
                    if (format === 'json') {
                        await window.SpottioExport.downloadAsJson(uid, username);
                    } else {
                        await window.SpottioExport.downloadAsHtml(uid, username);
                    }
                }
            } catch (err) {
                alert("Errore durante il download dell'archivio.");
            } finally {
                isExportingPreDelete.value = false;
            }
        };

        const obliterateUserAccount = async (uid, username) => {
            const db = window.db;

            // 1. RIMOZIONE COMMENTI DA TUTTI I POST ALTRUI (tramite commented_posts)
            deleteProgressMsg.value = "Rimozione di tutti i commenti lasciati...";
            try {
                const commentedSnap = await db.collection("users").doc(uid).collection("commented_posts").get();
                for (let docSnap of commentedSnap.docs) {
                    const postId = docSnap.id;
                    const postRef = db.collection("posts").doc(postId);
                    const postDoc = await postRef.get();
                    if (postDoc.exists) {
                        const comments = postDoc.data().comments || [];
                        const filtered = comments.filter(c => c.user !== uid && c.userId !== uid);
                        if (filtered.length !== comments.length) {
                            await postRef.update({ comments: filtered });
                        }
                    }
                    await docSnap.ref.delete();
                }
            } catch (err) {
                console.warn("Errore pulizia commenti:", err);
            }

            // 2. RIMOZIONE LIKE DA TUTTI I POST ALTRUI (tramite liked_posts)
            deleteProgressMsg.value = "Rimozione di tutti i like messi...";
            try {
                const likedSnap = await db.collection("users").doc(uid).collection("liked_posts").get();
                for (let docSnap of likedSnap.docs) {
                    const postId = docSnap.id;
                    const postRef = db.collection("posts").doc(postId);
                    await postRef.update({
                        likes: firebase.firestore.FieldValue.arrayRemove(uid)
                    }).catch(() => {});
                    if (username) {
                        await postRef.update({
                            likes: firebase.firestore.FieldValue.arrayRemove(username)
                        }).catch(() => {});
                    }
                    await docSnap.ref.delete();
                }
            } catch (err) {
                console.warn("Errore pulizia like:", err);
            }

            // 3. RIMOZIONE RELAZIONI SOCIALI
            deleteProgressMsg.value = "Rimozione relazioni sociali (follower e seguiti)...";
            try {
                const followersOfMe = await db.collection("users").where("followers", "array-contains", uid).get();
                const b1 = db.batch();
                followersOfMe.forEach(d => b1.update(d.ref, { followers: firebase.firestore.FieldValue.arrayRemove(uid) }));
                if (!followersOfMe.empty) await b1.commit();

                const followingMe = await db.collection("users").where("following", "array-contains", uid).get();
                const b2 = db.batch();
                followingMe.forEach(d => b2.update(d.ref, { following: firebase.firestore.FieldValue.arrayRemove(uid) }));
                if (!followingMe.empty) await b2.commit();

                const pendingMe = await db.collection("users").where("pending_follows", "array-contains", uid).get();
                const b3 = db.batch();
                pendingMe.forEach(d => b3.update(d.ref, { pending_follows: firebase.firestore.FieldValue.arrayRemove(uid) }));
                if (!pendingMe.empty) await b3.commit();
            } catch (err) {
                console.warn("Errore pulizia relazioni follower:", err);
            }

            // 4. ELIMINAZIONE POST E FLASHSPOT PUBBLICATI DALL'UTENTE
            deleteProgressMsg.value = "Eliminazione spot, storie e contenuti multimediali...";
            try {
                const postsSnap = await db.collection("posts").where("user", "==", uid).get();
                for (let pDoc of postsSnap.docs) {
                    await pDoc.ref.delete();
                }
            } catch (err) {
                console.warn("Errore eliminazione post dell'utente:", err);
            }

            // 5. PULIZIA CHAT PRIVATE E DI GRUPPO
            deleteProgressMsg.value = "Rimozione da conversazioni e gruppi...";
            try {
                const previewsSnap = await db.collection("chat_previews").where("participants", "array-contains", uid).get();
                for (let prevDoc of previewsSnap.docs) {
                    const pData = prevDoc.data();
                    if (!pData.isGroup) {
                        await prevDoc.ref.delete().catch(() => {});
                        await db.collection("chats").doc(prevDoc.id).delete().catch(() => {});
                    } else {
                        await prevDoc.ref.update({
                            participants: firebase.firestore.FieldValue.arrayRemove(uid)
                        }).catch(() => {});
                    }
                }

                const groupsSnap = await db.collection("groups").where("members", "array-contains", uid).get();
                for (let gDoc of groupsSnap.docs) {
                    await gDoc.ref.update({
                        members: firebase.firestore.FieldValue.arrayRemove(uid),
                        [`memberNames.${uid}`]: firebase.firestore.FieldValue.delete()
                    }).catch(() => {});
                }

                const anonSnap = await db.collection("anon_threads").where("participants", "array-contains", uid).get();
                for (let aDoc of anonSnap.docs) {
                    await aDoc.ref.delete().catch(() => {});
                }
            } catch (err) {
                console.warn("Errore pulizia chat e gruppi:", err);
            }

            // 6. RIMOZIONE SEGNALAZIONI INVIATE
            deleteProgressMsg.value = "Pulizia segnalazioni associate...";
            try {
                const reportsMade = await db.collection("reports").where("reportedBy", "==", uid).get();
                for (let rDoc of reportsMade.docs) {
                    await rDoc.ref.delete().catch(() => {});
                }
            } catch (err) {
                console.warn("Errore pulizia report:", err);
            }
        };

        const performDeleteAccount = async () => {
            if (props.isAdmin) return alert("L'account admin non può essere eliminato.");
            const user = window.auth ? window.auth.currentUser : null;
            if (!user || !window.db) return;

            const password = prompt("Per confermare l'eliminazione definitiva e irreversibile dell'account, inserisci la tua password attuale:");
            if (!password) return;

            isDeleting.value = true;
            try {
                deleteProgressMsg.value = "Verifica credenziali...";
                const credential = firebase.auth.EmailAuthProvider.credential(user.email, password);
                await user.reauthenticateWithCredential(credential);

                let username = localStorage.getItem('currentUser') || '';
                const userDoc = await window.db.collection("users").doc(user.uid).get();
                if (userDoc.exists && userDoc.data().username) {
                    username = userDoc.data().username;
                }

                // Pulizia a cascata
                await obliterateUserAccount(user.uid, username);

                // Cancellazione documento e profilo Auth
                deleteProgressMsg.value = "Eliminazione account...";
                await window.db.collection("users").doc(user.uid).delete();
                await user.delete();

                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '../index.html';

            } catch (error) {
                console.error("Errore durante l'eliminazione dell'account:", error);
                isDeleting.value = false;
                deleteProgressMsg.value = '';
                if (error.code === 'auth/wrong-password') {
                    alert("Password errata. Operazione annullata.");
                } else if (error.code === 'auth/too-many-requests') {
                    alert("Troppi tentativi falliti. Riprova più tardi.");
                } else {
                    alert("Errore durante l'eliminazione: " + (error.message || error));
                }
            }
        };

        return {
            showDeleteModal,
            isDeleting,
            deleteProgressMsg,
            isExportingPreDelete,
            isOpen,
            isSectionOpen,
            toggleMacro: () => emit('toggle-macro', 'avanzate'),
            toggleSection: (sectKey) => emit('toggle-section', sectKey),
            exportPreDelete,
            performLogout,
            performDeleteAccount
        };
    },
    template: `
        <div class="macro-category border-b border-transparent py-2">
            <button @click="toggleMacro" class="w-full flex justify-between items-center py-4 focus:outline-none hover:bg-gray-50 rounded-xl px-2 transition-colors">
                <span class="text-2xl font-bold text-gray-800 uppercase tracking-wider">{{ t('macroAdvanced', 'Impostazioni Avanzate') }}</span>
                <span class="transform transition-transform duration-200 text-gray-800" :class="{'rotate-180': isOpen}">▼</span>
            </button>
            <div v-show="isOpen" class="mt-2 pl-4 border-l-2 border-gray-200 pb-2 mb-4">
                
                <!-- Logout -->
                <div class="border-b border-gray-100 py-3">
                    <button @click="toggleSection('logout')" class="w-full flex justify-between items-center py-2 focus:outline-none">
                        <span class="text-xl font-semibold text-red-600">{{ t('logoutBtn', 'Esci dall\\'Account') }}</span>
                        <span class="transform transition-transform duration-200 text-red-600" :class="{'rotate-180': isSectionOpen('logout')}">▼</span>
                    </button>
                    <div v-show="isSectionOpen('logout')" class="mt-4 text-center pb-4">
                        <p class="text-gray-600 mb-6">{{ t('logoutDesc', 'Disconnettendoti dovrai inserire nuovamente le tue credenziali.') }}</p>
                        <button @click="performLogout" class="bg-red-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-600 shadow-md">
                            {{ t('confirmLogoutBtn', 'Conferma Logout') }}
                        </button>
                    </div>
                </div>

                <!-- Elimina Account -->
                <div class="border-b border-transparent py-3">
                    <button @click="toggleSection('delete')" class="w-full flex justify-between items-center py-2 focus:outline-none">
                        <span class="text-xl font-semibold text-red-600">{{ t('deleteAccountTitle', 'Elimina Account') }}</span>
                        <span class="transform transition-transform duration-200 text-red-600" :class="{'rotate-180': isSectionOpen('delete')}">▼</span>
                    </button>
                    <div v-show="isSectionOpen('delete')" class="mt-4 text-center pb-4">
                        <p class="text-gray-600 mb-6">{{ t('deleteAccountDesc', 'Questa azione è irreversibile e rimuoverà ogni singolo dato associato al tuo profilo.') }}</p>
                        <button @click="showDeleteModal = true" :disabled="isAdmin" :class="{'opacity-50 cursor-not-allowed': isAdmin}" class="bg-red-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-600 shadow-md">
                            {{ t('deleteAccountBtn', 'Elimina il mio account') }}
                        </button>
                    </div>
                </div>

            </div>

            <!-- Modale Conferma Elimina Account Incapsulato con Backup Dati -->
            <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center backdrop-blur-sm p-4">
                <div class="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md text-center">
                    <h3 class="text-xl font-bold text-gray-800 mb-2">{{ t('modalTitle', 'Sei sicuro?') }}</h3>
                    <p class="text-gray-600 mb-4 text-xs leading-relaxed">{{ t('modalDesc', 'Tutti i tuoi post, commenti, like, messaggi e relazioni verranno eliminati definitivamente.') }}</p>

                    <!-- Sezione Opzionale Salvataggio Dati Prima dell'Eliminazione -->
                    <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5 text-left">
                        <p class="text-xs font-bold text-blue-900 mb-1">Vuoi salvare una copia dei tuoi dati?</p>
                        <p class="text-[11px] text-blue-700 mb-2">Scarica subito il tuo archivio completo prima che venga cancellato.</p>
                        <div class="flex gap-2">
                            <button type="button" @click="exportPreDelete('json')" :disabled="isExportingPreDelete" class="text-xs font-bold px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50">
                                Scarica JSON
                            </button>
                            <button type="button" @click="exportPreDelete('html')" :disabled="isExportingPreDelete" class="text-xs font-bold px-3 py-1.5 bg-white border border-blue-300 hover:bg-blue-100 text-blue-800 rounded-lg transition disabled:opacity-50">
                                Scarica HTML
                            </button>
                        </div>
                    </div>
                    
                    <div v-if="isDeleting" class="py-4 flex flex-col items-center gap-2">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                        <span class="text-xs text-gray-600 font-semibold animate-pulse">{{ deleteProgressMsg }}</span>
                    </div>

                    <div v-else class="flex justify-between gap-3">
                        <button @click="showDeleteModal = false" class="w-1/2 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-bold transition">{{ t('modalCancelBtn', 'Annulla') }}</button>
                        <button @click="performDeleteAccount" class="w-1/2 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition shadow-sm">
                            {{ t('deleteBtnConfirm', 'Elimina') }}
                        </button>
                    </div>
                </div>
            </div>

        </div>
    `
};