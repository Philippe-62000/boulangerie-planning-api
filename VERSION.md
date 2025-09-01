# 📋 VERSION - Boulangerie Planning

## 🚀 Version actuelle : v1.3.6

### 📅 Dernière mise à jour : 2024-12-19

### 🔧 Changements dans cette version :
- 🔧 Correction erreur syntaxe planningController.js
- 🔧 Création serveur racine (server.js) pour compatibilité Render
- 🔧 Correction chemin serveur (backend/server.js)
- 🔧 Remplacement OR-Tools par solveur JavaScript optimisé
- ✅ Lien avec arrêts maladie déclarés (profil employé)
- ✅ Règles mineurs strictes (pas de travail dimanche + repos consécutifs)
- ✅ Cadre général des besoins en personnel appliqué
- ✅ Rotation des horaires (ouverture/fermeture)
- ✅ Respect des compétences (ouverture/fermeture)
- ✅ Solveur de planning optimisé (inspiré du code Python OR-Tools)
- ✅ Rotation automatique des horaires (matin/après-midi)

### 📊 Historique des versions :

#### v1.3.6 (2024-12-19)
- 🔧 Correction erreur syntaxe planningController.js
- 🔧 Création serveur racine (server.js) pour compatibilité Render
- 🔧 Correction chemin serveur (backend/server.js)
- 🔧 Remplacement OR-Tools par solveur JavaScript optimisé
- 🏥 Lien avec arrêts maladie déclarés (profil employé)
- 👶 Règles mineurs strictes (pas de travail dimanche + repos consécutifs)
- 📋 Cadre général des besoins en personnel appliqué
- 🔄 Rotation des horaires (ouverture/fermeture)
- 🎯 Respect des compétences (ouverture/fermeture)

#### v1.3.2 (2024-12-19)
- 🔧 Correction package OR-Tools (@google/or-tools)
- 🏥 Lien avec arrêts maladie déclarés (profil employé)
- 👶 Règles mineurs strictes (pas de travail dimanche + repos consécutifs)
- 📋 Cadre général des besoins en personnel appliqué
- 🔄 Rotation des horaires (ouverture/fermeture)
- 🎯 Respect des compétences (ouverture/fermeture)

#### v1.3.1 (2024-12-19)
- 🏥 Lien avec arrêts maladie déclarés (profil employé)
- 👶 Règles mineurs strictes (pas de travail dimanche + repos consécutifs)
- 📋 Cadre général des besoins en personnel appliqué
- 🔄 Rotation des horaires (ouverture/fermeture)
- 🎯 Respect des compétences (ouverture/fermeture)

#### v1.3.0 (2024-12-19)
- 🚀 Intégration OR-Tools pour optimisation planning
- 🔧 Rotation automatique des horaires (matin/après-midi)
- 👶 Règles spéciales pour mineurs (repos consécutifs + dimanche)
- 📊 Respect strict des heures contractuelles
- 🔄 Éviter la monotonie des horaires

#### v1.2.3 (2024-12-19)
- 🔧 Correction comptage formations (8h par jour)
- 🔧 Amélioration ajustement heures contractuelles (tolérance 2h/4h)
- 📝 Logs détaillés pour debugging formations
- 🔧 Correction transformation repos ↔ travail

#### v1.2.2 (2024-12-19)
- 🔧 Système de versioning automatisé
- 📝 Script `push-to-main.bat` pour déploiement
- 📝 Documentation protocole de versioning

#### v1.2.1 (2024-12-19)
- 🔧 Fix planning - Logique sélection + ajustement heures contractuelles
- 📝 Mise à jour documentation architecture

#### v1.2.0 (2024-12-19)
- 🔧 Fix génération planning - Respect heures contractuelles + gestion contraintes

#### v1.1.0 (2024-12-19)
- Correction des contraintes de planning + amélioration frontend
- Correction du respect des contraintes (Formation, CP, MAL)
- Suppression automatique des anciens plannings
- Bouton Maladie/Absence avec menu déroulant
- Sauvegarde automatique des contraintes avant génération

#### v1.0.0 (2024-12-19)
- 🚀 Version initiale
- Configuration proxy API et React Router pour déploiement OVH

---

**💡 Pour identifier la version sur Render :**
1. Allez sur le dashboard Render
2. Vérifiez la date du dernier déploiement
3. Comparez avec la date dans ce fichier
