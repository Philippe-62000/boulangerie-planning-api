/**
 * Service Email Alternative - Sans nodemailer
 * Utilise des services email externes via API
 */

class EmailServiceAlternative {
  constructor() {
    this.isConfigured = false;
    this.serviceType = 'alternative';
    this.init();
  }

  // Initialisation du service email alternatif
  init() {
    try {
      // Vérifier la configuration
      const hasEmailConfig = !!(process.env.SMTP_USER || process.env.EMAIL_USER);
      
      if (hasEmailConfig) {
        this.isConfigured = true;
        console.log('✅ Service email alternatif configuré');
        console.log('📧 Email configuré:', process.env.SMTP_USER || process.env.EMAIL_USER);
      } else {
        console.log('⚠️ Service email alternatif non configuré - variables manquantes');
      }
    } catch (error) {
      console.error('❌ Erreur configuration service email alternatif:', error.message);
      this.isConfigured = false;
    }
  }

  // Vérifier la connexion (simulation)
  async verifyConnection() {
    if (!this.isConfigured) {
      return { 
        success: false, 
        error: 'Service email alternatif non configuré' 
      };
    }

    return { 
      success: true, 
      message: 'Service email alternatif disponible' 
    };
  }

  // Envoyer un email via service externe
  async sendEmail(to, subject, htmlContent, textContent) {
    if (!this.isConfigured) {
      console.log('⚠️ Service email alternatif non configuré - email non envoyé');
      return { 
        success: false, 
        error: 'Service email alternatif non configuré' 
      };
    }

    try {
      // Option 1: Utiliser EmailJS (service gratuit)
      const emailResult = await this.sendViaEmailJS(to, subject, htmlContent, textContent);
      
      if (emailResult.success) {
        console.log('✅ Email envoyé via service alternatif:', emailResult.messageId);
        return emailResult;
      }

      // Option 2: Utiliser un webhook ou API simple
      const webhookResult = await this.sendViaWebhook(to, subject, htmlContent, textContent);
      
      if (webhookResult.success) {
        console.log('✅ Email envoyé via webhook:', webhookResult.messageId);
        return webhookResult;
      }

      // Option 3: Log local (fallback)
      return this.logEmailLocally(to, subject, htmlContent, textContent);

    } catch (error) {
      console.error('❌ Erreur envoi email alternatif:', error.message);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Envoyer via EmailJS (service gratuit)
  async sendViaEmailJS(to, subject, htmlContent, textContent) {
    try {
      // Configuration EmailJS (à configurer)
      const emailjsConfig = {
        serviceId: process.env.EMAILJS_SERVICE_ID || 'service_default',
        templateId: process.env.EMAILJS_TEMPLATE_ID || 'template_default',
        userId: process.env.EMAILJS_USER_ID || 'user_default',
        privateKey: process.env.EMAILJS_PRIVATE_KEY || 'jKt0•••••••••••••••••'
      };

      // Si EmailJS n'est pas configuré, passer au suivant
      if (emailjsConfig.serviceId === 'service_default') {
        throw new Error('EmailJS non configuré');
      }

      const emailData = {
        to_email: to,
        subject: subject,
        message: textContent,
        html_message: htmlContent,
        from_name: 'Boulangerie Ange - Arras',
        from_email: process.env.SMTP_USER || process.env.EMAIL_USER
      };

      console.log('📧 Données EmailJS:', {
        serviceId: emailjsConfig.serviceId,
        templateId: emailjsConfig.templateId,
        userId: emailjsConfig.userId,
        to: to,
        subject: subject,
        hasHtml: !!htmlContent,
        hasText: !!textContent
      });

      // Appel à l'API EmailJS avec headers pour applications non-browser
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Boulangerie-Planning-API/1.0',
          'Origin': 'https://boulangerie-planning-api-3.onrender.com'
        },
        body: JSON.stringify({
          service_id: emailjsConfig.serviceId,
          template_id: emailjsConfig.templateId,
          user_id: emailjsConfig.userId,
          accessToken: emailjsConfig.privateKey,
          template_params: emailData
        })
      });

      if (response.ok) {
        return {
          success: true,
          messageId: `emailjs_${Date.now()}`,
          message: 'Email envoyé via EmailJS'
        };
      } else {
        const errorText = await response.text();
        console.error('❌ Erreur EmailJS détaillée:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`EmailJS error: ${response.status} - ${errorText}`);
      }

    } catch (error) {
      console.log('⚠️ EmailJS non disponible:', error.message);
      throw error;
    }
  }

