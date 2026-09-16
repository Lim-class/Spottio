// Aspetto-e-Lingua/macro-aspetto.js
window.SettingsModules = window.SettingsModules || {};

window.SettingsModules.useAspetto = function({ Vue }) {
    const { ref, computed, watch, onMounted, onUnmounted } = Vue;

    const colorSearchQuery = ref('');
    const colors = ref([]);
    const customColorInput = ref('#000000');
    const detectedColorName = ref('');

    // --- LOGICA PAGINAZIONE RESPONSIVE ---
    const currentPage = ref(1);

    const getResponsiveItemsPerPage = () => (window.innerWidth < 640 ? 8 : 12);
    const itemsPerPage = ref(getResponsiveItemsPerPage());

    const handleResize = () => {
        const updatedCount = getResponsiveItemsPerPage();
        if (itemsPerPage.value !== updatedCount) {
            itemsPerPage.value = updatedCount;
            if (currentPage.value > totalPages.value) {
                currentPage.value = totalPages.value;
            }
        }
    };

    onMounted(() => {
        window.addEventListener('resize', handleResize);
    });

    onUnmounted(() => {
        window.removeEventListener('resize', handleResize);
    });

    const loadColors = async () => {
        try {
            const snap = await window.db.collection('ColoriSfondo').get();
            colors.value = snap.docs.map(doc => ({ 
                hex: doc.data().hex, 
                nome: doc.data().nome || doc.id 
            }));
        } catch (e) {
            console.error("Errore nel caricamento dei colori:", e);
        }
    };

    const filteredColors = computed(() => {
        const term = colorSearchQuery.value.toLowerCase().replace(/\s+/g, '');
        if (!term) return colors.value;
        return colors.value.filter(c => 
            c.nome.toLowerCase().includes(term) || 
            c.hex.toLowerCase().includes(term)
        );
    });

    watch(colorSearchQuery, () => {
        currentPage.value = 1;
    });

    const totalPages = computed(() => {
        const total = Math.ceil(filteredColors.value.length / itemsPerPage.value);
        return total > 0 ? total : 1;
    });

    const paginatedColors = computed(() => {
        const start = (currentPage.value - 1) * itemsPerPage.value;
        return filteredColors.value.slice(start, start + itemsPerPage.value);
    });

    const nextPage = () => {
        if (currentPage.value < totalPages.value) {
            currentPage.value++;
        }
    };

    const prevPage = () => {
        if (currentPage.value > 1) {
            currentPage.value--;
        }
    };

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages.value) {
            currentPage.value = page;
        }
    };

    const detectColorName = async () => {
        const hex = customColorInput.value.replace('#', '');
        try {
            const res = await fetch(`https://www.thecolorapi.com/id?hex=${hex}`);
            const data = await res.json();
            detectedColorName.value = "Nome rilevato: " + data.name.value;
        } catch (e) { 
            detectedColorName.value = `Colore-${hex}`; 
        }
    };

    const saveAndApplyColor = async (color, name) => {
        localStorage.setItem('user-background-color', color);
        document.body.style.backgroundColor = color;
        const uid = window.SettingsModules.getUid();
        if (uid) { 
            try { 
                await window.db.collection('users').doc(uid).update({ bodyBackgroundColor: color }); 
            } catch (e) {
                console.error("Errore nel salvataggio del colore utente:", e);
            } 
        }
    };

    const saveCustomColor = async () => {
        const hexColor = customColorInput.value;
        const cleanHex = hexColor.replace('#', '');
        try {
            const res = await fetch(`https://www.thecolorapi.com/id?hex=${cleanHex}`);
            const autoName = (await res.json()).name.value;
            await window.db.collection('ColoriSfondo').doc(autoName).set({ hex: hexColor, nome: autoName });
            saveAndApplyColor(hexColor, autoName);
            await loadColors();
            alert(`Il colore "${autoName}" è stato salvato!`);
        } catch (e) { 
            alert("Errore API Colore"); 
        }
    };

    return {
        colorSearchQuery,
        colors,
        customColorInput,
        detectedColorName,
        filteredColors,
        currentPage,
        totalPages,
        paginatedColors,
        nextPage,
        prevPage,
        goToPage,
        loadColors,
        detectColorName,
        saveCustomColor,
        saveAndApplyColor
    };
};