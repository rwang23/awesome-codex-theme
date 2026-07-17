const translations = {
  en: {
    navThemes: "Themes",
    navStandard: "Standard",
    navAdapters: "Adapters",
    navCreator: "Creation Skill",
    heroKicker: "Open theme library · 16 original launch themes",
    heroLineOne: "Give Codex",
    heroLineTwo: "a change of scenery.",
    heroIntro: "This is more than a background swap. Every theme has recorded provenance, two color modes, integrity checks, and an honest compatibility label.",
    browseThemes: "Browse 16 themes",
    viewRepo: "View the GitHub repository",
    statThemes: "original themes",
    statCode: "executable files inside each pack",
    statAdapters: "adapter targets",
    statContrast: "contrast gate",
    collectionEyebrow: "Theme library",
    collectionTitle: "Fantasy realms meet city light.",
    collectionIntro: "The launch set pairs four original xianxia worlds with chibi companions, plus eight Chinese city studies. Every source image is generated through an image job and reviewed by hand.",
    searchLabel: "Search themes",
    searchPlaceholder: "Search worlds, moods, tags…",
    filterAll: "All styles",
    filterCinematic: "Cinematic 04",
    filterChibi: "Chibi 04",
    filterCityscape: "City 08",
    emptyState: "No themes match this view.",
    standardEyebrow: "ACT theme pack standard",
    standardTitle: "Before a theme looks good, it should earn your trust.",
    standardIntro: "The canonical .act-theme file is a ZIP-compatible package with one manifest and declared assets. JavaScript, shell scripts, remote CSS, and hidden runtime behavior are not allowed inside it.",
    viewSchema: "View JSON Schema",
    stepDeclareTitle: "Declare",
    stepDeclareBody: "Identity, localized copy, compatibility, motion, provenance, and every asset path.",
    stepVerifyTitle: "Verify",
    stepVerifyBody: "SHA-256, file size, dimensions, package allowlist, rights fields, and WCAG contrast.",
    stepExportTitle: "Export",
    stepExportBody: "Generate engine-specific adapters outside the trusted canonical package.",
    compatibilityEyebrow: "Compatibility",
    compatibilityTitle: "Every export explains its real limits.",
    compatibilityIntro: "Codex currently exposes an appearance preference, not a public full-theme package API. We label that adapter as appearance-only instead of promising visual parity.",
    tableTarget: "Target",
    tableCoverage: "Coverage",
    tableDelivery: "Delivery",
    coverageAppearance: "Appearance only",
    coverageFull: "Full visual export",
    coverageSource: "Source export",
    deliveryProfile: "Profile export",
    deliveryVerified: "Verified installer",
    deliveryManual: "Manual import",
    creatorEyebrow: "Let Codex guide the creation workflow",
    creatorTitle: "Turn one visual idea into a verifiable theme.",
    creatorIntro: "The repository includes $create-codex-theme. It covers the brief, originality review, image job, light and dark tokens, Registry entry, and browser acceptance check.",
    creatorCta: "Open the creation Skill",
    closingKicker: "Free to use · Open to review · Ready for contributors",
    closingTitle: "Choose a theme and give your workspace its own weather.",
    browseCollection: "Open the theme library",
    footerRights: "Original AI artwork is released under CC0. Project code is MIT.",
    installEyebrow: "INSTALL / EXPORT",
    chooseMode: "Mode",
    chooseTarget: "Target",
    verifiedCommand: "Verified install command",
    copyCommand: "Copy command",
    downloadExport: "Download adapter bundle",
    downloadPackage: "Canonical .act-theme",
    trustNoteDream: "The browser never writes to Codex. The command downloads a reviewable installer, verifies the selected adapter and image hashes, then writes to the Dream Skin library.",
    trustNoteNative: "The browser never writes to Codex. The native export only records the light or dark appearance preference; it does not apply the background or custom palette.",
    trustNoteManual: "The browser never launches the target app. Download and inspect the adapter bundle, then import the matching export manually.",
    installTheme: "Install or export",
    original: "Original",
    cinematic: "Cinematic",
    chibi: "Chibi",
    cityscape: "City study",
    light: "Light",
    dark: "Dark",
    copied: "Install command copied.",
    copyFailed: "Copy failed. Select the command manually.",
    loadFailed: "The registry could not be loaded. Run the build and serve this directory over HTTP.",
    capabilityDream: "Full visual export. The installer verifies the adapter ZIP and background before adding the theme to the existing Dream Skin library.",
    capabilityNative: "Appearance-only. Codex does not currently expose a public full custom-theme package API, so the background and palette cannot be applied natively.",
    capabilityHeige: "Full visual source export for manual import. Awesome Codex Theme does not control or silently launch the target application.",
    capabilityCodedrobe: "Source export with a generated CSS target. Review and import it through the CodeDrobe theme workflow.",
    resultCount: "themes shown",
    allCollections: "All collections",
    allCollectionsCaption: "16 themes across two visual directions",
    themeCount: "themes"
  },
  "zh-CN": {
    navThemes: "主题",
    navStandard: "标准",
    navAdapters: "适配器",
    navCreator: "创作 Skill",
    heroKicker: "开放标准 · 16 套原创首发主题",
    heroLineOne: "给 Codex，",
    heroLineTwo: "换一片风景。",
    heroIntro: "这里不只是换背景。每套主题都有清楚的来源、双模式色板、完整性校验和如实标注的适配范围。",
    browseThemes: "浏览 16 套主题",
    viewRepo: "查看 GitHub 仓库",
    statThemes: "套原创主题",
    statCode: "个包内可执行文件",
    statAdapters: "个适配目标",
    statContrast: "对比度门槛",
    collectionEyebrow: "主题馆藏",
    collectionTitle: "修仙世界，也有城市灯火。",
    collectionIntro: "首发包含四组原创修仙世界的原画版与 Q 版，以及八座中国城市的氛围图景。全部源图经过 image job 生成与人工审查。",
    searchLabel: "搜索主题",
    searchPlaceholder: "搜索世界、城市或氛围",
    filterAll: "全部",
    filterCinematic: "原画 04",
    filterChibi: "Q 版 04",
    filterCityscape: "城市 08",
    emptyState: "当前条件下没有主题。",
    standardEyebrow: "ACT 主题包标准",
    standardTitle: "好看之前，先让一套主题值得信任。",
    standardIntro: "标准 .act-theme 是兼容 ZIP 的纯声明包，只包含一份 manifest 和已声明素材。包内不允许 JavaScript、Shell 脚本、远程 CSS 或隐藏运行逻辑。",
    viewSchema: "查看 JSON Schema",
    stepDeclareTitle: "声明",
    stepDeclareBody: "明确身份、多语言文案、兼容范围、动态策略、来源与每一个素材路径。",
    stepVerifyTitle: "验证",
    stepVerifyBody: "自动检查 SHA-256、体积、尺寸、文件白名单、版权字段与 WCAG 对比度。",
    stepExportTitle: "导出",
    stepExportBody: "在可信主题包之外，生成各引擎需要的独立适配产物。",
    compatibilityEyebrow: "兼容能力",
    compatibilityTitle: "每一种导出，都把能力边界说清楚。",
    compatibilityIntro: "Codex 当前公开的是外观偏好，而不是完整的自定义主题包 API。因此原生适配器明确标为“仅外观模式”，不会假装背景和配色已经原生生效。",
    tableTarget: "目标",
    tableCoverage: "覆盖程度",
    tableDelivery: "交付方式",
    coverageAppearance: "仅外观模式",
    coverageFull: "完整视觉导出",
    coverageSource: "源码式导出",
    deliveryProfile: "配置导出",
    deliveryVerified: "校验后安装",
    deliveryManual: "手动导入",
    creatorEyebrow: "把创作流程交给 Codex",
    creatorTitle: "一句想法，也能变成一套可验证的主题。",
    creatorIntro: "仓库自带 $create-codex-theme Skill。它会带你完成 brief、原创性检查、image job、明暗 token、Registry 写入和浏览器验收。",
    creatorCta: "查看创作 Skill",
    closingKicker: "免费使用 · 开放审查 · 欢迎共创",
    closingTitle: "先选一套，让工作区有一点自己的气候。",
    browseCollection: "进入主题馆藏",
    footerRights: "首发 AI 原创素材采用 CC0，项目代码采用 MIT。",
    installEyebrow: "安装 / 导出",
    chooseMode: "模式",
    chooseTarget: "目标引擎",
    verifiedCommand: "带完整性校验的安装命令",
    copyCommand: "复制命令",
    downloadExport: "下载适配器包",
    downloadPackage: "标准 .act-theme",
    trustNoteDream: "浏览器不会直接改写 Codex。命令会下载可审查的安装器，核对适配包与背景图哈希后，再写入 Dream Skin 主题库。",
    trustNoteNative: "浏览器不会直接改写 Codex。原生导出只记录明亮或暗色外观偏好，不会应用背景图或自定义色板。",
    trustNoteManual: "浏览器不会启动目标应用。请下载并检查适配包，再在对应引擎中手动导入。",
    installTheme: "安装或导出",
    original: "原创",
    cinematic: "原画感",
    chibi: "Q 版",
    cityscape: "城市图景",
    light: "明亮",
    dark: "暗色",
    copied: "安装命令已复制。",
    copyFailed: "复制失败，请手动选择命令。",
    loadFailed: "无法读取 Registry。请先构建项目，并通过 HTTP 服务访问。",
    capabilityDream: "完整视觉导出。安装器会先核对适配 ZIP 与背景图，再把主题写入已经安装好的 Dream Skin 主题库。",
    capabilityNative: "仅外观模式。Codex 当前没有公开完整自定义主题包 API，因此背景图与自定义色板无法通过原生适配器应用。",
    capabilityHeige: "供手动导入的完整视觉导出。本项目不会控制或静默启动目标应用。",
    capabilityCodedrobe: "包含生成 CSS 的源码式导出，请在 CodeDrobe 主题工作流中审查后导入。",
    resultCount: "套主题",
    allCollections: "全部系列",
    allCollectionsCaption: "两种视觉方向，共 16 套主题",
    themeCount: "套主题"
  }
};

