import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readPngDimensions } from "./lib/png.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const APPLY = process.argv.includes("--apply");
const RESTORE_BACKUP = argumentValue("--restore-backup");
const DEBUG_NOTIFICATIONS = process.argv.includes("--debug-notifications");
const RESET_RENDERER = process.argv.includes("--reset-renderer");
const PORT = Number(argumentValue("--port") || "9445");
const EXPECTED_BASELINE = argumentValue("--expected-baseline");
const REQUESTED_IDS = new Set(splitArgument("--ids"));
const REQUESTED_MODES = new Set(splitArgument("--modes"));
const WIDTH = 1440;
const HEIGHT = 810;
const CAPTURE_ROOT = "screenshots/codex-beta-26.707.3351.0";
const CAPTURE_DIR = path.join(ROOT, ...CAPTURE_ROOT.split("/"));
const MANIFEST_PATH = path.join(CAPTURE_DIR, "manifest.json");

const TEST_BENCH = Object.freeze({
  packageFamilyName: "OpenAI.CodexBeta_2p2nqsd0c76g0",
  packageFullName: "OpenAI.CodexBeta_26.707.3351.0_x64__2p2nqsd0c76g0",
  version: "26.707.3351.0",
  aumid: "OpenAI.CodexBeta_2p2nqsd0c76g0!App",
  executable: "ChatGPT (Beta).exe",
  targetUrl: "app://-/index.html",
});

function argumentValue(name) {
  const exact = process.argv.find((value) => value.startsWith(name + "="));
  if (exact) return exact.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function splitArgument(name) {
  const value = argumentValue(name);
  return value ? value.split(",").map((item) => item.trim()).filter(Boolean) : [];
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function jsonBuffer(value) {
  return Buffer.from(JSON.stringify(value, null, 2) + "\n", "utf8");
}

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

class CdpClient {
  constructor(webSocketUrl) {
    this.webSocketUrl = webSocketUrl;
    this.nextId = 1;
    this.pending = new Map();
  }

  async connect() {
    this.socket = new WebSocket(this.webSocketUrl);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Timed out connecting to Codex Beta CDP")), 10000);
      this.socket.addEventListener("open", () => {
        clearTimeout(timer);
        resolve();
      }, { once: true });
      this.socket.addEventListener("error", () => {
        clearTimeout(timer);
        reject(new Error("Could not connect to Codex Beta CDP"));
      }, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      clearTimeout(pending.timer);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
    });
  }

  async send(method, params = {}, timeout = 15000) {
    const id = this.nextId;
    this.nextId += 1;
    const response = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error("CDP command timed out: " + method));
      }, timeout);
      this.pending.set(id, { resolve, reject, timer });
    });
    this.socket.send(JSON.stringify({ id, method, params }));
    return response;
  }

  close() {
    this.socket?.close();
  }
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || "Runtime.evaluate failed");
  }
  return result.result?.value;
}

async function waitFor(client, expression, label, timeout = 10000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    if (await evaluate(client, expression)) return;
    await delay(100);
  }
  throw new Error("Timed out waiting for " + label);
}

async function clickButton(client, label) {
  const clicked = await evaluate(
    client,
    `(() => {
      const label = ${JSON.stringify(label)};
      const button = [...document.querySelectorAll("button")]
        .find((item) => item.getAttribute("aria-label") === label
          || item.textContent.trim() === label);
      if (!button || button.disabled) return false;
      button.click();
      return true;
    })()`,
  );
  invariant(clicked, "Button is missing or disabled: " + label);
}

async function clickElement(client, selector, label) {
  const clicked = await evaluate(
    client,
    `(() => {
      const label = ${JSON.stringify(label)};
      const element = [...document.querySelectorAll(${JSON.stringify(selector)})]
        .find((item) => item.textContent.trim().startsWith(label));
      if (!element) return false;
      element.click();
      return true;
    })()`,
  );
  invariant(clicked, "Element is missing: " + label);
}

async function mouseClick(client, selector, exactText) {
  const point = await evaluate(
    client,
    `(() => {
      const selector = ${JSON.stringify(selector)};
      const exactText = ${JSON.stringify(exactText || null)};
      const candidates = [...document.querySelectorAll(selector)];
      const element = exactText
        ? candidates.find((item) => item.textContent.trim().startsWith(exactText))
        : candidates[0];
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()`,
  );
  invariant(point, "Could not locate a visible element: " + (exactText || selector));
  await client.send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x: point.x,
    y: point.y,
    button: "left",
    clickCount: 1,
  });
  await client.send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x: point.x,
    y: point.y,
    button: "left",
    clickCount: 1,
  });
}

