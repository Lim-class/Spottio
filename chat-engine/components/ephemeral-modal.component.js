// chat-engine/components/ephemeral-modal.component.js
window.EphemeralModalComponent = {
    name: 'EphemeralModalComponent',
    props: ['show', 'customEphemeralValue', 'customEphemeralUnit', 'accentColor'],
    emits: [
        'close', 'update:customEphemeralValue',
        'update:customEphemeralUnit', 'confirm'
    ],
    computed: {
        btnClass() {
            return this.accentColor === 'purple' 
                ? 'bg-purple-600 hover:bg-purple-700' 
                : 'bg-blue-600 hover:bg-blue-700';
        },
        iconClass() {
            return this.accentColor === 'purple' ? 'text-purple-600' : 'text-blue-600';
        }
    },
    template: `
        <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[75]">
            <div class="bg-white p-6 rounded-2xl shadow-2xl w-80 sm:w-96 flex flex-col">
                <div class="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <svg class="w-5 h-5" :class="iconClass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        Timer Personalizzato
                    </h3>
                    <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 text-lg font-bold">×</button>
                </div>

                <p class="text-xs text-gray-600 mb-4">
                    Imposta dopo quanto tempo i nuovi messaggi inviati in questa chat verranno eliminati automaticamente per tutti.
                </p>

                <div class="flex items-center gap-2 mb-6">
                    <input type="number" 
                           :value="customEphemeralValue" 
                           @input="$emit('update:customEphemeralValue', $event.target.value)"
                           min="1" 
                           placeholder="Es. 10" 
                           class="w-1/2 p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:outline-none">
                    
                    <select :value="customEphemeralUnit" 
                            @change="$emit('update:customEphemeralUnit', $event.target.value)"
                            class="w-1/2 p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 focus:ring-2 focus:outline-none cursor-pointer">
                        <option value="m">Minuti</option>
                        <option value="h">Ore</option>
                        <option value="d">Giorni</option>
                    </select>
                </div>

                <div class="flex justify-end space-x-2">
                    <button @click="$emit('close')" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors">
                        Annulla
                    </button>
                    <button @click="$emit('confirm')" :class="btnClass" class="px-4 py-2 text-white text-xs font-bold rounded-xl shadow transition-colors">
                        Salva Timer
                    </button>
                </div>
            </div>
        </div>
    `
};