// chat/messages/use-chat-drafts-schedule.js
function useChatDraftsSchedule(activeChat, getCurrentUid, persistChatMessage) {
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

    const restoreDraft = (chatId) => {
        currentDraftKey = `spottio_draft_${chatId}`;
        const saved = localStorage.getItem(currentDraftKey);
        newMessage.value = saved || '';
    };

    const clearCurrentDraft = () => {
        if (currentDraftKey) {
            localStorage.removeItem(currentDraftKey);
        }
    };

    const confirmScheduleMessage = async () => {
        const rawText = newMessage.value.trim();
        if (!rawText || !scheduledDateTime.value || !activeChat.value.id) {
            alert("Inserisci un testo e scegli data e ora.");
            return;
        }

        const scheduledTargetDate = new Date(scheduledDateTime.value);
        if (scheduledTargetDate <= new Date()) {
            alert("Seleziona una data e ora futura.");
            return;
        }

        const currentUid = getCurrentUid();
        const targetChatId = activeChat.value.isGroup ? activeChat.value.id : window.Spottio.getConversationId(currentUid, activeChat.value.id);
        const encryptedText = window.Spottio.encryptMessage(rawText, targetChatId);

        try {
            await persistChatMessage(encryptedText, targetChatId, {
                scheduledAt: firebase.firestore.Timestamp.fromDate(scheduledTargetDate)
            });
            newMessage.value = '';
            clearCurrentDraft();
            showScheduleModal.value = false;
            scheduledDateTime.value = '';
            alert("Messaggio programmato con successo!");
        } catch (e) {
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