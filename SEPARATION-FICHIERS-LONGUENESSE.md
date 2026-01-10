# 🔍 Séparation Complète des Fichiers - Arras vs Longuenesse

## ✅ Résumé de la Séparation

Tous les fichiers sont **déjà bien séparés** avec les suffixes `-longuenesse` ou `-lon` :

---

## 📁 Frontend - Séparation

### **Dossiers OVH**

| Arras | Longuenesse | Suffixe |
|-------|-------------|---------|
| `/www/plan/` | `/www/lon/` | `-lon` |

### **Dossiers de Build**

| Arras | Longuenesse | Suffixe |
|-------|-------------|---------|
| `deploy-frontend/` | `deploy-frontend-lon/` | `-lon` |

### **Base Path**

| Arras | Longuenesse | Configuration |
|-------|-------------|---------------|
| `/plan/` | `/lon/` | Script de build |

### **API URL**

| Arras | Longuenesse | Configuration |
|-------|-------------|---------------|
| `api-4-pbfy.onrender.com` | `api-3.onrender.com` | Script de build + remplacement HTML |

---

## 🗄️ Backend - Séparation

### **Services Render**

| Arras | Longuenesse | Suffixe |
|-------|-------------|---------|
| `boulangerie-planning-api-4-pbfy` | `boulangerie-planning-api-3` | `-4-pbfy` vs `-3` |

### **Bases MongoDB**

| Arras | Longuenesse | Suffixe |
|-------|-------------|---------|
| `boulangerie-planning` | `boulangerie-planning-longuenesse` | `-longuenesse` |

### **Variables d'Environnement**

| Variable | Arras | Longuenesse | Séparation |
|----------|-------|-------------|------------|
| `JWT_SECRET` | Clé unique Arras | Clé unique Longuenesse | ✅ Différentes |
| `MONGODB_URI` | `...boulangerie-planning` | `...boulangerie-planning-longuenesse` | ✅ `-longuenesse` |
| `SFTP_BASE_PATH` | `/n8n/uploads/documents` | `/n8n/uploads/documents-longuenesse` | ✅ `-longuenesse` |
| `NAS_BASE_PATH` | `/n8n/uploads/documents` | `/n8n/uploads/documents-longuenesse` | ✅ `-longuenesse` |
| `STORE_NAME` | `Boulangerie Ange - Arras` | `Boulangerie Ange - Longuenesse` | ✅ `-Longuenesse` |
| `EMAILJS_SERVICE_ID` | Service Arras | Service Longuenesse | ✅ Différents |
| `EMAILJS_TEMPLATE_ID` | Template Arras | Template Longuenesse | ✅ Différents |

---

## 📂 NAS - Séparation

### **Répertoires SFTP**

| Arras | Longuenesse | Suffixe |
|-------|-------------|---------|
| `/n8n/uploads/documents/` | `/n8n/uploads/documents-longuenesse/` | `-longuenesse` |

### **Structure des Dossiers**

Les deux utilisent la même structure, mais dans des répertoires séparés :

```
/n8n/uploads/documents/              (Arras)
├── 2025/
│   ├── pending/
│   ├── validated/
│   ├── declared/
│   └── rejected/

/n8n/uploads/documents-longuenesse/  (Longuenesse)
├── 2025/
│   ├── pending/
│   ├── validated/
│   ├── declared/
│   └── rejected/
```

**✅ Séparation complète avec suffixe `-longuenesse`**

---

## 📧 EmailJS - Séparation

### **Services et Templates**

| Élément | Arras | Longuenesse | Séparation |
|---------|-------|-------------|------------|
| **Service ID** | `service_arras` | `service_longuenesse` | ✅ Différents |
| **Template ID** | `template_arras` | `template_longuenesse` | ✅ Différents |
| **User ID** | Peut être identique | Peut être identique | Selon compte |
| **Private Key** | Peut être identique | Peut être identique | Selon compte |

**✅ Séparation complète des services et templates**

---

## 🔧 Scripts - Séparation

