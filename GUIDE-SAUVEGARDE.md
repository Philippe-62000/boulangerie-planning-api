# 🛡️ Guide de Sauvegarde - Projet Boulangerie

## 📋 **Vue d'ensemble**

Ce guide explique comment sauvegarder et restaurer le projet de planning boulangerie en cas de problème. La sauvegarde comprend le code source, les configurations, et optionnellement la base de données.

---

## 🎯 **Types de Sauvegarde**

### **1. 📦 Sauvegarde Complète du Projet**
- **Quand** : Avant modifications importantes, déploiements, ou chaque semaine
- **Contient** : Code source, configurations, scripts, documentation
- **Script** : `sauvegarde-projet.bat`

### **2. 🗄️ Sauvegarde Base de Données**
- **Quand** : Avant modifications de données, chaque jour
- **Contient** : Toutes les collections MongoDB
- **Script** : `sauvegarde-database.bat`

### **3. 🔄 Sauvegarde Git (Recommandée)**
- **Quand** : À chaque modification
- **Contient** : Historique complet des versions
- **Commandes** : `git add`, `git commit`, `git push`

---

## 🚀 **Sauvegarde Rapide**

### **Étape 1 : Sauvegarde du Code**
```bash
# Double-cliquer sur le fichier
sauvegarde-projet.bat
```

### **Étape 2 : Sauvegarde de la Base de Données**
```bash
# Double-cliquer sur le fichier
sauvegarde-database.bat
```

### **Étape 3 : Sauvegarde Git (Optionnelle)**
```bash
git add .
git commit -m "Sauvegarde avant modifications importantes"
git push origin main
```

---

## 🔧 **Restauration Rapide**

### **En cas de problème majeur :**

#### **Option 1 : Restauration Complète**
```bash
# Double-cliquer sur le fichier
restaurer-projet.bat
```

#### **Option 2 : Restauration Base de Données**
```bash
# Double-cliquer sur le fichier
restaurer-database.bat
```

#### **Option 3 : Restauration Git**
```bash
git log --oneline  # Voir l'historique
git checkout <commit-hash>  # Revenir à une version
```

---

## 📁 **Structure des Sauvegardes**

```
boulangerie-planning/
├── backup-2024-12-30/          # Sauvegarde complète
│   ├── backend/                # Code backend
│   ├── frontend/               # Code frontend
│   ├── scripts/                # Scripts de déploiement
│   └── documentation/          # Guides et docs
├── database-backups/           # Sauvegardes MongoDB
│   ├── boulangerie-backup-2024-12-30-14h30/
│   └── boulangerie-backup-2024-12-30-18h45/
└── scripts-sauvegarde/         # Scripts de sauvegarde
    ├── sauvegarde-projet.bat
    ├── restaurer-projet.bat
    ├── sauvegarde-database.bat
    └── restaurer-database.bat
```

---

## ⚠️ **Points d'Attention**

### **Sauvegarde du Code**
- ✅ **Inclus** : Source, configs, scripts, docs
- ❌ **Exclu** : `node_modules`, `.git`, logs
- 📝 **Note** : `npm install` requis après restauration

### **Sauvegarde Base de Données**
- ✅ **Inclus** : Toutes les collections MongoDB
- ✅ **Inclus** : Index et contraintes
- 📝 **Note** : Nécessite MongoDB Tools installé

### **Variables d'Environnement**
- 🔑 **API Keys** : Sauvegardées séparément
- 🔗 **URLs** : Vérifier après restauration
- 🔐 **Secrets** : Ne jamais commiter dans Git

---

## 🎯 **Scénarios de Restauration**

### **Scénario 1 : Code Corrompu**
```bash
1. restaurer-projet.bat
2. cd boulangerie-planning
3. npm install (backend et frontend)
4. Vérifier les variables d'environnement
5. Tester l'application
```

### **Scénario 2 : Base de Données Corrompue**
```bash
1. restaurer-database.bat
2. Vérifier les données dans l'interface
3. Tester les fonctionnalités principales
4. Redémarrer l'application
```

### **Scénario 3 : Problème de Déploiement**
```bash
1. Git checkout vers version stable
2. npm install
3. Rebuild frontend
4. Redéployer sur Render
5. Upload sur OVH
```

### **Scénario 4 : Problème Majeur**
```bash
1. restaurer-projet.bat
2. restaurer-database.bat
3. npm install
4. Vérifier toutes les configurations
5. Redéployer complètement
```

---

## 🔄 **Maintenance des Sauvegardes**

### **Nettoyage Automatique**
```bash
# Supprimer les sauvegardes de plus de 30 jours
forfiles /p backup-* /s /m *.* /d -30 /c "cmd /c del @path"
```

### **Rotation des Sauvegardes**
- **Quotidienne** : Base de données
- **Hebdomadaire** : Code source
- **Mensuelle** : Archive complète
- **Annuelle** : Sauvegarde définitive

### **Vérification des Sauvegardes**
```bash
# Vérifier la taille des sauvegardes
dir backup-* /s

# Tester une restauration (environnement de test)
restaurer-projet.bat
```

---

## 📊 **Monitoring et Alertes**

### **Vérifications Automatiques**
- ✅ Taille des sauvegardes > 0
- ✅ Date de dernière sauvegarde < 24h
- ✅ Intégrité des fichiers
- ✅ Accès aux sauvegardes

### **Alertes Recommandées**
- 🚨 Sauvegarde échouée
- 🚨 Espace disque insuffisant
- 🚨 Sauvegarde trop ancienne
- 🚨 Erreur de restauration

---

## 🎯 **Bonnes Pratiques**

### **Avant Modifications Importantes**
1. 📦 Sauvegarde complète du code
2. 🗄️ Sauvegarde de la base de données
3. 🔄 Commit Git avec message descriptif
4. 📝 Documentation des changements

### **Après Déploiement**
1. ✅ Test de toutes les fonctionnalités
2. 📊 Vérification des logs
3. 🔄 Sauvegarde de la version stable
4. 📝 Documentation du déploiement

### **Maintenance Régulière**
- 📅 **Quotidien** : Vérifier les logs d'erreur
- 📅 **Hebdomadaire** : Nettoyer les sauvegardes anciennes
- 📅 **Mensuel** : Tester une restauration complète
- 📅 **Trimestriel** : Réviser la stratégie de sauvegarde

---

## 🚨 **En Cas d'Urgence**

### **Contact et Escalade**
1. 🔍 **Diagnostic** : Identifier le type de problème
2. 🔄 **Restauration** : Utiliser les scripts appropriés
3. 📞 **Support** : Contacter le développeur si nécessaire
4. 📝 **Documentation** : Noter les actions effectuées

### **Checklist d'Urgence**
- [ ] Problème identifié ?
- [ ] Sauvegarde disponible ?
- [ ] Script de restauration testé ?
- [ ] Données critiques préservées ?
- [ ] Application fonctionnelle ?
- [ ] Utilisateurs informés ?

---

## 📞 **Support et Contact**

### **En cas de problème avec les sauvegardes :**
1. 📧 **Email** : Vérifier les logs d'erreur
2. 📱 **Chat** : Décrire le problème précisément
3. 🔧 **Remote** : Autoriser l'accès si nécessaire
4. 📝 **Documentation** : Noter toutes les actions

### **Informations à Fournir :**
- 📅 Date et heure du problème
- 🔍 Message d'erreur exact
- 📁 Fichiers de sauvegarde disponibles
- 🔄 Actions déjà tentées
- 📊 État de l'application

---

**🎉 Avec ces sauvegardes, votre projet est protégé contre la plupart des problèmes !**





