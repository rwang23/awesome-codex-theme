import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REQUIRED_ARTIFACTS = ["themes/registry.json"];

export async function assertGeneratedArtifacts(root = ROOT) {
  const missing = [];

  for (const relativePath of REQUIRED_ARTIFACTS) {
    try {
      await access(path.join(root, ...relativePath.split("/")));
    } catch {
      missing.push(relativePath);
    }
  }

  if (missing.length) {
    throw new Error(
      "Generated theme artifacts are unavailable: " + missing.join(", ")
      + ". Run `npm run generate` before running generated-artifact validation, tests, or builds.",
    );
  }
}

async function main() {
  await assertGeneratedArtifacts();
}

if (path.resolve(process.argv[1] || "") === fileURLToPath(import.meta.url)) {
  try {
    await main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
