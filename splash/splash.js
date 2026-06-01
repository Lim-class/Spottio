// Attende che la pagina sia completamente caricata
window.addEventListener('load', () => {
    const delay = 2200; // Tempo di attesa prima della dissolvenza (ms)
    const fadeTime = 800; // Durata della dissolvenza (ms)

    setTimeout(() => {
        // Aggiunge la classe per l'effetto sparizione al body
        document.body.classList.add('fade-out');
        
        // Dopo la dissolvenza, cambia pagina
        setTimeout(() => {
            window.location.href = 'login.html';
        }, fadeTime);
    }, delay);
});