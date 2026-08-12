# Architecture

Role: architecture
Lifecycle: current
Audience: maintainers, runtime engineers, and advanced contributors
Authority: canonical architecture index
Status: active
Last reviewed: 2026-08-12

| Document | Role | Use it for |
| --- | --- | --- |
| [architecture.md](architecture.md) | architecture | Package flow, trust boundaries, delivery surfaces, and product limits |
| [adapters.md](adapters.md) | spec | ACT Full Skin v1, Native fallback, compatibility and evidence claims |
| [desktop-manager.md](desktop-manager.md) | architecture | Tauri UI/Rust boundary, catalog, CDP session, and manager behavior |
| [persistent-theme.md](persistent-theme.md) | architecture/runbook | Consent-gated per-user replay, identity checks, restore, and platform limits |

The manager owns the fixed runtime. Theme packs remain declarative and code-
free. Real-app claims remain version-bound and belong to the operations test
documents as well as this architecture surface.
