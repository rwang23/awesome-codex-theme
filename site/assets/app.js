const translations = {
  en: {
    navThemes: "Themes",
    navStandard: "Standard",
    navNative: "Codex Native",
    navCreator: "Creation Skill",
    heroKicker: "Open standard · Original and unofficial fan-art collections",
    heroLineOne: "Give Codex",
    heroLineTwo: "a change of scenery.",
    heroIntro: "Each gallery cover leads to a real Codex Native palette with recorded provenance, two color modes, integrity checks, and a versioned import string.",
    browseThemes: "Browse every theme",
    viewRepo: "View the GitHub repository",
    statThemes: "themes",
    statCode: "executable files inside each pack",
    statNative: "native target",
    statContrast: "contrast gate",
    collectionEyebrow: "Theme library",
    collectionTitle: "Original worlds, city light, and scenes fans remember.",
    collectionIntro: "The library now includes 16 original themes and 12 clearly disclosed unofficial donghua fan-art tributes. Every source image is generated through an image job and reviewed by hand.",
    searchLabel: "Search themes",
    searchPlaceholder: "Search worlds, moods, tags…",
    filterAll: "All styles",
    filterCinematic: "Cinematic",
    filterChibi: "Chibi",
    filterCityscape: "City",
    filterScene: "Memory scene",
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
    stepExportBody: "Generate a Codex Native v1 string that the desktop app can import directly.",
    compatibilityEyebrow: "Codex Native",
    compatibilityTitle: "One target, using the real Codex theme contract.",
    compatibilityIntro: "Codex can import accent, background, foreground, contrast, fonts, syntax theme, and semantic colors. Gallery artwork remains cover art because the native contract does not accept background images.",
    tableTarget: "Target",
    tableCoverage: "Coverage",
    tableDelivery: "Delivery",
    coverageAppearance: "Native theme v1",
    deliveryProfile: "Copy and import",
    creatorEyebrow: "Let Codex guide the creation workflow",
    creatorTitle: "Turn one visual idea into a verifiable theme.",
    creatorIntro: "The repository includes $create-codex-theme. It covers the brief, originality review, image job, light and dark tokens, Registry entry, and browser acceptance check.",
    creatorCta: "Open the creation Skill",
    closingKicker: "Free to use · Open to review · Ready for contributors",
    closingTitle: "Choose a theme and give your workspace its own weather.",
    browseCollection: "Open the theme library",
    footerRights: "Original AI artwork is CC0. Unofficial fan art follows the separate fan-art notice. Project code is MIT.",
    installEyebrow: "USE IN CODEX",
    chooseMode: "Mode",
    verifiedCommand: "Codex Native theme string",
    copyCommand: "Copy theme",
    openSettings: "Open Codex settings",
    downloadExport: "Download native theme",
    downloadPackage: "Canonical .act-theme",
    trustNoteNative: "Copy the string, open Codex Settings > Appearance, choose the matching Light or Dark theme, and select Import. The illustration is a gallery cover and is not applied as an app background.",
    installTheme: "Use in Codex",
    original: "Original",
    fanArtBadge: "Unofficial fan art",
    fanArtLicense: "FAN ART",
    fanArtNotice: "Unofficial AI fan art. No official stills, logos, or promotional assets were used. No license or endorsement from the underlying rights holders is claimed; personal, non-commercial use only.",
    coverArt: "GALLERY COVER",
    coverBadge: "COVER",
    cinematic: "Cinematic",
    chibi: "Chibi",
    cityscape: "City study",
    scene: "Memory scene",
    light: "Light",
    dark: "Dark",
    copied: "Codex Native theme copied.",
    copyFailed: "Copy failed. Select the theme string manually.",
    loadFailed: "The registry could not be loaded. Run the build and serve this directory over HTTP.",
    capabilityNative: "Tested with Codex desktop 26.715.2305.0. The import applies the palette, contrast, semantic colors, and built-in Codex syntax theme without CSS injection or executable code.",
    resultCount: "themes shown",
    allCollections: "All collections",
    allCollectionsCaption: "Original, city, and unofficial fan-art themes",
    themeCount: "themes"
  },
  "zh-CN": {
    navThemes: "主题",
    navStandard: "标准",
    navNative: "Codex Native",
    navCreator: "创作 Skill",
    heroKicker: "开放标准 · 原创与非官方 Fan Art 双轨主题",
    heroLineOne: "给 Codex，",
    heroLineTwo: "换一片风景。",
    heroIntro: "每张馆藏封面都对应一套可由 Codex 原生导入的配色，包含明暗模式、来源记录、完整性校验和版本化主题字符串。",
    browseThemes: "浏览全部主题",
    viewRepo: "查看 GitHub 仓库",
    statThemes: "套主题",
    statCode: "个包内可执行文件",
    statNative: "个原生目标",
    statContrast: "对比度门槛",
    collectionEyebrow: "主题馆藏",
    collectionTitle: "原创世界、城市灯火，也有一眼认出的名场面。",
    collectionIntro: "馆藏现有 16 套原创主题，以及 12 套明确标注的非官方国漫 Fan Art。全部源图都通过 image job 生成并经过人工审查。",
    searchLabel: "搜索主题",
    searchPlaceholder: "搜索世界、城市或氛围",
    filterAll: "全部",
    filterCinematic: "原画",
    filterChibi: "Q 版",
    filterCityscape: "城市",
    filterScene: "名场面",
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
    stepExportBody: "生成 Codex 桌面版能够直接导入的 Native v1 主题字符串。",
    compatibilityEyebrow: "Codex Native",
    compatibilityTitle: "只做一个目标，而且使用真实的 Codex 主题契约。",
    compatibilityIntro: "Codex 原生支持强调色、背景色、前景色、对比度、字体、代码主题和语义色。原生契约不接受背景图片，因此 Gallery 插画会明确标为封面，而不是伪装成实机截图。",
    tableTarget: "目标",
    tableCoverage: "覆盖程度",
    tableDelivery: "交付方式",
    coverageAppearance: "原生主题 v1",
    deliveryProfile: "复制并导入",
    creatorEyebrow: "把创作流程交给 Codex",
    creatorTitle: "一句想法，也能变成一套可验证的主题。",
    creatorIntro: "仓库自带 $create-codex-theme Skill。它会带你完成 brief、原创性检查、image job、明暗 token、Registry 写入和浏览器验收。",
    creatorCta: "查看创作 Skill",
    closingKicker: "免费使用 · 开放审查 · 欢迎共创",
    closingTitle: "先选一套，让工作区有一点自己的气候。",
    browseCollection: "进入主题馆藏",
    footerRights: "AI 原创素材采用 CC0；非官方 Fan Art 适用独立声明；项目代码采用 MIT。",
    installEyebrow: "在 Codex 中使用",
    chooseMode: "模式",
    verifiedCommand: "Codex Native 主题字符串",
    copyCommand: "复制主题",
    openSettings: "打开 Codex 设置",
    downloadExport: "下载原生主题",
    downloadPackage: "标准 .act-theme",
    trustNoteNative: "复制字符串后，打开 Codex 设置 > 外观，在对应的明亮或暗色主题中选择“导入”。插画只是 Gallery 封面，不会作为应用背景写入 Codex。",
    installTheme: "在 Codex 中使用",
    original: "原创",
    fanArtBadge: "非官方 Fan Art",
    fanArtLicense: "FAN ART",
    fanArtNotice: "这是非官方 AI Fan Art，未使用官方剧照、Logo 或宣传素材，也不声称获得权利方授权或背书，仅限个人非商业使用。",
    coverArt: "馆藏封面",
    coverBadge: "封面",
    cinematic: "原画感",
    chibi: "Q 版",
    cityscape: "城市图景",
    scene: "名场面",
    light: "明亮",
    dark: "暗色",
    copied: "Codex Native 主题已复制。",
    copyFailed: "复制失败，请手动选择主题字符串。",
    loadFailed: "无法读取 Registry。请先构建项目，并通过 HTTP 服务访问。",
    capabilityNative: "已按 Codex 桌面版 26.715.2305.0 验证格式。导入会应用配色、对比度、语义色和内置 Codex 代码主题，不注入 CSS，也不执行脚本。",
    resultCount: "套主题",
    allCollections: "全部系列",
    allCollectionsCaption: "原创、城市与非官方 Fan Art 主题",
    themeCount: "套主题"
  }
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
  dialogMode: window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"
};

