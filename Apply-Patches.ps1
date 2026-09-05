param(
  [string]$InstallDirectory = (Join-Path $env:LOCALAPPDATA 'Programs\Clawd on Desk'),
  [string]$ThemeDirectory = (Join-Path $env:APPDATA 'clawd-on-desk\themes\edited-clawd'),
  [switch]$CheckOnly
)
$ErrorActionPreference = 'Stop'
$exePath = Join-Path $InstallDirectory 'Clawd on Desk.exe'
$archivePath = Join-Path $InstallDirectory 'resources\app.asar'
if (!(Test-Path -LiteralPath $archivePath)) { throw "Clawd archive not found: $archivePath" }
if (!(Test-Path -LiteralPath $exePath)) { throw "Clawd executable not found: $exePath" }
Get-Command node -ErrorAction Stop | Out-Null
$patches = @('apply-patch.js', 'apply-idle-patch.js')
foreach ($patch in $patches) {
  & node (Join-Path $PSScriptRoot "patches\$patch") $InstallDirectory --check
  if ($LASTEXITCODE -ne 0) { throw "Compatibility check failed: $patch. No changes applied." }
}
if ($CheckOnly) { Write-Host 'Both patches are compatible. No changes applied.'; return }
$backupDir = Join-Path $PSScriptRoot ('backups\bundle-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff'))
New-Item -ItemType Directory -Path $backupDir | Out-Null
Copy-Item -LiteralPath $archivePath -Destination (Join-Path $backupDir 'app.asar')
$hadTheme = Test-Path -LiteralPath $ThemeDirectory
if ($hadTheme) { Copy-Item -LiteralPath $ThemeDirectory -Destination (Join-Path $backupDir 'theme') -Recurse }
@{ installDirectory = $InstallDirectory; themeDirectory = $ThemeDirectory; hadTheme = $hadTheme } | ConvertTo-Json | Set-Content (Join-Path $backupDir 'restore-info.json') -Encoding utf8
Get-Process | Where-Object { $_.Path -eq $exePath } | Stop-Process -Force
try {
  foreach ($patch in $patches) {
    & node (Join-Path $PSScriptRoot "patches\$patch") $InstallDirectory
    if ($LASTEXITCODE -ne 0) { throw "Patch failed: $patch" }
  }
  New-Item -ItemType Directory -Path $ThemeDirectory -Force | Out-Null
  Copy-Item -Path (Join-Path $PSScriptRoot 'themes\edited-clawd\*') -Destination $ThemeDirectory -Recurse -Force
} catch {
  Copy-Item -LiteralPath (Join-Path $backupDir 'app.asar') -Destination $archivePath -Force
  if ($hadTheme) { Copy-Item -Path (Join-Path $backupDir 'theme\*') -Destination $ThemeDirectory -Recurse -Force }
  throw "Installation failed; original archive restored. Backup: $backupDir. $($_.Exception.Message)"
}
Start-Process -FilePath $exePath -WindowStyle Hidden
Write-Host "Applied. Select Edited.clawd in Clawd settings if needed. Backup: $backupDir"