const capabilityKeys = {
  "dream-skin": "capabilityDream",
  "codex-native": "capabilityNative",
  "heige-skin-studio": "capabilityHeige",
  codedrobe: "capabilityCodedrobe"
};

const trustNoteKeys = {
  "dream-skin": "trustNoteDream",
  "codex-native": "trustNoteNative",
  "heige-skin-studio": "trustNoteManual",
  codedrobe: "trustNoteManual"
};

const state = {
  locale: window.localStorage.getItem("act-locale") || "zh-CN",
  collection: "all",
  filter: "all",
  query: "",
  registry: null,
  cards: new Map(),
  cardModes: new Map(),
  heroTheme: null,
  heroMode: "light",
  currentTheme: null,
  dialogMode: window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark",
  engine: "dream-skin",
  os: navigator.userAgent.includes("Mac") ? "macos" : "windows"
};

const elements = {
  languageButton: document.querySelector("#languageButton"),
  languageLabel: document.querySelector("#languageLabel"),
  heroPreview: document.querySelector("#heroPreview"),
  heroThemeName: document.querySelector("#heroThemeName"),
  heroThemeMeta: document.querySelector("#heroThemeMeta"),
  heroMode: document.querySelector("#heroMode"),
  search: document.querySelector("#themeSearch"),
  collectionGroup: document.querySelector("#collectionGroup"),
  filterGroup: document.querySelector("#filterGroup"),
  gallery: document.querySelector("#gallery"),
  empty: document.querySelector("#emptyState"),
  dialog: document.querySelector("#installDialog"),
  dialogPreview: document.querySelector("#dialogPreview"),
  dialogVariant: document.querySelector("#dialogVariant"),
  dialogTitle: document.querySelector("#dialogTitle"),
  dialogDescription: document.querySelector("#dialogDescription"),
  dialogMode: document.querySelector("#dialogMode"),
  engineSelect: document.querySelector("#engineSelect"),
  capabilityNote: document.querySelector("#capabilityNote"),
  commandPanel: document.querySelector("#commandPanel"),
  installCommand: document.querySelector("#installCommand"),
  copyCommand: document.querySelector("#copyCommand"),
  osSwitch: document.querySelector("#osSwitch"),
  downloadAdapter: document.querySelector("#downloadAdapter"),
  downloadPackage: document.querySelector("#downloadPackage"),
  trustNote: document.querySelector("#trustNote"),
  toast: document.querySelector("#toast")
};

