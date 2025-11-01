const Employee = require('../models/Employee');

class AbsenceService {
  constructor() {
    console.log('📋 Service AbsenceService initialisé');
  }

  // Créer automatiquement une absence lors de la validation d'un arrêt maladie
  async createAbsenceFromSickLeave(sickLeave) {
    try {
      console.log('📋 Création automatique d\'absence pour:', sickLeave.employeeName);
      
      // Nettoyer le nom (enlever les suffixes comme "- Manager", "- Salarié", etc.)
      const cleanName = sickLeave.employeeName.split(' - ')[0].trim();
      console.log('🔍 Nom nettoyé pour recherche:', cleanName);
      
      // Recherche d'employé : d'abord par email (plus fiable), puis par nom
      let employee = null;
      
      // 1. Recherche par email si disponible
      if (sickLeave.employeeEmail) {
        employee = await Employee.findOne({
          email: { $regex: new RegExp(`^${sickLeave.employeeEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });
        if (employee) {
          console.log('✅ Employé trouvé par email:', employee.name);
        }
      }
      
      // 2. Recherche par nom exact
      if (!employee) {
        employee = await Employee.findOne({
          name: { $regex: new RegExp(`^${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });
        if (employee) {
          console.log('✅ Employé trouvé par nom exact:', employee.name);
        }
      }
      
      // 3. Recherche par nom partiel (contient le nom nettoyé)
      if (!employee) {
        employee = await Employee.findOne({
          name: { $regex: new RegExp(cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
        });
        if (employee) {
          console.log('✅ Employé trouvé par nom partiel:', employee.name);
        }
      }
      
      // 4. Recherche par nom original (avec tous les suffixes)
      if (!employee) {
        employee = await Employee.findOne({
          name: { $regex: new RegExp(sickLeave.employeeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
        });
        if (employee) {
          console.log('✅ Employé trouvé par nom original:', employee.name);
        }
      }
      
      if (!employee) {
        console.log('❌ Employé non trouvé:', sickLeave.employeeName, 'email:', sickLeave.employeeEmail);
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