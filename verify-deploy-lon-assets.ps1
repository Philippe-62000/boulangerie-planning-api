$root = Join-Path $PSScriptRoot 'deploy-frontend-lon'
$missing = New-Object System.Collections.Generic.List[string]
Get-ChildItem $root -Filter '*.html' | ForEach-Object {
  $name = $_.Name
  $html = Get-Content $_.FullName -Raw
  [regex]::Matches($html, '(?:src|href)="(?:/lon/)?(static/[^"]+)"') | ForEach-Object {
    $rel = $_.Groups[1].Value
    $path = Join-Path $root ($rel -replace '/', [IO.Path]::DirectorySeparatorChar)
    if (-not (Test-Path -LiteralPath $path)) {
      $missing.Add("${name}: $rel")
    }
  }
}
if ($missing.Count -gt 0) {
  $missing | ForEach-Object { Write-Host "MANQUANT $_" }
  exit 1
}
Write-Host 'OK: tous les JS/CSS cites par les HTML sont presents.'
