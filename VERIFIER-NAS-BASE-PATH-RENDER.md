# 🔍 Vérification NAS_BASE_PATH dans Render

## ❌ Problème Actuel

Les logs montrent toujours :
```
📁 Configuration NAS:
  - NAS_BASE_PATH: Non défini  ← ❌ Toujours non défini
  - basePath utilisé: /n8n/uploads/documents  ← ❌ Chemin Arras
```

## ✅ Solution : Vérifier et Redéployer

### Étape 1 : Vérifier la Variable dans Render

1. **Connectez-vous à [Render Dashboard](https://dashboard.render.com)**
2. **Sélectionnez le service `boulangerie-planning-api-3`**
3. **Allez dans Environment → Environment Variables**
4. **Vérifiez que `NAS_BASE_PATH` existe avec la valeur :**
   - **Key** : `NAS_BASE_PATH` (exactement, sans espaces)
   - **Value** : `/n8n/uploads/documents-longuenesse` (sans guillemets)

### Étape 2 : Vérifier aussi SFTP_BASE_PATH

Assurez-vous que `SFTP_BASE_PATH` est aussi présent :
- **Key** : `SFTP_BASE_PATH`
- **Value** : `/n8n/uploads/documents-longuenesse` (sans guillemets)

### Étape 3 : Redéployer le Service

**⚠️ IMPORTANT :** Après avoir ajouté/modifié une variable d'environnement, vous DEVEZ redéployer le service pour que les changements prennent effet.

1. Dans Render, cliquez sur **Manual Deploy** → **Deploy latest commit**
2. Attendez 2-3 minutes que le déploiement se termine
3. Vérifiez les nouveaux logs

### Étape 4 : Vérifier les Nouveaux Logs

Après redéploiement, les logs devraient afficher :
```
📁 Configuration NAS:
  - NAS_BASE_PATH: /n8n/uploads/documents-longuenesse  ← ✅
  - basePath utilisé: /n8n/uploads/documents-longuenesse  ← ✅
  - Mode: NAS  ← ✅
```

---

## 🐛 Si le Problème Persiste

### Vérification 1 : Nom de la Variable

Assurez-vous que le nom est exactement `NAS_BASE_PATH` (en majuscules, avec underscore).

### Vérification 2 : Valeur sans Guillemets

Dans Render, la valeur doit être :
```
/n8n/uploads/documents-longuenesse
```

**PAS :**
```
"/n8n/uploads/documents-longuenesse"  ← ❌ Avec guillemets
```

### Vérification 3 : Redéploiement Effectué

Les variables d'environnement ne sont chargées qu'au démarrage du service. Si vous avez ajouté la variable mais n'avez pas redéployé, elle ne sera pas prise en compte.

---

## 📋 Checklist Complète

- [ ] Variable `NAS_BASE_PATH` ajoutée dans Render
- [ ] Variable `SFTP_BASE_PATH` vérifiée dans Render
- [ ] Valeurs sans guillemets
- [ ] Service redéployé (Manual Deploy)
- [ ] Logs vérifiés après redéploiement
- [ ] `NAS_BASE_PATH` apparaît dans les logs avec la bonne valeur

