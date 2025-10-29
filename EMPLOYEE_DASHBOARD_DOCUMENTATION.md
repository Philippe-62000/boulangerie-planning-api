# 📊 Documentation - Dashboard Salarié

## 📋 Vue d'ensemble

Le **Dashboard Salarié** est une page web autonome accessible à `https://www.filmara.fr/plan/employee-dashboard.html` qui permet aux employés de gérer leurs demandes administratives et de consulter leurs documents personnels. Cette interface intègre un système complet d'envoi d'emails automatiques pour les notifications.

## 🏗️ Architecture

### Frontend
- **Page** : `frontend/public/employee-dashboard.html`
- **Authentification** : Token JWT stocké en localStorage
- **API** : Communication avec le backend via `https://boulangerie-planning-api-4-pbfy.onrender.com/api`
- **Style** : CSS intégré avec design responsive

### Backend
- **API** : Endpoints REST pour chaque fonctionnalité
- **Authentification** : Middleware JWT pour les salariés
- **Email** : Service EmailJS pour les notifications automatiques
- **Base de données** : MongoDB pour le stockage des données

## 🎯 Fonctionnalités

### 1. 🏖️ Demande de Congés
**Endpoint** : `POST /api/vacation-requests`

#### Interface utilisateur
- Formulaire avec validation côté client
- Champs : Employé, Date de début, Date de fin, Type de congés, Précisions
- Boutons : "Demander les congés" et "Réinitialiser"
- État de chargement pendant le traitement

#### Système d'emails
```javascript
// Email automatique lors de la soumission
const emailResult = await emailService.sendVacationRequestNotification(
  managerEmail,
  managerName,
  employeeName,
  startDate,
  endDate,
  vacationType,
  details
);
```

**Templates d'emails** :
- **Manager** : Notification de nouvelle demande de congés
- **Salarié** : Confirmation de réception de la demande

### 2. 🏥 Déclaration d'Arrêt Maladie
**Endpoint** : `POST /api/sick-leave-requests`

#### Interface utilisateur
- Formulaire avec upload de document
- Validation des fichiers (JPG, PDF, max 10MB)
- Drag & Drop pour l'upload
- Prévisualisation du fichier sélectionné

#### Système d'emails
```javascript
// Email automatique avec pièce jointe
const emailResult = await emailService.sendSickLeaveNotification(
  managerEmail,
  managerName,
  employeeName,
  employeeEmail,
  startDate,
  endDate,
  documentPath
);
```

**Templates d'emails** :
- **Manager** : Notification avec document d'arrêt maladie
- **Salarié** : Confirmation de réception
- **Comptable** : Notification pour traitement administratif

### 3. 📁 Gestion des Documents
**Endpoints** : 
- `GET /api/documents/general` - Documents généraux
- `GET /api/documents/personal/:employeeId` - Documents personnels
- `GET /api/documents/download/:id` - Téléchargement

#### Interface utilisateur
- **Onglets** : Documents Généraux / Documents Personnels
- **Affichage** : Liste des documents avec métadonnées
- **Actions** : Téléchargement direct
- **Gestion** : Suppression automatique après 1 mois (documents personnels)

#### Système d'emails
```javascript
// Notification lors de l'upload de documents
if (type === 'personal') {
  await emailService.sendDocumentNotification(
    employee.email,
    employee.name,
    title,
    category
  );
}

if (type === 'general') {
  // Envoi à tous les salariés actifs
  for (const employee of employees) {
    await emailService.sendGeneralDocumentNotification(
      employee.email,
      employee.name,
      title,
      category
    );
  }
}
```

**Templates d'emails** :
- **Document personnel** : Notification de nouveau document disponible
- **Document général** : Notification de document partagé avec tous les salariés

### 4. 🔐 Changement de Mot de Passe
**Endpoint** : `POST /api/auth/change-password`

