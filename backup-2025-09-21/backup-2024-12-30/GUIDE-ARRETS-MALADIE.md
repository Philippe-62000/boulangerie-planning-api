# 🏥 Guide d'Utilisation - Système de Gestion des Arrêts Maladie

## 📋 Vue d'ensemble

Le système de gestion des arrêts maladie permet aux employés de déposer leurs arrêts maladie et aux administrateurs de les valider ou rejeter. Il inclut également la synchronisation automatique avec les dossiers employés et des notifications par email.

---

## 🎯 Fonctionnalités Principales

### 1. **Dépôt d'Arrêts Maladie par les Employés**
- Formulaire standalone accessible sans connexion
- Upload de documents (PDF, images)
- Validation automatique des dates
- Confirmation par email

### 2. **Gestion Administrative**
- Validation ou rejet des arrêts
- Modification des dates avant validation
- Synchronisation automatique avec les dossiers employés
- Notifications par email (admin, magasin, comptable)

### 3. **Suivi et Monitoring**
- Tableau de bord avec récapitulatif
- Filtrage des arrêts (8 jours après reprise)
- Statistiques en temps réel
- Historique complet

### 4. **Intégration Comptable**
- Envoi automatique au comptable
- Lien de téléchargement sécurisé
- Informations détaillées pour la paie

---

## 🚀 Guide d'Utilisation

### **Pour les Employés**

#### **Déposer un Arrêt Maladie**

1. **Accéder au formulaire** :
   - URL : `https://www.filmara.fr/sick-leave-standalone.html`
   - Ou via le menu "Gestion des Arrêts Maladie" → "Déposer un Arrêt"

2. **Remplir le formulaire** :
   - **Nom complet** : Sélectionner dans la liste déroulante
   - **Email** : Saisir votre adresse email
   - **Date de début** : Date de début de l'arrêt
   - **Date de fin** : Date de fin de l'arrêt
   - **Document** : Uploader le fichier (PDF, JPG, PNG)

3. **Valider le dépôt** :
   - Cliquer sur "📤 Envoyer l'arrêt maladie"
   - Recevoir une confirmation par email
   - Attendre la validation administrative

#### **Types de Documents Acceptés**
- **PDF** : Documents scannés ou numérisés
- **JPG/JPEG** : Photos de documents
- **PNG** : Images de documents
- **Taille maximale** : 10 MB

#### **Informations Importantes**
- Les dates sont inclusives
- L'employé sera automatiquement marqué comme indisponible
- Le planning sera mis à jour en conséquence
- Possibilité de modifier les dates avant validation

---

### **Pour les Administrateurs**

#### **Gérer les Arrêts Maladie**

1. **Accéder à la gestion** :
   - Menu "Gestion des Arrêts Maladie"
   - Ou URL : `https://www.filmara.fr/plan/sick-leave-management`

2. **Actions disponibles** :
   - **✅ Valider** : Approuver l'arrêt maladie
   - **✏️ Modifier** : Changer les dates avant validation
   - **❌ Rejeter** : Refuser avec une raison
   - **📥 Télécharger** : Récupérer le document

3. **Filtres** :
   - Tous les arrêts
   - En attente
   - Validés
   - Rejetés

#### **Processus de Validation**

1. **Examiner l'arrêt** :
   - Vérifier les dates
   - Contrôler le document
   - Valider la cohérence

2. **Actions possibles** :
   - **Valider** : L'arrêt est approuvé
     - Email de confirmation à l'employé
     - Email au comptable avec document
     - Synchronisation avec le dossier employé
   - **Modifier** : Ajuster les dates si nécessaire
   - **Rejeter** : Refuser avec une raison précise

#### **Surveiller le Tableau de Bord**

1. **Récapitulatif des Arrêts** :
   - Section "🏥 Récapitulatif : Arrêts maladie"
   - Affiche les employés en arrêt (max 8 jours après reprise)
   - Compteur dans les statistiques générales

2. **Informations affichées** :
   - Nom de l'employé
   - Date de reprise
   - Jours avant reprise
   - Statut de l'arrêt

---

## 📧 Système d'Emails

### **Emails Automatiques**

#### **Pour les Employés**
1. **Confirmation de réception** :
   - Envoyé immédiatement après le dépôt
   - Confirme les détails de l'arrêt

2. **Validation** :
   - Envoyé lors de l'approbation
   - Confirme les dates validées

3. **Rejet** :
   - Envoyé en cas de refus
   - Contient la raison du rejet

#### **Pour les Administrateurs**
1. **Alerte de nouvel arrêt** :
   - Envoyé à l'admin et/ou au magasin
   - Contient tous les détails de l'arrêt
   - Lien direct vers la gestion

