import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { renderSourceArtPng } from "./lib/png.mjs";
import { createZip } from "./lib/zip.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const CATALOG_PATH = path.join(ROOT, "themes", "catalog.json");
const CHECK_MODE = process.argv.includes("--check");
const GENERATOR_ID = "act-theme-generator-v2.0";
const FAN_ART_LICENSE_ID = "LicenseRef-ACT-Fan-Art-Notice";
const FAN_ART_POLICY_URL = "https://github.com/rwang23/awesome-codex-theme/blob/main/docs/fan-art-policy.md";

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function jsonBuffer(value) {
  return Buffer.from(JSON.stringify(value, null, 2) + "\n", "utf8");
}

function rightsFor(theme) {
  const fanArt = theme.rightsProfile === "fan-art";
  return fanArt
    ? {
        fanArt: true,
        license: {
          spdx: FAN_ART_LICENSE_ID,
          scope: "artwork-only",
          url: FAN_ART_POLICY_URL,
        },
        provenanceType: "fan-art",
        rightsVerified: false,
        notes: "Unofficial AI-generated fan art. No official image assets were used. No license or endorsement from the underlying franchise rights holders is claimed.",
      }
    : {
        fanArt: false,
        license: {
          spdx: "CC0-1.0",
          scope: "artwork-and-manifest",
          url: "https://creativecommons.org/publicdomain/zero/1.0/",
        },
        provenanceType: "original",
        rightsVerified: true,
        notes: "Original AI-generated source art, reviewed for third-party characters, logos, signatures, text, screenshots, and franchise assets.",
      };
}

function manifestFor(theme, assets, sourceProvenance) {
  const rights = rightsFor(theme);
  const mode = (name) => ({
    asset: "assets/background-" + name + ".png",
    art: {
      focusX: theme.art.focusX,
      focusY: theme.art.focusY,
      safeArea: theme.art.safeArea,
      taskMode: theme.art.taskMode,
    },
    tokens: theme[name].tokens,
    integrity: {
      sha256: sha256(assets[name]),
      bytes: assets[name].length,
      width: 2560,
      height: 1440,
    },
  });

  return {
    schemaVersion: 1,
    id: theme.id,
    version: theme.version,
    collection: theme.collection,
    variant: theme.variant,
    pair: theme.pair,
    rightsProfile: theme.rightsProfile || "original",
    name: theme.name,
    description: theme.description,
    ...(rights.fanArt ? { fanArt: theme.fanArt } : {}),
    author: {
      name: "Awesome Codex Theme",
    },
    license: rights.license,
    provenance: {
      type: rights.provenanceType,
      source: "themes/source-art/" + theme.id + ".provenance.json",
      generator: "openai-image-job + " + GENERATOR_ID,
      aiGenerated: true,
      rightsVerified: rights.rightsVerified,
      model: sourceProvenance.model,
      jobId: sourceProvenance.jobId,
      promptSha256: sourceProvenance.promptSha256,
      sourceSha256: sourceProvenance.sourceSha256,
      notes: rights.notes,
    },
    compatibility: {
      codexDesktopTested: "26.707.12708.0",
      engines: [
        { id: "codex-native", coverage: "appearance-only", testedVersion: "26.707.12708.0" },
        { id: "dream-skin", coverage: "full", testedVersion: "1.2.0-theme-schema-1" },
        { id: "heige-skin-studio", coverage: "full", testedVersion: "theme-schema-1-observed-2026-07-16" },
        { id: "codedrobe", coverage: "source-export", testedVersion: "theme-schema-1-observed-2026-07-16" },
      ],
    },
    motion: {
      default: "reduced",
      animated: false,
    },
    tags: theme.tags,
    modes: {
      light: mode("light"),
      dark: mode("dark"),
    },
  };
}

