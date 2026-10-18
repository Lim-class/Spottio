// =========================================================================
// FILE: segnalazioni/admin.js
// Motore Vue 3 per il Pannello Moderazione Multi-Contenuto e Revisione Ricorsi
// =========================================================================

const { createApp, ref, computed, onMounted } = Vue;

const app = createApp({
    setup() {
        const isLoadingAuth = ref(true);
        const isAdmin = ref(false);
        const currentTab = ref('reports');
        const activeTypeFilter = ref('all');
        
        const appeals = ref([]);
        const reports = ref([]);

        const currentLang = ref(localStorage.getItem('selectedLanguage') || 'it');

        const banModal = ref({
            show: false,
            targetUsername: '',
            targetUid: '',
            reason: '',
            durationHours: 'permanent',
            loading: false
        });

        let currentAdminUid = null;

        const filterTypes = [
            { id: 'all', label: 'Tutte' },
            { id: 'post', label: '📌 Post' },
            { id: 'flashspot', label: '⚡ Flashspot' },
            { id: 'messages', label: '💬 Chat & Anonimo' },
            { id: 'profile', label: '👤 Profili' }
        ];

        const filteredReports = computed(() => {
            if (activeTypeFilter.value === 'all') return reports.value;
            if (activeTypeFilter.value === 'messages') {
                return reports.value.filter(r => r.targetType === 'message' || r.targetType === 'anon_message');
            }
            if (activeTypeFilter.value === 'post') {
                return reports.value.filter(r => !r.targetType || r.targetType === 'post');
            }
            return reports.value.filter(r => r.targetType === activeTypeFilter.value);
        });

        const getTypeBadge = (type) => {
            switch(type) {
                case 'flashspot':
                    return { label: '⚡ Flashspot', classes: 'bg-amber-100 text-amber-800 border-amber-200' };
                case 'message':
                    return { label: '💬 Messaggio', classes: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
                case 'anon_message':
                    return { label: '🕵️ Anonimo', classes: 'bg-purple-100 text-purple-800 border-purple-200' };
                case 'profile':
                    return { label: '👤 Profilo', classes: 'bg-rose-100 text-rose-800 border-rose-200' };
                default:
                    return { label: '📌 Post', classes: 'bg-blue-100 text-blue-800 border-blue-200' };
            }
        };

        const t = (key, params = {}) => {
            const normalizedKey = window.getDictionaryKey ? window.getDictionaryKey(currentLang.value) : (currentLang.value.startsWith('ko') ? 'ko' : currentLang.value);
            const dict = (window.segnalazioniTranslations && (window.segnalazioniTranslations[normalizedKey] || window.segnalazioniTranslations['it'])) || {};
            
            let text = dict[key] || key;
            Object.keys(params).forEach(p => {
                text = text.replace(new RegExp(`\\{${p}\\}`, 'g'), params[p]);
            });
            return text;
        };

        onMounted(() => {
            window.addEventListener('spottio-language-changed', (e) => {
                if (e.detail) currentLang.value = e.detail;
            });

            // Sfrutta useAuthUser se disponibile, altrimenti listener nativo
            if (window.useAuthUser) {
                const authUser = window.useAuthUser();
                authUser.onAuthReady(async (u) => {
                    if (u && u.isAdmin) {
                        currentAdminUid = u.uid;
                        isAdmin.value = true;
                        setupListeners();
                    }
                    isLoadingAuth.value = false;
                });
            } else {
                const checkDb = setInterval(async () => {
                    if (window.db) {
                        clearInterval(checkDb);
                        await verifyAdminStatus();
                    }
                }, 150);
            }
        });

        const verifyAdminStatus = async () => {
            const currentUid = localStorage.getItem('currentUid') || (window.Spottio && window.Spottio.getCurrentUid ? window.Spottio.getCurrentUid() : null);
            if (!currentUid || currentUid === "null" || currentUid === "Guest") {
                isLoadingAuth.value = false;
                return;
            }

            try {
                const userDoc = await window.db.collection("users").doc(currentUid).get();
                if (userDoc.exists && userDoc.data().isAdmin === true) {
                    currentAdminUid = currentUid;
                    isAdmin.value = true;
                    setupListeners();
                }
            } catch (error) {
                console.error("Errore verifica privilegi admin:", error);
            } finally {
                isLoadingAuth.value = false;
            }
        };

        const setupListeners = () => {
            // Listener Ricorsi (Appeals)
            window.db.collection("appeals")
                .where("status", "==", "pending")
                .onSnapshot((snapshot) => {
                    appeals.value = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                }, err => console.warn("Listener ricorsi:", err));

            // Listener Segnalazioni (Reports)
            window.db.collection("reports")
                .orderBy("timestamp", "desc")
                .onSnapshot((snapshot) => {
                    const newReports = snapshot.docs.map(doc => {
                        const data = doc.data();
                        const id = doc.id;
                        const existing = reports.value.find(r => r.id === id);
                        
                        return {
                            id,
                            ...data,
                            postData: existing ? existing.postData : null,
                            authorProfile: existing ? existing.authorProfile : null,
                            postCategories: existing ? existing.postCategories : [],
                            isPostLoading: existing ? existing.isPostLoading : (!data.targetType || data.targetType === 'post'),
                            showComments: existing ? existing.showComments : false
                        };
                    });
                    
                    reports.value = newReports;
                    
                    // Fetch lazy dei dettagli post associati se è una segnalazione di tipo post
                    reports.value.forEach(async (report) => {
                        if (report.isPostLoading && (report.postId || report.targetId)) {
                            const pId = report.postId || report.targetId;
                            try {
                                const postDoc = await window.db.collection("posts").doc(pId).get();
                                if (postDoc.exists) {
                                    report.postData = postDoc.data();
                                    if (window.Spottio) {
                                        report.postCategories = window.Spottio.getPostCategories ? window.Spottio.getPostCategories(report.postData) : [];
                                        if (report.postData.user) {
                                            report.authorProfile = await window.Spottio.getUserProfile(report.postData.user);
                                        }
                                    }
                                } else {
                                    report.postData = null;
                                }
                            } catch (e) {
                                report.postData = null;
                            } finally {
                                report.isPostLoading = false;
                            }
                        }
                    });
                }, err => console.warn("Listener segnalazioni:", err));
        };

        const formatTime = (ts) => {
            if (!ts) return '';
            if (window.Spottio && window.Spottio.formatTimestamp) return window.Spottio.formatTimestamp(ts);
            const date = ts.toDate ? ts.toDate() : new Date(ts);
            return date.toLocaleString(currentLang.value);
        };

        const getUserAvatarHtml = (uri, name, cls) => {
            if (window.Spottio && window.Spottio.getAvatarHtml) {
                return window.Spottio.getAvatarHtml(uri, name, cls);
            }
            return `<div class="${cls} rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">${(name || 'U').charAt(0).toUpperCase()}</div>`;
        };

        const getVerifiedBadge = () => {
            return window.Spottio?.getVerifiedBadge ? window.Spottio.getVerifiedBadge(true, "w-4 h-4 text-blue-500 ml-1 inline-block") : '✓';
        };

        const openMedia = (url) => { if (url) window.open(url, '_blank'); };

        // --- GESTIONE RICORSI ---
        const approveAppeal = async (appeal) => {
            if (!confirm(t('confirmApproveAppeal', 'Confermi di voler accogliere questo ricorso e riabilitare l\'utente?'))) return;
            const targetUid = appeal.userId || appeal.uid;
            try {
                if (targetUid) {
                    await window.db.collection("users").doc(targetUid).update({
                        "banned": { status: false, reason: "", bannedAt: null, bannedUntil: null, bannedBy: null }
                    });
                }
                await window.db.collection("appeals").doc(appeal.id).update({
                    status: "approved",
                    reviewedBy: currentAdminUid,
                    reviewedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                if (appeal.reportId) {
                    await window.db.collection("reports").doc(appeal.reportId).update({
                        appealStatus: "approved",
                        status: "resolved_appeal_approved"
                    }).catch(() => {});
                }
                alert(t('appealApprovedSuccess', 'Ricorso accolto con successo!'));
            } catch (e) {
                alert("Errore: " + e.message);
            }
        };

        const rejectAppeal = async (appeal) => {
            if (!confirm(t('confirmRejectAppeal', 'Confermi di voler respingere questo ricorso?'))) return;
            try {
                await window.db.collection("appeals").doc(appeal.id).update({
                    status: "rejected",
                    reviewedBy: currentAdminUid,
                    reviewedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                if (appeal.reportId) {
                    await window.db.collection("reports").doc(appeal.reportId).update({
                        appealStatus: "rejected"
                    }).catch(() => {});
                }
            } catch (e) {
                alert("Errore: " + e.message);
            }
        };

        // --- GESTIONE SEGNALAZIONI & RIMOZIONE MULTI-CONTENUTO ---
        const deleteReport = async (reportId) => {
            if (confirm(t('confirmDeleteReport', 'Vuoi archiviare ed eliminare questa segnalazione?'))) {
                await window.db.collection("reports").doc(reportId).delete();
            }
        };

        const deleteEntityAndReport = async (report) => {
            if (!confirm("Confermi l'eliminazione definitiva del contenuto segnalato e l'archiviazione del report?")) return;
            
            const type = report.targetType || 'post';
            const db = window.db;

            try {
                // Post o Flashspot
                if (type === 'post' || type === 'flashspot') {
                    const pId = report.targetId || report.postId;
                    if (pId) await db.collection("posts").doc(pId).delete();
                } 
                // Messaggio chat standard
                else if (type === 'message' && report.conversationId && report.targetId) {
                    if (report.isGroup) {
                        await db.collection("groups").doc(report.conversationId).collection("chats").doc(report.targetId).delete();
                    } else {
                        await db.collection("chats").doc(report.conversationId).collection("messages").doc(report.targetId).delete();
                    }
                } 
                // Messaggio chat anonima
                else if (type === 'anon_message' && report.conversationId && report.targetId) {
                    await db.collection("anon_threads").doc(report.conversationId).collection("messages").doc(report.targetId).delete();
                } 
                // Profilo utente
                else if (type === 'profile' && report.authorUid) {
                    await db.collection("users").doc(report.authorUid).update({
                        bio: '',
                        description: '',
                        userPfUri: ''
                    });
                }

                // Elimina infine il report
                await db.collection("reports").doc(report.id).delete();
                alert("Contenuto sanzionato e rimosso con successo!");
            } catch (err) {
                alert("Errore durante l'eliminazione: " + err.message);
            }
        };

        const deleteAllReports = async () => {
            if (!confirm(t('confirmDeleteAllReports', 'Vuoi eliminare tutte le segnalazioni presenti?'))) return;
            try {
                const snapshot = await window.db.collection("reports").get();
                const batch = window.db.batch();
                snapshot.docs.forEach((doc) => batch.delete(doc.ref));
                await batch.commit();
            } catch (err) {
                alert("Errore: " + err.message);
            }
        };

        const resetProfileBio = async (authorUid) => {
            if (!authorUid || !confirm("Svuotare la biografia di questo utente?")) return;
            try {
                await window.db.collection("users").doc(authorUid).update({ bio: '', description: '' });
                alert("Biografia resettata!");
            } catch (e) { alert("Errore: " + e.message); }
        };

        const resetProfileAvatar = async (authorUid) => {
            if (!authorUid || !confirm("Rimuovere l'immagine di profilo di questo utente?")) return;
            try {
                await window.db.collection("users").doc(authorUid).update({ userPfUri: '', profileImage: '' });
                alert("Foto profilo rimossa!");
            } catch (e) { alert("Errore: " + e.message); }
        };

        // --- MODALE BAN ---
        const openBanModal = async (username, fallbackUid = null) => {
            let targetUid = fallbackUid;
            let cleanUsername = username ? String(username).replace(/^@/, '').trim() : '';

            try {
                if (!targetUid && cleanUsername) {
                    const userSnap = await window.db.collection("users").where("username", "==", cleanUsername).get();
                    if (!userSnap.empty) {
                        targetUid = userSnap.docs[0].id;
                    }
                }

                if (!targetUid) {
                    alert(t('errorUserNotFound', 'Utente non trovato nel database.'));
                    return;
                }

                banModal.value = {
                    show: true,
                    targetUsername: cleanUsername || targetUid,
                    targetUid: targetUid,
                    reason: '',
                    durationHours: 'permanent',
                    loading: false
                };
            } catch (error) {
                alert("Errore: " + error.message);
            }
        };

        const applyBan = async () => {
            banModal.value.loading = true;
            let bannedUntil = null;
            
            if (banModal.value.durationHours !== "permanent") {
                let expiryDate = new Date();
                expiryDate.setHours(expiryDate.getHours() + parseInt(banModal.value.durationHours));
                bannedUntil = firebase.firestore.Timestamp.fromDate(expiryDate);
            }

            try {
                await window.db.collection("users").doc(banModal.value.targetUid).update({
                    banned: {
                        status: true,
                        reason: banModal.value.reason || 'Violazione delle regole di Spottio',
                        bannedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        bannedUntil: bannedUntil,
                        bannedBy: currentAdminUid
                    }
                });
                alert(t('userBannedSuccess', 'Utente bannato con successo!'));
                banModal.value.show = false;
            } catch (error) {
                alert("Errore: " + error.message);
            } finally {
                banModal.value.loading = false;
            }
        };

        return {
            isLoadingAuth,
            isAdmin,
            currentTab,
            activeTypeFilter,
            filterTypes,
            filteredReports,
            getTypeBadge,
            currentLang,
            appeals,
            reports,
            banModal,
            t,
            formatTime,
            getUserAvatarHtml,
            getVerifiedBadge,
            openMedia,
            approveAppeal,
            rejectAppeal,
            deleteReport,
            deleteEntityAndReport,
            deleteAllReports,
            resetProfileBio,
            resetProfileAvatar,
            openBanModal,
            applyBan
        };
    }
});

app.mount('#vue-admin-app');