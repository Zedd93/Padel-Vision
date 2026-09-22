#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Jednorazowa instalacja backendu PadelVision jako uslugi Windows.

.DESCRIPTION
    - tworzy C:\padelvision\{app,backups,logs}
    - znajduje Jave 21 i pobiera WinSW (wrapper, ktory robi z java.exe usluge)
    - instaluje usluge "padelvision-api" dzialajaca jako NT AUTHORITY\LocalService,
      a nie jako administrator
    - daje runnerowi GitHub Actions (NT AUTHORITY\NETWORK SERVICE) prawo tylko
      do podmiany pliku JAR i restartu tej jednej uslugi

    Skrypt mozna uruchomic ponownie - pomija to, co juz jest zrobione.
    Pierwsze uruchomienie tworzy .env.production z szablonu i konczy sie,
    zeby dalo sie go uzupelnic.

    Plik jest celowo w ASCII: PowerShell 5.1 czyta skrypty bez BOM w ANSI,
    a polskie litery z UTF-8 zamienialy sie w znaki traktowane jak cudzyslowy.

    Instrukcja: docs/DEPLOY.md

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\install-service.ps1
#>
param(
    [string]$BaseDir = 'C:\padelvision',
    [int]$Port = 4000,
    [string]$MaxHeap = '1g'
)

$ErrorActionPreference = 'Stop'

$ServiceId    = 'padelvision-api'
$WinswVersion = 'v2.12.0'
$WinswUrl     = "https://github.com/winsw/winsw/releases/download/$WinswVersion/WinSW-x64.exe"

# SID-y zamiast nazw kont - nazwy sa tlumaczone na polskim Windowsie
$LocalServiceSid   = '*S-1-5-19'
$NetworkServiceSid = '*S-1-5-20'

function Step([string]$Message) { Write-Host "-> $Message" -ForegroundColor Cyan }
function Ok([string]$Message)   { Write-Host "   OK: $Message" -ForegroundColor Green }

# --- 1. Java 21 -------------------------------------------------------------
Step 'Szukam Javy 21'

$candidates = @()
$onPath = Get-Command java.exe -ErrorAction SilentlyContinue
if ($onPath) { $candidates += $onPath.Source }
$candidates += Get-ChildItem 'C:\Program Files\Eclipse Adoptium', 'C:\Program Files\Java' `
        -Filter java.exe -Recurse -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty FullName

$javaPath = $null
foreach ($candidate in $candidates) {
    # przekierowanie przez cmd: w PS 5.1 stderr + ErrorActionPreference=Stop
    # zamienia wypis "java -version" w blad krytyczny
    $versionLine = (& cmd.exe /c "`"$candidate`" -version 2>&1") | Select-Object -First 1
    if ("$versionLine" -match 'version "21') {
        $javaPath = $candidate
        break
    }
}
if (-not $javaPath) {
    throw 'Nie znaleziono Javy 21. Zainstaluj Temurin 21 JRE (docs/DEPLOY.md, krok 2) i uruchom skrypt ponownie.'
}
Ok $javaPath

# --- 2. Katalogi ------------------------------------------------------------
Step "Katalogi w $BaseDir"
foreach ($dir in 'app', 'backups', 'logs') {
    New-Item -ItemType Directory -Force -Path (Join-Path $BaseDir $dir) | Out-Null
}
Ok 'app, backups, logs'

# --- 3. Plik z konfiguracja -------------------------------------------------
$envFile = Join-Path $BaseDir '.env.production'
if (-not (Test-Path $envFile)) {
    $template = Join-Path $PSScriptRoot '.env.production.example'
    if (-not (Test-Path $template)) {
        throw "Brak szablonu $template - uruchom skrypt z katalogu deploy\windows repozytorium."
    }
    Copy-Item $template $envFile
    Write-Host ''
    Write-Host "Utworzono $envFile z szablonu." -ForegroundColor Yellow
    Write-Host 'Uzupelnij go (docs/DEPLOY.md, krok 6) i uruchom ten skrypt ponownie.' -ForegroundColor Yellow
    exit 0
}

$envContent = Get-Content $envFile
foreach ($key in 'DATABASE_PASSWORD', 'JWT_SECRET') {
    if (-not ($envContent | Where-Object { $_ -match "^\s*$key\s*=\s*\S" })) {
        throw "$envFile nie ma wartosci $key - uzupelnij i uruchom ponownie."
    }
}
Ok ".env.production zawiera wymagane klucze"

# --- 4. Port ----------------------------------------------------------------
$existingService = Get-Service $ServiceId -ErrorAction SilentlyContinue
$listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($listener -and -not $existingService) {
    $owner = (Get-Process -Id $listener[0].OwningProcess -ErrorAction SilentlyContinue).ProcessName
    throw "Port $Port jest zajety przez '$owner'. Uruchom skrypt z innym portem, np. -Port 4010."
}

# --- 5. WinSW ---------------------------------------------------------------
$wrapperExe = Join-Path $BaseDir "$ServiceId.exe"
if (-not (Test-Path $wrapperExe)) {
    Step "Pobieram WinSW $WinswVersion"
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $WinswUrl -OutFile $wrapperExe -UseBasicParsing
    Ok $wrapperExe
}

