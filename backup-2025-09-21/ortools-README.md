# 🎯 Boulangerie OR-Tools API

API d'optimisation de planning utilisant Google OR-Tools pour la boulangerie.

## 🚀 Endpoints

### `GET /` - Health check
Vérification de l'état du service.

**Réponse :**
```json
{
  "status": "online",
  "service": "Planning Boulangerie OR-Tools API",
  "version": "5.0",
  "timestamp": "2024-12-19T...",
  "endpoints": {
    "status": "GET /",
    "solve": "POST /solve"
  }
}
```

### `POST /solve` - Résolution de planning optimisé

**Données d'entrée :**
```json
{
  "employees": [
    {
      "id": "employeeId",
      "name": "Nom Employé",
      "volume": 35,
      "status": "Majeur|Mineur",
      "contract": "CDI|Apprentissage",
      "skills": ["Ouverture", "Fermeture"],
      "function": "Vendeuse|Manager|Responsable"
    }
  ],
  "constraints": {
    "employeeId": {
      "0": "CP",     // Lundi
      "1": "MAL",    // Mardi
      "6": "Repos"   // Dimanche
    }
  },
  "affluences": [2, 2, 2, 3, 3, 4, 2],  // Lun-Dim
  "week_number": 36
}
```

**Réponse :**
```json
{
  "success": true,
  "planning": {
    "employeeId": {
      "0": "06h00-14h00",    // Lundi
      "1": "Repos",          // Mardi
      "2": "13h00-20h30",    // Mercredi
      "3": "07h30-15h30",    // Jeudi
      "4": "Repos",          // Vendredi
      "5": "06h00-16h30",    // Samedi
      "6": "Repos"           // Dimanche
    }
  },
  "validation": {
    "warnings": ["Alice: 35.5h au lieu de 35h (écart +0.5h)"],
    "stats": {
      "total_hours": 280,
      "diagnostic": [],
      "suggestions": []
    }
  },
  "solver_info": {
    "status": "OPTIMAL",
    "solve_time": 2.34,
    "objective": 15
  }
}
```

## 🔧 Contraintes implémentées

### 1. Volume horaire STRICT
- **Tolérance** : ±0.5h (au lieu de ±2h)
- **Objectif** : Respecter exactement les heures contractuelles
- **Poids** : 20x (priorité maximale)

### 2. Contraintes d'ouverture
- Exactement 1 personne à l'ouverture
- Compétence "Ouverture" requise
- Créneaux 06h00-*

### 3. Contraintes de fermeture
- Au moins 1 personne avec compétence "Fermeture"
- Créneaux *-20h30

### 4. Règles spéciales mineurs
- Repos dimanche obligatoire
- Maximum 35h/semaine
- Pas de travail les jours fériés

### 5. Repos obligatoires
- 2 repos minimum pour temps pleins (≥35h)
- 1 repos minimum pour temps partiels

## 📊 Créneaux disponibles

### Semaine (Lundi-Vendredi)
- `06h00-14h00` (8.0h) - Ouverture standard
- `07h30-15h30` (8.0h) - Support matin
- `13h00-20h30` (7.5h) - Fermeture
- `10h00-18h00` (8.0h) - Renfort midi (si affluence ≥2)
- `14h00-20h30` (6.5h) - Renfort fermeture (si affluence ≥2)
- `09h00-17h00` (8.0h) - Renfort matinée (si affluence ≥3)
- `16h00-20h30` (4.5h) - Support fermeture courte (si affluence ≥3)

### Samedi
- `06h00-16h30` (10.5h) - Ouverture longue
- `07h30-16h30` (9.0h) - Support matin
- `10h30-16h30` (6.0h) - Renfort midi
- `16h30-20h30` (4.0h) - Fermeture
- `17h00-20h30` (3.5h) - Support fermeture

### Dimanche
- `06h00-13h00` (7.0h) - Ouverture matin
- `07h30-13h00` (5.5h) - Support matin
- `09h30-13h00` (3.5h) - Renfort matin
- `13h00-20h30` (7.5h) - Fermeture après-midi
- `14h00-20h30` (6.5h) - Support fermeture

## 📈 Performance

- **Résolution** : 2-5 secondes
- **Optimisation** : Multi-objectifs avec pondération
- **Contraintes** : Strictes et respectées
- **Précision** : ±0.5h pour les volumes horaires

## 🛠️ Technologies

- **Python** : 3.9+
- **Flask** : 2.3.3
- **OR-Tools** : 9.7.2996
- **Gunicorn** : 21.2.0
- **Flask-CORS** : 4.0.0

## 🚀 Déploiement

Cette API est déployée sur Render.com avec :
- **URL** : https://planning-ortools-api.onrender.com
- **Plan** : Free tier
- **Auto-deploy** : Activé

## 📞 Support

Pour questions ou problèmes :
- Vérifiez les logs Render
- Testez l'endpoint `/` pour le health check
- Timeout maximum : 60 secondes
