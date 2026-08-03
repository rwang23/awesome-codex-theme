import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(SCRIPT_DIR, "..");
const RENDERER_ROOT = path.join(APP_ROOT, "src", "renderer");
const AXE_SOURCE_PATH = path.join(APP_ROOT, "node_modules", "axe-core", "axe.min.js");
const DEFAULT_TIMEOUT_MS = 30_000;
const PROCESS_STOP_TIMEOUT_MS = 2_000;

const dataImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1600' height='900'%3E%3Crect width='100%25' height='100%25' fill='%23246A4B'/%3E%3C/svg%3E";
const fixtureTheme = {
  id: "a11y-fixture",
  collection: "fixture",
  rightsProfile: "original",
  variant: "cinematic",
  name: { en: "Accessibility Fixture", "zh-CN": "无障碍测试主题" },
  tagline: { en: "Keyboard and dialog fixture", "zh-CN": "键盘与对话框测试" },
  description: { en: "A local renderer fixture for accessibility checks.", "zh-CN": "用于无障碍检查的本地渲染器测试主题。" },
  tags: ["fixture"],
  previews: {
    light: {
      imageUrl: dataImage,
      capture: { appVersion: "fixture", sha256: "a".repeat(64) },
      fullSkin: { testedVersion: "fixture" },
    },
    dark: {
      imageUrl: dataImage,
      capture: { appVersion: "fixture", sha256: "b".repeat(64) },
      fullSkin: { testedVersion: "fixture" },
    },
  },
};
const fixtureThemeTwo = {
  ...fixtureTheme,
  id: "a11y-fixture-second",
  name: { en: "Second Accessibility Fixture", "zh-CN": "第二个无障碍测试主题" },
  tagline: { en: "Keyboard selection fixture", "zh-CN": "键盘选择测试" },
};
const fixtureCatalog = {
  catalogRevision: 1,
  registrySha256: "c".repeat(64),
  source: "bundled",
  collections: [{ id: "fixture", name: { en: "Fixture", "zh-CN": "测试" } }],
  themes: [fixtureTheme, fixtureThemeTwo],
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function testBridgeSource() {
  const bootstrap = {
    appVersion: "0.0.0-a11y",
    platform: "win32",
    targets: [{ channel: "beta", label: "ChatGPT Beta", version: "fixture" }],
    skinState: { active: true, themeId: fixtureTheme.id, mode: "light", channel: "beta" },
    persistenceState: { enabled: false, phase: "disabled" },
    updateState: { status: "development" },
    catalogState: { status: "bundled" },
    catalog: fixtureCatalog,
  };
  return `
const fixtureCatalog = ${JSON.stringify(fixtureCatalog)};
const fixtureBootstrap = ${JSON.stringify(bootstrap)};
const clone = (value) => JSON.parse(JSON.stringify(value));
window.__ACT_A11Y__ = { calls: [] };
const disabledPersistence = () => ({ enabled: false, phase: "disabled" });
let persistence = disabledPersistence();
async function invoke(command, args) {
  window.__ACT_A11Y__.calls.push({ command, args });
  switch (command) {
    case "bootstrap": return clone(fixtureBootstrap);
    case "refresh_catalog": return { status: "current", catalog: clone(fixtureCatalog) };
    case "get_skin_state":
    case "restore_full_skin": return { active: false };
    case "get_persistence_state": return clone(persistence);
    case "enable_persistent_theme":
      persistence = {
        enabled: true,
        phase: "active",
        themeId: args.themeId,
        mode: args.mode,
        channel: args.channel,
        autostartEnabled: true,
      };
      return clone(persistence);
    case "disable_persistent_theme":
      persistence = disabledPersistence();
      return clone(persistence);
    case "check_for_app_update": return { status: "development" };
    case "copy_theme":
    case "open_external":
    case "install_app_update": return null;
    default: throw new Error("Unexpected accessibility fixture command: " + command);
  }
}
window.__TAURI__ = {
  core: { convertFileSrc: (value) => value, invoke },
  event: { listen: async () => () => {} },
  window: {
    getCurrentWindow: () => ({
      close: async () => {},
      minimize: async () => {},
      startDragging: async () => {},
      toggleMaximize: async () => {},
    }),
  },
};
if (new URL(window.location.href).searchParams.has("fallback")) {
  Object.defineProperty(window.HTMLDialogElement.prototype, "showModal", { configurable: true, value: undefined });
  Object.defineProperty(window.HTMLDialogElement.prototype, "close", { configurable: true, value: undefined });
}
`;
}

function contentType(file) {
  const types = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
  };
  return types[path.extname(file).toLowerCase()] || "application/octet-stream";
}

