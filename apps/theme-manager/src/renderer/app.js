import "./bridge.js";

const translations = {
  en: {
    catalogLoading: "Loading theme catalog",
    catalogBundled: "Bundled catalog loaded",
    catalogCached: "Last verified catalog loaded",
    catalogRefreshing: "Checking for catalog updates",
    catalogUpdated: "Theme catalog updated",
    catalogCurrent: "Theme catalog is current",
    catalogOffline: "Offline. Using a verified local catalog",
    switchLanguage: "Switch language",
    refreshCatalog: "Refresh themes",
    themeUpdateChannel: "Theme updates",
    themeUpdateNoRestart: "Live catalog, no app update",
    appUpdateChannel: "App",
    themeSeries: "Theme collections",
    visualStyles: "Visual styles",
    visualStylesHint: "Choose a look",
    collectionHint: "Narrow the library",
    themeDiscoveryAria: "Theme discovery",
    filterRightsAria: "Filter by source and rights",
    styleTabsAria: "Choose a visual style",
    themeListAria: "Theme list",
    modeAria: "Theme mode",
    targetAria: "Select a ChatGPT version",
    archiveEyebrow: "THEME LIBRARY",
    archiveTitleOne: "Find your next",
    archiveTitleTwo: "workspace.",
    archiveDescription: "Filter by style and collection, then check the real Beta capture before applying.",
    searchPlaceholder: "Search themes, cities, or moods",
    allCollections: "All",
    rightsFacet: "Source",
    allSources: "All sources",
    original: "Original",
    fanArt: "Fan art",
    allStyles: "All styles",
    cinematic: "Cinematic",
    chibi: "Chibi",
    cityscape: "City",
    scene: "Scene",
    resultsCount: "{count} themes",
    emptyState: "No themes match these filters.",
    light: "Light",
    dark: "Dark",
    verifiedCapture: "Real Beta capture",
    captureAlt: "real Beta capture",
    captureProof: "REAL APP CAPTURE",
    originalRights: "Original · CC0",
    fanArtRights: "Unofficial fan art · non-commercial",
    applyStep: "APPLY TO CODEX",
    applyDescription: "Artwork, interface materials, and colors",
    applySkin: "Apply & Keep Full Skin",
    reapplySkin: "Reapply & Keep Full Skin",
    applyingSkin: "Verifying and applying…",
    restoreSkin: "Restore native",
    keepTheme: "Keep this theme after ChatGPT restarts",
    persistenceDisabled: "Off · no login task",
    persistenceStarting: "Starting the per-user controller",
    persistenceWaiting: "Ready · waiting for ChatGPT",
    persistenceActive: "Kept on for this verified session",
    persistenceRestarting: "Safely reopening the selected ChatGPT app",
    persistenceBlocked: "Paused · the installed version is not verified",
    persistenceError: "Paused after a bounded failure",
    persistenceOther: "Another theme is kept: {theme} · {mode}",
    persistenceConsent: "Keep this theme after every future launch of the selected, verified ChatGPT version?\n\nThis is the normal result of Apply & Keep Full Skin. Theme Manager will start for your user account at sign-in. When you open ChatGPT normally, it may close and relaunch only that exact app once with a loopback-only debugging port. It never edits ChatGPT files, shortcuts, or chats. Unknown versions stay native. You can turn this off here at any time.",
    consentEyebrow: "APPLY & KEEP",
    consentTitle: "Keep this Full Skin?",
    cancel: "Cancel",
    confirmApply: "Apply & Keep",
    copyNative: "Copy Native palette only",
    skinIdle: "Theme packs contain only declarative data and images. The manager uses a temporary loopback-only debug session to load the background without modifying WindowsApps, app.asar, or ChatGPT private data.",
    skinActive: "Active in {target}: {theme} · {mode}. Restore the skin first; quit and reopen ChatGPT normally to close the debug port.",
    noTarget: "ChatGPT was not found",
    onlineGallery: "Online Gallery",
    githubRepository: "GitHub repository",
    checkUpdate: "Check for app updates",
    registryCount: "{count} themes / {source}",
    sourceRemote: "online",
    sourceLocal: "local",
    updateDevelopment: "Development build · v{version}",
    updateUnsupported: "Catalog updates only on this platform",
    updateIdle: "Check for app updates",
    updateChecking: "Checking for app updates",
    updateCurrent: "App is up to date",
    updateDownloadingVersion: "Downloading v{version}",
    updateDownloadingPercent: "Downloading {percent}%",
    updateReady: "Restart and install v{version}",
    updateUnreleased: "Signed desktop update channel is not published",
    updateError: "Unable to check for updates",
    toastCatalogFailed: "Could not refresh the theme catalog.",
    toastCatalogUpdated: "New themes are ready now. No app update or restart needed.",
    toastNativeCopied: "Native palette copied. Import it from ChatGPT Appearance as a lightweight fallback.",
    toastCopyFailed: "Copy failed. Try again.",
    toastSkinApplied: "The Full Skin is active and will be reapplied on future verified launches.",
    toastApplyFailed: "Could not apply the Full Skin.",
    toastSkinRestored: "Full Skin removed. Quit and reopen ChatGPT normally to close the debug port.",
    toastRestoreFailed: "Could not restore the native interface.",
    toastPersistenceEnabled: "Always apply is on for this theme.",
    toastPersistenceDisabled: "Always apply is off and the login task was removed.",
    toastPersistenceFailed: "Could not change the always-apply setting.",
    toastUpdateFailed: "App update check failed.",
    startupFailed: "Theme Manager could not start.",
    closeCodexError: "Quit the selected ChatGPT app completely, then apply the theme again.",
    targetMissingError: "The selected ChatGPT app was not found.",
    assetError: "The theme image failed integrity verification.",
    sessionError: "The verified local Full Skin session could not be opened.",
    genericError: "The operation failed. See the diagnostic reason below.",
    applyTimeout: "The theme controller did not become active before the safety timeout (phase: {phase}).",
    selectionChanged: "The persistent theme selection changed before Apply completed.",
    errorReason: "Reason"
  },
  "zh-CN": {
    catalogLoading: "正在读取主题目录",
    catalogBundled: "已载入内置主题目录",
    catalogCached: "已载入上次验证的主题目录",
    catalogRefreshing: "正在检查主题目录更新",
    catalogUpdated: "主题目录已更新",
    catalogCurrent: "主题目录已是最新",
    catalogOffline: "网络暂不可用，继续使用已验证的本地目录",
    switchLanguage: "切换语言",
    refreshCatalog: "刷新主题",
    themeUpdateChannel: "主题更新",
    themeUpdateNoRestart: "目录可独立更新，无需升级应用",
    appUpdateChannel: "应用",
    themeSeries: "主题系列",
    visualStyles: "视觉风格",
    visualStylesHint: "先选整体风格",
    collectionHint: "再按系列筛选",
    themeDiscoveryAria: "主题发现",
    filterRightsAria: "按来源与授权筛选",
    styleTabsAria: "选择视觉风格",
    themeListAria: "主题列表",
    modeAria: "主题模式",
    targetAria: "选择 ChatGPT 版本",
    archiveEyebrow: "主题浏览",
    archiveTitleOne: "找到适合你的",
    archiveTitleTwo: "工作区。",
    archiveDescription: "按风格和系列筛选，应用前先看真实 Beta 截图。",
    searchPlaceholder: "搜索主题、城市或氛围",
    allCollections: "全部",
    rightsFacet: "来源",
    allSources: "全部来源",
    original: "原创",
    fanArt: "Fan Art",
    allStyles: "全部风格",
    cinematic: "原画",
    chibi: "Q 版",
    cityscape: "城市",
    scene: "名场面",
    resultsCount: "{count} 套主题",
    emptyState: "没有找到符合条件的主题。",
    light: "明亮",
    dark: "暗色",
    verifiedCapture: "Beta 实机截图",
    captureAlt: "Beta 实机截图",
    captureProof: "真实应用截图",
    originalRights: "原创 · CC0",
    fanArtRights: "非官方 Fan Art · 非商业",
    applyStep: "应用到 Codex",
    applyDescription: "背景图片、界面材质与配色",
    applySkin: "应用并保持完整皮肤",
    reapplySkin: "重新应用并保持完整皮肤",
    applyingSkin: "正在校验并应用…",
    restoreSkin: "恢复原生",
    keepTheme: "重启 ChatGPT 后继续使用这套主题",
    persistenceDisabled: "已关闭，不会随登录运行",
    persistenceStarting: "正在启动当前用户级控制器",
    persistenceWaiting: "已就绪，等待打开 ChatGPT",
    persistenceActive: "正在守护这个已验证会话",
    persistenceRestarting: "正在安全重开所选 ChatGPT",
    persistenceBlocked: "已暂停，当前版本尚未验证",
    persistenceError: "有限重试失败，已暂停",
    persistenceOther: "当前保持的是：{theme} · {mode}",
    persistenceConsent: "要让这套主题在以后每次打开所选且已验证的 ChatGPT 版本时继续生效吗？\n\n这也是“应用并保持完整皮肤”的默认结果。Theme Manager 会为当前用户注册登录启动项。当你正常打开 ChatGPT 时，控制器可能先关闭并只重开这一个准确应用一次，再通过仅限本机回环的调试端口加载主题。它不会修改 ChatGPT 文件、快捷方式或聊天；未知版本会保持原生界面。你可以随时在这里关闭。",
    consentEyebrow: "应用并保持",
    consentTitle: "保持使用这套完整皮肤？",
    cancel: "取消",
    confirmApply: "应用并保持",
    copyNative: "只复制原生配色",
    skinIdle: "主题包只含声明式配置与图片。管理器通过仅限本机回环的临时调试会话加载背景，不修改 WindowsApps、app.asar 或 ChatGPT 私有数据。",
    skinActive: "正在 {target} 使用 {theme} · {mode}。恢复后如需关闭调试端口，请退出并正常重开 ChatGPT。",
    noTarget: "未检测到 ChatGPT",
    onlineGallery: "在线 Gallery",
    githubRepository: "GitHub 仓库",
    checkUpdate: "检查应用更新",
    registryCount: "{count} 套 / {source}",
    sourceRemote: "在线",
    sourceLocal: "本地",
    updateDevelopment: "开发模式 · v{version}",
    updateUnsupported: "当前平台仅提供目录更新",
    updateIdle: "检查应用更新",
    updateChecking: "正在检查应用更新",
    updateCurrent: "应用已是最新",
    updateDownloadingVersion: "正在下载 v{version}",
    updateDownloadingPercent: "正在下载 {percent}%",
    updateReady: "重启并安装 v{version}",
    updateUnreleased: "桌面签名更新通道尚未发布",
    updateError: "暂时无法检查更新",
    toastCatalogFailed: "主题目录刷新失败。",
    toastCatalogUpdated: "新主题已经可以直接使用，无需更新或重启应用。",
    toastNativeCopied: "原生配色字符串已复制，可在 ChatGPT 外观设置中作为轻量回退导入。",
    toastCopyFailed: "复制失败，请重试。",
    toastSkinApplied: "完整皮肤已生效，并会在以后启动已验证版本时自动恢复。",
    toastApplyFailed: "无法应用完整皮肤。",
    toastSkinRestored: "已移除完整皮肤。退出并正常重开 ChatGPT 可同时关闭调试端口。",
    toastRestoreFailed: "无法恢复原生界面。",
    toastPersistenceEnabled: "已为这套主题开启始终应用。",
    toastPersistenceDisabled: "已关闭始终应用并移除登录启动项。",
    toastPersistenceFailed: "无法更改始终应用设置。",
    toastUpdateFailed: "应用更新检查失败。",
    startupFailed: "无法启动主题管理器。",
    closeCodexError: "请先完全退出所选 ChatGPT，再重新应用主题。",
    targetMissingError: "没有检测到所选 ChatGPT 应用。",
    assetError: "主题图片未通过完整性校验。",
    sessionError: "无法打开经过验证的本机 Full Skin 会话。",
    genericError: "操作失败，请重试。",
    applyTimeout: "主题控制器未能在安全等待时间内进入生效状态（阶段：{phase}）。",
    selectionChanged: "应用完成前，常驻主题选择已经发生变化。",
    errorReason: "原因"
  }
};

