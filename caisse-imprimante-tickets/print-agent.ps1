# =====================================================================
#  Agent d'impression Filmara - commandes entreprises
#  Tourne sur la caisse Crisalid (Windows), interroge l'API Render et
#  imprime un ticket ESC/POS (AURES ODP 333) a chaque nouvelle commande.
#
#  Usage :
#    print-agent.ps1              boucle infinie (usage normal)
#    print-agent.ps1 -TestPrint   imprime un ticket de test et quitte
#    print-agent.ps1 -Once        un seul cycle de verification et quitte
# =====================================================================
param(
    [switch]$TestPrint,
    [switch]$Once
)

$ErrorActionPreference = 'Stop'
# TLS 1.2 obligatoire pour Render (Windows anciens : TLS 1.0 par defaut)
[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ConfigPath = Join-Path $ScriptDir 'config.json'
$LogPath = Join-Path $ScriptDir 'print-agent.log'
$PidPath = Join-Path $ScriptDir 'agent.pid'

# ----------------------------------------------------------------------
# Journal
# ----------------------------------------------------------------------
function Write-Log([string]$Message) {
    $line = ('{0:yyyy-MM-dd HH:mm:ss}  {1}' -f (Get-Date), $Message)
    Write-Host $line
    try {
        if ((Test-Path $LogPath) -and ((Get-Item $LogPath).Length -gt 1MB)) {
            Move-Item -Force $LogPath ($LogPath + '.old')
        }
        Add-Content -Path $LogPath -Value $line -Encoding UTF8
    } catch { }
}

# ----------------------------------------------------------------------
# Configuration
# ----------------------------------------------------------------------
if (-not (Test-Path $ConfigPath)) {
    Write-Log "ERREUR: config.json introuvable dans $ScriptDir"
    Write-Log "Copiez config.arras.json ou config.longuenesse.json vers config.json et renseignez la cle."
    exit 1
}
$Config = Get-Content -Raw -Encoding UTF8 $ConfigPath | ConvertFrom-Json
$ApiUrl = $Config.apiUrl.TrimEnd('/')
$Site = $Config.site
$PrintKey = $Config.printKey
$PrinterName = [string]$Config.printerName
$PollSeconds = if ($Config.pollSeconds) { [int]$Config.pollSeconds } else { 60 }

# printerName vide => imprimante par defaut de Windows
if (-not $PrinterName -or $PrinterName.Trim() -eq '') {
    $defaultPrinter = Get-CimInstance -ClassName Win32_Printer -Filter 'Default = TRUE' -ErrorAction SilentlyContinue
    if ($defaultPrinter) {
        $PrinterName = $defaultPrinter.Name
    } else {
        Write-Log "ERREUR: printerName vide et aucune imprimante par defaut trouvee."
        exit 1
    }
}

if (-not $PrintKey -or $PrintKey -eq 'METTRE_LA_CLE_ICI') {
    Write-Log "ERREUR: renseignez printKey dans config.json (valeur de PRINT_AGENT_KEY sur Render)."
    exit 1
}

# ----------------------------------------------------------------------
# Instance unique
# ----------------------------------------------------------------------
$mutex = New-Object System.Threading.Mutex($false, 'FilmaraPrintAgent')
if (-not $mutex.WaitOne(0)) {
    Write-Log "Agent deja en cours d'execution, arret de cette instance."
    exit 0
}
Set-Content -Path $PidPath -Value $PID

# ----------------------------------------------------------------------
# Impression RAW via le spouleur Windows (winspool)
# ----------------------------------------------------------------------
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public class RawPrinterHelper
{
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
    public class DOCINFOA
    {
        [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
    }

    [DllImport("winspool.drv", EntryPoint = "OpenPrinterA", SetLastError = true, CharSet = CharSet.Ansi)]
    public static extern bool OpenPrinter(string szPrinter, out IntPtr hPrinter, IntPtr pd);
    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool ClosePrinter(IntPtr hPrinter);
    [DllImport("winspool.drv", EntryPoint = "StartDocPrinterA", SetLastError = true, CharSet = CharSet.Ansi)]
    public static extern bool StartDocPrinter(IntPtr hPrinter, int level, [In] DOCINFOA di);
    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);
    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);
    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);
    [DllImport("winspool.drv", SetLastError = true)]
    public static extern bool WritePrinter(IntPtr hPrinter, byte[] pBytes, int dwCount, out int dwWritten);

    public static bool SendBytes(string printerName, byte[] bytes)
    {
        IntPtr hPrinter;
        if (!OpenPrinter(printerName, out hPrinter, IntPtr.Zero)) return false;
        DOCINFOA di = new DOCINFOA();
        di.pDocName = "Ticket commande Filmara";
        di.pDataType = "RAW";
        bool ok = false;
        if (StartDocPrinter(hPrinter, 1, di))
        {
            if (StartPagePrinter(hPrinter))
            {
                int written;
                ok = WritePrinter(hPrinter, bytes, bytes.Length, out written);
                EndPagePrinter(hPrinter);
            }
            EndDocPrinter(hPrinter);
        }
        ClosePrinter(hPrinter);
        return ok;
    }
}
"@

