// Funzione per gestire l'apertura esclusiva delle sezioni (Accordion)
function toggleSection(id) {
    const sections = [
        { id: 'section-color', icon: 'icon-section-color' },
        { id: 'section-download', icon: 'icon-section-download' },
        { id: 'section-delete', icon: 'icon-section-delete' },
        { id: 'section-privacy', icon: 'icon-section-privacy' },
        { id: 'section-export', icon: 'icon-section-export' },
        { id: 'section-storia', icon: 'icon-section-storia' },
        { id: 'section-privacy-doc', icon: 'icon-section-privacy-doc' },
        { id: 'section-policy', icon: 'icon-section-policy' },
        { id: 'section-password', icon: 'icon-section-password'}
    ];
    
    sections.forEach(sec => {
        const section = document.getElementById(sec.id);
        const icon = document.getElementById(sec.icon);
        
        if (sec.id === id) {
            const isHidden = section.classList.contains('hidden');
            if (isHidden) {
                section.classList.remove('hidden');
                if (icon) icon.style.transform = 'rotate(180deg)';
            } else {
                section.classList.add('hidden');
                if (icon) icon.style.transform = 'rotate(0deg)';
            }
        } else {
            if (section) section.classList.add('hidden');
            if (icon) icon.style.transform = 'rotate(0deg)';
        }
    });
}

// Funzione di ricerca per filtrare le sezioni dell'accordion
function filterSettings() {
    const input = document.getElementById('searchSettings');
    const filter = input.value.toLowerCase();
    const items = document.querySelectorAll('.accordion-item');

    items.forEach(item => {
        const titleElement = item.querySelector('span'); 
        
        if (titleElement) {
            const titleText = titleElement.innerText.toLowerCase();
            
            if (titleText.includes(filter)) {
                item.style.display = ""; 
            } else {
                item.style.display = "none"; 
                
                const content = item.querySelector('div[id^="section-"]');
                if (content) {
                    content.classList.add('hidden');
                    const icon = item.querySelector('span[id^="icon-"]');
                    if (icon) icon.style.transform = 'rotate(0deg)';
                }
            }
        }
    });
}