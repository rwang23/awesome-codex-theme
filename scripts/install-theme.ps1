[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^[a-z0-9]+(?:-[a-z0-9]+)*$')]
  [string]$Theme,

  [ValidateSet('light', 'dark')]
  [string]$Mode = 'dark',

  [string]$BaseUrl,

  [string]$SourceRoot,

  [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Assert-SafeRelativePath {
  param([Parameter(Mandatory = $true)][string]$Value)

  if ([IO.Path]::IsPathRooted($Value) -or $Value.Contains('\') -or $Value.Contains(':')) {
    throw "Registry path is not a safe relative path: $Value"
  }
  if (($Value -split '/') -contains '..') {
    throw "Registry path escapes the distribution root: $Value"
  }
}

function Assert-NoReparsePoint {
  param([Parameter(Mandatory = $true)][string]$Path)

  if (Test-Path -LiteralPath $Path) {
    $item = Get-Item -LiteralPath $Path -Force
    if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
      throw "Refusing to write through a reparse point: $Path"
    }
  }
}

function Get-Sha256 {
  param([Parameter(Mandatory = $true)][string]$Path)

  $stream = [IO.File]::OpenRead($Path)
  $algorithm = [Security.Cryptography.SHA256]::Create()
  try {
    $bytes = $algorithm.ComputeHash($stream)
    return (($bytes | ForEach-Object { $_.ToString('x2') }) -join '')
  }
  finally {
    $algorithm.Dispose()
    $stream.Dispose()
  }
}

if ([string]::IsNullOrWhiteSpace($BaseUrl) -eq [string]::IsNullOrWhiteSpace($SourceRoot)) {
  throw 'Provide exactly one of -BaseUrl or -SourceRoot.'
}

$temporaryRoot = [IO.Path]::GetTempPath()
$temporaryDirectory = Join-Path $temporaryRoot ('awesome-codex-theme-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $temporaryDirectory | Out-Null

try {
  $registryFile = Join-Path $temporaryDirectory 'registry.json'

  if ($SourceRoot) {
    $resolvedSourceRoot = [IO.Path]::GetFullPath($SourceRoot)
    if (-not (Test-Path -LiteralPath $resolvedSourceRoot -PathType Container)) {
      throw "Source root does not exist: $resolvedSourceRoot"
    }
    Copy-Item -LiteralPath (Join-Path $resolvedSourceRoot 'themes\registry.json') -Destination $registryFile
  }
  else {
    $baseUri = [Uri]$BaseUrl
    $isLoopbackHttp = $baseUri.Scheme -eq 'http' -and $baseUri.IsLoopback
    if ($baseUri.Scheme -ne 'https' -and -not $isLoopbackHttp) {
      throw 'Remote installs require HTTPS. Plain HTTP is allowed only for loopback development.'
    }
    $registryUri = [Uri]::new(($BaseUrl.TrimEnd('/') + '/themes/registry.json'))
    Invoke-WebRequest -Uri $registryUri -OutFile $registryFile -UseBasicParsing
  }

  $registry = Get-Content -LiteralPath $registryFile -Raw -Encoding UTF8 | ConvertFrom-Json
  if ($registry.standard -ne 'act-theme-pack-v1') {
    throw "Unsupported registry standard: $($registry.standard)"
  }

  $themeRecord = @($registry.themes | Where-Object { $_.id -eq $Theme })
  if ($themeRecord.Count -ne 1) {
    throw "Theme '$Theme' was not found exactly once in the registry."
  }
  $themeRecord = $themeRecord[0]
  $modeRecord = $themeRecord.previews.PSObject.Properties[$Mode].Value
  $bundleRecord = $modeRecord.adapterBundle
  Assert-SafeRelativePath -Value $bundleRecord.path

  $bundleFile = Join-Path $temporaryDirectory 'adapter.zip'
  if ($SourceRoot) {
    $bundleSource = Join-Path $resolvedSourceRoot ($bundleRecord.path -replace '/', '\')
    Copy-Item -LiteralPath $bundleSource -Destination $bundleFile
  }
  else {
    $bundleUri = [Uri]::new(($BaseUrl.TrimEnd('/') + '/' + $bundleRecord.path))
    Invoke-WebRequest -Uri $bundleUri -OutFile $bundleFile -UseBasicParsing
  }

  $bundleLength = (Get-Item -LiteralPath $bundleFile).Length
  if ($bundleLength -ne [int64]$bundleRecord.bytes) {
    throw "Adapter bundle byte count mismatch. Expected $($bundleRecord.bytes), got $bundleLength."
  }
  if ((Get-Sha256 -Path $bundleFile) -ne $bundleRecord.sha256) {
    throw 'Adapter bundle SHA-256 mismatch.'
  }

  $expandedDirectory = Join-Path $temporaryDirectory 'expanded'
  Expand-Archive -LiteralPath $bundleFile -DestinationPath $expandedDirectory
  $dreamSkinDirectory = Join-Path $expandedDirectory 'dream-skin'
  $themeFile = Join-Path $dreamSkinDirectory 'theme.json'
  $backgroundFile = Join-Path $dreamSkinDirectory 'background.png'

  $dreamTheme = Get-Content -LiteralPath $themeFile -Raw -Encoding UTF8 | ConvertFrom-Json
  $expectedId = "act-$Theme-$Mode"
  if ($dreamTheme.schemaVersion -ne 1 -or $dreamTheme.id -ne $expectedId) {
    throw 'Dream Skin manifest identity does not match the selected theme.'
  }
  if ($dreamTheme.image -ne 'background.png' -or $dreamTheme.appearance -ne $Mode) {
    throw 'Dream Skin manifest image or appearance mode is invalid.'
  }
  if ((Get-Sha256 -Path $backgroundFile) -ne $modeRecord.assetSha256) {
    throw 'Dream Skin background SHA-256 mismatch.'
  }
  if ((Get-Item -LiteralPath $backgroundFile).Length -ne [int64]$modeRecord.assetBytes) {
    throw 'Dream Skin background byte count mismatch.'
  }

  if ($DryRun) {
    Write-Output "Verified $Theme ($Mode) without writing user state."
    return
  }

  $localAppData = [Environment]::GetFolderPath([Environment+SpecialFolder]::LocalApplicationData)
  if ([string]::IsNullOrWhiteSpace($localAppData)) {
    throw 'Could not resolve LOCALAPPDATA.'
  }
  $installRoot = Join-Path $localAppData 'CodexDreamSkin\themes'
  $targetDirectory = Join-Path $installRoot $expectedId
  $resolvedInstallRoot = [IO.Path]::GetFullPath($installRoot)
  $resolvedTarget = [IO.Path]::GetFullPath($targetDirectory)
  if (-not $resolvedTarget.StartsWith($resolvedInstallRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'Resolved install target escapes the Dream Skin library.'
  }

  New-Item -ItemType Directory -Path $installRoot -Force | Out-Null
  Assert-NoReparsePoint -Path $installRoot
  Assert-NoReparsePoint -Path $targetDirectory
  New-Item -ItemType Directory -Path $targetDirectory -Force | Out-Null

  $stagedBackground = Join-Path $targetDirectory 'background.png.new'
  $stagedTheme = Join-Path $targetDirectory 'theme.json.new'
  Copy-Item -LiteralPath $backgroundFile -Destination $stagedBackground -Force
  Copy-Item -LiteralPath $themeFile -Destination $stagedTheme -Force
  Move-Item -LiteralPath $stagedBackground -Destination (Join-Path $targetDirectory 'background.png') -Force
  Move-Item -LiteralPath $stagedTheme -Destination (Join-Path $targetDirectory 'theme.json') -Force

  Write-Output "Installed $Theme ($Mode) to $targetDirectory"
  Write-Output 'Open Codex Dream Skin and select the newly installed theme.'
}
finally {
  $resolvedTemporaryDirectory = [IO.Path]::GetFullPath($temporaryDirectory)
  $resolvedTemporaryRoot = [IO.Path]::GetFullPath($temporaryRoot)
  if ($resolvedTemporaryDirectory.StartsWith($resolvedTemporaryRoot, [StringComparison]::OrdinalIgnoreCase)) {
    Remove-Item -LiteralPath $resolvedTemporaryDirectory -Recurse -Force -ErrorAction SilentlyContinue
  }
}
