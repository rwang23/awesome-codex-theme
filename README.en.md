# Awesome Codex Theme

A free theme-pack standard, Registry, Validator, Gallery, and cross-platform theme manager for Codex desktop.

[Open the Gallery](https://rwang23.github.io/awesome-codex-theme/) · [中文 README](README.md) · [Theme-pack standard](docs/standard.md) · [Community path](docs/community-registry.md) · [Release signing](docs/release-signing.md)

![The Awesome Codex Theme Manager on Windows with a real ChatGPT Beta full-skin capture](docs/assets/theme-manager-windows.png)

This is the real Tauri 2 Windows app. The preview inside it was captured from ChatGPT Beta `26.715.3651.0` after the skin was applied and read back, not composited from source artwork.

## Full skins, not palette cards

Codex Native themes can change colors but cannot install a background. The primary target in this project is `ACT Full Skin v1`, which applies:

- a 2560×1440 background with declared focus and safe area;
- separate light and dark tokens;
- translucent sidebar, suggestion-card, and composer materials;
- theme title and short copy;
- reduced motion.

Theme packs remain code-free. A `.act-theme` archive contains a manifest, two images, and two Native fallback palettes. CSS, CDP handling, process checks, and cleanup live in the open-source Theme Manager. Theme authors cannot ship scripts in a pack.

Version 1 preserves the native Codex layout. It does not move navigation, replace the composer, or rebuild application screens. That boundary keeps restoration predictable when Codex updates.

## Collection

The repository contains 28 themes and 56 light/dark modes:

| Collection | Contents | Themes |
| --- | --- | ---: |
| Original Xianxia 01 | Four original worlds, each with cinematic and chibi variants | 8 |
| China City Atlas 01 | Beijing, Shanghai, Shenzhen, Guangzhou, Chengdu, Hangzhou, Chongqing, Nanjing | 8 |
| Donghua Character Tributes 01 | Cinematic and chibi leads from four series | 8 |
| Donghua Memory Scenes 01 | Four remembered scenes | 4 |

All 56 modes have 1440×810 screenshots captured from the isolated ChatGPT Beta `26.715.3651.0` package. Each Registry record binds the capture to the background asset, runtime hash, exact app version, byte count, and selector readback. The Gallery and README use these real captures.

Source art is created through OpenAI image jobs. The repository keeps prompt hashes, model names, job IDs, source hashes, and review notes without storing API keys or raw base64 responses.

The first two collections are original and released under CC0 1.0. The other two are clearly disclosed unofficial AI fan art involving A Record of a Mortal's Journey to Immortality, Renegade Immortal, Sword of Coming, and Battle Through the Heavens. They are for personal, non-commercial fan use, contain no official screenshots or promotional assets, and claim no endorsement. See the [Fan Art policy](docs/fan-art-policy.md).

## Using a theme

The Tauri Theme Manager is the main installation path:

1. Quit the ChatGPT Stable or Beta app that will receive the skin.
2. Choose a theme, mode, and target in Theme Manager.
3. Select **Apply Full Skin**.
4. The manager verifies the Registry, image hash, package identity, and loopback listener before launching the exact app with a local debugging port.
5. Select **Restore Native** to remove the skin. Quit and reopen ChatGPT normally to close the temporary debugging port.

Once ChatGPT is running in a manager-started session, themes can be switched without closing it again. If the target is already running normally, the manager stops and asks the user to quit rather than terminating the app.

Full Skin is scoped to the ChatGPT process launched by Theme Manager. Closing ChatGPT and opening it normally restores the native interface. Apply the skin again from Theme Manager for the next session. This is the intentional no-patch boundary, not an installation failure.

The Gallery still exposes `codex-theme-v1:` strings and a portable Windows helper as palette-only fallbacks. They do not install backgrounds.

## Security boundary

Full Skin uses the Chromium DevTools Protocol for the current app session. The manager accepts only:

- `127.0.0.1` or `::1`;
- fixed Stable and Beta ports;
- a listener owned by the exact selected Store package;
- `app://` page targets.

It does not modify WindowsApps, `app.asar`, ChatGPT private data, or conversations. It never executes code from a theme package. Every downloaded PNG must match its declared path, byte count, and SHA-256. Restore removes both the active styling and scripts registered for later page loads.

This is not an official OpenAI theming API. Compatibility claims are version-bound because Codex updates can change internal selectors. A new app version must pass the validator and the 56-mode capture run. See [Full Skin testing](docs/native-testing.md).

## Why Tauri

Theme Manager uses Tauri 2, dependency-free HTML/CSS/JavaScript, and Rust. Windows and macOS share the same interface and installation core without bundling Chromium. Rust handles Registry validation, image caching, package identity, CDP injection, and cleanup.

Windows verification covers the Rust tests, x64 release build, NSIS package, real manager apply/restore flow, Beta runtime readback, and all 56 captures. CI builds Apple Silicon and Intel DMGs and checks each disk image, bundle identifier, executable, and architecture. Those DMGs remain unsigned test artifacts. Public macOS distribution still needs Apple Developer signing, notarization, and physical-device apply/restore readback. Windows also needs release code signing.

Gallery and Theme Manager choose Chinese or English from the operating system and allow a manual switch. Collection, rights source, and visual form are independent facets. Language changes labels and localized copy; it does not hide Chinese subject matter from English users.

## Community proposals

The Gallery links to a structured bilingual Theme Proposal form. Contributors can share an idea, preview, provenance, and rights track before they know how to package a theme. Reactions show interest only. Validator checks, rights review, and version-pinned real-app evidence decide whether a theme becomes Verified.

The first stage intentionally uses GitHub issues and pull requests instead of accepting anonymous uploads on GitHub Pages. A static site has no trusted identity, quarantine, moderation, or anti-abuse backend. A hosted upload and voting service should be considered only after real submission volume justifies it. See the [community Registry path](docs/community-registry.md).

## Creating a theme with Codex

The repository includes `.codex/skills/create-codex-theme/`. In Codex, a contributor can ask:

```text
Use $create-codex-theme to add an original Suzhou canal-mist theme.
Keep the left work area quiet, provide light and dark modes, and run every check.
```

The Skill prepares the brief and image job, checks original or fan-art disclosure, configures safe areas and contrast, and updates the Registry. A finished contribution must also produce real Full Skin captures from the pinned Beta test bench.

## Local development

Node.js 22+ is required. Desktop work also needs stable Rust and the platform build tools.

```bash
npm run generate
npm run validate
npm test
npm run build
```

Useful commands:

```bash
npm run art:generate
npm run generate
npm run generate:check
npm run validate
npm run screenshots:capture
npm run desktop:check
npm run desktop:start
npm run desktop:build:win
npm run desktop:build:mac
```

Generated theme directories, `.act-theme` archives, the Registry, and `dist/` should not be edited by hand.

## Licensing and AI disclosure

Project code is MIT. First-party AI-generated artwork is CC0 1.0 where applicable. Fan art uses `LicenseRef-ACT-Fan-Art-Notice`, sets `rightsVerified: false`, and is limited to non-commercial fan use.

AI generation does not clear copyright or character rights. Contributors must review inputs and outputs for undisclosed third-party characters, logos, signatures, and protected expression. See [NOTICE.md](NOTICE.md).
