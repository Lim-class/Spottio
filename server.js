// server.js
const express = require('express');
const path = require('path');
const cryptoHandler = require('./api/crypto');

const app = express();

// Abilita la lettura dei payload JSON in arrivo
app.use(express.json());

// Inoltra le chiamate a /api/crypto alla Serverless Function
app.all('/api/crypto', (req, res) => {
    cryptoHandler(req, res);
});

// Serve tutti i file del sito (HTML, JS, CSS, immagini)
app.use(express.static(path.join(__dirname)));

const PORT = 8000;
app.listen(PORT, () => {
    console.log(`Server Spottio attivo su http://localhost:${PORT}`);
    console.log(`Chat raggiungibile su http://localhost:${PORT}/chat/chat.html`);
});