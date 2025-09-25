# 📋 GUIDE D'APPLICATION DES PATCHES

## 🚀 **Scripts disponibles :**

### **1. `auto-apply-patches.bat` - Application automatique partielle**
- ✅ Vérifie les fichiers de patch
- ✅ Crée des sauvegardes (.backup)
- ✅ Crée des fichiers de travail (.patched)
- ✅ Applique automatiquement certains patches simples

### **2. `replace-with-patched.bat` - Remplacement final**
- ✅ Remplace les fichiers originaux par les versions patchées
- ✅ Supprime les fichiers temporaires
- ✅ Nettoie l'environnement

## 🔧 **Processus complet en 2 étapes :**

### **Étape 1 : Préparation automatique**
```bash
# Double-cliquer sur auto-apply-patches.bat
# Ce script va :
# - Créer des sauvegardes (.backup)
# - Créer des fichiers de travail (.patched)
# - Appliquer certains patches automatiquement
```

### **Étape 2 : Remplacement final**
```bash
# Double-cliquer sur replace-with-patched.bat
# Ce script va :
# - Remplacer les fichiers originaux
# - Nettoyer les fichiers temporaires
# - Finaliser l'application des patches
```

## 📁 **Fichiers créés automatiquement :**

- `Constraints.js.backup` → Sauvegarde originale
- `Constraints.js.patched` → Version avec tous les patches
- `Planning.js.backup` → Sauvegarde originale  
- `Planning.js.patched` → Version avec tous les patches

## 🎯 **Patches appliqués automatiquement :**

### **Constraints.js :**
- ✅ État `sixDayWorkers` ajouté
- ✅ Fonction `applySixDaysWork` améliorée
- ✅ Bouton 6j/7 réactif visuellement
- ✅ Gestion des jours fériés

### **Planning.js :**
- ✅ Fonction `getDayDate` pour afficher les dates
- ✅ Fonction `getShiftType` pour catégoriser les shifts
- ✅ Fonction `getShiftColor` pour les couleurs
- ✅ En-tête du tableau avec dates
- ✅ Shifts colorés (Ouverture/Fermeture/Standard)
- ✅ "MAL" en rouge et gras
- ✅ Total semaine / volume contractuel

## ⚠️ **Points d'attention :**

1. **Toujours faire une sauvegarde** avant modification (automatique)
2. **Tester** les modifications après application
3. **Possibilité de restauration** depuis les fichiers .backup
4. **Processus automatisé** et sécurisé

## 🚀 **Utilisation recommandée :**

1. **Lancer `auto-apply-patches.bat`** (préparation)
2. **Vérifier** que les fichiers .patched sont créés
3. **Lancer `replace-with-patched.bat`** (application finale)
4. **Tester** le frontend
5. **Si problème**, restaurer depuis .backup

## 🔄 **Restauration en cas de problème :**

```bash
# Restaurer Constraints.js
copy "frontend\src\pages\Constraints.js.backup" "frontend\src\pages\Constraints.js"

# Restaurer Planning.js  
copy "frontend\src\pages\Planning.js.backup" "frontend\src\pages\Planning.js"
```

## 🎯 **Résultat final attendu :**

- ✅ Bouton 6j/7 réactif visuellement
- ✅ Dates des jours dans le planning
- ✅ Shifts colorés (Ouverture/Fermeture/Standard)
- ✅ "MAL" en rouge et gras
- ✅ Total semaine / volume contractuel
- ✅ Logo FILMARA en haut à gauche
- ✅ Boutons Année/Mois/Semaine pour absences
