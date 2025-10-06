@echo off
echo 🔍 Vérification de l'état Git...

echo.
echo 📋 État actuel du repository...
git status

echo.
echo 📋 Fichiers modifiés ou non suivis...
git status --porcelain

echo.
echo 📋 Derniers commits...
git log --oneline -5

echo.
echo 📋 Branche actuelle...
git branch

echo.
echo 📋 Remote repository...
git remote -v

echo.
echo 🎯 Analyse :
echo    - Si des fichiers sont "untracked" : Ils ne sont pas sur Git
echo    - Si des fichiers sont "modified" : Ils ont été modifiés localement
echo    - Si des fichiers sont "staged" : Ils sont prêts à être commités
echo.
echo 🎯 Prochaines étapes :
echo    1. Si fichiers untracked : Les ajouter avec git add
echo    2. Si fichiers modified : Les commiter avec git commit
echo    3. Si fichiers staged : Les pousser avec git push
echo.
echo 🎯 Appuyez sur une touche pour fermer...
pause



