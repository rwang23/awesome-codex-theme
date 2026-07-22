import { createHash } from "node:crypto";
import { cp, copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildWindowsInstaller } from "./build-installer.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const DEFAULT_OUTPUT = path.join(ROOT, "dist");

function assertSafeOutput(output) {
  const resolved = path.resolve(output);
  const parsed = path.parse(resolved);
  if (resolved === ROOT || resolved === parsed.root) {
    throw new Error("Refusing to build into a repository or filesystem root");
  }
  return resolved;
}
async function copyRelative(relativePath, output) {
  const source = path.join(ROOT, ...relativePath.split("/"));
  const destination = path.join(output, ...relativePath.split("/"));
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(source, destination);
}

export async function buildSite(outputPath = DEFAULT_OUTPUT) {
  const output = assertSafeOutput(outputPath);
  const registryBuffer = await readFile(path.join(ROOT, "themes", "registry.json"));
  const registry = JSON.parse(registryBuffer.toString("utf8"));
  const registrySha256 = createHash("sha256").update(registryBuffer).digest("hex");
  const tauriConfig = JSON.parse(await readFile(
    path.join(ROOT, "apps", "theme-manager", "src-tauri", "tauri.conf.json"),
    "utf8",
  ));
  const desktopVersion = tauriConfig.version;
  const installer = await buildWindowsInstaller();

  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  await cp(path.join(ROOT, "site"), output, { recursive: true });
  const indexPath = path.join(output, "index.html");
  const indexHtml = await readFile(indexPath, "utf8");
  if (!indexHtml.includes("__ACT_DESKTOP_VERSION__")) {
    throw new Error("Site index is missing the desktop version placeholder");
  }
  await writeFile(
    indexPath,
    indexHtml.replaceAll("__ACT_DESKTOP_VERSION__", desktopVersion),
    "utf8",
  );

  await Promise.all([
    copyRelative("themes/registry.json", output),
    copyRelative("themes/source-art/jobs.json", output),
    copyRelative("schemas/theme-pack.schema.json", output),
    copyRelative("schemas/registry.schema.json", output),
    copyRelative("docs/assets/theme-manager-windows.png", output),
    copyRelative("LICENSE", output),
    copyRelative("NOTICE.md", output),
  ]);
  await mkdir(path.join(output, "downloads"), { recursive: true });
  await writeFile(
    path.join(output, "downloads", "awesome-codex-theme-installer-windows.zip"),
    installer.archive,
  );
  await writeFile(
    path.join(output, "downloads", "installer.json"),
    installer.manifestBuffer,
  );
  await writeFile(
    path.join(output, "downloads", "catalog.json"),
    Buffer.from(JSON.stringify({
      schemaVersion: 1,
      standard: registry.standard,
      assetsBaseUrl: "https://rwang23.github.io/awesome-codex-theme/",
      registry: {
        url: "https://rwang23.github.io/awesome-codex-theme/themes/registry.json",
        sha256: registrySha256,
        bytes: registryBuffer.length,
        catalogRevision: registry.catalogRevision,
        themeCount: registry.themes.length,
        modeCount: registry.themes.length * 2,
      },
      desktop: {
        repository: "https://github.com/rwang23/awesome-codex-theme",
        releases: "https://github.com/rwang23/awesome-codex-theme/releases",
        currentVersion: desktopVersion,
      },
    }, null, 2) + "\n", "utf8"),
  );

  const copied = new Set();
  for (const theme of registry.themes) {
    const paths = [
      theme.package.path,
      theme.package.manifest,
      theme.provenance.record,
      theme.previews.light.preview,
      theme.previews.dark.preview,
      theme.previews.light.fullSkin?.asset,
      theme.previews.dark.fullSkin?.asset,
      theme.previews.light.nativeTheme.path,
      theme.previews.dark.nativeTheme.path,
      theme.previews.light.capture?.path,
      theme.previews.dark.capture?.path,
    ].filter(Boolean);
    for (const relativePath of paths) {
      if (copied.has(relativePath)) continue;
      await copyRelative(relativePath, output);
      copied.add(relativePath);
    }
  }

  await writeFile(path.join(output, ".nojekyll"), "", "utf8");
  return {
    output,
    themes: registry.themes.length,
    copiedArtifacts: copied.size,
    installer: installer.manifest,
  };
}

async function main() {
  const result = await buildSite();
  console.log(
    "Built GitHub Pages artifact at " + result.output + " with "
    + result.themes + " themes and " + result.copiedArtifacts + " downloadable artifacts.",
  );
}

if (path.resolve(process.argv[1] || "") === fileURLToPath(import.meta.url)) {
  try {
    await main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
