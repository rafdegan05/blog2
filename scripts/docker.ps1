#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Script per gestire Docker Compose con configurazione interattiva delle variabili d'ambiente.

.DESCRIPTION
    Gestisce i container Docker del progetto BlogPodcast.
    Al primo avvio (o con il comando 'setup') guida l'utente nella configurazione
    delle variabili d'ambiente, generando automaticamente il file .env.

.PARAMETER Command
    up, down, build, dev, stop, restart, logs, logs:app, logs:db, ps,
    db:shell, db:reset, migrate, seed, clean, setup, help

.EXAMPLE
    .\scripts\docker.ps1 setup     # Configura le variabili d'ambiente
    .\scripts\docker.ps1 build     # Build e avvio
    .\scripts\docker.ps1 dev       # Avvio con Prisma Studio
#>

param(
    [Parameter(Position = 0)]
    [ValidateSet(
        "up", "down", "build", "dev", "stop", "restart",
        "logs", "logs:app", "logs:db", "ps",
        "db:shell", "db:reset", "migrate", "seed", "clean",
        "setup", "help"
    )]
    [string]$Command = "help"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ComposeFile = Join-Path $ProjectRoot "docker-compose.yml"
$EnvFile = Join-Path $ProjectRoot ".env"
$EnvExample = Join-Path $ProjectRoot ".env.example"

# ─── Output helpers ───
function Write-Step { param([string]$Msg) Write-Host "`n=> $Msg" -ForegroundColor Cyan }
function Write-Ok   { param([string]$Msg) Write-Host "   $Msg" -ForegroundColor Green }
function Write-Warn { param([string]$Msg) Write-Host "   $Msg" -ForegroundColor Yellow }
function Write-Err  { param([string]$Msg) Write-Host "   $Msg" -ForegroundColor Red }

# ─── Helpers ───

function Test-DockerRunning {
    try {
        docker info 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) { throw }
    }
    catch {
        Write-Err "Docker non e' in esecuzione. Avvia Docker Desktop e riprova."
        exit 1
    }
}

function Read-EnvValue {
    param(
        [string]$VariableName,
        [string]$Description,
        [string]$Default = "",
        [switch]$Required
    )
    $prompt = "  $Description"
    if ($Default) { $prompt += " [$Default]" }
    $prompt += ": "
    
    do {
        $value = Read-Host $prompt
        if ([string]::IsNullOrWhiteSpace($value)) { $value = $Default }
        if ($Required -and [string]::IsNullOrWhiteSpace($value)) {
            Write-Warn "  Questo campo e' obbligatorio."
        }
    } while ($Required -and [string]::IsNullOrWhiteSpace($value))
    
    return $value
}

