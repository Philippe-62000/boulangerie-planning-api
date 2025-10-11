const Uniform = require('../models/Uniform');
const Employee = require('../models/Employee');

// Récupérer les tenues d'un employé
exports.getByEmployeeId = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    console.log('👕 Récupération tenues pour employé:', employeeId);
    
    const record = await Uniform.getByEmployeeId(employeeId);
    
    if (!record) {
      console.log('⚠️ Aucune tenue trouvée, création d\'un enregistrement vide');
      
      // Récupérer le nom de l'employé
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employé non trouvé'
        });
      }
      
      // Créer un enregistrement vide
      const newRecord = await Uniform.create({
        employeeId,
        employeeName: employee.name,
        items: []
      });
      
      return res.json({
        success: true,
        data: newRecord
      });
    }
    
    console.log('✅ Tenues trouvées:', record.items.length);
    
    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des tenues:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des tenues',
      error: error.message
    });
  }
};

// Ajouter une tenue
exports.addUniformItem = async (req, res) => {
  try {
    const { employeeId, employeeName, itemType, size, quantity, comment } = req.body;
    
    console.log('➕ Ajout tenue pour:', employeeName);
    console.log('📊 Données:', { itemType, size, quantity });
    
    if (!employeeId || !itemType) {
      return res.status(400).json({
        success: false,
        message: 'employeeId et itemType sont requis'
      });
    }
    
    const itemData = {
      itemType,
      size: size || '',
      quantity: quantity || 1,
      comment: comment || '',
      issueDate: new Date()
    };
    
    const record = await Uniform.addUniformItem(employeeId, employeeName, itemData);
    
    console.log('✅ Tenue ajoutée avec succès');
    
    res.json({
      success: true,
      message: 'Tenue ajoutée avec succès',
      data: record
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout de la tenue:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de la tenue',
      error: error.message
    });
  }
};

// Marquer une tenue comme retournée
exports.returnUniformItem = async (req, res) => {
  try {
    const { employeeId, itemId } = req.params;
    const { returnDate, returnComment } = req.body;
    
    console.log('📤 Retour tenue:', { employeeId, itemId });
    
    const returnData = {
      returnDate: returnDate || new Date(),
      returnComment: returnComment || ''
    };
    
    const record = await Uniform.returnUniformItem(employeeId, itemId, returnData);
    
    console.log('✅ Tenue marquée comme retournée');
    
    res.json({
      success: true,
      message: 'Tenue marquée comme retournée',
      data: record
    });
  } catch (error) {
    console.error('❌ Erreur lors du retour de la tenue:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors du retour de la tenue',
      error: error.message
    });
  }
};

// Récupérer toutes les tenues
exports.getAll = async (req, res) => {
  try {
    console.log('📋 Récupération de toutes les tenues');
    
    const records = await Uniform.getAllHistory();
    
    console.log(`✅ ${records.length} enregistrements récupérés`);
    
    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des tenues:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des tenues',
      error: error.message
    });
  }
};

// Récupérer les retours en attente
exports.getPendingReturns = async (req, res) => {
  try {
    console.log('⚠️ Récupération des retours de tenues en attente');
    
    const pendingReturns = await Uniform.getPendingReturns();
    
    console.log(`✅ ${pendingReturns.length} retours en attente`);
    
    res.json({
      success: true,
      data: pendingReturns
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des retours en attente:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des retours en attente',
      error: error.message
    });
  }
};

// Supprimer un item de tenue
exports.deleteUniformItem = async (req, res) => {
  try {
    const { employeeId, itemId } = req.params;
    
    console.log('🗑️ Suppression tenue:', { employeeId, itemId });
    
    const record = await Uniform.findOne({ employeeId });
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Enregistrement non trouvé'
      });
    }
    
    // Trouver et supprimer l'item
    const item = record.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Tenue non trouvée'
      });
    }
    
    item.remove();
    await record.save();
    
    console.log('✅ Tenue supprimée');
    
    res.json({
      success: true,
      message: 'Tenue supprimée avec succès',
      data: record
    });
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de la tenue:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la tenue',
      error: error.message
    });
  }
};

