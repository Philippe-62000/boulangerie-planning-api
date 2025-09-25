# 🏗️ **ARCHITECTURE DISTRIBUÉE - 2 Services OR-Tools**

## 📋 **Vue d'Ensemble**

Nouvelle architecture distribuée pour éliminer les limites de requêtes OR-Tools et améliorer les performances.

---

## 🏛️ **Architecture des Services**

### **Service 1 : Constraint Calculator** 🧮
- **Rôle** : Calcul des contraintes et disponibilités
- **Port** : 5001
- **Technologie** : Python Flask + MongoDB
- **Fonctionnalités** :
  - ✅ Calcul des arrêts maladie
  - ✅ Calcul des jours de formation
  - ✅ Équilibrage des repos
  - ✅ Historique des weekends
  - ✅ Enregistrement MongoDB

### **Service 2 : Planning Generator** 🚀
- **Rôle** : Génération planning final optimisé
- **Port** : 5002
- **Technologie** : Python Flask + OR-Tools + MongoDB
- **Fonctionnalités** :
  - ✅ Lecture des contraintes pré-calculées
  - ✅ Résolution OR-Tools optimisée
  - ✅ Gestion des shifts (opening/afternoon/evening)
  - ✅ Respect des heures contractuelles
  - ✅ Enregistrement du planning final

---

## 🔄 **Flux de Données**

```
┌─────────────┐   1. Demande Planning    ┌─────────────┐
│   Frontend  │ ────────────────────────> │ API Node.js │
└─────────────┘                           └─────────────┘
                                              │
                                              │ 2. Appel Service 1
                                              ▼
┌─────────────┐   3. Contraintes Calculées  ┌─────────────┐
│   MongoDB   │ <─────────────────────────── │ Service 1  │
│             │                              │Constraint  │
│             │   4. Lecture Contraintes     │Calculator  │
│             │ ────────────────────────────> │            │
└─────────────┘                              └─────────────┘
                                              │
                                              │ 5. Appel Service 2
                                              ▼
┌─────────────┐   6. Planning Généré        ┌─────────────┐
│   MongoDB   │ <─────────────────────────── │ Service 2  │
│             │                              │Planning    │
│             │   7. Planning Final          │Generator   │
│             │ ────────────────────────────> │            │
└─────────────┘                              └─────────────┘
                                              │
                                              │ 8. Réponse
                                              ▼
┌─────────────┐   9. Planning Final          ┌─────────────┐
│   Frontend  │ <─────────────────────────── │ API Node.js │
└─────────────┘                              └─────────────┘
```

---

## 🎯 **Avantages de l'Architecture Distribuée**

### **✅ Performance**
- **Calculs distribués** sur 2 services spécialisés
- **Traitement asynchrone** des contraintes
- **Pas de limite** de requêtes sur le service principal

### **✅ Robustesse**
- **Service 1** peut être lent sans impact
- **Service 2** toujours rapide et optimisé
- **Fallback** vers données pré-calculées

### **✅ Scalabilité**
- **Services indépendants** et évolutifs
- **Chacun optimisé** pour sa tâche
- **Déploiement séparé** possible

---

## 🚀 **Déploiement**

### **Service 1 : Constraint Calculator**
```bash
# Variables d'environnement
MONGODB_URI=mongodb+srv://...
PORT=5001

# Déploiement Render
# Nom : constraint-calculator
# Build Command : pip install -r constraint-calculator-requirements.txt
# Start Command : python constraint-calculator.py
```

### **Service 2 : Planning Generator**
```bash
# Variables d'environnement
MONGODB_URI=mongodb+srv://...
PORT=5002

# Déploiement Render
# Nom : planning-generator
# Build Command : pip install -r planning-generator-requirements.txt
# Start Command : python planning-generator.py
```

---

## 📡 **Endpoints API**

### **Service 1 : Constraint Calculator**
- **POST** `/calculate-constraints` - Calcul des contraintes
- **GET** `/health` - Vérification de santé

### **Service 2 : Planning Generator**
- **POST** `/generate-planning` - Génération du planning
- **GET** `/health` - Vérification de santé

---

## 🔧 **Intégration avec l'API Node.js**

### **Modification du Backend**
```javascript
// Nouveau flux de génération
async generatePlanningDistributed(weekNumber, year, affluences, employees) {
  try {
    // 1. Calculer les contraintes
    const constraintsResult = await fetch('https://constraint-calculator.onrender.com/calculate-constraints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employees, week_number: weekNumber, year })
    });
    
    if (!constraintsResult.ok) {
      throw new Error('Erreur calcul contraintes');
    }
    
    // 2. Générer le planning
    const planningResult = await fetch('https://planning-generator.onrender.com/generate-planning', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employees, week_number: weekNumber, year, affluences })
    });
    
    if (!planningResult.ok) {
      throw new Error('Erreur génération planning');
    }
    
    const planning = await planningResult.json();
    return this.createPlanningsFromDistributedSolution(planning.planning, weekNumber, year, employees);
    
  } catch (error) {
    logger.error('Erreur architecture distribuée:', error);
    // Fallback vers méthode classique si nécessaire
    return this.generateWeeklyPlanningClassic(weekNumber, year, affluences, employees);
  }
}
```

---

## 📊 **Collections MongoDB**

### **`calculated_constraints`**
```javascript
{
  employee_id: String,
  name: String,
  week_number: Number,
  year: Number,
  total_available_days: Number,
  constraints: {
    Lundi: String,  // 'MAL', 'Formation', 'CP', 'Repos'
    Mardi: String,
    // ... autres jours
  },
  sick_leave_days: Number,
  training_days: Number,
  cp_days: Number,
  rest_days: Number,
  weekend_history: {
    saturdays: Number,
    sundays: Number
  },
  calculated_at: Date,
  status: String
}
```

### **`plannings` (nouvelle structure)**
```javascript
{
  week_number: Number,
  year: Number,
  generated_at: Date,
  method: String,  // 'ortools_distributed'
  solver_status: String,
  solve_time: Number,
  planning: {
    employee_id: {
      day_index: String  // 'opening_06:00-13:30', 'Repos', 'MAL'
    }
  }
}
```

---

## 🎯 **Prochaines Étapes**

### **1. Déploiement des Services**
- [ ] Déployer `constraint-calculator` sur Render
- [ ] Déployer `planning-generator` sur Render
- [ ] Configurer les variables d'environnement

### **2. Intégration Backend**
- [ ] Modifier l'API Node.js pour utiliser la nouvelle architecture
- [ ] Implémenter le fallback vers méthode classique
- [ ] Tester l'intégration complète

### **3. Tests et Validation**
- [ ] Tester le calcul des contraintes
- [ ] Tester la génération du planning
- [ ] Valider les performances

---

## 🚀 **Résultat Attendu**

- ✅ **Plus de limite** de requêtes OR-Tools
- ✅ **Performance améliorée** avec calculs distribués
- ✅ **Robustesse** avec fallback automatique
- ✅ **Scalabilité** pour évolutions futures

**Cette architecture va révolutionner la performance de votre système de planning !** 🎉
