import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const APPLY = process.argv.includes("--apply");
const DEBUG = process.argv.includes("--debug");
const PERSISTENCE = process.argv.includes("--persistence");
const ACTIVE_RUNTIME = process.argv.includes("--active-runtime");
const SEED_LOCAL_ART = process.argv.includes("--seed-local-art");
const MANAGER_PORT = Number(argumentValue("--manager-port") || process.env.ACT_MANAGER_CDP_PORT || "0");
const MANAGER_EXECUTABLE = argumentValue("--manager-exe") || process.env.ACT_MANAGER_EXE;
const REQUESTED_BETA_PORT = Number(argumentValue("--beta-port") || "0");
const BETA_SCREENSHOT = argumentValue("--beta-screenshot");
const CONVERSATION_LABEL = argumentValue("--conversation-label");
const CONVERSATION_SCREENSHOT = argumentValue("--conversation-screenshot");
const THEME_ID = argumentValue("--theme") || "qinglan-odyssey";
const MODE = argumentValue("--mode") || "dark";
const MANAGER_EXE = MANAGER_EXECUTABLE
  ? path.resolve(MANAGER_EXECUTABLE)
  : path.resolve(
    ROOT,
    "apps",
    "theme-manager",
    "src-tauri",
    "target",
    "release",
    "awesome-codex-theme.exe",
  );
const SCREENSHOT_PATH = path.join(ROOT, "docs", "assets", "theme-manager-windows.png");
const BETA_PACKAGE = "OpenAI.CodexBeta_26.715.3651.0_x64__2p2nqsd0c76g0";
const BETA_AUMID = "OpenAI.CodexBeta_2p2nqsd0c76g0!App";

function argumentValue(name) {
  const exact = process.argv.find((value) => value.startsWith(name + "="));
  if (exact) return exact.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function seedLocalArt() {
  if (!SEED_LOCAL_ART) return null;
  const localAppData = process.env.LOCALAPPDATA;
  invariant(localAppData, "LOCALAPPDATA is unavailable");
  const registry = JSON.parse(await readFile(path.join(ROOT, "themes", "registry.json"), "utf8"));
  const theme = registry.themes.find((record) => record.id === THEME_ID);
  const skin = theme?.previews?.[MODE]?.fullSkin;
  invariant(skin, "The requested Full Skin record is missing");
  const source = path.join(ROOT, ...skin.asset.split("/"));
  const bytes = await readFile(source);
  invariant(bytes.length === skin.bytes, "Local Full Skin byte count does not match the Registry");
  invariant(sha256(bytes) === skin.sha256, "Local Full Skin hash does not match the Registry");
  const cacheRoot = path.resolve(localAppData, "io.github.rwang23.awesomecodextheme", "full-skin");
  invariant(
    cacheRoot.startsWith(path.resolve(localAppData) + path.sep),
    "Refusing to seed a cache outside LOCALAPPDATA",
  );
  const destination = path.join(
    cacheRoot,
    `${THEME_ID}-${MODE}-${skin.sha256.slice(0, 12)}.png`,
  );
  const created = !(await exists(destination));
  if (created) {
    await mkdir(cacheRoot, { recursive: true });
    await writeFile(destination, bytes);
  }
  return { destination, created };
}

function ownerChain(port) {
  const owner = listenerOwner(port);
  const command = [
    "Add-Type -TypeDefinition @'",
    "using System;",
    "using System.Runtime.InteropServices;",
    "public static class ActProcessSnapshot {",
    "  const uint TH32CS_SNAPPROCESS = 0x00000002;",
    "  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]",
    "  struct PROCESSENTRY32 { public uint dwSize; public uint cntUsage; public uint th32ProcessID; public IntPtr th32DefaultHeapID; public uint th32ModuleID; public uint cntThreads; public uint th32ParentProcessID; public int pcPriClassBase; public uint dwFlags; [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 260)] public string szExeFile; }",
    "  [DllImport(\"kernel32.dll\", SetLastError = true)] static extern IntPtr CreateToolhelp32Snapshot(uint flags, uint processId);",
    "  [DllImport(\"kernel32.dll\", CharSet = CharSet.Unicode, SetLastError = true)] static extern bool Process32FirstW(IntPtr snapshot, ref PROCESSENTRY32 entry);",
    "  [DllImport(\"kernel32.dll\", CharSet = CharSet.Unicode, SetLastError = true)] static extern bool Process32NextW(IntPtr snapshot, ref PROCESSENTRY32 entry);",
    "  [DllImport(\"kernel32.dll\")] static extern bool CloseHandle(IntPtr handle);",
    "  public static int GetParent(int pid) {",
    "    IntPtr snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);",
    "    if (snapshot == new IntPtr(-1)) return 0;",
    "    try {",
    "      PROCESSENTRY32 entry = new PROCESSENTRY32();",
    "      entry.dwSize = (uint)Marshal.SizeOf(entry);",
    "      if (!Process32FirstW(snapshot, ref entry)) return 0;",
    "      do { if (entry.th32ProcessID == (uint)pid) return (int)entry.th32ParentProcessID; } while (Process32NextW(snapshot, ref entry));",
    "      return 0;",
    "    } finally { CloseHandle(snapshot); }",
    "  }",
    "}",
    "'@",
    "$items = @()",
    "$processId = [int]$env:ACT_OWNER_PID",
    "for ($depth = 0; $depth -lt 8 -and $processId -gt 0; $depth += 1) {",
    "  try { $process = Get-Process -Id $processId -ErrorAction Stop } catch { break }",
    "  $parentId = [ActProcessSnapshot]::GetParent($processId)",
    "  $items += [PSCustomObject]@{ processId = $process.Id; parentProcessId = $parentId; name = $process.ProcessName; executablePath = $process.Path }",
    "  if ($parentId -eq $processId) { break }",
    "  $processId = $parentId",
    "}",
    "ConvertTo-Json -InputObject @($items) -Compress",
  ].join("\n");
  const output = execFileSync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-Command", command],
    {
      encoding: "utf8",
      windowsHide: true,
      env: { ...process.env, ACT_OWNER_PID: String(owner.processId) },
    },
  ).trim();
  const parsed = JSON.parse(output);
  return Array.isArray(parsed) ? parsed : [parsed];
}

