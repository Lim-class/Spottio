// chat/messages/use-chat-drafts-schedule.js
function useChatDraftsSchedule(activeTargetRef, getCurrentUid, persistMessageCallback, draftPrefix = 'spottio_draft_') {
    const newMessage = Vue.ref('');
    const showScheduleModal = Vue.ref(false);
    const scheduledDateTime = Vue.ref('');

    let currentDraftKey = null;

    const saveCurrentDraft = () => {
        if (!currentDraftKey) return;
        const text = newMessage.value;
        if (text && text.trim().length > 0) {
            localStorage.setItem(currentDraftKey, text);
        } else {
            localStorage.removeItem(currentDraftKey);
        }
    };

    const restoreDraft = (targetId) => {
        if (!targetId) {
            currentDraftKey = null;
            newMessage.value = '';
            return;
        }
        currentDraftKey = `${draftPrefix}${targetId}`;
        const saved = localStorage.getItem(currentDraftKey);
        newMessage.value = saved || '';
    };

    const clearCurrentDraft = () => {
        if (currentDraftKey) {
            localStorage.removeItem(currentDraftKey);
        }
    };

    Vue.watch(newMessage, () => {
        saveCurrentDraft();
    });

    const confirmScheduleMessage = async () => {
        const rawText = newMessage.value.trim();
        const targetObj = activeTargetRef.value;
        const targetId = targetObj ? targetObj.id : null;

        if (!rawText || !scheduledDateTime.value || !targetId) {
            alert("Inserisci un testo e scegli data e ora.");
            return;
        }

        const scheduledTargetDate = new Date(scheduledDateTime.value);
        if (scheduledTargetDate <= new Date()) {
            alert("Seleziona una data e ora futura.");
            return;
        }

        const currentUid = getCurrentUid();
        const isAnonOrGroup = targetObj.isGroup === true || targetObj.authorUid !== undefined;
        const encryptionTargetId = isAnonOrGroup ? targetId : window.Spottio.getConversationId(currentUid, targetId);
        
        // Cifratura Serverless asincrona
        const encryptedText = await window.Spottio.encryptMessage(rawText, encryptionTargetId);

        try {
            await persistMessageCallback(encryptedText, encryptionTargetId, {
                scheduledAt: firebase.firestore.Timestamp.fromDate(scheduledTargetDate)
            });
            newMessage.value = '';
            clearCurrentDraft();
            showScheduleModal.value = false;
            scheduledDateTime.value = '';
            alert("Messaggio programmato con successo!");
        } catch (e) {
            console.error("Errore programmazione messaggio:", e);
            alert("Errore programmazione messaggio.");
        }
    };

    return {
        newMessage,
        showScheduleModal,
        scheduledDateTime,
        saveCurrentDraft,
        restoreDraft,
        clearCurrentDraft,
        confirmScheduleMessage
    };
}