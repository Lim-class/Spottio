// admin.js - Motore Vue 3 per il Pannello di Moderazione (Ricorsi e Segnalazioni)
const { createApp, ref, computed, onMounted } = Vue;

const app = createApp({
    setup() {
        // --- STATO REATTIVO ---
        const isLoadingAuth = ref(true);
        const isAdmin = ref(false);
        const currentTab = ref('reports');
        
        const appeals = ref([]);
        const reports = ref([]);

        // Stato Lingua
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

        // --- GESTORE TRADUZIONI ---
        const t = (key, params = {}) => {
            const normalizedKey = window.getDictionaryKey ? window.getDictionaryKey(currentLang.value) : (currentLang.value.startsWith('ko') ? 'ko' : currentLang.value);
            const dict = (window.segnalazioniTranslations && (window.segnalazioniTranslations[normalizedKey] || window.segnalazioniTranslations['it'])) || {};
            
            let text = dict[key] || key;
            Object.keys(params).forEach(p => {
                text = text.replace(new RegExp(`\\{${p}\\}`, 'g'), params[p]);
            });
            return text;
        };

        // --- INIZIALIZZAZIONE E AUTH ---
        onMounted(() => {
            // Ascolto cambio lingua dinamico
            window.addEventListener('spottio-language-changed', (e) => {
                if (e.detail) {
                    currentLang.value = e.detail;
                }
            });

            const checkDb = setInterval(async () => {
                if (window.db) {
                    clearInterval(checkDb);
                    await verifyAdminStatus();
                }
            }, 200);
        });

        const verifyAdminStatus = async () => {
            const currentUid = localStorage.getItem('currentUid') || localStorage.getItem('currentUser');
            if (!currentUid || currentUid === "null" || currentUid === "Guest") {
                isLoadingAuth.value = false;
                return;
            }

            try {
                const uid = window.Spottio ? (window.Spottio.getCurrentUid() || currentUid) : currentUid;
                const userDoc = await window.db.collection("users").doc(uid).get();
                
                if (userDoc.exists && userDoc.data().isAdmin === true) {
                    currentAdminUid = uid;
                    isAdmin.value = true;
                    setupListeners();
                }
            } catch (error) {
                console.error("Errore verifica privilegi:", error);
            } finally {
                isLoadingAuth.value = false;
            }
        };

        const setupListeners = () => {
            // Listener Ricorsi
            window.db.collection("appeals")
                .where("status", "==", "pending")
                .orderBy("createdAt", "asc")
                .onSnapshot((snapshot) => {
                    appeals.value = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                });

            // Listener Segnalazioni
            window.db.collection("reports")
                .orderBy("timestamp", "desc")
                .onSnapshot((snapshot) => {
                    const newReports = snapshot.docs.map(doc => {
                        const data = doc.data();
                        const id = doc.id;
                        const existingReport = reports.value.find(r => r.id === id);
                        
                        return {
                            id,
                            ...data,
                            postData: existingReport ? existingReport.postData : null,
                            authorProfile: existingReport ? existingReport.authorProfile : null,
                            postCategories: existingReport ? existingReport.postCategories : [],
                            isPostLoading: existingReport ? existingReport.isPostLoading : true,
                            showComments: existingReport ? existingReport.showComments : false
                        };
                    });
                    
                    reports.value = newReports;
                    
                    // Fetch dei post associati
                    reports.value.forEach(async (report) => {
                        if (report.isPostLoading && report.postId) {
                            try {
                                const postDoc = await window.db.collection("posts").doc(report.postId).get();
                                if (postDoc.exists) {
                                    report.postData = postDoc.data();
                                    if (window.Spottio) {
                                        report.postCategories = window.Spottio.getPostCategories(report.postData);
                                        if (report.postData.user) {
                                            report.authorProfile = await window.Spottio.getUserProfile(report.postData.user);
                                        }
                                    }
                                } else {
                                    report.postData = null;
                                }
                            } catch (e) {
                                console.error("Errore fetch post segnalato", e);
                                report.postData = null;
                            } finally {
                                report.isPostLoading = false;
                            }
                        }
                    });
                });
        };

        // --- UTILITY FORMATTAZIONE E LOGICA FEED ---
        const formatTime = (ts) => window.Spottio?.formatTimestamp(ts) || (ts?.toDate ? ts.toDate().toLocaleString(currentLang.value) : new Date().toLocaleString(currentLang.value));
        const getUserAvatarHtml = (uri, name, cls) => window.Spottio?.getAvatarHtml(uri, name, cls) || '';
        const getVerifiedBadge = () => window.Spottio?.getVerifiedBadge(true, "w-4 h-4 text-blue-500 ml-1 inline-block") || '';
        const openMedia = (url) => { if (url) window.open(url, '_blank'); };
        
        const scrollCarousel = (postId, direction) => {
            const el = document.getElementById(`carousel-${postId}`);
            if (el) el.scrollBy({ left: direction * el.clientWidth, behavior: 'smooth' });
        };

        // --- METODI RICORSI ---
        const approveAppeal = async (appeal) => {
            if (!confirm(t('confirmApproveAppeal'))) return;
            try {
                await window.db.collection("users").doc(appeal.uid).update({
                    "banned": { status: false, reason: "", bannedAt: null, bannedUntil: null, bannedBy: null }
                });
                await window.db.collection("appeals").doc(appeal.id).update({ status: "approved" });
                alert(t('appealApprovedSuccess'));
            } catch (e) {
                alert("Errore: " + e.message);
            }
        };

        const rejectAppeal = async (appeal) => {
            if (!confirm(t('confirmRejectAppeal'))) return;
            try {
                await window.db.collection("appeals").doc(appeal.id).update({ status: "rejected" });
            } catch (e) {
                alert("Errore: " + e.message);
            }
        };

        // --- METODI SEGNALAZIONI ---
        const deleteReport = (reportId) => {
            if (confirm(t('confirmDeleteReport'))) {
                window.db.collection("reports").doc(reportId).delete();
            }
        };

        const deletePostAndReport = (postId, reportId) => {
            if (confirm(t('confirmDeletePostAndReport'))) {
                window.db.collection("posts").doc(postId).delete().then(() => {
                    window.db.collection("reports").doc(reportId).delete();
                }).catch(err => alert("Errore: " + err.message));
            }
        };

        const deleteAllReports = async () => {
            if (!confirm(t('confirmDeleteAllReports'))) return;
            try {
                const snapshot = await window.db.collection("reports").get();
                const batch = window.db.batch();
                snapshot.docs.forEach((doc) => batch.delete(doc.ref));
                await batch.commit();
            } catch (err) {
                alert("Errore: " + err.message);
            }
        };

        // --- MODALE BAN ---
        const openBanModal = async (username) => {
            if (!username) {
                alert(t('errorUsernameRequired'));
                return;
            }
            try {
                const cleanUsername = String(username).replace(/^@/, '').trim();
                const userSnap = await window.db.collection("users").where("username", "==", cleanUsername).get();
                if (userSnap.empty) {
                    alert(t('errorUserNotFound'));
                    return;
                }
                
                banModal.value = {
                    show: true,
                    targetUsername: cleanUsername,
                    targetUid: userSnap.docs[0].id,
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
                        reason: banModal.value.reason,
                        bannedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        bannedUntil: bannedUntil,
                        bannedBy: currentAdminUid
                    }
                });
                alert(t('userBannedSuccess'));
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
            currentLang,
            appeals,
            reports,
            banModal,
            t,
            formatTime,
            getUserAvatarHtml,
            getVerifiedBadge,
            openMedia,
            scrollCarousel,
            approveAppeal,
            rejectAppeal,
            deleteReport,
            deletePostAndReport,
            deleteAllReports,
            openBanModal,
            applyBan
        };
    }
});

// Montaggio agganciato al container Vue
app.mount('#vue-admin-app');