async function ensureAppearance(client) {
  const alreadyOpen = await evaluate(
    client,
    `Boolean(document.querySelector(
      'button[aria-label="Import Light theme"], button[aria-label="Import Dark theme"]'
    ))`,
  );
  if (alreadyOpen) return;

  const navigationSelector = 'button, a, [role="button"], [role="tab"]';
  const appearanceVisible = await evaluate(
    client,
    `[...document.querySelectorAll(${JSON.stringify(navigationSelector)})]
      .some((item) => item.textContent.trim().startsWith("Appearance"))`,
  );
  if (appearanceVisible) {
    await clickElement(client, navigationSelector, "Appearance");
    await waitFor(
      client,
      `Boolean(document.querySelector(
        'button[aria-label="Import Light theme"], button[aria-label="Import Dark theme"]'
      ))`,
      "Settings > Appearance",
    );
    return;
  }

  const profileVisible = await evaluate(
    client,
    `Boolean(document.querySelector('button[aria-label="Open profile menu"]'))`,
  );
  if (!profileVisible) {
    const sidebarHidden = await evaluate(
      client,
      `Boolean(document.querySelector('button[aria-label="Show sidebar"]'))`,
    );
    invariant(sidebarHidden, "Could not find the profile menu or hidden-sidebar control");
    await mouseClick(client, 'button[aria-label="Show sidebar"]');
    await waitFor(
      client,
      `Boolean(document.querySelector('button[aria-label="Open profile menu"]'))`,
      "profile menu after showing the sidebar",
    );
  }

  await mouseClick(client, 'button[aria-label="Open profile menu"]');
  await waitFor(
    client,
    `[...document.querySelectorAll('[role="menuitem"], button, a')]
      .some((item) => item.textContent.trim().startsWith("Settings"))`,
    "profile Settings menu item",
  );
  await clickElement(client, '[role="menuitem"], button, a', "Settings");
  await waitFor(
    client,
    `[...document.querySelectorAll(${JSON.stringify(navigationSelector)})]
      .some((item) => item.textContent.trim().startsWith("Appearance"))`,
    "Appearance settings navigation",
  );
  await clickElement(client, navigationSelector, "Appearance");
  await waitFor(
    client,
    `Boolean(document.querySelector(
      'button[aria-label="Import Light theme"], button[aria-label="Import Dark theme"]'
    ))`,
    "Settings > Appearance",
  );
}

async function inspectUi(client) {
  return evaluate(
    client,
    `(() => ({
      url: location.href,
      title: document.title,
      heading: document.querySelector("h1, h2")?.textContent.trim() || "",
      buttons: [...document.querySelectorAll("button")].map((item) => ({
        text: item.textContent.trim(),
        aria: item.getAttribute("aria-label"),
        role: item.getAttribute("role"),
        checked: item.getAttribute("aria-checked"),
      })).filter((item) => item.text || item.aria),
      inputs: [...document.querySelectorAll("input, textarea")].map((item) => ({
        aria: item.getAttribute("aria-label"),
        type: item.getAttribute("type"),
        value: item.value,
      })),
    }))()`,
  );
}

function ownerIdentity() {
  const command = [
    "$connection = Get-NetTCPConnection -State Listen -LocalPort " + PORT + " -ErrorAction Stop | Select-Object -First 1",
    "$process = Get-CimInstance Win32_Process -Filter \"ProcessId = $($connection.OwningProcess)\"",
    "[PSCustomObject]@{ pid = $connection.OwningProcess; executablePath = $process.ExecutablePath; commandLine = $process.CommandLine } | ConvertTo-Json -Compress",
  ].join("; ");
  const output = execFileSync(
    "powershell.exe",
    ["-NoProfile", "-Command", command],
    { encoding: "utf8", windowsHide: true },
  ).trim();
  const identity = JSON.parse(output);
  const normalized = String(identity.executablePath || "").toLocaleLowerCase();
  invariant(normalized.endsWith("\\" + TEST_BENCH.executable.toLocaleLowerCase()), "CDP port owner is not ChatGPT Beta");
  invariant(normalized.includes("\\" + TEST_BENCH.packageFullName.toLocaleLowerCase() + "\\"), "CDP port owner is not the pinned Beta package");
  return identity;
}

