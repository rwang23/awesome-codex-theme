import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readPngDimensions } from "./lib/png.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const APPLY = process.argv.includes("--apply");
const DEBUG_LAYOUT = process.argv.includes("--debug-layout");
let PORT = Number(argumentValue("--port") || "0");
const REQUESTED_IDS = new Set(splitArgument("--ids"));
const REQUESTED_MODES = new Set(splitArgument("--modes"));
const WIDTH = 1440;
const HEIGHT = 810;
const CAPTURE_VERSION = "26.715.3651.0";
const CAPTURE_ROOT = "screenshots/codex-beta-" + CAPTURE_VERSION;
const CAPTURE_DIR = path.join(ROOT, ...CAPTURE_ROOT.split("/"));
const MANIFEST_PATH = path.join(CAPTURE_DIR, "manifest.json");
const RUNTIME_CSS_PATH = path.join(ROOT, "packages", "full-skin", "runtime.css");
const RUNTIME_JS_PATH = path.join(ROOT, "packages", "full-skin", "runtime.js");

const TEST_BENCH = Object.freeze({
  packageFamilyName: "OpenAI.CodexBeta_2p2nqsd0c76g0",
  packageFullName: "OpenAI.CodexBeta_26.715.3651.0_x64__2p2nqsd0c76g0",
  version: CAPTURE_VERSION,
  aumid: "OpenAI.CodexBeta_2p2nqsd0c76g0!App",
  executable: "ChatGPT (Beta).exe",
  targetUrlPrefix: "app://",
});

async function resolvePort() {
  if (PORT) return PORT;
  const localAppData = process.env.LOCALAPPDATA;
  invariant(localAppData, "LOCALAPPDATA is required to discover the Beta CDP port");
  const activePortPath = path.join(
    localAppData,
    "Packages",
    TEST_BENCH.packageFamilyName,
    "LocalCache",
    "Roaming",
    "Codex",
    "web",
    "Codex (Beta)",
    "DevToolsActivePort",
  );
  const [firstLine] = (await readFile(activePortPath, "utf8")).trim().split(/\r?\n/);
  return Number(firstLine);
}

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

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function jsonBuffer(value) {
  return Buffer.from(JSON.stringify(value, null, 2) + "\n", "utf8");
}

class CdpClient {
  constructor(webSocketUrl) {
    this.webSocketUrl = webSocketUrl;
    this.nextId = 1;
    this.pending = new Map();
  }

  async connect() {
    const url = new URL(this.webSocketUrl);
    invariant(
      url.protocol === "ws:"
        && ["127.0.0.1", "localhost", "[::1]", "::1"].includes(url.hostname)
        && Number(url.port) === PORT
        && /^\/devtools\/page\/[A-Za-z0-9._-]+$/.test(url.pathname),
      "Rejected a CDP target outside the expected loopback endpoint",
    );
    this.socket = new WebSocket(url);
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

  async send(method, params = {}, timeout = 30000) {
    const id = this.nextId++;
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
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || "Runtime.evaluate failed");
  }
  return result.result?.value;
}

async function waitFor(client, expression, label, timeout = 15000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    if (await evaluate(client, expression)) return;
    await delay(150);
  }
  throw new Error("Timed out waiting for " + label);
}

function ownerIdentity() {
  const endpointPattern = String.raw`^\s*TCP\s+(127\.0\.0\.1|\[::1\]):${PORT}\s+\S+\s+LISTENING\s+\d+\s*$`;
  const command = [
    "$line = netstat -ano -p tcp | Select-String -Pattern '" + endpointPattern + "' | Select-Object -First 1",
    "if (-not $line) { throw 'The expected loopback listener is unavailable' }",
    "$parts = $line.ToString().Trim() -split '\\s+'",
    "$ownerPid = [int]$parts[-1]",
    "$process = Get-Process -Id $ownerPid -ErrorAction Stop",
    "[PSCustomObject]@{ pid = $ownerPid; executablePath = $process.Path; processName = $process.ProcessName } | ConvertTo-Json -Compress",
  ].join("; ");
  const output = execFileSync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-Command", command],
    { encoding: "utf8", windowsHide: true },
  ).trim();
  const identity = JSON.parse(output);
  const executable = String(identity.executablePath || "").toLocaleLowerCase();
  invariant(executable.endsWith("\\" + TEST_BENCH.executable.toLocaleLowerCase()), "CDP port owner is not ChatGPT Beta");
  invariant(executable.includes("\\" + TEST_BENCH.packageFullName.toLocaleLowerCase() + "\\"), "CDP port owner is not the pinned Beta package");
  return identity;
}

