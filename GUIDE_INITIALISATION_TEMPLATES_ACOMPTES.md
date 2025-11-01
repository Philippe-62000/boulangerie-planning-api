# ✅ Guide d'Initialisation des Templates Email pour les Demandes d'Acompte

## 🎯 Objectif

Les 4 templates d'email pour les demandes d'acompte sont maintenant intégrés directement dans le système (comme les autres templates). Ils seront stockés dans votre base de données et utilisent vos 2 templates EmailJS existants.

## 📋 Templates Disponibles

Les 4 templates suivants sont maintenant disponibles dans la page **Parameters** :

1. **💰 Email Confirmation - Demande d'Acompte**
   - Envoyé au salarié lors de la réception de sa demande
   - Nom interne : `advance_request_employee`

2. **🔔 Email d'Alerte - Nouvelle Demande d'Acompte**
   - Envoyé au manager lors d'une nouvelle demande
   - Nom interne : `advance_request_manager`

3. **✅ Email de Validation - Acompte Approuvé**
   - Envoyé au salarié lors de l'approbation
   - Nom interne : `advance_approved`

4. **❌ Email de Rejet - Acompte Refusé**
   - Envoyé au salarié lors du refus
   - Nom interne : `advance_rejected`

---

## 🚀 Initialisation des Templates

### Méthode 1 : Via l'Interface Web (Recommandé)

1. **Connectez-vous** à votre site en tant qu'**administrateur**
2. Allez dans la page **Paramètres** (`/parameters`)
3. Cliquez sur l'onglet **"Templates disponibles"**
4. Cliquez sur le bouton **"🔄 Mettre à jour les templates"** ou **"Initialiser les templates par défaut"**
5. Les 4 nouveaux templates seront créés automatiquement dans votre base de données

### Méthode 2 : Via l'API (Alternative)

Si vous préférez utiliser l'API directement, vous pouvez appeler :

```bash
POST https://boulangerie-planning-api-4-pbfy.onrender.com/api/email-templates/initialize-defaults
```

---

## ✏️ Modification des Templates

Une fois les templates créés, vous pouvez les modifier comme tous les autres templates :

1. Allez dans **Paramètres** → **Templates disponibles**
2. Sélectionnez un template dans la liste déroulante
3. Modifiez le sujet, le contenu HTML et/ou le contenu texte
4. Cliquez sur **"Enregistrer"**

### Variables Disponibles

Chaque template utilise des variables que vous pouvez personnaliser :

#### Template Confirmation Salarié (`advance_request_employee`)
- `{{to_name}}` - Nom du salarié
- `{{amount}}` - Montant demandé
- `{{deduction_month}}` - Mois de déduction
- `{{request_date}}` - Date de la demande
- `{{dashboard_url}}` - URL du tableau de bord

#### Template Notification Manager (`advance_request_manager`)
- `{{to_name}}` - Nom du manager
- `{{employee_name}}` - Nom du salarié
- `{{amount}}` - Montant demandé
- `{{deduction_month}}` - Mois de déduction
- `{{comment}}` - Commentaire du salarié
- `{{request_date}}` - Date de la demande
- `{{admin_url}}` - URL de l'interface admin

#### Template Acompte Approuvé (`advance_approved`)
- `{{to_name}}` - Nom du salarié
- `{{amount}}` - Montant approuvé
- `{{deduction_month}}` - Mois de déduction
- `{{manager_comment}}` - Commentaire du manager
- `{{approval_date}}` - Date d'approbation
- `{{dashboard_url}}` - URL du tableau de bord

#### Template Acompte Rejeté (`advance_rejected`)
- `{{to_name}}` - Nom du salarié
- `{{amount}}` - Montant demandé
- `{{deduction_month}}` - Mois de déduction
- `{{manager_comment}}` - Raison du rejet
- `{{rejection_date}}` - Date de refus
- `{{dashboard_url}}` - URL du tableau de bord

---

## 🔄 Fonctionnement

Les emails sont envoyés via EmailJS en utilisant vos 2 templates existants :
- `template_sick_leave` - Pour les emails textuels simples
- `template_password` - Pour les emails HTML formatés

**Note :** Le système utilise maintenant vos templates stockés dans la base de données pour générer le contenu HTML et texte, puis les envoie via EmailJS. Vous n'avez plus besoin de créer 4 templates supplémentaires dans EmailJS !

---

## ✅ Checklist

- [ ] Initialiser les templates via l'interface web ou l'API
- [ ] Vérifier que les 4 templates apparaissent dans la liste
- [ ] Personnaliser les templates si nécessaire
- [ ] Tester l'envoi d'une demande d'acompte
- [ ] Vérifier la réception des emails

---

## 🧪 Test

Pour tester le système :

1. **Créer une demande d'acompte** depuis le dashboard salarié
2. **Vérifier** que le salarié reçoit l'email de confirmation
3. **Vérifier** que le manager reçoit l'email de notification
4. **Approuver ou rejeter** la demande
5. **Vérifier** que le salarié reçoit l'email correspondant

---

## 🐛 Dépannage

### Les templates n'apparaissent pas

- Assurez-vous d'avoir initialisé les templates via l'interface ou l'API
- Vérifiez les logs du serveur pour voir les erreurs éventuelles

### Les emails ne sont pas envoyés

- Vérifiez que vos templates EmailJS (`template_sick_leave` et `template_password`) sont bien configurés
- Vérifiez que les variables EmailJS sont correctement configurées
- Consultez les logs Render pour voir les erreurs détaillées

### Les variables ne sont pas remplacées

- Vérifiez que vous utilisez la syntaxe `{{variable}}` dans vos templates
- Assurez-vous que les noms de variables correspondent exactement (case-sensitive)

---

## 📚 Documentation

Pour plus d'informations sur la gestion des templates, consultez :
- La section "Templates disponibles" dans la page Paramètres
- Les autres templates existants pour voir des exemples

---

**Félicitations !** 🎉 Vos templates d'acompte sont maintenant intégrés au système, exactement comme les templates d'arrêt maladie et de congés !
