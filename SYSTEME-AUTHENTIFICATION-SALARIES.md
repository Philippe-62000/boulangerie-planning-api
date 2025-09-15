# 🔐 Système d'Authentification Salariés

## 📋 Vue d'ensemble

Le système d'authentification salariés permet aux employés de se connecter de manière sécurisée pour accéder aux services en ligne de la boulangerie. Ils peuvent déclarer leurs arrêts maladie et demander leurs congés directement depuis leur interface personnelle.

## 🎯 Fonctionnalités

### 🔑 Authentification
- **Connexion sécurisée** avec email et mot de passe
- **Sessions JWT** d'une durée de 24 heures
- **Hashage bcrypt** des mots de passe (salt 10)
- **Validation email** côté client et serveur
- **Génération automatique** de mots de passe aléatoires (8 caractères)

### 📧 Système d'email
- **Envoi automatique** des identifiants par email
- **Template personnalisable** dans les paramètres
- **Variables dynamiques** : nom, email, mot de passe, URL de connexion
- **Design cohérent** avec la palette bleu/orange
- **Explication claire** du pourquoi se connecter

### 🖥️ Interfaces utilisateur
- **Page de connexion** : `salarie-connexion.html`
- **Dashboard salarié** : `employee-dashboard.html`
- **2 onglets** : Arrêt maladie + Demande de congés
- **Interface responsive** et moderne
- **Gestion des erreurs** et messages de confirmation

## 🏗️ Architecture technique

### Backend (Node.js + Express + MongoDB)

#### Modèles de données
```javascript
// Employee.js - Nouveaux champs ajoutés
{
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Format d\'email invalide'
    }
  },
  password: {
    type: String,
    select: false // Ne pas inclure par défaut dans les requêtes
  }
}
```

#### Contrôleurs
- **`authController.js`** : Gestion de l'authentification
  - `sendPasswordToEmployee()` : Envoi de mot de passe
  - `employeeLogin()` : Connexion salarié
  - `getEmployeeProfile()` : Profil de l'employé connecté

#### Routes API
```
POST /api/auth/send-password/:id     # Envoyer mot de passe
POST /api/auth/employee-login        # Connexion salarié
GET  /api/auth/employee-profile      # Profil employé (avec token)
```

#### Services
- **`emailService.js`** : Service d'envoi d'emails
- **`emailServiceAlternative.js`** : Template email mot de passe
- **`emailTemplateController.js`** : Template par défaut

### Frontend (React + HTML standalone)

#### Pages React
- **`Employees.js`** : Ajout champ email + bouton "Mot de passe"
- **`EmployeeModal.js`** : Formulaire avec champ email
- **`Parameters.js`** : Gestion des templates email

#### Pages HTML standalone
- **`salarie-connexion.html`** : Page de connexion
- **`employee-dashboard.html`** : Dashboard avec 2 onglets

## 📁 Fichiers créés/modifiés

### Backend
```
backend/
├── models/
│   └── Employee.js                    # ✅ Champs email/password ajoutés
├── controllers/
│   ├── authController.js              # 🆕 Contrôleur authentification
│   └── emailTemplateController.js     # ✅ Template mot de passe ajouté
├── routes/
│   └── auth.js                        # 🆕 Routes authentification
└── services/
    ├── emailService.js                # ✅ Méthode sendEmployeePassword
    └── emailServiceAlternative.js     # ✅ Template email complet
```

### Frontend
```
frontend/
├── src/
│   ├── components/
│   │   └── EmployeeModal.js           # ✅ Champ email ajouté
│   └── pages/
│       ├── Employees.js               # ✅ Bouton "Mot de passe"
│       └── Parameters.js              # ✅ Template email
└── public/
    ├── salarie-connexion.html         # 🆕 Page de connexion
    └── employee-dashboard.html        # 🆕 Dashboard salarié
```

## 🚀 Déploiement

### Backend (Render)
- **Repository** : `https://github.com/Philippe-62000/boulangerie-planning-api.git`
- **URL API** : `https://boulangerie-planning-api-3.onrender.com/api`
- **Commit** : `a8d8f82` - Système d'authentification salariés

