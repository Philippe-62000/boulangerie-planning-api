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