### **Scripts de Build**

| Arras | Longuenesse | Suffixe |
|-------|-------------|---------|
| `deploy-frontend-ovh.bat` | `deploy-frontend-lon-ovh.bat` | `-lon-ovh` |
| `upload-deploy-frontend-ovh.bat` | `upload-deploy-frontend-lon-ovh.bat` | `-lon-ovh` |

### **Dossiers de Déploiement**

| Arras | Longuenesse | Suffixe |
|-------|-------------|---------|
| `deploy-frontend/` | `deploy-frontend-lon/` | `-lon` |

**✅ Séparation complète avec suffixe `-lon`**

---

## 📝 Fichiers de Configuration

### **Variables d'Environnement**

| Arras | Longuenesse | Suffixe |
|-------|-------------|---------|
| `boulangerie-planning-api-4-pbfy.env` | `boulangerie-planning-api-3.env` | `-3` |
| (dans Render) | (dans Render) | |

**✅ Séparation complète**

---

## ✅ Checklist de Séparation

### Frontend
- [x] Dossier OVH séparé : `/plan/` vs `/lon/`
- [x] Base path séparé : `/plan/` vs `/lon/`
- [x] API URL séparée : `api-4-pbfy` vs `api-3`
- [x] Dossier build séparé : `deploy-frontend/` vs `deploy-frontend-lon/`
- [x] Scripts séparés : `*-ovh.bat` vs `*-lon-ovh.bat`

### Backend
- [x] Service Render séparé : `api-4-pbfy` vs `api-3`
- [x] Base MongoDB séparée : `boulangerie-planning` vs `boulangerie-planning-longuenesse`
- [x] JWT Secret séparé : Clés différentes
- [x] Variables d'environnement séparées : Toutes différentes

### NAS
- [x] Répertoire SFTP séparé : `/documents/` vs `/documents-longuenesse/`
- [x] Structure identique mais répertoires différents

### EmailJS
- [x] Service ID séparé : Services différents
- [x] Template ID séparé : Templates différents

---

## 🎯 Règles de Nommage

### **Suffixes Utilisés**

1. **`-lon`** : Pour les dossiers et scripts frontend
   - `deploy-frontend-lon/`
   - `deploy-frontend-lon-ovh.bat`
   - `/lon/` (dossier OVH)

2. **`-longuenesse`** : Pour les bases de données et répertoires NAS
   - `boulangerie-planning-longuenesse` (MongoDB)
   - `/n8n/uploads/documents-longuenesse/` (NAS)

3. **`-3`** : Pour le service Render
   - `boulangerie-planning-api-3`

4. **`-Longuenesse`** : Pour les noms affichés
   - `Boulangerie Ange - Longuenesse` (STORE_NAME)

---

## ⚠️ Points d'Attention

### 1. **Fichiers HTML Standalone**

Les fichiers dans `frontend/public/` ont des URLs hardcodées :
- **Solution :** Le script de build remplace automatiquement `api-4-pbfy` par `api-3`
- **Vérification :** Après le build, vérifiez les fichiers HTML dans `deploy-frontend-lon/`

### 2. **Variables d'Environnement**

Toutes les variables doivent être différentes entre Arras et Longuenesse :
- ✅ MongoDB : Base différente
- ✅ JWT : Clé différente
- ✅ SFTP : Répertoire différent
- ✅ EmailJS : Service/Template différents

### 3. **Auto-Deploy**

- **Arras (api-4-pbfy)** : Auto-Deploy activé
- **Longuenesse (api-3)** : Auto-Deploy désactivé (pour économiser les minutes)

---

## 📋 Résumé Final

**Tous les fichiers sont bien séparés avec les suffixes appropriés :**

- ✅ Frontend : `-lon`
- ✅ Backend : `-longuenesse` ou `-3`
- ✅ NAS : `-longuenesse`
- ✅ Scripts : `-lon-ovh`
- ✅ Noms affichés : `-Longuenesse`

**Aucun risque de mélange entre Arras et Longuenesse !** 🎉






















