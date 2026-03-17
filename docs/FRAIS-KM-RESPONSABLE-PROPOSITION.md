# 🚗 Frais KM Responsable - Proposition de solution

## Contexte

- **Facture Bip&Go** : relevé détaillé avec dates (ex: 22 trajets déc. 2025, 45,82 €)
- **Excel actuel** : types de déplacements (Boulangerie L 96 km, Lidl 1.8 km, etc.) + tableau mensuel par jour
- **Objectif** : automatiser au maximum, séparer Longuenesse et Arras

---

## Architecture proposée

### Phase 1 – Longuenesse (MVP)

#### 1. Nouveau menu "Frais KM Responsable"
- Accessible uniquement aux responsables/admin
- Onglets ou pages séparées : **Longuenesse** | **Arras**
- URL : `/lon/frais-km-responsable` et `/plan/frais-km-responsable`

#### 2. Types de déplacements (paramètres)
Déplacements prédéfinis avec km (extraits de votre Excel) :

| Déplacement | Km | Fréquent ? |
|-------------|-----|-------------|
| Boulangerie L | 96 | Souvent (aléatoire) |
| Boulangerie L via Promocash | 104.3 | Souvent |
| TGT Cash | 11.4 | Souvent |
| CA Saint Omer | 6 | Souvent |
| Lidl L | 1.8 | Souvent |
| Auchan L | 5.2 | Souvent |
| Laverie Saint Omer | 7.2 | Souvent |
| Ville de Longuenesse | 2.6 | Souvent |
| Entrepot Lidl Tournée | 26 | Souvent |
| Métro Calais/Boulogne | 87 ou 93.8 | Souvent |
| Divers | variable | Non |

*Pas de jour fixe – vous allez quand c’est nécessaire. L’agenda sert à noter les dates au fur et à mesure.*

#### 3. Tableau mensuel
- **Lignes** : types de déplacements
- **Colonnes** : jours du mois (1 à 31)
- **Cellules** : case à cocher (✓) = "je suis allé ce jour-là"
- **Calcul** : nb de ✓ × km du type = total par ligne, puis total général

#### 4. Import PDF Bip&Go
- Upload du PDF facture
- Extraction des dates (ex: 01/12, 02/12, 03/12…)
- Pré-remplissage automatique d’une ligne "Péage autoroute" avec ces dates cochées
- Montant TTC à saisir manuellement (ex: 45,82 €)

#### 5. Péage
- Champ **Péage TTC** (montant facture)
- Champ **Péage HT** (calculé ou saisi)
- Affiché dans le récapitulatif mensuel

#### 6. Taux km paramétrable
- Le taux €/km change **chaque année** (ex: 0,47 € en 2025, 0,52 € en 2026)
- Paramètre par **site** et par **année** : `tauxKmLonguenesse2025`, `tauxKmLonguenesse2026`, etc.
- Ou plus simple : un paramètre par site avec année, modifiable dans Paramètres
- Interface : "Taux km Longuenesse 2025 : 0,47 €" (éditable)

---

### Phase 2 – Intégration Google Agenda

#### Recommandation : 2 agendas séparés dans le même Gmail

**À créer dans votre compte Google Calendar :**

1. **Agenda "Longuenesse"** (ou "Frais KM Longuenesse")
   - Pour tous les déplacements Longuenesse
   - Événements : "Tournée", "Lidl", "Boulangerie", "Promocash", etc.

2. **Agenda "Arras"** (ou "Frais KM Arras")
   - Pour tous les déplacements Arras
   - Même principe

**Pourquoi 2 agendas ?**
- Séparation claire Longuenesse / Arras
- L’app sait quel agenda lire selon le site
- Vous pouvez masquer/afficher chaque agenda dans Google Calendar
- Pas de mélange avec votre agenda personnel

#### Ce qu’il faudra paramétrer dans l’app

| Paramètre | Description | Où le trouver |
|-----------|-------------|---------------|
| **Calendar ID Longuenesse** | Identifiant de l’agenda Longuenesse | Google Calendar → Paramètres de l’agenda → "Intégrer l’agenda" → ID (ex: `xxx@group.calendar.google.com`) |
| **Calendar ID Arras** | Identifiant de l’agenda Arras | Idem |
| **Mapping événements → types** | "Tournée" → Boulangerie L, "Lidl" → Lidl L, etc. | À configurer dans Paramètres de l’app |

#### Comment créer les agendas

