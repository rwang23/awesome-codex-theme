# Adapter compatibility

Canonical theme packs are engine-neutral and code-free. Adapters are generated
outside those packs because target applications expose different contracts.

| Target | Registry coverage | Version 1 output | Install behavior |
| --- | --- | --- | --- |
| Codex native | appearance-only | profile.json and config.toml | manual preference merge |
| Codex Dream Skin | full | schema 1 theme.json and background.png | verified installer |
| HeiGe Skin Studio | full | schema 1 theme.json and hero.png | manual import |
| CodeDrobe | source-export | schema 1 theme.json, hero.png, and generated codex.css | manual workflow |

## Codex native

The observed desktop configuration accepts light, dark, or system appearance.
No public contract for third-party background images, arbitrary palette tokens,
or complete native theme packages was found. The adapter therefore exports only
the mode preference and records unsupported capabilities as limitations.

## Dream Skin

The adapter maps one light or dark mode to Dream Skin schemaVersion 1. The
installer verifies the adapter ZIP, the selected background, manifest id,
appearance, and image path before writing a saved theme. It does not install or
activate the upstream runtime.

## HeiGe Skin Studio

The adapter maps the selected background to hero.png and exports the observed
schemaVersion 1 identity, palette, and copy fields. Import remains manual so the
gallery never claims control over another desktop application.

## CodeDrobe

The adapter exports the observed schemaVersion 1 target shape plus deterministic
CSS. The validator rejects remote URLs, imports, JavaScript references, and
missing reduced-motion handling. Because CSS is code-like target material, it
is never included in the canonical .act-theme archive.

Compatibility labels describe the tested export shape at release time. Upstream
changes can require an adapter update even when the canonical standard remains
stable.
