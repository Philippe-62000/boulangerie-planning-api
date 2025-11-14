const { Prime, PrimeAssignment, PrimeCalculation } = require('../models/Prime');
const Employee = require('../models/Employee');

// Récupérer toutes les primes
exports.getPrimes = async (req, res) => {
  try {
    const primes = await Prime.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: primes
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des primes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des primes',
      error: error.message
    });
  }
};

// Créer une prime
exports.createPrime = async (req, res) => {
  try {
    const { name, frequency, amountLevel0, amountLevel1, amountLevel2 } = req.body;
    
    if (!name || !frequency || amountLevel1 === undefined || amountLevel2 === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Nom, fréquence et montants niveau 1 et 2 sont requis'
      });
    }
    
    const prime = new Prime({
      name,
      frequency,
      amountLevel0: amountLevel0 || 0,
      amountLevel1,
      amountLevel2
    });
    
    await prime.save();
    
    res.json({
      success: true,
      message: 'Prime créée avec succès',
      data: prime
    });
  } catch (error) {
    console.error('❌ Erreur lors de la création de la prime:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la prime',
      error: error.message
    });
  }
};

// Mettre à jour une prime
exports.updatePrime = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, frequency, amountLevel0, amountLevel1, amountLevel2, isActive } = req.body;
    
    const prime = await Prime.findByIdAndUpdate(
      id,
      {
        name,
        frequency,
        amountLevel0: amountLevel0 || 0,
        amountLevel1,
        amountLevel2,
        isActive: isActive !== undefined ? isActive : true
      },
      { new: true }
    );
    
    if (!prime) {
      return res.status(404).json({
        success: false,
        message: 'Prime non trouvée'
      });
    }
    
    res.json({
      success: true,
      message: 'Prime mise à jour avec succès',
      data: prime
    });
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de la prime:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la prime',
      error: error.message
    });
  }
};

// Supprimer une prime
exports.deletePrime = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Supprimer aussi les affectations et calculs associés
    await PrimeAssignment.deleteMany({ primeId: id });
    await PrimeCalculation.deleteMany({ primeId: id });
    
    await Prime.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Prime supprimée avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de la prime:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la prime',
      error: error.message
    });
  }
};

// Récupérer les affectations de primes
exports.getPrimeAssignments = async (req, res) => {
  try {
    const assignments = await PrimeAssignment.find({ isActive: true })
      .populate('employeeId', 'name email')
      .populate('primeId', 'name frequency amountLevel0 amountLevel1 amountLevel2')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des affectations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des affectations',
      error: error.message
    });
  }
};

// Récupérer les affectations pour un salarié
exports.getEmployeePrimeAssignments = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const assignments = await PrimeAssignment.find({ 
      employeeId, 
      isActive: true 
    })
      .populate('primeId', 'name frequency amountLevel0 amountLevel1 amountLevel2')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des affectations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des affectations',
      error: error.message
    });
  }
};

// Créer ou mettre à jour une affectation
exports.savePrimeAssignments = async (req, res) => {
  try {
    const { assignments } = req.body; // Array of { employeeId, primeId, isActive }
    
    if (!Array.isArray(assignments)) {
      return res.status(400).json({
        success: false,
        message: 'Les affectations doivent être un tableau'
      });
    }
    
    const operations = assignments.map(assignment => ({
      updateOne: {
        filter: {
          employeeId: assignment.employeeId,
          primeId: assignment.primeId
        },
        update: {
          $set: {
            isActive: assignment.isActive !== undefined ? assignment.isActive : true
          }
        },
        upsert: true
      }
    }));
    
    await PrimeAssignment.bulkWrite(operations);
    
    res.json({
      success: true,
      message: 'Affectations sauvegardées avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde des affectations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la sauvegarde des affectations',
      error: error.message
    });
  }
};

// Récupérer les calculs mensuels
exports.getPrimeCalculations = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    const query = {};
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    
    const calculations = await PrimeCalculation.find(query)
      .populate('employeeId', 'name email')
      .populate('primeId', 'name frequency amountLevel0 amountLevel1 amountLevel2')
      .sort({ year: -1, month: -1, createdAt: -1 });
    
    res.json({
      success: true,
      data: calculations
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des calculs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des calculs',
      error: error.message
    });
  }
};

// Sauvegarder les calculs mensuels
exports.savePrimeCalculations = async (req, res) => {
  try {
    const { calculations } = req.body; // Array of { employeeId, primeId, month, year, level }
    
    if (!Array.isArray(calculations)) {
      return res.status(400).json({
        success: false,
        message: 'Les calculs doivent être un tableau'
      });
    }
    
    // Pour chaque calcul, récupérer la prime pour obtenir le montant selon le niveau
    const operations = await Promise.all(calculations.map(async (calc) => {
      const prime = await Prime.findById(calc.primeId);
      if (!prime) {
        throw new Error(`Prime ${calc.primeId} non trouvée`);
      }
      
      let amount = 0;
      if (calc.level === 0) amount = prime.amountLevel0 || 0;
      else if (calc.level === 1) amount = prime.amountLevel1;
      else if (calc.level === 2) amount = prime.amountLevel2;
      
      return {
        updateOne: {
          filter: {
            employeeId: calc.employeeId,
            primeId: calc.primeId,
            month: calc.month,
            year: calc.year
          },
          update: {
            $set: {
              level: calc.level,
              amount: amount
            }
          },
          upsert: true
        }
      };
    }));
    
    await PrimeCalculation.bulkWrite(operations);
    
    res.json({
      success: true,
      message: 'Calculs sauvegardés avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde des calculs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la sauvegarde des calculs',
      error: error.message
    });
  }
};

// Récupérer les primes d'un salarié pour un mois donné (pour l'impression)
exports.getEmployeePrimesForMonth = async (req, res) => {
  try {
    const { employeeId, month, year } = req.params;
    
    if (!employeeId || !month || !year) {
      return res.status(400).json({
        success: false,
        message: 'employeeId, month et year sont requis'
      });
    }
    
    const calculations = await PrimeCalculation.find({
      employeeId,
      month: parseInt(month),
      year: parseInt(year)
    })
      .populate('primeId', 'name frequency amountLevel0 amountLevel1 amountLevel2')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: calculations
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des primes du salarié:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des primes du salarié',
      error: error.message
    });
  }
};

