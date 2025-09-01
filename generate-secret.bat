@echo off
echo Generation d'une cle secrete securisee
echo ======================================

echo.
echo Votre nouvelle cle secrete JWT:
echo.

:: Generer une cle aleatoire de 64 caracteres
powershell -Command "Add-Type -AssemblyName System.Security; $bytes = New-Object Byte[] 64; (New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes); [Convert]::ToBase64String($bytes)"

echo.
echo Copiez cette cle et remplacez 'votre-cle-secrete-ici' dans votre fichier .env
echo.
pause
