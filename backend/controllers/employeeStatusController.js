const Employee = require('../models/Employee');
const MealExpense = require('../models/MealExpense');
const KmExpense = require('../models/KmExpense');
const EmployeeOverpayment = require('../models/EmployeeOverpayment');

// Récupérer l'état complet des salariés pour un mois/année
const getEmployeeStatus = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ 
        error: 'Le mois et l\'année sont requis' 
      });
    }

    const parsedMonth = parseInt(month, 10);
    const parsedYear = parseInt(year, 10);

    if (Number.isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
      return res.status(400).json({
        error: 'Mois invalide'
      });
    }

    if (Number.isNaN(parsedYear) || parsedYear < 2020 || parsedYear > 2040) {
      return res.status(400).json({
        error: 'Année invalide'
      });
    }

    // Récupérer tous les employés actifs
    const employees = await Employee.find({ isActive: true }).sort({ name: 1 });
    
    // Récupérer les frais repas pour ce mois/année
    const mealExpenses = await MealExpense.find({ 
      month: parsedMonth, 
      year: parsedYear 
    });

    // Récupérer les frais KM pour ce mois/année
    const kmExpenses = await KmExpense.find({ 
      month: parsedMonth, 
      year: parsedYear 
    });

    // Récupérer les trop-perçus pour ce mois/année
    const overpayments = await EmployeeOverpayment.find({
      month: parsedMonth,
      year: parsedYear
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

    const overpaymentsMap = {};
    overpayments.forEach(overpayment => {
      overpaymentsMap[overpayment.employeeId.toString()] = overpayment.amount || 0;
    });

    // Construire la réponse avec tous les employés
    const result = employees.map(employee => {
      const mealExpense = mealExpensesMap[employee._id.toString()];
      const kmExpense = kmExpensesMap[employee._id.toString()];
      const overpaymentAmount = overpaymentsMap[employee._id.toString()] || 0;

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
        },
        overpaymentAmount
      };
    });

    res.json({
      month: parsedMonth,
      year: parsedYear,
      employees: result,
      overpaymentTotal: overpayments.reduce((sum, item) => sum + (item.amount || 0), 0)
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'état des salariés:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération de l\'état des salariés' 
    });
  }
};

const upsertEmployeeOverpayment = async (req, res) => {
  try {
    const { employeeId, employeeName, month, year, amount } = req.body;

    if (!employeeId || !month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Employé, mois et année sont requis'
      });
    }

    const parsedMonth = parseInt(month, 10);
    const parsedYear = parseInt(year, 10);
    const numericAmount = parseFloat(amount);

    if (Number.isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
      return res.status(400).json({
        success: false,
        message: 'Mois invalide'
      });
    }

    if (Number.isNaN(parsedYear) || parsedYear < 2020 || parsedYear > 2040) {
      return res.status(400).json({
        success: false,
        message: 'Année invalide'
      });
    }

    if (Number.isNaN(numericAmount) || numericAmount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Le montant doit être un nombre positif'
      });
    }

    let resolvedEmployeeName = employeeName;

    if (!resolvedEmployeeName) {
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employé non trouvé'
        });
      }
      resolvedEmployeeName = employee.name;
    }

    const sanitizedAmount = Math.round(numericAmount * 100) / 100;

    const overpayment = await EmployeeOverpayment.findOneAndUpdate(
      { employeeId, month: parsedMonth, year: parsedYear },
      {
        employeeName: resolvedEmployeeName,
        amount: sanitizedAmount
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    return res.json({
      success: true,
      message: 'Trop perçu enregistré avec succès',
      data: overpayment
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du trop perçu:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement du trop perçu',
      error: error.message
    });
  }
};

module.exports = {
  getEmployeeStatus,
  upsertEmployeeOverpayment
};

