# Specifiche Tecniche e Architettura del Modulo Chat 💬

Questo documento descrive l'architettura tecnica del modulo di messaggistica **Spottio**, strutturata con **Vue.js 3 (Global Build)** e **Firebase Firestore**, organizzata per **sottocartelle funzionali (Feature-Based)** e componenti JavaScript dedicati.

---

## 📂 Struttura del Progetto

Il codice è suddiviso in sottocartelle basate sulla funzionalità, evitando file monolitici e separando la logica reattiva (Composables) dai componenti visivi (Vue Component Objects con template literal):

```text
chat/
├── chat.html                               # File principale: include script e monta i tag dei componenti
├── chat.css                                # Stili layout, classi custom-scrollbar e responsive mobile
├── spottio-crypto.js                       # Motore crittografico AES e determinismo conversationId
├── README.md                               # Documentazione architetturale
│
├── core/
│   ├── chat-helpers.js                     # Cache utenti lazy (resolveUids), sanitizzazione XSS, date e avatar
│   └── chat-main.js                        # Controller Vue 3, bootstrap Auth, listener chat e app.component()
│
├── sidebar/
│   └── chat-sidebar.component.js           # Componente Vue: Ricerca contatti e lista chat attive
│
├── messages/
│   ├── use-chat-messages.js                # Composable: stream messaggi, caricamento a step di 5, vocali
│   ├── chat-messages.component.js          # Componente Vue: header, timeline messaggi, menu azioni, input form
│   └── message-info-modal.component.js     # Componente Vue: modale ricevute di lettura orarie
│
├── groups/
│   ├── use-chat-groups.js                  # Composable: creazione gruppi, gestione membri e permessi
│   ├── group-create-modal.component.js     # Componente Vue: modale di creazione gruppo con foto preview
│   └── group-info-modal.component.js       # Componente Vue: pannello info partecipanti e controlli admin
│
├── theme/
│   └── use-chat-theme.js                   # Composable: gestione sfondi HEX e upload immagini Cloudinary
│
└── ephemeral/
    └── ephemeral-modal.component.js        # Componente Vue: modale configurazione timer messaggi a scomparsa
```

---

## 🏗️ Modello dei Dati & Schema Firestore (NoSQL)

L'applicazione fa uso di una combinazione di root collections e sub-collections piatte:

```text
🔥 Firestore Root
├── 📁 users (Document ID: uid)
│    ├── username: string
│    ├── userPfUri: string
│    ├── isVerified: boolean
│    └── chatBackgroundColor: string (HEX o URL Cloudinary)
│
├── 📁 ColoriSfondo (Document ID: auto-generato)
│    ├── hex: string
│    └── nome: string
│
├── 📁 chat_previews (Document ID: conversationId o groupId)
│    ├── isGroup: boolean
│    ├── groupId: string [Opzionale]
│    ├── groupName: string [Opzionale]
│    ├── groupAvatarUrl: string [Opzionale]
│    ├── participants: array<string> (Array di UID)
│    ├── lastMessage: string (Payload cifrato AES)
│    ├── lastSender: string (UID o "Sistema")
│    └── lastUpdate: timestamp (FieldValue.serverTimestamp)
│
├── 📁 chats (Document ID: conversationId deterministico)
│    ├── ephemeralDuration: number (Durata timer effimero in secondi)
│    └── 📁 messages (Document ID: auto-generato)
│         ├── sender: string (UID)
│         ├── receiver: string (UID)
│         ├── text: string (Payload cifrato AES)
│         ├── timestamp: timestamp
│         ├── expiresAt: timestamp [Opzionale per messaggi a scadenza]
│         ├── readReceipts: map<UID, timestamp> (Ricevute di lettura)
│         ├── deletedFor: array<UID> (Eliminazione selettiva "per me")
│         ├── reactions: map<emoji, array<UID>> (Reazioni emoji)
│         ├── replyTo: map<id, senderName, text> (Quote risposta)
│         ├── edited: boolean
│         └── deleted: boolean
│
└── 📁 groups (Document ID: groupId auto-generato)
     ├── name: string
     ├── avatarUrl: string
     ├── createdBy: string (UID creatore)
     ├── members: array<string> (Array di UID partecipanti)
     ├── memberNames: map<UID, username> (Mappa di lookup)
     ├── ephemeralDuration: number (Durata timer effimero in secondi)
     └── 📁 chats (Document ID: auto-generato)
          ├── sender: string (UID o "Sistema")
          ├── text: string (Payload cifrato AES)
          ├── timestamp: timestamp
          ├── expiresAt: timestamp
          ├── readReceipts: map<UID, timestamp>
          ├── deletedFor: array<UID>
          ├── reactions: map<emoji, array<UID>>
          └── replyTo: map<id, senderName, text>
```

---

## 🔐 Routing e Crittografia (`spottio-crypto.js`)

* **Routing Deterministico:** Nelle chat singole l'ID è deterministico per impedire duplicati:
  ```javascript
  conversationId = [uidA, uidB].sort().join('_')
  ```
* **Cifratura AES:** Prima del salvataggio nel database, ogni testo o riferimento media viene cifrato con la chiave derivata:
  ```javascript
  key = SYSTEM_MASTER_KEY + "_" + chatId
  ```

---

## ⚙️ Componenti Vue 3 & Composables

1. **`chat-sidebar.component.js`**: Gestisce la navigazione mobile/desktop, la barra di ricerca rapida con debounce/input event e l'emissione degli eventi di selezione chat.
2. **`chat-messages.component.js`**: Contiene l'header dinamico della conversazione, la renderizzazione con paginazione reversibile a step di 5 messaggi, il banner risposte quote, il visualizzatore e registratore per note vocali (.webm) e il form di input.
3. **`group-create-modal.component.js` & `group-info-modal.component.js`**: Isola le interfacce modali per la gestione dei gruppi con anteprima reattiva locale e controllo granulare dei privilegi amministratore.
4. **`ephemeral-modal.component.js`**: Consente di configurare scadenze personalizzate in minuti, ore o giorni convertendole in secondi e sincronizzandole su Firestore.
5. **`chat-main.js`**: Esegue il bootstrap di Vue 3 con `createApp`, registra globalmente i componenti, inizializza i composables modulari ed espone lo stato integrato.
