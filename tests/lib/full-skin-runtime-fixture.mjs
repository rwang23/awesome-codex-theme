import vm from "node:vm";

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

  includes(fragment) {
    return [...this.values].some((name) => name.includes(fragment));
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
    this.id = "";
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
    const normalized = String(value);
    this.attributes.set(name, normalized);
    if (name === "id") this.id = normalized;
  }

  getAttribute(name) {
    return this.attributes.get(name) || null;
  }

  matches(selector) {
    return selector.split(",").some((candidate) => {
      const value = candidate.trim();
      if (!value) return false;
      if (value.startsWith("#")) return this.id === value.slice(1);
      if (value === "main") return this.tagName === "MAIN";
      if (value.includes("main.main-surface")) {
        return this.tagName === "MAIN" && this.classList.contains("main-surface");
      }
      if (value.includes("[role='main']") || value.includes('[role="main"]')) {
        return this.getAttribute("role") === "main";
      }
      if (value.includes("[data-testid='home-icon']")) {
        return this.getAttribute("data-testid") === "home-icon";
      }
      if (value.includes("home-suggestions")) return this.classList.includes("home-suggestions");
      if (value === "h1" || value === "h2") return this.tagName === value.toUpperCase();
      if (value.includes("[class*='title']") || value.includes('[class*="title"]')) {
        return this.classList.includes("title");
      }
      return false;
    });
  }

  querySelector(selector) {
    if (this.matches(selector)) return this;
    for (const child of this.children) {
      const match = child.querySelector(selector);
      if (match) return match;
    }
    return null;
  }

  querySelectorAll(selector) {
    const matches = [];
    if (this.matches(selector)) matches.push(this);
    for (const child of this.children) matches.push(...child.querySelectorAll(selector));
    return matches;
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

export function createFixture() {
  const byId = new Map();
  const observers = [];
  const intervals = new Map();
  const revoked = [];
  let blobSequence = 0;
  let intervalSequence = 0;
  let home = true;
  let main;

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
      if (selector.includes(":has([data-testid='home-icon'])")) return home ? main : null;
      if (selector.includes("home-suggestions")) return home ? main : null;
      if (selector.includes("main.main-surface") || selector === "main" || selector.includes("[role='main']")) {
        return main;
      }
      return this.documentElement.querySelector(selector);
    },
    querySelectorAll(selector) {
      if (selector === "[role='main']") return main ? [main] : [];
      if (selector.includes("h1, h2")) return [];
      return this.documentElement.querySelectorAll(selector);
    },
    addEventListener() {},
  };
  document.documentElement = new FakeElement(document, "html");
  document.head = new FakeElement(document, "head");
  document.body = new FakeElement(document, "body");
  document.documentElement.append(document.head, document.body);

  const createMain = () => {
    const element = new FakeElement(document, "main");
    element.classList.add("main-surface");
    element.setAttribute("role", "main");
    return element;
  };
  main = createMain();
  document.body.append(main);

  class FakeMutationObserver {
    constructor(callback) {
      this.callback = callback;
      this.disconnected = false;
      this.target = null;
      this.options = null;
      observers.push(this);
    }

    observe(target, options) {
      this.target = target;
      this.options = { ...options };
    }

    disconnect() {
      this.disconnected = true;
    }

    trigger(records = []) {
      if (!this.disconnected) this.callback(records);
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

  const activeObserver = () => observers.at(-1);
  const trigger = (record) => activeObserver()?.trigger([record]);

  return {
    context,
    document,
    intervals,
    observers,
    revoked,
    get main() {
      return main;
    },
    setHome(value) {
      home = Boolean(value);
    },
    emitOutputMutation() {
      const output = document.createElement("div");
      output.classList.add("streaming-output");
      trigger({ type: "childList", target: main, addedNodes: [output], removedNodes: [] });
    },
    emitRouteMutation() {
      const marker = document.createElement(home ? "div" : "h1");
      if (home) marker.setAttribute("data-testid", "home-icon");
      trigger({ type: "childList", target: main, addedNodes: home ? [marker] : [], removedNodes: home ? [] : [marker] });
    },
    replaceMain(nextHome) {
      const previous = main;
      const replacement = createMain();
      document.body.append(replacement);
      previous.remove();
      main = replacement;
      home = Boolean(nextHome);
      trigger({ type: "childList", target: document.body, addedNodes: [replacement], removedNodes: [previous] });
    },
    replaceBody(nextHome) {
      const previous = document.body;
      const replacement = new FakeElement(document, "body");
      previous.remove();
      document.documentElement.append(replacement);
      document.body = replacement;
      main = createMain();
      replacement.append(main);
      home = Boolean(nextHome);
    },
    runIntervals() {
      for (const entry of [...intervals.values()]) entry.callback();
    },
  };
}

export function expandedRuntime(runtime, themeId, cssText = "html.act-full-skin body { background-image: var(--act-art-image); }") {
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
  return runtime
    .replace("__ACT_THEME_JSON__", JSON.stringify(theme))
    .replace("__ACT_CSS_JSON__", JSON.stringify(cssText))
    .replace("__ACT_IMAGE_JSON__", JSON.stringify("data:image/png;base64,iVBORw0KGgo="));
}

export async function executeRuntime(runtime, fixture, themeId) {
  return vm.runInContext(expandedRuntime(runtime, themeId), fixture.context, { timeout: 2000 });
}