function t(key) {
  return translations[state.locale][key] || translations.en[key] || key;
}

function localized(record) {
  if (!record) return "";
  return record[state.locale] || record.en || Object.values(record)[0] || "";
}

function collectionFor(theme) {
  return state.registry?.collections.find(function (collection) {
    return collection.id === theme.collection;
  });
}

function assetUrl(relativePath) {
  return new URL("./" + relativePath, window.location.href).href;
}

function distributionBase() {
  return new URL(".", window.location.href).href.replace(/\/$/, "");
}

function setActiveButton(container, attribute, value) {
  container.querySelectorAll("button").forEach(function (button) {
    const active = button.getAttribute(attribute) === value;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function renderCollectionPicker() {
  if (!state.registry) return;
  const fragment = document.createDocumentFragment();
  const collections = [
    {
      id: "all",
      order: 0,
      name: { en: t("allCollections"), "zh-CN": t("allCollections") },
      description: { en: t("allCollectionsCaption"), "zh-CN": t("allCollectionsCaption") },
      themeCount: state.registry.themes.length
    },
    ...state.registry.collections.slice().sort(function (left, right) { return left.order - right.order; })
  ];

  collections.forEach(function (collection, index) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "collection-button";
    button.dataset.collection = collection.id;
    button.setAttribute("aria-pressed", String(collection.id === state.collection));
    button.classList.toggle("is-active", collection.id === state.collection);

    const number = document.createElement("span");
    number.className = "collection-index";
    number.textContent = String(index).padStart(2, "0");
    const copy = document.createElement("span");
    const name = document.createElement("strong");
    name.textContent = localized(collection.name);
    const description = document.createElement("small");
    description.textContent = localized(collection.description);
    copy.append(name, description);
    const count = document.createElement("span");
    count.className = "collection-count";
    count.textContent = String(collection.themeCount).padStart(2, "0") + " " + t("themeCount");
    button.append(number, copy, count);
    fragment.append(button);
  });

  elements.collectionGroup.replaceChildren(fragment);
}

function updateHero(theme = state.heroTheme) {
  if (!theme) return;
  state.heroTheme = theme;
  elements.heroPreview.src = assetUrl(theme.previews[state.heroMode].preview);
  elements.heroPreview.alt = localized(theme.name) + " · " + t(state.heroMode);
  elements.heroThemeName.textContent = localized(theme.name);
  elements.heroThemeMeta.textContent = localized(collectionFor(theme)?.name) + " · " + t(state.heroMode);
  setActiveButton(elements.heroMode, "data-mode", state.heroMode);
}

function updateLanguage() {
  document.documentElement.lang = state.locale;
  elements.languageLabel.textContent = state.locale === "en" ? "中文" : "English";
  document.querySelectorAll("[data-i18n]").forEach(function (node) {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(function (node) {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });

  renderCollectionPicker();

  state.cards.forEach(function (card, id) {
    const theme = state.registry.themes.find(function (item) { return item.id === id; });
    card.title.textContent = localized(theme.name);
    card.description.textContent = localized(theme.description);
    card.variant.textContent = t(theme.variant);
    card.original.textContent = t("original");
    card.collection.textContent = localized(collectionFor(theme)?.name);
    card.install.setAttribute("aria-label", t("installTheme") + ": " + localized(theme.name));
    card.image.alt = localized(theme.name) + " · " + t(state.cardModes.get(id));
    card.lightButton.setAttribute("aria-label", t("light"));
    card.darkButton.setAttribute("aria-label", t("dark"));
    card.lightButton.textContent = state.locale === "zh-CN" ? "日" : "L";
    card.darkButton.textContent = state.locale === "zh-CN" ? "夜" : "D";
  });
  elements.dialogMode.querySelector('[data-mode="light"]').textContent = t("light");
  elements.dialogMode.querySelector('[data-mode="dark"]').textContent = t("dark");
  if (state.currentTheme) updateDialog();
  if (state.heroTheme) updateHero();
  applyFilters();
}

function makeButton(label, className) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className || "";
  button.textContent = label;
  return button;
}

function createCard(theme, index) {
  const article = document.createElement("article");
  article.className = "theme-card";
  article.dataset.variant = theme.variant;
  article.dataset.collection = theme.collection;
  article.dataset.id = theme.id;

  const visual = document.createElement("div");
  visual.className = "card-visual";
  const image = document.createElement("img");
  image.loading = index < 2 ? "eager" : "lazy";
  image.decoding = "async";
  visual.append(image);

  const toggle = document.createElement("div");
  toggle.className = "card-mode-toggle";
  toggle.setAttribute("role", "group");
  toggle.setAttribute("aria-label", "Preview mode");
  const lightButton = makeButton(state.locale === "zh-CN" ? "日" : "L");
  const darkButton = makeButton(state.locale === "zh-CN" ? "夜" : "D");
  lightButton.dataset.mode = "light";
  darkButton.dataset.mode = "dark";
  lightButton.setAttribute("aria-label", t("light"));
  darkButton.setAttribute("aria-label", t("dark"));
  toggle.append(lightButton, darkButton);
  visual.append(toggle);

  const number = document.createElement("span");
  number.className = "card-number";
  number.textContent = String(index + 1).padStart(2, "0") + " / " + String(state.registry.themes.length).padStart(2, "0");
  const license = document.createElement("span");
  license.className = "card-license";
  license.textContent = "AI · " + theme.license.spdx;
  visual.append(number, license);

  const body = document.createElement("div");
  body.className = "card-body";
  const copy = document.createElement("div");
  const meta = document.createElement("div");
  meta.className = "card-meta";
  const original = document.createElement("span");
  const variant = document.createElement("span");
  const collection = document.createElement("span");
  meta.append(original, variant, collection);
  const title = document.createElement("h3");
  const description = document.createElement("p");
  copy.append(meta, title, description);
  const install = makeButton("↗", "card-install");
  body.append(copy, install);
  article.append(visual, body);

  const initialMode = state.dialogMode;
  state.cardModes.set(theme.id, initialMode);

  function updateMode(mode) {
    state.cardModes.set(theme.id, mode);
    image.src = assetUrl(theme.previews[mode].preview);
    image.alt = localized(theme.name) + " · " + t(mode);
    setActiveButton(toggle, "data-mode", mode);
  }

  toggle.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-mode]");
    if (!button) return;
    updateMode(button.dataset.mode);
  });
  install.addEventListener("click", function () {
    openDialog(theme, state.cardModes.get(theme.id));
  });
  visual.addEventListener("dblclick", function () {
    openDialog(theme, state.cardModes.get(theme.id));
  });
  article.addEventListener("mouseenter", function () {
    updateHero(theme);
  });
  article.addEventListener("focusin", function () {
    updateHero(theme);
  });

  const refs = {
    article,
    image,
    title,
    description,
    original,
    variant,
    collection,
    install,
    lightButton,
    darkButton,
    updateMode
  };
  state.cards.set(theme.id, refs);
  refs.updateMode(initialMode);
  return article;
}

