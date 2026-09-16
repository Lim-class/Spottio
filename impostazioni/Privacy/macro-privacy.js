// Privacy/macro-privacy.js
window.SettingsModules = window.SettingsModules || {};

window.SettingsModules.usePrivacy = function({ Vue, t, currentDob }) {
    const { ref, computed } = Vue;

    const isPrivateAccount = ref(false);
    const privacyStatusMsg = ref('');
    const privacyStatusClass = ref('');
    const isExporting = ref(false);
    const breakLimit = ref(localStorage.getItem('spottio_break_limit') || '0');
    const breakStatusMsg = ref(false);

    const isLoadingReports = ref(true);
    const userReports = ref([]);
    const totalPenaltyPoints = ref(0);
    const bannedObj = ref({ status: false, reason: '' });

    const showAppealModal = ref(false);
    const appealReport = ref({});
    const appealText = ref('');
    const isSubmittingAppeal = ref(false);

    const formatReason = (r) => {
        const keyMap = {
            copyright: 'reasonCopyright',
            gdpr: 'reasonGdpr',
            harassment: 'reasonHarassment',
            spam: 'reasonSpam',
            inappropriate: 'reasonInappropriate'
        };
        const key = keyMap[r] || 'reasonOther';
        return t(key, r);
    };

    const formatDate = (tStamp) => window.Spottio?.formatTimestamp(tStamp) || (tStamp?.toDate ? tStamp.toDate().toLocaleString() : '');

    const loadPrivacyState = async (uid) => {
        try {
            const doc = await window.db.collection('users').doc(uid).get();
            if (doc.exists) {
                isPrivateAccount.value = doc.data().isPrivate || false;
                if (currentDob) currentDob.value = doc.data().birthDate || '';
            }
        } catch (e) {}
    };

    const togglePrivacyAccount = async () => {
        const uid = window.SettingsModules.getUid();
        try {
            await window.db.collection('users').doc(uid).set({ isPrivate: isPrivateAccount.value }, { merge: true });
            privacyStatusMsg.value = isPrivateAccount.value ? t('accountPrivateStatus') : t('accountPublicStatus');
            privacyStatusClass.value = `text-sm font-medium mt-3 ${isPrivateAccount.value ? 'text-green-600' : 'text-blue-600'}`;
            setTimeout(() => privacyStatusMsg.value = '', 3000);
        } catch (e) { 
            isPrivateAccount.value = !isPrivateAccount.value; 
        }
    };

    const saveBreakLimit = () => {
        localStorage.setItem('spottio_break_limit', breakLimit.value);
        sessionStorage.removeItem('spottio_break_alerted');
        breakStatusMsg.value = true;
        setTimeout(() => breakStatusMsg.value = false, 2000);
    };

    const exportData = async (format) => {
        isExporting.value = true;
        const uid = window.SettingsModules.getUid();
        const currentUser = localStorage.getItem('currentUser') || t('defaultUserAuthor', 'Utente');
        try {
            const userDoc = await window.db.collection('users').doc(uid).get();
            const userData = userDoc.exists ? userDoc.data() : {};
            const postsQuery = await window.db.collection('posts').where('user', '==', uid).get();
            const userPosts = [];
            postsQuery.forEach(doc => userPosts.push({ id: doc.id, ...doc.data() }));

            const payload = { metadata: { utente: currentUser, data: new Date().toISOString() }, profilo: userData, post_pubblicati: userPosts };
            const blob = new Blob([format === 'json' ? JSON.stringify(payload, null, 2) : "<h1>Export HTML Base</h1>"], { type: format === 'json' ? 'application/json' : 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); 
            a.href = url; 
            a.download = `Spottio_Dati_${currentUser}.${format}`;
            document.body.appendChild(a); 
            a.click(); 
            document.body.removeChild(a); 
            URL.revokeObjectURL(url);
        } catch (e) { 
            alert("Errore Export"); 
        } finally { 
            isExporting.value = false; 
        }
    };

    const loadAccountStatus = async (uid) => {
        const currentUser = localStorage.getItem('currentUser');
        try {
            // 1. Stato Ban
            const userDoc = await window.db.collection('users').doc(uid).get();
            bannedObj.value = userDoc.exists && userDoc.data().banned ? userDoc.data().banned : { status: false, reason: '' };

            // 2. Recupero Report sia per authorUid sia per username/postAuthor
            const reportsMap = new Map();

            // Query 1: tramite authorUid (id fisso)
            try {
                const snapUid = await window.db.collection("reports").where("authorUid", "==", uid).get();
                snapUid.forEach(d => reportsMap.set(d.id, { id: d.id, ...d.data() }));
            } catch (errUid) {
                console.warn("Query authorUid fallita o permessi mancanti:", errUid);
            }

            // Query 2: tramite username (author o postAuthor)
            if (currentUser && currentUser !== 'Guest') {
                try {
                    const snapAuthor = await window.db.collection("reports").where("author", "==", currentUser).get();
                    snapAuthor.forEach(d => {
                        if (!reportsMap.has(d.id)) reportsMap.set(d.id, { id: d.id, ...d.data() });
                    });
                } catch (e1) {}

                try {
                    const snapPostAuthor = await window.db.collection("reports").where("postAuthor", "==", currentUser).get();
                    snapPostAuthor.forEach(d => {
                        if (!reportsMap.has(d.id)) reportsMap.set(d.id, { id: d.id, ...d.data() });
                    });
                } catch (e2) {}
            }

            // Punteggi di default se mancanti nel report
            const defaultScores = {
                harassment: 8,
                spam: 4,
                inappropriate: 10,
                copyright: 6,
                gdpr: 6,
                other: 2
            };

            let pts = 0; 
            const reportsList = [];
            
            reportsMap.forEach((data, repId) => {
                // Se authorScore/riskScore non ci sono nel documento, assegna il punteggio di default del motivo
                let p = data.authorScore !== undefined 
                    ? data.authorScore 
                    : (data.riskScore !== undefined ? data.riskScore : (defaultScores[data.reason] || 4));
                
                pts += p; 
                reportsList.push({ 
                    id: repId, 
                    ...data, 
                    computedPoints: p,
                    postData: null,
                    authorProfile: null,
                    postCategories: [],
                    isPostLoading: true
                });
            });
            
            reportsList.sort((a,b) => {
                const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : (a.timestamp ? new Date(a.timestamp).getTime() : 0);
                const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : (b.timestamp ? new Date(b.timestamp).getTime() : 0);
                return tB - tA;
            });

            userReports.value = reportsList; 
            totalPenaltyPoints.value = pts; 
            isLoadingReports.value = false;

            // 3. Risoluzione dei post collegati
            await Promise.all(reportsList.map(async (rep) => {
                if (!rep.postId || rep.postId === 'profilo_utente') {
                    rep.isPostLoading = false;
                    return;
                }
                try {
                    const pDoc = await window.db.collection("posts").doc(rep.postId).get();
                    if (pDoc.exists) {
                        rep.postData = pDoc.data();
                        if (window.Spottio) {
                            rep.postCategories = window.Spottio.getPostCategories(rep.postData);
                            if (rep.postData.user) {
                                rep.authorProfile = await window.Spottio.getUserProfile(rep.postData.user);
                            }
                        }
                    } else {
                        rep.postData = null;
                    }
                } catch (err) {
                    rep.postData = null;
                } finally {
                    rep.isPostLoading = false;
                }
            }));

        } catch (e) { 
            console.error("Errore generale loadAccountStatus:", e);
            isLoadingReports.value = false; 
        }
    };

    const accountStatus = computed(() => {
        if (bannedObj.value.status) {
            return {
                badge: `<span class="text-red-700 bg-red-100 px-2 py-1 rounded text-xs font-bold">${t('statusSuspended')}</span>`,
                desc: t('descSuspended'),
                color: 'bg-red-600'
            };
        }
        if (totalPenaltyPoints.value >= 12) {
            return {
                badge: `<span class="text-amber-800 bg-amber-100 px-2 py-1 rounded text-xs font-bold">${t('statusHighRisk')}</span>`,
                desc: t('descHighRisk'),
                color: 'bg-amber-500'
            };
        }
        if (totalPenaltyPoints.value > 0) {
            return {
                badge: `<span class="text-blue-800 bg-blue-100 px-2 py-1 rounded text-xs font-bold">${t('statusStrikes')}</span>`,
                desc: t('descStrikes'),
                color: 'bg-blue-500'
            };
        }
        return {
            badge: `<span class="text-emerald-800 bg-emerald-100 px-2 py-1 rounded text-xs font-bold">${t('statusOk')}</span>`,
            desc: t('descOk'),
            color: 'bg-emerald-500'
        };
    });

    const openPostAppealModal = (report) => {
        appealReport.value = {
            id: report.id,
            postId: report.postId,
            reason: report.reason,
            reasonPreview: formatReason(report.reason).toUpperCase()
        };
        appealText.value = ''; 
        showAppealModal.value = true;
    };

    const openGeneralAppealModal = () => {
        appealReport.value = {
            id: 'ACCOUNT_BAN',
            postId: 'ACCOUNT',
            reason: bannedObj.value.reason,
            reasonPreview: t('appealGeneralPreview')
        };
        appealText.value = ''; 
        showAppealModal.value = true;
    };

    const submitAppeal = async () => {
        isSubmittingAppeal.value = true;
        try {
            await window.db.collection("appeals").add({
                type: appealReport.value.id === 'ACCOUNT_BAN' ? "account_ban" : "post_strike",
                reportId: appealReport.value.id, 
                postId: appealReport.value.postId, 
                uid: localStorage.getItem('currentUid'), 
                username: localStorage.getItem('currentUser'),
                appealText: appealText.value, 
                status: "pending", 
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert(t('appealSuccessAlert')); 
            showAppealModal.value = false;
        } catch (e) { 
            alert("Errore"); 
        } finally { 
            isSubmittingAppeal.value = false; 
        }
    };

    return {
        isPrivateAccount,
        privacyStatusMsg,
        privacyStatusClass,
        isExporting,
        breakLimit,
        breakStatusMsg,
        isLoadingReports,
        userReports,
        totalPenaltyPoints,
        bannedObj,
        accountStatus,
        formatReason,
        formatDate,
        showAppealModal,
        appealReport,
        appealText,
        isSubmittingAppeal,
        loadPrivacyState,
        togglePrivacyAccount,
        saveBreakLimit,
        exportData,
        loadAccountStatus,
        openPostAppealModal,
        openGeneralAppealModal,
        submitAppeal
    };
};