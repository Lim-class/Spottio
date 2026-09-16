// chat-engine/load-chat-engine.js
(function() {
    const scripts = [
        '../shared/js/spottio-media-service.js',
        '../chat-engine/composables/use-ephemeral-timer.js',
        '../chat-engine/composables/use-audio-recorder.js',
        '../chat-engine/components/ephemeral-modal.component.js',
        '../chat-engine/components/message-info-modal.component.js'
    ];

    scripts.forEach(src => {
        document.write(`<script src="${src}"><\/script>`);
    });
})();