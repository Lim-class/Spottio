// ==========================================
// FILE: messages-send.js
// Logica di Invio Messaggi di Testo, UI Mobile e Menzioni
// ==========================================

function setupSendListeners() {
    // --- 1. GESTIONE PULSANTE INDIETRO (MOBILE) ---
    if (btnBackToList) {
        btnBackToList.addEventListener('click', () => {
            containerChatList.classList.remove('hidden-mobile');
            containerChatContent.classList.add('hidden-mobile');
            
            chatHeader.classList.add('hidden');
            messageForm.classList.add('hidden');
            noChatMessage.classList.remove('hidden');
            messagesContainer.innerHTML = '';
            activeChat = { id: null, isGroup: false, name: '', members: [] };
        });
    }

    // --- 2. GESTIONE INVIO MESSAGGI DI TESTO ---
    if (messageForm) {
        messageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const rawText = messageInput.value.trim();
            if (!rawText || !activeChat.id) return;

            let targetChatId = activeChat.id;
            if (!activeChat.isGroup) {
                targetChatId = window.Spottio.getConversationId(currentUid, activeChat.id);
            }

            // Cifratura testo
            const encryptedText = window.Spottio.encryptMessage(rawText, targetChatId);

            const messageData = {
                sender: currentUid, 
                text: encryptedText, 
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };

            let previewId = '';
            if (activeChat.isGroup) {
                messageData.groupId = activeChat.id;
                previewId = activeChat.id;
            } else {
                messageData.receiver = activeChat.id;
                messageData.conversationId = targetChatId;
                previewId = targetChatId;
            }

            try {
                messageInput.value = '';
                
                if (activeChat.isGroup) {
                    await db.collection("groups").doc(activeChat.id).collection("chats").add(messageData);
                } else {
                    await db.collection("chats").doc(targetChatId).collection("messages").add(messageData);
                }
                
                const previewData = {
                    lastMessage: encryptedText,
                    lastSender: currentUid, 
                    lastUpdate: firebase.firestore.FieldValue.serverTimestamp(),
                };

                if (!activeChat.isGroup) {
                    previewData.participants = [currentUid, activeChat.id];
                    previewData.isGroup = false;
                }

                await db.collection("chat_previews").doc(previewId).set(previewData, { merge: true });

            } catch (err) {
                console.error("Errore invio messaggio:", err);
            }
        });
    }

    // --- 3. GESTIONE DINAMICA DELLE MENZIONI '@' NEI GRUPPI ---
    const messageInputEl = document.getElementById('message-input');
    const mentionDropdown = document.getElementById('mention-dropdown');

    if (messageInputEl) {
        messageInputEl.addEventListener('input', async (e) => {
            if (!activeChat.isGroup) return; 

            const text = e.target.value;
            const cursorPosition = e.target.selectionStart;
            const textBeforeCursor = text.slice(0, cursorPosition);
            
            const match = textBeforeCursor.match(/@(\w*)$/);

            if (match) {
                const searchTerm = match[1].toLowerCase();
                
                try {
                    const groupDoc = await db.collection("groups").doc(activeChat.id).get();
                    if (groupDoc.exists) {
                        const membersUids = groupDoc.data().members || [];
                        await window.resolveUids(membersUids); 
                        
                        const availableMembers = membersUids.map(uid => window.userCache[uid]);
                        const filtered = availableMembers.filter(m => m && m.username && m.username.toLowerCase().includes(searchTerm));

                        mentionDropdown.innerHTML = '';
                        if (filtered.length > 0) {
                            filtered.forEach(m => {
                                const div = document.createElement('div');
                                div.className = 'p-3 hover:bg-green-50 cursor-pointer text-sm font-semibold border-b border-gray-100 flex items-center gap-2';
                                const avatar = window.Spottio.getAvatarHtml(m.userPfUri, m.username, "w-6 h-6");
                                div.innerHTML = `${avatar} @${m.username}`;
                                
                                div.onclick = () => {
                                    const val = messageInputEl.value;
                                    const newText = val.substring(0, match.index) + `@${m.username} ` + val.substring(cursorPosition);
                                    messageInputEl.value = newText;
                                    mentionDropdown.classList.add('hidden');
                                    messageInputEl.focus();
                                };
                                mentionDropdown.appendChild(div);
                            });
                            mentionDropdown.classList.remove('hidden');
                        } else {
                            mentionDropdown.classList.add('hidden');
                        }
                    }
                } catch(err) { console.error("Errore recupero membri per menzione", err); }
            } else {
                mentionDropdown.classList.add('hidden');
            }
        });
        
        document.addEventListener('click', (ev) => {
            if (messageInputEl && mentionDropdown && !messageInputEl.contains(ev.target) && !mentionDropdown.contains(ev.target)) {
                mentionDropdown.classList.add('hidden');
            }
        });
    }
}