function listenerOwner(port) {
  const pattern = String.raw`^\s*TCP\s+(127\.0\.0\.1|\[::1\]):${port}\s+\S+\s+LISTENING\s+\d+\s*$`;
  const command = [
    "$line = netstat -ano -p tcp | Select-String -Pattern '" + pattern + "' | Select-Object -First 1",
    "if (-not $line) { throw 'The expected loopback listener is unavailable' }",
    "$parts = $line.ToString().Trim() -split '\\s+'",
    "$ownerPid = [int]$parts[-1]",
    "$process = Get-Process -Id $ownerPid -ErrorAction SilentlyContinue",
    "if ($null -eq $process) { throw 'The listener owner exited before it could be inspected' }",
    "[PSCustomObject]@{ processId = $ownerPid; name = $process.ProcessName; executablePath = $process.Path } | ConvertTo-Json -Compress",
  ].join("; ");
  return JSON.parse(execFileSync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-Command", command],
    { encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "pipe"] },
  ).trim());
}

function betaRuntimeCandidates() {
  const output = execFileSync("netstat.exe", ["-ano", "-p", "tcp"], {
    encoding: "utf8",
    windowsHide: true,
  });
  const candidates = [];
  const seen = new Set();
  for (const line of output.split(/\r?\n/u)) {
    const match = /^\s*TCP\s+127\.0\.0\.1:(\d+)\s+\S+\s+LISTENING\s+(\d+)\s*$/iu.exec(line);
    if (!match) continue;
    const port = Number(match[1]);
    const processId = Number(match[2]);
    if (!Number.isInteger(port) || port < 1024 || port > 65535 || seen.has(port)) continue;
    seen.add(port);
    try {
      const owner = listenerOwner(port);
      const ownerPath = String(owner.executablePath || "").toLocaleLowerCase();
      const expectedPackage = "\\" + BETA_PACKAGE.toLocaleLowerCase() + "\\";
      if (Number(owner.processId) !== processId || !ownerPath.includes(expectedPackage)) continue;
      candidates.push({ port, processId, executablePath: owner.executablePath });
    } catch {}
  }
  return candidates;
}

