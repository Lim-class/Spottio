// ==========================================
// FILE: impostazioni/spottio-modals.js
// Iniezione Modali Globali (Edit, Delete, Reports, Likes)
// ==========================================

window.Spottio = window.Spottio || {};

window.Spottio.injectGlobalModals = function() {
    if (document.getElementById('confirmation-modal')) return;
    
    const modalsHTML = `
        <!-- Modale Conferma Eliminazione -->
        <div id="confirmation-modal" class="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full hidden z-50">
            <div class="relative top-20 mx-auto p-5 border w-96 shadow-2xl rounded-2xl bg-white">
                <div class="mt-3 text-center">
                    <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                        <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.332 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    </div>
                    <h3 class="text-xl leading-6 font-bold text-gray-900 mt-4">Conferma Eliminazione</h3>
                    <div class="mt-2 px-7 py-3">
                        <p class="text-sm text-gray-500">Sei sicuro di voler eliminare questo post? L'azione è irreversibile.</p>
                    </div>
                    <div class="flex space-x-3 px-4 py-3">
                        <button id="cancel-delete" class="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-xl w-full hover:bg-gray-300 transition">Annulla</button>
                        <button id="confirm-delete" class="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-xl w-full shadow-sm hover:bg-red-700 transition">Elimina</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modale Modifica Post (Aggiornato per Media) -->
        <div id="edit-modal" class="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full hidden justify-center items-center z-50">
            <div class="relative bg-white p-8 rounded-3xl shadow-2xl w-full max-w-lg mx-4">
                <h3 class="text-2xl font-bold text-gray-800 mb-4">Modifica Post</h3>
                <form id="edit-form">
                    <input type="hidden" id="edit-post-id">
                    
                    <div class="mb-4">
                        <label for="edit-category" class="block text-gray-700 font-semibold mb-2 text-sm">Categorie (Ctrl/Cmd per selezione multipla):</label>
                        <select id="edit-category" multiple required class="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white min-h-[100px] custom-scrollbar">
                            <option value="Generale">Generale</option>
                        </select>
                    </div>
                    
                    <div class="mb-4">
                        <label for="edit-text" class="block text-gray-700 font-semibold mb-2 text-sm">Testo del post:</label>
                        <textarea id="edit-text" rows="5" class="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" required></textarea>
                    </div>

                    <!-- Nuova Sezione Gestione Media -->
                    <div class="mb-6">
                        <label class="block text-gray-700 font-semibold mb-2 text-sm">Gestisci Media/Carosello:</label>
                        <div id="edit-media-preview-container" class="flex gap-2 overflow-x-auto py-2 custom-scrollbar min-h-[90px] border border-transparent">
                            <!-- Anteprime generate dinamicamente da ui-edit.js -->
                        </div>
                        <label for="edit-media-file-input" class="mt-2 inline-flex items-center gap-2 cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-xl transition">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                            </svg>
                            Aggiungi Foto/Video
                        </label>
                        <input type="file" id="edit-media-file-input" multiple accept="image/*,video/*" class="hidden">
                    </div>

                    <div class="flex justify-end space-x-4 border-t pt-4">
                        <button type="button" id="cancel-edit" class="px-6 py-2 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition">Annulla</button>
                        <button type="button" id="save-edit" class="px-6 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition shadow-sm">Salva</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Modale Segnala Post -->
        <div id="report-modal" class="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full hidden justify-center items-center z-50">
            <div class="relative bg-white p-8 rounded-3xl shadow-2xl w-full max-w-lg mx-4">
                <h3 class="text-2xl font-bold text-gray-800 mb-4">Segnala Post</h3>
                <form id="report-form">
                    <input type="hidden" id="reported-post-index">
                    <div class="mb-4">
                        <label for="report-reason" class="block text-gray-700 font-semibold mb-2 text-sm">Motivo della segnalazione:</label>
                        <select id="report-reason" required class="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none bg-white">
                            <option value="" disabled selected>Seleziona un motivo</option>
                            <option value="contenuto-inappropriato">Contenuto inappropriato</option>
                            <option value="spam">Spam</option>
                            <option value="linguaggio-offensivo">Linguaggio offensivo</option>
                            <option value="altro">Altro</option>
                        </select>
                    </div>
                    <div class="mb-6">
                        <label for="report-description" class="block text-gray-700 font-semibold mb-2 text-sm">Descrizione (opzionale):</label>
                        <textarea id="report-description" rows="4" class="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Aggiungi dettagli..."></textarea>
                    </div>
                    <div class="flex justify-end space-x-4">
                        <button type="button" id="cancel-report" class="px-6 py-2 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition">Annulla</button>
                        <button type="submit" class="px-6 py-2 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition">Invia</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Modale Likes -->
        <div id="likes-modal" class="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full hidden justify-center items-center z-50">
            <div class="relative bg-white p-6 rounded-3xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
                <div class="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 class="text-xl font-bold text-gray-800">Mi piace</h3>
                    <button onclick="window.closeLikesModal()" class="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
                </div>
                <div id="likes-modal-list" class="overflow-y-auto custom-scrollbar flex-grow space-y-3 pr-2"></div>
            </div>
        </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = modalsHTML;
    document.body.appendChild(container);
};

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.Spottio && window.Spottio.injectGlobalModals) {
            window.Spottio.injectGlobalModals();
        }
    });
}