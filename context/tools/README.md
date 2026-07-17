# Tool index

## Active reusable tools

| Tool | Role | Writes | Verification |
| --- | --- | --- | --- |
| scripts/run-image-jobs.mjs | Generate reviewed 1536 x 1024 source art through the shared OpenAI image-job runner | themes/source-art/*.png and compact provenance | visual review plus source hashes |
| scripts/generate-themes.mjs | Decode source art and generate 28 deterministic dual-mode packs, covers, Codex Native strings, and Registry | themes/<theme-id>/, packages/, themes/registry.json | npm run generate:check |
| scripts/validate.mjs | Validate ids, paths, dimensions, hashes, allowlists, contrast, rights rules, and Native strings | none | npm run validate |
| scripts/build.mjs | Assemble the static Pages artifact | dist/ | npm run build |
| scripts/serve.mjs | Serve dist/ on localhost | none | browser smoke |
| .codex/skills/create-codex-theme/scripts/scaffold-theme.mjs | Dry-run or append a validated theme brief to the catalog and image-job queue | themes/catalog.json, themes/source-art/jobs.json with --apply | dry run, then npm run check |
The image-job runner writes only inside `themes/source-art/`. No repository
script writes Codex user state. Native import remains an explicit action inside
Codex Settings.

## Safety

- Registry paths, Native hashes, byte counts, manifest identity, and artwork
  hashes must pass before distribution.
- Native exports are declarative `codex-theme-v1` strings with no executable
  code or remote resource.
- The Gallery may open Codex settings, but it must never claim to apply a theme
  automatically.
- Real-app imports and screenshots follow `docs/native-testing.md` and require
  an isolated or explicitly approved Codex instance.
