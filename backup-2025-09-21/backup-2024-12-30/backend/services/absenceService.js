const Employee = require('../models/Employee');

class AbsenceService {
  constructor() {
    console.log('📋 Service AbsenceService initialisé');
  }

  // Créer automatiquement une absence lors de la validation d'un arrêt maladie
  async createAbsenceFromSickLeave(sickLeave) {
    try {
      console.log('📋 Création automatique d\'absence pour:', sickLeave.employeeName);
      
      // Trouver l'employé par nom
      const employee = await Employee.findOne({
        name: { $regex: new RegExp(sickLeave.employeeName, 'i') }
      });
      
      if (!employee) {
        console.log('❌ Employé non trouvé:', sickLeave.employeeName);
        throw new Error(`Employé non trouvé: ${sickLeave.employeeName}`);
      }
      
      console.log('✅ Employé trouvé:', employee.name);
      
      // Vérifier si une absence existe déjà pour cette période
      const existingAbsence = await Employee.findOne({
        _id: employee._id,
        'absences': {
          $elemMatch: {
            startDate: { $lte: sickLeave.endDate },
            endDate: { $gte: sickLeave.startDate },
            type: 'Arrêt maladie'
          }
        }
      });
      
      if (existingAbsence) {
        console.log('⚠️ Absence déjà existante pour cette période');
        return {
          success: false,
          message: 'Une absence existe déjà pour cette période',
          existingAbsence: true
        };
      }
      
      // Créer la nouvelle absence
      const newAbsence = {
        startDate: sickLeave.startDate,
        endDate: sickLeave.endDate,
        type: 'Arrêt maladie',
        reason: 'Arrêt maladie validé automatiquement',
        status: 'validated',
        createdAt: new Date(),
        sickLeaveId: sickLeave._id // Référence vers l'arrêt maladie
      };
      
      // Ajouter l'absence à l'employé
      await Employee.findByIdAndUpdate(
        employee._id,
        { $push: { absences: newAbsence } },
        { new: true }
      );
      
      console.log('✅ Absence créée automatiquement:', newAbsence);
      
      return {
        success: true,
        message: 'Absence créée automatiquement',
        absence: newAbsence,
        employee: employee.name
      };
      
    } catch (error) {
      console.error('❌ Erreur lors de la création de l\'absence:', error.message);
      throw error;
    }
  }

  // Supprimer une absence liée à un arrêt maladie rejeté
  async removeAbsenceFromSickLeave(sickLeaveId) {
    try {
      console.log('🗑️ Suppression de l\'absence liée à l\'arrêt maladie:', sickLeaveId);
      
      // Trouver et supprimer l'absence liée à cet arrêt maladie
      const result = await Employee.updateMany(
        { 'absences.sickLeaveId': sickLeaveId },
        { $pull: { absences: { sickLeaveId: sickLeaveId } } }
      );
      
      console.log('✅ Absence supprimée:', result.modifiedCount, 'employé(s) mis à jour');
      
      return {
        success: true,
        message: `${result.modifiedCount} absence(s) supprimée(s)`,
        modifiedCount: result.modifiedCount
      };
      
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de l\'absence:', error.message);
      throw error;
    }
  }
}

module.exports = new AbsenceService();