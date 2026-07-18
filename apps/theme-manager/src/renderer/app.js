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
    refreshCatalog: "Refresh theme catalog",
    themeSeries: "Theme collections",
    filterRightsAria: "Filter by source and rights",
    filterStyleAria: "Filter by visual form",
    themeListAria: "Theme list",
    modeAria: "Theme mode",
    targetAria: "Select a ChatGPT version",
    archiveEyebrow: "THEME LIBRARY / ARCHIVE",
    archiveTitleOne: "Choose a",
    archiveTitleTwo: "working climate.",
    searchPlaceholder: "Search themes, cities, or moods",
    allCollections: "All",
    rightsFacet: "Source",
    styleFacet: "Style",
    allSources: "All sources",
    original: "Original",
    fanArt: "Fan art",
    allStyles: "All styles",
    cinematic: "Cinematic",
    chibi: "Chibi",
    cityscape: "City",
    scene: "Scene",
    emptyState: "No themes match these filters.",
    light: "Light",
    dark: "Dark",
    verifiedCapture: "Real Beta capture",
    captureAlt: "real Beta capture",
    originalRights: "Original · CC0",
    fanArtRights: "Unofficial fan art · non-commercial",
    applyStep: "01 / APPLY",
    applyDescription: "Background, materials, and theme copy",
    applySkin: "Apply Full Skin",
    reapplySkin: "Reapply Full Skin",
    applyingSkin: "Verifying and applying…",
    restoreSkin: "Restore native",
    keepTheme: "Always apply this theme",
    persistenceDisabled: "Off · no login task",
    persistenceStarting: "Starting the per-user controller",
    persistenceWaiting: "Ready · waiting for ChatGPT",
    persistenceActive: "Kept on for this verified session",
    persistenceRestarting: "Safely reopening the selected ChatGPT app",
    persistenceBlocked: "Paused · the installed version is not verified",
    persistenceError: "Paused after a bounded failure",
    persistenceOther: "Always on: {theme} · {mode}",
    persistenceConsent: "Keep this theme on across future ChatGPT launches?\n\nTheme Manager will start for your user account at sign-in. When you open the selected, verified ChatGPT version normally, it may close and relaunch that exact app once with a loopback-only debugging port. It never edits ChatGPT files, shortcuts, or chats. Unknown versions stay native. You can turn this off here at any time.",
    copyNative: "Copy Native palette only",
    skinIdle: "Theme packs contain only declarative data and images. The manager uses a temporary loopback-only debug session to load the background without modifying WindowsApps, app.asar, or ChatGPT private data.",
    skinActive: "Active in {target}: {theme} · {mode}. Restore the skin first; quit and reopen ChatGPT normally to close the debug port.",
    noTarget: "ChatGPT was not found",
    onlineGallery: "Online Gallery",
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
    toastNativeCopied: "Native palette copied. Import it from ChatGPT Appearance as a lightweight fallback.",
    toastCopyFailed: "Copy failed. Try again.",
    toastSkinApplied: "The Full Skin is active in the selected ChatGPT session.",
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
    genericError: "The operation failed. Switch to Chinese to view the raw diagnostic."
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
    refreshCatalog: "刷新主题目录",
    themeSeries: "主题系列",
    filterRightsAria: "按来源与授权筛选",
    filterStyleAria: "按视觉表达筛选",
    themeListAria: "主题列表",
    modeAria: "主题模式",
    targetAria: "选择 ChatGPT 版本",
    archiveEyebrow: "主题馆藏 / ARCHIVE",
    archiveTitleOne: "选择一种",
    archiveTitleTwo: "工作气候。",
    searchPlaceholder: "搜索主题、城市或氛围",
    allCollections: "全部",
    rightsFacet: "来源",
    styleFacet: "风格",
    allSources: "全部来源",
    original: "原创",
    fanArt: "Fan Art",
    allStyles: "全部风格",
    cinematic: "原画",
    chibi: "Q 版",
    cityscape: "城市",
    scene: "名场面",
    emptyState: "没有找到符合条件的主题。",
    light: "明亮",
    dark: "暗色",
    verifiedCapture: "Beta 实机截图",
    captureAlt: "Beta 实机截图",
    originalRights: "原创 · CC0",
    fanArtRights: "非官方 Fan Art · 非商业",
    applyStep: "01 / 应用",
    applyDescription: "完整背景、材质与主题文字",
    applySkin: "应用完整皮肤",
    reapplySkin: "重新应用完整皮肤",
    applyingSkin: "正在校验并应用…",
    restoreSkin: "恢复原生",
    keepTheme: "始终应用这套主题",
    persistenceDisabled: "已关闭，不会随登录运行",
    persistenceStarting: "正在启动当前用户级控制器",
    persistenceWaiting: "已就绪，等待打开 ChatGPT",
    persistenceActive: "正在守护这个已验证会话",
    persistenceRestarting: "正在安全重开所选 ChatGPT",
    persistenceBlocked: "已暂停，当前版本尚未验证",
    persistenceError: "有限重试失败，已暂停",
    persistenceOther: "当前常驻：{theme} · {mode}",
    persistenceConsent: "要让这套主题在以后打开 ChatGPT 时继续生效吗？\n\nTheme Manager 会为当前用户注册登录启动项。当你正常打开所选且已验证的 ChatGPT 版本时，控制器可能先关闭并只重开这个应用一次，再通过仅限本机回环的调试端口加载主题。它不会修改 ChatGPT 文件、快捷方式或聊天；未知版本会保持原生界面。你可以随时在这里关闭。",
    copyNative: "只复制原生配色",
    skinIdle: "主题包只含声明式配置与图片。管理器通过仅限本机回环的临时调试会话加载背景，不修改 WindowsApps、app.asar 或 ChatGPT 私有数据。",
    skinActive: "正在 {target} 使用 {theme} · {mode}。恢复后如需关闭调试端口，请退出并正常重开 ChatGPT。",
    noTarget: "未检测到 ChatGPT",
    onlineGallery: "在线 Gallery",
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
    toastNativeCopied: "原生配色字符串已复制，可在 ChatGPT 外观设置中作为轻量回退导入。",
    toastCopyFailed: "复制失败，请重试。",
    toastSkinApplied: "完整皮肤已在所选 ChatGPT 会话中生效。",
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
    genericError: "操作失败，请重试。"
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
  languageButton: document.querySelector("#languageButton"),
  languageLabel: document.querySelector("#languageLabel"),
  catalogDot: document.querySelector("#catalogDot"),
  catalogLabel: document.querySelector("#catalogLabel"),
  refreshCatalog: document.querySelector("#refreshCatalog"),
  search: document.querySelector("#search"),
  searchShortcut: document.querySelector("#searchShortcut"),
  collectionTabs: document.querySelector("#collectionTabs"),
  rightsFilter: document.querySelector("#rightsFilter"),
  styleFilter: document.querySelector("#styleFilter"),
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
  registryHash: document.querySelector("#registryHash"),
  themeCount: document.querySelector("#themeCount"),
  openGallery: document.querySelector("#openGallery"),
  openRepository: document.querySelector("#openRepository"),
  updateButton: document.querySelector("#updateButton"),
  updateLabel: document.querySelector("#updateLabel"),
  toast: document.querySelector("#toast"),
};

