// Array contenente i paragrafi della storia
const paragrafiStoria = [
    "Spottio nasce dall'idea di creare un social network semplice e intuitivo, un luogo digitale dove le persone possono connettersi in modo autentico e senza complicazioni. L'obiettivo era eliminare il rumore e concentrarsi su ciò che conta davvero: le conversazioni significative e la condivisione di momenti speciali.",
    "Il progetto è stato avviato da un piccolo team di sviluppatori con una visione chiara: un social senza pubblicità invadente, senza algoritmi complessi che controllano il feed e con un forte focus sulla privacy e sulla sicurezza degli utenti. Il nome \"Spottio\" deriva dall'idea di \"spot\" inteso come un luogo, uno spazio, che ognuno può fare proprio.",
    "Fin dal suo lancio, Spottio ha puntato su un design pulito e funzionale, rendendo l'esperienza utente la priorità assoluta. Continuiamo a evolverci, sempre con l'obiettivo di mantenere una comunità sana e accogliente, dove ogni utente si senta libero di esprimere sé stesso."
];

// Seleziona il contenitore specifico per la storia nell'HTML
const containerStoria = document.getElementById('storia-content');

if (containerStoria) {
    // Cicla l'array e inserisce i paragrafi dinamicamente
    paragrafiStoria.forEach(testo => {
        const p = document.createElement('p');
        p.className = "text-gray-700 leading-relaxed";
        p.textContent = testo;
        containerStoria.appendChild(p);
    });
} else {
    console.error("Errore: Elemento 'storia-content' non trovato nella pagina.");
}