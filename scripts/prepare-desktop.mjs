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

function distanceToSegment(x, y, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;
  const projection = lengthSquared === 0
    ? 0
    : Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lengthSquared));
  return Math.hypot(x - (x1 + projection * dx), y - (y1 + projection * dy));
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
    const windowOuter = insideRoundedRect(nx, ny, 0.16, 0.27, 0.78, 0.75, 0.09);
    const windowInner = insideRoundedRect(nx, ny, 0.205, 0.315, 0.735, 0.705, 0.055);
    const windowFrame = windowOuter && !windowInner;
    const cursor = distanceToSegment(nx, ny, 0.30, 0.39, 0.43, 0.51) < 0.025
      || distanceToSegment(nx, ny, 0.43, 0.51, 0.30, 0.63) < 0.025;
    const promptLine = distanceToSegment(nx, ny, 0.50, 0.64, 0.67, 0.64) < 0.024;
    const orbitDistance = Math.hypot(nx - 0.75, ny - 0.25);
    const orbit = orbitDistance > 0.07 && orbitDistance < 0.108;
    const orbitCore = orbitDistance < 0.022;
    if (windowFrame) color = [235, 231, 217, 255];
    if (cursor || promptLine) color = [241, 209, 138, 255];
    if (orbit) color = [222, 174, 82, 255];
    if (orbitCore) color = [222, 174, 82, 255];
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
