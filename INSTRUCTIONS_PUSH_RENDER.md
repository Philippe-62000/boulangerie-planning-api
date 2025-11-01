# 🚀 Instructions pour Pousser les Modifications vers Render

## 📋 Problème Identifié

Le code backend sur Render utilise encore l'ancien système qui appelle directement les templates EmailJS (`template_advance_request_manager`, etc.) qui n'existent pas.

Le code local a été corrigé pour utiliser les templates de la base de données, mais il n'a pas encore été poussé vers GitHub/Render.

## ✅ Solution

Les modifications ont été commitées localement. Il faut maintenant les pousser vers GitHub pour que Render les récupère automatiquement.

## 🔧 Commandes à Exécuter

### Option 1 : Push Manuel (Recommandé)

```bash
git push origin main
```

### Option 2 : Utiliser le Script push-to-main.bat

Si vous avez un script `push-to-main.bat`, vous pouvez l'exécuter.

## ⏱️ Délai de Déploiement

Après le push :
- GitHub reçoit les modifications immédiatement
- Render détecte le changement automatiquement
- Render redéploie (~2-3 minutes)
- Le nouveau code sera actif

## ✅ Vérifications Post-Déploiement

Une fois Render redéployé, vérifiez dans les logs Render :

1. **Les logs ne devraient plus mentionner** :
   - ❌ `sendViaEmailJSTemplate('template_advance_request_manager'`
   - ❌ `The template ID not found`

2. **Les logs devraient montrer** :
   - ✅ `Récupérer le template depuis la base de données`
   - ✅ `Template de notification acompte trouvé`

3. **Tester** :
   - Créer une nouvelle demande d'acompte
   - Vérifier que les emails sont envoyés correctement

## 🐛 Si le Problème Persiste

1. Vérifiez que Render a bien redéployé (regardez les logs Render)
2. Vérifiez que les templates sont bien dans la base de données (via Parameters → Templates)
3. Attendez 2-3 minutes après le push pour que Render termine le redéploiement

---

**Note :** Render redéploie automatiquement à chaque push sur la branche `main`.

