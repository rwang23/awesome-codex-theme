# Codex Theme Pack Standard, version 1

The act-theme-pack-v1 contract defines a portable theme declaration. It does
not define a runtime plugin, an injection mechanism, or permission to execute
code.

## Canonical package

A file ending in .act-theme is a ZIP-compatible archive with exactly:

    manifest.json
    assets/background-light.png
    assets/background-dark.png

Version 1 permits declared artwork and the manifest only. JavaScript, CSS,
PowerShell, shell scripts, binaries, dynamic imports, and remote references are
not canonical package content.

The complete machine-readable contract is schemas/theme-pack.schema.json.

## Manifest responsibilities

The manifest declares:

- stable id, semantic version, localized name, and localized description;
- collection id, visual variant, and pair or standalone identity;
- author and an SPDX-compatible asset license;
- source, generator, AI-use disclosure, and a rightsVerified assertion;
- tested Codex versions and named adapter targets;
- reduced-motion behavior;
- separate light and dark assets;
- UI color tokens, art focus, safe area, and task-page treatment;
- SHA-256, byte count, dimensions, and media type for each asset.

The validator rejects missing fields, unsafe relative paths, files outside the
allowlist, mismatched hashes or sizes, oversized images, malformed dimensions,
collection-policy violations, incomplete paired themes, and color combinations
below the project contrast thresholds.

## Rights boundary

rightsVerified is an accountable assertion, not automatic legal clearance.
Automated checks can prove that a file is declared and unchanged; they cannot
prove that a contributor owns it.

Public submissions must provide a redistributable source and license. Existing
characters, logos, screenshots, celebrity likenesses, signature costumes, and
prompts that imitate a recognizable living artist are not accepted without a
separate documented license.

## Versioning

Breaking manifest or package-layout changes require a new schemaVersion and
standard id. Theme artwork or metadata changes increment the theme version.
Generated registries identify the generator so outputs can be reproduced and
reviewed.
