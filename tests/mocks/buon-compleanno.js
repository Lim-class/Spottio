(async () => {
    // 1. Rimuove eventuali modali già presenti
    const existing = document.getElementById('birthday-greeting-modal');
    if (existing) existing.remove();

    // 2. Recupera dati utente
    const username = localStorage.getItem('currentUser') || 'Utente';
    const uid = localStorage.getItem('currentUid') || (window.Spottio && window.Spottio.getCurrentUid ? window.Spottio.getCurrentUid() : null);

    let age = null;

    // Tenta di recuperare la data di nascita e calcolare l'età reale da Firestore
    if (uid && uid !== "Guest" && window.db) {
        try {
            const userDoc = await window.db.collection("users").doc(uid).get();
            if (userDoc.exists && userDoc.data().birthDate) {
                const bDate = userDoc.data().birthDate;
                if (window.Spottio && window.Spottio.calculateAge) {
                    age = window.Spottio.calculateAge(bDate);
                }
            }
        } catch (e) {
            console.warn("Impossibile recuperare la data di nascita da Firestore:", e);
        }
    }

    // Se non trova la data nel DB o siamo offline/senza login, usa 18 come fallback per il test
    if (!age) {
        age = 18; 
    }

    // 3. Crea e inietta il popup con l'età
    const div = document.createElement('div');
    div.id = 'birthday-greeting-modal';
    div.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 animate-fade-in';
    div.innerHTML = `
        <div class="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl border border-gray-100 relative overflow-hidden font-sans">
            <div class="w-16 h-16 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner animate-bounce">
                🎂
            </div>
            <h3 class="text-2xl font-bold text-gray-900 mb-1">Tanti Auguri, ${username}! 🎉</h3>
            <div class="inline-block bg-pink-50 text-pink-600 font-bold px-3 py-1 rounded-full text-sm mb-3 border border-pink-200">
                Buon ${age}° Compleanno! ✨
            </div>
            <p class="text-sm text-gray-600 mb-6 leading-relaxed">
                Oggi compi <strong>${age} anni</strong>! Tutto il team e la community di Spottio ti augurano una splendida giornata e un felice compleanno!
            </p>
            <button onclick="document.getElementById('birthday-greeting-modal').remove()" 
                class="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition transform active:scale-95 cursor-pointer">
                Festeggia! 🎈
            </button>
        </div>
    `;
    document.body.appendChild(div);
})();