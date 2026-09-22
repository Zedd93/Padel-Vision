<#
.SYNOPSIS
    Wdraza nowa wersje backendu PadelVision na serwerze firmowym.

.DESCRIPTION
    Uruchamiany przez self-hosted runner GitHub Actions (.github/workflows/deploy.yml)
    jako NT AUTHORITY\NETWORK SERVICE. Wymaga wczesniejszego uruchomienia
    install-service.ps1, ktory nadaje runnerowi potrzebne uprawnienia.

    Kolejnosc:
      1. sprawdza konfiguracje
      2. robi kopie obecnego backend.jar
      3. zatrzymuje usluge, podmienia plik, uruchamia usluge
      4. czeka, az /api/health odpowie 200
      5. jesli nie odpowie - przywraca poprzednia wersje i konczy sie bledem

    Plik jest celowo w ASCII - patrz komentarz w install-service.ps1.

.EXAMPLE
    .\deploy.ps1 -JarPath C:\actions-runner\_work\...\backend-0.0.1-SNAPSHOT.jar
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$JarPath,
    [string]$BaseDir = 'C:\padelvision',
    [int]$Port = 4000,
    [int]$HealthTimeoutSec = 180,
    [int]$KeepBackups = 5
)

$ErrorActionPreference = 'Stop'

$ServiceId = 'padelvision-api'
$AppJar    = Join-Path $BaseDir 'app\backend.jar'
$BackupDir = Join-Path $BaseDir 'backups'
$LogDir    = Join-Path $BaseDir 'logs'
$EnvFile   = Join-Path $BaseDir '.env.production'

# Port bierzemy z konfiguracji uslugi, zeby install-service.ps1 -Port N
# nie wymagal recznej zmiany tutaj
if (-not $PSBoundParameters.ContainsKey('Port')) {
    $serviceXml = Join-Path $BaseDir "$ServiceId.xml"
    if (Test-Path $serviceXml) {
        $match = Select-String -Path $serviceXml -Pattern '--server\.port=(\d+)' | Select-Object -First 1
        if ($match) { $Port = [int]$match.Matches[0].Groups[1].Value }
    }
}

function Step([string]$Message) { Write-Host "-> $Message" }

function Stop-Api {
    $service = Get-Service $ServiceId
    if ($service.Status -ne 'Stopped') {
        Stop-Service $ServiceId
        $service.WaitForStatus('Stopped', [TimeSpan]::FromSeconds(60))
    }
}

function Show-RecentLogs {
    Write-Host '--- ostatnie wpisy logu backendu ---'
    Get-ChildItem $LogDir -Filter "$ServiceId*.log" -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match '\.(out|err)' } |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 2 |
        ForEach-Object {
            Write-Host "[$($_.Name)]"
            Get-Content $_.FullName -Tail 40
        }
}

function Wait-Healthy {
    $url = "http://127.0.0.1:$Port/api/health"
    $deadline = (Get-Date).AddSeconds($HealthTimeoutSec)
    while ((Get-Date) -lt $deadline) {
        try {
            $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) { return $true }
        } catch {
            # backend jeszcze startuje (Flyway, kontekst Springa)
        }
        Start-Sleep -Seconds 3
    }
    return $false
}

# --- 1. Kontrola ------------------------------------------------------------
Step 'Kontrola konfiguracji'

if (-not (Test-Path $JarPath)) {
    throw "Nie ma pliku JAR z artefaktu: $JarPath"
}
if (-not (Get-Service $ServiceId -ErrorAction SilentlyContinue)) {
    throw "Nie ma uslugi $ServiceId - uruchom najpierw deploy\windows\install-service.ps1 (docs/DEPLOY.md, krok 7)"
}
if (-not (Test-Path $EnvFile)) {
    throw "Nie ma pliku $EnvFile (docs/DEPLOY.md, krok 6)"
}

$envContent = Get-Content $EnvFile
foreach ($key in 'DATABASE_PASSWORD', 'JWT_SECRET') {
    if (-not ($envContent | Where-Object { $_ -match "^\s*$key\s*=\s*\S" })) {
        throw "$EnvFile nie ma wartosci $key"
    }
}
$jwtLine = $envContent | Where-Object { $_ -match '^\s*JWT_SECRET\s*=' } | Select-Object -First 1
$jwt = ($jwtLine -replace '^\s*JWT_SECRET\s*=\s*', '').Trim()
if ($jwt.Length -lt 64) {
    # HS512 odrzuca krotsze klucze - rejestracja i logowanie konczylyby sie bledem 500
    throw "JWT_SECRET ma $($jwt.Length) znakow, a HS512 wymaga co najmniej 64"
}
if (-not ($envContent | Where-Object { $_ -match '^\s*YOUTUBE_TOKEN_ENC_KEY\s*=\s*\S' })) {
    Write-Host '::warning::YOUTUBE_TOKEN_ENC_KEY jest pusty - integracja z YouTube bedzie wylaczona'
}

# --- 2. Kopia obecnej wersji ------------------------------------------------
$backup = $null
if (Test-Path $AppJar) {
    $stamp  = Get-Date -Format 'yyyyMMdd-HHmmss'
    $backup = Join-Path $BackupDir "backend-$stamp.jar"
    Step "Kopia obecnej wersji: $backup"
    Copy-Item $AppJar $backup
}

# --- 3. Podmiana ------------------------------------------------------------
Step 'Zatrzymuje usluge'
Stop-Api

Step 'Podmieniam backend.jar'
Copy-Item $JarPath $AppJar -Force

Step 'Uruchamiam usluge'
Start-Service $ServiceId

# --- 4. Healthcheck ---------------------------------------------------------
Step "Czekam na /api/health (do $HealthTimeoutSec s)"
if (Wait-Healthy) {
    Write-Host 'Backend odpowiada - deploy zakonczony.'
} else {
    Write-Host "::error::Backend nie odpowiedzial w ciagu $HealthTimeoutSec s"
    Show-RecentLogs

    # --- 5. Wycofanie -------------------------------------------------------
    if ($backup) {
        Write-Host "Przywracam poprzednia wersje: $backup"
        Stop-Api
        Copy-Item $backup $AppJar -Force
        Start-Service $ServiceId
        if (Wait-Healthy) {
            Write-Host '::warning::Poprzednia wersja dziala - nowa zostala wycofana'
        } else {
            Write-Host '::error::Poprzednia wersja tez nie odpowiada - sprawdz baze, Redis i .env.production'
        }
    } else {
        Write-Host '::error::To byl pierwszy deploy - nie ma wersji do przywrocenia'
    }
    exit 1
}

# --- Porzadki ---------------------------------------------------------------
Get-ChildItem $BackupDir -Filter 'backend-*.jar' |
    Sort-Object LastWriteTime -Descending |
    Select-Object -Skip $KeepBackups |
    Remove-Item -Force

exit 0