### Frontend (OVH)
- **Dossier** : `frontend-ovh/` (fichiers prêts pour upload)
- **URLs** :
  - Interface admin : `https://www.filmara.fr/plan`
  - Connexion salarié : `https://www.filmara.fr/salarie-connexion.html`
  - Dashboard salarié : `https://www.filmara.fr/employee-dashboard.html`

## 📖 Guide d'utilisation

### Pour les administrateurs

#### 1. Configurer un employé
1. Aller dans **"Gestion des Salariés"**
2. Cliquer sur **"Modifier"** un employé
3. Ajouter l'**email** de l'employé
4. Sauvegarder

#### 2. Envoyer les identifiants
1. Dans la liste des employés, cliquer sur **"🔐 Mot de passe"**
2. Confirmer l'envoi
3. L'employé recevra un email avec ses identifiants

#### 3. Personnaliser l'email
1. Aller dans **"Paramètres"** → **"Templates disponibles"**
2. Chercher **"🔐 Mot de Passe Salarié"**
3. Cliquer sur **"Modifier"** pour personnaliser le contenu

### Pour les salariés

#### 1. Se connecter
1. Aller sur `https://www.filmara.fr/salarie-connexion.html`
2. Saisir l'**email** et le **mot de passe** reçu
3. Cliquer sur **"Se connecter"**

#### 2. Utiliser le dashboard
- **Onglet "Arrêt Maladie"** : Déclarer un arrêt maladie
- **Onglet "Demande de Congés"** : Demander des congés

## 🔒 Sécurité

### Authentification
- **JWT tokens** avec expiration 24h
- **Hashage bcrypt** des mots de passe
- **Validation email** avec regex
- **Middleware d'authentification** sur les routes protégées

### Données sensibles
- **Mots de passe** : `select: false` par défaut
- **Tokens JWT** : stockés en localStorage côté client
- **Emails** : validation format et unicité

### Bonnes pratiques
- **Déconnexion automatique** après 24h
- **Validation côté client et serveur**
- **Messages d'erreur** génériques pour la sécurité
- **HTTPS** obligatoire en production

## 🐛 Dépannage

### Problèmes courants

#### Email non reçu
- Vérifier la configuration EmailJS
- Contrôler les logs du serveur
- Vérifier le dossier spam

#### Connexion impossible
- Vérifier que l'employé a un email configuré
- Contrôler que le mot de passe a été envoyé
- Vérifier la validité du token JWT

#### Erreurs de validation
- Vérifier le format de l'email
- Contrôler la longueur du mot de passe (8 caractères)
- Vérifier les permissions de l'employé

### Logs utiles
```bash
# Backend - Logs d'authentification
🔐 Tentative de connexion salarié: email@example.com
✅ Connexion réussie pour: Nom Employé

# Backend - Logs d'envoi email
📧 Envoi mot de passe salarié à: email@example.com
✅ Email mot de passe envoyé: messageId
```

## 📊 Statistiques du déploiement

- **Fichiers backend modifiés** : 6
- **Fichiers frontend modifiés** : 3
- **Nouvelles pages créées** : 2
- **Nouvelles routes API** : 3
- **Templates email** : 1 nouveau
- **Lignes de code ajoutées** : 722
- **Fonctionnalités** : 5 principales

## 🔄 Maintenance

### Mises à jour régulières
- **Rotation des mots de passe** (recommandé tous les 3 mois)
- **Vérification des logs** d'authentification
- **Mise à jour des templates** email si nécessaire
- **Sauvegarde** des données employés

### Monitoring
- **Taux de connexion** des salariés
- **Erreurs d'authentification** fréquentes
- **Performance** des envois d'email
- **Utilisation** des fonctionnalités

## 📞 Support

En cas de problème :
1. Vérifier les logs du serveur
2. Contrôler la configuration EmailJS
3. Tester les URLs de connexion
4. Vérifier les permissions des fichiers OVH

---

**Date de création** : 14 septembre 2025  
**Version** : 1.0  
**Auteur** : Assistant IA  
**Statut** : ✅ Déployé et opérationnel

kl 