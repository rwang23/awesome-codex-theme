# ACT theme-pack standard v1

`act-theme-pack-v1` is a declarative, code-free format for publishing a Codex visual theme with provenance and integrity metadata.

## Archive layout

```text
theme-id.act-theme
  manifest.json
  assets/
    background-light.png
    background-dark.png
  native/
    light.codex-theme.txt
    dark.codex-theme.txt
```

The archive is ZIP-compatible. Its file allowlist is exact. Scripts, binaries, CSS, symlinks, hidden executables, remote resources, and undeclared files are rejected.

## Manifest

A manifest declares:

- schema version, theme ID, version, collection, variant, and pairing;
- Chinese and English name, tagline, and description;
- author and license;
- provenance record, source hash, prompt hash, model, and review status;
- rights profile and Fan Art notice when applicable;
- compatibility targets;
- tags and reduced-motion behavior;
- light and dark asset records;
- composition focus, directional safe area, task mode, and color tokens;
- image SHA-256, byte count, width, and height;
- Native fallback path, SHA-256, size, and tested version.

Theme IDs and paths use a restricted lowercase syntax. Absolute paths, drive prefixes, `..`, backslashes, query strings, fragments, control characters, and encoded traversal are invalid.

## Full Skin record

The public Registry derives an `act-full-skin-v1` mode record from the manifest. It includes the declared PNG, composition fields, tokens, and tested Codex version.

Runtime code is not part of the theme package. Awesome Codex Theme Manager supplies one fixed, reviewed runtime for every pack. This separation lets the Registry accept community themes without accepting community JavaScript.

## Native fallback

Each mode also exports a strict `codex-theme-v1:` string. It is a palette fallback and has no background field. Unknown Native fields are rejected.

## Integrity and quality gates

The Validator checks:

- JSON Schema and exact keys;
- archive allowlist and path safety;
- source, asset, package, Native, and screenshot hashes;
- PNG signature, dimensions, and byte counts;
- source-art resolution policy, focal crop bounds, and review artifacts;
- light and dark mode completeness;
- color format and WCAG contrast;
- unique Native payloads;
- rights and provenance fields;
- Registry equality;
- real Beta capture coverage;
- runtime cleanup evidence.

Gallery artwork is not treated as installed proof. A public Full Skin claim needs a real screenshot bound to the exact Beta package and runtime hash.

## Source art composition and review

New production source art must be 16:9 and at least 2560x1440. A smaller or differently proportioned source can only be used through a named, reviewed exception in `themes/source-art/jobs.json`. An exception records the exact source size, affected IDs, review date, and reason. The current 1536x1024 exception covers the existing catalog only. It does not authorize a new job.

The renderer uses clamped `focusX` and `focusY` coordinates with `focal-cover-v1`, so a crop follows its declared subject when the source aspect ratio leaves room to move. `safeArea` can be `left`, `right`, `center`, or `none`; it controls the readability wash independently of the crop anchor.

Every source-art renderer revision has deterministic contact sheets and a safe-area fixture under `docs/30-design/assets/source-art-review/`, plus a machine-readable approval record under `themes/source-art/reviews/`. They prove the reviewed generated composition. A new Full Skin runtime or asset still requires a fresh exact-app capture and cleanup readback.

## Color roles

`text` and `muted` must each reach 4.5:1 against both `surface` and `surfaceAlt`. `accent` must reach 3:1 against `background`, `surface`, and `surfaceAlt`, because it marks interactive controls and focus. `border` is decorative and cannot substitute for an interactive focus boundary. `accentContrast` must reach 4.5:1 against `accent`.

## Licensing

Code and the standard are MIT. Original artwork may use CC0 where the contributor has the necessary rights. Fan Art uses `LicenseRef-ACT-Fan-Art-Notice`, sets `rightsVerified: false`, and remains limited to non-commercial fan use. A license value never overrides rights in an underlying character or work.

## Compatibility

The standard can describe themes independently of one Codex build. A compatibility claim cannot. `testedVersion` must name the build that passed the full capture and readback process.
