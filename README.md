# Awesome Codex Theme

A free, community-run theme standard, registry, validator, and gallery for the
Codex desktop app. The first public release includes a dependency-free GitHub
Pages site, 16 original themes across two collections, reproducible assets,
four adapter targets, and hash-verified Dream Skin installers.

中文简介：这是一个面向 Codex 桌面端的免费主题市场。它负责展示、筛选和安装
主题，不修改官方安装包。首版包含 8 套原创国风修仙主题和 8 套中国城市主题。
所有背景均可重复生成，不包含现有动漫人物、品牌角色、城市标志或第三方版权素材。

Public gallery: https://rwang23.github.io/awesome-codex-theme/

GitHub repository: https://github.com/rwang23/awesome-codex-theme

## Why this project is different

Codex Dream Skin solves the local runtime and reversible injection problem.
Awesome Codex Theme sits one layer above it:

1. an engine-neutral, code-free theme pack contract;
2. a generated registry with rights, compatibility, provenance, and hashes;
3. validators for package contents, dimensions, integrity, and contrast;
4. a public catalog for discovering and previewing themes;
5. explicit adapters for Codex native appearance, Dream Skin, HeiGe Skin
   Studio, and CodeDrobe.

The browser deliberately does not claim to perform a silent one-click install.
Browsers cannot safely write into a desktop app's local data directory. The
Install button copies an explicit command instead.

## Local development

Requirements: Node.js 22 or newer. No package installation is required.

    npm run generate
    npm run check
    npm run serve

Open http://127.0.0.1:4173 after the server starts.

Generated backgrounds, packages, adapter bundles, registry data, and dist/ are
intentionally excluded from Git history. The catalog and deterministic
generator are the reviewable source; local development and GitHub Actions
rebuild the complete distribution.

## Theme installation

Install Codex Dream Skin first:

https://github.com/Fei-Away/Codex-Dream-Skin

From a local clone on Windows:

    powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\install-theme.ps1 -Theme qinglan-odyssey -Mode dark -SourceRoot .

Validate without writing:

    powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\install-theme.ps1 -Theme qinglan-odyssey -Mode dark -SourceRoot . -DryRun

The deployed site generates commands from its own GitHub Pages base URL.

## Original collection 01

- Qinglan Odyssey / Qinglan Little Cultivator
- Starbound Rebel / Starbound Spirit
- Mountain Sword Intent / Little Sword Wanderer
- Cloudsea Pact / Cloudsea Mochi

Chinese titles: 青岚问道 / 青岚小修, 星河逆旅 / 星河灵童, 山河剑意 /
山河剑童, 云海灵契 / 云海团子.

These are independent original worlds. Familiar anime or novel names, character
likenesses, logos, signature costumes, and official artwork are intentionally
excluded. A separately licensed IP collection can be added later without
weakening the public registry's rights standard.

## China City Atlas 01

- Beijing Meridian / 北京·城轴晨光
- Shanghai Afterglow / 上海·潮汐霓虹
- Shenzhen Circuit Rain / 深圳·绿芯阵雨
- Guangzhou Riverwind / 广州·珠水晚风
- Chengdu Teahouse Rain / 成都·竹窗细雨
- Hangzhou Lake Letter / 杭州·湖上来信
- Chongqing Vertical Night / 重庆·山城夜航
- Nanjing Wall Plum / 南京·城墙梅影

The city collection uses weather, terrain, street rhythm, and broad
architectural cues. It does not trace photographs or include city logos,
official mascots, or a copied landmark illustration.

## Compatibility boundary

Codex currently exposes a light, dark, or system appearance preference, not a
public full custom-theme package API. The Codex-native adapter is therefore
marked appearance-only. Dream Skin and HeiGe exports include the visual asset;
the CodeDrobe export includes a reviewable generated CSS target. Adapter files
remain outside the canonical code-free theme package.

## Project map

- site/: public interface
- themes/catalog.json: editable catalog and art-generation source
- themes/registry.json: generated installer registry
- themes/<theme-id>/: generated manifests, backgrounds, and previews
- packages/: canonical theme packs and per-mode adapter bundles
- scripts/: generator, validator, build, server, and installers
- tests/: repository and build-contract checks
- docs/: project routing and architecture notes

## Publishing

Pushes to `main` run generation, validation, tests, a headless Gallery
screenshot, and the GitHub Pages deployment. Generated packages stay out of
Git history and are rebuilt from the committed catalog during CI.

## License

Code is MIT. First-party generated artwork is CC0 1.0. See NOTICE.md for the
interoperability and trademark notice.
