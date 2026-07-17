import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { buildSite } from "../scripts/build.mjs";
import { listZipEntries } from "../scripts/lib/zip.mjs";
import { parseCodexNativeTheme } from "../scripts/lib/codex-native-theme.mjs";
import {
  contrastRatio,
  isSafeRelativePath,
  validateRepository
} from "../scripts/validate.mjs";

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(TEST_DIR, "..");

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

test("repository validates twenty-eight dual-mode code-free themes in four collections", async function () {
  const result = await validateRepository();
  assert.deepEqual(result, {
    sources: 28,
    themes: 28,
    modes: 56,
    packages: 28,
    nativeExports: 56
  });
});

test("registry exposes original and disclosed fan-art collections", async function () {
  const registry = JSON.parse(await readFile(path.join(ROOT, "themes", "registry.json"), "utf8"));
  assert.deepEqual(registry.collections.map(function (collection) {
    return [collection.id, collection.pairing, collection.themeCount];
  }), [
    ["original-xianxia-01", "cinematic-chibi", 8],
    ["china-city-atlas-01", "standalone", 8],
    ["donghua-character-tributes-01", "cinematic-chibi", 8],
    ["donghua-memory-scenes-01", "standalone", 4]
  ]);
  assert.equal(registry.themes.filter(function (theme) { return theme.variant === "cityscape"; }).length, 8);
  assert.equal(registry.themes.filter(function (theme) { return theme.variant === "scene"; }).length, 4);
  assert.equal(registry.themes.filter(function (theme) { return theme.rightsProfile === "fan-art"; }).length, 12);
  assert.equal(registry.themes.filter(function (theme) { return theme.rightsProfile === "original"; }).length, 16);
  assert.equal(registry.themes.every(function (theme) { return typeof theme.collection === "string"; }), true);
  assert.equal(registry.themes.every(function (theme) {
    return theme.provenance?.aiGenerated === true
      && /^[a-f0-9]{64}$/.test(theme.provenance.sourceSha256)
      && /^[a-f0-9]{64}$/.test(theme.provenance.promptSha256);
  }), true);
  assert.equal(registry.themes.filter(function (theme) { return theme.rightsProfile === "fan-art"; }).every(function (theme) {
    return theme.license.spdx === "LicenseRef-ACT-Fan-Art-Notice"
      && theme.license.rightsVerified === false
      && theme.provenance.type === "fan-art"
      && theme.provenance.rightsVerified === false
      && theme.fanArt?.unofficial === true
      && theme.fanArt?.commercialUse === false
      && theme.fanArt?.officialAssetsUsed === false;
  }), true);
  assert.equal(registry.themes.filter(function (theme) { return theme.rightsProfile === "original"; }).every(function (theme) {
    return theme.license.spdx === "CC0-1.0"
      && theme.license.rightsVerified === true
      && theme.provenance.type === "original"
      && theme.provenance.rightsVerified === true;
  }), true);
});

test("canonical archives contain only declared art, manifest, and Codex Native themes", async function () {
  const registry = JSON.parse(await readFile(path.join(ROOT, "themes", "registry.json"), "utf8"));
  for (const theme of registry.themes) {
    const archive = await readFile(path.join(ROOT, ...theme.package.path.split("/")));
    const entries = listZipEntries(archive).map(function (entry) { return entry.name; }).sort();
    assert.deepEqual(entries, [
      "assets/background-dark.png",
      "assets/background-light.png",
      "manifest.json",
      "native/dark.codex-theme.txt",
      "native/light.codex-theme.txt"
    ]);
  }
});

test("registry exposes importable Codex Native v1 strings and no third-party adapters", async function () {
  const registry = JSON.parse(await readFile(path.join(ROOT, "themes", "registry.json"), "utf8"));
  for (const theme of registry.themes) {
    const manifest = JSON.parse(await readFile(path.join(ROOT, ...theme.package.manifest.split("/")), "utf8"));
    assert.deepEqual(Object.keys(theme.exports), ["codex-native"]);
    assert.equal(theme.exports["codex-native"].coverage, "native-theme-v1");
    for (const mode of ["light", "dark"]) {
      const record = theme.previews[mode].nativeTheme;
      const value = await readFile(path.join(ROOT, ...record.path.split("/")), "utf8");
      const payload = parseCodexNativeTheme(value);
      assert.equal(payload.variant, mode);
      assert.equal(payload.codeThemeId, "codex");
      assert.equal(payload.theme.accent, manifest.modes[mode].tokens.accent);
      assert.equal(payload.theme.surface, manifest.modes[mode].tokens.background);
      assert.equal(payload.theme.ink, manifest.modes[mode].tokens.text);
      assert.equal(payload.theme.opaqueWindows, true);
    }
  }
});

