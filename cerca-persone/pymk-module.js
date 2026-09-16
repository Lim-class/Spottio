// ==========================================
// FILE: pymk-module.js
// Modulo riutilizzabile "Persone che potresti conoscere" (PYMK)
// Layout Orizzontale Stile Instagram / Facebook Carousel
// ==========================================

window.SpottioPYMK = (function () {
    
    /**
     * Calcola un punteggio di affinità tra l'utente loggato e un utente candidato
     */
    function calculateAffinityScore(currentUserData, candidateData, candidateId) {
        let score = 0;

        const myFollowing = Array.isArray(currentUserData.following) ? currentUserData.following : [];
        const candidateFollowers = Array.isArray(candidateData.followers) ? candidateData.followers : [];
        const candidateFollowing = Array.isArray(candidateData.following) ? candidateData.following : [];

        // 1. Amici / Connessioni in comune
        let mutualConnections = 0;
        myFollowing.forEach(id => {
            if (candidateFollowers.includes(id) || candidateFollowing.includes(id)) {
                mutualConnections++;
            }
        });
        score += mutualConnections * 10;

        // 2. Anagrafica / Anno di nascita simile
        if (currentUserData.birthDate && candidateData.birthDate) {
            try {
                const myYear = parseInt(currentUserData.birthDate.split('/')[2], 10);
                const candYear = parseInt(candidateData.birthDate.split('/')[2], 10);
                if (!isNaN(myYear) && !isNaN(candYear)) {
                    const diffYears = Math.abs(myYear - candYear);
                    if (diffYears <= 3) score += 5;
                    else if (diffYears <= 7) score += 2;
                }
            } catch (e) {}
        }

        // 3. Punteggi preferenze
        if (currentUserData.preferences && candidateData.preferences) {
            Object.keys(currentUserData.preferences).forEach(catKey => {
                if (candidateData.preferences[catKey]) {
                    const myCatScore = currentUserData.preferences[catKey].score || 0;
                    const candCatScore = candidateData.preferences[catKey].score || 0;
                    if (myCatScore > 0 && candCatScore > 0) {
                        score += Math.min(myCatScore, candCatScore) * 2;
                    }
                }
            });
        }

        return { score, mutualCount: mutualConnections };
    }

    /**
     * Genera l'HTML base del widget con lo scrollbar orizzontale nascosto/stilizzato
     */
    function renderComponentHTML(containerId, title) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="pymk-widget bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-bold text-gray-800 text-sm md:text-base flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        ${title}
                    </h3>
                    <span class="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">Suggeriti</span>
                </div>
                
                <!-- CAROSELLO ORIZZONTALE -->
                <div id="pymk-list-container" class="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200 snap-x">
                    <div class="w-full flex justify-center py-6">
                        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Inizializza il modulo e carica i dati in formato card orizzontale stile Instagram
     */
    async function init(options = {}) {
        const {
            containerId = "pymk-container",
            limit = 10,
            title = "Persone che potresti conoscere"
        } = options;

        renderComponentHTML(containerId, title);

        const listContainer = document.getElementById("pymk-list-container");
        if (!listContainer) return;

        const auth = firebase.auth();
        const db = window.db;

        auth.onAuthStateChanged(async (user) => {
            if (!user) {
                listContainer.innerHTML = `<p class="text-xs text-gray-400 italic text-center w-full py-4">Effettua l'accesso per vedere i suggerimenti.</p>`;
                return;
            }

            try {
                const currentUserDoc = await db.collection("users").doc(user.uid).get();
                if (!currentUserDoc.exists) {
                    listContainer.innerHTML = '';
                    return;
                }

                const currentUserData = currentUserDoc.data() || {};
                const myFollowing = Array.isArray(currentUserData.following) ? currentUserData.following : [];

                const snapshot = await db.collection("users").limit(30).get();
                const candidates = [];

                snapshot.forEach((doc) => {
                    const candidateId = doc.id;
                    const candidateData = doc.data() || {};

                    if (candidateId !== user.uid && !myFollowing.includes(candidateId)) {
                        const { score, mutualCount } = calculateAffinityScore(currentUserData, candidateData, candidateId);
                        candidates.push({
                            id: candidateId,
                            data: candidateData,
                            score: score,
                            mutualCount: mutualCount
                        });
                    }
                });

                candidates.sort((a, b) => b.score - a.score);
                const topCandidates = candidates.slice(0, limit);

                if (topCandidates.length === 0) {
                    listContainer.innerHTML = `<p class="text-xs text-gray-400 italic text-center w-full py-4">Nessun nuovo suggerimento al momento.</p>`;
                    return;
                }

                listContainer.innerHTML = '';
                topCandidates.forEach(cand => {
                    const userData = cand.data;
                    const nameToDisplay = userData.username || "Utente";
                    const isVerified = userData.isVerified === true;
                    const avatarUrl = userData.userPfUri || userData.profileImage || "";

                    const verifiedBadge = window.Spottio && window.Spottio.getVerifiedBadge
                        ? window.Spottio.getVerifiedBadge(isVerified, "w-4 h-4 text-blue-500 shrink-0")
                        : '';

                    const avatarHtml = window.Spottio && window.Spottio.getAvatarHtml
                        ? window.Spottio.getAvatarHtml(avatarUrl, nameToDisplay, "w-16 h-16 text-2xl mx-auto mb-2")
                        : `<div class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-xl mx-auto mb-2">${nameToDisplay.charAt(0)}</div>`;

                    // Testo di motivazione sobrio e non invasivo
                    let reasonText = "";
                    if (cand.mutualCount > 0) {
                        reasonText = `${cand.mutualCount} ${cand.mutualCount === 1 ? 'connessione' : 'connessioni'} in comune`;
                    } else {
                        reasonText = "Suggerito per te";
                    }

                    // Card Verticale Stile Instagram all'interno del Carosello Orizzontale
                    const card = document.createElement("div");
                    card.className = "snap-start shrink-0 w-36 md:w-40 bg-gray-50 hover:bg-gray-100/80 border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-between text-center transition duration-200 cursor-pointer relative group";
                    
                    card.innerHTML = `
                        <div class="w-full flex flex-col items-center">
                            <div class="relative">
                                ${avatarHtml}
                            </div>
                            <div class="flex items-center justify-center gap-1 w-full px-1 mb-1">
                                <h4 class="font-semibold text-gray-800 text-xs md:text-sm truncate max-w-[100px]">${nameToDisplay}</h4>
                                ${verifiedBadge}
                            </div>
                            <p class="text-[11px] text-gray-400 truncate w-full mb-3">${reasonText}</p>
                        </div>

                    `;

                    card.addEventListener("click", () => {
                        localStorage.setItem('currentUserProfile', nameToDisplay);
                        localStorage.setItem('currentUserProfileId', cand.id);
                        window.location.href = '../utente/utente.html';
                    });

                    listContainer.appendChild(card);
                });

            } catch (error) {
                console.error("Errore nel caricamento delle persone suggerite (PYMK):", error);
                listContainer.innerHTML = `<p class="text-xs text-red-400 text-center w-full py-4">Impossibile caricare i suggerimenti.</p>`;
            }
        });
    }

    // AUTO-INIZIALIZZAZIONE AUTOMATICA ALLA CARICA DELLA PAGINA
    document.addEventListener("DOMContentLoaded", () => {
        if (document.getElementById("pymk-container")) {
            init({
                containerId: "pymk-container",
                limit: 10,
                title: "Persone che potresti conoscere"
            });
        }
    });

    return {
        init: init
    };
})();