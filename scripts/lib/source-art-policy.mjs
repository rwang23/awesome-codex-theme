const SIZE = /^(\d+)x(\d+)$/u;
const ASPECT_RATIO = /^(\d+):(\d+)$/u;

export const CANONICAL_SOURCE_ART = Object.freeze({
  aspectRatio: "16:9",
  height: 1440,
  width: 2560,
});

function dimensionsArePositive(dimensions) {
  return Number.isInteger(dimensions?.width)
    && dimensions.width > 0
    && Number.isInteger(dimensions?.height)
    && dimensions.height > 0;
}

function sameAspectRatio(left, right) {
  return left.width * right.height === right.width * left.height;
}

export function parseImageSize(value) {
  const match = SIZE.exec(value || "");
  if (!match) throw new TypeError("Image size must use WIDTHxHEIGHT.");
  const dimensions = { width: Number(match[1]), height: Number(match[2]) };
  if (!dimensionsArePositive(dimensions)) throw new TypeError("Image dimensions must be positive integers.");
  return dimensions;
}

function parseAspectRatio(value) {
  const match = ASPECT_RATIO.exec(value || "");
  if (!match) throw new TypeError("Aspect ratio must use WIDTH:HEIGHT.");
  return { width: Number(match[1]), height: Number(match[2]) };
}

function exceptionFor(policy, themeId) {
  const exceptions = policy?.reviewedUpscaleExceptions;
  if (!Array.isArray(exceptions)) return null;
  return exceptions.find((exception) => Array.isArray(exception.themeIds)
    && exception.themeIds.includes(themeId)) || null;
}

/**
 * Assess source pixels against the production requirement. Existing material
 * can only pass below it through a named review exception that also binds the
 * expected source dimensions and theme id.
 */
export function assessSourceArt(policy, themeId, dimensions) {
  if (!dimensionsArePositive(dimensions)) {
    return { accepted: false, reason: "source art dimensions are invalid" };
  }
  const minimum = policy?.minimum || CANONICAL_SOURCE_ART;
  if (!dimensionsArePositive(minimum) || typeof minimum.aspectRatio !== "string") {
    return { accepted: false, reason: "source-art policy minimum is invalid" };
  }
  const canonical = dimensions.width >= minimum.width
    && dimensions.height >= minimum.height
    && sameAspectRatio(dimensions, parseAspectRatio(minimum.aspectRatio));
  if (canonical) return { accepted: true, kind: "canonical" };

  const exception = exceptionFor(policy, themeId);
  if (!exception || typeof exception.sourceSize !== "string") {
    return {
      accepted: false,
      reason: "requires a " + minimum.width + "x" + minimum.height
        + " " + minimum.aspectRatio + " source or a reviewed upscale exception",
    };
  }

  let expected;
  try {
    expected = parseImageSize(exception.sourceSize);
  } catch {
    return { accepted: false, reason: "reviewed upscale exception has an invalid source size" };
  }
  if (dimensions.width !== expected.width || dimensions.height !== expected.height) {
    return {
      accepted: false,
      reason: "reviewed upscale exception expects " + exception.sourceSize,
    };
  }
  if (typeof exception.id !== "string" || !exception.id || typeof exception.reviewedAt !== "string") {
    return { accepted: false, reason: "reviewed upscale exception is incomplete" };
  }
  return { accepted: true, kind: "reviewed-upscale-exception", exception };
}

export function sourceArtPolicyError(policy, themeId, dimensions) {
  const result = assessSourceArt(policy, themeId, dimensions);
  return result.accepted ? null : themeId + " source art " + result.reason;
}