function applyFilters() {
  if (!state.registry) return;
  const query = state.query.trim().toLocaleLowerCase(state.locale);
  let visible = 0;
  state.registry.themes.forEach(function (theme) {
    const record = state.cards.get(theme.id);
    const haystack = [
      theme.id,
      localized(theme.name),
      localized(theme.description),
      theme.variant,
      theme.pair,
      localized(collectionFor(theme)?.name),
      theme.tags.join(" ")
    ].join(" ").toLocaleLowerCase(state.locale);
    const matchesCollection = state.collection === "all" || theme.collection === state.collection;
    const matchesFilter = state.filter === "all" || theme.variant === state.filter;
    const matchesQuery = !query || haystack.includes(query);
    const show = matchesCollection && matchesFilter && matchesQuery;
    record.article.hidden = !show;
    if (show) visible += 1;
  });
  elements.empty.hidden = visible !== 0;
  elements.gallery.setAttribute("aria-label", String(visible) + " " + t("resultCount"));
}

function updateEngineOptions() {
  const labels = state.locale === "zh-CN" ? {
    "dream-skin": "Codex Dream Skin · 完整视觉",
    "codex-native": "Codex 原生 · 仅外观模式",
    "heige-skin-studio": "HeiGe Skin Studio · 完整导出",
    codedrobe: "CodeDrobe · 源码式导出"
  } : {
    "dream-skin": "Codex Dream Skin · Full",
    "codex-native": "Codex native · Appearance only",
    "heige-skin-studio": "HeiGe Skin Studio · Full export",
    codedrobe: "CodeDrobe · Source export"
  };
  Array.from(elements.engineSelect.options).forEach(function (option) {
    option.textContent = labels[option.value];
  });
}

