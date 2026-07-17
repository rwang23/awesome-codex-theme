import { crc32 } from "./png.mjs";

const UTF8_FLAG = 0x0800;
const STORE_METHOD = 0;

function localHeader(nameBytes, data, checksum) {
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(UTF8_FLAG, 6);
  header.writeUInt16LE(STORE_METHOD, 8);
  header.writeUInt16LE(0, 10);
  header.writeUInt16LE(0, 12);
  header.writeUInt32LE(checksum, 14);
  header.writeUInt32LE(data.length, 18);
  header.writeUInt32LE(data.length, 22);
  header.writeUInt16LE(nameBytes.length, 26);
  header.writeUInt16LE(0, 28);
  return header;
}
function centralHeader(nameBytes, data, checksum, offset) {
  const header = Buffer.alloc(46);
  header.writeUInt32LE(0x02014b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(20, 6);
  header.writeUInt16LE(UTF8_FLAG, 8);
  header.writeUInt16LE(STORE_METHOD, 10);
  header.writeUInt16LE(0, 12);
  header.writeUInt16LE(0, 14);
  header.writeUInt32LE(checksum, 16);
  header.writeUInt32LE(data.length, 20);
  header.writeUInt32LE(data.length, 24);
  header.writeUInt16LE(nameBytes.length, 28);
  header.writeUInt16LE(0, 30);
  header.writeUInt16LE(0, 32);
  header.writeUInt16LE(0, 34);
  header.writeUInt16LE(0, 36);
  header.writeUInt32LE(0, 38);
  header.writeUInt32LE(offset, 42);
  return header;
}

export function createZip(entries) {
  const sorted = [...entries]
    .map((entry) => ({ name: entry.name.replaceAll("\\", "/"), data: Buffer.from(entry.data) }))
    .sort((left, right) => left.name.localeCompare(right.name));
  const locals = [];
  const centrals = [];
  let offset = 0;

  for (const entry of sorted) {
    if (!entry.name || entry.name.startsWith("/") || entry.name.split("/").includes("..")) {
      throw new Error("Unsafe ZIP entry: " + entry.name);
    }
    const nameBytes = Buffer.from(entry.name, "utf8");
    const checksum = crc32(entry.data);
    const local = localHeader(nameBytes, entry.data, checksum);
    locals.push(local, nameBytes, entry.data);
    centrals.push(centralHeader(nameBytes, entry.data, checksum, offset), nameBytes);
    offset += local.length + nameBytes.length + entry.data.length;
  }

  const central = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(sorted.length, 8);
  end.writeUInt16LE(sorted.length, 10);
  end.writeUInt32LE(central.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...locals, central, end]);
}

export function listZipEntries(buffer) {
  let endOffset = -1;
  for (let index = buffer.length - 22; index >= Math.max(0, buffer.length - 65557); index -= 1) {
    if (buffer.readUInt32LE(index) === 0x06054b50) {
      endOffset = index;
      break;
    }
  }
  if (endOffset < 0) throw new Error("ZIP end record not found");

  const count = buffer.readUInt16LE(endOffset + 10);
  let offset = buffer.readUInt32LE(endOffset + 16);
  const entries = [];

  for (let index = 0; index < count; index += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error("Invalid ZIP central directory");
    }
    const method = buffer.readUInt16LE(offset + 10);
    const checksum = buffer.readUInt32LE(offset + 16);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const size = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.subarray(offset + 46, offset + 46 + nameLength).toString("utf8");
    entries.push({ name, method, checksum, compressedSize, size, localOffset });
    offset += 46 + nameLength + extraLength + commentLength;
  }

  return entries;
}

export function extractStoredEntry(buffer, entry) {
  if (entry.method !== STORE_METHOD) throw new Error("Only stored ZIP entries are supported");
  const offset = entry.localOffset;
  if (buffer.readUInt32LE(offset) !== 0x04034b50) throw new Error("Invalid ZIP local header");
  const nameLength = buffer.readUInt16LE(offset + 26);
  const extraLength = buffer.readUInt16LE(offset + 28);
  const start = offset + 30 + nameLength + extraLength;
  const data = buffer.subarray(start, start + entry.size);
  if (crc32(data) !== entry.checksum) throw new Error("ZIP entry checksum mismatch: " + entry.name);
  return data;
}
