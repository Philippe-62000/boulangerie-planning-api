// Service email simplifié utilisant uniquement EmailJS
const emailServiceAlternative = require('./emailServiceAlternative');

class EmailService {
  constructor() {
    this.isConfigured = true;
    console.log('✅ Service EmailJS configuré');
  }

  // Vérifier la connexion
  async verifyConnection() {
    return await emailServiceAlternative.verifyConnection();
  }

  // Envoyer un email de rejet d'arrêt maladie
  async sendSickLeaveRejection(sickLeave, rejectionReason, rejectedBy) {
    return await emailServiceAlternative.sendSickLeaveRejection(sickLeave, rejectionReason, rejectedBy);
  }

  // Envoyer un email de validation d'arrêt maladie
  async sendSickLeaveValidation(sickLeave, validatedBy) {
    return await emailServiceAlternative.sendSickLeaveValidation(sickLeave, validatedBy);
  }

  // Envoyer un email au comptable
  async sendToAccountant(sickLeave, accountantEmail) {
    return await emailServiceAlternative.sendToAccountant(sickLeave, accountantEmail);
  }

  // Envoyer un email d'alerte
  async sendAlertEmail(sickLeave, recipientEmails) {
    return await emailServiceAlternative.sendAlertEmail(sickLeave, recipientEmails);
  }

  // Envoyer un email de confirmation de demande de congés
  async sendVacationRequestConfirmation(vacationRequest) {
    return await emailServiceAlternative.sendVacationRequestConfirmation(vacationRequest);
  }

  // Envoyer un email d'alerte pour demande de congés
  async sendVacationRequestAlert(vacationRequest, recipientEmails) {
    return await emailServiceAlternative.sendVacationRequestAlert(vacationRequest, recipientEmails);
  }

  // Envoyer un email de validation de congés
  async sendVacationRequestValidation(vacationRequest, validatedBy) {
    return await emailServiceAlternative.sendVacationRequestValidation(vacationRequest, validatedBy);
  }

  // Envoyer un email de rejet de congés
  async sendVacationRequestRejection(vacationRequest, rejectedBy, reason) {
    return await emailServiceAlternative.sendVacationRequestRejection(vacationRequest, rejectedBy, reason);
  }

  // Envoyer un mot de passe à un salarié
  async sendEmployeePassword({ employeeName, employeeEmail, password, loginUrl }) {
    return await emailServiceAlternative.sendEmployeePassword({ employeeName, employeeEmail, password, loginUrl });
  }

  // Envoyer un email générique
  async sendEmail(to, subject, htmlContent, textContent) {
    return await emailServiceAlternative.sendEmail(to, subject, htmlContent, textContent);
  }

  // Envoyer un email de notification de document personnel
  async sendDocumentNotification(employeeEmail, employeeName, documentTitle, documentCategory) {
    return await emailServiceAlternative.sendDocumentNotification(employeeEmail, employeeName, documentTitle, documentCategory);
  }

  // Envoyer un email de notification de document général
  async sendGeneralDocumentNotification(employeeEmail, employeeName, documentTitle, documentCategory) {
    return await emailServiceAlternative.sendGeneralDocumentNotification(employeeEmail, employeeName, documentTitle, documentCategory);
  }

  // Envoyer un email de test
  async sendTestEmail(toEmail) {
    return await emailServiceAlternative.sendTestEmail(toEmail);
  }

  // Vérifier la configuration email
  checkEmailConfig() {
    return this.isConfigured;
  }

  // Envoyer confirmation demande d'acompte au salarié
  async sendAdvanceRequestConfirmation(employeeEmail, employeeName, amount, deductionMonth) {
    try {
      console.log(`📧 Envoi confirmation demande acompte à ${employeeName} (${employeeEmail})`);
      
      const templateParams = {
        to_email: employeeEmail,
        to_name: employeeName,
        amount: amount,
        deduction_month: deductionMonth,
        request_date: new Date().toLocaleDateString('fr-FR'),
        dashboard_url: 'https://www.filmara.fr/plan/employee-dashboard.html'
      };
      
      return await emailServiceAlternative.sendEmail('template_advance_request_employee', templateParams);
      
    } catch (error) {
      console.error('❌ Erreur envoi confirmation demande acompte:', error);
      return { success: false, message: error.message };
    }
  }

  // Envoyer notification demande d'acompte au manager
  async sendAdvanceRequestNotification(managerEmail, managerName, employeeName, amount, deductionMonth, comment) {
    try {
      console.log(`📧 Envoi notification demande acompte à ${managerName} (${managerEmail})`);
      
      const templateParams = {
        to_email: managerEmail,
        to_name: managerName,
        employee_name: employeeName,
        amount: amount,
        deduction_month: deductionMonth,
        comment: comment || 'Aucun commentaire',
        request_date: new Date().toLocaleDateString('fr-FR'),
        admin_url: 'https://www.filmara.fr/plan/employees'
      };
      
      return await emailServiceAlternative.sendEmail('template_advance_request_manager', templateParams);
      
    } catch (error) {
      console.error('❌ Erreur envoi notification demande acompte:', error);
      return { success: false, message: error.message };
    }
  }

  // Envoyer confirmation d'approbation d'acompte
  async sendAdvanceApproved(employeeEmail, employeeName, amount, deductionMonth, managerComment) {
    try {
      console.log(`📧 Envoi confirmation approbation acompte à ${employeeName} (${employeeEmail})`);
      
      const templateParams = {
        to_email: employeeEmail,
        to_name: employeeName,
        amount: amount,
        deduction_month: deductionMonth,
        manager_comment: managerComment || 'Aucun commentaire',
        approval_date: new Date().toLocaleDateString('fr-FR'),
        dashboard_url: 'https://www.filmara.fr/plan/employee-dashboard.html'
      };
      
      return await emailServiceAlternative.sendEmail('template_advance_approved', templateParams);
      
    } catch (error) {
      console.error('❌ Erreur envoi confirmation approbation:', error);
      return { success: false, message: error.message };
    }
  }

  // Envoyer notification de rejet d'acompte
  async sendAdvanceRejected(employeeEmail, employeeName, amount, deductionMonth, managerComment) {
    try {
      console.log(`📧 Envoi notification rejet acompte à ${employeeName} (${employeeEmail})`);
      
      const templateParams = {
        to_email: employeeEmail,
        to_name: employeeName,
        amount: amount,
        deduction_month: deductionMonth,
        manager_comment: managerComment || 'Aucun commentaire',
        rejection_date: new Date().toLocaleDateString('fr-FR'),
        dashboard_url: 'https://www.filmara.fr/plan/employee-dashboard.html'
      };
      
      return await emailServiceAlternative.sendEmail('template_advance_rejected', templateParams);
      
    } catch (error) {
      console.error('❌ Erreur envoi notification rejet:', error);
      return { success: false, message: error.message };
    }
  }
}

module.exports = new EmailService();