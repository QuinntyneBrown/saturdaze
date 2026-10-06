<#
.SYNOPSIS
    Rebuilds the SaturdazeDemo database from the seed, stages the demo photos, and snapshots it.
.DESCRIPTION
    Resets SaturdazeDemo with the Saturdaze CLI (migrate + seed), runs stage.mjs against the
    running API (start-api.ps1) and image host (start-image-host.ps1), then backs the database
    and the curated photo store up to .cache/admin-demo/ so reset.mjs can restore them before
    each recording. Never touches the Saturdaze development database.
#>
param([string]$Instance = "MSSQLLocalDB")
$ErrorActionPreference = "Stop"
$repo = (Resolve-Path (Join-Path $PSScriptRoot "../../..")).Path
$state = Join-Path $repo ".cache/admin-demo"
$pipe = (sqllocaldb info $Instance | Select-String 'Instance pipe name:').ToString().Split(':', 2)[1].Trim()
$cs = "Server=$pipe;Database=SaturdazeDemo;Trusted_Connection=True;TrustServerCertificate=True"
$sqlcmd = @("-S", $pipe, "-E", "-C", "-N", "o", "-I", "-b")

# The running API holds connections; take them over so the CLI can drop the database.
sqlcmd @sqlcmd -Q "IF DB_ID('SaturdazeDemo') IS NOT NULL ALTER DATABASE SaturdazeDemo SET SINGLE_USER WITH ROLLBACK IMMEDIATE" | Out-Null
dotnet run --project (Join-Path $repo "backend/src/Saturdaze.Cli") --no-build -- `
    --connection $cs --seed-dir (Join-Path $repo "backend/src/Saturdaze.Cli/Seed/Data") reset --yes *> (Join-Path $state "reset.log")
if ($LASTEXITCODE -ne 0) { throw "saturdaze reset failed; see $state/reset.log" }
sqlcmd @sqlcmd -Q "ALTER DATABASE SaturdazeDemo SET MULTI_USER" | Out-Null

Remove-Item -Recurse -Force (Join-Path $state "catalog-photos") -ErrorAction SilentlyContinue
node (Join-Path $PSScriptRoot "stage.mjs")
if ($LASTEXITCODE -ne 0) { throw "stage.mjs failed" }

sqlcmd @sqlcmd -Q "BACKUP DATABASE SaturdazeDemo TO DISK='$(Join-Path $state 'staged.bak')' WITH INIT" | Out-Null
Remove-Item -Recurse -Force (Join-Path $state "catalog-photos.staged") -ErrorAction SilentlyContinue
Copy-Item -Recurse (Join-Path $state "catalog-photos") (Join-Path $state "catalog-photos.staged")
Write-Host "Staged and snapshotted. Record with SD_DEMO_RESET=`"node tools/video-record/admin-demo/reset.mjs`"."
