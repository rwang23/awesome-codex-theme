# Architecture

## Layers

The project has three deliberately separate layers.

The gallery is a static GitHub Pages site. It reads themes/registry.json,
renders localized collection controls and cards, filters by collection or
visual variant, switches light and dark previews, and copies an explicit
install command. It has no server, account system, analytics, or payment path.

The registry and canonical packages are generated from themes/catalog.json and
the reviewed PNG files in themes/source-art/. The catalog declares collection
metadata and per-collection pairing rules. Source-art jobs and compact
provenance records keep the model, prompt hash, job id, and source hash
reviewable. Each .act-theme contains a versioned manifest and two derived PNG
backgrounds. Every path, preview, package, and per-mode adapter bundle has
recorded SHA-256 and byte-count evidence.

Reviewed source art is part of Git history. Derived theme directories,
packages, registry output, and Pages artifacts are generated distribution
outputs. A clean checkout can therefore rebuild the same light and dark
backgrounds without API access while keeping raw image-service responses and
credentials out of the repository.

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
