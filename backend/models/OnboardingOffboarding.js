const mongoose = require('mongoose');

const onboardingOffboardingSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  employeeName: {
    type: String,
    required: true
  },
  // Démarches d'entrée (onboarding)
  onboarding: {
    contratSigne: {
      done: { type: Boolean, default: false },
      date: Date,
      comment: String
    },
    dpae: {
      done: { type: Boolean, default: false },
      date: Date,
      comment: String
    },
    declarationMedecineTravail: {
      done: { type: Boolean, default: false },
      date: Date,
      comment: String
    },
    demandeMutuelle: {
      done: { type: Boolean, default: false },
      date: Date,
      comment: String,
      refused: { type: Boolean, default: false }, // Si refus
      attestationFournie: { type: Boolean, default: false }
    },
    visiteMedicale: {
      done: { type: Boolean, default: false },
      date: Date,
      comment: String
    },
    formationSecurite: {
      done: { type: Boolean, default: false },
      date: Date,
      comment: String
    },
    charteDiscrimination: {
      done: { type: Boolean, default: false },
      date: Date,
      comment: String
    },
    rib: {
      done: { type: Boolean, default: false },
      date: Date,
      comment: String
    },
    registrePresenceEntree: {
      done: { type: Boolean, default: false },
      date: Date,
      comment: String
    },
    gabriel: {
      done: { type: Boolean, default: false },
      date: Date,
      comment: String
    }
  },
  // Démarches de sortie (offboarding)
  offboarding: {
    arretMutuel: {
      done: { type: Boolean, default: false },
      date: Date,
      comment: String
    },
    gabrielSortie: {
      done: { type: Boolean, default: false },
      date: Date,
      comment: String
    },
    mutuelleSortie: {
      done: { type: Boolean, default: false },
      date: Date,
      comment: String
    },
    retourTenues: {
      done: { type: Boolean, default: false },
      date: Date,
      comment: String
    },
    retourCles: {
      done: { type: Boolean, default: false },
      date: Date,
      comment: String
    },
    registrePresenceSortie: {
      done: { type: Boolean, default: false },
      date: Date,
      comment: String
    }
  },
  // Métadonnées
  isActive: {
    type: Boolean,
    default: true
  },
  entryDate: {
    type: Date,
    default: null
  },
  exitDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index pour recherche rapide
onboardingOffboardingSchema.index({ employeeId: 1 });

// Méthode statique pour récupérer les démarches d'un employé
onboardingOffboardingSchema.statics.getByEmployeeId = async function(employeeId) {
  return await this.findOne({ employeeId, isActive: true });
};

// Méthode statique pour créer ou mettre à jour les démarches
onboardingOffboardingSchema.statics.createOrUpdate = async function(employeeId, employeeName, data) {
  const existing = await this.findOne({ employeeId });
  
  if (existing) {
    // Mise à jour
    Object.assign(existing, data);
    return await existing.save();
  } else {
    // Création
    return await this.create({
      employeeId,
      employeeName,
      ...data
    });
  }
};

// Méthode pour récupérer toutes les obligations légales non complétées
onboardingOffboardingSchema.statics.getPendingLegalObligations = async function() {
  const records = await this.find({ isActive: true }).populate('employeeId');
  
  const pendingObligations = [];
  
  records.forEach(record => {
    // Vérifier chaque démarche d'entrée
    const onboardingTasks = [
      { key: 'contratSigne', label: 'Contrat de travail signé' },
      { key: 'dpae', label: 'DPAE' },
      { key: 'declarationMedecineTravail', label: 'Déclaration Médecine du travail' },
      { key: 'demandeMutuelle', label: 'Demande de Mutuelle Entreprise' },
      { key: 'visiteMedicale', label: 'Visite médicale' },
      { key: 'formationSecurite', label: 'Formation Sécurité Magasin' },
      { key: 'charteDiscrimination', label: 'Charte Discrimination signée' },
      { key: 'rib', label: 'RIB' },
      { key: 'registrePresenceEntree', label: 'Registre de Présence' },
      { key: 'gabriel', label: 'Gabriel' }
    ];
    
    onboardingTasks.forEach(task => {
      if (record.onboarding && record.onboarding[task.key] && !record.onboarding[task.key].done) {
        // Cas spécial pour la mutuelle
        if (task.key === 'demandeMutuelle') {
          if (!record.onboarding.demandeMutuelle.refused || !record.onboarding.demandeMutuelle.attestationFournie) {
            pendingObligations.push({
              employeeId: record.employeeId._id,
              employeeName: record.employeeName,
              taskType: 'onboarding',
              taskKey: task.key,
              taskLabel: task.label,
              comment: record.onboarding[task.key].comment || ''
            });
          }
        } else {
          pendingObligations.push({
            employeeId: record.employeeId._id,
            employeeName: record.employeeName,
            taskType: 'onboarding',
            taskKey: task.key,
            taskLabel: task.label,
            comment: record.onboarding[task.key].comment || ''
          });
        }
      }
    });
  });
  
  return pendingObligations;
};

module.exports = mongoose.model('OnboardingOffboarding', onboardingOffboardingSchema);

