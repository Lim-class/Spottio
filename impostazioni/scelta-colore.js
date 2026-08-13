/**
 * API UTILIZZATA: The Color API
 * Questa API gratuita permette di ottenere informazioni dettagliate su un colore partendo dal suo codice HEX.
 * In questa versione, usiamo il NOME restituito dall'API come ID del documento nel database.
 * Link Documentazione: https://www.thecolorapi.com/
 */

document.addEventListener('DOMContentLoaded', () => {
    loadColorsFromDatabase();
    setupCustomColorPicker();
});

// Gestione del selettore colore personalizzato
function setupCustomColorPicker() {
    const saveBtn = document.getElementById('saveCustomColorBtn');
    const colorInput = document.getElementById('customColorInput');
    const nameDisplay = document.getElementById('detectedColorName');

    if (saveBtn && colorInput) {
        // Rileva il nome in tempo reale per l'anteprima
        colorInput.addEventListener('input', async () => {
            const hex = colorInput.value.replace('#', '');
            const name = await fetchColorName(hex);
            if (nameDisplay) nameDisplay.innerText = `Nome rilevato: ${name}`;
        });

        saveBtn.addEventListener('click', async () => {
            const hexColor = colorInput.value;
            const cleanHex = hexColor.replace('#', '');
            
            // Recupera il nome automatico
            const autoName = await fetchColorName(cleanHex);

            try {
                // MODIFICA: Ora usiamo il NOME del colore come ID del documento
                // Questo rende il database molto più leggibile
                await db.collection('ColoriSfondo').doc(autoName).set({
                    hex: hexColor,
                    nome: autoName
                });

                saveAndApplyColor(hexColor);
                loadColorsFromDatabase(); 
                
                alert(`Il colore "${autoName}" è stato salvato!`);
            } catch (error) {
                console.error("Errore nel salvataggio su Firebase:", error);
                alert("Errore durante il salvataggio del colore.");
            }
        });
    }
}

// Funzione per interrogare l'API esterna
async function fetchColorName(hex) {
    try {
        const response = await fetch(`https://www.thecolorapi.com/id?hex=${hex}`);
        const data = await response.json();
        return data.name.value; 
    } catch (error) {
        console.error("Errore API:", error);
        return `Colore-${hex}`; // Fallback se l'API non risponde
    }
}

// Caricamento dei bottoni dal Database
async function loadColorsFromDatabase() {
    const container = document.getElementById('color-picker-container');
    if (!container) return;

    try {
        const querySnapshot = await db.collection('ColoriSfondo').get();
        container.innerHTML = ''; 

        querySnapshot.forEach((doc) => {
            const colorData = doc.data();
            
            const btn = document.createElement('button');
            btn.className = "color-btn w-12 h-12 rounded-full border-2 border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-300 transition duration-200 transform hover:scale-110";
            
            btn.style.backgroundColor = colorData.hex;
            btn.setAttribute('data-color', colorData.hex);
            
            // Il titolo del bottone (tooltip) sarà il nome o l'ID del documento
            btn.title = colorData.nome || doc.id; 

            btn.addEventListener('click', () => {
                saveAndApplyColor(colorData.hex);
            });

            container.appendChild(btn);
        });

    } catch (error) {
        console.error("Errore nel caricamento dei colori:", error);
    }
}

async function saveAndApplyColor(color) {
    // 1. Applica e salva localmente per reattività immediata della UI
    localStorage.setItem('user-background-color', color);
    document.body.style.backgroundColor = color;

    // 2. Salva nel Database Firestore per l'utente attualmente connesso
    if (window.auth) {
        const user = window.auth.currentUser;
        if (user) {
            try {
                const username = localStorage.getItem('username'); // Recupera lo username dell'utente loggato
                
                if (username) {
                    // Aggiorna direttamente usando lo username come Document ID
                    await window.db.collection('users').doc(username).update({
                        bodyBackgroundColor: color
                    });
                    console.log("Colore del body salvato su Firestore (via username).");
                } else {
                    // Fallback: Cerca il documento dell'utente tramite la sua email
                    const snapshot = await window.db.collection('users').where('email', '==', user.email).get();
                    if (!snapshot.empty) {
                        await snapshot.docs[0].ref.update({
                            bodyBackgroundColor: color
                        });
                        console.log("Colore del body salvato su Firestore (via email query).");
                    }
                }
            } catch (error) {
                console.error("Errore durante il salvataggio del colore utente su Firestore:", error);
            }
        }
    }
}

/**
 * Converte un codice HEX in una stringa RGB per facilitare la ricerca
 * @param {string} hex - Il colore in formato #RRGGBB
 * @returns {string} - Stringa in formato "rgb(r, g, b)"
 */
function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${r}, ${g}, ${b})`;
}

// Funzione di ricerca avanzata (Nome, HEX, RGB) per filtrare i colori all'interno della sezione
function filterColors() {
    const input = document.getElementById('searchColors');
    const filter = input.value.toLowerCase().replace(/\s+/g, ''); // Rimuove spazi per facilitare la ricerca RGB
    const container = document.getElementById('color-picker-container');
    const buttons = container.getElementsByTagName('button');

    for (let i = 0; i < buttons.length; i++) {
        const btn = buttons[i];
        const hex = btn.getAttribute('data-color').toLowerCase();
        const nome = btn.title.toLowerCase();
        const rgb = hexToRgb(hex).toLowerCase().replace(/\s+/g, '');

        // Controlla se il filtro corrisponde al nome, all'HEX o all'RGB
        if (nome.includes(filter) || hex.includes(filter) || rgb.includes(filter)) {
            btn.style.display = "";
        } else {
            btn.style.display = "none";
        }
    }
}