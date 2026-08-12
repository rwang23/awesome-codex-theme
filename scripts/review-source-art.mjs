import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  decodePng,
  encodePng,
  renderLegacySourceArtImage,
  renderSourceArtImage,
} from "./lib/png.mjs";
import { computeCoverCrop, SOURCE_ART_RENDERER_ID } from "./lib/source-art-contract.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const CATALOG_PATH = path.join(ROOT, "themes", "catalog.json");
const OUTPUT_DIRECTORY = path.join(ROOT, "docs", "assets", "source-art-review");
const APPROVAL_PATH = path.join(ROOT, "themes", "source-art", "reviews", "focal-aware-v3.json");
const REVIEWED_AT = "2026-07-26";
const TILE_WIDTH = 144;
const TILE_HEIGHT = 81;
const BLOCK_GAP = 12;
const BLOCK_WIDTH = TILE_WIDTH * 2 + BLOCK_GAP * 3;
const BLOCK_HEIGHT = TILE_HEIGHT * 2 + BLOCK_GAP * 3;
const SHEET_COLUMNS = 3;
const THEMES_PER_SHEET = 18;

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function imagePath(relativePath) {
  return path.join(ROOT, ...relativePath.split("/"));
}

function encodedImageFromPixels(width, height, pixels) {
  return encodePng(width, height, (x, y) => {
    const offset = (y * width + x) * 4;
    return pixels.subarray(offset, offset + 4);
  });
}

function createCanvas(width, height, color = [20, 26, 27, 255]) {
  const pixels = Buffer.alloc(width * height * 4);
  for (let offset = 0; offset < pixels.length; offset += 4) {
    pixels[offset] = color[0];
    pixels[offset + 1] = color[1];
    pixels[offset + 2] = color[2];
    pixels[offset + 3] = color[3];
  }
  return { width, height, pixels };
}

function fillRect(canvas, left, top, width, height, color, alpha = 1) {
  const startX = Math.max(0, Math.floor(left));
  const startY = Math.max(0, Math.floor(top));
  const endX = Math.min(canvas.width, Math.ceil(left + width));
  const endY = Math.min(canvas.height, Math.ceil(top + height));
  for (let y = startY; y < endY; y += 1) {
    for (let x = startX; x < endX; x += 1) {
      const offset = (y * canvas.width + x) * 4;
      for (let channel = 0; channel < 3; channel += 1) {
        canvas.pixels[offset + channel] = Math.round(
          canvas.pixels[offset + channel] * (1 - alpha) + color[channel] * alpha,
        );
      }
      canvas.pixels[offset + 3] = 255;
    }
  }
}

function drawImage(canvas, image, left, top) {
  for (let y = 0; y < image.height; y += 1) {
    const targetY = top + y;
    if (targetY < 0 || targetY >= canvas.height) continue;
    for (let x = 0; x < image.width; x += 1) {
      const targetX = left + x;
      if (targetX < 0 || targetX >= canvas.width) continue;
      const sourceOffset = (y * image.width + x) * 4;
      const targetOffset = (targetY * canvas.width + targetX) * 4;
      image.pixels.copy(canvas.pixels, targetOffset, sourceOffset, sourceOffset + 4);
    }
  }
}

function drawFrame(canvas, left, top, width, height, color) {
  fillRect(canvas, left - 2, top - 2, width + 4, 2, color);
  fillRect(canvas, left - 2, top + height, width + 4, 2, color);
  fillRect(canvas, left - 2, top - 2, 2, height + 4, color);
  fillRect(canvas, left + width, top - 2, 2, height + 4, color);
}

function themeBlockPosition(index) {
  const column = index % SHEET_COLUMNS;
  const row = Math.floor(index / SHEET_COLUMNS);
  return {
    left: BLOCK_GAP + column * (BLOCK_WIDTH + BLOCK_GAP),
    top: BLOCK_GAP + row * (BLOCK_HEIGHT + BLOCK_GAP),
  };
}