# Konfiguracja uslugi. %BASE% rozwija WinSW (katalog z plikiem XML).
# --server.address=127.0.0.1: backend nie jest widoczny w sieci LAN,
# ruch z internetu dochodzi wylacznie przez Cloudflare Tunnel.
Step 'Konfiguracja uslugi'
$serviceXml = @"
<service>
  <id>$ServiceId</id>
  <name>PadelVision API</name>
  <description>Backend PadelVision (Spring Boot). Deploy: GitHub Actions, docs/DEPLOY.md</description>
  <executable>$javaPath</executable>
  <arguments>-Xmx$MaxHeap -XX:+UseG1GC -jar "%BASE%\app\backend.jar" --spring.profiles.active=prod --server.address=127.0.0.1 --server.port=$Port --spring.config.import=file:./.env.production[.properties]</arguments>
  <workingdirectory>%BASE%</workingdirectory>
  <logpath>%BASE%\logs</logpath>
  <log mode="roll-by-size">
    <sizeThreshold>10240</sizeThreshold>
    <keepFiles>8</keepFiles>
  </log>
  <onfailure action="restart" delay="10 sec"/>
  <onfailure action="restart" delay="30 sec"/>
  <resetfailure>1 hour</resetfailure>
  <stoptimeout>30 sec</stoptimeout>
  <startmode>Automatic</startmode>
  <delayedAutoStart>true</delayedAutoStart>
</service>
"@
Set-Content -Path (Join-Path $BaseDir "$ServiceId.xml") -Value $serviceXml -Encoding UTF8
Ok "$ServiceId.xml"

# --- 6. Instalacja uslugi ---------------------------------------------------
if (-not $existingService) {
    Step 'Instaluje usluge'
    & $wrapperExe install
    if ($LASTEXITCODE -ne 0) { throw "WinSW install zakonczyl sie kodem $LASTEXITCODE" }
    Ok $ServiceId
}

# Konto o minimalnych uprawnieniach zamiast LocalSystem
Step 'Konto uslugi: LocalService'
$result = Get-CimInstance Win32_Service -Filter "Name='$ServiceId'" |
    Invoke-CimMethod -MethodName Change -Arguments @{
        StartName     = 'NT AUTHORITY\LocalService'
        StartPassword = ''
    }
if ($result.ReturnValue -ne 0) { throw "Zmiana konta uslugi nie powiodla sie (kod $($result.ReturnValue))" }
Ok 'NT AUTHORITY\LocalService'

# --- 7. Uprawnienia do plikow -----------------------------------------------
# LocalService (usluga): odczyt calosci, zapis tylko do logow
# NETWORK SERVICE (runner GitHub Actions): odczyt calosci, zapis do app i backups
Step 'Uprawnienia do katalogow'
$grants = @(
    @($BaseDir,                          "${LocalServiceSid}:(OI)(CI)RX"),
    @($BaseDir,                          "${NetworkServiceSid}:(OI)(CI)RX"),
    @((Join-Path $BaseDir 'logs'),       "${LocalServiceSid}:(OI)(CI)M"),
    @((Join-Path $BaseDir 'app'),        "${NetworkServiceSid}:(OI)(CI)M"),
    @((Join-Path $BaseDir 'backups'),    "${NetworkServiceSid}:(OI)(CI)M")
)
foreach ($grant in $grants) {
    & icacls $grant[0] /grant $grant[1] | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "icacls nie nadal uprawnien: $($grant[0]) $($grant[1])" }
}
Ok 'logs: LocalService, app + backups: NETWORK SERVICE'

# --- 8. Runner moze restartowac te jedna usluge -----------------------------
# NS = NETWORK SERVICE. Prawa: odczyt stanu, start, stop - nic wiecej.
Step 'Prawo runnera do restartu uslugi'
$sddl = ((& sc.exe sdshow $ServiceId) | Where-Object { $_.Trim() }) -join ''
$ace  = '(A;;CCLCSWRPWPDTLOCRRC;;;NS)'
if ($sddl -notlike "*$ace*") {
    $newSddl = $sddl -replace '^D:', "D:$ace"
    & sc.exe sdset $ServiceId $newSddl | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'sc.exe sdset nie nadal uprawnien do uslugi' }
}
Ok 'NETWORK SERVICE moze uruchamiac i zatrzymywac padelvision-api'

# --- Podsumowanie -----------------------------------------------------------
Write-Host ''
Write-Host '==============================================' -ForegroundColor Green
Write-Host ' Usluga padelvision-api zainstalowana'          -ForegroundColor Green
Write-Host '==============================================' -ForegroundColor Green
Write-Host ''
if (Test-Path (Join-Path $BaseDir 'app\backend.jar')) {
    Write-Host 'Plik backend.jar jest na miejscu - mozesz uruchomic: Start-Service padelvision-api'
} else {
    Write-Host 'Uslugi jeszcze nie uruchamiam - nie ma backend.jar.'
    Write-Host 'Pierwszy plik wgra GitHub Actions przy deployu (docs/DEPLOY.md, krok 9).'
}