function installCommand(theme, mode, os) {
  const base = distributionBase();
  if (os === "macos") {
    return "p=\"/tmp/awesome-codex-theme-install.sh\"; curl -fsSL \"" + base + "/scripts/install-theme.sh\" -o \"$p\" && sh \"$p\" --theme " + theme.id + " --mode " + mode + " --base-url \"" + base + "\"";
  }
  return "$u='" + base + "/scripts/install-theme.ps1'; $p=Join-Path $env:TEMP 'awesome-codex-theme-install.ps1'; Invoke-WebRequest -Uri $u -OutFile $p; powershell -NoProfile -ExecutionPolicy Bypass -File $p -Theme " + theme.id + " -Mode " + mode + " -BaseUrl '" + base + "'";
}

function updateDialog() {
  const theme = state.currentTheme;
  if (!theme) return;
  const modeRecord = theme.previews[state.dialogMode];
  elements.dialogTitle.textContent = localized(theme.name);
  elements.dialogDescription.textContent = localized(theme.description);
  elements.dialogPreview.src = assetUrl(modeRecord.preview);
  elements.dialogPreview.alt = localized(theme.name) + " · " + t(state.dialogMode);
  elements.dialogVariant.textContent = localized(collectionFor(theme)?.name) + " · " + t(theme.variant);
  elements.capabilityNote.textContent = t(capabilityKeys[state.engine]);
  elements.trustNote.textContent = t(trustNoteKeys[state.engine]);
  elements.commandPanel.hidden = state.engine !== "dream-skin";
  elements.installCommand.textContent = installCommand(theme, state.dialogMode, state.os);
  elements.downloadAdapter.href = assetUrl(modeRecord.adapterBundle.path);
  elements.downloadAdapter.download = theme.id + "-" + state.dialogMode + "-adapters.zip";
  elements.downloadPackage.href = assetUrl(theme.package.path);
  elements.downloadPackage.download = theme.id + "-" + theme.version + ".act-theme";
  setActiveButton(elements.dialogMode, "data-mode", state.dialogMode);
  setActiveButton(elements.osSwitch, "data-os", state.os);
  updateEngineOptions();
}

