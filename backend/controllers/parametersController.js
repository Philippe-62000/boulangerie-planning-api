const Parameter = require('../models/Parameters');

// Récupérer tous les paramètres
const getParameters = async (req, res) => {
  try {
    const parameters = await Parameter.find().sort({ name: 1 });
    
    // Si aucun paramètre n'existe, créer les 12 paramètres par défaut
    if (parameters.length === 0) {
      console.log('📝 Création des 12 paramètres par défaut...');
      const defaultParameters = [];
      for (let i = 1; i <= 12; i++) {
        defaultParameters.push({
          name: `param${i}`,
          displayName: `Paramètre ${i}`,
          kmValue: 0
        });
      }
      
      await Parameter.insertMany(defaultParameters);
      const newParameters = await Parameter.find().sort({ name: 1 });
      console.log(`✅ ${newParameters.length} paramètres créés`);
      return res.json(newParameters);
    }
    
    console.log(`📊 ${parameters.length} paramètres récupérés`);
    
    res.json(parameters);
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des paramètres' 
    });
  }
};

// Mettre à jour un paramètre
const updateParameter = async (req, res) => {
  try {
    const { id } = req.params;
    const { displayName, kmValue } = req.body;
    
    if (displayName === undefined && kmValue === undefined) {
      return res.status(400).json({ 
        error: 'Au moins un champ (displayName ou kmValue) est requis' 
      });
    }
    
    const updateData = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (kmValue !== undefined) updateData.kmValue = parseFloat(kmValue);
    
    const parameter = await Parameter.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!parameter) {
      return res.status(404).json({ error: 'Paramètre non trouvé' });
    }
    
    res.json({
      message: 'Paramètre mis à jour avec succès',
      parameter
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du paramètre:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la mise à jour du paramètre' 
    });
  }
};

// Mettre à jour tous les paramètres (batch)
const updateAllParameters = async (req, res) => {
  try {
    const { parameters } = req.body;
    
    console.log('📝 Mise à jour des paramètres en lot');
    console.log('📋 Données reçues:', req.body);
    console.log('📋 Paramètres:', parameters);
    
    if (!Array.isArray(parameters)) {
      console.log('❌ Les paramètres ne sont pas un tableau:', typeof parameters);
      return res.status(400).json({ 
        error: 'Les paramètres doivent être un tableau' 
      });
    }
    
    const updatePromises = parameters.map(param => {
      console.log(`🔍 Traitement paramètre:`, param);
      
      const updateData = {};
      
      // Toujours mettre à jour displayName (même si vide)
      updateData.displayName = param.displayName || `Paramètre ${param.name || 'inconnu'}`;
      
      // Toujours mettre à jour kmValue (même si 0)
      updateData.kmValue = parseFloat(param.kmValue) || 0;
      
      console.log(`📝 Mise à jour paramètre ${param._id}:`, updateData);
      console.log(`📝 displayName: "${updateData.displayName}" (type: ${typeof updateData.displayName})`);
      console.log(`📝 kmValue: ${updateData.kmValue} (type: ${typeof updateData.kmValue})`);
      
      return Parameter.findByIdAndUpdate(
        param._id,
        updateData,
        { new: true, runValidators: false }
      );
    });
    
    const updatedParameters = await Promise.all(updatePromises);
    
    res.json({
      message: `${updatedParameters.length} paramètres mis à jour avec succès`,
      parameters: updatedParameters
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la mise à jour des paramètres' 
    });
  }
};

module.exports = {
  getParameters,
  updateParameter,
  updateAllParameters
};
