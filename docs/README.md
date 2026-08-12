# Documentation map

Role: guide
Lifecycle: current
Audience: contributors, operators, and coding agents
Authority: canonical project documentation index
Status: active
Last reviewed: 2026-08-12

## First Read Order

1. [Agent brief](agent-brief.md) — project boundaries, current focus, and required checks.
2. [Foundation](00-foundation/README.md) — standard, onboarding, and positioning.
3. [Architecture](20-architecture/README.md) — system, Full Skin, manager, and persistence.
4. [Design](30-design/README.md) — Gallery, source art, and rights boundaries.
5. [Community](40-community/README.md) — contribution and Registry intake.
6. [Operations](50-operations/README.md) — testing, release, and signing.

Read the dated [audit](91-audit/README.md), [reports](92-report/README.md), and
[records](93-records/README.md) only when historical evidence or release history
is needed. They never override current source or current-band documentation.

## Document model

Current guidance is profile-composed and lifecycle-separated: the numbered
bands are the first-read knowledge surface, while audit, report, and record
folders retain dated evidence without competing with current authority.

## Current knowledge bands

| Band | Role | Entry point |
| --- | --- | --- |
| `00-foundation/` | Standard, onboarding, and project positioning | [README](00-foundation/README.md) |
| `20-architecture/` | Architecture, compatibility, manager, and persistence | [README](20-architecture/README.md) |
| `30-design/` | Gallery UX, source-art direction, visual rules, and rights | [README](30-design/README.md) |
| `40-community/` | Community platform, Registry, and collaboration | [README](40-community/README.md) |
| `50-operations/` | Testing, release metadata, signing, and operational gates | [README](50-operations/README.md) |

The root is intentionally limited to this index, the compact agent brief,
`CHANGELOG.md`, and `document-structure-baseline.json`.

## Historical lifecycle surfaces

- `docs/91-audit/`: historical dated audits retained for traceability; not first-read guidance.
- `docs/92-report/`: historical curated delivery and analysis reports with an index.
- `docs/93-records/`: historical retained release notes and published project records.
- `docs/94-archive/`: reserved historical/raw archive surface; it is not created until
  a durable retention need and owner are established.

These surfaces are declared by [document-structure-baseline.json](document-structure-baseline.json).
New top-level docs categories use `NN-semantic-name`; numbering expresses
reading order or lifecycle, while the semantic name and index explain purpose.

## Source-of-truth boundaries

Generated files belong under `dist/`, `packages/`, `themes/<theme-id>/`, and
`themes/registry.json`. Editable sources are `site/`, `themes/catalog.json`,
`themes/source-art/`, `scripts/`, `apps/theme-manager/`, and `.codex/skills/`.
Reusable helper guidance is indexed in [context/tools/README.md](../context/tools/README.md).

## Maintenance

Keep current documents concise and update the existing authority when durable
behavior changes. Put execution logs, mappings, snapshots, and one-off reports
in a task-scoped `context/` package; do not grow current docs with process
history. `context/raw/` is historical/raw task material and is never a
first-read source of project authority. Update the baseline and the owning
index whenever a new docs surface is intentionally introduced. The baseline remains `provisional` until the
project owner confirms the post-change hygiene report.
