const MealExpense = require('../models/MealExpense');
const Employee = require('../models/Employee');

// Récupérer les frais repas pour un mois/année donné
const getMealExpenses = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({ 
        error: 'Le mois et l\'année sont requis' 
      });
    }

    // Récupérer tous les employés actifs
    const employees = await Employee.find({ isActive: true }).sort({ name: 1 });
    
    console.log(`📊 ${employees.length} employés récupérés pour les frais repas`);
    
    // Récupérer les frais repas existants pour ce mois/année
    const existingExpenses = await MealExpense.find({ 
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
          dailyExpenses: existingExpense.dailyExpenses,
          totalAmount: existingExpense.totalAmount,
          _id: existingExpense._id
        };
      } else {
        // Créer un tableau vide pour les 31 jours
        const dailyExpenses = [];
        for (let day = 1; day <= 31; day++) {
          dailyExpenses.push({ day, amount: 0 });
        }
        
        return {
          employeeId: employee._id,
          employeeName: employee.name,
          dailyExpenses,
          totalAmount: 0
        };
      }
    });

    res.json(result);
  } catch (error) {
    console.error('Erreur lors de la récupération des frais repas:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des frais repas' 
    });
  }
};

// Sauvegarder les frais repas pour un employé et un mois/année
const saveMealExpenses = async (req, res) => {
  try {
    const { employeeId, employeeName, month, year, dailyExpenses } = req.body;
    
    if (!employeeId || !employeeName || !month || !year || !dailyExpenses) {
      return res.status(400).json({ 
        error: 'Tous les champs sont requis' 
      });
    }

    // Filtrer les frais non nuls (supérieurs à 0)
    const filteredExpenses = dailyExpenses.filter(expense => expense.amount > 0);
    
    // Calculer le total
    const totalAmount = filteredExpenses.reduce((total, expense) => total + expense.amount, 0);

    // Chercher s'il existe déjà un enregistrement pour cet employé ce mois/année
    const existingExpense = await MealExpense.findOne({
      employeeId,
      month: parseInt(month),
      year: parseInt(year)
    });

    if (existingExpense) {
      // Mettre à jour l'existant
      existingExpense.dailyExpenses = filteredExpenses;
      existingExpense.totalAmount = totalAmount;
      await existingExpense.save();
      
      res.json({
        message: 'Frais repas mis à jour avec succès',
        expense: existingExpense
      });
    } else {
      // Créer un nouvel enregistrement
      const newExpense = new MealExpense({
        employeeId,
        employeeName,
        month: parseInt(month),
        year: parseInt(year),
        dailyExpenses: filteredExpenses,
        totalAmount
      });
      
      await newExpense.save();
      
      res.json({
        message: 'Frais repas sauvegardés avec succès',
        expense: newExpense
      });
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des frais repas:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la sauvegarde des frais repas' 
    });
  }
};

// Sauvegarder tous les frais repas pour un mois/année (batch)
const saveAllMealExpenses = async (req, res) => {
  try {
    const { month, year, expenses } = req.body;
    
    if (!month || !year || !expenses || !Array.isArray(expenses)) {
      return res.status(400).json({ 
        error: 'Le mois, l\'année et les frais sont requis' 
      });
    }

    const results = [];
    
    for (const expenseData of expenses) {
      const { employeeId, employeeName, dailyExpenses } = expenseData;
      
      // Filtrer les frais non nuls
      const filteredExpenses = dailyExpenses.filter(expense => expense.amount > 0);
      const totalAmount = filteredExpenses.reduce((total, expense) => total + expense.amount, 0);

      // Chercher s'il existe déjà un enregistrement
      const existingExpense = await MealExpense.findOne({
        employeeId,
        month: parseInt(month),
        year: parseInt(year)
      });

      if (existingExpense) {
        // Mettre à jour l'existant
        existingExpense.dailyExpenses = filteredExpenses;
        existingExpense.totalAmount = totalAmount;
        await existingExpense.save();
        results.push(existingExpense);
      } else {
        // Créer un nouvel enregistrement
        const newExpense = new MealExpense({
          employeeId,
          employeeName,
          month: parseInt(month),
          year: parseInt(year),
          dailyExpenses: filteredExpenses,
          totalAmount
        });
        
        await newExpense.save();
        results.push(newExpense);
      }
    }

    res.json({
      message: `${results.length} frais repas sauvegardés avec succès`,
      expenses: results
    });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des frais repas:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la sauvegarde des frais repas' 
    });
  }
};

module.exports = {
  getMealExpenses,
  saveMealExpenses,
  saveAllMealExpenses
};
