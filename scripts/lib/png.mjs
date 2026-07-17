import { deflateSync } from "node:zlib";

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const CRC_TABLE = new Uint32Array(256);

for (let index = 0; index < 256; index += 1) {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
  }
  CRC_TABLE[index] = value >>> 0;
}
export function crc32(buffer) {
  let value = 0xffffffff;
  for (const byte of buffer) {
    value = CRC_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8);
  }
  return (value ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const name = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])), 0);
  return Buffer.concat([length, name, data, checksum]);
}

function clampByte(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

export function parseHex(value) {
  return [
    Number.parseInt(value.slice(1, 3), 16),
    Number.parseInt(value.slice(3, 5), 16),
    Number.parseInt(value.slice(5, 7), 16),
  ];
}

function mix(left, right, amount) {
  const ratio = Math.max(0, Math.min(1, amount));
  return [
    left[0] + (right[0] - left[0]) * ratio,
    left[1] + (right[1] - left[1]) * ratio,
    left[2] + (right[2] - left[2]) * ratio,
  ];
}

function overlay(base, color, alpha) {
  return mix(base, color, Math.max(0, Math.min(1, alpha)));
}

function smoothstep(edge0, edge1, value) {
  const ratio = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return ratio * ratio * (3 - 2 * ratio);
}

function noise(x, y, seed) {
  let value = Math.imul(x + seed * 17, 374761393) ^ Math.imul(y + seed * 31, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function distanceToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const amount = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));
  const x = ax + amount * dx;
  const y = ay + amount * dy;
  return Math.hypot(px - x, py - y);
}

function insideEllipse(x, y, centerX, centerY, radiusX, radiusY) {
  const dx = (x - centerX) / radiusX;
  const dy = (y - centerY) / radiusY;
  return dx * dx + dy * dy <= 1;
}

function triangleContains(x, y, ax, ay, bx, by, cx, cy) {
  const denominator = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
  const left = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / denominator;
  const right = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / denominator;
  const last = 1 - left - right;
  return left >= 0 && right >= 0 && last >= 0;
}

function insideRect(x, y, left, top, right, bottom) {
  return x >= left && x <= right && y >= top && y <= bottom;
}

