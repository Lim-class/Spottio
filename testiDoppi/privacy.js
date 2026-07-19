// Array con i blocchi di testo e i frammenti HTML della privacy
const sezioniPrivacy = [
    `<p class="text-gray-600 leading-relaxed text-base">Su Spottio, la tua privacy è la nostra massima priorità. Ci impegniamo a non raccogliere dati sensibili dai nostri utenti. Le tue informazioni personali, come il nome utente, vengono utilizzate esclusivamente per scopi di autenticazione e per personalizzare la tua esperienza all'interno dell'app.</p>`,
    
    `<p class="text-gray-700 font-semibold leading-relaxed text-base">Per offrirti una gestione semplificata, Spottio utilizza lo stesso sistema di autenticazione di GamePlus. Ciò significa che le tue credenziali di accesso sono le stesse per entrambe le piattaforme, garantendo un'integrazione sicura e immediata.</p>`,
    
    `<p class="text-gray-600 leading-relaxed text-base">Inoltre, tutte le conversazioni, le chat e i dati degli utenti sono protetti tramite i sistemi di sicurezza e crittografia forniti da <strong>Firebase</strong>. Questo garantisce che i tuoi messaggi e le tue informazioni siano gestiti con i più alti standard di protezione dei dati del settore.</p>`,
    
    `<h2 class="text-xl font-bold text-gray-800 mt-6 mb-2">Controllo e Gestione dei Dati Personali</h2>`,
    
    `<p class="text-gray-600 leading-relaxed text-base">Ti offriamo il pieno controllo sulle tue informazioni tramite impostazioni dedicate:</p>`,
    
    `<ul class="list-disc list-inside text-gray-600 leading-relaxed text-base space-y-2">
        <li><strong>Privacy del Profilo:</strong> Puoi rendere il tuo account privato in qualsiasi momento, oscurando i tuoi post ai non-follower e filtrando le richieste in ingresso.</li>
        <li><strong>Esportazione Dati (GDPR):</strong> Puoi richiedere e scaricare una copia dei tuoi dati (profilo e post pubblicati) in un formato strutturato (JSON).</li>
        <li><strong>Eliminazione Irreversibile:</strong> Hai la libertà di eliminare definitivamente il tuo account e tutti i dati ad esso associati direttamente dalle impostazioni.</li>
    </ul>`,
    
    `<p class="text-gray-600 leading-relaxed text-base">Non vendiamo, né condividiamo i tuoi dati con terze parti. La nostra missione è offrirti un ambiente sicuro e privato dove puoi connetterti liberamente.</p>`
];

// Seleziona il contenitore HTML specifico per la privacy
const containerPrivacy = document.getElementById('privacy-content');

if (containerPrivacy) {
    // Cicla l'array e inserisce ogni blocco usando innerHTML per elaborare i tag (strong, ul, h2)
    sezioniPrivacy.forEach(htmlContent => {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = htmlContent;
        // Inserisce il contenuto reale nel contenitore (evitando div extra vuoti)
        containerPrivacy.appendChild(wrapper.firstElementChild);
    });
} else {
    console.error("Errore: Elemento 'privacy-content' non trovato.");
}