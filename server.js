// Point d'entrée principal pour Render
// Redirige vers le serveur dans le dossier backend

const path = require('path');

// Changer le répertoire de travail vers backend
process.chdir(path.join(__dirname, 'backend'));

// Importer et démarrer le serveur
require('./server.js');
