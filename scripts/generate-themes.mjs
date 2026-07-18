import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readPngDimensions, renderSourceArtPng } from "./lib/png.mjs";
import { createZip } from "./lib/zip.mjs";
import {
  CODEX_NATIVE_TESTED_VERSION,
  createCodexNativeTheme,
  serializeCodexNativeTheme,
} from "./lib/codex-native-theme.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const CATALOG_PATH = path.join(ROOT, "themes", "catalog.json");
const CAPTURE_MANIFEST_PATH = path.join(
  ROOT,
  "screenshots",
  "codex-beta-26.715.3651.0",
  "manifest.json",
);
const CHECK_MODE = process.argv.includes("--check");
const GENERATOR_ID = "act-theme-generator-v4.0";
const FULL_SKIN_FORMAT = "act-full-skin-v1";
const FULL_SKIN_TESTED_VERSION = "26.715.3651.0";
const SOURCE_ART_RENDERER_ID = "act-source-art-renderer-v1";
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

function renderFingerprint(theme, mode, sourceProvenance, width, height) {
  return sha256(Buffer.from(JSON.stringify({
    renderer: SOURCE_ART_RENDERER_ID,
    sourceSha256: sourceProvenance.sourceSha256,
    mode,
    width,
    height,
    background: theme[mode].tokens.background,
  }), "utf8"));
}

async function reusableArt(theme, sourceProvenance, existingRegistryTheme) {
  try {
    const root = path.join(ROOT, "themes", theme.id);
    const manifest = JSON.parse(await readFile(path.join(root, "manifest.json"), "utf8"));
    if (manifest.provenance?.sourceSha256 !== sourceProvenance.sourceSha256) return null;
    const result = { assets: {}, previews: {} };
    for (const mode of ["light", "dark"]) {
      if (manifest.modes?.[mode]?.tokens?.background !== theme[mode].tokens.background) return null;
      const asset = await readFile(path.join(root, "assets", "background-" + mode + ".png"));
      const preview = await readFile(path.join(root, "previews", mode + ".png"));
      const assetDimensions = readPngDimensions(asset);
      const previewDimensions = readPngDimensions(preview);
      if (assetDimensions.width !== 2560 || assetDimensions.height !== 1440
        || previewDimensions.width !== 960 || previewDimensions.height !== 540
        || sha256(asset) !== manifest.modes[mode].integrity.sha256
        || asset.length !== manifest.modes[mode].integrity.bytes
        || sha256(preview) !== existingRegistryTheme?.previews?.[mode]?.previewSha256) {
        return null;
      }
      result.assets[mode] = asset;
      result.previews[mode] = preview;
    }
    return result;
  } catch {
    return null;
  }
}