function detectLocale() {
  const stored = window.localStorage.getItem("act-manager-locale");
  if (stored === "zh-CN" || stored === "en") return stored;
  const languages = Array.isArray(navigator.languages) && navigator.languages.length
    ? navigator.languages
    : [navigator.language || "en"];
  return languages.some((language) => /^zh(?:-|$)/i.test(language)) ? "zh-CN" : "en";
}

function t(key, values = {}) {
  const template = translations[state.locale][key] || translations.en[key] || key;
  return Object.entries(values).reduce((result, [name, value]) => {
    return result.replaceAll("{" + name + "}", String(value));
  }, template);
}

const state = {
  appVersion: "",
  platform: "",
  catalog: null,
  catalogState: null,
  targets: [],
  skinState: null,
  persistenceState: null,
  updateState: null,
  locale: detectLocale(),
  collection: "all",
  rights: "all",
  style: "all",
  query: "",
  themeId: null,
  mode: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
};

const elements = {
  appShell: document.querySelector(".app-shell"),
  languageButton: document.querySelector("#languageButton"),
  languageLabel: document.querySelector("#languageLabel"),
  catalogDot: document.querySelector("#catalogDot"),
  catalogLabel: document.querySelector("#catalogLabel"),
  refreshCatalog: document.querySelector("#refreshCatalog"),
  search: document.querySelector("#search"),
  searchShortcut: document.querySelector("#searchShortcut"),
  discoveryNavigation: document.querySelector("#discoveryNavigation"),
  styleTabs: document.querySelector("#styleTabs"),
  collectionTabs: document.querySelector("#collectionTabs"),
  rightsFilter: document.querySelector("#rightsFilter"),
  resultCount: document.querySelector("#resultCount"),
  themeList: document.querySelector("#themeList"),
  emptyState: document.querySelector("#emptyState"),
  modeSwitch: document.querySelector("#modeSwitch"),
  captureVersion: document.querySelector("#captureVersion"),
  themeCapture: document.querySelector("#themeCapture"),
  captureHash: document.querySelector("#captureHash"),
  collectionName: document.querySelector("#collectionName"),
  themeName: document.querySelector("#themeName"),
  themeTagline: document.querySelector("#themeTagline"),
  themeDescription: document.querySelector("#themeDescription"),
  rightsBadge: document.querySelector("#rightsBadge"),
  testedVersion: document.querySelector("#testedVersion"),
  applySkin: document.querySelector("#applySkin"),
  applySkinLabel: document.querySelector("#applySkinLabel"),
  applyShortcut: document.querySelector("#applyShortcut"),
  copyTheme: document.querySelector("#copyTheme"),
  copyShortcut: document.querySelector("#copyShortcut"),
  targetSelect: document.querySelector("#targetSelect"),
  restoreSkin: document.querySelector("#restoreSkin"),
  persistenceControl: document.querySelector("#persistenceControl"),
  persistenceToggle: document.querySelector("#persistenceToggle"),
  persistenceStatus: document.querySelector("#persistenceStatus"),
  skinStatus: document.querySelector("#skinStatus"),
  appVersion: document.querySelector("#appVersion"),
  registryHash: document.querySelector("#registryHash"),
  themeCount: document.querySelector("#themeCount"),
  openGallery: document.querySelector("#openGallery"),
  openRepository: document.querySelector("#openRepository"),
  updateButton: document.querySelector("#updateButton"),
  updateLabel: document.querySelector("#updateLabel"),
  persistenceConsentDialog: document.querySelector("#persistenceConsentDialog"),
  persistenceConsentCancel: document.querySelector("#persistenceConsentCancel"),
  persistenceConsentConfirm: document.querySelector("#persistenceConsentConfirm"),
  toast: document.querySelector("#toast"),
};

