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
const SEED_LOCAL_ART = process.argv.includes("--seed-local-art");
const MANAGER_PORT = Number(argumentValue("--manager-port") || process.env.ACT_MANAGER_CDP_PORT || "0");
const REQUESTED_BETA_PORT = Number(argumentValue("--beta-port") || "0");
const THEME_ID = argumentValue("--theme") || "qinglan-odyssey";
const MODE = argumentValue("--mode") || "dark";
const MANAGER_EXE = path.resolve(
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
  const command = [
    "$connection = Get-NetTCPConnection -State Listen -LocalPort " + port + " -ErrorAction Stop | Select-Object -First 1",
    "$items = @()",
    "$processId = [int]$connection.OwningProcess",
    "for ($depth = 0; $depth -lt 6 -and $processId -gt 0; $depth += 1) {",
    "  $process = Get-CimInstance Win32_Process -Filter \"ProcessId = $processId\"",
    "  if (-not $process) { break }",
    "  $items += [PSCustomObject]@{ processId = $process.ProcessId; parentProcessId = $process.ParentProcessId; name = $process.Name; executablePath = $process.ExecutablePath; commandLine = $process.CommandLine }",
    "  $processId = [int]$process.ParentProcessId",
    "}",
    "ConvertTo-Json -InputObject @($items) -Compress",
  ].join("; ");
  const output = execFileSync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-Command", command],
    { encoding: "utf8", windowsHide: true },
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
    "$process = Get-Process -Id $ownerPid -ErrorAction Stop",
    "[PSCustomObject]@{ processId = $ownerPid; name = $process.ProcessName; executablePath = $process.Path } | ConvertTo-Json -Compress",
  ].join("; ");
  return JSON.parse(execFileSync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-Command", command],
    { encoding: "utf8", windowsHide: true },
  ).trim());
}

function betaRuntimeCandidates() {
  const command = [
    "$items = Get-CimInstance Win32_Process |",
    "  Where-Object { $_.Name -eq 'ChatGPT (Beta).exe' -and $_.ExecutablePath -and $_.CommandLine -and $_.CommandLine -notmatch '--type=' } |",
    "  ForEach-Object { [PSCustomObject]@{ processId = $_.ProcessId; executablePath = $_.ExecutablePath; commandLine = $_.CommandLine } };",
    "ConvertTo-Json -InputObject @($items) -Compress",
  ].join(" ");
  const output = execFileSync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-Command", command],
    { encoding: "utf8", windowsHide: true },
  ).trim();
  if (!output) return [];
  const parsed = JSON.parse(output);
  return Array.isArray(parsed) ? parsed : [parsed];
}

async function discoverBetaTarget(timeout = 60000) {
  const startedAt = Date.now();
  let lastError;
  while (Date.now() - startedAt < timeout) {
    try {
      const candidates = REQUESTED_BETA_PORT
        ? [{ commandLine: `--remote-debugging-port=${REQUESTED_BETA_PORT}` }]
        : betaRuntimeCandidates();
      for (const candidate of candidates) {
        try {
          const match = /--remote-debugging-port=(\d+)/.exec(candidate.commandLine || "");
          if (!match) continue;
          const port = Number(match[1]);
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
      `(() => {
        const value = window.__ACT_FULL_SKIN_STATE__;
        if (!value) return null;
        return {
          themeId: value.themeId,
          mode: value.mode,
          root: document.documentElement.classList.contains("act-full-skin"),
          style: Boolean(document.getElementById("act-full-skin-style")),
          caption: Boolean(document.getElementById("act-full-skin-caption"))
        };
      })()`,
      "persistent Beta runtime markers",
      45000,
    );
    invariant(
      betaState.themeId === THEME_ID
        && betaState.mode === MODE
        && betaState.root
        && betaState.style
        && betaState.caption,
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
        && !document.getElementById("act-full-skin-caption")`,
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
    Number.isInteger(MANAGER_PORT) && MANAGER_PORT >= 1024 && MANAGER_PORT <= 65535,
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
      `(() => {
        const status = document.querySelector("#skinStatus")?.textContent || "";
        const toast = document.querySelector("#toast");
        if (toast?.dataset.tone === "error" && toast.classList.contains("is-visible")) {
          return { error: toast.textContent };
        }
        if (status.includes("ChatGPT Beta") && status.includes(${JSON.stringify(THEME_ID)})
          && status.includes(${JSON.stringify(MODE)})) {
          return { status };
        }
        return null;
      })()`,
      "manager apply result",
      45000,
    );
    invariant(!outcome.error, "Manager apply failed: " + outcome.error);

    const betaEndpoint = await discoverBetaTarget(30000);
    beta = new CdpClient(betaEndpoint.target.webSocketDebuggerUrl, betaEndpoint.port);
    await beta.connect();
    await beta.send("Runtime.enable");
    const betaState = await evaluate(
      beta,
      `({
        themeId: window.__ACT_FULL_SKIN_STATE__?.themeId,
        mode: window.__ACT_FULL_SKIN_STATE__?.mode,
        root: document.documentElement.classList.contains("act-full-skin"),
        style: Boolean(document.getElementById("act-full-skin-style")),
        caption: Boolean(document.getElementById("act-full-skin-caption"))
      })`,
    );
    invariant(
      betaState.themeId === THEME_ID
        && betaState.mode === MODE
        && betaState.root
        && betaState.style
        && betaState.caption,
      "Beta did not expose the expected full-skin runtime markers",
    );

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
      `!document.querySelector("#skinStatus")?.textContent.includes("正在 ChatGPT Beta 使用")`,
      "manager restore result",
    );
    const betaRestored = await waitFor(
      beta,
      `!window.__ACT_FULL_SKIN_STATE__
        && !document.documentElement.classList.contains("act-full-skin")
        && !document.getElementById("act-full-skin-style")
        && !document.getElementById("act-full-skin-caption")`,
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
