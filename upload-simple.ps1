# Script simple pour upload vers OVH
$ftpServer = "ftp://ftp.cluster029.hosting.ovh.net/www/plan/"
$username = "votre-utilisateur-ovh"
$password = "heulphFIL5555"

# Créer les credentials
$credentials = New-Object System.Net.NetworkCredential($username, $password)

# Uploader les fichiers du frontend
$webClient = New-Object System.Net.WebClient
$webClient.Credentials = $credentials

Write-Host "Upload du frontend..." -ForegroundColor Green
Get-ChildItem ".\deploy\www" -Recurse -File | ForEach-Object {
    $remotePath = $ftpServer + $_.Name
    $webClient.UploadFile($remotePath, $_.FullName)
    Write-Host "Uploadé: $($_.Name)" -ForegroundColor Green
}

# Uploader les fichiers du backend
Write-Host "Upload du backend..." -ForegroundColor Green
Get-ChildItem ".\deploy\api" -Recurse -File | ForEach-Object {
    $remotePath = $ftpServer + "api/" + $_.Name
    $webClient.UploadFile($remotePath, $_.FullName)
    Write-Host "Uploadé: api/$($_.Name)" -ForegroundColor Green
}

$webClient.Dispose()
Write-Host "Upload terminé !" -ForegroundColor Green
