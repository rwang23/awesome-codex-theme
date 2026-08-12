# Raw execution artifacts

Role: reference
Lifecycle: raw
Audience: task owners and maintainers cleaning up execution material
Authority: canonical raw-surface index
Status: active
Last reviewed: 2026-08-12

This directory stores task-time inputs, logs, snapshots, drafts, and evidence.
It is not a source of project truth. Durable Full Skin evidence lives in
`screenshots/`, `docs/50-operations/native-testing.md`, and the current
source/config contracts.

## Retention rules

- Treat each task/run as a package with an owner, consumer, canonical result,
  rebuildability, sensitivity, and retention/rollback boundary.
- Do not delete by age, filename, extension, size, or duplicate hash alone.
- Extract durable conclusions into current docs first. Keep only active,
  unique, or recovery-required evidence.
- Every package with more than one retained asset needs a README or manifest.
- The 2026-08-12 cleanup record is retained at
  [`docs-context-hygiene-20260812/`](docs-context-hygiene-20260812/); its
  `before-manifest.md`, `pre-delete-manifest.json`, and post-change report are
  the recovery and audit boundary for this run.

## Current package

| Package | Purpose | Status | Retention |
| --- | --- | --- | --- |
| `docs-context-hygiene-20260812/` | Before/after inventory, classification, deletion manifest, and closeout | active until owner confirms the baseline | retain as the task record |

Legacy Browser QA, Native capture, Theme Manager screenshots, PID files,
background logs, loop state, and old audit-remediation outputs were removed
after their conclusions were reconciled with current docs/source. They are not
current compatibility or release evidence.
