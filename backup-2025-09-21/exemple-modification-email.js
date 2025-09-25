/**
 * EXEMPLE DE MODIFICATION D'EMAIL DE VALIDATION
 * Copiez ce code dans backend/services/emailServiceAlternative.js
 */

// EXEMPLE 1: Email de validation plus personnalisé
generateValidationEmailHTML(sickLeave, validatedBy) {
  const startDate = new Date(sickLeave.startDate).toLocaleDateString('fr-FR');
  const endDate = new Date(sickLeave.endDate).toLocaleDateString('fr-FR');
  const validationDate = new Date().toLocaleDateString('fr-FR');

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #27ae60, #2ecc71); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
      .content { padding: 30px; background: #f8f9fa; }
      .validation-box { background: #d4edda; border: 2px solid #c3e6cb; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center; }
      .details { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
      .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; background: #f8f9fa; border-radius: 0 0 10px 10px; }
      .highlight { color: #27ae60; font-weight: bold; }
      .contact-info { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 15px 0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🎉 Arrêt Maladie Validé</h1>
        <p><strong>Boulangerie Ange - Arras</strong></p>
        <p>Validation automatique</p>
      </div>
      
      <div class="content">
        <p>Bonjour <strong>${sickLeave.employeeName}</strong>,</p>
        
        <p>Nous avons le plaisir de vous informer que votre arrêt maladie a été <span class="highlight">validé avec succès</span> !</p>
        
        <div class="validation-box">
          <h2>✅ Validation Confirmée</h2>
          <p><strong>Validé par :</strong> ${validatedBy}</p>
          <p><strong>Date de validation :</strong> ${validationDate}</p>
        </div>
        
        <div class="details">
          <h3>📋 Récapitulatif de votre arrêt :</h3>
          <ul>
            <li><strong>👤 Salarié :</strong> ${sickLeave.employeeName}</li>
            <li><strong>📅 Période :</strong> Du ${startDate} au ${endDate}</li>
            <li><strong>⏱️ Durée :</strong> ${sickLeave.duration} jour${sickLeave.duration > 1 ? 's' : ''}</li>
            <li><strong>📄 Fichier :</strong> ${sickLeave.originalFileName}</li>
          </ul>
        </div>
        
        <div class="contact-info">
          <h4>📞 Prochaines étapes :</h4>
          <p>• Votre arrêt maladie sera transmis à notre comptable</p>
          <p>• Vous recevrez une confirmation de traitement</p>
          <p>• N'hésitez pas à nous contacter pour toute question</p>
        </div>
        
        <p>Nous vous souhaitons un prompt rétablissement et vous remercions pour votre confiance.</p>
        
        <p><strong>L'équipe de la Boulangerie Ange</strong></p>
      </div>
      
      <div class="footer">
        <p><strong>Boulangerie Ange - Arras</strong></p>
        <p>📍 123 Rue de la Paix, 62000 Arras</p>
        <p>📞 03 21 XX XX XX | 📧 contact@boulangerie-ange.fr</p>
        <p><em>Ce message a été généré automatiquement le ${validationDate}</em></p>
      </div>
    </div>
  </body>
  </html>
  `;
}

// EXEMPLE 2: Version texte simplifiée
generateValidationEmailText(sickLeave, validatedBy) {
  const startDate = new Date(sickLeave.startDate).toLocaleDateString('fr-FR');
  const endDate = new Date(sickLeave.endDate).toLocaleDateString('fr-FR');
  const validationDate = new Date().toLocaleDateString('fr-FR');

  return `
🎉 ARRÊT MALADIE VALIDÉ
Boulangerie Ange - Arras

Bonjour ${sickLeave.employeeName},

Nous avons le plaisir de vous informer que votre arrêt maladie a été validé avec succès !

✅ VALIDATION CONFIRMÉE
Validé par : ${validatedBy}
Date de validation : ${validationDate}

📋 RÉCAPITULATIF DE VOTRE ARRÊT :
- Salarié : ${sickLeave.employeeName}
- Période : Du ${startDate} au ${endDate}
- Durée : ${sickLeave.duration} jour${sickLeave.duration > 1 ? 's' : ''}
- Fichier : ${sickLeave.originalFileName}

📞 PROCHAINES ÉTAPES :
• Votre arrêt maladie sera transmis à notre comptable
• Vous recevrez une confirmation de traitement
• N'hésitez pas à nous contacter pour toute question

Nous vous souhaitons un prompt rétablissement et vous remercions pour votre confiance.

L'équipe de la Boulangerie Ange

---
Boulangerie Ange - Arras
📍 123 Rue de la Paix, 62000 Arras
📞 03 21 XX XX XX | 📧 contact@boulangerie-ange.fr
Ce message a été généré automatiquement le ${validationDate}
  `;
}

// EXEMPLE 3: Email de rejet personnalisé
generateRejectionEmailHTML(sickLeave, rejectionReason, rejectedBy) {
  const startDate = new Date(sickLeave.startDate).toLocaleDateString('fr-FR');
  const endDate = new Date(sickLeave.endDate).toLocaleDateString('fr-FR');
  const rejectionDate = new Date().toLocaleDateString('fr-FR');

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #e74c3c, #c0392b); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
      .content { padding: 30px; background: #f8f9fa; }
      .rejection-box { background: #f8d7da; border: 2px solid #f5c6cb; padding: 20px; border-radius: 10px; margin: 20px 0; }
      .details { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
      .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; background: #f8f9fa; border-radius: 0 0 10px 10px; }
      .highlight { color: #e74c3c; font-weight: bold; }
      .help-box { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>⚠️ Arrêt Maladie Rejeté</h1>
        <p><strong>Boulangerie Ange - Arras</strong></p>
        <p>Nécessite des corrections</p>
      </div>
      
      <div class="content">
        <p>Bonjour <strong>${sickLeave.employeeName}</strong>,</p>
        
        <p>Nous avons examiné votre arrêt maladie et nous devons vous informer qu'il a été <span class="highlight">rejeté</span> pour les raisons suivantes :</p>
        
        <div class="rejection-box">
          <h3>❌ Raison du rejet :</h3>
          <p><strong>${rejectionReason}</strong></p>
          <p><em>Rejeté par : ${rejectedBy} le ${rejectionDate}</em></p>
        </div>
        
        <div class="details">
          <h3>📋 Détails de votre demande :</h3>
          <ul>
            <li><strong>👤 Salarié :</strong> ${sickLeave.employeeName}</li>
            <li><strong>📅 Période :</strong> Du ${startDate} au ${endDate}</li>
            <li><strong>⏱️ Durée :</strong> ${sickLeave.duration} jour${sickLeave.duration > 1 ? 's' : ''}</li>
            <li><strong>📄 Fichier :</strong> ${sickLeave.originalFileName}</li>
          </ul>
        </div>
        
        <div class="help-box">
          <h4>🔧 Que faire maintenant ?</h4>
          <p>• Corrigez les éléments mentionnés ci-dessus</p>
          <p>• Renvoyez votre arrêt maladie via l'interface</p>
          <p>• Contactez-nous si vous avez des questions</p>
        </div>
        
        <p>Nous restons à votre disposition pour vous accompagner dans cette démarche.</p>
        
        <p><strong>L'équipe de la Boulangerie Ange</strong></p>
      </div>
      
      <div class="footer">
        <p><strong>Boulangerie Ange - Arras</strong></p>
        <p>📍 123 Rue de la Paix, 62000 Arras</p>
        <p>📞 03 21 XX XX XX | 📧 contact@boulangerie-ange.fr</p>
        <p><em>Ce message a été généré automatiquement le ${rejectionDate}</em></p>
      </div>
    </div>
  </body>
  </html>
  `;
}
