import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RUNTIME = await readFile(path.join(ROOT, "packages", "full-skin", "runtime.js"), "utf8");

class FakeStyle {
  constructor() {
    this.values = new Map();
  }

  setProperty(name, value) {
    this.values.set(name, String(value));
  }

  getPropertyValue(name) {
    return this.values.get(name) || "";
  }

  removeProperty(name) {
    this.values.delete(name);
  }

  [Symbol.iterator]() {
    return this.values.keys();
  }
}

class FakeClassList {
  constructor() {
    this.values = new Set();
  }

  add(...names) {
    for (const name of names) this.values.add(name);
  }

  remove(...names) {
    for (const name of names) this.values.delete(name);
  }

  contains(name) {
    return this.values.has(name);
  }

  toggle(name, force) {
    const enabled = force === undefined ? !this.values.has(name) : Boolean(force);
    if (enabled) this.values.add(name);
    else this.values.delete(name);
    return enabled;
  }
}

class FakeElement {
  constructor(document, tagName) {
    this.ownerDocument = document;
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.parentElement = null;
    this.classList = new FakeClassList();
    this.dataset = {};
    this.style = new FakeStyle();
    this.hidden = false;
    this.textContent = "";
    this.attributes = new Map();
  }

  append(...children) {
    for (const child of children) this.appendChild(child);
  }

  appendChild(child) {
    child.remove();
    child.parentElement = this;
    this.children.push(child);
    this.ownerDocument.register(child);
    return child;
  }

  prepend(child) {
    child.remove();
    child.parentElement = this;
    this.children.unshift(child);
    this.ownerDocument.register(child);
  }

  replaceChildren(...children) {
    for (const child of [...this.children]) child.remove();
    this.children = [];
    this.append(...children);
  }

  remove() {
    if (this.parentElement) {
      this.parentElement.children = this.parentElement.children.filter((child) => child !== this);
    }
    this.parentElement = null;
    this.ownerDocument.unregister(this);
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }
}

class FakeImageElement extends FakeElement {
  constructor(document) {
    super(document, "img");
    this.complete = true;
    this.naturalWidth = 32;
    this.naturalHeight = 18;
    this.currentSrc = "";
  }

  set src(value) {
    this.currentSrc = String(value);
  }

  get src() {
    return this.currentSrc;
  }

  addEventListener() {}
  removeEventListener() {}
}

function createFixture() {
  const byId = new Map();
  const observers = [];
  const intervals = new Map();
  const revoked = [];
  let blobSequence = 0;
  let intervalSequence = 0;
  let home = true;

  const document = {
    readyState: "complete",
    register(element) {
      if (element.id) byId.set(element.id, element);
      for (const child of element.children) this.register(child);
    },
    unregister(element) {
      if (element.id && byId.get(element.id) === element) byId.delete(element.id);
      for (const child of element.children) this.unregister(child);
    },
    createElement(tagName) {
      return tagName.toLowerCase() === "img"
        ? new FakeImageElement(this)
        : new FakeElement(this, tagName);
    },
    getElementById(id) {
      return byId.get(id) || null;
    },
    querySelector(selector) {
      if (selector.includes("home-suggestions") || selector.includes("home-icon")) {
        return home ? main : null;
      }
      if (selector.includes("main.main-surface") || selector === "main" || selector.includes("[role='main']")) {
        return main;
      }
      return null;
    },
    querySelectorAll(selector) {
      if (selector === "[role='main']") return [main];
      if (selector.includes("h1, h2")) return [];
      return [];
    },
    addEventListener() {},
  };
  document.documentElement = new FakeElement(document, "html");
  document.head = new FakeElement(document, "head");
  document.body = new FakeElement(document, "body");
  document.documentElement.append(document.head, document.body);
  const main = new FakeElement(document, "main");
  main.classList.add("main-surface");
  main.setAttribute("role", "main");
  document.body.append(main);

  class FakeMutationObserver {
    constructor(callback) {
      this.callback = callback;
      this.disconnected = false;
      observers.push(this);
    }

    observe() {}

    disconnect() {
      this.disconnected = true;
    }

    trigger() {
      if (!this.disconnected) this.callback([]);
    }
  }

  class PreloadImage {
    constructor() {
      this.complete = true;
      this.naturalWidth = 2560;
      this.naturalHeight = 1440;
    }

    set src(value) {
      this.currentSrc = String(value);
    }

    async decode() {}
    addEventListener() {}
    removeEventListener() {}
  }

  const context = vm.createContext({
    atob,
    Blob,
    clearInterval(id) {
      intervals.delete(id);
    },
    clearTimeout,
    console,
    document,
    getComputedStyle(element) {
      if (element === document.body) {
        return {
          backgroundImage: document.documentElement.style.getPropertyValue("--act-art-image"),
        };
      }
      return { position: "fixed" };
    },
    HTMLImageElement: FakeImageElement,
    Image: PreloadImage,
    MutationObserver: FakeMutationObserver,
    setInterval(callback, milliseconds) {
      const id = ++intervalSequence;
      intervals.set(id, { callback, milliseconds });
      return id;
    },
    setTimeout,
    Uint8Array,
    URL: {
      createObjectURL() {
        blobSequence += 1;
        return `blob:act-runtime-${blobSequence}`;
      },
      revokeObjectURL(value) {
        revoked.push(String(value));
      },
    },
  });
  context.window = context;

  return {
    context,
    document,
    intervals,
    observers,
    revoked,
    setHome(value) {
      home = Boolean(value);
    },
  };
}

