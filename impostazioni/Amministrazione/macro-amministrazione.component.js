// Amministrazione/macro-amministrazione.component.js
window.SettingsComponents = window.SettingsComponents || {};

window.SettingsComponents.MacroAmministrazione = {
    props: ['searchQuery', 'activeMacro', 'activeSection', 'isAdmin', 't'],
    emits: ['toggle-macro', 'toggle-section'],
    setup(props, { emit }) {
        const { computed } = Vue;

        const isOpen = computed(() => {
            if (props.searchQuery && props.searchQuery.trim() !== '') return true;
            return props.activeMacro === 'admin';
        });

        const isSectionOpen = (sectKey) => {
            if (props.searchQuery && props.searchQuery.trim() !== '') return true;
            return props.activeSection === sectKey;
        };

        return {
            isOpen,
            isSectionOpen,
            toggleMacro: () => emit('toggle-macro', 'admin'),
            toggleSection: (sectKey) => emit('toggle-section', sectKey)
        };
    },
    template: `
        <div v-show="isAdmin" class="macro-category border-b border-gray-200 py-2">
            <button @click="toggleMacro" class="w-full flex justify-between items-center py-4 focus:outline-none hover:bg-gray-50 rounded-xl px-2 transition-colors">
                <span class="text-2xl font-bold text-gray-800 uppercase tracking-wider">{{ t('macroAdmin', 'Amministrazione') }}</span>
                <span class="transform transition-transform duration-200 text-gray-800" :class="{'rotate-180': isOpen}">▼</span>
            </button>
            <div v-show="isOpen" class="mt-2 pl-4 border-l-2 border-gray-200 pb-2 mb-4">
                <div class="border-b border-transparent py-3">
                    <button @click="toggleSection('adminSect')" class="w-full flex justify-between items-center py-2 focus:outline-none">
                        <span class="text-xl font-semibold text-gray-800">{{ t('platformManagementTitle', 'Gestione Piattaforma') }}</span>
                        <span class="transform transition-transform duration-200 text-gray-800" :class="{'rotate-180': isSectionOpen('adminSect')}">▼</span>
                    </button>
                    <div v-show="isSectionOpen('adminSect')" class="mt-4 pb-4">
                        <a href="../segnalazioni/segnalazioni.html" class="w-full bg-gray-800 text-white font-bold py-3 rounded-xl hover:bg-black transition shadow-md flex justify-center items-center gap-2">
                            <span>{{ t('adminActions', 'Visualizza Segnalazioni') }}</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `
};