async function pageTarget() {
  const response = await fetch("http://127.0.0.1:" + PORT + "/json/list");
  invariant(response.ok, "Could not read the Codex Beta CDP target list");
  const targets = await response.json();
  const target = targets.find((item) => item.type === "page" && item.url === TEST_BENCH.targetUrl);
  invariant(target?.webSocketDebuggerUrl, "Pinned Codex Beta page target was not found");
  return target;
}

async function installClipboardCapture(client) {
  const installed = await evaluate(
    client,
    `(() => {
      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") return false;
      if (!window.__actOriginalClipboardWrite) {
        window.__actOriginalClipboardWrite = navigator.clipboard.writeText.bind(navigator.clipboard);
      }
      navigator.clipboard.writeText = async (text) => {
        window.__actClipboardCapture = String(text);
      };
      window.__actClipboardCapture = null;
      return true;
    })()`,
  );
  invariant(installed, "Clipboard interception is unavailable in the Beta renderer");
}

async function restoreClipboard(client) {
  await evaluate(
    client,
    `(() => {
      if (window.__actOriginalClipboardWrite && navigator.clipboard) {
        navigator.clipboard.writeText = window.__actOriginalClipboardWrite;
      }
      delete window.__actOriginalClipboardWrite;
      delete window.__actClipboardCapture;
      return true;
    })()`,
  );
}

async function captureSharedTheme(client, mode) {
  const title = mode === "light" ? "Light" : "Dark";
  await evaluate(client, "window.__actClipboardCapture = null");
  await clickButton(client, "Copy " + title + " theme");
  await waitFor(
    client,
    `typeof window.__actClipboardCapture === "string"
      && window.__actClipboardCapture.startsWith("codex-theme-v1:")`,
    title + " theme share string",
  );
  return evaluate(client, "window.__actClipboardCapture");
}

async function currentShellMode(client) {
  return evaluate(
    client,
    `(() => {
      const checkedLabel = [...document.querySelectorAll("label")]
        .find((item) => ["System", "Light", "Dark"].includes(item.textContent.trim())
          && item.querySelector('input[type="radio"]:checked'));
      if (checkedLabel) return checkedLabel.textContent.trim().toLowerCase();
      const selected = [...document.querySelectorAll("button")]
        .find((item) => item.getAttribute("aria-pressed") === "true"
          && ["System", "Light", "Dark"].includes(item.getAttribute("aria-label")));
      return selected?.getAttribute("aria-label").toLowerCase() || null;
    })()`,
  );
}

async function selectShellMode(client, mode) {
  const label = mode[0].toUpperCase() + mode.slice(1);
  const selected = await evaluate(
    client,
    `(() => {
      const label = ${JSON.stringify(label)};
      const option = [...document.querySelectorAll("label")]
        .find((item) => item.textContent.trim() === label)
        || document.querySelector('button[aria-label="' + label + '"]');
      if (!option) return false;
      option.click();
      return true;
    })()`,
  );
  invariant(selected, "Could not select the " + label + " shell theme");
  await waitFor(
    client,
    `(() => {
      const label = ${JSON.stringify(label)};
      const optionLabel = [...document.querySelectorAll("label")]
        .find((item) => item.textContent.trim() === label);
      if (optionLabel?.querySelector('input[type="radio"]:checked')) return true;
      return document.querySelector('button[aria-label="' + label + '"]')
        ?.getAttribute("aria-pressed") === "true";
    })()`,
    label + " shell theme",
  );
}

async function importSharedTheme(client, mode, value) {
  await ensureAppearance(client);
  const shellMode = await currentShellMode(client);
  if (shellMode && shellMode !== "system") {
    await selectShellMode(client, "system");
    await ensureAppearance(client);
  }
  const title = mode === "light" ? "Light" : "Dark";
  const inputLabel = title + " theme share string";
  await clickButton(client, "Import " + title + " theme");
  await waitFor(
    client,
    `Boolean(document.querySelector('[aria-label=${JSON.stringify(inputLabel)}]'))`,
    inputLabel + " input",
  );
  const updated = await evaluate(
    client,
    `(() => {
      const input = document.querySelector('[aria-label=${JSON.stringify(inputLabel)}]');
      if (!input) return false;
      const prototype = Object.getPrototypeOf(input);
      const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
      if (!descriptor?.set) return false;
      descriptor.set.call(input, ${JSON.stringify(value)});
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    })()`,
  );
  invariant(updated, "Could not populate the " + inputLabel + " input");
  await waitFor(
    client,
    `[...document.querySelectorAll("button")]
      .some((item) => item.textContent.trim() === "Import theme" && !item.disabled)`,
    "enabled Import theme button",
  );
  await clickButton(client, "Import theme");
  await waitFor(
    client,
    `!document.querySelector('[aria-label=${JSON.stringify(inputLabel)}]')`,
    inputLabel + " modal to close",
  );
  const readback = await captureSharedTheme(client, mode);
  if (readback !== value) {
    const differences = payloadDifferences(
      canonicalizePayload(nativePayload(value)),
      canonicalizePayload(nativePayload(readback)),
    );
    if (differences.length > 0) {
      throw new Error(
        title + " theme readback differs from the imported string: "
        + JSON.stringify(differences),
      );
    }
  }
  return {
    sha256: sha256(Buffer.from(readback, "utf8")),
    canonicalizedByApp: readback !== value,
  };
}

