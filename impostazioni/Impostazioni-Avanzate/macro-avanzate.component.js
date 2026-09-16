// Impostazioni-Avanzate/macro-avanzate.component.js
window.SettingsComponents = window.SettingsComponents || {};

window.SettingsComponents.MacroAvanzate = {
    props: ['searchQuery', 'activeMacro', 'activeSection', 'isAdmin', 't'],
    emits: ['toggle-macro', 'toggle-section'],
    setup(props, { emit }) {
        const { ref, computed } = Vue;

        const showDeleteModal = ref(false);

        const isOpen = computed(() => {
            if (props.searchQuery && props.searchQuery.trim() !== '') return true;
            return props.activeMacro === 'avanzate';
        });

        const isSectionOpen = (sectKey) => {
            if (props.searchQuery && props.searchQuery.trim() !== '') return true;
            return props.activeSection === sectKey;
        };

        const performLogout = () => {
            if (window.auth) {
                window.auth.signOut()
                    .then(() => window.location.href = '../index.html')
                    .catch(e => alert('Errore: ' + e.message));
            }
        };

        const performDeleteAccount = async () => {
            if (props.isAdmin) return alert('L\'account admin non può essere eliminato.');
            const user = window.auth ? window.auth.currentUser : null;
            if (!user || !window.db) return;

            // Chiede la password per soddisfare il requisito di sicurezza di Firebase Auth
            const password = prompt("Per confermare l'eliminazione definitiva dell'account, inserisci la tua password attuale:");
            if (!password) return;

            try {
                // 1. Re-autenticazione immediata
                const credential = firebase.auth.EmailAuthProvider.credential(user.email, password);
                await user.reauthenticateWithCredential(credential);

                // 2. Cancellazione documento Firestore
                await window.db.collection("users").doc(user.uid).delete();

                // 3. Cancellazione utente da Firebase Auth
                await user.delete();

                // 4. Reset storage e redirect
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '../index.html';
            } catch (error) {
                console.error("Errore durante l'eliminazione dell'account:", error);
                if (error.code === 'auth/wrong-password') {
                    alert("Password errata. Operazione annullata.");
                } else if (error.code === 'auth/too-many-requests') {
                    alert("Troppi tentativi falliti. Riprova più tardi.");
                } else {
                    alert("Errore durante l'eliminazione: " + (error.message || error));
                }
            }
        };

        return {
            showDeleteModal,
            isOpen,
            isSectionOpen,
            toggleMacro: () => emit('toggle-macro', 'avanzate'),
            toggleSection: (sectKey) => emit('toggle-section', sectKey),
            performLogout,
            performDeleteAccount
        };
    },
    template: `
        <div class="macro-category border-b border-transparent py-2">
            <button @click="toggleMacro" class="w-full flex justify-between items-center py-4 focus:outline-none hover:bg-gray-50 rounded-xl px-2 transition-colors">
                <span class="text-2xl font-bold text-gray-800 uppercase tracking-wider">{{ t('macroAdvanced', 'Impostazioni Avanzate') }}</span>
                <span class="transform transition-transform duration-200 text-gray-800" :class="{'rotate-180': isOpen}">▼</span>
            </button>
            <div v-show="isOpen" class="mt-2 pl-4 border-l-2 border-gray-200 pb-2 mb-4">
                
                <!-- Logout -->
                <div class="border-b border-gray-100 py-3">
                    <button @click="toggleSection('logout')" class="w-full flex justify-between items-center py-2 focus:outline-none">
                        <span class="text-xl font-semibold text-red-600">{{ t('logoutBtn', 'Esci dall\\'Account') }}</span>
                        <span class="transform transition-transform duration-200 text-red-600" :class="{'rotate-180': isSectionOpen('logout')}">▼</span>
                    </button>
                    <div v-show="isSectionOpen('logout')" class="mt-4 text-center pb-4">
                        <p class="text-gray-600 mb-6">{{ t('logoutDesc', 'Disconnettendoti dovrai inserire nuovamente le tue credenziali.') }}</p>
                        <button @click="performLogout" class="bg-red-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-600 shadow-md">
                            {{ t('confirmLogoutBtn', 'Conferma Logout') }}
                        </button>
                    </div>
                </div>

                <!-- Elimina Account -->
                <div class="border-b border-transparent py-3">
                    <button @click="toggleSection('delete')" class="w-full flex justify-between items-center py-2 focus:outline-none">
                        <span class="text-xl font-semibold text-red-600">{{ t('deleteAccountTitle', 'Elimina Account') }}</span>
                        <span class="transform transition-transform duration-200 text-red-600" :class="{'rotate-180': isSectionOpen('delete')}">▼</span>
                    </button>
                    <div v-show="isSectionOpen('delete')" class="mt-4 text-center pb-4">
                        <p class="text-gray-600 mb-6">{{ t('deleteAccountDesc', 'Questa azione è irreversibile.') }}</p>
                        <button @click="showDeleteModal = true" :disabled="isAdmin" :class="{'opacity-50 cursor-not-allowed': isAdmin}" class="bg-red-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-600 shadow-md">
                            {{ t('deleteAccountBtn', 'Elimina il mio account') }}
                        </button>
                    </div>
                </div>

            </div>

            <!-- Modale Conferma Elimina Account Incapsulato -->
            <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center backdrop-blur-sm p-4">
                <div class="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm text-center">
                    <h3 class="text-xl font-bold text-gray-800 mb-2">{{ t('modalTitle', 'Sei sicuro?') }}</h3>
                    <p class="text-gray-600 mb-6 text-sm">{{ t('modalDesc', 'Vuoi davvero eliminare il tuo account?') }}</p>
                    <div class="flex justify-between gap-3">
                        <button @click="showDeleteModal = false" class="w-1/2 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-bold transition">{{ t('modalCancelBtn', 'Annulla') }}</button>
                        <button @click="performDeleteAccount" class="w-1/2 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition shadow-sm">
                            {{ t('deleteBtnConfirm', 'Elimina') }}
                        </button>
                    </div>
                </div>
            </div>

        </div>
    `
};