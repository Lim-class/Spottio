// chat/messages/use-chat-messages.js

// 1. Caricamento automatico dei sotto-moduli logici dedicati
(function() {
    const subModules = [
        'messages/use-chat-drafts-schedule.js',
        'messages/use-chat-stream.js',
        'messages/use-chat-actions.js'
    ];

    subModules.forEach(src => {
        document.write(`<script src="${src}"><\/script>`);
    });
})();

// 2. Funzione Coordinatore Principale
function useChatMessages(getCurrentUid, getCurrentUsername, activeChat, formatMessageContent, formatDateLabel) {
    let draftsSchedule = null;

    // Inizializzazione Stream Firestore
    const chatStream = useChatStream(
        getCurrentUid, 
        getCurrentUsername, 
        activeChat, 
        formatMessageContent, 
        formatDateLabel,
        (chatId) => draftsSchedule?.restoreDraft(chatId)
    );

    // Inizializzazione Bozze e Programmazione Invio
    draftsSchedule = useChatDraftsSchedule(
        activeChat, 
        getCurrentUid, 
        (payload, targetId, extra) => chatActions.persistChatMessage(payload, targetId, extra)
    );

    // Inizializzazione Azioni e Media
    const chatActions = useChatActions(getCurrentUid, activeChat, chatStream, draftsSchedule);

    // Helpers UI
    const handleMessagesScroll = (e) => {
        if (e.target.scrollTop === 0 && chatStream.hasMoreMessages.value && !chatStream.isLoadingMore.value) {
            chatStream.loadOlderMessages();
        }
    };

    const stopMessagesStream = () => {
        draftsSchedule.saveCurrentDraft();
        chatStream.stopMessagesStream();
        chatActions.replyingTo.value = null;
    };

    const toggleMsgDropdown = (id) => { 
        chatActions.openDropdownId.value = chatActions.openDropdownId.value === id ? null : id; 
    };

    const startEdit = (msg) => { 
        chatActions.editingMsgId.value = msg.id; 
        chatActions.editMsgText.value = msg.rawText; 
        chatActions.openDropdownId.value = null; 
    };

    const cancelEdit = () => { 
        chatActions.editingMsgId.value = null; 
        chatActions.editMsgText.value = ''; 
    };

    const saveEdit = async (id) => {
        if (!chatActions.editMsgText.value.trim()) return;
        try {
            const currentUid = getCurrentUid();
            let targetChatId = activeChat.value.isGroup ? activeChat.value.id : window.Spottio.getConversationId(currentUid, activeChat.value.id);
            const encryptedText = window.Spottio.encryptMessage(chatActions.editMsgText.value.trim(), targetChatId);
            const docRef = chatStream.getTargetCollection(activeChat.value.id, activeChat.value.isGroup).doc(id);
            await docRef.update({ text: encryptedText, edited: true });
            cancelEdit();
        } catch (e) { alert("Errore modifica."); }
    };

    const startReply = (msg) => {
        chatActions.replyingTo.value = msg;
        chatActions.openDropdownId.value = null;
        Vue.nextTick(() => { document.getElementById('chat-message-input')?.focus(); });
    };

    const cancelReply = () => { chatActions.replyingTo.value = null; };

    const scrollToMessage = (msgId) => {
        const el = document.getElementById(`msg-${msgId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-2', 'ring-blue-400');
            setTimeout(() => el.classList.remove('ring-2', 'ring-blue-400'), 1500);
        }
    };

    const viewMessageInfo = (msg) => {
        chatActions.selectedMsgInfo.value = msg;
        chatActions.showMsgInfoModal.value = true;
        chatActions.openDropdownId.value = null;
    };

    const closeMsgInfoModal = () => {
        chatActions.showMsgInfoModal.value = false;
        chatActions.selectedMsgInfo.value = null;
    };

    // Configurazione Effimeri
    const onEphemeralSelectChange = (e) => {
        const val = e.target.value;
        if (val === 'custom') {
            chatStream.ephemeral.openCustomEphemeralModal();
        } else {
            const duration = Number(val);
            chatStream.ephemeral.ephemeralDuration.value = duration;
            const docRef = chatStream.getChatDocRef();
            if (docRef) {
                docRef.set({ ephemeralDuration: duration }, { merge: true }).catch(() => {});
            }
        }
    };

    const confirmCustomEphemeral = () => {
        chatStream.ephemeral.confirmCustomEphemeral(async (totalSeconds) => {
            const docRef = chatStream.getChatDocRef();
            if (docRef) {
                try {
                    await docRef.set({ ephemeralDuration: totalSeconds }, { merge: true });
                } catch (err) {}
            }
        });
    };

    Vue.onUnmounted(() => {
        stopMessagesStream();
    });

    return {
        // Stream & Messaggi
        messages: chatStream.messages,
        messagesContainer: chatStream.messagesContainer,
        hasMoreMessages: chatStream.hasMoreMessages,
        isLoadingMore: chatStream.isLoadingMore,
        pinnedMessage: chatStream.pinnedMessage,
        startMessagesStream: chatStream.startMessagesStream,
        loadOlderMessages: chatStream.loadOlderMessages,
        handleMessagesScroll,
        stopMessagesStream,

        // Effimeri
        ephemeralDuration: chatStream.ephemeral.ephemeralDuration,
        getEphemeralLabel: chatStream.ephemeral.getEphemeralLabel,
        showCustomEphemeralModal: chatStream.ephemeral.showCustomEphemeralModal,
        customEphemeralValue: chatStream.ephemeral.customEphemeralValue,
        customEphemeralUnit: chatStream.ephemeral.customEphemeralUnit,
        openCustomEphemeralModal: chatStream.ephemeral.openCustomEphemeralModal,
        closeCustomEphemeralModal: chatStream.ephemeral.closeCustomEphemeralModal,
        confirmCustomEphemeral,
        onEphemeralSelectChange,

        // Bozze & Programmazione
        newMessage: draftsSchedule.newMessage,
        showScheduleModal: draftsSchedule.showScheduleModal,
        scheduledDateTime: draftsSchedule.scheduledDateTime,
        confirmScheduleMessage: draftsSchedule.confirmScheduleMessage,

        // Azioni
        isUploadingMedia: chatActions.isUploadingMedia,
        openDropdownId: chatActions.openDropdownId,
        editingMsgId: chatActions.editingMsgId,
        editMsgText: chatActions.editMsgText,
        replyingTo: chatActions.replyingTo,
        showMsgInfoModal: chatActions.showMsgInfoModal,
        selectedMsgInfo: chatActions.selectedMsgInfo,
        mentionResults: chatActions.mentionResults,
        isRecordingAudio: chatActions.audio.isRecordingAudio,
        audioRecordingSeconds: chatActions.audio.audioRecordingSeconds,
        isUploadingAudio: chatActions.audio.isUploadingAudio,
        isViewOnceAudio: chatActions.audio.isViewOnceAudio,
        toggleViewOnceAudio: chatActions.audio.toggleViewOnceAudio,
        handlePlayViewOnceAudio: chatActions.handlePlayViewOnceAudio,
        togglePinMessage: chatActions.togglePinMessage,
        deleteMessageForMe: chatActions.deleteMessageForMe,
        deleteMessageForEveryone: chatActions.deleteMessageForEveryone,
        toggleReaction: chatActions.toggleReaction,
        startAudioRecording: chatActions.startAudioRecording,
        stopAudioRecording: chatActions.audio.stopAudioRecording,
        cancelAudioRecording: chatActions.audio.cancelAudioRecording,
        sendMessage: chatActions.sendMessage,
        sendMediaMessage: chatActions.sendMediaMessage,
        handleMentionInput: chatActions.handleMentionInput,
        insertMention: chatActions.insertMention,
        toggleMsgDropdown,
        startEdit,
        cancelEdit,
        saveEdit,
        startReply,
        cancelReply,
        scrollToMessage,
        viewMessageInfo,
        closeMsgInfoModal
    };
}