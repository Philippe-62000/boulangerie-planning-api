# 🚨 Guide Master de Récupération d'Urgence

## 🎯 **Situation : Ordinateur Volé/En Panne**

### **🔥 RÉCUPÉRATION RAPIDE (5 MINUTES)**

#### **Étape 1 : Informations Critiques**
```
GitHub: https://github.com/Philippe-62000/boulangerie-planning-api.git
Render: https://boulangerie-planning-api-4-pbfy.onrender.com
OVH: https://www.filmara.fr/plan/
```

#### **Étape 2 : Sur Nouveau PC**
```bash
# Installer Git + Node.js, puis :
git clone https://github.com/Philippe-62000/boulangerie-planning-api.git
cd boulangerie-planning-api
cd backend && npm install
cd ../frontend && npm install
```

#### **Étape 3 : Configuration Minimale**
```bash
# Créer backend/.env
MONGODB_URI=mongodb://localhost:27017/boulangerie
JWT_SECRET=secret-temporaire-a-changer
```

#### **Étape 4 : Test**
```bash
cd backend && npm start
# Vérifier : http://localhost:3001/api/health
```

---

## 🛡️ **3 MÉTHODES DE RÉCUPÉRATION**

### **🥇 MÉTHODE 1 : GitHub (Recommandée)**
- ✅ **Disponibilité** : 24h/7j depuis partout
- ✅ **Intégrité** : Code source complet et historique
- ✅ **Rapidité** : 5 minutes pour récupérer
- ✅ **Gratuit** : Pas de coût

**📋 Guide détaillé :** `RECUPERATION-URGENCE-GITHUB.md`

### **🥈 MÉTHODE 2 : Render Dashboard**
- ✅ **Backend actif** : Déjà en ligne
- ✅ **Variables** : Configuration préservée
- ✅ **Base de données** : Si MongoDB Atlas
- ✅ **Redéploiement** : Possible depuis dashboard

**📋 Guide détaillé :** `RECUPERATION-URGENCE-RENDER.md`

### **🥉 MÉTHODE 3 : Sauvegarde Cloud**
- ✅ **Sauvegarde complète** : Code + configurations
- ✅ **Accessible** : Google Drive, OneDrive, Email
- ✅ **Hors ligne** : Fonctionne sans internet
- ✅ **Personnalisé** : Vos propres sauvegardes

**📋 Guide détaillé :** `RECUPERATION-URGENCE-CLOUD.md`

---

## 🚀 **RÉCUPÉRATION EXPRESS (ÉTAPES MINIMALES)**

### **1. 📱 Depuis Mobile (Si Urgence)**
```
1. Aller sur github.com
2. Chercher : Philippe-62000/boulangerie-planning-api
3. Noter l'URL du repository
4. Sur nouveau PC : git clone [URL]
```

### **2. 💻 Sur Nouveau PC**
```bash
# Installation rapide
winget install Git.Git
winget install OpenJS.NodeJS

# Récupération projet
git clone https://github.com/Philippe-62000/boulangerie-planning-api.git
cd boulangerie-planning-api

# Installation dépendances
cd backend && npm install
cd ../frontend && npm install

# Configuration minimale
echo MONGODB_URI=mongodb://localhost:27017/boulangerie > backend/.env
echo JWT_SECRET=secret-temporaire >> backend/.env

# Test
cd backend && npm start
```

### **3. ✅ Vérification**
- 🌐 Backend : http://localhost:3001/api/health
- 🎨 Frontend : http://localhost:3000 (si lancé)
- 📱 Mobile : Render backend toujours actif

---

## 📋 **CHECKLIST D'URGENCE**

### **✅ Avant le Vol/Panne (Prévention)**
- [ ] Noter les URLs importantes quelque part
- [ ] Sauvegarder dans le cloud
- [ ] Envoyer les infos par email à soi-même
- [ ] Tester une récupération
- [ ] Documenter les variables d'environnement

### **✅ Après le Vol/Panne (Récupération)**
- [ ] Nouveau PC avec Git + Node.js
- [ ] Cloner depuis GitHub
- [ ] Installer les dépendances
- [ ] Configurer les variables
- [ ] Tester l'application
- [ ] Vérifier les déploiements

