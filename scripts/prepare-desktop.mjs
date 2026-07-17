import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { encodePng } from "./lib/png.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const REGISTRY = path.join(ROOT, "themes", "registry.json");
const ICON = path.join(ROOT, "apps", "theme-manager", "build", "icon.png");

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
    const frame = insideStroke(nx, ny, 0.19, 0.19, 0.81, 0.81, 0.035);
    const horizon = ny > 0.61 && ny < 0.66 && nx > 0.24 && nx < 0.76;
    const mountainLeft = ny > (0.71 - Math.abs(nx - 0.37) * 0.78) && nx > 0.21 && nx < 0.55 && ny < 0.73;
    const mountainRight = ny > (0.69 - Math.abs(nx - 0.62) * 0.62) && nx > 0.43 && nx < 0.81 && ny < 0.73;
    const sun = Math.hypot(nx - 0.65, ny - 0.36) < 0.085;
    if (frame) color = [230, 224, 207, 255];
    if (sun) color = [205, 160, 77, 255];
    if (mountainLeft || mountainRight) color = [235, 231, 217, 255];
    if (horizon) color = [202, 83, 59, 255];
    return color;
  });
}

async function main() {
  const registry = JSON.parse(await readFile(REGISTRY, "utf8"));
  if (registry.standard !== "act-theme-pack-v1" || registry.themes?.length !== 28) {
    throw new Error("Generate and validate themes before preparing the desktop app");
  }
  await mkdir(path.dirname(ICON), { recursive: true });
  await writeFile(ICON, renderIcon());
  console.log("Prepared desktop assets for " + registry.themes.length + " themes.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
