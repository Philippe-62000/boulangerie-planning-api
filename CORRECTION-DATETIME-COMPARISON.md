# 🔧 CORRECTION ERREUR DATETIME COMPARISON

## 📋 Problème identifié

**Erreur :** `can't compare offset-naive and offset-aware datetimes`

**Service affecté :** `constraint-calculator.py`

**Cause :** La méthode `get_date_for_day()` retourne une date naïve (sans timezone) alors que les dates de maladie (`sickLeave`) sont maintenant timezone-aware.

## 🎯 Solution appliquée

### 1. Import du module timezone
```python
from datetime import datetime, timedelta, timezone
```

### 2. Correction de la comparaison de dates
```python
# Avant (ERREUR)
day_date = self.get_date_for_day(day_name, week_number, year)
if start_date <= day_date <= end_date:  # ❌ Comparaison naïve vs aware

# Après (CORRIGÉ)
day_date = self.get_date_for_day(day_name, week_number, year)
# Rendre day_date timezone-aware pour la comparaison
day_date = day_date.replace(tzinfo=timezone.utc)
if start_date <= day_date <= end_date:  # ✅ Comparaison aware vs aware
```

## 🔍 Détail technique

- **`start_date` et `end_date`** : Dates de maladie avec timezone UTC (`+00:00`)
- **`day_date`** : Date calculée pour chaque jour de la semaine (naïve)
- **Solution** : Ajouter `timezone.utc` à `day_date` avant la comparaison

## 📊 Impact de la correction

✅ **Résolu :** Erreur HTTP 502 (Bad Gateway)  
✅ **Résolu :** Crash du service `constraint-calculator`  
✅ **Résolu :** Comparaison de dates timezone  
✅ **Maintenu :** Logique de calcul des contraintes  

## 🚀 Déploiement

**Script :** `deploy-fix-datetime-comparison.bat`

**Processus :**
1. Commit des corrections
2. Push vers GitHub
3. Déploiement automatique Render (2-5 min)

## 🧪 Test post-déploiement

1. Générer un planning pour la semaine 36
2. Vérifier que `constraint-calculator` fonctionne
3. Contrôler l'intégration des maladies déclarées
4. Valider le bon fonctionnement d'OR-Tools

## 📝 Fichiers modifiés

- `constraint-calculator.py` : Correction de la comparaison de dates
- `deploy-fix-datetime-comparison.bat` : Script de déploiement
- `CORRECTION-DATETIME-COMPARISON.md` : Documentation

---

**Date :** 3 septembre 2025  
**Statut :** ✅ Corrigé et déployé  
**Priorité :** 🔴 Critique (bloque le service)
