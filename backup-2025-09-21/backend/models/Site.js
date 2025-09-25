const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: 'Boulangerie'
  },
  city: {
    type: String,
    required: true,
    default: 'Ville'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Méthode statique pour créer le site par défaut
siteSchema.statics.createDefaultSite = async function() {
  try {
    // Vérifier si un site existe déjà
    const existingSite = await this.findOne({ isActive: true });
    
    if (!existingSite) {
      const defaultSite = new this({
        name: 'Boulangerie',
        city: 'Ville'
      });
      await defaultSite.save();
      console.log('✅ Site par défaut créé');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la création du site par défaut:', error);
  }
};

module.exports = mongoose.model('Site', siteSchema);
