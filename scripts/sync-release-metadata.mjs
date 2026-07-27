import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readReleaseMetadata } from "./lib/release-metadata.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

function usage() {
  return "Usage: node scripts/sync-release-metadata.mjs --check|--apply";
}

function parseOptions(argv) {
  if (argv.length !== 1 || !["--check", "--apply"].includes(argv[0])) {
    throw new Error(usage());
  }
  return { check: argv[0] === "--check" };
}

function jsonText(value) {
  return JSON.stringify(value, null, 2) + "\n";
}

function replaceRequired(value, pattern, replacement, label) {
  if (!pattern.test(value)) throw new Error("Release metadata sync could not locate " + label);
  return value.replace(pattern, replacement);
}

function releaseChannelLabel(channel) {
  return channel.slice(0, 1).toUpperCase() + channel.slice(1);
}

function catalogSummary(catalog) {
  if (!Array.isArray(catalog.themes) || catalog.themes.length === 0) {
    throw new Error("Release metadata sync requires a non-empty themes/catalog.json");
  }
  if (!Number.isInteger(catalog.catalogRevision) || catalog.catalogRevision < 1) {
    throw new Error("Release metadata sync requires a positive catalog revision");
  }
  const modeCount = catalog.themes.reduce((count, theme) => (
    count + ["light", "dark"].filter((mode) => theme && typeof theme[mode] === "object").length
  ), 0);
  if (modeCount === 0) throw new Error("Release metadata sync could not derive catalog modes");
  return { themeCount: catalog.themes.length, modeCount, catalogRevision: catalog.catalogRevision };
}

function statusLabel(status, language) {
  const labels = language === "zh-CN"
    ? { verified: "已验证", "build-only": "仅构建", unverified: "未验证" }
    : { verified: "Verified", "build-only": "Build-only", unverified: "Unverified" };
  return labels[status];
}

function featureStatus(feature, language) {
  const status = statusLabel(feature.status, language);
  return feature.testedVersion ? status + " (`" + feature.testedVersion + "`)" : status;
}

function capabilityMatrix(metadata, summary, language) {
  const chinese = language === "zh-CN";
  const rows = metadata.capabilities.map((capability) => (
    "| " + capability.title[language] + " | "
      + featureStatus(capability.fullSkin, language) + " | "
      + featureStatus(capability.native, language) + " | "
      + featureStatus(capability.persistence, language) + " |"
  ));
  return [
    chinese ? "## 当前平台能力矩阵" : "## Current platform capability matrix",
    "",
    chinese
      ? "此表由 [`metadata/release.json`](metadata/release.json) 生成，并由 `npm run metadata:check` 校验。"
      : "This table is generated from [`metadata/release.json`](metadata/release.json) and checked by `npm run metadata:check`.",
    "",
    chinese
      ? "| 目标 | Full Skin | Native 回退 | 常驻 |"
      : "| Target | Full Skin | Native fallback | Persistence |",
    "| --- | --- | --- | --- |",
    ...rows,
    "",
    chinese
      ? "当前 Catalog 有 **" + summary.themeCount + " 套主题**、**" + summary.modeCount + " 个模式**（修订 `" + summary.catalogRevision + "`）。"
      : "The current catalog has **" + summary.themeCount + " themes** and **" + summary.modeCount + " modes** (revision `" + summary.catalogRevision + "`).",
    chinese
      ? "当前 `" + metadata.desktop.channel + "` 通道更新源状态为 `" + metadata.desktop.updater.status + "`；在签名静态清单覆盖全部平台前，不宣称应用内更新可用。"
      : "The current `" + metadata.desktop.channel + "` update-feed status is `" + metadata.desktop.updater.status + "`; in-app updates are not claimed until a signed static feed covers every platform.",
  ].join("\n");
}

function replaceMarkerBlock(value, content, label) {
  const start = "<!-- ACT:CAPABILITY-MATRIX:START -->";
  const end = "<!-- ACT:CAPABILITY-MATRIX:END -->";
  const startIndex = value.indexOf(start);
  const endIndex = value.indexOf(end);
  if (startIndex < 0 || endIndex < 0 || endIndex < startIndex) {
    throw new Error("Release metadata sync could not locate " + label + " markers");
  }
  return value.slice(0, startIndex) + start + "\n" + content + "\n" + end + value.slice(endIndex + end.length);
}

