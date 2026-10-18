// posta-media.js - Gestione Anteprime (Drag & Drop), Selezione File e Upload Ottimizzato Cloudinary

// Variabile globale per permetterne l'uso nel file di pubblicazione
window.selectedFilesArray = []; 

window.Spottio = window.Spottio || {};

/**
 * Funzione di utilità per comprimere le immagini lato client prima dell'upload
 * (Ridimensiona a max 1920x1080 e converte in WebP/JPEG 0.82)
 */
async function compressImageClientSide(file, maxWidth = 1920, maxHeight = 1080, quality = 0.82) {
    if (!file.type.startsWith('image/') || file.type === 'image/gif') {
        return file; // Non comprime video o GIF animate per preservare le animazioni
    }

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxWidth || height > maxHeight) {
                    if (width / height > maxWidth / maxHeight) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    } else {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const mimeType = 'image/webp';
                canvas.toBlob((blob) => {
                    if (!blob || blob.size >= file.size) {
                        resolve(file); // Se per qualche motivo il blob compresso è più pesante, usa l'originale
                    } else {
                        const newName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
                        const compressedFile = new File([blob], newName, { type: mimeType });
                        resolve(compressedFile);
                    }
                }, mimeType, quality);
            };
            img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
    });
}

/**
 * Uploader Ufficiale Cloudinary di Spottio
 * Configurato per applicare compressione aggressiva e risparmiare banda
 */
window.uploadMediaToCloudinary = async function(file, customTransformation = null) {
    if (!file) throw new Error("Nessun file fornito per l'upload.");

    const cloudName = "c32kn8tz"; // Il tuo cloud Cloudinary
    const uploadPreset = "spottio_preset"; // Sostituisci se usi un preset non firmato diverso
    const isVideo = file.type.startsWith('video/');

    // Comprime le immagini lato browser per risparmiare subito banda in invio
    let fileToUpload = file;
    if (!isVideo) {
        fileToUpload = await compressImageClientSide(file);
    }

    const formData = new FormData();
    formData.append("file", fileToUpload);
    formData.append("upload_preset", uploadPreset);

    // Trasformazione al momento dell'upload per ridurre peso e bitrate su Cloudinary
    const transformation = customTransformation || (
        isVideo 
            ? "w_1280,c_limit,q_auto:eco,vc_auto" // Risparmio massimo per video più lunghi
            : "w_1920,c_limit,q_auto:good,f_auto"
    );
    formData.append("transformation", transformation);

    const resourceType = isVideo ? "video" : "image";
    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            const errJson = await response.json().catch(() => ({}));
            throw new Error(errJson.error?.message || `Errore Cloudinary (${response.status})`);
        }

        const data = await response.json();
        let finalUrl = data.secure_url || data.url;

        // Assicura che l'URL contenga le direttive f_auto,q_auto se non già presenti
        if (finalUrl && finalUrl.includes('/upload/') && !finalUrl.includes('q_auto')) {
            const injectParams = isVideo ? 'f_auto,q_auto:eco,w_1280,c_limit/' : 'f_auto,q_auto:good,w_1920,c_limit/';
            finalUrl = finalUrl.replace('/upload/', `/upload/${injectParams}`);
        }

        return {
            url: finalUrl,
            public_id: data.public_id,
            resource_type: data.resource_type,
            isVideo: isVideo,
            width: data.width,
            height: data.height,
            duration: data.duration || null
        };
    } catch (err) {
        console.error("Errore upload Cloudinary:", err);
        throw err;
    }
};

window.Spottio.uploadToCloudinary = window.uploadMediaToCloudinary;

// 1. Logica di visualizzazione Anteprime e rimozione file
window.renderPreviews = function() {
    const previewContainer = document.getElementById('media-preview-container');
    const fileNameSpan = document.getElementById('file-name');

    if (!previewContainer) return;
    previewContainer.innerHTML = '';

    if (window.selectedFilesArray.length > 0) {
        if (fileNameSpan) fileNameSpan.textContent = `${window.selectedFilesArray.length}/10 file selezionati`;
        previewContainer.classList.remove('hidden');

        window.selectedFilesArray.forEach((file, index) => {
            const previewWrapper = document.createElement('div');
            previewWrapper.className = 'relative w-full h-24 rounded-lg overflow-hidden bg-gray-200 border border-gray-300 shadow-sm group';

            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                img.className = 'w-full h-full object-cover';
                previewWrapper.appendChild(img);
            } else if (file.type.startsWith('video/')) {
                const video = document.createElement('video');
                video.src = URL.createObjectURL(file);
                video.className = 'w-full h-full object-cover';
                previewWrapper.appendChild(video);

                const videoBadge = document.createElement('span');
                videoBadge.className = 'absolute bottom-1 right-1 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded';
                videoBadge.innerText = 'VIDEO';
                previewWrapper.appendChild(videoBadge);
            }

            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '&times;';
            removeBtn.className = 'absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md';
            removeBtn.onclick = (e) => {
                e.preventDefault();
                window.selectedFilesArray.splice(index, 1); 
                window.renderPreviews();
            };
            previewWrapper.appendChild(removeBtn);
            
            previewContainer.appendChild(previewWrapper);
        });
    } else {
        if (fileNameSpan) fileNameSpan.textContent = '';
        previewContainer.classList.add('hidden');
    }
};

// 2. Aggiunta Incrementale e Limite
window.handleFileSelection = function(newFiles) {
    const validFiles = Array.from(newFiles).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
    
    if (window.selectedFilesArray.length + validFiles.length > 10) {
        alert("Puoi caricare un massimo di 10 file.");
        return;
    }
    window.selectedFilesArray = [...window.selectedFilesArray, ...validFiles];
    window.renderPreviews();
};

document.addEventListener('DOMContentLoaded', function() {
    const fileUpload = document.getElementById('file-upload');
    const dropZone = document.getElementById('drop-zone');

    if (fileUpload) {
        fileUpload.addEventListener('change', function(e) {
            window.handleFileSelection(e.target.files);
            e.target.value = '';
        });
    }

    if (dropZone) {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('border-[#4a34b8]', 'bg-[#ddd8f3]');
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.classList.remove('border-[#4a34b8]', 'bg-[#ddd8f3]');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('border-[#4a34b8]', 'bg-[#ddd8f3]');
            if (e.dataTransfer.files.length > 0) {
                window.handleFileSelection(e.dataTransfer.files);
            }
        });
    }
});