async function startFixtureServer() {
  const axeSource = await readFile(AXE_SOURCE_PATH, "utf8").catch(() => {
    throw new Error("axe-core is unavailable. Run npm ci --prefix apps/theme-manager first.");
  });
  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
      if (requestUrl.pathname === "/test-bridge.js") {
        response.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8" });
        response.end(testBridgeSource());
        return;
      }
      if (requestUrl.pathname === "/axe.min.js") {
        response.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8" });
        response.end(axeSource);
        return;
      }
      const relative = requestUrl.pathname === "/" ? "index.html" : requestUrl.pathname.replace(/^\/+/, "");
      const candidate = path.resolve(RENDERER_ROOT, decodeURIComponent(relative));
      const boundary = RENDERER_ROOT.endsWith(path.sep) ? RENDERER_ROOT : RENDERER_ROOT + path.sep;
      if (!candidate.startsWith(boundary)) {
        response.writeHead(403);
        response.end("Forbidden");
        return;
      }
      const info = await stat(candidate);
      if (!info.isFile()) throw new Error("Fixture path is not a file");
      let body = await readFile(candidate);
      if (path.basename(candidate) === "index.html") {
        const marker = '<script type="module" src="./app.js"></script>';
        const html = body.toString("utf8");
        if (!html.includes(marker)) throw new Error("Renderer entrypoint marker is missing");
        body = Buffer.from(html.replace(marker, '<script src="/test-bridge.js"></script>\n    ' + marker));
      }
      response.writeHead(200, { "Content-Type": contentType(candidate), "Cache-Control": "no-store" });
      response.end(body);
    } catch {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Could not start the accessibility fixture server");
  return { server, url: "http://127.0.0.1:" + address.port + "/" };
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
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

function defaultBrowserCommand() {
  if (process.env.ACT_CHROME_BIN) return process.env.ACT_CHROME_BIN;
  return process.platform === "win32"
    ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    : "google-chrome";
}

function startBrowser(profile) {
  const child = spawn(defaultBrowserCommand(), [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--remote-allow-origins=*",
    "--remote-debugging-port=0",
    "--user-data-dir=" + profile,
    "about:blank",
  ], { stdio: ["ignore", "ignore", "pipe"], windowsHide: true });
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
      if (startupError) throw new Error("Chromium could not start: " + startupError.message);
      if (child.exitCode !== null) throw new Error("Chromium exited early" + (stderr ? ": " + stderr.trim() : ""));
    },
  };
}

async function stopBrowser(browser) {
  if (!browser?.child) return;
  const { child } = browser;
  const exited = () => child.exitCode !== null || child.signalCode !== null;
  const waitForExit = async () => {
    if (exited()) return;
    await Promise.race([
      new Promise((resolve) => child.once("exit", resolve)),
      sleep(PROCESS_STOP_TIMEOUT_MS),
    ]);
  };
  if (!exited()) {
    child.kill();
    await waitForExit();
  }
  if (!exited()) {
    child.kill("SIGKILL");
    await waitForExit();
  }
}

class DevToolsSession {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result || {});
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
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Runtime evaluation failed");
  return result.result?.value;
}

