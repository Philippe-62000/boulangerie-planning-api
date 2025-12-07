# 🔧 Solution : Séparer Arras et Longuenesse

## ❌ Problème Actuel

Les deux services Render sont connectés au **même dépôt GitHub** et à la **même branche `main`** :

- **Arras** : `boulangerie-planning-api-4-pbfy` → branche `main`
- **Longuenesse** : `boulangerie-planning-api-3` → branche `main`

**Conséquence :** Quand vous modifiez le code pour Arras et poussez sur GitHub, même si l'auto-deploy est désactivé sur api-3, Render peut quand même redémarrer le service pour d'autres raisons.

---

## ✅ Solution Recommandée : Branches Séparées

### Option 1 : Branches Git Séparées (RECOMMANDÉ)

Créer une branche séparée pour Longuenesse :

1. **Créer une branche `longuenesse` :**
   ```bash
   git checkout -b longuenesse
   git push origin longuenesse
   ```

2. **Configurer Render api-3 pour utiliser la branche `longuenesse` :**
   - Allez dans [Render Dashboard](https://dashboard.render.com)
   - Sélectionnez `boulangerie-planning-api-3`
   - Settings → Build & Deploy
   - Changez **Branch** de `main` à `longuenesse`
   - Sauvegardez

3. **Résultat :**
   - ✅ Arras (api-4-pbfy) → branche `main` (se déploie automatiquement)
   - ✅ Longuenesse (api-3) → branche `longuenesse` (ne se déploie que quand vous poussez sur cette branche)

---

### Option 2 : Désactiver Complètement api-3

Si Longuenesse n'est plus utilisé :

1. **Suspendre le service api-3 :**
   - Render Dashboard → `boulangerie-planning-api-3`
   - Settings → Suspend Service
   - Le service sera arrêté et ne consommera plus de ressources

2. **Pour le réactiver plus tard :**
   - Settings → Resume Service

---

### Option 3 : Repository GitHub Séparé

Créer un dépôt GitHub séparé pour Longuenesse :

1. **Créer un nouveau repo :** `boulangerie-planning-longuenesse`
2. **Copier le code actuel**
3. **Configurer api-3 pour pointer vers ce nouveau repo**

**Avantage :** Séparation totale
**Inconvénient :** Maintenance de deux repos (duplication de code)

---

## 🎯 Solution Immédiate : Vérifier l'Auto-Deploy

Même si vous pensez avoir désactivé l'auto-deploy, vérifiez :

1. Allez dans [Render Dashboard](https://dashboard.render.com)
2. Sélectionnez `boulangerie-planning-api-3`
3. Settings → Build & Deploy
4. Vérifiez que **Auto-Deploy** est bien sur **"No"**
5. Vérifiez aussi **Branch** → doit être `main` (ou `longuenesse` si vous créez la branche)

---

## 📋 Configuration Recommandée

| Service | Branch | Auto-Deploy | Usage |
|---------|--------|-------------|-------|
| **api-4-pbfy** (Arras) | `main` | ✅ Activé | Service principal |
| **api-3** (Longuenesse) | `longuenesse` | ❌ Désactivé | Service secondaire |

---

## 🔄 Workflow Après Correction

### Pour Arras :
1. Vous modifiez le code
2. `git push origin main`
3. api-4-pbfy se déploie automatiquement ✅

### Pour Longuenesse :
1. Vous modifiez le code (si nécessaire)
2. `git checkout longuenesse`
3. `git merge main` (pour récupérer les modifications d'Arras si nécessaire)
4. `git push origin longuenesse`
5. api-3 se déploie (ou vous faites un Manual Deploy) ✅

---

## ⚠️ Points Importants

1. **Les bases de données sont séparées :**
   - Arras : `boulangerie-planning`
   - Longuenesse : `boulangerie-planning-longuenesse`
   - ✅ Aucun risque de mélange de données

2. **Les variables d'environnement sont différentes :**
   - Chaque service Render a ses propres variables
   - ✅ Séparation complète

3. **Le code source est partagé :**
   - C'est normal si vous voulez partager les corrections de bugs
   - Utilisez des branches pour séparer les déploiements

---

## 🚀 Étapes Immédiates

1. [ ] Vérifier que Auto-Deploy est désactivé sur api-3
2. [ ] Créer la branche `longuenesse` (Option 1)
3. [ ] Configurer api-3 pour utiliser la branche `longuenesse`
4. [ ] Tester : faire un push sur `main` → seul api-4-pbfy doit se déployer







