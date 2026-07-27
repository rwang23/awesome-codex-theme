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

The manager downloads only the declared PNG and checks it against the Registry. The fixed repository-owned runtime decodes that verified payload into a manager-owned Blob URL, assigns it to the document root's `--act-art-image` CSS custom property, and applies the materials and tokens above it. Cleanup removes the managed CSS state and revokes that exact Blob URL. It does not create a fixed `<img>` layer, accept a theme-supplied remote URL, or let a theme package replace the runtime.

Theme packages cannot override the runtime. They contain no CSS, JavaScript, shell commands, plugins, or remote URLs.

For original source art, `rightsVerified` is emitted only from the separate
`themes/source-art/reviews.json` approval ledger. Each approval is bound to the
theme ID and source PNG SHA-256, so changing source bytes invalidates the
approval until a new review is recorded. The ledger documents review scope; it
does not claim to clear third-party rights automatically.

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

The runtime is evaluated in the current page and registered through `Page.addScriptToEvaluateOnNewDocument`, so it survives an internal page rebuild. Its observer watches `document.body` with only `childList` and `subtree`; it filters for route and runtime-marker changes before scheduling a repair. Unrelated output mutations do not query route state or call `ensure()`. A five-second fallback performs a health check, which also reconnects the observer if the body node is replaced. Restore removes the registered script and calls the runtime cleanup function in every recorded target.

Restoring the native look does not close the debugging listener. The port closes when the user exits and reopens ChatGPT normally.

### Runtime compatibility and evidence boundary

The current runtime implementation is `act-full-skin-runtime-v3`. It keeps native
error, warning, success, diff, link, disabled, selection, and status-icon colors
outside the structural surfaces that Full Skin owns. A semantic-state HTML fixture
and source contract prevent broad descendant or class-substring color overrides
from returning. It also supplies an explicit focus ring, reduced-motion behavior,
and a forced-colors fallback.

`npm run runtime:benchmark` is a synthetic long-session regression check. It
emits high-volume unrelated output mutations and records callback count, repair
calls, callback wall time, CPU time, heap growth, and an event-loop-delay proxy
against an explicit budget. It is not GPU, browser-frame, or physical-device
proof.

The CSS still uses `background-attachment: fixed`. That setting is intentionally
unchanged until a privacy-safe physical comparison exists on both Windows and
macOS. The committed 136 Beta screenshots were captured with runtime v2 and are
therefore marked as **reference** evidence. Runtime v3 is source-tested and
requires a fresh, exact-package capture before any Gallery, manager, or release
surface may describe it as current app verification.

### Supported presentation

Version 1 covers:

- a full-window background image;
- mode-specific color tokens;
- translucent header, sidebar, home cards, and composer materials;
- readable native text and controls;
- theme title and tagline on the home screen;
- reduced motion and forced-colors fallback.

Version 1 does not:

- reorder or replace native navigation;
- create new ChatGPT panels or task data;
- change account details, projects, chats, or settings;
- patch `app.asar`, WindowsApps, or the macOS app bundle;
- claim public compatibility beyond the version captured in the Registry.

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
| Full Skin | ChatGPT Beta `26.715.3651.0` | 136 real 1440×810 **v2 reference** captures with `5.6 Sol Max`, runtime markers, selector readback, model restoration, and cleanup; current v3 requires recapture |
| Native fallback | ChatGPT Stable `26.715.2305.0` | strict payload generation and parser validation |

Public compatibility evidence is version-bound. A detected Stable or Beta build may run one user-requested, loopback-only local probe; the manager automatically replays it only after that exact version has passed. A new Codex release must still pass a fresh probe, all repository checks, and the full screenshot run before its version is written into the public Registry.

## English summary

ACT Full Skin v1 applies a verified PNG, materials, colors, and theme copy through a manager-owned loopback CDP runtime. The current v3 runtime has source and synthetic-performance coverage; its v2 screenshots remain reference evidence until the named Beta capture is rerun. Theme packs remain declarative and code-free. Codex Native v1 is retained as a palette-only fallback. The project does not export third-party skin-engine formats or modify ChatGPT application files and private data.
