const KmExpense = require('../models/KmExpense');
const Employee = require('../models/Employee');
const Parameter = require('../models/Parameters');

// Récupérer les frais KM pour un mois/année donné
const getKmExpenses = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({ 
        error: 'Le mois et l\'année sont requis' 
      });
    }

    // Récupérer tous les employés actifs
    const employees = await Employee.find({ isActive: true }).sort({ name: 1 });
    
    console.log(`📊 ${employees.length} employés récupérés pour les frais KM`);
    
    // Récupérer les paramètres KM (ceux qui ont un kmValue défini)
    // On prend tous les paramètres avec kmValue défini, même s'il est à 0
    // puis on les trie : d'abord ceux avec kmValue > 0, puis les autres
    const allParameters = await Parameter.find({ 
      kmValue: { $exists: true }
    }).sort({ 
      // Trier d'abord par kmValue décroissant (ceux avec valeur > 0 en premier)
      kmValue: -1,
      // Puis par nom
      name: 1 
    });
    
    // Limiter à 12 paramètres maximum
    // On prend les 12 premiers, même si certains ont kmValue = 0
    // Cela permet d'afficher toutes les colonnes définies dans Parameters
    const parameters = allParameters.slice(0, 12);
    
    console.log(`🚗 ${parameters.length} paramètres KM trouvés`);
    parameters.forEach(param => {
      console.log(`  - ${param.name}: ${param.displayName} (${param.kmValue} km)`);
    });
    
    // Récupérer les frais KM existants pour ce mois/année
    const existingExpenses = await KmExpense.find({ 
      month: parseInt(month), 
      year: parseInt(year) 
    });

    // Créer un map pour faciliter la recherche
    const expensesMap = {};
    existingExpenses.forEach(expense => {
      expensesMap[expense.employeeId.toString()] = expense;
    });

    // Construire la réponse avec tous les employés
    const result = employees.map(employee => {
      const existingExpense = expensesMap[employee._id.toString()];
      
      if (existingExpense) {
        return {
          employeeId: employee._id,
          employeeName: employee.name,
          parameterValues: existingExpense.parameterValues,
          totalKm: existingExpense.totalKm,
          _id: existingExpense._id
        };
      } else {
        // Créer un tableau vide pour les 12 paramètres
        const parameterValues = parameters.map(param => ({
          parameterId: param._id,
          parameterName: param.displayName,
          count: 0,
          kmValue: param.kmValue,
          totalKm: 0
        }));
        
        return {
          employeeId: employee._id,
          employeeName: employee.name,
          parameterValues,
          totalKm: 0
        };
      }
    });

    res.json({
      employees: result,
      parameters: parameters.map(param => ({
        _id: param._id,
        name: param.name,
        displayName: param.displayName,
        kmValue: param.kmValue
      }))
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des frais KM:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des frais KM' 
    });
  }
};

// Sauvegarder les frais KM pour un employé et un mois/année
const saveKmExpenses = async (req, res) => {
  try {
    const { employeeId, employeeName, month, year, parameterValues } = req.body;
    
    if (!employeeId || !employeeName || !month || !year || !parameterValues) {
      return res.status(400).json({ 
        error: 'Tous les champs sont requis' 
      });
    }

    // Chercher s'il existe déjà un enregistrement pour cet employé ce mois/année
    const existingExpense = await KmExpense.findOne({
      employeeId,
      month: parseInt(month),
      year: parseInt(year)
    });

    if (existingExpense) {
      // Mettre à jour l'existant
      existingExpense.parameterValues = parameterValues;
      await existingExpense.save();
      
      res.json({
        message: 'Frais KM mis à jour avec succès',
        expense: existingExpense
      });
    } else {
      // Créer un nouvel enregistrement
      const newExpense = new KmExpense({
        employeeId,
        employeeName,
        month: parseInt(month),
        year: parseInt(year),
        parameterValues
      });
      
      await newExpense.save();
      
      res.json({
        message: 'Frais KM sauvegardés avec succès',
        expense: newExpense
      });
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des frais KM:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la sauvegarde des frais KM' 
    });
  }
};

// Sauvegarder tous les frais KM pour un mois/année (batch)
const saveAllKmExpenses = async (req, res) => {
  try {
    const { month, year, expenses } = req.body;
    
    if (!month || !year || !expenses || !Array.isArray(expenses)) {
      return res.status(400).json({ 
        error: 'Le mois, l\'année et les frais sont requis' 
      });
    }

    const results = [];
    
    for (const expenseData of expenses) {
      const { employeeId, employeeName, parameterValues } = expenseData;
      
      // Chercher s'il existe déjà un enregistrement
      const existingExpense = await KmExpense.findOne({
        employeeId,
        month: parseInt(month),
        year: parseInt(year)
      });

      if (existingExpense) {
        // Mettre à jour l'existant
        existingExpense.parameterValues = parameterValues;
        await existingExpense.save();
        results.push(existingExpense);
      } else {
        // Créer un nouvel enregistrement
        const newExpense = new KmExpense({
          employeeId,
          employeeName,
          month: parseInt(month),
          year: parseInt(year),
          parameterValues
        });
        
        await newExpense.save();
        results.push(newExpense);
      }
    }

    res.json({
      message: `${results.length} frais KM sauvegardés avec succès`,
      expenses: results
    });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des frais KM:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la sauvegarde des frais KM' 
    });
  }
};

// Réinitialiser les données d'un employé spécifique
const resetEmployeeKmData = async (req, res) => {
  try {
    const { employeeId, month, year } = req.body;
    
    if (!employeeId || !month || !year) {
      return res.status(400).json({ 
        error: 'L\'ID employé, le mois et l\'année sont requis' 
      });
    }

    // Supprimer les données existantes pour cet employé ce mois/année
    await KmExpense.deleteOne({ 
      employeeId, 
      month: parseInt(month), 
      year: parseInt(year) 
    });

    console.log(`🗑️ Données KM réinitialisées pour l'employé ${employeeId} - ${month}/${year}`);

    res.json({ 
      success: true, 
      message: 'Données réinitialisées avec succès' 
    });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation des données KM:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getKmExpenses,
  saveKmExpenses,
  saveAllKmExpenses,
  resetEmployeeKmData
};
