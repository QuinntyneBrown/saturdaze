<#
.SYNOPSIS
    Serves the demo photos at https://localhost:5443/ (the stand-in provider CDN).
.DESCRIPTION
    Exports the trusted ASP.NET Core development certificate to .cache/admin-demo/ once,
    then runs image-host.py. Leave it running while recording.
#>
$ErrorActionPreference = "Stop"
$repo = (Resolve-Path (Join-Path $PSScriptRoot "../../..")).Path
$state = Join-Path $repo ".cache/admin-demo"
New-Item -ItemType Directory -Force $state | Out-Null
if (-not (Test-Path (Join-Path $state "dev.pem"))) {
    dotnet dev-certs https -ep (Join-Path $state "dev.pem") --format PEM --no-password | Out-Host
}
python -I (Join-Path $PSScriptRoot "image-host.py")
