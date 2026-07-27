import { createHash } from "node:crypto";

import { SOURCE_ART_RENDERER_VERSION } from "./release-metadata.mjs";

export const SOURCE_ART_RENDERER_ID = SOURCE_ART_RENDERER_VERSION;

// Every value that changes the deterministic source-art result belongs here.
// The generator stores this contract in its render fingerprints so a later
// renderer change cannot silently reuse older pixels.
export const SOURCE_ART_RENDERER_CONSTANTS = Object.freeze({
  crop: Object.freeze({
    focalCoordinates: "normalized-clamped-v1",
    strategy: "focal-cover-v1",
  }),
  encoding: Object.freeze({ format: "png-rgba8", deflate: "node-zlib-default" }),
  grading: Object.freeze({
    darkBackgroundMix: 0.31,
    darkEdgeFloor: 0.94,
    darkEdgeRange: 0.06,
    darkSafeAreaBase: 0.12,
    darkSafeAreaRange: 0.46,
    darkScale: 0.76,
    lightBackgroundMix: 0.07,
    lightSafeAreaBase: 0.05,
    lightSafeAreaRange: 0.35,
    lightWhiteMix: 0.035,
    centerSafeAreaInner: 0.16,
    centerSafeAreaOuter: 0.72,
    quietEdgeEnd: 0.6,
    quietEdgeStart: 0.08,
    verticalBottomStart: 0.78,
    verticalTopEnd: 0.18,
  }),
});

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function smoothstep(edgeStart, edgeEnd, value) {
  const ratio = clamp((value - edgeStart) / (edgeEnd - edgeStart), 0, 1);
  return ratio * ratio * (3 - 2 * ratio);
}

/**
 * Resolve the source rectangle for a cover render while retaining the declared
 * focal point whenever the source aspect ratio leaves room to move the crop.
 *
 * The result deliberately reports the complete source rectangle rather than
 * output pixels, so the PNG renderer and visual-review tooling share one
 * deterministic composition seam.
 */
export function computeCoverCrop({
  sourceWidth,
  sourceHeight,
  targetWidth,
  targetHeight,
  focusX = 0.5,
  focusY = 0.5,
}) {
  if (![sourceWidth, sourceHeight, targetWidth, targetHeight]
    .every((value) => Number.isFinite(value) && value > 0)) {
    throw new TypeError("Image dimensions must be positive numbers.");
  }

  const targetAspect = targetWidth / targetHeight;
  const sourceAspect = sourceWidth / sourceHeight;
  let cropWidth = sourceWidth;
  let cropHeight = sourceHeight;

  if (sourceAspect > targetAspect) cropWidth = sourceHeight * targetAspect;
  else if (sourceAspect < targetAspect) cropHeight = sourceWidth / targetAspect;

  const normalizedFocusX = clamp(Number.isFinite(focusX) ? focusX : 0.5, 0, 1);
  const normalizedFocusY = clamp(Number.isFinite(focusY) ? focusY : 0.5, 0, 1);
  const cropX = clamp(
    normalizedFocusX * sourceWidth - cropWidth / 2,
    0,
    sourceWidth - cropWidth,
  );
  const cropY = clamp(
    normalizedFocusY * sourceHeight - cropHeight / 2,
    0,
    sourceHeight - cropHeight,
  );

  return {
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    focusX: normalizedFocusX,
    focusY: normalizedFocusY,
  };
}

/**
 * Return the 0..1 readability grade at a horizontal position. A value of 1
 * applies the strongest background wash. Left keeps the historic profile so
 * the existing catalog changes only where a focal crop deliberately moves it.
 */
export function safeAreaWeight(normalizedX, safeArea) {
  const grading = SOURCE_ART_RENDERER_CONSTANTS.grading;
  const x = clamp(normalizedX, 0, 1);

  switch (safeArea) {
    case "left":
      return 1 - smoothstep(grading.quietEdgeStart, grading.quietEdgeEnd, x);
    case "right":
      return smoothstep(1 - grading.quietEdgeEnd, 1 - grading.quietEdgeStart, x);
    case "center": {
      const distance = Math.abs(x - 0.5) * 2;
      return 1 - smoothstep(
        grading.centerSafeAreaInner,
        grading.centerSafeAreaOuter,
        distance,
      );
    }
    case "none":
      return 0;
    default:
      throw new TypeError("Unsupported safeArea: " + safeArea);
  }
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function renderFingerprint(theme, mode, sourceProvenance, width, height) {
  return sha256(Buffer.from(JSON.stringify({
    renderer: SOURCE_ART_RENDERER_ID,
    constants: SOURCE_ART_RENDERER_CONSTANTS,
    sourceSha256: sourceProvenance.sourceSha256,
    mode,
    width,
    height,
    art: {
      focusX: theme.art.focusX,
      focusY: theme.art.focusY,
      safeArea: theme.art.safeArea,
      taskMode: theme.art.taskMode,
    },
    tokens: theme[mode].tokens,
  }), "utf8"));
}