#### Interface utilisateur
- Formulaire sécurisé avec validation
- Champs : Mot de passe actuel, Nouveau mot de passe, Confirmation
- Validation côté client (longueur minimale, correspondance)
- Déconnexion automatique après changement réussi

#### Sécurité
- Vérification du mot de passe actuel
- Chiffrement du nouveau mot de passe avec bcrypt
- Token JWT requis pour l'authentification

## 📧 Système d'Envoi d'Emails

### Service EmailJS (`backend/services/emailService.js`)

#### Configuration
```javascript
const emailServiceAlternative = require('./emailServiceAlternative');

class EmailService {
  constructor() {
    this.isConfigured = true;
    console.log('✅ Service EmailJS configuré');
  }
}
```

#### Templates disponibles

**1. Demande de Congés**
```javascript
async sendVacationRequestNotification(managerEmail, managerName, employeeName, startDate, endDate, vacationType, details) {
  const templateParams = {
    to_email: managerEmail,
    to_name: managerName,
    employee_name: employeeName,
    start_date: startDate,
    end_date: endDate,
    vacation_type: vacationType,
    details: details || 'Aucune précision'
  };
  
  return await emailServiceAlternative.sendEmail('template_vacation_request', templateParams);
}
```

**2. Arrêt Maladie**
```javascript
async sendSickLeaveNotification(managerEmail, managerName, employeeName, employeeEmail, startDate, endDate, documentPath) {
  const templateParams = {
    to_email: managerEmail,
    to_name: managerName,
    employee_name: employeeName,
    employee_email: employeeEmail,
    start_date: startDate,
    end_date: endDate,
    document_path: documentPath
  };
  
  return await emailServiceAlternative.sendEmail('template_sick_leave', templateParams);
}
```

**3. Documents Personnels**
```javascript
async sendDocumentNotification(employeeEmail, employeeName, documentTitle, category) {
  const templateParams = {
    to_email: employeeEmail,
    to_name: employeeName,
    document_title: documentTitle,
    category: category,
    dashboard_url: 'https://www.filmara.fr/plan/employee-dashboard.html'
  };
  
  return await emailServiceAlternative.sendEmail('template_document_personal', templateParams);
}
```

**4. Documents Généraux**
```javascript
async sendGeneralDocumentNotification(employeeEmail, employeeName, documentTitle, category) {
  const templateParams = {
    to_email: employeeEmail,
    to_name: employeeName,
    document_title: documentTitle,
    category: category,
    dashboard_url: 'https://www.filmara.fr/plan/employee-dashboard.html'
  };
  
  return await emailServiceAlternative.sendEmail('template_document_general', templateParams);
}
```

### Service EmailJS Alternatif (`backend/services/emailServiceAlternative.js`)

#### Configuration EmailJS
```javascript
const emailjs = require('@emailjs/browser');

const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY;

async function sendEmail(templateName, templateParams) {
  try {
    const templateId = getTemplateId(templateName);
    
    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      templateId,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );
    
    return {
      success: true,
      message: 'Email envoyé avec succès',
      result: result
    };
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    return {
      success: false,
      message: error.message || 'Erreur inconnue'
    };
  }
}
```

## 🔐 Authentification

### Token JWT
- **Stockage** : localStorage du navigateur
- **Durée** : 24 heures
- **Contenu** : `{employeeId, email, name, role}`
- **Validation** : Middleware `authenticateEmployee`

### Flux d'authentification
1. **Connexion** : `POST /api/auth/login`
2. **Stockage** : Token sauvegardé en localStorage
3. **Vérification** : À chaque requête API
4. **Expiration** : Redirection vers la page de connexion

## 🎨 Interface Utilisateur

### Design
- **Thème** : Dégradé bleu-violet moderne
- **Responsive** : Adaptation mobile et desktop
- **Animations** : Transitions fluides et états de chargement
- **Couleurs** : Palette cohérente avec l'identité visuelle

