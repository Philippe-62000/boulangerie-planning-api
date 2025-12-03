# 🔧 Variables d'Environnement - Longuenesse

## 📋 Guide de Modification des Variables .env

Après avoir importé le `.env` d'Arras, voici quelles variables **DOIVENT** être modifiées et lesquelles peuvent **RESTER IDENTIQUES**.

---

## ❌ Variables à MODIFIER (OBLIGATOIRE)

### 1. **MONGODB_URI** ⚠️ CRITIQUE

**Arras :**
```
MONGODB_URI=mongodb+srv://phimjc:ZDOPZA2Kd8ylewoR@cluster0.4huietv.mongodb.net/boulangerie-planning?retryWrites=true&w=majority
```

**Longuenesse (À MODIFIER) :**
```
MONGODB_URI=mongodb+srv://phimjc:ZDOPZA2Kd8ylewoR@cluster0.4huietv.mongodb.net/boulangerie-planning-longuenesse?retryWrites=true&w=majority
```

**Changement :** `boulangerie-planning` → `boulangerie-planning-longuenesse`

---

### 2. **JWT_SECRET** ⚠️ CRITIQUE

**Arras :**
```
JWT_SECRET=<clé_secrète_arras>
```

**Longuenesse (À MODIFIER - GÉNÉRER UNE NOUVELLE CLÉ) :**
```
JWT_SECRET=<générer_une_nouvelle_clé_unique>
```

**Pourquoi :** Chaque instance doit avoir sa propre clé JWT pour la sécurité.

**Comment générer :**
- En ligne : https://generate-secret.vercel.app/32
- Ou en ligne de commande : `openssl rand -hex 32`

---

### 3. **CORS_ORIGIN** ⚠️ IMPORTANT

**Arras :**
```
CORS_ORIGIN=https://www.filmara.fr,https://www.filmara.fr/plan,http://localhost:3000
```

**Longuenesse (À MODIFIER - AJOUTER /lon) :**
```
CORS_ORIGIN=https://www.filmara.fr,https://www.filmara.fr/plan,https://www.filmara.fr/lon,http://localhost:3000
```

**Changement :** Ajouter `https://www.filmara.fr/lon` à la liste

---

### 4. **EMAILJS_SERVICE_ID** ⚠️ CRITIQUE

**Arras :**
```
EMAILJS_SERVICE_ID=service_xxxxx_arras
```

**Longuenesse (À MODIFIER - NOUVEAU SERVICE) :**
```
EMAILJS_SERVICE_ID=service_xxxxx_longuenesse
```

**Pourquoi :** Pour éviter que les emails d'Arras et Longuenesse se mélangent.

---

### 5. **EMAILJS_TEMPLATE_ID** ⚠️ CRITIQUE

**Arras :**
```
EMAILJS_TEMPLATE_ID=template_xxxxx_arras
```

**Longuenesse (À MODIFIER - NOUVEAUX TEMPLATES) :**
```
EMAILJS_TEMPLATE_ID=template_xxxxx_longuenesse
```

**Pourquoi :** Chaque magasin doit avoir ses propres templates d'email.

---

### 6. **EMAILJS_USER_ID** (Peut être identique si même compte)

**Arras :**
```
EMAILJS_USER_ID=EHw0fFSAwQ_4SfY6Z
```

**Longuenesse :**
- **Option A (Recommandé) :** Créer un nouveau compte EmailJS → Nouveau USER_ID
- **Option B :** Utiliser le même USER_ID si vous utilisez le même compte EmailJS

**Si même compte EmailJS :**
```
EMAILJS_USER_ID=EHw0fFSAwQ_4SfY6Z  (peut rester identique)
```

**Si nouveau compte EmailJS :**
```
EMAILJS_USER_ID=<nouveau_user_id>  (à modifier)
```

---

### 7. **EMAILJS_PRIVATE_KEY** (Peut être identique si même compte)

**Arras :**
```
EMAILJS_PRIVATE_KEY=jKt0xxxxx...
```

**Longuenesse :**
- **Si même compte EmailJS :** Peut rester identique
- **Si nouveau compte EmailJS :** Générer une nouvelle clé privée

**Si même compte :**
```
EMAILJS_PRIVATE_KEY=jKt0xxxxx...  (peut rester identique)
```

**Si nouveau compte :**
```
EMAILJS_PRIVATE_KEY=<nouvelle_clé_privée>  (à modifier)
```

---

### 8. **SFTP_BASE_PATH** ⚠️ CRITIQUE

**Arras :**
```
SFTP_BASE_PATH=/n8n/uploads/documents
```
*(Ou variable absente, utilise le défaut `/n8n/uploads/documents`)*

**Longuenesse (À MODIFIER - AJOUTER CETTE VARIABLE) :**
```
SFTP_BASE_PATH=/n8n/uploads/documents-longuenesse
```

**Note :** Il y a aussi `NAS_BASE_PATH` pour les documents généraux (même principe).

**Changement :** Ajouter cette variable avec le nouveau chemin

---

### 9. **STORE_NAME** (Recommandé)

**Arras :**
```
STORE_NAME=Boulangerie Ange - Arras
```
*(Ou variable absente, utilise le défaut)*

**Longuenesse (À MODIFIER - AJOUTER CETTE VARIABLE) :**
```
STORE_NAME=Boulangerie Ange - Longuenesse
```

