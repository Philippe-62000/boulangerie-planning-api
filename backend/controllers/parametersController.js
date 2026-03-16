const Parameter = require('../models/Parameters');

// Récupérer tous les paramètres
const getParameters = async (req, res) => {
  try {
    const parameters = await Parameter.find().sort({ createdAt: 1 });
    
    // Si aucun paramètre n'existe, créer les 12 paramètres par défaut + email comptable
    if (parameters.length === 0) {
      console.log('📝 Création des 5 paramètres par défaut + email comptable...');
      const defaultParameters = [];
      for (let i = 1; i <= 5; i++) {
        defaultParameters.push({
          name: `param${i}`,
          displayName: `Paramètre ${i}`,
          kmValue: 0
        });
      }
      
      // Ajouter le paramètre nom du site (exclu des frais KM)
      defaultParameters.push({
        name: 'siteName',
        displayName: 'Nom du Site',
        stringValue: 'Boulangerie Ange',
        kmValue: -1 // Valeur négative pour exclure des frais KM
      });
      
      // Ajouter le paramètre email comptable (exclu des frais KM)
      defaultParameters.push({
        name: 'accountantEmail',
        displayName: 'Email du Comptable',
        stringValue: process.env.ACCOUNTANT_EMAIL || 'comptable@boulangerie.fr',
        kmValue: -1 // Valeur négative pour exclure des frais KM
      });
      
      // Ajouter les paramètres pour les alertes email (exclus des frais KM)
      defaultParameters.push({
        name: 'storeEmail',
        displayName: 'Email du Magasin',
        stringValue: '',
        kmValue: -1 // Valeur négative pour exclure des frais KM
      });
      
      defaultParameters.push({
        name: 'adminEmail',
        displayName: 'Email de l\'Administrateur',
        stringValue: '',
        kmValue: -1 // Valeur négative pour exclure des frais KM
      });
      
      defaultParameters.push({
        name: 'alertStore',
        displayName: 'Alerte au Magasin',
        booleanValue: false,
        kmValue: -1 // Valeur négative pour exclure des frais KM
      });
      
      defaultParameters.push({
        name: 'alertAdmin',
        displayName: 'Alerte à l\'Administrateur',
        booleanValue: false,
        kmValue: -1 // Valeur négative pour exclure des frais KM
      });
      
      defaultParameters.push({
        name: 'enableEmployeeAdvanceRequest',
        displayName: 'Employés autorisés pour la demande d\'acompte',
        stringValue: '[]', // Liste JSON des IDs d'employés autorisés
        kmValue: -1 // Valeur négative pour exclure des frais KM
      });
      
      await Parameter.insertMany(defaultParameters);
      const newParameters = await Parameter.find().sort({ name: 1 });
      console.log(`✅ ${newParameters.length} paramètres créés`);
      return res.json(newParameters);
    }
    
    // Vérifier si les paramètres manquants existent, sinon les créer
    const missingParameters = [];
    
    const requiredParams = [
      { name: 'siteName', displayName: 'Nom du Site', stringValue: 'Boulangerie Ange', kmValue: -1 },
      { name: 'accountantEmail', displayName: 'Email du Comptable', stringValue: process.env.ACCOUNTANT_EMAIL || 'comptable@boulangerie.fr', kmValue: -1 },
      { name: 'storeEmail', displayName: 'Email du Magasin', stringValue: '', kmValue: -1 },
      { name: 'adminEmail', displayName: 'Email de l\'Administrateur', stringValue: '', kmValue: -1 },
      { name: 'alertStore', displayName: 'Alerte au Magasin', booleanValue: false, kmValue: -1 },
      { name: 'alertAdmin', displayName: 'Alerte à l\'Administrateur', booleanValue: false, kmValue: -1 },
      { name: 'enableEmployeeAdvanceRequest', displayName: 'Employés autorisés pour la demande d\'acompte', stringValue: '[]', kmValue: -1 },
      { name: 'siteEnMaintenance', displayName: 'Site en maintenance', booleanValue: false, kmValue: -1 },
      { name: 'emailNotificationsPlateaux', displayName: 'Email notifications réservations plateaux', stringValue: '', kmValue: -1 }
    ];
    
    for (const requiredParam of requiredParams) {
      const existingParam = parameters.find(p => p.name === requiredParam.name);
      if (!existingParam) {
        missingParameters.push({
          name: requiredParam.name,
          displayName: requiredParam.displayName,
          stringValue: requiredParam.stringValue !== undefined ? requiredParam.stringValue : '',
          booleanValue: requiredParam.booleanValue !== undefined ? requiredParam.booleanValue : false,
          kmValue: requiredParam.kmValue !== undefined ? requiredParam.kmValue : -1
        });
      }
    }
    
    if (missingParameters.length > 0) {
      console.log(`📝 Création de ${missingParameters.length} paramètres manquants...`);
      await Parameter.insertMany(missingParameters);
      
      // Récupérer tous les paramètres mis à jour
      const updatedParameters = await Parameter.find().sort({ name: 1 });
      console.log(`✅ ${missingParameters.length} paramètres créés`);
      return res.json(updatedParameters);
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

// Récupérer le statut maintenance (endpoint public, pas d'auth requise)
const getMaintenanceStatus = async (req, res) => {
  try {
    const param = await Parameter.findOne({ name: 'siteEnMaintenance' });
    const maintenance = param ? (param.booleanValue === true) : false;
    res.json({ maintenance });
  } catch (error) {
    console.error('Erreur lors de la récupération du statut maintenance:', error);
    res.json({ maintenance: false });
  }
};

// Mettre à jour un paramètre
const updateParameter = async (req, res) => {
  try {
    const { id } = req.params;
    const { displayName, kmValue, stringValue, booleanValue } = req.body;
    
    console.log(`📝 Mise à jour du paramètre ${id}`);
    console.log('📋 Données reçues:', { displayName, kmValue, stringValue, booleanValue });
    console.log('📋 Body complet:', req.body);
    
    if (displayName === undefined && kmValue === undefined && stringValue === undefined && booleanValue === undefined) {
      console.log('❌ Aucun champ fourni pour la mise à jour');
      return res.status(400).json({ 
        error: 'Au moins un champ (displayName, kmValue, stringValue ou booleanValue) est requis' 
      });
    }
    
    const updateData = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (kmValue !== undefined) updateData.kmValue = parseFloat(kmValue);
    if (stringValue !== undefined) updateData.stringValue = stringValue;
    if (booleanValue !== undefined) updateData.booleanValue = booleanValue;
    
    console.log('📤 Données de mise à jour:', updateData);
    
    const parameter = await Parameter.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!parameter) {
      console.log('❌ Paramètre non trouvé avec l\'ID:', id);
      return res.status(404).json({ error: 'Paramètre non trouvé' });
    }
    
    console.log('✅ Paramètre mis à jour:', parameter);
    
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

// Créer de nouveaux paramètres KM
const createKmParameters = async (req, res) => {
  try {
    const { parameters: paramsToCreate } = req.body;
    
    console.log('📝 Création de nouveaux paramètres KM');
    console.log('📋 Paramètres à créer:', paramsToCreate);
    
    if (!Array.isArray(paramsToCreate)) {
      return res.status(400).json({ 
        error: 'Les paramètres doivent être un tableau' 
      });
    }
    
    const createdParameters = [];
    for (const param of paramsToCreate) {
      try {
        const newParam = new Parameter({
          name: param.name,
          displayName: param.displayName || `Paramètre ${param.name}`,
          kmValue: parseFloat(param.kmValue) || 0
        });
        
        const savedParam = await newParam.save();
        createdParameters.push(savedParam);
        console.log(`✅ Paramètre créé: ${savedParam.name} (${savedParam._id})`);
      } catch (error) {
        console.error(`❌ Erreur lors de la création du paramètre ${param.name}:`, error);
        // Continuer avec les autres paramètres même en cas d'erreur
      }
    }
    
    res.json({
      message: `${createdParameters.length} paramètres créés avec succès`,
      parameters: createdParameters
    });
  } catch (error) {
    console.error('Erreur lors de la création des paramètres KM:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la création des paramètres KM' 
    });
  }
};

// Mettre à jour tous les paramètres (batch)
const updateAllParameters = async (req, res) => {
  try {
    // Accepter soit req.body.parameters soit req.body directement
    let parameters = req.body.parameters || req.body;
    
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
      
      // Mettre à jour stringValue si présent
      if (param.stringValue !== undefined) {
        updateData.stringValue = param.stringValue;
      }
      
      // Mettre à jour booleanValue si présent
      if (param.booleanValue !== undefined) {
        updateData.booleanValue = param.booleanValue;
      }
      
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
  getMaintenanceStatus,
  updateParameter,
  updateAllParameters,
  createKmParameters
};
