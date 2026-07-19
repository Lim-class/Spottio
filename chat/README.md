# Specifiche Tecniche e Architettura del Modulo Chat 💬

Questo documento descrive in dettaglio l'architettura tecnica, le scelte implementative e i pattern di programmazione adottati nella scomposizione del modulo di messaggistica. L'applicazione è strutturata seguendo il paradigma della **Separation of Concerns (SoC)** utilizzando Vanilla JavaScript (ES6+), Tailwind CSS per lo strato di presentazione e Google Firebase/Firestore per lo strato di presentazione, persistenza e streaming dei dati.

---

## 📂 Struttura del Modulo (Organizzazione SoC)

Il modulo è stato suddiviso in quattro sottocartelle logiche per isolare le responsabilità strutturali, logiche, grafiche e di gruppo:

```text
chat/
├── chat.html                 # Punto d'ingresso principale del modulo
├── chat.css                  # Stili strutturali e logica responsive mobile
├── README.md                 # Documentazione tecnica del modulo
│
├── 📁 messages/              # Stato globale, flussi dati e mutazioni
│   ├── messages-globals.js
│   ├── messages-init.js
│   ├── messages-chat.js
│   ├── messages-send.js
│   ├── messages-search.js
│   └── messages-actions.js
├── 📁 ui/                    # Manipolazione DOM e motori di rendering grafico
│   ├── chat-lists-renderer.js
│   ├── chat-messages-renderer.js
│   └── chat-settings.js
└── 📁 groups/                # Logica verticale e interfacce dei gruppi
    ├── groups-ui.js
    ├── groups-create.js
    └── groups-admin.js

## 🏗️ Modello dei Dati & Schema Firestore (NoSQL)

L'applicazione modella le relazioni e i messaggi sfruttando strutture piatte e sotto-collezioni nidificate per ottimizzare le letture ed evitare il superamento dei limiti di dimensione dei documenti Firestore (1MB).

🔥 Firestore Root
├── 📁 users (Document ID: username)
│    └── chatBackgroundColor: string (HEX o valore speciale)
│
├── 📁 ColoriSfondo (Document ID: auto-generato)
│    ├── hex: string
│    └── nome: string
│
├── 📁 chat_previews (Document ID: conversationId o groupId)
│    ├── groupName: string [Opzionale]
│    ├── isGroup: boolean
│    ├── groupId: string [Opzionale]
│    ├── participants: array (string)
│    ├── lastMessage: string
│    ├── lastSender: string
│    └── lastUpdate: timestamp (FieldValue.serverTimestamp)
│
├── 📁 chats (Document ID: conversationId)
│    └── 📁 messages (Document ID: auto-generato)
│         ├── sender: string
│         ├── receiver: string
│         ├── text: string
│         ├── timestamp: timestamp
│         ├── conversationId: string
│         ├── edited: boolean
│         └── deleted: boolean
│
└── 📁 groups (Document ID: groupId)
├── name: string
├── members: array (string)
├── createdBy: string
├── createdAt: timestamp
└── 📁 chats (Document ID: auto-generato)
├── groupId: string
├── text: string
├── sender: string ("Sistema" o username)
└── timestamp: timestamp


### 🗝️ Algoritmo di Routing per Chat Private (`conversationId`)
Per garantire il determinismo e la simmetria nelle chat dirette (DM) tra due utenti, senza dover mappare una direzione specifica (A verso B o B verso A), l'ID del documento della conversazione viene calcolato ordinando alfabeticamente gli username degli attori:
```javascript
const conversationId = [currentUser.username, activeChat.id].sort().join('_');
Questo garantisce che sia l'utente alice che l'utente bob puntino sempre e univocamente allo stesso percorso: chats/alice_bob/messages.

🔄 Gestione dello Stato e Ciclo di Vita (Lifecycle)
L'applicazione implementa una gestione dello stato centralizzata ma non reattiva (accoppiata direttamente al DOM tramite caching dei nodi).

[ Caricamento DOM ] ──> [ messages-init.js ] ──> Controlla Sessione (LocalStorage)
                                 │
                                 ├──> Inizializza Variabili Globali (messages-globals.js)
                                 ├──> Registra Event Listeners Cross-Modulo
                                 ├──> Fetch Async Preferenze Utente (Sfondo)
                                 └──> Sottoscrizione Stream Firestore (listenToMyChats)
