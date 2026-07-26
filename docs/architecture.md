# Architecture

Awesome Codex Theme separates untrusted theme data from trusted runtime code.

```text
theme catalog + source art
          |
          v
generator -> manifest / .act-theme / Registry / Native fallback
          |
          +----------> Validator
          |
          +----------> GitHub Pages Gallery
          |
          +----------> Tauri Theme Manager
                            |
                            v
                    fixed Full Skin runtime
                            |
                            v
                    verified Codex session
```

## Theme data

`themes/catalog.json` and source-art provenance are the maintained inputs. The generator creates:

- `themes/<id>/manifest.json`;
- light and dark 2560×1440 PNGs;
- preview images;
- two Native fallback strings;
- one code-free `.act-theme` archive;
- `themes/registry.json`.

The Registry is the public index. Every path is repository-relative and paired with SHA-256 and byte count. A mode also contains Full Skin composition data and tokens.

Canonical theme archives contain only:

```text
manifest.json
assets/background-light.png
assets/background-dark.png
native/light.codex-theme.txt
native/dark.codex-theme.txt
```

No theme package contains CSS or JavaScript.

## Fixed runtime

`packages/full-skin/runtime.css` and `runtime.js` belong to the manager source tree. They are reviewed, hashed, tested, and shared by every theme.

The runtime:

- creates a fixed, verified in-memory image element behind the Codex app root;
- sets mode, focus, safe-area, and token variables;
- styles native Codex surfaces without moving the DOM;
- adds a small home-screen theme caption;
- watches only for home/task context changes;
- exposes one cleanup function.

Theme data is serialized with `serde_json` before it is inserted into the template. There is no executable field in `act-theme-pack-v1`.

## Tauri manager

The frontend is dependency-free HTML/CSS/JavaScript. It can browse, filter, and preview themes, but it does not receive raw file-system or process permissions. Its bridge exposes a small set of Tauri commands.

Rust owns:

- bundled, cached, and remote Registry validation;
- exact Stable/Beta discovery;
- PNG download, cache, byte-count, signature, and SHA-256 checks;
- loopback CDP session startup;
- target and WebSocket validation;
  - early and current-page injection;
  - restore state;
  - consent-gated per-user persistence state, autostart, version gates, and bounded replay;
  - Native fallback copy;
- release-update state.

The main **Apply & Keep Full Skin** action asks for explicit consent once, then stores the declarative selection in a per-user controller and safely replays the verified session on future launches. A later Apply replaces that saved theme choice. Restore disables the controller, unregisters autostart, removes the current runtime, and leaves ChatGPT files untouched. This is safe replay rather than a permanent application patch.

## Delivery surfaces

### GitHub Pages

The site build copies:

- Registry and schemas;
- theme packages and manifests;
- Full Skin background assets;
- Native fallback files;
- original real Beta screenshots and their 320px, 480px, and 960px presentation variants;
- manager screenshot;
- portable Windows Native helper.

Gallery cards and the hero use responsive presentation variants, never the original evidence PNG during ordinary browsing. Opening the explicit evidence action loads the original 1440×810 capture together with its version, SHA-256, byte count, and fixture metadata. Each presentation variant carries its own hash, dimensions, renderer fingerprint, and a binding to the original evidence hash.

### Desktop application

The manager ships a bundled Registry plus shared 320px list and 960px detail presentations; it does not duplicate the original 1440×810 evidence PNGs for its browse surface. Cards are keyed by theme ID and retained across search, filter, and mode changes. An `IntersectionObserver` rooted at the list assigns list image sources only to visible or near-visible cards, so a mode change does not mutate distant card images. Every catalog carries a monotonically increasing `catalogRevision`; a stale cache or remote descriptor can never replace a newer bundled catalog. The manager also checks the fixed catalog URL, revision, byte count, theme count, and SHA-256 before accepting a remote Registry. Full Skin PNGs are downloaded on demand and retained in the application cache only after hash verification.

### Native fallback

The portable helper and Gallery can copy a strict `codex-theme-v1:` string. Final Native import remains in ChatGPT Settings > Appearance. This path does not install background art.

## Trust boundaries

1. Source art is input, not proof of installed appearance.
2. Generated files are accepted only when hashes and schemas match.
3. Theme packages are data-only.
4. Runtime code is manager-owned and versioned.
5. Remote images are accepted only after exact path, size, PNG signature, and SHA-256 checks.
6. CDP accepts only OS-selected loopback ports, exact package ownership, and `app://` targets.
7. Screenshots are evidence only for the named Beta package.
8. Signing, notarization, and updater keys are release gates, not documentation claims.

## Product boundary

Version 1 themes background, materials, colors, and copy. It preserves Codex navigation, composer behavior, projects, tasks, and account surfaces. Replacing the full information architecture would require a fragile per-version DOM application and is intentionally outside this contract.
