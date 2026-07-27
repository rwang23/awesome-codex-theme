import { createHash } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { decodePng, readPngDimensions, resizeDecodedPng } from "./png.mjs";

export const CAPTURE_PRESENTATION_FORMAT = "png";
export const CAPTURE_PRESENTATION_RENDERER = "act-capture-presentation-v1";
export const CAPTURE_PRESENTATION_SIZES = Object.freeze([
  Object.freeze({ width: 320, height: 180 }),
  Object.freeze({ width: 480, height: 270 }),
  Object.freeze({ width: 960, height: 540 }),
]);
export const GALLERY_MEDIA_BUDGET = Object.freeze({
  maxCardBytes: 768 * 1024,
  maxInitialBytes: 3 * 1024 * 1024,
});

let temporarySequence = 0;

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function jsonBuffer(value) {
  return Buffer.from(JSON.stringify(value, null, 2) + "\n", "utf8");
}

function safePath(root, relativePath) {
  const target = path.resolve(root, ...relativePath.split("/"));
  const boundary = root.endsWith(path.sep) ? root : root + path.sep;
  if (!target.startsWith(boundary)) throw new Error("Capture presentation path escaped the repository");
  return target;
}

export function presentationPathFor(evidencePath, width) {
  const slash = evidencePath.lastIndexOf("/");
  const directory = evidencePath.slice(0, slash);
  const name = evidencePath.slice(slash + 1).replace(/\.png$/u, "");
  return directory + "/presentation/" + name + "-" + width + ".png";
}

export function presentationManifestPathFor(evidencePath) {
  const slash = evidencePath.lastIndexOf("/");
  return evidencePath.slice(0, slash) + "/presentation/manifest.json";
}

export function presentationFingerprint(capture, size) {
  return sha256(Buffer.from(JSON.stringify({
    renderer: CAPTURE_PRESENTATION_RENDERER,
    evidencePath: capture.path,
    evidenceSha256: capture.sha256,
    width: size.width,
    height: size.height,
  }), "utf8"));
}

function captureKey(capture) {
  return capture.themeId + "|" + capture.mode;
}

function presentationMetadata(capture, size, data) {
  return {
    path: presentationPathFor(capture.path, size.width),
    format: CAPTURE_PRESENTATION_FORMAT,
    width: size.width,
    height: size.height,
    sha256: sha256(data),
    bytes: data.length,
    evidenceSha256: capture.sha256,
    renderFingerprint: presentationFingerprint(capture, size),
  };
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

async function matchesPresentation(root, record, capture, size) {
  if (!record
    || record.path !== presentationPathFor(capture.path, size.width)
    || record.format !== CAPTURE_PRESENTATION_FORMAT
    || record.width !== size.width
    || record.height !== size.height
    || record.evidenceSha256 !== capture.sha256
    || record.renderFingerprint !== presentationFingerprint(capture, size)
    || typeof record.sha256 !== "string"
    || !Number.isInteger(record.bytes)) {
    return false;
  }
  try {
    const data = await readFile(safePath(root, record.path));
    const dimensions = readPngDimensions(data);
    return data.length === record.bytes
      && sha256(data) === record.sha256
      && dimensions.width === size.width
      && dimensions.height === size.height;
  } catch {
    return false;
  }
}

async function reusablePresentation(root, capture, record) {
  if (!record || record.evidence?.path !== capture.path || record.evidence?.sha256 !== capture.sha256) {
    return null;
  }
  const variants = record.presentation;
  if (!Array.isArray(variants) || variants.length !== CAPTURE_PRESENTATION_SIZES.length) return null;
  const ordered = [];
  for (const size of CAPTURE_PRESENTATION_SIZES) {
    const variant = variants.find((candidate) => candidate.width === size.width);
    if (!await matchesPresentation(root, variant, capture, size)) return null;
    ordered.push(variant);
  }
  return ordered;
}

async function reconcileFile(root, relativePath, data, check, drift) {
  const target = safePath(root, relativePath);
  try {
    if ((await readFile(target)).equals(data)) return;
  } catch {}
  if (check) {
    drift.push(relativePath);
    return;
  }
  await atomicWrite(target, data);
}

async function readExistingManifest(root, manifestPath) {
  try {
    return JSON.parse(await readFile(safePath(root, manifestPath), "utf8"));
  } catch {
    return null;
  }
}

export async function generateCapturePresentations({ root, captureContext, check = false } = {}) {
  if (!captureContext?.manifest || !Array.isArray(captureContext.manifest.captures)) {
    return { index: new Map(), cacheHits: 0, cacheMisses: 0, drift: [] };
  }
  const captures = captureContext.manifest.captures;
  if (!captures.length) return { index: new Map(), cacheHits: 0, cacheMisses: 0, drift: [] };
  const manifestPath = presentationManifestPathFor(captures[0].path);
  const existing = await readExistingManifest(root, manifestPath);
  const existingRecords = new Map((existing?.captures || []).map((record) => [
    record.themeId + "|" + record.mode,
    record,
  ]));
  const drift = [];
  const index = new Map();
  const records = [];
  let cacheHits = 0;
  let cacheMisses = 0;

  for (const capture of captures) {
    const key = captureKey(capture);
    let presentation = await reusablePresentation(root, capture, existingRecords.get(key));
    if (presentation) {
      cacheHits += presentation.length;
    } else {
      const source = await readFile(safePath(root, capture.path));
      if (sha256(source) !== capture.sha256) {
        throw new Error("Capture evidence hash does not match manifest for " + key);
      }
      const decoded = decodePng(source);
      presentation = [];
      for (const size of CAPTURE_PRESENTATION_SIZES) {
        const data = resizeDecodedPng(decoded, size.width, size.height);
        const metadata = presentationMetadata(capture, size, data);
        await reconcileFile(root, metadata.path, data, check, drift);
        presentation.push(metadata);
        cacheMisses += 1;
      }
    }
    index.set(key, presentation);
    records.push({
      themeId: capture.themeId,
      mode: capture.mode,
      evidence: {
        path: capture.path,
        sha256: capture.sha256,
        bytes: capture.bytes,
        width: capture.width,
        height: capture.height,
      },
      presentation,
    });
  }

  const manifest = {
    schemaVersion: "act-capture-presentation-manifest-v1",
    renderer: CAPTURE_PRESENTATION_RENDERER,
    sourceManifest: presentationManifestPathFor(captures[0].path).replace(/\/presentation\/manifest\.json$/u, "/manifest.json"),
    captures: records,
  };
  await reconcileFile(root, manifestPath, jsonBuffer(manifest), check, drift);
  return { index, cacheHits, cacheMisses, drift };
}
