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
  const binary = atob(imageData.slice(comma + 1));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  const artUrl = URL.createObjectURL(new Blob([bytes], { type: "image/png" }));

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
  root.style.setProperty("--act-art", `url("${artUrl}")`);
  root.style.setProperty(
    "--act-art-position",
    `${Math.round(theme.art.focusX * 100)}% ${Math.round(theme.art.focusY * 100)}%`,
  );
  for (const [name, value] of Object.entries(theme.tokens)) {
    root.style.setProperty(`--act-${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`, value);
  }

  let observer;
  const syncContext = () => {
    const home = Boolean(
      document.querySelector(".group\\/home-suggestions, [class*='home-suggestions']")
      || [...document.querySelectorAll("h1, h2")].some((node) =>
        /what should we build|what should we code|let.?s build|我们应该构建什么|我们该构建什么/.test(
          node.textContent.trim().toLocaleLowerCase(),
        )),
    );
    root.classList.toggle("act-full-skin-home", home);
    caption.hidden = !home;
  };
  syncContext();
  observer = new MutationObserver(syncContext);
  observer.observe(document.body, { childList: true, subtree: true });

  const cleanup = () => {
    observer?.disconnect();
    document.getElementById("act-full-skin-style")?.remove();
    document.getElementById("act-full-skin-caption")?.remove();
    root.classList.remove("act-full-skin", "act-full-skin-home");
    delete root.dataset.actTheme;
    delete root.dataset.actMode;
    delete root.dataset.actSafeArea;
    for (const property of [...root.style]) {
      if (property.startsWith("--act-")) root.style.removeProperty(property);
    }
    URL.revokeObjectURL(artUrl);
    delete window.__ACT_FULL_SKIN_STATE__;
    return true;
  };

  window.__ACT_FULL_SKIN_STATE__ = {
    version,
    themeId: theme.id,
    mode: theme.mode,
    cleanup,
  };

  return {
    pass: Boolean(
      root.classList.contains("act-full-skin")
      && document.getElementById("act-full-skin-style")
      && document.getElementById("act-full-skin-caption")
      && window.__ACT_FULL_SKIN_STATE__?.themeId === theme.id
    ),
    version,
    themeId: theme.id,
    mode: theme.mode,
    home: root.classList.contains("act-full-skin-home"),
    selectors: {
      sidebar: Boolean(document.querySelector("aside.app-shell-left-panel")),
      composer: Boolean(document.querySelector(".composer-surface-chrome")),
      main: Boolean(document.querySelector("main.main-surface, [role='main']")),
    },
  };
})()