async function pressKey(session, key, code, windowsVirtualKeyCode, modifiers = 0, text = "") {
  await session.send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key,
    code,
    text,
    unmodifiedText: text,
    modifiers,
    windowsVirtualKeyCode,
    nativeVirtualKeyCode: windowsVirtualKeyCode,
  });
  await session.send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key,
    code,
    modifiers,
    windowsVirtualKeyCode,
    nativeVirtualKeyCode: windowsVirtualKeyCode,
  });
}

async function pressTab(session) {
  await session.send("Input.dispatchKeyEvent", {
    type: "rawKeyDown",
    key: "Tab",
    code: "Tab",
    windowsVirtualKeyCode: 9,
    nativeVirtualKeyCode: 9,
  });
  await session.send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Tab",
    code: "Tab",
    windowsVirtualKeyCode: 9,
    nativeVirtualKeyCode: 9,
  });
}

async function pressCopyShortcut(session) {
  await session.send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Control",
    code: "ControlLeft",
    windowsVirtualKeyCode: 17,
    nativeVirtualKeyCode: 17,
  });
  await pressKey(session, "c", "KeyC", 67, 2, "c");
  await session.send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Control",
    code: "ControlLeft",
    windowsVirtualKeyCode: 17,
    nativeVirtualKeyCode: 17,
  });
}

async function pressCommandEnter(session) {
  await session.send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Control",
    code: "ControlLeft",
    windowsVirtualKeyCode: 17,
    nativeVirtualKeyCode: 17,
  });
  await pressKey(session, "Enter", "Enter", 13, 2, "\r");
  await session.send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Control",
    code: "ControlLeft",
    windowsVirtualKeyCode: 17,
    nativeVirtualKeyCode: 17,
  });
}

async function loadAxe(session, siteUrl) {
  await evaluate(session, `new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = ${JSON.stringify(siteUrl + "axe.min.js")};
    script.addEventListener("load", () => resolve(true), { once: true });
    script.addEventListener("error", () => reject(new Error("Could not load axe-core")), { once: true });
    document.head.append(script);
  })`);
}

async function assertNoSeriousAxeViolations(session) {
  const violations = await evaluate(session, `window.axe.run(document, { resultTypes: ["violations"] })
    .then(({ violations }) => violations
      .filter(({ impact }) => impact === "serious" || impact === "critical")
      .map(({ id, impact, nodes }) => ({ id, impact, targets: nodes.map(({ target }) => target.join(" ")).slice(0, 3) })))`);
  if (violations?.length) {
    throw new Error("axe found serious or critical violations: " + JSON.stringify(violations));
  }
}

