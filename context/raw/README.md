# Raw execution artifacts

This directory is local execution output, not a source of project truth.
Durable Full Skin evidence lives in `screenshots/`, `docs/native-testing.md`,
and `docs/assets/`.

## Current artifact groups

| Group | Purpose | Retention |
| --- | --- | --- |
| `browser-qa/` and Gallery screenshots/logs | Earlier local responsive and interaction checks | Reproducible; delete candidate after the current milestone |
| `native-capture/` and capture logs | Earlier Native-only Beta evidence | Superseded by `screenshots/codex-beta-26.715.3651.0/`; delete candidate |
| Theme Manager screenshots/logs | Earlier desktop UI and packaging checks | Superseded by `docs/assets/theme-manager-windows.png`; delete candidate |
| PID and stdout/stderr files | Background helper bookkeeping | Reproducible; delete candidate when no related process remains |

The obsolete Electron spike, Electron logs, old packaged release directory,
and repository-local Tauri toolchain were removed when the project adopted
Tauri 2.

## Retention rules

- Do not treat files here as current compatibility or release evidence.
- Do not store credentials, private ChatGPT content, full service responses, or
  generated base64 payloads here.
- Keep only artifacts needed to reproduce an active task or evidence that
  cannot be regenerated.
- Batch deletion still requires explicit user approval or a project cleanup
  plan. This index marks candidates; it does not authorize deleting them.
