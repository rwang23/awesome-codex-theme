# Codex Full Skin compatibility

Awesome Codex Theme has two Codex targets:

1. `codex-full-skin`: the primary runtime for background, materials, colors, and theme copy.
2. `codex-native`: a palette-only fallback using `codex-theme-v1:`.

The project does not export Dream Skin, HeiGe Skin Studio, CodeDrobe, or other third-party formats.

## ACT Full Skin v1

`act-full-skin-v1` is owned by Awesome Codex Theme Manager. A Registry mode record declares:

- one PNG path, SHA-256, byte count, width, and height;
- `focusX`, `focusY`, `safeArea`, and `taskMode`;
- background, surface, text, accent, muted, and border tokens;
- the exact Codex version used for verification.

The manager downloads only the declared PNG, checks it against the Registry, and converts it to an in-memory blob URL. It then applies a fixed repository-owned CSS/JavaScript runtime to the current Codex session.

Theme packages cannot override the runtime. They contain no CSS, JavaScript, shell commands, plugins, or remote URLs.

### Session lifecycle

On Windows, the manager detects the exact Store package, checks whether its executable is already running, and starts it with:

```text
--remote-debugging-address=127.0.0.1
--remote-debugging-port=<OS-selected loopback port>
```

The manager asks the operating system for an available loopback port for every
new controlled session. This avoids collisions with Windows reserved-port
ranges and other local software. The manager accepts the listener only when
the owning executable path and package full name match the selected target. It
connects only to loopback WebSockets whose target URL starts with `app://`.

The runtime is evaluated in the current page and registered through `Page.addScriptToEvaluateOnNewDocument`, so it survives an internal page rebuild. Restore removes the registered script and calls the runtime cleanup function in every recorded target.

Restoring the native look does not close the debugging listener. The port closes when the user exits and reopens ChatGPT normally.

### Supported presentation

Version 1 covers:

- a full-window background image;
- mode-specific color tokens;
- translucent header, sidebar, home cards, and composer materials;
- readable native text and controls;
- theme title and tagline on the home screen;
- reduced motion.

Version 1 does not:

- reorder or replace native navigation;
- create new ChatGPT panels or task data;
- change account details, projects, chats, or settings;
- patch `app.asar`, WindowsApps, or the macOS app bundle;
- promise compatibility beyond the tested app version.

The first two reference screenshots supplied for this project fit the v1 target. A mockup that replaces the entire Codex information architecture does not.

## Codex Native fallback

Every mode also exports a strict `codex-theme-v1:` string for **Settings > Appearance > Import**. It contains:

- `variant`;
- `codeThemeId`;
- `accent`, `surface`, and `ink`;
- `contrast`;
- UI and code font fields, left as `null`;
- semantic colors;
- `opaqueWindows`.

Unknown fields are rejected. Native v1 does not accept a background image, so this path changes the palette only.

## Verified versions

| Target | Version | Evidence |
| --- | --- | --- |
| Full Skin | ChatGPT Beta `26.715.3651.0` | 106 real 1440×810 captures with `5.6 Sol Ultra`, runtime markers, selector readback, model restoration, cleanup |
| Native fallback | ChatGPT Stable `26.715.2305.0` | strict payload generation and parser validation |

Compatibility is version-bound. A new Codex release must pass a fresh probe, all repository checks, and the full screenshot run before its version is written into the Registry.

## English summary

ACT Full Skin v1 applies a verified PNG, materials, colors, and theme copy through a manager-owned loopback CDP runtime. Theme packs remain declarative and code-free. Codex Native v1 is retained as a palette-only fallback. The project does not export third-party skin-engine formats or modify ChatGPT application files and private data.
