// =========================================================================
// FILE: shared/js/spottio-report-service.js
// Sistema Universale di Segnalazione (Post, Flashspot, Messaggi, Profili) e Ricorsi
// =========================================================================

window.Spottio = window.Spottio || {};

window.SpottioReport = (function() {
    
    const REASONS_BY_TYPE = {
        post: [
            { value: 'spam', label: '🚫 Spam o pubblicità ingannevole' },
            { value: 'harassment', label: '🤬 Molestie, cyberbullismo o odio' },
            { value: 'inappropriate', label: '🔞 Contenuto esplicito o inappropriato' },
            { value: 'violence', label: '⚠️ Violenza o minacce' },
            { value: 'privacy', label: '🕵️ Violazione della privacy / Dati personali' }
        ],
        flashspot: [
            { value: 'inappropriate', label: '🔞 Immagine/Video esplicito o offensivo' },
            { value: 'harassment', label: '🤬 Cyberbullismo o diffamazione nella storia' },
            { value: 'privacy', label: '🕵️ Foto pubblicata senza consenso' },
            { value: 'spam', label: '🚫 Spam o link sospetto' }
        ],
        message: [
            { value: 'harassment', label: '🤬 Insulti, minacce o molestie in chat' },
            { value: 'spam', label: '🚫 Spam, phishing o truffa' },
            { value: 'inappropriate', label: '🔞 Media o linguaggio inappropriato' },
            { value: 'hate', label: '⚡ Incitamento all\'odio' }
        ],
        anon_message: [
            { value: 'harassment', label: '🤬 Molestie o cyberbullismo anonimo' },
            { value: 'threats', label: '⚠️ Minacce o intimidazioni' },
            { value: 'inappropriate', label: '🔞 Contenuto osceno o inappropriato' },
            { value: 'spam', label: '🚫 Spam ripetuto' }
        ],
        profile: [
            { value: 'profile_username', label: '🏷️ Nome utente offensivo o impersonificazione' },
            { value: 'profile_bio', label: '📝 Biografia inappropriata o con link pericolosi' },
            { value: 'profile_avatar', label: '🖼️ Immagine di profilo esplicita o offensiva' },
            { value: 'profile_content', label: '📚 Contenuti pubblicati generalmente offensivi/spam' },
            { value: 'fake_account', label: '🎭 Account falso / Furto d\'identità' }
        ]
    };

    const TYPE_LABELS = {
        post: 'Post',
        flashspot: 'Flashspot (Storia 24h)',
        message: 'Messaggio di Chat',
        anon_message: 'Messaggio Anonimo',
        profile: 'Profilo Utente'
    };

    function getCurrentUserInfo() {
        const uid = (window.useAuthUser && window.useAuthUser().getCurrentUid()) 
            || (window.Spottio && window.Spottio.getCurrentUid && window.Spottio.getCurrentUid()) 
            || localStorage.getItem('currentUid');
        const username = (window.useAuthUser && window.useAuthUser().getCurrentUsername()) 
            || localStorage.getItem('currentUser') 
            || 'Utente';
        return { uid, username };
    }

    function openModal(config = {}) {
        const { uid: reporterUid, username: reporterUsername } = getCurrentUserInfo();
        if (!reporterUid || reporterUid === 'Guest') {
            alert("Devi effettuare l'accesso per inviare una segnalazione.");
            return;
        }

        if (config.authorUid && config.authorUid === reporterUid) {
            alert("Non puoi segnalare un tuo stesso contenuto o profilo.");
            return;
        }

        const existing = document.getElementById('spottio-universal-report-modal');
        if (existing) existing.remove();

        const targetType = config.targetType || 'post';
        const reasons = REASONS_BY_TYPE[targetType] || REASONS_BY_TYPE.post;
        const typeTitle = TYPE_LABELS[targetType] || 'Contenuto';
        const isAnon = targetType === 'anon_message';
        const displayedAuthor = isAnon ? 'Utente Anonimo (Identità cifrata per gli admin)' : `@${config.authorUsername || 'Utente'}`;

        const modal = document.createElement('div');
        modal.id = 'spottio-universal-report-modal';
        modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4 animate-fade-in';

        const reasonsOptionsHtml = reasons.map((r, i) => `
            <label class="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-red-50/50 hover:border-red-200 cursor-pointer transition-colors">
                <input type="radio" name="spottio-report-reason" value="${r.value}" data-label="${r.label}" ${i === 0 ? 'checked' : ''} class="w-4 h-4 text-red-600 focus:ring-red-500">
                <span class="text-xs sm:text-sm font-medium text-gray-800">${r.label}</span>
            </label>
        `).join('');

        modal.innerHTML = `
            <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border border-gray-100 flex flex-col max-h-[90vh]">
                <div class="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                    <div class="flex items-center gap-2.5">
                        <div class="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-lg">🚩</div>
                        <div>
                            <h3 class="text-base font-extrabold text-gray-900">Segnala ${typeTitle}</h3>
                            <p class="text-[11px] text-gray-500 truncate max-w-[240px]">Autore: <strong>${displayedAuthor}</strong></p>
                        </div>
                    </div>
                    <button id="close-report-modal-btn" class="text-gray-400 hover:text-gray-600 text-xl font-bold px-2">×</button>
                </div>

                ${config.contentPreview ? `
                <div class="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 line-clamp-3 italic">
                    "${String(config.contentPreview).substring(0, 180)}"
                </div>` : ''}

                <p class="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Seleziona il motivo:</p>
                <div class="space-y-2 overflow-y-auto pr-1 custom-scrollbar mb-4">
                    ${reasonsOptionsHtml}
                </div>

                <div class="mb-4">
                    <label class="block text-xs font-semibold text-gray-600 mb-1">Dettagli aggiuntivi (opzionale):</label>
                    <textarea id="spottio-report-notes" rows="2" placeholder="Fornisci maggiori dettagli agli amministratori..." class="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"></textarea>
                </div>

                <div class="flex justify-end gap-2 pt-2 border-t border-gray-100">
                    <button id="cancel-report-modal-btn" class="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors">Annulla</button>
                    <button id="submit-report-modal-btn" class="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors flex items-center gap-1.5">
                        <span>Invia Segnalazione</span>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeModal = () => modal.remove();
        modal.querySelector('#close-report-modal-btn').onclick = closeModal;
        modal.querySelector('#cancel-report-modal-btn').onclick = closeModal;
        modal.onclick = (e) => { if (e.target === modal) closeModal(); };

        modal.querySelector('#submit-report-modal-btn').onclick = async () => {
            const submitBtn = modal.querySelector('#submit-report-modal-btn');
            const selectedRadio = modal.querySelector('input[name="spottio-report-reason"]:checked');
            const reasonCode = selectedRadio ? selectedRadio.value : 'other';
            const reasonLabel = selectedRadio ? selectedRadio.getAttribute('data-label') : 'Altro';
            const extraNotes = modal.querySelector('#spottio-report-notes').value.trim();

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>Invio in corso...</span>';

            try {
                const db = window.db || firebase.firestore();
                const payload = {
                    targetType: targetType,
                    targetId: config.targetId || '',
                    postId: (targetType === 'post' || targetType === 'flashspot') ? (config.targetId || '') : '',
                    conversationId: config.conversationId || '',
                    isGroup: !!config.isGroup,
                    authorUid: config.authorUid || '',
                    author: config.authorUsername || (isAnon ? 'Anonimo' : 'Utente'),
                    postAuthor: config.authorUsername || (isAnon ? 'Anonimo' : 'Utente'),
                    reportedBy: reporterUid,
                    reporterUsername: reporterUsername,
                    reasonCode: reasonCode,
                    reason: extraNotes ? `${reasonLabel} — Note: ${extraNotes}` : reasonLabel,
                    contentPreview: config.contentPreview || '',
                    postText: config.contentPreview || '',
                    mediaUrl: config.mediaUrl || '',
                    profileDetails: config.profileDetails || null,
                    status: 'pending',
                    appealStatus: 'none',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                };

                await db.collection('reports').add(payload);

                if (targetType === 'post' && config.targetId) {
                    const postCard = document.querySelector(`[data-post-id="${config.targetId}"]`);
                    if (postCard) postCard.style.display = 'none';
                }

                closeModal();
                alert("Segnalazione inviata con successo. Il team di moderazione prenderà in carico la richiesta.");
            } catch (error) {
                console.error("Errore invio segnalazione:", error);
                alert("Si è verificato un errore durante l'invio della segnalazione.");
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>Invia Segnalazione</span>';
            }
        };
    }

    function openAppealModal(options = {}) {
        const { uid, username } = getCurrentUserInfo();
        const existing = document.getElementById('spottio-appeal-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'spottio-appeal-modal';
        modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4';

        modal.innerHTML = `
            <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border border-gray-100 flex flex-col">
                <div class="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                    <div class="flex items-center gap-2.5">
                        <div class="w-9 h-9 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-lg">⚖️</div>
                        <div>
                            <h3 class="text-base font-extrabold text-gray-900">Invia un Ricorso all'Admin</h3>
                            <p class="text-[11px] text-gray-500">Richiedi una revisione del provvedimento</p>
                        </div>
                    </div>
                    <button id="close-appeal-btn" class="text-gray-400 hover:text-gray-600 text-xl font-bold px-2">×</button>
                </div>

                <p class="text-xs text-gray-600 mb-3 leading-relaxed">
                    Spiega in modo chiaro perché ritieni che la segnalazione o la restrizione ricevuta su <strong>${TYPE_LABELS[options.targetType] || 'Account / Contenuto'}</strong> sia un errore.
                </p>

                <textarea id="spottio-appeal-text" rows="4" placeholder="Scrivi qui la tua motivazione per la revisione dell'amministratore..." class="w-full p-3 rounded-xl bg-gray-50 border border-gray-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none mb-4"></textarea>

                <div class="flex justify-end gap-2">
                    <button id="cancel-appeal-btn" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl">Annulla</button>
                    <button id="submit-appeal-btn" class="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow">Invia Ricorso</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const close = () => modal.remove();
        modal.querySelector('#close-appeal-btn').onclick = close;
        modal.querySelector('#cancel-appeal-btn').onclick = close;

        modal.querySelector('#submit-appeal-btn').onclick = async () => {
            const text = modal.querySelector('#spottio-appeal-text').value.trim();
            if (!text || text.length < 10) {
                alert("Inserisci una motivazione di almeno 10 caratteri.");
                return;
            }

            const btn = modal.querySelector('#submit-appeal-btn');
            btn.disabled = true;
            btn.textContent = 'Invio...';

            try {
                const db = window.db || firebase.firestore();
                await db.collection('appeals').add({
                    userId: options.userId || uid || '',
                    username: options.username || username || 'Utente',
                    reportId: options.reportId || '',
                    targetType: options.targetType || 'account_ban',
                    targetId: options.targetId || '',
                    contentPreview: options.contentPreview || '',
                    reason: options.reason || '',
                    appealText: text,
                    status: 'pending',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                if (options.reportId) {
                    await db.collection('reports').doc(options.reportId).update({
                        appealStatus: 'pending',
                        appealText: text,
                        appealedAt: firebase.firestore.FieldValue.serverTimestamp()
                    }).catch(() => {});
                }

                close();
                alert("Il tuo ricorso è stato registrato e verrà revisionato da un amministratore.");
                if (typeof options.onSuccess === 'function') options.onSuccess();
            } catch (e) {
                console.error("Errore invio ricorso:", e);
                alert("Impossibile inviare il ricorso. Riprova.");
                btn.disabled = false;
                btn.textContent = 'Invia Ricorso';
            }
        };
    }

    /**
     * Inietta il pulsante "Segnala Profilo" ESCLUSIVAMENTE all'interno del contenitore principale del profilo in utente.html,
     * tenendosi rigorosamente alla larga da #sidebar-container e #nav-container.
     */
    function setupUserProfileReportAutoInjection() {
        if (!window.location.pathname.includes('utente.html')) return;

        const injectBtn = () => {
            if (document.getElementById('spottio-report-profile-btn')) return;
            const targetUid = localStorage.getItem('currentUserProfileId');
            const { uid: myUid } = getCurrentUserInfo();
            if (!targetUid || targetUid === myUid) return;

            // Selettore mirato esclusivamente alla card del profilo utente (escludendo sidebar e nav)
            const profileCardArea = document.querySelector('#vue-user-app .bg-white, #vue-user-app .max-w-2xl, main .bg-white');
            if (!profileCardArea || profileCardArea.closest('#sidebar-container') || profileCardArea.closest('#nav-container')) return;

            // Cerca il punto in cui inserirlo (es. accanto ai pulsanti Segui / Messaggio)
            const targetActionContainer = profileCardArea.querySelector('button, .flex.gap-2, .flex.items-center')?.parentElement || profileCardArea;
            if (!targetActionContainer || targetActionContainer.closest('#sidebar-container')) return;

            const btn = document.createElement('button');
            btn.id = 'spottio-report-profile-btn';
            btn.type = 'button';
            btn.className = 'ml-2 p-2 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-xl text-xs font-bold transition-colors inline-flex items-center justify-center gap-1 border border-gray-200 hover:border-red-200 shrink-0';
            btn.title = 'Segnala questo profilo';
            btn.innerHTML = `
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"/>
                </svg>
                <span class="hidden sm:inline">Segnala</span>
            `;

            btn.onclick = async (e) => {
                e.stopPropagation();
                let targetUsername = localStorage.getItem('currentUserProfile') || 'Utente';
                let bio = '';
                let avatarUrl = '';

                try {
                    const doc = await (window.db || firebase.firestore()).collection('users').doc(targetUid).get();
                    if (doc.exists) {
                        const d = doc.data();
                        targetUsername = d.username || targetUsername;
                        bio = d.bio || d.description || '';
                        avatarUrl = d.userPfUri || d.profileImage || '';
                    }
                } catch (err) {}

                openModal({
                    targetType: 'profile',
                    targetId: targetUid,
                    authorUid: targetUid,
                    authorUsername: targetUsername,
                    contentPreview: `Username: @${targetUsername} | Bio: ${bio || 'Nessuna biografia'}`,
                    mediaUrl: avatarUrl,
                    profileDetails: { username: targetUsername, bio, avatarUrl }
                });
            };

            targetActionContainer.appendChild(btn);
        };

        setInterval(injectBtn, 1000);
    }

    document.addEventListener('DOMContentLoaded', () => {
        setupUserProfileReportAutoInjection();
    });

    return {
        openModal,
        openAppealModal
    };
})();

window.Spottio.openReportModal = window.SpottioReport.openModal;
window.Spottio.openAppealModal = window.SpottioReport.openAppealModal;