async function main() {
  const { server, url } = await startFixtureServer();
  const profile = await mkdtemp(path.join(os.tmpdir(), "act-theme-manager-a11y-"));
  const browser = startBrowser(profile);
  let session = null;

  try {
    await waitFor("Chromium DevTools", async () => {
      browser.assertRunning();
      const activePort = await readFile(path.join(profile, "DevToolsActivePort"), "utf8").catch(() => null);
      const port = Number(activePort?.split(/\r?\n/, 1)[0]);
      return Number.isInteger(port) && port > 0 ? port : null;
    });
    const debugPort = Number((await readFile(path.join(profile, "DevToolsActivePort"), "utf8")).split(/\r?\n/, 1)[0]);
    const targetResponse = await fetch(
      "http://127.0.0.1:" + debugPort + "/json/new?" + encodeURIComponent("about:blank"),
      { method: "PUT" },
    );
    if (!targetResponse.ok) throw new Error("Chromium could not create an accessibility target");
    const target = await targetResponse.json();
    if (!target.webSocketDebuggerUrl) throw new Error("Chromium target did not provide a DevTools endpoint");

    session = await connectDevTools(target.webSocketDebuggerUrl);
    await Promise.all([
      session.send("Page.enable"),
      session.send("Runtime.enable"),
    ]);
    await session.send("Page.navigate", { url });
    await waitFor("the Theme Manager accessibility fixture", async () => evaluate(session, `(() => {
      const theme = document.querySelector("[data-theme-id]");
      return Boolean(theme && document.querySelector("#applySkin") && window.__ACT_A11Y__);
    })()`));

    const semantics = await evaluate(session, `(() => ({
      dialog: document.querySelector("#persistenceConsentDialog")?.tagName,
      compositeRoles: document.querySelectorAll("[role='tablist'], [role='listbox']").length,
      firstTheme: document.querySelector("[data-theme-id]")?.tagName,
      firstThemePressed: document.querySelector("[data-theme-id]")?.getAttribute("aria-pressed"),
    }))()`);
    if (semantics?.dialog !== "DIALOG" || semantics.compositeRoles !== 0
      || semantics.firstTheme !== "BUTTON" || semantics.firstThemePressed !== "true") {
      throw new Error("Theme Manager selector semantics are not accessible: " + JSON.stringify(semantics));
    }

    await loadAxe(session, url);
    await assertNoSeriousAxeViolations(session);

    const selectedSecondTheme = await evaluate(session, `(() => {
      const theme = document.querySelector("[data-theme-id='a11y-fixture-second']");
      theme?.focus();
      return document.activeElement === theme;
    })()`);
    if (!selectedSecondTheme) throw new Error("A theme selector is not keyboard focusable");
    await pressKey(session, "Enter", "Enter", 13, 0, "\r");
    await waitFor("keyboard theme selection", async () => evaluate(
      session,
      `document.querySelector("[data-theme-id='a11y-fixture-second']")?.getAttribute("aria-pressed") === "true"`,
    ));

    await evaluate(session, `document.querySelector("#search")?.focus()`);
    await pressCommandEnter(session);
    const inputShortcutOpenedDialog = await evaluate(session, `document.querySelector("#persistenceConsentDialog")?.open === true`);
    if (inputShortcutOpenedDialog) throw new Error("Ctrl/Cmd+Enter applied a theme while an editable control was focused");

    const focusedApply = await evaluate(session, `(() => {
      const apply = document.querySelector("#applySkin");
      apply?.focus();
      return document.activeElement === apply;
    })()`);
    if (!focusedApply) throw new Error("The primary apply action is not keyboard focusable");
    await pressKey(session, "Enter", "Enter", 13, 0, "\r");
    await waitFor("the native persistence dialog", async () => evaluate(
      session,
      `document.querySelector("#persistenceConsentDialog")?.open === true`,
    ));
    await assertNoSeriousAxeViolations(session);
    await pressKey(session, "Escape", "Escape", 27);
    await waitFor("Escape to close and restore dialog focus", async () => evaluate(
      session,
      `(() => !document.querySelector("#persistenceConsentDialog")?.open && document.activeElement?.id === "applySkin")()`,
    ));

    await session.send("Page.navigate", { url: url + "?confirm=1" });
    await waitFor("the native confirmation fixture", async () => evaluate(session, `(() => {
      const apply = document.querySelector("#applySkin");
      return Boolean(
        new URL(window.location.href).searchParams.has("confirm")
          && apply
          && window.__ACT_A11Y__
          && !document.querySelector("#persistenceConsentDialog")?.open,
      );
    })()`));
    await evaluate(session, `document.querySelector("#applySkin")?.focus()`);
    await pressKey(session, "Enter", "Enter", 13, 0, "\r");
    await waitFor("the native confirmation dialog", async () => evaluate(
      session,
      `document.querySelector("#persistenceConsentDialog")?.open === true`,
    ));
    await evaluate(session, `document.querySelector("#persistenceConsentConfirm")?.focus()`);
    await pressKey(session, "Enter", "Enter", 13, 0, "\r");
    let confirmationState = null;
    try {
      await waitFor("keyboard application confirmation", async () => {
        confirmationState = await evaluate(session, `(() => {
        const applied = window.__ACT_A11Y__.calls.some(({ command }) => command === "enable_persistent_theme");
        return applied
          && !document.querySelector("#persistenceConsentDialog")?.open
          && document.querySelector("#persistenceStatus")?.textContent?.trim().length > 0;
        })()`);
        return confirmationState;
      });
    } catch (error) {
      throw new Error(error.message + ": " + JSON.stringify(confirmationState));
    }

    const copyBefore = await evaluate(session, `(() => {
      const status = document.querySelector("#skinStatus");
      const range = document.createRange();
      range.selectNodeContents(status);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      return window.__ACT_A11Y__.calls.filter(({ command }) => command === "copy_theme").length;
    })()`);
    await pressCopyShortcut(session);
    const copyAfter = await evaluate(session, `(() => window.__ACT_A11Y__.calls
      .filter(({ command }) => command === "copy_theme").length)()`);
    if (copyAfter !== copyBefore) {
      throw new Error("Ctrl/Cmd+C intercepted selected diagnostic text instead of preserving native copy");
    }

    const restoreBefore = await evaluate(session, `(() => {
      const restore = document.querySelector("#restoreSkin");
      restore?.focus();
      return {
        focused: document.activeElement === restore,
        calls: window.__ACT_A11Y__.calls.filter(({ command }) => command === "restore_full_skin").length,
      };
    })()`);
    if (!restoreBefore?.focused) throw new Error("The Restore action is not keyboard focusable");
    await pressKey(session, "Enter", "Enter", 13, 0, "\r");
    await waitFor("keyboard restore activation", async () => evaluate(
      session,
      `window.__ACT_A11Y__.calls.filter(({ command }) => command === "restore_full_skin").length === ${restoreBefore.calls + 1}`,
    ));

    await session.send("Emulation.setEmulatedMedia", {
      features: [
        { name: "forced-colors", value: "active" },
        { name: "prefers-reduced-motion", value: "reduce" },
      ],
    });
    await session.send("Page.navigate", { url: url + "?fallback=1" });
    await waitFor("the fallback consent fixture", async () => evaluate(session, `(() => {
      const apply = document.querySelector("#applySkin");
      return Boolean(
        new URL(window.location.href).searchParams.has("fallback")
          && apply
          && window.__ACT_A11Y__
          && !document.querySelector("#persistenceConsentDialog")?.open
          && matchMedia("(forced-colors: active)").matches
          && matchMedia("(prefers-reduced-motion: reduce)").matches,
      );
    })()`));
    await loadAxe(session, url);
    await assertNoSeriousAxeViolations(session);
    await evaluate(session, `document.querySelector("#applySkin")?.focus()`);
    await pressKey(session, "Enter", "Enter", 13, 0, "\r");
    await waitFor("the fallback consent dialog", async () => evaluate(
      session,
      `(() => {
        const dialog = document.querySelector("#persistenceConsentDialog");
        return dialog?.dataset.fallback === "true"
          && dialog.open === true
          && document.querySelector(".app-shell")?.getAttribute("aria-hidden") === "true";
      })()`,
    ));
    await assertNoSeriousAxeViolations(session);
    await pressTab(session);
    await pressTab(session);
    const fallbackFocusLooped = await evaluate(session, `document.activeElement?.id === "persistenceConsentCancel"`);
    if (!fallbackFocusLooped) throw new Error("Fallback dialog did not retain Tab focus within its controls");
    await pressKey(session, "Escape", "Escape", 27);
    await waitFor("fallback Escape to restore dialog focus", async () => evaluate(
      session,
      `(() => {
        const dialog = document.querySelector("#persistenceConsentDialog");
        return !dialog?.open
          && !dialog?.dataset.fallback
          && !document.querySelector(".app-shell")?.hasAttribute("aria-hidden")
          && document.activeElement?.id === "applySkin";
      })()`,
    ));

    console.log("Theme Manager accessibility check passed: native and fallback dialog focus, keyboard select/apply/cancel/restore, shortcut context, forced-colors/reduced-motion, and axe serious/critical scans.");
  } finally {
    session?.close();
    await stopBrowser(browser);
    await new Promise((resolve) => server.close(resolve));
    await rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 250 });
  }
}

try {
  await main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
