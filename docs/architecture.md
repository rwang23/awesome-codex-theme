# Architecture

## Layers

The project has four separate layers.

The Gallery is a dependency-free GitHub Pages site. It reads
`themes/registry.json`, renders the Chinese-first collection controls and
cards, switches light and dark covers, and exposes the selected Codex Native
theme string. It has no server, account system, analytics, payment path, or
permission to change Codex settings.

The Registry and canonical packages are generated from `themes/catalog.json`
and reviewed PNG files in `themes/source-art/`. Source-art jobs and compact
provenance records keep the model, prompt hash, job id, and source hash
reviewable. Each mode produces a `codex-theme-v1:` string from the declared
tokens. Every package, preview, asset, and Native export has recorded SHA-256
and byte-count evidence.

The Validator checks the package allowlist, declared paths, hashes, PNG
dimensions, rights fields, collection rules, WCAG contrast, and the exact
Codex Native payload shape. It also confirms that the public Native file, the
Registry value, and the copy inside `.act-theme` are identical.

The optional Windows companion installer is a separate distribution bundle,
not part of any `.act-theme` package. It carries a validated Registry snapshot,
lets the user choose a theme and mode, copies the exact Native string, and
opens the selected registered Stable or Beta package by AUMID. It needs no
administrator rights and does not patch WindowsApps, application files,
private app data, or conversations. Import remains an explicit action inside
ChatGPT.

## Artwork and screenshots

Every theme retains deterministic 960×540 light and dark cover PNGs. Those
images describe its visual world; Codex Native does not accept them as
application backgrounds. They remain source and fallback cover art.

A real Codex screenshot is a separate evidence artifact. The current Registry
binds all 56 mode records to 1440×810 captures from the isolated Beta
`26.707.3351.0` Appearance fixture. Each record carries the Native hash, app
readback hash, screenshot hash, exact package identity, dimensions, and
capture time. The Gallery prefers these captures and labels them as real Beta
screenshots. See `native-testing.md`.

## Rights path

Original themes and unofficial fan art use separate `rightsProfile` values.
Fan-art records declare the underlying work and characters, prohibit
commercial use, state that no official assets were used, and remain
`rightsVerified: false`. The Gallery shows that status instead of presenting
all artwork as CC0.

Reviewed source art is part of Git history. Derived theme directories,
packages, Registry output, and Pages artifacts are generated distribution
outputs. A clean checkout can rebuild them without image-service access while
keeping raw service responses and credentials out of the repository.

## Trust boundary

The browser can copy or download a declarative theme string or download the
companion installer. The installer validates its bundled Registry, copies the
selected string, and can open an exact registered app package. Neither surface
applies the theme. Import remains an explicit user action inside ChatGPT.

Hash validation proves that generated files match the Registry. Repository
review and release provenance establish who controls that Registry. A
compromised site and Registry remain a common trust root, so canonical packages
keep a strict file allowlist and contain no executable code.

Executable installer files live only in the separate installer ZIP. They are
never permitted inside canonical theme packages, and the installer build
records its own SHA-256 and byte count.

## Compatibility boundary

Version 1 targets Codex Native only. It does not implement third-party skin
formats, CSS injection, or a generic plugin API. The tested desktop version is
recorded in both manifests and Registry entries so a later app release can be
revalidated explicitly.
