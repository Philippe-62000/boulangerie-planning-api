# 📧 Guide de Configuration des Templates EmailJS pour les Demandes d'Acompte

## 🔍 Problème identifié

Les templates EmailJS suivants n'existent pas encore dans votre compte EmailJS :
- `template_advance_request_employee` ❌
- `template_advance_request_manager` ❌
- `template_advance_approved` ❌
- `template_advance_rejected` ❌

**Erreur rencontrée :**
```
The template ID not found. To find this ID, visit https://dashboard.emailjs.com/admin/templates
```

## 🎯 Solution

Vous devez créer ces 4 templates dans votre compte EmailJS et noter leurs IDs réels.

---

## 📝 Étapes de Configuration

### 1. Accéder au Dashboard EmailJS

1. Connectez-vous à votre compte EmailJS : https://dashboard.emailjs.com
2. Allez dans **Templates** (menu de gauche)

### 2. Créer le Template 1 : Confirmation Salarié

**Nom du template :** `Demande Acompte - Confirmation Salarié`

**ID du template :** Notez l'ID (format : `template_xxxxxxx`)

**Variables à utiliser :**
- `{{to_name}}` - Nom du salarié
- `{{amount}}` - Montant demandé
- `{{deduction_month}}` - Mois de déduction
- `{{request_date}}` - Date de la demande
- `{{dashboard_url}}` - URL du dashboard salarié

**Exemple de contenu :**
```
Bonjour {{to_name}},

Nous avons bien reçu votre demande d'acompte de {{amount}}€.

La déduction se fera sur votre paye de {{deduction_month}}.

Date de la demande : {{request_date}}

Votre demande est en cours de traitement par votre manager.

Vous pouvez suivre l'état de votre demande sur votre dashboard :
{{dashboard_url}}

Cordialement,
L'équipe Boulangerie Ange
```

---

### 3. Créer le Template 2 : Notification Manager

**Nom du template :** `Demande Acompte - Notification Manager`

**ID du template :** Notez l'ID (format : `template_xxxxxxx`)

**Variables à utiliser :**
- `{{to_name}}` - Nom du manager
- `{{employee_name}}` - Nom du salarié
- `{{amount}}` - Montant demandé
- `{{deduction_month}}` - Mois de déduction
- `{{comment}}` - Commentaire (optionnel)
- `{{request_date}}` - Date de la demande
- `{{admin_url}}` - URL de la page de gestion

**Exemple de contenu :**
```
Bonjour {{to_name}},

Une nouvelle demande d'acompte nécessite votre attention.

📋 Détails de la demande :
- Salarié : {{employee_name}}
- Montant : {{amount}}€
- Mois de déduction : {{deduction_month}}
- Date de la demande : {{request_date}}
- Commentaire : {{comment}}

Pour traiter cette demande, veuillez vous connecter :
{{admin_url}}

Cordialement,
Système de gestion
```

---

### 4. Créer le Template 3 : Acompte Approuvé

**Nom du template :** `Demande Acompte - Approuvé`

**ID du template :** Notez l'ID (format : `template_xxxxxxx`)

**Variables à utiliser :**
- `{{to_name}}` - Nom du salarié
- `{{amount}}` - Montant approuvé
- `{{deduction_month}}` - Mois de déduction
- `{{manager_comment}}` - Commentaire du manager
- `{{approval_date}}` - Date d'approbation
- `{{dashboard_url}}` - URL du dashboard salarié

**Exemple de contenu :**
```
Bonjour {{to_name}},

✅ Votre demande d'acompte a été approuvée !

📋 Détails :
- Montant approuvé : {{amount}}€
- Mois de déduction : {{deduction_month}}
- Date d'approbation : {{approval_date}}
- Commentaire du manager : {{manager_comment}}

La déduction sera effectuée sur votre paye du mois indiqué.

Vous pouvez consulter les détails sur votre dashboard :
{{dashboard_url}}

Cordialement,
L'équipe Boulangerie Ange
```

---

### 5. Créer le Template 4 : Acompte Rejeté

**Nom du template :** `Demande Acompte - Rejeté`

**ID du template :** Notez l'ID (format : `template_xxxxxxx`)

**Variables à utiliser :**
- `{{to_name}}` - Nom du salarié
- `{{amount}}` - Montant demandé
- `{{deduction_month}}` - Mois de déduction
- `{{manager_comment}}` - Raison du rejet
- `{{rejection_date}}` - Date de rejet
- `{{dashboard_url}}` - URL du dashboard salarié

