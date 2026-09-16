// =========================================================================
// FILE: impostazioni/spottio-wellness.js
// Utility Globali: Benessere Digitale, Compleanni e Tracciamento Sessione
// =========================================================================

window.Spottio = window.Spottio || {};

Object.assign(window.Spottio, {
    calculateAge: function(birthDateString) {
        if (!birthDateString) return 0;
        let birthDate;
        if (birthDateString.includes('/')) {
            const [d, m, y] = birthDateString.split('/');
            birthDate = new Date(`${y}-${m}-${d}`);
        } else {
            birthDate = new Date(birthDateString);
        }
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    },

    trackUserIp: async function(uid) {
        if (!uid || uid === "Guest") return;
        const cachedIp = sessionStorage.getItem('spottio_last_ip');

        try {
            const res = await fetch('https://api.ipify.org?format=json');
            if (!res.ok) return;
            const data = await res.json();
            const currentIp = data.ip;

            if (!currentIp || currentIp === cachedIp) return;

            const dbInstance = window.db || (typeof firebase !== 'undefined' && firebase.firestore ? firebase.firestore() : null);
            if (dbInstance) {
                await dbInstance.collection("users").doc(uid).set({
                    last_ip: currentIp,
                    last_ip_update: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

                sessionStorage.setItem('spottio_last_ip', currentIp);
            }
        } catch (err) {
            console.warn("Impossibile tracciare l'indirizzo IP:", err);
        }
    },

    checkBirthdayGreeting: async function(uid) {
        if (!uid || uid === "Guest") return;
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentDay = today.getDate();
        const currentMonth = today.getMonth() + 1;

        const greetedYear = localStorage.getItem(`spottio_birthday_greeted_${uid}`);
        if (greetedYear === String(currentYear)) return;

        try {
            const dbInstance = window.db || (typeof firebase !== 'undefined' && firebase.firestore ? firebase.firestore() : null);
            if (!dbInstance) return;

            const userDoc = await dbInstance.collection("users").doc(uid).get();
            if (!userDoc.exists) return;

            const data = userDoc.data();
            const birthDateStr = data.birthDate;
            if (!birthDateStr) return;

            let bDay, bMonth;
            if (birthDateStr.includes('/')) {
                const parts = birthDateStr.split('/');
                bDay = parseInt(parts[0], 10);
                bMonth = parseInt(parts[1], 10);
            } else if (birthDateStr.includes('-')) {
                const parts = birthDateStr.split('-');
                bDay = parseInt(parts[2], 10);
                bMonth = parseInt(parts[1], 10);
            }

            if (bDay === currentDay && bMonth === currentMonth) {
                const username = data.username || "Utente";
                const age = this.calculateAge(birthDateStr);
                this.showBirthdayModal(username, age);
                localStorage.setItem(`spottio_birthday_greeted_${uid}`, String(currentYear));
            }
        } catch (err) {
            console.warn("Errore controllo compleanno:", err);
        }
    },

    showBirthdayModal: function(username, age) {
        let modal = document.getElementById('birthday-greeting-modal');
        if (modal) modal.remove();

        const div = document.createElement('div');
        div.id = 'birthday-greeting-modal';
        div.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 animate-fade-in';
        div.innerHTML = `
            <div class="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl border border-gray-100 relative overflow-hidden font-sans">
                <div class="w-16 h-16 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner animate-bounce">
                    🎂
                </div>
                <h3 class="text-2xl font-bold text-gray-900 mb-1">Tanti Auguri, ${this.escape(username)}! 🎉</h3>
                ${age ? `<div class="inline-block bg-pink-50 text-pink-600 font-bold px-3 py-1 rounded-full text-sm mb-3 border border-pink-200">Buon ${age}° Compleanno! ✨</div>` : ''}
                <p class="text-sm text-gray-600 mb-6 leading-relaxed">
                    ${age ? `Oggi compi <strong>${age} anni</strong>! ` : ''}Tutto il team e la community di Spottio ti augurano una splendida giornata e un felice compleanno!
                </p>
                <button onclick="document.getElementById('birthday-greeting-modal').remove()" 
                    class="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition transform active:scale-95 cursor-pointer">
                    Grazie mille! 🎈
                </button>
            </div>
        `;
        document.body.appendChild(div);
    },

    initSessionTimer: function() {
        if (window.Spottio._breakInterval) {
            clearInterval(window.Spottio._breakInterval);
        }

        if (localStorage.getItem('spottio_break_limit') === null) {
            localStorage.setItem('spottio_break_limit', '120');
        }

        const checkBreak = () => {
            const limitMinutes = parseInt(localStorage.getItem('spottio_break_limit') || '0', 10);
            if (limitMinutes <= 0) return;

            const today = new Date().toISOString().slice(0, 10);
            const savedDate = localStorage.getItem('spottio_usage_date');
            let elapsedMinutes = parseInt(localStorage.getItem('spottio_usage_minutes') || '0', 10);

            if (savedDate !== today) {
                elapsedMinutes = 0;
                localStorage.setItem('spottio_usage_date', today);
                sessionStorage.removeItem('spottio_break_snooze_until');
            }

            elapsedMinutes += 1;
            localStorage.setItem('spottio_usage_minutes', elapsedMinutes.toString());

            const snoozeUntil = parseInt(sessionStorage.getItem('spottio_break_snooze_until') || '0', 10);
            if (snoozeUntil > Date.now()) {
                return;
            }

            if (elapsedMinutes >= limitMinutes) {
                const modal = document.getElementById('break-reminder-modal');
                const isModalVisible = modal && !modal.classList.contains('hidden');

                if (!isModalVisible) {
                    const h = Math.floor(elapsedMinutes / 60);
                    const m = elapsedMinutes % 60;
                    
                    const parts = [];
                    if (h > 0) parts.push(`${h} ${h === 1 ? 'ora' : 'ore'}`);
                    if (m > 0) parts.push(`${m} ${m === 1 ? 'minuto' : 'minuti'}`);
                    const formattedTime = parts.length > 0 ? parts.join(' e ') : 'meno di un minuto';

                    this.showBreakModal(formattedTime);
                }
            }
        };

        window.Spottio._breakInterval = setInterval(checkBreak, 60000);
    },

    showBreakModal: function(formattedTime) {
        let modal = document.getElementById('break-reminder-modal');
        if (!modal) {
            const div = document.createElement('div');
            div.id = 'break-reminder-modal';
            div.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 animate-in fade-in duration-200';
            div.innerHTML = `
                <div class="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border border-gray-100">
                    <div class="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3 font-bold text-2xl shadow-inner">
                        ⏳
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 mb-1">È ora di una pausa!</h3>
                    <p class="text-xs text-gray-500 mb-5 leading-relaxed">
                        Hai trascorso circa <strong id="break-modal-time" class="text-gray-800 font-bold">${formattedTime}</strong> oggi su Spottio. Vuoi continuare o preferisci staccare un momento?
                    </p>
                    
                    <div class="flex flex-col gap-2">
                        <button onclick="window.Spottio.handleBreakAction('continue')" class="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition cursor-pointer">
                            Continua a navigare
                        </button>
                        <button onclick="window.Spottio.handleBreakAction('postpone', 5)" class="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl transition cursor-pointer">
                            Ricordamelo tra 5 minuti
                        </button>
                        <button onclick="window.Spottio.handleBreakAction('postpone', 15)" class="w-full py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs rounded-xl transition cursor-pointer">
                            Ricordamelo tra 15 minuti
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(div);
        } else {
            const timeSpan = document.getElementById('break-modal-time');
            if (timeSpan) timeSpan.textContent = formattedTime;
            modal.classList.remove('hidden');
        }
    },

    handleBreakAction: function(action, extraMinutes = 0) {
        const modal = document.getElementById('break-reminder-modal');
        if (modal) modal.classList.add('hidden');

        if (action === 'continue') {
            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);
            sessionStorage.setItem('spottio_break_snooze_until', endOfDay.getTime().toString());
        } else if (action === 'postpone') {
            const snoozeTime = Date.now() + (extraMinutes * 60 * 1000);
            sessionStorage.setItem('spottio_break_snooze_until', snoozeTime.toString());
        }
    }
});

// 5. Inizializzazione unificata senza timer concorrenti
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.Spottio && window.Spottio.initSessionTimer) {
            window.Spottio.initSessionTimer();
        }

        if (window.Spottio && window.Spottio.onAuthReady) {
            window.Spottio.onAuthReady((user) => {
                if (user && user.uid) {
                    if (window.Spottio.trackUserIp) {
                        window.Spottio.trackUserIp(user.uid);
                    }
                    if (window.Spottio.checkBirthdayGreeting) {
                        window.Spottio.checkBirthdayGreeting(user.uid);
                    }
                }
            });
        }
    });
}