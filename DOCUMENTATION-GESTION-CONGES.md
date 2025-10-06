# 📅 Documentation - Gestion des Congés

## Vue d'ensemble

Le système de gestion des congés permet aux employés de demander des congés payés et aux administrateurs de les valider, rejeter ou modifier. Il inclut également un calendrier annuel pour visualiser tous les congés validés.

## 🎯 Fonctionnalités principales

### 1. **Demande de congés par les employés**
- Formulaire de demande accessible via `/plan/employee-dashboard.html`
- Champs requis : nom, email, dates de début/fin, raison
- Validation automatique des dates
- Email de confirmation automatique

### 2. **Gestion administrative**
- Interface d'administration accessible via `/plan/vacation-management`
- Liste de toutes les demandes avec statuts
- Actions disponibles : Accepter, Rejeter, Modifier
- Synchronisation automatique avec le dashboard

### 3. **Calendrier annuel**
- Vue sur 12 mois accessible via `/plan/vacation-planning`
- Filtres par catégorie d'employés
- Sélecteur d'année (2024, 2025, 2026)
- Impression du calendrier

## 📋 Statuts des demandes

| Statut | Description | Actions disponibles |
|--------|-------------|-------------------|
| `pending` | En attente de validation | ✅ Accepter, ❌ Rejeter, ✏️ Modifier |
| `accepted` | Validé par l'admin | ✅ Déclaré (si applicable) |
| `rejected` | Rejeté par l'admin | Aucune action |
| `declared` | Déclaré au comptable | Aucune action |

## 🏷️ Catégories d'employés

### **Vente**
- **Vendeuse** (Vert `#28a745`)
- **Responsable** (Vert clair `#20c997`)
- **Manager** (Bleu `#17a2b8`)
- **Apprenti Vendeuse** (Violet `#6f42c1`)

### **Production**
- **Chef Prod** (Rouge `#dc3545`)
- **Boulanger** (Orange `#fd7e14`)
- **Préparateur** (Jaune `#ffc107`)
- **Apprenti Boulanger** (Rose `#e83e8c`)
- **Apprenti Préparateur** (Orange clair `#fd7e14`)

## 🔄 Workflow complet

### 1. **Demande initiale**
```
Employé → Formulaire → Email confirmation → Base de données (status: pending)
```

### 2. **Validation administrative**
```
Admin → Accepter → Synchronisation employé → Email validation → Dashboard mis à jour
```

### 3. **Synchronisation automatique**
- Mise à jour de l'employé avec `vacation.isOnVacation = true`
- Création automatique d'une absence dans "Gestion des salariés"
- Affichage sur le dashboard principal

## 🛠️ API Endpoints

### **Demandes de congés**
```
GET    /api/vacation-requests              # Liste toutes les demandes
GET    /api/vacation-requests/:id          # Détails d'une demande
POST   /api/vacation-requests              # Créer une nouvelle demande
PUT    /api/vacation-requests/:id          # Modifier une demande
PATCH  /api/vacation-requests/:id          # Modifier (alias)
PATCH  /api/vacation-requests/:id/accept   # Accepter une demande
PATCH  /api/vacation-requests/:id/reject   # Rejeter une demande
PATCH  /api/vacation-requests/:id/validate # Valider (alias accept)
```

### **Employés**
```
GET    /api/employees                      # Liste tous les employés
PUT    /api/employees/:id                  # Mettre à jour un employé
```

## 📊 Modèle de données

### **VacationRequest**
```javascript
{
  _id: ObjectId,
  employeeName: String,        // Nom de l'employé
  employeeEmail: String,       // Email de l'employé
  city: String,               // Ville (défaut: "Arras")
  startDate: Date,            // Date de début des congés
  endDate: Date,              // Date de fin des congés
  duration: Number,           // Durée en jours (calculée)
  reason: String,             // Raison des congés
  precisions: String,         // Précisions optionnelles
  status: String,             // pending, accepted, rejected, declared
  uploadDate: Date,           // Date de création
  validatedBy: String,        // Qui a validé
  validatedAt: Date,          // Date de validation
  rejectedBy: String,         // Qui a rejeté
  rejectedAt: Date,           // Date de rejet
  rejectionReason: String     // Raison du rejet
}
```

