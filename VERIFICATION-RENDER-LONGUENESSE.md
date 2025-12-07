# 🔍 Vérification : Pourquoi Longuenesse se modifie encore ?

## ✅ Configuration Actuelle (Vérifiée)

- **Branche Render api-3** : `longuenesse` ✅
- **Auto-Deploy** : `No` ✅

## ❓ Questions à Clarifier

### 1. **Quel type de "changement" voyez-vous ?**

#### A. Redéploiements dans Render ?
- Allez dans Render Dashboard → `boulangerie-planning-api-3` → **Logs**
- Voyez-vous des messages de build/déploiement quand vous poussez sur `main` ?
- Si OUI → Il y a encore un problème de configuration
- Si NON → C'est normal, pas de redéploiement

#### B. Redémarrages automatiques ?
- Render redémarre automatiquement les services gratuit pour les maintenir en vie
- C'est **NORMAL** et **ATTENDU**
- Ce n'est **PAS** un redéploiement, juste un redémarrage du service
- Le code reste le même (celui de la branche `longuenesse`)

#### C. Changements dans les données/fonctionnalités ?
- Si vous voyez des changements dans les données ou fonctionnalités de Longuenesse
- Cela pourrait indiquer un problème de configuration des variables d'environnement
- Vérifiez que les bases MongoDB sont bien séparées

---

## 🔍 Vérifications à Faire

### 1. Vérifier dans Render Dashboard

1. Allez sur https://dashboard.render.com
2. Sélectionnez `boulangerie-planning-api-3`
3. Allez dans **Logs**
4. Regardez les dates des derniers déploiements
5. Comparez avec les dates de vos push sur `main`

**Si vous voyez des déploiements après vos push sur `main` :**
- Il y a encore un problème de configuration
- Vérifiez que la branche est bien `longuenesse`
- Vérifiez que Auto-Deploy est bien sur "No"

**Si vous ne voyez PAS de déploiements après vos push sur `main` :**
- ✅ C'est normal ! Le service ne se redéploie plus automatiquement
- Les redémarrages que vous voyez sont normaux (maintenance Render)

---

### 2. Vérifier les Variables d'Environnement

Assurez-vous que les variables d'environnement sont bien différentes :

**Dans Render api-3 (Longuenesse) :**
- `MONGODB_URI` → doit contenir `boulangerie-planning-longuenesse`
- `JWT_SECRET` → doit être différent de celui d'Arras
- `SFTP_BASE_PATH` → doit contenir `-longuenesse`

**Dans Render api-4-pbfy (Arras) :**
- `MONGODB_URI` → doit contenir `boulangerie-planning` (sans `-longuenesse`)
- `JWT_SECRET` → doit être différent de celui de Longuenesse

---

### 3. Vérifier les Webhooks GitHub

1. Allez sur GitHub → Votre repo → **Settings** → **Webhooks**
2. Vérifiez s'il y a des webhooks vers Render
3. Si oui, vérifiez qu'ils pointent vers le bon service

---

## 🎯 Solutions selon le Problème

### Si vous voyez des REDÉPLOIEMENTS :

1. **Vérifiez la branche dans Render :**
   - Settings → Build & Deploy → Branch
   - Doit être `longuenesse`, pas `main`

2. **Vérifiez Auto-Deploy :**
   - Settings → Build & Deploy → Auto-Deploy
   - Doit être "No"

3. **Vérifiez les webhooks GitHub :**
   - GitHub → Settings → Webhooks
   - Supprimez les webhooks qui pointent vers api-3

### Si vous voyez seulement des REDÉMARRAGES :

✅ **C'est NORMAL !** Render redémarre automatiquement les services gratuits pour les maintenir en vie. Ce n'est pas un redéploiement, le code reste le même.

### Si vous voyez des CHANGEMENTS dans les données :

1. Vérifiez que `MONGODB_URI` est bien différent entre Arras et Longuenesse
2. Vérifiez que les bases de données sont bien séparées dans MongoDB Atlas
3. Vérifiez les logs Render pour voir quelle base est utilisée

---

## 📋 Checklist de Vérification

- [ ] Branche Render api-3 = `longuenesse`
- [ ] Auto-Deploy Render api-3 = `No`
- [ ] Pas de redéploiements dans les logs après push sur `main`
- [ ] Variables d'environnement différentes entre Arras et Longuenesse
- [ ] Bases MongoDB séparées

---

## 💡 Conclusion

Si la configuration est correcte (branche `longuenesse` + Auto-Deploy `No`), Longuenesse ne devrait **PAS** se redéployer automatiquement quand vous poussez sur `main`.

Les redémarrages automatiques que vous voyez sont **normaux** et **attendus** - c'est Render qui maintient le service en vie, mais le code reste celui de la branche `longuenesse`.







