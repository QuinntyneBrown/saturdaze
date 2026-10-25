#Requires -Version 7
<#
.SYNOPSIS
  Starts the Saturdaze API on :5100 for Playwright, on a fresh SQLite file
  instead of SQL Server (ADR-020).

.DESCRIPTION
  Stops any running API, deletes the e2e database under .run/e2e, and starts
  the API with Saturdaze:Database:Provider=Sqlite; on SQLite the API creates
  the schema from the model on startup. The script then seeds the accounts and
  catalog `e2e/fixtures/auth.ts` expects with the existing seeder
  (`saturdaze seed --provider Sqlite`) from the bundled seed files, and checks
  that the seeded user can sign in. No LocalDB, no `saturdaze migrate`, and
  every run starts from the same data. Logs go to .run/logs.

  The curated-photo origin is the allow-listed test origin the admin upload
  specs need (see e2e/playwright.config.ts).

.PARAMETER Build
  Build the API and CLI first (by default the solution is assumed built).

.PARAMETER Port
  The API port. Default 5100, which the Angular environment compiles in.
#>
param(
    [switch]$Build,
    [int]$Port = 5100
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $repoRoot 'backend'
$dataDir = Join-Path $repoRoot '.run/e2e'
$logDir = Join-Path $repoRoot '.run/logs'
$database = Join-Path $dataDir 'saturdaze-e2e.db'
$connection = "Data Source=$database"
New-Item -ItemType Directory -Force $dataDir, $logDir | Out-Null

$running = Get-Process -Name dotnet, Saturdaze.Api -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like '*Saturdaze.Api*' }
foreach ($p in $running) {
    Write-Host "Stopping API process $($p.Id)."
    Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
}
if ($running) { Start-Sleep -Seconds 2 }

Get-ChildItem $dataDir -Filter 'saturdaze-e2e.db*' | Remove-Item -Force

if ($Build) {
    dotnet build (Join-Path $backend 'Saturdaze.sln') --nologo
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:Saturdaze__Database__Provider = 'Sqlite'
$env:SATURDAZE_CONNECTION = $connection
$env:Saturdaze__CuratedPhotos__PublicOrigin = 'https://images.example.com'
$env:Saturdaze__Images__AllowedOrigins__0 = 'https://images.example.com'
# Playwright never reaches the internet: no geocoding of saved homes (L2-190).
$env:Saturdaze__Geocoding__Enabled = 'false'

$out = Join-Path $logDir 'e2e-api.out.log'
$err = Join-Path $logDir 'e2e-api.err.log'
$api = Start-Process -FilePath 'dotnet' -PassThru -WorkingDirectory $backend `
    -RedirectStandardOutput $out -RedirectStandardError $err `
    -ArgumentList 'run', '--project', (Join-Path $backend 'src/Saturdaze.Api'), '--no-build', '--urls', "http://localhost:$Port"
Write-Host "API starting on SQLite (pid $($api.Id)); database $database; logs in $logDir"

$deadline = (Get-Date).AddSeconds(60)
$up = $false
do {
    Start-Sleep -Seconds 2
    if ($api.HasExited) { throw "The API exited with code $($api.ExitCode). Check $err and $out." }
    try {
        $up = (Invoke-WebRequest -Uri "http://localhost:$Port/swagger/index.html" -TimeoutSec 5 -UseBasicParsing).StatusCode -eq 200
    } catch { }
} while (-not $up -and (Get-Date) -lt $deadline)
if (-not $up) { throw "The API did not answer on :$Port within 60 s. Check $out." }

dotnet run --project (Join-Path $backend 'src/Saturdaze.Cli') --no-build -- `
    seed --provider Sqlite --connection $connection --seed-dir (Join-Path $backend 'src/Saturdaze.Cli/Seed/Data')
if ($LASTEXITCODE -ne 0) { throw "saturdaze seed failed with exit code $LASTEXITCODE." }

try {
    $login = Invoke-WebRequest -Uri "http://localhost:$Port/api/auth/login" -Method Post -ContentType 'application/json' `
        -Body '{"email":"quinntynebrown@gmail.com","password":"password123"}' -TimeoutSec 30 -UseBasicParsing
    Write-Host "API is up on SQLite: seeded login returned $($login.StatusCode)."
} catch {
    Write-Warning "API started but the seeded login failed: $($_.Exception.Message). Check $out."
    exit 1
}
