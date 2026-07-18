import "./bridge.js";

const state = {
  appVersion: "",
  platform: "",
  catalog: null,
  catalogState: null,
  targets: [],
  skinState: null,
  updateState: null,
  collection: "all",
  query: "",
  themeId: null,
  mode: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
};

const elements = {
  catalogDot: document.querySelector("#catalogDot"),
  catalogLabel: document.querySelector("#catalogLabel"),
  refreshCatalog: document.querySelector("#refreshCatalog"),
  search: document.querySelector("#search"),
  searchShortcut: document.querySelector("#searchShortcut"),
  collectionTabs: document.querySelector("#collectionTabs"),
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
  skinStatus: document.querySelector("#skinStatus"),
  registryHash: document.querySelector("#registryHash"),
  themeCount: document.querySelector("#themeCount"),
  openGallery: document.querySelector("#openGallery"),
  openRepository: document.querySelector("#openRepository"),
  updateButton: document.querySelector("#updateButton"),
  updateLabel: document.querySelector("#updateLabel"),
  toast: document.querySelector("#toast"),
};

function zh(value) {
  return value?.["zh-CN"] || value?.en || "";
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
  elements.catalogLabel.textContent = state.catalogState?.message || "正在读取主题目录";
  elements.refreshCatalog.classList.toggle("is-spinning", status === "refreshing");
  elements.registryHash.textContent = shortHash(state.catalog?.registrySha256);
  elements.themeCount.textContent = state.catalog ? state.catalog.themes.length + " 套 / " + (state.catalog.source === "remote" ? "在线" : "本地") : "—";
}

function renderCollectionTabs() {
  if (!state.catalog) return;
  const records = [
    { id: "all", name: { "zh-CN": "全部" }, themeCount: state.catalog.themes.length },
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
    label.textContent = zh(collection.name);
    const count = document.createElement("small");
    count.textContent = String(collection.themeCount || state.catalog.themes.filter((theme) => theme.collection === collection.id).length).padStart(2, "0");
    button.append(label, count);
    fragment.append(button);
  });
  elements.collectionTabs.replaceChildren(fragment);
}

function filteredThemes() {
  if (!state.catalog) return [];
  const query = state.query.trim().toLocaleLowerCase("zh-CN");
  return state.catalog.themes.filter((theme) => {
    if (state.collection !== "all" && theme.collection !== state.collection) return false;
    if (!query) return true;
    return [
      theme.id,
      zh(theme.name),
      zh(theme.tagline),
      zh(theme.description),
      ...(theme.tags || []),
    ].join(" ").toLocaleLowerCase("zh-CN").includes(query);
  });
}

function renderThemeList() {
  const themes = filteredThemes();
  if (themes.length && !themes.some((theme) => theme.id === state.themeId)) {
    state.themeId = themes[0].id;
  }
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
    title.textContent = zh(theme.name);
    const subtitle = document.createElement("small");
    subtitle.textContent = zh(theme.tagline);
    copy.append(title, subtitle);
    const arrow = document.createElement("span");
    arrow.className = "theme-arrow";
    arrow.textContent = "↗";
    button.append(number, thumb, copy, arrow);
    fragment.append(button);
  });
  elements.themeList.replaceChildren(fragment);
  elements.emptyState.hidden = themes.length > 0;
  renderSelectedTheme();
}

function renderSelectedTheme() {
  const theme = currentTheme();
  if (!theme) return;
  const preview = theme.previews[state.mode];
  elements.themeCapture.src = preview.imageUrl;
  elements.themeCapture.alt = zh(theme.name) + " · " + (state.mode === "light" ? "明亮" : "暗色") + " · Beta 实机截图";
  elements.captureVersion.textContent = preview.capture.appVersion;
  elements.captureHash.textContent = shortHash(preview.capture.sha256);
  elements.collectionName.textContent = zh(currentCollection()?.name) + " / " + theme.variant.toUpperCase();
  elements.themeName.textContent = zh(theme.name);
  elements.themeTagline.textContent = zh(theme.tagline);
  elements.themeDescription.textContent = zh(theme.description);
  elements.rightsBadge.textContent = theme.rightsProfile === "fan-art" ? "非官方 Fan Art · 非商业" : "原创 · CC0";
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
}

