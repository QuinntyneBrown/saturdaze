<#
.SYNOPSIS
    Runs the Saturdaze API against the SaturdazeDemo database for the admin demo recordings.
.DESCRIPTION
    HTTP on :5100 for the apps, HTTPS on :5101 for curated photos. The curated store's public
    origin (https://localhost:5101) and the stand-in provider CDN (https://localhost:5443) are
    both on the image allow-list, so uploads and provider photos project (ADR-015). Build the
    solution first; leave it running while recording.
#>
param([string]$Instance = "MSSQLLocalDB")
$ErrorActionPreference = "Stop"
$repo = (Resolve-Path (Join-Path $PSScriptRoot "../../..")).Path
$state = Join-Path $repo ".cache/admin-demo"

if ((sqllocaldb info $Instance | Select-String '^State:').ToString() -notmatch 'Running') { sqllocaldb start $Instance | Out-Null }
$pipe = (sqllocaldb info $Instance | Select-String 'Instance pipe name:').ToString().Split(':', 2)[1].Trim()

$env:SATURDAZE_CONNECTION = "Server=$pipe;Database=SaturdazeDemo;Trusted_Connection=True;TrustServerCertificate=True"
$env:ASPNETCORE_ENVIRONMENT = "Development"
$env:Saturdaze__CuratedPhotos__PublicOrigin = "https://localhost:5101"
$env:Saturdaze__CuratedPhotos__Directory = (Join-Path $state "catalog-photos")
$env:Saturdaze__Images__AllowedOrigins__0 = "https://localhost:5101"
$env:Saturdaze__Images__AllowedOrigins__1 = "https://localhost:5443"
dotnet run --project (Join-Path $repo "backend/src/Saturdaze.Api") --no-build --urls "http://localhost:5100;https://localhost:5101"
