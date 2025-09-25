<<<<<<< HEAD
# 🍞 Planning Boulangerie

Système complet de planification du personnel pour boulangerie avec génération automatique de planning respectant toutes les contraintes métier.

## 🎯 Fonctionnalités principales

- **Gestion des employés** : CDI, contrats d'apprentissage, compétences (ouverture/fermeture)
- **Contraintes hebdomadaires** : congés, formations, maladies, jours fériés
- **Génération automatique** : planning optimisé sur 2 semaines avec Google OR Tools
- **Équité** : répartition équilibrée des week-ends et jours fériés
- **Interface intuitive** : React avec design moderne et responsive
- **Base de données** : MongoDB pour stockage persistant

## 🚀 Démarrage rapide

### Prérequis
- Node.js (v16+)
- MongoDB (local ou Atlas)
- npm ou yarn

### Installation

1. **Cloner le projet**
   ```bash
   git clone <url-du-repo>
   cd boulangerie-planning
   ```

2. **Backend - Installation et configuration**
   ```bash
   cd backend
   npm install
   cp .env.example .env  # Et configurer vos variables
   ```

3. **Frontend - Installation**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Démarrage**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

5. **Accès**
   - Frontend : http://localhost:3000
   - Backend API : http://localhost:5000

## 📋 Utilisation

### 1. Configuration des employés
- Ajouter les vendeuses, apprentis, responsables et managers
- Définir les compétences (Ouverture, Fermeture)
- Configurer les jours de formation pour les apprentis
- Spécifier les volumes horaires hebdomadaires

### 2. Saisie des contraintes
- Sélectionner la semaine à planifier
- Définir le niveau d'affluence (0-4) pour chaque jour
- Saisir les contraintes individuelles :
  - Repos, congés payés, formations
  - Maladies, absences, retards
  - Jours fériés, management

### 3. Génération du planning
- Générer automatiquement le planning sur 2 semaines
- Respect des règles métier :
  - 11h de repos entre journées
  - Maximum 10h/jour, pause obligatoire si ≥5h30
  - Compétences ouverture/fermeture respectées
  - Équité dans la répartition des tâches

### 4. Validation et suivi
- Valider les plannings générés
- Marquer comme "réalisé" avec modifications réelles
- Suivi des heures effectuées vs contractuelles
- Historique des absences et retards

## 🏗️ Architecture

```
boulangerie-planning/
├── backend/                 # API Node.js/Express
│   ├── models/             # Schémas MongoDB
│   ├── controllers/        # Logique métier
│   ├── routes/            # Routes API
│   └── config.js          # Configuration
├── frontend/               # Application React
│   ├── src/
│   │   ├── components/    # Composants réutilisables
│   │   ├── pages/         # Pages principales
│   │   ├── services/      # Appels API
│   │   └── utils/         # Utilitaires
│   └── public/
└── README.md
```

## 🔧 API Endpoints

### Employés
- `GET /api/employees` - Liste des employés
- `POST /api/employees` - Créer un employé
- `PUT /api/employees/:id` - Modifier un employé
- `DELETE /api/employees/:id` - Supprimer un employé

### Contraintes
- `POST /api/constraints` - Sauvegarder les contraintes
- `GET /api/constraints/:week/:year` - Récupérer les contraintes
- `POST /api/constraints/global` - Appliquer une contrainte globale

### Planning
- `POST /api/planning/generate` - Générer le planning
- `GET /api/planning/:week/:year` - Récupérer le planning
- `PATCH /api/planning/:id/validate` - Valider un planning

## ⚙️ Configuration

### Variables d'environnement (backend/.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/boulangerie-planning
JWT_SECRET=votre-cle-secrete-ici
```

### Règles métier configurables
- Horaires d'ouverture : 06h00 - 20h30
- Pause obligatoire : ≥5h30 travaillées
- Repos minimum : 11h entre journées
- Maximum quotidien : 10h
- Volume hebdomadaire : 20-39h selon contrat

## 🎨 Interface utilisateur

### Pages principales
- **Dashboard** : Vue d'ensemble et raccourcis
- **Employés** : Gestion du personnel
- **Contraintes** : Saisie des contraintes hebdomadaires
- **Planning** : Génération et visualisation des plannings

### Fonctionnalités UX
- Design responsive
- Notifications toast
- Loading states
- Validation en temps réel
- Impression des plannings

## 🔍 Algorithme de génération

L'algorithme optimise automatiquement :
- **Couverture des besoins** selon l'affluence
- **Respect des compétences** ouverture/fermeture
- **Équilibre des charges** de travail
- **Repos obligatoires** et pauses
- **Contraintes individuelles** (formation, congés, etc.)

## 📊 Suivi et statistiques

- **Équité week-end** : alternance des repos
- **Répartition jours fériés**
- **Taux d'absentéisme** (maladie, retards)
- **Heures travaillées** vs contractuelles
- **Compétences utilisées**

## 🚀 Déploiement

### Déploiement sur OVH (Recommandé)

#### Déploiement rapide avec Docker
```bash
# Cloner le projet
git clone <URL_DU_DEPOT>
cd boulangerie-planning