function readmeWithMetadata(value, metadata, summary, language) {
  const badge = language === "zh-CN"
    ? "<img alt=\"" + summary.themeCount + " 套主题\" src=\"https://img.shields.io/badge/themes-" + summary.themeCount + "-7c3aed\">"
    : "<img alt=\"" + summary.themeCount + " themes\" src=\"https://img.shields.io/badge/themes-" + summary.themeCount + "-7c3aed\">";
  const badgePattern = language === "zh-CN"
    ? /<img alt="\d+ 套主题" src="https:\/\/img\.shields\.io\/badge\/themes-\d+-7c3aed">/
    : /<img alt="\d+ themes" src="https:\/\/img\.shields\.io\/badge\/themes-\d+-7c3aed">/;
  if (!badgePattern.test(value)) throw new Error("Release metadata sync could not locate " + language + " theme-count badge");
  return replaceMarkerBlock(value.replace(badgePattern, badge), capabilityMatrix(metadata, summary, language), language + " README capability matrix");
}

function releaseMetadataDocument(metadata, summary) {
  const rows = metadata.capabilities.map((capability) => (
    "| " + capability.title.en + " | "
      + capability.fullSkin.status + " | "
      + capability.native.status + " | "
      + capability.persistence.status + " |"
  )).join("\n");
  return [
    "# Release metadata",
    "",
    "This file is generated from [`metadata/release.json`](../metadata/release.json). Do not edit it by hand.",
    "",
    "- Desktop version: `" + metadata.desktop.version + "`",
    "- Channel: `" + metadata.desktop.channel + "`",
    "- GitHub prerelease: `" + metadata.desktop.githubPrerelease + "`",
    "- Update-feed state: `" + metadata.desktop.updater.status + "`",
    "- Update endpoint: `" + metadata.desktop.updater.endpoint + "`",
    "- Full Skin format: `" + metadata.runtime.fullSkinFormat + "`",
    "- Full Skin capture: ChatGPT Beta `" + metadata.capture.appVersion + "` / `" + metadata.capture.packageFullName + "`",
    "- Catalog: `" + summary.themeCount + "` themes / `" + summary.modeCount + "` modes / revision `" + summary.catalogRevision + "`",
    "",
    "## Capability disclosure",
    "",
    "| Target | Full Skin | Native fallback | Persistence |",
    "| --- | --- | --- | --- |",
    rows,
    "",
    "## Ownership and drift guard",
    "",
    "`metadata/release.json` is authoritative for the desktop version, release channel, updater endpoint, runtime/capture identities, and platform capability claims. `themes/catalog.json` is authoritative for the catalog revision and source-derived theme/mode counts. `npm run metadata:check` fails if synchronized package, Tauri, Cargo, workflow, README, or this document data drift.",
    "",
    "The update endpoint is a stable-feed location. The current Beta status is intentionally `unreleased`; no updater availability claim is made until a signed static feed contains all platform records.",
    "",
  ].join("\n");
}

