// Accesso-e-Sicurezza/macro-sicurezza.component.js
window.SettingsComponents = window.SettingsComponents || {};

window.SettingsComponents.MacroSicurezza = {
    props: ['searchQuery', 'activeMacro', 'activeSection', 't', 'isAdmin'],
    emits: ['toggle-macro', 'toggle-section', 'request-delete'],
    setup(props, { emit }) {
        const { computed, onMounted } = Vue;

        const sicurezzaModule = window.SettingsModules.useSicurezza({ 
            Vue, 
            t: props.t, 
            isAdmin: computed(() => props.isAdmin) 
        });

        // Recupera breakLimit e la logica di salvataggio definita nel modulo privacy
        const privacyModule = window.SettingsModules.usePrivacy({ 
            Vue, 
            t: props.t, 
            currentDob: sicurezzaModule.currentDob 
        });

        onMounted(async () => {
            const checkAuth = setInterval(async () => {
                if (window.auth && window.db && window.auth.currentUser) {
                    clearInterval(checkAuth);
                    try {
                        const doc = await window.db.collection('users').doc(window.auth.currentUser.uid).get();
                        if (doc.exists && doc.data().birthDate) {
                            sicurezzaModule.currentDob.value = doc.data().birthDate;
                        }
                    } catch (e) {}
                }
            }, 100);
        });

        const isOpen = computed(() => {
            if (props.searchQuery && props.searchQuery.trim() !== '') return true;
            return props.activeMacro === 'sicurezza';
        });

        const isSectionOpen = (sectKey) => {
            if (props.searchQuery && props.searchQuery.trim() !== '') return true;
            return props.activeSection === sectKey;
        };

        return {
            ...sicurezzaModule,
            breakLimit: privacyModule.breakLimit,
            breakStatusMsg: privacyModule.breakStatusMsg,
            saveBreakLimit: privacyModule.saveBreakLimit,
            isOpen,
            isSectionOpen,
            toggleMacro: () => emit('toggle-macro', 'sicurezza'),
            toggleSection: (sectKey) => emit('toggle-section', sectKey)
        };
    },
    template: `
        <div class="macro-category border-b border-gray-200 py-2">
            <button @click="toggleMacro" class="w-full flex justify-between items-center py-4 focus:outline-none hover:bg-gray-50 rounded-xl px-2 transition-colors">
                <span class="text-2xl font-bold text-gray-800 uppercase tracking-wider">{{ t('macroSecurity', 'Accesso e Sicurezza') }}</span>
                <span class="transform transition-transform duration-200 text-gray-800" :class="{'rotate-180': isOpen}">▼</span>
            </button>
            <div v-show="isOpen" class="mt-2 pl-4 border-l-2 border-gray-200 pb-2 mb-4">
                
                <!-- Cambio Password -->
                <div class="border-b border-gray-100 py-3">
                    <button @click="toggleSection('password')" class="w-full flex justify-between items-center py-2 focus:outline-none">
                        <span class="text-xl font-semibold text-gray-800">{{ t('changePasswordTitle', 'Cambio Password') }}</span>
                        <span class="transform transition-transform duration-200 text-gray-800" :class="{'rotate-180': isSectionOpen('password')}">▼</span>
                    </button>
                    <div v-show="isSectionOpen('password')" class="mt-4 pb-4">
                        <input type="password" v-model="formPassword.old" :placeholder="t('oldPassPlaceholder', 'Password attuale')" class="w-full p-3 mb-3 rounded-xl border border-gray-300">
                        <input type="password" v-model="formPassword.new" :placeholder="t('newPassPlaceholder', 'Nuova password')" class="w-full p-3 mb-3 rounded-xl border border-gray-300">
                        <button @click="updatePassword" :disabled="isUpdatingAuth" class="w-full bg-gray-800 text-white font-bold py-3 rounded-xl hover:bg-black transition-colors disabled:opacity-50">
                            {{ isUpdatingAuth ? t('processingBtn', 'Elaborazione...') : t('updatePassBtn', 'Aggiorna Password') }}
                        </button>
                    </div>
                </div>

                <!-- Cambio Email -->
                <div class="border-b border-gray-100 py-3">
                    <button @click="toggleSection('email')" class="w-full flex justify-between items-center py-2 focus:outline-none">
                        <span class="text-xl font-semibold text-gray-800">{{ t('changeEmailTitle', 'Cambio Email') }}</span>
                        <span class="transform transition-transform duration-200 text-gray-800" :class="{'rotate-180': isSectionOpen('email')}">▼</span>
                    </button>
                    <div v-show="isSectionOpen('email')" class="mt-4 pb-4">
                        <input type="password" v-model="formEmail.pass" :placeholder="t('oldPassPlaceholder', 'Password attuale')" class="w-full p-3 mb-3 rounded-xl border border-gray-300">
                        <input type="email" v-model="formEmail.new" :placeholder="t('newEmailPlaceholder', 'Nuova e-mail')" class="w-full p-3 mb-3 rounded-xl border border-gray-300">
                        <button @click="updateEmail" :disabled="isUpdatingAuth" class="w-full bg-gray-800 text-white font-bold py-3 rounded-xl hover:bg-black transition-colors disabled:opacity-50">
                            {{ isUpdatingAuth ? t('processingBtn', 'Elaborazione...') : t('updateEmailBtn', 'Aggiorna Email') }}
                        </button>
                    </div>
                </div>

                <!-- Data di Nascita -->
                <div class="border-b border-gray-100 py-3">
                    <button @click="toggleSection('dob')" class="w-full flex justify-between items-center py-2 focus:outline-none">
                        <span class="text-xl font-semibold text-gray-800">{{ t('dobTitle', 'Data di Nascita') }}</span>
                        <span class="transform transition-transform duration-200 text-gray-800" :class="{'rotate-180': isSectionOpen('dob')}">▼</span>
                    </button>
                    <div v-show="isSectionOpen('dob')" class="mt-4 pb-4">
                        <div class="mb-4 bg-gray-50 p-4 rounded-xl border border-gray-200 flex justify-between items-center">
                            <div>
                                <p class="text-xs text-gray-500 font-semibold mb-1">{{ t('currentDobLabel', 'Data attuale:') }}</p>
                                <p class="text-lg font-bold text-gray-800">{{ currentDob || t('noDobSet', 'Nessuna data impostata') }}</p>
                            </div>
                            <button @click="showDobEdit = !showDobEdit" class="text-blue-600 font-medium text-sm hover:underline">{{ t('editDobBtn', 'Modifica') }}</button>
                        </div>
                        <div v-show="showDobEdit" class="mt-4 border-t border-gray-100 pt-4">
                            <label class="block text-sm text-gray-600 mb-2 font-medium">{{ t('newDobLabel', 'Nuova data di nascita (min 14 anni):') }}</label>
                            <input type="date" v-model="formDob" class="w-full p-3 mb-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-800 focus:outline-none">
                            <button @click="updateDob" :disabled="isUpdatingAuth" class="w-full bg-gray-800 text-white font-bold py-3 rounded-xl hover:bg-black transition-colors disabled:opacity-50">
                                {{ isUpdatingAuth ? t('processingBtn', 'Elaborazione...') : t('updateDobBtn', 'Aggiorna Data') }}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Benessere Digitale -->
                <div class="border-b border-transparent py-3">
                    <button @click="toggleSection('break')" class="w-full flex justify-between items-center py-2 focus:outline-none">
                        <span class="text-xl font-semibold text-gray-800">{{ t('digitalWellbeingTitle', 'Pausa e Benessere Digitale') }}</span>
                        <span class="transform transition-transform duration-200 text-gray-800" :class="{'rotate-180': isSectionOpen('break')}">▼</span>
                    </button>
                    <div v-show="isSectionOpen('break')" class="mt-4 pb-4">
                        <p class="text-gray-600 text-sm mb-4">{{ t('digitalWellbeingDesc', "Imposta un promemoria che ti avvisi quando trascorri troppo tempo sull'app.") }}</p>
                        <select v-model="breakLimit" @change="saveBreakLimit" class="w-full p-3 border border-gray-300 rounded-xl text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-gray-800">
                            <option value="0">{{ t('breakDisabled', 'Disattivato') }}</option>
                            <option value="60">{{ t('breakHour1', '1 ora') }}</option>
                            <option value="120">{{ t('breakHours2', '2 ore') }}</option>
                            <option value="180">{{ t('breakHours3', '3 ore') }}</option>
                            <option value="300">{{ t('breakHours5', '5 ore') }}</option>
                        </select>
                        <p v-if="breakStatusMsg" class="text-xs text-green-600 font-bold mt-2">{{ t('breakSavedMsg', 'Preferenza salvata!') }}</p>
                    </div>
                </div>

            </div>
        </div>
    `
};// Accesso-e-Sicurezza/macro-sicurezza.component.js
window.SettingsComponents = window.SettingsComponents || {};

