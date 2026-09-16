// Privacy/macro-privacy.component.js
window.SettingsComponents = window.SettingsComponents || {};

window.SettingsComponents.MacroPrivacy = {
    props: ['searchQuery', 'activeMacro', 'activeSection', 't'],
    emits: ['toggle-macro', 'toggle-section'],
    setup(props, { emit }) {
        const { computed, onMounted } = Vue;

        const privacyModule = window.SettingsModules.usePrivacy({ 
            Vue, 
            t: props.t 
        });

        const isOpen = computed(() => {
            if (props.searchQuery && props.searchQuery.trim() !== '') return true;
            return props.activeMacro === 'privacy';
        });

        const isSectionOpen = (sectKey) => {
            if (props.searchQuery && props.searchQuery.trim() !== '') return true;
            return props.activeSection === sectKey;
        };

        const openMedia = (url) => {
            if (url) window.open(url, '_blank');
        };

        onMounted(() => {
            const checkAuth = setInterval(async () => {
                if (window.auth && window.db) {
                    clearInterval(checkAuth);
                    const uid = window.SettingsModules ? window.SettingsModules.getUid() : (window.auth.currentUser?.uid || localStorage.getItem('currentUid'));
                    if (uid) {
                        await privacyModule.loadPrivacyState(uid);
                        await privacyModule.loadAccountStatus(uid);
                    }
                }
            }, 100);
        });

        return {
            ...privacyModule,
            isOpen,
            isSectionOpen,
            openMedia,
            toggleMacro: () => emit('toggle-macro', 'privacy'),
            toggleSection: (sectKey) => emit('toggle-section', sectKey)
        };
    },
    template: `
        <div class="macro-category border-b border-gray-200 py-2">
            <button @click="toggleMacro" class="w-full flex justify-between items-center py-4 focus:outline-none hover:bg-gray-50 rounded-xl px-2 transition-colors">
                <span class="text-2xl font-bold text-gray-800 uppercase tracking-wider">{{ t('macroPrivacy', 'Privacy') }}</span>
                <span class="transform transition-transform duration-200 text-gray-800" :class="{'rotate-180': isOpen}">▼</span>
            </button>
            <div v-show="isOpen" class="mt-2 pl-4 border-l-2 border-gray-200 pb-2 mb-4">
                
                <!-- Privacy Profilo -->
                <div class="border-b border-gray-100 py-3">
                    <button @click="toggleSection('privacyProfile')" class="w-full flex justify-between items-center py-2 focus:outline-none">
                        <span class="text-xl font-semibold text-gray-800">{{ t('privacyProfileTitle', 'Privacy Profilo') }}</span>
                        <span class="transform transition-transform duration-200 text-gray-800" :class="{'rotate-180': isSectionOpen('privacyProfile')}">▼</span>
                    </button>
                    <div v-show="isSectionOpen('privacyProfile')" class="mt-4 pb-4">
                        <div class="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <div>
                                <h4 class="font-bold text-gray-800 text-lg">{{ t('privateAccountTitle', 'Account Privato') }}</h4>
                                <p class="text-sm text-gray-500">{{ t('privateAccountDesc', 'I follower attuali non saranno influenzati.') }}</p>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" v-model="isPrivateAccount" @change="togglePrivacyAccount" class="sr-only peer">
                                <div class="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gray-800"></div>
                            </label>
                        </div>
                        <p v-if="privacyStatusMsg" :class="privacyStatusClass">{{ privacyStatusMsg }}</p>
                    </div>
                </div>

                <!-- Esporta Dati -->
                <div class="border-b border-gray-100 py-3">
                    <button @click="toggleSection('export')" class="w-full flex justify-between items-center py-2 focus:outline-none">
                        <span class="text-xl font-semibold text-gray-800">{{ t('exportDataTitle', 'Esporta Dati') }}</span>
                        <span class="transform transition-transform duration-200 text-gray-800" :class="{'rotate-180': isSectionOpen('export')}">▼</span>
                    </button>
                    <div v-show="isSectionOpen('export')" class="mt-4 text-center pb-4">
                        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mx-auto">
                            <button @click="exportData('json')" :disabled="isExporting" class="w-full sm:w-auto bg-gray-800 text-white font-bold py-3 px-6 rounded-lg hover:bg-black shadow-md transition duration-200">
                                {{ isExporting ? t('processingBtn', 'Elaborazione...') : t('exportJsonBtn', 'Esporta JSON') }}
                            </button>
                            <button @click="exportData('html')" :disabled="isExporting" class="w-full sm:w-auto bg-gray-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-700 shadow-md transition duration-200">
                                {{ isExporting ? t('processingBtn', 'Elaborazione...') : t('exportHtmlBtn', 'Esporta HTML') }}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Stato Account e Segnalazioni -->
                <div class="border-b border-transparent py-3">
                    <button @click="toggleSection('accountStatus')" class="w-full flex justify-between items-center py-2 focus:outline-none">
                        <span class="text-xl font-semibold text-gray-800">{{ t('accountStatusSectionTitle', 'Stato Account e Segnalazioni') }}</span>
                        <span class="transform transition-transform duration-200 text-gray-800" :class="{'rotate-180': isSectionOpen('accountStatus')}">▼</span>
                    </button>
                    <div v-show="isSectionOpen('accountStatus')" class="mt-4 pb-4">
                        <div class="bg-gray-50 p-5 rounded-xl border border-gray-200 text-sm text-gray-800 space-y-3">
                            <div v-if="isLoadingReports" class="flex justify-center py-8"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div></div>
                            <div v-else>
                                <div class="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-gray-200">
                                    <div><span class="text-xs text-gray-400 uppercase font-bold tracking-wider block mb-1">{{ t('accountStatusLabel', "Stato dell'account:") }}</span><span v-html="accountStatus.badge"></span></div>
                                    <div class="text-right"><span class="text-xs text-gray-400 uppercase font-bold tracking-wider block mb-1">{{ t('penaltyLabel', 'Penalità:') }}</span><span class="text-lg font-extrabold text-gray-800">{{ totalPenaltyPoints }} <span class="text-xs text-gray-400 font-normal">/ 20 {{ t('pointsUnit', 'pt') }}</span></span></div>
                                </div>
                                <div v-if="bannedObj.status" class="bg-red-50 p-4 rounded-2xl border border-red-200 mt-4 space-y-2">
                                    <div class="flex items-center gap-2 text-red-800 font-bold text-xs uppercase tracking-wider">{{ t('suspensionActive', 'Sospensione Attiva') }}</div>
                                    <button @click="openGeneralAppealModal" class="mt-2 text-xs bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-xl transition shadow-sm inline-block">{{ t('generalAppealBtn', 'Fai Ricorso Generale') }}</button>
                                </div>
                                <div class="mt-6 pt-4 border-t border-gray-200">
                                    <div class="flex items-center justify-between mb-4">
                                        <h4 class="font-bold text-gray-800 text-sm tracking-wide">{{ t('reportedSpotsTitle', 'I Tuoi Spot Segnalati') }} ({{ userReports.length }})</h4>
                                    </div>
                                    <div class="space-y-6 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
                                        <div v-if="userReports.length === 0" class="bg-white p-6 rounded-2xl border border-dashed border-gray-300 text-center">{{ t('noReportsFound', 'Nessuna segnalazione registrata') }}</div>
                                        
                                        <!-- Report & Post Card -->
                                        <div v-for="report in userReports" :key="report.id" class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                            <div class="p-3.5 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
                                                <div class="flex items-center gap-2">
                                                    <span class="bg-red-100 text-red-700 font-bold px-2.5 py-0.5 rounded-full text-[11px] border border-red-200">{{ formatReason(report.reason) }}</span>
                                                </div>
                                                <div class="flex items-center gap-2">
                                                    <span class="text-[11px] font-mono font-bold text-red-600 bg-white px-2 py-0.5 rounded-md border border-red-200">+{{ report.computedPoints }} {{ t('pointsUnit', 'pt') }}</span>
                                                    <button @click="openPostAppealModal(report)" class="text-xs font-bold text-blue-600 hover:text-blue-800 bg-white hover:bg-blue-50 border border-blue-200 px-3 py-1 rounded-xl transition shadow-sm">{{ t('appealBtn', 'Contesta') }}</button>
                                                </div>
                                            </div>
                                            
                                            <!-- Contenuto Spot -->
                                            <div class="p-4 bg-gray-100">
                                                <div v-if="report.isPostLoading" class="animate-pulse space-y-2">
                                                    <div class="h-3 bg-gray-200 rounded w-1/3"></div>
                                                    <div class="h-3 bg-gray-200 rounded w-2/3"></div>
                                                </div>
                                                <div v-else-if="!report.postData" class="text-xs text-gray-400 italic p-3 text-center bg-white rounded-xl">
                                                    {{ t('postRemovedOrUnavailable', 'Post rimosso o non più disponibile.') }}
                                                </div>
                                                <div v-else class="bg-white p-4 rounded-xl border border-gray-200">
                                                    <div class="flex items-center justify-between mb-2">
                                                        <div class="flex items-center gap-1.5 flex-wrap">
                                                            <span class="font-bold text-xs text-gray-800">{{ report.authorProfile?.username || t('defaultUserAuthor', 'Utente') }}</span>
                                                            <span v-for="cat in (report.postCategories || [])" :key="cat" class="bg-blue-50 text-blue-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-blue-200">{{ cat }}</span>
                                                        </div>
                                                        <span class="text-[10px] text-gray-400">{{ formatDate(report.postData.timestamp) }}</span>
                                                    </div>
                                                    <p class="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{{ report.postData.text || '' }}</p>
                                                    
                                                    <div v-if="report.postData.mediaList && report.postData.mediaList.length > 0" class="mt-2.5 flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                                                        <template v-for="item in report.postData.mediaList" :key="item.url">
                                                            <video v-if="item.isVideo" :src="item.url" controls class="max-h-40 rounded-lg bg-black object-contain"></video>
                                                            <img v-else :src="item.url" @click="openMedia(item.url)" class="max-h-40 rounded-lg object-contain bg-black cursor-pointer shadow-sm">
                                                        </template>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Modale Contestazione Segnalazione Incapsulato -->
                <div v-if="showAppealModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div class="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 relative">
                        <div class="flex justify-between items-center pb-3 border-b border-gray-100 mb-4">
                            <h3 class="text-base font-bold text-blue-700">{{ t('appealModalTitle', 'Contesta la Segnalazione') }}</h3>
                            <button @click="showAppealModal = false" class="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
                        </div>
                        <form @submit.prevent="submitAppeal" class="space-y-4">
                            <textarea v-model="appealText" rows="4" required class="w-full p-3 border border-gray-300 rounded-xl text-xs" :placeholder="t('appealPlaceholder', 'Descrivi le motivazioni del tuo ricorso...')"></textarea>
                            <div class="flex justify-end gap-2 pt-2 border-t border-gray-100">
                                <button type="button" @click="showAppealModal = false" class="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl">{{ t('appealModalCancel', 'Annulla') }}</button>
                                <button type="submit" :disabled="isSubmittingAppeal" class="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl">
                                    {{ isSubmittingAppeal ? t('appealModalSubmitting', 'Invio in corso...') : t('appealModalSubmit', 'Invia') }}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    `
};