function dreamSkinFiles(theme, mode, background) {
  const tokens = theme[mode].tokens;
  const manifest = {
    schemaVersion: 1,
    id: "act-" + theme.id + "-" + mode,
    name: theme.name["zh-CN"] + " · " + (mode === "light" ? "明" : "暗"),
    brandSubtitle: "AWESOME CODEX THEME",
    tagline: theme.description["zh-CN"],
    projectPrefix: "选择项目 · ",
    projectLabel: "◉  选择项目",
    statusText: "ACT THEME ONLINE",
    quote: "MAKE THE WORKSPACE YOURS",
    image: "background.png",
    appearance: mode,
    colors: {
      background: tokens.background,
      panel: tokens.surface,
      panelAlt: tokens.surfaceAlt,
      accent: tokens.accent,
      accentAlt: tokens.accent,
      secondary: tokens.border,
      highlight: tokens.accent,
      text: tokens.text,
      muted: tokens.muted,
      line: tokens.border,
    },
    art: {
      focusX: theme.art.focusX,
      focusY: theme.art.focusY,
      safeArea: theme.art.safeArea,
      taskMode: theme.art.taskMode,
    },
  };
  return [
    { name: "dream-skin/theme.json", data: jsonBuffer(manifest) },
    { name: "dream-skin/background.png", data: background },
  ];
}

function nativeFiles(theme, mode) {
  const profile = {
    schemaVersion: 1,
    adapter: "codex-native",
    themeId: theme.id,
    mode,
    coverage: "appearance-only",
    config: {
      desktop: {
        appearanceTheme: mode,
      },
    },
    unsupported: ["custom-background", "custom-palette", "custom-copy"],
    note: "The tested Codex native surface exposes light, dark, and system appearance. This profile does not claim full visual parity.",
  };
  const toml = "[desktop]\nappearanceTheme = \"" + mode + "\"\n";
  return [
    { name: "codex-native/profile.json", data: jsonBuffer(profile) },
    { name: "codex-native/config.toml", data: Buffer.from(toml, "utf8") },
  ];
}

function heigeFiles(theme, mode, background) {
  const tokens = theme[mode].tokens;
  const manifest = {
    schemaVersion: 1,
    id: "act-" + theme.id + "-" + mode,
    name: theme.name["zh-CN"] + " · " + (mode === "light" ? "明" : "暗"),
    hero: "hero.png",
    colors: {
      accent: tokens.accent,
      secondary: tokens.border,
      surface: tokens.surface,
      text: tokens.text,
    },
    copy: {
      brand: "Awesome Codex Theme",
      headline: theme.name["zh-CN"],
      tagline: theme.description["zh-CN"],
    },
  };
  return [
    { name: "heige-skin-studio/theme.json", data: jsonBuffer(manifest) },
    { name: "heige-skin-studio/hero.png", data: background },
  ];
}

function codedrobeCss(theme, mode) {
  const tokens = theme[mode].tokens;
  return [
    "html.codedrobe-host-codex {",
    "  --act-background: " + tokens.background + ";",
    "  --act-surface: " + tokens.surface + ";",
    "  --act-surface-alt: " + tokens.surfaceAlt + ";",
    "  --act-text: " + tokens.text + ";",
    "  --act-muted: " + tokens.muted + ";",
    "  --act-accent: " + tokens.accent + ";",
    "  --act-border: " + tokens.border + ";",
    "  color-scheme: " + mode + ";",
    "}",
    "",
    "html.codedrobe-host-codex body {",
    "  color: var(--act-text);",
    "  background-color: var(--act-background);",
    "}",
    "",
    "html.codedrobe-host-codex [role='main']::before {",
    "  content: '';",
    "  position: fixed;",
    "  inset: 0;",
    "  z-index: -1;",
    "  pointer-events: none;",
    "  background-image: linear-gradient(90deg, color-mix(in srgb, var(--act-background) 82%, transparent), transparent 62%), var(--codedrobe-image-hero);",
    "  background-size: cover;",
    "  background-position: " + Math.round(theme.art.focusX * 100) + "% " + Math.round(theme.art.focusY * 100) + "%;",
    "}",
    "",
    "html.codedrobe-host-codex :focus-visible {",
    "  outline: 2px solid var(--act-accent);",
    "  outline-offset: 2px;",
    "}",
    "",
    "@media (prefers-reduced-motion: reduce) {",
    "  html.codedrobe-host-codex *,",
    "  html.codedrobe-host-codex *::before,",
    "  html.codedrobe-host-codex *::after {",
    "    animation-duration: 0.001ms !important;",
    "    animation-iteration-count: 1 !important;",
    "    scroll-behavior: auto !important;",
    "    transition-duration: 0.001ms !important;",
    "  }",
    "}",
    "",
  ].join("\n");
}