let consentResolver = null;

function finishPersistenceConsent(confirmed) {
  if (!consentResolver) return;
  const resolve = consentResolver;
  consentResolver = null;
  elements.persistenceConsentDialog.hidden = true;
  resolve(confirmed);
}

function requestPersistenceConsent() {
  if (consentResolver) return Promise.resolve(false);
  elements.persistenceConsentDialog.hidden = false;
  elements.persistenceConsentConfirm.focus();
  return new Promise((resolve) => {
    consentResolver = resolve;
  });
}

function localized(value) {
  return value?.[state.locale] || value?.en || value?.["zh-CN"] || "";
}

function friendlyError(error, fallbackKey) {
  const raw = typeof error === "string" ? error : error?.message || "";
  if (state.locale === "zh-CN") return raw || t(fallbackKey);
  const withReason = (key) => {
    const reason = raw.replace(/\s+/gu, " ").trim().slice(0, 320);
    return reason ? `${t(key)}\n${t("errorReason")}: ${reason}` : t(key);
  };
  if (/完全退出|正在普通模式运行|already running/i.test(raw)) return withReason("closeCodexError");
  if (/没有检测到|not found/i.test(raw)) return withReason("targetMissingError");
  if (/素材|哈希|PNG|integrity/i.test(raw)) return withReason("assetError");
  if (/CDP|调试|Full Skin 会话|loopback|LaunchServices/i.test(raw)) return withReason("sessionError");
  if (raw && !/[\u3400-\u9fff]/u.test(raw)) return raw;
  return raw ? withReason(fallbackKey || "genericError") : t(fallbackKey || "genericError");
}