async function pageTarget() {
  const response = await fetch("http://127.0.0.1:" + PORT + "/json/list");
  invariant(response.ok, "Could not read the Codex Beta CDP target list");
  const targets = await response.json();
  const target = targets.find((item) =>
    item.type === "page"
      && String(item.url).startsWith(TEST_BENCH.targetUrlPrefix)
      && item.webSocketDebuggerUrl,
  );
  invariant(target, "A Codex Beta page target was not found");
  return target;
}

async function preparePrivacySafeHome(client) {
  const result = await evaluate(
    client,
    `(() => {
      const homeVisible = () => Boolean(
        document.querySelector(".group\\\\/home-suggestions, [class*='home-suggestions']")
        || [...document.querySelectorAll("h1, h2")].some((node) =>
          /what should we build|what should we code|let.?s build|我们应该构建什么|我们该构建什么/.test(
            node.textContent.trim().toLocaleLowerCase()
          )
        )
      );
      const candidates = [...document.querySelectorAll("button, a, [role='button']")];
      const newTask = candidates.find((node) => {
        const text = node.textContent.trim().toLocaleLowerCase();
        const aria = (node.getAttribute("aria-label") || "").toLocaleLowerCase();
        return ["new task", "new chat", "新建任务", "新聊天"].some((label) =>
          text === label || aria === label
        );
      });
      newTask?.click();
      const hide = document.querySelector('button[aria-label="Hide sidebar"], button[aria-label="隐藏侧边栏"]');
      hide?.click();
      return {
        newTask: Boolean(newTask),
        home: homeVisible(),
        sidebarHidden: Boolean(hide || document.querySelector('button[aria-label="Show sidebar"], button[aria-label="显示侧边栏"]')),
      };
    })()`,
  );
  invariant(result?.newTask || result?.home, "Could not navigate the pinned Beta app to a new-task home");
  await delay(900);
  const projectState = await evaluate(
    client,
    `(() => {
      const project = document.querySelector(
        'button[data-composer-navigation-target="workspace-project"]'
      );
      if (!project) return { found: false, clear: false };
      const label = (project.getAttribute("aria-label") || project.textContent || "")
        .trim()
        .toLocaleLowerCase();
      const clear = ["choose project", "选择项目", "选取项目"].includes(label);
      if (!clear) project.click();
      return { found: true, clear };
    })()`,
  );
  invariant(projectState?.found, "Could not identify the pinned Beta project selector");
  if (!projectState.clear) {
    await delay(350);
    const cleared = await evaluate(
      client,
      `(() => {
        const labels = [
          "don't work in a project",
          "do not work in a project",
          "不在项目中工作",
          "不使用项目",
        ];
        const clear = [...document.querySelectorAll("button, [role='menuitem']")]
          .find((node) => labels.includes(
            (node.getAttribute("aria-label") || node.textContent || "")
              .trim()
              .toLocaleLowerCase()
          ));
        clear?.click();
        return Boolean(clear);
      })()`,
    );
    invariant(cleared, "Could not clear the selected project before capture");
    await delay(700);
  }
  const hidden = await evaluate(
    client,
    `Boolean(document.querySelector(
      'button[aria-label="Show sidebar"], button[aria-label="显示侧边栏"]'
    ))`,
  );
  invariant(hidden || result.sidebarHidden, "Could not establish a privacy-safe sidebar fixture");
  const privacyState = await evaluate(
    client,
    `(() => {
      const project = document.querySelector(
        'button[data-composer-navigation-target="workspace-project"]'
      );
      const label = (project?.getAttribute("aria-label") || project?.textContent || "")
        .trim()
        .toLocaleLowerCase();
      return {
        projectLabel: label,
        projectCleared: ["choose project", "选择项目", "选取项目"].includes(label),
      };
    })()`,
  );
  invariant(privacyState?.projectCleared, "Capture fixture still contains a selected project");
}

