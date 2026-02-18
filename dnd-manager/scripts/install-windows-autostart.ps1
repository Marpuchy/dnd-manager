[CmdletBinding()]
param(
    [string]$TaskName = "DndManager-AI-Web-Autostart",
    [ValidateSet("start", "dev")]
    [string]$WebMode = "start",
    [ValidateSet("auto", "task", "startup")]
    [string]$InstallMode = "auto",
    [switch]$RunNow
)

$ErrorActionPreference = "Stop"

$startScript = (Resolve-Path (Join-Path $PSScriptRoot "start-local-ai-web.ps1")).Path
$launcherCommand = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$startScript`" -WebMode $WebMode"
$startupDir = [Environment]::GetFolderPath("Startup")
$safeName = ($TaskName -replace "[^a-zA-Z0-9-_]", "_")
$startupVbs = Join-Path $startupDir "$safeName.vbs"

function Install-TaskScheduler {
    $createArgs = @(
        "/Create",
        "/TN", $TaskName,
        "/SC", "ONLOGON",
        "/RL", "LIMITED",
        "/F",
        "/TR", $launcherCommand
    )

    & schtasks.exe $createArgs | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Could not create scheduled task '$TaskName'."
    }

    if ($RunNow) {
        & schtasks.exe /Run /TN $TaskName | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Scheduled task '$TaskName' was created but could not be started."
        }
    }

    Write-Output "Autostart mode: task scheduler"
    Write-Output "Scheduled task configured: $TaskName"
    & schtasks.exe /Query /TN $TaskName /FO LIST
}

function Install-StartupLauncher {
    $escapedCommand = $launcherCommand.Replace("""", """""")
    $vbsContent = @(
        "Set WshShell = CreateObject(""WScript.Shell"")",
        "WshShell.Run ""$escapedCommand"", 0, False"
    ) -join [Environment]::NewLine

    Set-Content -LiteralPath $startupVbs -Value $vbsContent -Encoding ASCII

    if ($RunNow) {
        Start-Process -FilePath "wscript.exe" -ArgumentList "`"$startupVbs`"" -WindowStyle Hidden | Out-Null
    }

    Write-Output "Autostart mode: startup folder"
    Write-Output "Launcher created: $startupVbs"
}

if ($InstallMode -eq "task") {
    Install-TaskScheduler
    return
}

if ($InstallMode -eq "startup") {
    Install-StartupLauncher
    return
}

try {
    Install-TaskScheduler
} catch {
    Write-Warning "$($_.Exception.Message) Falling back to Startup folder."
    Install-StartupLauncher
}
