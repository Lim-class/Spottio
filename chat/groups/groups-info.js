// ==========================================
// FILE: groups-info.js
// Visualizzazione & Inizializzazione Info Gruppo
// ==========================================

// Funzione di supporto locale per evitare errori di escaping
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

window.openGroupInfo = async function(groupId) {
    const modal = document.getElementById('group-info-modal');
    const list = document.getElementById('group-participants-list');
    const title = document.getElementById('group-info-title');
    const btnLeave = document.getElementById('btn-leave-group');
    const adminLabel = document.getElementById('group-info-admin-label');
    const btnEditName = document.getElementById('btn-edit-group-name');
    const adminAddSection = document.getElementById('admin-add-member-section');
    const btnAddMember = document.getElementById('btn-add-group-member');

    const groupInfoAvatar = document.getElementById('group-info-avatar');
    const groupInfoAvatarInput = document.getElementById('group-info-avatar-input');

    try {
        const groupDoc = await db.collection("groups").doc(groupId).get();
        if (groupDoc.exists) {
            const data = groupDoc.data();
            
            const isAdmin = data.createdBy === currentUid;
            const adminName = data.memberNames && data.memberNames[data.createdBy] ? data.memberNames[data.createdBy] : "Utente sconosciuto";

            title.textContent = data.name;
            adminLabel.textContent = `Creato da: @${escapeHtml(adminName)}`;

            // 1. RENDERING AVATAR E BOTTONE
            let avatarContent = data.avatarUrl 
                ? `<img src="${data.avatarUrl}" class="w-full h-full object-cover">`
                : `<span class="text-2xl font-bold text-white">${data.name.charAt(0).toUpperCase()}</span>`;

            groupInfoAvatar.innerHTML = `
                ${avatarContent}
                <button id="btn-change-group-avatar" class="hidden absolute inset-0 bg-black/50 text-white text-[10px] font-bold flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 w-full h-full cursor-pointer border-0">Cambia</button>
            `;

            // 2. Ripeschiamo il bottone appena generato
            const btnChangeAvatar = document.getElementById('btn-change-group-avatar');

            // 3. Abilita cambio foto se è Admin
            if (isAdmin) {
                btnEditName.classList.remove('hidden');
                adminAddSection.classList.remove('hidden');
                
                if (btnChangeAvatar) {
                    btnChangeAvatar.classList.remove('hidden');
                    btnChangeAvatar.classList.add('flex'); 
                    
                    btnChangeAvatar.onclick = () => groupInfoAvatarInput.click();
                    
                    groupInfoAvatarInput.onchange = async (e) => {
                        const file = e.target.files[0];
                        if (file && typeof uploadMediaToCloudinary === 'function') {
                            try {
                                btnChangeAvatar.textContent = "...";
                                const mediaRes = await uploadMediaToCloudinary(file);
                                if (mediaRes && mediaRes.url) {
                                    await db.collection("groups").doc(groupId).update({ avatarUrl: mediaRes.url });
                                    await db.collection("chat_previews").doc(groupId).update({ groupAvatarUrl: mediaRes.url });
                                    
                                    if (activeChat && activeChat.id === groupId) {
                                        const headerAvatar = document.getElementById('recipient-avatar');
                                        if (headerAvatar) headerAvatar.innerHTML = `<img src="${mediaRes.url}" class="w-full h-full object-cover">`;
                                    }

                                    alert("Foto del gruppo aggiornata con successo!");
                                    window.openGroupInfo(groupId); 
                                }
                            } catch (err) {
                                alert("Errore durante l'upload dell'immagine.");
                            } finally {
                                btnChangeAvatar.textContent = "Cambia";
                                groupInfoAvatarInput.value = ''; 
                            }
                        }
                    };
                }

                btnEditName.onclick = () => window.editGroupName(groupId, data.name);
                btnAddMember.onclick = () => window.addGroupMember(groupId, data);
            } else {
                btnEditName.classList.add('hidden');
                adminAddSection.classList.add('hidden');
                if (btnChangeAvatar) btnChangeAvatar.classList.add('hidden');
            }

            // 4. Stampa partecipanti
            list.innerHTML = '';
            data.members.forEach(memberUid => {
                const isMe = memberUid === currentUid;
                const isMemberAdmin = memberUid === data.createdBy;
                const memberName = data.memberNames && data.memberNames[memberUid] ? data.memberNames[memberUid] : memberUid;
                
                const safeMemberName = escapeHtml(memberName);
                
                const div = document.createElement('div');
                div.className = 'flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-200';
                
                let kickButton = '';
                if (isAdmin && !isMe) {
                    kickButton = `
                        <button onclick="window.kickGroupMember('${groupId}', '${memberUid}', '${safeMemberName}', ${JSON.stringify(data.members)})" 
                                class="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded border border-red-200 font-bold transition-colors">
                            Espelli
                        </button>
                    `;
                }

                div.innerHTML = `
                    <div class="flex flex-col">
                        <span class="text-sm font-medium text-gray-800">${safeMemberName} ${isMe ? '<span class="text-xs text-blue-500 ml-1">(Tu)</span>' : ''}</span>
                        ${isMemberAdmin ? '<span class="text-[10px] text-green-600 font-bold">Amministratore</span>' : ''}
                    </div>
                    ${kickButton}
                `;
                list.appendChild(div);
            });

            btnLeave.onclick = () => window.leaveGroup(groupId, data.members);
            modal.classList.remove('hidden');
        }
    } catch(e) { console.error("Errore recupero info gruppo:", e); }
}