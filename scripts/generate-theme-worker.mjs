import { readFile } from "node:fs/promises";
import { parentPort } from "node:worker_threads";

import { decodePng, renderSourceArtImage } from "./lib/png.mjs";

function transferableBuffer(data) {
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
}

parentPort.on("message", async function ({ id, sourcePath, theme, outputs }) {
  try {
    const source = await readFile(sourcePath);
    const decoded = decodePng(source);
    const rendered = outputs.map(function (output) {
      const data = renderSourceArtImage(decoded, theme, output.mode, output.width, output.height);
      return {
        key: output.key,
        data: transferableBuffer(data),
      };
    });
    parentPort.postMessage({ id, rendered }, rendered.map((output) => output.data));
  } catch (error) {
    parentPort.postMessage({
      id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});
