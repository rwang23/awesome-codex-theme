import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import { buildSite } from "../scripts/build.mjs";
import { listZipEntries } from "../scripts/lib/zip.mjs";
import {
  contrastRatio,
  isSafeRelativePath,
  validateRepository
} from "../scripts/validate.mjs";

const execFileAsync = promisify(execFile);
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
    adapterBundles: 56
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

test("canonical archives contain only the manifest and two declared assets", async function () {
  const registry = JSON.parse(await readFile(path.join(ROOT, "themes", "registry.json"), "utf8"));
  for (const theme of registry.themes) {
    const archive = await readFile(path.join(ROOT, ...theme.package.path.split("/")));
    const entries = listZipEntries(archive).map(function (entry) { return entry.name; }).sort();
    assert.deepEqual(entries, [
      "assets/background-dark.png",
      "assets/background-light.png",
      "manifest.json"
    ]);
  }
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
      "scripts/install-theme.ps1",
      "scripts/install-theme.sh",
      ".nojekyll"
    ];
    for (const relative of required) {
      assert.equal(await exists(path.join(output, ...relative.split("/"))), true, relative);
    }
    const html = await readFile(path.join(output, "index.html"), "utf8");
    const app = await readFile(path.join(output, "assets", "app.js"), "utf8");
    assert.match(html, /Awesome Codex Theme/);
    assert.match(html, /id="trustNote"/);
    assert.match(html, /id="dialogRights"/);
    assert.match(html, /docs\/fan-art-policy\.md/);
    assert.match(html, /data-filter="scene"/);
    assert.match(app, /elements\.trustNote\.textContent = t\(trustNoteKeys\[state\.engine\]\)/);
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

test("installer sources avoid dynamic evaluation and expose dry-run mode", async function () {
  const files = await Promise.all([
    readFile(path.join(ROOT, "scripts", "install-theme.ps1"), "utf8"),
    readFile(path.join(ROOT, "scripts", "install-theme.sh"), "utf8")
  ]);
  const powershell = files[0];
  const shell = files[1];
  assert.doesNotMatch(powershell, /Invoke-Expression|\biex\b/i);
  assert.doesNotMatch(shell, /\beval\b/i);
  assert.equal(shell.includes("| sh"), false);
  assert.equal(shell.includes("| bash"), false);
  assert.match(powershell, /\[switch\]\$DryRun/);
  assert.match(shell, /--dry-run/);
});

test("PowerShell installer verifies a local package without writing user state", {
  skip: process.platform !== "win32",
  timeout: 30000
}, async function () {
  const result = await execFileAsync("powershell.exe", [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    path.join(ROOT, "scripts", "install-theme.ps1"),
    "-Theme",
    "qinglan-odyssey",
    "-Mode",
    "dark",
    "-SourceRoot",
    ROOT,
    "-DryRun"
  ], { cwd: ROOT });
  assert.match(result.stdout, /Verified qinglan-odyssey \(dark\)/);
});
