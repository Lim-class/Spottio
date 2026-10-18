(function mockInstagramWeeklyUsage() {
    // Funzione per formattare la chiave data nel formato YYYY-MM-DD
    function formatDateKey(d) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    const usageMap = {};
    const today = new Date();

    // Genera gli ultimi 7 giorni:
    // i = 0 è Oggi, i = 1 è Ieri, i = 2 è l'altro ieri, ecc.
    // Alterna: un giorno 3 ore (180 min), un giorno 4 ore (240 min)
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateKey = formatDateKey(d);

        // Se i è pari (es. 0 = Oggi, 2, 4, 6) imposta 3 ore (180 min),
        // se i è dispari (es. 1 = Ieri, 3, 5) imposta 4 ore (240 min)
        const minutes = (i % 2 === 0) ? 180 : 240;
        usageMap[dateKey] = minutes;
    }

    // Salva nella chiave localStorage letta da SpottioWellness
    localStorage.setItem('spottio_daily_usage_map', JSON.stringify(usageMap));

    // Se applicabile, allinea anche i minuti giornalieri per la sessione corrente
    localStorage.setItem('spottio_usage_minutes', '180');
    localStorage.setItem('spottio_usage_date', formatDateKey(today));

    // Scatena l'evento per aggiornare reattivamente il grafico Vue in tempo reale se la pagina è aperta
    window.dispatchEvent(new CustomEvent('spottio-wellness-updated'));

    console.log("Dati settimanali alternati (3h e 4h) applicati con successo!");
    console.table(usageMap);
})();