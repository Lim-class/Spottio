// chat-engine/components/message-info-modal.component.js
window.MessageInfoModalComponent = {
    name: 'MessageInfoModalComponent',
    props: ['show', 'selectedMsgInfo', 'accentColor'],
    emits: ['close'],
    computed: {
        iconClass() {
            return this.accentColor === 'purple' ? 'text-purple-600' : 'text-blue-600';
        },
        badgeRowClass() {
            return this.accentColor === 'purple' ? 'bg-purple-50/60' : 'bg-blue-50/60';
        }
    },
    template: `
        <div v-if="show && selectedMsgInfo" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
            <div class="bg-white p-6 rounded-2xl shadow-2xl w-96 flex flex-col">
                <div class="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <svg class="w-5 h-5" :class="iconClass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        Info Messaggio
                    </h3>
                    <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 text-lg font-bold">×</button>
                </div>

                <div class="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-4 text-xs text-gray-700 break-words">
                    <span class="font-semibold block text-gray-500 mb-1">Anteprima testo:</span>
                    {{ selectedMsgInfo.rawText }}
                </div>

                <div class="space-y-3">
                    <div class="flex items-center justify-between py-2 border-b border-gray-100">
                        <span class="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                            Inviato:
                        </span>
                        <span class="text-xs text-gray-800 font-medium">{{ selectedMsgInfo.fullDateStr }}</span>
                    </div>

                    <div class="py-2">
                        <span class="text-xs font-semibold text-gray-500 flex items-center gap-1.5 mb-2">
                            <svg class="w-4 h-4 text-cyan-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M2 13l4 4L16 7M8 13l4 4L22 7"/>
                            </svg>
                            Letto da:
                        </span>
                        <div v-if="selectedMsgInfo.readDetails && selectedMsgInfo.readDetails.length > 0" class="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                            <div v-for="reader in selectedMsgInfo.readDetails" :key="reader.uid" :class="['flex justify-between items-center text-xs p-2 rounded-lg', badgeRowClass]">
                                <span class="font-bold text-gray-700">{{ reader.username }}</span>
                                <span class="text-gray-500">{{ reader.time }}</span>
                            </div>
                        </div>
                        <div v-else class="text-xs text-gray-400 italic">Non ancora letto da nessuno.</div>
                    </div>
                </div>

                <button @click="$emit('close')" class="mt-5 w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-colors">Chiudi</button>
            </div>
        </div>
    `
};