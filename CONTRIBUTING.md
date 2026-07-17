# Contributing a theme

Submit a theme only when you can grant redistribution rights for every asset.
Original work, CC0/public-domain material, and clearly licensed reusable art
are acceptable. Do not submit celebrity likenesses, protected characters,
screenshots, logos, or generated images that imitate a recognizable living
artist.

## Package requirements

- Landscape 2560 x 1440 background.
- PNG, JPEG, or WebP, no larger than 16 MB.
- No Codex UI, fake controls, text, logos, or window chrome baked into the art.
- Keep a low-information safe area for the native Codex title and composer.
- Use a stable lowercase theme id with single hyphens.
- Provide both light and dark modes plus reduced-motion-safe behavior.
- Record the author, source, SPDX license, compatibility, tags, and provenance.
- Keep the canonical package declarative: manifest and declared artwork only.
- Do not place JavaScript, CSS, shell scripts, executables, or remote references
  inside the canonical package.

Add the catalog entry to themes/catalog.json, then run:

    npm run generate
    npm run check

Include real target-engine verification when claiming adapter compatibility.
Preview images are evidence of appearance, not installable backgrounds.

The validator checks contrast and structure, but it cannot grant copyright
permission. Contributors remain responsible for the truth of every provenance
and rights field.
