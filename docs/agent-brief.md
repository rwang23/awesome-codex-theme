# Agent brief

## Project snapshot

- Last reviewed: 2026-07-17
- Project: Awesome Codex Theme
- Project root: `C:\projects\tools\awesome-codex-theme`
- Purpose: free Codex Native theme standard, Registry, Validator, and Gallery
- Primary users: Chinese-speaking Codex desktop users and theme contributors
- Main stack: static HTML/CSS/JavaScript and Node.js built-ins
- Canonical package manager: npm, with zero runtime or development dependencies
- Deployment: GitHub Pages through GitHub Actions
- Production/live-data sensitivity: no live data; pushing, Pages changes, app installation, and real-app setting changes require exact authorization

## Current focus

- Current phase: Codex Native-only migration and real-app evidence design
- Keep the Chinese-first Gallery, reviewed cover art, rights profiles, theme-pack contract, Native import strings, and contribution Skill verifiable
- Gallery illustrations are covers, not Codex screenshots or installable backgrounds
- Explicitly out of scope: CSS injection, executable installers, third-party skin engines, native protocol handlers, official franchise assets, and commercial fan-art licensing
- A collection is complete only after source review, `npm run check`, browser QA, Native contract validation, and a task-owned commit
- A "real screenshot verified" claim also requires a same-version Codex import and capture under `docs/native-testing.md`

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
- Native compatibility claims: update `docs/adapters.md` and prove the exact import shape against the named Codex version.
- Publishing, remote creation, Pages activation, app installation, and current-app setting changes require authorization bound to the exact target.
- Never automate copyright clearance or authenticated publishing.

## Live Operation Gates

Creating or pushing a remote, changing Pages settings, installing another Codex
package, or changing the current app's appearance is an external action. Bind
approval to the exact repository, app package, or running instance before
acting.

## Canonical commands

    npm run art:generate
    npm run generate
    npm run generate:check
    npm run validate
    npm test
    npm run build
    npm run check
    npm run serve

## Verification bundles

- Theme data or art: source-art visual review, `generate:check`, validation, and tests.
- Native export: parser validation, Registry/package equality, and recorded tested version.
- Site behavior: `npm run check`, local server, browser search/filter/dialog/copy checks.
- Real screenshot: isolated Codex import, fixed fixture, version/hash evidence, and screenshot review.
- Commit: inspect status, diff, staged paths, and committed tree.
- Deployment: GitHub Actions success plus public Pages interaction.

## Docs policy

Keep `docs/README.md` and this brief current. Record delivered changes in
`docs/CHANGELOG.md`. Do not create empty task, memory, or archive files.

## Tooling map

- Tool index: `context/tools/README.md`
- Canonical helpers: `scripts/*.mjs`
- Scripts that write user state: none
- Workflow lint: `C:\Users\desre\.codex\tools\workflow-lint.ps1`

## Known pitfalls

- A GitHub Pages button cannot import a theme into Codex.
- `codex://settings` opens settings; it does not apply the selected theme.
- Native v1 does not accept background images.
- Official screenshots, posters, promotional art, and upstream theme screenshots must not enter theme packages.
- Image-job output needs human review for text, logos, undeclared IP, copied composition, safe-area drift, and 16:9 cropping.
- Fan-art themes are unofficial, personal, and non-commercial; they use a custom notice and cannot claim rights verification.
- A valid build proves files, not rendered interaction or real-app behavior.
