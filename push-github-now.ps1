# Script pour pousser vers GitHub
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   PUSH VERS GITHUB - CORRECTIONS SFTP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔍 Vérification du statut Git..." -ForegroundColor Yellow
git status

Write-Host ""
Write-Host "📦 Ajout de tous les fichiers modifiés..." -ForegroundColor Yellow
git add -A

Write-Host ""
Write-Host "💾 Commit des corrections SFTP..." -ForegroundColor Yellow
git commit -m "🔧 FIX SFTP: Gestion connexions concurrentes + MaxListeners + Retry automatique + Réinitialisation client"

Write-Host ""
Write-Host "🚀 Push vers GitHub..." -ForegroundColor Yellow
git push origin main

Write-Host ""
Write-Host "✅ Push terminé !" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Prochaines étapes :" -ForegroundColor Cyan
Write-Host "1. Allez sur https://dashboard.render.com" -ForegroundColor White
Write-Host "2. Sélectionnez 'boulangerie-planning-api-4'" -ForegroundColor White
Write-Host "3. Cliquez sur 'Manual Deploy' > 'Deploy latest commit'" -ForegroundColor White
Write-Host "4. Attendez 2-5 minutes que le déploiement se termine" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Le service devrait se redéployer automatiquement" -ForegroundColor Green
Write-Host ""
