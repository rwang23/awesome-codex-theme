import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readPngDimensions } from "./lib/png.mjs";
import { extractStoredEntry, listZipEntries } from "./lib/zip.mjs";
import {
  CODEX_NATIVE_TESTED_VERSION,
  parseCodexNativeTheme,
} from "./lib/codex-native-theme.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const THEME_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SHA256 = /^[a-f0-9]{64}$/;
const HEX = /^#[0-9A-Fa-f]{6}$/;
const FAN_ART_LICENSE_ID = "LicenseRef-ACT-Fan-Art-Notice";
const FORBIDDEN_PROMPT = /凡人修仙传|仙逆|剑来|斗破苍穹|studio\s+ghibli|makoto\s+shinkai|hayao\s+miyazaki|style\s+of/i;
const MAX_IMAGE_BYTES = 16 * 1024 * 1024;
const CODEX_BETA_CAPTURE_VERSION = "26.715.3651.0";
const CODEX_BETA_PACKAGE = "OpenAI.CodexBeta_26.715.3651.0_x64__2p2nqsd0c76g0";
const FULL_SKIN_FORMAT = "act-full-skin-v1";
const SOURCE_ART_RENDERER_ID = "act-source-art-renderer-v1";
const SOURCE_WIDTH = 1536;
const SOURCE_HEIGHT = 1024;
const CANONICAL_ENTRIES = [
  "assets/background-dark.png",
  "assets/background-light.png",
  "manifest.json",
  "native/dark.codex-theme.txt",
  "native/light.codex-theme.txt",
];

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
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

function check(condition, message, errors) {
  if (!condition) errors.push(message);
}

export function isSafeRelativePath(value) {
  return typeof value === "string"
    && value.length > 0
    && !path.isAbsolute(value)
    && !value.includes("\\")
    && !value.split("/").includes("..");
}

function rgb(hex) {
  return [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255);
}

function luminance(hex) {
  const values = rgb(hex).map((value) => (
    value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4)
  ));
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}