#### **Pour le Comptable**
1. **Notification de validation** :
   - Envoyé automatiquement lors de la validation
   - Contient les informations de paie
   - Lien de téléchargement sécurisé du document

### **Configuration des Emails**

1. **Accéder aux paramètres** :
   - Menu "Paramètres" → Onglet "Templates Email"

2. **Templates disponibles** :
   - **🚨 Alerte** : Notification admin/magasin
   - **✅ Validation** : Confirmation employé
   - **❌ Rejet** : Notification de refus
   - **📋 Comptable** : Information comptable

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
- **Email du Comptable** : Configuré dans les paramètres
- **Destinataires** : Cocher admin et/ou magasin

#### **Templates Email**
- Initialiser les templates par défaut
- Personnaliser selon les besoins
- Tester les envois

### **Permissions**
- **Gestion des Arrêts** : Administrateurs uniquement
- **Dépôt d'Arrêts** : Accessible à tous
- **Téléchargement** : Administrateurs uniquement

---

## 📊 Base de Données

### **Collections MongoDB**

#### **sickleaves**
- Tous les arrêts maladie déposés
- Statuts : `pending`, `validated`, `rejected`
- Documents stockés sécurisés
- Métadonnées complètes

#### **employees**
- Synchronisation des absences
- Type : `Arrêt maladie`
- Mise à jour automatique du statut
- Dates de début/fin

#### **emailtemplates**
- Templates pour les emails d'arrêts
- Variables personnalisables
- Gestion centralisée

---

## 🚨 Dépannage

### **Problèmes Courants**

#### **Email non reçu**
1. Vérifier la configuration EmailJS
2. Contrôler les paramètres d'alerte
3. Vérifier les templates email
4. Vérifier les logs du serveur

#### **Document non uploadé**
1. Vérifier la taille du fichier (max 10 MB)
2. Contrôler le format (PDF, JPG, PNG)
3. Vérifier la connexion internet
4. Réessayer l'upload

#### **Arrêt non visible**
1. Vérifier les permissions utilisateur
2. Contrôler le statut de l'arrêt
3. Vérifier les filtres appliqués
4. Rafraîchir la page

#### **Erreur de validation**
1. Vérifier les dates saisies
2. Contrôler la cohérence des données
3. Vérifier les logs du serveur
4. Vérifier la configuration EmailJS

### **Logs et Debug**

#### **Frontend**
- Console du navigateur (F12)
- Vérifier les appels API
- Contrôler les erreurs JavaScript
- Vérifier les uploads de fichiers

#### **Backend**
- Logs Render.com
- Vérifier les routes API
- Contrôler la base de données
- Vérifier les envois d'emails

---

## 📈 Statistiques et Rapports

### **Tableau de Bord**
- Nombre total d'employés
- Employés en arrêt maladie
- Arrêts en attente de validation
- Arrêts validés ce mois

### **Gestion des Arrêts**
- Statistiques par période
- Répartition par statut
- Temps de traitement moyen
- Taux de validation

### **État des Absences**
- Vue d'ensemble des absences
- Filtrage par type et période
- Statistiques détaillées
- Export possible

---

## 🔄 Maintenance

### **Tâches Régulières**
1. **Vérifier les arrêts en attente**
2. **Valider les arrêts dans les délais**
3. **Nettoyer les anciens documents**
4. **Mettre à jour les templates email**
5. **Vérifier la synchronisation employés**

### **Sauvegarde**
- Base de données MongoDB
- Documents d'arrêts maladie
- Templates email personnalisés
- Configuration des paramètres

### **Nettoyage**
- Supprimer les anciens arrêts rejetés
- Archiver les documents validés
- Nettoyer les logs anciens

---

## 🔒 Sécurité

### **Protection des Données**
- Documents stockés de manière sécurisée
- Accès restreint aux administrateurs
- Chiffrement des communications
- Sauvegarde régulière

### **Conformité RGPD**
- Données personnelles protégées
- Accès limité aux personnes autorisées
- Droit à l'effacement respecté
- Traçabilité des actions

---

## 📞 Support

### **En cas de problème**
1. Vérifier ce guide
2. Consulter les logs
3. Contacter l'administrateur système
4. Vérifier la configuration EmailJS

### **Améliorations**
- Suggestions d'amélioration
- Nouvelles fonctionnalités
- Optimisations de performance
- Amélioration de l'interface

---

## 🎉 Conclusion

Le système de gestion des arrêts maladie est maintenant opérationnel et permet une gestion complète des arrêts avec :

- ✅ **Dépôt simplifié** pour les employés
- ✅ **Gestion centralisée** pour les administrateurs
- ✅ **Notifications automatiques** par email
- ✅ **Synchronisation** avec les dossiers employés
- ✅ **Intégration comptable** complète
- ✅ **Suivi et monitoring** en temps réel

**Bonne utilisation du système !** 🏥