async function hideSidebar(client) {
  const state = await evaluate(
    client,
    `(() => {
      const hide = document.querySelector('button[aria-label="Hide sidebar"]');
      if (hide) {
        hide.click();
        return "clicked";
      }
      if (document.querySelector('button[aria-label="Show sidebar"]')) return "already-hidden";
      return "unknown";
    })()`,
  );
  invariant(state !== "unknown", "Could not prove that the private app sidebar is hidden");
  if (state === "clicked") {
    await waitFor(
      client,
      `Boolean(document.querySelector('button[aria-label="Show sidebar"]'))`,
      "sidebar to hide",
    );
  }
  return state;
}

async function showSidebar(client) {
  const state = await evaluate(
    client,
    `(() => {
      const show = document.querySelector('button[aria-label="Show sidebar"]');
      if (show) return "needs-click";
      if (document.querySelector('button[aria-label="Hide sidebar"]')) return "already-shown";
      return "unknown";
    })()`,
  );
  invariant(state !== "unknown", "Could not prove that the app sidebar is shown");
  if (state === "needs-click") {
    await mouseClick(client, 'button[aria-label="Show sidebar"]');
    await waitFor(
      client,
      `Boolean(document.querySelector('button[aria-label="Hide sidebar"]'))`,
      "sidebar to show",
    );
  }
}

async function sidebarState(client) {
  return evaluate(
    client,
    `document.querySelector('button[aria-label="Show sidebar"]')
      ? "hidden"
      : (document.querySelector('button[aria-label="Hide sidebar"]') ? "shown" : null)`,
  );
}

async function hideCaptureNotifications(client) {
  const details = await evaluate(
    client,
    `(() => {
      const notificationText = /^(Light|Dark) theme (copied|imported)$/i;
      const matches = [...document.querySelectorAll("body *")]
        .filter((element) => notificationText.test(element.textContent.trim()));
      const ancestry = matches.slice(0, 1).map((element) => {
        const items = [];
        let current = element;
        for (let index = 0; current && index < 8; index += 1, current = current.parentElement) {
          const rect = current.getBoundingClientRect();
          items.push({
            tag: current.tagName,
            role: current.getAttribute("role"),
            className: typeof current.className === "string" ? current.className.slice(0, 160) : "",
            position: getComputedStyle(current).position,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            text: current.textContent.trim().slice(0, 80),
          });
        }
        return items;
      });
      if (!${JSON.stringify(DEBUG_NOTIFICATIONS)}) {
        for (const element of matches) {
          const root = element.closest('[role="status"], [role="alert"], li')
            || element.parentElement;
          root.style.visibility = "hidden";
        }
      }
      return { matches: matches.length, ancestry };
    })()`,
  );
  if (DEBUG_NOTIFICATIONS) {
    console.error(JSON.stringify({ status: "NOTIFICATION_DEBUG", details }, null, 2));
  }
}

async function capturePng(client) {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: WIDTH,
    height: HEIGHT,
    deviceScaleFactor: 1,
    mobile: false,
  });
  const result = await client.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  }, 30000);
  await client.send("Emulation.clearDeviceMetricsOverride");
  return Buffer.from(result.data, "base64");
}

async function writeManifest(value) {
  await mkdir(CAPTURE_DIR, { recursive: true });
  const temporaryPath = MANIFEST_PATH + ".tmp";
  await writeFile(temporaryPath, jsonBuffer(value));
  await rename(temporaryPath, MANIFEST_PATH);
}

function baselineFingerprint(baseline) {
  return sha256(Buffer.from(JSON.stringify({
    light: baseline.light,
    dark: baseline.dark,
    shellMode: baseline.shellMode,
  }), "utf8"));
}

