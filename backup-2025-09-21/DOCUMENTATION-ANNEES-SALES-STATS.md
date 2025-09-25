# 📚 DOCUMENTATION - GESTION DES ANNÉES DANS SALES STATS

## 🎯 **VUE D'ENSEMBLE**

Le composant `SalesStats.js` contient **3 sélecteurs d'années** qui utilisent une configuration centralisée pour afficher une plage d'années personnalisable.

## 🔧 **CONFIGURATION ACTUELLE**

### **Constantes de configuration (lignes 4-5) :**
```javascript
// ⚠️  MODIFIER CES VALEURS POUR CHANGER LA PLAGE D'ANNÉES
const YEAR_RANGE = 8; // Nombre total d'années à afficher (ex: 8 = 2022 à 2029)
const YEARS_BACK = 3; // Nombre d'années en arrière depuis l'année actuelle (ex: 3 = 2022, 2023, 2024, 2025...)
```

### **Fonction helper (lignes 235-240) :**
```javascript
// Générer la liste des années pour les sélecteurs
const generateYearOptions = () => {
  return Array.from({length: YEAR_RANGE}, (_, i) => {
    const year = new Date().getFullYear() - YEARS_BACK + i;
    return <option key={year} value={year}>{year}</option>;
  });
};
```

## 📍 **LOCALISATION DES SÉLECTEURS**

### **1. Sélecteur principal (en-tête) - Ligne ~249**
```javascript
<select 
  value={currentYear} 
  onChange={(e) => setCurrentYear(parseInt(e.target.value))}
  className="year-select"
>
  {generateYearOptions()}
</select>
```

### **2. Sélecteur du classement - Ligne ~426**
```javascript
<select 
  value={currentYear} 
  onChange={(e) => setCurrentYear(parseInt(e.target.value))}
  className="year-select-ranking"
>
  {generateYearOptions()}
</select>
```

### **3. Sélecteur de comparaison 12 mois - Ligne ~515**
```javascript
<select 
  value={currentYear} 
  onChange={(e) => setCurrentYear(parseInt(e.target.value))}
  className="year-select-compare"
>
  {generateYearOptions()}
</select>
```

## 🚀 **COMMENT MODIFIER LA PLAGE D'ANNÉES**

### **Option 1 : Étendre la plage (recommandé)**
```javascript
// Pour avoir 10 années au lieu de 8
const YEAR_RANGE = 10; // 10 années au total
const YEARS_BACK = 4;  // 4 années en arrière
// Résultat : 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030
```

### **Option 2 : Plage fixe personnalisée**
```javascript
// Pour avoir les années 2020 à 2030
const YEAR_RANGE = 11; // 11 années (2020 à 2030)
const YEARS_BACK = 5;  // 5 années en arrière depuis 2025
// Résultat : 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030
```

### **Option 3 : Plage très étendue**
```javascript
// Pour avoir 15 années
const YEAR_RANGE = 15; // 15 années au total
const YEARS_BACK = 7;  // 7 années en arrière
// Résultat : 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032
```

## 📊 **EXEMPLES DE CALCULS**

### **Configuration actuelle (YEAR_RANGE = 8, YEARS_BACK = 3) :**
- **Année actuelle :** 2025
- **Calcul :** 2025 - 3 + [0,1,2,3,4,5,6,7]
- **Résultat :** 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029

### **Configuration étendue (YEAR_RANGE = 10, YEARS_BACK = 4) :**
- **Année actuelle :** 2025
- **Calcul :** 2025 - 4 + [0,1,2,3,4,5,6,7,8,9]
- **Résultat :** 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030

## ⚠️ **POINTS D'ATTENTION**

### **1. Cohérence des données**
- Assurez-vous que les données existent pour toutes les années ajoutées
- Les années futures (2026+) n'auront pas de données historiques

### **2. Performance**
- Plus d'années = plus d'options dans les sélecteurs
- Impact minimal sur les performances

### **3. Maintenance**
- Modifiez uniquement les constantes `YEAR_RANGE` et `YEARS_BACK`
- Tous les sélecteurs se mettent à jour automatiquement

## 🔄 **PROCESSUS DE MODIFICATION**

### **Étape 1 : Modifier les constantes**
```javascript
// Dans SalesStats.js, lignes 4-5
const YEAR_RANGE = 10; // Augmenter de 8 à 10
const YEARS_BACK = 4;  // Augmenter de 3 à 4
```

### **Étape 2 : Rebuilder le frontend**
```bash
cd frontend
npm run build
cd ..
```

### **Étape 3 : Déployer**
- Utiliser le script de déploiement approprié
- Vérifier que les nouvelles années apparaissent

## 📝 **EXEMPLES D'UTILISATION**

### **Pour une boulangerie existante depuis 2020 :**
```javascript
const YEAR_RANGE = 11; // 11 années (2020 à 2030)
const YEARS_BACK = 5;  // 5 années en arrière depuis 2025
```

### **Pour une nouvelle boulangerie (démarrage 2025) :**
```javascript
const YEAR_RANGE = 8;  // 8 années (2025 à 2032)
const YEARS_BACK = 0;  // 0 année en arrière (commence en 2025)
```

### **Pour une boulangerie avec historique long :**
```javascript
const YEAR_RANGE = 15; // 15 années (2010 à 2024)
const YEARS_BACK = 15; // 15 années en arrière depuis 2025
```

## 🎯 **RÉSUMÉ**

- **Modification simple** : Changez uniquement 2 constantes
- **Mise à jour automatique** : Tous les sélecteurs se synchronisent
- **Flexibilité totale** : Plage d'années entièrement personnalisable
- **Maintenance facile** : Configuration centralisée en haut du composant

---

*Dernière mise à jour : Septembre 2025*
*Version : 1.0*

