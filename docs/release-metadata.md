# Release metadata

This file is generated from [`metadata/release.json`](../metadata/release.json). Do not edit it by hand.

- Desktop version: `0.3.2`
- Channel: `beta`
- GitHub prerelease: `true`
- Update-feed state: `unreleased`
- Update endpoint: `https://rwang23.github.io/awesome-codex-theme/updates/stable.json`
- Full Skin format: `act-full-skin-v1`
- Full Skin capture: ChatGPT Beta `26.715.3651.0` / `OpenAI.CodexBeta_26.715.3651.0_x64__2p2nqsd0c76g0`
- Catalog: `68` themes / `136` modes / revision `2026072201`

## Capability disclosure

| Target | Full Skin | Native fallback | Persistence |
| --- | --- | --- | --- |
| Windows x64 | build-only | verified | verified |
| macOS Apple silicon | build-only | build-only | unverified |
| macOS Intel | build-only | build-only | unverified |

## Ownership and drift guard

`metadata/release.json` is authoritative for the desktop version, release channel, updater endpoint, runtime/capture identities, and platform capability claims. `themes/catalog.json` is authoritative for the catalog revision and source-derived theme/mode counts. `npm run metadata:check` fails if synchronized package, Tauri, Cargo, workflow, README, or this document data drift.

The update endpoint is a stable-feed location. The current Beta status is intentionally `unreleased`; no updater availability claim is made until a signed static feed contains all platform records.
