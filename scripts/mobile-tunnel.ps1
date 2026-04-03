param(
  [int]$Port = 5173
)

$ErrorActionPreference = 'Stop'

function Test-PortListening {
  param([int]$TargetPort)
  $connection = Get-NetTCPConnection -LocalPort $TargetPort -State Listen -ErrorAction SilentlyContinue |
    Select-Object -First 1
  return $null -ne $connection
}

function Resolve-CloudflaredPath {
  param([string]$RepoRootPath)

  $portablePath = Join-Path $RepoRootPath 'tools\cloudflared.exe'
  if (Test-Path $portablePath) {
    return $portablePath
  }

  $cmd = Get-Command cloudflared -ErrorAction SilentlyContinue
  if ($null -ne $cmd) {
    return $cmd.Source
  }

  $wingetPackages = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages'
  if (Test-Path $wingetPackages) {
    $found = Get-ChildItem -Path $wingetPackages -Recurse -Filter cloudflared.exe -ErrorAction SilentlyContinue |
      Select-Object -First 1
    if ($null -ne $found) {
      return $found.FullName
    }
  }

  New-Item -ItemType Directory -Path (Join-Path $RepoRootPath 'tools') -Force | Out-Null
  Write-Host 'Downloading cloudflared portable binary...'
  & curl.exe -L 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -o $portablePath | Out-Null

  if (Test-Path $portablePath) {
    return $portablePath
  }

  throw 'Could not resolve cloudflared path.'
}

function Stop-TrackedProcess {
  param(
    [string]$PidFile,
    [string]$Label
  )

  if (-not (Test-Path $PidFile)) {
    return
  }

  $raw = (Get-Content -Path $PidFile -Raw).Trim()
  if ([string]::IsNullOrWhiteSpace($raw)) {
    Remove-Item -LiteralPath $PidFile -Force
    return
  }

  $pidValue = 0
  if (-not [int]::TryParse($raw, [ref]$pidValue)) {
    Remove-Item -LiteralPath $PidFile -Force
    return
  }

  $proc = Get-Process -Id $pidValue -ErrorAction SilentlyContinue
  if ($null -ne $proc) {
    Stop-Process -Id $pidValue -Force
    Write-Host "Stopped previous $Label process (PID $pidValue)."
  }

  Remove-Item -LiteralPath $PidFile -Force
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$frontendDir = Join-Path $repoRoot 'frontend'
$stateDir = Join-Path $frontendDir '.mobile-tunnel'

New-Item -ItemType Directory -Path $stateDir -Force | Out-Null

$vitePidFile = Join-Path $stateDir 'vite.pid'
$viteOutLog = Join-Path $stateDir 'vite.out.log'
$viteErrLog = Join-Path $stateDir 'vite.err.log'
$cloudPidFile = Join-Path $stateDir 'cloudflared.pid'
$cloudLog = Join-Path $stateDir 'cloudflared.log'
$urlFile = Join-Path $stateDir 'public-url.txt'

if (-not (Test-PortListening -TargetPort $Port)) {
  Write-Host "Starting Vite dev server on port $Port..."

  if (Test-Path $viteOutLog) { Remove-Item -LiteralPath $viteOutLog -Force }
  if (Test-Path $viteErrLog) { Remove-Item -LiteralPath $viteErrLog -Force }

  $viteProc = Start-Process -FilePath 'npm.cmd' `
    -ArgumentList @('run', 'dev', '--', '--host', '0.0.0.0', '--port', $Port, '--strictPort') `
    -WorkingDirectory $frontendDir `
    -RedirectStandardOutput $viteOutLog `
    -RedirectStandardError $viteErrLog `
    -PassThru

  Set-Content -Path $vitePidFile -Value $viteProc.Id

  $isUp = $false
  for ($i = 0; $i -lt 45; $i++) {
    Start-Sleep -Seconds 1
    if (Test-PortListening -TargetPort $Port) {
      $isUp = $true
      break
    }
  }

  if (-not $isUp) {
    throw "Vite did not start on port $Port. Check $viteErrLog."
  }
} else {
  Write-Host "Vite already running on port $Port. Reusing current server."
}

Stop-TrackedProcess -PidFile $cloudPidFile -Label 'cloudflared'

if (Test-Path $cloudLog) { Remove-Item -LiteralPath $cloudLog -Force }

$cloudflaredPath = Resolve-CloudflaredPath -RepoRootPath $repoRoot
Write-Host "Using cloudflared: $cloudflaredPath"

$cloudProc = Start-Process -FilePath $cloudflaredPath `
  -ArgumentList @(
    'tunnel',
    '--url', "http://localhost:$Port",
    '--http-host-header', "localhost:$Port",
    '--no-autoupdate',
    '--logfile', $cloudLog
  ) `
  -PassThru `
  -WindowStyle Hidden

Set-Content -Path $cloudPidFile -Value $cloudProc.Id

$publicUrl = $null
for ($i = 0; $i -lt 60; $i++) {
  Start-Sleep -Seconds 1
  if (-not (Test-Path $cloudLog)) {
    continue
  }

  $logText = Get-Content -Path $cloudLog -Raw -ErrorAction SilentlyContinue
  $match = [regex]::Match($logText, 'https:\/\/[a-z0-9-]+\.trycloudflare\.com')
  if ($match.Success) {
    $publicUrl = $match.Value
    break
  }
}

if ([string]::IsNullOrWhiteSpace($publicUrl)) {
  throw "Could not get public URL. Check $cloudLog."
}

Set-Content -Path $urlFile -Value $publicUrl
try {
  Set-Clipboard -Value $publicUrl
} catch {
}

Write-Host ''
Write-Host 'Mobile test URL (copied to clipboard):'
Write-Host $publicUrl
Write-Host ''
Write-Host 'To stop only the tunnel:'
Write-Host '  npm run mobile:stop'
