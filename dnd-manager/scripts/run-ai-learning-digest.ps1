[CmdletBinding()]
param(
    [ValidateSet("weekly", "daily")]
    [string]$Frequency = "weekly",
    [string]$SendEmail = "true",
    [string]$BaseUrl = ""
)

$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$logDir = Join-Path $projectRoot "logs"
$logFile = Join-Path $logDir "ai-learning-digest.log"

New-Item -ItemType Directory -Path $logDir -Force | Out-Null

$nodeCommand = (Get-Command node.exe -ErrorAction SilentlyContinue)
if (-not $nodeCommand) {
    $nodeCommand = Get-Command node -ErrorAction Stop
}

$sendEmailNormalized = switch ($SendEmail.ToLowerInvariant()) {
    "1" { "true"; break }
    "0" { "false"; break }
    "true" { "true"; break }
    "false" { "false"; break }
    "yes" { "true"; break }
    "no" { "false"; break }
    default { throw "Invalid -SendEmail value. Use true/false/1/0/yes/no." }
}

$scriptArgs = @(
    "scripts/run-ai-learning-digest.mjs",
    "--frequency=$Frequency",
    "--send-email=$sendEmailNormalized"
)

if ($BaseUrl) {
    $scriptArgs += "--base-url=$BaseUrl"
}

Push-Location $projectRoot
try {
    "[$(Get-Date -Format o)] Running AI learning digest ($Frequency, sendEmail=$sendEmailNormalized)" | Out-File -FilePath $logFile -Encoding utf8 -Append
    & $nodeCommand.Source $scriptArgs *>> $logFile
    if ($LASTEXITCODE -ne 0) {
        throw "Digest script failed with code $LASTEXITCODE. Check $logFile"
    }
    "[$(Get-Date -Format o)] AI learning digest finished OK" | Out-File -FilePath $logFile -Encoding utf8 -Append
} finally {
    Pop-Location
}
