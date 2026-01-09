const Site = require('../models/Site');

// Récupérer les informations du site
const getSite = async (req, res) => {
  try {
    let site = await Site.findOne({ isActive: true });
    
    if (!site) {
      // Créer un site par défaut s'il n'existe pas
      console.log('🏪 Création du site par défaut...');
      site = new Site({
        name: 'Boulangerie',
        city: 'Ville'
      });
      await site.save();
      console.log('✅ Site par défaut créé:', site);
    }
    
    res.json(site);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du site:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération du site'
    });
  }
};

// Mettre à jour les informations du site
const updateSite = async (req, res) => {
  try {
    const { name, city } = req.body;
    
    console.log('🏪 Mise à jour du site:', { name, city });
    
    let site = await Site.findOne({ isActive: true });
    
    if (!site) {
      // Créer un nouveau site s'il n'existe pas
      site = new Site({ name, city });
    } else {
      // Mettre à jour le site existant
      site.name = name;
      site.city = city;
    }
    
    await site.save();
    
    console.log('✅ Site mis à jour:', site);
    
    res.json({
      success: true,
      site: site,
      message: 'Site mis à jour avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du site:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la mise à jour du site'
    });
  }
};

module.exports = {
  getSite,
  updateSite
};
