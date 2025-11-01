# 🔧 Plan de Maintenance - Dépendances et Obsolescence

## 📊 État Actuel des Dépendances (2025)

### **Frontend (React)**

#### ✅ **Dépendances Stables - Maintenance Normale**

| Package | Version Actuelle | Statut | Action Recommandée |
|---------|------------------|--------|-------------------|
| `react` | ^18.3.1 | ✅ Stable | Mise à jour mineure (18.x) tous les 6 mois |
| `react-dom` | ^18.3.1 | ✅ Stable | Mise à jour mineure (18.x) tous les 6 mois |
| `react-router-dom` | ^6.15.0 | ✅ Stable | Mise à jour mineure (6.x) tous les 6 mois |
| `axios` | ^1.5.0 | ✅ Stable | Mise à jour mineure (1.x) tous les 3 mois |
| `react-bootstrap` | ^2.10.10 | ✅ Stable | Mise à jour mineure (2.x) tous les 6 mois |
| `react-toastify` | ^11.0.5 | ✅ Stable | Mise à jour mineure (11.x) tous les 6 mois |

#### ⚠️ **Dépendances à Surveiller**

| Package | Version Actuelle | Statut | Action Recommandée | Priorité |
|---------|------------------|--------|-------------------|----------|
| `react-scripts` | 5.0.1 | ⚠️ **CRITIQUE** | Migration vers Vite ou mettre à jour vers 5.0.2+ | 🔴 **HAUTE** |
| `@testing-library/*` | ^5.17.0, ^13.4.0 | ✅ OK | Mise à jour mineure tous les 6 mois | 🟡 Moyenne |
| `web-vitals` | ^2.1.4 | ✅ OK | Mise à jour mineure tous les 6 mois | 🟡 Moyenne |

#### 🚨 **Action Immédiate Requise**

**`react-scripts` 5.0.1**
- **Problème** : Create React App n'est plus maintenu activement
- **Solution recommandée** (à planifier dans 6-12 mois) :
  1. **Option A** : Migrer vers **Vite** (recommandé)
     - Plus rapide, moderne, meilleure DX
     - Migration progressive possible
  2. **Option B** : Mettre à jour `react-scripts` vers la dernière version 5.x
     - Solution temporaire (2-3 ans)
     - Migration nécessaire vers Vite inévitable à terme

---

### **Backend (Node.js/Express)**

#### ✅ **Dépendances Stables - Maintenance Normale**

| Package | Version Actuelle | Statut | Action Recommandée |
|---------|------------------|--------|-------------------|
| `express` | ^4.18.2 | ✅ Stable | Mise à jour mineure (4.x) tous les 6 mois |
| `mongoose` | ^7.5.0 | ✅ Stable | Mise à jour mineure (7.x) tous les 3 mois |
| `jsonwebtoken` | ^9.0.2 | ✅ Stable | Mise à jour mineure (9.x) tous les 6 mois |
| `bcryptjs` | ^2.4.3 | ✅ Stable | Mise à jour mineure (2.x) tous les 12 mois |
| `cors` | ^2.8.5 | ✅ Stable | Mise à jour mineure (2.x) tous les 12 mois |
| `dotenv` | ^16.3.1 | ✅ Stable | Mise à jour mineure (16.x) tous les 12 mois |
| `helmet` | ^7.0.0 | ✅ Stable | Mise à jour mineure (7.x) tous les 6 mois |
| `compression` | ^1.7.4 | ✅ Stable | Mise à jour mineure (1.x) tous les 12 mois |
| `multer` | ^1.4.5-lts.1 | ✅ Stable (LTS) | Surveiller la fin de support LTS |
| `nodemailer` | ^6.9.7 | ✅ Stable | Mise à jour mineure (6.x) tous les 6 mois |
| `sharp` | ^0.32.6 | ✅ Stable | Mise à jour mineure (0.x) tous les 3 mois |
| `axios` | ^1.6.2 | ✅ Stable | Mise à jour mineure (1.x) tous les 3 mois |

#### ⚠️ **Dépendances à Surveiller**

| Package | Version Actuelle | Statut | Action Recommandée | Priorité |
|---------|------------------|--------|-------------------|----------|
| `node-fetch` | ^2.6.7 | 🚨 **CRITIQUE** | Migrer vers `node-fetch@3.x` (ESM) ou utiliser `axios` | 🔴 **HAUTE** |
| `pdf-parse` | ^1.1.1 | ⚠️ Ancienne | Mettre à jour vers dernière version 1.x | 🟡 Moyenne |
| `ssh2-sftp-client` | ^10.0.3 | ✅ OK | Mise à jour mineure (10.x) tous les 6 mois | 🟡 Moyenne |
| `@xmldom/xmldom` | ^0.8.10 | ⚠️ Ancienne | Vérifier si utilisée, sinon retirer | 🟡 Moyenne |

#### 📧 **EmailJS - Service Externe**

**État actuel** : EmailJS est utilisé via API REST directe (pas de package npm)
- ✅ **Pas de dépendance npm dépréciée** dans votre projet
- ⚠️ **Action recommandée** : Vérifier que vous utilisez le nouveau domaine EmailJS (`api.emailjs.com` au lieu de `cdn.emailjs.com`)
- 📝 **Note** : Le package `emailjs-com` est déprécié, mais vous n'utilisez que l'API REST, donc pas de migration nécessaire

#### 🚨 **Action Immédiate Requise**

