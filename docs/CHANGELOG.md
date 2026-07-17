# Changelog

## 2026-07-16-03-00

- Replaced the derivative editorial Gallery direction with an independent,
  Chinese-first theme archive built around a live Codex workspace preview.
- Rebuilt all 16 theme source images through OpenAI image jobs and added
  compact, reviewable provenance for every source.
- Added deterministic source-PNG decoding, 16:9 cropping, light and dark
  grading, package generation, and hash validation.
- Added the project-local `$create-codex-theme` Skill, brief template,
  scaffolding script, image-job playbook, and originality checks.
- Rewrote the primary README and contribution guide in Chinese, with a full
  secondary English README.
- Documented the Gallery redesign boundary and the updated xianxia and city
  art direction.

## 2026-07-16-02-00

- Fixed the install dialog so its trust note follows the selected adapter
  instead of always describing the Dream Skin installer.

## 2026-07-16-01-00

- Added China City Atlas 01 with eight original, dual-mode city themes.
- Added collection metadata and pairing policies to the catalog, registry, and canonical manifests.
- Added collection switching and a city-specific filter to the bilingual Gallery.
- Added deterministic city motifs for Beijing, Shanghai, Shenzhen, Guangzhou,
  Chengdu, Hangzhou, Chongqing, and Nanjing.
- Added the Urban Palimpsest art direction and a seeded parameter studio for
  developing later city themes.
- Updated validation and tests for 16 themes, 32 modes, two collection
  policies, and 32 adapter bundles.

## 2026-07-16-00-00

- Created the local Awesome Codex Theme repository.
- Added a dependency-free GitHub Pages marketplace.
- Added a reproducible theme catalog with eight original, dual-mode procedural packs.
- Added the act-theme-pack-v1 Schema and generated registry.
- Added explicit native, Dream Skin, HeiGe, and CodeDrobe adapter exports.
- Added registry validation, contrast gates, deterministic builds, local tests,
  and hash-verified dry-run installers.
- Kept generated binary distribution artifacts out of Git history; CI rebuilds
  them from the committed catalog and generator.
- Documented licensing, contribution, compatibility, and installation boundaries.