**Changement :** Ajouter cette variable pour personnaliser les emails

---

## ✅ Variables qui peuvent RESTER IDENTIQUES

### 1. **SFTP_PASSWORD** ✅

```
SFTP_PASSWORD=<même_mot_de_passe>
```

**Pourquoi :** Même serveur NAS, même utilisateur, même mot de passe.

---

### 2. **SMTP_* (Configuration Email SMTP)** ✅

Si vous utilisez le même serveur email SMTP :

```
SMTP_HOST_OVH=ssl0.ovh.net
SMTP_PORT_OVH=465
SMTP_USER_OVH=<même_email>
SMTP_PASS_OVH=<même_mot_de_passe>
SMTP_SECURE_OVH=true
SMTP_USER=<même_email>
EMAIL_USER=<même_email>
EMAIL_PASSWORD=<même_mot_de_passe>
```

**Pourquoi :** Si vous utilisez le même compte email SMTP pour les deux magasins.

**⚠️ Note :** Si vous voulez séparer complètement, créez un nouveau compte email SMTP.

---

### 3. **NODE_ENV** ✅

```
NODE_ENV=production
```

**Pourquoi :** Même environnement de production.

---

### 4. **PORT** (Peut varier selon Render)

**Arras :**
```
PORT=10000
```

**Longuenesse :**
```
PORT=10000
```
*(Ou laissez Render le gérer automatiquement)*

**Pourquoi :** Render peut assigner un port différent, mais généralement identique.

---

### 5. **ACCOUNTANT_EMAIL** (Si même comptable)

```
ACCOUNTANT_EMAIL=<même_email_comptable>
```

**Pourquoi :** Si le même comptable gère les deux magasins.

**⚠️ Note :** Si comptables différents, modifier cette variable.

---

## 📝 Checklist de Modification

### Variables à Modifier (OBLIGATOIRE) :

- [ ] **MONGODB_URI** → Changer le nom de la base : `boulangerie-planning-longuenesse`
- [ ] **JWT_SECRET** → Générer une nouvelle clé unique
- [ ] **CORS_ORIGIN** → Ajouter `https://www.filmara.fr/lon`
- [ ] **EMAILJS_SERVICE_ID** → Nouveau service EmailJS
- [ ] **EMAILJS_TEMPLATE_ID** → Nouveaux templates EmailJS
- [ ] **SFTP_BASE_PATH** → Ajouter : `/n8n/sick-leaves-longuenesse`
- [ ] **STORE_NAME** → Ajouter : `Boulangerie Ange - Longuenesse`

### Variables Optionnelles (selon votre configuration) :

- [ ] **EMAILJS_USER_ID** → Modifier si nouveau compte EmailJS
- [ ] **EMAILJS_PRIVATE_KEY** → Modifier si nouveau compte EmailJS
- [ ] **ACCOUNTANT_EMAIL** → Modifier si comptable différent

### Variables qui Restent Identiques :

- [x] **SFTP_PASSWORD** → Même mot de passe
- [x] **SMTP_*** → Même configuration SMTP (si même serveur email)
- [x] **NODE_ENV** → `production`
- [x] **PORT** → Généralement identique

---

## 🎯 Résumé Rapide

### À Modifier ABSOLUMENT :

1. `MONGODB_URI` → `boulangerie-planning-longuenesse`
2. `JWT_SECRET` → Nouvelle clé
3. `CORS_ORIGIN` → Ajouter `/lon`
4. `EMAILJS_SERVICE_ID` → Nouveau service
5. `EMAILJS_TEMPLATE_ID` → Nouveaux templates
6. `SFTP_BASE_PATH` → `/n8n/sick-leaves-longuenesse`
7. `STORE_NAME` → `Boulangerie Ange - Longuenesse`

### Peuvent Rester Identiques :

- `SFTP_PASSWORD`
- `SMTP_*` (si même serveur email)
- `NODE_ENV`
- `PORT`
- `EMAILJS_USER_ID` et `EMAILJS_PRIVATE_KEY` (si même compte EmailJS)

---

## ⚠️ Points Critiques

1. **MONGODB_URI** : ⚠️ **NE JAMAIS** utiliser la même base que Arras
2. **JWT_SECRET** : ⚠️ **NE JAMAIS** utiliser la même clé que Arras
3. **EMAILJS_SERVICE_ID** : ⚠️ **NE JAMAIS** utiliser le même service qu'Arras
4. **SFTP_BASE_PATH** : ⚠️ **NE JAMAIS** utiliser le même répertoire qu'Arras

Ces 4 variables sont **CRITIQUES** pour éviter les mélanges de données !

---

## 🔍 Vérification

Après avoir modifié les variables, vérifiez dans Render :

1. **Environment Variables** → Toutes les variables sont présentes
2. **Logs** → Vérifiez que MongoDB se connecte à la bonne base
3. **Test API** → `curl https://boulangerie-planning-api-3.onrender.com/api/health`

---

## 📞 En Cas de Problème

Si le backend ne démarre pas :
1. Vérifiez les logs Render
2. Vérifiez que toutes les variables obligatoires sont définies
3. Vérifiez que `MONGODB_URI` pointe vers `boulangerie-planning-longuenesse`
4. Vérifiez que `SFTP_BASE_PATH` est défini

