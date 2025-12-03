# 🔧 Solution : Problème Pipeline Minutes Render

## ❌ Problème Identifié

### Ce qui se passe :

1. **Les deux services sont connectés au même repo GitHub :**
   - `boulangerie-planning-api-3` (Longuenesse)
   - `boulangerie-planning-api-4-pbfy` (Arras)

2. **Auto-Deploy activé sur les deux :**
   - Chaque push sur GitHub déclenche un déploiement automatique sur **les deux services**
   - Même si api-3 n'est plus utilisé depuis 2 mois, il se déploie quand même à chaque push

3. **Conséquence :**
   - Tous les déploiements de api-3 ont consommé vos "pipeline minutes" gratuits
   - Render bloque maintenant les builds : "Your workspace has run out of pipeline minutes"

---

## ✅ Solution : Désactiver Auto-Deploy sur api-3

### Pourquoi cette solution ?

- ✅ **api-4-pbfy** (Arras) : Garde Auto-Deploy (déploiement automatique)
- ✅ **api-3** (Longuenesse) : Désactive Auto-Deploy, utilise Manual Deploy uniquement
- ✅ Économise les pipeline minutes
- ✅ Vous contrôlez quand déployer Longuenesse

---

## 🚀 Étapes pour Corriger

### Étape 1 : Désactiver Auto-Deploy sur api-3

1. Allez dans [Render Dashboard](https://dashboard.render.com)
2. Sélectionnez le service **`boulangerie-planning-api-3`**
3. Allez dans **Settings** → **Build & Deploy**
4. Trouvez la section **Auto-Deploy**
5. **Désactivez Auto-Deploy** (changez de "Yes" à "No")
6. Cliquez sur **Save Changes**

**Résultat :** api-3 ne se déploiera plus automatiquement à chaque push GitHub.

---

### Étape 2 : Utiliser Manual Deploy pour api-3

Maintenant, pour déployer api-3 (Longuenesse), vous devrez :

1. Allez dans le service **`boulangerie-planning-api-3`**
2. Cliquez sur **Manual Deploy** → **Deploy latest commit**
3. Attendez que le déploiement se termine

**Avantage :** Vous contrôlez exactement quand déployer Longuenesse.

---

### Étape 3 : Garder Auto-Deploy sur api-4-pbfy

**Ne changez rien** pour `boulangerie-planning-api-4-pbfy` (Arras) :
- ✅ Auto-Deploy reste activé
- ✅ Se déploie automatiquement à chaque push
- ✅ C'est normal, c'est votre service principal

---

## 📋 Configuration Recommandée

| Service | Auto-Deploy | Usage |
|---------|-------------|-------|
| **api-4-pbfy** (Arras) | ✅ Activé | Service principal, déploiement automatique |
| **api-3** (Longuenesse) | ❌ Désactivé | Service secondaire, déploiement manuel |

---

## ⚠️ Points Importants

### 1. **Pipeline Minutes**

Render gratuit offre :
- **750 pipeline minutes/mois** (environ 12-13 heures de build)
- Une fois épuisé, les builds sont bloqués jusqu'au mois suivant

### 2. **Pourquoi api-3 consommait des minutes ?**

Même si api-3 n'était plus utilisé, il se déployait automatiquement à chaque push GitHub, consommant des minutes inutilement.

### 3. **Solution Alternative : Plan Payant**

Si vous avez besoin de plus de minutes :
- **Starter Plan** : $7/mois → 1000 minutes/mois
- **Professional Plan** : $25/mois → Minutes illimitées

Mais avec Auto-Deploy désactivé sur api-3, vous devriez avoir assez de minutes gratuites.

---

## 🔄 Workflow Après Correction

### Pour Arras (api-4-pbfy) :

1. Vous poussez sur GitHub
2. **Auto-Deploy** se déclenche automatiquement
3. api-4-pbfy se déploie automatiquement
4. ✅ Pas d'action manuelle nécessaire

### Pour Longuenesse (api-3) :

1. Vous poussez sur GitHub
2. **Auto-Deploy désactivé** → Pas de déploiement automatique
3. Quand vous voulez déployer Longuenesse :
   - Allez dans Render
   - **Manual Deploy** → **Deploy latest commit**
4. ✅ Vous contrôlez quand déployer

---

## 📝 Checklist

- [ ] Désactiver Auto-Deploy sur `boulangerie-planning-api-3`
- [ ] Vérifier que Auto-Deploy est toujours activé sur `boulangerie-planning-api-4-pbfy`
- [ ] Tester un push GitHub → Vérifier que seul api-4-pbfy se déploie
- [ ] Tester Manual Deploy sur api-3 → Vérifier que ça fonctionne

---

## 🎯 Résultat Attendu

Après ces modifications :

- ✅ **api-4-pbfy** (Arras) : Continue de se déployer automatiquement
- ✅ **api-3** (Longuenesse) : Ne se déploie plus automatiquement
- ✅ **Économie de pipeline minutes** : Seul api-4-pbfy consomme des minutes
- ✅ **Contrôle total** : Vous décidez quand déployer Longuenesse

---

## 🐛 Si les Builds Restent Bloqués

Si après avoir désactivé Auto-Deploy, les builds restent bloqués :

1. **Attendre le mois suivant** : Les pipeline minutes se réinitialisent chaque mois
2. **Ou passer au plan payant** : Pour débloquer immédiatement

Mais normalement, avec Auto-Deploy désactivé sur api-3, vous devriez avoir assez de minutes pour api-4-pbfy.

---

**Une fois Auto-Deploy désactivé sur api-3, vous pourrez déployer Longuenesse manuellement sans problème !** 🎉





