@echo off
echo ========================================
echo   DEPLOYMENT FRONTEND LONGUENESSE VERS OVH
echo ========================================
echo.

echo 1. Construction du frontend avec Vite pour /lon...
cd frontend
set VITE_API_URL=https://boulangerie-planning-api-3.onrender.com/api
set VITE_PARTNER_API_URL=https://commande-longuenesse.vercel.app
set VITE_CAMARIS_PUBLIC_URL=https://camaris-longuenesse.vercel.app
call npm run build -- --base=/lon/
if %errorlevel% neq 0 (
    echo ERREUR: Echec de la construction du frontend
    exit /b 1
)
cd ..

echo.
echo 2. Copie des fichiers vers le dossier de déploiement...
if not exist "deploy-frontend-lon" mkdir "deploy-frontend-lon"

echo    - Synchronisation complete (supprime les anciens JS/CSS orphelins)...
robocopy "frontend\build" "deploy-frontend-lon" /MIR /NFL /NDL /NJH /NJS /R:2 /W:2
if %errorlevel% GEQ 8 (
    echo ERREUR: Echec robocopy vers deploy-frontend-lon
    exit /b 1
)

echo    - Création du .htaccess pour /lon/...
echo RewriteEngine On > deploy-frontend-lon\.htaccess
echo RewriteBase /lon/ >> deploy-frontend-lon\.htaccess
echo RewriteCond %%{REQUEST_FILENAME} !-f >> deploy-frontend-lon\.htaccess
echo RewriteCond %%{REQUEST_FILENAME} !-d >> deploy-frontend-lon\.htaccess
echo RewriteRule . /lon/index.html [L] >> deploy-frontend-lon\.htaccess

echo    - Remplacement des URLs API et chemins /plan/ vers /lon/ dans les fichiers HTML...
echo    (Remplacement de api-4-pbfy vers api-3 et /plan/ vers /lon/)
powershell -Command "$files = Get-ChildItem 'deploy-frontend-lon' -Filter '*.html' -Recurse; foreach($file in $files) { $content = Get-Content $file.FullName -Raw -Encoding UTF8; $content = $content -replace 'boulangerie-planning-api-4-pbfy', 'boulangerie-planning-api-3'; $content = $content -replace '/plan/salarie-connexion.html', '/lon/salarie-connexion.html'; $content = $content -replace '/plan/employee-dashboard.html', '/lon/employee-dashboard.html'; $content = $content -replace '/plan/sick-leave', '/lon/sick-leave'; $content = $content -replace '/plan/vacation-request', '/lon/vacation-request'; $content = $content -replace '/plan/manifest.json', '/lon/manifest.json'; $content = $content -replace 'https://www.filmara.fr/plan/', 'https://www.filmara.fr/lon/'; $content = $content -replace 'href=\"/plan/', 'href=\"/lon/'; $content = $content -replace 'src=\"/plan/', 'src=\"/lon/'; $content = $content -replace 'location.href = ''/plan/', 'location.href = ''/lon/'; Set-Content $file.FullName -Value $content -NoNewline -Encoding UTF8 }"
if %errorlevel% equ 0 (
    echo ✅ URLs API et chemins remplacés dans les fichiers HTML
) else (
    echo ⚠️ Remplacement PowerShell échoué, vérifiez manuellement les fichiers HTML
)

echo.
echo ✅ Fichiers prêts pour le déploiement OVH
echo 📁 Dossier: deploy-frontend-lon\
echo 🌐 URL: https://www.filmara.fr/lon/
echo.
echo ✅ Configuration Vite: base="/lon/"
echo ✅ .htaccess configuré pour /lon/
