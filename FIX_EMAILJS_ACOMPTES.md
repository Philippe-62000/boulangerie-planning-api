# 🔧 Correction EmailJS - Demandes d'Acompte

## ❌ Problème identifié

Lors de l'envoi d'emails pour les demandes d'acompte, une erreur 422 était retournée par EmailJS :
```
"The recipients address is corrupted"
```

### Cause du problème

Les fonctions d'envoi d'emails pour les acomptes utilisaient incorrectement `sendEmail()` qui attend :
- `sendEmail(to, subject, htmlContent, textContent)`

Mais elles passaient :
- `sendEmail('template_advance_request_employee', templateParams)`

Cela causait une confusion entre le nom du template et l'adresse email du destinataire.

## ✅ Solution implémentée

### 1. Nouvelle fonction `sendViaEmailJSTemplate()`

**Fichier :** `backend/services/emailServiceAlternative.js`

Ajout d'une fonction spécialisée pour envoyer des emails via EmailJS avec des templates :
```javascript
async sendViaEmailJSTemplate(templateId, toEmail, templateParams)
```

**Paramètres :**
- `templateId` : L'ID du template EmailJS (ex: `'template_advance_request_employee'`)
- `toEmail` : L'adresse email du destinataire
- `templateParams` : Les paramètres du template (sans `to_email` qui est ajouté automatiquement)

**Fonctionnalités :**
- Ajoute automatiquement `to_email` aux paramètres du template
- Utilise le bon format d'appel API EmailJS
- Gère les erreurs correctement

### 2. Mise à jour des fonctions d'acompte

**Fichier :** `backend/services/emailService.js`

Toutes les fonctions ont été mises à jour pour utiliser `sendViaEmailJSTemplate()` :

#### `sendAdvanceRequestConfirmation()`
- **Avant :** `sendEmail('template_advance_request_employee', templateParams)`
- **Maintenant :** `sendViaEmailJSTemplate('template_advance_request_employee', employeeEmail, templateParams)`

#### `sendAdvanceRequestNotification()`
- **Avant :** `sendEmail('template_advance_request_manager', templateParams)`
- **Maintenant :** `sendViaEmailJSTemplate('template_advance_request_manager', managerEmail, templateParams)`

#### `sendAdvanceApproved()`
- **Avant :** `sendEmail('template_advance_approved', templateParams)`
- **Maintenant :** `sendViaEmailJSTemplate('template_advance_approved', employeeEmail, templateParams)`

#### `sendAdvanceRejected()`
- **Avant :** `sendEmail('template_advance_rejected', templateParams)`
- **Maintenant :** `sendViaEmailJSTemplate('template_advance_rejected', employeeEmail, templateParams)`

## 📋 Fichiers modifiés

1. ✅ `backend/services/emailServiceAlternative.js`
   - Ajout de `sendViaEmailJSTemplate()`
   
2. ✅ `backend/services/emailService.js`
   - Mise à jour des 4 fonctions d'acompte

## 🧪 Tests à effectuer

Après le déploiement sur Render :

1. **Création d'une demande d'acompte**
   - Un salarié crée une demande d'acompte
   - Vérifier que l'email de confirmation est reçu
   - Vérifier que l'email de notification est reçu par le manager

2. **Approbation d'une demande**
   - Un manager approuve une demande
   - Vérifier que l'email d'approbation est reçu par le salarié

3. **Rejet d'une demande**
   - Un manager rejette une demande
   - Vérifier que l'email de rejet est reçu par le salarié

## 🚀 Déploiement

Le commit a été créé avec le message :
```
Fix: Correction envoi emails EmailJS pour demandes d'acompte - Utilisation de sendViaEmailJSTemplate avec templateId et paramètres corrects
```

**Pour déployer :**
```bash
git push origin main
```

Le backend sera automatiquement déployé sur Render en ~2-3 minutes.

## ✅ Résultat attendu

Après le déploiement, tous les emails liés aux demandes d'acompte devraient être envoyés correctement via EmailJS sans erreur 422.

---

**Date :** 31/10/2025  
**Version :** 1.1.1  
**Type :** Bugfix

