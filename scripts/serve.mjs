import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const SITE_ROOT = path.join(ROOT, "dist");
const portIndex = process.argv.indexOf("--port");
const PORT = Number(portIndex >= 0 ? process.argv[portIndex + 1] : process.env.PORT || 4173);
const MIME = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".ps1": "text/plain; charset=utf-8",
  ".sh": "text/plain; charset=utf-8",
  ".toml": "text/plain; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".zip": "application/zip",
  ".act-theme": "application/zip",
};

if (!Number.isInteger(PORT) || PORT < 1024 || PORT > 65535) {
  throw new Error("Port must be an integer from 1024 to 65535");
}

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    const decoded = decodeURIComponent(requestUrl.pathname);
    const relative = decoded === "/" ? "index.html" : decoded.replace(/^\/+/, "");
    const candidate = path.resolve(SITE_ROOT, relative);
    const boundary = SITE_ROOT.endsWith(path.sep) ? SITE_ROOT : SITE_ROOT + path.sep;
    if (candidate !== SITE_ROOT && !candidate.startsWith(boundary)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }
    let file = candidate;
    const info = await stat(file);
    if (info.isDirectory()) file = path.join(file, "index.html");
    const extension = path.extname(file).toLowerCase();
    response.writeHead(200, {
      "Content-Type": MIME[extension] || "application/octet-stream",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});
server.listen(PORT, "127.0.0.1", () => {
  console.log("Awesome Codex Theme: http://127.0.0.1:" + PORT);
});