function createContactSheet(entries) {
  const rows = Math.ceil(entries.length / SHEET_COLUMNS);
  const canvas = createCanvas(
    SHEET_COLUMNS * (BLOCK_WIDTH + BLOCK_GAP) + BLOCK_GAP,
    rows * (BLOCK_HEIGHT + BLOCK_GAP) + BLOCK_GAP,
  );
  for (const [index, entry] of entries.entries()) {
    const position = themeBlockPosition(index);
    const placements = [
      { image: entry.legacyLight, left: position.left, top: position.top, frame: [112, 124, 126, 255] },
      { image: entry.focalLight, left: position.left + TILE_WIDTH + BLOCK_GAP, top: position.top, frame: [60, 179, 155, 255] },
      { image: entry.legacyDark, left: position.left, top: position.top + TILE_HEIGHT + BLOCK_GAP, frame: [112, 124, 126, 255] },
      { image: entry.focalDark, left: position.left + TILE_WIDTH + BLOCK_GAP, top: position.top + TILE_HEIGHT + BLOCK_GAP, frame: [60, 179, 155, 255] },
    ];
    for (const placement of placements) {
      drawImage(canvas, placement.image, placement.left, placement.top);
      drawFrame(canvas, placement.left, placement.top, TILE_WIDTH, TILE_HEIGHT, placement.frame);
    }
  }
  return encodedImageFromPixels(canvas.width, canvas.height, canvas.pixels);
}

const FIXTURE_LAYOUTS = Object.freeze({
  home: [
    [0.03, 0.08, 0.22, 0.84], [0.3, 0.22, 0.26, 0.18], [0.59, 0.22, 0.26, 0.18], [0.3, 0.45, 0.55, 0.2], [0.3, 0.76, 0.55, 0.1],
  ],
  task: [
    [0.03, 0.08, 0.2, 0.84], [0.27, 0.12, 0.64, 0.58], [0.27, 0.75, 0.64, 0.14],
  ],
  diff: [
    [0.03, 0.08, 0.18, 0.84], [0.25, 0.12, 0.31, 0.72], [0.59, 0.12, 0.31, 0.72],
  ],
  settings: [
    [0.03, 0.08, 0.24, 0.84], [0.31, 0.12, 0.58, 0.18], [0.31, 0.35, 0.58, 0.12], [0.31, 0.52, 0.58, 0.12], [0.31, 0.69, 0.58, 0.12],
  ],
  dialog: [
    [0.03, 0.08, 0.19, 0.84], [0.28, 0.2, 0.47, 0.58],
  ],
  composer: [
    [0.03, 0.08, 0.2, 0.84], [0.28, 0.14, 0.62, 0.5], [0.28, 0.72, 0.62, 0.15],
  ],
});

function createFixtureTile(image, theme, layout) {
  const canvas = createCanvas(TILE_WIDTH, TILE_HEIGHT);
  drawImage(canvas, decodePng(image), 0, 0);
  const surface = theme.light.tokens.surface;
  const red = Number.parseInt(surface.slice(1, 3), 16);
  const green = Number.parseInt(surface.slice(3, 5), 16);
  const blue = Number.parseInt(surface.slice(5, 7), 16);
  for (const [left, top, width, height] of FIXTURE_LAYOUTS[layout]) {
    fillRect(canvas, left * TILE_WIDTH, top * TILE_HEIGHT, width * TILE_WIDTH, height * TILE_HEIGHT, [red, green, blue, 255], 0.72);
  }
  return canvas;
}

function createFixtureSheet(theme, entry) {
  const safeAreas = ["left", "right", "center", "none"];
  const layouts = Object.keys(FIXTURE_LAYOUTS);
  const columns = layouts.length;
  const rows = safeAreas.length;
  const canvas = createCanvas(
    columns * (TILE_WIDTH + BLOCK_GAP) + BLOCK_GAP,
    rows * (TILE_HEIGHT + BLOCK_GAP) + BLOCK_GAP,
  );
  for (const [row, safeArea] of safeAreas.entries()) {
    const fixtureTheme = structuredClone(theme);
    fixtureTheme.art.safeArea = safeArea;
    const rendered = renderSourceArtImage(entry.source, fixtureTheme, "light", TILE_WIDTH, TILE_HEIGHT);
    for (const [column, layout] of layouts.entries()) {
      const tile = createFixtureTile(rendered, theme, layout);
      const left = BLOCK_GAP + column * (TILE_WIDTH + BLOCK_GAP);
      const top = BLOCK_GAP + row * (TILE_HEIGHT + BLOCK_GAP);
      drawImage(canvas, tile, left, top);
      drawFrame(canvas, left, top, TILE_WIDTH, TILE_HEIGHT, safeArea === "none" ? [112, 124, 126, 255] : [60, 179, 155, 255]);
    }
  }
  return encodedImageFromPixels(canvas.width, canvas.height, canvas.pixels);
}

