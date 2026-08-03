import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const RELEASE_METADATA_PATH = "metadata/release.json";
export const REPOSITORY_ROOT = path.resolve(SCRIPT_DIR, "..", "..");
const SEMVER = /^\d+\.\d+\.\d+$/;
const SHA256 = /^[a-f0-9]{64}$/;
const CAPABILITY_STATUS = new Set(["verified", "build-only", "unverified"]);

function fail(message) {
  throw new Error("Release metadata is invalid: " + message);
}

function object(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(label + " must be an object");
  return value;
}

function text(value, label, { allowEmpty = false } = {}) {
  if (typeof value !== "string" || (!allowEmpty && value.trim() === "")) fail(label + " must be a non-empty string");
  return value;
}

function localized(value, label) {
  const record = object(value, label);
  text(record.en, label + ".en");
  text(record["zh-CN"], label + ".zh-CN");
  return record;
}

function capability(value, index) {
  const record = object(value, "capabilities[" + index + "]");
  text(record.id, "capabilities[" + index + "].id");
  if (!["windows", "macos"].includes(record.platform)) fail("capabilities[" + index + "].platform is unsupported");
  if (!["x64", "aarch64", "x86_64"].includes(record.architecture)) fail("capabilities[" + index + "].architecture is unsupported");
  localized(record.title, "capabilities[" + index + "].title");
  for (const key of ["fullSkin", "native", "persistence"]) {
    const feature = object(record[key], "capabilities[" + index + "]." + key);
    if (!CAPABILITY_STATUS.has(feature.status)) fail("capabilities[" + index + "]." + key + ".status is unsupported");
    text(feature.testedVersion ?? "", "capabilities[" + index + "]." + key + ".testedVersion", { allowEmpty: true });
    localized(feature.detail, "capabilities[" + index + "]." + key + ".detail");
  }
  return record;
}

export function validateReleaseMetadata(value) {
  const metadata = object(value, "root");
  if (metadata.schemaVersion !== 1) fail("schemaVersion must be 1");
  const product = object(metadata.product, "product");
  text(product.name, "product.name");
  for (const key of ["repository", "releases"]) {
    const url = text(product[key], "product." + key);
    if (!url.startsWith("https://")) fail("product." + key + " must use HTTPS");
  }
  const desktop = object(metadata.desktop, "desktop");
  if (!SEMVER.test(text(desktop.version, "desktop.version"))) fail("desktop.version must be semver");
  if (!["beta", "stable"].includes(desktop.channel)) fail("desktop.channel is unsupported");
  if (typeof desktop.githubPrerelease !== "boolean") fail("desktop.githubPrerelease must be boolean");
  const updater = object(desktop.updater, "desktop.updater");
  if (!["unreleased", "available"].includes(updater.status)) fail("desktop.updater.status is unsupported");
  const endpoint = text(updater.endpoint, "desktop.updater.endpoint");
  if (!endpoint.startsWith("https://")) fail("desktop.updater.endpoint must use HTTPS");
  localized(updater.message, "desktop.updater.message");
  const runtime = object(metadata.runtime, "runtime");
  text(runtime.fullSkinFormat, "runtime.fullSkinFormat");
  text(runtime.implementationVersion, "runtime.implementationVersion");
  text(runtime.sourceArtRenderer, "runtime.sourceArtRenderer");
  text(runtime.nativeTestedVersion, "runtime.nativeTestedVersion");
  const capture = object(metadata.capture, "capture");
  if (capture.channel !== "beta") fail("capture.channel must be beta for the recorded capture");
  text(capture.appVersion, "capture.appVersion");
  const packageName = text(capture.packageFullName, "capture.packageFullName");
  if (!packageName.startsWith("OpenAI.CodexBeta_")) fail("capture.packageFullName must identify Codex Beta");
  const packageFamilyName = text(capture.packageFamilyName, "capture.packageFamilyName");
  if (!packageFamilyName.startsWith("OpenAI.CodexBeta_")) fail("capture.packageFamilyName must identify Codex Beta");
  if (!packageName.endsWith("_" + packageFamilyName.split("_").at(-1))) {
    fail("capture.packageFullName must belong to capture.packageFamilyName");
  }
  const aumid = text(capture.aumid, "capture.aumid");
  if (!aumid.startsWith(packageFamilyName + "!")) fail("capture.aumid must belong to capture.packageFamilyName");
  text(capture.executable, "capture.executable");
  text(capture.fixture, "capture.fixture");
  text(capture.modelLabel, "capture.modelLabel");
  if (!Array.isArray(metadata.capabilities) || metadata.capabilities.length === 0) fail("capabilities must be a non-empty array");
  const ids = new Set();
  metadata.capabilities.forEach((entry, index) => {
    const parsed = capability(entry, index);
    if (ids.has(parsed.id)) fail("capabilities contains duplicate id " + parsed.id);
    ids.add(parsed.id);
  });
  if (!ids.has("windows-x64") || !ids.has("macos-aarch64") || !ids.has("macos-x86-64")) {
    fail("capabilities must disclose Windows x64 and both macOS architectures");
  }
  return metadata;
}

export function readReleaseMetadata(root = REPOSITORY_ROOT) {
  const source = path.join(root, ...RELEASE_METADATA_PATH.split("/"));
  return validateReleaseMetadata(JSON.parse(readFileSync(source, "utf8")));
}

export function releaseForRegistry(metadata) {
  return {
    product: metadata.product,
    desktop: {
      version: metadata.desktop.version,
      channel: metadata.desktop.channel,
      updater: {
        status: metadata.desktop.updater.status,
        message: metadata.desktop.updater.message,
      },
    },
    runtime: metadata.runtime,
    capture: {
      channel: metadata.capture.channel,
      appVersion: metadata.capture.appVersion,
      packageFullName: metadata.capture.packageFullName,
      fixture: metadata.capture.fixture,
      modelLabel: metadata.capture.modelLabel,
    },
  };
}

export const RELEASE_METADATA = readReleaseMetadata();
export const CODEX_NATIVE_TESTED_VERSION = RELEASE_METADATA.runtime.nativeTestedVersion;
export const FULL_SKIN_TESTED_VERSION = RELEASE_METADATA.capture.appVersion;
export const FULL_SKIN_FORMAT = RELEASE_METADATA.runtime.fullSkinFormat;
export const SOURCE_ART_RENDERER_VERSION = RELEASE_METADATA.runtime.sourceArtRenderer;

export function isSha256(value) {
  return typeof value === "string" && SHA256.test(value);
}