---

## 🔑 **INFORMATIONS CRITIQUES À CONSERVER**

### **📝 À Noter Quelque Part de Sûr**
```
=== RÉCUPÉRATION PROJET BOULANGERIE ===

🔗 URLs Importantes :
- GitHub: https://github.com/Philippe-62000/boulangerie-planning-api.git
- Render: https://boulangerie-planning-api-4-pbfy.onrender.com
- OVH: https://www.filmara.fr/plan/

🔐 Comptes :
- GitHub: [VOTRE_EMAIL] / [VOTRE_PASSWORD]
- Render: [VOTRE_EMAIL] / [VOTRE_PASSWORD]
- OVH: [VOTRE_LOGIN] / [VOTRE_PASSWORD]

⚙️ Configuration :
- MongoDB URI: [VOTRE_URI]
- EmailJS Keys: [VOS_CLÉS]
- JWT Secret: [VOTRE_SECRET]

📞 Support :
- GitHub: https://support.github.com
- Render: https://render.com/support
- OVH: https://www.ovh.com/fr/support/
```

---

## 🎯 **SCÉNARIOS DE RÉCUPÉRATION**

### **Scénario 1 : Vol d'Ordinateur**
```bash
1. 🚨 Changer tous les mots de passe
2. 📱 Depuis mobile : noter les URLs
3. 💻 Nouveau PC : récupération GitHub
4. 🔐 Reconfigurer les accès
5. ✅ Tester l'application
```

### **Scénario 2 : Panne Disque Dur**
```bash
1. 💻 Nouveau disque/PC
2. 📥 Récupération GitHub directe
3. 🔧 Installation dépendances
4. ⚙️ Configuration variables
5. 🚀 Lancement application
```

### **Scénario 3 : Corruption Fichiers**
```bash
1. 🗑️ Supprimer dossier corrompu
2. 📥 Cloner depuis GitHub
3. 🔄 Réinstaller dépendances
4. ⚙️ Récupérer configuration
5. ✅ Tester fonctionnalités
```

### **Scénario 4 : Perte Complète**
```bash
1. 📱 Mobile : accéder à GitHub
2. 💻 Nouveau PC complet
3. 🔧 Installation environnement
4. 📥 Récupération projet
5. 🚀 Redémarrage complet
```

---

## ⏱️ **TEMPS DE RÉCUPÉRATION**

| Scénario | Préparation | Récupération | Total |
|----------|-------------|--------------|-------|
| **GitHub** | 0 min | 5 min | **5 min** |
| **Render** | 0 min | 10 min | **10 min** |
| **Cloud** | 2 min | 8 min | **10 min** |
| **Complet** | 15 min | 30 min | **45 min** |

---

## 🛠️ **OUTILS DE RÉCUPÉRATION**

### **📱 Applications Mobile**
- GitHub Mobile
- Render Dashboard
- Google Drive / OneDrive
- Gmail / Outlook

### **💻 Logiciels PC**
- Git for Windows
- Node.js
- VS Code
- MongoDB Compass (optionnel)

### **🌐 Services Web**
- github.com
- render.com
- drive.google.com
- www.filmara.fr

---

## 🎉 **RÉSUMÉ : VOUS ÊTES PROTÉGÉ !**

### **✅ Votre Projet est Récupérable à 100%**
- 🌐 **Code source** : GitHub (accessible partout)
- 🚀 **Backend** : Render (déjà déployé)
- 🎨 **Frontend** : OVH (déjà déployé)
- 🗄️ **Base de données** : MongoDB (selon config)

### **⚡ Récupération Ultra-Rapide**
- **5 minutes** : Code source via GitHub
- **10 minutes** : Application fonctionnelle
- **30 minutes** : Déploiement complet

### **🛡️ Sécurité Maximale**
- **3 méthodes** de récupération
- **Multiples sauvegardes** (GitHub, Render, Cloud)
- **Guides détaillés** pour chaque scénario
- **Scripts automatisés** pour la récupération

**🚀 En cas de vol/panne, vous pouvez reprendre le travail en 5 minutes !**
