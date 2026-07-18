import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { encodePng, resizePng } from "./lib/png.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const REGISTRY = path.join(ROOT, "themes", "registry.json");
const ICON = path.join(ROOT, "apps", "theme-manager", "build", "icon.png");
const DESKTOP_BUILD = path.join(ROOT, "apps", "theme-manager", "build");
const DESKTOP_CATALOG = path.join(DESKTOP_BUILD, "catalog");
const CAPTURE_WIDTH = 720;
const CAPTURE_HEIGHT = 405;

function insideRoundedRect(x, y, left, top, right, bottom, radius) {
  const closestX = Math.max(left + radius, Math.min(right - radius, x));
  const closestY = Math.max(top + radius, Math.min(bottom - radius, y));
  return Math.hypot(x - closestX, y - closestY) <= radius;
}

function insideStroke(x, y, left, top, right, bottom, width) {
  return x >= left && x <= right && y >= top && y <= bottom
    && !(x >= left + width && x <= right - width && y >= top + width && y <= bottom - width);
}

function renderIcon(size = 1024) {
  return encodePng(size, size, (x, y) => {
    const nx = x / size;
    const ny = y / size;
    const outer = insideRoundedRect(nx, ny, 0.06, 0.06, 0.94, 0.94, 0.22);
    if (!outer) return [0, 0, 0, 0];
    const glow = Math.max(0, 1 - Math.hypot(nx - 0.72, ny - 0.23) / 0.65);
    let color = [
      23 + glow * 16,
      59 + glow * 40,
      52 + glow * 30,
      255,
    ];
    const backFrame = insideStroke(nx, ny, 0.34, 0.21, 0.79, 0.66, 0.035);
    const frontFrame = insideStroke(nx, ny, 0.19, 0.34, 0.67, 0.81, 0.038);
    const themeLine = ny > 0.66 && ny < 0.70 && nx > 0.28 && nx < 0.49;
    const sparkleVertical = Math.abs(nx - 0.72) / 0.045 + Math.abs(ny - 0.72) / 0.13 <= 1;
    const sparkleHorizontal = Math.abs(nx - 0.72) / 0.13 + Math.abs(ny - 0.72) / 0.045 <= 1;
    if (backFrame) color = [205, 160, 77, 255];
    if (frontFrame) color = [235, 231, 217, 255];
    if (themeLine) color = [202, 83, 59, 255];
    if (sparkleVertical || sparkleHorizontal) color = [222, 174, 82, 255];
    return color;
  });
}

async function main() {
  const registry = JSON.parse(await readFile(REGISTRY, "utf8"));
  if (registry.standard !== "act-theme-pack-v1" || registry.themes?.length !== 53) {
    throw new Error("Generate and validate themes before preparing the desktop app");
  }
  await mkdir(path.dirname(ICON), { recursive: true });
  await writeFile(ICON, renderIcon());

  if (!DESKTOP_CATALOG.startsWith(DESKTOP_BUILD + path.sep)) {
    throw new Error("Desktop catalog output escaped the generated build directory");
  }
  await rm(DESKTOP_CATALOG, { recursive: true, force: true });
  let captures = 0;
  for (const theme of registry.themes) {
    for (const mode of ["light", "dark"]) {
      const relative = theme.previews?.[mode]?.capture?.path;
      if (typeof relative !== "string"
        || !/^screenshots\/codex-beta-[A-Za-z0-9.-]+\/[a-z0-9-]+-(?:light|dark)\.png$/.test(relative)) {
        throw new Error(theme.id + " " + mode + " has an unsafe desktop capture path");
      }
      const source = path.join(ROOT, ...relative.split("/"));
      const destination = path.join(DESKTOP_CATALOG, ...relative.split("/"));
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(
        destination,
        resizePng(await readFile(source), CAPTURE_WIDTH, CAPTURE_HEIGHT),
      );
      captures += 1;
    }
  }
  console.log(
    "Prepared desktop assets for " + registry.themes.length + " themes and "
    + captures + " verified " + CAPTURE_WIDTH + "x" + CAPTURE_HEIGHT + " capture thumbnails.",
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
