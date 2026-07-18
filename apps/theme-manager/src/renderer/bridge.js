const { convertFileSrc, invoke } = window.__TAURI__.core;
const { listen } = window.__TAURI__.event;
const appWindow = window.__TAURI__.window.getCurrentWindow();

function normalizeCatalog(catalog) {
  if (!catalog) return null;
  for (const theme of catalog.themes || []) {
    for (const mode of ["light", "dark"]) {
      const preview = theme.previews?.[mode];
      if (preview?.imagePath) {
        preview.imageUrl = convertFileSrc(preview.imagePath);
        delete preview.imagePath;
      }
    }
  }
  return catalog;
}

function normalizeCatalogPayload(payload) {
  if (payload?.catalog) payload.catalog = normalizeCatalog(payload.catalog);
  return payload;
}

function subscribe(channel, callback) {
  if (typeof callback !== "function") return function noop() {};
  let disposed = false;
  let unlisten;
  void listen(channel, (event) => {
    if (!disposed) callback(normalizeCatalogPayload(event.payload));
  }).then((dispose) => {
    if (disposed) dispose();
    else unlisten = dispose;
  });
  return () => {
    disposed = true;
    if (unlisten) unlisten();
  };
}

window.act = Object.freeze({
  bootstrap: async () => normalizeCatalogPayload(await invoke("bootstrap")),
  refreshCatalog: async () => normalizeCatalogPayload(await invoke("refresh_catalog")),
  copyTheme: (themeId, mode) => invoke("copy_theme", { themeId, mode }),
  openCodex: (channel) => invoke("open_codex", { channel }),
  applyFullSkin: (themeId, mode, channel) => invoke("apply_full_skin", { themeId, mode, channel }),
  restoreFullSkin: () => invoke("restore_full_skin"),
  openExternal: (target) => invoke("open_external", { target }),
  checkForAppUpdate: () => invoke("check_for_app_update"),
  installAppUpdate: () => invoke("install_app_update"),
  onCatalogState: (callback) => subscribe("act:catalog-state", callback),
  onUpdateState: (callback) => subscribe("act:update-state", callback),
});

const titlebar = document.querySelector("#titlebar");
titlebar.addEventListener("mousedown", (event) => {
  if (event.button !== 0 || event.target.closest("button, input, select, a")) return;
  if (event.detail === 2) void appWindow.toggleMaximize();
  else void appWindow.startDragging();
});
document.querySelector("#windowMinimize").addEventListener("click", () => void appWindow.minimize());
document.querySelector("#windowMaximize").addEventListener("click", () => void appWindow.toggleMaximize());
document.querySelector("#windowClose").addEventListener("click", () => void appWindow.close());
