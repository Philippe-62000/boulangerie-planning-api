# 📧 Migration EmailJS → SMTP OVH

## ✅ Modifications effectuées

### 1. Fonction SMTP ajoutée
- Nouvelle fonction `sendViaSMTP()` dans `emailServiceAlternative.js`
- Utilise nodemailer (déjà installé)
- Configuration SMTP OVH par défaut

### 2. Priorité modifiée
- **Option 1 (priorité)** : SMTP OVH
- **Option 2 (fallback)** : EmailJS (si SMTP échoue)
- **Option 3** : Webhook
- **Option 4** : Log local

### 3. Templates conservés
- ✅ Les templates de la base de données continuent de fonctionner
- ✅ Modification via l'interface toujours possible
- ✅ Aucun changement dans la gestion des templates

## 🔧 Variables d'environnement nécessaires

### Variables spécifiques OVH (recommandé - pour éviter les conflits)

Ajoutez ces variables dans votre configuration Render :

```env
# SMTP OVH - Variables spécifiques (ne conflictent pas avec les variables existantes)
SMTP_HOST_OVH=ssl0.ovh.net
SMTP_PORT_OVH=465
SMTP_SECURE_OVH=true
SMTP_USER_OVH=votre-email@boulangerie-ange.fr
SMTP_PASS_OVH=votre-mot-de-passe-email
```

### Fallback vers variables existantes

Si les variables `SMTP_*_OVH` ne sont pas définies, le système utilisera les variables existantes :
- `SMTP_HOST` (si `SMTP_HOST_OVH` n'existe pas)
- `SMTP_USER` (si `SMTP_USER_OVH` n'existe pas)
- `SMTP_PASS` (si `SMTP_PASS_OVH` n'existe pas)

### Valeurs par défaut

Si aucune variable n'est définie, les valeurs par défaut OVH sont utilisées :
- **SMTP_HOST** : `ssl0.ovh.net`
- **SMTP_PORT** : `465` (SSL)
- **SMTP_SECURE** : `true`

### Configuration alternative (port 587 - TLS)

Si vous préférez utiliser le port 587 avec TLS :

```env
SMTP_HOST_OVH=ssl0.ovh.net
SMTP_PORT_OVH=587
SMTP_SECURE_OVH=false
SMTP_USER_OVH=votre-email@boulangerie-ange.fr
SMTP_PASS_OVH=votre-mot-de-passe-email
```

## 📋 Configuration sur Render

### Variables à ajouter/modifier

Sur Render, dans l'onglet "Environment", ajoutez/modifiez ces variables :

1. **SMTP_HOST_OVH** = `ssl0.ovh.net` (remplace `smtp.gmail.com` si vous modifiez `SMTP_HOST`)
2. **SMTP_USER_OVH** = votre adresse email OVH (ex: `contact@boulangerie-ange.fr`)
3. **SMTP_PASS_OVH** = le mot de passe de votre email OVH
4. **SMTP_PORT_OVH** = `465` (optionnel, 465 par défaut)
5. **SMTP_SECURE_OVH** = `true` (optionnel, true par défaut)

### ⚠️ Important

- Les variables `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` existantes ne seront **pas modifiées**
- Le système utilisera d'abord `SMTP_*_OVH`, puis fera un fallback vers `SMTP_*` si elles n'existent pas
- Vous pouvez garder les deux configurations (Gmail et OVH) en utilisant les variables `_OVH`

## 🎯 Comportement

### Envoi d'emails
1. Le système essaie d'abord SMTP OVH
2. Si SMTP échoue, fallback vers EmailJS (si disponible)
3. Si EmailJS échoue, fallback vers webhook
4. Si tout échoue, log local

### Adresse expéditeur
- L'adresse affichée dans les emails sera celle configurée dans `SMTP_USER`
- Format : `"Boulangerie Ange - Arras" <votre-email@boulangerie-ange.fr>`

### Templates
- ✅ Tous les templates de la base de données fonctionnent normalement
- ✅ Modification via l'interface Paramètres → Templates Email
- ✅ Aucun changement dans la gestion des templates

## 🚀 Déploiement

Une fois les variables d'environnement configurées sur Render :
1. Le backend redéploiera automatiquement
2. Les emails utiliseront SMTP OVH en priorité
3. EmailJS servira de fallback si SMTP est indisponible

## ⚠️ Notes importantes

- Le mot de passe email doit être configuré dans les variables d'environnement Render (sécurisé)
- Si SMTP_USER n'est pas défini, le système utilisera EMAIL_USER comme fallback
- Les templates EmailJS ne sont plus nécessaires (mais peuvent rester comme fallback)

