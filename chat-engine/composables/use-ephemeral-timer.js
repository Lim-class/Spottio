// chat-engine/composables/use-ephemeral-timer.js
window.useEphemeralTimer = function() {
    const ephemeralDuration = Vue.ref(0);
    const showCustomEphemeralModal = Vue.ref(false);
    const customEphemeralValue = Vue.ref(1);
    const customEphemeralUnit = Vue.ref('m');

    const openCustomEphemeralModal = () => { showCustomEphemeralModal.value = true; };
    const closeCustomEphemeralModal = () => { showCustomEphemeralModal.value = false; };

    const getEphemeralLabel = Vue.computed(() => {
        const sec = ephemeralDuration.value;
        if (!sec || sec <= 0) return 'Effimeri: No';
        if (sec % 86400 === 0) return `Effimeri: ${sec / 86400}g`;
        if (sec % 3600 === 0) return `Effimeri: ${sec / 3600}h`;
        if (sec % 60 === 0) return `Effimeri: ${sec / 60}m`;
        return `Effimeri: ${sec}s`;
    });

    const confirmCustomEphemeral = async (onSaveDurationCallback) => {
        const val = parseInt(customEphemeralValue.value, 10);
        if (isNaN(val) || val <= 0) {
            alert("Inserisci un numero valido maggiore di 0.");
            return;
        }

        let multiplier = 60;
        if (customEphemeralUnit.value === 'h') multiplier = 3600;
        else if (customEphemeralUnit.value === 'd') multiplier = 86400;

        const totalSeconds = val * multiplier;
        ephemeralDuration.value = totalSeconds;

        if (typeof onSaveDurationCallback === 'function') {
            await onSaveDurationCallback(totalSeconds);
        }
        closeCustomEphemeralModal();
    };

    const calculateExpirationTimestamp = (durationSeconds) => {
        if (!durationSeconds || durationSeconds <= 0) return null;
        const expDate = new Date();
        expDate.setSeconds(expDate.getSeconds() + parseInt(durationSeconds, 10));
        return firebase.firestore.Timestamp.fromDate(expDate);
    };

    return {
        ephemeralDuration,
        showCustomEphemeralModal,
        customEphemeralValue,
        customEphemeralUnit,
        getEphemeralLabel,
        openCustomEphemeralModal,
        closeCustomEphemeralModal,
        confirmCustomEphemeral,
        calculateExpirationTimestamp
    };
};