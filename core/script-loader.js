// core/script-loader.js
window.SpottioScriptLoader = (function() {
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = false; // Mantiene l'ordine sequenziale di esecuzione
            script.onload = () => resolve(src);
            script.onerror = () => reject(new Error(`Impossibile caricare lo script: ${src}`));
            document.head.appendChild(script);
        });
    }

    async function loadSeries(scripts) {
        for (const src of scripts) {
            await loadScript(src);
        }
    }

    return { loadScript, loadSeries };
})();