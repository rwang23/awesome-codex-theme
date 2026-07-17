import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readPngDimensions } from "./lib/png.mjs";
import { extractStoredEntry, listZipEntries } from "./lib/zip.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const THEME_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SHA256 = /^[a-f0-9]{64}$/;
const HEX = /^#[0-9A-Fa-f]{6}$/;
const MAX_IMAGE_BYTES = 16 * 1024 * 1024;
const CANONICAL_ENTRIES = [
  "assets/background-dark.png",
  "assets/background-light.png",
  "manifest.json",
];
const ADAPTER_ENTRIES = [
  "README.txt",
  "codedrobe/assets/hero.png",
  "codedrobe/codex.css",
  "codedrobe/theme.json",
  "codex-native/config.toml",
  "codex-native/profile.json",
  "dream-skin/background.png",
  "dream-skin/theme.json",
  "heige-skin-studio/hero.png",
  "heige-skin-studio/theme.json",
];

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
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

function validateAdapterZip(theme, mode, zip, modeRecord, errors) {
  const names = listZipEntries(zip).map((entry) => entry.name).sort();
  check(JSON.stringify(names) === JSON.stringify(ADAPTER_ENTRIES), theme.id + " " + mode + " adapter bundle is incomplete", errors);

  const background = entryData(zip, "dream-skin/background.png");
  check(sha256(background) === modeRecord.assetSha256, theme.id + " " + mode + " adapter image hash mismatch", errors);
  check(background.length === modeRecord.assetBytes, theme.id + " " + mode + " adapter image byte count mismatch", errors);

  const dream = JSON.parse(entryData(zip, "dream-skin/theme.json").toString("utf8"));
  check(dream.schemaVersion === 1, theme.id + " " + mode + " Dream Skin schema mismatch", errors);
  check(dream.id === "act-" + theme.id + "-" + mode, theme.id + " " + mode + " Dream Skin id mismatch", errors);
  check(dream.image === "background.png", theme.id + " " + mode + " Dream Skin image mismatch", errors);
  check(dream.appearance === mode, theme.id + " " + mode + " Dream Skin appearance mismatch", errors);

  const nativeProfile = JSON.parse(entryData(zip, "codex-native/profile.json").toString("utf8"));
  check(nativeProfile.coverage === "appearance-only", theme.id + " native export must disclose partial coverage", errors);
  check(nativeProfile.config?.desktop?.appearanceTheme === mode, theme.id + " native mode mismatch", errors);

  const heige = JSON.parse(entryData(zip, "heige-skin-studio/theme.json").toString("utf8"));
  check(heige.schemaVersion === 1 && heige.hero === "hero.png", theme.id + " HeiGe export mismatch", errors);

  const codedrobe = JSON.parse(entryData(zip, "codedrobe/theme.json").toString("utf8"));
  check(codedrobe.schemaVersion === 1, theme.id + " CodeDrobe export schema mismatch", errors);
  check(codedrobe.targets?.codex?.css === "codex.css", theme.id + " CodeDrobe CSS target mismatch", errors);
  const css = entryData(zip, "codedrobe/codex.css").toString("utf8");
  check(!/@import|url\s*\(\s*['"]?https?:|javascript:/i.test(css), theme.id + " CodeDrobe CSS contains a remote or executable reference", errors);
  check(css.includes("prefers-reduced-motion"), theme.id + " CodeDrobe CSS lacks reduced-motion handling", errors);
}

export async function validateRepository() {
  const errors = [];
  const [catalog, registry, themeSchema, registrySchema] = await Promise.all([
    readJson("themes/catalog.json"),
    readJson("themes/registry.json"),
    readJson("schemas/theme-pack.schema.json"),
    readJson("schemas/registry.schema.json"),
  ]);

  check(themeSchema.$schema?.includes("2020-12"), "Theme schema is not JSON Schema 2020-12", errors);
  check(registrySchema.$schema?.includes("2020-12"), "Registry schema is not JSON Schema 2020-12", errors);
  check(registry.standard === "act-theme-pack-v1", "Registry standard id mismatch", errors);
  check(catalog.themes.length >= 8 && catalog.themes.length <= 12, "Initial collection must contain 8 to 12 themes", errors);
  check(registry.themes.length === catalog.themes.length, "Registry/catalog theme count mismatch", errors);

  const ids = catalog.themes.map((theme) => theme.id);
  check(new Set(ids).size === ids.length, "Catalog contains duplicate ids", errors);
  const pairCounts = new Map();
  for (const theme of catalog.themes) {
    check(THEME_ID.test(theme.id), "Invalid catalog id: " + theme.id, errors);
    const variants = pairCounts.get(theme.pair) || new Set();
    variants.add(theme.variant);
    pairCounts.set(theme.pair, variants);
  }
  for (const [pair, variants] of pairCounts) {
    check(variants.has("cinematic") && variants.has("chibi") && variants.size === 2, pair + " must contain cinematic and chibi variants", errors);
  }

  for (const catalogTheme of catalog.themes) {
    const theme = registry.themes.find((candidate) => candidate.id === catalogTheme.id);
    if (!theme) {
      errors.push("Missing registry theme: " + catalogTheme.id);
      continue;
    }
    check(theme.license?.spdx === "CC0-1.0" && theme.license?.rightsVerified === true, theme.id + " license or rights proof missing", errors);
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
    check(manifest.provenance?.rightsVerified === true, theme.id + " canonical provenance is not rights-verified", errors);
    check(manifest.provenance?.aiGenerated === false, theme.id + " generated-art disclosure mismatch", errors);
    check(manifest.motion?.default === "reduced" && manifest.motion?.animated === false, theme.id + " canonical motion mismatch", errors);
    validateCanonicalZip(theme.id, packageBytes, manifestBytes, errors);

    for (const mode of ["light", "dark"]) {
      const modeRecord = theme.previews[mode];
      const manifestMode = manifest.modes[mode];
      check(isSafeRelativePath(modeRecord.preview), theme.id + " " + mode + " preview path is unsafe", errors);
      check(isSafeRelativePath(modeRecord.adapterBundle.path), theme.id + " " + mode + " adapter path is unsafe", errors);
      const [asset, preview, bundle] = await Promise.all([
        readBytes("themes/" + theme.id + "/" + manifestMode.asset),
        readBytes(modeRecord.preview),
        readBytes(modeRecord.adapterBundle.path),
      ]);
      const assetDimensions = readPngDimensions(asset);
      const previewDimensions = readPngDimensions(preview);
      check(assetDimensions.width === 2560 && assetDimensions.height === 1440, theme.id + " " + mode + " asset dimensions mismatch", errors);
      check(previewDimensions.width === 960 && previewDimensions.height === 540, theme.id + " " + mode + " preview dimensions mismatch", errors);
      check(asset.length > 0 && asset.length <= MAX_IMAGE_BYTES, theme.id + " " + mode + " asset size invalid", errors);
      check(sha256(asset) === manifestMode.integrity.sha256, theme.id + " " + mode + " manifest asset hash mismatch", errors);
      check(sha256(asset) === modeRecord.assetSha256, theme.id + " " + mode + " registry asset hash mismatch", errors);
      check(asset.length === manifestMode.integrity.bytes && asset.length === modeRecord.assetBytes, theme.id + " " + mode + " asset byte count mismatch", errors);
      check(sha256(preview) === modeRecord.previewSha256, theme.id + " " + mode + " preview hash mismatch", errors);
      check(sha256(bundle) === modeRecord.adapterBundle.sha256, theme.id + " " + mode + " adapter bundle hash mismatch", errors);
      check(bundle.length === modeRecord.adapterBundle.bytes, theme.id + " " + mode + " adapter bundle byte count mismatch", errors);
      validateTokens(theme.id, mode, manifestMode.tokens, errors);
      validateAdapterZip(theme, mode, bundle, modeRecord, errors);
    }
  }

  if (errors.length) {
    throw new Error("Validation failed:\n- " + errors.join("\n- "));
  }
  return {
    themes: registry.themes.length,
    modes: registry.themes.length * 2,
    packages: registry.themes.length,
    adapterBundles: registry.themes.length * 2,
  };
}

async function main() {
  const result = await validateRepository();
  console.log(
    "Validated " + result.themes + " themes, " + result.modes + " modes, "
    + result.packages + " code-free packages, and " + result.adapterBundles + " adapter bundles.",
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