1. Prevenzione dei Memory Leak (Unsubscribe Pattern)
Dato l'uso intensivo di listener in tempo reale (onSnapshot), per evitare molteplici registrazioni dello stesso stream (che causerebbero spreco di banda e glitch grafici), l'applicazione pulisce sistematicamente i puntatori globali prima di riallocarli:

JavaScript
if (chatUnsubscribe) chatUnsubscribe(); // Disconnette il vecchio stream prima di aprire il nuovo
🗂️ Analisi Tecnica dei Componenti Software
⚙️ Core & Bootstrapping
messages-globals.js: Funge da Global State Container. Registra in memoria i riferimenti ai nodi critici del DOM all'avvio per evitare costose e ripetute chiamate a document.getElementById durante i cicli di rendering dei messaggi.

messages-init.js: Orchestratore di Bootstrapping. Sfrutta l'asincronia (async/await) per risolvere le dipendenze esterne (recupero configurazioni di sfondo da Firestore) prima di esporre l'interfaccia o attivare i listener di input.

📊 Streaming & Scrittura Dati (Data Layer)
messages-chat.js: Data Query Engine. Sfrutta le query indicizzate di Firestore. Per le anteprime, utilizza l'operatore array-contains sul campo participants per estrarre in un unico stream tutte le chat rilevanti per l'utente loggato. Implementa un controllo algoritmico del cambio di data (formatDateLabel) per iniettare i divisori temporali in modo lineare durante l'iterazione dello snapshot.

messages-send.js: Mutation Handler. Centralizza la logica di invio messaggi eseguendo una scrittura disgiunta: effettua un'operazione di add() sulla sotto-collezione dei messaggi e parallelamente un'operazione di set(..., { merge: true }) sul documento di preview per aggiornare l'ultimo messaggio visibile nella sidebar in modo atomico.

🛠️ Mutazioni In-Line (CRUD Logico)
messages-actions.js: Implementa pattern di modifica e cancellazione atomica tramite il metodo update().

Soft-Delete: L'eliminazione non distrugge il record fisicamente (evitando di rompere l'ordinamento basato su timestamp), ma esegue un override del payload del testo e imposta il flag deleted: true.

Scope Resolution: Determina dinamicamente a runtime se il messaggio appartiene a una subcollection di una chat privata o di un gruppo per instradare correttamente la promessa di aggiornamento.

🎨 Rendering & Strato di Presentazione (UI Layer)
chat-messages-renderer.js: Agisce come un motore di template funzionale. Trasforma i dati grezzi ricevuti da Firestore in frammenti HTML.

Prevenzione XSS / Iniezione di Codice: Prima di iniettare stringhe di testo grezze all'interno degli attributi onclick dei bottoni di modifica, viene eseguito l'escaping dei caratteri speciali:

JavaScript
const safeText = text.replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, '\\n');
chat-lists-renderer.js: Gestisce il rendering efficiente delle liste ed espone funzioni globali sull'oggetto window per renderle accessibili ai nodi HTML generati dinamicamente (es. window.removeMember).

chat-settings.js: Gestisce l'accoppiamento tra memoria locale del browser (file caricati via FileReader come DataURL) e persistenza sul cloud (salvataggio stringhe colore nel profilo utente).

👥 Modulo Gruppi (Business Logic Avanzata)
groups-ui.js & groups-create.js: Sfruttano un array temporaneo (selectedGroupMembers) per mantenere lo stato locale dei membri pronti per l'invito prima di effettuare la transazione di creazione finale su Firestore.

groups-admin.js: Applica controlli sui permessi lato client confrontando createdBy === currentUser.username per abilitare o nascondere sezioni critiche del DOM (espulsione, aggiunta, modifica nome). Produce messaggi di log applicativi contrassegnati con sender: "Sistema", storicizzando le azioni amministrative direttamente nella timeline dei messaggi.

📱 Gestione Layout Mobile & Strategia di Caching CSS
chat.css: Configura le proprietà CSS strutturali. Sfrutta una combinazione di direttive @media e modifiche programmatiche delle classi JavaScript (.hidden-mobile) per implementare un sistema di navigazione a schede (Lista Chat <-> Contenuto Conversazione) sui viewport inferiori a 1024px.

Garantire lo Scroll Coreografico: L'elemento #messages-container forza le proprietà flex-direction: column combinandole con un reset automatico del puntatore di scroll ad ogni ricezione di pacchetti dati da Firestore:

JavaScript
messagesContainer.scrollTop = messagesContainer.scrollHeight;

