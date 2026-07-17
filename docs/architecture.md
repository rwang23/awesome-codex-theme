# Architecture

## Layers

The project has three deliberately separate layers.

The gallery is a static GitHub Pages site. It reads themes/registry.json,
renders localized cards, filters them in the browser, switches light and dark
previews, and copies an explicit install command. It has no server, account
system, analytics, or payment path.

The registry and canonical packages are generated from themes/catalog.json.
Each .act-theme contains a versioned manifest and two declared PNG backgrounds.
Every path, preview, package, and per-mode adapter bundle has recorded SHA-256
and byte-count evidence.

Generated binaries are distribution outputs rather than Git history. A clean
checkout runs the generator before validation and Pages assembly, keeping the
repository small enough for repeated theme releases without hiding how any
asset was made.

Adapters are deterministic build outputs outside the canonical trust boundary.
Each per-mode ZIP contains explicit Codex-native, Dream Skin, HeiGe, and
CodeDrobe directories. This separation keeps a canonical theme declaration
code-free even when a target engine needs generated CSS.

The installers download or copy the declared adapter, verify the ZIP and
background, validate the Dream Skin identity, and place it inside the existing
saved-theme library. They do not install Dream Skin, alter the official Codex
package, start a CDP session, or change model-provider configuration.

## Trust boundary

GitHub Pages is a discovery and distribution surface. Local installation is a
separate, explicit step. Visitors can inspect both the command and the script.
Hash verification catches damaged or substituted package files relative to the
registry, while repository review and release provenance establish who controls
the registry itself. A compromised site and registry remain a common trust
root, which is why packages are still constrained by file allowlists.

## Compatibility

The initial implementation targets Codex Dream Skin schema 1, HeiGe Skin Studio
schema 1, and the CodeDrobe schema 1 target shape observed during development.
Codex native is appearance-only because no public full theme package API was
found. Compatibility is a declared matrix, not a generic runtime plugin API.

## Future native manager

A true one-click browser install would require a signed local application or a
registered URL protocol. That is a separate security and distribution project.
The static-site command flow is the correct first release.
