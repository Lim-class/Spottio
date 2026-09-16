window.GroupInfoModalComponent = {
    name: 'GroupInfoModalComponent',
    props: ['show', 'groupInfo', 'newMemberUsername'],
    emits: [
        'close', 'edit-name', 'change-avatar', 'kick-member',
        'update:newMemberUsername', 'add-new-member', 'leave-group'
    ],
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
                        <div class="text-xs text-gray-400 truncate">Creato da: @{{ groupInfo.adminName }}</div>
                    </div>
                </div>
                
                <div class="mb-4 overflow-y-auto custom-scrollbar flex-grow">
                    <p class="text-sm font-semibold text-gray-600 mb-2">Partecipanti:</p>
                    <div class="space-y-2">
                        <div v-for="member in groupInfo.participants" :key="member.uid" class="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-200">
                            <div class="flex flex-col">
                                <span class="text-sm font-medium text-gray-800">{{ member.name }} <span v-if="member.isMe" class="text-xs text-blue-500 ml-1">(Tu)</span></span>
                                <span v-if="member.isAdmin" class="text-[10px] text-green-600 font-bold">Amministratore</span>
                            </div>
                            <button v-if="groupInfo.isAdmin && !member.isMe" @click="$emit('kick-member', member.uid, member.name)" class="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded border border-red-200 font-bold transition-colors">Espelli</button>
                        </div>
                    </div>
                </div>

                <div v-if="groupInfo.isAdmin" class="border-t pt-4 mb-4">
                    <p class="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Pannello Admin: Aggiungi Membro</p>
                    <div class="flex gap-2">
                        <input type="text" :value="newMemberUsername" @input="$emit('update:newMemberUsername', $event.target.value)" placeholder="Username da aggiungere..." class="flex-grow p-2 text-sm rounded-lg bg-gray-50 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:outline-none">
                        <button @click="$emit('add-new-member')" class="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors">Aggiungi</button>
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