# 🔧 Corrections du Fichier .env pour Longuenesse

## ❌ Problèmes Détectés dans Votre Fichier

### 1. **Ligne 1 : `AS_BASE_PATH`** ❌
**Problème :** Typo - devrait être `SFTP_BASE_PATH`
**Correction :** `SFTP_BASE_PATH=/n8n/uploads/documents-longuenesse`

### 2. **Ligne 2 : `CORS_ORIGIN`** ⚠️
**Problème :** Manque les autres origines (`/plan`, `localhost`)
**Correction :** `CORS_ORIGIN=https://www.filmara.fr,https://www.filmara.fr/plan,https://www.filmara.fr/lon,http://localhost:3000`

### 3. **Ligne 8 : `JWT_SECRET` avec guillemets** ⚠️
**Problème :** Les guillemets peuvent causer des problèmes
**Correction :** Enlever les guillemets

### 4. **Ligne 9 : `Key=NAS_BASE_PATH`** ❌
**Problème :** Ligne incorrecte, probablement une erreur de copier-coller
**Correction :** Supprimer cette ligne

### 5. **Ligne 10 : `MONGODB_URI` avec guillemets** ⚠️
**Problème :** Les guillemets peuvent causer des problèmes
**Correction :** Enlever les guillemets

### 6. **Lignes 14-16 : Variables `REACT_APP_*`** ❌
**Problème :** Ces variables sont pour le **frontend**, pas pour le backend
**Correction :** Supprimer ces lignes (elles ne sont pas utilisées par le backend)

### 7. **Manque `STORE_NAME`** ⚠️
**Problème :** Variable manquante pour personnaliser les emails
**Correction :** Ajouter `STORE_NAME=Boulangerie Ange - Longuenesse`

---

## ✅ Fichier .env Corrigé

J'ai créé un fichier `boulangerie-planning-api-3.env.CORRIGE` avec toutes les corrections.

### Variables Essentielles (à vérifier dans Render) :

```bash
# MongoDB
MONGODB_URI=mongodb+srv://phimjc:ZDOPZA2Kd8ylewoR@cluster0.4huietv.mongodb.net/boulangerie-planning-longuenesse?retryWrites=true&w=majority

# JWT (SANS guillemets)
JWT_SECRET=a22/JbwO0C/zuixj0eNBq1rWKb+KBEvckPlw+T+dWbEDXH2S2FvxM2L5KoIg5WeNLWiDPgj5rlvNldE3kSN41A==

# CORS (avec toutes les origines)
CORS_ORIGIN=https://www.filmara.fr,https://www.filmara.fr/plan,https://www.filmara.fr/lon,http://localhost:3000

# EmailJS
EMAILJS_SERVICE_ID=gmail
EMAILJS_TEMPLATE_ID=template_ti7474g
EMAILJS_USER_ID=RID3Du7xMUj54pzjb
EMAILJS_PRIVATE_KEY=tKYqrTUpzRQiq_7r0ZjCJ

# SFTP (CORRIGER le nom)
SFTP_BASE_PATH=/n8n/uploads/documents-longuenesse
NAS_BASE_PATH=/n8n/uploads/documents-longuenesse
SFTP_PASSWORD=#heulph:N8N5

# Store Name (AJOUTER)
STORE_NAME=Boulangerie Ange - Longuenesse

# Node
NODE_ENV=production
PORT=10000
```

---

## 📋 Checklist de Vérification dans Render

Dans Render (api-3), vérifiez que ces variables sont correctes :

### Variables Critiques :

- [ ] `MONGODB_URI` → **SANS guillemets**, base `boulangerie-planning-longuenesse`
- [ ] `JWT_SECRET` → **SANS guillemets**
- [ ] `CORS_ORIGIN` → **Avec `/plan` ET `/lon`**
- [ ] `SFTP_BASE_PATH` → **Nom correct** (pas `AS_BASE_PATH`)
- [ ] `STORE_NAME` → **Ajouté** : `Boulangerie Ange - Longuenesse`

### Variables EmailJS :

