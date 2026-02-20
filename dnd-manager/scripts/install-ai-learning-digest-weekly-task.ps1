[CmdletBinding()]
param(
    [string]$TaskName = "DndManager-AI-Learning-Digest-Weekly",
    [ValidateSet("MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN")]
    [string]$Day = "MON",
    [string]$Time = "09:00",
    [switch]$RunNow
)

$ErrorActionPreference = "Stop"

if ($Time -notmatch "^(?:[01]\d|2[0-3]):[0-5]\d$") {
    throw "Invalid -Time. Use HH:mm in 24h format (example: 09:00)."
}

$runnerScript = (Resolve-Path (Join-Path $PSScriptRoot "run-ai-learning-digest.ps1")).Path
$launcherCommand = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$runnerScript`" -Frequency weekly -SendEmail true"

$createArgs = @(
    "/Create",
    "/TN", $TaskName,
    "/SC", "WEEKLY",
    "/D", $Day,
    "/ST", $Time,
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

Write-Output "Weekly digest task configured: $TaskName"
Write-Output "Schedule: $Day at $Time"
& schtasks.exe /Query /TN $TaskName /FO LIST
