# Agent brief

## Project snapshot

- Last reviewed: 2026-07-16
- Project: Awesome Codex Theme
- Project root: C:\projects\tools\awesome-codex-theme
- Purpose: free Codex desktop theme gallery, registry, and safe installer layer
- Primary users: Codex desktop users and theme contributors
- Main tech stack: static HTML/CSS/JavaScript, Node.js built-ins, PowerShell, shell
- Canonical package manager: npm, with zero runtime or development dependencies
- Deployment/runtime: GitHub Pages through GitHub Actions
- Production/live-data sensitivity: no live data; publishing and remote creation require approval

## Current focus

- Current phase: local MVP
- Most important task: keep the gallery, theme-pack contract, adapters, and install flow verifiable
- Explicitly out of scope: native protocol handler, remote repository creation, package registry publishing
- Active task pointer: none after the initial local release

## Read first

1. AGENTS.md
2. README.md
3. docs/architecture.md
4. context/tools/README.md

Avoid dist/, context/raw/, docs/archive/, and generated history unless required.

## Workflow routing

- Small edits: edit directly and run the focused check.
- Multi-file behavior: use a short plan, npm run check, then browser smoke.
- Theme additions: edit themes/catalog.json, regenerate, validate, inspect art.
- Adapter claims: update docs/adapters.md and prove the exact target behavior.
- Publishing, remote creation, or Pages activation: ask first.
- Never automate copyright clearance or authenticated publishing.

## Canonical commands

    npm run generate
    npm run generate:check
    npm run validate
    npm test
    npm run build
    npm run check
    npm run serve

## Verification bundles

- Theme data or art: generate:check, validate, tests, focused visual inspection.
- Site behavior: check, local server, browser search/filter/dialog/copy checks.
- Installer: local dry-run plus registry/hash validation.
- Commit: inspect status, diff, staged paths, and committed tree.
- Deployment: GitHub Actions success plus public Pages interaction.
- P2 state path for initial MVP: user-level DecisionProof temporary state.

## Live operation gates

Creating a remote, pushing, enabling Pages, or changing repository settings is
an external action. Bind approval to the exact repository before acting.

## Docs policy

Keep docs/README.md and this brief current. Record delivered changes in
docs/CHANGELOG.md. Do not create empty task, memory, or archive files.

## Tooling map

- context/tools/README.md status: current
- Canonical helper scripts: scripts/*.mjs and platform installers
- Scripts that can write user state: install-theme.ps1 and install-theme.sh
- Workflow lint: C:\Users\desre\.codex\tools\workflow-lint.ps1

## Known pitfalls

- A GitHub Pages button cannot execute a local installer.
- Upstream theme screenshots must never be used as background packages.
- Windows and macOS use different Codex Dream Skin state roots.
- Codex native supports an appearance preference, not full visual parity.
- A build proves files, not rendered interaction.
