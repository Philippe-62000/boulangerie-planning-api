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

### Variables requises

**Important** : Les variables `SMTP_*_OVH` sont maintenant les seules utilisées. Les anciennes variables Gmail (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`) ont été supprimées du code.

Variables obligatoires :
- `SMTP_USER_OVH` : Adresse email OVH complète
- `SMTP_PASS_OVH` : Mot de passe de l'email OVH

Variables optionnelles :
- `SMTP_HOST_OVH` : Serveur SMTP (défaut: `ssl0.ovh.net`)
- `SMTP_PORT_OVH` : Port SMTP (défaut: `465`)
- `SMTP_SECURE_OVH` : SSL/TLS (défaut: `true`)

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

- **Les variables Gmail (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`) ne sont plus utilisées** - elles ont été supprimées du code
- Seules les variables `SMTP_*_OVH` sont utilisées
- Vous pouvez supprimer les anciennes variables Gmail de Render si vous le souhaitez

## 🎯 Comportement

### Envoi d'emails (plan gratuit Render)
1. Le système essaie d'abord SMTP OVH (échouera sur plan gratuit - ports bloqués)
2. **Fallback automatique vers EmailJS** (fonctionne parfaitement)
3. Si EmailJS échoue, fallback vers webhook
4. Si tout échoue, log local

**Note** : Sur plan gratuit Render, l'étape 1 échouera toujours, donc EmailJS sera utilisé systématiquement.

### Adresse expéditeur
- **Avec EmailJS (plan gratuit)** : L'adresse est configurée dans les templates EmailJS
- **Avec SMTP OVH (plan payant)** : L'adresse sera celle configurée dans `SMTP_USER_OVH`
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

- **Plan gratuit Render** : SMTP OVH ne fonctionnera pas (ports bloqués), EmailJS sera utilisé automatiquement
- **Plan payant Render** : SMTP OVH fonctionnera automatiquement si les variables sont configurées
- Le mot de passe email doit être configuré dans les variables d'environnement Render (sécurisé)
- Les templates EmailJS sont nécessaires pour le plan gratuit et fonctionnent parfaitement

## ❌ Limitation Render (Plans gratuits)

**Problème identifié** : Depuis le 26 septembre 2025, Render bloque officiellement le trafic sortant vers les ports SMTP classiques (25, 465 et 587) sur les services gratuits.

### Symptômes
- Erreur `ETIMEDOUT` sur les ports 465 et 587
- Toutes les tentatives de connexion SMTP directe échouent
- Le fallback vers EmailJS fonctionne correctement

### Source
Cette limitation est une politique officielle de Render pour les plans gratuits, mise en place pour prévenir l'abus et le spam.

### Solutions possibles

#### Option 1 : Garder EmailJS (recommandé pour plan gratuit)
- ✅ EmailJS fonctionne déjà parfaitement
- ✅ Pas de changement nécessaire
- ✅ Templates conservés
- ✅ Aucun coût supplémentaire

#### Option 2 : Passer à un plan Render payant
- Permet les connexions SMTP sortantes (ports 25, 465, 587)
- Coût mensuel supplémentaire (à partir de ~$7/mois)
- SMTP OVH fonctionnera alors automatiquement
- **Note** : Vérifiez la documentation Render pour confirmer que votre plan inclut les connexions SMTP sortantes

#### Option 3 : Utiliser un service SMTP relais (SendGrid, Mailgun, etc.)
- Utilise des APIs au lieu de SMTP direct
- Nécessite une modification du code
- Peut avoir des coûts selon le volume

### Recommandation

**Pour l'instant, garder EmailJS comme solution principale** car :
- ✅ Fonctionne parfaitement
- ✅ Pas de limitation de connexion
- ✅ Templates déjà configurés
- ✅ Aucun changement nécessaire

Le code SMTP OVH reste en place et sera automatiquement utilisé si vous passez à un plan Render payant à l'avenir.

