@echo off
echo ========================================
echo   DEPLOYMENT FRONTEND LONGUENESSE VERS OVH
echo ========================================
echo.

echo 1. Construction du frontend avec Vite pour /lon...
cd frontend
call npm run build:lon
if %errorlevel% neq 0 (
    echo ERREUR: Echec de la construction du frontend
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo 2. Vérification du dossier de déploiement...
if not exist "deploy-frontend-lon" (
    echo ERREUR: deploy-frontend-lon non créé par le build
    pause
    exit /b 1
)

echo    - Copie du .htaccess pour /lon/...
if exist "deploy-frontend-lon\.htaccess-lon-template" (
    copy /Y "deploy-frontend-lon\.htaccess-lon-template" "deploy-frontend-lon\.htaccess" >nul
    echo ✅ .htaccess copié
) else if exist "deploy-frontend-lon\.htaccess.template" (
    copy /Y "deploy-frontend-lon\.htaccess.template" "deploy-frontend-lon\.htaccess" >nul
    echo ✅ .htaccess copié
) else (
    echo RewriteEngine On > deploy-frontend-lon\.htaccess
    echo RewriteCond %%{REQUEST_FILENAME} !-f >> deploy-frontend-lon\.htaccess
    echo RewriteCond %%{REQUEST_FILENAME} !-d >> deploy-frontend-lon\.htaccess
    echo RewriteRule . /lon/index.html [L] >> deploy-frontend-lon\.htaccess
    echo ⚠️ .htaccess minimal créé (template non trouvé)
)

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
echo ========================================
echo   INSTRUCTIONS DEPLOYMENT OVH
echo ========================================
echo.
echo 1. Uploadez TOUT le contenu de 'deploy-frontend-lon' dans le dossier /lon/ sur OVH
echo 2. L'URL sera: https://www.filmara.fr/lon/
echo 3. NE mettez RIEN à la racine (www.filmara.fr/)
echo.
echo ✅ Configuration Vite: base="/lon/"
echo ✅ .htaccess configuré pour /lon/
echo.
pause

