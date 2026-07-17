# Tool index

## Active reusable tools

| Tool | Role | Writes | Verification |
| --- | --- | --- | --- |
| scripts/generate-themes.mjs | Generate 16 deterministic dual-mode packs across two collections, previews, adapters, and registry | themes/<theme-id>/, packages/, themes/registry.json | npm run generate:check |
| scripts/validate.mjs | Validate ids, paths, dimensions, hashes, allowlists, contrast, and adapters | none | npm run validate |
| scripts/build.mjs | Assemble the static Pages artifact | dist/ | npm run build |
| scripts/serve.mjs | Serve dist/ on localhost | none | browser smoke |
| context/tools/city-atlas-studio.html | Explore seeded city density, horizon, weather, and palette parameters before cataloging a theme | browser download only | open locally and test seed/parameter/reset/download controls |
| scripts/install-theme.ps1 | Verify and install a Windows saved theme | Codex Dream Skin theme library | -DryRun |
| scripts/install-theme.sh | Verify and install a macOS saved theme | Codex Dream Skin theme library | --dry-run |

The installers are the only scripts that write outside this repository. They
require an explicit theme id and fail before writing when validation fails.

## Safety

- Run either installer with its dry-run flag before allowing a user-state write.
- Remote installs require HTTPS, except for loopback development.
- Registry paths, bundle hashes, byte counts, manifest identity, and background
  hashes must all pass before installation.
- Installers write only to the documented Dream Skin saved-theme directory.
- They do not install Dream Skin, activate a theme, edit Codex, or execute files
  from a canonical theme package.
