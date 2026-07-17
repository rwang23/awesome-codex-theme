import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..", "..", "..", "..");
const CATALOG_PATH = path.join(ROOT, "themes", "catalog.json");
const JOBS_PATH = path.join(ROOT, "themes", "source-art", "jobs.json");
const THEME_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEX = /^#[0-9A-Fa-f]{6}$/;

function option(name) {
  const index = process.argv.indexOf("--" + name);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}

function validateTokens(mode, tokens) {
  const keys = [
    "background",
    "surface",
    "surfaceAlt",
    "text",
    "muted",
    "accent",
    "accentContrast",
    "border",
  ];
  for (const key of keys) {
    requireValue(HEX.test(tokens?.[key] || ""), mode + ".tokens." + key + " must be #RRGGBB");
  }
}

function validateBrief(brief, catalog) {
  requireValue(THEME_ID.test(brief.id || ""), "id must use kebab-case");
  requireValue(!catalog.themes.some((theme) => theme.id === brief.id), "theme id already exists: " + brief.id);
  requireValue(catalog.collections.some((collection) => collection.id === brief.collection), "unknown collection: " + brief.collection);
  requireValue(["cinematic", "chibi", "cityscape"].includes(brief.variant), "unsupported variant");
  requireValue(typeof brief.name?.["zh-CN"] === "string" && brief.name["zh-CN"].trim(), "Chinese name is required");
  requireValue(typeof brief.name?.en === "string" && brief.name.en.trim(), "English name is required");
  requireValue(typeof brief.description?.["zh-CN"] === "string" && brief.description["zh-CN"].trim(), "Chinese description is required");
  requireValue(typeof brief.description?.en === "string" && brief.description.en.trim(), "English description is required");
  requireValue(Array.isArray(brief.tags) && brief.tags.length >= 2, "at least two tags are required");
  requireValue(typeof brief.imagePrompt === "string" && brief.imagePrompt.length >= 40, "imagePrompt is too short");
  requireValue(typeof brief.rightsStatement === "string" && brief.rightsStatement.length >= 30, "rightsStatement is too short");
  requireValue(brief.art?.safeArea === "left", "v1 Gallery themes must use a left safe area");
  validateTokens("light", brief.light?.tokens);
  validateTokens("dark", brief.dark?.tokens);
}

function themeFromBrief(brief) {
  return {
    id: brief.id,
    version: brief.version || "1.0.0",
    collection: brief.collection,
    pair: brief.pair || brief.id,
    variant: brief.variant,
    name: brief.name,
    description: brief.description,
    tags: brief.tags,
    art: brief.art,
    light: { tokens: brief.light.tokens },
    dark: { tokens: brief.dark.tokens },
  };
}

async function main() {
  const briefPath = option("brief");
  requireValue(briefPath, "Usage: scaffold-theme.mjs --brief <file> [--apply]");
  const [brief, catalog, jobs] = await Promise.all([
    readFile(path.resolve(briefPath), "utf8").then(JSON.parse),
    readFile(CATALOG_PATH, "utf8").then(JSON.parse),
    readFile(JOBS_PATH, "utf8").then(JSON.parse),
  ]);
  validateBrief(brief, catalog);
  requireValue(!jobs.jobs.some((job) => job.id === brief.id), "image job already exists: " + brief.id);

  const theme = themeFromBrief(brief);
  const imageJob = { id: brief.id, prompt: brief.imagePrompt };
  console.log(JSON.stringify({ theme, imageJob }, null, 2));
  if (!process.argv.includes("--apply")) {
    console.log("\nDry run only. Add --apply to update catalog and image jobs.");
    return;
  }

  catalog.themes.push(theme);
  jobs.jobs.push(imageJob);
  await Promise.all([
    writeFile(CATALOG_PATH, JSON.stringify(catalog, null, 2) + "\n", "utf8"),
    writeFile(JOBS_PATH, JSON.stringify(jobs, null, 2) + "\n", "utf8"),
  ]);
  console.log("\nAdded " + brief.id + ". Generate source art before running npm run check.");
}

try {
  await main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
