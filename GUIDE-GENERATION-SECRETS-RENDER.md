# 🔐 Guide : Génération de Nouveaux Secrets et Mise à Jour Render

## ⚠️ IMPORTANT : Secrets Exposés

Les secrets suivants ont été exposés sur GitHub et doivent être changés :

1. **MongoDB** : Utilisateur `phimjc` / Mot de passe `ZDOPZA2Kd8ylewoR`
2. **JWT_SECRET** : `a22/JbwO0C/zuixj0eNBq1rWKb+KBEvckPlw+T+dWbEDXH2S2FvxM2L5KoIg5WeNLWiDPgj5rlvNldE3kSN41A==`
3. **SMTP Passwords** : `#heulph:N8N5`, `#heulph:LON5`, `iazithmolbunifyv`

---

## 🔑 Étape 1 : Générer de Nouveaux Secrets

### 1.1. Générer un Nouveau JWT_SECRET

**Option A : En ligne de commande (Windows PowerShell) :**
```powershell
# Générer un secret de 64 caractères
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

**Option B : En ligne (recommandé) :**
- Allez sur https://generate-secret.vercel.app/64
- Cliquez sur "Generate"
- Copiez le secret généré

**Option C : Avec OpenSSL (si installé) :**
```bash
openssl rand -base64 64
```

**Exemple de nouveau secret généré :**
```
Kx9mP2vQ7nR4tY8uI1oA5sD6fG3hJ0kL9zX2cV5bN8mQ1wE4rT7yU6iO3pA9sD
```

---

### 1.2. Changer le Mot de Passe MongoDB

1. Allez sur https://cloud.mongodb.com/v2/68a190e2a87cb0633ac09252#/security/database
2. Trouvez l'utilisateur `phimjc`
3. Cliquez sur **Edit** ou **Change Password**
4. Générez un nouveau mot de passe fort (minimum 12 caractères, lettres + chiffres + symboles)
5. **IMPORTANT** : Notez le nouveau mot de passe, vous en aurez besoin pour mettre à jour Render

**Exemple de nouveau mot de passe :**
```
MyNewSecureP@ssw0rd2025!
```

---

### 1.3. Changer les Mots de Passe SMTP

#### Pour SFTP (NAS) :
- Changez le mot de passe dans votre interface NAS/OVH
- Nouveau mot de passe : `VotreNouveauMotDePasseSFTP2025!`

#### Pour SMTP OVH :
- Changez le mot de passe dans votre interface OVH
- Nouveau mot de passe : `VotreNouveauMotDePasseSMTP2025!`

#### Pour Gmail App Password :
1. Allez sur https://myaccount.google.com/apppasswords
2. Créez un nouveau App Password
3. Copiez le nouveau mot de passe généré

---

## 🔧 Étape 2 : Mettre à Jour Render - Service Arras (api-4-pbfy)

### 2.1. Accéder aux Variables d'Environnement

1. Allez sur https://dashboard.render.com
2. Sélectionnez le service **`boulangerie-planning-api-4-pbfy`**
3. Allez dans **Environment** → **Environment Variables**

### 2.2. Mettre à Jour les Variables

#### A. MONGODB_URI

**Ancienne valeur (EXPOSÉE) :**
```
mongodb+srv://phimjc:ZDOPZA2Kd8ylewoR@cluster0.4huietv.mongodb.net/boulangerie-planning?retryWrites=true&w=majority
```

**Nouvelle valeur (à créer) :**
```
mongodb+srv://phimjc:VOTRE_NOUVEAU_MOT_DE_PASSE@cluster0.4huietv.mongodb.net/boulangerie-planning?retryWrites=true&w=majority
```

**Action :**
1. Trouvez la variable `MONGODB_URI`
2. Cliquez sur **Edit** (icône crayon)
3. Remplacez `ZDOPZA2Kd8ylewoR` par votre nouveau mot de passe MongoDB
4. **IMPORTANT** : Si le mot de passe contient des caractères spéciaux, encodez-les :
   - `@` → `%40`
   - `#` → `%23`
   - `$` → `%24`
   - `%` → `%25`
   - `&` → `%26`
   - `+` → `%2B`
   - `=` → `%3D`
