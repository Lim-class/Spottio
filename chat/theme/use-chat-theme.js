// modules/use-chat-theme.js
function useChatTheme(getCurrentUid) {
    const selectedBg = Vue.ref('default');
    const bgOptions = Vue.ref([]);
    const customBgUrl = Vue.ref('');
    const bgUploadInput = Vue.ref(null);

    const bgStyle = Vue.computed(() => {
        if (customBgUrl.value) return { backgroundImage: `url('${customBgUrl.value}')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: 'transparent' };
        if (selectedBg.value !== 'default' && selectedBg.value !== 'custom') return { backgroundColor: selectedBg.value, backgroundImage: 'none' };
        return { backgroundColor: '#f9fafb', backgroundImage: 'none' };
    });

    const loadBgOptions = async () => {
        try {
            const snap = await window.db.collection('ColoriSfondo').get();
            bgOptions.value = snap.docs.map(doc => ({ hex: doc.data().hex, nome: doc.data().nome }));
        } catch (e) {
            console.error(e);
        }
    };

    const loadUserBackground = async (uid) => {
        try {
            const userDoc = await window.db.collection('users').doc(uid).get();
            if (userDoc.exists && userDoc.data().chatBackgroundColor) {
                const savedBg = userDoc.data().chatBackgroundColor;
                if (savedBg.startsWith('http')) {
                    customBgUrl.value = savedBg;
                    selectedBg.value = 'default';
                } else {
                    selectedBg.value = savedBg;
                }
            }
        } catch (err) { console.error(err); }
    };

    const changeBackground = async () => {
        if (selectedBg.value === 'custom') { 
            bgUploadInput.value.click(); 
            selectedBg.value = 'default'; 
            return; 
        }
        customBgUrl.value = '';
        try { 
            await window.db.collection('users').doc(getCurrentUid()).set({ chatBackgroundColor: selectedBg.value }, { merge: true }); 
        } catch (e) { console.error(e); }
    };

    const uploadCustomBg = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const uploadFn = window.uploadMediaToCloudinary || window.Spottio.uploadToCloudinary;
            const res = await uploadFn(file);
            if (res && res.url) {
                customBgUrl.value = res.url;
                selectedBg.value = 'default';
                await window.db.collection('users').doc(getCurrentUid()).set({ chatBackgroundColor: res.url }, { merge: true });
            }
        } catch (e) { alert("Errore upload sfondo"); }
        e.target.value = '';
    };

    return {
        selectedBg, bgOptions, customBgUrl, bgUploadInput, bgStyle,
        loadBgOptions, loadUserBackground, changeBackground, uploadCustomBg
    };
}