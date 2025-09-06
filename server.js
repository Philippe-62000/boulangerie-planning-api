// Point d'entrée pour Render
// Ce fichier redirige vers le vrai serveur dans backend/

const path = require('path');

// Changer le répertoire de travail vers backend
process.chdir(path.join(__dirname, 'backend'));

// Importer et démarrer le vrai serveur
require(path.join(__dirname, 'backend', 'server.js'));
