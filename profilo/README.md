# Documentazione Modulo Profilo - Spottio

Questa documentazione descrive l'architettura rifattorizzata e la struttura organizzativa del modulo **Profilo** dell'applicazione **Spottio**.

---

## 📐 Panoramica dell'Architettura

Per migliorare la manutenibilità, la leggibilità e la scalabilità del codice, il file monolitico originale `profilo.js` è stato suddiviso in moduli specializzati organizzati in sottocartelle per dominio funzionale.

Tutti i moduli condividono uno stato globale unificato accessibile tramite l'oggetto `window.AppProfilo`, evitando problemi di scope e garantendo l'interoperabilità tra le varie componenti.

---

## 📁 Struttura delle Cartelle e dei File

```text
profilo/
├── profilo.html                # Pagina HTML principale del profilo
├── profilo-translations.js     # Dizionario traduzioni multilingua (i18n)
├── core/
│   └── profilo-core.js         # Stato globale, Inizializzazione, Auth & Caricamento dati utente
├── features/
│   ├── profilo-azioni.js       # Gestione form (Bio/Username) e Upload immagini (Cloudinary)
│   └── profilo-modali.js       # Gestione modali e liste utenti (Follower e Seguiti)
└── posts/
    └── carica-post-profilo.js  # Recupero e rendering dei post dell'utente
```

---

## 🔍 Dettaglio dei Componenti

### 1. `core/profilo-core.js`
* **Scopo**: Costituisce il cuore dell'applicazione per il profilo.
* **Responsabilità principali**:
  * Inizializza l'oggetto globale `window.AppProfilo`.
  * Gestisce i riferimenti agli elementi DOM principali.
  * Ascolta i cambiamenti di stato di autenticazione (`firebase.auth().onAuthStateChanged`).
  * Recupera i dati del profilo utente da Firestore (`users` collection).
  * Aggiorna gli elementi base del profilo (Username, Badge verificato, Bio, Avatar e contatori numerici).

---

### 2. `features/profilo-azioni.js`
* **Scopo**: Gestisce tutte le interazioni dell'utente volte alla modifica delle informazioni del profilo.
* **Responsabilità principali**:
  * **Modifica Bio & Username**:
    * Gestione dell'apertura/chiusura dei form dedicati.
    * Validazione degli input e verifica dell'univocità dello username in Firestore.
    * Aggiornamento sincrono/asincrono di Firestore e della UI.
  * **Upload Avatar (Cloudinary)**:
    * Validazione tipo e dimensione file (limite 5 MB).
    * Caricamento asincrono su Cloudinary (`spottio_preset`).
    * Generazione URL ottimizzato (`w_300,h_300,c_fill,f_auto,q_auto`).
    * Salvataggio del nuovo URL `userPfUri` in Firestore.

---

### 3. `features/profilo-modali.js`
* **Scopo**: Gestisce l'esperienza utente legata ai modali delle relazioni social.
* **Responsabilità principali**:
  * Gestione apertura/chiusura della finestra modale per le liste utenti.
  * Fetch in parallelo via `Promise.all` dei documenti utente per la lista dei **Follower** o **Seguiti**.
  * Generazione dinamica dell'HTML dei singoli utenti completi di avatar, username e badge di verifica.
  * Gestione stati di caricamento (`loading`), liste vuote ed errori.

---

### 4. `posts/carica-post-profilo.js`
* **Scopo**: Gestisce il recupero e l'esposizione dei contenuti creati dall'utente.
* **Responsabilità principali**:
  * Interrogazione su Firestore (`posts` collection filtered by `user == currentUid`).
  * Aggiornamento del contatore totale dei post nel profilo.
  * Delega del rendering visivo dei post alla funzione centralizzata `window.renderPost` (`ui-renderer.js`).

---

### 5. `profilo-translations.js`
* **Scopo**: Gestione dell'internazionalizzazione del profilo.
* **Responsabilità principali**:
  * Estensione dell'oggetto globale `window.translations`.
  * Supporto per 14 lingue (IT, EN, ES, FR, DE, AR, RU, JA, NL, PL, ZH, HI, KO-KP, KO-KR).

---

## 🛠️ Guida all'Integrazione in HTML

Per garantire che le dipendenze vengano risolte correttamente, importa gli script nel file `profilo.html` seguendo il seguente ordine:

```html
<!-- Utility e Script Globali -->
<script src="../load-firebase.js"></script>
<script src="../impostazioni/spottio-utils.js"></script>
<script src="../pubblici/ui/ui-renderer.js"></script> 
<script src="../pubblici/feed/feedAlgorithm.js"></script>
<script src="../pubblici/feed/algorithm-interactions.js"></script>
<script src="../pubblici/ui/ui-actions.js"></script>
<script src="../pubblici/reports/reports.js"></script>

<!-- Traduzioni Modulo Profilo -->
<script src="profilo-translations.js"></script>

<!-- Moduli del Profilo Rifattorizzati -->
<script src="core/profilo-core.js"></script>
<script src="features/profilo-azioni.js"></script>
<script src="features/profilo-modali.js"></script>
<script src="posts/carica-post-profilo.js"></script>

<!-- Navigazione Globale -->
<script src="../load-nav-scripts.js"></script>
```

---

## ✨ Vantaggi Principali

1. **Separazione delle Responsabilità (SoC)**: Ogni file gestisce un unico dominio concettuale.
2. **Manutenibilità Aumentata**: Le modifiche grafiche o di logica sono isolate nei singoli file.
3. **Debug Semplificato**: Gli errori di runtime sono facilmente localizzabili nel file di pertinenza.
4. **Scalabilità Futura**: Nuove funzionalità (es. statistiche, impostazioni privacy) possono essere aggiunte creando semplicemente nuove sottocartelle o nuovi file in `features/`.