function codedrobeFiles(theme, mode, background) {
  const tokens = theme[mode].tokens;
  const manifest = {
    schemaVersion: 1,
    id: "act-" + theme.id + "-" + mode,
    displayName: theme.name.en + " · " + mode,
    version: theme.version,
    images: {
      hero: "assets/hero.png",
    },
    copy: {
      tagline: theme.description.en,
    },
    targets: {
      codex: {
        css: "codex.css",
        options: {
          rendererProfile: "codex-theme-v1",
          baseTheme: {
            mode,
            accent: tokens.accent,
            ink: tokens.text,
            surface: tokens.surface,
          },
        },
      },
    },
  };
  return [
    { name: "codedrobe/theme.json", data: jsonBuffer(manifest) },
    { name: "codedrobe/codex.css", data: Buffer.from(codedrobeCss(theme, mode), "utf8") },
    { name: "codedrobe/assets/hero.png", data: background },
  ];
}

function adapterBundle(theme, mode, background) {
  const files = [
    ...nativeFiles(theme, mode),
    ...dreamSkinFiles(theme, mode, background),
    ...heigeFiles(theme, mode, background),
    ...codedrobeFiles(theme, mode, background),
    {
      name: "README.txt",
      data: Buffer.from(
        "Generated adapters for " + theme.id + " (" + mode + ").\n"
        + "The canonical .act-theme package remains code-free. Adapter outputs are deterministic build artifacts.\n",
        "utf8",
      ),
    },
  ];
  return createZip(files);
}

