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
