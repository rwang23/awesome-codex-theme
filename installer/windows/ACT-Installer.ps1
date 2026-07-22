[CmdletBinding()]
param(
  [string]$RegistryPath = "",
  [switch]$HeadlessValidate
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Read-ACTUtf8 {
  param([Parameter(Mandatory = $true)][string]$Path)

  $resolved = (Resolve-Path -LiteralPath $Path -ErrorAction Stop).Path
  $bytes = [System.IO.File]::ReadAllBytes($resolved)
  $encoding = New-Object System.Text.UTF8Encoding($false, $true)
  return $encoding.GetString($bytes)
}

function Read-ACTJson {
  param([Parameter(Mandatory = $true)][string]$Path)
  return Read-ACTUtf8 -Path $Path | ConvertFrom-Json
}

function Get-ACTSha256 {
  param([Parameter(Mandatory = $true)][byte[]]$Bytes)

  $algorithm = [System.Security.Cryptography.SHA256]::Create()
  try {
    $hash = $algorithm.ComputeHash($Bytes)
    return -join @($hash | ForEach-Object { $_.ToString("x2") })
  } finally {
    $algorithm.Dispose()
  }
}

function Assert-ACTExactKeys {
  param(
    [Parameter(Mandatory = $true)]$Value,
    [Parameter(Mandatory = $true)][string[]]$Expected,
    [Parameter(Mandatory = $true)][string]$Label
  )

  if ($null -eq $Value) {
    throw "$Label is missing."
  }
  $actual = @($Value.PSObject.Properties.Name | Sort-Object)
  $allowed = @($Expected | Sort-Object)
  if (($actual -join "|") -cne ($allowed -join "|")) {
    throw "$Label contains unexpected fields."
  }
}

function ConvertFrom-ACTNativeTheme {
  param(
    [Parameter(Mandatory = $true)][string]$Value,
    [Parameter(Mandatory = $true)][ValidateSet("light", "dark")][string]$Mode
  )

  $prefix = "codex-theme-v1:"
  $inputValue = $Value.Trim()
  if (-not $inputValue.StartsWith($prefix, [System.StringComparison]::Ordinal)) {
    throw "The native theme prefix is invalid."
  }
  $payloadText = $inputValue.Substring($prefix.Length)
  if (-not $payloadText.StartsWith("{", [System.StringComparison]::Ordinal)) {
    $payloadText = [System.Uri]::UnescapeDataString($payloadText)
  }
  $payload = $payloadText | ConvertFrom-Json

  Assert-ACTExactKeys -Value $payload -Expected @("codeThemeId", "theme", "variant") -Label "Native theme payload"
  if ($payload.codeThemeId -cne "codex" -or $payload.variant -cne $Mode) {
    throw "The native theme identity or mode is invalid."
  }

  Assert-ACTExactKeys -Value $payload.theme `
    -Expected @("accent", "contrast", "fonts", "ink", "opaqueWindows", "semanticColors", "surface") `
    -Label "Native theme configuration"
  Assert-ACTExactKeys -Value $payload.theme.fonts -Expected @("code", "ui") -Label "Native theme fonts"
  Assert-ACTExactKeys -Value $payload.theme.semanticColors `
    -Expected @("diffAdded", "diffRemoved", "skill") `
    -Label "Native theme semantic colors"

  $hex = "^#[0-9A-Fa-f]{6}$"
  foreach ($color in @(
    $payload.theme.accent,
    $payload.theme.ink,
    $payload.theme.surface,
    $payload.theme.semanticColors.diffAdded,
    $payload.theme.semanticColors.diffRemoved,
    $payload.theme.semanticColors.skill
  )) {
    if ("$color" -notmatch $hex) {
      throw "The native theme contains an invalid color."
    }
  }
  $contrast = [int]$payload.theme.contrast
  if ($contrast -lt 0 -or $contrast -gt 100) {
    throw "The native theme contrast is outside the supported range."
  }
  if ($null -ne $payload.theme.fonts.code -or $null -ne $payload.theme.fonts.ui) {
    throw "Portable ACT themes must leave font slots unset."
  }
  if ($payload.theme.opaqueWindows -ne $true) {
    throw "ACT release themes must use opaque windows."
  }
  return $payload
}

function Assert-ACTRegistry {
  param([Parameter(Mandatory = $true)]$Registry)

  if ($Registry.schemaVersion -ne 1 -or $Registry.standard -cne "act-theme-pack-v1") {
    throw "The Registry contract is not supported."
  }
  $themes = @($Registry.themes)
  if ($themes.Count -lt 1) {
    throw "The Registry does not contain any themes."
  }

  $ids = @{}
  $nativeCount = 0
  $utf8 = New-Object System.Text.UTF8Encoding($false)
  foreach ($theme in $themes) {
    if ("$($theme.id)" -notmatch "^[a-z0-9]+(?:-[a-z0-9]+)*$") {
      throw "The Registry contains an invalid theme id."
    }
    if ($ids.ContainsKey("$($theme.id)")) {
      throw "The Registry contains a duplicate theme id."
    }
    $ids["$($theme.id)"] = $true
    if ([string]::IsNullOrWhiteSpace("$($theme.name.'zh-CN')") -or
        [string]::IsNullOrWhiteSpace("$($theme.name.en)") -or
        [string]::IsNullOrWhiteSpace("$($theme.tagline.'zh-CN')") -or
        [string]::IsNullOrWhiteSpace("$($theme.tagline.en)")) {
      throw "Theme $($theme.id) is missing bilingual display copy."
    }
    $exportKeys = @($theme.exports.PSObject.Properties.Name | Sort-Object)
    $expectedExports = @("codex-full-skin", "codex-native")
    if (($exportKeys -join "|") -cne ($expectedExports -join "|")) {
      throw "Theme $($theme.id) declares an unsupported export set."
    }

    foreach ($mode in @("light", "dark")) {
      $record = $theme.previews.$mode.nativeTheme
      if ($record.format -cne "codex-theme-v1" -or
          [string]::IsNullOrWhiteSpace("$($record.testedVersion)")) {
        throw "Theme $($theme.id) has an invalid native export record."
      }
      $null = ConvertFrom-ACTNativeTheme -Value "$($record.value)" -Mode $mode
      $nativeBytes = $utf8.GetBytes("$($record.value)`n")
      if ([int64]$record.bytes -ne $nativeBytes.Length) {
        throw "Theme $($theme.id) $mode has a native byte-count mismatch."
      }
      if ("$($record.sha256)" -cne (Get-ACTSha256 -Bytes $nativeBytes)) {
        throw "Theme $($theme.id) $mode has a native hash mismatch."
      }
      $nativeCount += 1
    }
  }

  return [pscustomobject]@{
    Themes = $themes.Count
    NativeThemes = $nativeCount
  }
}

function Get-ACTPackageTargets {
  $definitions = @(
    [pscustomobject]@{
      Id = "stable"
      PackageName = "OpenAI.Codex"
      ExpectedExecutable = "app\ChatGPT.exe"
      Label = "ChatGPT"
    },
    [pscustomobject]@{
      Id = "beta"
      PackageName = "OpenAI.CodexBeta"
      ExpectedExecutable = "app\ChatGPT (Beta).exe"
      Label = "ChatGPT Beta"
    }
  )
  $targets = @()

  foreach ($definition in $definitions) {
    $package = Get-AppxPackage -Name $definition.PackageName -ErrorAction SilentlyContinue |
      Sort-Object Version -Descending |
      Select-Object -First 1
    if ($null -eq $package) {
      continue
    }
    $manifest = Get-AppxPackageManifest -Package $package -ErrorAction Stop
    $applications = @($manifest.Package.Applications.Application | Where-Object {
      "$($_.Executable)".Replace("/", "\") -ieq $definition.ExpectedExecutable
    })
    if ($applications.Count -ne 1) {
      continue
    }
    $applicationId = "$($applications[0].Id)"
    $family = "$($package.PackageFamilyName)"
    if ($family -notmatch "^[A-Za-z0-9._-]{1,128}$" -or
        $applicationId -notmatch "^[A-Za-z0-9._-]{1,64}$") {
      continue
    }
    $targets += [pscustomobject]@{
      Id = $definition.Id
      Display = "$($definition.Label)  $($package.Version)"
      AppUserModelId = "$family!$applicationId"
      PackageFullName = "$($package.PackageFullName)"
    }
  }
  return $targets
}

function Start-ACTPackageTarget {
  param([Parameter(Mandatory = $true)]$Target)

  $aumid = "$($Target.AppUserModelId)"
  if ($aumid -notmatch "^[A-Za-z0-9._-]{1,128}![A-Za-z0-9._-]{1,64}$") {
    throw "The selected ChatGPT package identity is invalid."
  }
  Start-Process -FilePath "explorer.exe" -ArgumentList @("shell:AppsFolder\$aumid")
}

if ([string]::IsNullOrWhiteSpace($RegistryPath)) {
  $RegistryPath = Join-Path $PSScriptRoot "registry.json"
}
$registry = Read-ACTJson -Path $RegistryPath
$validation = Assert-ACTRegistry -Registry $registry
$layout = [pscustomobject]@{
  RightPanelHeight = 535
  ActionY = 487
  ActionHeight = 36
}
if (($layout.ActionY + $layout.ActionHeight) -gt $layout.RightPanelHeight) {
  throw "The installer action row exceeds the right panel."
}

if ($HeadlessValidate) {
  [pscustomobject]@{
    status = "ok"
    themes = $validation.Themes
    nativeThemes = $validation.NativeThemes
    standard = "$($registry.standard)"
  } | ConvertTo-Json -Compress
  exit 0
}

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

$copyPath = Join-Path $PSScriptRoot "copy.json"
$copy = Read-ACTJson -Path $copyPath
$zh = $copy.'zh-CN'

function New-ACTFont {
  param([float]$Size, [System.Drawing.FontStyle]$Style = [System.Drawing.FontStyle]::Regular)
  return New-Object System.Drawing.Font("Microsoft YaHei UI", $Size, $Style)
}

function New-ACTLabel {
  param(
    [string]$Text,
    [int]$X,
    [int]$Y,
    [int]$Width,
    [int]$Height,
    [float]$Size = 10,
    [System.Drawing.FontStyle]$Style = [System.Drawing.FontStyle]::Regular
  )
  $label = New-Object System.Windows.Forms.Label
  $label.Text = $Text
  $label.Location = New-Object System.Drawing.Point($X, $Y)
  $label.Size = New-Object System.Drawing.Size($Width, $Height)
  $label.Font = New-ACTFont -Size $Size -Style $Style
  $label.ForeColor = [System.Drawing.ColorTranslator]::FromHtml("#211E1A")
  return $label
}

$form = New-Object System.Windows.Forms.Form
$form.Text = "Awesome Codex Theme Installer"
$form.Size = New-Object System.Drawing.Size(1040, 720)
$form.MinimumSize = New-Object System.Drawing.Size(920, 720)
$form.StartPosition = [System.Windows.Forms.FormStartPosition]::CenterScreen
$form.BackColor = [System.Drawing.ColorTranslator]::FromHtml("#F2EEE6")
$form.AutoScaleMode = [System.Windows.Forms.AutoScaleMode]::Dpi

$header = New-Object System.Windows.Forms.Panel
$header.Dock = [System.Windows.Forms.DockStyle]::Top
$header.Height = 92
$header.BackColor = [System.Drawing.ColorTranslator]::FromHtml("#1E1B18")
$form.Controls.Add($header)

$title = New-ACTLabel -Text "$($zh.appTitle)" -X 28 -Y 16 -Width 520 -Height 36 -Size 20 -Style Bold
$title.ForeColor = [System.Drawing.ColorTranslator]::FromHtml("#FFF9F0")
$header.Controls.Add($title)
$subtitle = New-ACTLabel -Text "$($zh.appSubtitle)" -X 30 -Y 53 -Width 920 -Height 24 -Size 9
$subtitle.ForeColor = [System.Drawing.ColorTranslator]::FromHtml("#CFC5B8")
$header.Controls.Add($subtitle)

$left = New-Object System.Windows.Forms.Panel
$left.Location = New-Object System.Drawing.Point(24, 112)
$left.Size = New-Object System.Drawing.Size(310, 535)
$left.Anchor = [System.Windows.Forms.AnchorStyles]"Top,Bottom,Left"
$left.BackColor = [System.Drawing.ColorTranslator]::FromHtml("#E5DED2")
$form.Controls.Add($left)

$search = New-Object System.Windows.Forms.TextBox
$search.Location = New-Object System.Drawing.Point(16, 16)
$search.Size = New-Object System.Drawing.Size(278, 32)
$search.Font = New-ACTFont -Size 10
$search.BorderStyle = [System.Windows.Forms.BorderStyle]::FixedSingle
$left.Controls.Add($search)

$themeList = New-Object System.Windows.Forms.ListBox
$themeList.Location = New-Object System.Drawing.Point(16, 58)
$themeList.Size = New-Object System.Drawing.Size(278, 458)
$themeList.Anchor = [System.Windows.Forms.AnchorStyles]"Top,Bottom,Left,Right"
$themeList.Font = New-ACTFont -Size 10
$themeList.BorderStyle = [System.Windows.Forms.BorderStyle]::None
$themeList.BackColor = [System.Drawing.ColorTranslator]::FromHtml("#F7F3ED")
$themeList.ForeColor = [System.Drawing.ColorTranslator]::FromHtml("#211E1A")
$themeList.DisplayMember = "Display"
$themeList.IntegralHeight = $false
$left.Controls.Add($themeList)

$right = New-Object System.Windows.Forms.Panel
$right.Location = New-Object System.Drawing.Point(358, 112)
$right.Size = New-Object System.Drawing.Size(648, $layout.RightPanelHeight)
$right.Anchor = [System.Windows.Forms.AnchorStyles]"Top,Bottom,Left,Right"
$right.BackColor = [System.Drawing.ColorTranslator]::FromHtml("#FFFCF7")
$form.Controls.Add($right)

$collectionLabel = New-ACTLabel -Text "" -X 26 -Y 22 -Width 590 -Height 24 -Size 9 -Style Bold
$collectionLabel.ForeColor = [System.Drawing.ColorTranslator]::FromHtml("#B34B32")
$right.Controls.Add($collectionLabel)
$nameLabel = New-ACTLabel -Text "" -X 24 -Y 52 -Width 600 -Height 62 -Size 18 -Style Bold
$right.Controls.Add($nameLabel)
$taglineLabel = New-ACTLabel -Text "" -X 26 -Y 116 -Width 590 -Height 52 -Size 11
$taglineLabel.ForeColor = [System.Drawing.ColorTranslator]::FromHtml("#4F4942")
$right.Controls.Add($taglineLabel)
$descriptionLabel = New-ACTLabel -Text "" -X 26 -Y 174 -Width 590 -Height 58 -Size 9
$descriptionLabel.ForeColor = [System.Drawing.ColorTranslator]::FromHtml("#6F675E")
$right.Controls.Add($descriptionLabel)
$rightsLabel = New-ACTLabel -Text "" -X 26 -Y 235 -Width 590 -Height 24 -Size 8 -Style Bold
$rightsLabel.ForeColor = [System.Drawing.ColorTranslator]::FromHtml("#8A4B3C")
$right.Controls.Add($rightsLabel)

$paletteLabel = New-ACTLabel -Text "$($zh.palette)" -X 26 -Y 272 -Width 180 -Height 24 -Size 9 -Style Bold
$right.Controls.Add($paletteLabel)
$backgroundSwatch = New-Object System.Windows.Forms.Panel
$backgroundSwatch.Location = New-Object System.Drawing.Point(26, 300)
$backgroundSwatch.Size = New-Object System.Drawing.Size(176, 46)
$right.Controls.Add($backgroundSwatch)
$accentSwatch = New-Object System.Windows.Forms.Panel
$accentSwatch.Location = New-Object System.Drawing.Point(214, 300)
$accentSwatch.Size = New-Object System.Drawing.Size(176, 46)
$right.Controls.Add($accentSwatch)
$inkSwatch = New-Object System.Windows.Forms.Panel
$inkSwatch.Location = New-Object System.Drawing.Point(402, 300)
$inkSwatch.Size = New-Object System.Drawing.Size(176, 46)
$right.Controls.Add($inkSwatch)

$modeLabel = New-ACTLabel -Text "$($zh.mode)" -X 26 -Y 352 -Width 190 -Height 24 -Size 9 -Style Bold
$right.Controls.Add($modeLabel)
$modeBox = New-Object System.Windows.Forms.ComboBox
$modeBox.Location = New-Object System.Drawing.Point(26, 377)
$modeBox.Size = New-Object System.Drawing.Size(260, 32)
$modeBox.Font = New-ACTFont -Size 10
$modeBox.DropDownStyle = [System.Windows.Forms.ComboBoxStyle]::DropDownList
[void]$modeBox.Items.Add([pscustomobject]@{ Id = "light"; Display = "$($zh.light)" })
[void]$modeBox.Items.Add([pscustomobject]@{ Id = "dark"; Display = "$($zh.dark)" })
$modeBox.DisplayMember = "Display"
$modeBox.SelectedIndex = 0
$right.Controls.Add($modeBox)

$targetLabel = New-ACTLabel -Text "$($zh.target)" -X 318 -Y 352 -Width 260 -Height 24 -Size 9 -Style Bold
$right.Controls.Add($targetLabel)
$targetBox = New-Object System.Windows.Forms.ComboBox
$targetBox.Location = New-Object System.Drawing.Point(318, 377)
$targetBox.Size = New-Object System.Drawing.Size(260, 32)
$targetBox.Font = New-ACTFont -Size 10
$targetBox.DropDownStyle = [System.Windows.Forms.ComboBoxStyle]::DropDownList
$targetBox.DisplayMember = "Display"
$targets = @(Get-ACTPackageTargets)
foreach ($target in $targets) {
  [void]$targetBox.Items.Add($target)
}
if ($targetBox.Items.Count -gt 0) {
  $targetBox.SelectedIndex = 0
}
$right.Controls.Add($targetBox)

$noteLabel = New-ACTLabel -Text "$($zh.nativeNote)" -X 26 -Y 416 -Width 552 -Height 34 -Size 8
$noteLabel.ForeColor = [System.Drawing.ColorTranslator]::FromHtml("#6F675E")
$right.Controls.Add($noteLabel)

$statusLabel = New-ACTLabel -Text "$($zh.readyToChoose)" -X 26 -Y 454 -Width 552 -Height 24 -Size 9 -Style Bold
$statusLabel.ForeColor = [System.Drawing.ColorTranslator]::FromHtml("#286443")
$right.Controls.Add($statusLabel)

$copyButton = New-Object System.Windows.Forms.Button
$copyButton.Text = "$($zh.copyOnly)"
$copyButton.Location = New-Object System.Drawing.Point(26, $layout.ActionY)
$copyButton.Size = New-Object System.Drawing.Size(178, $layout.ActionHeight)
$copyButton.Font = New-ACTFont -Size 9 -Style Bold
$copyButton.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$copyButton.BackColor = [System.Drawing.ColorTranslator]::FromHtml("#E7DED1")
$copyButton.ForeColor = [System.Drawing.ColorTranslator]::FromHtml("#211E1A")
$copyButton.FlatAppearance.BorderSize = 0
$right.Controls.Add($copyButton)

$openButton = New-Object System.Windows.Forms.Button
$openButton.Text = "$($zh.copyAndOpen)"
$openButton.Location = New-Object System.Drawing.Point(216, $layout.ActionY)
$openButton.Size = New-Object System.Drawing.Size(362, $layout.ActionHeight)
$openButton.Font = New-ACTFont -Size 10 -Style Bold
$openButton.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$openButton.BackColor = [System.Drawing.ColorTranslator]::FromHtml("#C84C31")
$openButton.ForeColor = [System.Drawing.Color]::White
$openButton.FlatAppearance.BorderSize = 0
$right.Controls.Add($openButton)

$script:AllRows = @($registry.themes | ForEach-Object {
  [pscustomobject]@{
    Display = "$($_.name.'zh-CN')  /  $($_.name.en)"
    Search = ("$($_.id) $($_.name.'zh-CN') $($_.name.en) $($_.tagline.'zh-CN') $($_.tagline.en)").ToLowerInvariant()
    Theme = $_
  }
})
$script:SelectedTheme = $null

function Set-ACTThemeRows {
  param([string]$Query)

  $themeList.BeginUpdate()
  try {
    $themeList.Items.Clear()
    $needle = "$Query".Trim().ToLowerInvariant()
    foreach ($row in $script:AllRows) {
      if (-not $needle -or $row.Search.Contains($needle)) {
        [void]$themeList.Items.Add($row)
      }
    }
    if ($themeList.Items.Count -gt 0) {
      $themeList.SelectedIndex = 0
    }
  } finally {
    $themeList.EndUpdate()
  }
}

function Get-ACTSelectedMode {
  if ($null -eq $modeBox.SelectedItem) {
    return "light"
  }
  return "$($modeBox.SelectedItem.Id)"
}

function Update-ACTThemeView {
  if ($null -eq $themeList.SelectedItem) {
    $script:SelectedTheme = $null
    $nameLabel.Text = "$($zh.noResults)"
    $taglineLabel.Text = ""
    $descriptionLabel.Text = ""
    $copyButton.Enabled = $false
    $openButton.Enabled = $false
    return
  }

  $script:SelectedTheme = $themeList.SelectedItem.Theme
  $mode = Get-ACTSelectedMode
  $record = $script:SelectedTheme.previews.$mode.nativeTheme
  $payload = ConvertFrom-ACTNativeTheme -Value "$($record.value)" -Mode $mode
  $collectionLabel.Text = "$($script:SelectedTheme.collection)  /  $($script:SelectedTheme.variant)"
  $nameLabel.Text = "$($script:SelectedTheme.name.'zh-CN')`r`n$($script:SelectedTheme.name.en)"
  $taglineLabel.Text = "$($script:SelectedTheme.tagline.'zh-CN')`r`n$($script:SelectedTheme.tagline.en)"
  $descriptionLabel.Text = "$($script:SelectedTheme.description.'zh-CN')"
  $rightsLabel.Text = if ($script:SelectedTheme.rightsProfile -eq "fan-art") {
    "$($zh.fanArtNotice)"
  } else {
    "$($zh.originalNotice)"
  }
  $backgroundSwatch.BackColor = [System.Drawing.ColorTranslator]::FromHtml("$($payload.theme.surface)")
  $accentSwatch.BackColor = [System.Drawing.ColorTranslator]::FromHtml("$($payload.theme.accent)")
  $inkSwatch.BackColor = [System.Drawing.ColorTranslator]::FromHtml("$($payload.theme.ink)")
  $copyButton.Enabled = $true
  $openButton.Enabled = $targetBox.Items.Count -gt 0
  $statusLabel.Text = "$($zh.readyToCopy)"
}

function Copy-ACTSelectedTheme {
  if ($null -eq $script:SelectedTheme) {
    return $false
  }
  $mode = Get-ACTSelectedMode
  $record = $script:SelectedTheme.previews.$mode.nativeTheme
  $null = ConvertFrom-ACTNativeTheme -Value "$($record.value)" -Mode $mode
  [System.Windows.Forms.Clipboard]::SetText("$($record.value)")
  $statusLabel.Text = "$($zh.copied)"
  return $true
}

$search.Add_TextChanged({ Set-ACTThemeRows -Query $search.Text })
$themeList.Add_SelectedIndexChanged({ Update-ACTThemeView })
$modeBox.Add_SelectedIndexChanged({ Update-ACTThemeView })
$targetBox.Add_SelectedIndexChanged({ Update-ACTThemeView })
$copyButton.Add_Click({ $null = Copy-ACTSelectedTheme })
$openButton.Add_Click({
  if (-not (Copy-ACTSelectedTheme)) {
    return
  }
  if ($null -eq $targetBox.SelectedItem) {
    $statusLabel.Text = "$($zh.noTarget)"
    return
  }
  Start-ACTPackageTarget -Target $targetBox.SelectedItem
  $statusLabel.Text = "$($zh.opened)"
  [System.Windows.Forms.MessageBox]::Show(
    "$($zh.steps)",
    "$($zh.stepsTitle)",
    [System.Windows.Forms.MessageBoxButtons]::OK,
    [System.Windows.Forms.MessageBoxIcon]::Information
  ) | Out-Null
})

Set-ACTThemeRows -Query ""
if ($targetBox.Items.Count -eq 0) {
  $statusLabel.Text = "$($zh.noTarget)"
}
[void]$form.ShowDialog()
