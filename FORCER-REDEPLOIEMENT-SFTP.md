# 🔧 Forcer le Redéploiement - Corrections SFTP

## ❌ Problème
Le service `boulangerie-planning-api-4` (ou `boulangerie-planning-api-4-pbfy`) ne s'est pas redéployé automatiquement après le push GitHub.

## ✅ Solutions

### Solution 1 : Déploiement Manuel sur Render (RECOMMANDÉ)

1. **Allez sur Render Dashboard**
   - URL : https://dashboard.render.com
   - Connectez-vous avec vos identifiants

2. **Sélectionnez le service**
   - Cherchez `boulangerie-planning-api-4` ou `boulangerie-planning-api-4-pbfy`
   - Cliquez dessus

3. **Lancez le déploiement manuel**
   - Cliquez sur le bouton **"Manual Deploy"** (en haut à droite)
   - Sélectionnez **"Deploy latest commit"**
   - Attendez que le déploiement se termine (2-5 minutes)

4. **Vérifiez les logs**
   - Onglet **"Logs"** pour voir le déploiement en cours
   - Statut devrait passer : `Queued` → `Building` → `Live` ✅

---

### Solution 2 : Vérifier Auto-Deploy

Si le déploiement automatique ne fonctionne pas :

1. **Dans Render Dashboard**
   - Sélectionnez votre service
   - Allez dans **Settings** → **Build & Deploy**

2. **Vérifiez les paramètres**
   - ✅ **Auto-Deploy** : Doit être sur **"Yes"**
   - ✅ **Branch** : Doit être **"main"**
   - ✅ **Root Directory** : Doit être **"backend"** (ou vide)

3. **Si Auto-Deploy est désactivé**
   - Activez-le en changeant "No" → "Yes"
   - Cliquez sur **"Save Changes"**
   - Le déploiement devrait se lancer automatiquement

---

### Solution 3 : Vérifier les Pipeline Minutes

Si Render bloque les déploiements :

1. **Vérifiez les minutes restantes**
   - Allez dans votre **Workspace** sur Render
   - Regardez les **"Pipeline Minutes"** restants
   - Render gratuit offre **750 minutes/mois**

2. **Si les minutes sont épuisées**
   - ⚠️ Les déploiements sont bloqués jusqu'au mois suivant
   - 💡 Solution : Utilisez **"Manual Deploy"** (Solution 1)
   - 💡 Alternative : Upgradez vers un plan payant

---

### Solution 4 : Vérifier les Webhooks GitHub

Si les webhooks ne fonctionnent pas :

1. **Sur GitHub**
   - Allez dans votre repo → **Settings** → **Webhooks**
   - Vérifiez s'il y a un webhook vers Render

2. **Si le webhook n'existe pas**
   - Render devrait le créer automatiquement
   - Sinon, créez-le manuellement :
     - **Payload URL** : `https://api.render.com/webhook/...` (trouvable dans Render Settings)
     - **Content type** : `application/json`
     - **Events** : `Just the push event`

---

## 📋 Corrections SFTP Déployées

Les fichiers suivants ont été modifiés :

- ✅ `backend/services/sftpService.js`
  - Gestion des connexions concurrentes (mutex)
  - Augmentation MaxListeners (évite les warnings)
  - Retry automatique sur erreurs de connexion
  - Réinitialisation du client en cas d'erreur
  - Vérification de l'état réel de la connexion
  - Timeout augmenté à 30 secondes
  - Keepalive pour maintenir la connexion

- ✅ `backend/controllers/documentController.js`
  - Meilleure gestion des erreurs SFTP
  - Déconnexion sécurisée dans le bloc finally
  - Vérification de l'état de connexion avant déconnexion

---

## 🧪 Vérification Après Déploiement

Une fois le déploiement terminé :

1. **Vérifiez les logs Render**
   - Onglet **"Logs"** du service
   - Cherchez : `✅ Connecté au NAS Synology`
   - Vérifiez qu'il n'y a plus d'erreurs `MaxListenersExceededWarning`

2. **Testez les téléchargements de documents**
   - Essayez de télécharger un document depuis l'interface
   - Vérifiez qu'il n'y a plus d'erreurs `connect: Not connected`
   - Vérifiez qu'il n'y a plus d'erreurs `Timed out while waiting for handshake`

3. **Surveillez les logs en temps réel**
   - Les erreurs SFTP répétées devraient disparaître
   - Les connexions devraient être plus stables

---

## 🚀 Scripts Disponibles

- **`force-sftp-fix-deploy.bat`** : Script pour forcer le push vers GitHub
- **`push-to-main.bat`** : Script standard pour push vers main

---

## ⚠️ Important

Si après le déploiement manuel les erreurs persistent :

1. Vérifiez les **variables d'environnement** sur Render :
   - `SFTP_PASSWORD` : Doit être défini
   - `NAS_BASE_PATH` : Doit être défini (optionnel)

2. Vérifiez la **connectivité réseau** :
   - Le serveur Render peut-il accéder à `philange.synology.me:22` ?
   - Vérifiez les logs pour les erreurs de connexion réseau

3. Contactez le **support Render** si le problème persiste

---

## 📞 Support

- **Render Dashboard** : https://dashboard.render.com
- **Documentation Render** : https://render.com/docs
- **Support Render** : Via le dashboard → Support