window.SettingsComponents.MacroSicurezza = {
    props: ['searchQuery', 'activeMacro', 'activeSection', 't', 'isAdmin'],
    emits: ['toggle-macro', 'toggle-section', 'request-delete'],
    setup(props, { emit }) {
        const { computed, onMounted } = Vue;

        const sicurezzaModule = window.SettingsModules.useSicurezza({ 
            Vue, 
            t: props.t, 
            isAdmin: computed(() => props.isAdmin) 
        });

        const privacyModule = window.SettingsModules.usePrivacy({ 
            Vue, 
            t: props.t, 
            currentDob: sicurezzaModule.currentDob 
        });

        onMounted(() => {
            const authInstance = window.auth || firebase.auth();
            authInstance.onAuthStateChanged(async (user) => {
                if (user && window.db) {
                    try {
                        const doc = await window.db.collection('users').doc(user.uid).get();
                        if (doc.exists && doc.data().birthDate) {
                            sicurezzaModule.currentDob.value = doc.data().birthDate;
                        }
                    } catch (e) {
                        console.error("Errore recupero data di nascita:", e);
                    }
                }
            });
        });

        const isOpen = computed(() => {
            if (props.searchQuery && props.searchQuery.trim() !== '') return true;
            return props.activeMacro === 'sicurezza';
        });

        const isSectionOpen = (sectKey) => {
            if (props.searchQuery && props.searchQuery.trim() !== '') return true;
            return props.activeSection === sectKey;
        };

        return {
            ...sicurezzaModule,
            breakLimit: privacyModule.breakLimit,
            breakStatusMsg: privacyModule.breakStatusMsg,
            saveBreakLimit: privacyModule.saveBreakLimit,
            isOpen,
            isSectionOpen,
            toggleMacro: () => emit('toggle-macro', 'sicurezza'),
            toggleSection: (sectKey) => emit('toggle-section', sectKey)
        };
    },
    template: `
        <div class="macro-category border-b border-gray-200 py-2">
            <button @click="toggleMacro" class="w-full flex justify-between items-center py-4 focus:outline-none hover:bg-gray-50 rounded-xl px-2 transition-colors">
                <span class="text-2xl font-bold text-gray-800 uppercase tracking-wider">{{ t('macroSecurity', 'Accesso e Sicurezza') }}</span>
                <span class="transform transition-transform duration-200 text-gray-800" :class="{'rotate-180': isOpen}">▼</span>
            </button>
            <div v-show="isOpen" class="mt-2 pl-4 border-l-2 border-gray-200 pb-2 mb-4">
                
                <!-- Cambio Password -->
                <div class="border-b border-gray-100 py-3">
                    <button @click="toggleSection('password')" class="w-full flex justify-between items-center py-2 focus:outline-none">
                        <span class="text-xl font-semibold text-gray-800">{{ t('changePasswordTitle', 'Cambio Password') }}</span>
                        <span class="transform transition-transform duration-200 text-gray-800" :class="{'rotate-180': isSectionOpen('password')}">▼</span>
                    </button>
                    <div v-show="isSectionOpen('password')" class="mt-4 pb-4">
                        <input type="password" v-model="formPassword.old" :placeholder="t('oldPassPlaceholder', 'Password attuale')" class="w-full p-3 mb-3 rounded-xl border border-gray-300">
                        <input type="password" v-model="formPassword.new" :placeholder="t('newPassPlaceholder', 'Nuova password')" class="w-full p-3 mb-3 rounded-xl border border-gray-300">
                        <button @click="updatePassword" :disabled="isUpdatingAuth" class="w-full bg-gray-800 text-white font-bold py-3 rounded-xl hover:bg-black transition-colors disabled:opacity-50">
                            {{ isUpdatingAuth ? t('processingBtn', 'Elaborazione...') : t('updatePassBtn', 'Aggiorna Password') }}
                        </button>
                    </div>
                </div>

                <!-- Cambio Email -->
                <div class="border-b border-gray-100 py-3">
                    <button @click="toggleSection('email')" class="w-full flex justify-between items-center py-2 focus:outline-none">
                        <span class="text-xl font-semibold text-gray-800">{{ t('changeEmailTitle', 'Cambio Email') }}</span>
                        <span class="transform transition-transform duration-200 text-gray-800" :class="{'rotate-180': isSectionOpen('email')}">▼</span>
                    </button>
                    <div v-show="isSectionOpen('email')" class="mt-4 pb-4">
                        <input type="password" v-model="formEmail.pass" :placeholder="t('oldPassPlaceholder', 'Password attuale')" class="w-full p-3 mb-3 rounded-xl border border-gray-300">
                        <input type="email" v-model="formEmail.new" :placeholder="t('newEmailPlaceholder', 'Nuova e-mail')" class="w-full p-3 mb-3 rounded-xl border border-gray-300">
                        <button @click="updateEmail" :disabled="isUpdatingAuth" class="w-full bg-gray-800 text-white font-bold py-3 rounded-xl hover:bg-black transition-colors disabled:opacity-50">
                            {{ isUpdatingAuth ? t('processingBtn', 'Elaborazione...') : t('updateEmailBtn', 'Aggiorna Email') }}
                        </button>
                    </div>
                </div>

                <!-- Data di Nascita -->
                <div class="border-b border-gray-100 py-3">
                    <button @click="toggleSection('dob')" class="w-full flex justify-between items-center py-2 focus:outline-none">
                        <span class="text-xl font-semibold text-gray-800">{{ t('dobTitle', 'Data di Nascita') }}</span>
                        <span class="transform transition-transform duration-200 text-gray-800" :class="{'rotate-180': isSectionOpen('dob')}">▼</span>
                    </button>
                    <div v-show="isSectionOpen('dob')" class="mt-4 pb-4">
                        <div class="mb-4 bg-gray-50 p-4 rounded-xl border border-gray-200 flex justify-between items-center">
                            <div>
                                <p class="text-xs text-gray-500 font-semibold mb-1">{{ t('currentDobLabel', 'Data attuale:') }}</p>
                                <p class="text-lg font-bold text-gray-800">{{ currentDob || t('noDobSet', 'Nessuna data impostata') }}</p>
                            </div>
                            <button @click="showDobEdit = !showDobEdit" class="text-blue-600 font-medium text-sm hover:underline">{{ t('editDobBtn', 'Modifica') }}</button>
                        </div>
                        <div v-show="showDobEdit" class="mt-4 border-t border-gray-100 pt-4">
                            <label class="block text-sm text-gray-600 mb-2 font-medium">{{ t('newDobLabel', 'Nuova data di nascita (min 14 anni):') }}</label>
                            <input type="date" v-model="formDob" class="w-full p-3 mb-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-800 focus:outline-none">
                            <button @click="updateDob" :disabled="isUpdatingAuth" class="w-full bg-gray-800 text-white font-bold py-3 rounded-xl hover:bg-black transition-colors disabled:opacity-50">
                                {{ isUpdatingAuth ? t('processingBtn', 'Elaborazione...') : t('updateDobBtn', 'Aggiorna Data') }}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Benessere Digitale -->
                <div class="border-b border-transparent py-3">
                    <button @click="toggleSection('break')" class="w-full flex justify-between items-center py-2 focus:outline-none">
                        <span class="text-xl font-semibold text-gray-800">{{ t('digitalWellbeingTitle', 'Pausa e Benessere Digitale') }}</span>
                        <span class="transform transition-transform duration-200 text-gray-800" :class="{'rotate-180': isSectionOpen('break')}">▼</span>
                    </button>
                    <div v-show="isSectionOpen('break')" class="mt-4 pb-4">
                        <p class="text-gray-600 text-sm mb-4">{{ t('digitalWellbeingDesc', "Imposta un promemoria che ti avvisi quando trascorri troppo tempo sull'app.") }}</p>
                        <select v-model="breakLimit" @change="saveBreakLimit" class="w-full p-3 border border-gray-300 rounded-xl text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-gray-800">
                            <option value="0">{{ t('breakDisabled', 'Disattivato') }}</option>
                            <option value="60">{{ t('breakHour1', '1 ora') }}</option>
                            <option value="120">{{ t('breakHours2', '2 ore') }}</option>
                            <option value="180">{{ t('breakHours3', '3 ore') }}</option>
                            <option value="300">{{ t('breakHours5', '5 ore') }}</option>
                        </select>
                        <p v-if="breakStatusMsg" class="text-xs text-green-600 font-bold mt-2">{{ t('breakSavedMsg', 'Preferenza salvata!') }}</p>
                    </div>
                </div>

            </div>
        </div>
    `
};