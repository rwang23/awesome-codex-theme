# Awesome Codex Theme

An open theme pack standard, Registry, Validator, and theme Gallery for Codex.

[Browse 28 themes](https://rwang23.github.io/awesome-codex-theme/) · [中文 README](README.md) · [Theme pack standard](docs/standard.md) · [Fan Art policy](docs/fan-art-policy.md) · [Contributing](CONTRIBUTING.md)

![Mortal Journey Void Hall source artwork](themes/source-art/mortal-void-hall.png)

## More than a background switcher

A CSS injection demo can look convincing while leaving important questions unanswered. Can the artwork be redistributed? Does the package contain executable code? How does an installer prove that a downloaded file has not changed? How much of a theme can each engine reproduce?

Awesome Codex Theme puts those answers into one public contract:

- A shared manifest Schema describes identity, assets, modes, provenance, and compatibility.
- A canonical `.act-theme` contains declarative configuration and images only.
- The Registry records SHA-256 hashes, byte counts, dimensions, rights statements, and adapter coverage.
- The Validator checks the package allowlist, hashes, image integrity, and WCAG contrast.
- Adapters export Codex native, Dream Skin, HeiGe Skin Studio, and CodeDrobe formats outside the trusted package.
- GitHub Pages provides previews, filters, mode switching, downloads, and a verified install command.

## Collections

The repository contains 28 themes and 56 real light/dark previews. Gallery cards use the generated 960×540 PNG previews rather than concept placeholders.

| Collection | Contents | Themes |
| --- | --- | ---: |
| Original Xianxia 01 | Four original worlds, each with cinematic and chibi variants | 8 |
| China City Atlas 01 | Beijing, Shanghai, Shenzhen, Guangzhou, Chengdu, Hangzhou, Chongqing, and Nanjing | 8 |
| Donghua Character Tributes 01 | Cinematic and chibi leads from four series | 8 |
| Donghua Memory Scenes 01 | Void Hall, wedding rescue, rain-alley confession, and the Three-Year Agreement | 4 |

Each source image is generated through an OpenAI image job. A human then reviews workspace safe areas, text, watermarks, logos, character identity, and the 16:9 crop. The repository keeps a compact provenance record with the prompt hash, model, job ID, and output hash. It never stores keys or raw responses containing base64 images.

The first two collections are first-party original artwork under CC0 1.0. The latter two are clearly disclosed unofficial AI fan art based on characters and scenes from *A Record of a Mortal's Journey to Immortality*, *Renegade Immortal*, *Sword of Coming*, and *Battle Through the Heavens*. They are offered for personal, non-commercial fan use only. No official stills, posters, logos, or promotional assets are used, and no license or endorsement is claimed. Underlying rights remain with their owners. See the [Fan Art policy](docs/fan-art-policy.md).

## Use a theme

Open the [Gallery](https://rwang23.github.io/awesome-codex-theme/), choose a theme and mode, then open the install panel.

Dream Skin offers a command that verifies hashes before writing to its theme library. Other targets provide adapter downloads for manual import. The browser never writes directly to Codex.

The Codex native adapter currently exports the light or dark appearance preference only. It does not claim native support for custom backgrounds or palettes. See [adapter coverage](docs/adapters.md) for details.

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

Node.js 22 or newer is required. The project has no npm runtime or development dependencies.

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
npm test
npm run build
```

## License and AI disclosure

Project code uses the MIT License. First-party AI-generated artwork is dedicated under CC0 1.0 to the extent applicable rights exist. Unofficial fan art uses `LicenseRef-ACT-Fan-Art-Notice`, declares `rightsVerified: false`, prohibits commercial use, and links to the [Fan Art policy](docs/fan-art-policy.md). Every theme declares `aiGenerated: true` and keeps reviewable prompt and source hashes.

AI generation is not a copyright license and does not clear underlying character or franchise rights. Contributors remain responsible for inputs and for identifying any third-party characters, logos, signatures, or protected expression. See [NOTICE.md](NOTICE.md).
