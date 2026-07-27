;(async () => {
  const theme = __ACT_THEME_JSON__;
  const cssText = __ACT_CSS_JSON__;
  const imageData = __ACT_IMAGE_JSON__;
  const version = "act-full-skin-v1";
  const implementationVersion = "act-full-skin-runtime-v3";
  const stateKey = "__ACT_FULL_SKIN_STATE__";
  const pendingKey = "__ACT_FULL_SKIN_PENDING__";
  const installToken = {};
  const root = document.documentElement;
  const mainSelector = "main.main-surface, main, [role='main']";

  if (!document.body) {
    await new Promise((resolve) => {
      document.addEventListener("DOMContentLoaded", resolve, { once: true });
    });
  }

  const comma = imageData.indexOf(",");
  if (!imageData.startsWith("data:image/png;base64,") || comma < 0) {
    throw new Error("ACT full-skin image payload is invalid");
  }

  const previous = window[stateKey];
  window[pendingKey] = installToken;

  const binary = atob(imageData.slice(comma + 1));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  const artUrl = URL.createObjectURL(new Blob([bytes], { type: "image/png" }));

  const loadArtwork = () => new Promise((resolve) => {
    if (typeof Image !== "function") {
      resolve({ loaded: true, width: 0, height: 0 });
      return;
    }
    const image = new Image();
    let settled = false;
    let timeout;
    const finish = (loaded) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      image.removeEventListener?.("load", onLoad);
      image.removeEventListener?.("error", onError);
      resolve({
        loaded,
        width: loaded ? image.naturalWidth : 0,
        height: loaded ? image.naturalHeight : 0,
      });
    };
    const valid = () => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0;
    const onLoad = () => finish(valid());
    const onError = () => finish(false);
    image.addEventListener?.("load", onLoad, { once: true });
    image.addEventListener?.("error", onError, { once: true });
    timeout = setTimeout(() => finish(valid()), 8000);
    image.src = artUrl;
    if (valid()) {
      finish(true);
      return;
    }
    image.decode?.().then(() => finish(valid()), () => {});
  });

  const artwork = await loadArtwork();
  if (window[pendingKey] !== installToken) {
    URL.revokeObjectURL(artUrl);
    return {
      pass: false,
      cancelled: true,
      version,
      implementationVersion,
      themeId: theme.id,
      mode: theme.mode,
    };
  }
  if (!artwork.loaded) {
    URL.revokeObjectURL(artUrl);
    delete window[pendingKey];
    throw new Error("ACT full-skin artwork could not be loaded");
  }

  if (previous?.cleanup && typeof previous.retire !== "function") {
    previous.cleanup();
  }

  let observer;
  let observerRoot;
  let ensureTimer;
  let fallbackTimer;
  let retired = false;
  const metrics = {
    ensureCalls: 0,
    mutationCallbacks: 0,
    relevantMutationCallbacks: 0,
    ignoredMutationCallbacks: 0,
    scheduledReconciles: 0,
    fallbackHealthChecks: 0,
    healthChecks: 0,
    observerReconnects: 0,
    ensureDurationMs: 0,
    lastEnsureDurationMs: 0,
  };

  const now = () => typeof globalThis.performance?.now === "function"
    ? globalThis.performance.now()
    : Date.now();

  const applyRoot = () => {
    root.classList.add("act-full-skin");
    root.dataset.actTheme = theme.id;
    root.dataset.actMode = theme.mode;
    root.dataset.actSafeArea = theme.art.safeArea;
    root.style.setProperty("--act-color-scheme", theme.mode);
    root.style.setProperty("--act-art-image", `url("${artUrl}")`);
    root.style.setProperty(
      "--act-art-position",
      `${Math.round(theme.art.focusX * 100)}% ${Math.round(theme.art.focusY * 100)}%`,
    );
    for (const [name, value] of Object.entries(theme.tokens)) {
      root.style.setProperty(
        `--act-${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`,
        value,
      );
    }
  };

  const ensureStyle = () => {
    let style = document.getElementById("act-full-skin-style");
    if (!style) {
      style = document.createElement("style");
      style.id = "act-full-skin-style";
      (document.head || root).append(style);
    }
    if (style.textContent !== cssText) style.textContent = cssText;
    return style;
  };

  const ensureCaption = () => {
    let caption = document.getElementById("act-full-skin-caption");
    if (!caption || caption.parentElement !== document.body) {
      caption?.remove();
      caption = document.createElement("section");
      caption.id = "act-full-skin-caption";
      caption.setAttribute("aria-hidden", "true");
      document.body.append(caption);
    }
    if (caption.dataset.actTheme !== theme.id) {
      const brand = document.createElement("small");
      brand.textContent = "AWESOME CODEX THEME";
      const title = document.createElement("strong");
      title.textContent = theme.name;
      const tagline = document.createElement("span");
      tagline.textContent = theme.tagline;
      caption.replaceChildren(brand, title, tagline);
      caption.dataset.actTheme = theme.id;
    }
    return caption;
  };

  const detectHome = () => Boolean(
    document.querySelector("[role='main']:has([data-testid='home-icon'])")
    || document.querySelector(".group\\/home-suggestions, [class*='home-suggestions']")
    || [...document.querySelectorAll("h1, h2, [class*='title']")].some((node) =>
      /what should we build|what should we code|what should we work on(?: in workspace)?|let.?s build|我们应该构建什么|我们该构建什么/.test(
        node.textContent.trim().toLocaleLowerCase(),
      )),
  );

  const runtimeMissing = () => {
    const style = document.getElementById("act-full-skin-style");
    const caption = document.getElementById("act-full-skin-caption");
    return !root.classList.contains("act-full-skin")
      || style?.textContent !== cssText
      || caption?.parentElement !== document.body
      || !root.style.getPropertyValue("--act-art-image").includes(artUrl);
  };

  const routeState = () => {
    const hasMainSurface = Boolean(document.querySelector(mainSelector));
    const home = hasMainSurface && detectHome();
    return { hasMainSurface, home };
  };

  const routeChanged = ({ hasMainSurface, home }) => (
    root.classList.contains("act-full-skin-home") !== home
    || root.classList.contains("act-full-skin-task") !== (hasMainSurface && !home)
  );

  const nodeMatches = (node, selector) => Boolean(
    node
    && (node.id === "act-full-skin-style" || node.id === "act-full-skin-caption"
      || node.tagName === "BODY"
      || node.matches?.(selector)
      || node.querySelector?.(selector)),
  );

  const mutationMayAffectRuntime = (records) => records.some((record) => {
    if (record.type !== "childList") return false;
    const nodes = [...record.addedNodes, ...record.removedNodes];
    return nodes.some((node) => nodeMatches(
      node,
      "main.main-surface, main, [role='main'], [data-testid='home-icon'], .group\\/home-suggestions, [class*='home-suggestions'], h1, h2, [class*='title'], #act-full-skin-style, #act-full-skin-caption",
    ));
  });

  const ensure = () => {
    if (retired || window[stateKey]?.installToken !== installToken || !document.body) return false;
    const startedAt = now();
    metrics.ensureCalls += 1;
    applyRoot();
    ensureStyle();
    const caption = ensureCaption();
    const { hasMainSurface, home } = routeState();
    root.classList.toggle("act-full-skin-home", home);
    root.classList.toggle("act-full-skin-task", hasMainSurface && !home);
    caption.hidden = !home;
    metrics.lastEnsureDurationMs = now() - startedAt;
    metrics.ensureDurationMs += metrics.lastEnsureDurationMs;
    return true;
  };

  const stopWatchers = () => {
    observer?.disconnect();
    observerRoot = undefined;
    clearTimeout(ensureTimer);
    clearInterval(fallbackTimer);
  };

  const retire = () => {
    if (retired) return false;
    retired = true;
    stopWatchers();
    URL.revokeObjectURL(artUrl);
    return true;
  };

  const cleanup = () => {
    if (window[stateKey]?.installToken !== installToken) return false;
    retire();
    document.getElementById("act-full-skin-style")?.remove();
    document.getElementById("act-full-skin-caption")?.remove();
    document.getElementById("act-full-skin-art")?.remove();
    root.classList.remove("act-full-skin", "act-full-skin-home", "act-full-skin-task");
    delete root.dataset.actTheme;
    delete root.dataset.actMode;
    delete root.dataset.actSafeArea;
    for (const property of [...root.style]) {
      if (property.startsWith("--act-")) root.style.removeProperty(property);
    }
    delete window[stateKey];
    if (window[pendingKey] === installToken) delete window[pendingKey];
    return true;
  };

  const reconcile = () => {
    if (retired || window[stateKey]?.installToken !== installToken || !document.body) return false;
    metrics.healthChecks += 1;
    const nextRoute = routeState();
    const needsRepair = runtimeMissing() || routeChanged(nextRoute);
    if (needsRepair) ensure();
    if (observerRoot !== document.body) watchDocument();
    return needsRepair;
  };

  const scheduleReconcile = () => {
    clearTimeout(ensureTimer);
    ensureTimer = setTimeout(() => {
      ensureTimer = undefined;
      metrics.scheduledReconciles += 1;
      reconcile();
    }, 180);
  };

  const onMutations = (records) => {
    metrics.mutationCallbacks += 1;
    if (!mutationMayAffectRuntime(records)) {
      metrics.ignoredMutationCallbacks += 1;
      return;
    }
    metrics.relevantMutationCallbacks += 1;
    scheduleReconcile();
  };

  const watchDocument = () => {
    const nextRoot = document.body || root;
    if (observer && observerRoot === nextRoot) return;
    observer?.disconnect();
    observer = new MutationObserver(onMutations);
    observer.observe(nextRoot, { childList: true, subtree: true });
    observerRoot = nextRoot;
    metrics.observerReconnects += 1;
    state.observer = observer;
  };

  const state = {
    version,
    implementationVersion,
    themeId: theme.id,
    mode: theme.mode,
    installToken,
    artUrl,
    artwork,
    metrics,
    ensure,
    reconcile,
    retire,
    cleanup,
  };
  window[stateKey] = state;
  previous?.retire?.();
  ensure();
  watchDocument();
  fallbackTimer = setInterval(() => {
    metrics.fallbackHealthChecks += 1;
    reconcile();
  }, 5000);
  state.fallbackTimer = fallbackTimer;
  delete window[pendingKey];

  const artValue = root.style.getPropertyValue("--act-art-image");
  const bodyBackground = getComputedStyle(document.body).backgroundImage;
  return {
    pass: Boolean(
      root.classList.contains("act-full-skin")
      && document.getElementById("act-full-skin-style")
      && document.getElementById("act-full-skin-caption")
      && artValue.includes(artUrl)
      && bodyBackground.includes(artUrl)
      && window[stateKey]?.installToken === installToken
    ),
    version,
    implementationVersion,
    themeId: theme.id,
    mode: theme.mode,
    home: root.classList.contains("act-full-skin-home"),
    artwork,
    metrics: { ...metrics },
    selectors: {
      sidebar: Boolean(document.querySelector("aside.app-shell-left-panel")),
      composer: Boolean(document.querySelector(".composer-surface-chrome")),
      main: Boolean(document.querySelector(mainSelector)),
    },
  };
})()
