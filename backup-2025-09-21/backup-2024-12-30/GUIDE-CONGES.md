# 🏖️ Guide d'Utilisation - Système de Gestion des Congés

## 📋 Vue d'ensemble

Le système de gestion des congés permet aux employés de demander des congés et aux administrateurs de les valider ou rejeter. Il inclut également un planning annuel et des notifications automatiques par email.

---

## 🎯 Fonctionnalités Principales

### 1. **Demande de Congés par les Employés**
- Formulaire standalone accessible sans connexion
- Sélection du type de congés (payés, RTT, sans solde, exceptionnels)
- Validation automatique des dates
- Confirmation par email

### 2. **Gestion Administrative**
- Validation ou rejet des demandes
- Modification des dates avant validation
- Synchronisation automatique avec les dossiers employés
- Notifications par email

### 3. **Planning Annuel**
- Vue calendaire sur 12 mois
- Impression optimisée
- Légende des types de congés
- Statistiques annuelles

### 4. **Tableau de Bord**
- Récapitulatif des congés à venir (8 jours avant)
- Statistiques en temps réel
- Alertes visuelles

---

## 🚀 Guide d'Utilisation

### **Pour les Employés**

#### **Demander des Congés**

1. **Accéder au formulaire** :
   - URL : `https://www.filmara.fr/vacation-request-standalone.html`
   - Ou via le menu "Gestion des Congés" → "Demande de Congés"

2. **Remplir le formulaire** :
   - **Nom complet** : Sélectionner dans la liste déroulante
   - **Email** : Saisir votre adresse email
   - **Date de début** : Date de début des congés
   - **Date de fin** : Date de fin des congés
   - **Type de congés** : Choisir parmi les options disponibles

3. **Valider la demande** :
   - Cliquer sur "📤 Envoyer la demande"
   - Recevoir une confirmation par email
   - Attendre la validation administrative

#### **Types de Congés Disponibles**
- **Congés payés** : Congés annuels
- **RTT** : Récupération du temps de travail
- **Congés sans solde** : Congés non rémunérés
- **Congés exceptionnels** : Congés spéciaux

---

### **Pour les Administrateurs**

#### **Gérer les Demandes de Congés**

1. **Accéder à la gestion** :
   - Menu "Gestion des Congés"
   - Ou URL : `https://www.filmara.fr/plan/vacation-management`

2. **Actions disponibles** :
   - **✅ Valider** : Approuver la demande
   - **✏️ Modifier** : Changer les dates avant validation
   - **❌ Rejeter** : Refuser avec une raison

3. **Filtres** :
   - Toutes les demandes
   - En attente
   - Validées
   - Rejetées

#### **Consulter le Planning Annuel**

1. **Accéder au planning** :
   - Menu "Gestion des Congés" → "Planning Annuel"
   - Ou URL : `https://www.filmara.fr/plan/vacation-planning`

2. **Fonctionnalités** :
   - **Sélection d'année** : Changer l'année affichée
   - **Impression** : Bouton "🖨️ Imprimer le Planning"
   - **Légende** : Explication des couleurs
   - **Résumé** : Statistiques annuelles

#### **Surveiller le Tableau de Bord**

1. **Récapitulatif des Congés** :
   - Section "🏖️ Récapitulatif : Congés"
   - Affiche les employés 8 jours avant leurs congés
   - Compteur dans les statistiques générales

---

## 📧 Système d'Emails

### **Emails Automatiques**

#### **Pour les Employés**
1. **Confirmation de réception** :
   - Envoyé immédiatement après la demande
   - Confirme les détails de la demande

2. **Validation** :
   - Envoyé lors de l'approbation
   - Confirme les dates approuvées

#### **Pour les Administrateurs**
1. **Alerte de nouvelle demande** :
   - Envoyé à l'admin et/ou au magasin
   - Contient tous les détails de la demande
   - Lien direct vers la gestion

### **Configuration des Emails**

1. **Accéder aux paramètres** :
   - Menu "Paramètres" → Onglet "Templates Email"

2. **Templates disponibles** :
   - **🏖️ Confirmation Congés** : Email de réception
   - **🚨 Alerte Congés** : Notification admin
   - **✅ Validation Congés** : Confirmation d'approbation

3. **Personnalisation** :
   - Modifier le contenu HTML et texte
   - Utiliser les variables disponibles
   - Sauvegarder les modifications

---

## 🔧 Configuration Technique

### **Paramètres Requis**

#### **Emails d'Alerte**
- **Email du Magasin** : `arras@boulangerie-ange.fr`
- **Email de l'Administrateur** : `phimjc@boulangerie-ange.fr`
- **Destinataires** : Cocher admin et/ou magasin

#### **Templates Email**
- Initialiser les templates par défaut
- Personnaliser selon les besoins
- Tester les envois

### **Permissions**
- **Gestion des Congés** : Administrateurs uniquement
- **Demande de Congés** : Accessible à tous
- **Planning Annuel** : Administrateurs uniquement

---

## 📊 Base de Données

### **Collections MongoDB**

#### **vacationrequests**
- Toutes les demandes de congés
- Statuts : `pending`, `validated`, `rejected`
- Calcul automatique de la durée

#### **employees**
- Synchronisation des absences
- Type : `Congés payés`
- Mise à jour automatique du statut

#### **emailtemplates**
- Templates pour les emails de congés
- Variables personnalisables
- Gestion centralisée

---

## 🚨 Dépannage

### **Problèmes Courants**

#### **Email non reçu**
1. Vérifier la configuration EmailJS
2. Contrôler les paramètres d'alerte
3. Vérifier les templates email

#### **Demande non visible**
1. Vérifier les permissions utilisateur
2. Contrôler le statut de la demande
3. Rafraîchir la page

#### **Erreur de validation**
1. Vérifier les dates saisies
2. Contrôler la cohérence des données
3. Vérifier les logs du serveur

### **Logs et Debug**

#### **Frontend**
- Console du navigateur (F12)
- Vérifier les appels API
- Contrôler les erreurs JavaScript

#### **Backend**
- Logs Render.com
- Vérifier les routes API
- Contrôler la base de données

---

## 📈 Statistiques et Rapports

### **Tableau de Bord**
- Nombre total d'employés
- Employés en congés (8 jours)
- Demandes en attente
- Congés validés

### **Planning Annuel**
- Nombre de demandes validées
- Total des jours de congés
- Répartition par type
- Statistiques par employé

---

## 🔄 Maintenance

### **Tâches Régulières**
1. **Vérifier les demandes en attente**
2. **Valider les congés dans les délais**
3. **Mettre à jour les templates email**
4. **Nettoyer les anciennes demandes**

### **Sauvegarde**
- Base de données MongoDB
- Templates email personnalisés
- Configuration des paramètres

---

## 📞 Support

### **En cas de problème**
1. Vérifier ce guide
2. Consulter les logs
3. Contacter l'administrateur système

### **Améliorations**
- Suggestions d'amélioration
- Nouvelles fonctionnalités
- Optimisations

---

## 🎉 Conclusion

Le système de gestion des congés est maintenant opérationnel et permet une gestion complète des demandes de congés avec :

- ✅ **Demandes simplifiées** pour les employés
- ✅ **Gestion centralisée** pour les administrateurs
- ✅ **Planning visuel** pour la planification
- ✅ **Notifications automatiques** par email
- ✅ **Synchronisation** avec les dossiers employés

**Bonne utilisation du système !** 🏖️

