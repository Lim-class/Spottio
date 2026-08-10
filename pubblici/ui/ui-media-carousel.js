// ui-media-carousel.js - Gestione Rendering Media e Carosello Multi-File

window.renderPostMedia = function(postId, post) {
    let mediaHtml = '';
    
    // Usa esclusivamente mediaList
    let mediaItems = (post.mediaList && Array.from(post.mediaList).length > 0) ? post.mediaList : [];

    if (mediaItems.length === 1) {
        // Singolo file (Video o Immagine)
        const item = mediaItems[0];
        if (item.isVideo) {
            mediaHtml = `<video src="${window.Spottio.escape(item.url)}" controls class="w-full h-auto rounded-xl mb-4 bg-black max-h-96 object-contain"></video>`;
        } else {
            mediaHtml = `<img src="${window.Spottio.escape(item.url)}" class="w-full h-auto rounded-xl mb-4 shadow-sm max-h-96 object-contain bg-black cursor-pointer" onclick="window.open(this.src)">`;
        }
    } else if (mediaItems.length > 1) {
        // Carosello Multi-File (Stile Instagram)
        const slidesHtml = mediaItems.map((item) => {
            if (item.isVideo) {
                return `<div class="w-full flex-shrink-0 snap-center h-[350px] bg-black flex items-center justify-center">
                            <video src="${window.Spottio.escape(item.url)}" controls class="w-full h-full object-contain"></video>
                        </div>`;
            } else {
                return `<div class="w-full flex-shrink-0 snap-center h-[350px] bg-black flex items-center justify-center relative group">
                            <img src="${window.Spottio.escape(item.url)}" class="w-full h-full object-contain cursor-pointer" onclick="window.open(this.src)">
                        </div>`;
            }
        }).join('');

        mediaHtml = `
            <div class="relative w-full mb-4 group rounded-2xl overflow-hidden shadow-sm bg-black border border-gray-100">
                <div class="absolute top-3 right-3 bg-black/50 backdrop-blur-md text-white text-[11px] font-semibold px-2 py-1 rounded-md z-10 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                    <span>${mediaItems.length} media</span>
                </div>
                
                <div id="carousel-${postId}" class="flex overflow-x-auto snap-x snap-mandatory custom-scrollbar scroll-smooth w-full no-scrollbar" style="scrollbar-width: none;">
                    ${slidesHtml}
                </div>
                
                <!-- Freccia Sinistra -->
                <button onclick="window.scrollCarousel('${postId}', -1)" class="absolute left-3 top-1/2 -translate-y-1/2 bg-white/70 backdrop-blur-sm hover:bg-white text-gray-800 p-2 rounded-full shadow-lg z-10 transition-all opacity-0 group-hover:opacity-100 transform scale-90 hover:scale-100 focus:outline-none">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
                </button>
                
                <!-- Freccia Destra -->
                <button onclick="window.scrollCarousel('${postId}', 1)" class="absolute right-3 top-1/2 -translate-y-1/2 bg-white/70 backdrop-blur-sm hover:bg-white text-gray-800 p-2 rounded-full shadow-lg z-10 transition-all opacity-0 group-hover:opacity-100 transform scale-90 hover:scale-100 focus:outline-none">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>
        `;
    }

    return mediaHtml;
};

window.scrollCarousel = function(postId, direction) {
    const carousel = document.getElementById(`carousel-${postId}`);
    if (!carousel) return;
    const scrollAmount = carousel.clientWidth;
    carousel.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
};