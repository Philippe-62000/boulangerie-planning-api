const EmailTemplate = require('../models/EmailTemplate');

// Obtenir tous les templates d'email
exports.getAllEmailTemplates = async (req, res) => {
  try {
    const templates = await EmailTemplate.find({ isActive: true }).sort({ name: 1 });
    res.json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des templates:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des templates d\'email'
    });
  }
};

// Obtenir un template d'email par ID
exports.getEmailTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await EmailTemplate.findById(id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template d\'email non trouvé'
      });
    }
    
    res.json({
      success: true,
      template
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du template:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du template d\'email'
    });
  }
};

// Créer un nouveau template d'email
exports.createEmailTemplate = async (req, res) => {
  try {
    const { name, displayName, subject, htmlContent, textContent, description, variables } = req.body;
    
    // Vérifier si un template avec ce nom existe déjà
    const existingTemplate = await EmailTemplate.findOne({ name });
    if (existingTemplate) {
      return res.status(400).json({
        success: false,
        error: 'Un template avec ce nom existe déjà'
      });
    }
    
    const template = new EmailTemplate({
      name,
      displayName,
      subject,
      htmlContent,
      textContent,
      description,
      variables: variables || []
    });
    
    await template.save();
    
    res.status(201).json({
      success: true,
      message: 'Template d\'email créé avec succès',
      template
    });
  } catch (error) {
    console.error('❌ Erreur lors de la création du template:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création du template d\'email'
    });
  }
};

// Mettre à jour un template d'email
exports.updateEmailTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { displayName, subject, htmlContent, textContent, description, variables } = req.body;
    
    const template = await EmailTemplate.findById(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template d\'email non trouvé'
      });
    }
    
    // Mettre à jour les champs
    template.displayName = displayName || template.displayName;
    template.subject = subject || template.subject;
    template.htmlContent = htmlContent || template.htmlContent;
    template.textContent = textContent || template.textContent;
    template.description = description || template.description;
    template.variables = variables || template.variables;
    template.updatedAt = new Date();
    
    await template.save();
    
    res.json({
      success: true,
      message: 'Template d\'email mis à jour avec succès',
      template
    });
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du template:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du template d\'email'
    });
  }
};

// Supprimer un template d'email
exports.deleteEmailTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    
    const template = await EmailTemplate.findById(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template d\'email non trouvé'
      });
    }
    
    // Marquer comme inactif au lieu de supprimer
    template.isActive = false;
    await template.save();
    
    res.json({
      success: true,
      message: 'Template d\'email supprimé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du template:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression du template d\'email'
    });
  }
};

