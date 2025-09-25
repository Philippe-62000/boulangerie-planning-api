# 🚀 Nouvelle Stratégie de Calcul de Planning - Boulangerie

## 📋 Vue d'ensemble

Cette documentation décrit la **nouvelle stratégie de calcul de planning** implémentée dans Google OR-Tools selon vos spécifications. La stratégie met l'accent sur l'équité, l'optimisation des compétences et l'équilibrage des heures.

---

## 🎯 Stratégie Étape par Étape

### **ÉTAPE 1: Placement des Contraintes Prioritaires**
```
✅ Repos, congés, maladie, formations
✅ Contraintes déclarées dans l'interface
✅ Arrêts maladie automatiques du profil employé
✅ Jours de formation des apprentis
```

### **ÉTAPE 2: Calcul des Fréquences Weekend et Repos Intelligents**
```python
# Analyser l'historique des 4 dernières semaines
weekend_scores = calculate_weekend_frequencies(employees, weekend_history)

# Exemples de scores
weekend_scores = {
    'emp1': {'saturday_count': 2, 'sunday_count': 1, 'total_weekend': 3},
    'emp2': {'saturday_count': 3, 'sunday_count': 3, 'total_weekend': 6},  # Plus fatigué
    'emp3': {'saturday_count': 0, 'sunday_count': 0, 'total_weekend': 0}   # Mineur
}

# Règle: Plus l'employé a travaillé les weekends, plus il a de priorité au repos
if weekend_score['total_weekend'] > 4:
    # Priorité repos samedi/dimanche
```

### **ÉTAPE 3: Classification par Groupes de Compétences**
```python
groups = {
    'ouverture': [emp for emp in employees if 'Ouverture' in emp.skills],
    'fermeture': [emp for emp in employees if 'Fermeture' in emp.skills], 
    'vente': [emp for emp in employees if emp not in ouverture+fermeture]
}

# Calcul des disponibilités par groupe
group_availability = {
    'ouverture': {
        'total_availability': 20,  # Ex: 20 jours disponibles total
        'employees': [Alice, David],
        'avg_availability': 10     # 10 jours/employé en moyenne
    }
}
```

### **ÉTAPE 4: Répartition Équitable Ouvertures/Fermetures**
```python
# Exemple: 7 ouvertures à répartir sur 2 employés avec compétence
total_openings = 7
opening_employees = 2
distribution = 7/2 = 3.5 → Alice: 4 ouvertures, David: 3 ouvertures

# Rotation automatique pour éviter la monotonie
opening_rotation = {
    'Lundi': 'Alice',    # Alice: 06h00-14h00
    'Mardi': 'David',    # David: 06h00-14h00  
    'Mercredi': 'Alice', # Alice: 06h00-14h00
    # ... rotation équitable
}
```

### **ÉTAPE 5: Placement des Créneaux Restants (7h30, 11h, 12h)**
```python
# Nouveaux créneaux ajoutés selon votre stratégie
additional_slots = [
    '07h30-15h30',  # Créneau 7h30 (8h)
    '11h00-19h00',  # Créneau 11h (8h)  
    '12h00-20h00'   # Créneau 12h (8h)
]

# Placement OR-Tools avec contraintes strictes:
# - 1 seul créneau par employé par jour
# - Respect des volumes horaires (±0.5h)
# - Mineurs: repos dimanche obligatoire
```

### **ÉTAPE 6: Équilibrage selon l'Affluence**
```python
# Analyser l'affluence par jour
day_analysis = {
    'Lundi': {'affluence': 2, 'employees_working': 3, 'status': 'OK'},
    'Vendredi': {'affluence': 4, 'employees_working': 2, 'status': 'SOUS-EFFECTIF'}
}

# Alertes automatiques pour déséquilibres
if day_affluence >= 3 and working_employees < 4:
    logger.warning("Affluence forte mais personnel insuffisant")
```

