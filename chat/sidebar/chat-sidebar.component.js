window.ChatSidebarComponent = {
    name: 'ChatSidebarComponent',
    props: [
        'chatList', 'activeChat', 'searchQuery', 'searchResults',
        'isChatActiveMobile', 'getAvatar', 'verifiedIcon'
    ],
    emits: ['update:searchQuery', 'search-users', 'open-group-modal', 'select-chat', 'select-from-search'],
    template: `
        <div id="chat-list-container" 
            class="w-full lg:w-1/3 bg-white p-6 rounded-2xl lg:rounded-l-2xl lg:rounded-r-none shadow-xl flex-col h-full overflow-hidden" 
            :class="isChatActiveMobile ? 'hidden lg:flex' : 'flex'">
            
            <div class="flex items-center gap-2 mb-4 shrink-0">
                <button @click="$emit('open-group-modal')" class="bg-green-100 text-green-700 hover:bg-green-200 p-2.5 rounded-xl transition-colors shrink-0" title="Nuovo Gruppo">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                </button>

                <a href="../anonimo/anonimo.html" class="bg-purple-100 text-purple-700 hover:bg-purple-200 p-2.5 rounded-xl transition-colors shrink-0 flex items-center justify-center" title="Chat Anonime">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                </a>
                
                <div class="relative flex-grow">
                    <input type="text" 
                        :value="searchQuery" 
                        @input="$emit('update:searchQuery', $event.target.value); $emit('search-users')" 
                        placeholder="Cerca persone o gruppi..." 
                        class="w-full p-2.5 pl-10 rounded-xl bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>

                    <div v-if="searchResults.length > 0" class="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-2 shadow-lg max-h-48 overflow-y-auto">
                        <div v-for="user in searchResults" :key="user.id" @click="$emit('select-from-search', user)" class="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0 flex items-center gap-3 transition-colors">
                            <div v-html="getAvatar(user.avatarUrl, user.username, 'w-10 h-10', false)"></div>
                            <div class="flex items-center gap-0.5 text-gray-700 font-medium">
                                <span>{{ user.username }}</span>
                                <span v-if="user.isVerified" v-html="verifiedIcon('w-4 h-4 text-blue-500 ml-1 inline-block shrink-0')"></span>
                            </div>
                        </div>
                    </div>
                    <div v-else-if="searchQuery && searchResults.length === 0" class="absolute z-20 w-full bg-white border border-gray-300 rounded-lg mt-2 shadow-lg p-3 text-gray-400 italic text-sm text-center">Nessun utente trovato</div>
                </div>
            </div>

            <div class="flex-grow overflow-y-auto space-y-4 custom-scrollbar">
                <div v-for="chat in chatList" :key="chat.id" @click="$emit('select-chat', chat)" :class="['flex items-center p-3 mb-2 rounded-xl cursor-pointer transition-all duration-200 w-full min-w-0', chat.id === activeChat.id ? 'bg-blue-100 shadow-sm' : 'hover:bg-gray-100']">
                    <div v-html="getAvatar(chat.avatarUrl, chat.displayName, 'w-12 h-12 mr-3 text-lg', chat.isGroup)"></div>
                    <div class="flex-grow overflow-hidden min-w-0">
                        <div class="flex items-center gap-0.5">
                            <h4 class="font-semibold text-gray-800 truncate">{{ chat.displayName }}</h4>
                            <span v-if="chat.isVerified" v-html="verifiedIcon('w-4 h-4 text-blue-500 ml-1 inline-block shrink-0')"></span>
                        </div>
                        <p class="text-xs text-gray-500 truncate">{{ chat.lastMessage }}</p>
                    </div>
                </div>
            </div>
        </div>
    `
};