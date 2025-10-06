# 🎫 Documentation - Système Ticket Restaurant

## 📋 Vue d'ensemble

Le système de gestion des tickets restaurant permet de scanner, enregistrer et suivre les tickets restaurant des employés. Il supporte plusieurs fournisseurs (Edenred, Pluxee, Bimpli) et extrait automatiquement les montants des codes-barres scannés.

## 🔧 Configuration Scanner

### Scanner Netum L6
- **Modèle** : Netum L6
- **Format attendu** : 24 caractères exactement
- **Validation** : Seule la longueur est vérifiée (pas de préfixe/suffixe fixe)

### Format des codes-barres
```
XXXXXXXXXXXXXXXXXXXXXXXX (24 caractères)
```

**Exemples de codes scannés :**
- `037772804720090014200005` → 9.00€
- `0005039624357600068022000005` → 6.80€
- `22200005038301359930115222700005` → 11.52€

## 🎯 Fonctionnalités principales

### 1. Scanner des tickets
- **Activation/Désactivation** : Bouton pour contrôler le scanner
- **Validation automatique** : Vérification de la longueur (24 caractères)
- **Message d'erreur** : Si longueur incorrecte, demande de rescanner

### 2. Extraction des montants
Le système utilise une logique hybride pour extraire les montants :

#### Patterns connus (priorité)
- `680` → 6.80€
- `700` → 7.00€
- `800` → 8.00€
- `900` → 9.00€
- `1152` → 11.52€
- `383` → 3.83€

#### Fallback structurel
Si aucun pattern n'est trouvé, extraction depuis les positions 11-16 (format 20 caractères)

### 3. Gestion des fournisseurs
- **Edenred** : Tickets bleus
- **Pluxee** : Tickets verts  
- **Bimpli** : Tickets oranges

### 4. Mode test
- **Diagnostic scanner** : Analyse des codes scannés
- **Validation format** : Vérification 24 caractères
- **Historique** : Derniers 10 codes analysés

## 🚨 Gestion des erreurs

### Codes invalides
```
❌ Code-barres invalide: 20 caractères (attendu: 24). Veuillez rescanner le ticket.
```

### Actions correctives
1. **Longueur incorrecte** : Rescanner le ticket
2. **Montant non extrait** : Vérifier le pattern dans le mode test
3. **Scanner non configuré** : Utiliser le mode test pour diagnostiquer

## 📊 Interface utilisateur

### Contrôles scanner
- **Scanner actif** : Indicateur visuel + bouton arrêt
- **Sélection fournisseur** : Dropdown pour choisir le fournisseur
- **Mode test** : Toggle pour activer le diagnostic

### Affichage des totaux
- **Par fournisseur** : Montant et nombre de tickets
- **Total général** : Somme de tous les tickets du mois
- **Historique** : Liste chronologique des tickets scannés

### Mode test - Diagnostic
```
🧪 Mode Test - Diagnostic Scanner Netum L6

Format attendu : XXXXXXXXXXXXXXXXXXXXXXXX (24 caractères)
- Longueur : 24 caractères exactement
- Si moins de 24 caractères : Rescanner le ticket
- Si plus de 24 caractères : Rescanner le ticket
- Montant : extraction par patterns connus
```

## 🔄 Workflow d'utilisation

### 1. Configuration initiale
1. Aller sur la page Ticket Restaurant
2. Activer le mode test
3. Scanner quelques tickets pour valider la configuration
4. Vérifier que les montants sont correctement extraits

### 2. Utilisation normale
1. Sélectionner le fournisseur (Edenred/Pluxee/Bimpli)
2. Activer le scanner
3. Scanner les tickets un par un
4. Vérifier les totaux en temps réel
5. Consulter l'historique si nécessaire

### 3. Résolution de problèmes
1. **Ticket non reconnu** : Vérifier la longueur (24 caractères)
2. **Montant incorrect** : Utiliser le mode test pour analyser
3. **Scanner ne fonctionne pas** : Vérifier la configuration du scanner

## 🛠️ Maintenance technique

### Base de données
- **Collection** : `ticketrestaurants`
- **Champs** : `provider`, `amount`, `date`, `month`, `barcode`, `createdAt`

### API Endpoints
- `GET /api/ticket-restaurant?month=YYYY-MM` : Récupérer les tickets
- `POST /api/ticket-restaurant` : Ajouter un ticket
- `DELETE /api/ticket-restaurant/:id` : Supprimer un ticket

### Logs de débogage
```javascript
📱 Code-barres scanné: [code]
🔍 Chaîne de montant extraite: [extracted]
💰 Montant extrait: [amount] €
```

## 📈 Statistiques et rapports

### Totaux par mois
- Nombre total de tickets
- Montant total par fournisseur
- Montant général du mois

### Historique
- Date et heure de scan
- Fournisseur et montant
- Code-barres complet
- Possibilité de suppression

## 🔒 Sécurité et permissions

### Accès
- **Admin** : Accès complet (lecture/écriture)
- **Employé** : Accès en lecture seule

### Validation
- Longueur de code-barres obligatoire (24 caractères)
- Montant numérique obligatoire
- Date de scan automatique

## 🚀 Déploiement

### Frontend
- Build automatique avec `npm run build`
- Déploiement via scripts batch
- Versioning des déploiements

### Backend
- Routes intégrées dans `server.js`
- Modèle Mongoose pour la persistance
- API REST complète

## 📝 Notes importantes

1. **Scanner Netum L6** : Configuration spécifique requise
2. **24 caractères** : Longueur fixe obligatoire
3. **Patterns de montants** : Logique hybride pour extraction
4. **Mode test** : Essentiel pour diagnostiquer les problèmes
5. **Rescanner** : Solution principale pour les codes invalides

## 🔧 Dépannage

### Problème : Scanner ne fonctionne pas
**Solution** : Vérifier la configuration du scanner Netum L6

### Problème : Montant incorrect
**Solution** : Utiliser le mode test pour analyser le pattern

### Problème : Code rejeté
**Solution** : Vérifier la longueur (24 caractères) et rescanner

### Problème : Page qui remonte
**Solution** : Position de scroll sauvegardée automatiquement

---

*Documentation mise à jour le 6 octobre 2025 - Version 013*
