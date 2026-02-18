[CmdletBinding()]
param(
    [ValidateSet("start", "dev")]
    [string]$WebMode = "start"
)

$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$logDir = Join-Path $projectRoot "logs"
$webLog = Join-Path $logDir "autostart-web.log"
$buildLog = Join-Path $logDir "autostart-build.log"

New-Item -ItemType Directory -Path $logDir -Force | Out-Null

function Test-PortListening {
    param(
        [Parameter(Mandatory = $true)]
        [int]$Port
    )

    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $async = $client.BeginConnect("127.0.0.1", $Port, $null, $null)
        $connectedInTime = $async.AsyncWaitHandle.WaitOne(250)
        if (-not $connectedInTime) {
            return $false
        }

        $client.EndConnect($async)
        return $true
    } catch {
        return $false
    } finally {
        $client.Dispose()
    }
}

function Wait-PortListening {
    param(
        [Parameter(Mandatory = $true)]
        [int]$Port,
        [Parameter(Mandatory = $true)]
        [int]$TimeoutSeconds
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        if (Test-PortListening -Port $Port) {
            return $true
        }
        Start-Sleep -Milliseconds 500
    }
    return $false
}

function Ensure-OllamaServer {
    if (Test-PortListening -Port 11434) {
        Write-Output "[autostart] Ollama already listening on 11434."
        return
    }

    $ollamaCommand = Get-Command ollama -ErrorAction Stop
    Start-Process -FilePath $ollamaCommand.Source -ArgumentList "serve" -WindowStyle Hidden | Out-Null

    if (-not (Wait-PortListening -Port 11434 -TimeoutSeconds 30)) {
        throw "Ollama did not start on port 11434."
    }

    Write-Output "[autostart] Ollama started."
}

function Ensure-WebServer {
    param(
        [Parameter(Mandatory = $true)]
        [ValidateSet("start", "dev")]
        [string]$Mode
    )

    if (Test-PortListening -Port 3000) {
        Write-Output "[autostart] Web app already listening on 3000."
        return
    }

    $npmCommand = (Get-Command npm.cmd -ErrorAction SilentlyContinue)
    if (-not $npmCommand) {
        $npmCommand = Get-Command npm -ErrorAction Stop
    }

    if ($Mode -eq "start") {
        $buildMarker = Join-Path $projectRoot ".next\\BUILD_ID"
        $needsBuild = -not (Test-Path -LiteralPath $buildMarker)
        if (-not $needsBuild) {
            $buildTime = (Get-Item -LiteralPath $buildMarker).LastWriteTimeUtc
            $pathsToWatch = @(
                (Join-Path $projectRoot "src"),
                (Join-Path $projectRoot "public"),
                (Join-Path $projectRoot ".env.local"),
                (Join-Path $projectRoot "next.config.ts"),
                (Join-Path $projectRoot "package.json")
            )

            foreach ($watchPath in $pathsToWatch) {
                if (-not (Test-Path -LiteralPath $watchPath)) {
                    continue
                }

                $item = Get-Item -LiteralPath $watchPath
                $latestTime = $item.LastWriteTimeUtc

                if ($item.PSIsContainer) {
                    $latestFile = Get-ChildItem -Path $watchPath -Recurse -File -ErrorAction SilentlyContinue |
                        Sort-Object LastWriteTimeUtc -Descending |
                        Select-Object -First 1
                    if ($latestFile) {
                        $latestTime = $latestFile.LastWriteTimeUtc
                    }
                }

                if ($latestTime -gt $buildTime) {
                    $needsBuild = $true
                    break
                }
            }
        }

        if ($needsBuild) {
            Write-Output "[autostart] Build outdated or missing. Running npm run build."
            & $npmCommand.Source run build *>> $buildLog
            if ($LASTEXITCODE -ne 0) {
                throw "npm run build failed. Check $buildLog."
            }
        }
    }

    $runCommand = if ($Mode -eq "dev") { "npm run dev" } else { "npm run start" }
    $cmdArgs = "/c $runCommand >> `"$webLog`" 2>&1"

    Start-Process -FilePath "cmd.exe" -ArgumentList $cmdArgs -WorkingDirectory $projectRoot -WindowStyle Hidden | Out-Null

    if (-not (Wait-PortListening -Port 3000 -TimeoutSeconds 45)) {
        throw "Web app did not start on port 3000. Check $webLog."
    }

    Write-Output "[autostart] Web app started in '$Mode' mode."
}

$effectiveMode = if ($env:DND_WEB_MODE -eq "dev") { "dev" } else { $WebMode }

Ensure-OllamaServer
Ensure-WebServer -Mode $effectiveMode

Write-Output "[autostart] Ready. Ollama and web app are running."