function buildRuntimeScript(runtimeJs, runtimeCss, theme, mode, manifest, image) {
  const modeRecord = manifest.modes[mode];
  const locale = theme.audience === "zh-CN" ? "zh-CN" : "en";
  const payload = {
    id: theme.id,
    mode,
    name: theme.name[locale] || theme.name.en || theme.name["zh-CN"],
    tagline: theme.tagline[locale] || theme.tagline.en || theme.tagline["zh-CN"],
    art: modeRecord.art,
    tokens: modeRecord.tokens,
  };
  const imageData = "data:image/png;base64," + image.toString("base64");
  return runtimeJs
    .replace("__ACT_THEME_JSON__", JSON.stringify(payload))
    .replace("__ACT_CSS_JSON__", JSON.stringify(runtimeCss))
    .replace("__ACT_IMAGE_JSON__", JSON.stringify(imageData));
}

async function removeRuntime(client) {
  return evaluate(
    client,
    `(() => {
      if (window.__ACT_FULL_SKIN_STATE__?.cleanup) {
        return window.__ACT_FULL_SKIN_STATE__.cleanup();
      }
      document.getElementById("act-full-skin-style")?.remove();
      document.getElementById("act-full-skin-caption")?.remove();
      document.documentElement.classList.remove("act-full-skin", "act-full-skin-home");
      return true;
    })()`,
  );
}

async function capturePng(client) {
  const result = await client.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  return Buffer.from(result.data, "base64");
}

async function inspectLayout(client) {
  return evaluate(
    client,
    `(() => {
      const describe = (element) => {
        const items = [];
        let current = element;
        for (let depth = 0; current && depth < 6; depth += 1, current = current.parentElement) {
          const style = getComputedStyle(current);
          const before = getComputedStyle(current, "::before");
          const after = getComputedStyle(current, "::after");
          const rect = current.getBoundingClientRect();
          items.push({
            tag: current.tagName,
            id: current.id,
            className: typeof current.className === "string" ? current.className.slice(0, 180) : "",
            role: current.getAttribute("role"),
            background: style.backgroundColor,
            backgroundImage: style.backgroundImage,
            borderTop: style.borderTop,
            boxShadow: style.boxShadow,
            color: style.color,
            before: {
              content: before.content,
              background: before.backgroundColor,
              backgroundImage: before.backgroundImage,
              boxShadow: before.boxShadow,
            },
            after: {
              content: after.content,
              background: after.backgroundColor,
              backgroundImage: after.backgroundImage,
              boxShadow: after.boxShadow,
            },
            rect: [Math.round(rect.x), Math.round(rect.y), Math.round(rect.width), Math.round(rect.height)],
          });
        }
        return items;
      };
      return {
        points: [
          [720, 28],
          [720, 72],
          [720, 86],
          [720, 94],
          [720, 115],
          [720, 395],
          [720, 510],
          [720, 675]
        ].map(([x, y]) => ({ x, y, ancestry: describe(document.elementFromPoint(x, y)) })),
        headings: [...document.querySelectorAll("h1, h2")].map((node) => ({
          text: node.textContent.trim(),
          color: getComputedStyle(node).color,
          className: node.className,
        })),
        composerText: [...document.querySelectorAll("[role='main'] *")]
          .filter((node) => {
            const text = node.textContent.trim();
            return text === "Do anything" || /^5\\.[0-9]/.test(text);
          })
          .slice(0, 12)
          .map((node) => ({
            text: node.textContent.trim(),
            ancestry: describe(node),
          })),
      };
    })()`,
  );
}

async function writeManifest(value) {
  await mkdir(CAPTURE_DIR, { recursive: true });
  const temporary = MANIFEST_PATH + ".tmp";
  await writeFile(temporary, jsonBuffer(value));
  await rename(temporary, MANIFEST_PATH);
}

