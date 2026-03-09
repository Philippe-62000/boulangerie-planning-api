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

  // Retourne le basePath (/plan ou /lon) selon l'environnement - utilisé par toutes les méthodes d'URL
  _getBasePath() {
    const appBasePath = process.env.APP_BASE_PATH;
    if (appBasePath === '/lon' || appBasePath === '/plan') return appBasePath;
    const corsOrigin = process.env.CORS_ORIGIN || '';
    return corsOrigin.includes('/lon') ? '/lon' : '/plan';
  }

  // Fonction utilitaire pour obtenir l'URL du dashboard selon l'environnement
  getEmployeeDashboardUrl() {
    const basePath = this._getBasePath();
    const dashboardUrl = `https://www.filmara.fr${basePath}/employee-dashboard.html`;
    
    console.log('🔍 getEmployeeDashboardUrl:', { basePath, dashboardUrl });
    
    return dashboardUrl;
  }

  // Fonction utilitaire pour obtenir l'URL de connexion selon l'environnement
  getSalarieConnexionUrl() {
    const basePath = this._getBasePath();
    return `https://www.filmara.fr${basePath}/salarie-connexion.html`;
  }

  // Fonction utilitaire pour obtenir l'URL admin selon l'environnement
  getAdminUrl(path = '') {
    const basePath = this._getBasePath();
    const adminUrl = path ? `https://www.filmara.fr${basePath}${path}` : `https://www.filmara.fr${basePath}`;
    
    console.log('🔍 getAdminUrl:', { basePath, path, adminUrl });
    
    return adminUrl;
  }

  // Fonction utilitaire pour obtenir l'URL de l'API selon l'environnement
  getApiBaseUrl() {
    const basePath = this._getBasePath();
    // Longuenesse utilise api-3, Arras utilise api-4-pbfy
    const apiUrl = basePath === '/lon' 
      ? 'https://boulangerie-planning-api-3.onrender.com'
      : 'https://boulangerie-planning-api-4-pbfy.onrender.com';
    
    console.log('🔍 getApiBaseUrl:', { basePath, apiUrl });
    
    return apiUrl;
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
      // SMTP OVH désactivé sur Render (version gratuite bloque les ports SMTP)
      // On utilise directement EmailJS pour éviter les timeouts inutiles
      console.log('ℹ️ Utilisation directe d\'EmailJS (SMTP OVH désactivé sur Render)');

      // Utiliser EmailJS directement
      const emailResult = await this.sendViaEmailJS(to, subject, htmlContent, textContent);
      
      if (emailResult.success) {
        console.log('✅ Email envoyé via EmailJS (fallback):', emailResult.messageId);
        return emailResult;
      }

      // Option 3: Utiliser un webhook ou API simple
      const webhookResult = await this.sendViaWebhook(to, subject, htmlContent, textContent);
      
      if (webhookResult.success) {
        console.log('✅ Email envoyé via webhook:', webhookResult.messageId);
        return webhookResult;
      }

      // Option 4: Log local (fallback final)
      return this.logEmailLocally(to, subject, htmlContent, textContent);

    } catch (error) {
      console.error('❌ Erreur envoi email alternatif:', error.message);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Envoyer via SMTP OVH
  async sendViaSMTP(to, subject, htmlContent, textContent) {
    try {
      // Vérifier que nodemailer est disponible
      let nodemailer;
      try {
        nodemailer = require('nodemailer');
        // Vérifier que nodemailer est bien chargé
        if (!nodemailer || typeof nodemailer.createTransport !== 'function') {
          throw new Error('Nodemailer chargé mais invalide');
        }
      } catch (error) {
        console.error('❌ Erreur chargement nodemailer:', {
          message: error.message,
          code: error.code,
          stack: error.stack,
          requireCache: Object.keys(require.cache).filter(k => k.includes('nodemailer'))
        });
        throw new Error(`Nodemailer non disponible: ${error.message}`);
      }

      // Configuration SMTP OVH (uniquement variables OVH, pas de fallback Gmail)
      // Serveurs OVH possibles : ssl0.ovh.net ou smtp.mail.ovh.net
      const smtpHostPrimary = process.env.SMTP_HOST_OVH || 'ssl0.ovh.net';
      const smtpHostAlternative = smtpHostPrimary === 'ssl0.ovh.net' ? 'smtp.mail.ovh.net' : 'ssl0.ovh.net';
      const smtpPort = parseInt(process.env.SMTP_PORT_OVH || '465');
      const smtpUser = process.env.SMTP_USER_OVH || process.env.EMAIL_USER;
      const smtpPass = process.env.SMTP_PASS_OVH || process.env.SMTP_PASSWORD_OVH;
      const smtpSecure = process.env.SMTP_SECURE_OVH !== undefined 
        ? process.env.SMTP_SECURE_OVH !== 'false' 
        : true; // true par défaut (port 465 avec SSL)

      // Vérifier que la configuration est complète
      if (!smtpUser || !smtpPass) {
        const missingVars = [];
        if (!smtpUser) missingVars.push('SMTP_USER_OVH');
        if (!smtpPass) missingVars.push('SMTP_PASS_OVH');
        console.error('❌ SMTP OVH non configuré - Variables manquantes:', missingVars);
        throw new Error(`SMTP OVH non configuré (${missingVars.join(', ')} manquant)`);
      }

      // Créer la configuration avec le serveur principal
      let smtpConfig = {
        host: smtpHostPrimary,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass
        },
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 30000,
        tls: {
          rejectUnauthorized: false
        }
      };

      console.log('📧 Configuration SMTP OVH:', {
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure,
        user: smtpConfig.auth.user,
        hasPassword: !!smtpConfig.auth.pass,
        alternativeHost: smtpHostAlternative
      });

      // Fonction pour essayer une connexion SMTP
      const trySMTPConnection = async (host, port, secure) => {
        const config = {
          host: host,
          port: port,
          secure: secure,
          auth: {
            user: smtpUser,
            pass: smtpPass
          },
          connectionTimeout: 30000,
          greetingTimeout: 30000,
          socketTimeout: 30000,
          tls: {
            rejectUnauthorized: false
          }
        };
        
        const transporter = nodemailer.createTransport(config);
        await transporter.verify();
        return { transporter, config };
      };

      // Essayer différentes configurations dans l'ordre
      let transporter = null;
      let finalConfig = null;
      let lastError = null;

      // 1. Essayer serveur principal (ssl0.ovh.net) port 465
      console.log(`🔍 Tentative connexion SMTP OVH: ${smtpHostPrimary}:465 (SSL)...`);
      try {
        const result = await trySMTPConnection(smtpHostPrimary, 465, true);
        transporter = result.transporter;
        finalConfig = result.config;
        console.log(`✅ Connexion SMTP OVH réussie: ${smtpHostPrimary}:465`);
      } catch (error1) {
        // Ne pas logger comme erreur, c'est normal sur Render qui bloque les ports SMTP
        console.log(`ℹ️ ${smtpHostPrimary}:465 non disponible (normal sur Render):`, error1.code || error1.message);
        lastError = error1;
        
        // 2. Essayer serveur alternatif (smtp.mail.ovh.net) port 465
        console.log(`🔄 Tentative serveur alternatif: ${smtpHostAlternative}:465 (SSL)...`);
        try {
          const result = await trySMTPConnection(smtpHostAlternative, 465, true);
          transporter = result.transporter;
          finalConfig = result.config;
          console.log(`✅ Connexion SMTP OVH réussie: ${smtpHostAlternative}:465`);
        } catch (error2) {
          console.log(`ℹ️ ${smtpHostAlternative}:465 non disponible:`, error2.code || error2.message);
          lastError = error2;
          
          // 3. Essayer port 587 avec STARTTLS (serveur principal)
          console.log(`🔄 Tentative port 587 (STARTTLS): ${smtpHostPrimary}:587...`);
          try {
            const result = await trySMTPConnection(smtpHostPrimary, 587, false);
            transporter = result.transporter;
            finalConfig = result.config;
            console.log(`✅ Connexion SMTP OVH réussie: ${smtpHostPrimary}:587 (STARTTLS)`);
          } catch (error3) {
            console.log(`ℹ️ ${smtpHostPrimary}:587 non disponible:`, error3.code || error3.message);
            lastError = error3;
            
            // 4. Dernière tentative : serveur alternatif port 587
            console.log(`🔄 Dernière tentative: ${smtpHostAlternative}:587 (STARTTLS)...`);
            try {
              const result = await trySMTPConnection(smtpHostAlternative, 587, false);
              transporter = result.transporter;
              finalConfig = result.config;
              console.log(`✅ Connexion SMTP OVH réussie: ${smtpHostAlternative}:587 (STARTTLS)`);
            } catch (error4) {
              // Ne pas logger comme erreur critique, EmailJS sera utilisé en fallback
              console.log(`ℹ️ Toutes les tentatives SMTP OVH ont échoué (normal sur Render), EmailJS sera utilisé: ${error4.message}`);
              throw new Error(`SMTP OVH non disponible (normal sur Render): ${error4.message}`);
            }
          }
        }
      }

      // Utiliser la configuration qui a fonctionné
      smtpConfig = finalConfig;

      // Options de l'email
      const mailOptions = {
        from: `"Boulangerie Ange - Arras" <${smtpConfig.auth.user}>`,
        to: to,
        subject: subject,
        text: textContent || htmlContent.replace(/<[^>]*>/g, ''), // Version texte si pas fournie
        html: htmlContent
      };

      // Envoyer l'email
      const info = await transporter.sendMail(mailOptions);

      console.log('✅ Email envoyé via SMTP OVH:', {
        messageId: info.messageId,
        to: to,
        subject: subject
      });

      return {
        success: true,
        messageId: info.messageId,
        message: 'Email envoyé via SMTP OVH'
      };

    } catch (error) {
      console.error('❌ Erreur SMTP OVH:', {
        message: error.message,
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode,
        stack: error.stack
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Envoyer via SMTP avec un template de la DB (remplace sendViaEmailJSTemplate)
  async sendViaSMTPTemplate(templateName, toEmail, templateVariables) {
    try {
      // Récupérer le template depuis la base de données
      const EmailTemplate = require('../models/EmailTemplate');
      const template = await EmailTemplate.findOne({ name: templateName, isActive: true });
      
      if (!template) {
        throw new Error(`Template ${templateName} non trouvé dans la base de données`);
      }

      // Remplacer les variables dans le template
      const htmlContent = this.replaceTemplateVariables(template.htmlContent, templateVariables);
      const textContent = this.replaceTemplateVariables(template.textContent, templateVariables);
      const subject = this.replaceTemplateVariables(template.subject, templateVariables);

      // Envoyer via SMTP
      return await this.sendViaSMTP(toEmail, subject, htmlContent, textContent);

    } catch (error) {
      console.error(`❌ Erreur envoi template ${templateName} via SMTP:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Envoyer via EmailJS avec un template spécifique (déprécié - utiliser sendViaSMTPTemplate)
  async sendViaEmailJSTemplate(templateId, toEmail, templateParams) {
    try {
      console.log('🔍 sendViaEmailJSTemplate - Paramètres reçus:', {
        templateId: templateId,
        toEmail: toEmail,
        templateParams: templateParams
      });
      
      // Configuration EmailJS
      const emailjsConfig = {
        serviceId: process.env.EMAILJS_SERVICE_ID || 'gmail',
        userId: process.env.EMAILJS_USER_ID || 'EHw0fFSAwQ_4SfY6Z',
        privateKey: process.env.EMAILJS_PRIVATE_KEY || 'jKt0•••••••••••••••••'
      };

      // Si EmailJS n'est pas configuré, passer au suivant
      if (!emailjsConfig.userId || emailjsConfig.userId === 'user_default') {
        throw new Error('EmailJS non configuré');
      }

      // Ajouter l'email du destinataire aux paramètres du template
      const finalParams = {
        ...templateParams,
        to_email: toEmail
      };

      console.log('📧 Appel EmailJS avec:', {
        serviceId: emailjsConfig.serviceId,
        templateId: templateId,
        userId: emailjsConfig.userId,
        toEmail: toEmail
      });

      // Appel à l'API EmailJS avec headers pour applications non-browser
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Boulangerie-Planning-API/1.0',
          'Origin': 'https://boulangerie-planning-api-4-pbfy.onrender.com'
        },
        body: JSON.stringify({
          service_id: emailjsConfig.serviceId,
          template_id: templateId,
          user_id: emailjsConfig.userId,
          accessToken: emailjsConfig.privateKey,
          template_params: finalParams
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Email envoyé via EmailJS:', result);
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

  // Envoyer via EmailJS avec paramètres supplémentaires (pour les templates qui utilisent des variables)
  async sendViaEmailJSWithParams(to, subject, htmlContent, textContent, additionalParams = {}) {
    try {
      console.log('🔍 sendViaEmailJSWithParams - Paramètres reçus:', {
        to: to,
        subject: subject,
        hasHtml: !!htmlContent,
        hasText: !!textContent,
        additionalParams: Object.keys(additionalParams)
      });
      
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

      console.log('📧 Données EmailJS:', {
        serviceId: emailjsConfig.serviceId,
        templateId: emailjsConfig.templateId,
        userId: emailjsConfig.userId ? emailjsConfig.userId.substring(0, 5) + '...' : 'non défini',
        to: to,
        subject: subject,
        hasHtml: !!htmlContent,
        hasText: !!textContent
      });

      // Appel à l'API EmailJS avec headers pour applications non-browser
      // IMPORTANT: Le destinataire doit être dans template_params avec la clé utilisée dans le template
      // EmailJS utilise généralement 'to_email', 'user_email', ou 'reply_to' selon la config du template
      // Pour le HTML, le template doit utiliser {{html_message}} dans son contenu
      const templateParams = {
        to_email: to,  // Destinataire principal
        user_email: to,  // Alternative (selon config template)
        reply_to: to,  // Pour la réponse
        subject: subject,
        message: textContent,  // Version texte
        html_message: htmlContent,  // Version HTML - le template doit utiliser {{html_message}}
        html_content: htmlContent,  // Alternative
        content: htmlContent,  // Alternative
        from_name: process.env.STORE_NAME || 'Boulangerie Ange - Arras',
        from_email: process.env.SMTP_USER || process.env.EMAIL_USER || 'noreply@boulangerie.fr',
        // Ajouter tous les paramètres supplémentaires pour que le template EmailJS puisse les utiliser
        ...additionalParams
      };

      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Boulangerie-Planning-API/1.0',
          'Origin': 'https://boulangerie-planning-api-4-pbfy.onrender.com'
        },
        body: JSON.stringify({
          service_id: emailjsConfig.serviceId,
          template_id: emailjsConfig.templateId,
          user_id: emailjsConfig.userId,
          accessToken: emailjsConfig.privateKey,
          template_params: templateParams
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
        console.error('❌ Erreur EmailJS:', response.status, errorText);
        throw new Error(`EmailJS error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Erreur sendViaEmailJSWithParams:', error);
      throw error;
    }
  }

  // Envoyer via EmailJS (service gratuit)
  async sendViaEmailJS(to, subject, htmlContent, textContent) {
    try {
      console.log('🔍 sendViaEmailJS - Paramètres reçus:', {
        to: to,
        subject: subject,
        hasHtml: !!htmlContent,
        hasText: !!textContent
      });
      
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
        from_name: process.env.STORE_NAME || 'Boulangerie Ange - Arras',
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

      // Les URLs (admin_url, dashboard_url, etc.) sont déjà correctes selon l'environnement (getAdminUrl, getEmployeeDashboardUrl)
      // Ne pas forcer de remplacement /plan/ → /lon/ : chaque magasin (Arras /plan, Longuenesse /lon) doit garder ses URLs
      console.log('🔍 sendViaEmailJS - Contenu final avant envoi:', {
        htmlContainsPlan: htmlContent ? htmlContent.includes('/plan/') : false,
        htmlContainsLon: htmlContent ? htmlContent.includes('/lon/') : false,
        textContainsPlan: textContent ? textContent.includes('/plan/') : false,
        textContainsLon: textContent ? textContent.includes('/lon/') : false
      });
      
      // Appel à l'API EmailJS avec headers pour applications non-browser
      // IMPORTANT: Le destinataire doit être dans template_params avec la clé utilisée dans le template
      // EmailJS utilise généralement 'to_email', 'user_email', ou 'reply_to' selon la config du template
      // Pour le HTML, le template doit utiliser {{html_message}} dans son contenu
      const templateParams = {
        to_email: to,  // Destinataire principal
        user_email: to,  // Alternative (selon config template)
        reply_to: to,  // Pour la réponse
        subject: subject,
        message: textContent,  // Version texte
        html_message: htmlContent,  // Version HTML - le template doit utiliser {{{html_message}}} (triple accolades)
        html_content: htmlContent,  // Alternative
        content: htmlContent,  // Alternative
        from_name: process.env.STORE_NAME || 'Boulangerie Ange - Arras',
        from_email: process.env.SMTP_USER || process.env.EMAIL_USER || 'noreply@boulangerie.fr'
      };

      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Boulangerie-Planning-API/1.0',
          'Origin': 'https://boulangerie-planning-api-4-pbfy.onrender.com'
        },
        body: JSON.stringify({
          service_id: emailjsConfig.serviceId,
          template_id: emailjsConfig.templateId,
          user_id: emailjsConfig.userId,
          accessToken: emailjsConfig.privateKey,
          template_params: templateParams
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

  // Envoyer un accusé de réception d'arrêt maladie au salarié
  async sendSickLeaveAcknowledgement(sickLeave) {
    try {
      console.log(`📧 Envoi accusé de réception arrêt maladie à ${sickLeave.employeeName} (${sickLeave.employeeEmail})`);
      
      // Récupérer le template depuis la base de données
      const EmailTemplate = require('../models/EmailTemplate');
      const template = await EmailTemplate.findOne({ name: 'sick_leave_acknowledgement' });
      
      if (!template) {
        console.log('⚠️ Template d\'accusé de réception non trouvé, utilisation du template par défaut');
        return await this.sendEmail(
          sickLeave.employeeEmail,
          `Accusé de réception - Arrêt maladie de ${sickLeave.employeeName}`,
          this.generateAcknowledgementEmailHTML(sickLeave),
          this.generateAcknowledgementEmailText(sickLeave)
        );
      }

      // Remplacer les variables dans le template
      const htmlContent = this.replaceTemplateVariables(template.htmlContent, {
        employeeName: sickLeave.employeeName,
        startDate: new Date(sickLeave.startDate).toLocaleDateString('fr-FR'),
        endDate: new Date(sickLeave.endDate).toLocaleDateString('fr-FR'),
        duration: this.calculateDuration(sickLeave.startDate, sickLeave.endDate),
        durationPlural: this.calculateDuration(sickLeave.startDate, sickLeave.endDate) > 1 ? 's' : '',
        uploadDate: new Date(sickLeave.uploadDate).toLocaleDateString('fr-FR'),
        uploadTime: new Date(sickLeave.uploadDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        fileName: sickLeave.originalFileName || sickLeave.fileName
      });

      const textContent = this.replaceTemplateVariables(template.textContent, {
        employeeName: sickLeave.employeeName,
        startDate: new Date(sickLeave.startDate).toLocaleDateString('fr-FR'),
        endDate: new Date(sickLeave.endDate).toLocaleDateString('fr-FR'),
        duration: this.calculateDuration(sickLeave.startDate, sickLeave.endDate),
        durationPlural: this.calculateDuration(sickLeave.startDate, sickLeave.endDate) > 1 ? 's' : '',
        uploadDate: new Date(sickLeave.uploadDate).toLocaleDateString('fr-FR'),
        uploadTime: new Date(sickLeave.uploadDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        fileName: sickLeave.originalFileName || sickLeave.fileName
      });

      return await this.sendEmail(
        sickLeave.employeeEmail,
        this.replaceTemplateVariables(template.subject, { employeeName: sickLeave.employeeName }),
        htmlContent,
        textContent
      );

    } catch (error) {
      console.error('❌ Erreur envoi accusé de réception:', error);
      // Ne pas bloquer le processus si l'email échoue
      return { success: false, error: error.message };
    }
  }

  // Générer le HTML par défaut pour l'accusé de réception
  generateAcknowledgementEmailHTML(sickLeave) {
    const startDate = new Date(sickLeave.startDate).toLocaleDateString('fr-FR');
    const endDate = new Date(sickLeave.endDate).toLocaleDateString('fr-FR');
    const duration = this.calculateDuration(sickLeave.startDate, sickLeave.endDate);
    const uploadDate = new Date(sickLeave.uploadDate).toLocaleDateString('fr-FR');
    const uploadTime = new Date(sickLeave.uploadDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Accusé de réception</h1>
            <p>Votre arrêt maladie a bien été reçu</p>
          </div>
          <div class="content">
            <p>Bonjour <strong>${sickLeave.employeeName}</strong>,</p>
            
            <p>Nous accusons réception de votre arrêt maladie qui a été déposé le <strong>${uploadDate} à ${uploadTime}</strong>.</p>
            
            <div class="info-box">
              <h3>📋 Informations de votre arrêt maladie :</h3>
              <ul>
                <li><strong>Date de début :</strong> ${startDate}</li>
                <li><strong>Date de fin :</strong> ${endDate}</li>
                <li><strong>Durée :</strong> ${duration} jour${duration > 1 ? 's' : ''}</li>
                <li><strong>Document déposé :</strong> ${sickLeave.originalFileName || sickLeave.fileName}</li>
              </ul>
            </div>
            
            <p>Votre arrêt maladie va être traité dans les plus brefs délais par notre équipe administrative.</p>
            
            <p>Vous recevrez une notification par email dès que votre arrêt maladie aura été validé ou si des informations complémentaires sont nécessaires.</p>
            
            <p>En cas de question, n'hésitez pas à nous contacter.</p>
            
            <p>Cordialement,<br>
            <strong>L'équipe de la Boulangerie Ange - Arras</strong></p>
          </div>
          <div class="footer">
            <p>Cet email est envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Générer le texte par défaut pour l'accusé de réception
  generateAcknowledgementEmailText(sickLeave) {
    const startDate = new Date(sickLeave.startDate).toLocaleDateString('fr-FR');
    const endDate = new Date(sickLeave.endDate).toLocaleDateString('fr-FR');
    const duration = this.calculateDuration(sickLeave.startDate, sickLeave.endDate);
    const uploadDate = new Date(sickLeave.uploadDate).toLocaleDateString('fr-FR');
    const uploadTime = new Date(sickLeave.uploadDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    return `
Accusé de réception - Votre arrêt maladie a bien été reçu

Bonjour ${sickLeave.employeeName},

Nous accusons réception de votre arrêt maladie qui a été déposé le ${uploadDate} à ${uploadTime}.

Informations de votre arrêt maladie :
- Date de début : ${startDate}
- Date de fin : ${endDate}
- Durée : ${duration} jour${duration > 1 ? 's' : ''}
- Document déposé : ${sickLeave.originalFileName || sickLeave.fileName}

Votre arrêt maladie va être traité dans les plus brefs délais par notre équipe administrative.

Vous recevrez une notification par email dès que votre arrêt maladie aura été validé ou si des informations complémentaires sont nécessaires.

En cas de question, n'hésitez pas à nous contacter.

Cordialement,
L'équipe de la Boulangerie Ange - Arras

---
Cet email est envoyé automatiquement, merci de ne pas y répondre.
    `.trim();
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
      const adminUrl = this.getAdminUrl('/sick-leave-management');
      const htmlContent = this.replaceTemplateVariables(template.htmlContent, {
        employeeName: sickLeave.employeeName,
        employeeEmail: sickLeave.employeeEmail,
        startDate: new Date(sickLeave.startDate).toLocaleDateString('fr-FR'),
        endDate: new Date(sickLeave.endDate).toLocaleDateString('fr-FR'),
        duration: this.calculateDuration(sickLeave.startDate, sickLeave.endDate),
        durationPlural: this.calculateDuration(sickLeave.startDate, sickLeave.endDate) > 1 ? 's' : '',
        fileName: sickLeave.fileName,
        uploadDate: new Date(sickLeave.uploadDate).toLocaleDateString('fr-FR'),
        adminUrl: adminUrl
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
        adminUrl: adminUrl
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
      console.log('🔍 sendToAccountant - Paramètres reçus:', {
        employeeName: sickLeave.employeeName,
        accountantEmail: accountantEmail
      });
      
      // Récupérer le template depuis la base de données
      const EmailTemplate = require('../models/EmailTemplate');
      const template = await EmailTemplate.findOne({ name: 'sick_leave_accountant' });
      
      console.log('🔍 Template comptable recherché:', {
        templateFound: !!template,
        templateName: template?.name,
        templateId: template?._id
      });
      
      if (!template) {
        console.log('⚠️ Template comptable non trouvé, utilisation du template par défaut');
        return await this.sendEmailWithAttachment(
          accountantEmail,
          `Nouvel arrêt maladie validé - ${sickLeave.employeeName}`,
          this.generateAccountantEmailHTML(sickLeave),
          this.generateAccountantEmailText(sickLeave),
          sickLeave.fileName,
          sickLeave.fileBuffer
        );
      }

      // Construire l'URL de téléchargement
      const apiBaseUrl = this.getApiBaseUrl();
      const downloadUrl = `${apiBaseUrl}/api/sick-leaves/${sickLeave._id}/download`;

      // Remplacer les variables dans le template (gérer les conditions {{#if}} pour downloadUrl)
      let htmlContent = template.htmlContent;
      let textContent = template.textContent;
      
      // Remplacer les variables simples
      const variables = {
        employeeName: sickLeave.employeeName,
        startDate: new Date(sickLeave.startDate).toLocaleDateString('fr-FR'),
        endDate: new Date(sickLeave.endDate).toLocaleDateString('fr-FR'),
        uploadDate: new Date(sickLeave.uploadDate).toLocaleDateString('fr-FR'),
        downloadUrl: downloadUrl
      };

      // Remplacer les variables dans le HTML
      htmlContent = this.replaceTemplateVariables(htmlContent, variables);
      // Gérer les conditions {{#if downloadUrl}}...{{/if}} (simplifié - on supprime juste les balises)
      if (downloadUrl) {
        htmlContent = htmlContent.replace(/\{\{#if downloadUrl\}\}/g, '');
        htmlContent = htmlContent.replace(/\{\{\/if\}\}/g, '');
      } else {
        htmlContent = htmlContent.replace(/\{\{#if downloadUrl\}\}[\s\S]*?\{\{\/if\}\}/g, '');
      }

      // Remplacer les variables dans le texte
      textContent = this.replaceTemplateVariables(textContent, variables);
      // Gérer les conditions {{#if downloadUrl}}...{{/if}}
      if (downloadUrl) {
        textContent = textContent.replace(/\{\{#if downloadUrl\}\}/g, '');
        textContent = textContent.replace(/\{\{\/if\}\}/g, '');
      } else {
        textContent = textContent.replace(/\{\{#if downloadUrl\}\}[\s\S]*?\{\{\/if\}\}/g, '');
      }
      
      // Envoyer l'email sans pièce jointe (le fichier est accessible via le lien de téléchargement)
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
    const apiBaseUrl = this.getApiBaseUrl();
    const downloadUrl = `${apiBaseUrl}/api/sick-leaves/${sickLeave._id}/download`;

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
          
          <div class="details">
            <h3>📎 Pièce jointe :</h3>
            <p>Le document d'arrêt maladie est disponible au téléchargement :</p>
            <p style="text-align: center; margin: 20px 0;">
              <a href="${downloadUrl}" 
                 style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                📥 Télécharger l'arrêt maladie
              </a>
            </p>
            <p style="font-size: 0.9em; color: #666;">
              <em>Lien direct vers le document validé</em>
            </p>
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
    const apiBaseUrl = this.getApiBaseUrl();
    const downloadUrl = `${apiBaseUrl}/api/sick-leaves/${sickLeave._id}/download`;

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

PIÈCE JOINTE :
Le document d'arrêt maladie est disponible au téléchargement :
🔗 ${downloadUrl}

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
            <a href="${this.getAdminUrl('/sick-leave-management')}" class="action-button">🔍 Valider l'Arrêt Maladie</a>
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

🔍 Pour valider : ${this.getAdminUrl('/sick-leave-management')}

IMPORTANT : Cet arrêt maladie doit être traité dans les plus brefs délais.

---
Boulangerie Ange - Système de Gestion des Arrêts Maladie
Cet email a été envoyé automatiquement, merci de ne pas y répondre.
    `;
  }
  // ===== MÉTHODES POUR LES CONGÉS =====

  // Envoyer un email de confirmation de demande de congés
  async sendVacationRequestConfirmation(vacationRequest) {
    try {
      console.log(`📧 Envoi confirmation demande congés à ${vacationRequest.employeeName} (${vacationRequest.employeeEmail})`);
      
      // Récupérer le template depuis la base de données
      const EmailTemplate = require('../models/EmailTemplate');
      const template = await EmailTemplate.findOne({ name: 'vacation_request_confirmation' });
      
      if (!template) {
        console.log('⚠️ Template de confirmation congés non trouvé, utilisation du template par défaut');
        return await this.sendEmail(
          vacationRequest.employeeEmail,
          `Demande de congés reçue - ${vacationRequest.employeeName}`,
          this.generateVacationConfirmationHTML(vacationRequest),
          this.generateVacationConfirmationText(vacationRequest)
        );
      }

      // Calculer la durée
      const duration = this.calculateDuration(vacationRequest.startDate, vacationRequest.endDate);

      // Remplacer les variables dans le template
      const htmlContent = this.replaceTemplateVariables(template.htmlContent, {
        employeeName: vacationRequest.employeeName,
        startDate: new Date(vacationRequest.startDate).toLocaleDateString('fr-FR'),
        endDate: new Date(vacationRequest.endDate).toLocaleDateString('fr-FR'),
        duration: duration,
        durationPlural: duration > 1 ? 's' : '',
        reason: vacationRequest.reason || 'Congés payés',
        requestDate: new Date(vacationRequest.uploadDate || vacationRequest.createdAt).toLocaleDateString('fr-FR')
      });

      const textContent = this.replaceTemplateVariables(template.textContent, {
        employeeName: vacationRequest.employeeName,
        startDate: new Date(vacationRequest.startDate).toLocaleDateString('fr-FR'),
        endDate: new Date(vacationRequest.endDate).toLocaleDateString('fr-FR'),
        duration: duration,
        durationPlural: duration > 1 ? 's' : '',
        reason: vacationRequest.reason || 'Congés payés',
        requestDate: new Date(vacationRequest.uploadDate || vacationRequest.createdAt).toLocaleDateString('fr-FR')
      });

      return await this.sendEmail(
        vacationRequest.employeeEmail,
        this.replaceTemplateVariables(template.subject, { employeeName: vacationRequest.employeeName }),
        htmlContent,
        textContent
      );

    } catch (error) {
      console.error('❌ Erreur envoi email confirmation congés:', error.message);
      // Fallback vers le template par défaut en cas d'erreur
      return await this.sendEmail(
        vacationRequest.employeeEmail,
        `Demande de congés reçue - ${vacationRequest.employeeName}`,
        this.generateVacationConfirmationHTML(vacationRequest),
        this.generateVacationConfirmationText(vacationRequest)
      );
    }
  }

  // Envoyer un email d'alerte pour demande de congés
  async sendVacationRequestAlert(vacationRequest, recipientEmails) {
    try {
      const EmailTemplate = require('../models/EmailTemplate');
      const template = await EmailTemplate.findOne({ name: 'vacation_request_alert' });

      if (!template) {
        console.log('⚠️ Template d\'alerte de congés non trouvé, utilisation du template par défaut');
        return await this.sendEmail(
          recipientEmails.join(', '),
          `🚨 Nouvelle demande de congés - ${vacationRequest.employeeName}`,
          this.generateVacationAlertHTML(vacationRequest),
          this.generateVacationAlertText(vacationRequest)
        );
      }

      const duration = this.calculateDuration(vacationRequest.startDate, vacationRequest.endDate);
      const adminUrl = this.getAdminUrl('/vacation-management');

      const htmlContent = this.replaceTemplateVariables(template.htmlContent, {
        employeeName: vacationRequest.employeeName,
        employeeEmail: vacationRequest.employeeEmail,
        startDate: new Date(vacationRequest.startDate).toLocaleDateString('fr-FR'),
        endDate: new Date(vacationRequest.endDate).toLocaleDateString('fr-FR'),
        duration: duration,
        durationPlural: duration > 1 ? 's' : '',
        reason: vacationRequest.reason || 'Congés payés',
        requestDate: new Date(vacationRequest.uploadDate || vacationRequest.createdAt).toLocaleDateString('fr-FR'),
        adminUrl: adminUrl
      });

      const textContent = this.replaceTemplateVariables(template.textContent, {
        employeeName: vacationRequest.employeeName,
        employeeEmail: vacationRequest.employeeEmail,
        startDate: new Date(vacationRequest.startDate).toLocaleDateString('fr-FR'),
        endDate: new Date(vacationRequest.endDate).toLocaleDateString('fr-FR'),
        duration: duration,
        durationPlural: duration > 1 ? 's' : '',
        reason: vacationRequest.reason || 'Congés payés',
        requestDate: new Date(vacationRequest.uploadDate || vacationRequest.createdAt).toLocaleDateString('fr-FR'),
        adminUrl: adminUrl
      });

      return await this.sendEmail(
        recipientEmails.join(', '),
        this.replaceTemplateVariables(template.subject, { employeeName: vacationRequest.employeeName }),
        htmlContent,
        textContent
      );
    } catch (error) {
      console.error('❌ Erreur envoi email alerte congés:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Envoyer un email de validation de congés
  async sendVacationRequestValidation(vacationRequest, validatedBy) {
    try {
      const EmailTemplate = require('../models/EmailTemplate');
      const template = await EmailTemplate.findOne({ name: 'vacation_request_validation' });

      if (!template) {
        console.log('⚠️ Template de validation de congés non trouvé, utilisation du template par défaut');
        return await this.sendEmail(
          vacationRequest.employeeEmail,
          `Congés validés - ${vacationRequest.employeeName}`,
          this.generateVacationValidationHTML(vacationRequest, validatedBy),
          this.generateVacationValidationText(vacationRequest, validatedBy)
        );
      }

      const duration = this.calculateDuration(vacationRequest.startDate, vacationRequest.endDate);

      let htmlContent = this.replaceTemplateVariables(template.htmlContent, {
        employeeName: vacationRequest.employeeName,
        startDate: new Date(vacationRequest.startDate).toLocaleDateString('fr-FR'),
        endDate: new Date(vacationRequest.endDate).toLocaleDateString('fr-FR'),
        duration: duration,
        durationPlural: duration > 1 ? 's' : '',
        reason: vacationRequest.reason || 'Congés payés',
        validatedBy: validatedBy || 'Administrateur',
        validationDate: new Date(vacationRequest.validatedAt || Date.now()).toLocaleDateString('fr-FR')
      });

      let textContent = this.replaceTemplateVariables(template.textContent, {
        employeeName: vacationRequest.employeeName,
        startDate: new Date(vacationRequest.startDate).toLocaleDateString('fr-FR'),
        endDate: new Date(vacationRequest.endDate).toLocaleDateString('fr-FR'),
        duration: duration,
        durationPlural: duration > 1 ? 's' : '',
        reason: vacationRequest.reason || 'Congés payés',
        validatedBy: validatedBy || 'Administrateur',
        validationDate: new Date(vacationRequest.validatedAt || Date.now()).toLocaleDateString('fr-FR')
      });

      // Détecter si c'est Longuenesse pour remplacer les liens /plan/ par /lon/
      const city = vacationRequest.city || '';
      const cityLower = city.toLowerCase();
      let isLonguenesse = cityLower === 'longuenesse' || cityLower.includes('longuenesse');
      
      if (!isLonguenesse) {
        const corsOrigin = process.env.CORS_ORIGIN || '';
        if (corsOrigin.includes('/lon')) {
          isLonguenesse = true;
        }
      }
      
      // Remplacer les liens /plan/ par /lon/ si c'est Longuenesse
      if (isLonguenesse) {
        htmlContent = htmlContent.replace(/https:\/\/www\.filmara\.fr\/plan\//g, 'https://www.filmara.fr/lon/');
        textContent = textContent.replace(/https:\/\/www\.filmara\.fr\/plan\//g, 'https://www.filmara.fr/lon/');
      }

      return await this.sendEmail(
        vacationRequest.employeeEmail,
        this.replaceTemplateVariables(template.subject, { employeeName: vacationRequest.employeeName }),
        htmlContent,
        textContent
      );
    } catch (error) {
      console.error('❌ Erreur envoi email validation congés:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Envoyer un email au magasin lors de la validation d'un congé
  async sendVacationRequestValidationToStore(vacationRequest, storeEmail, validatedBy) {
    try {
      console.log(`📧 Envoi email validation congé au magasin: ${storeEmail}`);
      
      const duration = this.calculateDuration(vacationRequest.startDate, vacationRequest.endDate);
      
      // Détecter le chemin selon la ville
      const city = vacationRequest.city || '';
      const cityLower = city.toLowerCase();
      
      // Méthode 1 : Détection par la ville dans la demande
      let isLonguenesse = cityLower === 'longuenesse' || cityLower.includes('longuenesse');
      
      // Méthode 2 : Détection par CORS_ORIGIN si la ville n'est pas définie ou est 'Arras'
      if (!isLonguenesse) {
        const corsOrigin = process.env.CORS_ORIGIN || '';
        // Si CORS_ORIGIN contient /lon, c'est Longuenesse
        if (corsOrigin.includes('/lon')) {
          isLonguenesse = true;
        }
        // Si CORS_ORIGIN ne contient pas /lon mais contient /plan, c'est Arras
        else if (corsOrigin.includes('/plan') && !corsOrigin.includes('/lon')) {
          isLonguenesse = false;
        }
      }
      
      const basePath = isLonguenesse ? '/lon' : '/plan';
      const planningUrl = `https://www.filmara.fr${basePath}/vacation-planning`;
      
      console.log('🔍 Détection chemin planning:', { 
        city, 
        cityLower,
        isLonguenesse, 
        basePath, 
        planningUrl,
        corsOrigin: process.env.CORS_ORIGIN 
      });
      
      const subject = `Congés validés - ${vacationRequest.employeeName}`;
      
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
            .info-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
            .button { display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .button:hover { background-color: #45a049; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Congés Validés</h1>
            </div>
            <div class="content">
              <p>Bonjour,</p>
              <p>Les congés suivants ont été validés :</p>
              
              <div class="info-box">
                <p><strong>👤 Salarié :</strong> ${vacationRequest.employeeName}</p>
                <p><strong>📅 Période :</strong> Du ${new Date(vacationRequest.startDate).toLocaleDateString('fr-FR')} au ${new Date(vacationRequest.endDate).toLocaleDateString('fr-FR')}</p>
                <p><strong>⏱️ Durée :</strong> ${duration} jour${duration > 1 ? 's' : ''}</p>
                ${vacationRequest.reason ? `<p><strong>💬 Raison :</strong> ${vacationRequest.reason}</p>` : ''}
                <p><strong>✅ Validé par :</strong> ${validatedBy || 'Administrateur'}</p>
                <p><strong>📅 Date de validation :</strong> ${new Date(vacationRequest.validatedAt || Date.now()).toLocaleDateString('fr-FR')}</p>
              </div>
              
              <p>Vous pouvez consulter et imprimer le calendrier des congés en cliquant sur le bouton ci-dessous :</p>
              
              <div style="text-align: center;">
                <a href="${planningUrl}" class="button">🖨️ Imprimer le Calendrier des Congés</a>
              </div>
              
              <p style="margin-top: 20px; font-size: 12px; color: #666;">
                Ou copiez ce lien dans votre navigateur :<br>
                <a href="${planningUrl}">${planningUrl}</a>
              </p>
            </div>
            <div class="footer">
              <p>Cet email a été envoyé automatiquement par le système de gestion des congés.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      let textContent = `
Congés Validés

Bonjour,

Les congés suivants ont été validés :

👤 Salarié : ${vacationRequest.employeeName}
📅 Période : Du ${new Date(vacationRequest.startDate).toLocaleDateString('fr-FR')} au ${new Date(vacationRequest.endDate).toLocaleDateString('fr-FR')}
⏱️ Durée : ${duration} jour${duration > 1 ? 's' : ''}
${vacationRequest.reason ? `💬 Raison : ${vacationRequest.reason}\n` : ''}✅ Validé par : ${validatedBy || 'Administrateur'}
📅 Date de validation : ${new Date(vacationRequest.validatedAt || Date.now()).toLocaleDateString('fr-FR')}

Vous pouvez consulter et imprimer le calendrier des congés à l'adresse suivante :
${planningUrl}

Cet email a été envoyé automatiquement par le système de gestion des congés.
      `;
      
      // Remplacer les liens /plan/ par /lon/ si c'est Longuenesse (comme dans d'autres fonctions)
      if (isLonguenesse) {
        htmlContent = htmlContent.replace(/https:\/\/www\.filmara\.fr\/plan\//g, 'https://www.filmara.fr/lon/');
        textContent = textContent.replace(/https:\/\/www\.filmara\.fr\/plan\//g, 'https://www.filmara.fr/lon/');
      }
      
      return await this.sendEmail(storeEmail, subject, htmlContent, textContent);
    } catch (error) {
      console.error('❌ Erreur envoi email validation congé au magasin:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Générer le HTML de confirmation de congés
  generateVacationConfirmationHTML(vacationRequest) {
    const startDate = new Date(vacationRequest.startDate).toLocaleDateString('fr-FR');
    const endDate = new Date(vacationRequest.endDate).toLocaleDateString('fr-FR');
    const requestDate = new Date(vacationRequest.uploadDate).toLocaleDateString('fr-FR');

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f8f9fa; }
        .details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Demande de Congés Reçue</h1>
          <p>Boulangerie Ange - Arras</p>
        </div>
        
        <div class="content">
          <p>Bonjour ${vacationRequest.employeeName},</p>
          
          <p>Votre demande de congés a été reçue et sera traitée dans les plus brefs délais.</p>
          
          <div class="details">
            <h3>📋 Détails de votre demande :</h3>
            <ul>
              <li><strong>Période :</strong> ${startDate} au ${endDate}</li>
              <li><strong>Durée :</strong> ${vacationRequest.duration} jour${vacationRequest.duration > 1 ? 's' : ''}</li>
              <li><strong>Type :</strong> ${vacationRequest.reason}</li>
              <li><strong>Date de demande :</strong> ${requestDate}</li>
            </ul>
          </div>
          
          <p>Vous recevrez une confirmation par email une fois votre demande traitée.</p>
        </div>
        
        <div class="footer">
          <p>Boulangerie Ange - Arras</p>
          <p>Ce message a été généré automatiquement.</p>
        </div>
      </div>
    </body>
    </html>`;
  }

  // Générer le texte de confirmation de congés
  generateVacationConfirmationText(vacationRequest) {
    const startDate = new Date(vacationRequest.startDate).toLocaleDateString('fr-FR');
    const endDate = new Date(vacationRequest.endDate).toLocaleDateString('fr-FR');
    const requestDate = new Date(vacationRequest.uploadDate).toLocaleDateString('fr-FR');

    return `
DEMANDE DE CONGÉS REÇUE
Boulangerie Ange - Arras

Bonjour ${vacationRequest.employeeName},

Votre demande de congés a été reçue et sera traitée dans les plus brefs délais.

DÉTAILS DE VOTRE DEMANDE :
- Période : ${startDate} au ${endDate}
- Durée : ${vacationRequest.duration} jour${vacationRequest.duration > 1 ? 's' : ''}
- Type : ${vacationRequest.reason}
- Date de demande : ${requestDate}

Vous recevrez une confirmation par email une fois votre demande traitée.

Boulangerie Ange - Arras
Ce message a été généré automatiquement.
    `;
  }

  // Générer le HTML d'alerte de congés
  generateVacationAlertHTML(vacationRequest) {
    const startDate = new Date(vacationRequest.startDate).toLocaleDateString('fr-FR');
    const endDate = new Date(vacationRequest.endDate).toLocaleDateString('fr-FR');
    const requestDate = new Date(vacationRequest.uploadDate).toLocaleDateString('fr-FR');

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ffc107; color: #212529; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f8f9fa; }
        .alert-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
        .action-button { background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 Nouvelle Demande de Congés</h1>
          <p>Boulangerie Ange - Arras</p>
        </div>
        
        <div class="content">
          <p>Une nouvelle demande de congés a été déposée et nécessite votre validation.</p>
          
          <div class="alert-box">
            <h3>⚠️ Action Requise</h3>
            <p>Veuillez valider ou rejeter cette demande de congés dans les plus brefs délais.</p>
          </div>
          
          <div class="details">
            <h3>📋 Informations de la demande :</h3>
            <ul>
              <li><strong>Salarié :</strong> ${vacationRequest.employeeName}</li>
              <li><strong>Email :</strong> ${vacationRequest.employeeEmail}</li>
              <li><strong>Période :</strong> ${startDate} au ${endDate}</li>
              <li><strong>Durée :</strong> ${vacationRequest.duration} jour${vacationRequest.duration > 1 ? 's' : ''}</li>
              <li><strong>Type :</strong> ${vacationRequest.reason}</li>
              <li><strong>Date de demande :</strong> ${requestDate}</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${this.getAdminUrl('/vacation-management')}" class="action-button">🔍 Gérer les Congés</a>
          </div>
          
          <p>Merci de traiter cette demande rapidement.</p>
        </div>
        
        <div class="footer">
          <p>Boulangerie Ange - Arras</p>
          <p>Ce message a été généré automatiquement.</p>
        </div>
      </div>
    </body>
    </html>`;
  }

  // Générer le texte d'alerte de congés
  generateVacationAlertText(vacationRequest) {
    const startDate = new Date(vacationRequest.startDate).toLocaleDateString('fr-FR');
    const endDate = new Date(vacationRequest.endDate).toLocaleDateString('fr-FR');
    const requestDate = new Date(vacationRequest.uploadDate).toLocaleDateString('fr-FR');

    return `
NOUVELLE DEMANDE DE CONGÉS
Boulangerie Ange - Arras

Une nouvelle demande de congés a été déposée et nécessite votre validation.

INFORMATIONS DE LA DEMANDE :
- Salarié : ${vacationRequest.employeeName}
- Email : ${vacationRequest.employeeEmail}
- Période : ${startDate} au ${endDate}
- Durée : ${vacationRequest.duration} jour${vacationRequest.duration > 1 ? 's' : ''}
- Type : ${vacationRequest.reason}
- Date de demande : ${requestDate}

🔍 Pour gérer : ${this.getAdminUrl('/vacation-management')}

Merci de traiter cette demande rapidement.

Boulangerie Ange - Arras
Ce message a été généré automatiquement.
    `;
  }

  // Générer le HTML de validation de congés
  generateVacationValidationHTML(vacationRequest, validatedBy) {
    const startDate = new Date(vacationRequest.startDate).toLocaleDateString('fr-FR');
    const endDate = new Date(vacationRequest.endDate).toLocaleDateString('fr-FR');
    const validationDate = new Date(vacationRequest.validatedAt).toLocaleDateString('fr-FR');

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f8f9fa; }
        .details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Congés Validés</h1>
          <p>Boulangerie Ange - Arras</p>
        </div>
        
        <div class="content">
          <p>Bonjour ${vacationRequest.employeeName},</p>
          
          <p>Votre demande de congés a été validée avec succès.</p>
          
          <div class="details">
            <h3>📋 Détails de vos congés :</h3>
            <ul>
              <li><strong>Période :</strong> ${startDate} au ${endDate}</li>
              <li><strong>Durée :</strong> ${vacationRequest.duration} jour${vacationRequest.duration > 1 ? 's' : ''}</li>
              <li><strong>Type :</strong> ${vacationRequest.reason}</li>
              <li><strong>Validé par :</strong> ${validatedBy}</li>
              <li><strong>Date de validation :</strong> ${validationDate}</li>
            </ul>
          </div>
          
          <p>Vos congés ont été enregistrés dans le système de gestion du personnel.</p>
          
          <p>Bonnes vacances !</p>
        </div>
        
        <div class="footer">
          <p>Boulangerie Ange - Arras</p>
          <p>Ce message a été généré automatiquement.</p>
        </div>
      </div>
    </body>
    </html>`;
  }

  // Générer le texte de validation de congés
  generateVacationValidationText(vacationRequest, validatedBy) {
    const startDate = new Date(vacationRequest.startDate).toLocaleDateString('fr-FR');
    const endDate = new Date(vacationRequest.endDate).toLocaleDateString('fr-FR');
    const validationDate = new Date(vacationRequest.validatedAt).toLocaleDateString('fr-FR');

    return `
CONGÉS VALIDÉS
Boulangerie Ange - Arras

Bonjour ${vacationRequest.employeeName},

Votre demande de congés a été validée avec succès.

DÉTAILS DE VOS CONGÉS :
- Période : ${startDate} au ${endDate}
- Durée : ${vacationRequest.duration} jour${vacationRequest.duration > 1 ? 's' : ''}
- Type : ${vacationRequest.reason}
- Validé par : ${validatedBy}
- Date de validation : ${validationDate}

Vos congés ont été enregistrés dans le système de gestion du personnel.

Bonnes vacances !

Boulangerie Ange - Arras
Ce message a été généré automatiquement.
    `;
  }
  // Envoyer un mot de passe à un salarié
  async sendEmployeePassword({ employeeName, employeeEmail, password, loginUrl }) {
    try {
      console.log('📧 Envoi mot de passe salarié:', {
        employeeName: employeeName || 'undefined',
        employeeEmail: employeeEmail || 'undefined',
        hasPassword: !!password,
        loginUrl: loginUrl || 'undefined'
      });
      
      // Vérifier que employeeEmail n'est pas undefined
      if (!employeeEmail) {
        console.error('❌ employeeEmail est undefined !');
        throw new Error('employeeEmail est requis mais est undefined');
      }
      
      // 🎯 Récupérer le template depuis la base de données
      const EmailTemplate = require('../models/EmailTemplate');
      const template = await EmailTemplate.findOne({ name: 'employee_password' });
      
      let htmlContent, textContent;
      
      // 🎯 OPTION 1 : Forcer l'utilisation du template par défaut (recommandé)
      // Ignorer le template MongoDB pour éviter les problèmes avec "undefined"
      console.log('⚠️ Utilisation forcée du template par défaut (ignorant le template MongoDB pour éviter les problèmes)');
      
      // Vérifier que employeeEmail est bien défini
      if (!employeeEmail) {
        console.error('❌ employeeEmail est undefined ! Valeurs reçues:', {
          employeeName: employeeName || 'undefined',
          employeeEmail: employeeEmail || 'undefined',
          hasPassword: !!password,
          loginUrl: loginUrl || 'undefined'
        });
        throw new Error('employeeEmail est requis mais est undefined');
      }
      
      // Toujours utiliser le template par défaut qui fonctionne correctement
      // Vérifier une dernière fois que employeeEmail est défini avant de générer le HTML
      const finalEmployeeEmail = (employeeEmail && typeof employeeEmail === 'string' && employeeEmail.trim()) 
        ? employeeEmail.trim() 
        : (employeeEmail ? String(employeeEmail).trim() : null);
      
      if (!finalEmployeeEmail || finalEmployeeEmail === 'undefined' || finalEmployeeEmail === '') {
        console.error('❌ employeeEmail est invalide juste avant génération HTML !', {
          originalEmployeeEmail: employeeEmail,
          finalEmployeeEmail: finalEmployeeEmail,
          type: typeof employeeEmail,
          isUndefined: employeeEmail === undefined,
          isNull: employeeEmail === null,
          isEmpty: employeeEmail === ''
        });
        throw new Error(`employeeEmail est invalide: "${employeeEmail}" - impossible de générer le template`);
      }
      
      console.log('📧 Génération du template HTML avec email vérifié:', finalEmployeeEmail);
      
      htmlContent = this.generateEmployeePasswordHTML({
        employeeName: employeeName || 'Employé',
        employeeEmail: finalEmployeeEmail,  // Utiliser l'email vérifié et nettoyé
        password: password || 'Non généré',
        loginUrl: loginUrl || 'https://www.filmara.fr/plan/salarie-connexion.html'
      });
      
      textContent = this.generateEmployeePasswordText({
        employeeName: employeeName || 'Employé',
        employeeEmail: finalEmployeeEmail,  // Utiliser l'email vérifié et nettoyé
        password: password || 'Non généré',
        loginUrl: loginUrl || 'https://www.filmara.fr/plan/salarie-connexion.html'
      });
      
      console.log('✅ Template par défaut généré avec les valeurs:', {
        employeeName: employeeName || 'undefined',
        employeeEmail: employeeEmail || 'undefined',
        hasPassword: !!password,
        loginUrl: loginUrl || 'undefined'
      });
      
      const subject = `VOS IDENTIFIANTS DE CONNEXION - ${employeeName}`;
      
      // Utiliser la configuration EmailJS depuis les variables d'environnement
      const emailjsConfig = {
        serviceId: process.env.EMAILJS_SERVICE_ID || 'service_default',
        templateId: process.env.EMAILJS_TEMPLATE_ID || 'template_default',
        userId: process.env.EMAILJS_USER_ID || 'user_default',
        privateKey: process.env.EMAILJS_PRIVATE_KEY || ''
      };

      // Vérifier que EmailJS est configuré
      if (emailjsConfig.serviceId === 'service_default' || !emailjsConfig.userId || emailjsConfig.userId === 'user_default') {
        throw new Error('EmailJS non configuré. Vérifiez les variables d\'environnement EMAILJS_*');
      }
      
      console.log('📧 Configuration EmailJS utilisée:', {
        serviceId: emailjsConfig.serviceId,
        templateId: emailjsConfig.templateId,
        userId: emailjsConfig.userId ? emailjsConfig.userId.substring(0, 5) + '...' : 'non défini'
      });
      
      // finalEmployeeEmail a déjà été vérifié et nettoyé plus haut (ligne 1933)
      // Vérifier le contenu HTML avant l'envoi
      const htmlContainsUndefined = htmlContent?.includes('undefined') || false;
      const htmlContainsEmployeeEmail = htmlContent?.includes(finalEmployeeEmail) || false;
      
      // Extraire un extrait du HTML autour de "Email :" pour vérifier
      const emailMatch = htmlContent?.match(/Email\s*:\s*([^<]+)/i);
      const emailInHtml = emailMatch ? emailMatch[1].trim() : 'non trouvé';
      
      console.log('📧 Envoi final avec valeurs vérifiées:', {
        to: finalEmployeeEmail,
        subject,
        htmlLength: htmlContent?.length || 0,
        textLength: textContent?.length || 0,
        htmlContainsUndefined: htmlContainsUndefined,
        htmlContainsEmployeeEmail: htmlContainsEmployeeEmail,
        emailInHtml: emailInHtml.substring(0, 50) // Premiers 50 caractères seulement
      });
      
      if (htmlContainsUndefined) {
        console.error('❌ ATTENTION: Le HTML contient "undefined" !');
        console.error('Extrait HTML autour de "Email :":', emailInHtml);
      }
      
      if (!htmlContainsEmployeeEmail && finalEmployeeEmail) {
        console.warn('⚠️ ATTENTION: Le HTML ne contient pas l\'email du destinataire !');
        console.warn('Email attendu:', finalEmployeeEmail);
      }
      
      // Passer toutes les variables au cas où le template EmailJS les utilise directement
      // Même si le HTML généré contient déjà tout, le template EmailJS pourrait avoir du texte supplémentaire
      const result = await this.sendViaEmailJSWithParams(
        finalEmployeeEmail, 
        subject, 
        htmlContent, 
        textContent,
        {
          employeeName: employeeName || 'Employé',
          employeeEmail: finalEmployeeEmail,
          password: password || 'Non généré',
          loginUrl: loginUrl || 'https://www.filmara.fr/plan/salarie-connexion.html'
        }
      );
      console.log('✅ Email mot de passe envoyé:', result);
      
      return {
        success: true,
        messageId: result,
        to: finalEmployeeEmail
      };
      
    } catch (error) {
      console.error('❌ Erreur envoi mot de passe salarié:', error);
      throw error;
    }
  }

  // Générer le HTML pour l'email mot de passe salarié
  generateEmployeePasswordHTML(params = {}) {
    // Extraire les paramètres avec destructuration et valeurs par défaut
    const {
      employeeName = 'Employé',
      employeeEmail = 'Email non défini - contactez votre administrateur',
      password = 'Non généré',
      loginUrl = 'https://www.filmara.fr/plan/salarie-connexion.html'
    } = params || {};
    
    // S'assurer que toutes les valeurs sont des chaînes et non undefined/null/empty
    const safeEmployeeName = (employeeName && String(employeeName).trim()) || 'Employé';
    const safeEmployeeEmail = (employeeEmail && String(employeeEmail).trim()) || 'Email non défini - contactez votre administrateur';
    const safePassword = (password && String(password).trim()) || 'Non généré';
    const safeLoginUrl = (loginUrl && String(loginUrl).trim()) || 'https://www.filmara.fr/plan/salarie-connexion.html';
    
    console.log('📋 Génération HTML avec valeurs:', {
      employeeName: safeEmployeeName,
      employeeEmail: safeEmployeeEmail,
      hasPassword: !!password,
      loginUrl: safeLoginUrl,
      rawEmployeeEmail: employeeEmail,
      rawEmployeeEmailType: typeof employeeEmail
    });
    
    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vos identifiants de connexion</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background: white;
                border-radius: 10px;
                padding: 30px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 3px solid #007bff;
            }
            .logo {
                font-size: 24px;
                font-weight: bold;
                color: #007bff;
                margin-bottom: 10px;
            }
            .title {
                color: #333;
                font-size: 20px;
                margin: 0;
            }
            .content {
                margin-bottom: 30px;
            }
            .greeting {
                font-size: 18px;
                margin-bottom: 20px;
                color: #007bff;
            }
            .credentials-box {
                background: #f8f9fa;
                border: 2px solid #007bff;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                text-align: center;
            }
            .password {
                font-size: 24px;
                font-weight: bold;
                color: #007bff;
                letter-spacing: 2px;
                background: white;
                padding: 15px;
                border-radius: 5px;
                border: 1px solid #ddd;
                margin: 10px 0;
            }
            .login-button {
                display: inline-block;
                background: #007bff;
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                margin: 20px 0;
                transition: background-color 0.3s;
            }
            .login-button:hover {
                background: #0056b3;
            }
            .instructions {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 5px;
                padding: 15px;
                margin: 20px 0;
            }
            .instructions h3 {
                color: #856404;
                margin-top: 0;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                color: #666;
                font-size: 14px;
            }
            .security-note {
                background: #d1ecf1;
                border: 1px solid #bee5eb;
                border-radius: 5px;
                padding: 15px;
                margin: 20px 0;
                color: #0c5460;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🏢 Planning Boulangerie</div>
                <h1 class="title">Vos identifiants de connexion</h1>
            </div>
            
            <div class="content">
                <div class="greeting">Bonjour ${safeEmployeeName},</div>
                
                <p>Votre administrateur vous a créé un compte pour accéder aux services en ligne de la boulangerie.</p>
                
                <div class="instructions">
                    <h3>🎯 Pourquoi se connecter ?</h3>
                    <p>En vous connectant, vous pourrez :</p>
                    <ul>
                        <li>📋 <strong>Déclarer vos arrêts maladie</strong> directement en ligne</li>
                        <li>🏖️ <strong>Demander vos congés</strong> de manière simple et rapide</li>
                        <li>📱 <strong>Accéder à vos informations</strong> depuis n'importe où</li>
                        <li>⏰ <strong>Gagner du temps</strong> en évitant les formulaires papier</li>
                    </ul>
                </div>
                
                <div class="credentials-box">
                    <h3>🔐 Vos identifiants de connexion</h3>
                    <p><strong>Email :</strong> ${safeEmployeeEmail}</p>
                    <p><strong>Mot de passe :</strong></p>
                    <div class="password">${safePassword}</div>
                    <p><em>💡 Conservez ces identifiants en lieu sûr</em></p>
                </div>
                
                <div style="text-align: center;">
                    <a href="${safeLoginUrl}" class="login-button">🚀 Se connecter maintenant</a>
                </div>
                
                <div class="security-note">
                    <h3>🔒 Sécurité</h3>
                    <p>• Gardez vos identifiants confidentiels<br>
                    • Ne partagez jamais votre mot de passe<br>
                    • Déconnectez-vous après utilisation</p>
                </div>
            </div>
            
            <div class="footer">
                <p>Cet email a été envoyé automatiquement par le système de gestion de la boulangerie.</p>
                <p>Si vous n'avez pas demandé ces identifiants, contactez votre administrateur.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Générer le texte pour l'email mot de passe salarié
  generateEmployeePasswordText(params = {}) {
    // Extraire les paramètres avec destructuration et valeurs par défaut
    const {
      employeeName = 'Employé',
      employeeEmail = 'Email non défini - contactez votre administrateur',
      password = 'Non généré',
      loginUrl = 'https://www.filmara.fr/plan/salarie-connexion.html'
    } = params || {};
    
    // S'assurer que toutes les valeurs sont des chaînes et non undefined/null/empty
    const safeEmployeeName = (employeeName && String(employeeName).trim()) || 'Employé';
    const safeEmployeeEmail = (employeeEmail && String(employeeEmail).trim()) || 'Email non défini - contactez votre administrateur';
    const safePassword = (password && String(password).trim()) || 'Non généré';
    const safeLoginUrl = (loginUrl && String(loginUrl).trim()) || 'https://www.filmara.fr/plan/salarie-connexion.html';
    
    return `
VOS IDENTIFIANTS DE CONNEXION - ${safeEmployeeName}

Bonjour ${safeEmployeeName},

Votre administrateur vous a créé un compte pour accéder aux services en ligne de la boulangerie.

🎯 POURQUOI SE CONNECTER ?
En vous connectant, vous pourrez :
- Déclarer vos arrêts maladie directement en ligne
- Demander vos congés de manière simple et rapide
- Accéder à vos informations depuis n'importe où
- Gagner du temps en évitant les formulaires papier

🔐 VOS IDENTIFIANTS DE CONNEXION
Email : ${safeEmployeeEmail}
Mot de passe : ${safePassword}

💡 Conservez ces identifiants en lieu sûr

🚀 SE CONNECTER
Cliquez sur ce lien pour vous connecter : ${safeLoginUrl}

🔒 SÉCURITÉ
- Gardez vos identifiants confidentiels
- Ne partagez jamais votre mot de passe
- Déconnectez-vous après utilisation

---
Cet email a été envoyé automatiquement par le système de gestion de la boulangerie.
Si vous n'avez pas demandé ces identifiants, contactez votre administrateur.
    `;
  }

  // Envoyer un email de rejet de demande de congés
  async sendVacationRequestRejection(vacationRequest, rejectedBy, reason) {
    try {
      console.log('📧 Envoi email rejet congés à:', vacationRequest.employeeEmail);
      
      const subject = `❌ Demande de congés rejetée - ${vacationRequest.employeeName}`;
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; border-radius: 8px; padding: 30px; text-align: center;">
            <h2 style="color: #dc3545; margin-bottom: 20px;">❌ Demande de congés rejetée</h2>
            
            <p>Bonjour ${vacationRequest.employeeName},</p>
            
            <div style="background: white; border-radius: 5px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Détails de votre demande :</h3>
              <p><strong>Période :</strong> ${new Date(vacationRequest.startDate).toLocaleDateString('fr-FR')} - ${new Date(vacationRequest.endDate).toLocaleDateString('fr-FR')}</p>
              <p><strong>Durée :</strong> ${vacationRequest.duration} jours</p>
              <p><strong>Type :</strong> ${vacationRequest.reason}</p>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
              <h3 style="color: #856404; margin-top: 0;">Raison du rejet :</h3>
              <p style="margin: 0;">${reason || 'Aucune raison spécifiée'}</p>
            </div>
            
            <p>Si vous avez des questions, n'hésitez pas à contacter votre responsable.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
              <p>Rejeté par : ${rejectedBy}</p>
              <p>Date : ${new Date().toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
        </div>
      `;
      
      const textContent = `
DEMANDE DE CONGÉS REJETÉE - ${vacationRequest.employeeName}

Bonjour ${vacationRequest.employeeName},

Votre demande de congés a été rejetée.

DÉTAILS DE VOTRE DEMANDE :
- Période : ${new Date(vacationRequest.startDate).toLocaleDateString('fr-FR')} - ${new Date(vacationRequest.endDate).toLocaleDateString('fr-FR')}
- Durée : ${vacationRequest.duration} jours
- Type : ${vacationRequest.reason}

RAISON DU REJET :
${reason || 'Aucune raison spécifiée'}

Si vous avez des questions, n'hésitez pas à contacter votre responsable.

Rejeté par : ${rejectedBy}
Date : ${new Date().toLocaleDateString('fr-FR')}
      `;
      
      const result = await this.sendViaEmailJS(vacationRequest.employeeEmail, subject, htmlContent, textContent);
      console.log('✅ Email rejet congés envoyé:', result);
      
      return {
        success: true,
        messageId: result,
        email: vacationRequest.employeeEmail
      };
    } catch (error) {
      console.error('❌ Erreur envoi email rejet congés:', error);
      throw error;
    }
  }
  // Envoyer un email de notification de document personnel
  async sendDocumentNotification(employeeEmail, employeeName, documentTitle, documentCategory) {
    const subject = `📄 Nouveau document disponible - ${documentTitle}`;
    
    const categoryLabels = {
      'payslip': 'Fiche de paie',
      'contract': 'Contrat',
      'notice': 'Notice',
      'procedure': 'Procédure',
      'formation': 'Formation',
      'regulation': 'Réglementation',
      'other': 'Autre'
    };

    const categoryLabel = categoryLabels[documentCategory] || documentCategory;
    
    // Obtenir l'URL du dashboard selon l'environnement (Longuenesse ou Arras)
    const dashboardUrl = this.getEmployeeDashboardUrl();
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">📄 Nouveau Document Disponible</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #dee2e6;">
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Bonjour <strong>${employeeName}</strong>,
          </p>
          
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Un nouveau document a été mis à disposition dans votre espace personnel :
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">📄 ${documentTitle}</h3>
            <p style="margin: 0; color: #666; font-size: 14px;">Catégorie : <strong>${categoryLabel}</strong></p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              🔗 Accéder à mon espace personnel
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Vous pouvez télécharger ce document depuis votre tableau de bord personnel.
          </p>
          
          <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #999; text-align: center;">
            Cet email a été envoyé automatiquement par le système de gestion des documents.<br>
            Si vous avez des questions, contactez votre responsable.
          </p>
        </div>
      </div>
    `;

    const textContent = `
      Nouveau Document Disponible - ${documentTitle}
      
      Bonjour ${employeeName},
      
      Un nouveau document a été mis à disposition dans votre espace personnel :
      
      Document: ${documentTitle}
      Catégorie: ${categoryLabel}
      
      Vous pouvez télécharger ce document depuis votre tableau de bord personnel.
      
      Lien: ${dashboardUrl}
      
      ---
      Boulangerie Ange - Arras
      Système de gestion des documents
    `;

    return await this.sendEmail(employeeEmail, subject, htmlContent, textContent);
  }

  // Envoyer un email de notification de document général
  async sendGeneralDocumentNotification(employeeEmail, employeeName, documentTitle, documentCategory) {
    const subject = `📄 Nouveau document général disponible - ${documentTitle}`;
    
    const categoryLabels = {
      'payslip': 'Fiche de paie',
      'contract': 'Contrat',
      'notice': 'Notice',
      'procedure': 'Procédure',
      'formation': 'Formation',
      'regulation': 'Réglementation',
      'other': 'Autre'
    };

    const categoryLabel = categoryLabels[documentCategory] || documentCategory;
    
    // Obtenir l'URL du dashboard selon l'environnement (Longuenesse ou Arras)
    const dashboardUrl = this.getEmployeeDashboardUrl();
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">📄 Nouveau Document Général</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #dee2e6;">
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Bonjour <strong>${employeeName}</strong>,
          </p>
          
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Un nouveau document général a été mis à disposition pour tous les salariés :
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">📄 ${documentTitle}</h3>
            <p style="margin: 0; color: #666; font-size: 14px;">Catégorie : <strong>${categoryLabel}</strong></p>
            <p style="margin: 5px 0 0 0; color: #28a745; font-size: 12px; font-weight: bold;">📢 Document général - Visible par tous les salariés</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" 
               style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              🔗 Accéder à mon espace personnel
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Vous pouvez télécharger ce document depuis votre tableau de bord personnel.
          </p>
          
          <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #999; text-align: center;">
            Cet email a été envoyé automatiquement par le système de gestion des documents.<br>
            Si vous avez des questions, contactez votre responsable.
          </p>
        </div>
      </div>
    `;

    const textContent = `
      Nouveau Document Général - ${documentTitle}
      
      Bonjour ${employeeName},
      
      Un nouveau document général a été mis à disposition pour tous les salariés :
      
      Document: ${documentTitle}
      Catégorie: ${categoryLabel}
      Type: Document général - Visible par tous les salariés
      
      Vous pouvez télécharger ce document depuis votre tableau de bord personnel.
      
      Lien: ${dashboardUrl}
      
      ---
      Boulangerie Ange - Arras
      Système de gestion des documents
    `;

    return await this.sendEmail(employeeEmail, subject, htmlContent, textContent);
  }

  // Envoyer un email de test
  async sendTestEmail(toEmail) {
    return await this.sendDocumentNotification(
      toEmail,
      'Utilisateur Test',
      'Document de test',
      'other'
    );
  }

  // Envoyer confirmation demande d'acompte au salarié
  async sendAdvanceRequestConfirmation(employeeEmail, employeeName, amount, deductionMonth) {
    try {
      // Récupérer le template depuis la base de données
      const EmailTemplate = require('../models/EmailTemplate');
      const template = await EmailTemplate.findOne({ name: 'advance_request_employee' });
      
      if (!template) {
        console.log('⚠️ Template de confirmation acompte non trouvé, utilisation du template par défaut');
        return await this.sendEmail(
          employeeEmail,
          `Demande d'acompte confirmée - ${amount}€`,
          `<p>Bonjour ${employeeName},<br>Votre demande d'acompte de ${amount}€ a été reçue. La déduction se fera sur ${deductionMonth}.</p>`,
          `Bonjour ${employeeName},\n\nVotre demande d'acompte de ${amount}€ a été reçue. La déduction se fera sur ${deductionMonth}.`
        );
      }

      // Obtenir l'URL du dashboard selon l'environnement (Longuenesse ou Arras)
      const dashboardUrl = this.getEmployeeDashboardUrl();
      
      console.log('📧 sendAdvanceRequestConfirmation - URLs:', {
        corsOrigin: process.env.CORS_ORIGIN,
        dashboardUrl: dashboardUrl,
        templateName: template.name,
        templateHtmlContainsDashboardUrl: template.htmlContent.includes('{{dashboard_url}}'),
        templateHtmlContainsPlan: template.htmlContent.includes('/plan/'),
        templateHtmlContainsLon: template.htmlContent.includes('/lon/')
      });
      
      // Remplacer les variables dans le template
      let htmlContent = this.replaceTemplateVariables(template.htmlContent, {
        to_name: employeeName,
        amount: amount,
        deduction_month: deductionMonth,
        request_date: new Date().toLocaleDateString('fr-FR'),
        dashboard_url: dashboardUrl
      });
      
      let textContent = this.replaceTemplateVariables(template.textContent, {
        to_name: employeeName,
        amount: amount,
        deduction_month: deductionMonth,
        request_date: new Date().toLocaleDateString('fr-FR'),
        dashboard_url: dashboardUrl
      });
      
      console.log('✅ sendAdvanceRequestConfirmation - Contenu final:', {
        htmlContainsPlan: htmlContent.includes('/plan/'),
        htmlContainsLon: htmlContent.includes('/lon/'),
        textContainsPlan: textContent.includes('/plan/'),
        textContainsLon: textContent.includes('/lon/')
      });
      
      return await this.sendEmail(
        employeeEmail,
        this.replaceTemplateVariables(template.subject, { amount: amount }),
        htmlContent,
        textContent
      );
    } catch (error) {
      console.error('❌ Erreur envoi confirmation demande acompte:', error.message);
      return { success: false, message: error.message };
    }
  }

  // Envoyer notification demande d'acompte au manager
  async sendAdvanceRequestNotification(managerEmail, managerName, employeeName, amount, deductionMonth, comment) {
    try {
      // Récupérer le template depuis la base de données
      const EmailTemplate = require('../models/EmailTemplate');
      const template = await EmailTemplate.findOne({ name: 'advance_request_manager' });
      
      if (!template) {
        console.log('⚠️ Template de notification acompte non trouvé, utilisation du template par défaut');
        return await this.sendEmail(
          managerEmail,
          `Nouvelle demande d'acompte - ${employeeName} - ${amount}€`,
          `<p>Bonjour ${managerName},<br>Une nouvelle demande d'acompte de ${amount}€ de ${employeeName} nécessite votre attention.</p>`,
          `Bonjour ${managerName},\n\nUne nouvelle demande d'acompte de ${amount}€ de ${employeeName} nécessite votre attention.`
        );
      }

      // Obtenir l'URL admin selon l'environnement (Longuenesse ou Arras)
      const adminUrl = this.getAdminUrl('/advance-requests');
      
      console.log('📧 sendAdvanceRequestNotification - URLs:', {
        corsOrigin: process.env.CORS_ORIGIN,
        adminUrl: adminUrl,
        templateName: template.name,
        templateHtmlContainsAdminUrl: template.htmlContent.includes('{{admin_url}}'),
        templateHtmlContainsPlan: template.htmlContent.includes('/plan/'),
        templateHtmlContainsLon: template.htmlContent.includes('/lon/')
      });
      
      // Remplacer les variables dans le template
      let htmlContent = this.replaceTemplateVariables(template.htmlContent, {
        to_name: managerName,
        employee_name: employeeName,
        amount: amount,
        deduction_month: deductionMonth,
        comment: comment || 'Aucun commentaire',
        request_date: new Date().toLocaleDateString('fr-FR'),
        admin_url: adminUrl
      });
      
      let textContent = this.replaceTemplateVariables(template.textContent, {
        to_name: managerName,
        employee_name: employeeName,
        amount: amount,
        deduction_month: deductionMonth,
        comment: comment || 'Aucun commentaire',
        request_date: new Date().toLocaleDateString('fr-FR'),
        admin_url: adminUrl
      });
      
      console.log('✅ sendAdvanceRequestNotification - Contenu final:', {
        htmlContainsPlan: htmlContent.includes('/plan/'),
        htmlContainsLon: htmlContent.includes('/lon/'),
        textContainsPlan: textContent.includes('/plan/'),
        textContainsLon: textContent.includes('/lon/')
      });
      
      return await this.sendEmail(
        managerEmail,
        this.replaceTemplateVariables(template.subject, { employee_name: employeeName, amount: amount }),
        htmlContent,
        textContent
      );
    } catch (error) {
      console.error('❌ Erreur envoi notification demande acompte:', error.message);
      return { success: false, message: error.message };
    }
  }

  // Envoyer confirmation d'approbation d'acompte
  async sendAdvanceApproved(employeeEmail, employeeName, amount, deductionMonth, managerComment) {
    try {
      // Récupérer le template depuis la base de données
      const EmailTemplate = require('../models/EmailTemplate');
      const template = await EmailTemplate.findOne({ name: 'advance_approved' });
      
      if (!template) {
        console.log('⚠️ Template d\'approbation acompte non trouvé, utilisation du template par défaut');
        return await this.sendEmail(
          employeeEmail,
          `Demande d'acompte approuvée - ${amount}€`,
          `<p>Bonjour ${employeeName},<br>Votre demande d'acompte de ${amount}€ a été approuvée. La déduction se fera sur ${deductionMonth}.</p>`,
          `Bonjour ${employeeName},\n\nVotre demande d'acompte de ${amount}€ a été approuvée. La déduction se fera sur ${deductionMonth}.`
        );
      }

      // Obtenir l'URL du dashboard selon l'environnement (Longuenesse ou Arras)
      const dashboardUrl = this.getEmployeeDashboardUrl();
      
      console.log('📧 sendAdvanceApproved - URLs:', {
        corsOrigin: process.env.CORS_ORIGIN,
        dashboardUrl: dashboardUrl,
        templateName: template.name,
        templateHtmlContainsDashboardUrl: template.htmlContent.includes('{{dashboard_url}}'),
        templateHtmlContainsPlan: template.htmlContent.includes('/plan/'),
        templateHtmlContainsLon: template.htmlContent.includes('/lon/')
      });
      
      // Remplacer les variables dans le template
      let htmlContent = this.replaceTemplateVariables(template.htmlContent, {
        to_name: employeeName,
        amount: amount,
        deduction_month: deductionMonth,
        manager_comment: managerComment || 'Aucun commentaire',
        approval_date: new Date().toLocaleDateString('fr-FR'),
        dashboard_url: dashboardUrl
      });

      let textContent = this.replaceTemplateVariables(template.textContent, {
        to_name: employeeName,
        amount: amount,
        deduction_month: deductionMonth,
        manager_comment: managerComment || 'Aucun commentaire',
        approval_date: new Date().toLocaleDateString('fr-FR'),
        dashboard_url: dashboardUrl
      });
      
      console.log('✅ sendAdvanceApproved - Contenu final:', {
        htmlContainsPlan: htmlContent.includes('/plan/'),
        htmlContainsLon: htmlContent.includes('/lon/'),
        textContainsPlan: textContent.includes('/plan/'),
        textContainsLon: textContent.includes('/lon/'),
        dashboardUrlInHtml: htmlContent.includes(dashboardUrl)
      });
      
      return await this.sendEmail(
        employeeEmail,
        this.replaceTemplateVariables(template.subject, { amount: amount }),
        htmlContent,
        textContent
      );
    } catch (error) {
      console.error('❌ Erreur envoi confirmation approbation:', error.message);
      return { success: false, message: error.message };
    }
  }

  // Envoyer notification de rejet d'acompte
  async sendAdvanceRejected(employeeEmail, employeeName, amount, deductionMonth, managerComment) {
    try {
      // Récupérer le template depuis la base de données
      const EmailTemplate = require('../models/EmailTemplate');
      const template = await EmailTemplate.findOne({ name: 'advance_rejected' });
      
      if (!template) {
        console.log('⚠️ Template de rejet acompte non trouvé, utilisation du template par défaut');
        return await this.sendEmail(
          employeeEmail,
          `Demande d'acompte refusée - ${amount}€`,
          `<p>Bonjour ${employeeName},<br>Votre demande d'acompte de ${amount}€ a été refusée. Raison : ${managerComment || 'Non spécifiée'}.</p>`,
          `Bonjour ${employeeName},\n\nVotre demande d'acompte de ${amount}€ a été refusée. Raison : ${managerComment || 'Non spécifiée'}.`
        );
      }

      // Obtenir l'URL du dashboard selon l'environnement (Longuenesse ou Arras)
      const dashboardUrl = this.getEmployeeDashboardUrl();
      
      // Remplacer les variables dans le template
      const htmlContent = this.replaceTemplateVariables(template.htmlContent, {
        to_name: employeeName,
        amount: amount,
        deduction_month: deductionMonth,
        manager_comment: managerComment || 'Aucun commentaire',
        rejection_date: new Date().toLocaleDateString('fr-FR'),
        dashboard_url: dashboardUrl
      });

      const textContent = this.replaceTemplateVariables(template.textContent, {
        to_name: employeeName,
        amount: amount,
        deduction_month: deductionMonth,
        manager_comment: managerComment || 'Aucun commentaire',
        rejection_date: new Date().toLocaleDateString('fr-FR'),
        dashboard_url: dashboardUrl
      });
      
      return await this.sendEmail(
        employeeEmail,
        this.replaceTemplateVariables(template.subject, { amount: amount }),
        htmlContent,
        textContent
      );
    } catch (error) {
      console.error('❌ Erreur envoi notification rejet:', error.message);
      return { success: false, message: error.message };
    }
  }

  // Envoyer un accusé de réception de justificatif mutuelle
  async sendMutuelleAcknowledgement(mutuelle) {
    try {
      console.log(`📧 Envoi accusé de réception mutuelle à ${mutuelle.employeeName} (${mutuelle.employeeEmail})`);
      
      const EmailTemplate = require('../models/EmailTemplate');
      const template = await EmailTemplate.findOne({ name: 'mutuelle_acknowledgement' });
      
      if (!template) {
        return await this.sendEmail(
          mutuelle.employeeEmail,
          `Accusé de réception - Justificatif mutuelle de ${mutuelle.employeeName}`,
          `<p>Bonjour ${mutuelle.employeeName},<br><br>Nous avons bien reçu votre justificatif de mutuelle personnelle.<br>Il sera examiné par l'administration dans les plus brefs délais.<br><br>Cordialement</p>`,
          `Bonjour ${mutuelle.employeeName},\n\nNous avons bien reçu votre justificatif de mutuelle personnelle.\nIl sera examiné par l'administration dans les plus brefs délais.\n\nCordialement`
        );
      }

      const htmlContent = this.replaceTemplateVariables(template.htmlContent, {
        employeeName: mutuelle.employeeName,
        uploadDate: new Date(mutuelle.uploadDate).toLocaleDateString('fr-FR'),
        fileName: mutuelle.originalFileName || mutuelle.fileName
      });

      const textContent = this.replaceTemplateVariables(template.textContent, {
        employeeName: mutuelle.employeeName,
        uploadDate: new Date(mutuelle.uploadDate).toLocaleDateString('fr-FR'),
        fileName: mutuelle.originalFileName || mutuelle.fileName
      });
      
      return await this.sendEmail(
        mutuelle.employeeEmail,
        this.replaceTemplateVariables(template.subject, { employeeName: mutuelle.employeeName }),
        htmlContent,
        textContent
      );
    } catch (error) {
      console.error('❌ Erreur envoi accusé de réception mutuelle:', error.message);
      return { success: false, message: error.message };
    }
  }

  // Envoyer une alerte mutuelle aux administrateurs
  async sendMutuelleAlert(mutuelle, recipientEmails) {
    try {
      const EmailTemplate = require('../models/EmailTemplate');
      const template = await EmailTemplate.findOne({ name: 'mutuelle_alert' });
      
      if (!template) {
        return await this.sendEmail(
          recipientEmails.join(', '),
          `🚨 Nouveau justificatif mutuelle à valider - ${mutuelle.employeeName}`,
          `<p>Un nouveau justificatif de mutuelle personnelle a été déposé par ${mutuelle.employeeName} (${mutuelle.employeeEmail}).<br>Merci de le valider sur <a href="https://www.filmara.fr/plan/mutuelle-management">la page de gestion des mutuelles</a>.</p>`,
          `Un nouveau justificatif de mutuelle personnelle a été déposé par ${mutuelle.employeeName} (${mutuelle.employeeEmail}).\nMerci de le valider sur https://www.filmara.fr/plan/mutuelle-management`
        );
      }

      const htmlContent = this.replaceTemplateVariables(template.htmlContent, {
        employeeName: mutuelle.employeeName,
        employeeEmail: mutuelle.employeeEmail,
        fileName: mutuelle.fileName,
        uploadDate: new Date(mutuelle.uploadDate).toLocaleDateString('fr-FR'),
        adminUrl: 'https://www.filmara.fr/plan'
      });

      const textContent = this.replaceTemplateVariables(template.textContent, {
        employeeName: mutuelle.employeeName,
        employeeEmail: mutuelle.employeeEmail,
        fileName: mutuelle.fileName,
        uploadDate: new Date(mutuelle.uploadDate).toLocaleDateString('fr-FR'),
        adminUrl: 'https://www.filmara.fr/plan'
      });
      
      return await this.sendEmail(
        recipientEmails.join(', '),
        this.replaceTemplateVariables(template.subject, { employeeName: mutuelle.employeeName }),
        htmlContent,
        textContent
      );
    } catch (error) {
      console.error('❌ Erreur envoi alerte mutuelle:', error.message);
      return { success: false, message: error.message };
    }
  }

  // Envoyer une validation de justificatif mutuelle
  async sendMutuelleValidation(mutuelle, validatedBy) {
    try {
      const EmailTemplate = require('../models/EmailTemplate');
      const template = await EmailTemplate.findOne({ name: 'mutuelle_validation' });
      
      if (!template) {
        return await this.sendEmail(
          mutuelle.employeeEmail,
          `Justificatif mutuelle validé - ${mutuelle.employeeName}`,
          `<p>Bonjour ${mutuelle.employeeName},<br><br>Votre justificatif de mutuelle personnelle a été validé par ${validatedBy}.<br>Tout est conforme.<br><br>Cordialement</p>`,
          `Bonjour ${mutuelle.employeeName},\n\nVotre justificatif de mutuelle personnelle a été validé par ${validatedBy}.\nTout est conforme.\n\nCordialement`
        );
      }

      const htmlContent = this.replaceTemplateVariables(template.htmlContent, {
        employeeName: mutuelle.employeeName,
        validatedBy: validatedBy,
        validationDate: new Date().toLocaleDateString('fr-FR'),
        expirationDate: mutuelle.expirationDate ? new Date(mutuelle.expirationDate).toLocaleDateString('fr-FR') : 'Non définie'
      });

      const textContent = this.replaceTemplateVariables(template.textContent, {
        employeeName: mutuelle.employeeName,
        validatedBy: validatedBy,
        validationDate: new Date().toLocaleDateString('fr-FR'),
        expirationDate: mutuelle.expirationDate ? new Date(mutuelle.expirationDate).toLocaleDateString('fr-FR') : 'Non définie'
      });
      
      return await this.sendEmail(
        mutuelle.employeeEmail,
        this.replaceTemplateVariables(template.subject, { employeeName: mutuelle.employeeName }),
        htmlContent,
        textContent
      );
    } catch (error) {
      console.error('❌ Erreur envoi validation mutuelle:', error.message);
      return { success: false, message: error.message };
    }
  }

  // Envoyer un rejet de justificatif mutuelle
  async sendMutuelleRejection(mutuelle, reason, rejectedBy) {
    try {
      const EmailTemplate = require('../models/EmailTemplate');
      const template = await EmailTemplate.findOne({ name: 'mutuelle_rejection' });
      
      if (!template) {
        return await this.sendEmail(
          mutuelle.employeeEmail,
          `Justificatif mutuelle rejeté - ${mutuelle.employeeName}`,
          `<p>Bonjour ${mutuelle.employeeName},<br><br>Votre justificatif de mutuelle personnelle a été rejeté par ${rejectedBy}.<br>Raison : ${reason}<br>Merci de déposer un nouveau justificatif lisible.<br><br>Cordialement</p>`,
          `Bonjour ${mutuelle.employeeName},\n\nVotre justificatif de mutuelle personnelle a été rejeté par ${rejectedBy}.\nRaison : ${reason}\nMerci de déposer un nouveau justificatif lisible.\n\nCordialement`
        );
      }

      const htmlContent = this.replaceTemplateVariables(template.htmlContent, {
        employeeName: mutuelle.employeeName,
        rejectionReason: reason,
        rejectedBy: rejectedBy,
        rejectionDate: new Date().toLocaleDateString('fr-FR')
      });

      const textContent = this.replaceTemplateVariables(template.textContent, {
        employeeName: mutuelle.employeeName,
        rejectionReason: reason,
        rejectedBy: rejectedBy,
        rejectionDate: new Date().toLocaleDateString('fr-FR')
      });
      
      return await this.sendEmail(
        mutuelle.employeeEmail,
        this.replaceTemplateVariables(template.subject, { employeeName: mutuelle.employeeName }),
        htmlContent,
        textContent
      );
    } catch (error) {
      console.error('❌ Erreur envoi rejet mutuelle:', error.message);
      return { success: false, message: error.message };
    }
  }

  // Envoyer un rappel pour la mise à jour du justificatif mutuelle
  async sendMutuelleReminder(mutuelle) {
    try {
      const EmailTemplate = require('../models/EmailTemplate');
      const template = await EmailTemplate.findOne({ name: 'mutuelle_reminder' });
      
      // Obtenir l'URL du dashboard selon l'environnement (Longuenesse ou Arras)
      const dashboardUrl = this.getEmployeeDashboardUrl();
      
      if (!template) {
        const expirationDate = mutuelle.expirationDate ? new Date(mutuelle.expirationDate).toLocaleDateString('fr-FR') : 'bientôt';
        return await this.sendEmail(
          mutuelle.employeeEmail,
          `Rappel - Mise à jour de votre justificatif mutuelle`,
          `<p>Bonjour ${mutuelle.employeeName},<br><br>Votre justificatif de mutuelle personnelle expire le ${expirationDate}.<br>Merci de déposer un nouveau justificatif à jour sur <a href="${dashboardUrl}">votre espace salarié</a>.<br><br>Cordialement</p>`,
          `Bonjour ${mutuelle.employeeName},\n\nVotre justificatif de mutuelle personnelle expire le ${expirationDate}.\nMerci de déposer un nouveau justificatif à jour sur ${dashboardUrl}\n\nCordialement`
        );
      }

      const expirationDate = mutuelle.expirationDate ? new Date(mutuelle.expirationDate).toLocaleDateString('fr-FR') : 'bientôt';
      const htmlContent = this.replaceTemplateVariables(template.htmlContent, {
        employeeName: mutuelle.employeeName,
        expirationDate: expirationDate,
        dashboardUrl: dashboardUrl
      });

      const textContent = this.replaceTemplateVariables(template.textContent, {
        employeeName: mutuelle.employeeName,
        expirationDate: expirationDate,
        dashboardUrl: dashboardUrl
      });
      
      return await this.sendEmail(
        mutuelle.employeeEmail,
        this.replaceTemplateVariables(template.subject, { employeeName: mutuelle.employeeName }),
        htmlContent,
        textContent
      );
    } catch (error) {
      console.error('❌ Erreur envoi rappel mutuelle:', error.message);
      return { success: false, message: error.message };
    }
  }
}

// Instance singleton
const emailServiceAlternative = new EmailServiceAlternative();

module.exports = emailServiceAlternative;
