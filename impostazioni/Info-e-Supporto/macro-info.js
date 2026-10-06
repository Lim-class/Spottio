// Info-e-Supporto/macro-info.js
window.SettingsModules = window.SettingsModules || {};

window.SettingsModules.useInfo = function({ Vue, currentLang, searchQuery }) {
    const { ref, computed } = Vue;

    const faqs = ref(window.SettingsModules.faqList || []);
    const openFaqCats = ref([]); 
    const openFaqQs = ref([]);

    const openMedia = (url) => {
        if (url) window.open(url, '_blank');
    };

    const resolveLangValue = (dataContainer) => {
        if (!dataContainer) return null;
        const normalized = window.getDictionaryKey ? window.getDictionaryKey(currentLang.value) : currentLang.value;
        return dataContainer[normalized] || dataContainer[currentLang.value] || dataContainer['it'] || Object.values(dataContainer)[0] || null;
    };

    const storiaParagraphs = computed(() => {
        const data = window.storiaData;
        if (!data) return [];
        const entry = resolveLangValue(data);
        return entry?.paragraphs || [];
    });

    const privacyBlocks = computed(() => {
        const data = window.privacyData;
        if (!data) return [];
        const entry = resolveLangValue(data);
        return entry?.blocks || [];
    });

    const policyBlocks = computed(() => {
        const data = window.policyData;
        if (!data) return [];
        const entry = resolveLangValue(data);
        return entry?.blocks || [];
    });

    const getFaqTitle = (obj) => {
        if (!obj) return '';
        const val = resolveLangValue(obj);
        return typeof val === 'string' ? val : '';
    };

    const filteredFaq = computed(() => {
        const term = searchQuery.value.toLowerCase().trim();
        if (!term) {
            return faqs.value.map(c => ({
                ...c, 
                questions: c.questions.map(q => ({ ...q, matches: true }))
            }));
        }
        return faqs.value.map(c => {
            const cTitle = getFaqTitle(c.title).toLowerCase();
            const qMatches = c.questions.map(q => {
                const qT = getFaqTitle(q.q).toLowerCase();
                const qA = getFaqTitle(q.a).toLowerCase();
                return { ...q, matches: qT.includes(term) || qA.includes(term) || cTitle.includes(term) };
            });
            return { ...c, questions: qMatches };
        }).filter(c => c.questions.some(q => q.matches));
    });

    const toggleFaqCat = (id) => { 
        openFaqCats.value = openFaqCats.value.includes(id) 
            ? openFaqCats.value.filter(i => i !== id) 
            : [...openFaqCats.value, id]; 
    };
    const isFaqCatOpen = (id) => openFaqCats.value.includes(id) || searchQuery.value.trim() !== '';

    const toggleFaqQ = (id) => { 
        openFaqQs.value = openFaqQs.value.includes(id) 
            ? openFaqQs.value.filter(i => i !== id) 
            : [...openFaqQs.value, id]; 
    };
    const isFaqQOpen = (id) => openFaqQs.value.includes(id) || searchQuery.value.trim() !== '';

    return {
        faqs,
        filteredFaq,
        getFaqTitle,
        toggleFaqCat,
        isFaqCatOpen,
        toggleFaqQ,
        isFaqQOpen,
        openMedia,
        storiaParagraphs,
        privacyBlocks,
        policyBlocks
    };
};