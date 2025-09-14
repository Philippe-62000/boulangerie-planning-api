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

  // Envoyer un mot de passe à un salarié
  async sendEmployeePassword({ employeeName, employeeEmail, password, loginUrl }) {
    return await emailServiceAlternative.sendEmployeePassword({ employeeName, employeeEmail, password, loginUrl });
  }

  // Envoyer un email générique
  async sendEmail(to, subject, htmlContent, textContent) {
    return await emailServiceAlternative.sendEmail(to, subject, htmlContent, textContent);
  }
}

module.exports = new EmailService();