async function discoverBetaTarget(timeout = 60000, preferredPort = REQUESTED_BETA_PORT) {
  const startedAt = Date.now();
  let lastError;
  while (Date.now() - startedAt < timeout) {
    try {
      const candidates = preferredPort
        ? [{ port: preferredPort }]
        : betaRuntimeCandidates();
      for (const candidate of candidates) {
        try {
          const port = Number(candidate.port);
          if (!Number.isInteger(port) || port < 1024 || port > 65535) continue;
          const owner = listenerOwner(port);
          const ownerPath = String(owner.executablePath || "").toLocaleLowerCase();
          const expectedPackage = "\\" + BETA_PACKAGE.toLocaleLowerCase() + "\\";
          if (!ownerPath.includes(expectedPackage)) continue;
          if (candidate.processId && Number(candidate.processId) !== Number(owner.processId)) continue;
          return {
            port,
            target: await pageTarget(port, "app://"),
            owner,
          };
        } catch (error) {
          lastError = error;
        }
      }
      throw new Error("No pinned Beta root process owns a loopback CDP listener");
    } catch (error) {
      lastError = error;
      await delay(250);
    }
  }
  throw new Error(`Timed out discovering the controller-managed Beta CDP endpoint: ${lastError?.message || "unavailable"}`);
}

async function pageTarget(port, expectedUrlPrefix) {
  const response = await fetch("http://127.0.0.1:" + port + "/json/list");
  invariant(response.ok, "Could not read CDP targets on port " + port);
  const targets = await response.json();
  const target = targets.find((item) =>
    item.type === "page"
      && String(item.url).startsWith(expectedUrlPrefix)
      && item.webSocketDebuggerUrl,
  );
  invariant(target, "Expected page target was not found on port " + port);
  return target;
}

function launchBetaNormally() {
  invariant(process.platform === "win32", "The persistence relaunch smoke currently requires Windows");
  const launchEnvironment = { ...process.env };
  delete launchEnvironment.WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS;
  // Explorer hands the shell activation to the current interactive session and
  // commonly returns status 1 even after a successful AppsFolder launch.
  // The subsequent exact-process and CDP checks are the authoritative result.
  spawnSync("explorer.exe", [`shell:AppsFolder\\${BETA_AUMID}`], {
    env: launchEnvironment,
    stdio: "ignore",
    windowsHide: true,
  });
}

class CdpClient {
  constructor(webSocketUrl, port) {
    const url = new URL(webSocketUrl);
    invariant(
      url.protocol === "ws:"
        && ["127.0.0.1", "localhost", "[::1]", "::1"].includes(url.hostname)
        && Number(url.port) === port
        && /^\/devtools\/page\/[A-Za-z0-9._-]+$/.test(url.pathname),
      "Rejected an unexpected CDP endpoint",
    );
    this.url = url;
    this.nextId = 1;
    this.pending = new Map();
  }

  async connect() {
    this.socket = new WebSocket(this.url);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("CDP connection timed out")), 10000);
      this.socket.addEventListener("open", () => {
        clearTimeout(timer);
        resolve();
      }, { once: true });
      this.socket.addEventListener("error", () => {
        clearTimeout(timer);
        reject(new Error("CDP connection failed"));
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

  send(method, params = {}, timeout = 30000) {
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
  const response = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.text || "Runtime.evaluate failed");
  }
  return response.result?.value;
}

async function waitFor(client, expression, label, timeout = 30000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    const result = await evaluate(client, expression);
    if (result) return result;
    await delay(200);
  }
  throw new Error("Timed out waiting for " + label);
}

function expectedFullSkinStateExpression() {
  return `(() => {
    const runtime = window.__ACT_FULL_SKIN_STATE__;
    const artValue = document.documentElement.style.getPropertyValue("--act-art-image");
    const bodyBackground = document.body ? getComputedStyle(document.body).backgroundImage : "";
    const state = {
      version: runtime?.version,
      implementationVersion: runtime?.implementationVersion,
      themeId: runtime?.themeId,
      mode: runtime?.mode,
      root: document.documentElement.classList.contains("act-full-skin"),
      home: document.documentElement.classList.contains("act-full-skin-home"),
      task: document.documentElement.classList.contains("act-full-skin-task"),
      style: Boolean(document.getElementById("act-full-skin-style")),
      caption: Boolean(document.getElementById("act-full-skin-caption")),
      artwork: runtime?.artwork,
      metrics: runtime?.metrics ? { ...runtime.metrics } : null,
      source: runtime?.artUrl?.startsWith("blob:") === true,
      documentBackground: Boolean(runtime?.artUrl)
        && artValue.includes(runtime.artUrl)
        && bodyBackground.includes(runtime.artUrl)
    };
    return state.version === "act-full-skin-v1"
      && state.implementationVersion === "act-full-skin-runtime-v2"
      && state.themeId === ${JSON.stringify(THEME_ID)}
      && state.mode === ${JSON.stringify(MODE)}
      && state.root
      && state.style
      && state.caption
      && state.artwork?.loaded
      && state.artwork.width > 0
      && state.artwork.height > 0
      && state.source
      && state.documentBackground ? state : null;
  })()`;
}