- [ ] `EMAILJS_SERVICE_ID` → `gmail`
- [ ] `EMAILJS_TEMPLATE_ID` → `template_ti7474g`
- [ ] `EMAILJS_USER_ID` → `RID3Du7xMUj54pzjb`
- [ ] `EMAILJS_PRIVATE_KEY` → `tKYqrTUpzRQiq_7r0ZjCJ`

### Variables à Supprimer :

- [ ] `REACT_APP_EMAILJS_SERVICE_ID` → **Supprimer** (frontend uniquement)
- [ ] `REACT_APP_EMAILJS_TEMPLATE_ID` → **Supprimer** (frontend uniquement)
- [ ] `REACT_APP_EMAILJS_USER_ID` → **Supprimer** (frontend uniquement)
- [ ] `Key=NAS_BASE_PATH` → **Supprimer** (ligne incorrecte)

---

## 🔧 Actions à Faire dans Render

### 1. Corriger les Variables Existantes

1. Allez dans **Environment** → **Environment Variables**
2. Pour chaque variable problématique :
   - Cliquez sur **Edit**
   - Corrigez la valeur
   - Cliquez sur **Save**

### 2. Supprimer les Variables Inutiles

1. Trouvez les variables `REACT_APP_*`
2. Cliquez sur **Delete** pour chacune
3. Supprimez aussi `Key=NAS_BASE_PATH` si elle existe

### 3. Ajouter les Variables Manquantes

1. Cliquez sur **Add Environment Variable**
2. Ajoutez :
   - `STORE_NAME` = `Boulangerie Ange - Longuenesse`
   - Vérifiez que `SFTP_BASE_PATH` existe (pas `AS_BASE_PATH`)

### 4. Vérifier les Guillemets

Pour `MONGODB_URI` et `JWT_SECRET` :
- **SANS guillemets** dans Render
- Les guillemets peuvent causer des erreurs de connexion

---

## ⚠️ Points Critiques

### 1. **SFTP_BASE_PATH vs AS_BASE_PATH**

**❌ Incorrect :**
```
AS_BASE_PATH=/n8n/uploads/documents-longuenesse
```

**✅ Correct :**
```
SFTP_BASE_PATH=/n8n/uploads/documents-longuenesse
```

### 2. **CORS_ORIGIN - Toutes les Origines**

**❌ Incorrect :**
```
CORS_ORIGIN=https://www.filmara.fr/lon
```

**✅ Correct :**
```
CORS_ORIGIN=https://www.filmara.fr,https://www.filmara.fr/plan,https://www.filmara.fr/lon,http://localhost:3000
```

### 3. **JWT_SECRET - Sans Guillemets**

**❌ Incorrect :**
```
JWT_SECRET="a22/JbwO0C/..."
```

**✅ Correct :**
```
JWT_SECRET=a22/JbwO0C/...
```

### 4. **MONGODB_URI - Sans Guillemets**

**❌ Incorrect :**
```
MONGODB_URI="mongodb+srv://..."
```

**✅ Correct :**
```
MONGODB_URI=mongodb+srv://...
```

---

## ✅ Après les Corrections

1. **Redéployez le backend** dans Render
2. **Vérifiez les logs** pour confirmer qu'il démarre correctement
3. **Testez l'API** : `curl https://boulangerie-planning-api-3.onrender.com/api/health`

---

## 📝 Résumé des Corrections

| Variable | Problème | Correction |
|----------|----------|------------|
| `AS_BASE_PATH` | Typo | → `SFTP_BASE_PATH` |
| `CORS_ORIGIN` | Manque origines | → Ajouter `/plan` et `localhost` |
| `JWT_SECRET` | Guillemets | → Enlever guillemets |
| `MONGODB_URI` | Guillemets | → Enlever guillemets |
| `Key=NAS_BASE_PATH` | Ligne incorrecte | → Supprimer |
| `REACT_APP_*` | Variables frontend | → Supprimer |
| `STORE_NAME` | Manquant | → Ajouter |

Une fois ces corrections faites, votre backend devrait fonctionner correctement ! 🎉











