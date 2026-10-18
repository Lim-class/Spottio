// chat-engine/composables/use-ephemeral-countdown.js
window.useEphemeralCountdown = function(messagesRef) {
    const computeExpirationDiff = (expDate) => {
        if (!expDate) return { text: '', isSoon: false, isExpired: false };
        const now = new Date();
        const diffSeconds = Math.floor((expDate.getTime() - now.getTime()) / 1000);

        if (diffSeconds <= 0) return { text: 'In eliminazione...', isSoon: true, isExpired: true };

        const isSoon = diffSeconds <= 300;
        if (diffSeconds < 60) return { text: `${diffSeconds}s`, isSoon, isExpired: false };
        if (diffSeconds < 3600) return { text: `${Math.floor(diffSeconds / 60)}m`, isSoon, isExpired: false };
        if (diffSeconds < 86400) return { text: `${Math.floor(diffSeconds / 3600)}h ${Math.floor((diffSeconds % 3600) / 60)}m`, isSoon, isExpired: false };
        return { text: `${Math.floor(diffSeconds / 86400)}g ${Math.floor((diffSeconds % 86400) / 3600)}h`, isSoon, isExpired: false };
    };

    const updateAllCountdowns = () => {
        if (!messagesRef || !messagesRef.value) return;
        messagesRef.value.forEach(msg => {
            if (msg.expiresAtDate) {
                const res = computeExpirationDiff(msg.expiresAtDate);
                msg.expiresInText = res.text;
                msg.isExpiringSoon = res.isSoon;
            }
        });
    };

    return {
        computeExpirationDiff,
        updateAllCountdowns
    };
};