async function captureClientScreenshot(client, destination) {
  if (!destination) return null;
  const screenshot = await client.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
    optimizeForSpeed: true,
  }, 90000);
  const bytes = Buffer.from(screenshot.data, "base64");
  await writeFile(path.resolve(destination), bytes);
  return {
    path: path.resolve(destination),
    sha256: sha256(bytes),
    bytes: bytes.length,
  };
}

async function exercisePublicBetaRoute(beta, taskScreenshotPath) {
  const publicRoute = await evaluate(beta, `(() => {
    const labels = ["plugins", "scheduled", "pull requests", "sites", "插件", "已安排", "拉取请求", "站点"];
    const controls = [...document.querySelectorAll("a, button, [role='button']")];
    const target = controls.find((control) => {
      const label = (control.textContent || "").trim().replace(/\\s+/g, " ").toLocaleLowerCase();
      return labels.some((candidate) => label === candidate || label.startsWith(candidate + " "));
    });
    if (!target) return null;
    const label = (target.textContent || "").trim().replace(/\\s+/g, " ");
    target.click();
    return { label, tagName: target.tagName };
  })()`);
  invariant(publicRoute, "No privacy-safe built-in Beta route was available for SPA navigation");

  const taskState = await waitFor(
    beta,
    `(() => {
      const state = ${expectedFullSkinStateExpression()};
      return state && state.task && !state.home ? state : null;
    })()`,
    "Beta Full Skin after privacy-safe SPA route navigation",
    30000,
  );
  const baseline = taskState.metrics;
  await delay(1200);
  const settled = await evaluate(beta, expectedFullSkinStateExpression());
  invariant(settled, "Full Skin became unhealthy while the SPA route was settled");
  invariant(
    settled.metrics.ensureCalls - baseline.ensureCalls <= 2,
    "Full Skin performed excessive renderer repair work on a settled route",
  );
  const taskScreenshot = await captureClientScreenshot(beta, taskScreenshotPath);

  const returnedHome = await evaluate(beta, `(() => {
    const labels = ["new chat", "new task", "新聊天", "新任务"];
    const controls = [...document.querySelectorAll("a, button, [role='button']")];
    const target = controls.find((control) => {
      const label = (control.textContent || "").trim().replace(/\\s+/g, " ").toLocaleLowerCase();
      return labels.some((candidate) => label === candidate || label.startsWith(candidate + " "));
    });
    if (!target) return false;
    target.click();
    return true;
  })()`);
  invariant(returnedHome, "Could not return the Beta fixture to New chat after SPA navigation");
  const homeState = await waitFor(
    beta,
    `(() => {
      const state = ${expectedFullSkinStateExpression()};
      return state && state.home ? state : null;
    })()`,
    "Beta Full Skin after returning from SPA route navigation",
    30000,
  );
  return { publicRoute, taskState, settled, homeState, taskScreenshot };
}