async function expectedOutputs(metadata) {
  const rootPackagePath = path.join(ROOT, "package.json");
  const managerPackagePath = path.join(ROOT, "apps", "theme-manager", "package.json");
  const tauriConfigPath = path.join(ROOT, "apps", "theme-manager", "src-tauri", "tauri.conf.json");
  const cargoTomlPath = path.join(ROOT, "apps", "theme-manager", "src-tauri", "Cargo.toml");
  const cargoLockPath = path.join(ROOT, "apps", "theme-manager", "src-tauri", "Cargo.lock");
  const workflowPath = path.join(ROOT, ".github", "workflows", "desktop.yml");
  const catalogPath = path.join(ROOT, "themes", "catalog.json");
  const readmePath = path.join(ROOT, "README.md");
  const chineseReadmePath = path.join(ROOT, "README.zh-CN.md");
  const current = await Promise.all([
    readFile(rootPackagePath, "utf8"),
    readFile(managerPackagePath, "utf8"),
    readFile(tauriConfigPath, "utf8"),
    readFile(cargoTomlPath, "utf8"),
    readFile(cargoLockPath, "utf8"),
    readFile(workflowPath, "utf8"),
    readFile(catalogPath, "utf8"),
    readFile(readmePath, "utf8"),
    readFile(chineseReadmePath, "utf8"),
  ]);
  const rootPackage = JSON.parse(current[0]);
  const managerPackage = JSON.parse(current[1]);
  const tauriConfig = JSON.parse(current[2]);
  const summary = catalogSummary(JSON.parse(current[6]));
  rootPackage.version = metadata.desktop.version;
  managerPackage.version = metadata.desktop.version;
  tauriConfig.version = metadata.desktop.version;
  tauriConfig.plugins ??= {};
  tauriConfig.plugins.updater ??= {};
  tauriConfig.plugins.updater.endpoints = [metadata.desktop.updater.endpoint];
  return [
    { path: rootPackagePath, relative: "package.json", data: jsonText(rootPackage) },
    { path: managerPackagePath, relative: "apps/theme-manager/package.json", data: jsonText(managerPackage) },
    { path: tauriConfigPath, relative: "apps/theme-manager/src-tauri/tauri.conf.json", data: jsonText(tauriConfig) },
    {
      path: cargoTomlPath,
      relative: "apps/theme-manager/src-tauri/Cargo.toml",
      data: replaceRequired(
        current[3],
        /(^\[package\]\r?\nname = "awesome-codex-theme"\r?\nversion = ")[^"]+("$)/m,
        "$1" + metadata.desktop.version + "$2",
        "Cargo package version",
      ),
    },
    {
      path: cargoLockPath,
      relative: "apps/theme-manager/src-tauri/Cargo.lock",
      data: replaceRequired(
        current[4],
        /(^\[\[package\]\]\r?\nname = "awesome-codex-theme"\r?\nversion = ")[^"]+("$)/m,
        "$1" + metadata.desktop.version + "$2",
        "Cargo lock package version",
      ),
    },
    {
      path: workflowPath,
      relative: ".github/workflows/desktop.yml",
      data: replaceRequired(
        replaceRequired(
          replaceRequired(
            current[5],
            /(^\s*prerelease:\s*)(?:true|false)(\s*$)/m,
            "$1" + String(metadata.desktop.githubPrerelease) + "$2",
            "desktop release prerelease flag",
          ),
          /(^\s*releaseName:\s*)"[^"]+"(\s*$)/m,
          "$1\"Awesome Codex Theme v" + metadata.desktop.version + " " + releaseChannelLabel(metadata.desktop.channel) + "\"$2",
          "desktop release name",
        ),
        /(run: test "\$RELEASE_TAG" = "v)\d+\.\d+\.\d+(")/,
        "$1" + metadata.desktop.version + "$2",
        "desktop release tag check",
      ),
    },
    {
      path: path.join(ROOT, "docs", "release-metadata.md"),
      relative: "docs/release-metadata.md",
      data: releaseMetadataDocument(metadata, summary),
    },
    {
      path: readmePath,
      relative: "README.md",
      data: readmeWithMetadata(current[7], metadata, summary, "en"),
    },
    {
      path: chineseReadmePath,
      relative: "README.zh-CN.md",
      data: readmeWithMetadata(current[8], metadata, summary, "zh-CN"),
    },
  ];
}

export async function syncReleaseMetadata(argv = process.argv.slice(2)) {
  const options = parseOptions(argv);
  const metadata = readReleaseMetadata(ROOT);
  const outputs = await expectedOutputs(metadata);
  const drift = [];
  for (const output of outputs) {
    let actual = null;
    try {
      actual = await readFile(output.path, "utf8");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    if (actual === output.data) continue;
    drift.push(output.relative);
    if (!options.check) await writeFile(output.path, output.data, "utf8");
  }
  if (options.check && drift.length) {
    throw new Error("Release metadata drift:\n- " + drift.join("\n- ") + "\nRun `npm run metadata:sync`.");
  }
  return { drift, version: metadata.desktop.version };
}

if (path.resolve(process.argv[1] || "") === fileURLToPath(import.meta.url)) {
  try {
    const result = await syncReleaseMetadata();
    console.log(
      result.drift.length
        ? "Synchronized release metadata for " + result.version + ": " + result.drift.join(", ")
        : "Release metadata is synchronized for " + result.version + ".",
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
