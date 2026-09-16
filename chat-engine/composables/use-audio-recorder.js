// chat-engine/composables/use-audio-recorder.js
window.useAudioRecorder = function() {
    const isRecordingAudio = Vue.ref(false);
    const audioRecordingSeconds = Vue.ref(0);
    const isUploadingAudio = Vue.ref(false);

    let mediaRecorder = null;
    let audioChunks = [];
    let audioTimer = null;
    let localStream = null;
    let audioContext = null;
    let analyser = null;
    let monitorInterval = null;

    const cleanupAudioHardware = () => {
        if (monitorInterval) {
            clearInterval(monitorInterval);
            monitorInterval = null;
        }
        if (audioContext && audioContext.state !== 'closed') {
            audioContext.close().catch(() => {});
            audioContext = null;
        }
        if (localStream) {
            localStream.getTracks().forEach(track => {
                track.stop();
            });
            localStream = null;
        }
    };

    const startAudioRecording = async (onSuccessCallback, canRecordCheck = () => true) => {
        if (!canRecordCheck()) return;

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("Il browser non supporta la registrazione vocale.");
            return;
        }

        try {
            // Configurazione audio standard: disabilitiamo i filtri aggressivi che azzerano il volume su PC
            localStream = await navigator.mediaDevices.getUserMedia({ 
                audio: true 
            });

            // Monitor diagnostico del volume in tempo reale (visibile su Console F12)
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) {
                    audioContext = new AudioCtx();
                    const source = audioContext.createMediaStreamSource(localStream);
                    analyser = audioContext.createAnalyser();
                    analyser.fftSize = 256;
                    source.connect(analyser);

                    const dataArray = new Uint8Array(analyser.frequencyBinCount);
                    monitorInterval = setInterval(() => {
                        analyser.getByteFrequencyData(dataArray);
                        let sum = 0;
                        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
                        const average = sum / dataArray.length;
                        if (average > 3) {
                            console.log("🎤 Segnale vocale rilevato - Livello:", Math.round(average));
                        }
                    }, 500);
                }
            } catch (e) {
                console.warn("AudioContext diagnostico non inizializzato:", e);
            }

            // Selezione del container nativo
            let selectedMimeType = '';
            const testTypes = [
                'audio/webm;codecs=opus',
                'audio/webm',
                'audio/ogg;codecs=opus',
                'audio/mp4'
            ];

            for (const t of testTypes) {
                if (MediaRecorder.isTypeSupported(t)) {
                    selectedMimeType = t;
                    break;
                }
            }

            const recorderOptions = selectedMimeType ? { mimeType: selectedMimeType } : {};
            mediaRecorder = new MediaRecorder(localStream, recorderOptions);
            
            audioChunks = [];
            audioRecordingSeconds.value = 0;

            mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    audioChunks.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                clearInterval(audioTimer);
                cleanupAudioHardware();

                if (audioChunks.length === 0) {
                    isRecordingAudio.value = false;
                    return;
                }

                // Genera il blob con il mimeType effettivo del recorder
                const actualMime = mediaRecorder.mimeType || selectedMimeType || 'audio/webm';
                const recordedBlob = new Blob(audioChunks, { type: actualMime });
                audioChunks = [];

                console.log("📦 Dimensione pacchetto audio finale:", recordedBlob.size, "byte | Mime:", actualMime);

                if (recordedBlob.size < 500) {
                    alert("Registrazione troppo breve o microfono mutato. Riprova.");
                    isRecordingAudio.value = false;
                    return;
                }

                const ext = actualMime.includes('mp4') ? 'mp4' : (actualMime.includes('ogg') ? 'ogg' : 'webm');
                const audioFile = new File([recordedBlob], `voice_${Date.now()}.${ext}`, { type: actualMime });

                isUploadingAudio.value = true;
                try {
                    const res = await window.SpottioMediaService.upload(audioFile);
                    if (res && res.url && typeof onSuccessCallback === 'function') {
                        await onSuccessCallback(res.url);
                    }
                } catch (e) {
                    alert(e.message || "Errore durante l'invio del vocale.");
                } finally {
                    isUploadingAudio.value = false;
                    isRecordingAudio.value = false;
                }
            };

            // Raccoglie i chunk costantemente ogni 200 millisecondi
            mediaRecorder.start(200);
            isRecordingAudio.value = true;
            audioTimer = setInterval(() => { 
                audioRecordingSeconds.value++; 
            }, 1000);

        } catch (err) {
            console.error("Errore accesso microfono:", err);
            cleanupAudioHardware();
            isRecordingAudio.value = false;
            alert("Permesso microfono negato o periferica occupata da un'altra applicazione.");
        }
    };

    const stopAudioRecording = () => {
        if (mediaRecorder && isRecordingAudio.value) {
            if (mediaRecorder.state !== 'inactive') {
                try {
                    mediaRecorder.requestData();
                } catch (e) {}
                mediaRecorder.stop();
            }
            clearInterval(audioTimer);
        }
    };

    const cancelAudioRecording = () => {
        if (mediaRecorder && isRecordingAudio.value) {
            audioChunks = [];
            mediaRecorder.onstop = null;
            if (mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
            }
            cleanupAudioHardware();
            isRecordingAudio.value = false;
            clearInterval(audioTimer);
        }
    };

    return {
        isRecordingAudio,
        audioRecordingSeconds,
        isUploadingAudio,
        startAudioRecording,
        stopAudioRecording,
        cancelAudioRecording
    };
};