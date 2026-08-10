// ==========================================
// FILE: messages-send-media.js
// Logica di Upload Media e Compressione Immagini
// ==========================================

async function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.6) {
    if (!file.type.startsWith('image/')) return file; 

    return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();
        
        img.onload = () => {
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            ctx.drawImage(img, 0, 0, width, height);
            
            URL.revokeObjectURL(objectUrl);
            img.src = ''; 

            canvas.toBlob((blob) => {
                canvas.width = 0;
                canvas.height = 0;
                
                if (!blob) {
                    console.warn("Compressione fallita, utilizzo file originale.");
                    return resolve(file);
                }
                
                const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + "_compressed.jpg", {
                    type: 'image/jpeg',
                    lastModified: Date.now()
                });
                
                resolve(compressedFile);
            }, 'image/jpeg', quality);
        };
        
        img.onerror = (err) => {
            URL.revokeObjectURL(objectUrl);
            console.warn("Errore lettura immagine, procedo con l'originale:", err);
            resolve(file); 
        };
        
        img.src = objectUrl;
    });
}

function setupMediaListeners() {
    const handleMediaUpload = async (e) => {
        const rawFile = e.target.files[0];
        if (!rawFile || !activeChat.id) return;

        // Limite di 25MB per prevenire errori 413 CORS su Cloudinary
        const maxSizeInMB = 25;
        if (rawFile.size > maxSizeInMB * 1024 * 1024) {
            alert(`Il file è troppo pesante. La dimensione massima consentita è ${maxSizeInMB} MB.`);
            e.target.value = '';
            return;
        }

        let targetChatId = activeChat.id;
        if (!activeChat.isGroup) {
            targetChatId = window.Spottio.getConversationId(currentUid, activeChat.id);
        }

        try {
            console.log("Elaborazione file multimediale in corso...");

            const file = await compressImage(rawFile, 800, 800, 0.6);

            const mediaResult = await uploadMediaToCloudinary(file);
            
            if (!mediaResult || !mediaResult.url) {
                throw new Error("Link multimediale non valido ricevuto dal cloud.");
            }

            const mediaUrl = mediaResult.url;
            
            let fileType = 'image';
            if (file.type.startsWith('video/')) fileType = 'video';
            else if (file.type.startsWith('audio/')) fileType = 'audio';

            const rawPayload = `${fileType}:${mediaUrl}`;
            const encryptedPayload = window.Spottio.encryptMessage(rawPayload, targetChatId);

            const messageData = {
                sender: currentUid, 
                text: encryptedPayload, 
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };

            let previewId = '';
            if (activeChat.isGroup) {
                messageData.groupId = activeChat.id;
                previewId = activeChat.id;
            } else {
                messageData.receiver = activeChat.id;
                messageData.conversationId = targetChatId;
                previewId = targetChatId;
            }

            if (activeChat.isGroup) {
                await db.collection("groups").doc(activeChat.id).collection("chats").add(messageData);
            } else {
                await db.collection("chats").doc(targetChatId).collection("messages").add(messageData);
            }
            
            const previewData = {
                lastMessage: encryptedPayload,
                lastSender: currentUid, 
                lastUpdate: firebase.firestore.FieldValue.serverTimestamp(),
            };
            if (!activeChat.isGroup) {
                previewData.participants = [currentUid, activeChat.id];
                previewData.isGroup = false;
            }
            await db.collection("chat_previews").doc(previewId).set(previewData, { merge: true });

        } catch (err) {
            console.error("Errore durante l'invio del file multimediale:", err);
            alert("Impossibile inviare il file: " + err.message);
        } finally {
            e.target.value = ''; 
        }
    };

    const mediaFileInput = document.getElementById('media-file-input');
    if (mediaFileInput) mediaFileInput.addEventListener('change', handleMediaUpload);
}