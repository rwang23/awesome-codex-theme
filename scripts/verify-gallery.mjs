import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const DIST = path.join(ROOT, "dist");
const DEFAULT_TIMEOUT_MS = 30_000;

function usage() {
  return "Usage: node scripts/verify-gallery.mjs [--screenshot=gallery-home.png]";
}

export function parseOptions(argv = process.argv.slice(2)) {
  const options = { screenshot: null };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else if (argument === "--screenshot") {
      const value = argv[index + 1]?.trim();
      if (!value || value.startsWith("--")) {
        throw new Error("--screenshot requires a relative output path");
      }
      options.screenshot = value;
      index += 1;
    } else if (argument.startsWith("--screenshot=")) {
      const value = argument.slice("--screenshot=".length).trim();
      if (!value) throw new Error("--screenshot requires a relative output path");
      options.screenshot = value;
    } else {
      throw new Error("Unknown gallery-check option: " + argument);
    }
  }
  return options;
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function reserveLoopbackPort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  if (!address || typeof address === "string") throw new Error("Could not reserve a loopback port");
  return address.port;
}

async function waitFor(description, probe, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const value = await probe();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await sleep(100);
  }
  const detail = lastError ? ": " + lastError.message : "";
  throw new Error("Timed out waiting for " + description + detail);
}

function startProcess(command, argumentsList, label) {
  const child = spawn(command, argumentsList, {
    cwd: ROOT,
    stdio: ["ignore", "ignore", "pipe"],
    windowsHide: true,
  });
  let startupError = null;
  let stderr = "";
  child.once("error", (error) => {
    startupError = error;
  });
  child.stderr.on("data", (chunk) => {
    stderr = (stderr + chunk).slice(-4_000);
  });
  return {
    child,
    assertRunning() {
      if (startupError) throw new Error(label + " could not start: " + startupError.message);
      if (child.exitCode !== null) throw new Error(label + " exited early" + (stderr ? ": " + stderr.trim() : ""));
    },
  };
}

async function stopProcess(processRecord) {
  if (!processRecord?.child || processRecord.child.exitCode !== null) return;
  processRecord.child.kill();
  await Promise.race([
    new Promise((resolve) => processRecord.child.once("exit", resolve)),
    sleep(2_000),
  ]);
  if (processRecord.child.exitCode === null) processRecord.child.kill("SIGKILL");
}

class DevToolsSession {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.events = [];
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result || {});
      } else if (message.method) {
        this.events.push(message);
      }
    });
    socket.addEventListener("close", () => {
      for (const pending of this.pending.values()) pending.reject(new Error("DevTools connection closed"));
      this.pending.clear();
    });
  }

  send(method, params = {}) {
    const id = this.nextId;
    this.nextId += 1;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.socket.close();
  }
}

async function connectDevTools(webSocketDebuggerUrl) {
  const socket = new WebSocket(webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", () => reject(new Error("Could not connect to Chromium DevTools")), { once: true });
  });
  return new DevToolsSession(socket);
}

async function evaluate(session, expression) {
  const result = await session.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || "Runtime evaluation failed");
  }
  return result.result?.value;
}

function safeOutputPath(relativePath) {
  const output = path.resolve(ROOT, relativePath);
  const boundary = ROOT.endsWith(path.sep) ? ROOT : ROOT + path.sep;
  if (!output.startsWith(boundary)) throw new Error("Screenshot output must remain inside the repository");
  return output;
}

