# Chorus – Dossier NAS

Les bons de commande sont stockés dans un seul sous-dossier **`chorus/`** sous la racine déjà dédiée au site (variables **`NAS_BASE_PATH`** / **`SFTP_BASE_PATH`** sur Render).

## À créer manuellement sur le NAS

### Longuenesse

La racine est en général déjà :  
`/n8n/uploads/documents-longuenesse/`

Créez :

```text
/n8n/uploads/documents-longuenesse/chorus/
```

Pas de dossier supplémentaire `longuenesse` : vous êtes déjà dans l’arborescence Longuenesse.

### Arras (après activation du module)

Même principe sous la racine documents Arras, par ex. :

```text
{nas_base_arras}/chorus/
```

## Fichiers

Nom typique : `{idCommande}_{timestamp}_{nom_original}.pdf`

Chemin relatif enregistré en base, ex. : `chorus/674a..._1730..._bon.pdf`.

L’application peut créer `chorus/` au premier upload (SFTP `mkdir`) si besoin.

---

## Erreur 404 sur `/api/chorus/...` (Longuenesse)

Le frontend appelle `https://boulangerie-planning-api-3.onrender.com/api/chorus/...`.  
Un **404** signifie que **le service Render n’exécute pas encore le code** qui déclare ces routes.

1. Vérifier sur Render (service **api-3**) quelle **branche Git** est déployée (`longuenesse` ou `main`).
2. Si c’est `longuenesse`, **fusionner `main` dans `longuenesse`** et pousser, puis **redéployer** le service (ou attendre l’auto-deploy).
3. Vérifier les logs au démarrage : doit apparaître `Routes chorus montées (/api/chorus/*)`.
4. Tester : `GET https://boulangerie-planning-api-3.onrender.com/health` puis une route protégée avec token admin.

Sans redéploiement du **backend** contenant `routes/chorus.js` et `app.use('/api/chorus', ...)`, l’interface Chorus affichera une erreur même si le NAS est prêt.