function catalogStatusLabel(status) {
  const labels = {
    loading: "catalogLoading",
    bundled: "catalogBundled",
    cached: "catalogCached",
    refreshing: "catalogRefreshing",
    updated: "catalogUpdated",
    current: "catalogCurrent",
    offline: "catalogOffline",
    error: "catalogOffline"
  };
  return t(labels[status] || "catalogLoading");
}

function currentTheme() {
  return state.catalog?.themes.find((theme) => theme.id === state.themeId);
}

function currentCollection() {
  const theme = currentTheme();
  return state.catalog?.collections.find((collection) => collection.id === theme?.collection);
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
    || (left.order || 0) - (right.order || 0);
}

function compareThemePriority(left, right) {
  const collection = (theme) => state.catalog.collections.find((record) => record.id === theme.collection);
  return featuredPriority(left) - featuredPriority(right)
    || audiencePriority(left) - audiencePriority(right)
    || compareCollectionPriority(collection(left), collection(right))
    || state.catalog.themes.indexOf(left) - state.catalog.themes.indexOf(right);
}

function shortHash(value) {
  return value ? value.slice(0, 8) + "…" + value.slice(-5) : "—";
}

let toastTimer;
function toast(message, tone = "success") {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.dataset.tone = tone;
  elements.toast.classList.add("is-visible");
  toastTimer = setTimeout(() => elements.toast.classList.remove("is-visible"), 2600);
}

function renderCatalogStatus() {
  const status = state.catalogState?.status || "loading";
  elements.catalogDot.dataset.status = status;
  elements.catalogLabel.textContent = catalogStatusLabel(status);
  elements.refreshCatalog.classList.toggle("is-spinning", status === "refreshing");
  elements.registryHash.textContent = shortHash(state.catalog?.registrySha256);
  elements.themeCount.textContent = state.catalog
    ? t("registryCount", {
      count: state.catalog.themes.length,
      source: t(state.catalog.source === "remote" ? "sourceRemote" : "sourceLocal"),
    })
    : "—";
}

function renderAppVersion() {
  elements.appVersion.textContent = state.appVersion ? `v${state.appVersion}` : "—";
}

const styleDefinitions = [
  ["all", "allStyles", "+"],
  ["cinematic", "cinematic", "◒"],
  ["chibi", "chibi", "♡"],
  ["cityscape", "cityscape", "▦"],
  ["scene", "scene", "↗"],
];

function matchesStyle(theme, style = state.style) {
  return style === "all" || theme.variant === style;
}

function matchesRights(theme, rights = state.rights) {
  return rights === "all" || theme.rightsProfile === rights;
}

function discoveryThemes() {
  return state.catalog?.themes.filter((theme) => matchesStyle(theme) && matchesRights(theme)) || [];
}

function collectionThemeCount(collectionId) {
  return discoveryThemes().filter((theme) => collectionId === "all" || theme.collection === collectionId).length;
}

function normalizeCollectionSelection() {
  if (state.collection === "all" || collectionThemeCount(state.collection) > 0) return;
  state.collection = "all";
}

