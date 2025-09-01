# 🏗️ Architecture Projet - Planning Boulangerie

## 📋 **Vue d'ensemble**
Application web complète pour la gestion du planning d'une boulangerie avec système d'absences intégré.

---

## 🏛️ **Architecture Technique**

### **Frontend (React)**
- **Framework** : React 18 avec React Router v6
- **UI** : React Bootstrap + CSS personnalisé
- **HTTP Client** : Axios avec timeout 60s
- **Notifications** : React-Toastify
- **Build** : Create React App
- **URL Base** : `/plan/` (pour OVH)

### **Backend (Node.js/Express)**
- **Framework** : Express.js
- **Base de données** : MongoDB Atlas (cloud)
- **ORM** : Mongoose
- **Déploiement** : Render.com (PaaS)
- **CORS** : Configuré pour OVH et Render
- **Sécurité** : Helmet, compression

### **Base de données (MongoDB Atlas)**
- **Statut** : ✅ RESTAURÉ
- **Collections** : employees, constraints, planning, absences, equity_stats
- **Indexes** : Optimisés pour les requêtes fréquentes
- **Backup** : Automatique (Atlas)

---

## 🌐 **Environnements de Déploiement**

### **Production**
- **Frontend** : OVH (https://www.filmara.fr/plan/)
- **Backend** : Render (https://boulangerie-planning-api-3.onrender.com)
- **Base de données** : MongoDB Atlas

### **Développement**
- **Frontend** : localhost:3000
- **Backend** : localhost:5000
- **Base de données** : MongoDB Atlas (même instance)

---

## 📁 **Structure des Fichiers**

```
boulangerie-planning/
├── frontend/                    # Application React
│   ├── src/
│   │   ├── components/         # Composants réutilisables
│   │   │   ├── EmployeeModal.js
│   │   │   ├── SickLeaveModal.js
│   │   │   └── AbsenceModal.js
│   │   ├── pages/             # Pages principales
│   │   │   ├── Dashboard.js
│   │   │   ├── Employees.js
│   │   │   ├── Constraints.js
│   │   │   ├── PlanningGenerator.js
│   │   │   └── AbsenceStats.js
│   │   ├── services/
│   │   │   └── api.js         # Configuration Axios
│   │   └── App.js
│   ├── package.json
│   └── public/
├── backend/                    # API Node.js/Express
│   ├── models/                # Schémas Mongoose
│   │   ├── Employee.js
│   │   ├── WeeklyConstraints.js
│   │   ├── Planning.js
│   │   ├── Absence.js
│   │   └── EquityStats.js
│   ├── controllers/           # Logique métier
│   │   ├── employeeController.js
│   │   ├── planningController.js
│   │   ├── constraintController.js
│   │   └── absenceController.js
│   ├── routes/               # Routes API
│   │   ├── employees.js
│   │   ├── planning.js
│   │   ├── constraints.js
│   │   └── absences.js
│   ├── config/
│   │   ├── config.js         # Dev
│   │   └── config-production.js
│   ├── server.js
│   └── package.json
├── deploy/                   # Fichiers de déploiement
│   ├── www/                 # Frontend build (OVH)
│   │   └── .htaccess
│   └── api/                 # Backend (OVH - obsolète)
├── scripts/                 # Scripts de déploiement
│   ├── upload-to-ovh.ps1
│   ├── clean-deploy.bat
│   ├── push-api-*.bat
│   └── deploy-frontend-*.bat
└── ARCHITECTURE-PROJET.md
```

---

## 🔧 **API Endpoints**

### **Employés**
- `GET /api/employees` - Liste des employés
- `POST /api/employees` - Créer un employé
- `PUT /api/employees/:id` - Modifier un employé
- `DELETE /api/employees/:id` - Supprimer un employé
- `PATCH /api/employees/:id/sick-leave` - Déclarer maladie

### **Contraintes**
- `GET /api/constraints/:weekNumber/:year` - Contraintes d'une semaine
- `POST /api/constraints` - Créer/modifier contraintes
- `PUT /api/constraints/:id` - Modifier contraintes

### **Planning**
- `POST /api/planning/generate` - Générer planning
- `GET /api/planning/:weekNumber/:year` - Récupérer planning
- `PUT /api/planning/:id/validate` - Valider planning
- `PUT /api/planning/:id/realize` - Marquer comme réalisé

### **Absences**
- `POST /api/absences` - Déclarer absence
- `GET /api/absences/stats` - Statistiques absences
- `GET /api/absences` - Liste des absences
- `DELETE /api/absences/:id` - Supprimer absence

---

## 🗄️ **Modèles de Données**

### **Employee**
```javascript
{
  name: String (required),
  contractType: ['CDI', 'Apprentissage'],
  age: Number (16-65),
  skills: ['Ouverture', 'Fermeture', 'Management'],
  role: ['vendeuse', 'apprenti', 'responsable', 'manager'],
  weeklyHours: Number (20-39),
  trainingDays: [String],
  contractEndDate: Date,
  sickLeave: {
    isOnSickLeave: Boolean,
    startDate: Date,
    endDate: Date
  },
  isActive: Boolean (default: true)
}
```

### **WeeklyConstraints**
```javascript
{
  weekNumber: Number,
  year: Number,
  employeeId: ObjectId,
  constraints: {
    Lundi: String (enum),
    Mardi: String (enum),
    // ... autres jours
  }
}
```

### **Planning**
```javascript
{
  weekNumber: Number,
  year: Number,
  employeeId: ObjectId,
  employeeName: String,
  schedule: [{
    day: String,
    shifts: [{
      startTime: String,
      endTime: String,
      breakMinutes: Number,
      hoursWorked: Number,
      role: String
    }],
    totalHours: Number,
    constraint: String
  }],
  totalWeeklyHours: Number,
  contractedHours: Number,
  status: ['generated', 'validated', 'realized']
}
```

### **Absence**
```javascript
{
  employeeId: ObjectId,
  employeeName: String,
  type: ['MAL', 'ABS', 'RET'],
  startDate: Date,
  endDate: Date,
  reason: String
}
```

---

## 🚀 **Scripts de Déploiement**

### **Backend (Render)**
```bash
# Déploiement automatique depuis GitHub
git push origin main
# Render déploie automatiquement
```

### **Frontend (OVH)**
```bash
# Build et upload
npm run build
powershell -File upload-to-ovh.ps1
```

---

## ⚠️ **Bonnes Pratiques & Erreurs Évitées**

### **1. Gestion des Erreurs**
- ✅ Timeout Axios : 60s (au lieu de 30s)
- ✅ Gestion des erreurs CORS
- ✅ Validation des données côté serveur
- ✅ Logs d'erreur détaillés

### **2. Déploiement**
- ✅ Scripts de déploiement automatisés
- ✅ Versioning automatique (VERSION.md)
- ✅ Force push pour éviter les conflits Git
- ✅ Nettoyage des fichiers temporaires

### **3. Base de Données**
- ✅ Indexes optimisés
- ✅ Validation des schémas
- ✅ Gestion des contraintes uniques
- ✅ Middleware pour updatedAt

### **4. Frontend**
- ✅ Routing avec basename `/plan/`
- ✅ Configuration .htaccess pour SPA
- ✅ Gestion des états de chargement
- ✅ Notifications utilisateur

### **5. API**
- ✅ Endpoints RESTful
- ✅ Gestion des erreurs HTTP
- ✅ Validation des paramètres
- ✅ Documentation des endpoints

---

## 🔄 **Workflow de Développement**

### **1. Modification Backend**
1. Modifier le code dans `backend/`
2. Tester localement
3. Exécuter script de déploiement : `push-api-*.bat`
4. Vérifier déploiement Render

### **2. Modification Frontend**
1. Modifier le code dans `frontend/`
2. Tester localement
3. Build et déployer : `deploy-frontend-*.bat`
4. Vérifier sur OVH

### **3. Debugging**
1. Vérifier les logs Render
2. Utiliser `test-api-connection.js`
3. Vérifier la console navigateur
4. Tester les endpoints individuellement

---

## 📊 **Monitoring & Maintenance**

### **Logs**
- **Render** : Logs automatiques
- **MongoDB Atlas** : Monitoring intégré
- **Frontend** : Console navigateur

### **Backup**
- **MongoDB Atlas** : Backup automatique
- **Code** : GitHub (versioning)
- **Configuration** : Fichiers de config

### **Performance**
- **Frontend** : Build optimisé
- **Backend** : Compression activée
- **Base de données** : Indexes optimisés

---

## 🎯 **Fonctionnalités Principales**

### **✅ Implémentées**
- Gestion des employés (CRUD)
- Déclaration de maladie
- Système d'absences complet
- Génération de planning optimisée
- Contraintes hebdomadaires
- Tableau de bord avec statistiques
- Interface responsive

### **🔄 En Cours**
- Optimisation planning (6/7 jours)
- Correction contraintes
- Amélioration UX

### **📋 À Implémenter**
- Export/Import données
- Notifications automatiques
- Rapports avancés
- Gestion des congés payés

---

## 🔧 **Configuration Environnement**

### **Variables d'Environnement**
```bash
# Frontend (.env)
REACT_APP_API_URL=https://boulangerie-planning-api-3.onrender.com/api

# Backend (config-production.js)
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
CORS_ORIGIN=https://www.filmara.fr
```

---

## 📞 **Support & Maintenance**

### **En Cas de Problème**
1. Vérifier les logs Render
2. Tester l'API avec `test-api-connection.js`
3. Vérifier la connectivité MongoDB
4. Contrôler les variables d'environnement

### **Mise à Jour**
1. Modifier le code
2. Tester localement
3. Déployer avec les scripts appropriés
4. Vérifier le fonctionnement

---

*Dernière mise à jour : Version 1.1.2 - Optimisation planning*