function renderTargets() {
  const fragment = document.createDocumentFragment();
  if (!state.targets.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "未检测到 ChatGPT";
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
  elements.applySkin.disabled = state.targets.length === 0;
  renderSkinState();
}

function renderSkinState() {
  const skin = state.skinState || { active: false };
  const sameSelection = skin.active
    && skin.themeId === state.themeId
    && skin.mode === state.mode
    && skin.channel === elements.targetSelect.value;
  elements.applySkinLabel.textContent = sameSelection ? "重新应用完整皮肤" : "应用完整皮肤";
  elements.restoreSkin.disabled = !skin.active;
  elements.skinStatus.textContent = skin.active
    ? "正在 " + (skin.channel === "beta" ? "ChatGPT Beta" : "ChatGPT")
      + " 使用 " + skin.themeId + " · " + skin.mode
      + "。恢复后如需关闭调试端口，请退出并正常重开 ChatGPT。"
    : "主题包只含声明式配置与图片。管理器通过仅限本机回环的临时调试会话加载背景，不修改 WindowsApps、app.asar 或 ChatGPT 私有数据。";
}

function renderUpdateState() {
  const update = state.updateState || { status: "idle" };
  elements.updateButton.dataset.status = update.status;
  const labels = {
    development: "开发模式 · v" + state.appVersion,
    unsupported: "当前平台仅提供目录更新",
    idle: "检查应用更新",
    checking: "正在检查应用更新",
    current: "应用已是最新",
    downloading: update.percent == null ? "正在下载 v" + (update.version || "") : "正在下载 " + update.percent + "%",
    ready: "重启并安装 v" + (update.version || ""),
    unreleased: update.message || "桌面更新通道尚未发布",
    error: update.message || "暂时无法检查更新",
  };
  elements.updateLabel.textContent = labels[update.status] || "检查应用更新";
}

function renderShortcuts() {
  const modifier = state.platform === "darwin" ? "⌘" : "Ctrl";
  elements.searchShortcut.textContent = modifier + " K";
  elements.copyShortcut.textContent = modifier + " C";
  elements.applyShortcut.textContent = modifier + " ↵";
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
  renderThemeList();
}

elements.collectionTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-collection]");
  if (!button) return;
  state.collection = button.dataset.collection;
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

elements.targetSelect.addEventListener("change", renderSkinState);

elements.refreshCatalog.addEventListener("click", async () => {
  try {
    acceptCatalog(await window.act.refreshCatalog());
  } catch {
    toast("主题目录刷新失败", "error");
  }
});

elements.copyTheme.addEventListener("click", async () => {
  try {
    await window.act.copyTheme(state.themeId, state.mode);
    toast("原生配色字符串已复制，可在 ChatGPT 外观设置中作为轻量回退导入。");
  } catch {
    toast("复制失败，请重试。", "error");
  }
});

elements.applySkin.addEventListener("click", async () => {
  const channel = elements.targetSelect.value;
  if (!channel) return;
  elements.applySkin.disabled = true;
  elements.applySkinLabel.textContent = "正在校验并应用…";
  try {
    state.skinState = await window.act.applyFullSkin(state.themeId, state.mode, channel);
    renderSkinState();
    toast("完整皮肤已在独立 ChatGPT 会话中生效。");
  } catch (error) {
    toast(typeof error === "string" ? error : error?.message || "无法应用完整皮肤。", "error");
  } finally {
    elements.applySkin.disabled = state.targets.length === 0;
    renderSkinState();
  }
});

elements.restoreSkin.addEventListener("click", async () => {
  elements.restoreSkin.disabled = true;
  try {
    state.skinState = await window.act.restoreFullSkin();
    renderSkinState();
    toast("已移除完整皮肤。退出并正常重开 ChatGPT 可同时关闭调试端口。");
  } catch (error) {
    toast(typeof error === "string" ? error : error?.message || "无法恢复原生界面。", "error");
  } finally {
    renderSkinState();
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
    toast("应用更新检查失败", "error");
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

try {
  const bootstrap = await window.act.bootstrap();
  state.appVersion = bootstrap.appVersion;
  state.platform = bootstrap.platform;
  state.targets = bootstrap.targets;
  state.skinState = bootstrap.skinState;
  state.updateState = bootstrap.updateState;
  acceptCatalog({
    ...bootstrap.catalogState,
    catalog: bootstrap.catalog,
  });
  renderTargets();
  renderShortcuts();
  renderUpdateState();
  setTimeout(() => void window.act.refreshCatalog().catch(() => {}), 700);
  setTimeout(() => void window.act.checkForAppUpdate().catch(() => {}), 1800);
} catch {
  elements.catalogLabel.textContent = "无法启动主题管理器";
  toast("主题管理器初始化失败", "error");
}