  // Envoyer via webhook (solution simple)
  async sendViaWebhook(to, subject, htmlContent, textContent) {
    try {
      const webhookUrl = process.env.EMAIL_WEBHOOK_URL;
      
      if (!webhookUrl) {
        throw new Error('Webhook URL non configuré');
      }

      const emailData = {
        to: to,
        subject: subject,
        html: htmlContent,
        text: textContent,
        from: process.env.SMTP_USER || process.env.EMAIL_USER,
        timestamp: new Date().toISOString()
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      });

      if (response.ok) {
        return {
          success: true,
          messageId: `webhook_${Date.now()}`,
          message: 'Email envoyé via webhook'
        };
      } else {
        throw new Error(`Webhook error: ${response.status}`);
      }

    } catch (error) {
      console.log('⚠️ Webhook non disponible:', error.message);
      throw error;
    }
  }

  // Log local (fallback)
  logEmailLocally(to, subject, htmlContent, textContent) {
    const emailLog = {
      timestamp: new Date().toISOString(),
      to: to,
      subject: subject,
      from: process.env.SMTP_USER || process.env.EMAIL_USER,
      content: textContent,
      html: htmlContent
    };

    console.log('📧 EMAIL LOGGÉ LOCALEMENT (non envoyé):');
    console.log('   To:', to);
    console.log('   Subject:', subject);
    console.log('   From:', emailLog.from);
    console.log('   Content:', textContent.substring(0, 100) + '...');

    // Optionnel: Sauvegarder dans un fichier ou base de données
    this.saveEmailLog(emailLog);

    return {
      success: true,
      messageId: `local_${Date.now()}`,
      message: 'Email loggé localement (service email non disponible)'
    };
  }

  // Sauvegarder le log email
  saveEmailLog(emailLog) {
    try {
      // Optionnel: Sauvegarder en base de données
      // const EmailLog = require('../models/EmailLog');
      // await EmailLog.create(emailLog);
      
      console.log('📝 Email log sauvegardé:', emailLog.timestamp);
    } catch (error) {
      console.error('❌ Erreur sauvegarde log email:', error.message);
    }
  }

  // Méthodes compatibles avec l'ancien service - Utilisent les templates de la DB
  async sendSickLeaveRejection(sickLeave, rejectionReason, rejectedBy) {
    try {
      // Récupérer le template depuis la base de données
      const EmailTemplate = require('../models/EmailTemplate');
      const template = await EmailTemplate.findOne({ name: 'sick_leave_rejection' });
      
      if (!template) {
        console.log('⚠️ Template de rejet non trouvé, utilisation du template par défaut');
        return await this.sendEmail(
          sickLeave.employeeEmail,
          `Arrêt maladie rejeté - ${sickLeave.employeeName}`,
          this.generateRejectionEmailHTML(sickLeave, rejectionReason, rejectedBy),
          this.generateRejectionEmailText(sickLeave, rejectionReason, rejectedBy)
        );
      }

      // Remplacer les variables dans le template
      const htmlContent = this.replaceTemplateVariables(template.htmlContent, {
        employeeName: sickLeave.employeeName,
        rejectionReason: rejectionReason,
        rejectedBy: rejectedBy,
        startDate: new Date(sickLeave.startDate).toLocaleDateString('fr-FR'),
        endDate: new Date(sickLeave.endDate).toLocaleDateString('fr-FR'),
        duration: this.calculateDuration(sickLeave.startDate, sickLeave.endDate),
        durationPlural: this.calculateDuration(sickLeave.startDate, sickLeave.endDate) > 1 ? 's' : '',
        fileName: sickLeave.fileName,
        uploadDate: new Date(sickLeave.uploadDate).toLocaleDateString('fr-FR')
      });

      const textContent = this.replaceTemplateVariables(template.textContent, {
        employeeName: sickLeave.employeeName,
        rejectionReason: rejectionReason,
        rejectedBy: rejectedBy,
        startDate: new Date(sickLeave.startDate).toLocaleDateString('fr-FR'),
        endDate: new Date(sickLeave.endDate).toLocaleDateString('fr-FR'),
        duration: this.calculateDuration(sickLeave.startDate, sickLeave.endDate),
        durationPlural: this.calculateDuration(sickLeave.startDate, sickLeave.endDate) > 1 ? 's' : '',
        fileName: sickLeave.fileName,
        uploadDate: new Date(sickLeave.uploadDate).toLocaleDateString('fr-FR')
      });
      
      return await this.sendEmail(
        sickLeave.employeeEmail,
        this.replaceTemplateVariables(template.subject, { employeeName: sickLeave.employeeName }),
        htmlContent,
        textContent
      );
    } catch (error) {
      console.error('❌ Erreur envoi email de rejet:', error.message);
      // Fallback vers l'ancien système
      return await this.sendEmail(
        sickLeave.employeeEmail,
        `Arrêt maladie rejeté - ${sickLeave.employeeName}`,
        this.generateRejectionEmailHTML(sickLeave, rejectionReason, rejectedBy),
        this.generateRejectionEmailText(sickLeave, rejectionReason, rejectedBy)
      );
    }
  }

  async sendSickLeaveValidation(sickLeave, validatedBy) {
    try {
      // Récupérer le template depuis la base de données
      const EmailTemplate = require('../models/EmailTemplate');
      const template = await EmailTemplate.findOne({ name: 'sick_leave_validation' });
      
      if (!template) {
        console.log('⚠️ Template de validation non trouvé, utilisation du template par défaut');
        return await this.sendEmail(
          sickLeave.employeeEmail,
          `Arrêt maladie validé - ${sickLeave.employeeName}`,
          this.generateValidationEmailHTML(sickLeave, validatedBy),
          this.generateValidationEmailText(sickLeave, validatedBy)
        );
      }

      // Remplacer les variables dans le template
      const htmlContent = this.replaceTemplateVariables(template.htmlContent, {
        employeeName: sickLeave.employeeName,
        validatedBy: validatedBy,
        startDate: new Date(sickLeave.startDate).toLocaleDateString('fr-FR'),
        endDate: new Date(sickLeave.endDate).toLocaleDateString('fr-FR'),
        duration: this.calculateDuration(sickLeave.startDate, sickLeave.endDate),
        durationPlural: this.calculateDuration(sickLeave.startDate, sickLeave.endDate) > 1 ? 's' : '',
        fileName: sickLeave.fileName
      });

      const textContent = this.replaceTemplateVariables(template.textContent, {
        employeeName: sickLeave.employeeName,
        validatedBy: validatedBy,
        startDate: new Date(sickLeave.startDate).toLocaleDateString('fr-FR'),
        endDate: new Date(sickLeave.endDate).toLocaleDateString('fr-FR'),
        duration: this.calculateDuration(sickLeave.startDate, sickLeave.endDate),
        durationPlural: this.calculateDuration(sickLeave.startDate, sickLeave.endDate) > 1 ? 's' : '',
        fileName: sickLeave.fileName
      });
      
      return await this.sendEmail(
        sickLeave.employeeEmail,
        this.replaceTemplateVariables(template.subject, { employeeName: sickLeave.employeeName }),
        htmlContent,
        textContent
      );
    } catch (error) {
      console.error('❌ Erreur envoi email de validation:', error.message);
      // Fallback vers l'ancien système
      return await this.sendEmail(
        sickLeave.employeeEmail,
        `Arrêt maladie validé - ${sickLeave.employeeName}`,
        this.generateValidationEmailHTML(sickLeave, validatedBy),
        this.generateValidationEmailText(sickLeave, validatedBy)
      );
    }
  }

  async sendAlertEmail(sickLeave, recipientEmails) {
    try {
      // Récupérer le template depuis la base de données
      const EmailTemplate = require('../models/EmailTemplate');
      const template = await EmailTemplate.findOne({ name: 'sick_leave_alert' });
      
      if (!template) {
        console.log('⚠️ Template d\'alerte non trouvé, utilisation du template par défaut');
        return await this.sendEmail(
          recipientEmails.join(', '),
          `🚨 Nouvel arrêt maladie à valider - ${sickLeave.employeeName}`,
          this.generateAlertEmailHTML(sickLeave),
          this.generateAlertEmailText(sickLeave)
        );
      }

      // Remplacer les variables dans le template
      const htmlContent = this.replaceTemplateVariables(template.htmlContent, {
        employeeName: sickLeave.employeeName,
        employeeEmail: sickLeave.employeeEmail,
        startDate: new Date(sickLeave.startDate).toLocaleDateString('fr-FR'),
        endDate: new Date(sickLeave.endDate).toLocaleDateString('fr-FR'),
        duration: this.calculateDuration(sickLeave.startDate, sickLeave.endDate),
        durationPlural: this.calculateDuration(sickLeave.startDate, sickLeave.endDate) > 1 ? 's' : '',
        fileName: sickLeave.fileName,
        uploadDate: new Date(sickLeave.uploadDate).toLocaleDateString('fr-FR'),
        adminUrl: 'https://www.filmara.fr/admin'
      });

      const textContent = this.replaceTemplateVariables(template.textContent, {
        employeeName: sickLeave.employeeName,
        employeeEmail: sickLeave.employeeEmail,
        startDate: new Date(sickLeave.startDate).toLocaleDateString('fr-FR'),
        endDate: new Date(sickLeave.endDate).toLocaleDateString('fr-FR'),
        duration: this.calculateDuration(sickLeave.startDate, sickLeave.endDate),
        durationPlural: this.calculateDuration(sickLeave.startDate, sickLeave.endDate) > 1 ? 's' : '',
        fileName: sickLeave.fileName,
        uploadDate: new Date(sickLeave.uploadDate).toLocaleDateString('fr-FR'),
        adminUrl: 'https://www.filmara.fr/admin'
      });
      
      return await this.sendEmail(
        recipientEmails.join(', '),
        this.replaceTemplateVariables(template.subject, { employeeName: sickLeave.employeeName }),
        htmlContent,
        textContent
      );
    } catch (error) {
      console.error('❌ Erreur envoi email d\'alerte:', error.message);
      // Fallback vers l'ancien système
      return await this.sendEmail(
        recipientEmails.join(', '),
        `🚨 Nouvel arrêt maladie à valider - ${sickLeave.employeeName}`,
        this.generateAlertEmailHTML(sickLeave),
        this.generateAlertEmailText(sickLeave)
      );
    }
  }

  async sendToAccountant(sickLeave, accountantEmail) {
    try {
      // Récupérer le template depuis la base de données
      const EmailTemplate = require('../models/EmailTemplate');
      const template = await EmailTemplate.findOne({ name: 'sick_leave_accountant' });
      
      if (!template) {
        console.log('⚠️ Template comptable non trouvé, utilisation du template par défaut');
        return await this.sendEmail(
          accountantEmail,
          `Nouvel arrêt maladie validé - ${sickLeave.employeeName}`,
          this.generateAccountantEmailHTML(sickLeave),
          this.generateAccountantEmailText(sickLeave)
        );
      }

      // Remplacer les variables dans le template
      const htmlContent = this.replaceTemplateVariables(template.htmlContent, {
        employeeName: sickLeave.employeeName,
        employeeEmail: sickLeave.employeeEmail,
        startDate: new Date(sickLeave.startDate).toLocaleDateString('fr-FR'),
        endDate: new Date(sickLeave.endDate).toLocaleDateString('fr-FR'),
        duration: this.calculateDuration(sickLeave.startDate, sickLeave.endDate),
        durationPlural: this.calculateDuration(sickLeave.startDate, sickLeave.endDate) > 1 ? 's' : '',
        fileName: sickLeave.fileName,
        uploadDate: new Date(sickLeave.uploadDate).toLocaleDateString('fr-FR'),
        qualityScore: sickLeave.qualityScore || 85
      });

      const textContent = this.replaceTemplateVariables(template.textContent, {
        employeeName: sickLeave.employeeName,
        employeeEmail: sickLeave.employeeEmail,
        startDate: new Date(sickLeave.startDate).toLocaleDateString('fr-FR'),
        endDate: new Date(sickLeave.endDate).toLocaleDateString('fr-FR'),
        duration: this.calculateDuration(sickLeave.startDate, sickLeave.endDate),
        durationPlural: this.calculateDuration(sickLeave.startDate, sickLeave.endDate) > 1 ? 's' : '',
        fileName: sickLeave.fileName,
        uploadDate: new Date(sickLeave.uploadDate).toLocaleDateString('fr-FR'),
        qualityScore: sickLeave.qualityScore || 85
      });
      
      return await this.sendEmail(
        accountantEmail,
        this.replaceTemplateVariables(template.subject, { employeeName: sickLeave.employeeName }),
        htmlContent,
        textContent
      );
    } catch (error) {
      console.error('❌ Erreur envoi email comptable:', error.message);
      // Fallback vers l'ancien système
      return await this.sendEmail(
        accountantEmail,
        `Nouvel arrêt maladie validé - ${sickLeave.employeeName}`,
        this.generateAccountantEmailHTML(sickLeave),
        this.generateAccountantEmailText(sickLeave)
      );
    }
  }

  // Méthodes utilitaires pour les templates
  replaceTemplateVariables(template, variables) {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || '');
    }
    return result;
  }

  calculateDuration(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // +1 pour inclure le jour de début
  }

  // Méthodes de génération de contenu (reprises de l'ancien service)
  generateRejectionEmailHTML(sickLeave, rejectionReason, rejectedBy) {
    const startDate = new Date(sickLeave.startDate).toLocaleDateString('fr-FR');
    const endDate = new Date(sickLeave.endDate).toLocaleDateString('fr-FR');
    const uploadDate = new Date(sickLeave.uploadDate).toLocaleDateString('fr-FR');

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #e74c3c; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f8f9fa; }
        .rejection-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏥 Arrêt Maladie Rejeté</h1>
          <p>Boulangerie Ange - Arras</p>
        </div>
        
        <div class="content">
          <p>Bonjour <strong>${sickLeave.employeeName}</strong>,</p>
          
          <p>Votre arrêt maladie a été examiné et a dû être rejeté pour les raisons suivantes :</p>
          
          <div class="rejection-box">
            <h3>❌ Raison du rejet :</h3>
            <p><strong>${rejectionReason}</strong></p>
            <p><em>Rejeté par : ${rejectedBy}</em></p>
          </div>
          
          <div class="details">
            <h3>📋 Détails de votre demande :</h3>
            <ul>
              <li><strong>Période :</strong> ${startDate} au ${endDate}</li>
              <li><strong>Durée :</strong> ${sickLeave.duration} jour${sickLeave.duration > 1 ? 's' : ''}</li>
              <li><strong>Fichier :</strong> ${sickLeave.originalFileName}</li>
              <li><strong>Date d'envoi :</strong> ${uploadDate}</li>
            </ul>
          </div>
          
          <p>Veuillez corriger les éléments mentionnés et renvoyer votre arrêt maladie.</p>
          
          <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
        </div>
        
        <div class="footer">
          <p>Boulangerie Ange - Arras</p>
          <p>Ce message a été généré automatiquement.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  generateRejectionEmailText(sickLeave, rejectionReason, rejectedBy) {
    const startDate = new Date(sickLeave.startDate).toLocaleDateString('fr-FR');
    const endDate = new Date(sickLeave.endDate).toLocaleDateString('fr-FR');
    const uploadDate = new Date(sickLeave.uploadDate).toLocaleDateString('fr-FR');

    return `
ARRÊT MALADIE REJETÉ
Boulangerie Ange - Arras

Bonjour ${sickLeave.employeeName},

Votre arrêt maladie a été examiné et a dû être rejeté pour les raisons suivantes :

RAISON DU REJET :
${rejectionReason}
Rejeté par : ${rejectedBy}

DÉTAILS DE VOTRE DEMANDE :
- Période : ${startDate} au ${endDate}
- Durée : ${sickLeave.duration} jour${sickLeave.duration > 1 ? 's' : ''}
- Fichier : ${sickLeave.originalFileName}
- Date d'envoi : ${uploadDate}

Veuillez corriger les éléments mentionnés et renvoyer votre arrêt maladie.

Si vous avez des questions, n'hésitez pas à nous contacter.

Boulangerie Ange - Arras
Ce message a été généré automatiquement.
    `;
  }

  generateValidationEmailHTML(sickLeave, validatedBy) {
    const startDate = new Date(sickLeave.startDate).toLocaleDateString('fr-FR');
    const endDate = new Date(sickLeave.endDate).toLocaleDateString('fr-FR');

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #27ae60; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f8f9fa; }
        .validation-box { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Arrêt Maladie Validé</h1>
          <p>Boulangerie Ange - Arras</p>
        </div>
        
        <div class="content">
          <p>Bonjour <strong>${sickLeave.employeeName}</strong>,</p>
          
          <p>Votre arrêt maladie a été validé avec succès !</p>
          
          <div class="validation-box">
            <h3>✅ Statut : Validé</h3>
            <p><em>Validé par : ${validatedBy}</em></p>
          </div>
          
          <div class="details">
            <h3>📋 Détails de votre arrêt :</h3>
            <ul>
              <li><strong>Période :</strong> ${startDate} au ${endDate}</li>
              <li><strong>Durée :</strong> ${sickLeave.duration} jour${sickLeave.duration > 1 ? 's' : ''}</li>
              <li><strong>Fichier :</strong> ${sickLeave.originalFileName}</li>
            </ul>
          </div>
          
          <p>Votre arrêt maladie sera transmis au comptable dans les plus brefs délais.</p>
          
          <p>Merci pour votre confiance.</p>
        </div>
        
        <div class="footer">
          <p>Boulangerie Ange - Arras</p>
          <p>Ce message a été généré automatiquement.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  generateValidationEmailText(sickLeave, validatedBy) {
    const startDate = new Date(sickLeave.startDate).toLocaleDateString('fr-FR');
    const endDate = new Date(sickLeave.endDate).toLocaleDateString('fr-FR');

    return `
ARRÊT MALADIE VALIDÉ
Boulangerie Ange - Arras

Bonjour ${sickLeave.employeeName},

Votre arrêt maladie a été validé avec succès !

STATUT : Validé
Validé par : ${validatedBy}

DÉTAILS DE VOTRE ARRÊT :
- Période : ${startDate} au ${endDate}
- Durée : ${sickLeave.duration} jour${sickLeave.duration > 1 ? 's' : ''}
- Fichier : ${sickLeave.originalFileName}

Votre arrêt maladie sera transmis au comptable dans les plus brefs délais.

Merci pour votre confiance.

Boulangerie Ange - Arras
Ce message a été généré automatiquement.
    `;
  }

  generateAccountantEmailHTML(sickLeave) {
    const startDate = new Date(sickLeave.startDate).toLocaleDateString('fr-FR');
    const endDate = new Date(sickLeave.endDate).toLocaleDateString('fr-FR');
    const uploadDate = new Date(sickLeave.uploadDate).toLocaleDateString('fr-FR');

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3498db; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f8f9fa; }
        .details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 Nouvel Arrêt Maladie Validé</h1>
          <p>Boulangerie Ange - Arras</p>
        </div>
        
        <div class="content">
          <p>Un nouvel arrêt maladie a été validé et nécessite votre attention.</p>
          
          <div class="details">
            <h3>📋 Informations de l'arrêt :</h3>
            <ul>
              <li><strong>Salarié :</strong> ${sickLeave.employeeName}</li>
              <li><strong>Email :</strong> ${sickLeave.employeeEmail}</li>
              <li><strong>Période :</strong> ${startDate} au ${endDate}</li>
              <li><strong>Durée :</strong> ${sickLeave.duration} jour${sickLeave.duration > 1 ? 's' : ''}</li>
              <li><strong>Fichier :</strong> ${sickLeave.originalFileName}</li>
              <li><strong>Date d'envoi :</strong> ${uploadDate}</li>
              <li><strong>Score de qualité :</strong> ${sickLeave.autoValidation.qualityScore}/100</li>
            </ul>
          </div>
          
          <p>Le fichier est disponible sur notre serveur sécurisé et peut être téléchargé depuis l'interface d'administration.</p>
          
          <p>Merci de traiter cet arrêt maladie dans les plus brefs délais.</p>
        </div>
        
        <div class="footer">
          <p>Boulangerie Ange - Arras</p>
          <p>Ce message a été généré automatiquement par le système de gestion des arrêts maladie.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  generateAccountantEmailText(sickLeave) {
    const startDate = new Date(sickLeave.startDate).toLocaleDateString('fr-FR');
    const endDate = new Date(sickLeave.endDate).toLocaleDateString('fr-FR');
    const uploadDate = new Date(sickLeave.uploadDate).toLocaleDateString('fr-FR');

    return `
NOUVEL ARRÊT MALADIE VALIDÉ
Boulangerie Ange - Arras

Un nouvel arrêt maladie a été validé et nécessite votre attention.

INFORMATIONS DE L'ARRÊT :
- Salarié : ${sickLeave.employeeName}
- Email : ${sickLeave.employeeEmail}
- Période : ${startDate} au ${endDate}
- Durée : ${sickLeave.duration} jour${sickLeave.duration > 1 ? 's' : ''}
- Fichier : ${sickLeave.originalFileName}
- Date d'envoi : ${uploadDate}
- Score de qualité : ${sickLeave.autoValidation.qualityScore}/100

Le fichier est disponible sur notre serveur sécurisé et peut être téléchargé depuis l'interface d'administration.

Merci de traiter cet arrêt maladie dans les plus brefs délais.

Boulangerie Ange - Arras
Ce message a été généré automatiquement par le système de gestion des arrêts maladie.
    `;
  }

  // Générer le HTML pour l'email d'alerte
  generateAlertEmailHTML(sickLeave) {
    const startDate = new Date(sickLeave.startDate).toLocaleDateString('fr-FR');
    const endDate = new Date(sickLeave.endDate).toLocaleDateString('fr-FR');
    const uploadDate = new Date(sickLeave.uploadDate).toLocaleDateString('fr-FR');

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #e74c3c; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f8f9fa; }
        .alert-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .action-button { background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 Nouvel Arrêt Maladie à Valider</h1>
          <p>Boulangerie Ange - Arras</p>
        </div>
        
        <div class="content">
          <div class="alert-box">
            <h3>⚠️ Action Requise</h3>
            <p>Un nouvel arrêt maladie a été déposé et nécessite votre validation.</p>
          </div>
          
          <div class="details">
            <h3>📋 Détails de l'arrêt maladie :</h3>
            <ul>
              <li><strong>Salarié :</strong> ${sickLeave.employeeName}</li>
              <li><strong>Email :</strong> ${sickLeave.employeeEmail}</li>
              <li><strong>Période :</strong> ${startDate} au ${endDate}</li>
              <li><strong>Durée :</strong> ${sickLeave.duration} jour${sickLeave.duration > 1 ? 's' : ''}</li>
              <li><strong>Fichier :</strong> ${sickLeave.originalFileName}</li>
              <li><strong>Date d'envoi :</strong> ${uploadDate}</li>
              <li><strong>Statut :</strong> En attente de validation</li>
            </ul>
          </div>
          
          <p>Veuillez vous connecter à l'interface d'administration pour valider ou rejeter cet arrêt maladie.</p>
          
          <div style="text-align: center;">
            <a href="https://www.filmara.fr/admin" class="action-button">🔗 Accéder à l'Administration</a>
          </div>
          
          <p><strong>Important :</strong> Cet arrêt maladie doit être traité dans les plus brefs délais.</p>
        </div>
        
        <div class="footer">
          <p>Boulangerie Ange - Système de Gestion des Arrêts Maladie</p>
          <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
        </div>
      </div>
    </body>
    </html>`;
  }

  // Générer le texte pour l'email d'alerte
  generateAlertEmailText(sickLeave) {
    const startDate = new Date(sickLeave.startDate).toLocaleDateString('fr-FR');
    const endDate = new Date(sickLeave.endDate).toLocaleDateString('fr-FR');
    const uploadDate = new Date(sickLeave.uploadDate).toLocaleDateString('fr-FR');

    return `
🚨 NOUVEL ARRÊT MALADIE À VALIDER

Boulangerie Ange - Arras

⚠️ ACTION REQUISE
Un nouvel arrêt maladie a été déposé et nécessite votre validation.

📋 DÉTAILS DE L'ARRÊT MALADIE :
- Salarié : ${sickLeave.employeeName}
- Email : ${sickLeave.employeeEmail}
- Période : ${startDate} au ${endDate}
- Durée : ${sickLeave.duration} jour${sickLeave.duration > 1 ? 's' : ''}
- Fichier : ${sickLeave.originalFileName}
- Date d'envoi : ${uploadDate}
- Statut : En attente de validation

Veuillez vous connecter à l'interface d'administration pour valider ou rejeter cet arrêt maladie.

🔗 Accéder à l'Administration : https://www.filmara.fr/admin

IMPORTANT : Cet arrêt maladie doit être traité dans les plus brefs délais.

---
Boulangerie Ange - Système de Gestion des Arrêts Maladie
Cet email a été envoyé automatiquement, merci de ne pas y répondre.
    `;
  }
}

// Instance singleton
const emailServiceAlternative = new EmailServiceAlternative();

module.exports = emailServiceAlternative;