1. Ouvrir [Google Calendar](https://calendar.google.com)
2. À gauche : "Mes agendas" → "+" → "Créer un agenda"
3. Nom : **"Frais KM Longuenesse"**
4. Répéter pour **"Frais KM Arras"**

#### Comment utiliser l’agenda (pas de récurrence fixe)

Vos déplacements sont **aléatoires** (pas tous les lundis, pas de rythme fixe) mais vous allez souvent aux mêmes endroits (Boulangerie, Lidl, Promocash…).

**Utilisation :** quand vous faites un déplacement, vous ajoutez un événement dans l’agenda ce jour-là :
- Ex. : le 3 décembre vous allez à Lidl → créer un événement **"Lidl"** le 3 décembre
- Ex. : le 5 décembre vous faites la tournée → créer un événement **"Tournée"** le 5 décembre

En fin de mois, l’app lit l’agenda, trouve les événements "Lidl", "Tournée", "Boulangerie", etc., et **propose automatiquement de cocher** les dates correspondantes dans le tableau.

Pas besoin de récurrence : vous saisissez au fur et à mesure (ou en rattrapage) les jours où vous êtes allé quelque part.

#### Connexion OAuth

- Vous devrez autoriser l’app une fois (bouton "Connecter Google Calendar")
- L’app pourra ensuite lire vos agendas Longuenesse et Arras
- Les identifiants restent stockés de manière sécurisée

---

## Modèle de données proposé

```javascript
// Paramètre : Taux km par site et année (dans Parameters ou table dédiée)
{
  name: 'tauxKmLonguenesse',
  year: 2025,
  kmValue: 0.47  // €/km
}

// ResponsableKmExpense (nouveau modèle)
{
  site: 'longuenesse' | 'arras',
  month: 12,
  year: 2025,
  responsibleEmployeeId: ObjectId,
  tripEntries: [
    { tripTypeId: ObjectId, date: 15, count: 1 },  // 15 déc, 1 passage
    { tripTypeId: ObjectId, date: 16, count: 2 }   // 16 déc, 2 passages
  ],
  tollAmountTTC: 45.82,
  tollAmountHT: 38.18,
  pdfImportedDates: [1, 2, 3, 5, 10, 11, 17, 18, 22, 28, 30],  // jours avec péage
  createdAt, updatedAt
}

// TripType (nouveau modèle ou paramètres)
{
  name: 'Boulangerie L',
  km: 96,
  site: 'longuenesse' | 'arras' | 'both',
  isRecurring: true
}
```

---

## Plan d’implémentation

### Étape 1 (2–3 jours)
- [ ] Paramètre **taux km** par site et année (dans Parameters ou modèle dédié)
- [ ] Modèle `ResponsableTripType` (types de déplacements par site)
- [ ] Modèle `ResponsableKmExpense` (frais mensuels responsable)
- [ ] API backend : CRUD types, CRUD frais, import PDF
- [ ] Extraction PDF : parser le relevé Bip&Go (dates + montant)

### Étape 2 (2–3 jours)
- [ ] Page "Frais KM Responsable" (Longuenesse)
- [ ] Tableau mensuel avec cases à cocher
- [ ] Upload PDF + pré-remplissage des dates
- [ ] Champs Péage TTC / HT
- [ ] Calcul des totaux (km × taux + péage)

### Étape 3 (1 jour)
- [ ] Dupliquer pour Arras
- [ ] Menu + permissions (responsable uniquement)

### Étape 4 (optionnel, plus tard)
- [ ] Intégration Google Calendar (OAuth)
- [ ] Paramètres : Calendar ID Longuenesse, Calendar ID Arras
- [ ] Paramètres : mapping "Tournée" → Boulangerie L, "Lidl" → Lidl L, etc.
- [ ] Lecture des événements du mois et proposition des dates à cocher

---

## Extraction PDF Bip&Go

Le PDF contient un tableau structuré :
```
Date | Entrée | Sortie | Tarif TTC | Km
01/12/2025 | BETHUNE | AIRE SUR LA LYS | 2,80 | ...
```

**Stratégie** : utiliser `pdf-parse` (déjà installé) pour extraire le texte, puis regex pour :
1. Détecter les lignes de dates (format JJ/MM/AAAA)
2. Extraire les dates uniques
3. Récupérer le total TTC (ex: "45,82 €")

---

## Questions à valider

1. ~~**Taux km**~~ : **Paramétrable** par site et par année (ex: Longuenesse 2025 = 0,47 €)
2. **Péage** : à ajouter en plus des km, ou déjà inclus dans un forfait ?
3. **Responsable** : un seul compte "responsable" par site, ou plusieurs personnes peuvent saisir ?
4. **Google Calendar** : 2 agendas séparés (Longuenesse + Arras) dans le même Gmail – voir section Phase 2

---

## Fichiers à créer/modifier

| Fichier | Action |
|---------|--------|
| `backend/models/ResponsableTripType.js` | Créer |
| `backend/models/ResponsableKmExpense.js` | Créer |
| `backend/controllers/responsableKmController.js` | Créer |
| `backend/routes/responsableKm.js` | Créer |
| `backend/services/bipGoPdfParser.js` | Créer (extraction PDF) |
| `frontend/src/pages/ResponsableKmExpenses.js` | Créer |
| `frontend/src/App.js` | Ajouter route |
| `frontend/src/components/Sidebar.js` | Ajouter menu (responsable) |
