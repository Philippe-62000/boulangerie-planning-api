const mongoose = require('mongoose');

const uniformItemSchema = new mongoose.Schema({
  itemType: {
    type: String,
    enum: ['pantalon', 'casquette', 'chaussures', 'teeshirt', 'polaire', 'carte_wengel', 'cle_entree', 'cle_volet', 'code_alarme'],
    required: true
  },
  size: {
    type: String,
    default: ''
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  comment: {
    type: String,
    default: ''
  },
  returned: {
    type: Boolean,
    default: false
  },
  returnDate: {
    type: Date,
    default: null
  },
  returnComment: {
    type: String,
    default: ''
  }
}, { _id: true });

const uniformSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  employeeName: {
    type: String,
    required: true
  },
  // Historique de toutes les tenues attribuées
  items: [uniformItemSchema],
  // Statut actif
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index pour recherche rapide
uniformSchema.index({ employeeId: 1 });
uniformSchema.index({ 'items.returned': 1 });

// Méthode statique pour récupérer les tenues d'un employé
uniformSchema.statics.getByEmployeeId = async function(employeeId) {
  return await this.findOne({ employeeId, isActive: true });
};

// Méthode statique pour ajouter une tenue
uniformSchema.statics.addUniformItem = async function(employeeId, employeeName, itemData) {
  let record = await this.findOne({ employeeId });
  
  if (!record) {
    // Créer un nouvel enregistrement
    record = await this.create({
      employeeId,
      employeeName,
      items: [itemData]
    });
  } else {
    // Ajouter l'item à l'historique
    record.items.push(itemData);
    await record.save();
  }
  
  return record;
};

// Méthode statique pour marquer une tenue comme retournée
uniformSchema.statics.returnUniformItem = async function(employeeId, itemId, returnData) {
  const record = await this.findOne({ employeeId });
  
  if (!record) {
    throw new Error('Aucun enregistrement de tenue trouvé pour cet employé');
  }
  
  const item = record.items.id(itemId);
  
  if (!item) {
    throw new Error('Tenue non trouvée');
  }
  
  item.returned = true;
  item.returnDate = returnData.returnDate || new Date();
  item.returnComment = returnData.returnComment || '';
  
  await record.save();
  return record;
};

// Méthode pour récupérer les tenues non retournées (pour le dashboard sortie)
uniformSchema.statics.getPendingReturns = async function() {
  const records = await this.find({ isActive: true }).populate('employeeId');
  
  const pendingReturns = [];
  
  records.forEach(record => {
    if (record.items && record.items.length > 0) {
      record.items.forEach(item => {
        if (!item.returned) {
          pendingReturns.push({
            employeeId: record.employeeId._id,
            employeeName: record.employeeName,
            itemType: item.itemType,
            size: item.size,
            quantity: item.quantity,
            issueDate: item.issueDate,
            itemId: item._id
          });
        }
      });
    }
  });
  
  return pendingReturns;
};

// Méthode pour récupérer l'historique complet
uniformSchema.statics.getAllHistory = async function() {
  return await this.find({ isActive: true })
    .populate('employeeId', 'name email')
    .sort({ createdAt: -1 });
};

// Labels des types de tenues
uniformSchema.statics.getItemTypeLabel = function(itemType) {
  const labels = {
    'pantalon': 'Pantalon',
    'casquette': 'Casquette',
    'chaussures': 'Chaussures',
    'teeshirt': 'T-shirt',
    'polaire': 'Polaire',
    'carte_wengel': 'Carte Wengel',
    'cle_entree': 'Clé Entrée',
    'cle_volet': 'Clé Volet',
    'code_alarme': 'Code Alarme'
  };
  return labels[itemType] || itemType;
};

module.exports = mongoose.model('Uniform', uniformSchema);

