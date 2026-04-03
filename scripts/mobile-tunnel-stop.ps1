param(
  [switch]$StopFrontend
)

$ErrorActionPreference = 'Stop'

function Stop-TrackedProcess {
  param(
    [string]$PidFile,
    [string]$Label
  )

  if (-not (Test-Path $PidFile)) {
    Write-Host "No tracked $Label process."
    return
  }

  $raw = (Get-Content -Path $PidFile -Raw).Trim()
  if ([string]::IsNullOrWhiteSpace($raw)) {
    Remove-Item -LiteralPath $PidFile -Force
    Write-Host "Removed empty $Label PID file."
    return
  }

  $pidValue = 0
  if (-not [int]::TryParse($raw, [ref]$pidValue)) {
    Remove-Item -LiteralPath $PidFile -Force
    Write-Host "Removed invalid $Label PID file."
    return
  }

  $proc = Get-Process -Id $pidValue -ErrorAction SilentlyContinue
  if ($null -eq $proc) {
    Write-Host "$Label process (PID $pidValue) is not running."
    Remove-Item -LiteralPath $PidFile -Force
    return
  }

  Stop-Process -Id $pidValue -Force
  Remove-Item -LiteralPath $PidFile -Force
  Write-Host "Stopped $Label process (PID $pidValue)."
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$stateDir = Join-Path $repoRoot 'frontend\.mobile-tunnel'

$cloudPidFile = Join-Path $stateDir 'cloudflared.pid'
$vitePidFile = Join-Path $stateDir 'vite.pid'

Stop-TrackedProcess -PidFile $cloudPidFile -Label 'cloudflared'

if ($StopFrontend) {
  Stop-TrackedProcess -PidFile $vitePidFile -Label 'vite'
} else {
  Write-Host 'Frontend kept running. Use -StopFrontend if you want to stop vite too.'
}
