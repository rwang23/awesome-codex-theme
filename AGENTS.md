# Project instructions

Read docs/agent-brief.md before broad exploration.

- Keep the public site dependency-free unless a new dependency has a concrete, reviewed benefit.
- themes/catalog.json, themes/source-art/jobs.json, and reviewed source-art PNGs are the editable sources of truth. Generated theme packs and themes/registry.json must stay reproducible.
- Do not copy third-party theme art into this repository without a documented redistribution license.
- Use the project-local create-codex-theme Skill for new themes. Original work is the default; explicitly requested fan art must use the fan-art profile and policy. Review image-job output for text, logos, undeclared IP, copied official compositions, safe-area drift, and 16:9 cropping.
- Native delivery must use the versioned `codex-theme-v1` import string. A companion installer may validate bundled themes, copy a selected string, and open the exact registered Stable or Beta app. It must not patch app files, write private app data, automate the final import, inject CSS, or export third-party skin formats.
- Gallery artwork is cover art. Do not call it a Codex screenshot; real screenshot claims require an import in the named Codex version.
- Run npm run check after changes to site behavior, theme metadata, generators, or Native exports.
- Browser interaction is required before claiming a user-facing UI change is complete.
- Create local commits for meaningful verified work. Do not push or create a remote repository without explicit authorization.
