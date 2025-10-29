# 🔧 Dépannage EmailJS - Demandes d'Acompte

## 🚨 Problèmes courants et solutions

### 1️⃣ Les emails ne sont pas envoyés

**Symptômes :**
- Aucun email reçu après création d'une demande
- Pas de logs d'envoi dans la console

**Solutions :**
1. **Vérifiez la configuration EmailJS :**
   ```javascript
   // Dans backend/services/emailService.js
   const emailServiceConfig = {
     serviceId: 'votre_service_id', // ✅ Vérifiez que c'est correct
     publicKey: 'votre_public_key'  // ✅ Vérifiez que c'est correct
   };
   ```

2. **Vérifiez les noms des templates :**
   - `template_advance_request_employee` ✅
   - `template_advance_request_manager` ✅
   - `template_advance_approved` ✅
   - `template_advance_rejected` ✅

3. **Vérifiez les permissions EmailJS :**
   - Service activé ✅
   - Templates publiés ✅
   - Quota non dépassé ✅

### 2️⃣ Erreur "Template not found"

**Symptômes :**
```
❌ Erreur envoi email: Template template_advance_request_employee not found
```

**Solutions :**
1. **Vérifiez le nom exact du template** dans EmailJS
2. **Assurez-vous que le template est publié** (pas en brouillon)
3. **Vérifiez l'ID du service** dans la configuration

### 3️⃣ Variables non remplacées dans l'email

**Symptômes :**
- Email reçu mais avec `{{to_name}}` au lieu du nom
- Variables vides ou non remplacées

**Solutions :**
1. **Vérifiez la syntaxe des variables :**
   ```html
   ✅ Correct: {{to_name}}
   ❌ Incorrect: {to_name} ou {{to_name }} ou {{ to_name }}
   ```

2. **Vérifiez que les variables sont définies** dans le code :
   ```javascript
   const templateParams = {
     to_name: employeeName,        // ✅ Variable définie
     amount: amount,               // ✅ Variable définie
     deduction_month: deductionMonth // ✅ Variable définie
   };
   ```

### 4️⃣ Email reçu mais mal formaté

**Symptômes :**
- Email reçu mais sans style CSS
- Mise en page cassée

**Solutions :**
1. **Vérifiez le HTML du template** dans EmailJS
2. **Assurez-vous que le CSS est dans la balise `<style>`**
3. **Testez le template** avec l'outil de test d'EmailJS

### 5️⃣ Erreur "Service not found"

**Symptômes :**
```
❌ Erreur envoi email: Service not found
```

**Solutions :**
1. **Vérifiez l'ID du service** dans EmailJS
2. **Vérifiez que le service est activé**
3. **Vérifiez la configuration** dans le code

### 6️⃣ Quota dépassé

**Symptômes :**
```
❌ Erreur envoi email: Quota exceeded
```

**Solutions :**
1. **Vérifiez votre quota** dans EmailJS
2. **Passez à un plan supérieur** si nécessaire
3. **Attendez le renouvellement** du quota

## 🔍 Diagnostic étape par étape

### Étape 1 : Vérifier les logs du serveur

```bash
# Recherchez dans les logs du serveur Render
grep "📧 Envoi" logs.txt
grep "❌ Erreur envoi email" logs.txt
grep "✅ Email envoyé" logs.txt
```

### Étape 2 : Tester un template manuellement

1. Allez sur [EmailJS](https://www.emailjs.com/)
2. Ouvrez un template
3. Cliquez sur "Test"
4. Utilisez les données de test fournies

### Étape 3 : Vérifier la configuration

```javascript
// Vérifiez ces valeurs dans backend/services/emailService.js
console.log('Service ID:', process.env.EMAILJS_SERVICE_ID);
console.log('Public Key:', process.env.EMAILJS_PUBLIC_KEY);
console.log('Template ID:', 'template_advance_request_employee');
```

### Étape 4 : Tester l'API EmailJS directement

```javascript
// Test direct de l'API EmailJS
const testEmail = async () => {
  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: 'votre_service_id',
        template_id: 'template_advance_request_employee',
        user_id: 'votre_public_key',
        template_params: {
          to_name: 'Test',
          amount: '100',
          deduction_month: 'Janvier 2025',
          request_date: '29/10/2025',
          dashboard_url: 'https://www.filmara.fr/plan/employee-dashboard.html'
        }
      })
    });
    
    if (response.ok) {
      console.log('✅ Email de test envoyé avec succès');
    } else {
      console.log('❌ Erreur envoi email:', response.status);
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
};
```

## 📊 Données de test pour chaque template

### template_advance_request_employee
```json
{
  "to_name": "Anaïs",
  "amount": "300",
  "deduction_month": "Mars 2025",
  "request_date": "29/10/2025",
  "dashboard_url": "https://www.filmara.fr/plan/employee-dashboard.html"
}
```

### template_advance_request_manager
```json
{
  "to_name": "Manager",
  "employee_name": "Anaïs",
  "amount": "300",
  "deduction_month": "Mars 2025",
  "comment": "Test des templates EmailJS",
  "request_date": "29/10/2025",
  "admin_url": "https://www.filmara.fr/plan/advance-requests"
}
```

### template_advance_approved
```json
{
  "to_name": "Anaïs",
  "amount": "300",
  "deduction_month": "Mars 2025",
  "manager_comment": "Demande approuvée pour test",
  "approval_date": "29/10/2025",
  "dashboard_url": "https://www.filmara.fr/plan/employee-dashboard.html"
}
```

### template_advance_rejected
```json
{
  "to_name": "Anaïs",
  "amount": "300",
  "deduction_month": "Mars 2025",
  "manager_comment": "Demande refusée pour test",
  "rejection_date": "29/10/2025",
  "dashboard_url": "https://www.filmara.fr/plan/employee-dashboard.html"
}
```

## 🆘 Support technique

### Logs à vérifier

1. **Logs du serveur Render :**
   - Recherchez les messages d'envoi d'email
   - Vérifiez les erreurs de configuration

2. **Logs du navigateur :**
   - Ouvrez les outils de développement
   - Vérifiez la console pour les erreurs

3. **Logs EmailJS :**
   - Connectez-vous à EmailJS
   - Vérifiez les logs d'envoi

### Contact

- **Documentation EmailJS :** [https://www.emailjs.com/docs/](https://www.emailjs.com/docs/)
- **Support EmailJS :** Via l'interface EmailJS
- **Logs du serveur :** Interface Render

## ✅ Checklist de vérification

- [ ] Service EmailJS activé
- [ ] 4 templates créés et publiés
- [ ] Noms des templates corrects
- [ ] Variables correctement définies
- [ ] Configuration dans le code
- [ ] Test d'envoi réussi
- [ ] Emails reçus correctement
- [ ] Formatage des emails correct

## 🔄 Test complet

Pour tester le système complet :

1. **Créez une demande d'acompte** depuis le dashboard employé
2. **Vérifiez la réception** des emails de confirmation
3. **Approuvez/rejetez** la demande depuis l'interface manager
4. **Vérifiez la réception** des emails d'approbation/rejet
5. **Consultez le récapitulatif** dans employee-status-print
