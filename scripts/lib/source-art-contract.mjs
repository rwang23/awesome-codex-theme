import { createHash } from "node:crypto";

export const SOURCE_ART_RENDERER_ID = "act-source-art-renderer-v2";

// Every value that changes the deterministic source-art result belongs here.
// The generator stores this contract in its render fingerprints so a later
// renderer change cannot silently reuse older pixels.
export const SOURCE_ART_RENDERER_CONSTANTS = Object.freeze({
  crop: Object.freeze({ strategy: "center-cover-v1" }),
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
    quietEdgeEnd: 0.6,
    quietEdgeStart: 0.08,
    verticalBottomStart: 0.78,
    verticalTopEnd: 0.18,
  }),
});

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
