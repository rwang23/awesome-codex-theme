# Changelog

## Unreleased

- Changed the primary Apply action to register the durable selection first. The
  per-user controller now owns the initial launch or controlled restart, and the
  UI waits for an `active` receipt before reporting success. This removes the
  false `Could not apply the Full Skin` result when ChatGPT is already open in
  its normal mode.
- Replaced the browser confirmation prompt with an in-app consent panel that is
  visible and keyboard accessible in both WebView2 and WKWebView. Backend error
  details remain visible instead of being reduced to a generic message.
- macOS target discovery now accepts the current ChatGPT names and the legacy
  Codex names, verifies the exact Bundle ID and executable, and falls back to
  the validated bundle executable if LaunchServices does not start the app.
- Added state-machine and repository regression tests for first-use Apply,
  stopped and running targets, terminal retry errors, dual-name macOS discovery,
  the consent panel, and the exact loopback launch arguments.

## 0.3.0-alpha.4 - 2026-07-21

- Redesigned Theme Manager as a compact two-column browser: visual-style tabs,
  wrapped collection filters, a vertically scrolling theme library, real Beta
  preview, and apply controls now remain visible together at the default
  1240×820 window size.
- Removed route-sized gradients that could cover Full Skin artwork with color
  bands. The verified image now stays on the document background while the
  main route surface remains transparent; the Codex project sidebar derives a
  light or dark tinted material from each theme's own `surfaceAlt` palette.
- Recaptured all 106 light and dark screenshots in the pinned ChatGPT Beta
  `26.715.3651.0` test bench and raised the catalog revision so installed
  managers cannot retain the older color-only evidence. Every capture records
  a decoded Blob image, matching document background, runtime hash, and
  restored `5.6 Sol Max` model selection.
- Extended the capture harness for both split and combined model-label DOMs.
  A persistent Windows smoke test kept Qinglan Odyssey across Home → Pull
  requests → Home, with transparent main surfaces, theme-tinted sidebar, and
  bounded renderer repair work.
- Kept consent-gated **Apply & Keep Full Skin**, durable replacement, and
  Restore Native behavior. The manager, Gallery, and regenerated desktop icons
  use the language-neutral terminal-window and color-orbit mark, with revised
  Chinese and English workspace copy.

## 0.3.0-alpha.3 - 2026-07-20

- Repaired Full Skin startup without weakening the exact-app trust boundary:
  Windows launches only the verified Store-package executable with the two
  pinned loopback flags (package activation could drop those flags), then
  resolves the listener through `netstat` and its owning process path instead
  of unreliable CIM queries. macOS opens the validated `.app` bundle path
  directly with preserved debug arguments.
- Made early Full Skin injection wait for a document body and made cleanup
  tolerate a renderer's already-expired early-script registration. A fresh
  isolated Windows Beta apply-and-restore smoke now verifies the theme marker,
  style, caption, and clean restoration; `theme-manager-windows.png` was
  refreshed from that real session.
- Release downloads now identify Windows x64, macOS Apple Silicon, and macOS
  Intel explicitly. Theme Manager also uses left-side macOS traffic-light
  controls on macOS, while keeping a compact Copy Native action clear of the
  preview at shorter window heights.
- Added a localized GitHub repository link to Theme Manager. The English and
  Chinese READMEs now recommend Agent installation first, source builds second,
  and manual desktop installation last.

## 0.3.0-alpha.2 - 2026-07-18

- Fixed the macOS Full Skin launch path reported against the previous Beta.
  Theme Manager now starts the exact validated ChatGPT app bundle as a new
  instance, checks the LaunchServices result, and preserves the debugging
  arguments instead of asking LaunchServices to reuse an existing instance.
- Accept the verified CDP listener when it belongs to the exact ChatGPT process
  or one of its bounded descendants. English UI errors now retain the localized
  explanation and include the underlying diagnostic reason.
- Added a separate twelve-theme World City Atlas covering New York, San
  Francisco, Chicago, Toronto, Vancouver, London, Paris, Berlin, Rome, Tokyo,
  Singapore, and Sydney.
- Split theme delivery from application delivery in the product surface:
  verified Catalog and Registry updates refresh in place without reinstalling
  or restarting the manager, while runtime and interface changes continue to
  use the signed Tauri updater and a user-confirmed restart.
- Renamed the two Tibo tribute taglines to `God of Reset` / `重置之神` and
  added deliberate bilingual title and tagline wrapping.