### **Employee.vacation**
```javascript
{
  isOnVacation: Boolean,      // En congés actuellement
  startDate: Date,           // Date de début
  endDate: Date,             // Date de fin
  vacationRequestId: ObjectId // ID de la demande liée
}
```

## 🎨 Interface utilisateur

### **Page de gestion administrative** (`/plan/vacation-management`)
- **Header** : Titre et bouton "Impression Calendrier"
- **Liste des demandes** : Cartes avec informations employé et périodes
- **Actions par demande** : Boutons Accepter/Rejeter/Modifier selon le statut
- **Modal de modification** : Formulaire pour changer les dates

### **Calendrier annuel** (`/plan/vacation-planning`)
- **Contrôles** : Sélecteur d'année, filtre par catégorie, bouton d'impression
- **Légende** : Codes couleur pour chaque rôle d'employé
- **Grille 12 mois** : Vue tabulaire avec employés en lignes, mois en colonnes
- **Cellules colorées** : Affichage des périodes de congés avec dates et durée

## 📧 Système d'emails

### **Emails automatiques**
1. **Confirmation de réception** → Employé
2. **Alerte nouvelle demande** → Administrateurs configurés
3. **Validation des congés** → Employé
4. **Rejet des congés** → Employé (avec raison)

### **Configuration des emails**
- Service : EmailJS
- Templates configurés pour chaque type d'email
- Destinataires configurables via les paramètres

## 🔧 Maintenance et debug

### **Logs importants**
```javascript
// Synchronisation employé
🔍 Recherche employé pour synchronisation: [Nom]
🔍 Employé trouvé: [Nom] (ID: [ID])
✅ Employé synchronisé avec les congés: [Nom]
📅 Période de congés: [Date début] → [Date fin]

// Création d'absence
📋 Création automatique d'absence pour: [Nom]
✅ Absence créée automatiquement: [Détails]
```

### **Problèmes courants**
1. **Employé non trouvé** : Vérifier l'orthographe du nom dans la demande
2. **Synchronisation échouée** : Consulter les logs pour voir l'erreur
3. **Dashboard non mis à jour** : Vider le cache navigateur

## 🚀 Déploiement

### **Frontend** (OVH)
```bash
npm run build
robocopy "frontend\build" "C:\Users\phil\Desktop\OVH\www\plan" /E /R:3 /W:10
```

### **Backend** (Render)
```bash
git add .
git commit -m "Description des changements"
git push
```

## 📈 Métriques et statistiques

### **Dashboard principal**
- Affichage des employés en congés dans les 8 prochains jours
- Compteurs par statut (Total, Validés, Rejetés, En attente)
- Synchronisation en temps réel avec les données employés

### **Calendrier annuel**
- Vue d'ensemble des congés par année
- Filtrage par catégorie d'employés
- Calcul automatique des durées
- Codes couleur par rôle

## 🔒 Sécurité et permissions

### **Accès**
- **Employés** : Peuvent créer des demandes via le formulaire public
- **Administrateurs** : Accès complet à la gestion et au calendrier
- **Authentification** : Requise pour l'interface d'administration

### **Validation**
- Dates obligatoires et cohérentes
- Emails valides
- Noms d'employés existants
- Statuts de transition valides

## 📝 Notes de développement

### **Technologies utilisées**
- **Frontend** : React, React Router, Axios, Toastify
- **Backend** : Node.js, Express, MongoDB, Mongoose
- **Emails** : EmailJS
- **Déploiement** : Render (API), OVH (Frontend)

### **Structure des fichiers**
```
frontend/src/pages/
├── VacationRequestAdmin.js    # Gestion administrative
├── VacationPlanning.js        # Calendrier annuel
└── EmployeeDashboard.js       # Formulaire employé

backend/
├── routes/vacationRequests.js # Routes API
├── controllers/vacationRequestController.js # Logique métier
└── models/VacationRequest.js  # Modèle de données
```

---

*Dernière mise à jour : 27 septembre 2025 - Déploiement #015*





