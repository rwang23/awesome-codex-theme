import { cp, copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
  const registry = JSON.parse(await readFile(path.join(ROOT, "themes", "registry.json"), "utf8"));

  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  await cp(path.join(ROOT, "site"), output, { recursive: true });

  await Promise.all([
    copyRelative("themes/registry.json", output),
    copyRelative("schemas/theme-pack.schema.json", output),
    copyRelative("schemas/registry.schema.json", output),
    copyRelative("scripts/install-theme.ps1", output),
    copyRelative("scripts/install-theme.sh", output),
    copyRelative("LICENSE", output),
    copyRelative("NOTICE.md", output),
  ]);

  const copied = new Set();
  for (const theme of registry.themes) {
    const paths = [
      theme.package.path,
      theme.package.manifest,
      theme.previews.light.preview,
      theme.previews.dark.preview,
      theme.previews.light.adapterBundle.path,
      theme.previews.dark.adapterBundle.path,
    ];
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
