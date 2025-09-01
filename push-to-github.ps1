# Script PowerShell pour pousser vers GitHub
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PUSH VERS GITHUB - PLANNING BOULANGERIE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$REPO_URL = "https://github.com/votre-username/boulangerie-planning.git"
$BRANCH = "main"

Write-Host "[1/6] Initialisation Git..." -ForegroundColor Yellow
try {
    git init
    Write-Host "✅ Git initialisé" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors de l'initialisation Git" -ForegroundColor Red
    Read-Host "Appuyez sur Entrée pour continuer"
    exit 1
}

Write-Host "[2/6] Ajout du remote GitHub..." -ForegroundColor Yellow
try {
    git remote add origin $REPO_URL
    Write-Host "✅ Remote ajouté" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Remote déjà configuré ou erreur" -ForegroundColor Yellow
}

Write-Host "[3/6] Ajout des fichiers modifiés..." -ForegroundColor Yellow
$files = @(
    "deploy/www/config.js",
    "deploy/www/index.html", 
    "deploy/www/.htaccess",
    "deploy/www/api-proxy.php",
    "deploy/www/plan/api-proxy.php",
    "deploy/www/plan/test-proxy.html",
    "deploy/www/asset-manifest.json",
    "deploy/www/static/"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        git add $file
        Write-Host "✅ Ajouté: $file" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Fichier non trouvé: $file" -ForegroundColor Yellow
    }
}

Write-Host "[4/6] Commit des modifications..." -ForegroundColor Yellow
$commitMessage = @"
🔧 Fix: Configuration proxy API et React Router pour déploiement OVH

- Ajout proxy PHP pour redirection API vers Render
- Configuration API_URL vers /api dans config.js
- Correction React Router pour sous-dossier /plan/
- Suppression référence favicon manquant
- Ajout pages de test proxy
- Configuration .htaccess pour proxy et React Router
"@

try {
    git commit -m $commitMessage
    Write-Host "✅ Commit créé" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors du commit" -ForegroundColor Red
    Read-Host "Appuyez sur Entrée pour continuer"
    exit 1
}

Write-Host "[5/6] Push vers GitHub..." -ForegroundColor Yellow
try {
    git push -u origin $BRANCH
    Write-Host "✅ Push réussi sur $BRANCH" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Tentative avec la branche master..." -ForegroundColor Yellow
    try {
        git push -u origin master
        Write-Host "✅ Push réussi sur master" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erreur lors du push" -ForegroundColor Red
        Write-Host ""
        Write-Host "🔧 Solutions possibles :" -ForegroundColor Cyan
        Write-Host "1. Vérifiez l'URL du repository GitHub" -ForegroundColor White
        Write-Host "2. Vérifiez vos credentials Git" -ForegroundColor White
        Write-Host "3. Créez le repository sur GitHub si nécessaire" -ForegroundColor White
        Read-Host "Appuyez sur Entrée pour continuer"
        exit 1
    }
}

Write-Host ""
Write-Host "✅ SUCCÈS ! Fichiers poussés vers GitHub" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Prochaines étapes :" -ForegroundColor Cyan
Write-Host "1. Vérifiez le repository GitHub" -ForegroundColor White
Write-Host "2. Uploadez les fichiers sur OVH" -ForegroundColor White
Write-Host "3. Testez l'application" -ForegroundColor White
Write-Host ""
Read-Host "Appuyez sur Entrée pour continuer"