function drawCityscape(color, theme, nx, ny, palette) {
  if (!theme.pattern.startsWith("city-")) return color;

  const seed = theme.seed;
  const focusX = theme.art.focusX;
  const horizon = 0.69 + Math.sin(nx * 7.4 + seed * 0.019) * 0.012;
  const emphasis = smoothstep(0.31, 0.72, nx);
  const waterPattern = ["city-tide", "city-river", "city-lake", "city-vertical"].includes(theme.pattern);

  if (ny > horizon) {
    color = overlay(color, waterPattern ? palette.ridge : palette.ink, 0.5 + emphasis * 0.28);
    const reflection = Math.abs(Math.sin(nx * 92 + ny * 27 + seed * 0.03));
    if (waterPattern && reflection < 0.06 && nx > 0.34) {
      color = overlay(color, palette.glow, 0.22 * emphasis);
    }
  }

  const skylineStart = 0.35;
  const buildingIndex = Math.floor((nx - skylineStart) * 31);
  if (buildingIndex >= 0) {
    const localX = (nx - skylineStart) * 31 - buildingIndex;
    const top = horizon - 0.1 - noise(buildingIndex, 17, seed) * 0.27;
    const width = 0.53 + noise(buildingIndex, 29, seed) * 0.34;
    const building = localX < width && ny > top && ny < horizon;
    if (building) {
      const depth = noise(buildingIndex, 41, seed);
      color = overlay(color, depth > 0.54 ? palette.ink : palette.ridge, 0.48 + depth * 0.34);
      const column = Math.floor(localX * 12);
      const row = Math.floor((ny - top) * 48);
      const lit = noise(buildingIndex * 19 + column, row, seed + 73) > 0.79;
      if (lit && column % 2 === 0 && row % 2 === 0 && emphasis > 0.12) {
        color = overlay(color, palette.glow, 0.38 + emphasis * 0.24);
      }
    }
  }

  if (theme.pattern === "city-axis") {
    const axis = Math.abs(nx - focusX) < 0.012 && ny > 0.19 && ny < 0.79;
    const hall = insideRect(nx, ny, focusX - 0.105, 0.48, focusX + 0.105, 0.7);
    const roof = triangleContains(nx, ny, focusX - 0.145, 0.49, focusX + 0.145, 0.49, focusX, 0.39);
    const eave = distanceToSegment(nx, ny, focusX - 0.18, 0.505, focusX + 0.18, 0.505) < 0.006;
    if (hall || roof) color = overlay(color, palette.ink, 0.84);
    if (eave) color = palette.accentArt;
    if (axis) color = overlay(color, palette.glow, 0.24);
  }

  if (theme.pattern === "city-tide") {
    const tower = insideRect(nx, ny, focusX - 0.022, 0.24, focusX + 0.022, horizon);
    const crown = insideEllipse(nx, ny, focusX, 0.235, 0.045, 0.025);
    if (tower || crown) color = overlay(color, palette.ink, 0.88);
    const tide = Math.abs(Math.sin((ny - 0.7) * 86 + nx * 10.5));
    if (ny > 0.71 && tide < 0.055 && nx > 0.29) color = overlay(color, palette.accentArt, 0.34);
  }

  if (theme.pattern === "city-circuit") {
    const gridX = Math.abs(((nx - 0.39) * 28) % 1 - 0.5) < 0.035;
    const gridY = Math.abs(((ny - 0.23) * 22) % 1 - 0.5) < 0.035;
    if (nx > 0.39 && ny > 0.23 && ny < 0.78 && (gridX || gridY)) {
      color = overlay(color, palette.glow, 0.2 * emphasis);
    }
    const rainLane = Math.floor(nx * 68 + seed) % 7 === 0;
    const rain = Math.abs(((ny + nx * 0.18) * 37) % 1 - 0.5) < 0.08;
    if (rainLane && rain && nx > 0.28) color = overlay(color, palette.mist, 0.34);
  }

  if (theme.pattern === "city-river") {
    const canopy = insideEllipse(nx, ny, focusX + 0.07, 0.43, 0.13, 0.1)
      || insideEllipse(nx, ny, focusX - 0.02, 0.46, 0.105, 0.08);
    const trunk = insideRect(nx, ny, focusX + 0.025, 0.46, focusX + 0.047, 0.69);
    if (canopy) color = overlay(color, palette.ridge, 0.78);
    if (trunk) color = overlay(color, palette.ink, 0.82);
    const riverArc = Math.abs(Math.hypot((nx - focusX) / 0.37, (ny - 0.78) / 0.14) - 1);
    if (riverArc < 0.018 && nx > 0.34) color = overlay(color, palette.accentArt, 0.48);
  }

  if (theme.pattern === "city-bamboo") {
    const stalkIndex = Math.floor((nx - 0.54) * 24);
    if (stalkIndex >= 0) {
      const stalkX = 0.54 + stalkIndex / 24 + noise(stalkIndex, 5, seed) * 0.012;
      const stalk = Math.abs(nx - stalkX) < 0.005 && ny > 0.22 && ny < 0.79;
      const leaf = insideEllipse(nx, ny, stalkX + (stalkIndex % 2 ? 0.035 : -0.035), 0.34 + (stalkIndex % 5) * 0.07, 0.048, 0.012);
      if (stalk || leaf) color = overlay(color, palette.ink, 0.68);
    }
    const roof = triangleContains(nx, ny, 0.58, 0.62, 0.96, 0.62, 0.77, 0.5);
    if (roof) color = overlay(color, palette.ridge, 0.72);
  }

  if (theme.pattern === "city-lake") {
    const causeway = distanceToSegment(nx, ny, 0.43, 0.68, 0.96, 0.66) < 0.007;
    const bridgeOuter = Math.abs(Math.hypot((nx - 0.75) / 0.13, (ny - 0.69) / 0.075) - 1) < 0.055 && ny < 0.69;
    if (causeway || bridgeOuter) color = overlay(color, palette.ink, 0.72);
    const lotusX = Math.floor(nx * 48);
    const lotusY = Math.floor(ny * 41);
    const lotusCell = noise(lotusX, lotusY, seed);
    if (nx > 0.42 && ny > 0.72 && lotusCell > 0.965
      && insideEllipse(nx, ny, (lotusX + 0.5) / 48, (lotusY + 0.5) / 41, 0.01, 0.004)) {
      color = overlay(color, palette.glow, 0.46);
    }
  }

  if (theme.pattern === "city-vertical") {
    const slope = 0.79 - (nx - 0.39) * 0.33;
    if (nx > 0.39 && ny > slope) color = overlay(color, palette.ink, 0.58);
    const terraceY = Math.floor((ny - 0.31) * 17);
    const terrace = terraceY >= 0 && Math.abs((ny - 0.31) * 17 - terraceY) < 0.08 && nx > 0.43;
    if (terrace) color = overlay(color, palette.glow, 0.24);
    const transit = distanceToSegment(nx, ny, 0.43, 0.73, 0.94, 0.35);
    if (transit < 0.012) color = overlay(color, palette.accentArt, 0.62);
    if (transit < 0.0035) color = palette.glow;
  }

  if (theme.pattern === "city-wall") {
    if (nx > 0.43 && ny > 0.58 && ny < 0.79) {
      color = overlay(color, palette.ink, 0.68);
      const row = Math.floor((ny - 0.58) * 38);
      const mortarX = Math.abs(((nx + (row % 2) * 0.025) * 20) % 1 - 0.5) < 0.035;
      const mortarY = Math.abs((ny - 0.58) * 38 - row) < 0.055;
      if (mortarX || mortarY) color = overlay(color, palette.mist, 0.2);
    }
    const branch = Math.min(
      distanceToSegment(nx, ny, 0.61, 0.56, 0.91, 0.26),
      distanceToSegment(nx, ny, 0.72, 0.44, 0.94, 0.48),
    );
    if (branch < 0.006) color = overlay(color, palette.ink, 0.88);
    const blossomX = Math.floor(nx * 34);
    const blossomY = Math.floor(ny * 34);
    const blossom = noise(blossomX, blossomY, seed + 311) > 0.968
      && nx > 0.62 && ny > 0.22 && ny < 0.54;
    if (blossom && insideEllipse(nx, ny, (blossomX + 0.5) / 34, (blossomY + 0.5) / 34, 0.009, 0.009)) {
      color = palette.accentArt;
    }
  }

  return color;
}

