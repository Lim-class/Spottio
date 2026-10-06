// Accesso-e-Sicurezza/macro-sicurezza.component.js
window.SettingsComponents = window.SettingsComponents || {};

window.SettingsComponents.MacroSicurezza = {
    props: ['searchQuery', 'activeMacro', 'activeSection', 't', 'isAdmin'],
    emits: ['toggle-macro', 'toggle-section', 'request-delete'],
    setup(props, { emit }) {
        const { ref, computed, onMounted, onUnmounted, watch } = Vue;

        const sicurezzaModule = window.SettingsModules.useSicurezza({ 
            Vue, 
            t: props.t, 
            isAdmin: computed(() => props.isAdmin) 
        });

        const computeStats = () => {
            if (window.Spottio && typeof window.Spottio.getRollingWeeklyStats === 'function') {
                const s = window.Spottio.getRollingWeeklyStats();
                if (s && Array.isArray(s.days) && s.days.length === 7) {
                    return s;
                }
            }

            let map = {};
            try {
                const stored = localStorage.getItem('spottio_daily_usage_map');
                map = stored ? JSON.parse(stored) : {};
            } catch (e) {
                map = {};
            }

            const days = [];
            const today = new Date();
            const pad = (n) => String(n).padStart(2, '0');

            for (let i = 6; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
                days.push({
                    dateKey: key,
                    dayOfWeek: d.getDay(),
                    isToday: (i === 0),
                    isYesterday: (i === 1),
                    minutes: Number(map[key]) || 0
                });
            }

            const totalMinutes = days.reduce((acc, curr) => acc + curr.minutes, 0);
            const dailyAverage = Math.round(totalMinutes / 7);
            const maxMinutes = Math.max(...days.map(d => d.minutes), 60);

            return {
                days,
                totalMinutes,
                dailyAverage,
                maxMinutes,
                todayIndex: 6
            };
        };

        const weeklyStats = ref(computeStats());
        const selectedDayIndex = ref(6);
        let componentPollingInterval = null;

        const breakLimit = ref(localStorage.getItem('spottio_break_limit') || '120');
        const breakStatusMsg = ref(false);

        const saveBreakLimit = () => {
            localStorage.setItem('spottio_break_limit', breakLimit.value);
            breakStatusMsg.value = true;
            setTimeout(() => { breakStatusMsg.value = false; }, 2500);
        };

        const selectBar = (index) => {
            selectedDayIndex.value = index;
        };

        const refreshWeeklyStats = () => {
            const data = computeStats();
            weeklyStats.value = {
                ...data,
                days: [...data.days]
            };
        };

        watch(() => props.activeSection, (newSect) => {
            if (newSect === 'break') {
                refreshWeeklyStats();
                selectedDayIndex.value = 6;
            }
        });

        watch(() => props.searchQuery, (q) => {
            if (q && q.trim().length > 0) {
                refreshWeeklyStats();
            }
        });

        const formatDuration = (minutes) => {
            const mins = Number(minutes) || 0;
            const h = Math.floor(mins / 60);
            const m = mins % 60;
            if (h > 0 && m > 0) return `${h}h ${m}m`;
            if (h > 0) return `${h}h`;
            return `${m}m`;
        };

        const dayInitialMap = computed(() => ({
            0: props.t('daySun', 'D'),
            1: props.t('dayMon', 'L'),
            2: props.t('dayTue', 'M'),
            3: props.t('dayWed', 'M'),
            4: props.t('dayThu', 'G'),
            5: props.t('dayFri', 'V'),
            6: props.t('daySat', 'S')
        }));

        const fullDayNameMap = computed(() => ({
            0: props.t('daySunFull', 'Domenica'),
            1: props.t('dayMonFull', 'Lunedì'),
            2: props.t('dayTueFull', 'Martedì'),
            3: props.t('dayWedFull', 'Mercoledì'),
            4: props.t('dayThuFull', 'Giovedì'),
            5: props.t('dayFriFull', 'Venerdì'),
            6: props.t('daySatFull', 'Sabato')
        }));

        const getDayLabel = (dayItem) => {
            if (!dayItem) return '';
            if (dayItem.isToday) return props.t('todayLabel', 'Oggi');
            return dayInitialMap.value[dayItem.dayOfWeek] || '';
        };

        const selectedDayInfo = computed(() => {
            if (!weeklyStats.value.days || weeklyStats.value.days.length === 0) return null;
            const item = weeklyStats.value.days[selectedDayIndex.value];
            if (!item) return null;

            let name = fullDayNameMap.value[item.dayOfWeek] || '';
            if (item.isToday) name = `${props.t('todayLabel', 'Oggi')} (${name})`;
            else if (item.isYesterday) name = `${props.t('yesterdayLabel', 'Ieri')} (${name})`;

            return {
                name: name,
                minutes: item.minutes
            };
        });

        onMounted(() => {
            refreshWeeklyStats();
            selectedDayIndex.value = 6;

            componentPollingInterval = setInterval(() => {
                refreshWeeklyStats();
            }, 30000);

            window.addEventListener('spottio-wellness-updated', refreshWeeklyStats);
            window.addEventListener('storage', refreshWeeklyStats);

            const authInstance = window.auth || (window.firebase && firebase.auth());
            if (authInstance) {
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
            }
        });

        onUnmounted(() => {
            if (componentPollingInterval) clearInterval(componentPollingInterval);
            window.removeEventListener('spottio-wellness-updated', refreshWeeklyStats);
            window.removeEventListener('storage', refreshWeeklyStats);
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
            breakLimit,
            breakStatusMsg,
            saveBreakLimit,
            weeklyStats,
            selectedDayIndex,
            selectBar,
            selectedDayInfo,
            getDayLabel,
            formatDuration,
            isOpen,
            isSectionOpen,
            toggleMacro: () => emit('toggle-macro', 'sicurezza'),
            toggleSection: (sectKey) => {
                emit('toggle-section', sectKey);
                if (sectKey === 'break') {
                    refreshWeeklyStats();
                }
            }
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

                <!-- TEMPO TRASCORSO (STILE INSTAGRAM) -->
                <div class="border-b border-transparent py-3">
                    <button @click="toggleSection('break')" class="w-full flex justify-between items-center py-2 focus:outline-none">
                        <span class="text-xl font-semibold text-gray-800">{{ t('igTimeSpentTitle', 'Tempo trascorso') }}</span>
                        <span class="transform transition-transform duration-200 text-gray-800" :class="{'rotate-180': isSectionOpen('break')}">▼</span>
                    </button>
                    
                    <div v-show="isSectionOpen('break')" class="mt-4 pb-4 space-y-6">
                        
                        <!-- CARD GRAFICO A BARRE -->
                        <div class="bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 shadow-sm">
                            
                            <!-- Media Giornaliera Grande in Evidenza -->
                            <div class="mb-4">
                                <span class="text-4xl font-extrabold text-gray-900 tracking-tight block">
                                    {{ formatDuration(weeklyStats.dailyAverage) }}
                                </span>
                                <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mt-1">
                                    {{ t('igDailyAverageLabel', 'Media giornaliera') }}
                                </span>
                                <p class="text-xs text-gray-400 mt-1 leading-relaxed">
                                    {{ t('igDailyAverageDesc', "Tempo medio trascorso ogni giorno utilizzando l'app Spottio negli ultimi 7 giorni.") }}
                                </p>
                            </div>

                            <!-- Pillola Dettaglio Giorno Toccato (Stile Instagram) -->
                            <div class="h-8 flex items-center justify-start mb-2">
                                <div v-if="selectedDayInfo" class="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-xs font-bold text-gray-800 shadow-2xs">
                                    <span class="w-2 h-2 rounded-full" 
                                          :class="weeklyStats.days[selectedDayIndex]?.isToday ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500' : 'bg-blue-500'"></span>
                                    <span>{{ selectedDayInfo.name }}:</span>
                                    <span class="text-gray-900">{{ formatDuration(selectedDayInfo.minutes) }}</span>
                                </div>
                            </div>

                            <!-- Istogramma a Barre (Rolling 7 Giorni: Oggi è l'ultima a destra) -->
                            <div class="relative pt-6 pb-2">
                                
                                <!-- Linea di riferimento tratteggiata per la media -->
                                <div class="absolute left-0 right-0 border-b border-dashed border-gray-300 pointer-events-none z-0"
                                     :style="{ bottom: Math.min(Math.max((weeklyStats.dailyAverage / weeklyStats.maxMinutes) * 140, 28), 140) + 'px' }">
                                    <span class="absolute right-0 -top-4 text-[9px] font-bold text-gray-400 bg-white px-1">
                                        {{ formatDuration(weeklyStats.dailyAverage) }}
                                    </span>
                                </div>

                                <div class="flex items-end justify-between gap-2 sm:gap-4 h-36 relative z-10 px-1">
                                    <div v-for="(dayItem, idx) in weeklyStats.days" :key="dayItem.dateKey" 
                                         @click="selectBar(idx)"
                                         class="flex-1 flex flex-col items-center h-full justify-end cursor-pointer group select-none">
                                        
                                        <!-- Barra -->
                                        <div class="w-full max-w-[28px] sm:max-w-[34px] rounded-t-lg transition-all duration-200"
                                             :class="[
                                                 dayItem.minutes === 0 ? 'bg-gray-100' : 
                                                 (idx === selectedDayIndex 
                                                     ? (dayItem.isToday 
                                                         ? 'bg-gradient-to-t from-pink-500 to-purple-600 shadow-md ring-2 ring-purple-300' 
                                                         : 'bg-blue-600 shadow-sm ring-2 ring-blue-200')
                                                     : (dayItem.isToday 
                                                         ? 'bg-gradient-to-t from-pink-400 to-purple-500 opacity-90' 
                                                         : 'bg-blue-300 hover:bg-blue-400'))
                                             ]"
                                             :style="{ height: Math.max((dayItem.minutes / weeklyStats.maxMinutes) * 100, 5) + '%' }">
                                        </div>

                                        <!-- Lettera o 'Oggi' in basso -->
                                        <span class="text-[11px] font-semibold mt-2.5 transition-colors whitespace-nowrap"
                                              :class="[
                                                  idx === selectedDayIndex ? 'text-gray-900 font-bold scale-105' : 'text-gray-400',
                                                  dayItem.isToday ? 'text-purple-600 font-extrabold text-[10px]' : ''
                                              ]">
                                            {{ getDayLabel(dayItem) }}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <!-- Totale complessivo ultimi 7 giorni -->
                            <div class="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                                <span class="text-gray-500 font-medium">{{ t('igTotalTimeLabel', 'Tempo totale ultimi 7 giorni:') }}</span>
                                <span class="font-extrabold text-gray-900 text-sm">{{ formatDuration(weeklyStats.totalMinutes) }}</span>
                            </div>
                        </div>

                        <!-- GESTIONE DEL TEMPO (IMPOSTAZIONI PAUSE) -->
                        <div class="bg-gray-50 border border-gray-200 rounded-3xl p-5 space-y-4">
                            <h4 class="text-sm font-bold text-gray-800 uppercase tracking-wider">
                                {{ t('igManageTimeHeading', 'Gestione del tempo') }}
                            </h4>

                            <!-- Promemoria pause continue -->
                            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
                                <div>
                                    <span class="text-sm font-bold text-gray-900 block">
                                        {{ t('igBreakReminderTitle', 'Imposta promemoria per le pause') }}
                                    </span>
                                    <span class="text-xs text-gray-500 leading-tight block mt-0.5">
                                        {{ t('igBreakReminderSub', 'Ricevi una notifica quando trascorri una determinata quantità di tempo continua su Spottio.') }}
                                    </span>
                                </div>

                                <div class="shrink-0">
                                    <select v-model="breakLimit" @change="saveBreakLimit" class="p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-800 cursor-pointer">
                                        <option value="0">{{ t('breakDisabled', 'Disattivato') }}</option>
                                        <option value="60">{{ t('breakHour1', '1 ora') }}</option>
                                        <option value="120">{{ t('breakHours2', '2 ore') }}</option>
                                        <option value="180">{{ t('breakHours3', '3 ore') }}</option>
                                        <option value="300">{{ t('breakHours5', '5 ore') }}</option>
                                    </select>
                                </div>
                            </div>
                            
                            <p v-if="breakStatusMsg" class="text-xs text-green-600 font-bold flex items-center gap-1.5 px-1">
                                <span>✓</span> {{ t('breakSavedMsg', 'Preferenza salvata!') }}
                            </p>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    `
};