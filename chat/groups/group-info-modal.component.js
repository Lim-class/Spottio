// chat/groups/group-info-modal.component.js
window.GroupInfoModalComponent = {
    name: 'GroupInfoModalComponent',
    props: ['show', 'groupInfo', 'newMemberUsername', 'adminSearchResults'],
    emits: [
        'close', 'edit-name', 'change-avatar', 'kick-member',
        'update:newMemberUsername', 'search-admin-members', 'add-new-member', 'leave-group',
        'remove-pinned-message', 'copy-invite-link'
    ],
    methods: {
        renderAvatar(url, name, classes = 'w-10 h-10', hasStories = false) {
            if (window.Spottio && typeof window.Spottio.getAvatarHtml === 'function') {
                return window.Spottio.getAvatarHtml(url, name, classes, false, hasStories);
            }
            return `<div class="${classes} rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">${(name || 'U').charAt(0).toUpperCase()}</div>`;
        },
        renderVerified(isVerified, classes = 'w-4 h-4 text-blue-500 ml-1 inline-block shrink-0 align-middle') {
            if (!isVerified) return '';
            if (window.Spottio && typeof window.Spottio.getVerifiedBadge === 'function') {
                return window.Spottio.getVerifiedBadge(isVerified, classes);
            }
            return '<span class="text-blue-500 font-bold ml-1">✓</span>';
        }
    },
    template: `
        <div v-if="show && groupInfo" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
            <div class="bg-white p-6 rounded-xl shadow-2xl w-96 flex flex-col max-h-[85vh]">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-2xl overflow-hidden shrink-0 border border-gray-200 relative group">
                        <img v-if="groupInfo.avatarUrl" :src="groupInfo.avatarUrl" class="w-full h-full object-cover">
                        <span v-else>{{ groupInfo.name.charAt(0).toUpperCase() }}</span>
                        <label v-if="groupInfo.isAdmin" class="absolute inset-0 bg-black/40 text-white text-[10px] font-bold flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 w-full h-full cursor-pointer">
                            Cambia<input type="file" @change="$emit('change-avatar', $event)" class="hidden" accept="image/*">
                        </label>
                    </div>
                    
                    <div class="flex flex-col min-w-0 flex-grow">
                        <div class="flex items-center justify-between">
                            <h3 class="text-xl font-bold text-gray-800 truncate">{{ groupInfo.name }}</h3>
                            <button v-if="groupInfo.isAdmin" @click="$emit('edit-name')" class="p-1 text-gray-500 hover:text-blue-600" title="Modifica nome">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                            </button>
                        </div>
                        <div class="text-xs text-gray-400 truncate flex items-center gap-1">
                            <span>Creato da: @{{ groupInfo.adminName }}</span>
                            <span v-html="renderVerified(groupInfo.adminIsVerified, 'w-3 h-3 text-blue-500 ml-0.5 inline-block shrink-0 align-middle')"></span>
                        </div>
                    </div>
                </div>

                <!-- Tasto Invita tramite Link -->
                <div class="mb-4">
                    <button type="button" @click="$emit('copy-invite-link')" class="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 border border-gray-200">
                        <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                        <span>Copia Link di Invito</span>
                    </button>
                </div>

                <!-- Box Messaggio Fissato se presente -->
                <div v-if="groupInfo.pinnedMessage" class="mb-4 p-2.5 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                    <div class="overflow-hidden pr-2">
                        <span class="text-[10px] font-bold uppercase text-blue-700 block">📌 Messaggio Fissato</span>
                        <p class="text-xs text-gray-700 truncate">"{{ groupInfo.pinnedMessage.textSnippet }}"</p>
                    </div>
                    <button v-if="groupInfo.isAdmin" @click="$emit('remove-pinned-message')" class="text-xs text-red-500 hover:text-red-700 font-bold px-1.5" title="Rimuovi">
                        ✕
                    </button>
                </div>
                
                <div class="mb-4 overflow-y-auto custom-scrollbar flex-grow">
                    <p class="text-sm font-semibold text-gray-600 mb-2">Partecipanti ({{ groupInfo.participants.length }}):</p>
                    <div class="space-y-2">
                        <div v-for="member in groupInfo.participants" :key="member.uid" class="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-200">
                            <div class="flex items-center gap-2.5 min-w-0">
                                <div v-html="renderAvatar(member.avatarUrl, member.name, 'w-8 h-8', member.hasStories)"></div>
                                <div class="flex flex-col min-w-0">
                                    <div class="flex items-center gap-1">
                                        <span class="text-sm font-medium text-gray-800 truncate">{{ member.name }}</span>
                                        <span v-html="renderVerified(member.isVerified, 'w-3.5 h-3.5 text-blue-500 ml-0.5 inline-block shrink-0 align-middle')"></span>
                                        <span v-if="member.isMe" class="text-xs text-blue-500 ml-1">(Tu)</span>
                                    </div>
                                    <span v-if="member.isAdmin" class="text-[10px] text-green-600 font-bold">Amministratore</span>
                                </div>
                            </div>
                            <button v-if="groupInfo.isAdmin && !member.isMe" @click="$emit('kick-member', member.uid, member.name)" class="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded border border-red-200 font-bold transition-colors shrink-0">Espelli</button>
                        </div>
                    </div>
                </div>

                <!-- Sezione Admin: Aggiungi Membro con Ricerca Dinamica -->
                <div v-if="groupInfo.isAdmin" class="border-t pt-4 mb-4 relative">
                    <p class="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Pannello Admin: Aggiungi Membro</p>
                    <div class="flex gap-2">
                        <input type="text" 
                               :value="newMemberUsername" 
                               @input="$emit('update:newMemberUsername', $event.target.value); $emit('search-admin-members')" 
                               placeholder="Cerca username da aggiungere..." 
                               class="flex-grow p-2 text-sm rounded-lg bg-gray-50 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:outline-none">
                        <button @click="$emit('add-new-member')" class="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors">Aggiungi</button>
                    </div>

                    <!-- Risultati Ricerca con Avatar e Verifica -->
                    <div v-if="adminSearchResults && adminSearchResults.length > 0" class="mt-2 border border-gray-200 rounded-lg p-1 bg-white shadow-lg max-h-40 overflow-y-auto custom-scrollbar space-y-1">
                        <div v-for="user in adminSearchResults" 
                             :key="user.uid" 
                             @click="$emit('add-new-member', user)" 
                             class="flex items-center justify-between p-1.5 hover:bg-green-50 rounded cursor-pointer transition border-b last:border-0 border-gray-100">
                            <div class="flex items-center gap-2 min-w-0">
                                <div v-html="renderAvatar(user.avatarUrl, user.username, 'w-7 h-7 text-xs', user.hasStories)"></div>
                                <div class="flex items-center gap-1 min-w-0">
                                    <span class="font-medium text-xs text-gray-800 truncate">{{ user.username }}</span>
                                    <span v-html="renderVerified(user.isVerified)"></span>
                                </div>
                            </div>
                            <span class="text-[11px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded shrink-0">+ Aggiungi</span>
                        </div>
                    </div>
                </div>

                <div class="flex justify-between mt-2 border-t pt-4 shrink-0">
                    <button @click="$emit('leave-group')" class="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-bold transition-colors shadow-sm">Abbandona</button>
                    <button @click="$emit('close')" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-bold transition-colors">Chiudi</button>
                </div>
            </div>
        </div>
    `
};