- Recaptured all 106 light and dark modes in the exact ChatGPT Beta
  `26.715.3651.0` test bench with `5.6 Sol Max`, then restored the prior model
  choice and removed the temporary Full Skin runtime.

## 2026-07-18-00-00

- Expanded the catalog from 28 to 41 themes with separate English and Chinese
  Tibo tributes, an original 2007-style blue coding mascot, five
  English-audience workspaces, and five Chinese-audience landscape themes.
- Replaced the character-based brand mark with a language-neutral
  frames-and-spark icon. Gallery and Theme Manager now follow browser or
  system language, rank the matching Tibo tribute first, and keep an explicit
  Chinese/English override.
- Recaptured all 82 light and dark modes in the exact ChatGPT Beta
  `26.715.3651.0` test bench. The fixed fixture now clears the selected project
  through the native “Don't work in a project” control before every batch, so
  public evidence does not contain local project names.
- Replaced hard-coded Full Skin ports with operating-system-selected loopback
  ports, while retaining exact executable/package ownership and `app://`
  target checks. This avoids Windows reserved-port ranges without weakening
  the local trust boundary.
- Added a monotonic catalog revision gate so an older cached or remote Registry
  cannot downgrade a newer catalog bundled with the Theme Manager.
- Updated the persistence smoke harness to read the controller-selected port
  from the exact pinned Beta root process and verify listener ownership instead
  of trusting a stale Chromium `DevToolsActivePort` file.
- Hardened macOS persistence around exact Bundle ID and executable identity,
  and reject persistence when Theme Manager is running from a mounted DMG or
  outside a valid `.app` bundle. Physical-Mac Full Skin, LaunchAgent,
  Gatekeeper, and notarization evidence remains pending.
- Regenerated all eight China City Atlas backgrounds with city-specific scenery,
  then captured all 16 light and dark modes in the exact ChatGPT Beta
  `26.715.3651.0` test bench.
- Implemented the opt-in Windows persistence controller with Tauri autostart,
  exact app and version gates, bounded replay, atomic state, one-click disable,
  and cleanup. Ten Rust tests and a real Beta persistence smoke pass; physical
  Mac persistence remains pending.
- Deployed a separate private community Beta at
  `https://community.ecomstack.net/` with bilingual accounts, quarantined
  code-free uploads, strict pack validation, moderation, and one vote per
  account per theme. Community votes never bypass official Registry review.
- Made English the default public README, added a full Chinese edition, and
  redesigned both around real captures, official downloads, consumer setup,
  Agent-assisted installation, trust boundaries, creation, and community.
- Added a copy-ready Agent installation contract that rejects unofficial
  downloads, app-file patching, silent process termination, and security
  protection bypasses.
- Documented the reviewed no-patch persistence model: a durable user choice,
  a per-user controller, bounded restart behavior, exact app identity, version
  gating, and complete disable/uninstall semantics.
- Added a staged custom-domain and community platform design covering GitHub
  Pages, Cloudflare or Supabase backends, quarantined uploads, GitHub identity,
  voting, moderation, and the threshold for leaving GitHub-native proposals.
- Changed the first public desktop Beta gate to require Tauri updater
  signatures and an ad-hoc macOS bundle signature. Windows Authenticode and
  Apple Developer ID signing/notarization are deferred and must remain clearly
  disclosed in the Beta Release. The GitHub prerelease flag stays false so the
  current `releases/latest` updater endpoint can find it.
- Added operating-system language detection and a persistent Chinese/English
  switch to Theme Manager. Search indexes both languages.
- Split Gallery and manager discovery into independent collection, rights, and
  visual-form facets, including combined filters and an explicit empty state.
- Added a bilingual GitHub Theme Proposal form and a public community route
  covering discussion, reactions, Pull Requests, Validator gates, real-app
  verification, rankings, moderation, and the threshold for a hosted service.
- Added exact updater, Windows, and Apple signing account and GitHub Actions
  configuration guidance, then configured the updater signing key and
  release-ready gate for the first public Beta.
- Added a real-Mac acceptance checklist. macOS remains session-scoped until its
  shared persistence-controller path passes physical-Mac validation.
- Strengthened macOS CI by verifying each DMG, bundle identifier, declared
  executable, target architecture, and ad-hoc code signature before upload.
- Required both `app` and `dmg` macOS release targets so Apple Silicon and
  Intel each publish a signed updater archive instead of an install-only DMG.

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