export function contrastRatio(left, right) {
  const a = luminance(left);
  const b = luminance(right);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

async function readJson(relativePath) {
  const value = await readFile(path.join(ROOT, ...relativePath.split("/")), "utf8");
  return JSON.parse(value);
}

async function readBytes(relativePath) {
  return readFile(path.join(ROOT, ...relativePath.split("/")));
}

function entryData(zip, name) {
  const entries = listZipEntries(zip);
  const entry = entries.find((candidate) => candidate.name === name);
  if (!entry) throw new Error("Missing ZIP entry: " + name);
  return extractStoredEntry(zip, entry);
}

function validateTokens(themeId, mode, tokens, errors) {
  const required = [
    "background",
    "surface",
    "surfaceAlt",
    "text",
    "muted",
    "accent",
    "accentContrast",
    "border",
  ];
  for (const key of required) {
    check(HEX.test(tokens?.[key] || ""), themeId + " " + mode + " has invalid token " + key, errors);
  }
  if (required.some((key) => !HEX.test(tokens?.[key] || ""))) return;

  check(
    contrastRatio(tokens.text, tokens.surface) >= 4.5,
    themeId + " " + mode + " text/surface contrast is below 4.5",
    errors,
  );
  check(
    contrastRatio(tokens.muted, tokens.surface) >= 4.5,
    themeId + " " + mode + " muted/surface contrast is below 4.5",
    errors,
  );
  check(
    contrastRatio(tokens.accent, tokens.background) >= 3,
    themeId + " " + mode + " accent/background contrast is below 3.0",
    errors,
  );
  check(
    contrastRatio(tokens.accentContrast, tokens.accent) >= 4.5,
    themeId + " " + mode + " accent label contrast is below 4.5",
    errors,
  );
}

function validateCanonicalZip(themeId, zip, manifestBytes, errors) {
  const entries = listZipEntries(zip);
  const names = entries.map((entry) => entry.name).sort();
  check(JSON.stringify(names) === JSON.stringify(CANONICAL_ENTRIES), themeId + " canonical package has unexpected entries", errors);
  check(
    names.every((name) => !/\.(?:js|mjs|cjs|css|sh|ps1|bat|cmd|exe|dll)$/i.test(name)),
    themeId + " canonical package contains executable or style code",
    errors,
  );
  const packedManifest = entryData(zip, "manifest.json");
  check(packedManifest.equals(manifestBytes), themeId + " packed manifest differs from repository manifest", errors);
}

function validateNativeTheme(theme, mode, nativeBytes, modeRecord, manifestMode, packageBytes, errors) {
  let payload;
  try {
    payload = parseCodexNativeTheme(nativeBytes.toString("utf8"));
  } catch (error) {
    errors.push(theme.id + " " + mode + " Codex native theme is invalid: " + error.message);
    return;
  }

  const tokens = manifestMode.tokens;
  check(payload.variant === mode, theme.id + " " + mode + " native variant mismatch", errors);
  check(payload.codeThemeId === "codex", theme.id + " " + mode + " native code theme mismatch", errors);
  check(payload.theme.accent === tokens.accent, theme.id + " " + mode + " native accent mismatch", errors);
  check(payload.theme.ink === tokens.text, theme.id + " " + mode + " native foreground mismatch", errors);
  check(payload.theme.surface === tokens.background, theme.id + " " + mode + " native background mismatch", errors);
  check(
    payload.theme.contrast === (mode === "light" ? 45 : 60),
    theme.id + " " + mode + " native contrast mismatch",
    errors,
  );
  check(payload.theme.semanticColors.skill === tokens.accent, theme.id + " " + mode + " native skill color mismatch", errors);
  check(modeRecord.nativeTheme.format === "codex-theme-v1", theme.id + " " + mode + " native format mismatch", errors);
  check(modeRecord.nativeTheme.testedVersion === CODEX_NATIVE_TESTED_VERSION, theme.id + " " + mode + " native tested version mismatch", errors);
  check(modeRecord.nativeTheme.value === nativeBytes.toString("utf8").trim(), theme.id + " " + mode + " native registry value mismatch", errors);
  check(manifestMode.nativeTheme.format === "codex-theme-v1", theme.id + " " + mode + " manifest native format mismatch", errors);
  check(manifestMode.nativeTheme.testedVersion === CODEX_NATIVE_TESTED_VERSION, theme.id + " " + mode + " manifest native version mismatch", errors);
  check(manifestMode.nativeTheme.sha256 === sha256(nativeBytes), theme.id + " " + mode + " manifest native hash mismatch", errors);
  check(manifestMode.nativeTheme.bytes === nativeBytes.length, theme.id + " " + mode + " manifest native byte count mismatch", errors);

  const packedNative = entryData(packageBytes, manifestMode.nativeTheme.path);
  check(packedNative.equals(nativeBytes), theme.id + " " + mode + " packed native theme differs from public export", errors);
}

export async function validateRepository() {
  const errors = [];
  let captureCount = 0;
  let fullSkinCount = 0;
  const nativeThemeOwners = new Map();
  const [catalog, registry, sourceJobs, captureManifest, themeSchema, registrySchema, runtimeCss, runtimeJs] = await Promise.all([
    readJson("themes/catalog.json"),
    readJson("themes/registry.json"),
    readJson("themes/source-art/jobs.json"),
    readJson("screenshots/codex-beta-26.715.3651.0/manifest.json"),
    readJson("schemas/theme-pack.schema.json"),
    readJson("schemas/registry.schema.json"),
    readFile(path.join(ROOT, "packages", "full-skin", "runtime.css"), "utf8"),
    readFile(path.join(ROOT, "packages", "full-skin", "runtime.js"), "utf8"),
  ]);
  const runtimeSha256 = sha256(Buffer.from(runtimeCss + "\n" + runtimeJs, "utf8"));

  check(themeSchema.$schema?.includes("2020-12"), "Theme schema is not JSON Schema 2020-12", errors);
  check(registrySchema.$schema?.includes("2020-12"), "Registry schema is not JSON Schema 2020-12", errors);
  check(registry.standard === "act-theme-pack-v1", "Registry standard id mismatch", errors);
  check(
    Number.isInteger(catalog.catalogRevision)
      && catalog.catalogRevision > 0
      && registry.catalogRevision === catalog.catalogRevision,
    "Registry/catalog revision mismatch",
    errors,
  );
  const catalogRevisionDate = String(catalog.catalogRevision).slice(0, 8);
  const captureDate = String(captureManifest.capturedAt || "").slice(0, 10).replaceAll("-", "");
  check(
    /^\d{8}$/u.test(catalogRevisionDate)
      && /^\d{8}$/u.test(captureDate)
      && catalogRevisionDate >= captureDate,
    "Catalog revision predates the latest verified screenshot capture",
    errors,
  );
  check(sourceJobs.workflow?.runner === "openai-image-job", "Source-art workflow mismatch", errors);
  check(sourceJobs.workflow?.size === SOURCE_WIDTH + "x" + SOURCE_HEIGHT, "Source-art dimensions mismatch", errors);
  check(Array.isArray(sourceJobs.jobs), "Source-art jobs are missing", errors);
  check(Array.isArray(catalog.collections) && catalog.collections.length > 0, "Catalog must declare at least one collection", errors);
  check(Array.isArray(registry.collections), "Registry collections are missing", errors);
  check(registry.themes.length === catalog.themes.length, "Registry/catalog theme count mismatch", errors);

  const ids = catalog.themes.map((theme) => theme.id);
  check(new Set(ids).size === ids.length, "Catalog contains duplicate ids", errors);
  const sourceJobRecords = Array.isArray(sourceJobs.jobs) ? sourceJobs.jobs : [];
  const sourceJobIds = sourceJobRecords.map((job) => job.id);
  check(new Set(sourceJobIds).size === sourceJobIds.length, "Source-art jobs contain duplicate ids", errors);
  check(
    JSON.stringify(sourceJobIds.slice().sort()) === JSON.stringify(ids.slice().sort()),
    "Source-art jobs and catalog themes differ",
    errors,
  );
  for (const sourceJob of sourceJobRecords) {
    const rightsProfile = sourceJob.rightsProfile || "original";
    check(
      sourceJob.promptProfile == null
        || ["city", "global", "tribute"].includes(sourceJob.promptProfile),
      sourceJob.id + " source prompt profile is unsupported",
      errors,
    );
    if (rightsProfile === "fan-art") {
      check(Boolean(sourceJob.fanArt?.work?.["zh-CN"]), sourceJob.id + " fan-art job must declare its work", errors);
      check(Array.isArray(sourceJob.fanArt?.characters?.["zh-CN"]), sourceJob.id + " fan-art job must declare characters", errors);
      check(
        (sourceJob.prompt || "").includes(sourceJob.fanArt?.work?.["zh-CN"] || ""),
        sourceJob.id + " fan-art prompt must name its declared work",
        errors,
      );
    } else {
      check(
        !FORBIDDEN_PROMPT.test(sourceJob.prompt || ""),
        sourceJob.id + " original prompt names a protected work, artist, or studio",
        errors,
      );
    }
  }
  const collectionIds = catalog.collections.map((collection) => collection.id);
  check(new Set(collectionIds).size === collectionIds.length, "Catalog contains duplicate collection ids", errors);
  const collectionMap = new Map(catalog.collections.map((collection) => [collection.id, collection]));
  check(registry.collections.length === catalog.collections.length, "Registry/catalog collection count mismatch", errors);

  for (const theme of catalog.themes) {
    const rightsProfile = theme.rightsProfile || "original";
    check(THEME_ID.test(theme.id), "Invalid catalog id: " + theme.id, errors);
    check(collectionMap.has(theme.collection), theme.id + " references an unknown collection", errors);
    check(["cinematic", "chibi", "cityscape", "scene"].includes(theme.variant), theme.id + " has an unsupported variant", errors);
    check(["original", "fan-art"].includes(rightsProfile), theme.id + " has an unsupported rights profile", errors);
    check(
      theme.audience == null || ["global", "en", "zh-CN"].includes(theme.audience),
      theme.id + " has an unsupported audience",
      errors,
    );
    if (theme.featuredRank) {
      check(
        Number.isInteger(theme.featuredRank.en)
          && theme.featuredRank.en >= 0
          && Number.isInteger(theme.featuredRank["zh-CN"])
          && theme.featuredRank["zh-CN"] >= 0,
        theme.id + " has an invalid localized featured rank",
        errors,
      );
    }
    check(
      typeof theme.tagline?.en === "string"
        && theme.tagline.en.length > 0
        && theme.tagline.en.length <= 120
        && typeof theme.tagline?.["zh-CN"] === "string"
        && theme.tagline["zh-CN"].length > 0
        && theme.tagline["zh-CN"].length <= 60,
      theme.id + " must declare a concise bilingual tagline",
      errors,
    );
    if (rightsProfile === "fan-art") {
      check(Boolean(theme.fanArt?.work?.["zh-CN"]), theme.id + " fan-art work is missing", errors);
      check(Array.isArray(theme.fanArt?.characters?.["zh-CN"]), theme.id + " fan-art characters are missing", errors);
      check(theme.fanArt?.unofficial === true, theme.id + " must be marked unofficial", errors);
      check(theme.fanArt?.commercialUse === false, theme.id + " must prohibit commercial use", errors);
      check(theme.fanArt?.officialAssetsUsed === false, theme.id + " must disclose that no official assets were used", errors);
    } else {
      check(!theme.fanArt, theme.id + " original theme must not declare fan-art metadata", errors);
    }
  }

  for (const collection of catalog.collections) {
    check(THEME_ID.test(collection.id), "Invalid collection id: " + collection.id, errors);
    check(["cinematic-chibi", "standalone"].includes(collection.pairing), collection.id + " has an unsupported pairing policy", errors);
    check(
      collection.audience == null || ["global", "en", "zh-CN"].includes(collection.audience),
      collection.id + " has an unsupported audience",
      errors,
    );
    const collectionThemes = catalog.themes.filter((theme) => theme.collection === collection.id);
    check(collectionThemes.length >= 2 && collectionThemes.length <= 12, collection.id + " must contain 2 to 12 themes", errors);
    const registryCollection = registry.collections.find((candidate) => candidate.id === collection.id);
    check(Boolean(registryCollection), "Missing registry collection: " + collection.id, errors);
    check(registryCollection?.themeCount === collectionThemes.length, collection.id + " registry theme count mismatch", errors);
    check(
      collectionThemes.every((theme) => (theme.rightsProfile || "original") === (collection.rightsProfile || "original")),
      collection.id + " mixes incompatible rights profiles",
      errors,
    );

    const pairCounts = new Map();
    for (const theme of collectionThemes) {
      const variants = pairCounts.get(theme.pair) || new Set();
      variants.add(theme.variant);
      pairCounts.set(theme.pair, variants);
    }
    for (const [pair, variants] of pairCounts) {
      if (collection.pairing === "cinematic-chibi") {
        check(
          variants.has("cinematic") && variants.has("chibi") && variants.size === 2,
          collection.id + "/" + pair + " must contain cinematic and chibi variants",
          errors,
        );
      } else {
        check(variants.size === 1, collection.id + "/" + pair + " must be a standalone theme", errors);
      }
    }
  }

  for (const catalogTheme of catalog.themes) {
    const theme = registry.themes.find((candidate) => candidate.id === catalogTheme.id);
    if (!theme) {
      errors.push("Missing registry theme: " + catalogTheme.id);
      continue;
    }
    const sourceJob = sourceJobRecords.find((candidate) => candidate.id === catalogTheme.id);
    if (!sourceJob) {
      errors.push("Missing source-art job: " + catalogTheme.id);
      continue;
    }
    const sourcePath = "themes/source-art/" + catalogTheme.id + ".png";
    const provenancePath = "themes/source-art/" + catalogTheme.id + ".provenance.json";
    const [sourceArt, sourceProvenance] = await Promise.all([
      readBytes(sourcePath),
      readJson(provenancePath),
    ]);
    const sourceDimensions = readPngDimensions(sourceArt);
    const rightsProfile = catalogTheme.rightsProfile || "original";
    const fanArt = rightsProfile === "fan-art";
    const commonPrompt = sourceJob.promptProfile === "tribute"
      ? sourceJobs.tributePrompt
      : sourceJob.promptProfile === "global"
        ? sourceJobs.globalPrompt
        : fanArt
          ? sourceJobs.fanArtPrompt
          : sourceJob.promptProfile === "city"
            ? sourceJobs.cityPrompt
            : sourceJobs.commonPrompt;
    const promptCommonReplacement = sourceJob.promptCommonReplacement;
    const replacementValid = promptCommonReplacement == null || (
      typeof promptCommonReplacement === "object"
      && typeof promptCommonReplacement.find === "string"
      && promptCommonReplacement.find.length > 0
      && typeof promptCommonReplacement.replace === "string"
      && commonPrompt.includes(promptCommonReplacement.find)
    );
    check(replacementValid, sourceJob.id + " source prompt common replacement is invalid", errors);
    const effectiveCommonPrompt = replacementValid && promptCommonReplacement
      ? commonPrompt.replace(promptCommonReplacement.find, promptCommonReplacement.replace)
      : commonPrompt;
    const completePrompt = effectiveCommonPrompt + "\n\nScene brief: " + sourceJob.prompt;
    check(
      sourceDimensions.width === SOURCE_WIDTH && sourceDimensions.height === SOURCE_HEIGHT,
      catalogTheme.id + " source-art dimensions mismatch",
      errors,
    );
    check(sourceArt.length > 0 && sourceArt.length <= MAX_IMAGE_BYTES, catalogTheme.id + " source-art size invalid", errors);
    check(sourceProvenance.themeId === catalogTheme.id, catalogTheme.id + " source provenance identity mismatch", errors);
    check(sourceJob.rightsProfile === rightsProfile || (!sourceJob.rightsProfile && rightsProfile === "original"), catalogTheme.id + " source job rights-profile mismatch", errors);
    check(
      sourceProvenance.rightsProfile === rightsProfile || (!sourceProvenance.rightsProfile && rightsProfile === "original"),
      catalogTheme.id + " source provenance rights-profile mismatch",
      errors,
    );
    check(sourceProvenance.workflow === sourceJobs.workflow.runner, catalogTheme.id + " source workflow mismatch", errors);
    check(sourceProvenance.model === sourceJobs.workflow.model, catalogTheme.id + " source model mismatch", errors);
    check(sourceProvenance.size === sourceJobs.workflow.size, catalogTheme.id + " source size disclosure mismatch", errors);
    check(sourceProvenance.quality === sourceJobs.workflow.quality, catalogTheme.id + " source quality disclosure mismatch", errors);
    check(typeof sourceProvenance.jobId === "string" && sourceProvenance.jobId.length > 10, catalogTheme.id + " source job id missing", errors);
    check(sourceProvenance.sourceSha256 === sha256(sourceArt), catalogTheme.id + " source image hash mismatch", errors);
    check(
      sourceProvenance.promptSha256 === sha256(Buffer.from(completePrompt, "utf8")),
      catalogTheme.id + " source prompt hash mismatch",
      errors,
    );
    check(
      sourceProvenance.disclosure?.includes(fanArt ? "AI-generated unofficial fan art" : "AI-generated original source art"),
      catalogTheme.id + " source AI disclosure missing",
      errors,
    );
    if (fanArt) {
      check(
        JSON.stringify(sourceProvenance.fanArt) === JSON.stringify(sourceJob.fanArt),
        catalogTheme.id + " source fan-art declaration mismatch",
        errors,
      );
      check(
        JSON.stringify(sourceJob.fanArt?.work) === JSON.stringify(catalogTheme.fanArt?.work)
          && JSON.stringify(sourceJob.fanArt?.characters) === JSON.stringify(catalogTheme.fanArt?.characters),
        catalogTheme.id + " catalog/job fan-art identity mismatch",
        errors,
      );
    }
    check(theme.provenance?.aiGenerated === true, theme.id + " registry AI disclosure mismatch", errors);
    check(JSON.stringify(theme.tagline) === JSON.stringify(catalogTheme.tagline), theme.id + " registry tagline mismatch", errors);
    check(theme.rightsProfile === rightsProfile, theme.id + " registry rights-profile mismatch", errors);
    check(theme.provenance?.rightsVerified === !fanArt, theme.id + " registry rights status mismatch", errors);
    check(theme.provenance?.type === (fanArt ? "fan-art" : "original"), theme.id + " registry provenance type mismatch", errors);
    check(theme.provenance?.record === provenancePath, theme.id + " registry provenance record mismatch", errors);
    check(theme.provenance?.sourceArt === sourcePath, theme.id + " registry source-art path mismatch", errors);
    check(theme.provenance?.sourceSha256 === sourceProvenance.sourceSha256, theme.id + " registry source hash mismatch", errors);
    check(theme.provenance?.promptSha256 === sourceProvenance.promptSha256, theme.id + " registry prompt hash mismatch", errors);
    check(theme.provenance?.jobId === sourceProvenance.jobId, theme.id + " registry image job mismatch", errors);
    check(
      theme.license?.spdx === (fanArt ? FAN_ART_LICENSE_ID : "CC0-1.0")
        && theme.license?.rightsVerified === !fanArt,
      theme.id + " license or rights disclosure mismatch",
      errors,
    );
    if (fanArt) {
      check(JSON.stringify(theme.fanArt) === JSON.stringify(catalogTheme.fanArt), theme.id + " registry fan-art metadata mismatch", errors);
    }
    check(theme.motion?.default === "reduced" && theme.motion?.animated === false, theme.id + " motion contract mismatch", errors);
    check(isSafeRelativePath(theme.package.path), theme.id + " package path is unsafe", errors);
    check(isSafeRelativePath(theme.package.manifest), theme.id + " manifest path is unsafe", errors);
    check(SHA256.test(theme.package.sha256), theme.id + " package hash is invalid", errors);

    const [manifestBytes, packageBytes] = await Promise.all([
      readBytes(theme.package.manifest),
      readBytes(theme.package.path),
    ]);
    const manifest = JSON.parse(manifestBytes.toString("utf8"));
    check(sha256(manifestBytes) === theme.package.manifestSha256, theme.id + " manifest hash mismatch", errors);
    check(sha256(packageBytes) === theme.package.sha256, theme.id + " package hash mismatch", errors);
    check(packageBytes.length === theme.package.bytes, theme.id + " package byte count mismatch", errors);
    check(manifest.schemaVersion === 1 && manifest.id === theme.id, theme.id + " canonical manifest identity mismatch", errors);
    check(JSON.stringify(manifest.tagline) === JSON.stringify(catalogTheme.tagline), theme.id + " canonical tagline mismatch", errors);
    check(manifest.collection === catalogTheme.collection, theme.id + " canonical collection mismatch", errors);
    check(manifest.variant === catalogTheme.variant, theme.id + " canonical variant mismatch", errors);
    check(manifest.pair === catalogTheme.pair, theme.id + " canonical pair mismatch", errors);
    check(manifest.rightsProfile === rightsProfile, theme.id + " canonical rights-profile mismatch", errors);
    check(theme.collection === catalogTheme.collection, theme.id + " registry collection mismatch", errors);
    check(theme.audience === (catalogTheme.audience || "global"), theme.id + " registry audience mismatch", errors);
    check(
      JSON.stringify(theme.featuredRank || null) === JSON.stringify(catalogTheme.featuredRank || null),
      theme.id + " registry featured rank mismatch",
      errors,
    );
    check(manifest.provenance?.rightsVerified === !fanArt, theme.id + " canonical rights status mismatch", errors);
    check(manifest.provenance?.aiGenerated === true, theme.id + " generated-art disclosure mismatch", errors);
    check(manifest.provenance?.type === (fanArt ? "fan-art" : "original"), theme.id + " generated-art provenance type mismatch", errors);
    if (fanArt) {
      check(JSON.stringify(manifest.fanArt) === JSON.stringify(catalogTheme.fanArt), theme.id + " canonical fan-art metadata mismatch", errors);
    }
    check(manifest.provenance?.source === provenancePath, theme.id + " source provenance path mismatch", errors);
    check(manifest.provenance?.model === sourceProvenance.model, theme.id + " manifest source model mismatch", errors);
    check(manifest.provenance?.jobId === sourceProvenance.jobId, theme.id + " manifest image job mismatch", errors);
    check(manifest.provenance?.promptSha256 === sourceProvenance.promptSha256, theme.id + " manifest prompt hash mismatch", errors);
    check(manifest.provenance?.sourceSha256 === sourceProvenance.sourceSha256, theme.id + " manifest source hash mismatch", errors);
    check(manifest.motion?.default === "reduced" && manifest.motion?.animated === false, theme.id + " canonical motion mismatch", errors);
    check(
      JSON.stringify(manifest.compatibility?.engines) === JSON.stringify([
        {
          id: "codex-full-skin",
          coverage: "full-skin-v1",
          testedVersion: CODEX_BETA_CAPTURE_VERSION,
        },
        {
          id: "codex-native",
          coverage: "native-theme-v1",
          testedVersion: CODEX_NATIVE_TESTED_VERSION,
        },
      ]),
      theme.id + " must declare the ACT full-skin runtime and Native fallback",
      errors,
    );
    check(
      JSON.stringify(Object.keys(theme.exports || {})) === JSON.stringify(["codex-full-skin", "codex-native"]),
      theme.id + " registry must expose the full-skin runtime and Native fallback",
      errors,
    );
    check(theme.exports?.["codex-full-skin"]?.coverage === "full-skin-v1", theme.id + " full-skin registry coverage mismatch", errors);
    check(theme.exports?.["codex-full-skin"]?.format === FULL_SKIN_FORMAT, theme.id + " full-skin registry format mismatch", errors);
    check(theme.exports?.["codex-full-skin"]?.testedVersion === CODEX_BETA_CAPTURE_VERSION, theme.id + " full-skin registry version mismatch", errors);
    check(theme.exports?.["codex-native"]?.coverage === "native-theme-v1", theme.id + " native registry coverage mismatch", errors);
    check(theme.exports?.["codex-native"]?.testedVersion === CODEX_NATIVE_TESTED_VERSION, theme.id + " native registry version mismatch", errors);
    validateCanonicalZip(theme.id, packageBytes, manifestBytes, errors);

    for (const mode of ["light", "dark"]) {
      const modeRecord = theme.previews[mode];
      const manifestMode = manifest.modes[mode];
      check(isSafeRelativePath(modeRecord.preview), theme.id + " " + mode + " preview path is unsafe", errors);
      check(isSafeRelativePath(modeRecord.nativeTheme.path), theme.id + " " + mode + " native theme path is unsafe", errors);
      check(isSafeRelativePath(manifestMode.nativeTheme.path), theme.id + " " + mode + " packed native theme path is unsafe", errors);
      const [asset, preview, nativeTheme] = await Promise.all([
        readBytes("themes/" + theme.id + "/" + manifestMode.asset),
        readBytes(modeRecord.preview),
        readBytes(modeRecord.nativeTheme.path),
      ]);
      const assetDimensions = readPngDimensions(asset);
      const previewDimensions = readPngDimensions(preview);
      check(assetDimensions.width === 2560 && assetDimensions.height === 1440, theme.id + " " + mode + " asset dimensions mismatch", errors);
      check(previewDimensions.width === 960 && previewDimensions.height === 540, theme.id + " " + mode + " preview dimensions mismatch", errors);
      check(asset.length > 0 && asset.length <= MAX_IMAGE_BYTES, theme.id + " " + mode + " asset size invalid", errors);
      check(sha256(asset) === manifestMode.integrity.sha256, theme.id + " " + mode + " manifest asset hash mismatch", errors);
      check(
        manifestMode.integrity.renderFingerprint
          === renderFingerprint(catalogTheme, mode, sourceProvenance, 2560, 1440),
        theme.id + " " + mode + " render fingerprint mismatch",
        errors,
      );
      check(sha256(asset) === modeRecord.assetSha256, theme.id + " " + mode + " registry asset hash mismatch", errors);
      check(asset.length === manifestMode.integrity.bytes && asset.length === modeRecord.assetBytes, theme.id + " " + mode + " asset byte count mismatch", errors);
      check(modeRecord.fullSkin?.format === FULL_SKIN_FORMAT, theme.id + " " + mode + " full-skin format mismatch", errors);
      check(modeRecord.fullSkin?.asset === "themes/" + theme.id + "/" + manifestMode.asset, theme.id + " " + mode + " full-skin asset path mismatch", errors);
      check(modeRecord.fullSkin?.sha256 === sha256(asset), theme.id + " " + mode + " full-skin asset hash mismatch", errors);
      check(modeRecord.fullSkin?.bytes === asset.length, theme.id + " " + mode + " full-skin asset byte count mismatch", errors);
      check(JSON.stringify(modeRecord.fullSkin?.art) === JSON.stringify(manifestMode.art), theme.id + " " + mode + " full-skin art contract mismatch", errors);
      check(JSON.stringify(modeRecord.fullSkin?.tokens) === JSON.stringify(manifestMode.tokens), theme.id + " " + mode + " full-skin token contract mismatch", errors);
      check(modeRecord.fullSkin?.testedVersion === CODEX_BETA_CAPTURE_VERSION, theme.id + " " + mode + " full-skin tested version mismatch", errors);
      fullSkinCount += 1;
      check(sha256(preview) === modeRecord.previewSha256, theme.id + " " + mode + " preview hash mismatch", errors);
      check(sha256(nativeTheme) === modeRecord.nativeTheme.sha256, theme.id + " " + mode + " native theme hash mismatch", errors);
      check(nativeTheme.length === modeRecord.nativeTheme.bytes, theme.id + " " + mode + " native theme byte count mismatch", errors);
      const nativeThemeSha256 = sha256(nativeTheme);
      const duplicateOwner = nativeThemeOwners.get(nativeThemeSha256);
      check(
        !duplicateOwner,
        theme.id + " " + mode + " duplicates the installable Native theme used by " + duplicateOwner,
        errors,
      );
      if (!duplicateOwner) nativeThemeOwners.set(nativeThemeSha256, theme.id + " " + mode);
      const capture = modeRecord.capture;
      check(Boolean(capture), theme.id + " " + mode + " is missing a real Codex Beta capture", errors);
      if (capture) {
        captureCount += 1;
        check(isSafeRelativePath(capture.path), theme.id + " " + mode + " capture path is unsafe", errors);
        check(
          capture.path === "screenshots/codex-beta-" + CODEX_BETA_CAPTURE_VERSION + "/" + theme.id + "-" + mode + ".png",
          theme.id + " " + mode + " capture path mismatch",
          errors,
        );
        const captureBytes = await readBytes(capture.path);
        const captureDimensions = readPngDimensions(captureBytes);
        check(captureDimensions.width === 1440 && captureDimensions.height === 810, theme.id + " " + mode + " capture dimensions mismatch", errors);
        check(capture.width === 1440 && capture.height === 810, theme.id + " " + mode + " capture metadata dimensions mismatch", errors);
        check(capture.bytes === captureBytes.length, theme.id + " " + mode + " capture byte count mismatch", errors);
        check(capture.sha256 === sha256(captureBytes), theme.id + " " + mode + " capture hash mismatch", errors);
        check(capture.assetSha256 === modeRecord.fullSkin.sha256, theme.id + " " + mode + " capture asset hash mismatch", errors);
        check(capture.runtimeSha256 === runtimeSha256, theme.id + " " + mode + " capture runtime hash mismatch", errors);
        check(capture.markerVersion === FULL_SKIN_FORMAT, theme.id + " " + mode + " capture marker mismatch", errors);
        check(capture.selectors?.main === true, theme.id + " " + mode + " capture main selector was not verified", errors);
        check(capture.appVersion === CODEX_BETA_CAPTURE_VERSION, theme.id + " " + mode + " capture app version mismatch", errors);
        check(capture.packageFullName === CODEX_BETA_PACKAGE, theme.id + " " + mode + " capture package identity mismatch", errors);
        check(capture.fixture === "full-skin-home-v1", theme.id + " " + mode + " capture fixture mismatch", errors);
      }
      validateTokens(theme.id, mode, manifestMode.tokens, errors);
      validateNativeTheme(theme, mode, nativeTheme, modeRecord, manifestMode, packageBytes, errors);
    }
  }

  check(captureCount === registry.themes.length * 2, "Registry must expose one real capture for every theme mode", errors);
  check(fullSkinCount === registry.themes.length * 2, "Registry must expose one full-skin record for every theme mode", errors);
  if (errors.length) {
    throw new Error("Validation failed:\n- " + errors.join("\n- "));
  }
  return {
    sources: catalog.themes.length,
    themes: registry.themes.length,
    modes: registry.themes.length * 2,
    packages: registry.themes.length,
    fullSkinExports: fullSkinCount,
    nativeExports: registry.themes.length * 2,
    captures: captureCount,
  };
}

async function main() {
  const result = await validateRepository();
  console.log(
    "Validated " + result.sources + " source images, " + result.themes + " themes, " + result.modes + " modes, "
    + result.packages + " code-free packages, " + result.fullSkinExports + " full-skin records, "
    + result.nativeExports + " Codex Native fallbacks, and "
    + result.captures + " real Beta captures.",
  );
}

if (path.resolve(process.argv[1] || "") === fileURLToPath(import.meta.url)) {
  try {
    await main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
