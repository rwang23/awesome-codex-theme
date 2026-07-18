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

- converts the verified PNG into an in-memory blob URL;
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
- Native fallback copy;
- release-update state.

The runtime session is held in process memory. Closing Theme Manager does not silently mutate ChatGPT again. The user can restore before closing; quitting and reopening ChatGPT removes the temporary debugging listener.

## Delivery surfaces

### GitHub Pages

The site build copies:

- Registry and schemas;
- theme packages and manifests;
- Full Skin background assets;
- Native fallback files;
- real Beta screenshots;
- manager screenshot;
- portable Windows Native helper.

Gallery cards use the Registry capture first and fall back to the reviewed preview only when capture evidence is absent.

### Desktop application

The manager ships a bundled Registry and verified screenshots for browsing. It checks the signed catalog descriptor before accepting a newer remote Registry. Full Skin PNGs are downloaded on demand and retained in the application cache only after hash verification.

### Native fallback

The portable helper and Gallery can copy a strict `codex-theme-v1:` string. Final Native import remains in ChatGPT Settings > Appearance. This path does not install background art.

## Trust boundaries

1. Source art is input, not proof of installed appearance.
2. Generated files are accepted only when hashes and schemas match.
3. Theme packages are data-only.
4. Runtime code is manager-owned and versioned.
5. Remote images are accepted only after exact path, size, PNG signature, and SHA-256 checks.
6. CDP accepts loopback addresses, fixed ports, exact package ownership, and `app://` targets.
7. Screenshots are evidence only for the named Beta package.
8. Signing, notarization, and updater keys are release gates, not documentation claims.

## Product boundary

Version 1 themes background, materials, colors, and copy. It preserves Codex navigation, composer behavior, projects, tasks, and account surfaces. Replacing the full information architecture would require a fragile per-version DOM application and is intentionally outside this contract.
