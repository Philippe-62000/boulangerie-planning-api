# Vérification : Facture péage stockée sur le NAS (Arras)

## Pourquoi le bouton "Télécharger facture" n'apparaît pas ?

Le bouton apparaît **uniquement** si :
1. La facture a été **importée via "Import PDF Bip&Go"** puis **"Appliquer l'import"**
2. Le fichier PDF a été **stocké sur le NAS** via SFTP
3. Le champ `tollPdfPath` est renseigné dans la base MongoDB

Si une de ces étapes échoue, le bouton reste masqué et vous voyez "📄 Facture : non stockée".

---

## Comment vérifier que la facture est bien sur le NAS ?

### 1. Tester la connexion SFTP (comme pour les arrêts maladie)

**Pour Arras** (API api-4-pbfy) :
```
GET https://boulangerie-planning-api-4-pbfy.onrender.com/api/responsable-km/test-sftp
```

Ou dans un navigateur :
- https://boulangerie-planning-api-4-pbfy.onrender.com/api/responsable-km/test-sftp

**Résultat attendu si tout est OK :**
```json
{
  "success": true,
  "message": "Connexion SFTP OK. Factures péage listées.",
  "config": { "basePath": "/n8n/uploads/documents", ... },
  "facturesArras": ["facture-2025-01.pdf", "facture-2025-02.pdf", ...],
  "facturesLonguenesse": [...]
}
```

**Si SFTP_PASSWORD n'est pas configuré :**
```json
{
  "success": false,
  "error": "SFTP_PASSWORD non configuré"
}
```

### 2. Vérifier les variables d'environnement sur Render (Arras)

Dans **Render** → Service **boulangerie-planning-api-4-pbfy** → **Environment** :

| Variable | Valeur attendue |
|----------|----------------|
| `SFTP_PASSWORD` | Mot de passe SFTP du NAS (obligatoire) |
| `NAS_BASE_PATH` ou `SFTP_BASE_PATH` | `/n8n/uploads/documents` (optionnel, c'est la valeur par défaut) |

**Sans `SFTP_PASSWORD`**, la facture ne sera jamais stockée sur le NAS (l'import des trajets fonctionne, mais pas le stockage du PDF).

### 3. Chemin des factures sur le NAS

Pour **Arras**, les factures sont stockées dans :
```
/n8n/uploads/documents/responsable-km/arras/facture-YYYY-MM.pdf
```
Exemple : `facture-2025-03.pdf` pour mars 2025.

### 4. Consulter les logs Render après un import

Après avoir cliqué sur "Appliquer l'import" avec un PDF :

- **Succès** : `✅ Facture péage stockée sur NAS: /n8n/uploads/documents/responsable-km/arras/facture-2025-03.pdf`
- **Erreur** : `⚠️ Erreur stockage facture NAS: [message d'erreur]`

---

## Comparaison avec les arrêts maladie

| Élément | Arrêts maladie | Factures péage |
|--------|----------------|----------------|
| Test SFTP | `/api/sick-leaves/test-sftp` | `/api/responsable-km/test-sftp` |
| Variable requise | `SFTP_PASSWORD` | `SFTP_PASSWORD` |
| Chemin NAS | `/volume1/sick-leaves/...` | `/n8n/uploads/documents/responsable-km/{site}/` |
| Stockage | À la déclaration | À la confirmation d'import PDF |

Si les arrêts maladie fonctionnent (upload + téléchargement), alors `SFTP_PASSWORD` est bien configuré. Le problème peut venir d'une erreur spécifique au chemin `responsable-km/arras/` (droits, dossier inexistant, etc.).

---

## Actions correctives

1. **Vérifier SFTP_PASSWORD** sur Render pour l'API Arras
2. **Ré-importer le PDF** : Import PDF Bip&Go → Réconciliation → **Appliquer l'import** (le fichier doit être renvoyé à cette étape)
3. **Consulter les logs** Render juste après l'import pour voir le message de succès ou d'erreur
4. **Tester** `/api/responsable-km/test-sftp` pour lister les factures déjà présentes sur le NAS