async function main(options) {
  if (options.help) {
    console.log(usage());
    return;
  }

  const registry = JSON.parse(await readFile(path.join(DIST, "themes", "registry.json"), "utf8"));
  if (!Array.isArray(registry.themes) || !registry.themes.length) {
    throw new Error("Built gallery Registry does not contain themes");
  }

  const sitePort = await reserveLoopbackPort();
  const profile = await mkdtemp(path.join(os.tmpdir(), "act-gallery-check-"));
  const server = startProcess(process.execPath, [path.join(SCRIPT_DIR, "serve.mjs"), "--port", String(sitePort)], "Gallery server");
  const browserCommand = process.env.ACT_CHROME_BIN || "google-chrome";
  const browser = startProcess(browserCommand, [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--remote-allow-origins=*",
    "--remote-debugging-port=0",
    "--user-data-dir=" + profile,
    "about:blank",
  ], "Chromium");
  let session = null;

  try {
    const siteUrl = "http://127.0.0.1:" + sitePort + "/";
    await waitFor("the gallery server", async () => {
      server.assertRunning();
      const response = await fetch(siteUrl);
      return response.ok;
    });

    const debugPort = await waitFor("Chromium DevTools", async () => {
      browser.assertRunning();
      const activePort = await readFile(path.join(profile, "DevToolsActivePort"), "utf8").catch(() => null);
      const port = Number(activePort?.split(/\r?\n/, 1)[0]);
      return Number.isInteger(port) && port > 0 ? port : null;
    });
    const targetResponse = await fetch(
      "http://127.0.0.1:" + debugPort + "/json/new?" + encodeURIComponent("about:blank"),
      { method: "PUT" },
    );
    if (!targetResponse.ok) throw new Error("Chromium could not create a gallery target");
    const target = await targetResponse.json();
    if (!target.webSocketDebuggerUrl) throw new Error("Chromium target did not provide a DevTools endpoint");

    session = await connectDevTools(target.webSocketDebuggerUrl);
    await Promise.all([
      session.send("Network.enable"),
      session.send("Page.enable"),
      session.send("Runtime.enable"),
    ]);
    await session.send("Page.navigate", { url: siteUrl });

    const galleryState = await waitFor("the Registry-backed gallery", async () => {
      const state = await evaluate(session, `(() => {
        const gallery = document.querySelector("#gallery");
        const cards = [...document.querySelectorAll(".theme-card")];
        return {
          busy: gallery?.getAttribute("aria-busy"),
          cardCount: cards.length,
          installButtonCount: document.querySelectorAll(".theme-card .card-install").length,
          modeButtonCount: document.querySelectorAll(".theme-card .card-mode-toggle button").length,
          title: document.title,
        };
      })()`);
      return state?.busy === "false" && state.cardCount === registry.themes.length ? state : null;
    });
    if (galleryState.installButtonCount !== registry.themes.length
      || galleryState.modeButtonCount !== registry.themes.length * 2
      || !galleryState.title) {
      throw new Error("Gallery controls do not match the Registry-backed card set");
    }

    const focused = await evaluate(session, `(() => {
      const button = document.querySelector(".theme-card .card-install");
      button?.focus();
      return document.activeElement === button;
    })()`);
    if (!focused) throw new Error("The first gallery install action is not keyboard focusable");
    await session.send("Input.dispatchKeyEvent", {
      type: "keyDown",
      key: "Enter",
      code: "Enter",
      windowsVirtualKeyCode: 13,
      nativeVirtualKeyCode: 13,
    });
    await session.send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: "Enter",
      code: "Enter",
      windowsVirtualKeyCode: 13,
      nativeVirtualKeyCode: 13,
    });
    const dialogOpened = await waitFor("keyboard activation of the install dialog", async () => evaluate(
      session,
      `(() => document.querySelector("#installDialog")?.open === true && Boolean(document.querySelector("#dialogTitle")?.textContent?.trim()))()`,
    ), 5_000);
    if (!dialogOpened) throw new Error("Keyboard activation did not open a populated install dialog");

    const requestFailures = session.events.filter((event) => (event.method === "Network.responseReceived"
      && event.params.response.status >= 400
      && event.params.response.url.startsWith(siteUrl))
      || (event.method === "Network.loadingFailed" && !event.params.canceled));
    const runtimeFailures = session.events.filter((event) => event.method === "Runtime.exceptionThrown"
      || (event.method === "Runtime.consoleAPICalled" && event.params.type === "error"));
    if (requestFailures.length || runtimeFailures.length) {
      throw new Error(
        "Gallery browser check observed " + requestFailures.length + " HTTP failure(s) and "
        + runtimeFailures.length + " runtime error(s)",
      );
    }

    if (options.screenshot) {
      const screenshot = await session.send("Page.captureScreenshot", { format: "png", fromSurface: true });
      await writeFile(safeOutputPath(options.screenshot), Buffer.from(screenshot.data, "base64"));
    }
    console.log(
      "Gallery browser check passed: " + galleryState.cardCount + " cards, "
      + galleryState.modeButtonCount + " mode controls, and keyboard dialog activation.",
    );
  } finally {
    session?.close();
    await Promise.all([stopProcess(browser), stopProcess(server)]);
    await rm(profile, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await main(parseOptions());
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
