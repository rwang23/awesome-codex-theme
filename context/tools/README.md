# Tool index

Role: reference
Lifecycle: current/tooling
Audience: contributors and coding agents
Authority: canonical helper and execution-boundary index
Status: active
Last reviewed: 2026-08-12

Reusable helpers live in `scripts/` and the project-local theme Skill. This
file is the context entry point for their purpose, write boundary, and proof;
it is not a duplicate copy of the scripts.

## Active reusable tools

| Tool | Role | Writes | Verification |
| --- | --- | --- | --- |
| `scripts/run-image-jobs.mjs` | Generate reviewed source art | `themes/source-art/*.png` and compact provenance | visual review plus source hashes |
| `scripts/generate-themes.mjs` | Generate declarative packs, Full Skin backgrounds, Native fallbacks, and Registry | `themes/<theme-id>/`, `packages/`, `themes/registry.json` | `npm run generate:check` |
| `scripts/validate.mjs` | Validate schema, paths, dimensions, hashes, rights, Full Skin, Native, and capture evidence | none | `npm run validate` |
| `scripts/build-installer.mjs` | Build the no-admin Windows Native helper | `dist/downloads/*.zip` and installer manifest | `npm run installer:validate` |
| `scripts/capture-full-skin-screenshots.mjs` | Capture the fixed Full Skin fixture on the pinned Beta bench | `screenshots/codex-beta-26.715.3651.0/*.png` and manifest | probe, capture, privacy review, and cleanup |
| `scripts/smoke-theme-manager.mjs` | Drive one isolated Theme Manager apply/restore smoke | `docs/20-architecture/assets/theme-manager-windows.png` | exact process/port identity and cleanup readback |
| `scripts/build.mjs` | Assemble the static Pages artifact | `dist/` | `npm run build` |
| `scripts/serve.mjs` | Serve `dist/` locally | none | browser interaction smoke |
| `.codex/skills/create-codex-theme/scripts/scaffold-theme.mjs` | Scaffold a validated theme brief | `themes/catalog.json`, `themes/source-art/jobs.json` with `--apply` | dry run then `npm run check` |

## Safety boundary

- Theme packs remain code-free; Native output is a declarative
  `codex-theme-v1:` string.
- Full Skin and real-app scripts may affect only the explicitly selected,
  isolated package/session and must prove cleanup.
- They must not write ChatGPT application files, private data, chats,
  credentials, or arbitrary remote registries.
- Registry paths, hashes, dimensions, capture identity, and artwork provenance
  must pass before distribution.

One-off scripts and generated outputs belong in a task package under
`context/raw/` and are deleted after their conclusion is captured. No
undocumented development viewer is retained here.