function renderStyleTabs() {
  if (!state.catalog) return;
  const fragment = document.createDocumentFragment();
  styleDefinitions.forEach(([id, labelKey, symbol]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.role = "tab";
    button.dataset.style = id;
    button.setAttribute("aria-selected", String(id === state.style));
    button.classList.toggle("is-active", id === state.style);

    const icon = document.createElement("span");
    icon.className = "style-tab-symbol";
    icon.textContent = symbol;
    const copy = document.createElement("span");
    copy.className = "style-tab-copy";
    const label = document.createElement("strong");
    label.textContent = t(labelKey);
    const count = document.createElement("small");
    const themeCount = id === "all"
      ? state.catalog.themes.filter((theme) => matchesRights(theme)).length
      : state.catalog.themes.filter((theme) => matchesStyle(theme, id) && matchesRights(theme)).length;
    count.textContent = String(themeCount);
    copy.append(label, count);
    button.append(icon, copy);
    fragment.append(button);
  });
  elements.styleTabs.replaceChildren(fragment);
}

function renderCollectionTabs() {
  if (!state.catalog) return;
  const records = [
    { id: "all", name: { "zh-CN": t("allCollections"), en: t("allCollections") } },
    ...state.catalog.collections.slice().sort(compareCollectionPriority),
  ].filter((collection) => collectionThemeCount(collection.id) > 0);
  const fragment = document.createDocumentFragment();
  records.forEach((collection) => {
    const button = document.createElement("button");
    button.type = "button";
    button.role = "tab";
    button.dataset.collection = collection.id;
    button.setAttribute("aria-selected", String(collection.id === state.collection));
    button.classList.toggle("is-active", collection.id === state.collection);
    const label = document.createElement("span");
    label.textContent = localized(collection.name);
    const count = document.createElement("small");
    count.textContent = String(collectionThemeCount(collection.id));
    button.append(label, count);
    fragment.append(button);
  });
  elements.collectionTabs.replaceChildren(fragment);
}

function renderFacetOptions() {
  if (!state.catalog) return;
  const rights = [
    ["all", "allSources"],
    ["original", "original"],
    ["fan-art", "fanArt"],
  ];
  const fragment = document.createDocumentFragment();
  rights.forEach(([value, key]) => {
    const option = document.createElement("option");
    option.value = value;
    option.selected = value === state.rights;
    const count = value === "all"
      ? state.catalog.themes.length
      : state.catalog.themes.filter((theme) => theme.rightsProfile === value).length;
    option.textContent = t(key) + " · " + String(count);
    fragment.append(option);
  });
  elements.rightsFilter.replaceChildren(fragment);
}

function filteredThemes() {
  if (!state.catalog) return [];
  const query = state.query.trim().toLocaleLowerCase(state.locale);
  return state.catalog.themes.filter((theme) => {
    if (state.collection !== "all" && theme.collection !== state.collection) return false;
    if (!matchesRights(theme)) return false;
    if (!matchesStyle(theme)) return false;
    if (!query) return true;
    return [
      theme.id,
      theme.name?.["zh-CN"],
      theme.name?.en,
      theme.tagline?.["zh-CN"],
      theme.tagline?.en,
      theme.description?.["zh-CN"],
      theme.description?.en,
      ...(theme.tags || []),
    ].filter(Boolean).join(" ").toLocaleLowerCase(state.locale).includes(query);
  }).sort(compareThemePriority);
}

function renderThemeList() {
  const themes = filteredThemes();
  elements.resultCount.textContent = t("resultsCount", { count: themes.length });
  if (themes.length && !themes.some((theme) => theme.id === state.themeId)) {
    state.themeId = themes[0].id;
  }
  if (!themes.length) state.themeId = null;
  const fragment = document.createDocumentFragment();
  themes.forEach((theme) => {
    const button = document.createElement("button");
    button.type = "button";
    button.role = "option";
    button.dataset.themeId = theme.id;
    button.setAttribute("aria-selected", String(theme.id === state.themeId));
    button.classList.toggle("is-active", theme.id === state.themeId);

    const thumb = document.createElement("span");
    thumb.className = "theme-thumb";
    const image = document.createElement("img");
    image.src = theme.previews[state.mode].imageUrl;
    image.alt = "";
    thumb.append(image);
    const copy = document.createElement("span");
    copy.className = "theme-list-copy";
    const meta = document.createElement("small");
    meta.className = "theme-card-meta";
    meta.textContent = localized(state.catalog.collections.find((collection) => collection.id === theme.collection)?.name)
      + " · " + t(theme.variant);
    const title = document.createElement("strong");
    title.textContent = localized(theme.name);
    const subtitle = document.createElement("small");
    subtitle.textContent = localized(theme.tagline);
    copy.append(meta, title, subtitle);
    const arrow = document.createElement("span");
    arrow.className = "theme-arrow";
    arrow.textContent = "↗";
    button.append(thumb, copy, arrow);
    fragment.append(button);
  });
  elements.themeList.replaceChildren(fragment);
  elements.emptyState.hidden = themes.length > 0;
  if (themes.length) {
    renderSelectedTheme();
  } else {
    elements.themeCapture.removeAttribute("src");
    elements.themeCapture.alt = "";
    elements.collectionName.textContent = "";
    elements.themeName.textContent = t("emptyState");
    elements.themeTagline.textContent = "";
    elements.themeDescription.textContent = "";
    elements.rightsBadge.textContent = "";
    elements.testedVersion.textContent = "";
    elements.applySkin.disabled = true;
  }
}

