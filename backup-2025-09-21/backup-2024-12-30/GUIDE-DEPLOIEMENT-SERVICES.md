# 🚀 **GUIDE DE DÉPLOIEMENT - Services Distribués**

## 📋 **Vue d'Ensemble**

Ce guide vous accompagne pour déployer les 2 services OR-Tools distribués sur Render.com.

---

## 🎯 **Étape 1 : Préparation Locale**

### **1.1 Installer les dépendances**
```bash
# Service 1 : Constraint Calculator
pip install -r constraint-calculator-requirements.txt

# Service 2 : Planning Generator  
pip install -r planning-generator-requirements.txt
```

### **1.2 Tester les services localement**
```bash
# Terminal 1 : Démarrer Constraint Calculator
python constraint-calculator.py

# Terminal 2 : Démarrer Planning Generator
python planning-generator.py

# Terminal 3 : Lancer les tests
python test-services-distributed.py
```

### **1.3 Vérifier que tout fonctionne**
- ✅ Service 1 accessible sur `http://localhost:5001`
- ✅ Service 2 accessible sur `http://localhost:5002`
- ✅ Tests passent avec succès

---

## 🚀 **Étape 2 : Déploiement sur Render**

### **2.1 Créer le Service 1 : Constraint Calculator**

1. **Aller sur [Render.com](https://render.com)**
2. **Cliquer sur "New +" → "Web Service"**
3. **Connecter votre repository GitHub**
4. **Configuration :**
   - **Name** : `constraint-calculator`
   - **Environment** : `Python 3`
   - **Build Command** : `pip install -r constraint-calculator-requirements.txt`
   - **Start Command** : `python constraint-calculator.py`
   - **Plan** : `Free`

### **2.2 Variables d'environnement Service 1**
```
MONGODB_URI=mongodb+srv://votre_uri_mongodb_atlas
PORT=5001
```

### **2.3 Créer le Service 2 : Planning Generator**

1. **Cliquer sur "New +" → "Web Service"**
2. **Sélectionner le même repository**
3. **Configuration :**
   - **Name** : `planning-generator`
   - **Environment** : `Python 3`
   - **Build Command** : `pip install -r planning-generator-requirements.txt`
   - **Start Command** : `python planning-generator.py`
   - **Plan** : `Free`

### **2.4 Variables d'environnement Service 2**
```
MONGODB_URI=mongodb+srv://votre_uri_mongodb_atlas
PORT=5002
```

---

## 🔧 **Étape 3 : Configuration MongoDB**

### **3.1 Vérifier la connexion MongoDB Atlas**
- ✅ URI MongoDB valide
- ✅ Base de données `boulangerie-planning` accessible
- ✅ Collections créées automatiquement

### **3.2 Collections attendues**
```javascript
// Calculées automatiquement par les services
calculated_constraints
plannings
```

---

## 🧪 **Étape 4 : Tests de Déploiement**

### **4.1 Vérifier la santé des services**
```bash
# Service 1
curl https://constraint-calculator.onrender.com/health

# Service 2  
curl https://planning-generator.onrender.com/health
```

### **4.2 Tester le calcul des contraintes**
```bash
curl -X POST https://constraint-calculator.onrender.com/calculate-constraints \
  -H "Content-Type: application/json" \
  -d '{
    "employees": [{"_id": "test", "name": "Test", "age": 18, "weeklyHours": 35}],
    "week_number": 36,
    "year": 2025
  }'
```

### **4.3 Tester la génération du planning**
```bash
curl -X POST https://planning-generator.onrender.com/generate-planning \
  -H "Content-Type: application/json" \
  -d '{
    "employees": [{"_id": "test", "name": "Test", "age": 18, "weeklyHours": 35}],
    "week_number": 36,
    "year": 2025,
    "affluences": [2,2,2,2,2,2,2]
  }'
```

---

## 🔄 **Étape 5 : Intégration avec l'API Node.js**

### **5.1 Modifier le backend**
```javascript
// Dans planningController.js, ajouter :
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
    // Fallback vers méthode classique
    return this.generateWeeklyPlanningClassic(weekNumber, year, affluences, employees);
  }
}
```

### **5.2 Déployer le backend modifié**
```bash
./push-to-main.bat
```

---

## 📊 **Étape 6 : Validation et Monitoring**

### **6.1 Vérifier les logs Render**
- ✅ Services démarrés sans erreur
- ✅ Connexion MongoDB réussie
- ✅ Endpoints accessibles

### **6.2 Tester le flux complet**
1. **Générer un planning** depuis le frontend
2. **Vérifier** que les contraintes sont calculées
3. **Vérifier** que le planning est généré
4. **Vérifier** les données en MongoDB

### **6.3 Monitoring des performances**
- **Temps de réponse** des services
- **Utilisation des ressources** Render
- **Stabilité** des connexions MongoDB

---

## 🚨 **Dépannage**

### **Problème : Service ne démarre pas**
```bash
# Vérifier les logs Render
# Vérifier les variables d'environnement
# Vérifier la syntaxe Python
```

### **Problème : Erreur MongoDB**
```bash
# Vérifier l'URI MongoDB
# Vérifier les permissions Atlas
# Vérifier la connectivité réseau
```

### **Problème : Erreur OR-Tools**
```bash
# Vérifier l'installation d'OR-Tools
# Vérifier la version Python
# Vérifier les dépendances
```

---

## 🎉 **Résultat Attendu**

- ✅ **2 services déployés** sur Render
- ✅ **Architecture distribuée** fonctionnelle
- ✅ **Plus de limite** de requêtes OR-Tools
- ✅ **Performance améliorée** et robustesse
- ✅ **Intégration complète** avec le backend

---

## 📞 **Support**

En cas de problème :
1. **Vérifier les logs Render**
2. **Tester localement** d'abord
3. **Vérifier la configuration** MongoDB
4. **Consulter la documentation** des services

**Votre architecture distribuée est maintenant prête à révolutionner vos performances !** 🚀
