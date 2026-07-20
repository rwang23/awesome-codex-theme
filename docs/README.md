# Documentation map

## Reading order

1. agent-brief.md
2. architecture.md
3. standard.md
4. adapters.md
5. desktop-manager.md
6. release-signing.md
7. macos-testing.md
8. native-testing.md
9. community-registry.md
10. persistent-theme.md
11. agent-install.md
12. community-platform.md

Read landscape.md when positioning or upstream compatibility changes. Do not
use context/raw/, docs/archive/, or docs/report/ as first-read material; those
locations are reserved for execution evidence or closed history when needed.

## Current documents

- agent-brief.md: first-read project router
- architecture.md: package, Gallery, Full Skin runtime, Native fallback, and
  trust boundaries
- art-direction.md: reviewed image-job direction for Xianxia 01
- city-atlas-art-direction.md: city identity, anti-landmark, and composition rules
- fan-art-direction.md: declared-character and remembered-scene art direction
- fan-art-policy.md: public rights boundary, non-commercial terms, and takedown path
- gallery-design.md: redesign evidence and the independent Gallery visual system
- standard.md: version 1 canonical manifest and package contract
- adapters.md: ACT Full Skin contract, Native fallback, and unsupported
  capabilities
- desktop-manager.md: Tauri architecture, catalog refresh, signed app updates,
  measured package comparison, and macOS signing boundary
- release-signing.md: updater keys, Windows signing choices, Apple developer
  account, the updater-signed Beta boundary, and the release-ready gate
- release-notes/: bilingual source notes for published desktop Beta Releases
- macos-testing.md: ad-hoc-signed DMG boundary, real-Mac installation, Full
  Skin apply/restore, Gatekeeper, and evidence checklist
- community-registry.md: GitHub-native proposals, independent Gallery facets,
  hosted-beta submissions, verified rankings, and official Registry promotion
- persistent-theme.md: reviewed upstream persistence mechanisms and the
  Windows-verified no-patch per-user controller
- agent-install.md: copy-ready installation contract, trust checks, and
  explicit stop conditions for coding agents
- community-platform.md: custom-domain, hosted submission, voting, storage,
  moderation, deployed private Beta, and staged backend architecture
- native-testing.md: isolated Full Skin validation, Theme Manager smoke, and
  screenshot evidence
- landscape.md: dated reference-project research and positioning
- CHANGELOG.md: delivered project changes
- ../README.md: default English consumer-facing overview and setup
- ../README.zh-CN.md: full Chinese overview
- ../README.en.md: compatibility pointer to the default English README
- ../.codex/skills/create-codex-theme/: project-local theme creation Skill
- ../context/tools/README.md: script and execution-pack index

Generated files belong under dist/, packages/, themes/<theme-id>/, and
themes/registry.json. The editable sources are site/, themes/catalog.json,
themes/source-art/, scripts/, apps/theme-manager/, and .codex/skills/.

## Maintenance

Keep current documents concise and update them only when durable behavior
changes. Move closed investigations or dated evidence out of the first-read
path instead of growing active documents into history logs.
