import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createZip } from "./lib/zip.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const INSTALLER_ROOT = path.join(ROOT, "installer", "windows");

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

export async function buildWindowsInstaller() {
  const packageMetadata = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
  const version = packageMetadata.version;
  const outputDirectory = path.join(ROOT, "packages", "installer");
  const archiveName = "awesome-codex-theme-installer-windows-" + version + ".zip";
  const archivePath = path.join(outputDirectory, archiveName);

  const entries = await Promise.all([
    ["ACT-Installer.ps1", path.join(INSTALLER_ROOT, "ACT-Installer.ps1")],
    ["Launch ACT Installer.cmd", path.join(INSTALLER_ROOT, "Launch ACT Installer.cmd")],
    ["README.txt", path.join(INSTALLER_ROOT, "README.txt")],
    ["copy.json", path.join(INSTALLER_ROOT, "copy.json")],
    ["registry.json", path.join(ROOT, "themes", "registry.json")],
    ["LICENSE.txt", path.join(ROOT, "LICENSE")],
  ].map(async function ([name, source]) {
    return { name, data: await readFile(source) };
  }));

  const archive = createZip(entries);
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(archivePath, archive);

  const manifest = {
    schemaVersion: 1,
    id: "awesome-codex-theme-installer-windows",
    version,
    platform: "windows",
    format: "zip",
    archive: "downloads/awesome-codex-theme-installer-windows.zip",
    sourceArchive: "packages/installer/" + archiveName,
    sha256: sha256(archive),
    bytes: archive.length,
    runtime: "Windows PowerShell 5.1+",
    requiresAdmin: false,
    installBoundary: "validates and copies codex-theme-v1; final import remains inside ChatGPT",
  };
  const manifestBuffer = Buffer.from(JSON.stringify(manifest, null, 2) + "\n", "utf8");
  await writeFile(path.join(outputDirectory, "manifest.json"), manifestBuffer);

  return {
    archive,
    archiveName,
    archivePath,
    manifest,
    manifestBuffer,
  };
}

async function main() {
  const result = await buildWindowsInstaller();
  console.log(
    "Built Windows installer " + result.archiveName + " ("
    + result.manifest.bytes + " bytes, sha256 " + result.manifest.sha256 + ").",
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