async function exerciseNamedBetaConversation(beta, label, screenshotPath) {
  const opened = await evaluate(beta, `(() => {
    const expected = ${JSON.stringify(label)}.trim().replace(/\\s+/g, " ").toLocaleLowerCase();
    const controls = [...document.querySelectorAll("[data-app-action-sidebar-thread-title], a, button, [role='button']")];
    const matches = controls.filter((control) => {
      const value = (control.textContent || "").trim().replace(/\\s+/g, " ").toLocaleLowerCase();
      const title = (control.getAttribute("data-app-action-sidebar-thread-title") || "")
        .trim().replace(/\\s+/g, " ").toLocaleLowerCase();
      return title === expected || value === expected;
    });
    const target = matches.find((control) =>
      control.getAttribute("data-app-action-sidebar-thread-title")
    ) || matches.sort((left, right) =>
      (left.textContent || "").length - (right.textContent || "").length
    )[0];
    if (!target) return null;
    const rect = target.getBoundingClientRect();
    return {
      label: target.getAttribute("data-app-action-sidebar-thread-title")
        || (target.textContent || "").trim(),
      tagName: target.tagName,
      x: rect.left + Math.min(rect.width * 0.42, 180),
      y: rect.top + rect.height / 2
    };
  })()`);
  invariant(opened, `Could not find the requested Beta conversation: ${label}`);
  await beta.send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x: opened.x,
    y: opened.y,
    button: "left",
    clickCount: 1,
  });
  await beta.send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x: opened.x,
    y: opened.y,
    button: "left",
    clickCount: 1,
  });

  const taskState = await waitFor(
    beta,
    `(() => {
      const state = ${expectedFullSkinStateExpression()};
      return state && state.task && !state.home ? state : null;
    })()`,
    `Beta Full Skin after opening conversation ${label}`,
    30000,
  );
  const baseline = taskState.metrics;
  await delay(1200);
  const settled = await evaluate(beta, expectedFullSkinStateExpression());
  invariant(settled, "Full Skin became unhealthy while the conversation route was settled");
  invariant(
    settled.metrics.ensureCalls - baseline.ensureCalls <= 2,
    "Full Skin performed excessive renderer repair work on a settled conversation route",
  );
  const surfaceProbe = await evaluate(beta, `(() => {
    const points = [
      [Math.round(innerWidth * 0.45), Math.round(innerHeight * 0.34)],
      [Math.round(innerWidth * 0.68), Math.round(innerHeight * 0.34)],
      [Math.round(innerWidth * 0.82), Math.round(innerHeight * 0.58)]
    ];
    return points.map(([x, y]) => ({
      x,
      y,
      stack: document.elementsFromPoint(x, y).slice(0, 7).map((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName,
          id: element.id || null,
          classes: String(element.className || "").slice(0, 240),
          backgroundColor: style.backgroundColor,
          backgroundImage: style.backgroundImage,
          opacity: style.opacity,
          rect: [Math.round(rect.x), Math.round(rect.y), Math.round(rect.width), Math.round(rect.height)]
        };
      })
    }));
  })()`);
  const screenshot = await captureClientScreenshot(beta, screenshotPath);

  const returnedHome = await evaluate(beta, `(() => {
    const labels = ["new chat", "new task", "新聊天", "新任务"];
    const controls = [...document.querySelectorAll("a, button, [role='button']")];
    const target = controls.find((control) => {
      const value = (control.textContent || "").trim().replace(/\\s+/g, " ").toLocaleLowerCase();
      return labels.some((candidate) => value === candidate || value.startsWith(candidate + " "));
    });
    if (!target) return false;
    target.click();
    return true;
  })()`);
  invariant(returnedHome, "Could not return the Beta fixture to New chat after conversation navigation");
  const homeState = await waitFor(
    beta,
    `(() => {
      const state = ${expectedFullSkinStateExpression()};
      return state && state.home ? state : null;
    })()`,
    "Beta Full Skin after returning from conversation navigation",
    30000,
  );
  return { opened, taskState, settled, surfaceProbe, screenshot, homeState };
}

async function runActiveRuntimeSmoke() {
  const endpoint = await discoverBetaTarget(60000, REQUESTED_BETA_PORT);
  const beta = new CdpClient(endpoint.target.webSocketDebuggerUrl, endpoint.port);
  await beta.connect();
  await beta.send("Runtime.enable");
  await beta.send("Page.enable");
  try {
    const initialState = await waitFor(
      beta,
      expectedFullSkinStateExpression(),
      "already-active Beta Full Skin runtime",
      45000,
    );
    const spaNavigation = await exercisePublicBetaRoute(beta, BETA_SCREENSHOT);
    const conversationNavigation = CONVERSATION_LABEL
      ? await exerciseNamedBetaConversation(
        beta,
        CONVERSATION_LABEL,
        CONVERSATION_SCREENSHOT,
      )
      : null;
    const finalState = await evaluate(beta, expectedFullSkinStateExpression());
    invariant(finalState, "Full Skin was not healthy after the active-runtime route round-trip");
    console.log(JSON.stringify({
      status: "COMPLETE",
      scenario: "already-active-persistent-runtime",
      themeId: THEME_ID,
      mode: MODE,
      betaPort: endpoint.port,
      initialState,
      spaNavigation,
      conversationNavigation,
      finalState,
      persistencePreserved: true,
    }, null, 2));
  } finally {
    beta.close();
  }
}

