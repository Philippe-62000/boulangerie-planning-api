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

// Connexion à MongoDB
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
})
.catch(err => console.error('❌ Erreur de connexion MongoDB:', err));

// Routes
app.use('/api/auth', require('./routes/auth')); // Réactivé - JWT_SECRET doit être ajouté sur Render
app.use('/api/menu-permissions', require('./routes/menuPermissions'));
app.use('/api/passwords', require('./routes/passwords'));
app.use('/api/site', require('./routes/site'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/planning', require('./routes/planning'));
app.use('/api/constraints', require('./routes/constraints'));
app.use('/api/absences', require('./routes/absences'));
app.use('/api/sales-stats', require('./routes/salesStats'));
app.use('/api/meal-expenses', require('./routes/mealExpenses'));
app.use('/api/parameters', require('./routes/parameters'));
app.use('/api/km-expenses', require('./routes/kmExpenses'));
app.use('/api/employee-status', require('./routes/employeeStatus'));
app.use('/api/sick-leaves', require('./routes/sickLeaves'));
app.use('/api/cleanup', require('./routes/cleanup'));
app.use('/api/vacation-requests', require('./routes/vacationRequests'));
app.use('/api/email-templates', require('./routes/emailTemplates'));
app.use('/api/database', require('./routes/database'));

// Route de santé pour vérifier que l'API fonctionne
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: config.APP_VERSION,
    environment: config.NODE_ENV
  });
});

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

const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`🚀 ${config.APP_NAME} v${config.APP_VERSION}`);
  console.log(`📡 Serveur démarré sur le port ${PORT}`);
  console.log(`🌍 Environnement: ${config.NODE_ENV}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
});

module.exports = app;

