# 🌐 Récupération via Render (Backend)

## 🎯 **Votre Backend est Déjà Sauvegardé !**

### **✅ URL de Votre Backend Actuel**
```
https://boulangerie-planning-api-4-pbfy.onrender.com
```

### **📋 Récupération via Render Dashboard**

#### **1. 🔐 Accès à Render**
```
URL: https://render.com
Email: [VOTRE_EMAIL_RENDER]
Password: [VOTRE_PASSWORD_RENDER]
```

#### **2. 📥 Récupérer le Code**
- 🌐 **Dashboard Render** → Votre Service
- 📁 **GitHub Connection** → Voir le repository
- 💾 **Download** → Récupérer les fichiers

#### **3. 🔄 Redéployer si Nécessaire**
```bash
# Depuis Render Dashboard
1. Settings → Redeploy
2. Manual Deploy → Deploy Latest Commit
3. Logs → Vérifier le déploiement
```

#### **4. 📊 Vérifier les Variables**
```bash
# Dans Render Dashboard
Environment → Environment Variables
- MONGODB_URI
- JWT_SECRET
- EMAILJS_*
```

---

## 🗄️ **Base de Données MongoDB**

### **Si MongoDB Atlas (Recommandé)**
```
✅ Vos données sont DÉJÀ sauvegardées en ligne !
URI: mongodb+srv://username:password@cluster.mongodb.net/boulangerie
```

### **Récupération des Données**
```bash
# Depuis n'importe où
mongodump --uri="mongodb+srv://username:password@cluster.mongodb.net/boulangerie"
```

---

## 🎨 **Frontend sur OVH**

### **✅ Frontend Déjà Déployé**
```
URL: https://www.filmara.fr/plan/
```

### **Récupération**
- 📁 **FTP OVH** : Télécharger les fichiers
- 🌐 **Interface Web** : Copier le code source
- 📧 **Email** : Si sauvegardé par email

---

## 🚀 **SCRIPT DE RÉCUPÉRATION RENDER**

```bash
@echo off
echo ========================================
echo   RÉCUPÉRATION VIA RENDER
echo ========================================

echo 🌐 Votre backend est déjà en ligne :
echo https://boulangerie-planning-api-4-pbfy.onrender.com
echo.

echo 📋 ÉTAPES DE RÉCUPÉRATION :
echo.
echo 1. 🔐 Connectez-vous à Render :
echo    https://render.com
echo.
echo 2. 📁 Accédez à votre service :
echo    boulangerie-planning-api-4-pbfy
echo.
echo 3. 📥 Récupérez le code via GitHub :
echo    Connected Repository → Download
echo.
echo 4. ✅ Testez l'API :
echo    curl https://boulangerie-planning-api-4-pbfy.onrender.com/api/health
echo.

pause
```