function renderSelectedTheme() {
  const theme = currentTheme();
  if (!theme) return;
  elements.applySkin.disabled = state.targets.length === 0;
  const preview = theme.previews[state.mode];
  elements.themeCapture.src = preview.imageUrl;
  elements.themeCapture.alt = localized(theme.name) + " · " + t(state.mode) + " · " + t("captureAlt");
  elements.captureVersion.textContent = preview.capture.appVersion;
  elements.captureHash.textContent = shortHash(preview.capture.sha256);
  elements.collectionName.textContent = localized(currentCollection()?.name) + " / " + t(theme.variant).toUpperCase();
  elements.themeName.textContent = localized(theme.name);
  elements.themeTagline.textContent = localized(theme.tagline);
  elements.themeDescription.textContent = localized(theme.description);
  elements.rightsBadge.textContent = theme.rightsProfile === "fan-art" ? t("fanArtRights") : t("originalRights");
  elements.rightsBadge.dataset.rights = theme.rightsProfile;
  elements.testedVersion.textContent = "Full Skin " + preview.fullSkin.testedVersion;
  elements.modeSwitch.querySelectorAll("button").forEach((button) => {
    const active = button.dataset.mode === state.mode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  elements.themeList.querySelectorAll("[data-theme-id]").forEach((button) => {
    const active = button.dataset.themeId === state.themeId;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  renderSkinState();
  renderPersistenceState();
}

function renderTargets() {
  const fragment = document.createDocumentFragment();
  if (!state.targets.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = t("noTarget");
    fragment.append(option);
  } else {
    state.targets.forEach((target) => {
      const option = document.createElement("option");
      option.value = target.channel;
      option.textContent = target.label + (target.version ? " " + target.version : "");
      fragment.append(option);
    });
  }
  elements.targetSelect.replaceChildren(fragment);
  elements.applySkin.disabled = state.targets.length === 0 || !state.themeId;
  renderSkinState();
  renderPersistenceState();
}

function renderSkinState() {
  const skin = state.skinState || { active: false };
  const persistentActive = persistenceMatchesSelection(state.persistenceState)
    && state.persistenceState.phase === "active";
  const sameSessionSelection = skin.active
    && skin.themeId === state.themeId
    && skin.mode === state.mode
    && skin.channel === elements.targetSelect.value;
  const sameSelection = sameSessionSelection || persistentActive;
  elements.applySkinLabel.textContent = sameSelection ? t("reapplySkin") : t("applySkin");
  elements.restoreSkin.disabled = !skin.active && !state.persistenceState?.enabled;
  const active = sameSessionSelection ? skin : persistentActive ? state.persistenceState : null;
  elements.skinStatus.textContent = active
    ? t("skinActive", {
      target: active.channel === "beta" ? "ChatGPT Beta" : "ChatGPT",
      theme: active.themeId,
      mode: t(active.mode),
    })
    : t("skinIdle");
}

function persistenceMatchesSelection(persistence, channel = elements.targetSelect.value) {
  return Boolean(
    persistence?.enabled
    && persistence.themeId === state.themeId
    && persistence.mode === state.mode
    && persistence.channel === channel,
  );
}

function renderPersistenceState() {
  const persistence = state.persistenceState || { enabled: false, phase: "disabled" };
  const channel = elements.targetSelect.value;
  const sameSelection = persistenceMatchesSelection(persistence, channel);
  elements.persistenceToggle.checked = sameSelection;
  elements.persistenceControl.dataset.phase = persistence.phase;

  if (persistence.enabled && !sameSelection) {
    const persistedTheme = state.catalog?.themes.find((theme) => theme.id === persistence.themeId);
    elements.persistenceStatus.textContent = t("persistenceOther", {
      theme: localized(persistedTheme?.name) || persistence.themeId || "—",
      mode: persistence.mode ? t(persistence.mode) : "—",
    });
  } else {
    const labels = {
      disabled: "persistenceDisabled",
      "apply-requested": "persistenceStarting",
      starting: "persistenceStarting",
      waiting: "persistenceWaiting",
      active: "persistenceActive",
      restarting: "persistenceRestarting",
      blocked: "persistenceBlocked",
      "target-missing": "persistenceBlocked",
      "version-blocked": "persistenceBlocked",
      "retry-blocked": "persistenceError",
      error: "persistenceError",
    };
    const label = t(labels[persistence.phase] || "persistenceDisabled");
    elements.persistenceStatus.textContent = persistence.detail
      && ["blocked", "target-missing", "version-blocked", "retry-blocked", "error"].includes(persistence.phase)
      ? `${label} · ${persistence.detail}`
      : label;
  }

  const busy = ["starting", "restarting"].includes(persistence.phase);
  elements.persistenceToggle.disabled = busy
    || (!sameSelection && (state.targets.length === 0 || !state.themeId || !channel));
  elements.restoreSkin.disabled = !(state.skinState?.active || persistence.enabled);
}

function renderUpdateState() {
  const update = state.updateState || { status: "idle" };
  elements.updateButton.dataset.status = update.status;
  const labels = {
    development: t("updateDevelopment", { version: state.appVersion }),
    unsupported: t("updateUnsupported"),
    idle: t("updateIdle"),
    checking: t("updateChecking"),
    current: t("updateCurrent"),
    downloading: update.percent == null
      ? t("updateDownloadingVersion", { version: update.version || "" })
      : t("updateDownloadingPercent", { percent: update.percent }),
    ready: t("updateReady", { version: update.version || "" }),
    unreleased: t("updateUnreleased"),
    error: t("updateError"),
  };
  elements.updateLabel.textContent = labels[update.status] || t("checkUpdate");
}

function renderShortcuts() {
  const modifier = state.platform === "darwin" ? "⌘" : "Ctrl";
  elements.searchShortcut.textContent = modifier + " K";
  elements.copyShortcut.textContent = modifier + " C";
  elements.applyShortcut.textContent = modifier + " ↵";
}

function renderWindowChrome() {
  elements.appShell.dataset.platform = state.platform === "darwin" ? "darwin" : "win32";
}

function renderLanguage() {
  document.documentElement.lang = state.locale;
  elements.languageLabel.textContent = state.locale === "en" ? "中文" : "English";
  elements.languageButton.setAttribute("aria-label", t("switchLanguage"));
  elements.refreshCatalog.setAttribute("aria-label", t("refreshCatalog"));
  elements.refreshCatalog.title = t("refreshCatalog");
  elements.discoveryNavigation.setAttribute("aria-label", t("themeDiscoveryAria"));
  elements.styleTabs.setAttribute("aria-label", t("styleTabsAria"));
  elements.collectionTabs.setAttribute("aria-label", t("themeSeries"));
  elements.rightsFilter.setAttribute("aria-label", t("filterRightsAria"));
  elements.themeList.setAttribute("aria-label", t("themeListAria"));
  elements.modeSwitch.setAttribute("aria-label", t("modeAria"));
  elements.targetSelect.setAttribute("aria-label", t("targetAria"));
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });
  if (state.catalog) {
    normalizeCollectionSelection();
    renderCatalogStatus();
    renderStyleTabs();
    renderCollectionTabs();
    renderFacetOptions();
    renderThemeList();
  }
  renderTargets();
  renderSkinState();
  renderPersistenceState();
  renderUpdateState();
}

function acceptCatalog(payload) {
  if (!payload) return;
  const previousTheme = state.themeId;
  state.catalogState = {
    status: payload.status,
    message: payload.message,
  };
  if (payload.catalog) state.catalog = payload.catalog;
  if (!state.catalog) return;
  const ordered = state.catalog.themes.slice().sort(compareThemePriority);
  state.themeId = state.catalog.themes.some((theme) => theme.id === previousTheme)
    ? previousTheme
    : ordered[0]?.id;
  normalizeCollectionSelection();
  renderCatalogStatus();
  renderStyleTabs();
  renderCollectionTabs();
  renderFacetOptions();
  renderThemeList();
}

async function refreshThemeCatalog(notify = false) {
  const payload = await window.act.refreshCatalog();
  acceptCatalog(payload);
  if (notify && payload?.status === "updated") {
    toast(t("toastCatalogUpdated"));
  }
  return payload;
}

async function refreshAppUpdateState() {
  state.updateState = await window.act.checkForAppUpdate();
  renderUpdateState();
  return state.updateState;
}

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

async function waitForPersistentApply(themeId, mode, channel, timeoutMs = 90000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const persistence = await window.act.getPersistenceState();
    state.persistenceState = persistence;
    renderPersistenceState();
    if (!persistence.enabled
      || persistence.themeId !== themeId
      || persistence.mode !== mode
      || persistence.channel !== channel) {
      throw new Error(t("selectionChanged"));
    }
    if (persistence.phase === "active" && persistence.autostartEnabled) {
      return persistence;
    }
    if (["blocked", "target-missing", "version-blocked", "retry-blocked"].includes(persistence.phase)) {
      throw new Error(persistence.detail || t("toastApplyFailed"));
    }
    await wait(500);
  }
  const phase = state.persistenceState?.phase || "unknown";
  throw new Error(state.persistenceState?.detail || t("applyTimeout", { phase }));
}

elements.languageButton.addEventListener("click", () => {
  state.locale = state.locale === "en" ? "zh-CN" : "en";
  window.localStorage.setItem("act-manager-locale", state.locale);
  renderLanguage();
});

elements.collectionTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-collection]");
  if (!button) return;
  state.collection = button.dataset.collection;
  renderCollectionTabs();
  renderThemeList();
});