async function runPersistenceSmoke(managerTarget) {
  const manager = new CdpClient(managerTarget.webSocketDebuggerUrl, MANAGER_PORT);
  const seededArt = await seedLocalArt();
  let beta;
  let persistenceDisabled = false;
  await manager.connect();
  await manager.send("Runtime.enable");
  await manager.send("Page.enable");

  try {
    await waitFor(
      manager,
      `document.querySelectorAll("[data-theme-id]").length > 0
        && [...document.querySelectorAll("#targetSelect option")].some((option) => option.value === "beta")`,
      "manager bootstrap",
    );
    const initial = await evaluate(manager, "window.act.getPersistenceState()");
    invariant(
      initial && !initial.enabled && !initial.autostartEnabled,
      "Persistence smoke requires an initially disabled user controller",
    );

    const selected = await evaluate(
      manager,
      `(() => {
        document.querySelector('[data-collection="all"]')?.click();
        const theme = document.querySelector(${JSON.stringify(`[data-theme-id="${THEME_ID}"]`)});
        const mode = document.querySelector(${JSON.stringify(`[data-mode="${MODE}"]`)});
        const target = document.querySelector("#targetSelect");
        if (!theme || !mode || !target) return false;
        theme.click();
        mode.click();
        target.value = "beta";
        target.dispatchEvent(new Event("change", { bubbles: true }));
        window.confirm = () => true;
        const toggle = document.querySelector("#persistenceToggle");
        toggle.checked = true;
        toggle.dispatchEvent(new Event("change", { bubbles: true }));
        return target.value === "beta";
      })()`,
    );
    invariant(selected, "Could not select the persistence fixture");
    const armed = await waitFor(
      manager,
      `window.act.getPersistenceState().then((value) =>
        value.enabled
        && value.autostartEnabled
        && ["starting", "waiting"].includes(value.phase)
      )`,
      "per-user persistence registration",
      30000,
    );
    invariant(armed, "The persistence controller was not armed");

    launchBetaNormally();
    let betaEndpoint;
    try {
      betaEndpoint = await discoverBetaTarget(60000);
    } catch (error) {
      const diagnostic = await evaluate(manager, "window.act.getPersistenceState()");
      throw new Error(`${error.message}; persistence=${JSON.stringify(diagnostic)}`);
    }

    beta = new CdpClient(betaEndpoint.target.webSocketDebuggerUrl, betaEndpoint.port);
    await beta.connect();
    await beta.send("Runtime.enable");
    const betaState = await waitFor(
      beta,
      expectedFullSkinStateExpression(),
      "persistent Beta runtime markers",
      45000,
    );
    invariant(
      betaState.themeId === THEME_ID
        && betaState.mode === MODE
        && betaState.root
        && betaState.style
        && betaState.caption
        && betaState.artwork?.loaded
        && betaState.artwork.width > 0
        && betaState.artwork.height > 0
        && betaState.source
        && betaState.documentBackground,
      "Persistent Beta did not expose the expected full-skin runtime markers",
    );
    const active = await waitFor(
      manager,
      `window.act.getPersistenceState().then((value) =>
        value.enabled && value.autostartEnabled && value.phase === "active"
      )`,
      "active persistence state",
      30000,
    );
    invariant(active, "The persistence controller did not report active");
    const spaNavigation = await exercisePublicBetaRoute(beta);

    const screenshot = await manager.send("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: false,
    });
    const screenshotBytes = Buffer.from(screenshot.data, "base64");
    await writeFile(SCREENSHOT_PATH, screenshotBytes);

    const restoreAvailable = await waitFor(
      manager,
      `document.querySelector("#restoreSkin")?.disabled === false`,
      "persistent restore control",
      30000,
    );
    invariant(restoreAvailable, "Restore Native did not become available for the persistent session");
    await evaluate(manager, "document.querySelector('#restoreSkin').click()");
    const disabled = await waitFor(
      manager,
      `window.act.getPersistenceState().then((value) =>
        !value.enabled && !value.autostartEnabled && value.phase === "disabled"
      )`,
      "persistence disable and login-task cleanup",
      30000,
    );
    persistenceDisabled = Boolean(disabled);
    invariant(persistenceDisabled, "Persistence did not disable cleanly");
    await waitFor(
      beta,
      `!window.__ACT_FULL_SKIN_STATE__
        && !document.documentElement.classList.contains("act-full-skin")
        && !document.getElementById("act-full-skin-style")
        && !document.getElementById("act-full-skin-caption")
        && !document.getElementById("act-full-skin-art")
        && !document.documentElement.style.getPropertyValue("--act-art-image")`,
      "persistent Beta runtime cleanup",
      60000,
    );

    const finalScreenshot = await readFile(SCREENSHOT_PATH);
    console.log(JSON.stringify({
      status: "COMPLETE",
      scenario: "persistent-user-controller",
      themeId: THEME_ID,
      mode: MODE,
      betaState,
      spaNavigation,
      persistenceDisabled,
      seededLocalArt: Boolean(seededArt),
      screenshot: path.relative(ROOT, SCREENSHOT_PATH).replaceAll("\\", "/"),
      screenshotSha256: sha256(finalScreenshot),
      screenshotBytes: finalScreenshot.length,
    }, null, 2));
  } finally {
    if (!persistenceDisabled) {
      try {
        await evaluate(manager, "window.act.disablePersistentTheme()");
      } catch {}
    }
    try {
      await evaluate(manager, "window.act.restoreFullSkin()");
    } catch {}
    if (seededArt?.created) {
      await rm(seededArt.destination, { force: true });
    }
    beta?.close();
    manager.close();
  }
}

