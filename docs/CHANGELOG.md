# Changelog

## 2026-07-17-04-00

- Added `ACT Full Skin v1` as the primary target: verified 2560×1440
  backgrounds, translucent materials, palette tokens, and localized theme copy
  now apply together while the native Codex layout stays intact.
- Kept every `.act-theme` declarative and code-free. The shared CSS and CDP
  logic now live in one reviewed, manager-owned runtime with exact package,
  loopback listener, `app://` target, hash, and cleanup checks.
- Added the Tauri/Rust apply and restore path for exact ChatGPT Stable or Beta
  packages without modifying WindowsApps, `app.asar`, private data, or chats.
- Captured and reviewed 56 real Full Skin screenshots in ChatGPT Beta
  `26.715.3651.0`, then bound every capture to its background, runtime hash,
  app version, byte count, and selector readback.
- Added a real Theme Manager UI smoke test that applies a skin, verifies Beta
  runtime markers, captures the manager, restores the native UI, and confirms
  all markers are gone.
- Fixed the Pages build so all 56 Full Skin PNGs are published, and changed the
  Gallery and bilingual docs to present Full Skin first with Native as a
  palette-only fallback.
- Kept the desktop bundle light by deriving 720×405 browsing thumbnails from
  the verified captures at build time. The Windows NSIS test package dropped
  from 67.67 MiB to 18.54 MiB while Pages retains the full 1440×810 evidence.
- Removed the obsolete Electron spike, local Electron logs, old packaged
  release directory, and repository-local Tauri toolchain from `context/raw/`.
- Bumped the desktop manager to `0.3.0-alpha.1`. Unsigned local artifacts are
  test builds; a public desktop Release remains gated on platform signing and
  macOS notarization.

## 2026-07-17-03-00

- Replaced the Electron candidate with a Tauri 2 Theme Manager that reuses the
  Chinese-first real-screenshot interface and moves trusted operations into
  Rust.
- Added startup Registry refresh through a pinned Pages manifest, SHA-256 and
  byte-count checks, strict Native payload validation, verified caching, and
  bundled offline fallback.
- Added Tauri's mandatory-signature updater, explicit restart-to-install
  behavior, and an unreleased state when no updater public key is configured.
- Added Windows Stable/Beta package discovery and macOS ChatGPT app discovery
  without writing application files or private data.
- Replaced the README hero artwork with an actual Theme Manager screenshot and
  added the same real runtime surface to GitHub Pages.
- Measured a 3.66 MiB Windows Tauri NSIS package against the 97.45 MiB
  Electron candidate, then verified the release runtime and exact
  271-character Native copy path.
- Added desktop unit tests, Windows packaging, macOS ARM64/x64 CI, and a gated
  `tauri-action` release path while documenting updater signing, Windows
  signing, and macOS notarization gates.

## 2026-07-17-02-00

- Added a separate no-admin Windows companion installer with a validated
  Registry snapshot and exact Stable/Beta package targeting.
- Kept the final Native import as an explicit action inside ChatGPT and
  prohibited app-file, WindowsApps, private-data, and conversation writes.
- Added concise bilingual taglines to the catalog, manifests, Registry,
  validation, Gallery cards, search, and install panel.
- Replaced the ambiguous shared `codex://settings` action with an installer
  download and retained direct copy/download paths.
- Imported all 56 theme modes into the isolated ChatGPT Beta
  `26.707.3351.0`, captured privacy-safe 1440×810 Appearance screenshots,
  recorded semantic readback evidence, and restored the exact original
  light/dark/System baseline.
- Bound every real capture to the Registry and Validator, copied it into the
  Pages build, and made the Gallery prefer real screenshots over cover art.
- Gave all 56 modes distinct Codex Native payloads and made duplicate
  installable themes a validation error.

## 2026-07-17-01-00

- Narrowed compatibility to Codex Native and removed third-party adapter
  bundles and executable installers.
- Replaced the former appearance-only profile with validated
  `codex-theme-v1:` import strings for every light and dark mode.
- Added Native strings to canonical packages and bound their format, version,
  hash, size, Registry value, and packaged copy to the Validator.
- Reworked the Gallery import panel around copy, download, and Codex Appearance
  settings.
- Labeled all generated illustrations as Gallery covers and documented the
  isolated real-app screenshot workflow.

## 2026-07-17-00-00

- Added eight unofficial character-tribute themes covering cinematic and chibi
  pairs from four disclosed donghua works.
- Added four remembered-scene themes: Void Hall, the wedding rescue, the
  rain-alley confession, and the Three-Year Agreement.
- Added original and fan-art rights profiles across the catalog, manifests,
  registry schemas, validator, source provenance, Gallery, and contribution
  Skill.
- Added a public fan-art policy, non-commercial notice, declared work and
  character metadata, and `rightsVerified: false` enforcement.
- Expanded the Gallery to 28 themes and 56 generated 960×540 light/dark
  previews, with a dedicated scene filter and fan-art disclosure.

## 2026-07-16-03-00

- Replaced the derivative editorial Gallery direction with an independent,
  Chinese-first theme archive built around a live Codex workspace preview.
- Rebuilt all 16 theme source images through OpenAI image jobs and added
  compact, reviewable provenance for every source.
- Added deterministic source-PNG decoding, 16:9 cropping, light and dark
  grading, package generation, and hash validation.
- Added the project-local `$create-codex-theme` Skill, brief template,
  scaffolding script, image-job playbook, and originality checks.
- Rewrote the primary README and contribution guide in Chinese, with a full
  secondary English README.
- Documented the Gallery redesign boundary and the updated xianxia and city
  art direction.

## 2026-07-16-02-00

- Fixed the install dialog so its trust note follows the selected adapter
  instead of always describing the Dream Skin installer.

## 2026-07-16-01-00

- Added China City Atlas 01 with eight original, dual-mode city themes.
- Added collection metadata and pairing policies to the catalog, registry, and canonical manifests.
- Added collection switching and a city-specific filter to the bilingual Gallery.
- Added deterministic city motifs for Beijing, Shanghai, Shenzhen, Guangzhou,
  Chengdu, Hangzhou, Chongqing, and Nanjing.
- Added the Urban Palimpsest art direction and a seeded parameter studio for
  developing later city themes.
- Updated validation and tests for 16 themes, 32 modes, two collection
  policies, and 32 adapter bundles.

## 2026-07-16-00-00

- Created the local Awesome Codex Theme repository.
- Added a dependency-free GitHub Pages marketplace.
- Added a reproducible theme catalog with eight original, dual-mode procedural packs.
- Added the act-theme-pack-v1 Schema and generated registry.
- Added explicit native, Dream Skin, HeiGe, and CodeDrobe adapter exports.
- Added registry validation, contrast gates, deterministic builds, local tests,
  and hash-verified dry-run installers.
- Kept generated binary distribution artifacts out of Git history; CI rebuilds
  them from the committed catalog and generator.
- Documented licensing, contribution, compatibility, and installation boundaries.
