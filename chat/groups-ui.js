// ==========================================
// FILE: groups-ui.js
// Elementi DOM, Stato e Rendering Interfaccia Gruppi
// ==========================================

const groupModal = document.getElementById('group-modal');
const btnOpenGroupModal = document.getElementById('btn-open-group-modal');
const btnCloseGroupModal = document.getElementById('btn-close-group-modal');
const btnConfirmGroup = document.getElementById('btn-confirm-group');
const groupNameInput = document.getElementById('group-name-input');
const groupUserSearch = document.getElementById('group-user-search');
const groupSearchResults = document.getElementById('group-search-results');
const selectedMembersList = document.getElementById('selected-members-list');

let selectedGroupMembers = []; 

function renderSelectedMembers() {
    if (!selectedMembersList) return;
    selectedMembersList.innerHTML = '';
    selectedGroupMembers.forEach(member => {
        const div = document.createElement('div');
        div.className = 'inline-flex items-center bg-green-100 text-green-800 px-2 py-1 rounded text-xs mr-2 mb-2 cursor-pointer hover:bg-green-200';
        div.innerHTML = `${member} <span class="ml-1 font-bold">×</span>`;
        div.onclick = () => {
            selectedGroupMembers = selectedGroupMembers.filter(m => m !== member);
            renderSelectedMembers();
        };
        selectedMembersList.appendChild(div);
    });
}