elements.styleTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-style]");
  if (!button) return;
  state.style = button.dataset.style;
  normalizeCollectionSelection();
  renderStyleTabs();
  renderCollectionTabs();
  renderThemeList();
});

elements.rightsFilter.addEventListener("change", () => {
  state.rights = elements.rightsFilter.value;
  normalizeCollectionSelection();
  renderStyleTabs();
  renderCollectionTabs();
  renderThemeList();
});

elements.themeList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-theme-id]");
  if (!button) return;
  state.themeId = button.dataset.themeId;
  renderSelectedTheme();
});

elements.modeSwitch.addEventListener("click", (event) => {
  const button = event.target.closest("[data-mode]");
  if (!button) return;
  state.mode = button.dataset.mode;
  renderThemeList();
});

elements.search.addEventListener("input", () => {
  state.query = elements.search.value;
  renderThemeList();
});

elements.targetSelect.addEventListener("change", () => {
  renderSkinState();
  renderPersistenceState();
});

elements.refreshCatalog.addEventListener("click", async () => {
  try {
    await refreshThemeCatalog(true);
  } catch {
    toast(t("toastCatalogFailed"), "error");
  }
});

elements.copyTheme.addEventListener("click", async () => {
  try {
    await window.act.copyTheme(state.themeId, state.mode);
    toast(t("toastNativeCopied"));
  } catch {
    toast(t("toastCopyFailed"), "error");
  }
});