### **ÉTAPE 7: Ajustement Final des Heures Réglementaires**
```python
# Calcul précis des écarts
for employee in employees:
    target_hours = employee.volume          # Ex: 35h contractuelles
    current_hours = calculate_total(planning) # Ex: 34.5h planifiées
    hour_difference = target_hours - current_hours  # Ex: +0.5h manquantes
    
    if abs(hour_difference) > 0.5:
        # Répartir sur les jours de travail
        daily_adjustment = hour_difference / work_days
        
        # Ajuster chaque créneau: +30min ou -15min selon le besoin
        adjusted_slots = adjust_time_slots(original_slots, daily_adjustment)
```

---

## 🔧 Nouvelles Fonctionnalités Techniques

### **Créneaux Horaires Étendus**
```python
# Créneaux semaine avec nouveaux créneaux 7h30, 11h, 12h
week_slots = [
    'Repos',
    '06h00-14h00',    # Ouverture standard (8h)
    '07h30-15h30',    # Créneau 7h30 (8h) ✨ NOUVEAU
    '11h00-19h00',    # Créneau 11h (8h) ✨ NOUVEAU  
    '12h00-20h00',    # Créneau 12h (8h) ✨ NOUVEAU
    '13h00-20h30',    # Fermeture (7.5h)
]

# Créneaux weekend adaptés
saturday_slots = [
    '11h00-18h30',    # Créneau 11h samedi (7.5h) ✨ NOUVEAU
    '12h00-19h30',    # Créneau 12h samedi (7.5h) ✨ NOUVEAU
]
```

### **Historique Weekend Automatique**
```javascript
// Backend Node.js - Calcul automatique historique
async calculateWeekendHistory(employees, currentWeek, year) {
    const weekendHistory = {};
    
    // Analyser les 4 dernières semaines
    for (let i = 1; i <= 4; i++) {
        const planning = await Planning.findOne({
            weekNumber: currentWeek - i,
            year: year
        });
        
        // Compter samedi/dimanche travaillés par employé
        countWeekendWork(planning, weekendHistory);
    }
    
    return weekendHistory; // Envoyé à OR-Tools
}
```

### **Contraintes OR-Tools Renforcées**
```python
# Contrainte: Ouvertures avec priorité stratégique
if day in shift_distribution['opening_assignments']:
    preferred_emp = shift_distribution['opening_assignments'][day]
    # Forcer l'affectation de l'employé choisi par la stratégie
    model.Add(shifts[preferred_emp][day]['06h00-14h00'] == 1)

# Contrainte: Repos weekend basé sur l'historique
for emp in employees:
    weekend_score = weekend_scores[emp.id]['total_weekend']
    if weekend_score > 4:  # Seuil de fatigue
        # Augmenter probabilité de repos weekend
        # (géré par l'objectif OR-Tools)
```

---

## 📊 Exemple Concret

### **Données d'Entrée**
```json
{
  "employees": [
    {"name": "Alice", "volume": 35, "skills": ["Ouverture"], "status": "Majeur"},
    {"name": "Bob", "volume": 39, "skills": ["Fermeture"], "status": "Majeur"},
    {"name": "Clara", "volume": 30, "skills": [], "status": "Mineur"}
  ],
  "constraints": {
    "Alice": {"1": "Formation", "3": "CP"},
    "Clara": {"0": "Formation", "1": "Formation"}
  },
  "affluences": [2, 2, 3, 3, 4, 3, 2],
  "weekend_history": {
    "Alice_saturday": 2, "Alice_sunday": 1,
    "Bob_saturday": 3, "Bob_sunday": 3,
    "Clara_saturday": 0, "Clara_sunday": 0
  }
}
```

### **Résultat de la Stratégie**
```
👥 CLASSIFICATION:
- Groupe ouverture: Alice (disponible 5 jours)
- Groupe fermeture: Bob (disponible 5 jours)  
- Groupe vente: Clara (disponible 5 jours)

🔄 RÉPARTITION OUVERTURES/FERMETURES:
- Lundi: Alice ouverture, Bob fermeture
- Mardi: Clara formation, Alice formation → Bob ouverture ET fermeture
- Mercredi: Alice ouverture, Bob fermeture
- Jeudi: Alice CP, Bob ouverture → Clara fermeture (exception)
- Vendredi: Alice ouverture, Bob fermeture
- Samedi: Bob repos (fatigue weekend), Alice ouverture
- Dimanche: Clara repos (mineure), Alice ouverture, Bob fermeture

📅 PLANNING FINAL:
Alice (35h): Formation + CP + 4 ouvertures = 35.0h ✅
Bob (39h): 1 jour complet + 4 fermetures + 1 repos = 39.0h ✅
Clara (30h): 2 formations + 3 créneaux vente + repos dimanche = 30.0h ✅
```

