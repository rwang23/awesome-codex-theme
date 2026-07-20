;(async () => {
  const theme = __ACT_THEME_JSON__;
  const cssText = __ACT_CSS_JSON__;
  const imageData = __ACT_IMAGE_JSON__;
  const version = "act-full-skin-v1";
  const root = document.documentElement;

  if (window.__ACT_FULL_SKIN_STATE__?.cleanup) {
    window.__ACT_FULL_SKIN_STATE__.cleanup();
  }

  const comma = imageData.indexOf(",");
  if (!imageData.startsWith("data:image/png;base64,") || comma < 0) {
    throw new Error("ACT full-skin image payload is invalid");
  }
  const mainSelector = "main.main-surface, [role='main']";

  const style = document.createElement("style");
  style.id = "act-full-skin-style";
  style.textContent = cssText;
  (document.head || root).append(style);

  const caption = document.createElement("section");
  caption.id = "act-full-skin-caption";
  caption.setAttribute("aria-hidden", "true");
  const brand = document.createElement("small");
  brand.textContent = "AWESOME CODEX THEME";
  const title = document.createElement("strong");
  title.textContent = theme.name;
  const tagline = document.createElement("span");
  tagline.textContent = theme.tagline;
  caption.append(brand, title, tagline);
  document.body.append(caption);

  root.classList.add("act-full-skin");
  root.dataset.actTheme = theme.id;
  root.dataset.actMode = theme.mode;
  root.dataset.actSafeArea = theme.art.safeArea;
  root.style.setProperty("--act-color-scheme", theme.mode);
  root.style.setProperty(
    "--act-art-position",
    `${Math.round(theme.art.focusX * 100)}% ${Math.round(theme.art.focusY * 100)}%`,
  );
  for (const [name, value] of Object.entries(theme.tokens)) {
    root.style.setProperty(`--act-${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`, value);
  }

  let observer;
  let syncTimer;
  const ensureArtLayer = () => {
    const artHost = document.body;
    if (!artHost) return null;

    let art = document.getElementById("act-full-skin-art");
    if (!(art instanceof HTMLImageElement)) {
      art?.remove();
      art = document.createElement("img");
      art.id = "act-full-skin-art";
      art.alt = "";
      art.draggable = false;
      art.decoding = "async";
      art.setAttribute("aria-hidden", "true");
      art.src = imageData;
    }
    if (art.parentElement !== artHost) artHost.prepend(art);
    return art;
  };
  const waitForArtLayer = async () => {
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline) {
      const art = ensureArtLayer();
      if (!art) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        continue;
      }
      if (art.complete) {
        if (art.naturalWidth > 0 && art.naturalHeight > 0) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return true;
        }
        return false;
      }
      const loaded = await new Promise((resolve) => {
        let timeout;
        const finish = (value) => {
          clearTimeout(timeout);
          art.removeEventListener("load", onLoad);
          art.removeEventListener("error", onError);
          resolve(value);
        };
        const onLoad = () => finish(art.naturalWidth > 0 && art.naturalHeight > 0);
        const onError = () => finish(false);
        art.addEventListener("load", onLoad, { once: true });
        art.addEventListener("error", onError, { once: true });
        timeout = setTimeout(() => finish(false), Math.max(1, deadline - Date.now()));
        if (art.complete) finish(art.naturalWidth > 0 && art.naturalHeight > 0);
      });
      if (loaded) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      return loaded;
    }
    return false;
  };
  const syncContext = () => {
    ensureArtLayer();
    const home = Boolean(
      document.querySelector(".group\\/home-suggestions, [class*='home-suggestions']")
      || [...document.querySelectorAll("h1, h2, [class*='title']")].some((node) =>
        /what should we build|what should we code|what should we work on(?: in workspace)?|let.?s build|我们应该构建什么|我们该构建什么/.test(
          node.textContent.trim().toLocaleLowerCase(),
        )),
    );
    root.classList.toggle("act-full-skin-home", home);
    caption.hidden = !home;
  };

  const cleanup = () => {
    observer?.disconnect();
    clearTimeout(syncTimer);
    document.getElementById("act-full-skin-style")?.remove();
    document.getElementById("act-full-skin-caption")?.remove();
    document.getElementById("act-full-skin-art")?.remove();
    root.classList.remove("act-full-skin", "act-full-skin-home");
    delete root.dataset.actTheme;
    delete root.dataset.actMode;
    delete root.dataset.actSafeArea;
    for (const property of [...root.style]) {
      if (property.startsWith("--act-")) root.style.removeProperty(property);
    }
    delete window.__ACT_FULL_SKIN_STATE__;
    return true;
  };

  const artLoaded = await waitForArtLayer();
  if (!artLoaded) {
    cleanup();
    throw new Error("ACT full-skin artwork could not be loaded");
  }
  syncContext();
  observer = new MutationObserver(() => {
    if (syncTimer) return;
    syncTimer = setTimeout(() => {
      syncTimer = undefined;
      syncContext();
    }, 80);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  window.__ACT_FULL_SKIN_STATE__ = {
    version,
    themeId: theme.id,
    mode: theme.mode,
    cleanup,
  };

  const art = document.getElementById("act-full-skin-art");

  return {
    pass: Boolean(
      root.classList.contains("act-full-skin")
      && document.getElementById("act-full-skin-style")
      && document.getElementById("act-full-skin-caption")
      && art instanceof HTMLImageElement
      && art.complete
      && art.naturalWidth > 0
      && art.naturalHeight > 0
      && window.__ACT_FULL_SKIN_STATE__?.themeId === theme.id
    ),
    version,
    themeId: theme.id,
    mode: theme.mode,
    home: root.classList.contains("act-full-skin-home"),
    artwork: {
      loaded: art instanceof HTMLImageElement && art.complete && art.naturalWidth > 0,
      width: art instanceof HTMLImageElement ? art.naturalWidth : 0,
      height: art instanceof HTMLImageElement ? art.naturalHeight : 0,
    },
    selectors: {
      sidebar: Boolean(document.querySelector("aside.app-shell-left-panel")),
      composer: Boolean(document.querySelector(".composer-surface-chrome")),
      main: Boolean(document.querySelector(mainSelector)),
    },
  };
})()