function manifestFor(theme, assets, nativeThemes, sourceProvenance) {
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
      renderFingerprint: renderFingerprint(theme, name, sourceProvenance, 2560, 1440),
    },
    nativeTheme: {
      format: "codex-theme-v1",
      path: "native/" + name + ".codex-theme.txt",
      sha256: sha256(nativeThemes[name]),
      bytes: nativeThemes[name].length,
      testedVersion: CODEX_NATIVE_TESTED_VERSION,
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
    tagline: theme.tagline,
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
      codexDesktopTested: FULL_SKIN_TESTED_VERSION,
      engines: [
        { id: "codex-full-skin", coverage: "full-skin-v1", testedVersion: FULL_SKIN_TESTED_VERSION },
        { id: "codex-native", coverage: "native-theme-v1", testedVersion: CODEX_NATIVE_TESTED_VERSION },
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

function nativeThemeBuffer(theme, mode) {
  return Buffer.from(
    serializeCodexNativeTheme(createCodexNativeTheme(theme, mode)) + "\n",
    "utf8",
  );
}

async function loadCaptureContext() {
  try {
    const manifest = JSON.parse(await readFile(CAPTURE_MANIFEST_PATH, "utf8"));
    if (manifest.schemaVersion !== "act-full-skin-capture-manifest-v1"
      || manifest.status !== "complete"
      || manifest.runtime?.format !== FULL_SKIN_FORMAT
      || manifest.runtime?.removedAfterCapture !== true) {
      return { manifest: null, index: new Map() };
    }
    return {
      manifest,
      index: new Map(
        manifest.captures.map((capture) => [
          capture.themeId + "|" + capture.mode,
          capture,
        ]),
      ),
    };
  } catch (error) {
    if (error.code === "ENOENT") return { manifest: null, index: new Map() };
    throw error;
  }
}

export async function buildGeneratedFiles() {
  const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8"));
  const existingRegistry = await readFile(path.join(ROOT, "themes", "registry.json"), "utf8")
    .then(JSON.parse)
    .catch(() => ({ themes: [] }));
  const existingRegistryIndex = new Map(
    (existingRegistry.themes || []).map((theme) => [theme.id, theme]),
  );
  const captureContext = await loadCaptureContext();
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
    const reusable = await reusableArt(theme, sourceProvenance, existingRegistryIndex.get(theme.id));
    const assets = reusable?.assets || {
      light: renderSourceArtPng(sourceArt, theme, "light", 2560, 1440),
      dark: renderSourceArtPng(sourceArt, theme, "dark", 2560, 1440),
    };
    const previews = reusable?.previews || {
      light: renderSourceArtPng(sourceArt, theme, "light", 960, 540),
      dark: renderSourceArtPng(sourceArt, theme, "dark", 960, 540),
    };
    const nativeThemes = {
      light: nativeThemeBuffer(theme, "light"),
      dark: nativeThemeBuffer(theme, "dark"),
    };
    const manifest = manifestFor(theme, assets, nativeThemes, sourceProvenance);
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
      { name: "native/light.codex-theme.txt", data: nativeThemes.light },
      { name: "native/dark.codex-theme.txt", data: nativeThemes.dark },
    ]);
    const packagePath = "packages/" + theme.id + "-" + theme.version + ".act-theme";
    files.set(packagePath, canonicalPackage);

    const modeRecords = {};
    for (const mode of ["light", "dark"]) {
      const nativeThemePath = "packages/native/" + theme.id + "-" + mode + ".codex-theme.txt";
      const capture = captureContext.index.get(theme.id + "|" + mode);
      files.set(nativeThemePath, nativeThemes[mode]);
      modeRecords[mode] = {
        preview: themeRoot + "/previews/" + mode + ".png",
        previewSha256: sha256(previews[mode]),
        assetSha256: sha256(assets[mode]),
        assetBytes: assets[mode].length,
        fullSkin: {
          format: FULL_SKIN_FORMAT,
          asset: themeRoot + "/assets/background-" + mode + ".png",
          sha256: sha256(assets[mode]),
          bytes: assets[mode].length,
          art: manifest.modes[mode].art,
          tokens: manifest.modes[mode].tokens,
          testedVersion: FULL_SKIN_TESTED_VERSION,
        },
        nativeTheme: {
          format: "codex-theme-v1",
          path: nativeThemePath,
          sha256: sha256(nativeThemes[mode]),
          bytes: nativeThemes[mode].length,
          testedVersion: CODEX_NATIVE_TESTED_VERSION,
          value: nativeThemes[mode].toString("utf8").trim(),
        },
        ...(capture ? {
          capture: {
            path: capture.path,
            sha256: capture.sha256,
            bytes: capture.bytes,
            width: capture.width,
            height: capture.height,
            assetSha256: capture.assetSha256,
            runtimeSha256: capture.runtimeSha256,
            markerVersion: capture.markerVersion,
            selectors: capture.selectors,
            appVersion: captureContext.manifest.testBench.version,
            packageFullName: captureContext.manifest.testBench.packageFullName,
            fixture: captureContext.manifest.fixture.id,
            capturedAt: capture.capturedAt,
          },
        } : {}),
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
      tagline: theme.tagline,
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
        "codex-full-skin": {
          coverage: "full-skin-v1",
          format: FULL_SKIN_FORMAT,
          testedVersion: FULL_SKIN_TESTED_VERSION,
          delivery: "Awesome Codex Theme Manager",
          limitations: ["runtime-session", "no-layout-replacement"],
        },
        "codex-native": {
          coverage: "native-theme-v1",
          format: "codex-theme-v1",
          testedVersion: CODEX_NATIVE_TESTED_VERSION,
          importPath: "Settings > Appearance > Import",
          limitations: ["background-image"],
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