async function readThemeEntry(theme) {
  const source = decodePng(await readFile(imagePath("themes/source-art/" + theme.id + ".png")));
  const legacyLight = decodePng(renderLegacySourceArtImage(source, theme, "light", TILE_WIDTH, TILE_HEIGHT));
  const focalLight = decodePng(renderSourceArtImage(source, theme, "light", TILE_WIDTH, TILE_HEIGHT));
  const legacyDark = decodePng(renderLegacySourceArtImage(source, theme, "dark", TILE_WIDTH, TILE_HEIGHT));
  const focalDark = decodePng(renderSourceArtImage(source, theme, "dark", TILE_WIDTH, TILE_HEIGHT));
  const crop = computeCoverCrop({
    sourceWidth: source.width,
    sourceHeight: source.height,
    targetWidth: 2560,
    targetHeight: 1440,
    focusX: theme.art.focusX,
    focusY: theme.art.focusY,
  });
  return { theme, source, legacyLight, focalLight, legacyDark, focalDark, crop };
}

async function reconcile(relativePath, data, write) {
  const absolutePath = imagePath(relativePath);
  let existing = null;
  try {
    existing = await readFile(absolutePath);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (existing?.equals(data)) return;
  if (!write) throw new Error(relativePath + " is stale; run `npm run art:review:write`.");
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, data);
}

export async function renderSourceArtReview({ root = ROOT, write = false } = {}) {
  if (root !== ROOT) throw new Error("Source-art review only supports the repository root.");
  const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8"));
  const entries = [];
  for (const theme of catalog.themes) entries.push(await readThemeEntry(theme));

  const sheets = [];
  for (let index = 0; index < entries.length; index += THEMES_PER_SHEET) {
    const group = entries.slice(index, index + THEMES_PER_SHEET);
    const relativePath = "docs/30-design/assets/source-art-review/focal-aware-v3-"
      + String(sheets.length + 1).padStart(2, "0") + ".png";
    const data = createContactSheet(group);
    await reconcile(relativePath, data, write);
    sheets.push({
      path: relativePath,
      sha256: sha256(data),
      bytes: data.length,
      themeIds: group.map((entry) => entry.theme.id),
    });
  }

  const fixtureTheme = entries.find((entry) => entry.theme.id === "qinglan-odyssey") || entries[0];
  const fixtureData = createFixtureSheet(fixtureTheme.theme, fixtureTheme);
  const fixturePath = "docs/30-design/assets/source-art-review/focal-aware-v3-fixtures.png";
  await reconcile(fixturePath, fixtureData, write);

  const approval = {
    schemaVersion: 1,
    reviewId: "act-focal-aware-v3-2026-07-26",
    reviewedAt: REVIEWED_AT,
    renderer: {
      before: "act-source-art-renderer-v2",
      after: SOURCE_ART_RENDERER_ID,
    },
    tileLayout: {
      columns: SHEET_COLUMNS,
      tileSize: { width: TILE_WIDTH, height: TILE_HEIGHT },
      order: ["legacy-light", "focal-light", "legacy-dark", "focal-dark"],
      focalFrame: "green",
      legacyFrame: "gray",
    },
    contactSheets: sheets,
    fixtureSheet: {
      path: fixturePath,
      sha256: sha256(fixtureData),
      bytes: fixtureData.length,
      themeId: fixtureTheme.theme.id,
      order: {
        rows: ["left", "right", "center", "none"],
        columns: Object.keys(FIXTURE_LAYOUTS),
      },
    },
    decisions: entries.map((entry) => ({
      themeId: entry.theme.id,
      decision: "approved",
      focus: { x: entry.theme.art.focusX, y: entry.theme.art.focusY },
      safeArea: entry.theme.art.safeArea,
      crop: entry.crop,
    })),
  };
  await reconcile(
    "themes/source-art/reviews/focal-aware-v3.json",
    Buffer.from(JSON.stringify(approval, null, 2) + "\n", "utf8"),
    write,
  );
  return approval;
}

async function main() {
  const argumentsSet = new Set(process.argv.slice(2));
  if ([...argumentsSet].some((argument) => !["--write", "--check"].includes(argument))) {
    throw new Error("Usage: node scripts/review-source-art.mjs [--write|--check]");
  }
  if (argumentsSet.has("--write") && argumentsSet.has("--check")) {
    throw new Error("Choose either --write or --check.");
  }
  const approval = await renderSourceArtReview({ write: argumentsSet.has("--write") });
  console.log("Reviewed " + approval.decisions.length + " focal crops across "
    + approval.contactSheets.length + " contact sheets and one safe-area fixture sheet.");
}

if (path.resolve(process.argv[1] || "") === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
