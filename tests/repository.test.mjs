import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { buildSite } from "../scripts/build.mjs";
import { buildWindowsInstaller } from "../scripts/build-installer.mjs";
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
    fullSkinExports: 56,
    nativeExports: 56,
    captures: 56
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
    return typeof theme.tagline?.en === "string"
      && theme.tagline.en.length > 0
      && typeof theme.tagline?.["zh-CN"] === "string"
      && theme.tagline["zh-CN"].length > 0;
  }), true);
  assert.equal(registry.themes.every(function (theme) {
    return ["light", "dark"].every(function (mode) {
      const capture = theme.previews[mode].capture;
      return capture?.appVersion === "26.715.3651.0"
        && capture.fixture === "full-skin-home-v1"
        && capture.width === 1440
        && capture.height === 810
        && capture.assetSha256 === theme.previews[mode].fullSkin.sha256
        && capture.markerVersion === "act-full-skin-v1"
        && capture.selectors.main === true
        && capture.selectors.composer === true;
    });
  }), true);
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

test("registry exposes declarative full skins, Native fallbacks, and no third-party adapters", async function () {
  const registry = JSON.parse(await readFile(path.join(ROOT, "themes", "registry.json"), "utf8"));
  const nativeValues = new Set();
  for (const theme of registry.themes) {
    const manifest = JSON.parse(await readFile(path.join(ROOT, ...theme.package.manifest.split("/")), "utf8"));
    assert.deepEqual(Object.keys(theme.exports), ["codex-full-skin", "codex-native"]);
    assert.equal(theme.exports["codex-full-skin"].coverage, "full-skin-v1");
    assert.equal(theme.exports["codex-full-skin"].format, "act-full-skin-v1");
    assert.equal(theme.exports["codex-full-skin"].delivery, "Awesome Codex Theme Manager");
    assert.equal(theme.exports["codex-native"].coverage, "native-theme-v1");
    for (const mode of ["light", "dark"]) {
      const fullSkin = theme.previews[mode].fullSkin;
      const record = theme.previews[mode].nativeTheme;
      const value = await readFile(path.join(ROOT, ...record.path.split("/")), "utf8");
      assert.equal(fullSkin.format, "act-full-skin-v1");
      assert.equal(fullSkin.sha256, manifest.modes[mode].integrity.sha256);
      assert.equal(fullSkin.bytes, manifest.modes[mode].integrity.bytes);
      assert.deepEqual(fullSkin.tokens, manifest.modes[mode].tokens);
      assert.equal(nativeValues.has(value), false, theme.id + " " + mode + " must have a distinct Native payload");
      nativeValues.add(value);
      const payload = parseCodexNativeTheme(value);
      assert.equal(payload.variant, mode);
      assert.equal(payload.codeThemeId, "codex");
      assert.equal(payload.theme.accent, manifest.modes[mode].tokens.accent);
      assert.equal(payload.theme.surface, manifest.modes[mode].tokens.background);
      assert.equal(payload.theme.ink, manifest.modes[mode].tokens.text);
      assert.equal(payload.theme.opaqueWindows, true);
    }
  }
  assert.equal(nativeValues.size, 56);
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
      "downloads/awesome-codex-theme-installer-windows.zip",
      "downloads/installer.json",
      "downloads/catalog.json",
      "docs/assets/theme-manager-windows.png",
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
        const fullSkinPath = theme.previews[mode].fullSkin.asset;
        const nativePath = theme.previews[mode].nativeTheme.path;
        const capturePath = theme.previews[mode].capture.path;
        assert.equal(await exists(path.join(output, ...fullSkinPath.split("/"))), true, fullSkinPath);
        assert.equal(await exists(path.join(output, ...nativePath.split("/"))), true, nativePath);
        assert.equal(await exists(path.join(output, ...capturePath.split("/"))), true, capturePath);
      }
    }
    assert.match(html, /Awesome Codex Theme/);
    assert.match(html, /id="trustNote"/);
    assert.match(html, /id="dialogRights"/);
    assert.match(html, /docs\/fan-art-policy\.md/);
    assert.match(html, /data-filter="scene"/);
    assert.match(html, /id="rightsGroup"/);
    assert.match(html, /id="community"/);
    assert.match(html, /theme-proposal\.yml/);
    assert.match(html, /docs\/community-registry\.md/);
    assert.doesNotMatch(html, /codex:\/\/settings/);
    assert.match(html, /awesome-codex-theme-installer-windows\.zip/);
    assert.match(html, /theme-manager-windows\.png/);
    assert.match(html, /ACT Full Skin/);
    assert.match(html, /act-full-skin-v1/);
    assert.match(html, /github\.com\/rwang23\/awesome-codex-theme\/releases/);
    assert.match(app, /Background \+ materials \+ colors \+ copy/);
    assert.match(app, /背景 \+ 材质 \+ 配色 \+ 文案/);
    assert.match(app, /nativeTheme\.path/);
    assert.match(app, /modeRecord\.capture/);
    assert.doesNotMatch(app, /Beta 26\.707\.3351\.0/);
    assert.doesNotMatch(app, /dream-skin|heige-skin-studio|codedrobe/i);
    assert.doesNotMatch(html, /TODO|preset-act/i);
  } finally {
    const resolved = path.resolve(temporary);
    if (resolved.startsWith(path.resolve(os.tmpdir()) + path.sep)) {
      await rm(resolved, { recursive: true, force: true });
    }
  }
});

