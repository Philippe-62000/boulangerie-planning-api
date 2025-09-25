# 🚀 Déploiement Nouvelle Version - Frais Repas & KM

## 📋 Nouvelles Fonctionnalités

### ✅ Ajoutées dans cette version :
- **⚙️ Paramètres KM** : Configuration de 12 trajets avec distances
- **🍽️ Frais Repas** : Saisie mensuelle des frais repas par employé
- **🚗 Frais KM** : Calcul automatique des kilomètres parcourus
- **🖨️ Impression État** : Rapport complet des salariés avec totaux

## 🛠️ Scripts de Déploiement

### 1. Déploiement Complet (Première fois)
```bash
deploy-nouvelle-version.bat
```
**Utilisation :** Pour un déploiement complet depuis zéro
**Durée :** ~5-10 minutes
**Actions :**
- Arrêt des processus existants
- Installation des dépendances
- Build de production
- Copie des fichiers
- Configuration de l'environnement
- Démarrage du serveur

### 2. Déploiement Rapide (Mises à jour)
```bash
deploy-rapide.bat
```
**Utilisation :** Pour les mises à jour futures
**Durée :** ~2-3 minutes
**Actions :**
- Arrêt du serveur
- Build du frontend
- Copie des fichiers
- Redémarrage du serveur

### 3. Vérification Post-Déploiement
```bash
verifier-deploiement.bat
```
**Utilisation :** Pour vérifier que tout fonctionne
**Actions :**
- Test de toutes les APIs
- Vérification de la connectivité
- Redémarrage automatique si nécessaire

## 📁 Structure de Déploiement

```
C:\inetpub\wwwroot\plan\
├── index.html                 # Application React
├── static/                    # Assets statiques
├── api/                       # Serveur Node.js
│   ├── server.js             # Serveur principal
│   ├── models/               # Modèles MongoDB
│   │   ├── Parameters.js     # Nouveau : Paramètres KM
│   │   ├── KmExpense.js      # Nouveau : Frais KM
│   │   └── MealExpense.js    # Nouveau : Frais Repas
│   ├── controllers/          # Contrôleurs
│   │   ├── parametersController.js
│   │   ├── kmExpenseController.js
│   │   └── mealExpenseController.js
│   ├── routes/               # Routes API
│   │   ├── parameters.js
│   │   ├── kmExpenses.js
│   │   └── mealExpenses.js
│   └── .env                  # Configuration production
```

## 🔧 Gestion du Serveur

### Démarrer le serveur
```bash
cd C:\inetpub\wwwroot\plan\api
node server.js
```

### Arrêter le serveur
```bash
taskkill /F /IM node.exe
```

### Vérifier le statut
```bash
curl http://localhost:5000/health
```

## 📊 APIs Disponibles

### Nouvelles APIs ajoutées :
- `GET /api/parameters` - Récupérer les paramètres KM
- `PUT /api/parameters/batch` - Mettre à jour les paramètres
- `GET /api/meal-expenses` - Récupérer les frais repas
- `POST /api/meal-expenses/batch` - Sauvegarder les frais repas
- `GET /api/km-expenses` - Récupérer les frais KM
- `POST /api/km-expenses/batch` - Sauvegarder les frais KM
- `GET /api/employee-status` - État complet des salariés

## 🌐 Accès à l'Application

**URL de production :** https://www.filmara.fr/plan

### Nouveaux menus disponibles :
1. **Paramètres** - Configuration des trajets KM
2. **État Salariés** → **Frais Repas** - Saisie mensuelle
3. **État Salariés** → **Frais KM** - Calcul automatique
4. **État Salariés** → **Imprimer État** - Rapport complet

## 🔍 Vérifications Post-Déploiement

### 1. Test des APIs
```bash
# Test de base
curl http://localhost:5000/health

# Test des paramètres
curl http://localhost:5000/api/parameters

# Test des frais repas
curl "http://localhost:5000/api/meal-expenses?month=9&year=2024"

# Test des frais KM
curl "http://localhost:5000/api/km-expenses?month=9&year=2024"
```

### 2. Test de l'Interface
1. Aller sur https://www.filmara.fr/plan
2. Vérifier que le menu "Paramètres" est visible
3. Vérifier que "État Salariés" a 3 sous-menus
4. Tester la configuration des paramètres
5. Tester la saisie des frais repas
6. Tester la saisie des frais KM
7. Tester l'impression

## 🚨 Dépannage

### Problème : Serveur ne démarre pas
```bash
# Vérifier les logs
cd C:\inetpub\wwwroot\plan\api
node server.js

# Vérifier le port
netstat -an | findstr :5000
```

### Problème : APIs non accessibles
```bash
# Redémarrer le serveur
taskkill /F /IM node.exe
cd C:\inetpub\wwwroot\plan\api
node server.js
```

### Problème : Base de données
```bash
# Vérifier MongoDB
mongo
use boulangerie-planning
show collections
```

## 📝 Notes de Version

**Version :** 2.1.0
**Date :** Septembre 2024
**Nouvelles fonctionnalités :**
- Système de paramètres KM configurable
- Gestion des frais repas mensuels
- Calcul automatique des frais KM
- Impression des états salariés
- Interface utilisateur améliorée

**Compatibilité :**
- Node.js 16+
- MongoDB 4.4+
- Navigateurs modernes (Chrome, Firefox, Edge, Safari)

