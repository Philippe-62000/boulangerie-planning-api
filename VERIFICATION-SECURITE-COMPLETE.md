# ✅ Vérification : Sécurité Complète

## ✅ Ce qui a été fait

### 1. Secrets Supprimés de GitHub
- [x] `boulangerie-planning-api-3.env.CORRIGE` supprimé
- [x] `VARIABLES-ENV-LONGUENESSE.md` supprimé
- [x] `.gitignore` mis à jour pour éviter les futurs commits de secrets

### 2. MongoDB
- [x] Mot de passe MongoDB changé dans MongoDB Atlas
- [x] `MONGODB_URI` mis à jour dans Render (Arras - api-4-pbfy)
- [x] `MONGODB_URI` mis à jour dans Render (Longuenesse - api-3)
- [x] URI Longuenesse pointe vers `boulangerie-planning-longuenesse` ✅

### 3. JWT_SECRET
- [x] Nouveau `JWT_SECRET` généré et mis à jour pour Longuenesse
- [ ] Nouveau `JWT_SECRET` généré et mis à jour pour Arras (à vérifier)

### 4. Branches Git
- [x] Branche `longuenesse` créée
- [x] Render api-3 configuré sur branche `longuenesse`
- [x] Auto-Deploy désactivé sur api-3

---

## 🔄 Actions Restantes

### 1. Redémarrer les Services (si pas déjà fait)

#### Arras (api-4-pbfy) :
1. Render Dashboard → `boulangerie-planning-api-4-pbfy`
2. **Manual Deploy** → **Deploy latest commit**
3. Attendre 2-3 minutes

#### Longuenesse (api-3) :
1. Render Dashboard → `boulangerie-planning-api-3`
2. **Manual Deploy** → **Deploy latest commit**
3. Attendre 2-3 minutes

---

### 2. Vérifier JWT_SECRET pour Arras

Assurez-vous que le `JWT_SECRET` d'Arras a aussi été changé :

1. Render Dashboard → `boulangerie-planning-api-4-pbfy`
2. Environment → Environment Variables
3. Vérifiez que `JWT_SECRET` n'est plus l'ancien secret exposé
4. Si c'est encore l'ancien, générez-en un nouveau et mettez-le à jour

---

### 3. Vérifier que Tout Fonctionne

#### Tester Arras :
1. https://boulangerie-planning-api-4-pbfy.onrender.com/api/health
   - Doit retourner : `{"status":"ok"}`
2. https://www.filmara.fr/plan
   - Doit se charger correctement
   - Vérifiez que les données se chargent

#### Tester Longuenesse :
1. https://boulangerie-planning-api-3.onrender.com/api/health
   - Doit retourner : `{"status":"ok"}`
2. https://www.filmara.fr/lon
   - Doit se charger correctement
   - Vérifiez que les données se chargent

#### Vérifier les Logs Render :
Dans les logs de chaque service, vous devriez voir :
- ✅ `Connected to MongoDB`
- ✅ `Server running on port...`
- ❌ Pas d'erreurs d'authentification
- ❌ Pas d'erreurs JWT

---

## 🔒 Secrets à Changer (si pas encore fait)

### SMTP Passwords (optionnel mais recommandé)

Si vous utilisez SMTP, changez aussi ces mots de passe :

1. **SFTP_PASSWORD** (si utilisé)
   - Changez dans votre interface NAS/OVH
   - Mettez à jour dans Render (Arras et Longuenesse)

2. **SMTP_PASS_OVH** (si utilisé)
   - Changez dans votre interface OVH
   - Mettez à jour dans Render (Arras et Longuenesse)

3. **SMTP_PASS** (Gmail, si utilisé)
   - Créez un nouveau App Password Gmail
   - Mettez à jour dans Render (Arras et Longuenesse)

---

## 📋 Checklist Finale

### Sécurité GitHub
- [x] Fichiers avec secrets supprimés
- [x] `.gitignore` mis à jour

### MongoDB
- [x] Mot de passe changé dans MongoDB Atlas
- [x] URI mis à jour dans Render (Arras)
- [x] URI mis à jour dans Render (Longuenesse)
- [x] URI Longuenesse pointe vers la bonne base

### JWT
- [x] JWT_SECRET Longuenesse changé
- [ ] JWT_SECRET Arras changé (à vérifier)

### Services
- [ ] Arras redémarré
- [ ] Longuenesse redémarré
- [ ] Tests de connexion réussis

### SMTP (optionnel)
- [ ] SFTP_PASSWORD changé (si utilisé)
- [ ] SMTP_PASS_OVH changé (si utilisé)
- [ ] SMTP_PASS changé (si utilisé)

---

## 🎯 Résumé

Vous avez fait les étapes les plus importantes :
- ✅ Secrets supprimés de GitHub
- ✅ Mot de passe MongoDB changé
- ✅ JWT_SECRET Longuenesse changé
- ✅ Branches Git séparées

**Il reste à faire :**
1. Vérifier/changer JWT_SECRET pour Arras
2. Redémarrer les services
3. Tester que tout fonctionne
4. (Optionnel) Changer les mots de passe SMTP

---

## 🆘 Si Problème

### Erreur de Connexion MongoDB
- Vérifiez que le mot de passe est correct dans Render
- Vérifiez l'encodage des caractères spéciaux
- Vérifiez que l'utilisateur MongoDB a les droits

### Erreur JWT
- Vérifiez que le JWT_SECRET est bien mis à jour
- Redémarrez le service après la mise à jour

### Application ne Fonctionne Plus
- Vérifiez les logs Render pour l'erreur exacte
- Vérifiez que les deux services utilisent les bons secrets
- Testez l'URI MongoDB avec MongoDB Compass







