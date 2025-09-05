const Employee = require('../models/Employee');
const MealExpense = require('../models/MealExpense');
const KmExpense = require('../models/KmExpense');

// Récupérer l'état complet des salariés pour un mois/année
const getEmployeeStatus = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({ 
        error: 'Le mois et l\'année sont requis' 
      });
    }

    // Récupérer tous les employés actifs
    const employees = await Employee.find({ isActive: true }).sort({ name: 1 });
    
    // Récupérer les frais repas pour ce mois/année
    const mealExpenses = await MealExpense.find({ 
      month: parseInt(month), 
      year: parseInt(year) 
    });

    // Récupérer les frais KM pour ce mois/année
    const kmExpenses = await KmExpense.find({ 
      month: parseInt(month), 
      year: parseInt(year) 
    });

    // Créer des maps pour faciliter la recherche
    const mealExpensesMap = {};
    mealExpenses.forEach(expense => {
      mealExpensesMap[expense.employeeId.toString()] = expense;
    });

    const kmExpensesMap = {};
    kmExpenses.forEach(expense => {
      kmExpensesMap[expense.employeeId.toString()] = expense;
    });

    // Construire la réponse avec tous les employés
    const result = employees.map(employee => {
      const mealExpense = mealExpensesMap[employee._id.toString()];
      const kmExpense = kmExpensesMap[employee._id.toString()];

      return {
        employeeId: employee._id,
        employeeName: employee.name,
        mealExpense: mealExpense ? {
          totalAmount: mealExpense.totalAmount,
          dailyExpenses: mealExpense.dailyExpenses
        } : {
          totalAmount: 0,
          dailyExpenses: []
        },
        kmExpense: kmExpense ? {
          totalKm: kmExpense.totalKm,
          parameterValues: kmExpense.parameterValues
        } : {
          totalKm: 0,
          parameterValues: []
        }
      };
    });

    res.json({
      month: parseInt(month),
      year: parseInt(year),
      employees: result
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'état des salariés:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération de l\'état des salariés' 
    });
  }
};

module.exports = {
  getEmployeeStatus
};