### Composants
- **Header** : Logo, nom du salarié, bouton déconnexion
- **Navigation** : Onglets pour chaque fonctionnalité
- **Formulaires** : Validation en temps réel
- **Alertes** : Messages de succès/erreur
- **Loading** : Spinners pendant les traitements

### Accessibilité
- **Labels** : Tous les champs ont des labels appropriés
- **Validation** : Messages d'erreur clairs
- **Navigation** : Tabulation logique
- **Contraste** : Couleurs respectant les standards WCAG

## 📊 Gestion des États

### États de chargement
```javascript
// Exemple pour les demandes de congés
const [loading, setLoading] = useState(false);

const handleSubmit = async (e) => {
  setLoading(true);
  try {
    // Traitement...
  } finally {
    setLoading(false);
  }
};
```

### Gestion des erreurs
```javascript
const showAlert = (containerId, message, type) => {
  const alertContainer = document.getElementById(containerId);
  alertContainer.innerHTML = `
    <div class="alert alert-${type}">
      ${message}
    </div>
  `;
};
```

## 🚀 Déploiement

### Frontend
- **Fichier** : `frontend/public/employee-dashboard.html`
- **Serveur** : OVH (déploiement manuel via FTP)
- **URL** : `https://www.filmara.fr/plan/employee-dashboard.html`

### Backend
- **Plateforme** : Render
- **Déploiement** : Automatique via Git
- **URL** : `https://boulangerie-planning-api-4-pbfy.onrender.com/api`

### Variables d'environnement
```bash
# Backend (Render)
JWT_SECRET=your-jwt-secret
MONGODB_URI=mongodb://...
EMAILJS_SERVICE_ID=your-service-id
EMAILJS_TEMPLATE_ID=your-template-id
EMAILJS_PUBLIC_KEY=your-public-key
```

## 📈 Métriques et Monitoring

### Logs côté serveur
- **Authentification** : Succès/échec des connexions
- **Emails** : Envois réussis/échoués
- **Documents** : Uploads et téléchargements
- **Erreurs** : Stack traces complètes

### Logs côté client
- **API** : Réponses des requêtes
- **Validation** : Erreurs de formulaire
- **Navigation** : Changements d'onglets
- **Performance** : Temps de chargement

## 🔧 Maintenance

### Points de vigilance
1. **Tokens JWT** : Vérifier la validité et l'expiration
2. **Emails** : Surveiller les échecs d'envoi
3. **Documents** : Nettoyage automatique des fichiers expirés
4. **Performance** : Optimisation des requêtes API

### Mises à jour
1. **Templates EmailJS** : Synchronisation avec les modifications
2. **API** : Versioning des endpoints
3. **Interface** : Tests de compatibilité navigateurs
4. **Sécurité** : Mise à jour des dépendances

## 🧪 Tests

### Tests fonctionnels
- [x] Connexion/déconnexion
- [x] Demande de congés
- [x] Déclaration d'arrêt maladie
- [x] Gestion des documents
- [x] Changement de mot de passe

### Tests d'intégration
- [x] Communication API
- [x] Envoi d'emails
- [x] Upload de fichiers
- [x] Authentification JWT

### Tests de sécurité
- [x] Validation des données
- [x] Protection CSRF
- [x] Chiffrement des mots de passe
- [x] Gestion des erreurs

## 📝 Changelog

### Version 1.0 (Janvier 2025)
- ✅ Interface complète du dashboard salarié
- ✅ Système d'authentification JWT
- ✅ Gestion des demandes de congés
- ✅ Déclaration d'arrêts maladie
- ✅ Système de documents (généraux/personnels)
- ✅ Changement de mot de passe
- ✅ Notifications email automatiques
- ✅ Interface responsive et accessible

---

**Page** : [https://www.filmara.fr/plan/employee-dashboard.html](https://www.filmara.fr/plan/employee-dashboard.html)  
**Date de création** : Janvier 2025  
**Version** : 1.0  
**Statut** : ✅ Fonctionnel et déployé
