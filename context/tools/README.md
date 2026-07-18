# Tool index

## Active reusable tools

| Tool | Role | Writes | Verification |
| --- | --- | --- | --- |
| scripts/run-image-jobs.mjs | Generate reviewed 1536 x 1024 source art through the shared OpenAI image-job runner | themes/source-art/*.png and compact provenance | visual review plus source hashes |
| scripts/generate-themes.mjs | Decode source art and generate 28 deterministic dual-mode packs, Full Skin backgrounds, Native fallbacks, and Registry | themes/<theme-id>/, packages/, themes/registry.json | npm run generate:check |
| scripts/validate.mjs | Validate ids, paths, dimensions, hashes, allowlists, contrast, rights rules, Full Skin records, Native fallbacks, and capture evidence | none | npm run validate |
| scripts/build-installer.mjs | Build the no-admin Windows companion installer with a bundled Registry snapshot | dist/downloads/*.zip and installer manifest | npm run installer:validate |
| scripts/capture-full-skin-screenshots.mjs | Apply the fixed runtime to the pinned Beta test bench, capture all 56 Full Skin modes, and prove cleanup | screenshots/codex-beta-26.715.3651.0/*.png and manifest | npm run screenshots:probe plus `npm run screenshots:capture` with explicit authorization |
| scripts/smoke-theme-manager.mjs | Drive the real Tauri UI, apply one Full Skin, read back Beta markers, capture the manager, restore, and verify cleanup | docs/assets/theme-manager-windows.png | explicit `--apply`, exact Manager/Beta ports, and final marker readback |
| scripts/build.mjs | Assemble the static Pages artifact | dist/ | npm run build |
| scripts/prepare-desktop.mjs | Generate the deterministic desktop icon and confirm the Registry is ready for packaging | apps/theme-manager/build/icon.png | npm run desktop:prepare |
| scripts/serve.mjs | Serve dist/ on localhost | none | browser smoke |
| .codex/skills/create-codex-theme/scripts/scaffold-theme.mjs | Dry-run or append a validated theme brief to the catalog and image-job queue | themes/catalog.json, themes/source-art/jobs.json with --apply | dry run, then npm run check |
The image-job runner writes only inside `themes/source-art/`. The Full Skin
capture and manager smoke scripts can change only the explicitly selected,
isolated ChatGPT session and must prove cleanup. They do not write Codex private
app data. The companion installer can copy a selected Native fallback string;
Native import remains an explicit action inside ChatGPT Settings.

The Tauri Theme Manager keeps its CLI dependency, Rust backend, and generated
release output under `apps/theme-manager/`. It can cache a validated public
Registry and hash-bound background in its own application data directory, copy
the selected Native fallback, and launch an exact ChatGPT package with a
loopback-only debugging port. It applies one fixed, manager-owned runtime and
does not modify ChatGPT application files, private data, or chats.

## Safety

- Registry paths, Full Skin and Native hashes, byte counts, manifest identity,
  capture evidence, and artwork hashes must pass before distribution.
- Native exports are declarative `codex-theme-v1` strings with no executable
  code or remote resource.
- The Gallery cannot apply Full Skin by itself. It hands off to the local Theme
  Manager.
- Real-app application and screenshots follow `docs/native-testing.md` and
  require an isolated or explicitly approved Codex instance.
- Capture mode pins the exact Beta package and loopback listener, uses a
  privacy-safe home fixture, records action-after markers, and removes current
  styles plus every registered early script before completion.
