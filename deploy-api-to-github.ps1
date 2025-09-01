# Script PowerShell pour deploiement automatique vers GitHub
Write-Host "Deploiement automatique vers GitHub" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

# Verifier si Git est installe
try {
    git --version | Out-Null
    Write-Host "Git detecte" -ForegroundColor Green
} catch {
    Write-Host "Git n'est pas installe. Installez Git d'abord." -ForegroundColor Red
    Read-Host "Appuyez sur Entree pour quitter"
    exit 1
}

# Creer le dossier temporaire pour l'API
Write-Host "Creation du dossier temporaire..." -ForegroundColor Yellow
$tempDir = "boulangerie-api-temp"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Name $tempDir | Out-Null
Set-Location $tempDir

# Copier tous les fichiers de l'API
Write-Host "Copie des fichiers..." -ForegroundColor Yellow
Copy-Item "..\deploy\api\*" "." -Recurse -Force

# Initialiser Git
Write-Host "Initialisation Git..." -ForegroundColor Yellow
git init
git add .
git commit -m "Initial commit - API Boulangerie Planning"

# Demander l'URL du repository GitHub
Write-Host ""
Write-Host "Entrez l'URL de votre repository GitHub:" -ForegroundColor Cyan
Write-Host "   (ex: https://github.com/votre-username/boulangerie-api.git)" -ForegroundColor Gray
$githubUrl = Read-Host "URL"

# Ajouter le remote et pousser
Write-Host "Push vers GitHub..." -ForegroundColor Yellow
git branch -M main
git remote add origin $githubUrl
git push -u origin main

# Nettoyer
Write-Host "Nettoyage..." -ForegroundColor Yellow
Set-Location ..
Remove-Item $tempDir -Recurse -Force

Write-Host ""
Write-Host "Deploiement termine !" -ForegroundColor Green
Write-Host "Prochaines etapes:" -ForegroundColor Cyan
Write-Host "   1. Allez sur https://render.com" -ForegroundColor White
Write-Host "   2. Connectez votre compte GitHub" -ForegroundColor White
Write-Host "   3. Selectionnez le repository boulangerie-api" -ForegroundColor White
Write-Host "   4. Configurez les variables d'environnement" -ForegroundColor White
Write-Host ""
Read-Host "Appuyez sur Entree pour continuer"