5. Cliquez sur **Save Changes**

#### B. JWT_SECRET

**Ancienne valeur (EXPOSÉE) :**
```
a22/JbwO0C/zuixj0eNBq1rWKb+KBEvckPlw+T+dWbEDXH2S2FvxM2L5KoIg5WeNLWiDPgj5rlvNldE3kSN41A==
```

**Nouvelle valeur (à générer) :**
```
VOTRE_NOUVEAU_JWT_SECRET_GENERE
```

**Action :**
1. Trouvez la variable `JWT_SECRET`
2. Cliquez sur **Edit**
3. Remplacez par le nouveau secret généré (étape 1.1)
4. Cliquez sur **Save Changes**

#### C. SFTP_PASSWORD (si utilisé)

**Ancienne valeur (EXPOSÉE) :**
```
#heulph:N8N5
```

**Nouvelle valeur :**
```
VOTRE_NOUVEAU_MOT_DE_PASSE_SFTP
```

**Action :**
1. Trouvez la variable `SFTP_PASSWORD`
2. Cliquez sur **Edit**
3. Remplacez par le nouveau mot de passe SFTP
4. Cliquez sur **Save Changes**

#### D. SMTP_PASS_OVH (si utilisé)

**Ancienne valeur (EXPOSÉE) :**
```
#heulph:LON5
```

**Nouvelle valeur :**
```
VOTRE_NOUVEAU_MOT_DE_PASSE_SMTP_OVH
```

**Action :**
1. Trouvez la variable `SMTP_PASS_OVH`
2. Cliquez sur **Edit**
3. Remplacez par le nouveau mot de passe SMTP OVH
4. Cliquez sur **Save Changes**

#### E. SMTP_PASS (Gmail, si utilisé)

**Ancienne valeur (EXPOSÉE) :**
```
iazithmolbunifyv
```

**Nouvelle valeur :**
```
VOTRE_NOUVEAU_APP_PASSWORD_GMAIL
```

**Action :**
1. Trouvez la variable `SMTP_PASS`
2. Cliquez sur **Edit**
3. Remplacez par le nouveau App Password Gmail
4. Cliquez sur **Save Changes**

---

## 🔧 Étape 3 : Mettre à Jour Render - Service Longuenesse (api-3)

### 3.1. Accéder aux Variables d'Environnement

1. Allez sur https://dashboard.render.com
2. Sélectionnez le service **`boulangerie-planning-api-3`**
3. Allez dans **Environment** → **Environment Variables**

### 3.2. Mettre à Jour les Variables

**Répétez les mêmes étapes que pour Arras (Étape 2.2) :**

- `MONGODB_URI` → Utilisez le même nouveau mot de passe MongoDB
- `JWT_SECRET` → **Générez un NOUVEAU secret différent de celui d'Arras**
- `SFTP_PASSWORD` → Utilisez le même nouveau mot de passe SFTP
- `SMTP_PASS_OVH` → Utilisez le même nouveau mot de passe SMTP OVH
- `SMTP_PASS` → Utilisez le même nouveau App Password Gmail

**⚠️ IMPORTANT :** Le `JWT_SECRET` doit être **DIFFÉRENT** entre Arras et Longuenesse !

---

## 🔄 Étape 4 : Redémarrer les Services

Après avoir mis à jour toutes les variables :

### 4.1. Redémarrer Arras (api-4-pbfy)

1. Dans Render Dashboard → `boulangerie-planning-api-4-pbfy`
2. Cliquez sur **Manual Deploy** → **Deploy latest commit**
3. Attendez que le déploiement se termine (2-3 minutes)

### 4.2. Redémarrer Longuenesse (api-3)