function openDialog(theme, mode) {
  state.currentTheme = theme;
  state.dialogMode = mode;
  state.engine = "dream-skin";
  elements.engineSelect.value = state.engine;
  updateDialog();
  elements.dialog.showModal();
}

let toastTimer = 0;
function showToast(message) {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  toastTimer = window.setTimeout(function () {
    elements.toast.classList.remove("is-visible");
  }, 2600);
}

async function copyCommand() {
  const value = elements.installCommand.textContent;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = value;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.append(textArea);
      textArea.select();
      const copied = document.execCommand("copy");
      textArea.remove();
      if (!copied) throw new Error("copy command returned false");
    }
    showToast(t("copied"));
  } catch {
    showToast(t("copyFailed"));
  }
}

function bindEvents() {
  elements.languageButton.addEventListener("click", function () {
    state.locale = state.locale === "en" ? "zh-CN" : "en";
    window.localStorage.setItem("act-locale", state.locale);
    updateLanguage();
  });

  elements.heroMode.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-mode]");
    if (!button) return;
    state.heroMode = button.dataset.mode;
    updateHero();
  });

  elements.search.addEventListener("input", function () {
    state.query = elements.search.value;
    applyFilters();
  });

  elements.collectionGroup.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-collection]");
    if (!button) return;
    state.collection = button.dataset.collection;
    state.filter = "all";
    setActiveButton(elements.collectionGroup, "data-collection", state.collection);
    setActiveButton(elements.filterGroup, "data-filter", state.filter);
    applyFilters();
  });

  elements.filterGroup.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-filter]");
    if (!button) return;
    state.filter = button.dataset.filter;
    setActiveButton(elements.filterGroup, "data-filter", state.filter);
    applyFilters();
  });

  elements.dialogMode.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-mode]");
    if (!button) return;
    state.dialogMode = button.dataset.mode;
    updateDialog();
  });

  elements.osSwitch.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-os]");
    if (!button) return;
    state.os = button.dataset.os;
    updateDialog();
  });

  elements.engineSelect.addEventListener("change", function () {
    state.engine = elements.engineSelect.value;
    updateDialog();
  });

  elements.copyCommand.addEventListener("click", copyCommand);
  elements.dialog.addEventListener("click", function (event) {
    if (event.target === elements.dialog) elements.dialog.close();
  });
  elements.dialog.addEventListener("close", function () {
    state.currentTheme = null;
  });
}

async function loadRegistry() {
  try {
    const response = await fetch("./themes/registry.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Registry responded with " + response.status);
    const registry = await response.json();
    if (registry.standard !== "act-theme-pack-v1" || !Array.isArray(registry.themes)) {
      throw new Error("Unexpected registry contract");
    }
    state.registry = registry;
    state.heroTheme = registry.themes[0] || null;
    renderCollectionPicker();
    const fragment = document.createDocumentFragment();
    registry.themes.forEach(function (theme, index) {
      fragment.append(createCard(theme, index));
    });
    elements.gallery.replaceChildren(fragment);
    elements.gallery.setAttribute("aria-busy", "false");
    updateHero();
    updateLanguage();
  } catch (error) {
    elements.gallery.setAttribute("aria-busy", "false");
    elements.empty.hidden = false;
    elements.empty.textContent = t("loadFailed");
    console.error(error);
  }
}

bindEvents();
updateLanguage();
loadRegistry();
