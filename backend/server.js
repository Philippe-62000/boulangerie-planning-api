const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const config = require('./config');

const app = express();

// Middleware de sécurité pour la production
app.use(helmet());
app.use(compression());

// Configuration CORS pour la production - HTTPS uniquement
const allowedOrigins = [
  'https://www.filmara.fr',
  'https://filmara.fr',
  'http://localhost:3000',
  'http://localhost:3001'
];

// Si CORS_ORIGIN est défini, l'utiliser, sinon utiliser la liste par défaut
const corsOrigins = process.env.CORS_ORIGIN ? 
  process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()) : 
  allowedOrigins;

console.log('🔧 CORS Origins configurés:', corsOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    // Permettre les requêtes sans origine (ex: Postman, curl)
    if (!origin) return callback(null, true);
    
    // Vérifier si l'origine est autorisée
    if (corsOrigins.indexOf(origin) !== -1) {
      console.log('✅ CORS autorisé pour:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS refusé pour:', origin);
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept']
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const PORT = Number(process.env.PORT) || config.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Santé : enregistré en premier pour que Render puisse valider le déploiement
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: config.APP_VERSION,
    environment: config.NODE_ENV
  });
});

// Render : ouvrir le port immédiatement (avant require lourd des routes / MongoDB)
// Sinon le scan de port peut expirer si le chargement des modules est lent
app.listen(PORT, HOST, () => {
  console.log(`🚀 ${config.APP_NAME} v${config.APP_VERSION}`);
  console.log(`📡 Serveur démarré sur ${HOST}:${PORT}`);
  console.log(`🌍 Environnement: ${config.NODE_ENV}`);
  console.log(`🔗 PORT effectif (Render): ${PORT}`);
});

// Connexion à MongoDB (après écoute — ne bloque pas l'ouverture du port)
mongoose.connect(config.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('✅ Connecté à MongoDB');
  
  // Initialiser les permissions de menu par défaut
  try {
    const MenuPermissions = require('./models/MenuPermissions');
    await MenuPermissions.createDefaultPermissions();
    console.log('✅ Permissions de menu initialisées');
  } catch (error) {
    console.error('❌ Erreur initialisation permissions:', error);
  }
  
  // Nettoyage automatique des arrêts maladie expirés
  try {
    const cleanupController = require('./controllers/cleanupController');
    await cleanupController.autoCleanup();
  } catch (error) {
    console.error('❌ Erreur nettoyage automatique:', error);
  }
  
  // Nettoyage automatique des documents expirés
  try {
    const Document = require('./models/Document');
    const cleanedCount = await Document.cleanExpiredDocuments();
    if (cleanedCount > 0) {
      console.log(`🧹 ${cleanedCount} documents expirés nettoyés`);
    } else {
      console.log('✅ Aucun document expiré à nettoyer');
    }
  } catch (error) {
    console.error('❌ Erreur nettoyage documents expirés:', error);
  }
  
  // Vérifier que nodemailer est disponible
  try {
    const nodemailer = require('nodemailer');
    if (nodemailer && typeof nodemailer.createTransport === 'function') {
      console.log('✅ Nodemailer chargé avec succès');
    } else {
      console.error('❌ Nodemailer chargé mais invalide');
    }
  } catch (error) {
    console.error('❌ Erreur chargement nodemailer au démarrage:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
  }

  // Planifier l'envoi de rappels pour les justificatifs mutuelle expirant bientôt
  try {
    const cron = require('node-cron');
    const mutuelleController = require('./controllers/mutuelleController');
    
    // Exécuter tous les lundis à 9h du matin
    cron.schedule('0 9 * * 1', () => {
      console.log('⏰ Exécution programmée des rappels mutuelle...');
      mutuelleController.sendExpirationReminders();
    });
    
    console.log('⏰ Rappels mutuelle programmés (tous les lundis à 9h)');
  } catch (error) {
    console.error('❌ Erreur programmation rappels mutuelle:', error);
  }
})
.catch(err => console.error('❌ Erreur de connexion MongoDB:', err));

// Routes (après listen — Express accepte d'ajouter des routes ensuite)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/menu-permissions', require('./routes/menuPermissions'));
app.use('/api/passwords', require('./routes/passwords'));
app.use('/api/site', require('./routes/site'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/planning', require('./routes/planning'));
app.use('/api/constraints', require('./routes/constraints'));
app.use('/api/absences', require('./routes/absences'));
app.use('/api/sales-stats', require('./routes/salesStats'));
app.use('/api/daily-sales', require('./routes/dailySales'));
app.use('/api/daily-losses', require('./routes/dailyLosses'));
app.use('/api/meal-expenses', require('./routes/mealExpenses'));
app.use('/api/parameters', require('./routes/parameters'));
app.use('/api/km-expenses', require('./routes/kmExpenses'));
app.use('/api/employee-status', require('./routes/employeeStatus'));
app.use('/api/sick-leaves', require('./routes/sickLeaves'));
app.use('/api/cleanup', require('./routes/cleanup'));
app.use('/api/vacation-requests', require('./routes/vacationRequests'));
app.use('/api/delays', require('./routes/delays'));
app.use('/api/ticket-restaurant', require('./routes/ticketRestaurant'));
app.use('/api/email-templates', require('./routes/emailTemplates'));
app.use('/api/database', require('./routes/database'));
app.use('/api/onboarding-offboarding', require('./routes/onboardingOffboarding'));
app.use('/api/uniforms', require('./routes/uniforms'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/advance-requests', require('./routes/advanceRequests'));
app.use('/api/primes', require('./routes/primes'));
app.use('/api/mutuelle', require('./routes/mutuelle'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/employee-messages', require('./routes/employeeMessages'));
app.use('/api/recup-hours', require('./routes/recupHours'));
app.use('/api/ambassadors', require('./routes/ambassadors'));
app.use('/api/online-orders', require('./routes/onlineOrders'));
app.use('/api/product-exchanges', require('./routes/productExchanges'));
app.use('/api/responsable-km', require('./routes/responsableKm'));
app.use('/api/meal-reservations', require('./routes/mealReservations'));
console.log('✅ Routes meal-reservations montées (/api/meal-reservations/*)');
app.use('/api/chorus', require('./routes/chorus'));
console.log('✅ Routes chorus montées (/api/chorus/*)');

// Route racine
app.get('/', (req, res) => {
  res.json({ 
    message: `${config.APP_NAME} v${config.APP_VERSION}`,
    environment: config.NODE_ENV,
    endpoints: {
      health: '/health',
      // auth: '/api/auth', // Temporairement désactivé
      menuPermissions: '/api/menu-permissions',
      employees: '/api/employees',
        planning: '/api/planning',
        constraints: '/api/constraints',
        salesStats: '/api/sales-stats',
        mealExpenses: '/api/meal-expenses',
        parameters: '/api/parameters',
        kmExpenses: '/api/km-expenses',
        recupHours: '/api/recup-hours',
        employeeStatus: '/api/employee-status'
      }
  });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', err.stack);
  res.status(500).json({ 
    error: config.NODE_ENV === 'production' ? 'Erreur serveur interne' : err.message 
  });
});

// Gestion des routes non trouvées
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

module.exports = app;
