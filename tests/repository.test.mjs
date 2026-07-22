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

test("repository validates sixty-eight dual-mode code-free themes in eleven collections", async function () {
  const result = await validateRepository();
  assert.deepEqual(result, {
    sources: 68,
    themes: 68,
    modes: 136,
    packages: 68,
    fullSkinExports: 136,
    nativeExports: 136,
    captures: 136
  });
});

test("registry exposes original and disclosed fan-art collections", async function () {
  const [catalog, registry, captureManifest] = await Promise.all([
    readFile(path.join(ROOT, "themes", "catalog.json"), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "themes", "registry.json"), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "screenshots", "codex-beta-26.715.3651.0", "manifest.json"), "utf8").then(JSON.parse),
  ]);
  assert.equal(catalog.catalogRevision, 2026072201);
  assert.equal(registry.catalogRevision, catalog.catalogRevision);
  assert.ok(
    String(catalog.catalogRevision).slice(0, 8)
      >= captureManifest.capturedAt.slice(0, 10).replaceAll("-", ""),
    "Catalog revision must not predate its screenshot evidence",
  );
  assert.deepEqual(registry.collections.map(function (collection) {
    return [collection.id, collection.pairing, collection.themeCount];
  }), [
    ["original-xianxia-01", "cinematic-chibi", 8],
    ["china-city-atlas-01", "standalone", 8],
    ["world-city-atlas-01", "standalone", 12],
    ["donghua-character-tributes-01", "cinematic-chibi", 8],
    ["donghua-memory-scenes-01", "standalone", 4],
    ["codex-community-tributes-01", "standalone", 2],
    ["global-workspace-favorites-01", "standalone", 6],
    ["china-life-favorites-01", "standalone", 5],
    ["mortal-journey-fan-art-02", "standalone", 5],
    ["original-xianxia-02", "standalone", 5],
    ["american-workspace-favorites-02", "standalone", 5]
  ]);
  assert.equal(registry.themes.filter(function (theme) { return theme.variant === "cityscape"; }).length, 20);
  assert.equal(registry.themes.filter(function (theme) { return theme.variant === "scene"; }).length, 23);
  assert.equal(registry.themes.filter(function (theme) { return theme.rightsProfile === "fan-art"; }).length, 19);
  assert.equal(registry.themes.filter(function (theme) { return theme.rightsProfile === "original"; }).length, 49);
  assert.equal(registry.themes.filter(function (theme) { return theme.audience === "en"; }).length, 23);
  assert.equal(registry.themes.filter(function (theme) { return theme.audience === "zh-CN"; }).length, 6);
  assert.equal(registry.themes.find(function (theme) { return theme.id === "tibo-reset-saint"; }).featuredRank.en, 1);
  assert.equal(registry.themes.find(function (theme) { return theme.id === "tibo-reset-immortal"; }).featuredRank["zh-CN"], 1);
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
        && capture.modelLabel === "5.6 Sol Max"
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
  assert.equal(nativeValues.size, 136);
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
    assert.equal(result.themes, 68);
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
    const catalogManifest = JSON.parse(await readFile(path.join(output, "downloads", "catalog.json"), "utf8"));
    const tauriConfig = JSON.parse(await readFile(
      path.join(ROOT, "apps", "theme-manager", "src-tauri", "tauri.conf.json"),
      "utf8",
    ));
    assert.equal(catalogManifest.registry.catalogRevision, registry.catalogRevision);
    assert.equal(catalogManifest.desktop.currentVersion, tauriConfig.version);
    assert.match(html, new RegExp(">" + tauriConfig.version + "<"));
    assert.doesNotMatch(html, /__ACT_DESKTOP_VERSION__/);
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
    assert.match(html, /class="hero-download" href="https:\/\/github\.com\/rwang23\/awesome-codex-theme\/releases"/);
    assert.match(html, /theme-proposal\.yml/);
    assert.doesNotMatch(html, /community\.ecomstack\.net/);
    assert.doesNotMatch(html, /docs\/community-registry\.md/);
    assert.doesNotMatch(html, /codex:\/\/settings/);
    assert.match(html, /awesome-codex-theme-installer-windows\.zip/);
    assert.match(html, /theme-manager-windows\.png/);
    assert.match(html, /ACT Full Skin/);
    assert.match(html, /act-full-skin-v1/);
    assert.match(html, /github\.com\/rwang23\/awesome-codex-theme\/releases/);
    assert.match(app, /Background \+ materials \+ colors \+ copy/);
    assert.match(app, /背景 \+ 材质 \+ 配色 \+ 文案/);
    assert.match(app, /Download Theme Manager/);
    assert.match(app, /社区投稿暂未开放/);
    assert.match(app, /nativeTheme\.path/);
    assert.match(app, /modeRecord\.capture/);
    assert.match(app, /function renderCollectionIntro/);
    assert.doesNotMatch(app, /39 original themes|39 套原创主题/);
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
    smoke,
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
    readFile(path.join(ROOT, "scripts", "smoke-theme-manager.mjs"), "utf8"),
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
  assert.doesNotMatch(smoke, /Get-CimInstance|Get-NetTCPConnection/);
  assert.match(smoke, /CreateToolhelp32Snapshot/);
  assert.match(smoke, /netstat\.exe/);
  assert.match(smoke, /No pinned Beta root process owns a loopback CDP listener/);
  const capture = await readFile(path.join(ROOT, "scripts", "capture-full-skin-screenshots.mjs"), "utf8");
  assert.match(capture, /Sol\|Terra\|Luna/);
  assert.match(capture, /Max\|Ultra\|Standard/);
  assert.match(capture, /async function trustedMenuSelect/);
  assert.match(smoke, /window\.act\.getSkinState\(\)\.then/);
  assert.match(smoke, /stdio: \["ignore", "pipe", "pipe"\]/);
  assert.doesNotMatch(smoke, /skinStatus.*ChatGPT Beta|正在 ChatGPT Beta 使用/s);
  assert.doesNotMatch(smoke, /DevToolsActivePort/);
  assert.match(runtime, /Page\.addScriptToEvaluateOnNewDocument/);
  assert.match(runtime, /Page\.removeScriptToEvaluateOnNewDocument/);
  assert.match(runtime, /missing_early_script_registration/);
  assert.match(runtime, /DOMContentLoaded/);
  assert.match(runtime, /monitor_skin_session/);
  assert.match(runtime, /recover_target_runtime/);
  assert.match(runtime, /register_target_runtime/);
  assert.match(runtime, /refresh_target/);
  assert.match(runtime, /target_runtime_state/);
  assert.match(runtime, /TARGET_DISCOVERY_INTERVAL/);
  assert.match(runtime, /TARGET_HEALTH_INTERVAL/);
  assert.match(runtime, /monitor_stop/);
  assert.match(runtime, /app:\/\//);
  assert.match(runtime, /127\.0\.0\.1/);
  assert.match(runtime, /remote-debugging-port/);
  assert.match(runtime, /TcpListener::bind\(\("127\.0\.0\.1", 0\)\)/);
  assert.doesNotMatch(runtime, /port_for_channel|=> Ok\(946[56]\)/);
  const fullSkinRuntime = await readFile(path.join(ROOT, "packages", "full-skin", "runtime.js"), "utf8");
  const fullSkinCss = await readFile(path.join(ROOT, "packages", "full-skin", "runtime.css"), "utf8");
  assert.match(fullSkinRuntime, /what should we work on\(\?: in workspace\)\?/);
  assert.match(fullSkinRuntime, /h1, h2, \[class\*='title'\]/);
  assert.match(fullSkinRuntime, /URL\.createObjectURL/);
  assert.match(fullSkinRuntime, /URL\.revokeObjectURL/);
  assert.match(fullSkinRuntime, /--act-art-image/);
  assert.doesNotMatch(fullSkinRuntime, /createElement\("img"\)|art\.src = imageData/);
  assert.match(fullSkinRuntime, /installToken/);
  assert.match(fullSkinRuntime, /metrics/);
  assert.match(fullSkinRuntime, /new MutationObserver\(\(\) =>/);
  assert.match(fullSkinRuntime, /clearTimeout\(ensureTimer\)/);
  assert.match(fullSkinRuntime, /}, 180\)/);
  assert.match(fullSkinRuntime, /}, 5000\)/);
  assert.match(fullSkinCss, /background-image: var\(--act-art-image\)/);
  assert.match(fullSkinCss, /aside\.app-shell-left-panel[\s\S]*?var\(--act-surface-alt\)/);
  const mainSurfaceRule = /html\.act-full-skin main\.main-surface,\s*html\.act-full-skin \[role="main"\] \{([^}]+)\}/u.exec(fullSkinCss);
  assert.ok(mainSurfaceRule, "Full Skin must explicitly clear the route-sized main surface");
  assert.match(mainSurfaceRule[1], /background: transparent !important/);
  assert.doesNotMatch(mainSurfaceRule[1], /linear-gradient/);
  assert.match(fullSkinCss, /bg-token-main-surface-primary/);
  assert.match(fullSkinCss, /app-shell-main-content-top-fade/);
  assert.doesNotMatch(fullSkinCss, /#act-full-skin-art/);
  assert.match(smoke, /documentBackground/);
  assert.match(smoke, /exercisePublicBetaRoute/);
  assert.match(smoke, /privacy-safe SPA route navigation/);
  assert.doesNotMatch(smoke, /artwork\.currentSrc\.startsWith\("data:image\/png;base64,"\)/);
  assert.match(smoke, /Page\.reload/);
  assert.match(smoke, /Beta Full Skin after document navigation/);
  assert.match(smoke, /reloadedBetaState/);
  assert.match(capture, /documentBackground/);
  assert.match(platform, /windows_full_skin_launch_arguments/);
  assert.match(platform, /hidden_command\(executable\)/);
  assert.doesNotMatch(platform, /IApplicationActivationManager/);
  assert.match(platform, /windows_listener_owner_pid/);
  assert.match(platform, /netstat\.exe/);
  assert.match(platform, /Get-Process/);
  assert.doesNotMatch(platform, /Get-CimInstance/);
  assert.match(platform, /vec!\["-n"\.into\(\), bundle_path\.into\(\)\]/);
  assert.match(platform, /\["ChatGPT", "Codex"\]/);
  assert.match(platform, /\["ChatGPT Beta", "Codex Beta"\]/);
  assert.match(platform, /std::process::Command::new\(executable\)/);
  assert.doesNotMatch(bridge, /nativeTheme.*value|nativeValue/i);
  assert.match(bridge, /applyNow = false/);
  assert.match(bridge, /applyNow \}/);
  assert.match(updater, /ACT_UPDATER_PUBKEY/);
  assert.match(config.plugins.updater.endpoints[0], /^https:\/\/github\.com\/rwang23\/awesome-codex-theme\/releases\//);
  assert.match(appPackage, /@tauri-apps\/cli/);
  assert.doesNotMatch(appPackage, /electron/i);
  assert.doesNotMatch(backend + catalog + runtime + platform, /WindowsApps.*(?:write|copy)|app\.asar.*(?:write|copy)/i);
});