1. Dans Render Dashboard → `boulangerie-planning-api-3`
2. Cliquez sur **Manual Deploy** → **Deploy latest commit**
3. Attendez que le déploiement se termine (2-3 minutes)

---

## ✅ Étape 5 : Vérifier que Tout Fonctionne

### 5.1. Tester Arras

1. Allez sur https://boulangerie-planning-api-4-pbfy.onrender.com/api/health
2. Vous devriez voir : `{"status":"ok"}`
3. Testez la connexion à l'application : https://www.filmara.fr/plan

### 5.2. Tester Longuenesse

1. Allez sur https://boulangerie-planning-api-3.onrender.com/api/health
2. Vous devriez voir : `{"status":"ok"}`
3. Testez la connexion à l'application : https://www.filmara.fr/lon

### 5.3. Vérifier les Logs

Dans Render Dashboard, vérifiez les logs des deux services :
- Pas d'erreurs de connexion MongoDB
- Pas d'erreurs JWT
- Service démarré correctement

---

## 📋 Checklist Complète

### MongoDB
- [ ] Nouveau mot de passe MongoDB généré
- [ ] Mot de passe changé dans MongoDB Atlas
- [ ] `MONGODB_URI` mis à jour dans Render (Arras)
- [ ] `MONGODB_URI` mis à jour dans Render (Longuenesse)

### JWT
- [ ] Nouveau `JWT_SECRET` généré pour Arras
- [ ] Nouveau `JWT_SECRET` généré pour Longuenesse (différent)
- [ ] `JWT_SECRET` mis à jour dans Render (Arras)
- [ ] `JWT_SECRET` mis à jour dans Render (Longuenesse)

### SMTP
- [ ] Nouveau mot de passe SFTP généré
- [ ] `SFTP_PASSWORD` mis à jour dans Render (Arras)
- [ ] `SFTP_PASSWORD` mis à jour dans Render (Longuenesse)
- [ ] Nouveau mot de passe SMTP OVH généré
- [ ] `SMTP_PASS_OVH` mis à jour dans Render (Arras)
- [ ] `SMTP_PASS_OVH` mis à jour dans Render (Longuenesse)
- [ ] Nouveau App Password Gmail généré
- [ ] `SMTP_PASS` mis à jour dans Render (Arras)
- [ ] `SMTP_PASS` mis à jour dans Render (Longuenesse)

### Redémarrage
- [ ] Service Arras redémarré
- [ ] Service Longuenesse redémarré
- [ ] Tests de connexion réussis

---

## 🆘 En Cas de Problème

### Erreur de Connexion MongoDB
- Vérifiez que le nouveau mot de passe est correct
- Vérifiez que les caractères spéciaux sont encodés dans l'URI
- Vérifiez que l'utilisateur MongoDB a toujours les droits

### Erreur JWT
- Vérifiez que le `JWT_SECRET` est bien mis à jour
- Vérifiez qu'il n'y a pas d'espaces avant/après
- Redémarrez le service après la mise à jour

### Erreur SMTP
- Vérifiez que les nouveaux mots de passe sont corrects
- Vérifiez que les comptes email sont toujours actifs
- Testez l'envoi d'un email depuis l'application

---

## 🔒 Sécurité Future

Pour éviter que cela se reproduise :

1. **Ne jamais commiter de fichiers `.env` ou contenant des secrets**
2. **Utiliser `.gitignore` pour exclure les fichiers sensibles**
3. **Utiliser des variables d'environnement dans Render uniquement**
4. **Ne jamais partager les secrets par email ou chat**

---

## 📝 Notes Importantes

- ⚠️ **Changez TOUS les secrets exposés**, pas seulement ceux que vous utilisez actuellement
- ⚠️ **Les anciens secrets restent dans l'historique Git** - changez-les quand même
- ⚠️ **Testez bien après chaque changement** pour éviter de casser l'application
- ⚠️ **Gardez une copie sécurisée des nouveaux secrets** (dans un gestionnaire de mots de passe)







