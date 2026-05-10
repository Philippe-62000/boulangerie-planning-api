const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const BCRYPT_PATTERN = /^\$2[aby]\$\d+\$/;

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'employee'],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  permissions: [{
    type: String,
    enum: [
      'all',
      'view_planning',
      'view_absences', 
      'view_sales_stats',
      'view_meal_expenses',
      'view_km_expenses',
      'manage_employees',
      'manage_parameters',
      'manage_planning',
      'view_reports',
      'view_plateaux_repas'
    ]
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

/**
 * Hash le mot de passe à chaque modification, sauf s'il l'est déjà (préfixe bcrypt).
 * Permet la migration automatique d'anciens enregistrements stockés en clair.
 */
userSchema.pre('save', async function preSave(next) {
  if (!this.isModified('password')) return next();
  if (typeof this.password !== 'string' || this.password.length === 0) return next();
  if (BCRYPT_PATTERN.test(this.password)) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

/**
 * Compare un mot de passe en clair au hash stocké.
 * Si le hash en base est encore en clair (anciens enregistrements), accepte la
 * comparaison directe puis re-hashe pour la prochaine fois (migration silencieuse).
 *
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function comparePassword(plain) {
  if (!plain || !this.password) return false;
  if (BCRYPT_PATTERN.test(this.password)) {
    return bcrypt.compare(plain, this.password);
  }
  if (this.password === plain) {
    this.password = plain;
    try {
      await this.save();
    } catch (err) {
      console.error('[User.comparePassword] migration plain->bcrypt KO:', err.message);
    }
    return true;
  }
  return false;
};

// Méthode statique pour créer les utilisateurs par défaut
userSchema.statics.createDefaultUsers = async function() {
  try {
    // Vérifier si des utilisateurs existent déjà
    const existingUsers = await this.countDocuments();
    
    if (existingUsers === 0) {
      // Créer l'administrateur par défaut
      const admin = new this({
        username: 'admin',
        password: 'admin2024', // En production, utiliser bcrypt
        role: 'admin',
        name: 'Administrateur',
        permissions: ['all']
      });
      await admin.save();

      // Créer le salarié par défaut
      const employee = new this({
        username: 'salarie',
        password: 'salarie2024', // En production, utiliser bcrypt
        role: 'employee',
        name: 'Salarié',
        permissions: [
          'view_planning',
          'view_absences',
          'view_sales_stats',
          'view_meal_expenses',
          'view_km_expenses'
        ]
      });
      await employee.save();

      console.log('✅ Utilisateurs par défaut créés');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la création des utilisateurs par défaut:', error);
  }
};

module.exports = mongoose.model('User', userSchema);