function nativePayload(value) {
  invariant(value.startsWith("codex-theme-v1:"), "Native theme prefix is invalid");
  return JSON.parse(value.slice("codex-theme-v1:".length));
}

function canonicalizePayload(value) {
  if (Array.isArray(value)) return value.map(canonicalizePayload);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, canonicalizePayload(item)]),
    );
  }
  if (typeof value === "string" && /^#[a-f0-9]{6}$/i.test(value)) {
    return value.toLocaleLowerCase();
  }
  return value;
}

function payloadDifferences(expected, actual, prefix = "") {
  if (expected === actual) return [];
  if (!expected || !actual || typeof expected !== "object" || typeof actual !== "object") {
    return [{ field: prefix || "$", expected, actual }];
  }
  const differences = [];
  const keys = new Set([...Object.keys(expected), ...Object.keys(actual)]);
  for (const key of keys) {
    differences.push(...payloadDifferences(
      expected[key],
      actual[key],
      prefix ? prefix + "." + key : key,
    ));
  }
  return differences;
}

async function main() {
  const owner = ownerIdentity();
  const target = await pageTarget();
  invariant(target.url === TEST_BENCH.targetUrl, "Unexpected Beta target URL");

  const client = new CdpClient(target.webSocketDebuggerUrl);
  await client.connect();
  await client.send("Runtime.enable");
  await client.send("Page.enable");
  await client.send("Emulation.clearDeviceMetricsOverride");
  if (RESET_RENDERER) {
    await client.send("Page.reload", { ignoreCache: true });
    await waitFor(client, `location.href === ${JSON.stringify(TEST_BENCH.targetUrl)}`, "Beta renderer reload");
    await delay(1200);
    console.log(JSON.stringify({ status: "RELOADED", target: TEST_BENCH.targetUrl }, null, 2));
    client.close();
    return;
  }

  let clipboardInstalled = false;
  try {
    await ensureAppearance(client);
    const ui = await inspectUi(client);
    invariant(ui.url === TEST_BENCH.targetUrl, "Connected renderer is not the pinned Codex Beta app");
    invariant(
      ui.buttons.some((item) => ["Import Light theme", "Import Dark theme"].includes(item.aria)),
      "Settings > Appearance is not open",
    );

    await installClipboardCapture(client);
    clipboardInstalled = true;

    if (RESTORE_BACKUP) {
      const backup = JSON.parse(await readFile(path.resolve(RESTORE_BACKUP), "utf8"));
      const currentMode = await currentShellMode(client);
      if (currentMode && currentMode !== "system") {
        await selectShellMode(client, "system");
        await ensureAppearance(client);
      }
      await importSharedTheme(client, "light", backup.light);
      await importSharedTheme(client, "dark", backup.dark);
      await selectShellMode(client, backup.shellMode);
      await ensureAppearance(client);
      const restoredBaseline = {
        light: await captureSharedTheme(client, "light"),
        dark: await captureSharedTheme(client, "dark"),
        shellMode: await currentShellMode(client),
      };
      const restoredSha256 = baselineFingerprint(restoredBaseline);
      invariant(restoredSha256 === backup.fingerprintSha256, "Backup restore readback failed");
      if (backup.sidebarState === "shown") await showSidebar(client);
      else if (backup.sidebarState === "hidden") await hideSidebar(client);
      console.log(JSON.stringify({
        status: "RESTORED",
        baselineSha256: restoredSha256,
        shellMode: restoredBaseline.shellMode,
      }, null, 2));
      return;
    }

    const baseline = {
      light: await captureSharedTheme(client, "light"),
      dark: await captureSharedTheme(client, "dark"),
      shellMode: await currentShellMode(client),
      sidebarState: await sidebarState(client),
    };
    invariant(["system", "light", "dark"].includes(baseline.shellMode), "Could not read the current shell mode");
    const baselineSha256 = baselineFingerprint(baseline);

    if (!APPLY) {
      console.log(JSON.stringify({
        status: "READY",
        apply: false,
        owner: {
          pid: owner.pid,
          executablePath: owner.executablePath,
        },
        target: {
          title: target.title,
          url: target.url,
        },
        testBench: TEST_BENCH,
        appearance: {
          shellMode: baseline.shellMode,
          baselineSha256,
          importLight: true,
          importDark: true,
        },
      }, null, 2));
      return;
    }

    invariant(EXPECTED_BASELINE, "--apply requires --expected-baseline=<sha256>");
    invariant(EXPECTED_BASELINE === baselineSha256, "Beta theme baseline changed after approval");

    const registry = JSON.parse(await readFile(path.join(ROOT, "themes", "registry.json"), "utf8"));
    const themes = registry.themes.filter((theme) => REQUESTED_IDS.size === 0 || REQUESTED_IDS.has(theme.id));
    const modes = ["light", "dark"].filter((mode) => REQUESTED_MODES.size === 0 || REQUESTED_MODES.has(mode));
    invariant(themes.length > 0, "No requested themes were found");
    invariant(modes.length > 0, "No requested modes were found");
    if (REQUESTED_IDS.size > 0) {
      invariant(themes.length === REQUESTED_IDS.size, "At least one requested theme id is unknown");
    }

    await mkdir(CAPTURE_DIR, { recursive: true });
    const capturedAt = new Date().toISOString();
    const captures = [];
    let runError = null;
    let restored = false;
    let finalBaselineSha256 = null;

    try {
      await hideSidebar(client);
      for (const theme of themes) {
        for (const mode of modes) {
          const modeRecord = theme.previews[mode];
          const importEvidence = await importSharedTheme(client, mode, modeRecord.nativeTheme.value);
          await selectShellMode(client, mode);
          await ensureAppearance(client);
          await hideSidebar(client);
          await hideCaptureNotifications(client);
          await delay(350);

          const screenshot = await capturePng(client);
          const dimensions = readPngDimensions(screenshot);
          invariant(dimensions.width === WIDTH && dimensions.height === HEIGHT, "Screenshot dimensions changed");
          const relativePath = CAPTURE_ROOT + "/" + theme.id + "-" + mode + ".png";
          await writeFile(path.join(ROOT, ...relativePath.split("/")), screenshot);
          captures.push({
            themeId: theme.id,
            mode,
            path: relativePath,
            nativeSha256: modeRecord.nativeTheme.sha256,
            readbackSha256: importEvidence.sha256,
            canonicalizedByApp: importEvidence.canonicalizedByApp,
            sha256: sha256(screenshot),
            bytes: screenshot.length,
            width: dimensions.width,
            height: dimensions.height,
            capturedAt: new Date().toISOString(),
          });
          console.log("Captured " + theme.id + " " + mode);
        }
      }
    } catch (error) {
      runError = error;
    } finally {
      try {
        await importSharedTheme(client, "light", baseline.light);
        await importSharedTheme(client, "dark", baseline.dark);
        await selectShellMode(client, baseline.shellMode);
        await ensureAppearance(client);
        const finalBaseline = {
          light: await captureSharedTheme(client, "light"),
          dark: await captureSharedTheme(client, "dark"),
          shellMode: await currentShellMode(client),
        };
        finalBaselineSha256 = baselineFingerprint(finalBaseline);
        restored = finalBaselineSha256 === baselineSha256;
        if (baseline.sidebarState === "shown") await showSidebar(client);
        else if (baseline.sidebarState === "hidden") await hideSidebar(client);
      } catch (restoreError) {
        runError = runError
          ? new Error(runError.message + "; restore failed: " + restoreError.message)
          : restoreError;
      }
    }

    const manifest = {
      schemaVersion: "act-native-capture-manifest-v1",
      status: !runError && restored ? "complete" : "failed",
      capturedAt,
      testBench: TEST_BENCH,
      fixture: {
        id: "settings-appearance-v1",
        width: WIDTH,
        height: HEIGHT,
        sidebar: "hidden",
        privateContent: "excluded",
      },
      baseline: {
        sha256: baselineSha256,
        finalSha256: finalBaselineSha256,
        restored,
      },
      scope: {
        themeIds: themes.map((theme) => theme.id),
        modes,
      },
      captures,
      ...(runError ? { error: runError.message } : {}),
    };
    await writeManifest(manifest);
    invariant(!runError, runError?.message || "Screenshot run failed");
    invariant(restored, "Beta theme baseline was not restored");
    console.log(JSON.stringify({
      status: "COMPLETE",
      captures: captures.length,
      manifest: path.relative(ROOT, MANIFEST_PATH).replaceAll("\\", "/"),
      baselineSha256,
      restored,
    }, null, 2));
  } finally {
    if (clipboardInstalled) {
      try {
        await restoreClipboard(client);
      } catch {
        // The theme baseline restoration is the material rollback. Clipboard
        // interception only affects this renderer session and is best effort.
      }
    }
    try {
      await client.send("Emulation.clearDeviceMetricsOverride");
    } catch {
      // The renderer may already be closing.
    }
    client.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