# Rendre le script de déploiement exécutable
chmod +x deploy-ovh.sh

# Déployer l'application
./deploy-ovh.sh production votre-domaine.com
```

#### Options d'hébergement OVH
- **VPS Public Cloud** : À partir de 3,50€/mois (recommandé)
- **Container** : À partir de 2,50€/mois
- **Web Hosting** : Pour le frontend React
- **Database** : MongoDB Atlas ou OVH Database

📖 **Guide complet** : Voir [DEPLOYMENT-OVH.md](./DEPLOYMENT-OVH.md) pour les instructions détaillées.

#### Coûts estimés OVH
- **VPS Value** : 7,00€/mois (1 vCPU, 4GB RAM)
- **MongoDB Atlas** : Gratuit (512MB) à 9,00€/mois
- **Domaine** : 8,00€/an
- **Total** : ~15-25€/mois

### Autres plateformes

#### Backend (Render, Heroku, etc.)
```bash
npm run build
# Configurer les variables d'environnement
# Déployer avec PM2 ou service de cloud
```

#### Frontend (Vercel, Netlify, etc.)
```bash
npm run build
# Déployer le dossier build/
```

#### Base de données
- **Production** : MongoDB Atlas
- **Développement** : MongoDB local

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence MIT - voir le fichier LICENSE pour plus de détails.

## 📞 Support

Pour toute question ou problème :
- Ouvrir une issue GitHub
- Contacter l'équipe de développement

---

**Développé avec ❤️ pour optimiser la gestion du personnel en boulangerie**
=======
# API Backend - Planning Boulangerie

## Description
API REST pour la gestion du planning de personnel d'une boulangerie avec génération automatique de planning utilisant les contraintes métier.

## Installation

```bash
cd backend
npm install
```

## Configuration
Créer un fichier `.env` basé sur `.env.example` avec vos propres valeurs.

## Démarrage

### Développement
```bash
npm run dev
```

### Production
```bash
npm start
```

## API Endpoints

### Employés
- `GET /api/employees` - Liste tous les employés actifs
- `GET /api/employees/:id` - Détails d'un employé
- `POST /api/employees` - Créer un employé
- `PUT /api/employees/:id` - Modifier un employé
- `PATCH /api/employees/:id/deactivate` - Désactiver un employé
- `PATCH /api/employees/:id/reactivate` - Réactiver un employé
- `DELETE /api/employees/:id` - Supprimer un employé

### Contraintes
- `POST /api/constraints` - Créer/modifier les contraintes d'un employé pour une semaine
- `GET /api/constraints/:weekNumber/:year` - Contraintes pour une semaine
- `GET /api/constraints/employee/:employeeId` - Contraintes d'un employé
- `DELETE /api/constraints/:weekNumber/:year/:employeeId` - Supprimer des contraintes
- `POST /api/constraints/global` - Appliquer une contrainte globale

### Planning
- `POST /api/planning/generate` - Générer le planning pour une semaine
- `GET /api/planning/:weekNumber/:year` - Planning d'une semaine
- `PATCH /api/planning/:planningId/validate` - Valider un planning
- `PATCH /api/planning/:planningId/realize` - Marquer comme réalisé

## Modèles de données

### Employee
```json
{
  "name": "Marie Dupont",
  "contractType": "CDI",
  "age": 25,
  "skills": ["Ouverture", "Fermeture"],
  "role": "vendeuse",
  "weeklyHours": 35,
  "trainingDays": ["Mardi"],
  "isActive": true
}
```

### WeeklyConstraints
```json
{
  "weekNumber": 35,
  "year": 2024,
  "employeeId": "...",
  "constraints": {
    "Lundi": "Matin",
    "Mardi": "Formation",
    "Mercredi": null
  }
}
```

### Planning
```json
{
  "weekNumber": 35,
  "year": 2024,
  "employeeId": "...",
  "schedule": [
    {
      "day": "Lundi",
      "shifts": [
        {
          "startTime": "06:00",
          "endTime": "14:30",
          "breakMinutes": 30,
          "hoursWorked": 8,
          "role": "vendeuse"
        }
      ],
      "totalHours": 8,
      "constraint": null
    }
  ],
  "status": "generated"
}
```

## Règles métier implémentées

- **Horaires**: 06h00 - 20h30
- **Repos**: 11h minimum entre fin et début de journée
- **Pause**: 30 min si ≥ 5h30 travaillées (non payées)
- **Maximum**: 10h par jour
- **Compétences**: Ouverture (06h00), Fermeture (accompagnée)
- **Équité**: Répartition des week-ends et jours fériés
- **Apprentis**: Jours de formation configurables

## Technologies
- Node.js + Express
- MongoDB + Mongoose
- Algorithme de génération personnalisé (OR Tools compatible)

>>>>>>> 443a6b525e041691af7ca6aec0344707cf3e4762