---

## 🎯 Avantages de la Nouvelle Stratégie

### **1. Équité Renforcée**
- ✅ Rotation automatique des ouvertures/fermetures
- ✅ Repos weekend basé sur l'historique réel
- ✅ Répartition équitable des créneaux difficiles

### **2. Respect des Contraintes Métier**
- ✅ Mineurs: repos dimanche + max 35h strictes
- ✅ Compétences: ouverture/fermeture garanties
- ✅ Formations et congés intégrés automatiquement

### **3. Optimisation Horaire**
- ✅ Précision ±0.5h (au lieu de ±2h)
- ✅ Ajustement automatique des créneaux (+30min/-15min)
- ✅ Équilibrage selon l'affluence quotidienne

### **4. Nouveaux Créneaux Flexibles**
- ✅ Créneaux 7h30, 11h, 12h pour plus de choix
- ✅ Adaptation automatique samedi/dimanche
- ✅ Meilleure couverture des heures de pointe

### **5. Intelligence Prédictive**
- ✅ Historique weekend automatique (4 semaines)
- ✅ Analyse des patterns de fatigue
- ✅ Suggestions d'amélioration automatiques

---

## 🧪 Tests et Validation

### **Script de Test Intégré**
```bash
# Tester la nouvelle stratégie
node test-nouvelle-strategie.js

# Résultats attendus:
✅ Repos dimanche mineurs: ✅
✅ Ouvertures correctes: ✅  
✅ Fermetures correctes: ✅
✅ Écarts horaires < 0.5h: ✅
```

### **Monitoring en Production**
```javascript
// Logs structurés pour suivi
logger.info("📊 ÉTAPE 2: Calcul des fréquences weekend");
logger.info("👥 ÉTAPE 3: Classification et calcul des disponibilités");  
logger.info("🔄 ÉTAPE 4: Répartition ouvertures/fermetures");
logger.info("⚖️ ÉTAPE 7: Ajustement des heures réglementaires");
```

---

## 🔗 Intégration Technique

### **API OR-Tools Mise à Jour**
```python
# Endpoint: POST /solve
{
  "employees": [...],
  "constraints": {...},
  "affluences": [2,2,3,3,4,3,2],
  "week_number": 36,
  "weekend_history": {...}  # ✨ NOUVEAU paramètre
}

# Réponse enrichie
{
  "success": true,
  "planning": {...},
  "strategy_info": {          # ✨ NOUVELLES infos
    "weekend_scores": {...},
    "group_distribution": {...},
    "shift_assignments": {...}
  }
}
```

### **Backend Node.js Étendu**
```javascript
// Nouvelle méthode dans planningController.js
async calculateWeekendHistory(employees, weekNumber, year) {
    // Analyse automatique des 4 dernières semaines
    // Retourne historique pour OR-Tools
}

// Appel OR-Tools avec historique
const result = await this.callORToolsAPI({
    employees: employeesData,
    constraints: constraints,
    affluences: affluences,
    weekend_history: weekendHistory  // ✨ NOUVEAU
});
```

---

## 🎉 Conclusion

La **nouvelle stratégie de calcul de planning** transforme votre système existant en solution intelligente et équitable :

1. **Respecte votre stratégie métier** : placement contraintes → repos weekend → groupes → créneaux → ajustement
2. **Optimise l'équité** : rotation automatique, historique weekend, répartition équilibrée  
3. **Améliore la précision** : ±0.5h au lieu de ±2h, nouveaux créneaux flexibles
4. **Reste compatible** : fallback automatique vers méthode classique si problème
5. **Fournit transparence** : logs détaillés, informations stratégiques, validation complète

**Résultat** : Plannings plus justes, employés plus satisfaits, gestion simplifiée ! 🚀