elements.applySkin.addEventListener("click", async () => {
  const channel = elements.targetSelect.value;
  if (!channel || !state.themeId) return;
  if (!state.persistenceState?.enabled && !await requestPersistenceConsent()) return;
  elements.applySkin.disabled = true;
  elements.applySkinLabel.textContent = t("applyingSkin");
  try {
    state.persistenceState = await window.act.enablePersistentTheme(
      state.themeId,
      state.mode,
      channel,
      true,
      true,
    );
    renderPersistenceState();
    state.persistenceState = await waitForPersistentApply(state.themeId, state.mode, channel);
    renderSkinState();
    renderPersistenceState();
    toast(t("toastSkinApplied"));
  } catch (error) {
    try {
      state.persistenceState = await window.act.getPersistenceState();
    } catch {
      // Keep the last verified state when diagnostics cannot be refreshed.
    }
    renderPersistenceState();
    toast(friendlyError(error, "toastApplyFailed"), "error");
  } finally {
    elements.applySkin.disabled = state.targets.length === 0 || !state.themeId;
    renderSkinState();
  }
});

elements.restoreSkin.addEventListener("click", async () => {
  elements.restoreSkin.disabled = true;
  try {
    if (state.persistenceState?.enabled) {
      state.persistenceState = await window.act.disablePersistentTheme();
      renderPersistenceState();
    }
    state.skinState = await window.act.restoreFullSkin();
    renderSkinState();
    toast(t("toastSkinRestored"));
  } catch (error) {
    toast(friendlyError(error, "toastRestoreFailed"), "error");
  } finally {
    renderSkinState();
  }
});

elements.persistenceToggle.addEventListener("change", async () => {
  const channel = elements.targetSelect.value;
  const enable = elements.persistenceToggle.checked;
  const previous = state.persistenceState || { enabled: false };
  const sameSelection = previous.enabled
    && previous.themeId === state.themeId
    && previous.mode === state.mode
    && previous.channel === channel;
  if (!enable && !sameSelection) {
    renderPersistenceState();
    return;
  }
  if (enable && !await requestPersistenceConsent()) {
    renderPersistenceState();
    return;
  }

  elements.persistenceToggle.disabled = true;
  try {
    state.persistenceState = enable
      ? await window.act.enablePersistentTheme(state.themeId, state.mode, channel, true)
      : await window.act.disablePersistentTheme();
    renderPersistenceState();
    toast(t(enable ? "toastPersistenceEnabled" : "toastPersistenceDisabled"));
  } catch (error) {
    state.persistenceState = previous;
    renderPersistenceState();
    toast(friendlyError(error, "toastPersistenceFailed"), "error");
  }
});

elements.persistenceConsentCancel.addEventListener("click", () => finishPersistenceConsent(false));
elements.persistenceConsentConfirm.addEventListener("click", () => finishPersistenceConsent(true));
elements.persistenceConsentDialog.addEventListener("click", (event) => {
  if (event.target === elements.persistenceConsentDialog) finishPersistenceConsent(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !elements.persistenceConsentDialog.hidden) {
    event.preventDefault();
    finishPersistenceConsent(false);
  }
});

elements.openGallery.addEventListener("click", () => window.act.openExternal("gallery"));
elements.openRepository.addEventListener("click", () => window.act.openExternal("repository"));

elements.updateButton.addEventListener("click", async () => {
  try {
    if (state.updateState?.status === "ready") {
      await window.act.installAppUpdate();
      return;
    }
    await refreshAppUpdateState();
  } catch {
    toast(t("toastUpdateFailed"), "error");
  }
});

document.addEventListener("keydown", (event) => {
  const command = event.metaKey || event.ctrlKey;
  if (command && event.key.toLowerCase() === "k") {
    event.preventDefault();
    elements.search.focus();
  }
  if (command && event.key.toLowerCase() === "c" && document.activeElement !== elements.search) {
    event.preventDefault();
    elements.copyTheme.click();
  }
  if (command && event.key === "Enter") {
    event.preventDefault();
    elements.applySkin.click();
  }
});

window.act.onCatalogState(acceptCatalog);
window.act.onUpdateState((value) => {
  state.updateState = value;
  renderUpdateState();
});

renderLanguage();

try {
  const bootstrap = await window.act.bootstrap();
  state.appVersion = bootstrap.appVersion;
  renderAppVersion();
  state.platform = bootstrap.platform;
  renderWindowChrome();
  state.targets = bootstrap.targets;
  state.skinState = bootstrap.skinState;
  state.persistenceState = bootstrap.persistenceState;
  state.updateState = bootstrap.updateState;
  acceptCatalog({
    ...bootstrap.catalogState,
    catalog: bootstrap.catalog,
  });
  renderLanguage();
  renderShortcuts();
  setTimeout(() => void refreshThemeCatalog(true).catch(() => {}), 700);
  setTimeout(() => void refreshAppUpdateState().catch(() => {}), 1800);
  setInterval(async () => {
    try {
      state.persistenceState = await window.act.getPersistenceState();
      renderPersistenceState();
    } catch {
      // Keep the last verified state; the next poll may recover.
    }
  }, 1800);
} catch {
  elements.catalogLabel.textContent = t("startupFailed");
  toast(t("startupFailed"), "error");
}