test("Codex Native parser rejects undeclared fields", function () {
  const value = "codex-theme-v1:" + JSON.stringify({
    codeThemeId: "codex",
    theme: {
      accent: "#246A4B",
      contrast: 45,
      fonts: { code: null, ui: null },
      ink: "#15231A",
      opaqueWindows: true,
      semanticColors: {
        diffAdded: "#00A240",
        diffRemoved: "#BA2623",
        skill: "#246A4B"
      },
      surface: "#EDF3EE",
      script: "not allowed"
    },
    variant: "light"
  });
  assert.throws(() => parseCodexNativeTheme(value), /fields are invalid/);
});

test("path and contrast guards reject adversarial input", function () {
  assert.equal(isSafeRelativePath("themes/qinglan/manifest.json"), true);
  assert.equal(isSafeRelativePath("../registry.json"), false);
  assert.equal(isSafeRelativePath("themes/../../outside"), false);
  assert.equal(isSafeRelativePath("C:\\outside\\theme.json"), false);
  assert.equal(isSafeRelativePath("/outside/theme.json"), false);
  assert.ok(contrastRatio("#111111", "#FFFFFF") > 15);
  assert.ok(contrastRatio("#777777", "#888888") < 4.5);
});

test("static gallery builds with every public contract artifact", async function () {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "awesome-codex-theme-test-"));
  const output = path.join(temporary, "site");
  try {
    const result = await buildSite(output);
    assert.equal(result.themes, 28);
    const required = [
      "index.html",
      "assets/app.js",
      "assets/styles.css",
      "themes/registry.json",
      "themes/source-art/jobs.json",
      "schemas/theme-pack.schema.json",
      "schemas/registry.schema.json",
      ".nojekyll"
    ];
    for (const relative of required) {
      assert.equal(await exists(path.join(output, ...relative.split("/"))), true, relative);
    }
    const html = await readFile(path.join(output, "index.html"), "utf8");
    const app = await readFile(path.join(output, "assets", "app.js"), "utf8");
    const registry = JSON.parse(await readFile(path.join(output, "themes", "registry.json"), "utf8"));
    for (const theme of registry.themes) {
      assert.equal(await exists(path.join(output, ...theme.package.path.split("/"))), true, theme.package.path);
      for (const mode of ["light", "dark"]) {
        const nativePath = theme.previews[mode].nativeTheme.path;
        assert.equal(await exists(path.join(output, ...nativePath.split("/"))), true, nativePath);
      }
    }
    assert.match(html, /Awesome Codex Theme/);
    assert.match(html, /id="trustNote"/);
    assert.match(html, /id="dialogRights"/);
    assert.match(html, /docs\/fan-art-policy\.md/);
    assert.match(html, /data-filter="scene"/);
    assert.match(html, /codex:\/\/settings/);
    assert.match(app, /nativeTheme\.path/);
    assert.doesNotMatch(app, /dream-skin|heige-skin-studio|codedrobe/i);
    assert.doesNotMatch(html, /TODO|preset-act/i);
  } finally {
    const resolved = path.resolve(temporary);
    if (resolved.startsWith(path.resolve(os.tmpdir()) + path.sep)) {
      await rm(resolved, { recursive: true, force: true });
    }
  }
});

test("gallery keeps the independent Chinese-first visual system", async function () {
  const [html, css] = await Promise.all([
    readFile(path.join(ROOT, "site", "index.html"), "utf8"),
    readFile(path.join(ROOT, "site", "assets", "styles.css"), "utf8")
  ]);
  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /id="heroMode"/);
  assert.match(html, /\.codex\/skills\/create-codex-theme/);
  assert.doesNotMatch(html, /reimagined|hero-accent|hero-orbit/i);
  assert.doesNotMatch(css, /--acid|#d9ff43/i);
});
