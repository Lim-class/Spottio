// Aspetto-e-Lingua/macro-aspetto.component.js
window.SettingsComponents = window.SettingsComponents || {};

window.SettingsComponents.MacroAspetto = {
    props: ['searchQuery', 'activeMacro', 'activeSection', 't'],
    emits: ['toggle-macro', 'toggle-section'],
    setup(props, { emit }) {
        const { computed, onMounted } = Vue;

        const aspettoModule = window.SettingsModules.useAspetto({ Vue });

        const isOpen = computed(() => {
            if (props.searchQuery && props.searchQuery.trim() !== '') return true;
            return props.activeMacro === 'aspetto';
        });

        const isSectionOpen = (sectKey) => {
            if (props.searchQuery && props.searchQuery.trim() !== '') return true;
            return props.activeSection === sectKey;
        };

        const initLanguageSync = () => {
            const checkDropdown = setInterval(() => {
                const toggleBtn = document.getElementById('language-toggle');
                const dropdownContainer = document.getElementById('language-dropdown-container');
                
                if (toggleBtn && dropdownContainer && typeof window.getLanguageDropdownHTML === 'function') {
                    clearInterval(checkDropdown);
                    dropdownContainer.innerHTML = window.getLanguageDropdownHTML();

                    const dropdownMenu = document.getElementById('language-dropdown-menu');
                    const selectedFlag = document.getElementById('selected-flag');
                    const selectedLangText = document.getElementById('selected-lang-text');
                    const dropdownIcon = document.getElementById('dropdown-icon');

                    const updateTriggerUI = (code) => {
                        const activeLang = (window.APP_LANGUAGES || []).find(l => l.code === code) || { text: 'Italiano', flag: 'it.svg' };
                        if (selectedFlag) selectedFlag.src = `https://flagcdn.com/${activeLang.flag}`;
                        if (selectedLangText) selectedLangText.textContent = activeLang.text;
                    };

                    updateTriggerUI(localStorage.getItem('selectedLanguage') || 'it');

                    toggleBtn.onclick = (e) => {
                        e.stopPropagation();
                        if (!dropdownMenu) return;
                        const isHidden = dropdownMenu.classList.contains('hidden');
                        dropdownMenu.classList.toggle('hidden', !isHidden);
                        if (dropdownIcon) dropdownIcon.classList.toggle('rotate-180', isHidden);
                    };

                    document.addEventListener('click', (e) => {
                        if (dropdownMenu && !dropdownMenu.contains(e.target) && !toggleBtn.contains(e.target)) {
                            dropdownMenu.classList.add('hidden');
                            if (dropdownIcon) dropdownIcon.classList.remove('rotate-180');
                        }
                    });

                    dropdownContainer.querySelectorAll('.lang-option').forEach(btn => {
                        btn.onclick = (e) => {
                            e.stopPropagation();
                            const newCode = btn.getAttribute('data-lang');
                            if (!newCode) return;

                            localStorage.setItem('selectedLanguage', newCode);
                            document.documentElement.lang = newCode;
                            updateTriggerUI(newCode);

                            if (dropdownMenu) dropdownMenu.classList.add('hidden');
                            if (dropdownIcon) dropdownIcon.classList.remove('rotate-180');

                            if (typeof window.translatePage === 'function') {
                                window.translatePage(newCode);
                            }
                            window.dispatchEvent(new CustomEvent('spottio-language-changed', { detail: newCode }));
                        };
                    });
                }
            }, 50);
        };

        onMounted(() => {
            aspettoModule.loadColors();
            initLanguageSync();
        });

        return {
            ...aspettoModule,
            isOpen,
            isSectionOpen,
            toggleMacro: () => emit('toggle-macro', 'aspetto'),
            toggleSection: (sectKey) => emit('toggle-section', sectKey)
        };
    },
    template: `
        <div class="macro-category border-b border-gray-200 py-2">
            <button @click="toggleMacro" class="w-full flex justify-between items-center py-4 focus:outline-none hover:bg-gray-50 rounded-xl px-2 transition-colors">
                <span class="text-2xl font-bold text-gray-800 uppercase tracking-wider">{{ t('macroAppearance', 'Aspetto e Lingua') }}</span>
                <span class="transform transition-transform duration-200 text-gray-800" :class="{'rotate-180': isOpen}">▼</span>
            </button>
            <div v-show="isOpen" class="mt-2 pl-4 border-l-2 border-gray-200 pb-2 mb-4">
                
                <!-- Sotto-sezione Lingua -->
                <div class="border-b border-gray-100 py-3">
                    <button @click="toggleSection('lingua')" class="w-full flex justify-between items-center py-2 focus:outline-none">
                        <span class="text-xl font-semibold text-gray-800">{{ t('langSection', 'Lingua') }}</span>
                        <span class="transform transition-transform duration-200 text-gray-800" :class="{'rotate-180': isSectionOpen('lingua')}">▼</span>
                    </button>
                    <div v-show="isSectionOpen('lingua')" class="mt-4 pb-4">
                        <div class="relative w-full max-w-xs mx-auto">
                            <button id="language-toggle" class="flex justify-between items-center w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-300">
                                <div class="flex items-center gap-2">
                                    <img id="selected-flag" src="https://flagcdn.com/it.svg" class="h-4 w-6 rounded-sm">
                                    <span id="selected-lang-text" class="font-bold text-[#0a2342]">Italiano</span>
                                </div>
                                <svg id="dropdown-icon" class="w-4 h-4 transition-transform text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            </button>
                            <div id="language-dropdown-container" class="mt-2 w-full"></div>
                        </div>
                    </div>
                </div>

                <!-- Sotto-sezione Colore di Sfondo -->
                <div class="border-b border-transparent py-3">
                    <button @click="toggleSection('colori')" class="w-full flex justify-between items-center py-2 focus:outline-none">
                        <span class="text-xl font-semibold text-gray-800">{{ t('backgroundTitle', 'Colore di Sfondo') }}</span>
                        <span class="transform transition-transform duration-200 text-gray-800" :class="{'rotate-180': isSectionOpen('colori')}">▼</span>
                    </button>
                    
                    <div v-show="isSectionOpen('colori')" class="mt-4 overflow-hidden">
                        <!-- Barra di Ricerca Colori -->
                        <div class="relative mb-4 w-full max-w-xs sm:max-w-sm mx-auto">
                            <input type="text" v-model="colorSearchQuery" :placeholder="t('searchColorsPlaceholder', 'Cerca per nome, HEX o RGB')" 
                                   class="w-full p-2.5 pl-9 rounded-xl border border-gray-300 text-xs sm:text-sm focus:ring-2 focus:ring-gray-800 focus:outline-none transition shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 absolute left-3 top-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        <!-- Griglia Colori -->
                        <div class="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4 max-w-xs sm:max-w-md mx-auto justify-items-center py-2">
                            <button v-for="color in paginatedColors" :key="color.hex" 
                                    @click="saveAndApplyColor(color.hex, color.nome)" 
                                    :title="color.nome" 
                                    class="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-gray-300 shadow-sm focus:outline-none focus:ring-4 focus:ring-gray-200 transition duration-150 transform hover:scale-110 active:scale-95 shrink-0" 
                                    :style="{ backgroundColor: color.hex }">
                            </button>
                        </div>

                        <!-- Paginazione -->
                        <div v-if="totalPages > 1" class="flex items-center justify-center gap-3 mt-3 mb-2">
                            <button @click="prevPage" :disabled="currentPage === 1" 
                                    class="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed transition">
                                ‹
                            </button>
                            <span class="text-xs sm:text-sm font-semibold text-gray-600 select-none">
                                {{ currentPage }} / {{ totalPages }}
                            </span>
                            <button @click="nextPage" :disabled="currentPage === totalPages" 
                                    class="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed transition">
                                ›
                            </button>
                        </div>

                        <!-- Selettore Custom Color -->
                        <div class="mt-4 pt-4 border-t border-gray-100 flex flex-col items-center">
                            <label class="block text-xs sm:text-sm font-medium text-gray-800 mb-2">{{ t('createColorLabel', 'Crea il tuo colore:') }}</label>
                            <div class="flex items-center gap-3">
                                <input type="color" v-model="customColorInput" @input="detectColorName" 
                                       class="w-10 h-10 sm:w-12 sm:h-12 cursor-pointer rounded-xl border-2 border-gray-300 bg-transparent transition-transform hover:scale-105">
                                <button @click="saveCustomColor" 
                                        class="bg-gray-800 text-white text-xs sm:text-sm font-semibold py-2 px-4 rounded-xl hover:bg-black transition shadow-sm active:scale-95">
                                    {{ t('saveBtn', 'Salva') }}
                                </button>
                            </div>
                            <p class="text-[11px] sm:text-xs text-gray-500 mt-2 italic text-center px-4">
                                {{ detectedColorName || t('chooseColorPlaceholder', 'Scegli un colore per vedere il nome...') }}
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    `
};