function localized(value) {
  return value?.[state.locale] || value?.en || value?.["zh-CN"] || "";
}

function friendlyError(error, fallbackKey) {
  const raw = typeof error === "string" ? error : error?.message || "";
  if (state.locale === "zh-CN") return raw || t(fallbackKey);
  if (/完全退出|正在普通模式运行|already running/i.test(raw)) return t("closeCodexError");
  if (/没有检测到|not found/i.test(raw)) return t("targetMissingError");
  if (/素材|哈希|PNG|integrity/i.test(raw)) return t("assetError");
  if (/CDP|调试|Full Skin 会话|loopback/i.test(raw)) return t("sessionError");
  return raw && !/[\u3400-\u9fff]/u.test(raw) ? raw : t(fallbackKey || "genericError");
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

function renderCollectionTabs() {
  if (!state.catalog) return;
  const records = [
    { id: "all", name: { "zh-CN": t("allCollections"), en: t("allCollections") }, themeCount: state.catalog.themes.length },
    ...state.catalog.collections,
  ];
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
    count.textContent = String(collection.themeCount || state.catalog.themes.filter((theme) => theme.collection === collection.id).length).padStart(2, "0");
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
  const styles = [
    ["all", "allStyles"],
    ["cinematic", "cinematic"],
    ["chibi", "chibi"],
    ["cityscape", "cityscape"],
    ["scene", "scene"],
  ];
  const render = (select, records, selected, countFor) => {
    const fragment = document.createDocumentFragment();
    records.forEach(([value, key]) => {
      const option = document.createElement("option");
      option.value = value;
      option.selected = value === selected;
      option.textContent = t(key) + " · " + String(countFor(value)).padStart(2, "0");
      fragment.append(option);
    });
    select.replaceChildren(fragment);
  };
  render(elements.rightsFilter, rights, state.rights, (value) => {
    return value === "all"
      ? state.catalog.themes.length
      : state.catalog.themes.filter((theme) => theme.rightsProfile === value).length;
  });
  render(elements.styleFilter, styles, state.style, (value) => {
    return value === "all"
      ? state.catalog.themes.length
      : state.catalog.themes.filter((theme) => theme.variant === value).length;
  });
}

function filteredThemes() {
  if (!state.catalog) return [];
  const query = state.query.trim().toLocaleLowerCase(state.locale);
  return state.catalog.themes.filter((theme) => {
    if (state.collection !== "all" && theme.collection !== state.collection) return false;
    if (state.rights !== "all" && theme.rightsProfile !== state.rights) return false;
    if (state.style !== "all" && theme.variant !== state.style) return false;
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
  });
}

function renderThemeList() {
  const themes = filteredThemes();
  if (themes.length && !themes.some((theme) => theme.id === state.themeId)) {
    state.themeId = themes[0].id;
  }
  if (!themes.length) state.themeId = null;
  const fragment = document.createDocumentFragment();
  themes.forEach((theme, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.role = "option";
    button.dataset.themeId = theme.id;
    button.setAttribute("aria-selected", String(theme.id === state.themeId));
    button.classList.toggle("is-active", theme.id === state.themeId);

    const number = document.createElement("span");
    number.className = "theme-index";
    number.textContent = String(index + 1).padStart(2, "0");
    const thumb = document.createElement("span");
    thumb.className = "theme-thumb";
    const image = document.createElement("img");
    image.src = theme.previews[state.mode].imageUrl;
    image.alt = "";
    thumb.append(image);
    const copy = document.createElement("span");
    copy.className = "theme-list-copy";
    const title = document.createElement("strong");
    title.textContent = localized(theme.name);
    const subtitle = document.createElement("small");
    subtitle.textContent = localized(theme.tagline);
    copy.append(title, subtitle);
    const arrow = document.createElement("span");
    arrow.className = "theme-arrow";
    arrow.textContent = "↗";
    button.append(number, thumb, copy, arrow);
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
  const sameSelection = skin.active
    && skin.themeId === state.themeId
    && skin.mode === state.mode
    && skin.channel === elements.targetSelect.value;
  elements.applySkinLabel.textContent = sameSelection ? t("reapplySkin") : t("applySkin");
  elements.restoreSkin.disabled = !skin.active && !state.persistenceState?.enabled;
  elements.skinStatus.textContent = skin.active
    ? t("skinActive", {
      target: skin.channel === "beta" ? "ChatGPT Beta" : "ChatGPT",
      theme: skin.themeId,
      mode: t(skin.mode),
    })
    : t("skinIdle");
}

function renderPersistenceState() {
  const persistence = state.persistenceState || { enabled: false, phase: "disabled" };
  const channel = elements.targetSelect.value;
  const sameSelection = persistence.enabled
    && persistence.themeId === state.themeId
    && persistence.mode === state.mode
    && persistence.channel === channel;
  elements.persistenceToggle.checked = sameSelection;
  elements.persistenceControl.dataset.phase = persistence.phase;

  if (persistence.enabled && !sameSelection) {
    elements.persistenceStatus.textContent = t("persistenceOther", {
      theme: persistence.themeId || "—",
      mode: persistence.mode ? t(persistence.mode) : "—",
    });
  } else {
    const labels = {
      disabled: "persistenceDisabled",
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
    elements.persistenceStatus.textContent = t(labels[persistence.phase] || "persistenceDisabled");
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

function renderLanguage() {
  document.documentElement.lang = state.locale;
  elements.languageLabel.textContent = state.locale === "en" ? "中文" : "English";
  elements.languageButton.setAttribute("aria-label", t("switchLanguage"));
  elements.refreshCatalog.setAttribute("aria-label", t("refreshCatalog"));
  elements.refreshCatalog.title = t("refreshCatalog");
  elements.collectionTabs.setAttribute("aria-label", t("themeSeries"));
  elements.rightsFilter.setAttribute("aria-label", t("filterRightsAria"));
  elements.styleFilter.setAttribute("aria-label", t("filterStyleAria"));
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
    renderCatalogStatus();
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
  state.themeId = state.catalog.themes.some((theme) => theme.id === previousTheme)
    ? previousTheme
    : state.catalog.themes[0]?.id;
  renderCatalogStatus();
  renderCollectionTabs();
  renderFacetOptions();
  renderThemeList();
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

elements.rightsFilter.addEventListener("change", () => {
  state.rights = elements.rightsFilter.value;
  renderThemeList();
});

elements.styleFilter.addEventListener("change", () => {
  state.style = elements.styleFilter.value;
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
    acceptCatalog(await window.act.refreshCatalog());
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
  elements.applySkin.disabled = true;
  elements.applySkinLabel.textContent = t("applyingSkin");
  try {
    state.skinState = await window.act.applyFullSkin(state.themeId, state.mode, channel);
    renderSkinState();
    toast(t("toastSkinApplied"));
  } catch (error) {
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
  if (enable && !window.confirm(t("persistenceConsent"))) {
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

elements.openGallery.addEventListener("click", () => window.act.openExternal("gallery"));
elements.openRepository.addEventListener("click", () => window.act.openExternal("repository"));

elements.updateButton.addEventListener("click", async () => {
  try {
    if (state.updateState?.status === "ready") {
      await window.act.installAppUpdate();
      return;
    }
    state.updateState = await window.act.checkForAppUpdate();
    renderUpdateState();
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
  state.platform = bootstrap.platform;
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
  setTimeout(() => void window.act.refreshCatalog().catch(() => {}), 700);
  setTimeout(() => void window.act.checkForAppUpdate().catch(() => {}), 1800);
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
