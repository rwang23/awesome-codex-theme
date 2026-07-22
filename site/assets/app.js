const translations = {
  en: {
    navThemes: "Themes",
    navManager: "Desktop manager",
    navStandard: "Standard",
    navNative: "Full Skin",
    navCreator: "Creation Skill",
    navCommunity: "Community",
    heroKicker: "Open standard · Original and unofficial fan-art collections",
    heroLineOne: "Give Codex",
    heroLineTwo: "a change of scenery.",
    heroIntro: "This goes beyond a palette swap. Each theme brings a background, translucent materials, colors, and theme copy into Codex with provenance, hashes, and version-bound evidence.",
    browseThemes: "Browse every theme",
    downloadManager: "Download Theme Manager",
    downloadInstaller: "View Theme Manager release status",
    desktopManagerCta: "Explore the desktop theme manager",
    viewRepo: "View the GitHub repository",
    statThemes: "themes",
    statCode: "executable files inside each pack",
    statNative: "Codex targets",
    statContrast: "contrast gate",
    managerEyebrow: "Windows + macOS desktop manager",
    managerTitle: "Find a theme that feels like your workspace.",
    managerIntro: "Browse verified themes, compare light and dark modes, then apply the one you like to the desktop app you selected.",
    managerFeatureOneTitle: "See the result before you choose",
    managerFeatureOneBody: "Every mode includes a real app capture, so you can compare the look before applying it.",
    managerFeatureTwoTitle: "Apply a complete visual skin",
    managerFeatureTwoBody: "Theme Manager applies the verified background, materials, colors, and theme copy together.",
    managerFeatureThreeTitle: "Restore the original look anytime",
    managerFeatureThreeBody: "Choose Restore Native whenever you want to return to the app's original interface.",
    managerReleases: "Read the Theme Manager guide",
    legacyWindowsHelper: "Portable Windows helper",
    managerSigningNote: "Choose the build that matches your system and CPU. This beta may still show an operating-system security prompt.",
    managerScreenshotCaption: "Theme Manager on Windows · real app theme capture inside",
    collectionEyebrow: "Theme library",
    collectionTitle: "Original worlds, city light, and scenes fans remember.",
    collectionIntro: "The library now includes {original} original themes and {fanArt} clearly disclosed unofficial fan-art tributes. Every source image is generated through an image job and reviewed by hand.",
    searchLabel: "Search themes",
    searchPlaceholder: "Search worlds, moods, tags…",
    facetRights: "Source and rights",
    filterRightsAll: "All sources",
    filterOriginal: "Original",
    filterFanArt: "Fan art",
    facetStyle: "Visual form",
    filterAll: "All styles",
    filterCinematic: "Cinematic",
    filterChibi: "Chibi",
    filterCityscape: "City",
    filterScene: "Memory scene",
    clearFilters: "Clear filters",
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
    stepExportBody: "Generate Full Skin records, real-app evidence, and a Native palette fallback.",
    compatibilityEyebrow: "ACT Full Skin + Native",
    compatibilityTitle: "Full Skin is the main delivery; Native is the lightweight fallback.",
    compatibilityIntro: "The Theme Manager loads verified backgrounds and materials through one fixed, reviewable runtime without modifying app files or private data. Codex Native v1 remains available for palette import, but it cannot install a background.",
    tableTarget: "Target",
    tableCoverage: "Coverage",
    tableDelivery: "Delivery",
    coverageFullSkin: "Background + materials + colors + copy",
    deliveryManager: "Tauri Theme Manager",
    coverageAppearance: "Palette-only fallback",
    deliveryProfile: "Copy, then import manually",
    creatorEyebrow: "Let Codex guide the creation workflow",
    creatorTitle: "Turn one visual idea into a verifiable theme.",
    creatorIntro: "The repository includes $create-codex-theme. It covers the brief, originality review, image job, light and dark tokens, Registry entry, and browser acceptance check.",
    creatorCta: "Open the creation Skill",
    communityEyebrow: "COMMUNITY / NOT OPEN",
    communityTitle: "Community submissions are not open yet.",
    communityIntro: "The official Registry remains curated in this repository. Before a theme is listed, it must pass rights review, validation, CI, and real-app evidence.",
    communityStepOneTitle: "Current status",
    communityStepOneBody: "The public Gallery does not accept community accounts, uploads, or voting today.",
    communityStepTwoTitle: "Official Registry",
    communityStepTwoBody: "Maintainers review every addition in this repository.",
    communityStepThreeTitle: "Future submissions",
    communityStepThreeBody: "When participation opens, only declarative, code-free theme packs will be considered.",
    communityStepFourTitle: "Release gate",
    communityStepFourBody: "Rights review, CI, and real-app evidence will remain mandatory.",
    closingKicker: "Free to use · Open to review · Ready for contributors",
    closingTitle: "Choose a theme. Make the workspace yours.",
    browseCollection: "Open the theme library",
    footerContribute: "Contribute",
    footerRights: "Original AI artwork is CC0. Unofficial fan art follows the separate fan-art notice. Project code is MIT.",
    installEyebrow: "USE IN CODEX",
    chooseMode: "Mode",
    verifiedCommand: "Native palette fallback",
    copyCommand: "Copy theme",
    openSettings: "Open Codex settings",
    downloadExport: "Download native theme",
    downloadPackage: "Canonical .act-theme",
    installerTitle: "Applied safely by Theme Manager",
    installerBody: "The manager verifies the Registry, background hash, exact app package, and loopback port before loading its fixed Full Skin runtime. Windows can replay it by choice; Restore disables persistence and removes the runtime.",
    trustNoteNative: "Full Skin connects only to a loopback debugging port owned by the exact app. It does not modify WindowsApps, app.asar, chats, or ChatGPT private data. The Native string above is a palette-only fallback with no background.",
    installTheme: "Use in Codex",
    original: "Original",
    fanArtBadge: "Unofficial fan art",
    fanArtLicense: "FAN ART",
    fanArtNotice: "Unofficial AI fan art. No official stills, logos, or promotional assets were used. No license or endorsement from the underlying rights holders is claimed; personal, non-commercial use only.",
    coverArt: "GALLERY COVER",
    coverBadge: "COVER",
    realCapture: "REAL BETA CAPTURE",
    captureBadge: "CAPTURE",
    cinematic: "Cinematic",
    chibi: "Chibi",
    cityscape: "City study",
    scene: "Memory scene",
    light: "Light",
    dark: "Dark",
    copied: "Codex Native theme copied.",
    copyFailed: "Copy failed. Select the theme string manually.",
    loadFailed: "The registry could not be loaded. Run the build and serve this directory over HTTP.",
    capabilityNative: "ACT Full Skin v1 is verified with ChatGPT Beta 26.715.3651.0 and the available 5.6 Sol Max setting across all 106 theme modes. It applies the background, materials, colors, and theme copy; Native v1 remains a palette-only fallback.",
    resultCount: "themes shown",
    allCollections: "All collections",
    allCollectionsCaption: "Original, city, and unofficial fan-art themes",
    themeCount: "themes",
    showingThemes: "themes shown"
  },
  "zh-CN": {
    navThemes: "主题",
    navManager: "桌面管理器",
    navStandard: "标准",
    navNative: "完整皮肤",
    navCreator: "创作 Skill",
    navCommunity: "社区共创",
    heroKicker: "开放标准 · 原创与非官方 Fan Art 双轨主题",
    heroLineOne: "给 Codex，",
    heroLineTwo: "换一片风景。",
    heroIntro: "不只是换一组颜色。每套主题都会把背景、半透明材质、配色和主题文字一起带进 Codex，并保留来源、哈希与准确版本证据。",
    browseThemes: "浏览全部主题",
    downloadManager: "下载 Theme Manager",
    downloadInstaller: "查看 Theme Manager 发布状态",
    desktopManagerCta: "查看桌面主题管理器",
    viewRepo: "查看 GitHub 仓库",
    statThemes: "套主题",
    statCode: "个包内可执行文件",
    statNative: "个 Codex 目标",
    statContrast: "对比度门槛",
    managerEyebrow: "Windows + macOS 桌面管理器",
    managerTitle: "选一套喜欢的主题，让工作区更像你自己。",
    managerIntro: "浏览已验证的主题，比较明亮和暗色模式，然后应用到你选定的桌面应用。",
    managerFeatureOneTitle: "先看效果，再做选择",
    managerFeatureOneBody: "每种模式都有真实应用截图，先看清楚再应用。",
    managerFeatureTwoTitle: "一键应用完整皮肤",
    managerFeatureTwoBody: "Theme Manager 会把已验证的背景、材质、配色和主题文字一起应用。",
    managerFeatureThreeTitle: "随时恢复原样",
    managerFeatureThreeBody: "不喜欢时选择“恢复原生”，即可回到应用原本的界面。",
    managerReleases: "查看 Theme Manager 使用说明",
    legacyWindowsHelper: "Windows 便携助手",
    managerSigningNote: "请选择与你的系统和 CPU 匹配的版本。当前 Beta 仍可能显示系统安全提示。",
    managerScreenshotCaption: "Windows 上的 Theme Manager · 内嵌真实主题截图",
    collectionEyebrow: "主题馆藏",
    collectionTitle: "原创世界、城市灯火，也有一眼认出的名场面。",
    collectionIntro: "馆藏现有 {original} 套原创主题，以及 {fanArt} 套明确标注的非官方 Fan Art。全部源图都通过 image job 生成并经过人工审查。",
    searchLabel: "搜索主题",
    searchPlaceholder: "搜索世界、城市或氛围",
    facetRights: "来源与授权",
    filterRightsAll: "全部来源",
    filterOriginal: "原创",
    filterFanArt: "Fan Art",
    facetStyle: "视觉表达",
    filterAll: "全部",
    filterCinematic: "原画",
    filterChibi: "Q 版",
    filterCityscape: "城市",
    filterScene: "名场面",
    clearFilters: "清除筛选",
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
    stepExportBody: "生成 Full Skin 记录、实机证据和 Native 配色回退。",
    compatibilityEyebrow: "ACT Full Skin + Native",
    compatibilityTitle: "完整皮肤是主交付，原生配色是轻量回退。",
    compatibilityIntro: "Theme Manager 用固定、可审查的运行时加载已校验背景与材质，不修改应用文件或私有数据。Codex Native v1 仍可单独导入配色，但它不能安装背景。",
    tableTarget: "目标",
    tableCoverage: "覆盖程度",
    tableDelivery: "交付方式",
    coverageFullSkin: "背景 + 材质 + 配色 + 文案",
    deliveryManager: "Tauri Theme Manager",
    coverageAppearance: "仅配色回退",
    deliveryProfile: "复制后手动导入",
    creatorEyebrow: "把创作流程交给 Codex",
    creatorTitle: "一句想法，也能变成一套可验证的主题。",
    creatorIntro: "仓库自带 $create-codex-theme Skill。它会带你完成 brief、原创性检查、image job、明暗 token、Registry 写入和浏览器验收。",
    creatorCta: "查看创作 Skill",
    communityEyebrow: "社区 / 暂未开放",
    communityTitle: "社区投稿暂未开放。",
    communityIntro: "官方 Registry 仍在这个仓库中统一审核。主题被收录前，必须通过权利审查、校验、CI 与真实应用证据。",
    communityStepOneTitle: "当前状态",
    communityStepOneBody: "Gallery 目前不开放社区账号、上传或投票。",
    communityStepTwoTitle: "官方 Registry",
    communityStepTwoBody: "维护者会在这个仓库中审查每一项收录。",
    communityStepThreeTitle: "未来投稿",
    communityStepThreeBody: "社区开放后，只会考虑纯声明、无可执行代码的主题包。",
    communityStepFourTitle: "收录门槛",
    communityStepFourBody: "权利审查、CI 与真实应用证据始终是必须条件。",
    closingKicker: "免费使用 · 开放审查 · 欢迎共创",
    closingTitle: "选一套主题，把工作区变成自己的。",
    browseCollection: "进入主题馆藏",
    footerContribute: "投稿",
    footerRights: "AI 原创素材采用 CC0；非官方 Fan Art 适用独立声明；项目代码采用 MIT。",
    installEyebrow: "在 Codex 中使用",
    chooseMode: "模式",
    verifiedCommand: "Native 配色回退",
    copyCommand: "复制主题",
    openSettings: "打开 Codex 设置",
    downloadExport: "下载原生主题",
    downloadPackage: "标准 .act-theme",
    installerTitle: "由 Theme Manager 安全应用",
    installerBody: "管理器校验 Registry、背景哈希、准确应用包和本机回环端口，再加载固定 Full Skin 运行时；Windows 可选择安全重放，恢复时会同时关闭常驻并移除运行时。",
    trustNoteNative: "Full Skin 只连接准确应用拥有的本机回环调试端口，不修改 WindowsApps、app.asar、聊天或 ChatGPT 私有数据。上面的 Native 字符串只是无背景的配色回退。",
    installTheme: "在 Codex 中使用",
    original: "原创",
    fanArtBadge: "非官方 Fan Art",
    fanArtLicense: "FAN ART",
    fanArtNotice: "这是非官方 AI Fan Art，未使用官方剧照、Logo 或宣传素材，也不声称获得权利方授权或背书，仅限个人非商业使用。",
    coverArt: "馆藏封面",
    coverBadge: "封面",
    realCapture: "Beta 实机截图",
    captureBadge: "实机",
    cinematic: "原画感",
    chibi: "Q 版",
    cityscape: "城市图景",
    scene: "名场面",
    light: "明亮",
    dark: "暗色",
    copied: "Codex Native 主题已复制。",
    copyFailed: "复制失败，请手动选择主题字符串。",
    loadFailed: "无法读取 Registry。请先构建项目，并通过 HTTP 服务访问。",
    capabilityNative: "ACT Full Skin v1 已使用 ChatGPT Beta 26.715.3651.0 与当前测试台实际提供的 5.6 Sol Max 完成全部 106 个模式的实机验证，可应用背景、材质、配色和主题文字；Native v1 只保留为配色回退。",
    resultCount: "套主题",
    allCollections: "全部系列",
    allCollectionsCaption: "原创、城市与非官方 Fan Art 主题",
    themeCount: "套主题",
    showingThemes: "套主题"
  }
};

