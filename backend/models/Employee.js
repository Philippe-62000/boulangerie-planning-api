const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  contractType: {
    type: String,
    enum: ['CDI', 'Apprentissage'],
    required: true
  },
  age: {
    type: Number,
    required: true,
    min: 16,
    max: 65
  },
  birthDate: {
    type: Date,
    required: false,
    comment: 'Date de naissance (obligatoire pour les mineurs pour calculer précisément les 18 ans)'
  },
  skills: [{
    type: String,
    enum: ['Ouverture', 'Fermeture', 'Management']
  }],
  role: {
    type: String,
    enum: [
      'vendeuse',
      'responsable',
      'manager',
      'apprenti',
      'Apprenti Vendeuse',
      'chef prod',
      'boulanger',
      'préparateur',
      'Apprenti Boulanger',
      'Apprenti Préparateur',
      'responsable magasin',
      'responsable magasin adjointe'
    ],
    required: true
  },
  weeklyHours: {
    type: Number,
    required: true,
    min: 20,
    max: 39
  },
  trainingDays: [{
    type: String,
    enum: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
  }],
  contractEndDate: {
    type: Date
  },
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: function() {
      return this.contractType === 'Apprentissage';
    }
  },
  sickLeave: {
    isOnSickLeave: {
      type: Boolean,
      default: false
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    }
  },
  // CHAMP VACATION - CRÉÉ POUR LA SYNCHRONISATION DES CONGÉS
  // Ce champ permet de stocker l'état des congés de l'employé directement dans le modèle Employee
  // Il est synchronisé avec les VacationRequest validées via la route /sync-employees
  vacation: {
    isOnVacation: {
      type: Boolean,
      default: false,
      comment: 'Indique si l\'employé est actuellement en congés'
    },
    startDate: {
      type: Date,
      comment: 'Date de début des congés actuels'
    },
    endDate: {
      type: Date,
      comment: 'Date de fin des congés actuels'
    },
    vacationRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VacationRequest',
      comment: 'Référence vers la demande de congés validée'
    }
  },
  // CHAMP DELAYS - POUR LE SUIVI DES RETARDS
  // Stocke les retards de l'employé avec date et durée
  delays: [{
    date: {
      type: Date,
      required: true,
      comment: 'Date du retard'
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
      comment: 'Durée du retard en minutes'
    },
    reason: {
      type: String,
      default: '',
      comment: 'Raison du retard (optionnel)'
    },
    createdAt: {
      type: Date,
      default: Date.now,
      comment: 'Date de création de l\'enregistrement'
    }
  }],
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Format d\'email invalide'
    }
  },
  // Contact d'urgence
  emergencyContact: {
    lastName: {
      type: String,
      trim: true,
      comment: 'Nom de la personne à contacter en cas d\'urgence'
    },
    firstName: {
      type: String,
      trim: true,
      comment: 'Prénom de la personne à contacter en cas d\'urgence'
    },
    phone: {
      type: String,
      trim: true,
      comment: 'Numéro de téléphone de la personne à contacter en cas d\'urgence'
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      validate: {
        validator: function(v) {
          return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Format d\'email invalide pour le contact d\'urgence'
      },
      comment: 'Email de la personne à contacter en cas d\'urgence'
    }
  },
  password: {
    type: String,
    select: false // Ne pas inclure par défaut dans les requêtes
  },
  payslipPassword: {
    type: String,
    trim: true,
    comment: 'Mot de passe pour protéger les fiches de paie PDF (10 caractères avec chiffres et caractères spéciaux)'
  },
  connectionCode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^\d{3}$/.test(v);
      },
      message: 'Le code de connexion doit être composé de 3 chiffres'
    },
    comment: 'Code de connexion interne à 3 chiffres pour identifier rapidement le salarié'
  },
  saleCode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^\d{3}$/.test(v);
      },
      message: 'Le code vente doit être composé de 3 chiffres'
    },
    comment: 'Code vente nominatif à 3 chiffres pour les vendeuses'
  },
  mutuelle: {
    type: String,
    enum: ['Oui Entreprise', 'Non Perso'],
    default: 'Oui Entreprise',
    comment: 'Choix de la mutuelle : Oui Entreprise ou Non Perso'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware pour générer automatiquement le code vente pour les rôles concernés
// ⚠️ IMPORTANT: Le code n'est généré QUE lors de la création (isNew), pas lors des modifications
employeeSchema.pre('save', async function(next) {
  this.updatedAt = Date.now();
  
  // Convertir les chaînes vides en null pour saleCode (nécessaire pour l'index sparse unique)
  // MongoDB considère les chaînes vides comme des valeurs réelles, ce qui viole l'index unique
  if (this.saleCode === '') {
    this.saleCode = null;
  }
  
  // Générer automatiquement un code de connexion si absent
  if (!this.connectionCode) {
    let code;
    let attempts = 0;
    let isUnique = false;

    const Employee = mongoose.model('Employee');

    while (!isUnique && attempts < 200) {
      code = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
      attempts++;

      const existing = await Employee.findOne({ connectionCode: code });
      if (!existing) {
        isUnique = true;
      }
    }

    if (!isUnique) {
      // Fallback basé sur un timestamp tronqué + aléatoire
      code = `${String(Date.now()).slice(-3)}`;
      const existing = await Employee.findOne({ connectionCode: code });
      if (existing) {
        code = `${String(Date.now()).slice(-2)}${Math.floor(Math.random() * 10)}`;
      }
    }

    this.connectionCode = code;
    console.log(`🔐 Code de connexion généré automatiquement pour ${this.name}: ${code}`);
  }

  // Générer un code vente UNIQUEMENT à la création si le rôle est concerné et qu'il n'y a pas encore de code
  const rolesAvecCode = ['vendeuse', 'apprenti', 'manager', 'responsable', 'Apprenti Vendeuse'];
  const roleNormalized = this.role?.toLowerCase();
  const isRoleConcerned = rolesAvecCode.some(r => r.toLowerCase() === roleNormalized);
  
  // Générer uniquement si : nouveau employé ET rôle concerné ET pas de code existant
  if (this.isNew && isRoleConcerned && !this.saleCode) {
    // Générer un code à 3 chiffres aléatoire (100-999)
    let code;
    let attempts = 0;
    let isUnique = false;
    
    // Vérifier l'unicité dans la base de données
    const Employee = mongoose.model('Employee');
    
    while (!isUnique && attempts < 100) {
      code = String(Math.floor(Math.random() * 900) + 100);
      attempts++;
      
      const existing = await Employee.findOne({ saleCode: code });
      if (!existing) {
        isUnique = true;
      }
    }
    
    if (!isUnique) {
      // Si on n'a pas trouvé de code unique après 100 tentatives, utiliser un timestamp tronqué
      code = String(Date.now()).slice(-3);
      const existing = await Employee.findOne({ saleCode: code });
      if (existing) {
        // Si encore en conflit, utiliser une combinaison timestamp + aléatoire
        code = String(Date.now()).slice(-2) + String(Math.floor(Math.random() * 10));
      }
    }
    
    this.saleCode = code;
    console.log(`✅ Code vente généré automatiquement pour ${this.name}: ${code}`);
  }
  
  next();
});

module.exports = mongoose.model('Employee', employeeSchema);