**`node-fetch` 2.6.7**
- **Problème** : Version 2.x est en CommonJS, version 3.x nécessite ESM
- **Utilisation actuelle** : `backend/controllers/planningController.js` (appel API OR-Tools)
- **Solution recommandée** :
  1. **Option A** : Remplacer par `axios` (déjà présent dans le projet) ✅ **RECOMMANDÉ**
     - `axios` est déjà utilisé ailleurs dans le projet
     - Compatible CommonJS et ESM
     - Meilleure gestion d'erreurs
     - Remplacement simple : `const fetch = require('node-fetch')` → `const axios = require('axios')`
  2. **Option B** : Migrer vers `node-fetch@3.x` (si vraiment nécessaire)
     - Nécessite conversion ESM du projet
     - Plus complexe
     - Non recommandé car `axios` est déjà présent

---

## 📅 Calendrier de Maintenance Recommandé

### **Maintenance Mensuelle** (Vérification de sécurité)
```bash
# Vérifier les vulnérabilités
npm audit
npm audit fix
```

### **Maintenance Trimestrielle** (Mises à jour mineures)
```bash
# Mises à jour mineures automatiques
npm update
```

### **Maintenance Semestrielle** (Révision complète)
1. ✅ Vérifier les versions majeures disponibles
2. ✅ Lire les changelogs des packages critiques
3. ✅ Tester en environnement de développement
4. ✅ Déployer en staging avant production

### **Maintenance Annuelle** (Migration majeure)
- **2025-2026** : Migration `react-scripts` → **Vite**
- **2026** : Migration `node-fetch` → **axios** (si pas déjà fait)
- **2026-2027** : Révision Node.js (vérifier version minimale supportée)

---

## 🔍 Outils de Surveillance

### **1. npm audit**
```bash
# Vérification automatique des vulnérabilités
npm audit
npm audit --production
```

### **2. npm outdated**
```bash
# Voir les packages obsolètes
npm outdated
```

### **3. Dependabot (GitHub)**
- ✅ Activer Dependabot sur le repository GitHub
- Configure automatiquement les PR pour les mises à jour de sécurité

### **4. Snyk ou SonarQube** (optionnel)
- Surveillance continue des vulnérabilités
- Analyses de dépendances plus approfondies

---

## 🎯 Plan d'Action Priorisé

### **Priorité 🔴 HAUTE** (À faire dans les 3 prochains mois)

1. **Remplacer `node-fetch` par `axios` dans `planningController.js`**
   - Impact : 🔴 **Élevé** (vulnérabilités de sécurité possibles)
   - Difficulté : 🟢 **Faible** (`axios` déjà présent)
   - Temps estimé : 1-2 heures
   - Fichier concerné : `backend/controllers/planningController.js` (ligne 5)
   - Remplacement : 
     ```javascript
     // Avant
     const fetch = require('node-fetch');
     const response = await fetch(apiUrl, {...});
     
     // Après
     const axios = require('axios');
     const response = await axios.post(apiUrl, data, {...});
     ```

2. **Activer Dependabot sur GitHub**
   - Impact : 🔴 **Élevé** (surveillance automatique)
   - Difficulté : 🟢 **Très faible** (configuration GitHub)
   - Temps estimé : 15 minutes

### **Priorité 🟡 MOYENNE** (À faire dans les 6-12 prochains mois)

3. **Mettre à jour `react-scripts` vers 5.0.2+**
   - Impact : 🟡 **Moyen** (corrections de bugs)
   - Difficulté : 🟡 **Moyenne** (tests nécessaires)
   - Temps estimé : 4-8 heures

4. **Réviser et mettre à jour `pdf-parse`**
   - Impact : 🟡 **Moyen** (corrections de bugs)
   - Difficulté : 🟢 **Faible** (mise à jour simple)
   - Temps estimé : 1-2 heures

### **Priorité 🟢 BASSE** (À planifier dans les 12-24 prochains mois)

5. **Migration vers Vite**
   - Impact : 🟢 **Bas** (amélioration DX, pas urgent)
   - Difficulté : 🔴 **Élevée** (refactoring important)
   - Temps estimé : 1-2 jours

6. **Révision Node.js (version minimale)**
   - Impact : 🟢 **Bas** (compatibilité future)
   - Difficulté : 🟡 **Moyenne** (tests nécessaires)
   - Temps estimé : 4-8 heures

---

## 📝 Checklist de Maintenance Mensuelle

- [ ] Exécuter `npm audit` sur frontend et backend
- [ ] Corriger les vulnérabilités critiques (si trouvées)
- [ ] Vérifier les logs de déploiement Render
- [ ] Vérifier les erreurs dans la console navigateur
- [ ] Vérifier les performances de l'API

---

## 🔗 Ressources Utiles

- **npm audit** : https://docs.npmjs.com/cli/v8/commands/npm-audit
- **Dependabot** : https://docs.github.com/en/code-security/dependabot
- **React Scripts Migration** : https://react.dev/learn/start-a-new-react-project
- **Vite Migration Guide** : https://vitejs.dev/guide/migration.html
- **Node.js LTS Schedule** : https://nodejs.org/en/about/releases/

---

## ✅ Recommandation Finale

**Oui, il faudra mettre à jour certaines dépendances à terme pour éviter l'obsolescence :**

1. **Court terme (3-6 mois)** : 
   - Remplacer `node-fetch` par `axios`
   - Activer Dependabot

2. **Moyen terme (6-12 mois)** :
   - Mettre à jour `react-scripts`
   - Réviser les packages mineurs

3. **Long terme (12-24 mois)** :
   - Migrer vers Vite (quand Create React App ne sera plus maintenu)
   - Réviser la version Node.js minimale

**La bonne nouvelle** : La plupart de vos dépendances sont à jour et stables. Seulement 2-3 actions critiques à prévoir.