function detectLocale() {
  const stored = window.localStorage.getItem("act-locale");
  if (stored === "zh-CN" || stored === "en") return stored;
  const languages = Array.isArray(navigator.languages) && navigator.languages.length
    ? navigator.languages
    : [navigator.language || "en"];
  return languages.some(function (language) {
    return /^zh(?:-|$)/i.test(language);
  }) ? "zh-CN" : "en";
}

const preferredMode = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const state = {
  locale: detectLocale(),
  collection: "all",
  rights: "all",
  filter: "all",
  query: "",
  registry: null,
  cards: new Map(),
  cardModes: new Map(),
  heroTheme: null,
  heroMode: preferredMode,
  currentTheme: null,
  dialogMode: preferredMode
};

const elements = {
  languageButton: document.querySelector("#languageButton"),
  languageLabel: document.querySelector("#languageLabel"),
  heroPreview: document.querySelector("#heroPreview"),
  heroThemeName: document.querySelector("#heroThemeName"),
  heroThemeMeta: document.querySelector("#heroThemeMeta"),
  heroVisualKind: document.querySelector("#heroVisualKind"),
  heroMode: document.querySelector("#heroMode"),
  themeStatValue: document.querySelector("#themeStatValue"),
  collectionIntro: document.querySelector("#collectionIntro"),
  search: document.querySelector("#themeSearch"),
  collectionGroup: document.querySelector("#collectionGroup"),
  rightsGroup: document.querySelector("#rightsGroup"),
  filterGroup: document.querySelector("#filterGroup"),
  resultSummary: document.querySelector("#resultSummary"),
  clearFilters: document.querySelector("#clearFilters"),
  gallery: document.querySelector("#gallery"),
  empty: document.querySelector("#emptyState"),
  dialog: document.querySelector("#installDialog"),
  dialogPreview: document.querySelector("#dialogPreview"),
  dialogVariant: document.querySelector("#dialogVariant"),
  dialogTitle: document.querySelector("#dialogTitle"),
  dialogTagline: document.querySelector("#dialogTagline"),
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

function renderCollectionIntro() {
  if (!state.registry || !elements.collectionIntro) return;
  const original = state.registry.themes.filter(function (theme) {
    return theme.rightsProfile === "original";
  }).length;
  const fanArt = state.registry.themes.filter(function (theme) {
    return theme.rightsProfile === "fan-art";
  }).length;
  elements.collectionIntro.textContent = t("collectionIntro")
    .replace("{original}", String(original))
    .replace("{fanArt}", String(fanArt));
}

function localized(record) {
  if (!record) return "";
  return record[state.locale] || record.en || Object.values(record)[0] || "";
}

function audiencePriority(record) {
  const audience = record?.audience || "global";
  if (audience === state.locale) return 0;
  if (audience === "global") return 1;
  return 2;
}

function featuredPriority(record) {
  const rank = record?.featuredRank?.[state.locale];
  return Number.isInteger(rank) ? rank : Number.MAX_SAFE_INTEGER;
}

function compareCollectionPriority(left, right) {
  return featuredPriority(left) - featuredPriority(right)
    || audiencePriority(left) - audiencePriority(right)
    || left.order - right.order;
}

function compareThemePriority(left, right) {
  const leftCollection = collectionFor(left);
  const rightCollection = collectionFor(right);
  return featuredPriority(left) - featuredPriority(right)
    || audiencePriority(left) - audiencePriority(right)
    || compareCollectionPriority(leftCollection, rightCollection)
    || state.registry.themes.indexOf(left) - state.registry.themes.indexOf(right);
}

function orderedThemes() {
  return state.registry ? state.registry.themes.slice().sort(compareThemePriority) : [];
}

function reorderGalleryForLocale() {
  const themes = orderedThemes();
  themes.forEach(function (theme) {
    const card = state.cards.get(theme.id);
    if (card) elements.gallery.append(card.article);
  });
  state.heroTheme = themes[0] || null;
}

function visualFor(modeRecord) {
  if (modeRecord.capture) {
    return {
      path: modeRecord.capture.path,
      label: t("realCapture"),
      badge: t("captureBadge") + " · BETA " + modeRecord.capture.appVersion
    };
  }
  return {
    path: modeRecord.preview,
    label: t("coverArt"),
    badge: t("coverBadge")
  };
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
    ...state.registry.collections.slice().sort(compareCollectionPriority)
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

  const rightsKeys = {
    all: "filterRightsAll",
    original: "filterOriginal",
    "fan-art": "filterFanArt"
  };
  elements.rightsGroup.querySelectorAll("button[data-rights]").forEach(function (button) {
    const rights = button.dataset.rights;
    const count = rights === "all"
      ? state.registry.themes.length
      : state.registry.themes.filter(function (theme) { return theme.rightsProfile === rights; }).length;
    button.textContent = t(rightsKeys[rights]) + " " + String(count).padStart(2, "0");
  });
}

function updateHero(theme = state.heroTheme) {
  if (!theme) return;
  state.heroTheme = theme;
  const visual = visualFor(theme.previews[state.heroMode]);
  elements.heroPreview.src = assetUrl(visual.path);
  elements.heroPreview.alt = localized(theme.name) + " · " + visual.label + " · " + t(state.heroMode);
  elements.heroThemeName.textContent = localized(theme.name);
  elements.heroThemeMeta.textContent = visual.label + " · " + localized(collectionFor(theme)?.name) + " · " + t(state.heroMode);
  elements.heroVisualKind.textContent = theme.previews[state.heroMode].capture ? "BETA CAPTURE" : "COVER ART";
  setActiveButton(elements.heroMode, "data-mode", state.heroMode);
}

function updateLanguage() {
  document.documentElement.lang = state.locale;
  elements.languageLabel.textContent = state.locale === "en" ? "中文" : "English";
  document.querySelectorAll("[data-i18n]").forEach(function (node) {
    if (node.dataset.i18n === "collectionIntro") return;
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(function (node) {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });

  renderCollectionPicker();
  renderFilterLabels();
  renderCollectionIntro();
  reorderGalleryForLocale();

  state.cards.forEach(function (card, id) {
    const theme = state.registry.themes.find(function (item) { return item.id === id; });
    card.title.textContent = localized(theme.name);
    card.tagline.textContent = localized(theme.tagline);
    card.description.textContent = localized(theme.description);
    card.variant.textContent = t(theme.variant);
    card.original.textContent = theme.rightsProfile === "fan-art" ? t("fanArtBadge") : t("original");
    card.collection.textContent = localized(collectionFor(theme)?.name);
    card.install.setAttribute("aria-label", t("installTheme") + ": " + localized(theme.name));
    card.lightButton.setAttribute("aria-label", t("light"));
    card.darkButton.setAttribute("aria-label", t("dark"));
    card.lightButton.textContent = state.locale === "zh-CN" ? "日" : "L";
    card.darkButton.textContent = state.locale === "zh-CN" ? "夜" : "D";
    card.updateMode(state.cardModes.get(id));
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
  const tagline = document.createElement("p");
  tagline.className = "card-tagline";
  const description = document.createElement("p");
  description.className = "card-description";
  copy.append(meta, title, tagline, description);
  const install = makeButton("↗", "card-install");
  body.append(copy, install);
  article.append(visual, body);

  const initialMode = state.dialogMode;
  state.cardModes.set(theme.id, initialMode);

  function updateMode(mode) {
    state.cardModes.set(theme.id, mode);
    const visualRecord = visualFor(theme.previews[mode]);
    image.src = assetUrl(visualRecord.path);
    image.alt = localized(theme.name) + " · " + visualRecord.label + " · " + t(mode);
    license.textContent = visualRecord.badge;
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
    tagline,
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
      theme.tagline["zh-CN"],
      theme.tagline.en,
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
    const matchesRights = state.rights === "all" || theme.rightsProfile === state.rights;
    const matchesFilter = state.filter === "all" || theme.variant === state.filter;
    const matchesQuery = !query || haystack.includes(query);
    const show = matchesCollection && matchesRights && matchesFilter && matchesQuery;
    record.article.hidden = !show;
    if (show) visible += 1;
  });
  elements.empty.hidden = visible !== 0;
  elements.gallery.setAttribute("aria-label", String(visible) + " " + t("resultCount"));
  elements.resultSummary.textContent = String(visible).padStart(2, "0") + " " + t("showingThemes");
  elements.clearFilters.hidden = state.collection === "all"
    && state.rights === "all"
    && state.filter === "all"
    && !state.query.trim();
}

function updateDialog() {
  const theme = state.currentTheme;
  if (!theme) return;
  const modeRecord = theme.previews[state.dialogMode];
  const visual = visualFor(modeRecord);
  elements.dialogTitle.textContent = localized(theme.name);
  elements.dialogTagline.textContent = localized(theme.tagline);
  elements.dialogDescription.textContent = localized(theme.description);
  elements.dialogPreview.src = assetUrl(visual.path);
  elements.dialogPreview.alt = localized(theme.name) + " · " + visual.label + " · " + t(state.dialogMode);
  elements.dialogVariant.textContent = visual.label + " · " + localized(collectionFor(theme)?.name) + " · " + t(theme.variant);
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
    setActiveButton(elements.collectionGroup, "data-collection", state.collection);
    applyFilters();
  });

  elements.rightsGroup.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-rights]");
    if (!button) return;
    state.rights = button.dataset.rights;
    setActiveButton(elements.rightsGroup, "data-rights", state.rights);
    applyFilters();
  });

  elements.filterGroup.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-filter]");
    if (!button) return;
    state.filter = button.dataset.filter;
    setActiveButton(elements.filterGroup, "data-filter", state.filter);
    applyFilters();
  });

  elements.clearFilters.addEventListener("click", function () {
    state.collection = "all";
    state.rights = "all";
    state.filter = "all";
    state.query = "";
    elements.search.value = "";
    setActiveButton(elements.collectionGroup, "data-collection", state.collection);
    setActiveButton(elements.rightsGroup, "data-rights", state.rights);
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
