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
    template: `
        <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white p-6 rounded-xl shadow-2xl w-96 flex flex-col">
                <h3 class="text-xl font-bold text-gray-800 mb-4">Crea un nuovo Gruppo</h3>
                
                <div class="mb-4 flex items-center gap-3">
                    <div class="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-xl overflow-hidden shrink-0 border border-gray-200 relative shadow-sm">
                        <span v-if="isUploadingGroupAvatar" class="text-xs font-normal animate-pulse">Carico...</span>
                        <img v-else-if="newGroupAvatarUrl" :src="newGroupAvatarUrl" class="w-full h-full object-cover block">
                        <span v-else>📷</span>
                    </div>
                    
                    <label class="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3 py-2 rounded-lg font-semibold transition-colors flex items-center gap-1.5 border border-gray-200">
                        <span v-if="isUploadingGroupAvatar">Attendere...</span>
                        <span v-else>{{ newGroupAvatarUrl ? 'Cambia foto' : 'Scegli foto...' }}</span>
                        <input type="file" @change="$emit('upload-avatar', $event)" class="hidden" accept="image/*" :disabled="isUploadingGroupAvatar">
                    </label>
                </div>

                <input type="text" :value="newGroupName" @input="$emit('update:newGroupName', $event.target.value)" placeholder="Nome del gruppo..." class="w-full p-2 mb-4 rounded-lg bg-gray-50 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:outline-none">
                
                <div class="mb-4 relative">
                    <input type="text" :value="groupSearchQuery" @input="$emit('update:groupSearchQuery', $event.target.value); $emit('search-members')" placeholder="Cerca membri da aggiungere..." class="w-full p-2 rounded-lg bg-gray-50 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:outline-none">
                    <div v-if="groupSearchResults.length > 0" class="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 shadow-lg max-h-40 overflow-y-auto">
                        <div v-for="user in groupSearchResults" :key="user.uid" @click="$emit('add-member', user)" class="p-2 hover:bg-green-50 cursor-pointer border-b border-gray-100 text-sm">{{ user.username }}</div>
                    </div>
                </div>

                <div class="mb-4 flex-grow">
                    <p class="text-sm font-semibold text-gray-600 mb-2">Membri selezionati:</p>
                    <div class="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                        <div v-for="member in selectedGroupMembers" :key="member.uid" @click="$emit('remove-member', member.uid)" class="inline-flex items-center bg-green-100 text-green-800 px-2 py-1 rounded text-xs cursor-pointer hover:bg-green-200 transition-colors">
                            {{ member.username }} <span class="ml-1 font-bold">×</span>
                        </div>
                    </div>
                </div>

                <div class="flex justify-end space-x-3 mt-4">
                    <button @click="$emit('close')" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold transition-colors">Annulla</button>
                    <button @click="$emit('confirm-create')" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold transition-colors">Crea</button>
                </div>
            </div>
        </div>
    `
};