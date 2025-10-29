# 📧 Configuration EmailJS pour les Demandes d'Acompte

## 🎯 Vue d'ensemble

Ce guide vous explique comment configurer EmailJS pour envoyer des notifications automatiques lors des demandes d'acompte sur salaire.

## 📋 Templates à créer

Vous devez créer **4 templates** dans EmailJS :

1. **`template_advance_request_employee`** - Confirmation au salarié
2. **`template_advance_request_manager`** - Notification au manager
3. **`template_advance_approved`** - Confirmation d'approbation
4. **`template_advance_rejected`** - Notification de rejet

---

## 🔧 Configuration étape par étape

### 1️⃣ Accéder à EmailJS

1. Connectez-vous sur [https://www.emailjs.com/](https://www.emailjs.com/)
2. Allez dans **"Email Templates"**
3. Cliquez sur **"Create New Template"**

### 2️⃣ Template 1 : Confirmation au salarié

**Nom du template :** `template_advance_request_employee`

**Objet :** `💰 Demande d'acompte confirmée - {{amount}}€`

**Contenu HTML :**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Demande d'acompte confirmée</title>
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
</html>
```

**Variables utilisées :**
- `{{to_name}}` - Nom du salarié
- `{{amount}}` - Montant demandé
- `{{deduction_month}}` - Mois de déduction
- `{{request_date}}` - Date de la demande
- `{{dashboard_url}}` - URL du tableau de bord

---

### 3️⃣ Template 2 : Notification au manager

**Nom du template :** `template_advance_request_manager`

**Objet :** `🔔 Nouvelle demande d'acompte - {{employee_name}} - {{amount}}€`

**Contenu HTML :**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Nouvelle demande d'acompte</title>
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
            
            <p><strong>Note :</strong> Cette demande sera automatiquement approuvée si aucune action n'est prise dans les 48 heures.</p>
            
            <div class="footer">
                <p>Cet email a été envoyé automatiquement par le système de gestion des acomptes.</p>
                <p>Boulangerie Planning - {{request_date}}</p>
            </div>
        </div>
    </div>
</body>
</html>
```

**Variables utilisées :**
- `{{to_name}}` - Nom du manager
- `{{employee_name}}` - Nom du salarié
- `{{amount}}` - Montant demandé
- `{{deduction_month}}` - Mois de déduction
- `{{comment}}` - Commentaire du salarié
- `{{request_date}}` - Date de la demande
- `{{admin_url}}` - URL de l'interface admin

---

### 4️⃣ Template 3 : Confirmation d'approbation

**Nom du template :** `template_advance_approved`

**Objet :** `✅ Demande d'acompte approuvée - {{amount}}€`

**Contenu HTML :**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Demande d'acompte approuvée</title>
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
</html>
```

**Variables utilisées :**
- `{{to_name}}` - Nom du salarié
- `{{amount}}` - Montant approuvé
- `{{deduction_month}}` - Mois de déduction
- `{{manager_comment}}` - Commentaire du manager
- `{{approval_date}}` - Date d'approbation
- `{{dashboard_url}}` - URL du tableau de bord

---

### 5️⃣ Template 4 : Notification de rejet

**Nom du template :** `template_advance_rejected`

**Objet :** `❌ Demande d'acompte refusée - {{amount}}€`

**Contenu HTML :**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Demande d'acompte refusée</title>
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
</html>
```

**Variables utilisées :**
- `{{to_name}}` - Nom du salarié
- `{{amount}}` - Montant demandé
- `{{deduction_month}}` - Mois de déduction
- `{{manager_comment}}` - Commentaire du manager
- `{{rejection_date}}` - Date de refus
- `{{dashboard_url}}` - URL du tableau de bord

---

## 🔧 Configuration dans le code

### Variables d'environnement

Assurez-vous que ces variables sont configurées dans votre service EmailJS :

```javascript
// Dans backend/services/emailService.js
const emailServiceConfig = {
  serviceId: 'votre_service_id',
  templateIds: {
    advanceRequestEmployee: 'template_advance_request_employee',
    advanceRequestManager: 'template_advance_request_manager',
    advanceApproved: 'template_advance_approved',
    advanceRejected: 'template_advance_rejected'
  },
  publicKey: 'votre_public_key'
};
```

### Test des templates

Pour tester chaque template, vous pouvez utiliser ces données d'exemple :

```javascript
// Test template_advance_request_employee
{
  to_name: "Anaïs",
  amount: "500",
  deduction_month: "Janvier 2025",
  request_date: "29/10/2025",
  dashboard_url: "https://www.filmara.fr/plan/employee-dashboard.html"
}

// Test template_advance_request_manager
{
  to_name: "Manager",
  employee_name: "Anaïs",
  amount: "500",
  deduction_month: "Janvier 2025",
  comment: "Urgent pour frais médicaux",
  request_date: "29/10/2025",
  admin_url: "https://www.filmara.fr/plan/advance-requests"
}
```

---

## ✅ Vérification

Une fois les 4 templates créés :

1. ✅ **Testez chaque template** avec les données d'exemple
2. ✅ **Vérifiez les variables** dans chaque template
3. ✅ **Testez l'envoi** depuis l'interface de test d'EmailJS
4. ✅ **Vérifiez la réception** des emails

---

## 🆘 Support

Si vous rencontrez des problèmes :

1. **Vérifiez les noms des templates** (doivent correspondre exactement)
2. **Vérifiez les variables** (syntaxe `{{variable}}`)
3. **Testez l'envoi** depuis l'interface EmailJS
4. **Consultez les logs** du serveur pour les erreurs

---

## 📞 Contact

Pour toute question sur la configuration EmailJS, consultez la [documentation officielle](https://www.emailjs.com/docs/) ou contactez le support technique.
