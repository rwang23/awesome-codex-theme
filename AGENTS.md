# Project instructions

Read docs/agent-brief.md before broad exploration.

- Keep the public site dependency-free unless a new dependency has a concrete, reviewed benefit.
- themes/catalog.json, themes/source-art/jobs.json, and reviewed source-art PNGs are the editable sources of truth. Generated theme packs and themes/registry.json must stay reproducible.
- Do not copy third-party theme art into this repository without a documented redistribution license.
- Use the project-local create-codex-theme Skill for new themes, and review image-job output for text, logos, recognizable IP, safe-area drift, and 16:9 cropping.
- Installation must be explicit, reversible, hash-verified, and limited to the Codex Dream Skin theme library.
- Run npm run check after changes to site behavior, theme metadata, generators, or installers.
- Browser interaction is required before claiming a user-facing UI change is complete.
- Create local commits for meaningful verified work. Do not push or create a remote repository without explicit authorization.
