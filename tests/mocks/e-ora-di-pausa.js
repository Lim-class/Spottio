(function() {
    // Simula diversi quantitativi di minuti trascorsi (es. 140 min = 2 ore e 20 min)
    const testMinutesList = [140, 75, 60, 45, 1];

    testMinutesList.forEach(elapsedMinutes => {
        const h = Math.floor(elapsedMinutes / 60);
        const m = elapsedMinutes % 60;
        
        const parts = [];
        if (h > 0) parts.push(`${h} ${h === 1 ? 'ora' : 'ore'}`);
        if (m > 0) parts.push(`${m} ${m === 1 ? 'minuto' : 'minuti'}`);
        const formattedTime = parts.length > 0 ? parts.join(' e ') : 'meno di un minuto';

        console.log(`Minuti passati: ${elapsedMinutes} -> Testo generato: "${formattedTime}"`);
    });

    // Se vuoi testare direttamente l'apertura del modale con 2 ore e 20 minuti:
    if (window.Spottio && typeof window.Spottio.showBreakModal === 'function') {
        window.Spottio.showBreakModal("2 ore e 20 minuti");
        console.log("Modale di pausa aperto con successo per il test visivo!");
    } else {
        console.warn("L'oggetto window.Spottio non è disponibile in questa pagina.");
    }
})();