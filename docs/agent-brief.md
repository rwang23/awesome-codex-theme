# Agent brief

## Project snapshot

- Last reviewed: 2026-07-18
- Project: Awesome Codex Theme
- Project root: `C:\projects\50-developer\codex-tools\awesome-codex-theme`
- Purpose: free declarative Full Skin standard, Registry, Validator, Gallery,
  and cross-platform Theme Manager for Codex
- Primary users: international and Chinese-speaking Codex desktop users and theme contributors
- Main stack: dependency-free static HTML/CSS/JavaScript, Node.js built-ins,
  and a Tauri 2 desktop app with a narrow Rust backend
- Canonical package manager: npm; desktop dependencies live only under
  `apps/theme-manager`
- Deployment: public Gallery through GitHub Pages; separate private community
  service on Oracle VPS behind Cloudflare
- Production/live-data sensitivity: the public repository has no user data; the
  separate community has accounts, submissions, and votes. Pushing, Pages or
  community deployment, app installation, and real-app setting changes require
  exact authorization

## Current focus

- Current phase: ACT Full Skin v1, cross-platform Theme Manager, signed release
  delivery, and version-bound real-app evidence
- Full Skin is the primary target. It applies the declared 2560×1440
  background, translucent materials, colors, and theme copy while preserving
  Codex navigation and workflow structure.
- Source art is installable Full Skin background material. Generated 960×540
  previews are Gallery fallbacks; the public Gallery prefers verified real
  Beta captures.
- Theme packs remain code-free. The shared runtime under
  `packages/full-skin/` is manager-owned, reviewed once, and never supplied by
  theme authors.
- Codex Native remains a palette-only fallback through the versioned
  `codex-theme-v1:` string.
- Explicitly out of scope: replacing or reordering Codex product surfaces,
  patching application files or private data, third-party skin engines,
  arbitrary remote registries, official franchise assets, and commercial
  fan-art licensing.
- A collection is complete only after source review, `npm run check`, browser
  QA, Full Skin capture validation, Native fallback validation, and a
  task-owned commit.
- A "real screenshot verified" claim requires the same named app version,
  exact package and listener ownership, action-after runtime markers, fixed
  capture fixture, privacy review, and baseline restore under
  `docs/native-testing.md`.
- A "macOS auto-update ready" claim additionally requires signed, notarized
  artifacts and a macOS action-after readback; source compatibility alone is
  not enough
- Windows persistence is enabled by the main Full Skin action after one explicit
  consent and is verified against ChatGPT Beta `26.715.3651.0`. Each later
  Apply replaces the durable choice through safe replay, never an app patch.
  macOS persistence rejects mounted-DMG and invalid app-bundle paths,
  binds target actions to Bundle ID plus executable path, and remains
  unverified on physical hardware.
- The hosted community Beta is a separate private service. Uploads remain
  quarantined and cannot enter the official Registry without this repository's
  review, CI, and real-app evidence.

## Read first

1. `AGENTS.md`
2. `README.md`
3. `docs/architecture.md`
4. `context/tools/README.md`

Avoid `dist/`, `context/raw/`, `docs/archive/`, and generated history unless required.

## Workflow routing

- Small edits: edit directly and run the focused check.
- Multi-file behavior: use a short plan, run `npm run check`, then browser smoke.
- Theme additions: use `$create-codex-theme`, select the original or fan-art rights profile, generate source art, inspect it, regenerate, and validate.
- Full Skin compatibility claims: update `docs/adapters.md` and prove the
  exact runtime against the named Codex package. Native claims still require
  strict parser validation.
- Publishing, remote creation, Pages activation, app installation, and current-app setting changes require authorization bound to the exact target.
- Never automate copyright clearance or authenticated publishing.

## Live Operation Gates

Creating or pushing a remote, changing Pages settings, installing another Codex
package, or changing the current app's appearance is an external action. Bind
approval to the exact repository, app package, or running instance before
acting. Full Skin tests must use the isolated package selected for the run and
must not interrupt a user's normal Stable session.

## Canonical commands

    npm run art:generate
    npm run generate
    npm run generate:check
    npm run validate
    npm test
    npm run screenshots:probe
    npm run screenshots:capture
    npm run desktop:test
    npm run desktop:check
    npm run desktop:smoke
    npm run desktop:start
    npm run desktop:build:win
    npm run build
    npm run check
    npm run serve

## Verification bundles

- Theme data or art: source-art visual review, `generate:check`, validation, and tests.
- Full Skin: asset hash and dimensions, Registry equality, exact app/listener
  identity, runtime marker readback, 106-mode capture manifest with
  `5.6 Sol Max`, model restoration, and runtime restore.
- Native fallback: parser validation, Registry/package equality, unique payload,
  and recorded tested version.
- Site behavior: `npm run check`, local server, browser search/filter/dialog/copy checks.
- Real screenshot: isolated Codex Full Skin apply, fixed fixture, version/hash
  evidence, screenshot review, and runtime cleanup.
- Persistence: exact app identity, user consent, autostart readback, bounded
  replay, runtime readback, disable, port cleanup, and startup-entry removal.
- Commit: inspect status, diff, staged paths, and committed tree.
- Deployment: GitHub Actions success plus public Pages interaction.

## Docs policy

Keep `docs/README.md` and this brief current. Record delivered changes in
`docs/CHANGELOG.md`. Do not create empty task, memory, or archive files.

## Tooling map

- Tool index: `context/tools/README.md`
- Canonical helpers: `scripts/*.mjs`
- Authorized real-app helpers:
  `scripts/capture-full-skin-screenshots.mjs` and
  `scripts/smoke-theme-manager.mjs`. They may affect only the exact isolated
  package and loopback port declared for the run, and they must prove cleanup.
- The Theme Manager may cache a hash-verified background in its own application
  data and apply its fixed runtime to an exact registered Stable or Beta
  session. It must not write ChatGPT application files, private data, or chats.
- `apps/theme-manager/src-tauri/src/persistence.rs` owns the consent-gated
  per-user replay controller. Restore must disable it before cleaning the live runtime.
- The portable Windows helper only copies a Native fallback string.
- Workflow lint: `C:\Users\desre\.codex\tools\workflow-lint.ps1`

## Known pitfalls

- A GitHub Pages button cannot apply Full Skin by itself; the Theme Manager is
  the trusted local runtime.
- `codex://settings` opens settings; it does not apply the selected theme.
- Native v1 does not accept background images and must not be presented as the
  primary Full Skin path.
- A Full Skin claim is bound to a tested Codex version. A later version needs a
  fresh capture and manager smoke run.
- Windows persistence evidence does not prove macOS persistence. Keep the Mac
  claim session-scoped until a physical-Mac action-after test passes.
- Version 1 skins the existing layout. It does not recreate the deeper custom
  navigation/account/task redesign shown in concept mockups.
- Official screenshots, posters, promotional art, and upstream theme screenshots must not enter theme packages.
- Image-job output needs human review for text, logos, undeclared IP, copied composition, safe-area drift, and 16:9 cropping.
- Fan-art themes are unofficial, personal, and non-commercial; they use a custom notice and cannot claim rights verification.
- An OS-unsigned package is not platform-trusted. Tauri updater signing,
  Windows Authenticode, macOS ad-hoc bundle integrity, Developer ID, and
  notarization remain separate evidence gates.
- A valid build proves files, not rendered interaction, real-app behavior,
  signing, or public deployment.
