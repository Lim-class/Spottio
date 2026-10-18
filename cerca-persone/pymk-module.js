// =========================================================================
// FILE: cerca-persone/pymk-module.js
// Modulo riutilizzabile "Suggeriti per te" (PYMK) con Stato Utente Centralizzato
// =========================================================================

window.SpottioPYMK = (function () {
    
    function calculateAffinityScore(currentUserData, candidateData) {
        let score = 0;

        const myFollowing = Array.isArray(currentUserData.following) ? currentUserData.following : [];
        const candidateFollowers = Array.isArray(candidateData.followers) ? candidateData.followers : [];
        const candidateFollowing = Array.isArray(candidateData.following) ? candidateData.following : [];

        let mutualConnections = 0;
        myFollowing.forEach(id => {
            if (candidateFollowers.includes(id) || candidateFollowing.includes(id)) {
                mutualConnections++;
            }
        });
        score += mutualConnections * 10;

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
                </div>
                
                <div id="pymk-list-container" class="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
                    <div class="w-full flex justify-center py-6">
                        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                </div>
            </div>
        `;
    }

    async function init(options = {}) {
        const {
            containerId = "pymk-container",
            limit = 10,
            title = "Suggeriti per te"
        } = options;

        renderComponentHTML(containerId, title);

        const listContainer = document.getElementById("pymk-list-container");
        if (!listContainer) return;

        const authUser = window.useAuthUser ? window.useAuthUser() : null;
        if (!authUser) return;

        authUser.onAuthReady(async (userPayload) => {
            if (!userPayload || !userPayload.uid) {
                listContainer.innerHTML = `<p class="text-xs text-gray-400 italic text-center w-full py-4">Effettua l'accesso per vedere i suggerimenti.</p>`;
                return;
            }

            try {
                const dbInstance = window.db || firebase.firestore();
                const currentUserData = userPayload.userData || {};
                const myFollowing = Array.isArray(currentUserData.following) ? currentUserData.following : [];

                const snapshot = await dbInstance.collection("users").limit(30).get();
                const candidates = [];

                snapshot.forEach((doc) => {
                    const candidateId = doc.id;
                    const candidateData = doc.data() || {};

                    if (candidateId !== userPayload.uid && !myFollowing.includes(candidateId)) {
                        const { score, mutualCount } = calculateAffinityScore(currentUserData, candidateData);
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

                    const verifiedBadge = window.Spottio?.getVerifiedBadge
                        ? window.Spottio.getVerifiedBadge(isVerified, "w-4 h-4 text-blue-500 shrink-0")
                        : '';

                    const avatarHtml = window.Spottio?.getAvatarHtml
                        ? window.Spottio.getAvatarHtml(avatarUrl, nameToDisplay, "w-16 h-16 text-2xl mx-auto mb-2")
                        : `<div class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-xl mx-auto mb-2">${nameToDisplay.charAt(0)}</div>`;

                    const reasonText = cand.mutualCount > 0 
                        ? `${cand.mutualCount} ${cand.mutualCount === 1 ? 'connessione' : 'connessioni'} in comune`
                        : "Suggerito per te";

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
                        if (window.Spottio?.navigateToUserProfile) {
                            window.Spottio.navigateToUserProfile(cand.id);
                        } else {
                            localStorage.setItem('currentUserProfileId', cand.id);
                            window.location.href = '../utente/utente.html';
                        }
                    });

                    listContainer.appendChild(card);
                });

            } catch (error) {
                console.error("Errore nel caricamento delle persone suggerite (PYMK):", error);
                listContainer.innerHTML = `<p class="text-xs text-red-400 text-center w-full py-4">Impossibile caricare i suggerimenti.</p>`;
            }
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        if (document.getElementById("pymk-container")) {
            init({
                containerId: "pymk-container",
                limit: 10,
                title: "Suggeriti per te"
            });
        }
    });

    return {
        init: init
    };
})();