async function main() {
  PORT = await resolvePort();
  invariant(Number.isInteger(PORT) && PORT >= 1024 && PORT <= 65535, "Invalid CDP port");
  const owner = ownerIdentity();
  const target = await pageTarget();
  const [registry, runtimeCss, runtimeJs] = await Promise.all([
    readFile(path.join(ROOT, "themes", "registry.json"), "utf8").then(JSON.parse),
    readFile(RUNTIME_CSS_PATH, "utf8"),
    readFile(RUNTIME_JS_PATH, "utf8"),
  ]);
  const previousManifest = await readFile(MANIFEST_PATH, "utf8")
    .then(JSON.parse)
    .catch(() => null);
  const runtimeSha256 = sha256(Buffer.from(runtimeCss + "\n" + runtimeJs, "utf8"));
  const themes = registry.themes.filter((theme) => REQUESTED_IDS.size === 0 || REQUESTED_IDS.has(theme.id));
  const modes = ["light", "dark"].filter((mode) => REQUESTED_MODES.size === 0 || REQUESTED_MODES.has(mode));
  invariant(themes.length > 0, "No requested themes were found");
  invariant(modes.length > 0, "No requested modes were found");
  if (REQUESTED_IDS.size) invariant(themes.length === REQUESTED_IDS.size, "At least one requested theme id is unknown");

  if (!APPLY) {
    console.log(JSON.stringify({
      status: "READY",
      apply: false,
      owner,
      target: { title: target.title, url: target.url },
      testBench: TEST_BENCH,
      runtimeSha256,
      themes: themes.length,
      modes,
    }, null, 2));
    return;
  }

  const client = new CdpClient(target.webSocketDebuggerUrl);
  await client.connect();
  await client.send("Runtime.enable");
  await client.send("Page.enable");
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: WIDTH,
    height: HEIGHT,
    deviceScaleFactor: 1,
    mobile: false,
  });

  const captures = [];
  let runError = null;
  let runtimeRemoved = false;
  let earlyScriptIdentifier = null;
  const capturedAt = new Date().toISOString();
  try {
    await mkdir(CAPTURE_DIR, { recursive: true });
    await preparePrivacySafeHome(client);
    for (const theme of themes) {
      const manifest = JSON.parse(await readFile(
        path.join(ROOT, "themes", theme.id, "manifest.json"),
        "utf8",
      ));
      for (const mode of modes) {
        const modeRecord = manifest.modes[mode];
        const image = await readFile(path.join(ROOT, "themes", theme.id, ...modeRecord.asset.split("/")));
        invariant(sha256(image) === modeRecord.integrity.sha256, theme.id + " " + mode + " asset hash mismatch");
        invariant(image.length === modeRecord.integrity.bytes, theme.id + " " + mode + " asset byte count mismatch");

        await client.send("Emulation.setEmulatedMedia", {
          features: [{ name: "prefers-color-scheme", value: mode }],
        });
        await delay(250);
        const script = buildRuntimeScript(runtimeJs, runtimeCss, theme, mode, manifest, image);
        const earlyScript = await client.send("Page.addScriptToEvaluateOnNewDocument", {
          source: script,
        });
        earlyScriptIdentifier = earlyScript.identifier;
        let applied = await evaluate(client, script);
        invariant(applied?.pass, theme.id + " " + mode + " runtime marker failed");
        invariant(applied.selectors?.main, theme.id + " " + mode + " main surface selector is missing");
        const skinState = `window.__ACT_FULL_SKIN_STATE__?.themeId === ${JSON.stringify(theme.id)}
          && window.__ACT_FULL_SKIN_STATE__?.mode === ${JSON.stringify(mode)}`;
        try {
          await waitFor(client, skinState, theme.id + " " + mode + " skin state", 3000);
        } catch {
          await delay(700);
          applied = await evaluate(client, script);
          invariant(applied?.pass, theme.id + " " + mode + " runtime retry failed");
          invariant(applied.selectors?.main, theme.id + " " + mode + " retry lost the main surface");
          await waitFor(client, skinState, theme.id + " " + mode + " retried skin state", 5000);
        }
        await delay(350);
        if (DEBUG_LAYOUT) {
          console.error(JSON.stringify(await inspectLayout(client), null, 2));
        }

        const screenshot = await capturePng(client);
        const dimensions = readPngDimensions(screenshot);
        invariant(dimensions.width === WIDTH && dimensions.height === HEIGHT, "Screenshot dimensions changed");
        const relativePath = CAPTURE_ROOT + "/" + theme.id + "-" + mode + ".png";
        await writeFile(path.join(ROOT, ...relativePath.split("/")), screenshot);
        captures.push({
          themeId: theme.id,
          mode,
          path: relativePath,
          sha256: sha256(screenshot),
          bytes: screenshot.length,
          width: dimensions.width,
          height: dimensions.height,
          assetSha256: modeRecord.integrity.sha256,
          runtimeSha256,
          markerVersion: applied.version,
          selectors: applied.selectors,
          capturedAt: new Date().toISOString(),
        });
        console.log("Captured " + theme.id + " " + mode);
        await client.send("Page.removeScriptToEvaluateOnNewDocument", {
          identifier: earlyScriptIdentifier,
        });
        earlyScriptIdentifier = null;
      }
    }
  } catch (error) {
    runError = error;
  } finally {
    if (earlyScriptIdentifier) {
      try {
        await client.send("Page.removeScriptToEvaluateOnNewDocument", {
          identifier: earlyScriptIdentifier,
        });
      } catch {}
      earlyScriptIdentifier = null;
    }
    try {
      await removeRuntime(client);
      runtimeRemoved = await evaluate(
        client,
        `!document.documentElement.classList.contains("act-full-skin")
          && !document.getElementById("act-full-skin-style")
          && !window.__ACT_FULL_SKIN_STATE__`,
      );
    } catch (restoreError) {
      runError = runError
        ? new Error(runError.message + "; runtime cleanup failed: " + restoreError.message)
        : restoreError;
    }
    try {
      await client.send("Emulation.clearDeviceMetricsOverride");
      await client.send("Emulation.setEmulatedMedia", {});
    } catch {}
    client.close();
  }

  const selectedCaptureKeys = new Set(
    themes.flatMap((theme) => modes.map((mode) => theme.id + "|" + mode)),
  );
  const canMergePrevious = previousManifest?.status === "complete"
    && previousManifest?.testBench?.packageFullName === TEST_BENCH.packageFullName
    && previousManifest?.runtime?.sha256 === runtimeSha256
    && previousManifest?.runtime?.removedAfterCapture === true
    && Array.isArray(previousManifest?.captures);
  const mergedCaptures = [
    ...(canMergePrevious
      ? previousManifest.captures.filter(
        (capture) => !selectedCaptureKeys.has(capture.themeId + "|" + capture.mode),
      )
      : []),
    ...captures,
  ];
  const themeOrder = new Map(registry.themes.map((theme, index) => [theme.id, index]));
  mergedCaptures.sort((left, right) => {
    const themeDifference = (themeOrder.get(left.themeId) ?? Number.MAX_SAFE_INTEGER)
      - (themeOrder.get(right.themeId) ?? Number.MAX_SAFE_INTEGER);
    return themeDifference || ["light", "dark"].indexOf(left.mode) - ["light", "dark"].indexOf(right.mode);
  });
  const manifest = {
    schemaVersion: "act-full-skin-capture-manifest-v1",
    status: !runError && runtimeRemoved ? "complete" : "failed",
    capturedAt,
    testBench: TEST_BENCH,
    fixture: {
      id: "full-skin-home-v1",
      width: WIDTH,
      height: HEIGHT,
      sidebar: "hidden",
      project: "none",
      privateContent: "excluded",
      nativeSettingsChanged: false,
    },
    runtime: {
      format: "act-full-skin-v1",
      sha256: runtimeSha256,
      earlyInjection: true,
      removedAfterCapture: runtimeRemoved,
    },
    scope: {
      themeIds: registry.themes
        .map((theme) => theme.id)
        .filter((themeId) => mergedCaptures.some((capture) => capture.themeId === themeId)),
      modes: ["light", "dark"].filter(
        (mode) => mergedCaptures.some((capture) => capture.mode === mode),
      ),
    },
    captures: mergedCaptures,
    ...(runError ? { error: runError.message } : {}),
  };
  await writeManifest(manifest);
  invariant(!runError, runError?.message || "Full-skin capture failed");
  invariant(runtimeRemoved, "Full-skin runtime was not removed after capture");
  console.log(JSON.stringify({
    status: "COMPLETE",
    captures: captures.length,
    manifest: path.relative(ROOT, MANIFEST_PATH).replaceAll("\\", "/"),
    runtimeRemoved,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
