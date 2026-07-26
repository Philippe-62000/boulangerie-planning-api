# Agent d'impression des commandes entreprises (caisses Crisalid)

Imprime automatiquement un ticket sur l'imprimante AURES ODP 333 de la caisse
à chaque **nouvelle commande entreprise** et à chaque **demande d'annulation ou
de modification** d'un client. Le ticket contient le détail complet de la
commande : l'impression sert à la fois d'alerte sonore et de bon de commande.

## Fonctionnement

- Un script (`print-agent.ps1`) tourne en arrière-plan sur la caisse et
  interroge l'API Render toutes les 60 secondes.
- Le backend renvoie les tickets pas encore imprimés (endpoint
  `/api/partner-orders/print-queue`, protégé par la clé `PRINT_AGENT_KEY`).
- Après impression, l'agent confirme au serveur (`/print-queue/ack`) : un
  ticket ne sort jamais deux fois, même si la caisse redémarre.
- Sécurité anti-rafale : seules les commandes de moins de 72 h sont imprimées,
  10 tickets maximum par cycle.

## Prérequis (une seule fois, côté serveur)

1. Déployer le backend contenant la file d'impression (dossier `backend/`).
2. Sur Render, pour **chaque** service API :
   - `boulangerie-planning-api-4-pbfy` (Arras)
   - `boulangerie-planning-api-3` (Longuenesse)

   ajouter la variable d'environnement `PRINT_AGENT_KEY` avec une valeur
   secrète (longue chaîne aléatoire, différente ou identique entre les deux
   sites, au choix), puis redéployer.

## Installation sur une caisse

1. Copier tout le dossier `caisse-imprimante-tickets` sur la caisse
   (par exemple avec une clé USB) vers un dossier local, ex. `C:\filmara-tickets`.
2. Dans ce dossier, copier le bon fichier de config vers `config.json` :
   - caisse d'**Arras** : copier `config.arras.json` → `config.json`
   - caisse de **Longuenesse** : copier `config.longuenesse.json` → `config.json`
3. Ouvrir `config.json` avec le Bloc-notes et remplacer `METTRE_LA_CLE_ICI`
   par la valeur de `PRINT_AGENT_KEY` mise sur Render.
4. Le nom d'imprimante est préréglé sur « Archange Printer » (nom du pilote
   de l'ODP 333 sur les caisses Crisalid). Si besoin, vérifier le nom exact
   dans Windows (Paramètres → Imprimantes et scanners) et l'ajuster dans
   `config.json` (`printerName`). Astuce : laisser `printerName` vide (`""`)
   pour utiliser automatiquement l'imprimante par défaut de Windows.
5. Double-cliquer `test-impression.bat` : un ticket de test doit sortir.
   - Si rien ne sort, ouvrir `print-agent.log` : en cas de mauvais nom
     d'imprimante, le journal liste les noms disponibles.
6. Double-cliquer `installer.bat` : l'agent démarre immédiatement et se
   relancera automatiquement à chaque démarrage de Windows.

## Fichiers

| Fichier | Rôle |
|---|---|
| `print-agent.ps1` | Le script agent (polling + impression ESC/POS) |
| `config.arras.json` / `config.longuenesse.json` | Modèles de configuration par site |
| `config.json` | Configuration active de la caisse (à créer, voir ci-dessus) |
| `installer.bat` | Installe le démarrage automatique et lance l'agent |
| `test-impression.bat` | Imprime un ticket de test |
| `arreter.bat` | Arrête l'agent en cours d'exécution |
| `print-agent.log` | Journal (erreurs réseau, impressions, etc.) |

## Dépannage

- **Rien ne s'imprime, log « impression impossible »** : le `printerName` de
  `config.json` ne correspond pas au nom Windows de l'imprimante ; le journal
  liste les imprimantes disponibles.
- **Log « Clé agent impression invalide »** : la clé `printKey` de
  `config.json` ne correspond pas à `PRINT_AGENT_KEY` sur Render.
- **Erreurs réseau ponctuelles** : normales (serveur Render en veille) ;
  l'agent réessaie au cycle suivant, rien n'est perdu.
- **Ticket en double** : possible uniquement si la confirmation au serveur
  échoue juste après une impression réussie (très rare) ; sans gravité.
