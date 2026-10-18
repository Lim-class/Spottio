// =========================================================================
// FILE: chat-engine/load-chat-engine.js
// Caricamento sincrono del motore di messaggistica condiviso
// =========================================================================

(function() {
    const scripts = [
        '../shared/js/spottio-media-service.js',
        '../chat-engine/composables/use-ephemeral-timer.js',
        '../chat-engine/composables/use-ephemeral-countdown.js',
        '../chat-engine/composables/use-audio-recorder.js',
        '../chat/messages/use-chat-drafts-schedule.js',
        '../chat-engine/components/ephemeral-modal.component.js',
        '../chat-engine/components/message-info-modal.component.js',
        '../chat/messages/chat-messages.component.js'
    ];

    scripts.forEach(src => {
        document.write(`<script src="${src}"><\/script>`);
    });
})();