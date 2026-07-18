# Project instructions

Read docs/agent-brief.md before broad exploration.

- Keep the public site dependency-free unless a new dependency has a concrete, reviewed benefit.
- themes/catalog.json, themes/source-art/jobs.json, and reviewed source-art PNGs are the editable sources of truth. Generated theme packs and themes/registry.json must stay reproducible.
- Do not copy third-party theme art into this repository without a documented redistribution license.
- Use the project-local create-codex-theme Skill for new themes. Original work is the default; explicitly requested fan art must use the fan-art profile and policy. Review image-job output for text, logos, undeclared IP, copied official compositions, safe-area drift, and 16:9 cropping.
- `ACT Full Skin v1` is the primary target. Theme packs remain declarative and code-free; all CSS, CDP handling, process checks, caching, and cleanup belong to the fixed, reviewed Theme Manager runtime.
- Full Skin may connect only to a loopback debugging port owned by the exact selected Stable or Beta package and an `app://` target. It must never patch WindowsApps, `app.asar`, ChatGPT private data, or conversation content.
- `codex-theme-v1` remains a palette-only fallback. Do not describe Native import as background installation or export third-party skin-engine formats.
- A real screenshot claim requires the named app version, exact package identity, action-after runtime readback, a privacy-safe capture, and cleanup proof. Source art and generated previews are not screenshots.
- Run `npm run check` after changes to site behavior, theme metadata, generators, Full Skin records, or Native fallbacks. Runtime changes also require Rust tests and an isolated Stable/Beta smoke test.
- Browser interaction is required before claiming a user-facing UI change is complete.
- Create local commits for meaningful verified work. Do not push or create a remote repository without explicit authorization.
