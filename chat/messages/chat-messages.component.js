window.ChatMessagesComponent = {
    name: 'ChatMessagesComponent',
    props: [
        'activeChat', 'isChatActiveMobile', 'ephemeralDuration', 'getEphemeralLabel',
        'selectedBg', 'bgOptions', 'bgStyle', 'messages', 'hasMoreMessages', 'isLoadingMore',
        'openDropdownId', 'editingMsgId', 'editMsgText', 'mentionResults', 'replyingTo',
        'isRecordingAudio', 'audioRecordingSeconds', 'newMessage', 'getCurrentUid',
        'getAvatar', 'verifiedIcon'
    ],
    emits: [
        'go-back', 'group-info-click', 'ephemeral-change', 'update:selectedBg',
        'change-bg', 'upload-custom-bg', 'load-older', 'scroll-messages',
        'start-reply', 'toggle-dropdown', 'view-msg-info', 'start-edit',
        'delete-for-me', 'delete-for-everyone', 'scroll-to-msg', 'update:editMsgText',
        'cancel-edit', 'save-edit', 'toggle-reaction', 'insert-mention', 'cancel-reply',
        'cancel-audio', 'stop-audio', 'start-audio', 'send-media', 'send-message',
        'update:newMessage', 'handle-mention'
    ],
    template: `
        <div id="chat-content-container" class="w-full lg:w-2/3 bg-white p-6 rounded-2xl lg:rounded-r-2xl lg:rounded-l-none shadow-xl flex flex-col h-[calc(100vh-4rem)] relative" :class="{'hidden-mobile': !isChatActiveMobile}">
            
            <!-- Header Chat -->
            <div v-if="activeChat.id" class="flex items-center justify-between border-b pb-4 mb-4 shrink-0">
                <div class="flex items-center w-full max-w-[50%] sm:max-w-[60%]">
                    <button @click="$emit('go-back')" class="mr-3 p-2 lg:hidden bg-gray-100 hover:bg-gray-200 rounded-full transition-colors shrink-0">
                        <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                    <div class="flex items-center p-2 rounded-lg transition-colors overflow-hidden flex-grow" 
                         :class="{'cursor-pointer hover:bg-gray-100': activeChat.isGroup}" 
                         @click="$emit('group-info-click')">
                        <div v-html="getAvatar(activeChat.avatarUrl, activeChat.displayName, 'w-12 h-12 mr-4', activeChat.isGroup)"></div>
                        <div class="flex flex-col min-w-0">
                            <h3 class="text-xl sm:text-2xl font-bold text-gray-800 truncate" v-html="activeChat.displayName + (activeChat.isVerified ? verifiedIcon('w-5 h-5 text-blue-500 ml-1 inline-block align-middle') : '')"></h3>
                            <span v-if="activeChat.isGroup" class="text-xs text-gray-500 truncate">Info gruppo</span>
                        </div>
                    </div>
                </div>
                
                <div class="flex items-center space-x-2 shrink-0">
                    <div class="flex items-center bg-gray-100 rounded-lg p-1" title="Messaggi Effimeri (Salvati sul DB)">
                        <svg class="w-4 h-4 text-gray-500 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        <select :value="[0, 86400, 604800].includes(ephemeralDuration) ? ephemeralDuration : 'custom_active'" 
                                @change="$emit('ephemeral-change', $event)" 
                                class="text-xs bg-transparent p-1.5 text-gray-700 font-semibold focus:outline-none cursor-pointer max-w-[130px] truncate">
                            <option :value="0">Effimeri: No</option>
                            <option :value="86400">24 Ore</option>
                            <option :value="604800">7 Giorni</option>
                            <option v-if="![0, 86400, 604800].includes(ephemeralDuration)" value="custom_active">{{ getEphemeralLabel }}</option>
                            <option value="custom">⏱️ Personalizzato...</option>
                        </select>
                    </div>

                    <select :value="selectedBg" @input="$emit('update:selectedBg', $event.target.value)" @change="$emit('change-bg')" class="text-sm p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer max-w-[110px] sm:max-w-none truncate">
                        <option value="default">Sfondo Default</option>
                        <option v-for="color in bgOptions" :key="color.hex" :value="color.hex">{{ color.nome }}</option>
                        <option value="custom">Personalizzato...</option>
                    </select>
                    <input type="file" id="bg-upload-input" @change="$emit('upload-custom-bg', $event)" class="hidden" accept="image/*">
                </div>
            </div>

            <!-- Contenitore Messaggi -->
            <div id="messages-container" @scroll="$emit('scroll-messages', $event)" class="flex-grow overflow-y-auto space-y-4 p-4 border rounded-lg mb-4 custom-scrollbar transition-all duration-300" :style="bgStyle">
                <p v-if="!activeChat.id" class="text-gray-500 text-center text-lg my-auto h-full flex items-center justify-center">Seleziona una chat o un gruppo per iniziare.</p>
                
                <template v-else>
                    <div v-if="hasMoreMessages" class="flex justify-center py-2">
                        <button @click="$emit('load-older')" :disabled="isLoadingMore" class="text-xs bg-white text-blue-600 px-3 py-1.5 rounded-full border border-blue-200 shadow-sm hover:bg-blue-50 transition-all font-semibold flex items-center gap-1">
                            <svg v-if="isLoadingMore" class="animate-spin h-3.5 w-3.5 text-blue-600" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                            <span>{{ isLoadingMore ? 'Caricamento...' : 'Carica precedenti (5)' }}</span>
                        </button>
                    </div>

                    <div v-for="(msg) in messages" :key="msg.id" :id="'msg-' + msg.id">
                        <div v-if="msg.showDateSeparator" class="flex justify-center my-6">
                            <div class="bg-blue-50 text-blue-600 text-xs font-bold px-4 py-1.5 rounded-full shadow-sm border border-blue-100 uppercase tracking-wider">{{ msg.dateLabel }}</div>
                        </div>

                        <div :class="['w-full flex mb-3 px-2 items-start gap-2.5', msg.isMe ? 'justify-end' : 'justify-start']">
                            <div v-if="!msg.isMe" v-html="getAvatar(msg.senderAvatar, msg.senderName, msg.senderName === 'Sistema' ? 'w-8 h-8 mt-0.5 text-xs !bg-gray-400 !bg-none' : 'w-8 h-8 mt-0.5 text-xs', false)"></div>
                            
                            <div :class="['relative w-fit max-w-[85%] sm:max-w-[55%] px-4 py-2.5 shadow-sm flex flex-col group transition-all duration-200', msg.isMe ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none' : 'bg-white text-gray-800 rounded-2xl rounded-tl-none border border-gray-200']">
                                
                                <div :class="['absolute top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20 flex gap-1', msg.isMe ? '-left-20' : '-right-20']">
                                    <button @click.stop="$emit('start-reply', msg)" title="Rispondi" class="p-1.5 bg-white text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full shadow border border-gray-200">
                                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a5 5 0 015 5v3M3 10l6-6m-6 6l6 6"/></svg>
                                    </button>
                                    <button @click.stop="$emit('toggle-dropdown', msg.id)" title="Altre opzioni" class="p-1.5 bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full shadow border border-gray-200">
                                        <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 10a2 2 0 100 4 2 2 0 000-4zM12 4a2 2 0 100 4 2 2 0 000-4zM12 16a2 2 0 100 4 2 2 0 000-4z"/></svg>
                                    </button>
                                    
                                    <div v-if="openDropdownId === msg.id" class="absolute left-0 mt-8 w-44 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden text-sm py-1">
                                        <button v-if="msg.isMe" @click="$emit('view-msg-info', msg)" class="w-full text-left px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2">
                                            <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                            Info messaggio
                                        </button>
                                        <button v-if="msg.isMe && !msg.isDeleted" @click="$emit('start-edit', msg)" class="w-full text-left px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2">
                                            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                                            Modifica
                                        </button>
                                        <button @click="$emit('delete-for-me', msg.id)" class="w-full text-left px-3 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 border-t border-gray-100">
                                            <svg class="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                            Elimina per me
                                        </button>
                                        <button v-if="msg.isMe && !msg.isDeleted" @click="$emit('delete-for-everyone', msg.id)" class="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100">
                                            <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                            Elimina per tutti
                                        </button>
                                    </div>
                                </div>

                                <span v-if="!msg.isMe && activeChat.isGroup && msg.senderName !== 'Sistema'" class="text-[10px] font-bold text-green-600 block mb-1" v-html="msg.senderName + (msg.isSenderVerified ? verifiedIcon('w-3.5 h-3.5 inline-block ml-0.5') : '')"></span>

                                <div v-if="msg.replyTo" @click="$emit('scroll-to-msg', msg.replyTo.id)" class="mb-2 p-2 rounded-lg text-xs cursor-pointer border-l-4 overflow-hidden border-blue-400" :class="msg.isMe ? 'bg-blue-700/50 text-blue-100' : 'bg-gray-100 text-gray-600'">
                                    <span class="font-bold block text-[11px]">{{ msg.replyTo.senderName }}</span>
                                    <p class="truncate text-[11px] opacity-90">{{ msg.replyTo.text }}</p>
                                </div>

                                <div v-if="editingMsgId !== msg.id" v-html="msg.contentHtml" class="break-words"></div>
                                <div v-else class="w-full min-w-[200px] mt-1 text-gray-800">
                                    <textarea :value="editMsgText" @input="$emit('update:editMsgText', $event.target.value)" class="w-full p-2 text-sm rounded-lg border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" rows="2"></textarea>
                                    <div class="flex justify-end gap-1.5 mt-2">
                                        <button @click="$emit('cancel-edit')" class="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-600 rounded">Annulla</button>
                                        <button @click="$emit('save-edit', msg.id)" class="px-2 py-1 text-xs font-semibold bg-blue-600 text-white rounded">Salva</button>
                                    </div>
                                </div>

                                <div v-if="Object.keys(msg.reactions || {}).length > 0" class="flex flex-wrap gap-1 mt-1.5">
                                    <span v-for="(users, emoji) in msg.reactions" :key="emoji" @click="$emit('toggle-reaction', msg, emoji)" :class="['text-xs px-2 py-0.5 rounded-full cursor-pointer border transition-transform active:scale-90', users.includes(getCurrentUid()) ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-white/80 border-gray-200 text-gray-700']">
                                        {{ emoji }} {{ users.length }}
                                    </span>
                                </div>

                                <div class="hidden group-hover:flex gap-1.5 mt-1 pt-1 border-t border-white/20 text-xs">
                                    <button v-for="emoji in ['👍', '❤️', '😂', '🔥', '👏']" :key="emoji" @click="$emit('toggle-reaction', msg, emoji)" class="hover:scale-125 transition-transform">{{ emoji }}</button>
                                </div>

                                <div class="flex justify-end items-center mt-1.5 gap-1.5">
                                    <span v-if="msg.isEphemeral" title="Messaggio Effimero" class="text-[10px] opacity-75">⏱️</span>
                                    <span v-if="msg.isEdited && !msg.isDeleted" class="text-[10px] italic opacity-75">(modificato)</span>
                                    <span :class="['text-[10px] font-medium', msg.isMe ? 'text-blue-200' : 'text-gray-400']">{{ msg.timeStr }}</span>
                                    <span v-if="msg.isMe && !msg.isDeleted" class="flex items-center">
                                        <svg v-if="!msg.isDelivered" class="w-3.5 h-3.5 text-blue-300 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
                                        <svg v-else-if="msg.isRead" class="w-4 h-4 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M2 13l4 4L16 7M8 13l4 4L22 7"></path></svg>
                                        <svg v-else class="w-4 h-4 text-blue-200 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M2 13l4 4L16 7M8 13l4 4L22 7"></path></svg>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </div>

            <div v-if="mentionResults.length > 0" class="absolute bottom-20 left-4 bg-white border border-gray-200 rounded-lg shadow-2xl z-[60] max-h-48 overflow-y-auto w-64 flex flex-col">
                <div v-for="user in mentionResults" :key="user.username" @click="$emit('insert-mention', user.username)" class="p-3 hover:bg-green-50 cursor-pointer text-sm font-semibold border-b border-gray-100 flex items-center gap-2">
                    <div v-html="getAvatar(user.userPfUri, user.username, 'w-6 h-6', false)"></div> @{{ user.username }}
                </div>
            </div>

            <div v-if="replyingTo" class="flex items-center justify-between p-2.5 mb-2 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                <div class="overflow-hidden">
                    <p class="text-xs font-bold text-blue-700">Risposta a {{ replyingTo.senderName }}</p>
                    <p class="text-xs text-gray-600 truncate">{{ replyingTo.rawText }}</p>
                </div>
                <button @click="$emit('cancel-reply')" class="text-gray-400 hover:text-gray-600 p-1 text-lg leading-none font-bold">×</button>
            </div>

            <div v-if="isRecordingAudio" class="flex w-full shrink-0 gap-3 items-center p-3 bg-red-50 border border-red-200 rounded-xl mb-1">
                <div class="w-3 h-3 rounded-full bg-red-600 animate-ping"></div>
                <span class="text-sm font-bold text-red-600 flex-grow">Registrazione: {{ audioRecordingSeconds }}s</span>
                <button type="button" @click="$emit('cancel-audio')" class="px-3 py-1.5 text-xs font-semibold bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg">Annulla</button>
                <button type="button" @click="$emit('stop-audio')" class="px-4 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow">Invia Vocale</button>
            </div>

            <form v-if="activeChat.id && !isRecordingAudio" @submit.prevent="$emit('send-message')" class="flex w-full shrink-0 gap-2 sm:gap-3 items-center">
                <label class="cursor-pointer p-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors shrink-0" title="Allega Media">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                    <input type="file" @change="$emit('send-media', $event)" class="hidden" accept="image/*,video/*,audio/*">
                </label>
                <button type="button" @click="$emit('start-audio')" class="p-3 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 rounded-lg transition-colors shrink-0" title="Registra Vocale">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                </button>
                <input type="text" id="chat-message-input" :value="newMessage" @input="$emit('update:newMessage', $event.target.value); $emit('handle-mention', $event)" autocomplete="off" placeholder="Scrivi un messaggio..." class="flex-grow min-w-0 p-3 rounded-lg bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <button type="submit" class="shrink-0 px-4 sm:px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors">Invia</button>
            </form>
        </div>
    `
};