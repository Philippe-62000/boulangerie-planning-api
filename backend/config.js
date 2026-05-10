module.exports = {
  // Configuration de l'environnement
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,

  // Base de données MongoDB
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://phimjc:ZDOPZA2Kd8ylewoR@cluster0.4huietv.mongodb.net/boulangerie-planning?retryWrites=true&w=majority',

  // Clé secrète JWT — voir backend/utils/jwtSecret.js. Pas de fallback hard-codé,
  // sinon un attaquant pourrait forger des tokens. Lire la variable au runtime.
  get JWT_SECRET() {
    return require('./utils/jwtSecret').getJwtSecret();
  },

  // Google API Key pour Commandes en ligne (Google Sheets) - Longuenesse
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || '',

  // Configuration de l'application
  APP_NAME: 'Planning Boulangerie',
  APP_VERSION: '1.0.1',

  // Configuration CORS
  CORS_ORIGIN: ['https://www.filmara.fr', 'http://localhost:3000'],

  // Configuration des horaires d'ouverture
  BUSINESS_HOURS: {
    start: '06:00',
    end: '20:30',
    breakThreshold: 5.5, // heures avant pause obligatoire
    breakDuration: 30 // minutes de pause
  },

  // Configuration des besoins en personnel par affluence
  STAFF_REQUIREMENTS: {
    0: { // Faible
      morning: { staff: 1 },
      afternoon: { staff: 2 }
    },
    2: { // Normal
      morning: { staff: 2 },
      afternoon: { staff: 3 }
    },
    4: { // Fort
      morning: { staff: 3 },
      afternoon: { staff: 4 }
    }
  }
};