function New-AuthSecret {
    $bytes = [byte[]]::new(32)
    [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
    return [Convert]::ToBase64String($bytes)
}

function Invoke-EnvSetup {
    param([switch]$Force)

    if ((Test-Path $EnvFile) -and -not $Force) {
        Write-Ok "File .env gia' presente."
        $overwrite = Read-Host "  Vuoi sovrascriverlo? (s/N)"
        if ($overwrite -ne "s" -and $overwrite -ne "S") {
            Write-Ok "Configurazione esistente mantenuta."
            return
        }
    }

    Write-Host ""
    Write-Host "  ================================================" -ForegroundColor Cyan
    Write-Host "   Configurazione Variabili d'Ambiente BlogPodcast  " -ForegroundColor Cyan
    Write-Host "  ================================================" -ForegroundColor Cyan
    Write-Host ""

    # ─── Database ───
    Write-Host "  --- Database PostgreSQL ---" -ForegroundColor Yellow
    $dbUser     = Read-EnvValue -VariableName "POSTGRES_USER"     -Description "Utente database"     -Default "postgres"
    $dbPassword = Read-EnvValue -VariableName "POSTGRES_PASSWORD" -Description "Password database"   -Default "postgres"
    $dbName     = Read-EnvValue -VariableName "POSTGRES_DB"       -Description "Nome database"       -Default "blogpodcast"
    $dbHost     = "localhost"
    $dbPort     = Read-EnvValue -VariableName "DB_PORT"           -Description "Porta database"      -Default "5432"
    $databaseUrl = "postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?schema=public"

    Write-Host ""

    # ─── NextAuth ───
    Write-Host "  --- NextAuth v5 ---" -ForegroundColor Yellow
    $nextauthUrl = Read-EnvValue -VariableName "NEXTAUTH_URL" -Description "URL dell'app" -Default "http://localhost:3000"
    
    $generatedSecret = New-AuthSecret
    Write-Host "  AUTH_SECRET (generato automaticamente): " -NoNewline -ForegroundColor Gray
    Write-Host $generatedSecret.Substring(0, 8) + "..." -ForegroundColor DarkGray
    $customSecret = Read-EnvValue -VariableName "AUTH_SECRET" -Description "Auth secret (invio per usare quello generato)" -Default $generatedSecret
    
    Write-Host ""

    # ─── Selezione provider OAuth ───
    Write-Host "  --- Provider OAuth ---" -ForegroundColor Yellow
    Write-Host "  Quali provider vuoi configurare?" -ForegroundColor White
    Write-Host "    1) GitHub" -ForegroundColor White
    Write-Host "    2) Google" -ForegroundColor White
    Write-Host "    3) Keycloak" -ForegroundColor White
    Write-Host "    Esempio: 1,2 per GitHub e Google | invio per nessuno" -ForegroundColor Gray
    $providerChoice = Read-Host "  Seleziona (1,2,3)"
    $selectedProviders = @()
    if ($providerChoice) {
        $selectedProviders = $providerChoice -split "," | ForEach-Object { $_.Trim() }
    }

    Write-Host ""

    # ─── GitHub OAuth ───
    $githubId = ""
    $githubSecret = ""
    if ($selectedProviders -contains "1") {
        Write-Host "  --- GitHub OAuth ---" -ForegroundColor Yellow
        $githubId     = Read-EnvValue -VariableName "GITHUB_ID"     -Description "GitHub Client ID"     -Required
        $githubSecret = Read-EnvValue -VariableName "GITHUB_SECRET" -Description "GitHub Client Secret" -Required
        Write-Host ""
    }

    # ─── Google OAuth ───
    $googleId = ""
    $googleSecret = ""
    if ($selectedProviders -contains "2") {
        Write-Host "  --- Google OAuth ---" -ForegroundColor Yellow
        $googleId     = Read-EnvValue -VariableName "GOOGLE_CLIENT_ID"     -Description "Google Client ID"     -Required
        $googleSecret = Read-EnvValue -VariableName "GOOGLE_CLIENT_SECRET" -Description "Google Client Secret" -Required
        Write-Host ""
    }

    # ─── Keycloak OAuth ───
    $keycloakIssuer = ""
    $keycloakId = ""
    $keycloakSecret = ""
    if ($selectedProviders -contains "3") {
        Write-Host "  --- Keycloak OAuth ---" -ForegroundColor Yellow
        $keycloakIssuer = Read-EnvValue -VariableName "KEYCLOAK_ISSUER"        -Description "Keycloak Issuer URL"    -Required
        $keycloakId     = Read-EnvValue -VariableName "KEYCLOAK_CLIENT_ID"     -Description "Keycloak Client ID"     -Required
        $keycloakSecret = Read-EnvValue -VariableName "KEYCLOAK_CLIENT_SECRET" -Description "Keycloak Client Secret" -Required
        Write-Host ""
    }

    # ─── AWS S3 ───
    Write-Host "  --- AWS S3 (upload file) ---" -ForegroundColor Yellow
    Write-Host "  Vuoi configurare AWS S3 per gli upload? (s/N)" -ForegroundColor White
    $s3Choice = Read-Host "  Seleziona"
    $s3Bucket = ""
    $s3Region = ""
    $s3AccessKey = ""
    $s3SecretKey = ""
    if ($s3Choice -eq "s" -or $s3Choice -eq "S") {
        $s3Bucket    = Read-EnvValue -VariableName "AWS_S3_BUCKET"          -Description "S3 Bucket name"        -Required
        $s3Region    = Read-EnvValue -VariableName "AWS_S3_REGION"          -Description "S3 Region"              -Default "eu-west-1"
        $s3AccessKey = Read-EnvValue -VariableName "AWS_ACCESS_KEY_ID"      -Description "AWS Access Key ID"      -Required
        $s3SecretKey = Read-EnvValue -VariableName "AWS_SECRET_ACCESS_KEY"  -Description "AWS Secret Access Key"  -Required
    }
    Write-Host ""

    # ─── Scrivi il file .env ───
    $envContent = @"
# ============================================
# BlogPodcast - Variabili d'Ambiente
# Generato il $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# ============================================

# Database
DATABASE_URL="$databaseUrl"

# NextAuth v5
NEXTAUTH_URL="$nextauthUrl"
AUTH_SECRET="$customSecret"

# GitHub OAuth
GITHUB_ID="$githubId"
GITHUB_SECRET="$githubSecret"

# Google OAuth
GOOGLE_CLIENT_ID="$googleId"
GOOGLE_CLIENT_SECRET="$googleSecret"

# Keycloak OAuth
KEYCLOAK_ISSUER="$keycloakIssuer"
KEYCLOAK_CLIENT_ID="$keycloakId"
KEYCLOAK_CLIENT_SECRET="$keycloakSecret"

# AWS S3
AWS_S3_BUCKET="$s3Bucket"
AWS_S3_REGION="$s3Region"
AWS_ACCESS_KEY_ID="$s3AccessKey"
AWS_SECRET_ACCESS_KEY="$s3SecretKey"
"@

    Set-Content -Path $EnvFile -Value $envContent -Encoding UTF8
    Write-Host ""
    Write-Ok "File .env creato con successo!"
    
    # Riepilogo provider configurati
    Write-Host ""
    Write-Host "  Riepilogo:" -ForegroundColor Yellow
    Write-Host "  Database:  $dbUser@${dbHost}:$dbPort/$dbName" -ForegroundColor Gray
    Write-Host "  App URL:   $nextauthUrl" -ForegroundColor Gray
    if ($githubId)       { Write-Ok "  GitHub:    configurato" } else { Write-Warn "  GitHub:    non configurato" }
    if ($googleId)       { Write-Ok "  Google:    configurato" } else { Write-Warn "  Google:    non configurato" }
    if ($keycloakIssuer) { Write-Ok "  Keycloak:  configurato" } else { Write-Warn "  Keycloak:  non configurato" }
    if ($s3Bucket)        { Write-Ok "  AWS S3:    configurato" } else { Write-Warn "  AWS S3:    non configurato" }
    Write-Host ""
}

function Test-EnvFile {
    if (-not (Test-Path $EnvFile)) {
        Write-Warn "File .env non trovato."
        $create = Read-Host "  Vuoi configurarlo ora? (S/n)"
        if ($create -eq "n" -or $create -eq "N") {
            Write-Warn "Copiato .env.example come .env con valori di default."
            if (Test-Path $EnvExample) {
                Copy-Item $EnvExample $EnvFile
            }
            else {
                Write-Err "Nemmeno .env.example trovato. Esegui '.\scripts\docker.ps1 setup'."
                exit 1
            }
        }
        else {
            Invoke-EnvSetup
        }
    }
}

function Show-Help {
    Write-Host ""
    Write-Host "  BlogPodcast Docker Manager" -ForegroundColor Cyan
    Write-Host "  ==========================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Uso: .\scripts\docker.ps1 <comando>" -ForegroundColor White
    Write-Host ""
    Write-Host "  Comandi disponibili:" -ForegroundColor Yellow
    Write-Host "    setup       Configura le variabili d'ambiente (.env)"
    Write-Host "    up          Avvia i servizi (db + app)"
    Write-Host "    down        Ferma e rimuove i container"
    Write-Host "    build       Ricostruisce le immagini e avvia"
    Write-Host "    dev         Avvia tutto + Prisma Studio (porta 5555)"
    Write-Host "    stop        Ferma i container senza rimuoverli"
    Write-Host "    restart     Riavvia tutti i servizi"
    Write-Host "    logs        Mostra i log di tutti i servizi"
    Write-Host "    logs:app    Mostra i log dell'app Next.js"
    Write-Host "    logs:db     Mostra i log del database"
    Write-Host "    ps          Mostra lo stato dei container"
    Write-Host "    db:shell    Apre una shell psql nel database"
    Write-Host "    db:reset    Ricrea il database (cancella i dati!)"
    Write-Host "    migrate     Esegue le migrazioni Prisma"
    Write-Host "    seed        Esegue il seed del database"
    Write-Host "    clean       Rimuove tutto (container, immagini, volumi)"
    Write-Host "    help        Mostra questo messaggio"
    Write-Host ""
}

# ─── Comandi ───

Push-Location $ProjectRoot
try {
    switch ($Command) {

        "setup" {
            Invoke-EnvSetup -Force
        }

        "up" {
            Test-DockerRunning
            Test-EnvFile
            Write-Step "Avvio dei servizi..."
            docker compose -f $ComposeFile --env-file $EnvFile up -d
            Write-Ok "Servizi avviati!"
            Write-Ok "App:      http://localhost:3000"
            Write-Ok "Database: localhost:5432"
        }

        "down" {
            Test-DockerRunning
            Write-Step "Arresto dei servizi..."
            docker compose -f $ComposeFile down
            Write-Ok "Servizi fermati e rimossi."
        }

        "build" {
            Test-DockerRunning
            Test-EnvFile
            Write-Step "Ricostruzione delle immagini e avvio..."
            docker compose -f $ComposeFile --env-file $EnvFile up -d --build
            Write-Ok "Build completata e servizi avviati!"
            Write-Ok "App:      http://localhost:3000"
            Write-Ok "Database: localhost:5432"
        }

        "dev" {
            Test-DockerRunning
            Test-EnvFile
            Write-Step "Avvio in modalita' sviluppo (con Prisma Studio)..."
            docker compose -f $ComposeFile --env-file $EnvFile --profile dev up -d --build
            Write-Ok "Servizi avviati in modalita' sviluppo!"
            Write-Ok "App:            http://localhost:3000"
            Write-Ok "Prisma Studio:  http://localhost:5555"
            Write-Ok "Database:       localhost:5432"
        }

        "stop" {
            Test-DockerRunning
            Write-Step "Arresto dei container..."
            docker compose -f $ComposeFile stop
            Write-Ok "Container fermati."
        }

        "restart" {
            Test-DockerRunning
            Write-Step "Riavvio dei servizi..."
            docker compose -f $ComposeFile restart
            Write-Ok "Servizi riavviati."
        }

        "logs" {
            Test-DockerRunning
            Write-Step "Log di tutti i servizi (Ctrl+C per uscire)..."
            docker compose -f $ComposeFile logs -f
        }

        "logs:app" {
            Test-DockerRunning
            Write-Step "Log dell'app Next.js (Ctrl+C per uscire)..."
            docker compose -f $ComposeFile logs -f app
        }

        "logs:db" {
            Test-DockerRunning
            Write-Step "Log del database PostgreSQL (Ctrl+C per uscire)..."
            docker compose -f $ComposeFile logs -f db
        }

        "ps" {
            Test-DockerRunning
            docker compose -f $ComposeFile ps
        }

        "db:shell" {
            Test-DockerRunning
            Write-Step "Apertura shell psql..."
            docker compose -f $ComposeFile exec db psql -U postgres -d blogpodcast
        }

        "db:reset" {
            Test-DockerRunning
            Write-Warn "ATTENZIONE: Tutti i dati del database verranno cancellati!"
            $confirm = Read-Host "  Sei sicuro? (s/N)"
            if ($confirm -eq "s" -or $confirm -eq "S") {
                Write-Step "Reset del database..."
                docker compose -f $ComposeFile down -v
                Test-EnvFile
                docker compose -f $ComposeFile --env-file $EnvFile up -d
                Write-Ok "Database ricreato. I servizi sono stati riavviati."
            }
            else {
                Write-Ok "Operazione annullata."
            }
        }

        "migrate" {
            Test-DockerRunning
            Write-Step "Esecuzione migrazioni Prisma..."
            docker compose -f $ComposeFile exec app npx prisma migrate deploy
            Write-Ok "Migrazioni completate."
        }

        "seed" {
            Test-DockerRunning
            Write-Step "Esecuzione seed del database..."
            docker compose -f $ComposeFile exec app sh -c "cd /app/prisma-cli && node node_modules/.bin/tsx prisma/seed.ts"
            Write-Ok "Seed completato."
        }

        "clean" {
            Test-DockerRunning
            Write-Warn "ATTENZIONE: Verranno rimossi container, immagini e volumi del progetto!"
            $confirm = Read-Host "  Sei sicuro? (s/N)"
            if ($confirm -eq "s" -or $confirm -eq "S") {
                Write-Step "Pulizia completa..."
                docker compose -f $ComposeFile down -v --rmi local
                Write-Ok "Pulizia completata."
            }
            else {
                Write-Ok "Operazione annullata."
            }
        }

        "help" {
            Show-Help
        }
    }
}
finally {
    Pop-Location
}