function expandedRuntime(themeId) {
  const theme = {
    id: themeId,
    mode: "dark",
    name: `Theme ${themeId}`,
    tagline: "A stable route-spanning skin",
    art: { focusX: 0.72, focusY: 0.45, safeArea: "left" },
    tokens: {
      background: "#101010",
      surface: "#181818",
      surfaceAlt: "#202020",
      text: "#f5f5f5",
      muted: "#b8b8b8",
      accent: "#d4a94a",
      accentContrast: "#101010",
      border: "#555555",
    },
  };
  return RUNTIME
    .replace("__ACT_THEME_JSON__", JSON.stringify(theme))
    .replace("__ACT_CSS_JSON__", JSON.stringify("html.act-full-skin body { background-image: var(--act-art-image); }"))
    .replace("__ACT_IMAGE_JSON__", JSON.stringify("data:image/png;base64,iVBORw0KGgo="));
}

async function execute(fixture, themeId) {
  return vm.runInContext(expandedRuntime(themeId), fixture.context, { timeout: 2000 });
}

test("Full Skin uses a Blob-backed document background instead of a removable image node", async function () {
  const fixture = createFixture();
  const result = await execute(fixture, "route-stable");
  const state = fixture.context.__ACT_FULL_SKIN_STATE__;

  assert.equal(result.pass, true);
  assert.equal(result.version, "act-full-skin-v1");
  assert.equal(result.implementationVersion, "act-full-skin-runtime-v2");
  assert.equal(fixture.document.getElementById("act-full-skin-art"), null);
  assert.match(fixture.document.documentElement.style.getPropertyValue("--act-art-image"), /^url\("blob:act-runtime-1"\)$/);
  assert.equal(state.artwork.loaded, true);
  assert.equal(state.artwork.width, 2560);
  assert.equal(state.artwork.height, 1440);
  assert.equal(fixture.intervals.size, 1);
});

test("Full Skin coalesces a mutation storm and repairs route-owned markers once", async function () {
  const fixture = createFixture();
  await execute(fixture, "coalesced");
  const state = fixture.context.__ACT_FULL_SKIN_STATE__;
  const initialEnsures = state.metrics.ensureCalls;
  fixture.setHome(false);

  for (let index = 0; index < 50; index += 1) fixture.observers.at(-1).trigger();
  await new Promise((resolve) => setTimeout(resolve, 260));

  assert.equal(state.metrics.mutationCallbacks, 50);
  assert.equal(state.metrics.scheduledEnsures, 1);
  assert.equal(state.metrics.ensureCalls, initialEnsures + 1);
  assert.equal(fixture.document.documentElement.classList.contains("act-full-skin-home"), false);
  assert.equal(fixture.document.documentElement.classList.contains("act-full-skin-task"), true);

  const settledEnsures = state.metrics.ensureCalls;
  const settledSchedules = state.metrics.scheduledEnsures;
  for (let index = 0; index < 50; index += 1) fixture.observers.at(-1).trigger();
  await new Promise((resolve) => setTimeout(resolve, 260));
  assert.equal(state.metrics.ensureCalls, settledEnsures);
  assert.equal(state.metrics.scheduledEnsures, settledSchedules);
});

test("A retired runtime cannot clean up a newer theme", async function () {
  const fixture = createFixture();
  await execute(fixture, "first");
  const first = fixture.context.__ACT_FULL_SKIN_STATE__;
  await execute(fixture, "second");
  const second = fixture.context.__ACT_FULL_SKIN_STATE__;

  assert.notEqual(first, second);
  assert.equal(first.cleanup(), false);
  assert.equal(fixture.context.__ACT_FULL_SKIN_STATE__.themeId, "second");
  assert.equal(fixture.document.documentElement.classList.contains("act-full-skin"), true);
  assert.deepEqual(fixture.revoked, ["blob:act-runtime-1"]);
});
