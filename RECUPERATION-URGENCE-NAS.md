# 🖥️ Récupération via NAS Local

## 🎯 **Sauvegarde sur Votre NAS**

### **📍 Localisation NAS**
```
Chemin : \\nas\sauvegarde\
Structure : backup-YYYY-MM-DD\
```

---

## 📦 **SAUVEGARDE SUR NAS**

### **🔄 Script Automatique**
```bash
# Double-cliquer sur :
sauvegarde-nas.bat
```

### **📋 Processus de Sauvegarde**
1. **🕐 Horodatage** : `backup-2024-12-30`
2. **📁 Création locale** : Sauvegarde temporaire
3. **🖥️ Vérification NAS** : Accès et permissions
4. **📤 Copie NAS** : Transfert via robocopy
5. **🧹 Nettoyage** : Suppression locale (optionnel)

### **✅ Contenu Sauvegardé**
- ✅ Code source backend/frontend
- ✅ Configurations et variables
- ✅ Scripts de déploiement
- ✅ Documentation complète
- ❌ `node_modules` (exclus)
- ❌ `.git` (exclus)
- ❌ Logs (exclus)

---

## 📥 **RESTAURATION DEPUIS NAS**

### **🔄 Script Automatique**
```bash
# Double-cliquer sur :
restaurer-depuis-nas.bat
```

### **📋 Processus de Restauration**
1. **🖥️ Vérification NAS** : Accès et sauvegardes
2. **📁 Liste sauvegardes** : Choix de la version
3. **💾 Sauvegarde récente** : Protection des modifications
4. **🧹 Nettoyage local** : Préparation restauration
5. **📥 Copie NAS → Local** : Restauration complète
6. **✅ Vérification** : Intégrité des fichiers

---

## 🛠️ **CONFIGURATION MANUELLE**

### **Sauvegarde Manuelle**
```bash
# Créer la sauvegarde
robocopy . "\\nas\sauvegarde\backup-manuel" /E /XD node_modules .git /XF *.log
```

### **Restauration Manuelle**
```bash
# Restaurer depuis NAS
robocopy "\\nas\sauvegarde\backup-2024-12-30" . /E
```

---

## 🔧 **APRÈS RESTAURATION**

### **📋 Étapes Obligatoires**
```bash
# 1. Installation des dépendances
cd backend
npm install

cd ../frontend
npm install

# 2. Configuration environnement
# Vérifier backend\.env

# 3. Test de l'application
cd backend
npm start
# Vérifier : http://localhost:3001/api/health
```

### **⚙️ Variables d'Environnement**
```bash
# Fichier : backend\.env
MONGODB_URI=mongodb://localhost:27017/boulangerie
JWT_SECRET=votre-secret-jwt
EMAILJS_PUBLIC_KEY=votre-cle-publique
EMAILJS_PRIVATE_KEY=votre-cle-privee
EMAILJS_SERVICE_ID=votre-service-id
EMAILJS_TEMPLATE_ID=votre-template-id
```

---

## 🚨 **DÉPANNAGE NAS**

### **❌ Erreur d'Accès NAS**
```
Problème : "Impossible d'accéder au NAS"

Solutions :
1. 🖥️ Vérifier que le NAS est allumé
2. 🌐 Tester la connexion réseau
3. 🔐 Vérifier les permissions d'accès
4. 📁 Confirmer le chemin : \\nas\sauvegarde
5. 🔄 Redémarrer la connexion réseau
```

### **❌ Erreur de Copie**
```
Problème : "Erreur lors de la copie"

Solutions :
1. 💾 Vérifier l'espace disponible sur le NAS
2. 🔐 Contrôler les permissions d'écriture
3. 🌐 Stabiliser la connexion réseau
4. 📁 Créer manuellement le dossier sauvegarde
5. 🔄 Relancer le script
```

### **❌ Sauvegarde Incomplète**
```
Problème : "Fichiers manquants"

Solutions :
1. 🔍 Vérifier les logs de robocopy
2. 📁 Comparer les tailles de dossiers
3. 🔄 Relancer la sauvegarde
4. 🛠️ Utiliser la sauvegarde manuelle
5. ✅ Tester la restauration
```

---

## 📊 **MONITORING DES SAUVEGARDES**

### **Vérification Automatique**
```bash
# Lister les sauvegardes NAS
dir "\\nas\sauvegarde\backup-*" /O:D

# Vérifier la taille
dir "\\nas\sauvegarde\backup-2024-12-30" /S

# Comparer avec local
dir backup-2024-12-30 /S
```

### **Nettoyage Périodique**
```bash
# Supprimer les sauvegardes de plus de 30 jours
forfiles /p "\\nas\sauvegarde" /s /m backup-* /d -30 /c "cmd /c rmdir /s /q @path"
```

---

## 🎯 **AVANTAGES DU NAS**

### **✅ Points Forts**
- 🏠 **Local** : Accès rapide sur réseau interne
- 🔒 **Sécurisé** : Contrôle total des données
- 💾 **Capacité** : Espace de stockage important
- ⚡ **Rapide** : Transfert réseau local
- 🔄 **Fiable** : Pas de dépendance internet

### **⚠️ Points d'Attention**
- 🌐 **Réseau** : Nécessite connexion locale
- 🔧 **Maintenance** : Gestion du NAS requise
- 📍 **Localisation** : Accès depuis le site uniquement
- 🔐 **Permissions** : Configuration d'accès

---

## 🔄 **STRATÉGIE DE SAUVEGARDE NAS**

### **📅 Fréquence Recommandée**
- **Quotidien** : Sauvegarde automatique
- **Hebdomadaire** : Vérification intégrité
- **Mensuel** : Nettoyage anciennes sauvegardes
- **Avant déploiement** : Sauvegarde manuelle

### **🗂️ Organisation des Sauvegardes**
```
\\nas\sauvegarde\
├── backup-2024-12-30\          # Sauvegarde quotidienne
├── backup-2024-12-29\          # Sauvegarde précédente
├── backup-2024-12-28\          # Historique
└── backup-hebdo-2024-W52\      # Sauvegarde hebdomadaire
```

---

## 🚀 **RÉCUPÉRATION RAPIDE NAS**

### **Scénario 1 : Nouveau PC**
```bash
1. Connecter au réseau local
2. Accéder : \\nas\sauvegarde
3. Copier la dernière sauvegarde
4. Lancer : restaurer-depuis-nas.bat
5. Configurer et tester
```

### **Scénario 2 : Corruption Fichiers**
```bash
1. Identifier les fichiers corrompus
2. Copier depuis NAS : fichiers spécifiques
3. Ou restauration complète
4. Tester les fonctionnalités
```

### **Scénario 3 : Rollback Version**
```bash
1. Choisir une sauvegarde antérieure
2. Restaurer avec restaurer-depuis-nas.bat
3. Vérifier la compatibilité
4. Redéployer si nécessaire
```

---

## 🎉 **RÉSUMÉ NAS**

### **✅ Votre NAS vous offre :**
- 🏠 **Sauvegarde locale** : Rapide et sécurisée
- 🔄 **Scripts automatiques** : Sauvegarde/restauration
- 💾 **Stockage important** : Historique des versions
- ⚡ **Récupération rapide** : Transfert réseau local

### **🛡️ Protection Optimale**
- **Sauvegarde** : `sauvegarde-nas.bat`
- **Restauration** : `restaurer-depuis-nas.bat`
- **Vérification** : Scripts de monitoring
- **Nettoyage** : Gestion automatique

**🚀 Avec votre NAS, vous avez une solution de sauvegarde professionnelle et fiable !**