test("Tauri manager keeps theme values in Rust and limits desktop capabilities", async function () {
  const [
    backend,
    catalog,
    runtime,
    platform,
    updater,
    bridge,
    configText,
    capabilityText,
    cargo,
    appPackage,
  ] = await Promise.all([
    readFile(path.join(ROOT, "apps", "theme-manager", "src-tauri", "src", "lib.rs"), "utf8"),
    readFile(path.join(ROOT, "apps", "theme-manager", "src-tauri", "src", "catalog.rs"), "utf8"),
    readFile(path.join(ROOT, "apps", "theme-manager", "src-tauri", "src", "skin_runtime.rs"), "utf8"),
    readFile(path.join(ROOT, "apps", "theme-manager", "src-tauri", "src", "platform.rs"), "utf8"),
    readFile(path.join(ROOT, "apps", "theme-manager", "src-tauri", "src", "updater.rs"), "utf8"),
    readFile(path.join(ROOT, "apps", "theme-manager", "src", "renderer", "bridge.js"), "utf8"),
    readFile(path.join(ROOT, "apps", "theme-manager", "src-tauri", "tauri.conf.json"), "utf8"),
    readFile(path.join(ROOT, "apps", "theme-manager", "src-tauri", "capabilities", "default.json"), "utf8"),
    readFile(path.join(ROOT, "apps", "theme-manager", "src-tauri", "Cargo.toml"), "utf8"),
    readFile(path.join(ROOT, "apps", "theme-manager", "package.json"), "utf8"),
  ]);
  const config = JSON.parse(configText);
  const capability = JSON.parse(capabilityText);

  assert.match(cargo, /features = \["protocol-asset"\]/);
  assert.deepEqual(config.app.security.assetProtocol.scope, ["$RESOURCE/catalog/screenshots/**"]);
  assert.deepEqual(config.bundle.resources["../build/catalog/screenshots/"], "catalog/screenshots/");
  assert.deepEqual(capability.windows, ["main"]);
  assert.ok(capability.permissions.every(function (permission) {
    return permission.startsWith("core:");
  }));
  assert.match(catalog, /native_value_for/);
  assert.match(catalog, /REMOTE_CATALOG_URL/);
  assert.match(catalog, /registry_bytes\.len\(\) != expected_bytes/);
  assert.match(backend, /copy_theme/);
  assert.match(backend, /native_value_for\(&catalog, &theme_id, &mode\)/);
  assert.match(backend, /apply_full_skin/);
  assert.match(backend, /restore_full_skin/);
  assert.match(runtime, /Page\.addScriptToEvaluateOnNewDocument/);
  assert.match(runtime, /Page\.removeScriptToEvaluateOnNewDocument/);
  assert.match(runtime, /app:\/\//);
  assert.match(runtime, /127\.0\.0\.1/);
  assert.match(runtime, /remote-debugging-port/);
  assert.match(platform, /IApplicationActivationManager/);
  assert.doesNotMatch(bridge, /nativeTheme.*value|nativeValue/i);
  assert.match(updater, /ACT_UPDATER_PUBKEY/);
  assert.match(config.plugins.updater.endpoints[0], /^https:\/\/github\.com\/rwang23\/awesome-codex-theme\/releases\//);
  assert.match(appPackage, /@tauri-apps\/cli/);
  assert.doesNotMatch(appPackage, /electron/i);
  assert.doesNotMatch(backend + catalog + runtime + platform, /WindowsApps.*(?:write|copy)|app\.asar.*(?:write|copy)/i);
});

test("real screenshot evidence covers every mode and confirms Beta restoration", async function () {
  const manifest = JSON.parse(await readFile(
    path.join(ROOT, "screenshots", "codex-beta-26.715.3651.0", "manifest.json"),
    "utf8",
  ));
  assert.equal(manifest.status, "complete");
  assert.equal(manifest.testBench.packageFullName, "OpenAI.CodexBeta_26.715.3651.0_x64__2p2nqsd0c76g0");
  assert.equal(manifest.fixture.id, "full-skin-home-v1");
  assert.equal(manifest.fixture.sidebar, "hidden");
  assert.equal(manifest.fixture.privateContent, "excluded");
  assert.equal(manifest.fixture.nativeSettingsChanged, false);
  assert.equal(manifest.runtime.format, "act-full-skin-v1");
  assert.equal(manifest.runtime.earlyInjection, true);
  assert.equal(manifest.runtime.removedAfterCapture, true);
  assert.equal(manifest.captures.length, 56);
  assert.equal(manifest.captures.every(function (capture) {
    return capture.runtimeSha256 === manifest.runtime.sha256
      && capture.markerVersion === "act-full-skin-v1"
      && capture.selectors.main === true
      && capture.selectors.composer === true;
  }), true);
  assert.equal(new Set(manifest.captures.map(function (capture) {
    return capture.themeId + "|" + capture.mode;
  })).size, 56);
});

test("Windows installer is a no-admin helper with a bundled Registry", async function () {
  const result = await buildWindowsInstaller();
  const entries = listZipEntries(result.archive).map(function (entry) { return entry.name; }).sort();
  assert.deepEqual(entries, [
    "ACT-Installer.ps1",
    "LICENSE.txt",
    "Launch ACT Installer.cmd",
    "README.txt",
    "copy.json",
    "registry.json"
  ]);
  assert.equal(result.manifest.requiresAdmin, false);
  assert.match(result.manifest.installBoundary, /final import remains inside ChatGPT/);
  const script = await readFile(path.join(ROOT, "installer", "windows", "ACT-Installer.ps1"), "utf8");
  assert.match(script, /OpenAI\.CodexBeta/);
  assert.match(script, /shell:AppsFolder/);
  assert.match(script, /ConvertFrom-ACTNativeTheme/);
  assert.doesNotMatch(script, /WindowsApps.*(?:Write|Set-Content)|app\.asar|remote-debugging-port/i);
});

test("gallery keeps the independent Chinese-first visual system", async function () {
  const [html, css, app] = await Promise.all([
    readFile(path.join(ROOT, "site", "index.html"), "utf8"),
    readFile(path.join(ROOT, "site", "assets", "styles.css"), "utf8"),
    readFile(path.join(ROOT, "site", "assets", "app.js"), "utf8")
  ]);
  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /id="heroMode"/);
  assert.match(html, /id="rightsGroup"/);
  assert.match(html, /id="clearFilters"/);
  assert.match(html, /\.codex\/skills\/create-codex-theme/);
  assert.match(app, /navigator\.languages/);
  assert.match(app, /act-locale/);
  assert.match(app, /state\.rights/);
  assert.doesNotMatch(html, /reimagined|hero-accent|hero-orbit/i);
  assert.doesNotMatch(css, /--acid|#d9ff43/i);
});

test("desktop manager localizes from the system and combines collection, rights, and style facets", async function () {
  const [html, app] = await Promise.all([
    readFile(path.join(ROOT, "apps", "theme-manager", "src", "renderer", "index.html"), "utf8"),
    readFile(path.join(ROOT, "apps", "theme-manager", "src", "renderer", "app.js"), "utf8")
  ]);
  assert.match(html, /id="languageButton"/);
  assert.match(html, /id="rightsFilter"/);
  assert.match(html, /id="styleFilter"/);
  assert.match(app, /navigator\.languages/);
  assert.match(app, /act-manager-locale/);
  assert.match(app, /theme\.rightsProfile !== state\.rights/);
  assert.match(app, /theme\.variant !== state\.style/);
  assert.match(app, /theme\.name\?\.\["zh-CN"\]/);
  assert.match(app, /theme\.name\?\.en/);
});

test("desktop beta release requires updater signing and discloses deferred platform trust", async function () {
  const workflow = await readFile(path.join(ROOT, ".github", "workflows", "desktop.yml"), "utf8");
  assert.match(workflow, /npm run generate && npm run validate && npm run desktop:prepare/);
  assert.match(workflow, /DESKTOP_RELEASE_READY/);
  assert.match(workflow, /TAURI_SIGNING_PRIVATE_KEY/);
  assert.match(workflow, /TAURI_SIGNING_PRIVATE_KEY_PASSWORD/);
  assert.match(workflow, /TAURI_UPDATER_PUBKEY/);
  assert.match(workflow, /Updater-signed Tauri Theme Manager beta/);
  assert.match(workflow, /unknown-publisher warning/);
  assert.match(workflow, /prerelease: false/);
  assert.match(workflow, /releaseDraft: true/);
  assert.doesNotMatch(workflow, /WINDOWS_CERTIFICATE/);
  assert.doesNotMatch(workflow, /APPLE_CERTIFICATE/);
  assert.doesNotMatch(workflow, /tauri\.windows-signing\.conf\.json/);
  assert.match(workflow, /hdiutil verify/);
  assert.match(workflow, /CFBundleIdentifier/);
  assert.match(workflow, /lipo -archs/);
});

test("desktop preparation derives compact thumbnails from verified captures", async function () {
  const prepare = await readFile(path.join(ROOT, "scripts", "prepare-desktop.mjs"), "utf8");
  assert.match(prepare, /CAPTURE_WIDTH = 720/);
  assert.match(prepare, /CAPTURE_HEIGHT = 405/);
  assert.match(prepare, /resizePng/);
  assert.match(prepare, /DESKTOP_CATALOG\.startsWith\(DESKTOP_BUILD \+ path\.sep\)/);
  assert.match(prepare, /capture\?\.path/);
});
