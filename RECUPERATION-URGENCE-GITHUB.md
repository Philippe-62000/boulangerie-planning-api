# 🚨 Récupération d'Urgence via GitHub

## 🎯 **Situation : Ordinateur Volé/En Panne**

### **📋 ÉTAPES DE RÉCUPÉRATION COMPLÈTE**

#### **1. 💻 Sur un Nouvel Ordinateur**
```bash
# Installer Git
https://git-scm.com/download/win

# Installer Node.js
https://nodejs.org/en/download/

# Créer un dossier de travail
mkdir C:\nouveau-projet
cd C:\nouveau-projet
```

#### **2. 📥 Récupérer le Code Source**
```bash
# Cloner le projet depuis GitHub
git clone https://github.com/Philippe-62000/boulangerie-planning-api.git
cd boulangerie-planning-api

# Voir l'historique des versions
git log --oneline

# Récupérer la dernière version stable
git checkout main
```

#### **3. 🔧 Installer les Dépendances**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

#### **4. ⚙️ Configurer l'Environnement**
```bash
# Créer le fichier .env dans backend/
cd ../backend
echo MONGODB_URI=mongodb://localhost:27017/boulangerie > .env
echo JWT_SECRET=votre-secret-jwt >> .env
echo EMAILJS_PUBLIC_KEY=votre-cle-publique >> .env
echo EMAILJS_PRIVATE_KEY=votre-cle-privee >> .env
echo EMAILJS_SERVICE_ID=votre-service-id >> .env
echo EMAILJS_TEMPLATE_ID=votre-template-id >> .env
```

#### **5. 🗄️ Récupérer la Base de Données**
```bash
# Option A : Depuis une sauvegarde cloud
# (Si vous avez MongoDB Atlas)
# La base de données est déjà en ligne

# Option B : Depuis une sauvegarde locale
# (Si vous avez fait une sauvegarde)
mongorestore --uri="mongodb://localhost:27017/boulangerie" backup-folder/
```

#### **6. 🚀 Lancer l'Application**
```bash
# Backend
cd backend
npm start

# Frontend (nouveau terminal)
cd frontend
npm start
```

#### **7. ✅ Vérification**
- 🌐 **Backend** : http://localhost:3001/api/health
- 🎨 **Frontend** : http://localhost:3000
- 🔐 **Login** : Tester la connexion salarié
- 📧 **Email** : Vérifier l'envoi de mots de passe

---

## 🔑 **INFORMATIONS CRITIQUES À CONSERVER**

### **📝 Noter Quelque Part (Coffre-fort, Email, etc.)**
```
=== RÉCUPÉRATION PROJET BOULANGERIE ===

GitHub Repository:
https://github.com/Philippe-62000/boulangerie-planning-api.git

Render Backend:
https://boulangerie-planning-api-4-pbfy.onrender.com

MongoDB (si Atlas):
URI: mongodb+srv://username:password@cluster.mongodb.net/boulangerie

EmailJS Config:
- Public Key: [VOTRE_CLE]
- Private Key: [VOTRE_CLE]
- Service ID: [VOTRE_ID]
- Template ID: [VOTRE_ID]

OVH Frontend:
https://www.filmara.fr/plan/

Credentials Admin:
- Email: [VOTRE_EMAIL]
- Password: [VOTRE_PASSWORD]
```

---

## 🚀 **RÉCUPÉRATION RAPIDE (10 MINUTES)**

### **Script de Récupération Automatique**
```bash
@echo off
echo ========================================
echo   RÉCUPÉRATION URGENCE BOULANGERIE
echo ========================================

echo 📥 Clonage du projet...
git clone https://github.com/Philippe-62000/boulangerie-planning-api.git
cd boulangerie-planning-api

echo 🔧 Installation backend...
cd backend
call npm install

echo 🎨 Installation frontend...
cd ..\frontend
call npm install

echo ✅ Projet récupéré ! 
echo.
echo 📋 PROCHAINES ÉTAPES :
echo 1. Configurer le fichier .env
echo 2. Récupérer la base de données
echo 3. Tester l'application
echo.
pause
```

---

## 📱 **RÉCUPÉRATION DEPUIS MOBILE/TABLETTE**

### **En Cas d'Urgence Absolue**
1. 📱 **GitHub Mobile** : Voir le code
2. 💻 **Codespaces** : Développer en ligne
3. 🌐 **Render Dashboard** : Gérer le backend
4. 📧 **Email** : Accéder aux sauvegardes

---

## 🔒 **SÉCURITÉ ET PRÉVENTION**

### **✅ Actions Préventives**
- 📧 **Email** : Envoyer les infos critiques à soi-même
- ☁️ **Cloud** : Sauvegarder sur Google Drive/OneDrive
- 📱 **Mobile** : Noter les URLs importantes
- 🔑 **Gestionnaire** : Utiliser un gestionnaire de mots de passe

### **❌ À Éviter**
- 🚫 **Pas de sauvegarde** : Risque de perte totale
- 🚫 **Infos non notées** : Oubli des configurations
- 🚫 **Un seul endroit** : Risque de perte unique
- 🚫 **Pas de test** : Récupération non vérifiée
```
