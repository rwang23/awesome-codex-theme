export const CODEX_NATIVE_TESTED_VERSION = "26.715.2305.0";
export const CODEX_THEME_PREFIX = "codex-theme-v1:";

const HEX = /^#[0-9A-Fa-f]{6}$/;
const VARIANTS = new Set(["light", "dark"]);

function assertHex(value, field) {
  if (!HEX.test(value || "")) {
    throw new Error("Invalid Codex native theme color: " + field);
  }
}

function assertExactKeys(value, expected, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Codex native theme " + field + " must be an object");
  }
  const actual = Object.keys(value).sort();
  const allowed = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(allowed)) {
    throw new Error("Codex native theme " + field + " fields are invalid");
  }
}

export function createCodexNativeTheme(theme, variant) {
  if (!VARIANTS.has(variant)) {
    throw new Error("Unsupported Codex native theme variant: " + variant);
  }
  const tokens = theme?.[variant]?.tokens;
  if (!tokens) {
    throw new Error("Missing " + variant + " tokens for " + theme?.id);
  }
  for (const field of ["accent", "background", "text"]) {
    assertHex(tokens[field], field);
  }

  return {
    codeThemeId: "codex",
    theme: {
      accent: tokens.accent,
      contrast: variant === "light" ? 45 : 60,
      fonts: {
        code: null,
        ui: null,
      },
      ink: tokens.text,
      opaqueWindows: true,
      semanticColors: {
        diffAdded: variant === "light" ? "#00A240" : "#40C977",
        diffRemoved: variant === "light" ? "#BA2623" : "#FA423E",
        skill: tokens.accent,
      },
      surface: tokens.background,
    },
    variant,
  };
}

export function serializeCodexNativeTheme(payload) {
  return CODEX_THEME_PREFIX + JSON.stringify(payload);
}

export function parseCodexNativeTheme(value) {
  const input = String(value || "").trim();
  if (!input.startsWith(CODEX_THEME_PREFIX)) {
    throw new Error("Codex native theme prefix mismatch");
  }
  const encoded = input.slice(CODEX_THEME_PREFIX.length);
  const json = encoded.startsWith("{") ? encoded : decodeURIComponent(encoded);
  const payload = JSON.parse(json);
  validateCodexNativeTheme(payload);
  return payload;
}

export function validateCodexNativeTheme(payload) {
  assertExactKeys(payload, ["codeThemeId", "theme", "variant"], "payload");
  if (!VARIANTS.has(payload.variant)) {
    throw new Error("Codex native theme variant is invalid");
  }
  if (payload.codeThemeId !== "codex") {
    throw new Error("Codex native theme must use a cross-variant code theme");
  }

  const theme = payload.theme;
  assertExactKeys(
    theme,
    ["accent", "contrast", "fonts", "ink", "opaqueWindows", "semanticColors", "surface"],
    "configuration",
  );
  for (const field of ["accent", "ink", "surface"]) {
    assertHex(theme[field], field);
  }
  if (!Number.isInteger(theme.contrast) || theme.contrast < 0 || theme.contrast > 100) {
    throw new Error("Codex native theme contrast is invalid");
  }
  if (theme.opaqueWindows !== true) {
    throw new Error("Codex native theme must use opaque windows for deterministic rendering");
  }
  assertExactKeys(theme.fonts, ["code", "ui"], "fonts");
  if (theme.fonts?.code !== null || theme.fonts?.ui !== null) {
    throw new Error("Codex native theme fonts must remain portable");
  }
  assertExactKeys(theme.semanticColors, ["diffAdded", "diffRemoved", "skill"], "semantic colors");
  for (const field of ["diffAdded", "diffRemoved", "skill"]) {
    assertHex(theme.semanticColors?.[field], "semanticColors." + field);
  }
  return payload;
}