function drawMascot(color, theme, nx, ny, palette) {
  if (theme.variant !== "chibi") return color;

  const centerX = theme.art.focusX;
  const centerY = theme.art.focusY;
  const face = palette.mist;
  const robe = palette.accentArt;
  const outline = palette.ink;
  const glow = palette.glow;

  if (theme.pattern === "clouds") {
    const body = insideEllipse(nx, ny, centerX, centerY + 0.015, 0.105, 0.082);
    const leftEar = insideEllipse(nx, ny, centerX - 0.07, centerY - 0.06, 0.042, 0.055);
    const rightEar = insideEllipse(nx, ny, centerX + 0.07, centerY - 0.06, 0.042, 0.055);
    const leaf = insideEllipse(nx, ny, centerX, centerY + 0.105, 0.145, 0.026);
    if (leaf) color = overlay(color, palette.ridge, 0.92);
    if (body || leftEar || rightEar) color = overlay(color, face, 0.96);
    if (insideEllipse(nx, ny, centerX - 0.035, centerY + 0.002, 0.012, 0.016)
      || insideEllipse(nx, ny, centerX + 0.035, centerY + 0.002, 0.012, 0.016)) {
      color = outline;
    }
    if (insideEllipse(nx, ny, centerX, centerY + 0.033, 0.018, 0.009)) {
      color = overlay(color, glow, 0.9);
    }
    return color;
  }

  const head = insideEllipse(nx, ny, centerX, centerY - 0.05, 0.076, 0.084);
  const body = triangleContains(
    nx,
    ny,
    centerX,
    centerY + 0.005,
    centerX - 0.09,
    centerY + 0.185,
    centerX + 0.09,
    centerY + 0.185,
  );
  const topknot = insideEllipse(nx, ny, centerX, centerY - 0.145, 0.026, 0.03);
  const belt = ny > centerY + 0.095 && ny < centerY + 0.112 && Math.abs(nx - centerX) < 0.075;
  const leftEye = insideEllipse(nx, ny, centerX - 0.027, centerY - 0.052, 0.009, 0.012);
  const rightEye = insideEllipse(nx, ny, centerX + 0.027, centerY - 0.052, 0.009, 0.012);
  const smile = Math.abs(Math.hypot((nx - centerX) / 0.027, (ny - (centerY - 0.015)) / 0.015) - 1) < 0.12
    && ny > centerY - 0.014;

  if (body) color = overlay(color, robe, 0.96);
  if (head) color = overlay(color, face, 0.97);
  if (topknot) color = outline;
  if (belt || leftEye || rightEye || smile) color = outline;

  if (theme.pattern === "sword") {
    const swordDistance = distanceToSegment(
      nx,
      ny,
      centerX + 0.06,
      centerY + 0.11,
      centerX + 0.16,
      centerY - 0.05,
    );
    if (swordDistance < 0.006) color = glow;
  }

  if (theme.pattern === "stars") {
    const cometDistance = distanceToSegment(
      nx,
      ny,
      centerX - 0.15,
      centerY + 0.1,
      centerX + 0.12,
      centerY - 0.02,
    );
    if (cometDistance < 0.01) color = glow;
  }

  return color;
}

