// posta-media.js - Gestione Anteprime (Drag & Drop) e Selezione File

// Variabile globale per permetterne l'uso nel file di pubblicazione
window.selectedFilesArray = []; 

// 1. Logica di visualizzazione Anteprime e rimozione file
window.renderPreviews = function() {
    const previewContainer = document.getElementById('media-preview-container');
    const fileNameSpan = document.getElementById('file-name');

    previewContainer.innerHTML = '';

    if (window.selectedFilesArray.length > 0) {
        fileNameSpan.textContent = `${window.selectedFilesArray.length}/10 file selezionati`;
        previewContainer.classList.remove('hidden');

        window.selectedFilesArray.forEach((file, index) => {
            const previewWrapper = document.createElement('div');
            previewWrapper.className = 'relative w-full h-24 rounded-lg overflow-hidden bg-gray-200 border border-gray-300 shadow-sm group';

            // Elemento multimediale
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

            // Pulsante Rimuovi "X" (appare all'hover)
            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '&times;';
            removeBtn.className = 'absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md';
            removeBtn.onclick = (e) => {
                e.preventDefault();
                window.selectedFilesArray.splice(index, 1); 
                window.renderPreviews(); // Ricarica la griglia
            };
            previewWrapper.appendChild(removeBtn);
            
            previewContainer.appendChild(previewWrapper);
        });
    } else {
        fileNameSpan.textContent = '';
        previewContainer.classList.add('hidden');
    }
}

// 2. Aggiunta Incrementale e Limite
window.handleFileSelection = function(newFiles) {
    const validFiles = Array.from(newFiles).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
    
    if (window.selectedFilesArray.length + validFiles.length > 10) {
        alert("Puoi caricare un massimo di 10 file.");
        return;
    }
    window.selectedFilesArray = [...window.selectedFilesArray, ...validFiles];
    window.renderPreviews();
}

// Inizializzazione Eventi DOM per i Media
document.addEventListener('DOMContentLoaded', function() {
    const fileUpload = document.getElementById('file-upload');
    const dropZone = document.getElementById('drop-zone');

    // Input da Click Standard
    if (fileUpload) {
        fileUpload.addEventListener('change', function(e) {
            window.handleFileSelection(e.target.files);
            e.target.value = ''; // Reset input value per permettere di riselezionare gli stessi file
        });
    }

    // Input da Drag & Drop
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