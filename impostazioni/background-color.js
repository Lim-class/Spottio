// background-color.js
// Questo script gestisce l'applicazione del colore di sfondo in tutte le pagine
// che lo includono, ad eccezione della pagina di login.

document.addEventListener('DOMContentLoaded', () => {
    // Ottiene il colore salvato in localStorage
    const savedColor = localStorage.getItem('user-background-color');
    const body = document.body;

    // Se esiste un colore salvato, lo applica
    if (savedColor) {
        body.style.backgroundColor = savedColor;
    } else {
        // Se non c'è, imposta il colore di default e lo salva
        const defaultColor = '#f3f4f6';
        body.style.backgroundColor = defaultColor;
        localStorage.setItem('user-background-color', defaultColor);
    }
});
