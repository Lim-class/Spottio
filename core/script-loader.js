// =========================================================================
// FILE: core/script-loader.js
// Caricatore di script non bloccante (Zero document.write) con coda ordinata
// =========================================================================

window.SpottioScriptLoader = (function() {
    const loadedSet = new Set();

    function normalizeUrl(src) {
        try {
            return new URL(src, document.baseURI).href;
        } catch (e) {
            return src;
        }
    }

    /**
     * Accoda uno o più script nel DOM con async = false.
     * Il browser li scarica in parallelo ma li esegue nell'esatto ordine di inserimento.
     */
    function enqueue(scripts) {
        const list = Array.isArray(scripts) ? scripts : [scripts];
        list.forEach(src => {
            if (!src) return;
            const absUrl = normalizeUrl(src);
            if (loadedSet.has(absUrl)) return;
            loadedSet.add(absUrl);

            const script = document.createElement('script');
            script.src = src;
            script.async = false;
            script.defer = false;
            document.head.appendChild(script);
        });
    }

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const absUrl = normalizeUrl(src);
            if (loadedSet.has(absUrl)) {
                resolve(src);
                return;
            }
            loadedSet.add(absUrl);

            const script = document.createElement('script');
            script.src = src;
            script.async = false;
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

    /**
     * Intercetta gli script statici del body successivi ai loader per garantire
     * che vengano eseguiti solo DOPO gli script iniettati dinamicamente,
     * senza dover modificare i file HTML.
     */
    function setupParserBridge() {
        if (window.__spottioBridgeActive) return;
        window.__spottioBridgeActive = true;

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.tagName === 'SCRIPT' && node.src && !node.dataset.spottioQueued) {
                        const srcAttr = node.getAttribute('src');
                        // Non intercettare gli script che sono già gestiti o i loader stessi
                        if (srcAttr.includes('load-firebase.js')) continue;

                        // Rimuove il nodo bloccante dal parser e lo rimette nella coda async=false
                        node.removeAttribute('src');
                        node.dataset.spottioQueued = 'true';
                        enqueue(srcAttr);
                    }
                }
            }
        });

        observer.observe(document.documentElement, { childList: true, subtree: true });
        window.addEventListener('DOMContentLoaded', () => observer.disconnect(), { once: true });
    }

    return { enqueue, loadScript, loadSeries, setupParserBridge };
})();