// Point d'entrée principal pour Render
// Redirige vers le serveur dans le dossier backend

const path = require('path');

// Importer et démarrer le serveur depuis le dossier backend
require(path.join(__dirname, 'backend', 'server.js'));