# Encodage : CP858 (accents + euro) si disponible, sinon CP850
$script:CodePageByte = 19  # ESC t 19 = PC858
try {
    $script:TextEncoding = [System.Text.Encoding]::GetEncoding(858)
} catch {
    $script:TextEncoding = [System.Text.Encoding]::GetEncoding(850)
    $script:CodePageByte = 2   # ESC t 2 = PC850
}

function Get-EscPosBytes($Ticket) {
    $ms = New-Object System.IO.MemoryStream
    function Add-Bytes([byte[]]$b) { $ms.Write($b, 0, $b.Length) }
    function Add-Text([string]$t) { Add-Bytes ($script:TextEncoding.GetBytes($t)) }

    Add-Bytes ([byte[]](0x1B, 0x40))                        # init
    Add-Bytes ([byte[]](0x1B, 0x74, $script:CodePageByte))  # code page accents

    # Titre : centre, double taille, gras
    Add-Bytes ([byte[]](0x1B, 0x61, 0x01))                  # centrer
    Add-Bytes ([byte[]](0x1B, 0x45, 0x01))                  # gras on
    Add-Bytes ([byte[]](0x1D, 0x21, 0x11))                  # double largeur+hauteur
    Add-Text ($Ticket.title + "`n")
    Add-Bytes ([byte[]](0x1D, 0x21, 0x00))                  # taille normale
    if ($Ticket.subtitle) { Add-Text ($Ticket.subtitle + "`n") }
    Add-Bytes ([byte[]](0x1B, 0x45, 0x00))                  # gras off
    Add-Bytes ([byte[]](0x1B, 0x61, 0x00))                  # aligner a gauche

    foreach ($line in $Ticket.lines) { Add-Text ($line + "`n") }

    Add-Bytes ([byte[]](0x0A, 0x0A, 0x0A, 0x0A))            # avance papier
    Add-Bytes ([byte[]](0x1D, 0x56, 0x42, 0x00))            # coupe partielle
    return $ms.ToArray()
}

function Print-Ticket($Ticket) {
    $bytes = Get-EscPosBytes $Ticket
    $ok = [RawPrinterHelper]::SendBytes($PrinterName, $bytes)
    if (-not $ok) {
        $available = (Get-Printer | Select-Object -ExpandProperty Name) -join ', '
        Write-Log "ERREUR: impression impossible sur '$PrinterName'. Imprimantes disponibles : $available"
    }
    return $ok
}

# ----------------------------------------------------------------------
# Ticket de test
# ----------------------------------------------------------------------
if ($TestPrint) {
    $test = [pscustomobject]@{
        title    = 'TICKET DE TEST'
        subtitle = "FILMARA - $($Site.ToUpper())"
        lines    = @(
            ('-' * 42),
            'Si vous lisez ceci, l''impression',
            'des commandes entreprises fonctionne.',
            'Accents : eleve agee ou Noel francais',
            ('-' * 42),
            ('Imprime le ' + (Get-Date -Format 'dd/MM/yyyy HH:mm'))
        )
    }
    if (Print-Ticket $test) { Write-Log 'Ticket de test envoye a l''imprimante.' } 
    exit 0
}

# ----------------------------------------------------------------------
# Boucle principale
# ----------------------------------------------------------------------
Write-Log "Agent demarre. Site=$Site  API=$ApiUrl  Imprimante=$PrinterName  Cycle=${PollSeconds}s"
$headers = @{ 'x-print-key' = $PrintKey }

while ($true) {
    try {
        $resp = Invoke-RestMethod -Uri "$ApiUrl/partner-orders/print-queue?site=$Site" `
            -Headers $headers -Method Get -TimeoutSec 90
        $tickets = @($resp.data.tickets)

        if ($tickets.Count -gt 0) {
            Write-Log "$($tickets.Count) ticket(s) a imprimer."
            $printedOrders = @()
            $printedRequests = @()

            foreach ($t in $tickets) {
                if (Print-Ticket $t) {
                    Write-Log "Imprime : $($t.title) ($($t.id))"
                    if ($t.kind -eq 'clientRequest') { $printedRequests += $t.id }
                    else { $printedOrders += $t.id }
                    Start-Sleep -Milliseconds 500
                }
            }

            if ($printedOrders.Count -gt 0 -or $printedRequests.Count -gt 0) {
                $body = @{
                    site                  = $Site
                    orderIds              = $printedOrders
                    clientRequestOrderIds = $printedRequests
                } | ConvertTo-Json
                Invoke-RestMethod -Uri "$ApiUrl/partner-orders/print-queue/ack" `
                    -Headers $headers -Method Post -Body $body `
                    -ContentType 'application/json; charset=utf-8' -TimeoutSec 90 | Out-Null
            }
        }
    } catch {
        Write-Log "Erreur cycle : $($_.Exception.Message)"
    }

    if ($Once) { break }
    Start-Sleep -Seconds $PollSeconds
}
