[CmdletBinding()]
param(
    [int]$FrontendPort = 4200,
    [int]$BackendPort = 5100,
    [string]$Configuration = "Debug",
    [string]$ConnectionString = "Server=(localdb)\MSSQLLocalDB;Database=Saturdaze;Trusted_Connection=True;TrustServerCertificate=True",
    [string]$SeedDir,
    [switch]$OpenBrowser
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-FirstExistingPath {
    param([string[]]$Candidates, [string]$Description)

    foreach ($candidate in $Candidates) {
        if (Test-Path -LiteralPath $candidate) {
            return (Resolve-Path -LiteralPath $candidate).Path
        }
    }

    throw "Could not find $Description. Checked: $($Candidates -join ', ')"
}

function Invoke-Step {
    param(
        [Parameter(Mandatory)] [string]$Title,
        [Parameter(Mandatory)] [string]$FilePath,
        [string[]]$Arguments = @(),
        [string]$WorkingDirectory = $repoRoot
    )

    Write-Host ""
    Write-Host $Title
    Write-Host "> $FilePath $($Arguments -join ' ')"

    Push-Location $WorkingDirectory
    try {
        & $FilePath @Arguments
        if ($LASTEXITCODE -ne 0) {
            throw "$Title failed with exit code $LASTEXITCODE."
        }
    }
    finally {
        Pop-Location
    }
}

function Test-PortAvailable {
    param([int]$Port)

    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
    try {
        $listener.Start()
        return $true
    }
    catch {
        return $false
    }
    finally {
        $listener.Stop()
    }
}

function Resolve-NativeCommand {
    param([string[]]$Candidates)

    foreach ($candidate in $Candidates) {
        $command = Get-Command $candidate -ErrorAction SilentlyContinue
        if ($null -ne $command) {
            return $command.Source
        }
    }

    throw "Could not find command. Checked: $($Candidates -join ', ')"
}

function Reset-RunDirectory {
    param([Parameter(Mandatory)] [string]$Path)

    $fullPath = [System.IO.Path]::GetFullPath($Path)
    $runBoundary = $runRoot.TrimEnd([System.IO.Path]::DirectorySeparatorChar, [System.IO.Path]::AltDirectorySeparatorChar) +
        [System.IO.Path]::DirectorySeparatorChar
    if ($fullPath -ne $runRoot -and -not $fullPath.StartsWith($runBoundary, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to reset directory outside run root: $fullPath"
    }

    if (Test-Path -LiteralPath $fullPath) {
        Remove-Item -LiteralPath $fullPath -Recurse -Force
    }

    New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
}

function Start-LoggedProcess {
    param(
        [Parameter(Mandatory)] [string]$Name,
        [Parameter(Mandatory)] [string]$FilePath,
        [string[]]$Arguments = @(),
        [Parameter(Mandatory)] [string]$WorkingDirectory,
        [Parameter(Mandatory)] [string]$StdOutPath,
        [Parameter(Mandatory)] [string]$StdErrPath,
        [hashtable]$Environment = @{}
    )

    $prior = @{}
    foreach ($key in $Environment.Keys) {
        $prior[$key] = [Environment]::GetEnvironmentVariable($key, "Process")
        [Environment]::SetEnvironmentVariable($key, [string]$Environment[$key], "Process")
    }

    try {
        Write-Host ""
        Write-Host "Starting $Name"
        Write-Host "> $FilePath $($Arguments -join ' ')"
        return Start-Process `
            -FilePath $FilePath `
            -ArgumentList $Arguments `
            -WorkingDirectory $WorkingDirectory `
            -RedirectStandardOutput $StdOutPath `
            -RedirectStandardError $StdErrPath `
            -WindowStyle Hidden `
            -PassThru
    }
    finally {
        foreach ($key in $Environment.Keys) {
            [Environment]::SetEnvironmentVariable($key, $prior[$key], "Process")
        }
    }
}

function Wait-ForHttp {
    param(
        [Parameter(Mandatory)] [string]$Name,
        [Parameter(Mandatory)] [string]$Uri,
        [Parameter(Mandatory)] [System.Diagnostics.Process]$Process,
        [int]$TimeoutSeconds = 45
    )

    $deadline = [DateTimeOffset]::UtcNow.AddSeconds($TimeoutSeconds)

    while ([DateTimeOffset]::UtcNow -lt $deadline) {
        if ($Process.HasExited) {
            throw "$Name exited before it was ready. Exit code: $($Process.ExitCode)"
        }

        try {
            Invoke-WebRequest -Uri $Uri -UseBasicParsing -TimeoutSec 2 | Out-Null
            return
        }
        catch {
            Start-Sleep -Seconds 1
        }
    }

    throw "$Name did not respond at $Uri within $TimeoutSeconds seconds."
}

function Stop-StartedProcess {
    param([System.Diagnostics.Process]$Process, [string]$Name)

    if ($null -eq $Process -or $Process.HasExited) {
        return
    }

    Write-Host "Stopping $Name (PID $($Process.Id))"
    Stop-Process -Id $Process.Id -Force
}

$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$backendRoot = Join-Path $repoRoot "backend"
$frontendRoot = Join-Path $repoRoot "frontend"
$e2eRoot = Join-Path $repoRoot "e2e"
$runRoot = [System.IO.Path]::GetFullPath((Join-Path $repoRoot ".run"))

$cliProject = Resolve-FirstExistingPath `
    -Description "Saturdaze CLI project" `
    -Candidates @(
        (Join-Path $repoRoot "src\Saturdaze.Cli\Saturdaze.Cli.csproj"),
        (Join-Path $backendRoot "src\Saturdaze.Cli\Saturdaze.Cli.csproj")
    )

$apiProject = Resolve-FirstExistingPath `
    -Description "Saturdaze API project" `
    -Candidates @((Join-Path $backendRoot "src\Saturdaze.Api\Saturdaze.Api.csproj"))

if ([string]::IsNullOrWhiteSpace($SeedDir)) {
    $SeedDir = Join-Path (Split-Path -Parent $cliProject) "Seed\Data"
}
$SeedDir = (Resolve-Path -LiteralPath $SeedDir).Path

if ($BackendPort -ne 5100) {
    throw "BackendPort must be 5100 because the Angular environment currently compiles API calls to http://localhost:5100."
}

if ($FrontendPort -eq $BackendPort) {
    throw "FrontendPort and BackendPort must be different."
}

$dotnet = Resolve-NativeCommand -Candidates @("dotnet.exe", "dotnet")
$npm = Resolve-NativeCommand -Candidates @("npm.cmd", "npm")
$node = Resolve-NativeCommand -Candidates @("node.exe", "node")

if (-not (Test-PortAvailable -Port $BackendPort)) {
    throw "Backend port $BackendPort is already in use."
}

if (-not (Test-PortAvailable -Port $FrontendPort)) {
    throw "Frontend port $FrontendPort is already in use."
}

New-Item -ItemType Directory -Path $runRoot -Force | Out-Null
$runRoot = (Resolve-Path -LiteralPath $runRoot).Path

$packageSource = Join-Path $runRoot "tool-packages"
$toolPath = Join-Path $runRoot "tools\saturdaze"
$apiOutput = Join-Path $runRoot "api"
$logsRoot = Join-Path $runRoot "logs"

Reset-RunDirectory -Path $packageSource
Reset-RunDirectory -Path $toolPath
Reset-RunDirectory -Path $apiOutput
Reset-RunDirectory -Path $logsRoot

if (-not (Test-Path -LiteralPath (Join-Path $frontendRoot "node_modules"))) {
    Invoke-Step `
        -Title "Installing frontend dependencies" `
        -FilePath $npm `
        -Arguments @("ci") `
        -WorkingDirectory $frontendRoot
}

if (-not (Test-Path -LiteralPath (Join-Path $e2eRoot "node_modules\http-server"))) {
    Invoke-Step `
        -Title "Installing e2e dependencies for the static frontend server" `
        -FilePath $npm `
        -Arguments @("ci") `
        -WorkingDirectory $e2eRoot
}

$toolVersion = "0.1.0-local.$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"
Invoke-Step `
    -Title "Packing Saturdaze CLI" `
    -FilePath $dotnet `
    -Arguments @("pack", $cliProject, "-c", $Configuration, "-o", $packageSource, "/p:PackageVersion=$toolVersion") `
    -WorkingDirectory $repoRoot

Invoke-Step `
    -Title "Installing freshly packed Saturdaze CLI tool" `
    -FilePath $dotnet `
    -Arguments @("tool", "install", "Saturdaze.Cli", "--tool-path", $toolPath, "--add-source", $packageSource, "--version", $toolVersion) `
    -WorkingDirectory $repoRoot

$toolCommand = Join-Path $toolPath "saturdaze.exe"
if (-not (Test-Path -LiteralPath $toolCommand)) {
    $toolCommand = Join-Path $toolPath "saturdaze"
}

Invoke-Step `
    -Title "Resetting database through freshly installed Saturdaze CLI" `
    -FilePath $toolCommand `
    -Arguments @("--connection", $ConnectionString, "--seed-dir", $SeedDir, "reset", "--yes") `
    -WorkingDirectory $repoRoot

Invoke-Step `
    -Title "Publishing backend API" `
    -FilePath $dotnet `
    -Arguments @("publish", $apiProject, "-c", $Configuration, "-o", $apiOutput) `
    -WorkingDirectory $repoRoot

Invoke-Step `
    -Title "Building frontend" `
    -FilePath $npm `
    -Arguments @("run", "build", "--", "saturdaze", "--configuration", "development") `
    -WorkingDirectory $frontendRoot

$frontendDist = Join-Path $frontendRoot "dist\saturdaze\browser"
if (-not (Test-Path -LiteralPath (Join-Path $frontendDist "index.html"))) {
    throw "Frontend build did not produce $frontendDist\index.html."
}

$httpServer = Resolve-FirstExistingPath `
    -Description "http-server binary" `
    -Candidates @(
        (Join-Path $e2eRoot "node_modules\http-server\bin\http-server"),
        (Join-Path $e2eRoot "node_modules\http-server\bin\http-server.js")
    )

$backendUrl = "http://localhost:$BackendPort"
$frontendUrl = "http://localhost:$FrontendPort/"
$apiProcess = $null
$frontendProcess = $null

try {
    $apiProcess = Start-LoggedProcess `
        -Name "backend API" `
        -FilePath $dotnet `
        -Arguments @("Saturdaze.Api.dll") `
        -WorkingDirectory $apiOutput `
        -StdOutPath (Join-Path $logsRoot "backend.out.log") `
        -StdErrPath (Join-Path $logsRoot "backend.err.log") `
        -Environment @{
            "ASPNETCORE_ENVIRONMENT" = "Development"
            "ASPNETCORE_URLS" = $backendUrl
            "SATURDAZE_CONNECTION" = $ConnectionString
        }

    $frontendProcess = Start-LoggedProcess `
        -Name "built frontend" `
        -FilePath $node `
        -Arguments @($httpServer, $frontendDist, "-p", "$FrontendPort", "-c-1", "--silent") `
        -WorkingDirectory $frontendRoot `
        -StdOutPath (Join-Path $logsRoot "frontend.out.log") `
        -StdErrPath (Join-Path $logsRoot "frontend.err.log")

    Wait-ForHttp -Name "Backend API" -Uri "$backendUrl/swagger/index.html" -Process $apiProcess
    Wait-ForHttp -Name "Built frontend" -Uri $frontendUrl -Process $frontendProcess

    Write-Host ""
    Write-Host "Frontend URL: $frontendUrl"
    Write-Host "Backend Swagger: $backendUrl/swagger"
    Write-Host "Logs: $logsRoot"
    Write-Host "Press Ctrl+C to stop both processes."

    if ($OpenBrowser) {
        Start-Process -FilePath $frontendUrl | Out-Null
    }

    while ($true) {
        if ($apiProcess.HasExited) {
            throw "Backend API exited. Exit code: $($apiProcess.ExitCode)"
        }

        if ($frontendProcess.HasExited) {
            throw "Frontend server exited. Exit code: $($frontendProcess.ExitCode)"
        }

        Start-Sleep -Seconds 2
    }
}
finally {
    Stop-StartedProcess -Process $frontendProcess -Name "built frontend"
    Stop-StartedProcess -Process $apiProcess -Name "backend API"
}
