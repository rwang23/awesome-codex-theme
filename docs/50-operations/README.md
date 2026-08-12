# Operations

Role: runbook
Lifecycle: current
Audience: maintainers, release operators, and test owners
Authority: canonical operations index
Status: active
Last reviewed: 2026-08-12

| Document | Role | Use it for |
| --- | --- | --- |
| [native-testing.md](native-testing.md) | runbook | Full Skin, Native fallback, capture, restore, and cleanup evidence |
| [macos-testing.md](macos-testing.md) | runbook | Physical-Mac installation, Gatekeeper, signing, and persistence limits |
| [release-metadata.md](release-metadata.md) | reference | Generated release version, channel, capture identity, and capability matrix |
| [release-signing.md](release-signing.md) | runbook | Updater signatures, platform trust, and release-ready gates |

Builds and static tests do not prove browser interaction, real-app behavior,
signing, notarization, or public deployment. Keep those evidence boundaries
explicit in release notes and reports.
