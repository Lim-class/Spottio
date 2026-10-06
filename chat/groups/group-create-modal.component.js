// chat/groups/group-create-modal.component.js
window.GroupCreateModalComponent = {
    name: 'GroupCreateModalComponent',
    props: [
        'show', 'isUploadingGroupAvatar', 'newGroupAvatarUrl',
        'newGroupName', 'groupSearchQuery', 'groupSearchResults', 'selectedGroupMembers'
    ],
    emits: [
        'close', 'update:newGroupName', 'update:groupSearchQuery',
        'search-members', 'add-member', 'remove-member', 'upload-avatar', 'confirm-create'
    ],
    methods: {
        renderAvatar(url, name, classes = 'w-9 h-9', hasStories = false) {
            if (window.Spottio && typeof window.Spottio.getAvatarHtml === 'function') {
                return window.Spottio.getAvatarHtml(url, name, classes, false, hasStories);
            }
            return `<div class="${classes} rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs">${(name || 'U').charAt(0).toUpperCase()}</div>`;
        },
        renderVerified(isVerified) {
            if (!isVerified) return '';
            if (window.Spottio && typeof window.Spottio.getVerifiedBadge === 'function') {
                return window.Spottio.getVerifiedBadge(isVerified, 'w-4 h-4 text-blue-500 shrink-0 inline-block align-middle');
            }
            return '<span class="text-blue-500 font-bold ml-1">✓</span>';
        }
    },
    template: `
        <div v-if="show" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div class="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-md flex flex-col border border-gray-100">
                <div class="flex items-center justify-between border-b pb-3 mb-4">
                    <h3 class="text-xl font-extrabold text-gray-800">Crea un nuovo Gruppo</h3>
                    <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
                </div>
                
                <!-- Foto e Nome Gruppo -->
                <div class="mb-4 flex items-center gap-3">
                    <div class="w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xl overflow-hidden shrink-0 border-2 border-white shadow-md relative">
                        <span v-if="isUploadingGroupAvatar" class="text-[10px] font-normal animate-pulse">Carico...</span>
                        <img v-else-if="newGroupAvatarUrl" :src="newGroupAvatarUrl" class="w-full h-full object-cover block">
                        <span v-else>👥</span>
                    </div>
                    
                    <label class="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3.5 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-1.5 border border-gray-200">
                        <span v-if="isUploadingGroupAvatar">Attendere...</span>
                        <span v-else>{{ newGroupAvatarUrl ? 'Cambia foto' : 'Scegli foto...' }}</span>
                        <input type="file" @change="$emit('upload-avatar', $event)" class="hidden" accept="image/*" :disabled="isUploadingGroupAvatar">
                    </label>
                </div>

                <input type="text" 
                       :value="newGroupName" 
                       @input="$emit('update:newGroupName', $event.target.value)" 
                       placeholder="Nome del gruppo..." 
                       class="w-full p-3 mb-4 rounded-xl bg-gray-50 border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm font-medium">
                
                <!-- Barra di ricerca membri con Flashspot e verifica -->
                <div class="mb-4 relative">
                    <div class="relative">
                        <input type="text" 
                               :value="groupSearchQuery" 
                               @input="$emit('update:groupSearchQuery', $event.target.value); $emit('search-members')" 
                               placeholder="Cerca utenti da aggiungere..." 
                               class="w-full p-3 pl-10 rounded-xl bg-gray-50 border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                    </div>

                    <!-- Risultati Ricerca con Anello Flashspot e Badge Verificato -->
                    <div v-if="groupSearchResults.length > 0" class="absolute z-20 w-full bg-white border border-gray-200 rounded-2xl mt-1.5 shadow-2xl max-h-52 overflow-y-auto p-1.5 custom-scrollbar">
                        <div v-for="user in groupSearchResults" 
                             :key="user.uid" 
                             @click="$emit('add-member', user)" 
                             class="flex items-center justify-between p-2 hover:bg-emerald-50 rounded-xl cursor-pointer transition border-b last:border-0 border-gray-50">
                            
                            <div class="flex items-center gap-2.5 min-w-0">
                                <div v-html="renderAvatar(user.avatarUrl, user.username, 'w-9 h-9', user.hasStories)"></div>
                                <div class="flex items-center gap-1 min-w-0">
                                    <span class="font-bold text-xs text-gray-800 truncate">{{ user.username }}</span>
                                    <span v-html="renderVerified(user.isVerified)"></span>
                                </div>
                            </div>
                            <span class="text-xs font-bold text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-lg shrink-0">+ Aggiungi</span>
                        </div>
                    </div>
                </div>

                <!-- Membri Selezionati -->
                <div class="mb-4 flex-grow">
                    <p class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Membri selezionati ({{ selectedGroupMembers.length }}):</p>
                    <div v-if="selectedGroupMembers.length === 0" class="text-xs text-gray-400 italic p-3 text-center border border-dashed rounded-xl">
                        Nessun membro selezionato. Usa la barra di ricerca in alto.
                    </div>
                    <div v-else class="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                        <div v-for="member in selectedGroupMembers" 
                             :key="member.uid" 
                             @click="$emit('remove-member', member.uid)" 
                             class="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-xl text-xs cursor-pointer hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition group shadow-sm">
                            <div v-html="renderAvatar(member.avatarUrl, member.username, 'w-5 h-5 text-[9px]', member.hasStories)"></div>
                            <span class="font-semibold">{{ member.username }}</span>
                            <span class="font-bold ml-0.5 text-emerald-500 group-hover:text-red-500">×</span>
                        </div>
                    </div>
                </div>

                <div class="flex justify-end space-x-3 pt-3 border-t border-gray-100">
                    <button @click="$emit('close')" class="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-xs font-bold transition">Annulla</button>
                    <button @click="$emit('confirm-create')" class="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-xs font-bold transition shadow-md">Crea Gruppo</button>
                </div>
            </div>
        </div>
    `
};