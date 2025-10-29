# 🏗️ Architecture - Dashboard Salarié

## 📊 Diagramme de l'Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    🌐 FRONTEND (OVH)                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │        📱 employee-dashboard.html                      │   │
│  │                                                         │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │   │
│  │  │ 🏖️ Congés   │ │ 🏥 Arrêt    │ │ 📁 Documents│      │   │
│  │  │             │ │ Maladie     │ │             │      │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘      │   │
│  │                                                         │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │   │
│  │  │ 🔐 Mot de   │ │ 📧 Notifs   │ │ 🔑 Auth     │      │   │
│  │  │ Passe       │ │ Email       │ │ JWT         │      │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTPS/API Calls
                                │
┌─────────────────────────────────────────────────────────────────┐
│                  🖥️ BACKEND (Render)                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              🚀 Express.js Server                      │   │
│  │                                                         │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │   │
│  │  │ 🔐 Auth     │ │ 📋 Requests │ │ 📁 Documents│      │   │
│  │  │ Routes      │ │ Routes      │ │ Routes      │      │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘      │   │
│  │                                                         │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │   │
│  │  │ 📧 Email    │ │ 🗄️ MongoDB  │ │ 🔒 JWT      │      │   │
│  │  │ Service     │ │ Database    │ │ Middleware  │      │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ Email API
                                │
┌─────────────────────────────────────────────────────────────────┐
│                  📧 EMAIL SERVICE (EmailJS)                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              📨 Email Templates                        │   │
│  │                                                         │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │   │
│  │  │ 🏖️ Congés   │ │ 🏥 Arrêt    │ │ 📁 Documents│      │   │
│  │  │ Template    │ │ Template    │ │ Template    │      │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘      │   │
│  │                                                         │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │   │
│  │  │ 👤 Manager  │ │ 👤 Employee │ │ 🏢 Comptable│      │   │
│  │  │ Notifications│ │ Notifications│ │ Notifications│    │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Flux de Données

### 1. Authentification
```
[Frontend] → [API /auth/login] → [MongoDB] → [JWT Token] → [Frontend]
```

### 2. Demande de Congés
```
[Frontend] → [API /vacation-requests] → [MongoDB] → [EmailJS] → [Manager]
```

### 3. Arrêt Maladie
```
[Frontend] → [API /sick-leave-requests] → [MongoDB] → [EmailJS] → [Manager + Comptable]
```

### 4. Documents
```
[Frontend] → [API /documents/upload] → [MongoDB + NAS] → [EmailJS] → [Employees]
```

### 5. Changement de Mot de Passe
```
[Frontend] → [API /auth/change-password] → [MongoDB] → [Frontend Redirect]
```

## 🗄️ Modèles de Données

### Employee
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String (hashed),
  role: String,
  contractType: String,
  isActive: Boolean
}
```

### VacationRequest
```javascript
{
  _id: ObjectId,
  employeeId: ObjectId,
  employeeName: String,
  startDate: Date,
  endDate: Date,
  vacationType: String,
  details: String,
  status: String,
  createdAt: Date
}
```

### SickLeaveRequest
```javascript
{
  _id: ObjectId,
  employeeId: ObjectId,
  employeeName: String,
  employeeEmail: String,
  startDate: Date,
  endDate: Date,
  documentPath: String,
  status: String,
  createdAt: Date
}
```

### Document
```javascript
{
  _id: ObjectId,
  title: String,
  type: String, // 'general' ou 'personal'
  category: String,
  employeeId: ObjectId, // pour documents personnels
  filePath: String,
  fileName: String,
  fileSize: Number,
  mimeType: String,
  uploadDate: Date,
  expiryDate: Date, // pour documents personnels
  isActive: Boolean
}
```

## 🔐 Sécurité

### Authentification
- **JWT Tokens** : Signature avec secret partagé
- **Expiration** : 24 heures
- **Validation** : Middleware sur toutes les routes protégées

### Autorisation
- **Rôles** : Vendeuse, Boulanger, Préparateur, Manager
- **Permissions** : Accès basé sur le rôle de l'employé
- **Isolation** : Chaque employé ne voit que ses données

### Validation
- **Côté client** : Validation en temps réel
- **Côté serveur** : Validation stricte des données
- **Sanitisation** : Nettoyage des entrées utilisateur

## 📊 Monitoring

### Logs Backend
```javascript
// Authentification
console.log('🔐 Tentative de connexion salarié:', email);
console.log('✅ Connexion réussie:', employee.name);

// Emails
console.log('📧 Envoi email à:', recipientEmail);
console.log('✅ Email envoyé avec succès');

// Documents
console.log('📁 Upload document:', fileName);
console.log('📥 Téléchargement document:', documentId);
```

### Logs Frontend
```javascript
// API Calls
console.log('🔍 Données reçues de l\'API:', data);
console.log('❌ Erreur API:', error);

// Navigation
console.log('🔄 Changement d\'onglet:', tabName);
console.log('📝 Soumission formulaire:', formType);
```

## 🚀 Déploiement

### Frontend (OVH)
1. **Développement** : Modification de `employee-dashboard.html`
2. **Test** : Vérification locale
3. **Déploiement** : Upload FTP vers `/plan/`
4. **Validation** : Test sur `https://www.filmara.fr/plan/employee-dashboard.html`

### Backend (Render)
1. **Développement** : Modification du code
2. **Commit** : `git add . && git commit -m "message"`
3. **Push** : `git push origin main`
4. **Déploiement** : Automatique sur Render
5. **Validation** : Test des endpoints API

### Base de Données (MongoDB Atlas)
1. **Modifications** : Schémas et index
2. **Migration** : Scripts de migration si nécessaire
3. **Validation** : Tests de connectivité et requêtes

## 🔧 Maintenance

### Tâches Régulières
- **Logs** : Surveillance des erreurs et performances
- **Emails** : Vérification des échecs d'envoi
- **Documents** : Nettoyage des fichiers expirés
- **Sécurité** : Mise à jour des dépendances

### Sauvegardes
- **Code** : Repository Git (GitHub)
- **Base de données** : Sauvegardes automatiques MongoDB Atlas
- **Fichiers** : Sauvegardes NAS pour les documents

### Monitoring
- **Uptime** : Surveillance de la disponibilité
- **Performance** : Temps de réponse des API
- **Erreurs** : Alertes en cas d'erreurs critiques
- **Usage** : Statistiques d'utilisation

---

**Architecture** : Frontend (OVH) + Backend (Render) + Email (EmailJS) + Database (MongoDB)  
**Date** : Janvier 2025  
**Version** : 1.0  
**Statut** : ✅ Production
