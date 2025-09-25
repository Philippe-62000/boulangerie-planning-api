const mongoose = require('mongoose');

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
      'view_reports'
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
