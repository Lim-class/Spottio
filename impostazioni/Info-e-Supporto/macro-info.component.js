// Info-e-Supporto/macro-info.component.js
window.SettingsComponents = window.SettingsComponents || {};

window.SettingsComponents.MacroInfo = {
    props: ['searchQuery', 'activeMacro', 'activeSection', 'currentLang', 't'],
    emits: ['toggle-macro', 'toggle-section'],
    setup(props, { emit }) {
        const { computed } = Vue;

        const infoModule = window.SettingsModules.useInfo({ 
            Vue, 
            currentLang: computed(() => props.currentLang), 
            searchQuery: computed(() => props.searchQuery || '') 
        });

        const isOpen = computed(() => {
            if (props.searchQuery && props.searchQuery.trim() !== '') return true;
            return props.activeMacro === 'info';
        });

        const isSectionOpen = (sectKey) => {
            if (props.searchQuery && props.searchQuery.trim() !== '') return true;
            return props.activeSection === sectKey;
        };

        return {
            ...infoModule,
            isOpen,
            isSectionOpen,
            toggleMacro: () => emit('toggle-macro', 'info'),
            toggleSection: (sectKey) => emit('toggle-section', sectKey)
        };
    },
    template: `
        <div class="macro-category border-b border-gray-200 py-2">
            <button @click="toggleMacro" class="w-full flex justify-between items-center py-4 focus:outline-none hover:bg-gray-50 rounded-xl px-2 transition-colors">
                <span class="text-2xl font-bold text-gray-800 uppercase tracking-wider">{{ t('macroInfo', 'Info e Supporto') }}</span>
                <span class="transform transition-transform duration-200 text-gray-800" :class="{'rotate-180': isOpen}">▼</span>
            </button>
            <div v-show="isOpen" class="mt-2 pl-4 border-l-2 border-gray-200 pb-2 mb-4">
                
                <!-- Applicazioni e Download -->
                <div class="border-b border-gray-100 py-3">
                    <button @click="toggleSection('apps')" class="w-full flex justify-between items-center py-2 focus:outline-none">
                        <span class="text-xl font-semibold text-gray-800">{{ t('appsAndDownloadsTitle', 'Applicazioni e Download') }}</span>
                        <span class="transform transition-transform duration-200 text-gray-800" :class="{'rotate-180': isSectionOpen('apps')}">▼</span>
                    </button>
                    <div v-show="isSectionOpen('apps')" class="mt-4 pb-4 w-full min-w-0">
                        <div class="w-full max-w-full overflow-x-auto custom-scrollbar pb-4 pt-1">
                            <div class="flex gap-4 flex-nowrap w-max">
                                <!-- Card 1: GamePlus -->
                                <div class="bg-[#0f172a] text-white rounded-2xl p-5 flex flex-col justify-between shadow-lg relative w-64 shrink-0">
                                    <div class="relative z-10 flex flex-col items-center text-center">
                                        <img src="https://i.ibb.co/35pHbCnF/game.png" class="w-20 h-20 rounded-2xl mb-3">
                                        <h4 class="font-bold text-lg mb-1">GamePlus Web</h4>
                                        <p class="text-xs text-slate-300 mb-4">{{ t('gamePlusDesc', 'Piattaforma di gioco online') }}</p>
                                    </div>
                                    <a href="https://gameplus-web.example.com" target="_blank" class="w-full py-2.5 bg-emerald-500 text-white font-bold rounded-xl text-center text-sm shadow">{{ t('visitGamePlusBtn', 'Visita GamePlus') }}</a>
                                </div>

                                <!-- Card 2: APK Spottio -->
                                <div class="bg-gray-900 text-white rounded-2xl p-5 flex flex-col justify-between shadow-lg relative w-64 shrink-0">
                                    <div class="relative z-10 flex flex-col items-center text-center">
                                        <img src="https://i.ibb.co/b5HgvzCB/Spottio-Logo-2.png" class="w-20 h-20 rounded-2xl mb-3">
                                        <h4 class="font-bold text-lg mb-1">{{ t('downloadAppTitle', 'Scarica App (APK)') }}</h4>
                                        <p class="text-xs text-slate-300 mb-4">{{ t('downloadAppDesc', 'Scarica per Android.') }}</p>
                                    </div>
                                    <a href="../Spottio.pdf" download class="w-full py-2.5 bg-blue-600 text-white font-bold rounded-xl text-center text-sm shadow">{{ t('downloadApkBtn', 'Scarica APK') }}</a>
                                </div>

                                <!-- Card 3: Main Site -->
                                <div class="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-5 flex flex-col justify-between shadow-lg relative w-64 shrink-0">
                                    <div class="relative z-10 flex flex-col items-center text-center">
                                        <img src="../Logo main-site/Logo_bis_me.jpg" class="w-20 h-20 rounded-2xl mb-3 object-cover shadow-md">
                                        <h4 class="font-bold text-lg mb-1">Main Site</h4>
                                        <p class="text-xs text-slate-300 mb-4">{{ t('mainSiteDesc', 'Accedi alla piattaforma web integrata e alle utility.') }}</p>
                                    </div>
                                    <a href="https://sites.google.com/view/giochi-vari/app?authuser=0" target="_blank" class="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl text-center text-sm shadow transition">{{ t('exploreSiteBtn', 'Esplora Sito') }}</a>
                                </div>

                                <!-- Card 4: Trillionaire -->
                                <div class="bg-gradient-to-br from-violet-900 to-purple-950 text-white rounded-2xl p-5 flex flex-col justify-between shadow-lg relative w-64 shrink-0">
                                    <div class="relative z-10 flex flex-col items-center text-center">
                                        <img src="https://i.ibb.co/PGydXgGr/Bilionario-1.png" class="w-20 h-20 rounded-2xl mb-3 object-cover shadow-md">
                                        <h4 class="font-bold text-lg mb-1">Trillionaire</h4>
                                        <p class="text-xs text-slate-300 mb-4">{{ t('trillionaireDesc', 'Scopri novità, articoli e aggiornamenti sul nostro network.') }}</p>
                                    </div>
                                    <a href="https://lim-class.github.io/Chi-vuol-essere-Bilionario/" target="_blank" class="w-full py-2.5 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl text-center text-sm shadow transition">{{ t('visitHubBtn', 'Vai al Hub') }}</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- FAQ -->
                <div class="border-b border-gray-100 py-3">
                    <button @click="toggleSection('faq')" class="w-full flex justify-between items-center py-2 focus:outline-none">
                        <span class="text-xl font-semibold text-gray-800">{{ t('faqTitle', 'Domande Frequenti (FAQ)') }}</span>
                        <span class="transform transition-transform duration-200 text-gray-800" :class="{'rotate-180': isSectionOpen('faq')}">▼</span>
                    </button>
                    <div v-show="isSectionOpen('faq')" class="mt-4 pb-4">
                        <div class="space-y-3">
                            <div v-for="cat in filteredFaq" :key="cat.id" class="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden mb-3">
                                <button @click="toggleFaqCat(cat.id)" class="w-full flex justify-between items-center p-4 text-left font-semibold text-gray-800 hover:bg-gray-100">
                                    <span class="flex items-center gap-2.5 text-base"><span>{{ cat.icon }}</span> <span>{{ getFaqTitle(cat.title) }}</span></span>
                                    <span class="transform transition-transform duration-200 text-gray-500 text-xs" :class="{'rotate-180': isFaqCatOpen(cat.id)}">▼</span>
                                </button>
                                <div v-show="isFaqCatOpen(cat.id)" class="p-3 border-t border-gray-200 bg-gray-100/50 space-y-2">
                                    <div v-for="q in cat.questions" :key="q.id" v-show="q.matches" class="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300">
                                        <button @click="toggleFaqQ(q.id)" class="w-full flex justify-between items-center p-3 text-left font-medium text-gray-800 hover:bg-gray-50">
                                            <span class="text-sm font-semibold text-gray-700 pr-2">{{ getFaqTitle(q.q) }}</span>
                                            <span class="transform transition-transform duration-200 text-gray-400 text-xs shrink-0" :class="{'rotate-180': isFaqQOpen(q.id)}">▼</span>
                                        </button>
                                        <div v-show="isFaqQOpen(q.id)" class="px-4 pb-3 pt-1 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-100 bg-gray-50/50"><p>{{ getFaqTitle(q.a) }}</p></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Storia -->
                <div class="border-b border-gray-100 py-3">
                    <button @click="toggleSection('storia')" class="w-full flex justify-between items-center py-2 focus:outline-none">
                        <span class="text-xl font-semibold text-gray-800">{{ t('storyTitle', 'Storia di Spottio') }}</span>
                        <span class="transform transition-transform duration-200 text-gray-800" :class="{'rotate-180': isSectionOpen('storia')}">▼</span>
                    </button>
                    <div v-show="isSectionOpen('storia')" class="mt-4 pb-4">
                        <div class="bg-gray-50 p-5 rounded-xl border border-gray-200 text-sm text-gray-800 leading-relaxed space-y-4">
                            <p v-for="(p, idx) in storiaParagraphs" :key="idx" class="text-gray-700 leading-relaxed text-base mb-4">
                                {{ p }}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Informativa Privacy -->
                <div class="border-b border-gray-100 py-3">
                    <button @click="toggleSection('privacyDoc')" class="w-full flex justify-between items-center py-2 focus:outline-none">
                        <span class="text-xl font-semibold text-gray-800">{{ t('privacyDocTitle', 'Informativa Privacy') }}</span>
                        <span class="transform transition-transform duration-200 text-gray-800" :class="{'rotate-180': isSectionOpen('privacyDoc')}">▼</span>
                    </button>
                    <div v-show="isSectionOpen('privacyDoc')" class="mt-4 pb-4">
                        <div class="bg-gray-50 p-5 rounded-xl border border-gray-200 text-sm text-gray-800 leading-relaxed space-y-4">
                            <template v-for="(block, idx) in privacyBlocks" :key="idx">
                                <h2 v-if="block.type === 'h2'" class="text-lg font-bold text-gray-800 mt-4 mb-2">{{ block.text }}</h2>
                                <p v-else-if="block.type === 'p'" class="text-gray-700 leading-relaxed text-sm mb-3" :class="{'font-medium text-blue-900 bg-blue-50 p-3 rounded-lg border border-blue-100': block.highlight}">
                                    {{ block.text }}
                                </p>
                                <ul v-else-if="block.type === 'ul'" class="list-disc pl-5 space-y-2 text-sm text-gray-700 mb-4">
                                    <li v-for="(item, iIdx) in block.items" :key="iIdx">
                                        <strong v-if="item.label" class="text-gray-800">{{ item.label }}: </strong>{{ item.text }}
                                    </li>
                                </ul>
                            </template>
                        </div>
                    </div>
                </div>

                <!-- Policy della Community -->
                <div class="border-b border-transparent py-3">
                    <button @click="toggleSection('policy')" class="w-full flex justify-between items-center py-2 focus:outline-none">
                        <span class="text-xl font-semibold text-gray-800">{{ t('communityPolicyTitle', 'Policy della Community') }}</span>
                        <span class="transform transition-transform duration-200 text-gray-800" :class="{'rotate-180': isSectionOpen('policy')}">▼</span>
                    </button>
                    <div v-show="isSectionOpen('policy')" class="mt-4 pb-4">
                        <div class="bg-gray-50 p-5 rounded-xl border border-gray-200 text-sm text-gray-800 leading-relaxed space-y-4">
                            <template v-for="(block, idx) in policyBlocks" :key="idx">
                                <h2 v-if="block.type === 'h2'" class="text-lg font-bold text-gray-800 mt-4 mb-2">{{ block.text }}</h2>
                                <p v-else-if="block.type === 'p'" class="text-gray-700 leading-relaxed text-sm mb-3">
                                    {{ block.text }}
                                </p>
                                <ul v-else-if="block.type === 'ul'" class="list-disc pl-5 space-y-2 text-sm text-gray-700 mb-4">
                                    <li v-for="(item, iIdx) in block.items" :key="iIdx">
                                        <strong v-if="item.label" class="text-gray-800">{{ item.label }}: </strong>{{ item.text }}
                                    </li>
                                </ul>
                            </template>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    `
};