// Array contenente tutti i paragrafi, elenchi e titoli secondari presi dal testo originale
const sezioniPolicy = [
    `<p class="text-gray-700 leading-relaxed text-base">Su Spottio, la nostra missione è creare una comunità social rispettosa, accogliente e priva di algoritmi di controllo invasivi. Per garantire un ambiente sano per tutti, ti chiediamo di mantenere un comportamento corretto e civile.</p>`,
    
    `<p class="text-gray-700 leading-relaxed text-base">Ti invitiamo a:</p>`,
    
    `<ul class="list-disc list-inside text-gray-700 leading-relaxed text-base space-y-2">
        <li>Rispettare le opinioni degli altri, anche se non le condividi.</li>
        <li>Evitare linguaggio offensivo, minacce o molestie.</li>
        <li>Non condividere contenuti inappropriati o illegali.</li>
        <li>Trattare tutti con la massima cortesia e dignità.</li>
        <li><strong>Utilizzare il sistema di segnalazione:</strong> aiutaci a ripulire il feed pubblico segnalando i post inopportuni, che verranno revisionati dai nostri amministratori.</li>
    </ul>`,
    
    `<h2 class="text-xl font-bold text-gray-800 mt-6 mb-2">Violazione delle Regole</h2>`,
    
    `<p class="text-gray-700 leading-relaxed text-base">Il nostro team di moderazione monitora attivamente le segnalazioni. Il mancato rispetto di queste regole porterà all'eliminazione dei contenuti non conformi e potrebbe causare la sospensione o la chiusura permanente del tuo account. Collabora con noi per mantenere Spottio un luogo positivo!</p>`
];

// Seleziona il contenitore HTML specifico per la policy
const containerPolicy = document.getElementById('policy-content');

if (containerPolicy) {
    // Cicla l'array e inserisce dinamicamente ogni elemento mantenendo i tag (strong, ul, h2)
    sezioniPolicy.forEach(htmlContent => {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = htmlContent;
        containerPolicy.appendChild(wrapper.firstElementChild);
    });
} else {
    console.error("Errore: Elemento 'policy-content' non trovato nella pagina policy.");
}