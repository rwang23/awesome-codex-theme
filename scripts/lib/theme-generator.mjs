import { createHash } from "node:crypto";
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Worker } from "node:worker_threads";

import { generateCapturePresentations } from "./capture-presentation.mjs";
import { readPngDimensions } from "./png.mjs";
import { renderFingerprint, SOURCE_ART_RENDERER_ID } from "./source-art-contract.mjs";
import { createZip } from "./zip.mjs";
import { createCodexNativeTheme, serializeCodexNativeTheme } from "./codex-native-theme.mjs";
import {
  FULL_SKIN_FORMAT,
  readReleaseMetadata,
  releaseForRegistry,
} from "./release-metadata.mjs";
import {
  loadSourceArtReviews,
  resolveSourceArtReview,
} from "./source-art-reviews.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const REPOSITORY_ROOT = path.resolve(SCRIPT_DIR, "..", "..");
const WORKER_URL = new URL("../generate-theme-worker.mjs", import.meta.url);
const CATALOG_PATH = "themes/catalog.json";
const REGISTRY_PATH = "themes/registry.json";
const GENERATOR_ID = "act-theme-generator-v5.0";
const FAN_ART_LICENSE_ID = "LicenseRef-ACT-Fan-Art-Notice";
const FAN_ART_POLICY_URL = "https://github.com/rwang23/awesome-codex-theme/blob/main/docs/fan-art-policy.md";
const OUTPUTS = Object.freeze([
  Object.freeze({ kind: "asset", width: 2560, height: 1440 }),
  Object.freeze({ kind: "preview", width: 960, height: 540 }),
]);
const MODES = Object.freeze(["light", "dark"]);
const MAX_CONCURRENCY = 4;
const DEFAULT_CONCURRENCY = 2;
const PROGRESS_HEARTBEAT_MS = 30_000;
let temporarySequence = 0;

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function jsonBuffer(value) {
  return Buffer.from(JSON.stringify(value, null, 2) + "\n", "utf8");
}

function outputKey(kind, mode) {
  return kind + ":" + mode;
}

function outputPath(theme, kind, mode) {
  return kind === "asset"
    ? "themes/" + theme.id + "/assets/background-" + mode + ".png"
    : "themes/" + theme.id + "/previews/" + mode + ".png";
}

function outputIntegrity(data, width, height, fingerprint) {
  return {
    sha256: sha256(data),
    bytes: data.length,
    width,
    height,
    renderFingerprint: fingerprint,
  };
}

function legacyRenderFingerprint(theme, mode, sourceProvenance, width, height) {
  return sha256(Buffer.from(JSON.stringify({
    renderer: "act-source-art-renderer-v1",
    sourceSha256: sourceProvenance.sourceSha256,
    mode,
    width,
    height,
    background: theme[mode].tokens.background,
  }), "utf8"));
}

function rightsFor(theme, sourceReview) {
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
        rightsVerified: sourceReview?.decision === "approved",
        notes: "Original AI-generated source art with an approved source-hash-bound review record. This record does not create a claim of third-party rights clearance.",
      };
}

function nativeThemeBuffer(theme, mode) {
  return Buffer.from(
    serializeCodexNativeTheme(createCodexNativeTheme(theme, mode)) + "\n",
    "utf8",
  );
}

