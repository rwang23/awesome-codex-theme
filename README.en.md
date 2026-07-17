# Awesome Codex Theme

An open Codex Native theme pack standard, Registry, Validator, and Gallery.

[Browse 28 themes](https://rwang23.github.io/awesome-codex-theme/) · [中文 README](README.md) · [Theme pack standard](docs/standard.md) · [Fan Art policy](docs/fan-art-policy.md) · [Contributing](CONTRIBUTING.md)

![Awesome Codex Theme Manager running on Windows with a real ChatGPT Beta theme capture](docs/assets/theme-manager-windows.png)

This is the Tauri 2 Theme Manager running on Windows. Its preview comes from the isolated ChatGPT Beta `26.707.3351.0` test bench; it is not a concept mockup or source artwork pasted into a fake shell.

## More than a background switcher

A CSS injection demo can look convincing while leaving important questions unanswered. Can the artwork be redistributed? Does the package contain executable code? How can an import be checked for tampering? Which theme fields can the current Codex desktop app accept natively?

Awesome Codex Theme puts those answers into one public contract:

- A shared manifest Schema describes identity, assets, modes, provenance, and compatibility.
- A canonical `.act-theme` contains declarative configuration and images only.
- The Registry records SHA-256 hashes, byte counts, dimensions, rights statements, and the Native contract version.
- The Validator checks the package allowlist, hashes, image integrity, WCAG contrast, and duplicate Native palettes.
- Every mode exports a `codex-theme-v1:` string that Codex desktop can import.
- GitHub Pages and the cross-platform Theme Manager both use real Beta captures for browsing, filtering, copying, and downloads.

The project targets Codex Native only. It no longer exports Dream Skin, HeiGe Skin Studio, or CodeDrobe formats, and it does not inject CSS. The native contract supports colors, contrast, fonts, a code theme, and semantic colors, but not background images. Repository illustrations remain cover art and are never applied as app backgrounds. The application views shown by the Gallery come from the separate Beta capture workflow.

## Collections

The repository contains 28 themes with 56 distinct light/dark Native palettes, 56 deterministic covers, and 56 real 1440×810 screenshots captured after importing every mode into the isolated ChatGPT Beta `26.707.3351.0` test bench. The Gallery prefers the real captures and keeps the covers as reviewed source/fallback artwork. Each capture is bound to its Native hash, app readback hash, exact package version, fixed fixture, and baseline restoration evidence. See [Codex Native testing and screenshots](docs/native-testing.md).

| Collection | Contents | Themes |
| --- | --- | ---: |
| Original Xianxia 01 | Four original worlds, each with cinematic and chibi variants | 8 |
| China City Atlas 01 | Beijing, Shanghai, Shenzhen, Guangzhou, Chengdu, Hangzhou, Chongqing, and Nanjing | 8 |
| Donghua Character Tributes 01 | Cinematic and chibi leads from four series | 8 |
| Donghua Memory Scenes 01 | Void Hall, wedding rescue, rain-alley confession, and the Three-Year Agreement | 4 |

Each source image is generated through an OpenAI image job. A human then reviews workspace safe areas, text, watermarks, logos, character identity, and the 16:9 crop. The repository keeps a compact provenance record with the prompt hash, model, job ID, and output hash. It never stores keys or raw responses containing base64 images.

The first two collections are first-party original artwork under CC0 1.0. The latter two are clearly disclosed unofficial AI fan art based on characters and scenes from *A Record of a Mortal's Journey to Immortality*, *Renegade Immortal*, *Sword of Coming*, and *Battle Through the Heavens*. They are offered for personal, non-commercial fan use only. No official stills, posters, logos, or promotional assets are used, and no license or endorsement is claimed. Underlying rights remain with their owners. See the [Fan Art policy](docs/fan-art-policy.md).

## Use a theme

Open the [Gallery](https://rwang23.github.io/awesome-codex-theme/) or use the Tauri Theme Manager. Before the first signed Release, the manager can be built from source. Choose a theme and mode, copy its `codex-theme-v1:` string, then confirm Import in ChatGPT under Settings > Appearance. The manager validates its catalog and opens the detected Stable or Beta app. The portable Windows helper remains available for users who do not want a desktop installation.

The browser, manager, and portable helper never patch WindowsApps, application files, private data, or conversations. They deliberately leave the final import to the user. Canonical theme packages remain declarative and contain no scripts, CSS, or remote resources. See [Codex Native compatibility](docs/adapters.md) for the exact boundary.

## Desktop manager and updates

The manager treats catalog and application updates as separate trust boundaries:

- On every launch, it reads `downloads/catalog.json` from GitHub Pages and accepts the Registry only after checking its SHA-256, byte count, Schema, and Native payload shape. A verified cache and the bundled Registry provide offline fallbacks.
- Once release signing is configured, packaged builds check GitHub Releases. An available update downloads in the background, but installation waits for the user to restart. Development builds without a public updater key do not claim that the update channel is live.

Windows and macOS share Tauri 2, the dependency-free HTML/CSS/JavaScript interface, and one Rust core instead of bundling Chromium. The current Windows NSIS package is 3.66 MiB; the equivalent Electron candidate was 97.45 MiB, a 96.2% reduction. The Windows runtime, exact-copy path, and NSIS package are verified locally. The macOS dual-architecture CI path is present, but production updates still require Apple Developer signing, notarization, and real-device readback. Unsigned artifacts are not presented as finished releases. See [Desktop Theme Manager](docs/desktop-manager.md).

## Create a theme with Codex

The repository includes a project skill at:

```text
.codex/skills/create-codex-theme/
```

Open this repository in Codex and ask:

```text
Use $create-codex-theme to create an original Suzhou canal mist theme.
Keep the left workspace safe area quiet, add light and dark modes,
and run the full validation when it is ready.
```

The Skill covers the bilingual brief, the original/fan-art rights track, image jobs, source-art review, color tokens, catalog scaffolding, Registry generation, validation, and browser acceptance testing.

For original work, copy the [theme brief template](.codex/skills/create-codex-theme/assets/theme-brief.template.json). Explicit unofficial fan art uses the [fan-art brief template](.codex/skills/create-codex-theme/assets/fan-art-theme-brief.template.json). Then run:

```bash
node .codex/skills/create-codex-theme/scripts/scaffold-theme.mjs \
  --brief path/to/theme-brief.json
```

Add `--apply` after reviewing the dry run, then generate and validate:

```bash
npm run art:generate -- --ids=<theme-id>
npm run check
```

## Local development

Node.js 22 or newer is required. Desktop development also needs Rust stable; Windows needs Microsoft C++ Build Tools, and macOS builds need Xcode Command Line Tools. The Gallery, Registry, and Validator have no npm dependencies. The Tauri CLI lives only under `apps/theme-manager`.

```bash
npm run check
npm run serve
```

Key commands:

```bash
npm run art:generate
npm run generate
npm run generate:check
npm run validate
npm run installer:build
npm run installer:validate
npm run screenshots:probe
npm run desktop:test
npm run desktop:check
npm run desktop:start
npm run desktop:build:win
npm run desktop:build:mac
npm test
npm run build
```

## License and AI disclosure

Project code uses the MIT License. First-party AI-generated artwork is dedicated under CC0 1.0 to the extent applicable rights exist. Unofficial fan art uses `LicenseRef-ACT-Fan-Art-Notice`, declares `rightsVerified: false`, prohibits commercial use, and links to the [Fan Art policy](docs/fan-art-policy.md). Every theme declares `aiGenerated: true` and keeps reviewable prompt and source hashes.

AI generation is not a copyright license and does not clear underlying character or franchise rights. Contributors remain responsible for inputs and for identifying any third-party characters, logos, signatures, or protected expression. See [NOTICE.md](NOTICE.md).
