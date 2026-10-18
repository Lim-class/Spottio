// =========================================================================
// FILE: shared/js/spottio-birthday.js
// Gestione Popup Auguri di Buon Compleanno
// =========================================================================

(function initBirthdayGreeting() {
    const authInstance = window.auth || (window.firebase && firebase.auth ? firebase.auth() : null);

    if (!authInstance) {
        document.addEventListener('DOMContentLoaded', () => initBirthdayGreeting());
        return;
    }

    authInstance.onAuthStateChanged(async (user) => {
        if (!user || user.isAnonymous) return;

        const uid = user.uid;
        const currentYear = new Date().getFullYear();
        const storageKey = `spottio_birthday_shown_${uid}_${currentYear}`;

        // Evita di mostrare il popup se è già stato mostrato per quest'anno
        if (localStorage.getItem(storageKey)) return;

        const db = window.db || (window.firebase && firebase.firestore ? firebase.firestore() : null);
        if (!db) return;

        try {
            const userDoc = await db.collection("users").doc(uid).get();
            if (!userDoc.exists) return;

            const userData = userDoc.data() || {};
            const bDate = userData.birthDate; // Formato atteso: "GG/MM/AAAA"
            if (!bDate || typeof bDate !== 'string') return;

            const parts = bDate.split('/');
            if (parts.length !== 3) return;

            const bDay = parseInt(parts[0], 10);
            const bMonth = parseInt(parts[1], 10);
            const bYear = parseInt(parts[2], 10);

            const today = new Date();
            const todayDay = today.getDate();
            const todayMonth = today.getMonth() + 1; // 1-indexed

            // Controllo giorno e mese di nascita
            const isTodayBirthday = (todayDay === bDay && todayMonth === bMonth);
            if (!isTodayBirthday) return;

            // Calcolo dell'età
            let age = null;
            if (window.Spottio && typeof window.Spottio.calculateAge === 'function') {
                age = window.Spottio.calculateAge(bDate);
            } else if (!isNaN(bYear)) {
                age = currentYear - bYear;
            }

            const username = userData.username || localStorage.getItem('currentUser') || 'Utente';

            // Rimuove eventuali modali preesistenti
            const existing = document.getElementById('birthday-greeting-modal');
            if (existing) existing.remove();

            // Creazione del modale
            const modal = document.createElement('div');
            modal.id = 'birthday-greeting-modal';
            modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 animate-fade-in';
            
            const ageBadgeHtml = age 
                ? `<div class="inline-block bg-pink-50 text-pink-600 font-bold px-3 py-1 rounded-full text-sm mb-3 border border-pink-200">
                     Buon ${age}° Compleanno! ✨
                   </div>` 
                : '';

            const ageTextHtml = age 
                ? `Oggi compi <strong>${age} anni</strong>! ` 
                : '';

            modal.innerHTML = `
                <div class="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl border border-gray-100 relative overflow-hidden font-sans">
                    <div class="w-16 h-16 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner animate-bounce">
                        🎂
                    </div>
                    <h3 class="text-2xl font-bold text-gray-900 mb-1">Tanti Auguri, ${username}! 🎉</h3>
                    ${ageBadgeHtml}
                    <p class="text-sm text-gray-600 mb-6 leading-relaxed">
                        ${ageTextHtml}Tutto il team e la community di Spottio ti augurano una splendida giornata e un felice compleanno!
                    </p>
                    <button id="close-birthday-modal-btn"
                        class="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition transform active:scale-95 cursor-pointer">
                        Festeggia! 🎈
                    </button>
                </div>
            `;

            document.body.appendChild(modal);

            // Segna come mostrato per l'anno in corso alla chiusura
            const closeBtn = document.getElementById('close-birthday-modal-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    localStorage.setItem(storageKey, 'true');
                    modal.remove();
                });
            }

        } catch (e) {
            console.warn("Errore durante il controllo del compleanno:", e);
        }
    });
})();