# 🚀 Instructions de Déploiement – Novembre 2025

## ✅ Avant de commencer
- Vérifier que la base MongoDB production est propre (données de test purgées).
- Conserver la sauvegarde locale `sauvegarde-avant-deployement/` créée le 09/11/2025.

## 1. 🔨 Build Frontend (local)
```bash
build-frontend-simple.bat
```
- Génère le dossier `frontend/build/` avec les assets Vite à jour.

## 2. 📦 Préparation upload OVH
```bash
deploy-frontend-complet.bat
```
- Copie les fichiers de build vers le dossier d’export pour OVH.
- Si le script boucle, interrompre une fois la copie terminée puis vérifier le dossier généré.

## 3. 🌐 Déploiement OVH (manuel)
1. Ouvrir FileZilla (ou le gestionnaire OVH) et se connecter à l’hébergement.
2. Uploader tout le contenu exporté vers `/www/plan/` (écrasement autorisé).
3. Vider le cache OVH si nécessaire.

## 4. ⚙️ Backend Render
```bash
deploy-backend-render.bat
```
- Pousse le backend sur GitHub.
- Dans le dashboard Render → **Manual Deploy → Deploy latest commit**.
- Attendre le passage au statut « Live ».

## 5. 🧪 Tests post-déploiement
- `https://www.filmara.fr/plan/` : authentification + navigation générale.
- `SalesStats` :
  - Changement de semaine (flèches ◀ ▶).
  - Sauvegarde objectifs (`💾 Enregistrer`).
  - Affichage ventes quotidiennes cartes/promo et badges objectifs.
  - Module messages (création, destinataires multiples, suppression).
- `daily-sales-entry.html` :
  - Saisie code vendeur → affichage objectifs cumulés (`real / objectif`).
  - Téléchargement messages en cours + bouton « J’ai lu ».
- Vérifier qu’aucune donnée résiduelle (acomptes, congés, arrêts) ne réapparaît.

## 6. 🗂️ Checklist finale
- [ ] Sauvegarde `sauvegarde-avant-deployement/` archivée hors poste.
- [ ] Scripts `.bat` disponibles dans la racine et testés.
- [ ] Base MongoDB production toujours vide de données de test.
- [ ] Hard refresh navigateur (`Ctrl+F5`) après déploiement.

## 📌 Résumé modifications principales
- Refonte objectifs ventes (arrondis par présence, totaux bruts).
- Module messages salariés (backend + frontend).
- Page saisie quotidienne enrichie (objectifs cumulés, messages).
- Nettoyage complet des collections de test (salariés, ventes, acomptes, congés, arrêts, tickets, frais, paramètres objectifs).

**Le site est prêt pour la mise en production.** 🎉

