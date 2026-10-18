// Accesso-e-Sicurezza/macro-sicurezza.js
window.SettingsModules = window.SettingsModules || {};

window.SettingsModules.useSicurezza = function({ Vue, t, isAdmin }) {
    const { ref } = Vue;

    const isUpdatingAuth = ref(false);
    const formPassword = ref({ old: '', new: '' });
    const formEmail = ref({ pass: '', new: '' });
    const showDobEdit = ref(false);
    const currentDob = ref('');
    const formDob = ref('');
    const showDeleteModal = ref(false);

    const updatePassword = async () => {
        if (!formPassword.value.old || !formPassword.value.new) return alert("Inserisci entrambe le password.");
        isUpdatingAuth.value = true;
        try {
            const user = window.auth.currentUser;
            const cred = firebase.auth.EmailAuthProvider.credential(user.email, formPassword.value.old);
            await user.reauthenticateWithCredential(cred);
            await user.updatePassword(formPassword.value.new);
            alert(t('successPassword', 'Password aggiornata con successo!'));
            formPassword.value = { old: '', new: '' };
        } catch (error) { 
            alert("Errore: " + error.message); 
        } finally { 
            isUpdatingAuth.value = false; 
        }
    };

    const updateEmail = async () => {
        if (!formEmail.value.pass || !formEmail.value.new) return alert("Inserisci password e nuova email.");
        isUpdatingAuth.value = true;
        try {
            const user = window.auth.currentUser;
            const cred = firebase.auth.EmailAuthProvider.credential(user.email, formEmail.value.pass);
            await user.reauthenticateWithCredential(cred);
            await user.updateEmail(formEmail.value.new);
            await window.db.collection("users").doc(user.uid).update({ email: formEmail.value.new });
            alert(t('successEmail', 'Email aggiornata con successo!'));
            formEmail.value = { pass: '', new: '' };
        } catch (error) { 
            alert("Errore: " + error.message); 
        } finally { 
            isUpdatingAuth.value = false; 
        }
    };

    const updateDob = async () => {
        if (!formDob.value) return alert("Seleziona una data.");
        const eta = window.Spottio ? window.Spottio.calculateAge(formDob.value) : 18;
        if (eta < 14) return alert("Devi avere almeno 14 anni.");
        
        isUpdatingAuth.value = true;
        const [anno, mese, giorno] = formDob.value.split('-');
        const birthDateIT = `${giorno}/${mese}/${anno}`;

        try {
            await window.db.collection("users").doc(window.auth.currentUser.uid).update({ birthDate: birthDateIT });
            currentDob.value = birthDateIT;
            showDobEdit.value = false;
            formDob.value = '';
            alert(t('successDob', 'Data di nascita aggiornata con successo!'));
        } catch (error) { 
            alert("Errore durante l'aggiornamento."); 
        } finally { 
            isUpdatingAuth.value = false; 
        }
    };

    const performLogout = () => {
        if (window.auth) {
            window.auth.signOut()
                .then(() => window.location.href = '../index.html')
                .catch(e => alert('Errore: ' + e.message));
        }
    };

    const performDeleteAccount = () => {
        if (isAdmin.value) return alert('L\'account admin non può essere eliminato.');
        const user = window.auth.currentUser;
        if (user) {
            window.db.collection("users").doc(user.uid).delete()
                .then(() => user.delete())
                .then(() => { localStorage.clear(); window.location.href = '../index.html'; })
                .catch(e => alert("Devi aver effettuato l'accesso di recente. Disconnettiti e riprova."));
        }
    };

    return {
        isUpdatingAuth,
        formPassword,
        formEmail,
        showDobEdit,
        currentDob,
        formDob,
        showDeleteModal,
        updatePassword,
        updateEmail,
        updateDob,
        performLogout,
        performDeleteAccount
    };
};