export async function buildGeneratedFiles() {
  const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8"));
  const files = new Map();
  const registryThemes = [];

  for (const theme of catalog.themes) {
    const rights = rightsFor(theme);
    const themeRoot = "themes/" + theme.id;
    const [sourceArt, sourceProvenance] = await Promise.all([
      readFile(path.join(ROOT, "themes", "source-art", theme.id + ".png")),
      readFile(path.join(ROOT, "themes", "source-art", theme.id + ".provenance.json"), "utf8")
        .then(JSON.parse),
    ]);
    const assets = {
      light: renderSourceArtPng(sourceArt, theme, "light", 2560, 1440),
      dark: renderSourceArtPng(sourceArt, theme, "dark", 2560, 1440),
    };
    const previews = {
      light: renderSourceArtPng(sourceArt, theme, "light", 960, 540),
      dark: renderSourceArtPng(sourceArt, theme, "dark", 960, 540),
    };
    const manifest = manifestFor(theme, assets, sourceProvenance);
    const manifestBuffer = jsonBuffer(manifest);

    files.set(themeRoot + "/manifest.json", manifestBuffer);
    files.set(themeRoot + "/assets/background-light.png", assets.light);
    files.set(themeRoot + "/assets/background-dark.png", assets.dark);
    files.set(themeRoot + "/previews/light.png", previews.light);
    files.set(themeRoot + "/previews/dark.png", previews.dark);

    const canonicalPackage = createZip([
      { name: "manifest.json", data: manifestBuffer },
      { name: "assets/background-light.png", data: assets.light },
      { name: "assets/background-dark.png", data: assets.dark },
    ]);
    const packagePath = "packages/" + theme.id + "-" + theme.version + ".act-theme";
    files.set(packagePath, canonicalPackage);

    const modeRecords = {};
    for (const mode of ["light", "dark"]) {
      const bundle = adapterBundle(theme, mode, assets[mode]);
      const bundlePath = "packages/adapters/" + theme.id + "-" + mode + ".zip";
      files.set(bundlePath, bundle);
      modeRecords[mode] = {
        preview: themeRoot + "/previews/" + mode + ".png",
        previewSha256: sha256(previews[mode]),
        assetSha256: sha256(assets[mode]),
        assetBytes: assets[mode].length,
        adapterBundle: {
          path: bundlePath,
          sha256: sha256(bundle),
          bytes: bundle.length,
        },
      };
    }

    registryThemes.push({
      id: theme.id,
      version: theme.version,
      collection: theme.collection,
      pair: theme.pair,
      variant: theme.variant,
      rightsProfile: theme.rightsProfile || "original",
      name: theme.name,
      description: theme.description,
      tags: theme.tags,
      ...(rights.fanArt ? { fanArt: theme.fanArt } : {}),
      license: {
        spdx: rights.license.spdx,
        rightsVerified: rights.rightsVerified,
        url: rights.license.url,
      },
      provenance: {
        type: rights.provenanceType,
        aiGenerated: true,
        rightsVerified: rights.rightsVerified,
        generator: "openai-image-job + " + GENERATOR_ID,
        model: sourceProvenance.model,
        jobId: sourceProvenance.jobId,
        sourceArt: "themes/source-art/" + theme.id + ".png",
        record: "themes/source-art/" + theme.id + ".provenance.json",
        promptRecord: "themes/source-art/jobs.json#" + theme.id,
        promptSha256: sourceProvenance.promptSha256,
        sourceSha256: sourceProvenance.sourceSha256,
      },
      motion: {
        default: "reduced",
        animated: false,
      },
      previews: modeRecords,
      package: {
        path: packagePath,
        sha256: sha256(canonicalPackage),
        bytes: canonicalPackage.length,
        manifest: themeRoot + "/manifest.json",
        manifestSha256: sha256(manifestBuffer),
      },
      exports: {
        "codex-native": {
          coverage: "appearance-only",
          root: "codex-native",
          limitations: ["custom-background", "custom-palette", "custom-copy"],
        },
        "dream-skin": {
          coverage: "full",
          root: "dream-skin",
          installable: true,
        },
        "heige-skin-studio": {
          coverage: "full",
          root: "heige-skin-studio",
          installable: false,
        },
        codedrobe: {
          coverage: "source-export",
          root: "codedrobe",
          installable: false,
        },
      },
    });
  }

  const registry = {
    schemaVersion: 1,
    standard: "act-theme-pack-v1",
    generatedBy: GENERATOR_ID,
    collections: catalog.collections.map((collection) => ({
      ...collection,
      themeCount: catalog.themes.filter((theme) => theme.collection === collection.id).length,
    })),
    themes: registryThemes,
  };
  files.set("themes/registry.json", jsonBuffer(registry));
  return files;
}

async function compareFile(relativePath, expected) {
  const target = path.join(ROOT, ...relativePath.split("/"));
  try {
    const actual = await readFile(target);
    return actual.equals(expected);
  } catch {
    return false;
  }
}

async function main() {
  const files = await buildGeneratedFiles();
  const drift = [];

  if (CHECK_MODE) {
    for (const [relativePath, expected] of files) {
      if (!(await compareFile(relativePath, expected))) drift.push(relativePath);
    }
    if (drift.length) {
      console.error("Generated theme output is stale:");
      for (const file of drift) console.error("  " + file);
      process.exitCode = 1;
      return;
    }
    console.log("Generated theme output is reproducible (" + files.size + " files).");
    return;
  }

  for (const [relativePath, data] of files) {
    const target = path.join(ROOT, ...relativePath.split("/"));
    await mkdir(path.dirname(target), { recursive: true });
    let unchanged = false;
    try {
      const info = await stat(target);
      if (info.isFile()) unchanged = (await readFile(target)).equals(data);
    } catch {}
    if (!unchanged) await writeFile(target, data);
  }
  console.log("Generated " + files.size + " theme files from themes/catalog.json.");
}

if (path.resolve(process.argv[1] || "") === fileURLToPath(import.meta.url)) {
  await main();
}