async function main() {
  invariant(
    ACTIVE_RUNTIME
      || (Number.isInteger(MANAGER_PORT) && MANAGER_PORT >= 1024 && MANAGER_PORT <= 65535),
    "Pass the OS-selected Theme Manager CDP port with --manager-port or ACT_MANAGER_CDP_PORT",
  );
  invariant(
    REQUESTED_BETA_PORT === 0
      || (Number.isInteger(REQUESTED_BETA_PORT)
        && REQUESTED_BETA_PORT >= 1024
        && REQUESTED_BETA_PORT <= 65535),
    "Invalid Beta port",
  );
  invariant(["light", "dark"].includes(MODE), "Mode must be light or dark");

  if (ACTIVE_RUNTIME) {
    await runActiveRuntimeSmoke();
    return;
  }

  const managerChain = ownerChain(MANAGER_PORT);
  const normalizedManager = MANAGER_EXE.toLocaleLowerCase();
  invariant(
    managerChain.some((item) =>
      String(item.executablePath || "").toLocaleLowerCase() === normalizedManager,
    ),
    "Manager CDP listener does not descend from the pinned manager executable",
  );
  const managerTarget = await pageTarget(MANAGER_PORT, "http://tauri.localhost/");
  if (PERSISTENCE) {
    invariant(APPLY, "--persistence requires --apply");
    await runPersistenceSmoke(managerTarget);
    return;
  }

  if (!APPLY) {
    console.log(JSON.stringify({
      status: "READY",
      managerTarget: { title: managerTarget.title, url: managerTarget.url },
      themeId: THEME_ID,
      mode: MODE,
    }, null, 2));
    return;
  }

  const manager = new CdpClient(managerTarget.webSocketDebuggerUrl, MANAGER_PORT);
  let beta;
  const seededArt = await seedLocalArt();
  await manager.connect();
  await manager.send("Runtime.enable");
  await manager.send("Page.enable");

  if (DEBUG) {
    await delay(1500);
    console.log(JSON.stringify(await evaluate(
      manager,
      `({
        readyState: document.readyState,
        title: document.title,
        body: document.body?.innerText?.slice(0, 2000),
        themes: document.querySelectorAll("[data-theme-id]").length,
        activeCollection: document.querySelector("[data-collection][aria-selected='true']")?.dataset.collection,
        targets: [...document.querySelectorAll("#targetSelect option")].map((option) => ({
          value: option.value,
          text: option.textContent
        })),
        toast: document.querySelector("#toast")?.textContent,
        catalog: document.querySelector("#catalogLabel")?.textContent
      })`,
    ), null, 2));
    manager.close();
    return;
  }

  let restored = false;
  try {
    await waitFor(
      manager,
      `document.querySelectorAll("[data-theme-id]").length > 0
        && [...document.querySelectorAll("#targetSelect option")].some((option) => option.value === "beta")`,
      "manager bootstrap",
    );
    const selected = await evaluate(
      manager,
      `(() => {
        document.querySelector('[data-collection="all"]')?.click();
        const theme = document.querySelector(${JSON.stringify(`[data-theme-id="${THEME_ID}"]`)});
        const mode = document.querySelector(${JSON.stringify(`[data-mode="${MODE}"]`)});
        const target = document.querySelector("#targetSelect");
        if (!theme || !mode || !target) return false;
        theme.click();
        mode.click();
        target.value = "beta";
        target.dispatchEvent(new Event("change", { bubbles: true }));
        return target.value === "beta";
      })()`,
    );
    invariant(selected, "Could not select the requested manager fixture");
    await evaluate(manager, "document.querySelector('#applySkin').click()");
    const outcome = await waitFor(
      manager,
      `window.act.getSkinState().then((skin) => {
        const toast = document.querySelector("#toast");
        if (skin?.active
          && skin.channel === "beta"
          && skin.themeId === ${JSON.stringify(THEME_ID)}
          && skin.mode === ${JSON.stringify(MODE)}) {
          return { skin };
        }
        if (toast?.dataset.tone === "error" && toast.classList.contains("is-visible")) {
          return { error: toast.textContent };
        }
        return null;
      })`,
      "manager apply result",
      45000,
    );
    invariant(!outcome.error, "Manager apply failed: " + outcome.error);

    const betaEndpoint = await discoverBetaTarget(30000, outcome.skin.port);
    beta = new CdpClient(betaEndpoint.target.webSocketDebuggerUrl, betaEndpoint.port);
    await beta.connect();
    await beta.send("Runtime.enable");
    await beta.send("Page.enable");
    const betaState = await waitFor(
      beta,
      expectedFullSkinStateExpression(),
      "Beta Full Skin runtime markers",
      45000,
    );
    await beta.send("Page.reload", { ignoreCache: true });
    const reloadedBetaState = await waitFor(
      beta,
      expectedFullSkinStateExpression(),
      "Beta Full Skin after document navigation",
      45000,
    );
    const spaNavigation = await exercisePublicBetaRoute(beta);

    const screenshot = await manager.send("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: false,
    });
    const screenshotBytes = Buffer.from(screenshot.data, "base64");
    await writeFile(SCREENSHOT_PATH, screenshotBytes);

    await evaluate(manager, "document.querySelector('#restoreSkin').click()");
    await waitFor(
      manager,
      "window.act.getSkinState().then((skin) => !skin?.active)",
      "manager restore result",
    );
    const betaRestored = await waitFor(
      beta,
      `!window.__ACT_FULL_SKIN_STATE__
        && !document.documentElement.classList.contains("act-full-skin")
        && !document.getElementById("act-full-skin-style")
        && !document.getElementById("act-full-skin-caption")
        && !document.getElementById("act-full-skin-art")
        && !document.documentElement.style.getPropertyValue("--act-art-image")`,
      "Beta runtime cleanup",
    );
    restored = Boolean(betaRestored);

    const finalScreenshot = await readFile(SCREENSHOT_PATH);
    console.log(JSON.stringify({
      status: "COMPLETE",
      themeId: THEME_ID,
      mode: MODE,
      managerVersion: await evaluate(manager, "window.__TAURI_INTERNALS__ ? 'tauri-v2' : 'unknown'"),
      betaState,
      reloadedBetaState,
      spaNavigation,
      restored,
      seededLocalArt: Boolean(seededArt),
      screenshot: path.relative(ROOT, SCREENSHOT_PATH).replaceAll("\\", "/"),
      screenshotSha256: sha256(finalScreenshot),
      screenshotBytes: finalScreenshot.length,
    }, null, 2));
  } finally {
    if (!restored) {
      try {
        await evaluate(manager, "window.act.restoreFullSkin()");
      } catch {}
    }
    if (seededArt?.created) {
      await rm(seededArt.destination, { force: true });
    }
    manager.close();
    beta?.close();
  }
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error.message);
    process.exit(1);
  },
);