**Exemple de contenu :**
```
Bonjour {{to_name}},

❌ Votre demande d'acompte a été rejetée.

📋 Détails :
- Montant demandé : {{amount}}€
- Mois de déduction demandé : {{deduction_month}}
- Date de rejet : {{rejection_date}}
- Raison : {{manager_comment}}

Si vous avez des questions, n'hésitez pas à contacter votre manager.

Vous pouvez consulter les détails sur votre dashboard :
{{dashboard_url}}

Cordialement,
L'équipe Boulangerie Ange
```

---

## ⚙️ Mise à jour du Code

Une fois que vous avez créé les templates et noté leurs IDs, vous devez modifier le fichier :

**`backend/services/emailService.js`**

Remplacez les IDs de templates par les vrais IDs que vous avez créés :

```javascript
// Ligne 98
return await emailServiceAlternative.sendViaEmailJSTemplate(
  'VOTRE_VRAI_TEMPLATE_ID_1', // ← Remplacez par l'ID du template "Confirmation Salarié"
  employeeEmail, 
  templateParams
);

// Ligne 121
return await emailServiceAlternative.sendViaEmailJSTemplate(
  'VOTRE_VRAI_TEMPLATE_ID_2', // ← Remplacez par l'ID du template "Notification Manager"
  managerEmail, 
  templateParams
);

// Ligne 143
return await emailServiceAlternative.sendViaEmailJSTemplate(
  'VOTRE_VRAI_TEMPLATE_ID_3', // ← Remplacez par l'ID du template "Approuvé"
  employeeEmail, 
  templateParams
);

// Ligne 165
return await emailServiceAlternative.sendViaEmailJSTemplate(
  'VOTRE_VRAI_TEMPLATE_ID_4', // ← Remplacez par l'ID du template "Rejeté"
  employeeEmail, 
  templateParams
);
```

---

## 🧪 Test des Templates

### Test 1 : Confirmation Salarié

**Variables de test :**
```
to_name = "Anaïs"
amount = 400
deduction_month = "octobre 2025"
request_date = "31/10/2025"
dashboard_url = "https://www.filmara.fr/plan/employee-dashboard.html"
```

### Test 2 : Notification Manager

**Variables de test :**
```
to_name = "Manager"
employee_name = "Anaïs"
amount = 400
deduction_month = "octobre 2025"
comment = "Aucun commentaire"
request_date = "31/10/2025"
admin_url = "https://www.filmara.fr/plan/employees"
```

### Test 3 : Acompte Approuvé

**Variables de test :**
```
to_name = "Anaïs"
amount = 400
deduction_month = "octobre 2025"
manager_comment = "Approuvé"
approval_date = "31/10/2025"
dashboard_url = "https://www.filmara.fr/plan/employee-dashboard.html"
```

### Test 4 : Acompte Rejeté

**Variables de test :**
```
to_name = "Anaïs"
amount = 400
deduction_month = "octobre 2025"
manager_comment = "Budget insuffisant"
rejection_date = "31/10/2025"
dashboard_url = "https://www.filmara.fr/plan/employee-dashboard.html"
```

---

## ✅ Checklist de Configuration

- [ ] Créé le template "Confirmation Salarié" dans EmailJS
- [ ] Noté l'ID du template "Confirmation Salarié"
- [ ] Créé le template "Notification Manager" dans EmailJS
- [ ] Noté l'ID du template "Notification Manager"
- [ ] Créé le template "Approuvé" dans EmailJS
- [ ] Noté l'ID du template "Approuvé"
- [ ] Créé le template "Rejeté" dans EmailJS
- [ ] Noté l'ID du template "Rejeté"
- [ ] Modifié `backend/services/emailService.js` avec les vrais IDs
- [ ] Testé l'envoi d'un email de confirmation
- [ ] Testé l'envoi d'un email de notification
- [ ] Testé l'envoi d'un email d'approbation
- [ ] Testé l'envoi d'un email de rejet

---

## 🚨 Note Importante

**Les IDs de templates doivent être exactement ceux affichés dans EmailJS.** 

Le format est généralement : `template_xxxxxxxxx` (par exemple : `template_abc123def`)

N'utilisez PAS les noms de templates (`template_advance_request_employee`), mais les VRAIS IDs affichés dans le dashboard EmailJS.

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez que les templates sont bien créés dans EmailJS
2. Vérifiez que les IDs sont correctement copiés dans le code
3. Vérifiez que votre service EmailJS est configuré (`EMAILJS_SERVICE_ID` dans Render)
4. Vérifiez les logs Render pour voir les erreurs détaillées