// Initialiser les templates par défaut
exports.initializeDefaultTemplates = async (req, res) => {
  try {
    const defaultTemplates = [
      {
        name: 'sick_leave_acknowledgement',
        displayName: 'Email d\'Accusé de Réception d\'Arrêt Maladie',
        subject: 'Accusé de réception - Arrêt maladie de {{employeeName}}',
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
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
      <p>Bonjour <strong>{{employeeName}}</strong>,</p>
      
      <p>Nous accusons réception de votre arrêt maladie qui a été déposé le <strong>{{uploadDate}} à {{uploadTime}}</strong>.</p>
      
      <div class="info-box">
        <h3>📋 Informations de votre arrêt maladie :</h3>
        <ul>
          <li><strong>Date de début :</strong> {{startDate}}</li>
          <li><strong>Date de fin :</strong> {{endDate}}</li>
          <li><strong>Durée :</strong> {{duration}} jour{{durationPlural}}</li>
          <li><strong>Document déposé :</strong> {{fileName}}</li>
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
</html>`,
        textContent: `
Accusé de réception - Votre arrêt maladie a bien été reçu

Bonjour {{employeeName}},

Nous accusons réception de votre arrêt maladie qui a été déposé le {{uploadDate}} à {{uploadTime}}.

Informations de votre arrêt maladie :
- Date de début : {{startDate}}
- Date de fin : {{endDate}}
- Durée : {{duration}} jour{{durationPlural}}
- Document déposé : {{fileName}}

Votre arrêt maladie va être traité dans les plus brefs délais par notre équipe administrative.

Vous recevrez une notification par email dès que votre arrêt maladie aura été validé ou si des informations complémentaires sont nécessaires.

En cas de question, n'hésitez pas à nous contacter.

Cordialement,
L'équipe de la Boulangerie Ange - Arras

---
Cet email est envoyé automatiquement, merci de ne pas y répondre.`,
        description: 'Email d\'accusé de réception envoyé automatiquement au salarié lors du dépôt d\'un arrêt maladie',
        variables: [
          { name: 'employeeName', description: 'Nom du salarié', example: 'Marie Dupont' },
          { name: 'startDate', description: 'Date de début de l\'arrêt', example: '15/09/2025' },
          { name: 'endDate', description: 'Date de fin de l\'arrêt', example: '20/09/2025' },
          { name: 'duration', description: 'Durée en jours', example: '6' },
          { name: 'durationPlural', description: 'S pour le pluriel', example: 's' },
          { name: 'fileName', description: 'Nom du fichier déposé', example: 'arret_maladie.pdf' },
          { name: 'uploadDate', description: 'Date de dépôt', example: '12/09/2025' },
          { name: 'uploadTime', description: 'Heure de dépôt', example: '14:30' }
        ]
      },
      {
        name: 'sick_leave_alert',
        displayName: 'Email d\'Alerte - Nouvel Arrêt Maladie',
        subject: '🚨 Nouvel arrêt maladie à valider - {{employeeName}}',
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ff6b6b; color: white; padding: 20px; text-align: center; }
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
      <h1>🚨 Nouvel Arrêt Maladie à Valider</h1>
      <p>Boulangerie Ange - Arras</p>
    </div>
    
    <div class="content">
      <p>Un nouvel arrêt maladie a été déposé et nécessite votre validation.</p>
      
      <div class="alert-box">
        <h3>⚠️ Action Requise</h3>
        <p>Veuillez valider ou rejeter cet arrêt maladie dans les plus brefs délais.</p>
      </div>
      
      <div class="details">
        <h3>📋 Informations de l'arrêt :</h3>
        <ul>
          <li><strong>Salarié :</strong> {{employeeName}}</li>
          <li><strong>Email :</strong> {{employeeEmail}}</li>
          <li><strong>Période :</strong> {{startDate}} au {{endDate}}</li>
          <li><strong>Durée :</strong> {{duration}} jour{{durationPlural}}</li>
          <li><strong>Fichier :</strong> {{fileName}}</li>
          <li><strong>Date de dépôt :</strong> {{uploadDate}}</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 20px 0;">
        <a href="{{adminUrl}}" class="action-button">🔍 Valider l'Arrêt Maladie</a>
      </div>
      
      <p>Merci de traiter cette demande rapidement.</p>
    </div>
    
    <div class="footer">
      <p>Boulangerie Ange - Arras</p>
      <p>Ce message a été généré automatiquement.</p>
    </div>
  </div>
</body>
</html>`,
        textContent: `
🚨 NOUVEL ARRÊT MALADIE À VALIDER
Boulangerie Ange - Arras

Un nouvel arrêt maladie a été déposé et nécessite votre validation.

⚠️ ACTION REQUISE
Veuillez valider ou rejeter cet arrêt maladie dans les plus brefs délais.

📋 INFORMATIONS DE L'ARRÊT :
- Salarié : {{employeeName}}
- Email : {{employeeEmail}}
- Période : {{startDate}} au {{endDate}}
- Durée : {{duration}} jour{{durationPlural}}
- Fichier : {{fileName}}
- Date de dépôt : {{uploadDate}}

🔍 Pour valider : {{adminUrl}}

Merci de traiter cette demande rapidement.

Boulangerie Ange - Arras
Ce message a été généré automatiquement.`,
        description: 'Email d\'alerte envoyé aux administrateurs lors du dépôt d\'un nouvel arrêt maladie',
        variables: [
          { name: 'employeeName', description: 'Nom du salarié', example: 'Marie Dupont' },
          { name: 'employeeEmail', description: 'Email du salarié', example: 'marie@email.com' },
          { name: 'startDate', description: 'Date de début de l\'arrêt', example: '15/09/2025' },
          { name: 'endDate', description: 'Date de fin de l\'arrêt', example: '20/09/2025' },
          { name: 'duration', description: 'Durée en jours', example: '6' },
          { name: 'durationPlural', description: 'S pour le pluriel', example: 's' },
          { name: 'fileName', description: 'Nom du fichier', example: 'arret_maladie.pdf' },
          { name: 'uploadDate', description: 'Date de dépôt', example: '12/09/2025' },
          { name: 'adminUrl', description: 'URL de l\'interface admin', example: 'https://www.filmara.fr/admin' }
        ]
      },
      {
        name: 'sick_leave_validation',
        displayName: 'Email de Validation d\'Arrêt Maladie',
        subject: 'Arrêt maladie validé - {{employeeName}}',
        htmlContent: `
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
      <p>Bonjour <strong>{{employeeName}}</strong>,</p>
      
      <p>Votre arrêt maladie a été validé avec succès !</p>
      
      <div class="validation-box">
        <h3>✅ Statut : Validé</h3>
        <p><em>Validé par : {{validatedBy}}</em></p>
      </div>
      
      <div class="details">
        <h3>📋 Détails de votre arrêt :</h3>
        <ul>
          <li><strong>Période :</strong> {{startDate}} au {{endDate}}</li>
          <li><strong>Durée :</strong> {{duration}} jour{{durationPlural}}</li>
          <li><strong>Fichier :</strong> {{fileName}}</li>
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
</html>`,
        textContent: `
ARRÊT MALADIE VALIDÉ
Boulangerie Ange - Arras

Bonjour {{employeeName}},

Votre arrêt maladie a été validé avec succès !

STATUT : Validé
Validé par : {{validatedBy}}

DÉTAILS DE VOTRE ARRÊT :
- Période : {{startDate}} au {{endDate}}
- Durée : {{duration}} jour{{durationPlural}}
- Fichier : {{fileName}}

Votre arrêt maladie sera transmis au comptable dans les plus brefs délais.

Merci pour votre confiance.

Boulangerie Ange - Arras
Ce message a été généré automatiquement.`,
        description: 'Email envoyé aux salariés lors de la validation d\'un arrêt maladie',
        variables: [
          { name: 'employeeName', description: 'Nom du salarié', example: 'Marie Dupont' },
          { name: 'validatedBy', description: 'Nom de la personne qui valide', example: 'Admin' },
          { name: 'startDate', description: 'Date de début de l\'arrêt', example: '15/09/2025' },
          { name: 'endDate', description: 'Date de fin de l\'arrêt', example: '20/09/2025' },
          { name: 'duration', description: 'Durée en jours', example: '6' },
          { name: 'durationPlural', description: 'S pour le pluriel', example: 's' },
          { name: 'fileName', description: 'Nom du fichier', example: 'arret_maladie.pdf' }
        ]
      },
      {
        name: 'sick_leave_rejection',
        displayName: 'Email de Rejet d\'Arrêt Maladie',
        subject: 'Arrêt maladie rejeté - {{employeeName}}',
        htmlContent: `
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
      <p>Bonjour <strong>{{employeeName}}</strong>,</p>
      
      <p>Votre arrêt maladie a été examiné et a dû être rejeté pour les raisons suivantes :</p>
      
      <div class="rejection-box">
        <h3>❌ Raison du rejet :</h3>
        <p><strong>{{rejectionReason}}</strong></p>
        <p><em>Rejeté par : {{rejectedBy}}</em></p>
      </div>
      
      <div class="details">
        <h3>📋 Détails de votre demande :</h3>
        <ul>
          <li><strong>Période :</strong> {{startDate}} au {{endDate}}</li>
          <li><strong>Durée :</strong> {{duration}} jour{{durationPlural}}</li>
          <li><strong>Fichier :</strong> {{fileName}}</li>
          <li><strong>Date d'envoi :</strong> {{uploadDate}}</li>
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
</html>`,
        textContent: `
ARRÊT MALADIE REJETÉ
Boulangerie Ange - Arras

Bonjour {{employeeName}},

Votre arrêt maladie a été examiné et a dû être rejeté pour les raisons suivantes :

RAISON DU REJET :
{{rejectionReason}}
Rejeté par : {{rejectedBy}}

DÉTAILS DE VOTRE DEMANDE :
- Période : {{startDate}} au {{endDate}}
- Durée : {{duration}} jour{{durationPlural}}
- Fichier : {{fileName}}
- Date d'envoi : {{uploadDate}}

Veuillez corriger les éléments mentionnés et renvoyer votre arrêt maladie.

Si vous avez des questions, n'hésitez pas à nous contacter.

Boulangerie Ange - Arras
Ce message a été généré automatiquement.`,
        description: 'Email envoyé aux salariés lors du rejet d\'un arrêt maladie',
        variables: [
          { name: 'employeeName', description: 'Nom du salarié', example: 'Marie Dupont' },
          { name: 'rejectionReason', description: 'Raison du rejet', example: 'Document illisible' },
          { name: 'rejectedBy', description: 'Nom de la personne qui rejette', example: 'Admin' },
          { name: 'startDate', description: 'Date de début de l\'arrêt', example: '15/09/2025' },
          { name: 'endDate', description: 'Date de fin de l\'arrêt', example: '20/09/2025' },
          { name: 'duration', description: 'Durée en jours', example: '6' },
          { name: 'durationPlural', description: 'S pour le pluriel', example: 's' },
          { name: 'fileName', description: 'Nom du fichier', example: 'arret_maladie.pdf' },
          { name: 'uploadDate', description: 'Date d\'envoi', example: '12/09/2025' }
        ]
      },
      {
        name: 'sick_leave_accountant',
        displayName: 'Email au Comptable',
        subject: 'Nouvel arrêt maladie validé - {{employeeName}}',
        htmlContent: `
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
      <h1>📋 Nouvel Arrêt Maladie Vulpinus</h1>
      <p>Boulangerie Ange - Arras</p>
    </div>
    
    <div class="content">
      <p>Voici un nouvel arrêt maladie.</p>
      
      <div class="details">
        <h3>📋 Informations de l'arrêt :</h3>
        <ul>
          <li><strong>Salarié :</strong> {{employeeName}}</li>
          <li><strong>Période :</strong> {{startDate}} au {{endDate}}</li>
          <li><strong>Date d'envoi :</strong> {{uploadDate}}</li>
        </ul>
      </div>
      
      <div class="details">
        <h3>📎 Pièce jointe :</h3>
        <p>Le document d'arrêt maladie est disponible au téléchargement :</p>
        <p style="text-align: center; margin: 20px 0;">
          <a href="{{downloadUrl}}" 
             style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            🔗 Télécharger l'arrêt maladie
          </a>
        </p>
      </div>
      
    </div>
    
    <div class="footer">
      <p>Merci.</p>
      <p>Bien Cordialement</p>
      <p>Ce message a été généré automatiquement par le système de gestion des arrêts maladie.</p>
    </div>
  </div>
</body>
</html>`,
        textContent: `Bonjour,

Veuillez trouver ci-joint un arrêt maladie.

INFORMATIONS DE L'ARRÊT :

- Salarié : {{employeeName}}

- Période : {{startDate}} au {{endDate}}

- Date d'envoi : {{uploadDate}}

PIÈCE JOINTE :

Le document d'arrêt maladie est disponible au téléchargement :

🔗 {{downloadUrl}}

Merci,

Bien Cordialement.`,
        description: 'Email envoyé au comptable lors de la validation d\'un arrêt maladie',
        variables: [
          { name: 'employeeName', description: 'Nom du salarié', example: 'Marie Dupont' },
          { name: 'startDate', description: 'Date de début de l\'arrêt', example: '15/09/2025' },
          { name: 'endDate', description: 'Date de fin de l\'arrêt', example: '20/09/2025' },
          { name: 'uploadDate', description: 'Date d\'envoi', example: '12/09/2025' },
          { name: 'downloadUrl', description: 'URL de téléchargement du document', example: 'https://boulangerie-planning-api-4-pbfy.onrender.com/api/sick-leaves/.../download' }
        ]
      },
      {
        name: 'vacation_request_confirmation',
        displayName: 'Email de Confirmation - Demande de Congés',
        subject: '✅ Confirmation de votre demande de congés - {{employeeName}}',
        htmlContent: `
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
      <h1>🏖️ Demande de Congés Reçue</h1>
      <p>Boulangerie Ange - Arras</p>
    </div>
    
    <div class="content">
      <p>Bonjour {{employeeName}},</p>
      
      <p>Votre demande de congés a été reçue et sera traitée dans les plus brefs délais.</p>
      
      <div class="details">
        <h3>📋 Détails de votre demande :</h3>
        <ul>
          <li><strong>Période :</strong> {{startDate}} au {{endDate}}</li>
          <li><strong>Durée :</strong> {{duration}} jour{{durationPlural}}</li>
          <li><strong>Type :</strong> {{reason}}</li>
          <li><strong>Date de demande :</strong> {{requestDate}}</li>
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
</html>`,
        textContent: `DEMANDE DE CONGÉS REÇUE
Boulangerie Ange - Arras

Bonjour {{employeeName}},

Votre demande de congés a été reçue et sera traitée dans les plus brefs délais.

DÉTAILS DE VOTRE DEMANDE :

- Période : {{startDate}} au {{endDate}}

- Durée : {{duration}} jour{{durationPlural}}

- Type : {{reason}}

- Date de demande : {{requestDate}}

Vous recevrez une confirmation par email une fois votre demande traitée.

Boulangerie Ange - Arras

Ce message a été généré automatiquement.`,
        description: 'Email de confirmation envoyé aux employés lors de la réception d\'une demande de congés',
        variables: [
          { name: 'employeeName', description: 'Nom du salarié', example: 'Marie Dupont' },
          { name: 'startDate', description: 'Date de début des congés', example: '15/09/2025' },
          { name: 'endDate', description: 'Date de fin des congés', example: '20/09/2025' },
          { name: 'duration', description: 'Durée en jours', example: '6' },
          { name: 'durationPlural', description: 'S pour le pluriel', example: 's' },
          { name: 'reason', description: 'Type de congés', example: 'Congés payés' },
          { name: 'requestDate', description: 'Date de la demande', example: '12/09/2025' }
        ]
      },
      {
        name: 'vacation_request_alert',
        displayName: 'Email d\'Alerte - Nouvelle Demande de Congés',
        subject: '🏖️ Nouvelle demande de congés à valider - {{employeeName}}',
        htmlContent: `
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
      <h1>🏖️ Nouvelle Demande de Congés</h1>
      <p>Boulangerie Ange - Arras</p>
    </div>
    
    <div class="content">
      <p>Une nouvelle demande de congés a été soumise et nécessite votre validation.</p>
      
      <div class="alert-box">
        <h3>⚠️ Action Requise</h3>
        <p>Veuillez valider ou rejeter cette demande de congés dans les plus brefs délais.</p>
      </div>
      
      <div class="details">
        <h3>📋 Informations de la demande :</h3>
        <ul>
          <li><strong>Salarié :</strong> {{employeeName}}</li>
          <li><strong>Email :</strong> {{employeeEmail}}</li>
          <li><strong>Période :</strong> {{startDate}} au {{endDate}}</li>
          <li><strong>Durée :</strong> {{duration}} jour{{durationPlural}}</li>
          <li><strong>Type :</strong> {{reason}}</li>
          <li><strong>Date de demande :</strong> {{requestDate}}</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 20px 0;">
        <a href="{{adminUrl}}" class="action-button">🔍 Gérer les Congés</a>
      </div>
      
      <p>Merci de traiter cette demande rapidement.</p>
    </div>
    
    <div class="footer">
      <p>Boulangerie Ange - Arras</p>
      <p>Ce message a été généré automatiquement.</p>
    </div>
  </div>
</body>
</html>`,
        textContent: `
NOUVELLE DEMANDE DE CONGÉS
Boulangerie Ange - Arras

Une nouvelle demande de congés a été soumise et nécessite votre validation.

⚠️ ACTION REQUISE
Veuillez valider ou rejeter cette demande de congés dans les plus brefs délais.

📋 INFORMATIONS DE LA DEMANDE :
- Salarié : {{employeeName}}
- Email : {{employeeEmail}}
- Période : {{startDate}} au {{endDate}}
- Durée : {{duration}} jour{{durationPlural}}
- Type : {{reason}}
- Date de demande : {{requestDate}}

🔍 Pour gérer : {{adminUrl}}

Merci de traiter cette demande rapidement.

Boulangerie Ange - Arras
Ce message a été généré automatiquement.`,
        description: 'Email d\'alerte envoyé aux administrateurs lors d\'une nouvelle demande de congés',
        variables: [
          { name: 'employeeName', description: 'Nom du salarié', example: 'Marie Dupont' },
          { name: 'employeeEmail', description: 'Email du salarié', example: 'marie@email.com' },
          { name: 'startDate', description: 'Date de début des congés', example: '15/09/2025' },
          { name: 'endDate', description: 'Date de fin des congés', example: '20/09/2025' },
          { name: 'duration', description: 'Durée en jours', example: '6' },
          { name: 'durationPlural', description: 'S pour le pluriel', example: 's' },
          { name: 'reason', description: 'Type de congés', example: 'Congés payés' },
          { name: 'requestDate', description: 'Date de la demande', example: '12/09/2025' },
          { name: 'adminUrl', description: 'URL de gestion', example: 'https://www.filmara.fr/plan' }
        ]
      },
      {
        name: 'vacation_request_validation',
        displayName: 'Email de Validation - Congés Approuvés',
        subject: '✅ Vos congés ont été approuvés - {{employeeName}}',
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #28a745; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f8f9fa; }
    .success-box { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Congés Approuvés</h1>
      <p>Boulangerie Ange - Arras</p>
    </div>
    
    <div class="content">
      <p>Bonjour {{employeeName}},</p>
      
      <div class="success-box">
        <h3>🎉 Excellente nouvelle !</h3>
        <p>Votre demande de congés a été approuvée.</p>
      </div>
      
      <div class="details">
        <h3>📋 Détails de vos congés approuvés :</h3>
        <ul>
          <li><strong>Période :</strong> {{startDate}} au {{endDate}}</li>
          <li><strong>Durée :</strong> {{duration}} jour{{durationPlural}}</li>
          <li><strong>Type :</strong> {{reason}}</li>
          <li><strong>Validé par :</strong> {{validatedBy}}</li>
          <li><strong>Date de validation :</strong> {{validationDate}}</li>
        </ul>
      </div>
      
      <p>Vos congés ont été enregistrés dans votre dossier personnel et seront pris en compte dans le planning.</p>
      
      <p>Nous vous souhaitons d'excellentes vacances !</p>
    </div>
    
    <div class="footer">
      <p>Boulangerie Ange - Arras</p>
      <p>Ce message a été généré automatiquement.</p>
    </div>
  </div>
</body>
</html>`,
        textContent: `
CONGÉS APPROUVÉS
Boulangerie Ange - Arras

Bonjour {{employeeName}},

🎉 EXCELLENTE NOUVELLE !
Votre demande de congés a été approuvée.

📋 DÉTAILS DE VOS CONGÉS APPROUVÉS :
- Période : {{startDate}} au {{endDate}}
- Durée : {{duration}} jour{{durationPlural}}
- Type : {{reason}}
- Validé par : {{validatedBy}}
- Date de validation : {{validationDate}}

Vos congés ont été enregistrés dans votre dossier personnel et seront pris en compte dans le planning.

Nous vous souhaitons d'excellentes vacances !

Boulangerie Ange - Arras
Ce message a été généré automatiquement.`,
        description: 'Email de validation envoyé aux employés lors de l\'approbation de leurs congés',
        variables: [
          { name: 'employeeName', description: 'Nom du salarié', example: 'Marie Dupont' },
          { name: 'startDate', description: 'Date de début des congés', example: '15/09/2025' },
          { name: 'endDate', description: 'Date de fin des congés', example: '20/09/2025' },
          { name: 'duration', description: 'Durée en jours', example: '6' },
          { name: 'durationPlural', description: 'S pour le pluriel', example: 's' },
          { name: 'reason', description: 'Type de congés', example: 'Congés payés' },
          { name: 'validatedBy', description: 'Nom de la personne qui valide', example: 'Admin' },
          { name: 'validationDate', description: 'Date de validation', example: '12/09/2025' }
        ]
      },
      {
        name: 'advance_request_employee',
        displayName: 'Email Confirmation - Demande d\'Acompte',
        subject: '💰 Demande d\'acompte confirmée - {{amount}}€',
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .highlight { background: #e3f2fd; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0; }
    .amount { font-size: 24px; font-weight: bold; color: #28a745; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    .btn { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💰 Demande d'Acompte Confirmée</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{to_name}}</strong>,</p>
      
      <p>Votre demande d'acompte sur salaire a été reçue avec succès.</p>
      
      <div class="highlight">
        <h3>📋 Détails de votre demande :</h3>
        <ul>
          <li><strong>Montant demandé :</strong> <span class="amount">{{amount}}€</span></li>
          <li><strong>Déduction sur la paye de :</strong> {{deduction_month}}</li>
          <li><strong>Date de la demande :</strong> {{request_date}}</li>
        </ul>
      </div>
      
      <p>Votre demande a été transmise à votre manager pour validation. Vous recevrez une notification par email dès que votre demande sera traitée.</p>
      
      <p>Vous pouvez consulter le statut de vos demandes d'acompte en vous connectant à votre <a href="{{dashboard_url}}" class="btn">Tableau de Bord</a>.</p>
      
      <p>Si vous avez des questions, n'hésitez pas à contacter votre manager.</p>
      
      <div class="footer">
        <p>Cet email a été envoyé automatiquement par le système de gestion des acomptes.</p>
        <p>Boulangerie Planning - {{request_date}}</p>
      </div>
    </div>
  </div>
</body>
</html>`,
        textContent: `💰 DEMANDE D'ACOMPTE CONFIRMÉE

Bonjour {{to_name}},

Votre demande d'acompte sur salaire a été reçue avec succès.

📋 DÉTAILS DE VOTRE DEMANDE :
- Montant demandé : {{amount}}€
- Déduction sur la paye de : {{deduction_month}}
- Date de la demande : {{request_date}}

Votre demande a été transmise à votre manager pour validation. Vous recevrez une notification par email dès que votre demande sera traitée.

Pour consulter le statut : {{dashboard_url}}

Si vous avez des questions, n'hésitez pas à contacter votre manager.

Boulangerie Planning - {{request_date}}`,
        description: 'Email de confirmation envoyé aux salariés lors de la réception d\'une demande d\'acompte',
        variables: [
          { name: 'to_name', description: 'Nom du salarié', example: 'Anaïs' },
          { name: 'amount', description: 'Montant demandé', example: '500' },
          { name: 'deduction_month', description: 'Mois de déduction', example: 'Janvier 2025' },
          { name: 'request_date', description: 'Date de la demande', example: '29/10/2025' },
          { name: 'dashboard_url', description: 'URL du tableau de bord', example: 'https://www.filmara.fr/plan/employee-dashboard.html' }
        ]
      },
      {
        name: 'advance_request_manager',
        displayName: 'Email d\'Alerte - Nouvelle Demande d\'Acompte',
        subject: '🔔 Nouvelle demande d\'acompte - {{employee_name}} - {{amount}}€',
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ffc107; color: #212529; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .alert { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .amount { font-size: 24px; font-weight: bold; color: #dc3545; }
    .employee { background: #e3f2fd; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0; }
    .btn { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
    .btn-danger { background: #dc3545; }
    .btn-success { background: #28a745; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 Nouvelle Demande d'Acompte</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{to_name}}</strong>,</p>
      
      <div class="alert">
        <h3>⚠️ Action requise</h3>
        <p>Une nouvelle demande d'acompte sur salaire nécessite votre validation.</p>
      </div>
      
      <div class="employee">
        <h3>👤 Informations du salarié :</h3>
        <ul>
          <li><strong>Nom :</strong> {{employee_name}}</li>
          <li><strong>Montant demandé :</strong> <span class="amount">{{amount}}€</span></li>
          <li><strong>Déduction sur la paye de :</strong> {{deduction_month}}</li>
          <li><strong>Date de la demande :</strong> {{request_date}}</li>
        </ul>
      </div>
      
      <div class="employee">
        <h3>💬 Commentaire du salarié :</h3>
        <p><em>{{comment}}</em></p>
      </div>
      
      <p>Vous pouvez gérer cette demande en vous connectant à l'interface d'administration :</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{admin_url}}" class="btn">🔍 Voir la demande</a>
        <a href="{{admin_url}}" class="btn btn-success">✅ Approuver</a>
        <a href="{{admin_url}}" class="btn btn-danger">❌ Rejeter</a>
      </div>
      
      <p>Merci de traiter cette demande dans les plus brefs délais.</p>
      
      <div class="footer">
        <p>Cet email a été envoyé automatiquement par le système de gestion des acomptes.</p>
        <p>Boulangerie Planning - {{request_date}}</p>
      </div>
    </div>
  </div>
</body>
</html>`,
        textContent: `🔔 NOUVELLE DEMANDE D'ACOMPTE

Bonjour {{to_name}},

⚠️ ACTION REQUISE
Une nouvelle demande d'acompte sur salaire nécessite votre validation.

👤 INFORMATIONS DU SALARIÉ :
- Nom : {{employee_name}}
- Montant demandé : {{amount}}€
- Déduction sur la paye de : {{deduction_month}}
- Date de la demande : {{request_date}}

💬 COMMENTAIRE DU SALARIÉ :
{{comment}}

Pour gérer cette demande : {{admin_url}}

Merci de traiter cette demande dans les plus brefs délais.

Boulangerie Planning - {{request_date}}`,
        description: 'Email d\'alerte envoyé aux managers lors d\'une nouvelle demande d\'acompte',
        variables: [
          { name: 'to_name', description: 'Nom du manager', example: 'Manager' },
          { name: 'employee_name', description: 'Nom du salarié', example: 'Anaïs' },
          { name: 'amount', description: 'Montant demandé', example: '500' },
          { name: 'deduction_month', description: 'Mois de déduction', example: 'Janvier 2025' },
          { name: 'comment', description: 'Commentaire du salarié', example: 'Urgent pour frais médicaux' },
          { name: 'request_date', description: 'Date de la demande', example: '29/10/2025' },
          { name: 'admin_url', description: 'URL de l\'interface admin', example: 'https://www.filmara.fr/plan/advance-requests' }
        ]
      },
      {
        name: 'advance_approved',
        displayName: 'Email de Validation - Acompte Approuvé',
        subject: '✅ Demande d\'acompte approuvée - {{amount}}€',
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .success { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .amount { font-size: 24px; font-weight: bold; color: #28a745; }
    .details { background: #e3f2fd; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0; }
    .manager-comment { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
    .btn { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Demande d'Acompte Approuvée</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{to_name}}</strong>,</p>
      
      <div class="success">
        <h3>🎉 Excellente nouvelle !</h3>
        <p>Votre demande d'acompte sur salaire a été <strong>approuvée</strong> par votre manager.</p>
      </div>
      
      <div class="details">
        <h3>📋 Détails de l'acompte approuvé :</h3>
        <ul>
          <li><strong>Montant approuvé :</strong> <span class="amount">{{amount}}€</span></li>
          <li><strong>Déduction sur la paye de :</strong> {{deduction_month}}</li>
          <li><strong>Date d'approbation :</strong> {{approval_date}}</li>
        </ul>
      </div>
      
      <div class="manager-comment">
        <h3>💬 Commentaire du manager :</h3>
        <p><em>{{manager_comment}}</em></p>
      </div>
      
      <p>L'acompte sera versé selon les modalités habituelles de l'entreprise. Le montant sera déduit de votre prochaine paye du mois de <strong>{{deduction_month}}</strong>.</p>
      
      <p>Vous pouvez consulter tous vos acomptes en vous connectant à votre <a href="{{dashboard_url}}" class="btn">Tableau de Bord</a>.</p>
      
      <p>Si vous avez des questions, n'hésitez pas à contacter votre manager.</p>
      
      <div class="footer">
        <p>Cet email a été envoyé automatiquement par le système de gestion des acomptes.</p>
        <p>Boulangerie Planning - {{approval_date}}</p>
      </div>
    </div>
  </div>
</body>
</html>`,
        textContent: `✅ DEMANDE D'ACOMPTE APPROUVÉE

Bonjour {{to_name}},

🎉 EXCELLENTE NOUVELLE !
Votre demande d'acompte sur salaire a été approuvée par votre manager.

📋 DÉTAILS DE L'ACOMPTE APPROUVÉ :
- Montant approuvé : {{amount}}€
- Déduction sur la paye de : {{deduction_month}}
- Date d'approbation : {{approval_date}}

💬 COMMENTAIRE DU MANAGER :
{{manager_comment}}

L'acompte sera versé selon les modalités habituelles de l'entreprise. Le montant sera déduit de votre prochaine paye du mois de {{deduction_month}}.

Pour consulter vos acomptes : {{dashboard_url}}

Si vous avez des questions, n'hésitez pas à contacter votre manager.

Boulangerie Planning - {{approval_date}}`,
        description: 'Email de validation envoyé aux salariés lors de l\'approbation d\'un acompte',
        variables: [
          { name: 'to_name', description: 'Nom du salarié', example: 'Anaïs' },
          { name: 'amount', description: 'Montant approuvé', example: '500' },
          { name: 'deduction_month', description: 'Mois de déduction', example: 'Janvier 2025' },
          { name: 'manager_comment', description: 'Commentaire du manager', example: 'Demande approuvée pour test' },
          { name: 'approval_date', description: 'Date d\'approbation', example: '29/10/2025' },
          { name: 'dashboard_url', description: 'URL du tableau de bord', example: 'https://www.filmara.fr/plan/employee-dashboard.html' }
        ]
      },
      {
        name: 'advance_rejected',
        displayName: 'Email de Rejet - Acompte Refusé',
        subject: '❌ Demande d\'acompte refusée - {{amount}}€',
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .rejection { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .amount { font-size: 24px; font-weight: bold; color: #dc3545; }
    .details { background: #e3f2fd; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0; }
    .manager-comment { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
    .btn { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>❌ Demande d'Acompte Refusée</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{to_name}}</strong>,</p>
      
      <div class="rejection">
        <h3>⚠️ Demande refusée</h3>
        <p>Votre demande d'acompte sur salaire a été <strong>refusée</strong> par votre manager.</p>
      </div>
      
      <div class="details">
        <h3>📋 Détails de la demande refusée :</h3>
        <ul>
          <li><strong>Montant demandé :</strong> <span class="amount">{{amount}}€</span></li>
          <li><strong>Déduction sur la paye de :</strong> {{deduction_month}}</li>
          <li><strong>Date de refus :</strong> {{rejection_date}}</li>
        </ul>
      </div>
      
      <div class="manager-comment">
        <h3>💬 Raison du refus :</h3>
        <p><em>{{manager_comment}}</em></p>
      </div>
      
      <p>Si vous souhaitez discuter de cette décision ou faire une nouvelle demande, n'hésitez pas à contacter votre manager directement.</p>
      
      <p>Vous pouvez consulter l'historique de vos demandes en vous connectant à votre <a href="{{dashboard_url}}" class="btn">Tableau de Bord</a>.</p>
      
      <div class="footer">
        <p>Cet email a été envoyé automatiquement par le système de gestion des acomptes.</p>
        <p>Boulangerie Planning - {{rejection_date}}</p>
      </div>
    </div>
  </div>
</body>
</html>`,
        textContent: `❌ DEMANDE D'ACOMPTE REFUSÉE

Bonjour {{to_name}},

⚠️ DEMANDE REFUSÉE
Votre demande d'acompte sur salaire a été refusée par votre manager.

📋 DÉTAILS DE LA DEMANDE REFUSÉE :
- Montant demandé : {{amount}}€
- Déduction sur la paye de : {{deduction_month}}
- Date de refus : {{rejection_date}}

💬 RAISON DU REFUS :
{{manager_comment}}

Si vous souhaitez discuter de cette décision ou faire une nouvelle demande, n'hésitez pas à contacter votre manager directement.

Pour consulter l'historique : {{dashboard_url}}

Boulangerie Planning - {{rejection_date}}`,
        description: 'Email de rejet envoyé aux salariés lors du refus d\'un acompte',
        variables: [
          { name: 'to_name', description: 'Nom du salarié', example: 'Anaïs' },
          { name: 'amount', description: 'Montant demandé', example: '500' },
          { name: 'deduction_month', description: 'Mois de déduction', example: 'Janvier 2025' },
          { name: 'manager_comment', description: 'Commentaire du manager', example: 'Demande refusée pour test' },
          { name: 'rejection_date', description: 'Date de refus', example: '29/10/2025' },
          { name: 'dashboard_url', description: 'URL du tableau de bord', example: 'https://www.filmara.fr/plan/employee-dashboard.html' }
        ]
      },
      {
        name: 'mutuelle_acknowledgement',
        displayName: 'Email d\'Accusé de Réception - Justificatif Mutuelle',
        subject: 'Accusé de réception - Justificatif mutuelle de {{employeeName}}',
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
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
      <p>Votre justificatif de mutuelle a bien été reçu</p>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{employeeName}}</strong>,</p>
      
      <p>Nous accusons réception de votre justificatif de mutuelle personnelle qui a été déposé le <strong>{{uploadDate}}</strong>.</p>
      
      <div class="info-box">
        <h3>📋 Informations :</h3>
        <ul>
          <li><strong>Document déposé :</strong> {{fileName}}</li>
          <li><strong>Date de dépôt :</strong> {{uploadDate}}</li>
        </ul>
      </div>
      
      <p>Votre justificatif va être examiné par l'administration dans les plus brefs délais.</p>
      
      <p>Vous recevrez une notification par email dès que votre justificatif aura été validé ou si des informations complémentaires sont nécessaires.</p>
      
      <p>En cas de question, n'hésitez pas à nous contacter.</p>
      
      <p>Cordialement,<br>
      <strong>L'équipe de la Boulangerie Ange - Arras</strong></p>
    </div>
    <div class="footer">
      <p>Cet email est envoyé automatiquement, merci de ne pas y répondre.</p>
    </div>
  </div>
</body>
</html>`,
        textContent: `
Accusé de réception - Votre justificatif de mutuelle a bien été reçu

Bonjour {{employeeName}},

Nous accusons réception de votre justificatif de mutuelle personnelle qui a été déposé le {{uploadDate}}.

Informations :
- Document déposé : {{fileName}}
- Date de dépôt : {{uploadDate}}

Votre justificatif va être examiné par l'administration dans les plus brefs délais.

Vous recevrez une notification par email dès que votre justificatif aura été validé ou si des informations complémentaires sont nécessaires.

En cas de question, n'hésitez pas à nous contacter.

Cordialement,
L'équipe de la Boulangerie Ange - Arras

----
Cet email est envoyé automatiquement, merci de ne pas y répondre.`,
        description: 'Email d\'accusé de réception envoyé automatiquement au salarié lors du dépôt d\'un justificatif de mutuelle',
        variables: [
          { name: 'employeeName', description: 'Nom du salarié', example: 'Marie Dupont' },
          { name: 'fileName', description: 'Nom du fichier déposé', example: 'justificatif_mutuelle.pdf' },
          { name: 'uploadDate', description: 'Date de dépôt', example: '15/11/2025' }
        ]
      },
      {
        name: 'mutuelle_alert',
        displayName: 'Email d\'Alerte - Nouveau Justificatif Mutuelle',
        subject: '🚨 Nouveau justificatif mutuelle à valider - {{employeeName}}',
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc3545; color: white; padding: 20px; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .alert-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
    .btn { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 Nouveau Justificatif Mutuelle</h1>
      <p>Action requise</p>
    </div>
    <div class="content">
      <div class="alert-box">
        <h3>⚠️ Attention</h3>
        <p>Un nouveau justificatif de mutuelle personnelle nécessite votre validation.</p>
      </div>
      
      <p><strong>Salarié :</strong> {{employeeName}}</p>
      <p><strong>Email :</strong> {{employeeEmail}}</p>
      <p><strong>Fichier :</strong> {{fileName}}</p>
      <p><strong>Date de dépôt :</strong> {{uploadDate}}</p>
      
      <p>Merci de valider ou rejeter ce justificatif sur <a href="{{adminUrl}}/mutuelle-management" class="btn">la page de gestion des mutuelles</a>.</p>
      
      <p>Cordialement,<br>
      <strong>L'équipe de la Boulangerie Ange - Arras</strong></p>
    </div>
    <div class="footer">
      <p>Cet email est envoyé automatiquement, merci de ne pas y répondre.</p>
    </div>
  </div>
</body>
</html>`,
        textContent: `
🚨 NOUVEAU JUSTIFICATIF MUTUELLE À VALIDER

Un nouveau justificatif de mutuelle personnelle nécessite votre validation.

Salarié : {{employeeName}}
Email : {{employeeEmail}}
Fichier : {{fileName}}
Date de dépôt : {{uploadDate}}

Merci de valider ou rejeter ce justificatif sur {{adminUrl}}/mutuelle-management.

Cordialement,
L'équipe de la Boulangerie Ange - Arras

----
Cet email est envoyé automatiquement, merci de ne pas y répondre.`,
        description: 'Email d\'alerte envoyé aux administrateurs lors du dépôt d\'un nouveau justificatif de mutuelle',
        variables: [
          { name: 'employeeName', description: 'Nom du salarié', example: 'Marie Dupont' },
          { name: 'employeeEmail', description: 'Email du salarié', example: 'marie.dupont@example.com' },
          { name: 'fileName', description: 'Nom du fichier déposé', example: 'justificatif_mutuelle.pdf' },
          { name: 'uploadDate', description: 'Date de dépôt', example: '15/11/2025' },
          { name: 'adminUrl', description: 'URL de l\'administration', example: 'https://www.filmara.fr/plan' }
        ]
      },
      {
        name: 'mutuelle_validation',
        displayName: 'Email de Validation - Justificatif Mutuelle Validé',
        subject: 'Justificatif mutuelle validé - {{employeeName}}',
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #28a745; color: white; padding: 20px; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 5px; }
    .info-box { background: white; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0; border-radius: 5px; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Justificatif Mutuelle Validé</h1>
      <p>Tout est conforme</p>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{employeeName}}</strong>,</p>
      
      <div class="success-box">
        <h3>🎉 Excellente nouvelle !</h3>
        <p>Votre justificatif de mutuelle personnelle a été <strong>validé</strong> par {{validatedBy}}.</p>
        <p><strong>Tout est conforme.</strong></p>
      </div>
      
      <div class="info-box">
        <h3>📋 Informations :</h3>
        <ul>
          <li><strong>Date de validation :</strong> {{validationDate}}</li>
          <li><strong>Date d'expiration :</strong> {{expirationDate}}</li>
        </ul>
      </div>
      
      <p>Votre justificatif est valide jusqu'au <strong>{{expirationDate}}</strong>. Vous recevrez un rappel par email avant l'expiration pour mettre à jour votre justificatif.</p>
      
      <p>En cas de question, n'hésitez pas à nous contacter.</p>
      
      <p>Cordialement,<br>
      <strong>L'équipe de la Boulangerie Ange - Arras</strong></p>
    </div>
    <div class="footer">
      <p>Cet email est envoyé automatiquement, merci de ne pas y répondre.</p>
    </div>
  </div>
</body>
</html>`,
        textContent: `
✅ JUSTIFICATIF MUTUELLE VALIDÉ

Bonjour {{employeeName}},

🎉 Excellente nouvelle !
Votre justificatif de mutuelle personnelle a été validé par {{validatedBy}}.
Tout est conforme.

📋 INFORMATIONS :
- Date de validation : {{validationDate}}
- Date d'expiration : {{expirationDate}}

Votre justificatif est valide jusqu'au {{expirationDate}}. Vous recevrez un rappel par email avant l'expiration pour mettre à jour votre justificatif.

En cas de question, n'hésitez pas à nous contacter.

Cordialement,
L'équipe de la Boulangerie Ange - Arras

----
Cet email est envoyé automatiquement, merci de ne pas y répondre.`,
        description: 'Email de validation envoyé au salarié lorsque son justificatif de mutuelle est validé',
        variables: [
          { name: 'employeeName', description: 'Nom du salarié', example: 'Marie Dupont' },
          { name: 'validatedBy', description: 'Nom de la personne qui a validé', example: 'Admin' },
          { name: 'validationDate', description: 'Date de validation', example: '15/11/2025' },
          { name: 'expirationDate', description: 'Date d\'expiration du justificatif', example: '15/11/2026' }
        ]
      },
      {
        name: 'mutuelle_rejection',
        displayName: 'Email de Rejet - Justificatif Mutuelle Rejeté',
        subject: 'Justificatif mutuelle rejeté - {{employeeName}}',
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc3545; color: white; padding: 20px; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .rejection-box { background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 5px; }
    .info-box { background: white; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
    .btn { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>❌ Justificatif Mutuelle Rejeté</h1>
      <p>Action requise</p>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{employeeName}}</strong>,</p>
      
      <div class="rejection-box">
        <h3>⚠️ Justificatif rejeté</h3>
        <p>Votre justificatif de mutuelle personnelle a été <strong>rejeté</strong> par {{rejectedBy}}.</p>
      </div>
      
      <div class="info-box">
        <h3>📋 Informations :</h3>
        <ul>
          <li><strong>Date de rejet :</strong> {{rejectionDate}}</li>
          <li><strong>Raison :</strong> {{rejectionReason}}</li>
        </ul>
      </div>
      
      <p>Merci de déposer un nouveau justificatif lisible et conforme sur <a href="{{dashboardUrl}}" class="btn">votre espace salarié</a>.</p>
      
      <p>En cas de question, n'hésitez pas à nous contacter.</p>
      
      <p>Cordialement,<br>
      <strong>L'équipe de la Boulangerie Ange - Arras</strong></p>
    </div>
    <div class="footer">
      <p>Cet email est envoyé automatiquement, merci de ne pas y répondre.</p>
    </div>
  </div>
</body>
</html>`,
        textContent: `
❌ JUSTIFICATIF MUTUELLE REJETÉ

Bonjour {{employeeName}},

⚠️ Justificatif rejeté
Votre justificatif de mutuelle personnelle a été rejeté par {{rejectedBy}}.

📋 INFORMATIONS :
- Date de rejet : {{rejectionDate}}
- Raison : {{rejectionReason}}

Merci de déposer un nouveau justificatif lisible et conforme sur {{dashboardUrl}}.

En cas de question, n'hésitez pas à nous contacter.

Cordialement,
L'équipe de la Boulangerie Ange - Arras

----
Cet email est envoyé automatiquement, merci de ne pas y répondre.`,
        description: 'Email de rejet envoyé au salarié lorsque son justificatif de mutuelle est rejeté',
        variables: [
          { name: 'employeeName', description: 'Nom du salarié', example: 'Marie Dupont' },
          { name: 'rejectedBy', description: 'Nom de la personne qui a rejeté', example: 'Admin' },
          { name: 'rejectionDate', description: 'Date de rejet', example: '15/11/2025' },
          { name: 'rejectionReason', description: 'Raison du rejet', example: 'Document illisible' },
          { name: 'dashboardUrl', description: 'URL du tableau de bord salarié', example: 'https://www.filmara.fr/plan/employee-dashboard.html' }
        ]
      },
      {
        name: 'mutuelle_reminder',
        displayName: 'Email de Rappel - Mise à Jour Justificatif Mutuelle',
        subject: 'Rappel - Mise à jour de votre justificatif mutuelle',
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ff9800; color: white; padding: 20px; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .reminder-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
    .info-box { background: white; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0; border-radius: 5px; }
    .btn { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Rappel - Mise à Jour Justificatif</h1>
      <p>Action requise</p>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{employeeName}}</strong>,</p>
      
      <div class="reminder-box">
        <h3>⚠️ Rappel Important</h3>
        <p>Votre justificatif de mutuelle personnelle expire le <strong>{{expirationDate}}</strong>.</p>
      </div>
      
      <div class="info-box">
        <h3>📋 Action requise :</h3>
        <p>Merci de déposer un nouveau justificatif à jour sur <a href="{{dashboardUrl}}" class="btn">votre espace salarié</a> avant l'expiration.</p>
      </div>
      
      <p>Ce rappel vous est envoyé automatiquement pour vous permettre de mettre à jour votre justificatif dans les meilleurs délais.</p>
      
      <p>En cas de question, n'hésitez pas à nous contacter.</p>
      
      <p>Cordialement,<br>
      <strong>L'équipe de la Boulangerie Ange - Arras</strong></p>
    </div>
    <div class="footer">
      <p>Cet email est envoyé automatiquement, merci de ne pas y répondre.</p>
    </div>
  </div>
</body>
</html>`,
        textContent: `
⏰ RAPPEL - MISE À JOUR JUSTIFICATIF MUTUELLE

Bonjour {{employeeName}},

⚠️ RAPPEL IMPORTANT
Votre justificatif de mutuelle personnelle expire le {{expirationDate}}.

📋 ACTION REQUISE :
Merci de déposer un nouveau justificatif à jour sur {{dashboardUrl}} avant l'expiration.

Ce rappel vous est envoyé automatiquement pour vous permettre de mettre à jour votre justificatif dans les meilleurs délais.

En cas de question, n'hésitez pas à nous contacter.

Cordialement,
L'équipe de la Boulangerie Ange - Arras

----
Cet email est envoyé automatiquement, merci de ne pas y répondre.`,
        description: 'Email de rappel envoyé au salarié pour mettre à jour son justificatif de mutuelle avant expiration',
        variables: [
          { name: 'employeeName', description: 'Nom du salarié', example: 'Marie Dupont' },
          { name: 'expirationDate', description: 'Date d\'expiration du justificatif', example: '15/11/2026' },
          { name: 'dashboardUrl', description: 'URL du tableau de bord salarié', example: 'https://www.filmara.fr/plan/employee-dashboard.html' }
        ]
      }
    ];
    
    // Vérifier si les templates existent déjà
    const existingTemplates = await EmailTemplate.find({ name: { $in: defaultTemplates.map(t => t.name) } });
    const existingNames = existingTemplates.map(t => t.name);
    
    // Créer seulement les templates qui n'existent pas
    const templatesToCreate = defaultTemplates.filter(t => !existingNames.includes(t.name));
    
    if (templatesToCreate.length === 0) {
      return res.json({
        success: true,
        message: 'Tous les templates par défaut existent déjà',
        templates: existingTemplates
      });
    }
    
    const createdTemplates = await EmailTemplate.insertMany(templatesToCreate);
    
    res.json({
      success: true,
      message: `${createdTemplates.length} templates par défaut créés avec succès`,
      templates: createdTemplates
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des templates:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'initialisation des templates par défaut'
    });
  }
};

// Tester un template d'email
exports.testEmailTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { testData } = req.body;
    
    const template = await EmailTemplate.findById(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template d\'email non trouvé'
      });
    }
    
    // Remplacer les variables dans le contenu
    let processedSubject = template.subject;
    let processedHtmlContent = template.htmlContent;
    let processedTextContent = template.textContent;
    
    // Remplacer toutes les variables
    Object.keys(testData).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedSubject = processedSubject.replace(regex, testData[key]);
      processedHtmlContent = processedHtmlContent.replace(regex, testData[key]);
      processedTextContent = processedTextContent.replace(regex, testData[key]);
    });
    
    res.json({
      success: true,
      processedTemplate: {
        subject: processedSubject,
        htmlContent: processedHtmlContent,
        textContent: processedTextContent
      }
    });
  } catch (error) {
    console.error('❌ Erreur lors du test du template:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du test du template d\'email'
    });
  }
};
