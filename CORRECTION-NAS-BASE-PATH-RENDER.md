# 🔧 Correction : NAS_BASE_PATH manquant dans Render

## ❌ Problème Identifié

Dans les logs Render, on voit :
```
📁 Configuration NAS:
  - NAS_BASE_PATH: Non défini
  - basePath utilisé: /n8n/uploads/documents  ← ❌ Chemin Arras (par défaut)
```

**Le backend utilise le chemin par défaut d'Arras au lieu de celui de Longuenesse !**

---

## ✅ Solution : Ajouter NAS_BASE_PATH dans Render

### Étapes :

1. **Connectez-vous à [Render Dashboard](https://dashboard.render.com)**

2. **Sélectionnez le service `boulangerie-planning-api-3`**

3. **Allez dans Environment → Environment Variables**

4. **Ajoutez la variable suivante :**
   - **Key** : `NAS_BASE_PATH`
   - **Value** : `/n8n/uploads/documents-longuenesse`
   - **⚠️ SANS guillemets**

5. **Vérifiez aussi que `SFTP_BASE_PATH` est bien configuré :**
   - **Key** : `SFTP_BASE_PATH`
   - **Value** : `/n8n/uploads/documents-longuenesse`
   - **⚠️ SANS guillemets**

6. **Sauvegardez les modifications**

7. **Redéployez le service :**
   - Cliquez sur **Manual Deploy** → **Deploy latest commit**
   - Attendez 2-3 minutes

---

## ✅ Vérification Après Redéploiement

Dans les nouveaux logs, vous devriez voir :
```
📁 Configuration NAS:
  - NAS_BASE_PATH: /n8n/uploads/documents-longuenesse  ← ✅
  - basePath utilisé: /n8n/uploads/documents-longuenesse  ← ✅
  - Mode: NAS  ← ✅
```

---

## 📋 Variables à Vérifier dans Render

Assurez-vous que toutes ces variables sont présentes :

- ✅ `MONGODB_URI` → `mongodb+srv://.../boulangerie-planning-longuenesse`
- ✅ `JWT_SECRET` → (clé unique pour Longuenesse)
- ✅ `CORS_ORIGIN` → (inclut `https://www.filmara.fr/lon`)
- ✅ `SFTP_BASE_PATH` → `/n8n/uploads/documents-longuenesse`
- ✅ `NAS_BASE_PATH` → `/n8n/uploads/documents-longuenesse` ← **À AJOUTER**
- ✅ `SFTP_PASSWORD` → (mot de passe SFTP)
- ✅ `STORE_NAME` → `Boulangerie Ange - Longuenesse`
- ✅ `EMAILJS_*` → (toutes les variables EmailJS)

**Toutes les valeurs sont dans le fichier `boulangerie-planning-api-3-FINAL.env`**

---

## 🎯 Après Correction

Une fois `NAS_BASE_PATH` ajouté et le service redéployé :
- ✅ Les documents seront uploadés dans `/n8n/uploads/documents-longuenesse/`
- ✅ Séparation complète avec Arras
- ✅ Prêt pour le déploiement du frontend