const elements = {
  languageButton: document.querySelector("#languageButton"),
  languageLabel: document.querySelector("#languageLabel"),
  heroPreview: document.querySelector("#heroPreview"),
  heroThemeName: document.querySelector("#heroThemeName"),
  heroThemeMeta: document.querySelector("#heroThemeMeta"),
  heroMode: document.querySelector("#heroMode"),
  themeStatValue: document.querySelector("#themeStatValue"),
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
  capabilityNote: document.querySelector("#capabilityNote"),
  dialogRights: document.querySelector("#dialogRights"),
  nativeThemeString: document.querySelector("#nativeThemeString"),
  copyTheme: document.querySelector("#copyTheme"),
  downloadNativeTheme: document.querySelector("#downloadNativeTheme"),
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

function renderFilterLabels() {
  if (!state.registry) return;
  const labelKeys = {
    all: "filterAll",
    cinematic: "filterCinematic",
    chibi: "filterChibi",
    cityscape: "filterCityscape",
    scene: "filterScene"
  };
  elements.filterGroup.querySelectorAll("button[data-filter]").forEach(function (button) {
    const filter = button.dataset.filter;
    const count = filter === "all"
      ? state.registry.themes.length
      : state.registry.themes.filter(function (theme) { return theme.variant === filter; }).length;
    button.textContent = t(labelKeys[filter]) + " " + String(count).padStart(2, "0");
  });
}

function updateHero(theme = state.heroTheme) {
  if (!theme) return;
  state.heroTheme = theme;
  elements.heroPreview.src = assetUrl(theme.previews[state.heroMode].preview);
  elements.heroPreview.alt = localized(theme.name) + " · " + t("coverArt") + " · " + t(state.heroMode);
  elements.heroThemeName.textContent = localized(theme.name);
  elements.heroThemeMeta.textContent = t("coverArt") + " · " + localized(collectionFor(theme)?.name) + " · " + t(state.heroMode);
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
  renderFilterLabels();

  state.cards.forEach(function (card, id) {
    const theme = state.registry.themes.find(function (item) { return item.id === id; });
    card.title.textContent = localized(theme.name);
    card.description.textContent = localized(theme.description);
    card.variant.textContent = t(theme.variant);
    card.original.textContent = theme.rightsProfile === "fan-art" ? t("fanArtBadge") : t("original");
    card.license.textContent = t("coverBadge") + " · AI · " + (theme.rightsProfile === "fan-art" ? t("fanArtLicense") : theme.license.spdx);
    card.collection.textContent = localized(collectionFor(theme)?.name);
    card.install.setAttribute("aria-label", t("installTheme") + ": " + localized(theme.name));
    card.image.alt = localized(theme.name) + " · " + t("coverArt") + " · " + t(state.cardModes.get(id));
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
  article.classList.toggle("is-fan-art", theme.rightsProfile === "fan-art");

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

  const license = document.createElement("span");
  license.className = "card-license";
  license.textContent = t("coverBadge") + " · AI · " + (theme.rightsProfile === "fan-art" ? t("fanArtLicense") : theme.license.spdx);
  visual.append(license);

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
    image.alt = localized(theme.name) + " · " + t("coverArt") + " · " + t(mode);
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
    license,
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
    const collection = collectionFor(theme);
    const haystack = [
      theme.id,
      theme.name["zh-CN"],
      theme.name.en,
      theme.description["zh-CN"],
      theme.description.en,
      theme.variant,
      theme.pair,
      collection?.name?.["zh-CN"],
      collection?.name?.en,
      theme.fanArt?.work?.["zh-CN"],
      theme.fanArt?.work?.en,
      ...(theme.fanArt?.characters?.["zh-CN"] || []),
      ...(theme.fanArt?.characters?.en || []),
      theme.tags.join(" ")
    ].filter(Boolean).join(" ").toLocaleLowerCase(state.locale);
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

function updateDialog() {
  const theme = state.currentTheme;
  if (!theme) return;
  const modeRecord = theme.previews[state.dialogMode];
  elements.dialogTitle.textContent = localized(theme.name);
  elements.dialogDescription.textContent = localized(theme.description);
  elements.dialogPreview.src = assetUrl(modeRecord.preview);
  elements.dialogPreview.alt = localized(theme.name) + " · " + t("coverArt") + " · " + t(state.dialogMode);
  elements.dialogVariant.textContent = t("coverArt") + " · " + localized(collectionFor(theme)?.name) + " · " + t(theme.variant);
  elements.capabilityNote.textContent = t("capabilityNative");
  elements.dialogRights.hidden = theme.rightsProfile !== "fan-art";
  elements.dialogRights.textContent = theme.rightsProfile === "fan-art"
    ? localized(theme.fanArt?.work) + " · " + t("fanArtNotice")
    : "";
  elements.trustNote.textContent = t("trustNoteNative");
  elements.nativeThemeString.textContent = modeRecord.nativeTheme.value;
  elements.downloadNativeTheme.href = assetUrl(modeRecord.nativeTheme.path);
  elements.downloadNativeTheme.download = theme.id + "-" + state.dialogMode + ".codex-theme.txt";
  elements.downloadPackage.href = assetUrl(theme.package.path);
  elements.downloadPackage.download = theme.id + "-" + theme.version + ".act-theme";
  setActiveButton(elements.dialogMode, "data-mode", state.dialogMode);
}

function openDialog(theme, mode) {
  state.currentTheme = theme;
  state.dialogMode = mode;
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

async function copyNativeTheme() {
  const value = elements.nativeThemeString.textContent;
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
      if (!copied) throw new Error("copy theme returned false");
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

  elements.copyTheme.addEventListener("click", copyNativeTheme);
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
    elements.themeStatValue.textContent = String(registry.themes.length).padStart(2, "0");
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
