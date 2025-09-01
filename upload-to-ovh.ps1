# Script PowerShell pour upload FTP vers OVH
param(
    [string]$FtpServer = "ftp.cluster029.hosting.ovh.net",
    [string]$Username = "filmarc",
    [System.Security.SecureString]$Password = (Read-Host "Entrez le mot de passe" -AsSecureString),
    [string]$RemotePath = "/plan"
)

Write-Host "Upload vers OVH en cours..." -ForegroundColor Green

# Fonction pour convertir SecureString en texte brut
function Convert-SecureStringToPlainText {
    param([System.Security.SecureString]$SecureString)
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureString)
    $PlainText = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
    return $PlainText
}

# Créer l'objet WebClient pour FTP
$webClient = New-Object System.Net.WebClient
$plainPassword = Convert-SecureStringToPlainText -SecureString $Password
$webClient.Credentials = New-Object System.Net.NetworkCredential($Username, $plainPassword)

# Fonction pour créer un répertoire et ses parents
function Create-Directory {
    param([string]$RemoteDir)
    try {
        # Diviser le chemin en parties
        $pathParts = $RemoteDir.Trim('/').Split('/')
        $currentPath = ""
        
        # Créer chaque niveau de répertoire
        foreach ($part in $pathParts) {
            if ($currentPath -eq "") {
                $currentPath = "/$part"
            } else {
                $currentPath = "$currentPath/$part"
            }
            
            try {
                Write-Host "Tentative de création: $currentPath" -ForegroundColor Cyan
                $request = [System.Net.FtpWebRequest]::Create("ftp://$FtpServer$currentPath")
                $request.Credentials = $webClient.Credentials
                $request.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
                $response = $request.GetResponse()
                $response.Close()
                Write-Host "Répertoire créé: $currentPath" -ForegroundColor Yellow
            }
            catch {
                Write-Host "Répertoire existe déjà ou erreur: $currentPath" -ForegroundColor Gray
            }
        }
    }
    catch {
        Write-Host "Erreur générale lors de la création des répertoires" -ForegroundColor Red
    }
}

# Fonction pour envoyer un fichier
function Send-File {
    param([string]$LocalFile, [string]$RemoteFile)
    try {
        # Créer le répertoire parent si nécessaire
        $remoteDir = Split-Path $RemoteFile -Parent
        if ($remoteDir -and $remoteDir -ne "/") {
            Create-Directory -RemoteDir $remoteDir
        }
        
        $webClient.UploadFile("ftp://$FtpServer$RemoteFile", $LocalFile)
        Write-Host "Uploadé: $LocalFile" -ForegroundColor Green
    }
    catch {
        Write-Host "Erreur upload $LocalFile : $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Créer les répertoires principaux
Write-Host "Création des répertoires..." -ForegroundColor Yellow
Create-Directory -RemoteDir $RemotePath
Create-Directory -RemoteDir "$RemotePath/api"
Create-Directory -RemoteDir "$RemotePath/static"
Create-Directory -RemoteDir "$RemotePath/static/css"
Create-Directory -RemoteDir "$RemotePath/static/js"

# Uploader les fichiers du frontend (contenu de www)
$wwwLocalPath = ".\deploy\www"
$wwwRemotePath = "$RemotePath"

Get-ChildItem -Path $wwwLocalPath -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Substring((Get-Item $wwwLocalPath).FullName.Length + 1)
    $remoteFile = "$wwwRemotePath/$($relativePath.Replace('\', '/'))"
    Send-File -LocalFile $_.FullName -RemoteFile $remoteFile
}

# Uploader les fichiers du backend (contenu de api)
$apiLocalPath = ".\deploy\api"
$apiRemotePath = "$RemotePath/api"

Get-ChildItem -Path $apiLocalPath -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Substring((Get-Item $apiLocalPath).FullName.Length + 1)
    $remoteFile = "$apiRemotePath/$($relativePath.Replace('\', '/'))"
    Send-File -LocalFile $_.FullName -RemoteFile $remoteFile
}

$webClient.Dispose()
Write-Host "Upload terminé !" -ForegroundColor Green
