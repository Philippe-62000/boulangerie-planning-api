// Import optionnel de nodemailer pour éviter les crashes si pas installé
let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (error) {
  console.log('⚠️ Nodemailer non installé - service email désactivé');
  nodemailer = null;
}

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.init();
  }

  // Initialisation du service email
  init() {
    try {
      // Vérifier si nodemailer est disponible
      if (!nodemailer) {
        console.log('⚠️ Nodemailer non disponible - service email désactivé');
        this.isConfigured = false;
        return;
      }

      // Configuration SMTP
      const smtpConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false, // true pour 465, false pour autres ports
        auth: {
          user: process.env.SMTP_USER || process.env.EMAIL_USER,
          pass: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD
        },
        tls: {
          rejectUnauthorized: false
        }
      };

      // Vérifier si les credentials sont disponibles
      if (smtpConfig.auth.user && smtpConfig.auth.pass) {
        this.transporter = nodemailer.createTransporter(smtpConfig);
        this.isConfigured = true;
        console.log('✅ Service email configuré');
      } else {
        console.log('⚠️ Service email non configuré - variables d\'environnement manquantes');
        console.log('📧 Variables requises: SMTP_USER, SMTP_PASS (ou EMAIL_USER, EMAIL_PASSWORD)');
      }
    } catch (error) {
      console.error('❌ Erreur configuration service email:', error.message);
      this.isConfigured = false;
    }
  }

  // Vérifier la connexion SMTP
  async verifyConnection() {
    if (!this.isConfigured || !nodemailer) {
      return { success: false, error: 'Service email non configuré ou nodemailer non disponible' };
    }

    try {
      await this.transporter.verify();
      return { success: true, message: 'Connexion SMTP vérifiée' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Envoyer un email de rejet d'arrêt maladie
  async sendSickLeaveRejection(sickLeave, rejectionReason, rejectedBy) {
    if (!this.isConfigured || !nodemailer) {
      console.log('⚠️ Service email non configuré - email non envoyé');
      return { success: false, error: 'Service email non configuré' };
    }

    try {
      const mailOptions = {
        from: {
          name: 'Boulangerie Ange - Arras',
          address: process.env.SMTP_USER || process.env.EMAIL_USER
        },
        to: sickLeave.employeeEmail,
        subject: `Arrêt maladie rejeté - ${sickLeave.employeeName}`,
        html: this.generateRejectionEmailHTML(sickLeave, rejectionReason, rejectedBy),
        text: this.generateRejectionEmailText(sickLeave, rejectionReason, rejectedBy)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de rejet envoyé:', result.messageId);
      
      return {
        success: true,
        messageId: result.messageId,
        message: 'Email de rejet envoyé avec succès'
      };
    } catch (error) {
      console.error('❌ Erreur envoi email rejet:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Envoyer un email de validation d'arrêt maladie
  async sendSickLeaveValidation(sickLeave, validatedBy) {
    if (!this.isConfigured || !nodemailer) {
      console.log('⚠️ Service email non configuré - email non envoyé');
      return { success: false, error: 'Service email non configuré' };
    }

    try {
      const mailOptions = {
        from: {
          name: 'Boulangerie Ange - Arras',
          address: process.env.SMTP_USER || process.env.EMAIL_USER
        },
        to: sickLeave.employeeEmail,
        subject: `Arrêt maladie validé - ${sickLeave.employeeName}`,
        html: this.generateValidationEmailHTML(sickLeave, validatedBy),
        text: this.generateValidationEmailText(sickLeave, validatedBy)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de validation envoyé:', result.messageId);
      
      return {
        success: true,
        messageId: result.messageId,
        message: 'Email de validation envoyé avec succès'
      };
    } catch (error) {
      console.error('❌ Erreur envoi email validation:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Envoyer une alerte à l'admin pour un nouvel arrêt maladie
  async sendNewSickLeaveAlert(sickLeave, adminEmail) {
    if (!this.isConfigured || !nodemailer) {
      console.log('⚠️ Service email non configuré - alerte admin non envoyée');
      return { success: false, error: 'Service email non configuré' };
    }

    try {
      const mailOptions = {
        from: {
          name: 'Boulangerie Ange - Arras',
          address: process.env.SMTP_USER || process.env.EMAIL_USER
        },
        to: adminEmail,
        subject: `🚨 NOUVEL ARRÊT MALADIE - ${sickLeave.employeeName}`,
        html: this.generateNewSickLeaveAlertHTML(sickLeave),
        text: this.generateNewSickLeaveAlertText(sickLeave)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Alerte admin envoyée:', result.messageId);
      
      return {
        success: true,
        messageId: result.messageId,
        message: 'Alerte admin envoyée avec succès'
      };
    } catch (error) {
      console.error('❌ Erreur envoi alerte admin:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Envoyer un email au comptable
  async sendToAccountant(sickLeave, accountantEmail) {
    if (!this.isConfigured || !nodemailer) {
      console.log('⚠️ Service email non configuré - email non envoyé');
      return { success: false, error: 'Service email non configuré' };
    }

    try {
      const mailOptions = {
        from: {
          name: 'Boulangerie Ange - Arras',
          address: process.env.SMTP_USER || process.env.EMAIL_USER
        },
        to: accountantEmail,
        subject: `Nouvel arrêt maladie validé - ${sickLeave.employeeName}`,
        html: this.generateAccountantEmailHTML(sickLeave),
        text: this.generateAccountantEmailText(sickLeave)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email au comptable envoyé:', result.messageId);
      
      return {
        success: true,
        messageId: result.messageId,
        message: 'Email au comptable envoyé avec succès'
      };
    } catch (error) {
      console.error('❌ Erreur envoi email comptable:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Générer le HTML pour l'email de rejet
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
          
          <p>Veuillez corriger les éléments mentionnés et renvoyer votre arrêt maladie en utilisant le lien suivant :</p>
          <p style="text-align: center; margin: 20px 0;">
            <a href="https://www.filmara.fr/plan/sick-leave-standalone.html" 
               style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              📤 Renvoyer un arrêt maladie
            </a>
          </p>
          
          <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
        </div>
        
        <div class="footer">
          <p>Boulangerie Ange - Arras</p>
          <p>Ce message a été envoyé automatiquement, merci de ne pas y répondre.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // Générer le texte pour l'email de rejet
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

Veuillez corriger les éléments mentionnés et renvoyer votre arrêt maladie en utilisant le lien suivant :
https://www.filmara.fr/plan/sick-leave-standalone.html

Si vous avez des questions, n'hésitez pas à nous contacter.

Boulangerie Ange - Arras
Ce message a été envoyé automatiquement, merci de ne pas y répondre.
    `;
  }

  // Générer le HTML pour l'email de validation
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
          <p>Ce message a été envoyé automatiquement, merci de ne pas y répondre.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // Générer le texte pour l'email de validation
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
Ce message a été envoyé automatiquement, merci de ne pas y répondre.
    `;
  }

  // Générer le HTML pour l'email au comptable
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
          <p>Ce message a été envoyé automatiquement par le système de gestion des arrêts maladie.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // Générer le texte pour l'email au comptable
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
Ce message a été envoyé automatiquement par le système de gestion des arrêts maladie.
    `;
  }
}

// Instance singleton
const emailService = new EmailService();

module.exports = emailService;