function manifestFor(theme, assets, previews, nativeThemes, sourceProvenance, sourceReview, release) {
  const rights = rightsFor(theme, sourceReview);
  const mode = (name) => ({
    asset: "assets/background-" + name + ".png",
    preview: {
      path: "previews/" + name + ".png",
      integrity: outputIntegrity(
        previews[name],
        960,
        540,
        renderFingerprint(theme, name, sourceProvenance, 960, 540),
      ),
    },
    art: {
      focusX: theme.art.focusX,
      focusY: theme.art.focusY,
      safeArea: theme.art.safeArea,
      taskMode: theme.art.taskMode,
    },
    tokens: theme[name].tokens,
    integrity: outputIntegrity(
      assets[name],
      2560,
      1440,
      renderFingerprint(theme, name, sourceProvenance, 2560, 1440),
    ),
    nativeTheme: {
      format: "codex-theme-v1",
      path: "native/" + name + ".codex-theme.txt",
      sha256: sha256(nativeThemes[name]),
      bytes: nativeThemes[name].length,
      testedVersion: release.runtime.nativeTestedVersion,
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
      ...(sourceReview ? { review: sourceReview } : {}),
      notes: rights.notes,
    },
    compatibility: {
      codexDesktopTested: release.capture.appVersion,
      engines: [
        { id: "codex-full-skin", coverage: "full-skin-v1", testedVersion: release.capture.appVersion },
        { id: "codex-native", coverage: "native-theme-v1", testedVersion: release.runtime.nativeTestedVersion },
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

async function readJson(root, relativePath) {
  return JSON.parse(await readFile(path.join(root, ...relativePath.split("/")), "utf8"));
}

async function loadCaptureContext(root, release) {
  const captureManifestPath = "screenshots/codex-beta-" + release.capture.appVersion + "/manifest.json";
  try {
    const manifest = await readJson(root, captureManifestPath);
    if (manifest.schemaVersion !== "act-full-skin-capture-manifest-v1"
      || manifest.status !== "complete"
      || manifest.runtime?.format !== FULL_SKIN_FORMAT
      || manifest.runtime?.removedAfterCapture !== true
      || manifest.testBench?.version !== release.capture.appVersion
      || manifest.testBench?.packageFullName !== release.capture.packageFullName
      || manifest.fixture?.id !== release.capture.fixture) {
      return { manifest: null, index: new Map() };
    }
    return {
      manifest,
      index: new Map(
        manifest.captures.map((capture) => [capture.themeId + "|" + capture.mode, capture]),
      ),
    };
  } catch (error) {
    if (error.code === "ENOENT") return { manifest: null, index: new Map() };
    throw error;
  }
}

function runtimeEvidenceFor(manifest) {
  const capturedRuntime = manifest?.runtime;
  if (!capturedRuntime) {
    throw new Error("A capture manifest is required to build Registry runtime evidence");
  }
  const currentRuntime = capturedRuntime.currentRuntime || {
    implementationVersion: capturedRuntime.implementationVersion,
    sha256: capturedRuntime.sha256,
    verification: "verified",
  };
  return {
    status: capturedRuntime.evidenceStatus || "verified",
    capturedRuntime: {
      implementationVersion: capturedRuntime.implementationVersion,
      sha256: capturedRuntime.sha256,
    },
    currentRuntime,
  };
}

async function readExistingManifest(root, themeId) {
  try {
    return await readJson(root, "themes/" + themeId + "/manifest.json");
  } catch {
    return null;
  }
}

export async function readVerifiedSourceProvenance(root, themeId) {
  const [source, provenance] = await Promise.all([
    readFile(path.join(root, "themes", "source-art", themeId + ".png")),
    readJson(root, "themes/source-art/" + themeId + ".provenance.json"),
  ]);
  if (provenance.sourceSha256 !== sha256(source)) {
    throw new Error("Source-art hash does not match provenance for " + themeId);
  }
  return provenance;
}

function sourceMetadataMatches(theme, manifest, mode) {
  return JSON.stringify(manifest.modes?.[mode]?.art) === JSON.stringify({
    focusX: theme.art.focusX,
    focusY: theme.art.focusY,
    safeArea: theme.art.safeArea,
    taskMode: theme.art.taskMode,
  }) && JSON.stringify(manifest.modes?.[mode]?.tokens) === JSON.stringify(theme[mode].tokens);
}

async function readReusableOutput(root, theme, sourceProvenance, manifest, existingRecord, kind, mode) {
  if (!manifest || manifest.provenance?.sourceSha256 !== sourceProvenance.sourceSha256) return null;
  const manifestMode = manifest.modes?.[mode];
  const currentFingerprint = renderFingerprint(
    theme,
    mode,
    sourceProvenance,
    OUTPUTS.find((candidate) => candidate.kind === kind).width,
    OUTPUTS.find((candidate) => candidate.kind === kind).height,
  );
  const legacyV4 = manifest.provenance?.generator === "openai-image-job + act-theme-generator-v4.0"
    && sourceMetadataMatches(theme, manifest, mode);
  const output = kind === "asset"
    ? { relative: manifestMode?.asset, integrity: manifestMode?.integrity }
    : {
        relative: manifestMode?.preview?.path || "previews/" + mode + ".png",
        integrity: manifestMode?.preview?.integrity || {
          sha256: existingRecord?.previews?.[mode]?.previewSha256,
          bytes: existingRecord?.previews?.[mode]?.previewBytes,
          renderFingerprint: legacyV4
            ? legacyRenderFingerprint(theme, mode, sourceProvenance, 960, 540)
            : null,
        },
      };
  const expected = OUTPUTS.find((candidate) => candidate.kind === kind);
  if (!output.relative || !output.integrity) return null;
  const fingerprintMatches = output.integrity.renderFingerprint === currentFingerprint;
  const legacyFingerprintMatches = legacyV4
    && output.integrity.renderFingerprint === legacyRenderFingerprint(
      theme,
      mode,
      sourceProvenance,
      expected.width,
      expected.height,
    );
  if (!fingerprintMatches && !legacyFingerprintMatches) {
    return null;
  }

  try {
    const data = await readFile(path.join(root, "themes", theme.id, ...output.relative.split("/")));
    const dimensions = readPngDimensions(data);
    if (dimensions.width !== expected.width
      || dimensions.height !== expected.height
      || output.integrity.sha256 !== sha256(data)
      || (output.integrity.bytes && output.integrity.bytes !== data.length)) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

class RenderWorkerPool {
  #closed = false;
  #nextId = 1;
  #queue = [];
  #slots = [];

  constructor(concurrency) {
    for (let index = 0; index < concurrency; index += 1) this.#slots.push(this.#createSlot());
  }

  #createSlot() {
    const worker = new Worker(WORKER_URL);
    const slot = { worker, job: null };
    worker.on("message", (message) => {
      if (!slot.job || slot.job.id !== message.id) return;
      const job = slot.job;
      slot.job = null;
      if (message.error) job.reject(new Error(message.error));
      else job.resolve(new Map(message.rendered.map((output) => [output.key, Buffer.from(output.data)])));
      this.#drain();
    });
    worker.on("error", (error) => this.#fail(error));
    worker.on("exit", (code) => {
      if (!this.#closed && code !== 0) this.#fail(new Error("Theme renderer worker exited with code " + code));
    });
    return slot;
  }

  #fail(error) {
    if (this.#closed) return;
    this.#closed = true;
    for (const slot of this.#slots) {
      if (slot.job) slot.job.reject(error);
      slot.job = null;
      void slot.worker.terminate();
    }
    while (this.#queue.length) this.#queue.shift().reject(error);
  }

  #drain() {
    if (this.#closed) return;
    for (const slot of this.#slots) {
      if (slot.job || this.#queue.length === 0) continue;
      const job = this.#queue.shift();
      slot.job = job;
      slot.worker.postMessage({ id: job.id, ...job.task });
    }
  }

  render(task) {
    if (this.#closed) return Promise.reject(new Error("Theme renderer pool is closed"));
    return new Promise((resolve, reject) => {
      this.#queue.push({ id: this.#nextId++, task, resolve, reject });
      this.#drain();
    });
  }

  async close() {
    if (this.#closed) return;
    this.#closed = true;
    await Promise.all(this.#slots.map((slot) => slot.worker.terminate()));
  }
}

function createThemeOutputs(theme, assets, previews, nativeThemes, manifest, manifestBuffer, canonicalPackage) {
  const themeRoot = "themes/" + theme.id;
  return [
    { relativePath: themeRoot + "/manifest.json", data: manifestBuffer },
    { relativePath: themeRoot + "/assets/background-light.png", data: assets.light },
    { relativePath: themeRoot + "/assets/background-dark.png", data: assets.dark },
    { relativePath: themeRoot + "/previews/light.png", data: previews.light },
    { relativePath: themeRoot + "/previews/dark.png", data: previews.dark },
    { relativePath: "packages/" + theme.id + "-" + theme.version + ".act-theme", data: canonicalPackage },
    { relativePath: "packages/native/" + theme.id + "-light.codex-theme.txt", data: nativeThemes.light },
    { relativePath: "packages/native/" + theme.id + "-dark.codex-theme.txt", data: nativeThemes.dark },
  ];
}

function registryRecordFor(
  theme,
  manifest,
  manifestBuffer,
  canonicalPackage,
  previews,
  assets,
  nativeThemes,
  sourceProvenance,
  sourceReview,
  captureContext,
  presentationIndex,
  release,
) {
  const rights = rightsFor(theme, sourceReview);
  const themeRoot = "themes/" + theme.id;
  const modeRecords = {};
  for (const mode of MODES) {
    const capture = captureContext.index.get(theme.id + "|" + mode);
    const presentation = presentationIndex.get(theme.id + "|" + mode);
    if (capture && !presentation) {
      throw new Error("Capture presentation metadata is missing for " + theme.id + " " + mode);
    }
    modeRecords[mode] = {
      preview: themeRoot + "/previews/" + mode + ".png",
      previewSha256: sha256(previews[mode]),
      previewBytes: previews[mode].length,
      previewRenderFingerprint: manifest.modes[mode].preview.integrity.renderFingerprint,
      assetSha256: sha256(assets[mode]),
      assetBytes: assets[mode].length,
      fullSkin: {
        format: FULL_SKIN_FORMAT,
        asset: themeRoot + "/assets/background-" + mode + ".png",
        sha256: sha256(assets[mode]),
        bytes: assets[mode].length,
        art: manifest.modes[mode].art,
        tokens: manifest.modes[mode].tokens,
        testedVersion: release.capture.appVersion,
      },
      nativeTheme: {
        format: "codex-theme-v1",
        path: "packages/native/" + theme.id + "-" + mode + ".codex-theme.txt",
        sha256: sha256(nativeThemes[mode]),
        bytes: nativeThemes[mode].length,
        testedVersion: release.runtime.nativeTestedVersion,
        value: nativeThemes[mode].toString("utf8").trim(),
      },
      ...(capture ? {
        capture: {
          evidence: {
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
            modelLabel: capture.modelLabel,
            capturedAt: capture.capturedAt,
          },
          presentation,
        },
      } : {}),
    };
  }

  return {
    id: theme.id,
    version: theme.version,
    collection: theme.collection,
    pair: theme.pair,
    variant: theme.variant,
    rightsProfile: theme.rightsProfile || "original",
    audience: theme.audience || "global",
    ...(theme.featuredRank ? { featuredRank: theme.featuredRank } : {}),
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
      ...(sourceReview ? { review: sourceReview } : {}),
    },
    motion: {
      default: "reduced",
      animated: false,
    },
    previews: modeRecords,
    package: {
      path: "packages/" + theme.id + "-" + theme.version + ".act-theme",
      sha256: sha256(canonicalPackage),
      bytes: canonicalPackage.length,
      manifest: themeRoot + "/manifest.json",
      manifestSha256: sha256(manifestBuffer),
    },
    exports: {
      "codex-full-skin": {
        coverage: "full-skin-v1",
        format: FULL_SKIN_FORMAT,
        testedVersion: release.capture.appVersion,
        delivery: "Awesome Codex Theme Manager",
        limitations: ["runtime-session", "no-layout-replacement"],
      },
      "codex-native": {
        coverage: "native-theme-v1",
        format: "codex-theme-v1",
        testedVersion: release.runtime.nativeTestedVersion,
        importPath: "Settings > Appearance > Import",
        limitations: ["background-image"],
      },
    },
  };
}

async function matchesFile(target, expected) {
  try {
    const info = await stat(target);
    return info.isFile() && (await readFile(target)).equals(expected);
  } catch {
    return false;
  }
}

async function atomicWrite(target, data) {
  await mkdir(path.dirname(target), { recursive: true });
  const temporary = target + "." + process.pid + "." + Date.now() + "." + temporarySequence++ + ".tmp";
  await writeFile(temporary, data);
  try {
    await rename(temporary, target);
  } catch (error) {
    if (error.code !== "EEXIST" && error.code !== "EPERM") {
      await rm(temporary, { force: true });
      throw error;
    }
    await rm(target, { force: true });
    await rename(temporary, target);
  }
}

async function reconcileFile(root, output, check, drift, collectOutput) {
  const target = path.join(root, ...output.relativePath.split("/"));
  if (collectOutput) collectOutput(output.relativePath, output.data);
  if (await matchesFile(target, output.data)) return;
  if (check) {
    drift.push(output.relativePath);
    return;
  }
  await atomicWrite(target, output.data);
}

async function runBounded(items, concurrency, worker) {
  let cursor = 0;
  const results = new Array(items.length);
  const workerCount = Math.max(1, Math.min(concurrency, items.length || 1));
  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  }));
  return results;
}

async function generateTheme({
  root,
  theme,
  sourceProvenance,
  sourceReview,
  existingManifest,
  existingRecord,
  force,
  render,
  captureContext,
  presentationIndex,
  release,
}) {
  const assets = {};
  const previews = {};
  const missing = [];
  let cacheHits = 0;

  for (const mode of MODES) {
    for (const output of OUTPUTS) {
      const reusable = force
        ? null
        : await readReusableOutput(
          root,
          theme,
          sourceProvenance,
          existingManifest,
          existingRecord,
          output.kind,
          mode,
        );
      const key = outputKey(output.kind, mode);
      if (reusable) {
        if (output.kind === "asset") assets[mode] = reusable;
        else previews[mode] = reusable;
        cacheHits += 1;
      } else {
        missing.push({ key, mode, width: output.width, height: output.height, kind: output.kind });
      }
    }
  }

  if (missing.length) {
    const rendered = await render({
      sourcePath: path.join(root, "themes", "source-art", theme.id + ".png"),
      theme,
      outputs: missing.map(({ key, mode, width, height }) => ({ key, mode, width, height })),
    });
    for (const output of missing) {
      const data = rendered.get(output.key);
      if (!data) throw new Error("Theme renderer omitted " + output.key + " for " + theme.id);
      if (output.kind === "asset") assets[output.mode] = data;
      else previews[output.mode] = data;
    }
  }

  const nativeThemes = {
    light: nativeThemeBuffer(theme, "light"),
    dark: nativeThemeBuffer(theme, "dark"),
  };
  const manifest = manifestFor(theme, assets, previews, nativeThemes, sourceProvenance, sourceReview, release);
  const manifestBuffer = jsonBuffer(manifest);
  const canonicalPackage = createZip([
    { name: "manifest.json", data: manifestBuffer },
    { name: "assets/background-light.png", data: assets.light },
    { name: "assets/background-dark.png", data: assets.dark },
    { name: "native/light.codex-theme.txt", data: nativeThemes.light },
    { name: "native/dark.codex-theme.txt", data: nativeThemes.dark },
  ]);

  return {
    cacheHits,
    cacheMisses: missing.length,
    outputs: createThemeOutputs(theme, assets, previews, nativeThemes, manifest, manifestBuffer, canonicalPackage),
    record: registryRecordFor(
      theme,
      manifest,
      manifestBuffer,
      canonicalPackage,
      previews,
      assets,
      nativeThemes,
      sourceProvenance,
      sourceReview,
      captureContext,
      presentationIndex,
      release,
    ),
  };
}

function resolveThemes(catalog, ids) {
  if (!ids) return catalog.themes;
  const requested = new Set(ids);
  const known = new Set(catalog.themes.map((theme) => theme.id));
  const unknown = [...requested].filter((id) => !known.has(id));
  if (unknown.length) throw new Error("Unknown theme id(s): " + unknown.join(", "));
  return catalog.themes.filter((theme) => requested.has(theme.id));
}

function hasCurrentRegistryRecord(record) {
  return MODES.every((mode) => (
    Number.isInteger(record?.previews?.[mode]?.previewBytes)
    && typeof record.previews[mode].previewRenderFingerprint === "string"
    && typeof record.previews[mode].capture?.evidence?.path === "string"
    && Array.isArray(record.previews[mode].capture?.presentation)
    && record.previews[mode].capture.presentation.length === 3
  ));
}

function createRegistry(catalog, records, runtimeEvidence, release) {
  return {
    schemaVersion: 1,
    standard: "act-theme-pack-v1",
    generatedBy: GENERATOR_ID,
    catalogRevision: catalog.catalogRevision,
    runtimeEvidence,
    release: releaseForRegistry(release),
    capabilities: release.capabilities,
    collections: catalog.collections.map((collection) => ({
      ...collection,
      themeCount: catalog.themes.filter((theme) => theme.collection === collection.id).length,
    })),
    themes: catalog.themes.map((theme) => {
      const record = records.get(theme.id);
      if (!record) throw new Error("Registry record is missing for " + theme.id);
      return record;
    }),
  };
}

function updatePeakRss(stats) {
  stats.peakRssBytes = Math.max(stats.peakRssBytes, process.memoryUsage().rss);
}

function progressPayload(stats, event, themeId) {
  updatePeakRss(stats);
  return {
    event,
    themeId: themeId || null,
    completed: stats.completed,
    total: stats.total,
    cacheHits: stats.cacheHits,
    cacheMisses: stats.cacheMisses,
    elapsedMs: Date.now() - stats.startedAt,
    rssBytes: process.memoryUsage().rss,
    peakRssBytes: stats.peakRssBytes,
  };
}

export function parseGenerationOptions(argv = process.argv.slice(2)) {
  const options = {
    check: false,
    concurrency: DEFAULT_CONCURRENCY,
    force: false,
    help: false,
    ids: null,
    jsonProgress: false,
    summary: false,
  };

  for (const argument of argv) {
    if (argument === "--check") options.check = true;
    else if (argument === "--force") options.force = true;
    else if (argument === "--json-progress") options.jsonProgress = true;
    else if (argument === "--summary") options.summary = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else if (argument.startsWith("--ids=")) {
      const ids = argument.slice("--ids=".length).split(",").map((id) => id.trim()).filter(Boolean);
      if (!ids.length) throw new Error("--ids requires at least one theme id");
      options.ids = [...new Set(ids)];
    } else if (argument.startsWith("--concurrency=")) {
      const rawValue = argument.slice("--concurrency=".length);
      const value = Number(rawValue);
      if (!/^[1-9]\d*$/.test(rawValue)
        || !Number.isInteger(value)
        || value < 1
        || value > MAX_CONCURRENCY) {
        throw new Error("--concurrency must be an integer from 1 to " + MAX_CONCURRENCY);
      }
      options.concurrency = value;
    } else {
      throw new Error("Unknown generator option: " + argument);
    }
  }
  return options;
}

export function generatorUsage() {
  return [
    "Usage: node scripts/generate-themes.mjs [--check] [--force] [--ids=id[,id]] [--concurrency=1..4] [--json-progress] [--summary]",
    "",
    "Generation writes one theme at a time. --check verifies generated output without writing it.",
  ].join("\n");
}

export async function generateRepository({
  root = REPOSITORY_ROOT,
  options = {},
  onProgress = () => {},
  collectOutput = null,
} = {}) {
  const normalized = {
    check: Boolean(options.check),
    concurrency: options.concurrency ?? DEFAULT_CONCURRENCY,
    force: Boolean(options.force),
    ids: options.ids || null,
  };
  if (!Number.isInteger(normalized.concurrency)
    || normalized.concurrency < 1
    || normalized.concurrency > MAX_CONCURRENCY) {
    throw new Error("concurrency must be an integer from 1 to " + MAX_CONCURRENCY);
  }

  const catalog = await readJson(root, CATALOG_PATH);
  const existingRegistry = await readJson(root, REGISTRY_PATH).catch(() => ({ themes: [] }));
  const existingRecords = new Map((existingRegistry.themes || []).map((theme) => [theme.id, theme]));
  const themes = resolveThemes(catalog, normalized.ids);
  if (normalized.ids) {
    if (existingRegistry.generatedBy !== GENERATOR_ID) {
      throw new Error("Partial generation requires a current v5 Registry. Run `npm run generate` once first.");
    }
    const missingRecords = catalog.themes
      .filter((theme) => !normalized.ids.includes(theme.id) && !existingRecords.has(theme.id))
      .map((theme) => theme.id);
    if (missingRecords.length) {
      throw new Error("Partial generation requires existing Registry records for: " + missingRecords.join(", "));
    }
    const legacyRecords = catalog.themes
      .filter((theme) => !normalized.ids.includes(theme.id) && !hasCurrentRegistryRecord(existingRecords.get(theme.id)))
      .map((theme) => theme.id);
    if (legacyRecords.length) {
      throw new Error("Partial generation requires v5 Registry records for: " + legacyRecords.join(", "));
    }
  }

  const release = readReleaseMetadata(root);
  const sourceReviews = await loadSourceArtReviews(root, catalog);

  const captureContext = await loadCaptureContext(root, release);
  const runtimeEvidence = runtimeEvidenceFor(captureContext.manifest);
  const capturePresentations = await generateCapturePresentations({
    root,
    captureContext,
    check: normalized.check,
  });
  const records = new Map(existingRecords);
  const drift = [...capturePresentations.drift];
  const stats = {
    cacheHits: 0,
    cacheMisses: 0,
    completed: 0,
    peakRssBytes: process.memoryUsage().rss,
    startedAt: Date.now(),
    total: themes.length,
  };
  const heartbeat = setInterval(() => onProgress(progressPayload(stats, "heartbeat")), PROGRESS_HEARTBEAT_MS);
  heartbeat.unref();
  let pool = null;
  const render = async (task) => {
    pool ||= new RenderWorkerPool(normalized.concurrency);
    return pool.render(task);
  };

  try {
    const generated = await runBounded(themes, normalized.concurrency, async (theme) => {
      const sourceProvenance = await readVerifiedSourceProvenance(root, theme.id);
      const sourceReview = resolveSourceArtReview(theme, sourceProvenance, sourceReviews);
      const result = await generateTheme({
        root,
        theme,
        sourceProvenance,
        sourceReview,
        existingManifest: await readExistingManifest(root, theme.id),
        existingRecord: existingRecords.get(theme.id),
        force: normalized.force,
        render,
        captureContext,
        presentationIndex: capturePresentations.index,
        release,
      });
      for (const output of result.outputs) {
        await reconcileFile(root, output, normalized.check, drift, collectOutput);
      }
      records.set(theme.id, result.record);
      stats.completed += 1;
      stats.cacheHits += result.cacheHits;
      stats.cacheMisses += result.cacheMisses;
      onProgress(progressPayload(stats, "theme", theme.id));
      return result.record;
    });
    void generated;

    const registry = createRegistry(catalog, records, runtimeEvidence, release);
    await reconcileFile(
      root,
      { relativePath: REGISTRY_PATH, data: jsonBuffer(registry) },
      normalized.check,
      drift,
      collectOutput,
    );
  } finally {
    clearInterval(heartbeat);
    if (pool) await pool.close();
  }

  const summary = {
    cacheHits: stats.cacheHits + capturePresentations.cacheHits,
    cacheMisses: stats.cacheMisses + capturePresentations.cacheMisses,
    elapsedMs: Date.now() - stats.startedAt,
    generatedThemes: themes.length,
    peakRssBytes: stats.peakRssBytes,
    renderer: SOURCE_ART_RENDERER_ID,
    presentationCacheHits: capturePresentations.cacheHits,
    presentationCacheMisses: capturePresentations.cacheMisses,
    totalThemes: catalog.themes.length,
    ...(drift.length ? { drift } : {}),
  };
  return summary;
}

function formatMiB(bytes) {
  return (bytes / (1024 * 1024)).toFixed(1) + " MiB";
}

function createConsoleReporter(options, io) {
  return function (progress) {
    if (options.jsonProgress) {
      io.log(JSON.stringify(progress));
      return;
    }
    const prefix = progress.event === "heartbeat" ? "Still generating" : "Generated";
    const theme = progress.themeId ? " " + progress.themeId : "";
    io.log(
      prefix + " " + progress.completed + "/" + progress.total + theme
      + " (cache " + progress.cacheHits + " hit / " + progress.cacheMisses + " miss, "
      + Math.round(progress.elapsedMs / 1000) + "s, peak " + formatMiB(progress.peakRssBytes) + ")",
    );
  };
}

export async function runGeneratorCli(argv = process.argv.slice(2), io = console) {
  const options = parseGenerationOptions(argv);
  if (options.help) {
    io.log(generatorUsage());
    return { exitCode: 0 };
  }
  const summary = await generateRepository({
    options,
    onProgress: createConsoleReporter(options, io),
  });
  if (summary.drift) {
    io.error("Generated theme output is stale:");
    for (const file of summary.drift) io.error("  " + file);
    return { exitCode: 1, summary };
  }
  if (options.jsonProgress || options.summary) io.log(JSON.stringify({ event: "summary", ...summary }));
  else {
    io.log(
      "Generated " + summary.generatedThemes + " theme(s) from themes/catalog.json "
      + "(" + summary.cacheHits + " cache hit / " + summary.cacheMisses + " miss, "
      + Math.round(summary.elapsedMs / 1000) + "s, peak " + formatMiB(summary.peakRssBytes) + ").",
    );
  }
  return { exitCode: 0, summary };
}