export function renderThemePng(theme, mode, width, height) {
  const definition = theme[mode];
  const palette = {
    skyTop: parseHex(definition.skyTop),
    skyBottom: parseHex(definition.skyBottom),
    mist: parseHex(definition.mist),
    ridge: parseHex(definition.ridge),
    ink: parseHex(definition.ink),
    glow: parseHex(definition.glow),
    accentArt: parseHex(definition.accentArt),
  };
  const seed = theme.seed;
  const focusX = theme.art.focusX;
  const focusY = theme.art.focusY;

  return encodePng(width, height, (x, y) => {
    const nx = x / (width - 1);
    const ny = y / (height - 1);
    let color = mix(palette.skyTop, palette.skyBottom, ny * 0.82 + nx * 0.08);
    const rightEmphasis = smoothstep(0.24, 0.92, nx);

    const hazeCenter = 0.65 + Math.sin(nx * 7 + seed * 0.01) * 0.025;
    const haze = Math.exp(-Math.pow((ny - hazeCenter) / 0.115, 2));
    color = overlay(color, palette.mist, haze * 0.34);

    const discDistance = Math.hypot(nx - focusX, (ny - (focusY - 0.11)) * 1.08);
    color = overlay(color, palette.glow, Math.max(0, 0.22 - discDistance) * 1.7 * rightEmphasis);
    if (discDistance < 0.105) {
      color = overlay(color, palette.glow, 0.58 + (0.105 - discDistance) * 2.2);
    }

    if (theme.pattern === "mountain" || theme.pattern === "sword") {
      const farRidge = 0.61
        + Math.sin(nx * 8.3 + seed * 0.011) * 0.055
        + Math.sin(nx * 21.7 + seed * 0.023) * 0.022;
      const nearRidge = 0.74
        + Math.sin(nx * 6.2 + seed * 0.017) * 0.075
        + Math.sin(nx * 16.1 + seed * 0.031) * 0.03;
      if (ny > farRidge) color = overlay(color, palette.ridge, 0.58 + rightEmphasis * 0.13);
      if (ny > nearRidge) color = overlay(color, palette.ink, 0.82);

      const contour = Math.abs(Math.sin((ny - farRidge) * 94 + nx * 4.2));
      if (ny > farRidge - 0.08 && ny < farRidge + 0.12 && contour < 0.045) {
        color = overlay(color, palette.mist, 0.2 * rightEmphasis);
      }
    }

    if (theme.pattern === "stars") {
      const star = noise(Math.floor(nx * 1800), Math.floor(ny * 1100), seed);
      if (star > 0.9965 && nx > 0.25 && ny < 0.78) {
        color = overlay(color, palette.glow, 0.72);
      }
      const orbitX = (nx - focusX) / 1.0;
      const orbitY = (ny - focusY) / 0.64;
      const orbit = Math.abs(Math.hypot(orbitX, orbitY) - 0.29);
      if (orbit < 0.0036 && nx > 0.36) color = overlay(color, palette.glow, 0.56);
      const horizon = 0.77 + Math.sin(nx * 11 + seed) * 0.018;
      if (ny > horizon) color = overlay(color, palette.ink, 0.78);
    }

    if (theme.pattern === "sword") {
      const sword = distanceToSegment(nx, ny, 0.58, 0.81, 0.91, 0.16);
      if (sword < 0.022) color = overlay(color, palette.accentArt, (0.022 - sword) * 15);
      if (sword < 0.0045) color = palette.glow;
    }

    if (theme.pattern === "clouds") {
      for (let layer = 0; layer < 4; layer += 1) {
        const baseline = 0.58 + layer * 0.105
          + Math.sin(nx * (6 + layer) + seed * 0.013 + layer) * (0.025 + layer * 0.004);
        const cloud = Math.exp(-Math.pow((ny - baseline) / (0.06 + layer * 0.013), 2));
        color = overlay(color, layer < 2 ? palette.mist : palette.ridge, cloud * (0.28 + layer * 0.08));
      }
      const island = insideEllipse(nx, ny, focusX + 0.02, focusY + 0.16, 0.15, 0.045);
      const islandBase = triangleContains(
        nx,
        ny,
        focusX - 0.11,
        focusY + 0.16,
        focusX + 0.13,
        focusY + 0.16,
        focusX + 0.01,
        focusY + 0.33,
      );
      if (island || islandBase) color = overlay(color, palette.ink, 0.78);
    }

    color = drawCityscape(color, theme, nx, ny, palette);

    color = drawMascot(color, theme, nx, ny, palette);

    const grain = (noise(x, y, seed + 991) - 0.5) * 3.2;
    return [
      clampByte(color[0] + grain),
      clampByte(color[1] + grain),
      clampByte(color[2] + grain),
      255,
    ];
  });
}

export function encodePng(width, height, pixelAt) {
  const rowSize = width * 4 + 1;
  const raw = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * rowSize;
    raw[rowOffset] = 1;
    const previous = [0, 0, 0, 0];
    for (let x = 0; x < width; x += 1) {
      const pixel = pixelAt(x, y);
      for (let channel = 0; channel < 4; channel += 1) {
        const value = clampByte(pixel[channel] ?? 255);
        raw[rowOffset + 1 + x * 4 + channel] = (value - previous[channel] + 256) & 0xff;
        previous[channel] = value;
      }
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  return Buffer.concat([
    PNG_SIGNATURE,
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

export function readPngDimensions(buffer) {
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error("Not a PNG file");
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}