test("Theme Manager renders a compact Copy action, footer version, and macOS traffic-light chrome", async function () {
  const [html, app, styles] = await Promise.all([
    readFile(path.join(ROOT, "apps", "theme-manager", "src", "renderer", "index.html"), "utf8"),
    readFile(path.join(ROOT, "apps", "theme-manager", "src", "renderer", "app.js"), "utf8"),
    readFile(path.join(ROOT, "apps", "theme-manager", "src", "renderer", "styles.css"), "utf8"),
  ]);
  assert.match(html, /id="appVersion"/);
  assert.match(app, /appVersion: document\.querySelector\("#appVersion"\)/);
  assert.match(app, /function renderAppVersion\(\)/);
  assert.match(app, /elements\.appVersion\.textContent = state\.appVersion \? `v\$\{state\.appVersion\}` : "—"/);
  assert.match(styles, /\.footer-metadata,/);
  assert.match(app, /function renderWindowChrome\(\)/);
  assert.match(app, /elements\.appShell\.dataset\.platform = state\.platform === "darwin"/);
  assert.match(styles, /\.app-shell\[data-platform="darwin"\] \.window-controls/);
  assert.match(styles, /order: -1/);
  assert.match(styles, /#windowClose \{\s*order: 1;\s*background: #ff5f57/s);
  assert.match(styles, /#windowMinimize \{\s*order: 2;\s*background: #febc2e/s);
  assert.match(styles, /#windowMaximize \{\s*order: 3;\s*background: #28c840/s);
  assert.match(styles, /\.secondary-action \{[\s\S]*?height: 26px/);
  assert.match(styles, /\.workspace \{[\s\S]*?grid-template-columns: minmax\(350px, 390px\) minmax\(0, 1fr\)/);
  assert.match(styles, /\.theme-list \{[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(styles, /\.theme-list \{[\s\S]*?overflow-x: hidden;[\s\S]*?overflow-y: auto/);
  assert.match(styles, /@media \(min-width: 1051px\) and \(max-height: 840px\)/);
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
  assert.equal(manifest.fixture.project, "none");
  assert.equal(manifest.fixture.privateContent, "excluded");
  assert.equal(manifest.fixture.modelLabel, "5.6 Sol Max");
  assert.equal(manifest.fixture.modelRestoredAfterCapture, true);
  assert.equal(manifest.fixture.nativeSettingsChanged, false);
  assert.equal(manifest.runtime.format, "act-full-skin-v1");
  assert.equal(manifest.runtime.implementationVersion, "act-full-skin-runtime-v2");
  assert.equal(manifest.runtime.earlyInjection, true);
  assert.equal(manifest.runtime.removedAfterCapture, true);
  assert.equal(manifest.captures.length, 136);
  assert.equal(manifest.captures.every(function (capture) {
    return capture.runtimeSha256 === manifest.runtime.sha256
      && capture.markerVersion === "act-full-skin-v1"
      && capture.implementationVersion === "act-full-skin-runtime-v2"
      && capture.modelLabel === "5.6 Sol Max"
      && capture.selectors.main === true
      && capture.selectors.composer === true
      && capture.artwork?.complete === true
      && capture.artwork.width > 0
      && capture.artwork.height > 0
      && capture.artwork.source === true
      && capture.artwork.documentBackground === true;
  }), true);
  assert.equal(new Set(manifest.captures.map(function (capture) {
    return capture.themeId + "|" + capture.mode;
  })).size, 136);
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
  assert.match(script, /\$expectedExports = @\("codex-full-skin", "codex-native"\)/);
  assert.doesNotMatch(script, /WindowsApps.*(?:Write|Set-Content)|app\.asar|remote-debugging-port/i);
});

test("gallery follows browser language, uses a language-neutral mark, and localizes featured ordering", async function () {
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
  assert.match(app, /featuredPriority/);
  assert.match(app, /audiencePriority/);
  assert.match(app, /state\.rights/);
  assert.doesNotMatch(html, />境</);
  assert.doesNotMatch(html, /reimagined|hero-accent|hero-orbit/i);
  assert.doesNotMatch(css, /--acid|#d9ff43/i);
});

test("desktop manager localizes from the system and makes visual styles the primary discovery control", async function () {
  const [html, app] = await Promise.all([
    readFile(path.join(ROOT, "apps", "theme-manager", "src", "renderer", "index.html"), "utf8"),
    readFile(path.join(ROOT, "apps", "theme-manager", "src", "renderer", "app.js"), "utf8")
  ]);
  assert.match(html, /id="languageButton"/);
  assert.match(html, /id="rightsFilter"/);
  assert.match(html, /id="styleTabs"/);
  assert.match(html, /id="resultCount"/);
  assert.doesNotMatch(html, /id="styleFilter"/);
  assert.match(app, /navigator\.languages/);
  assert.match(app, /act-manager-locale/);
  assert.match(app, /featuredPriority/);
  assert.match(app, /audiencePriority/);
  assert.doesNotMatch(html, />境</);
  assert.match(app, /const styleDefinitions = \[/);
  assert.match(app, /function renderStyleTabs\(\)/);
  assert.match(app, /state\.style = button\.dataset\.style/);
  assert.match(app, /function matchesRights\(theme/);
  assert.match(app, /function matchesStyle\(theme/);
  assert.match(app, /theme\.name\?\.\["zh-CN"\]/);
  assert.match(app, /theme\.name\?\.en/);
  assert.match(app, /async function refreshThemeCatalog/);
  assert.match(app, /acceptCatalog\(payload\)/);
  assert.match(app, /async function refreshAppUpdateState/);
  assert.match(app, /state\.updateState = await window\.act\.checkForAppUpdate\(\)/);
  assert.match(app, /refreshThemeCatalog\(true\)/);
  assert.match(app, /refreshAppUpdateState\(\)/);
  assert.match(html, /themeUpdateNoRestart/);
  assert.match(html, /appUpdateChannel/);
  assert.match(html, /id=\"openRepository\"[^>]*data-i18n=\"githubRepository\"/);
  assert.match(app, /githubRepository: \"GitHub repository\"/);
  assert.match(app, /githubRepository: \"GitHub \u4ed3\u5e93\"/);
  assert.match(app, /openExternal\(\"repository\"\)/);
  assert.match(app, /Apply & Keep Full Skin/);
  assert.match(app, /应用并保持完整皮肤/);
  assert.doesNotMatch(app, /window\.confirm\(/);
  assert.match(app, /await requestPersistenceConsent\(\)/);
  assert.match(html, /id="persistenceConsentDialog"/);
  assert.match(html, /id="persistenceConsentConfirm"/);
  assert.doesNotMatch(app, /await window\.act\.applyFullSkin\(/);
  assert.match(app, /await window\.act\.enablePersistentTheme\(/);
  assert.match(app, /async function waitForPersistentApply\(/);
  assert.match(app, /"retry-blocked"/);
  assert.match(app, /state\.persistenceState = await waitForPersistentApply/);
});

test("READMEs recommend Agent installation first and manual desktop installation last", async function () {
  const [english, chinese] = await Promise.all([
    readFile(path.join(ROOT, "README.md"), "utf8"),
    readFile(path.join(ROOT, "README.zh-CN.md"), "utf8")
  ]);
  const englishAgent = english.indexOf("### Method A: Ask a coding agent (recommended)");
  const englishSource = english.indexOf("### Method B: Build from source");
  const englishDesktop = english.indexOf("### Method C: Install the desktop app manually");
  const chineseAgent = chinese.indexOf("### \u65b9\u5f0f A\uff1a\u8ba9 Coding Agent \u5e2e\u4f60\u5b89\u88c5\uff08\u63a8\u8350\uff09");
  const chineseSource = chinese.indexOf("### \u65b9\u5f0f B\uff1a\u4ece\u6e90\u7801\u6784\u5efa");
  const chineseDesktop = chinese.indexOf("### \u65b9\u5f0f C\uff1a\u624b\u52a8\u5b89\u88c5\u684c\u9762\u5e94\u7528");
  assert.ok(englishAgent >= 0 && englishAgent < englishSource && englishSource < englishDesktop);
  assert.ok(chineseAgent >= 0 && chineseAgent < chineseSource && chineseSource < chineseDesktop);
  assert.ok(english.indexOf("Install with an Agent") < english.indexOf("Desktop Downloads"));
  assert.ok(chinese.indexOf("\u8ba9 Agent \u5e2e\u4f60\u5b89\u88c5") < chinese.indexOf("\u4e0b\u8f7d\u684c\u9762\u5e94\u7528"));
});

test("Tibo copy uses a deliberate two-line God of Reset lockup", async function () {
  const catalog = JSON.parse(await readFile(path.join(ROOT, "themes", "catalog.json"), "utf8"));
  const saint = catalog.themes.find(function (theme) { return theme.id === "tibo-reset-saint"; });
  const immortal = catalog.themes.find(function (theme) { return theme.id === "tibo-reset-immortal"; });
  assert.deepEqual(saint.name, { en: "Saint Tibo", "zh-CN": "提博圣像" });
  assert.deepEqual(saint.tagline, { en: "God of Reset", "zh-CN": "重置之神" });
  assert.deepEqual(immortal.name, { en: "Tibo, Token Immortal", "zh-CN": "提博大神" });
  assert.deepEqual(immortal.tagline, { en: "God of Reset", "zh-CN": "重置之神" });
});

test("desktop beta release requires updater signing and discloses deferred platform trust", async function () {
  const [workflow, tauriConfigText] = await Promise.all([
    readFile(path.join(ROOT, ".github", "workflows", "desktop.yml"), "utf8"),
    readFile(path.join(ROOT, "apps", "theme-manager", "src-tauri", "tauri.conf.json"), "utf8")
  ]);
  const tauriConfig = JSON.parse(tauriConfigText);
  assert.match(workflow, /npm run generate && npm run validate && npm run desktop:prepare/);
  assert.match(workflow, /DESKTOP_RELEASE_READY/);
  assert.match(workflow, /TAURI_SIGNING_PRIVATE_KEY/);
  assert.match(workflow, /TAURI_SIGNING_PRIVATE_KEY_PASSWORD/);
  assert.match(workflow, /TAURI_UPDATER_PUBKEY/);
  assert.match(workflow, /Validate Windows portable helper/);
  assert.match(workflow, /npm run installer:validate/);
  assert.match(workflow, /Updater-signed Tauri Theme Manager beta/);
  assert.match(workflow, /releaseName: "Awesome Codex Theme \$\{\{ github\.ref_name \}\} Beta"/);
  assert.match(workflow, /unknown-publisher warning/);
  assert.match(workflow, /prerelease: false/);
  assert.match(workflow, /releaseDraft: true/);
  assert.doesNotMatch(workflow, /WINDOWS_CERTIFICATE/);
  assert.doesNotMatch(workflow, /APPLE_CERTIFICATE/);
  assert.doesNotMatch(workflow, /tauri\.windows-signing\.conf\.json/);
  assert.match(workflow, /hdiutil verify/);
  assert.match(workflow, /CFBundleIdentifier/);
  assert.match(workflow, /lipo -archs/);
  assert.match(workflow, /codesign --verify --deep --strict/);
  assert.match(workflow, /Signature=adhoc/);
  assert.match(workflow, /--bundles app,dmg/);
  assert.match(workflow, /\.app\.tar\.gz\.sig/);
  assert.match(workflow, /releaseAssetNamePattern:/);
  assert.match(workflow, /Awesome-Codex-Theme-\[version\]-Windows-x64/);
  assert.match(workflow, /Awesome-Codex-Theme-\[version\]-macOS-Apple-Silicon/);
  assert.match(workflow, /Awesome-Codex-Theme-\[version\]-macOS-Intel/);
  assert.doesNotMatch(workflow, /desktop-macos-(?:arm64|x64)/);
  assert.equal(tauriConfig.bundle.macOS.signingIdentity, "-");
  assert.match(tauriConfig.plugins.updater.pubkey, /^[A-Za-z0-9+/=]{100,}$/);
});

test("desktop preparation derives compact thumbnails from verified captures", async function () {
  const prepare = await readFile(path.join(ROOT, "scripts", "prepare-desktop.mjs"), "utf8");
  assert.match(prepare, /CAPTURE_WIDTH = 720/);
  assert.match(prepare, /CAPTURE_HEIGHT = 405/);
  assert.match(prepare, /resizePng/);
  assert.match(prepare, /DESKTOP_CATALOG\.startsWith\(DESKTOP_BUILD \+ path\.sep\)/);
  assert.match(prepare, /capture\?\.path/);
});
